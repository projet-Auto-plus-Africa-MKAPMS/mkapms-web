/**
 * LOT IA02F, point 3 — Conversation Memory : résumé et faits importants.
 *
 * Additif à la fenêtre brute existante (server/intelligences/service.ts,
 * dernier 8 messages, HARDCODED et volontairement conservée telle quelle) :
 * ce module ne remplace rien, il ajoute un résumé + des faits extraits quand
 * la conversation dépasse un seuil, pour éviter d'envoyer tout l'historique
 * indéfiniment au modèle sans perdre le fil des échanges plus anciens.
 *
 * Un résumé raté (fournisseur indisponible) n'empêche jamais la conversation
 * de continuer : `resumerSiNecessaire` avale son échec et journalise sans
 * bloquer `demander()`.
 */
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { db } from "../db.js";
import { inConversationResume, inMessages, inSessions } from "./schema.js";
import { appeler } from "./provider.js";
import { ecrire as ecrireMemoireUtilisateur } from "./memoire-utilisateur.js";

// Un échange complet suffit : attendre 16 messages faisait perdre la mémoire de
// presque toutes les conversations courtes lorsqu'elles étaient rouvertes.
const SEUIL_MESSAGES = 2;
const SYSTEME_RESUME =
  "Tu résumes une conversation interne pour la mémoire d'un système. " +
  "Réponds en JSON strict : {\"resume\": string (5 phrases maximum), \"faits\": string[] (5 faits maximum, courts)}. " +
  "Ne mentionne aucun fournisseur ni modèle. N'invente rien qui ne soit pas dans les messages fournis.";

export interface ResumeConversation {
  resume: string;
  faitsImportants: string[];
  couvertJusquauMessageId: number;
  nbMessagesCouverts: number;
}

type MessageResume = { id: number; role: string; contenu: string };

function construireResumeSecours(messages: readonly MessageResume[], precedent?: ResumeConversation | null): { resume: string; faits: string[] } {
  const extraits = messages
    .filter((m) => m.contenu.trim())
    .slice(-12)
    .map((m) => `${m.role === "utilisateur" ? "Utilisateur" : "Assistant"} : ${m.contenu.replace(/\s+/g, " ").trim().slice(0, 420)}`);
  const resume = [precedent?.resume, ...extraits].filter(Boolean).join("\n").slice(-2_000);
  return { resume: resume || "Conversation sans contenu exploitable.", faits: precedent?.faitsImportants ?? [] };
}

async function enregistrerMemoirePrivee(input: {
  sessionId: number;
  userId: number | null;
  titre: string;
  resume: string;
  faits: string[];
}): Promise<void> {
  if (!input.userId) return;
  await ecrireMemoireUtilisateur({
    userId: input.userId,
    categorie: "contexte_metier",
    cle: `conversation-${input.sessionId}`,
    contenu: [input.resume, ...(input.faits.length ? [`Faits retenus : ${input.faits.join(" ; ")}`] : [])].join("\n").slice(0, 8_000),
    source: "deduit",
    confiance: "moyenne",
    visibilite: "prive",
  });
}

async function enregistrerResume(input: {
  sessionId: number;
  userId: number | null;
  titre: string;
  resume: string;
  faits: string[];
  dernierId: number;
  nbMessages: number;
}): Promise<void> {
  await db
    .insert(inConversationResume)
    .values({ sessionId: input.sessionId, resume: input.resume, faitsImportants: input.faits, couvertJusquauMessageId: input.dernierId, nbMessagesCouverts: input.nbMessages, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: inConversationResume.sessionId,
      set: { resume: input.resume, faitsImportants: input.faits, couvertJusquauMessageId: input.dernierId, nbMessagesCouverts: input.nbMessages, updatedAt: new Date() },
    });
  await enregistrerMemoirePrivee(input);
}

export async function resumeActif(sessionId: number): Promise<ResumeConversation | null> {
  const [ligne] = await db.select().from(inConversationResume).where(eq(inConversationResume.sessionId, sessionId)).limit(1);
  if (!ligne || !ligne.resume) return null;
  return {
    resume: ligne.resume,
    faitsImportants: ligne.faitsImportants,
    couvertJusquauMessageId: ligne.couvertJusquauMessageId,
    nbMessagesCouverts: ligne.nbMessagesCouverts,
  };
}

/**
 * Génère ou met à jour le résumé quand des messages non couverts dépassent le
 * seuil. Idempotent : rejoué sans nouveaux messages, ne fait rien.
 */
