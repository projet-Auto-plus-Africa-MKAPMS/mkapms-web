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
import { and, asc, eq, gt } from "drizzle-orm";
import { db } from "../db.js";
import { inConversationResume, inMessages } from "./schema.js";
import { appeler } from "./provider.js";

const SEUIL_MESSAGES = 16;
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
    if (!r.ok) return; // Échec fournisseur : la conversation continue avec la seule fenêtre brute, sans résumé mis à jour.

    let resume = existant?.resume ?? "";
    let faits = existant?.faitsImportants ?? [];
    try {
      const parsed = JSON.parse(r.texte) as { resume?: string; faits?: string[] };
      if (typeof parsed.resume === "string" && parsed.resume.trim()) resume = parsed.resume.trim().slice(0, 2000);
      if (Array.isArray(parsed.faits)) faits = parsed.faits.filter((f) => typeof f === "string").slice(0, 5).map((f) => f.slice(0, 300));
    } catch {
      // Réponse non-JSON : on garde le texte brut comme résumé plutôt que de tout perdre.
      resume = r.texte.slice(0, 2000);
    }

    const dernierId = nonCouverts[nonCouverts.length - 1]?.id ?? depuisId;
    const nbTotal = (existant?.nbMessagesCouverts ?? 0) + nonCouverts.length;
    await db
      .insert(inConversationResume)
      .values({ sessionId, resume, faitsImportants: faits, couvertJusquauMessageId: dernierId, nbMessagesCouverts: nbTotal, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: inConversationResume.sessionId,
        set: { resume, faitsImportants: faits, couvertJusquauMessageId: dernierId, nbMessagesCouverts: nbTotal, updatedAt: new Date() },
      });
  } catch {
    // Un résumé qui échoue ne doit jamais faire échouer la conversation elle-même.
  }
}

/** Ligne de contexte injectable, additive à la fenêtre brute existante. */
export function contexteInjectable(r: ResumeConversation | null): string[] {
  if (!r) return [];
  return [
    `Résumé de la conversation (${r.nbMessagesCouverts} message(s) antérieur(s)) : ${r.resume}`,
    ...(r.faitsImportants.length ? [`Faits retenus : ${r.faitsImportants.join(" ; ")}`] : []),
  ];
}
