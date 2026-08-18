/**
 * MKA.P-MS Intelligences — service.
 *
 * Ce moteur n'est pas un second cerveau : il donne enfin la parole à ce qui
 * existe déjà. Le Système Intelligent observe, le registre connaît les moteurs,
 * le relevé de code connaît les fichiers, le Centre de Commandes trace les
 * ordres, l'AI Fabric choisit le fournisseur. Intelligences les interroge,
 * appelle réellement le modèle, et rend une réponse utilisable.
 *
 * Deux côtés :
 *  - direction (PDG seul) : contexte interne complet, commandes, code ;
 *  - public : assistant automobile, sans aucun accès interne.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { inActions, inMessages, inSessions, inUsage } from "./schema.js";
import {
  COMMANDES,
  CONSIGNE_DIRECTION,
  CONSIGNE_PUBLIC,
  NOM_MOTEUR,
  PLAFOND_JOUR,
  REGLES,
  type Cote,
} from "./regles.js";
import { appeler, verifierAcces } from "./provider.js";
import { engineRegistry } from "../engine-registry/schema.js";
import { smartAlerts } from "../smart-engine/schema.js";
import { emitSafe } from "../event-bus/service.js";

function jourCourant(): string {
  return new Date().toISOString().slice(0, 10);
}

async function compter(cote: Cote, ok: boolean, jetons: number): Promise<void> {
  const jour = jourCourant();
  const [ligne] = await db
    .select()
    .from(inUsage)
    .where(and(eq(inUsage.jour, jour), eq(inUsage.cote, cote)))
    .limit(1);
  if (!ligne) {
    await db.insert(inUsage).values({
      jour,
      cote,
      appels: 1,
      echecs: ok ? 0 : 1,
      jetons,
    });
    return;
  }
  await db
    .update(inUsage)
    .set({
      appels: ligne.appels + 1,
      echecs: ligne.echecs + (ok ? 0 : 1),
      jetons: ligne.jetons + jetons,
    })
    .where(eq(inUsage.id, ligne.id));
}

async function appelsDuJour(cote: Cote): Promise<number> {
  const [ligne] = await db
    .select({ appels: inUsage.appels })
    .from(inUsage)
    .where(and(eq(inUsage.jour, jourCourant()), eq(inUsage.cote, cote)))
    .limit(1);
  return ligne?.appels ?? 0;
}

/**
 * Contexte réel injecté au côté direction. Chaque ligne vient d'une lecture en
 * base ou d'un relevé, jamais d'une estimation.
 */