export async function resumerSiNecessaire(sessionId: number, traceId: string): Promise<void> {
  try {
    const existant = await resumeActif(sessionId);
    const depuisId = existant?.couvertJusquauMessageId ?? 0;
    const nouveaux = await db
      .select({ id: inMessages.id, role: inMessages.role, contenu: inMessages.contenu })
      .from(inMessages)
      .where(and(gt(inMessages.id, depuisId), eq(inMessages.sessionId, sessionId)))
      .orderBy(asc(inMessages.id))
      .limit(200);
    const nonCouverts = nouveaux.filter((m) => m.contenu.trim().length > 0);
    if (nonCouverts.length < SEUIL_MESSAGES) return;
    const [session] = await db.select({ titre: inSessions.titre, userId: inSessions.userId }).from(inSessions).where(eq(inSessions.id, sessionId)).limit(1);
    if (!session) return;

    const texteEchange = nonCouverts.map((m) => `${m.role} : ${m.contenu.slice(0, 800)}`).join("\n");
    const message = existant
      ? `Résumé précédent : ${existant.resume}\nFaits déjà connus : ${existant.faitsImportants.join(" ; ")}\n\nNouveaux échanges à intégrer :\n${texteEchange}`
      : `Échanges à résumer :\n${texteEchange}`;

    const r = await appeler({
      capacite: "ia_texte",
      tache: "resume_conversation",
      moteur: "intelligences",
      systeme: SYSTEME_RESUME,
      message,
      confidentialite: "interne",
      maxTokens: 400,
    });
    const secours = construireResumeSecours(nonCouverts, existant);
    let resume = secours.resume;
    let faits = secours.faits;
    if (r.ok) {
      try {
        const parsed = JSON.parse(r.texte) as { resume?: string; faits?: string[] };
        if (typeof parsed.resume === "string" && parsed.resume.trim()) resume = parsed.resume.trim().slice(0, 2000);
        if (Array.isArray(parsed.faits)) faits = parsed.faits.filter((f) => typeof f === "string").slice(0, 5).map((f) => f.slice(0, 300));
      } catch {
        resume = r.texte.trim().slice(0, 2000) || secours.resume;
      }
    }

    const dernierId = nonCouverts[nonCouverts.length - 1]?.id ?? depuisId;
    const nbTotal = (existant?.nbMessagesCouverts ?? 0) + nonCouverts.length;
    await enregistrerResume({ sessionId, userId: session.userId, titre: session.titre || `Conversation #${sessionId}`, resume, faits, dernierId, nbMessages: nbTotal });
  } catch {
    // Un résumé qui échoue ne doit jamais faire échouer la conversation elle-même.
  }
}

/** Indexe les conversations existantes du compte dans sa mémoire privée. */
export async function synchroniserConversationsUtilisateur(userId: number, limit = 80): Promise<void> {
  const sessions = await db
    .select({ id: inSessions.id, titre: inSessions.titre, userId: inSessions.userId })
    .from(inSessions)
    .where(and(eq(inSessions.userId, userId), eq(inSessions.cote, "direction")))
    .orderBy(desc(inSessions.dernierAt))
    .limit(limit);
  for (const session of sessions) {
    const existant = await resumeActif(session.id);
    if (existant) {
      await enregistrerMemoirePrivee({ sessionId: session.id, userId: session.userId, titre: session.titre, resume: existant.resume, faits: existant.faitsImportants });
      continue;
    }
    const messages = await db
      .select({ id: inMessages.id, role: inMessages.role, contenu: inMessages.contenu })
      .from(inMessages)
      .where(eq(inMessages.sessionId, session.id))
      .orderBy(desc(inMessages.id))
      .limit(80);
    const ordre = messages.reverse().filter((m) => m.contenu.trim());
    if (!ordre.length) continue;
    const secours = construireResumeSecours(ordre);
    await enregistrerResume({
      sessionId: session.id,
      userId: session.userId,
      titre: session.titre || `Conversation #${session.id}`,
      resume: secours.resume,
      faits: secours.faits,
      dernierId: ordre[ordre.length - 1].id,
      nbMessages: ordre.length,
    });
  }
}

/** Les derniers sujets du même compte restent disponibles même si la question est courte ou vague. */
export async function souvenirsRecentsUtilisateur(userId: number, sessionId: number, limit = 4): Promise<string[]> {
  const sessions = await db
    .select({ id: inSessions.id, titre: inSessions.titre, resume: inConversationResume.resume })
    .from(inSessions)
    .innerJoin(inConversationResume, eq(inConversationResume.sessionId, inSessions.id))
    .where(and(eq(inSessions.userId, userId), eq(inSessions.cote, "direction")))
    .orderBy(desc(inSessions.dernierAt))
    .limit(limit + 1);
  return sessions
    .filter((s) => s.id !== sessionId && s.resume.trim())
    .slice(0, limit)
    .map((s) => `Conversation « ${s.titre || `#${s.id}`} » : ${s.resume.slice(0, 650)}`);
}

/** Ligne de contexte injectable, additive à la fenêtre brute existante. */
export function contexteInjectable(r: ResumeConversation | null): string[] {
  if (!r) return [];
  return [
    `Résumé de la conversation (${r.nbMessagesCouverts} message(s) antérieur(s)) : ${r.resume}`,
    ...(r.faitsImportants.length ? [`Faits retenus : ${r.faitsImportants.join(" ; ")}`] : []),
  ];
}
