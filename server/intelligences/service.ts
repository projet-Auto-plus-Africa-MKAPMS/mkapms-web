/**
 * MKA.P-MS AI — service.
 *
 * Ce moteur n'est pas un second cerveau : il donne enfin la parole à ce qui
 * existe déjà. Le Système Intelligent observe, le registre connaît les moteurs,
 * le relevé de code connaît les fichiers, le Centre de Commandes trace les
 * ordres, la Fabrique Intelligence choisit le fournisseur. Intelligence les interroge,
 * appelle réellement le modèle, et rend une réponse utilisable.
 *
 * Deux côtés :
 *  - direction (PDG seul) : contexte interne complet, commandes, code ;
 *  - public : assistant automobile, sans aucun accès interne.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { inActions, inDomaines, inMessages, inSessions, inUsage } from "./schema.js";
import { DOMAINE_DEFAUT, DOMAINES, domaine as specDomaine, type DomaineSpec } from "./domaines.js";
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
import { lireRegistre, reponseCourtoisie } from "./registre.js";
import { engineRegistry } from "../engine-registry/schema.js";
import { smartAlerts } from "../smart-engine/schema.js";
import { emitSafe } from "../event-bus/service.js";
import { executerAvecOutils } from "./outils/boucle.js";
import { listerActifs } from "./outils/registre.js";
import { randomUUID } from "node:crypto";
import { resumerSiNecessaire } from "./conversation-resume.js";
import { rechercherGlobale } from "./recherche-globale.js";
import { lireFichier } from "./fichiers.js";

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
 * Point 7 (LOT IA02B) — contexte utilisateur réel injecté via le Context
 * Engine (server/intelligences/contexte/service.ts, LOT IA01) : qui demande,
 * avec quel rôle, pays, permissions, projet Chantier actif et univers résolu
 * pour la route /intelligence. Jamais une seconde lecture de ces mêmes
 * informations : ce fichier appelle le Context Engine, il ne le duplique pas.
 */
async function contexteUtilisateur(input: {
  userId?: number | null;
  role?: string | null;
  countryCode?: string | null;
  sessionId: number;
}): Promise<string[]> {
  try {
    const ctxEngine = await import("./contexte/service.js");
    const c = await ctxEngine.resoudreContexte({
      userId: input.userId ?? null,
      role: input.role ?? null,
      application: "intelligence",
      route: "/intelligence",
      countryCode: input.countryCode ?? null,
      sessionId: input.sessionId,
    });
    return [
      `Utilisateur : id ${c.utilisateur.id ?? "inconnu"}, rôle ${c.utilisateur.role ?? "aucun"}, pays ${c.pays.code ?? "non renseigné"}${c.pays.motif ? ` (${c.pays.motif})` : ""}.`,
      `Modules accessibles à ce rôle : ${c.permissionsModules.join(", ") || "aucun"}.`,
      c.projetActif
        ? `Projet Chantier actif : « ${c.projetActif.nom} » (statut ${c.projetActif.statut}).`
        : "Aucun projet Chantier actif rattaché à cette session.",
      c.univers.resolu
        ? `Univers résolu pour /intelligence : ${c.univers.resolu.nom} (${c.univers.resolu.statut}).`
        : `Univers non résolu : ${c.univers.motif}`,
      // LOT IA02F — Memory Router : additif, jamais un remplacement des lignes ci-dessus.
      ...c.conversationResume,
      ...(c.memoireUtilisateur.length ? [`Mémoire utilisateur : ${c.memoireUtilisateur.join(" | ")}`] : []),
      ...(c.memoireProjetActif.length ? [`Mémoire du projet actif : ${c.memoireProjetActif.join(" | ")}`] : []),
    ];
  } catch (e) {
    return [`Context Engine illisible : ${e instanceof Error ? e.message : "erreur inconnue"}.`];
  }
}

/**
 * Relie la conversation direction à la mémoire et aux connaissances déjà
 * indexées. Le retrieval reste additif et non bloquant : chaque source garde
 * ses filtres dans recherche-globale.ts, et aucune connaissance n'est inventée
 * si la base ne contient rien de pertinent.
 */