async function contexteDirection(question: string): Promise<string[]> {
  const lignes: string[] = [];

  try {
    const moteurs = await db
      .select({
        name: engineRegistry.name,
        label: engineRegistry.label,
        state: engineRegistry.state,
        health: engineRegistry.health,
      })
      .from(engineRegistry);
    const degrades = moteurs.filter((m) => m.health === "degraded" || m.health === "down");
    lignes.push(
      `Moteurs inscrits au registre : ${moteurs.length}. En défaut : ${
        degrades.length === 0
          ? "aucun"
          : degrades.map((m) => `${m.label} (${m.health})`).join(", ")
      }.`,
    );
  } catch (e) {
    lignes.push(`Registre des moteurs illisible : ${e instanceof Error ? e.message : "erreur"}.`);
  }

  try {
    const alertes = await db
      .select({
        title: smartAlerts.title,
        severity: smartAlerts.severity,
        category: smartAlerts.category,
      })
      .from(smartAlerts)
      .where(eq(smartAlerts.status, "open"))
      .orderBy(desc(smartAlerts.createdAt))
      .limit(12);
    lignes.push(
      alertes.length === 0
        ? "Aucune alerte ouverte."
        : `Alertes ouvertes (${alertes.length} dernières) : ${alertes
            .map((a) => `[${a.severity}] ${a.category} — ${a.title}`)
            .join(" | ")}`,
    );
  } catch (e) {
    lignes.push(`Alertes illisibles : ${e instanceof Error ? e.message : "erreur"}.`);
  }

  try {
    const completion = await import("../completion/service.js");
    const dernier = await completion.dernier();
    if (dernier) {
      lignes.push(
        `Avancement calculé : ${dernier.avancement}% de maillons prouvés, ${dernier.domaines} domaines évalués, ${dernier.domaines - dernier.termines} domaines pas terminés. Reste à faire : ${dernier.resteAFaire
          .slice(0, 10)
          .map((r) => `${r.label} — ${r.tache}`)
          .join(" | ")}`,
      );
    } else {
      lignes.push("Aucune évaluation d'avancement enregistrée : le Completion Center n'a pas encore tourné.");
    }
  } catch (e) {
    lignes.push(`Avancement illisible : ${e instanceof Error ? e.message : "erreur"}.`);
  }

  try {
    const graphe = await import("../code-graph/service.js");
    const trouve = await graphe.recherche(question, 12);
    if (trouve.length > 0) {
      lignes.push(
        `Relevé de code rapproché de la demande : ${trouve
          .map((t) => `${t.type}:${t.key}`)
          .join(", ")}`,
      );
    }
    const memoire = await graphe.reconnaitre(question);
    if (memoire.verdict) lignes.push(`Mémoire des anomalies : ${memoire.verdict}`);
  } catch (e) {
    lignes.push(`Relevé de code indisponible : ${e instanceof Error ? e.message : "erreur"}.`);
  }

  return lignes;
}

export interface DemandeInput {
  question: string;
  cote: Cote;
  sessionId?: number | null;
  userId?: number | null;
  visiteur?: string | null;
  countryCode?: string | null;
  langue?: string | null;
}

export interface DemandeResultat {
  sessionId: number;
  ok: boolean;
  reponse: string;
  motif: string;
  fournisseur: string | null;
  modele: string | null;
  contexte: string[];
  jetons: number;
  dureeMs: number;
}

async function session(input: DemandeInput): Promise<number> {
  if (input.sessionId) {
    const [existante] = await db
      .select({ id: inSessions.id, cote: inSessions.cote })
      .from(inSessions)
      .where(eq(inSessions.id, input.sessionId))
      .limit(1);
    if (existante && existante.cote === input.cote) return existante.id;
  }
  const [creee] = await db
    .insert(inSessions)
    .values({
      cote: input.cote,
      titre: input.question.slice(0, 180),
      userId: input.userId ?? null,
      visiteur: input.visiteur ?? null,
      countryCode: input.countryCode ?? null,
      langue: input.langue ?? "fr",
    })
    .returning({ id: inSessions.id });
  return creee?.id ?? 0;
}

