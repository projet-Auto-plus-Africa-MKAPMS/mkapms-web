/**
 * MKA.P-MS Intelligences — service.
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
    ];
  } catch (e) {
    return [`Context Engine illisible : ${e instanceof Error ? e.message : "erreur inconnue"}.`];
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
      domaine: input.domaine ?? DOMAINE_DEFAUT,
    })
    .returning({ id: inSessions.id });
  return creee?.id ?? 0;
}

/** Une question, une réponse réelle — ou le motif exact de l'absence de réponse. */
export async function demander(input: DemandeInput): Promise<DemandeResultat> {
  const sessionId = await session(input);
  const question = input.question.trim();
  const traceId = randomUUID();

  await db.insert(inMessages).values({
    sessionId,
    cote: input.cote,
    role: "utilisateur",
    contenu: question.slice(0, 8000),
    traceId,
  });

  const echec = async (motif: string): Promise<DemandeResultat> => {
    // Ces motifs sont des règles métier (question vide, domaine fermé, plafond
    // atteint) — jamais un détail fournisseur : sûrs à renvoyer tels quels aux
    // deux côtés, contrairement au motif d'un appel de modèle qui échoue.
    await db.insert(inMessages).values({
      sessionId,
      cote: input.cote,
      role: "moteur",
      contenu: "",
      ok: false,
      motif,
      motifPublic: motif,
      traceId,
    });
    await compter(input.cote, false, 0);
    return {
      sessionId,
      ok: false,
      reponse: "",
      motif,
      motifPublic: motif,
      fournisseur: null,
      modele: null,
      contexte: [],
      jetons: 0,
      dureeMs: 0,
      appelsOutils: [],
    };
  };

  if (question.length < 2) return echec("Question vide.");

  let consigneDomaine = "";
  if (input.cote === "public") {
    const code = input.domaine ?? DOMAINE_DEFAUT;
    const etat = await domaineOuvert(code);
    if (!etat) return echec(`Domaine d'assistance inconnu : ${code}.`);
    if (!etat.actif) {
      return echec(
        `Le domaine « ${etat.spec.libelle} » est construit mais fermé. Seul le PDG peut l'ouvrir depuis le centre MKA.P-MS Intelligences ; tant qu'il est fermé, aucune réponse n'est produite dans ce domaine.`,
      );
    }
    consigneDomaine = etat.spec.consigne;
  }

  // Lecture du registre : comment le visiteur parle décide du ton de la réponse.
  // Une pure politesse (merci, salut, au revoir) reçoit l'honneur qu'elle mérite
  // directement du moteur, sans consommer le plafond ni dépendre du fournisseur.
  const lecture = input.cote === "public" ? lireRegistre(question) : null;
  const courtoisie = lecture ? reponseCourtoisie(lecture, NOM_MOTEUR, question) : null;
  if (lecture && courtoisie) {
    await db.insert(inMessages).values({
      sessionId,
      cote: input.cote,
      role: "moteur",
      contenu: courtoisie,
      fournisseur: "moteur",
      modele: `registre:${lecture.intention}/${lecture.registre}`,
      ok: true,
      motif: "",
      jetonsEntree: 0,
      jetonsSortie: 0,
      dureeMs: 0,
      contexte: [],
      traceId,
    });
    await db
      .update(inSessions)
      .set({ messages: sql`${inSessions.messages} + 2`, dernierAt: new Date() })
      .where(eq(inSessions.id, sessionId));
    return {
      sessionId,
      ok: true,
      reponse: courtoisie,
      motif: "",
      motifPublic: "",
      fournisseur: "moteur",
      modele: `registre:${lecture.intention}/${lecture.registre}`,
      contexte: [],
      jetons: 0,
      dureeMs: 0,
      appelsOutils: [],
    };
  }

  const consommes = await appelsDuJour(input.cote);
  if (consommes >= PLAFOND_JOUR[input.cote]) {
    return echec(
      `Plafond journalier atteint pour le côté ${input.cote} (${PLAFOND_JOUR[input.cote]} appels). Le plafond protège la facture : il est relevé volontairement, pas dépassé silencieusement.`,
    );
  }

  const contexte =
    input.cote === "direction"
      ? [
          ...(await contexteDirection(question)),
          ...(await contexteUtilisateur({
            userId: input.userId,
            role: input.role,
            countryCode: input.countryCode,
            sessionId,
          })),
        ]
      : [];
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

  // LOT IA02B, point 6 — côté direction, la conversation passe par la même
  // boucle d'outils que le Chantier de développement (server/intelligences/
  // outils/boucle.ts) : les outils réellement implémentés et actifs
  // deviennent utilisables selon permission, sans qu'aucune seconde boucle ne
  // soit créée pour cette page. Côté public, aucun changement : appel direct
  // inchangé depuis le LOT IA02A, pour ne rien régresser sur son gate de
  // fuites fournisseurs déjà vérifié.
  let appelsOutilsTrace: { toolId: string; verdictPolitique: string; statutExecution: string | null; motif: string }[] = [];
  let r: {
    ok: boolean;
    texte: string;
    fournisseur: string | null;
    modele: string | null;
    motif: string;
    motifPublic: string;
    jetonsEntree: number;
    jetonsSortie: number;
    dureeMs: number;
  };

  if (input.cote === "direction") {
    const boucle = await executerAvecOutils({
      moteur: "intelligences",
      role: input.role ?? null,
      systeme: CONSIGNE_DIRECTION,
      message,
      outilsProposes: listerActifs().map((o) => o.toolId),
      confidentialite: "interne",
      countryCode: input.countryCode ?? null,
      maxTokens: 2000,
      actorId: input.userId ?? null,
      traceId,
    });
    appelsOutilsTrace = boucle.appelsOutils.map((a) => ({
      toolId: a.toolId,
      verdictPolitique: a.verdictPolitique,
      statutExecution: a.statutExecution,
      motif: a.motif,
    }));
    r = {
      ok: boucle.ok,
      texte: boucle.texteFinal,
      fournisseur: boucle.fournisseur,
      modele: boucle.modele,
      motif: boucle.motif,
      motifPublic: boucle.motifPublic,
      jetonsEntree: boucle.jetonsEntree,
      jetonsSortie: boucle.jetonsSortie,
      dureeMs: boucle.dureeMs,
    };
  } else {
    const appel = await appeler({
      capacite: "ia_texte",
      tache: "assistant_public",
      moteur: "intelligences",
      systeme: [CONSIGNE_PUBLIC, consigneDomaine, lecture ? `Registre du visiteur (lu par le moteur) :\n${lecture.consigneTon}` : ""]
        .filter((c) => c.length > 0)
        .join("\n\n"),
      message,
      // Côté public la question peut contenir des éléments personnels : le niveau
      // déclaré est plus strict, et la Fabrique Intelligence peut donc refuser un fournisseur.
      confidentialite: "interne",
      countryCode: input.countryCode ?? null,
      maxTokens: 900,
    });
    r = appel;
  }

  // Point 13 — traçabilité des outils réellement appelés, visible dans le
  // même champ `contexte` que le reste de ce qui a été injecté au modèle :
  // aucune colonne supplémentaire nécessaire pour un premier lot honnête.
  const contexteAvecOutils =
    appelsOutilsTrace.length > 0
      ? [
          ...contexte,
          ...appelsOutilsTrace.map(
            (a) => `Outil appelé : ${a.toolId} — ${a.verdictPolitique}${a.statutExecution ? `/${a.statutExecution}` : ""} — ${a.motif}`,
          ),
        ]
      : contexte;

  await db.insert(inMessages).values({
    sessionId,
    cote: input.cote,
    role: "moteur",
    contenu: r.texte.slice(0, 20000),
    fournisseur: r.fournisseur,
    modele: r.modele,
    ok: r.ok,
    motif: r.motif,
    motifPublic: r.motifPublic,
    jetonsEntree: r.jetonsEntree,
    jetonsSortie: r.jetonsSortie,
    dureeMs: r.dureeMs,
    contexte: contexteAvecOutils,
    traceId,
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

  // LOT IA02A — le côté direction (PDG) garde le détail technique complet ;
  // le côté public ne reçoit jamais fournisseur, modèle ni motif brut, même
  // dans une réponse réussie (une réponse API n'est pas seulement ce que
  // l'écran affiche : le JSON lui-même ne doit pas les porter).
  const cotePublic = input.cote === "public";
  return {
    sessionId,
    ok: r.ok,
    reponse: r.texte,
    motif: cotePublic ? r.motifPublic : r.motif,
    motifPublic: r.motifPublic,
    fournisseur: cotePublic ? null : r.fournisseur,
    modele: cotePublic ? null : r.modele,
    contexte: contexteAvecOutils,
    jetons: r.jetonsEntree + r.jetonsSortie,
    dureeMs: r.dureeMs,
    appelsOutils: appelsOutilsTrace,
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

/** Point 12 — `userId` scope la liste aux conversations réellement possédées par ce compte. */
export async function sessions(cote: Cote, limit = 40, userId?: number | null) {
  return db
    .select()
    .from(inSessions)
    .where(userId != null ? and(eq(inSessions.cote, cote), eq(inSessions.userId, userId)) : eq(inSessions.cote, cote))
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

export interface EtatIntelligence {
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
export async function etat(): Promise<EtatIntelligence> {
  const acces = await verifierAcces();

  let fournisseurs: EtatIntelligence["fournisseurs"] = [];
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