async function contexteMemoire(input: {
  question: string;
  userId?: number | null;
  sessionId: number;
}): Promise<string[]> {
  if (!input.userId) return [];
  try {
    const resultats = await rechercherGlobale(input.question, input.userId, {
      // "conversation" (messages passés, texte intégral, tous fils du même
      // compte) et "memoire_entreprise" (résumés/faits versés automatiquement
      // par conversation-resume.ts après chaque échange direction) : sans ces
      // deux sources, un sujet déjà discuté dans un AUTRE fil ne remontait
      // jamais ici — demande explicite du PDG que le moteur « enregistre tout »
      // et fasse grandir sa connaissance d'une conversation à l'autre.
      sources: ["memoire", "memoire_entreprise", "conversation", "fichier", "connaissance"],
      visibiliteConnaissance: ["interne", "pdg_uniquement"],
      sessionId: input.sessionId,
      limit: 4,
    });
    if (resultats.length === 0) return [];
    return [
      "Mémoire et connaissances pertinentes (retrieval lexical, sources existantes uniquement) :",
      ...resultats.slice(0, 8).map((r) => `- [${r.source}:${r.id}] ${r.titre} — ${r.extrait}`),
    ];
  } catch (e) {
    return [`Mémoire et connaissances illisibles : ${e instanceof Error ? e.message : "erreur inconnue"}.`];
  }
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

export interface DomaineEtat extends DomaineSpec {
  actif: boolean;
  motif: string;
}

/**
 * État réel des domaines : catalogue complet, avec l'interrupteur tel qu'il est
 * en base. Aucun domaine n'est présenté ouvert parce qu'il est codé.
 */
export async function domaines(): Promise<DomaineEtat[]> {
  const lignes = await db.select().from(inDomaines);
  const parCode = new Map(lignes.map((l) => [l.code, l]));
  return DOMAINES.map((d) => {
    const l = parCode.get(d.code);
    return {
      ...d,
      actif: l ? l.actif : d.actifParDefaut,
      motif: l?.motif ?? "",
    };
  });
}

/** Le PDG ouvre ou ferme un domaine ; la décision est datée et motivée. */
export async function reglerDomaine(input: {
  code: string;
  actif: boolean;
  motif?: string;
  actorId?: number;
}): Promise<DomaineEtat | null> {
  const spec = specDomaine(input.code);
  if (!spec) return null;

  const [existante] = await db
    .select({ id: inDomaines.id })
    .from(inDomaines)
    .where(eq(inDomaines.code, input.code))
    .limit(1);

  const valeurs = {
    actif: input.actif,
    motif: (input.motif ?? "").slice(0, 500),
    actorId: input.actorId ?? null,
    updatedAt: new Date(),
  };

  if (existante) {
    await db.update(inDomaines).set(valeurs).where(eq(inDomaines.id, existante.id));
  } else {
    await db.insert(inDomaines).values({ code: input.code, ...valeurs });
  }

  await emitSafe({
    source: "intelligences",
    type: "intelligences.domaine",
    payload: { code: input.code, actif: input.actif },
  });

  return { ...spec, actif: input.actif, motif: valeurs.motif };
}

async function domaineOuvert(code: string): Promise<{ spec: DomaineSpec; actif: boolean } | null> {
  const spec = specDomaine(code);
  if (!spec) return null;
  const [ligne] = await db
    .select({ actif: inDomaines.actif })
    .from(inDomaines)
    .where(eq(inDomaines.code, code))
    .limit(1);
  return { spec, actif: ligne ? ligne.actif : spec.actifParDefaut };
}

export interface DemandeInput {
  question: string;
  cote: Cote;
  domaine?: string | null;
  sessionId?: number | null;
  userId?: number | null;
  /** Rôle réel de l'appelant — gouverne la boucle d'outils côté direction (permissions, autonomie). */
  role?: string | null;
  visiteur?: string | null;
  countryCode?: string | null;
  langue?: string | null;
  /** Photos/documents joints en data URI (côté direction uniquement pour l'instant) — voir provider.ts pour la limite réelle (4). */
  images?: string[];
  /** Fichiers privés déjà déposés dans le RAG, explicitement joints à ce tour. */
  fichierIds?: number[];
  /**
   * Préférence PDG d'intensité de réflexion du modèle (« minimal » à « high »,
   * voir provider.ts reasoningEffortPrefere) — jamais un choix de modèle,
   * un seul est configuré par fournisseur. Côté direction uniquement.
   */
  effort?: string;
}

export interface DemandeResultat {
  sessionId: number;
  ok: boolean;
  reponse: string;
  motif: string;
  /** LOT IA02B — motif générique sans détail fournisseur, pour toute surface conversationnelle. */
  motifPublic: string;
  fournisseur: string | null;
  modele: string | null;
  contexte: string[];
  jetons: number;
  dureeMs: number;
  /** Outils réellement demandés par le modèle pendant cette réponse (vide sinon). */
  appelsOutils: { toolId: string; verdictPolitique: string; statutExecution: string | null; motif: string }[];
}

/**
 * Point 12 (LOT IA02B) — propriétaire réel d'une conversation, pour que
 * chaque appelant (fil, demander, renommer, supprimer) puisse refuser l'accès
 * à la conversation d'un autre compte avant de lire ou d'écrire quoi que ce
 * soit. `userId: null` couvre les sessions créées avant le suivi par compte
 * (public, ou anciennes) : elles restent lisibles, jamais celles d'un tiers.
 */
export async function proprietaireSession(
  sessionId: number,
): Promise<{ userId: number | null; cote: Cote } | null> {
  const [ligne] = await db
    .select({ userId: inSessions.userId, cote: inSessions.cote })
    .from(inSessions)
    .where(eq(inSessions.id, sessionId))
    .limit(1);
  return ligne ? { userId: ligne.userId, cote: ligne.cote as Cote } : null;
}

/**
 * Point 12 — vérification testable indépendamment du transport (tRPC) qui
 * l'appelle : `server/intelligences/index.ts` la traduit en refus HTTP,
 * les tests l'appellent directement sur la vraie base.
 */
export async function verifierProprieteConversation(
  sessionId: number,
  userId: number,
): Promise<{ ok: boolean; motif: string }> {
  const proprietaire = await proprietaireSession(sessionId);
  if (!proprietaire) return { ok: false, motif: "Conversation introuvable." };
  if (proprietaire.userId !== null && proprietaire.userId !== userId) {
    return { ok: false, motif: "Cette conversation appartient à un autre compte." };
  }
  return { ok: true, motif: "" };
}

/** Une conversation publique anonyme reste liée à l'empreinte qui l'a créée. */
export async function verifierProprieteConversationPublique(
  sessionId: number,
  visiteur: string,
): Promise<{ ok: boolean; motif: string }> {
  const [ligne] = await db
    .select({ cote: inSessions.cote, visiteur: inSessions.visiteur })
    .from(inSessions)
    .where(eq(inSessions.id, sessionId))
    .limit(1);
  if (!ligne || ligne.cote !== "public") return { ok: false, motif: "Conversation introuvable." };
  if (!ligne.visiteur || ligne.visiteur !== visiteur) {
    return { ok: false, motif: "Cette conversation appartient à un autre visiteur." };
  }
  return { ok: true, motif: "" };
}

/** Renomme une conversation — la propriété a déjà été vérifiée par l'appelant. */
export async function renommerConversation(sessionId: number, titre: string): Promise<{ ok: boolean; detail: string }> {
  const propre = titre.trim().slice(0, 180);
  if (propre.length < 1) return { ok: false, detail: "Titre vide." };
  await db.update(inSessions).set({ titre: propre }).where(eq(inSessions.id, sessionId));
  return { ok: true, detail: "Conversation renommée." };
}

/**
 * Supprime réellement une conversation et ses messages — pas un simple
 * masquage. La propriété a déjà été vérifiée par l'appelant.
 */
export async function supprimerConversation(sessionId: number): Promise<{ ok: boolean; detail: string }> {
  await db.delete(inMessages).where(eq(inMessages.sessionId, sessionId));
  await db.delete(inSessions).where(eq(inSessions.id, sessionId));
  return { ok: true, detail: "Conversation et messages supprimés." };
}

async function session(input: DemandeInput): Promise<number> {
  if (input.sessionId) {
    const [existante] = await db
      .select({ id: inSessions.id, cote: inSessions.cote, userId: inSessions.userId, visiteur: inSessions.visiteur })
      .from(inSessions)
      .where(eq(inSessions.id, input.sessionId))
      .limit(1);
    const memeProprietaire =
      input.cote === "direction"
        ? existante?.userId === (input.userId ?? null)
        : Boolean(input.visiteur && existante?.visiteur === input.visiteur);
    if (existante && existante.cote === input.cote && memeProprietaire) return existante.id;
  }
  const [creee] = await db
    