/** Une question, une réponse réelle — ou le motif exact de l'absence de réponse. */
export async function demander(input: DemandeInput): Promise<DemandeResultat> {
  const sessionId = await session(input);
  const question = input.question.trim();

  await db.insert(inMessages).values({
    sessionId,
    cote: input.cote,
    role: "utilisateur",
    contenu: question.slice(0, 8000),
  });

  const echec = async (motif: string): Promise<DemandeResultat> => {
    await db.insert(inMessages).values({
      sessionId,
      cote: input.cote,
      role: "moteur",
      contenu: "",
      ok: false,
      motif,
    });
    await compter(input.cote, false, 0);
    return {
      sessionId,
      ok: false,
      reponse: "",
      motif,
      fournisseur: null,
      modele: null,
      contexte: [],
      jetons: 0,
      dureeMs: 0,
    };
  };

  if (question.length < 2) return echec("Question vide.");

  const consommes = await appelsDuJour(input.cote);
  if (consommes >= PLAFOND_JOUR[input.cote]) {
    return echec(
      `Plafond journalier atteint pour le côté ${input.cote} (${PLAFOND_JOUR[input.cote]} appels). Le plafond protège la facture : il est relevé volontairement, pas dépassé silencieusement.`,
    );
  }

  const contexte = input.cote === "direction" ? await contexteDirection(question) : [];
  const historique = await db
    .select({ role: inMessages.role, contenu: inMessages.contenu })
    .from(inMessages)
    .where(and(eq(inMessages.sessionId, sessionId), eq(inMessages.ok, true)))
    .orderBy(desc(inMessages.id))
    .limit(8);
  const fil = historique
    .reverse()
    .filter((m) => m.contenu.trim().length > 0)
    .map((m) => `${m.role === "moteur" ? NOM_MOTEUR : "Demande"} : ${m.contenu.slice(0, 1500)}`)
    .join("\n");

  const message =
    input.cote === "direction"
      ? [
          "État constaté de la plateforme (lecture réelle en base, à utiliser tel quel) :",
          ...contexte.map((l) => `- ${l}`),
          "",
          fil ? `Échanges précédents :\n${fil}\n` : "",
          `Demande du PDG : ${question}`,
        ]
          .filter((l) => l.length > 0)
          .join("\n")
      : [fil ? `Échanges précédents :\n${fil}\n` : "", `Question du visiteur : ${question}`]
          .filter((l) => l.length > 0)
          .join("\n");

  const r = await appeler({
    capacite: "ia_texte",
    tache: input.cote === "direction" ? "direction_demande" : "assistant_public",
    moteur: "intelligences",
    systeme: input.cote === "direction" ? CONSIGNE_DIRECTION : CONSIGNE_PUBLIC,
    message,
    // Côté public la question peut contenir des éléments personnels : le niveau
    // déclaré est plus strict, et l'AI Fabric peut donc refuser un fournisseur.
    confidentialite: input.cote === "direction" ? "interne" : "interne",
    countryCode: input.countryCode ?? null,
    maxTokens: input.cote === "direction" ? 2000 : 900,
  });

  await db.insert(inMessages).values({
    sessionId,
    cote: input.cote,
    role: "moteur",
    contenu: r.texte.slice(0, 20000),
    fournisseur: r.fournisseur,
    modele: r.modele,
    ok: r.ok,
    motif: r.motif,
    jetonsEntree: r.jetonsEntree,
    jetonsSortie: r.jetonsSortie,
    dureeMs: r.dureeMs,
    contexte,
  });
  await db
    .update(inSessions)
    .set({ messages: sql`${inSessions.messages} + 2`, dernierAt: new Date() })
    .where(eq(inSessions.id, sessionId));
  await compter(input.cote, r.ok, r.jetonsEntree + r.jetonsSortie);

  await emitSafe({
    source: "intelligences",
    type: "intelligences.echange",
    payload: { sessionId, cote: input.cote, ok: r.ok, fournisseur: r.fournisseur },
  });

  return {
    sessionId,
    ok: r.ok,
    reponse: r.texte,
    motif: r.motif,
    fournisseur: r.fournisseur,
    modele: r.modele,
    contexte,
    jetons: r.jetonsEntree + r.jetonsSortie,
    dureeMs: r.dureeMs,
  };
}

/**
 * Commande « proposer » : ouvre un dossier de développement réel. Le Centre de
 * Commandes existe déjà et reste propriétaire du dossier et du pipeline ; on ne
 * recrée pas un second circuit.
 */
export async function proposer(input: {
  besoin: string;
  actorId?: number;
  sessionId?: number | null;
  countryCode?: string | null;
}) {
  const cc = await import("../command-center/service.js");
  const dossier = await cc.openDevRequest({
    need: input.besoin,
    countryCode: input.countryCode ?? null,
    requestedBy: input.actorId,
  });

  const [action] = await db
    .insert(inActions)
    .values({
      sessionId: input.sessionId ?? null,
      commande: "proposer",
      argument: input.besoin.slice(0, 4000),
      resultat: dossier?.status === "bloque" ? "bloque" : "propose",
      detail: dossier?.analysis ?? "",
      devRequestId: dossier?.id ?? null,
      actorId: input.actorId ?? null,
    })
    .returning({ id: inActions.id });

  return { actionId: action?.id ?? 0, dossier };
}

/**
 * Commande « coder » : demande réellement le code au fournisseur.
 *
 * Le résultat est une proposition attachée au dossier. Il n'est pas écrit dans
 * le dépôt, pas commité, pas déployé : c'est la règle du pipeline.
 */
export async function coder(input: {
  devRequestId: number;
  consigne?: string;
  actorId?: number;
  sessionId?: number | null;
}): Promise<{
  ok: boolean;
  motif: string;
  code: string;
  fournisseur: string | null;
  modele: string | null;
  actionId: number;
}> {
  const cc = await import("../command-center/service.js");
  const dossiers = await cc.listDevRequests(200);
  const dossier = dossiers.find((d) => d.id === input.devRequestId);
  if (!dossier) {
    return {
      ok: false,
      motif: "Dossier de développement introuvable.",
      code: "",
      fournisseur: null,
      modele: null,
      actionId: 0,
    };
  }

  const contexte: string[] = [
    `Besoin : ${dossier.need}`,
    `Analyse d'architecture : ${dossier.analysis ?? "absente"}`,
    `Périmètre : ${(dossier.scope ?? []).join(", ") || "non identifié"}`,
  ];

  try {
    const graphe = await import("../code-graph/service.js");
    for (const cle of dossier.scope ?? []) {
      const i = await graphe.impact(cle);
      if (i.trouve) {
        contexte.push(
          `${cle} — fichiers : ${i.fichiers.slice(0, 25).join(", ")} | tables : ${i.tables.join(", ")} | API : ${i.api.slice(0, 20).join(", ")} | dépendants : ${i.dependants.join(", ")}`,
        );
      }
    }
  } catch (e) {
    contexte.push(`Relevé de code indisponible : ${e instanceof Error ? e.message : "erreur"}.`);
  }

  const r = await appeler({
    capacite: "ia_texte",
    tache: "generation_code",
    moteur: "intelligences",
    systeme: `${CONSIGNE_DIRECTION}

Tu écris du code pour ce dépôt : TypeScript strict, React + Vite côté client, tRPC + Drizzle ORM (PostgreSQL) côté serveur, commentaires et libellés en français.
Contraintes de production du dépôt : pas de type "any", pas d'accès dynamique aux attributs, imports en haut de fichier, migrations SQL additives et jamais destructives, aucune donnée secrète dans le code.
Rends : 1) les fichiers à modifier ou créer avec leur chemin exact, 2) le code complet de chaque fichier ou le diff précis, 3) la migration si des tables changent, 4) les contrôles à ajouter, 5) le retour arrière.
Ne prétends pas avoir exécuté ni testé le code.`,
    message: [
      "Contexte réel du dossier :",
      ...contexte.map((l) => `- ${l}`),
      "",
      `Consigne du PDG : ${input.consigne?.trim() || "Écris le correctif complet correspondant au besoin."}`,
    ].join("\n"),
    maxTokens: 4000,
  });

  const [action] = await db
    .insert(inActions)
    .values({
      sessionId: input.sessionId ?? null,
      commande: "coder",
      argument: `dossier #${input.devRequestId} — ${input.consigne ?? ""}`.slice(0, 4000),
      resultat: r.ok ? "propose" : "echec",
      detail: r.ok ? r.texte.slice(0, 100000) : r.motif,
      devRequestId: input.devRequestId,
      actorId: input.actorId ?? null,
    })
    .returning({ id: inActions.id });

  await compter("direction", r.ok, r.jetonsEntree + r.jetonsSortie);

  return {
    ok: r.ok,
    motif: r.motif,
    code: r.texte,
    fournisseur: r.fournisseur,
    modele: r.modele,
    actionId: action?.id ?? 0,
  };
}

export async function actions(limit = 60) {
  return db.select().from(inActions).orderBy(desc(inActions.id)).limit(limit);
}

export async function sessions(cote: Cote, limit = 40) {
  return db
    .select()
    .from(inSessions)
    .where(eq(inSessions.cote, cote))
    .orderBy(desc(inSessions.dernierAt))
    .limit(limit);
}

export async function messages(sessionId: number) {
  return db
    .select()
    .from(inMessages)
    .where(eq(inMessages.sessionId, sessionId))
    .orderBy(inMessages.id);
}

export interface EtatIntelligences {
  nom: string;
  acces: {
    status: "up" | "degraded" | "down";
    message: string;
    fournisseur: string | null;
    modele: string | null;
  };
  fournisseurs: {
    code: string;
    label: string;
    capability: string;
    status: string;
    missingEnv: string[];
  }[];
  usage: { jour: string; cote: string; appels: number; echecs: number; jetons: number }[];
  plafonds: { cote: string; plafond: number; consommes: number }[];
  commandes: typeof COMMANDES;
  regles: typeof REGLES;
  moteurs: { name: string; label: string; state: string; health: string; category: string }[];
  echanges: { cote: string; total: number; echecs: number }[];
}

/** Vue complète côté PDG : accès réel, fournisseurs, coûts, moteurs, commandes. */
export async function etat(): Promise<EtatIntelligences> {
  const acces = await verifierAcces();

  let fournisseurs: EtatIntelligences["fournisseurs"] = [];
  try {
    const fabric = await import("../ai-fabric/service.js");
    const etats = await fabric.providerStates();
    fournisseurs = etats.map((e) => ({
      code: e.code,
      label: e.label,
      capability: e.capability,
      status: e.status,
      missingEnv: e.missingEnv,
    }));
  } catch {
    fournisseurs = [];
  }

  const usage = await db
    .select()
    .from(inUsage)
    .orderBy(desc(inUsage.jour))
    .limit(14);

  const plafonds = await Promise.all(
    (["direction", "public"] as Cote[]).map(async (cote) => ({
      cote,
      plafond: PLAFOND_JOUR[cote],
      consommes: await appelsDuJour(cote),
    })),
  );

  const moteurs = await db
    .select({
      name: engineRegistry.name,
      label: engineRegistry.label,
      state: engineRegistry.state,
      health: engineRegistry.health,
      category: engineRegistry.category,
    })
    .from(engineRegistry)
    .orderBy(engineRegistry.category, engineRegistry.label);

  const echanges = await db
    .select({
      cote: inMessages.cote,
      total: sql<number>`count(*)::int`,
      echecs: sql<number>`count(*) filter (where ${inMessages.ok} = false)::int`,
    })
    .from(inMessages)
    .groupBy(inMessages.cote);

  return {
    nom: NOM_MOTEUR,
    acces,
    fournisseurs,
    usage: usage.map((u) => ({
      jour: u.jour,
      cote: u.cote,
      appels: u.appels,
      echecs: u.echecs,
      jetons: u.jetons,
    })),
    plafonds,
    commandes: COMMANDES,
    regles: REGLES,
    moteurs,
    echanges,
  };
}

export async function health(): Promise<{ status: "up" | "degraded" | "down"; message: string }> {
  try {
    const acces = await verifierAcces();
    if (acces.status === "up") return { status: "up", message: acces.message };
    return {
      status: acces.status,
      message: `${NOM_MOTEUR} : aucune réponse de fournisseur — ${acces.message}`,
    };
  } catch (e) {
    return {
      status: "down",
      message: `Vérification impossible : ${e instanceof Error ? e.message : "erreur inconnue"}`,
    };
  }
}
