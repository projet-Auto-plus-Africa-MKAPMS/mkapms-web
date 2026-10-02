/**
 * Points 130-131 — Master Orchestrator et agent développeur complet.
 *
 * Le propriétaire donne un objectif en une phrase : « Répare le problème de paiement de cette page. » L'orchestrateur le
 * décompose, exécute lui-même chaque étape qu'il a le droit d'exécuter, nomme précisément ce qui le bloque, et écrit un
 * rapport. Le propriétaire ne microgère aucun sous-agent : il lit le rapport et décide s'il monte le curseur.
 *
 * Règles tenues (réglages d'orchestration du 2 octobre 2026) :
 *  - une demande courte (« Tu peux travailler ») cherche d'abord la mission active ; sans mission identifiable, UNE question
 *    est posée et rien n'est lancé ;
 *  - « inconnu » est une classification non résolue, jamais un composant à chercher dans le code : on distingue un périmètre
 *    non identifié d'un composant réellement absent après inspection ;
 *  - une étape n'est « faite » que si son résultat a réellement été obtenu, avec une preuve ; un texte explicatif ne valide
 *    jamais une étape technique ; le compteur ne compte que ce qui a vraiment été fait ;
 *  - chaque contrôle d'autorisation correspond à l'action réellement effectuée (lecture, écriture, test, déploiement) ;
 *    une étape bloquée n'arrête que celles qui en dépendent ; le curseur n'est jamais monté automatiquement ;
 *  - après clarification ou changement de curseur, le travail reprend à l'étape utile avec les résultats déjà établis.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { inMissionEtapes, inMissions } from "./schema.js";
import { router, permissionsDuRole } from "./routeur.js";
import { autorise, type NiveauAutonomie, type Verdict } from "./autonomie.js";
import { normaliser, type Piece } from "./multimodal.js";
import { dejaVu, retenir } from "./memoire.js";
import type { CodeCapacite, Permission } from "./capacites.js";
import type { Confidentiality } from "../ai-fabric/service.js";
import {
  QUESTION_MISSION,
  categorie,
  compter,
  demandeCourte,
  domaineResolu,
  motsSignificatifs,
  objectifNormalise,
  phraseCompteur,
  type Compteur,
  type NatureResultat,
  type StatutEtape,
} from "./mission-etat.js";
import { FENETRE_JOURS, trouverMissionActive, type MissionActive } from "./mission-reprise.js";
import { STORE_REEL, type StoreMissions } from "./mission-store.js";

const MOTEUR = "intelligences_orchestrateur";

/** Domaines métier reconnus dans un objectif, et le curseur d'autonomie associé. */
const DOMAINES: { code: string; mots: RegExp; autonomie: string }[] = [
  {
    code: "paiement",
    mots: /paiement|payer|stripe|encaiss|facture|abonnement|remboursement/i,
    autonomie: "paiement",
  },
  { code: "seo", mots: /seo|référencement|referencement|google|sitemap|indexation/i, autonomie: "seo" },
  { code: "redirection", mots: /redirection|404|lien cassé|lien casse|url/i, autonomie: "code" },
  { code: "annonces", mots: /annonce|dépôt|depot|photo|galerie/i, autonomie: "code" },
  { code: "avis", mots: /avis|réputation|reputation|note/i, autonomie: "contenu" },
  { code: "support", mots: /support|message|réclamation|reclamation|client/i, autonomie: "support" },
  { code: "moteurs", mots: /moteur|registre|sonde|heartbeat|event bus/i, autonomie: "moteurs" },
  {
    code: "infrastructure",
    mots: /railway|déploiement|deploiement|variable|serveur|base de données|base de donnees/i,
    autonomie: "infrastructure",
  },
  { code: "traduction", mots: /traduction|langue|traduire/i, autonomie: "contenu" },
  { code: "code", mots: /code|bouton|page|composant|route|formulaire|bug|erreur/i, autonomie: "code" },
];

/**
 * Boutique (SHOP) : travail d'exploitation (fiches, photos, stock, colis, livraison, panier), pas un chantier de code —
 * il passe par la boucle d'outils (mode Travail), avec la même mémoire que le Chat. Un objectif qui parle explicitement
 * de code reste un chantier de développement.
 */
const MOTS_BOUTIQUE = /boutique|\bshop\b|cars4kids|fiche produit|catalogue produit|panier|colis|photos? (?:du |des )?produits?/i;
const MOTS_CODE_EXPLICITE = /\b(code|bug|composant|route|formulaire|bouton|migration|d[ée]ploie|d[ée]ploiement|correctif|pull request|branche)\b/i;

/**
 * Classe un objectif. « inconnu » = classification NON RÉSOLUE (aucun mot ne désigne un domaine) : ce n'est ni un composant ni
 * un domaine à rechercher dans le code. Le curseur par défaut reste « code ».
 */
export function classerObjectif(objectif: string): { domaine: string; autonomie: string } {
  if (MOTS_BOUTIQUE.test(objectif) && !MOTS_CODE_EXPLICITE.test(objectif)) return { domaine: "boutique", autonomie: "contenu" };
  for (const d of DOMAINES) {
    if (d.mots.test(objectif)) return { domaine: d.code, autonomie: d.autonomie };
  }
  return { domaine: "inconnu", autonomie: "code" };
}

interface Etape {
  etape: string;
  libelle: string;
  permission: Permission;
  capacite: CodeCapacite | null;
  statut: StatutEtape;
  observe: string;
  /** Ce qui prouve le résultat (vide quand il n'y a pas de résultat). */
  preuve: string;
  dureeMs: number;
  niveauRequis: NiveauAutonomie;
}

export interface EtapeMission {
  etape: string;
  libelle: string;
  statut: StatutEtape;
  categorie: ReturnType<typeof categorie>;
  capacite: CodeCapacite | null;
  permission: Permission;
  niveauRequis: number;
  observe: string;
  preuve: string;
  dureeMs: number;
}

export interface OrchestrerInput {
  objectif: string;
  role: string | null;
  actorId?: number;
  pieces?: Piece[];
  countryCode?: string | null;
  confidentialite?: Confidentiality;
  /** Dernière mission affichée par l'écran dans cette conversation (reprise explicite). */
  missionActiveId?: number | null;
  /** Derniers ordres de la conversation (les plus anciens d'abord) : contexte pour reconnaître la mission d'une demande courte. */
  contexte?: string[];
}

export interface Mission {
  /** 0 quand aucune mission n'a été créée (clarification demandée). */
  id: number;
  objectif: string;
  domaine: string;
  statut: "accomplie" | "arretee" | "echouee" | "a_clarifier";
  arretSur: string;
  motif: string;
  rapport: string;
  /** État court : mission identifiée ou information manquante, travail accompli, blocage précis, prochaine action. */
  resume: string;
  compteur: Compteur;
  repriseDe: number | null;
  /** Question unique posée quand la mission n'est pas identifiable. */
  clarification: string | null;
  candidats: { id: number; objectif: string }[];
  prochaineAction: string;
  devRequestId: number | null;
  pipelineRunId: number | null;
  testRunId: number | null;
  deploiementDemandeId: number | null;
  etapes: EtapeMission[];
}

type CleEtape = "comprendre" | "architecture" | "experience" | "analyse" | "correctif" | "dossier" | "tests" | "deploiement";

interface DefEtape {
  etape: CleEtape;
  libelle: string;
  permission: Permission;
  capacite: CodeCapacite | null;
  /**
   * Étapes dont le résultat est nécessaire : une étape n'est ignorée que si l'une d'elles n'a pas abouti. Une étape bloquée
   * n'arrête donc que celles qui en dépendent (les contrôles ne dépendent pas de l'écriture du dossier, par exemple).
   */
  depend: CleEtape[];
  /** Ce que l'étape fait réellement : c'est ce qui justifie le contrôle d'autorisation. */
  action: string;
}

/** Plan standard d'une mission. L'ordre est celui du point 130 ; les dépendances sont celles du travail réel. */
const PLAN: DefEtape[] = [
  { etape: "comprendre", libelle: "Comprendre l'objectif et les pièces jointes", permission: "READ", capacite: null, depend: [], action: "lecture de la demande et des pièces jointes" },
  { etape: "architecture", libelle: "Lire l'architecture réellement en jeu", permission: "READ", capacite: null, depend: ["comprendre"], action: "lecture du relevé de code (aucune écriture)" },
  { etape: "experience", libelle: "Consulter la mémoire des corrections passées", permission: "READ", capacite: null, depend: ["comprendre"], action: "lecture de la mémoire des corrections (aucune écriture)" },
  { etape: "analyse", libelle: "Analyser la situation", permission: "ANALYZE", capacite: "raisonnement", depend: ["architecture"], action: "analyse par le modèle (aucune écriture)" },
  { etape: "correctif", libelle: "Rédiger le correctif proposé", permission: "PROPOSE", capacite: "code", depend: ["analyse", "architecture"], action: "rédaction d'une proposition de correctif (rien n'est appliqué)" },
  { etape: "dossier", libelle: "Ouvrir le dossier de développement hors production", permission: "WRITE", capacite: null, depend: ["architecture"], action: "création d'un dossier de développement (écriture d'un enregistrement hors production)" },
  { etape: "tests", libelle: "Exécuter les contrôles et la non-régression", permission: "TEST", capacite: null, depend: ["architecture"], action: "exécution des contrôles et de la non-régression" },
  { etape: "deploiement", libelle: "Vérifier le verrou de déploiement", permission: "DEPLOY", capacite: null, depend: ["tests"], action: "constat du verrou de déploiement et demande d'approbation (aucun déploiement direct)" },
];

/* ------------------------------------------------------------------ */
/* Dépendances (injectables pour vérifier la logique sans base)         */
/* ------------------------------------------------------------------ */

export interface Impact {
  trouve: boolean;
  fichiers: string[];
  api: string[];
  tables: string[];
  tests: string[];
  dependants: string[];
  avertissements: string[];
}

export interface DepsOrchestrateur {
  autorise(domaine: string, permission: Permission): Promise<Verdict>;
  permissionsDuRole(role: string | null): Promise<Permission[]>;
  router: typeof router;
  normaliser: typeof normaliser;
  graphe: {
    relevePresent(): Promise<boolean>;
    impact(cle: string): Promise<Impact>;
    recherche(q: string, limit?: number): Promise<{ type: string; key: string; label: string }[]>;
    reconnaitre(objectif: string): Promise<{ verdict: string }>;
    fichiersConnus(chemins: string[]): Promise<Set<string>>;
  };
  memoire: { dejaVu: typeof dejaVu; retenir: typeof retenir };
  centre: {
    analyserPerimetre(besoin: string): Promise<string[]>;
    trouverDossierOuvert(i: { need: string; id?: number | null }): Promise<{ id: number; status: string } | null>;
    ouvrirDossier(i: { need: string; countryCode?: string | null; requestedBy?: number }): Promise<{ id: number; status: string; blockedReason?: string | null } | null>;
  };
  tests: {
    lancer(i: { portee: string; requestedBy?: number }): Promise<{ runId: number; total: number; reussis: number; echecs: number; ignores: number; regressions: number }>;
    verrou(): Promise<{ autorise: boolean; motif: string; bloquants: { scenario: string }[] }>;
  };
  deploiement: { demander(i: { missionId: number; demandeParId?: number }): Promise<{ id: number; approbateurs: string[] }> };
  store: StoreMissions;
}

export const DEPS_REELLES: DepsOrchestrateur = {
  autorise,
  permissionsDuRole,
  router,
  normaliser,
  graphe: {
    relevePresent: async () => (await import("../code-graph/service.js")).relevePresent(),
    impact: async (cle) => (await import("../code-graph/service.js")).impact(cle) as Promise<Impact>,
    recherche: async (q, limit) => (await import("../code-graph/service.js")).recherche(q, limit),
    reconnaitre: async (o) => (await import("../code-graph/service.js")).reconnaitre(o),
    fichiersConnus: async (c) => (await import("../code-graph/service.js")).fichiersConnus(c),
  },
  memoire: { dejaVu, retenir },
  centre: {
    analyserPerimetre: async (b) => (await import("../command-center/service.js")).analyseScope(b),
    trouverDossierOuvert: async (i) => (await import("../command-center/service.js")).trouverDossierOuvert(i),
    ouvrirDossier: async (i) => (await import("../command-center/service.js")).openDevRequest(i),
  },
  tests: {
    lancer: async (i) => {
      const ct = await import("../continuous-test/service.js");
      return ct.runTests({ portee: i.portee, trigger: "orchestrateur", requestedBy: i.requestedBy });
    },
    verrou: async () => (await import("../continuous-test/service.js")).deploymentGate(),
  },
  deploiement: { demander: async (i) => (await import("./deploiement/service.js")).demander(i) },
  store: STORE_REEL,
};

/* ------------------------------------------------------------------ */
/* Périmètre : non identifié ≠ absent                                   */
/* ------------------------------------------------------------------ */

export type Perimetre =
  | { etat: "identifie"; cle: string; libelle: string; via: string; impact: Impact }
  | { etat: "non_identifie" }
  | { etat: "absent"; cherche: string[] }
  | { etat: "releve_absent" };

/** Domaines trop généraux pour désigner un composant : ils ne suffisent pas à chercher dans le relevé. */
const DOMAINES_GENERIQUES = new Set(["inconnu", "code", "non_classe", ""]);

/** Mots d'un objectif qui ne désignent aucun composant (verbes d'action, termes génériques de développement). */
const MOTS_SANS_COMPOSANT = new Set([
  "corrige", "corriger", "repare", "reparer", "répare", "réparer", "ameliore", "améliore", "ameliorer", "améliorer", "verifie", "vérifie", "verifier", "vérifier",
  "probleme", "problème", "bug", "erreur", "page", "bouton", "code", "composant", "route", "formulaire", "fonctionnalite", "fonctionnalité", "plateforme",
  "faire", "marche", "fonctionne", "fonctionner", "cette", "cet", "ces", "pour", "dans", "avec", "sans", "plus", "moins", "tres", "très",
]);

function motsDeRecherche(objectif: string): string[] {
  return [...new Set(
    motsSignificatifs(objectif)
      .map((m) => m.normalize("NFD").replace(/[̀-ͯ]/g, ""))
      .filter((m) => m.length >= 4 && !MOTS_SANS_COMPOSANT.has(m)),
  )].slice(0, 5);
}

/**
 * Résout le périmètre d'un objectif : domaine classé, modules du Centre de Commandes, puis recherche dans le relevé de code.
 * « non_identifie » = rien dans la demande ne désigne un composant (on ne cherche donc RIEN dans le code) ;
 * « absent » = un composant a été désigné, le relevé a été inspecté et ne le contient pas.
 */
export async function resoudrePerimetre(objectif: string, domaine: string, deps: DepsOrchestrateur): Promise<Perimetre> {
  if (!(await deps.graphe.relevePresent())) return { etat: "releve_absent" };
  const cherche: string[] = [];

  if (!DOMAINES_GENERIQUES.has(domaine)) {
    cherche.push(domaine);
    const i = await deps.graphe.impact(domaine);
    if (i.trouve) return { etat: "identifie", cle: domaine, libelle: domaine, via: "domaine reconnu dans la demande", impact: i };
  }

  for (const module of await deps.centre.analyserPerimetre(objectif)) {
    cherche.push(module);
    const i = await deps.graphe.impact(module);
    if (i.trouve) return { etat: "identifie", cle: module, libelle: module, via: "module rattaché par le Centre de Commandes", impact: i };
  }

  const mots = motsDeRecherche(objectif);
  for (const mot of mots) {
    const trouves = await deps.graphe.recherche(mot, 5);
    cherche.push(mot);
    for (const noeud of trouves) {
      const i = await deps.graphe.impact(noeud.key);
      if (i.trouve) return { etat: "identifie", cle: noeud.key, libelle: noeud.label, via: `élément « ${noeud.label} » trouvé au relevé de code`, impact: i };
    }
  }

  // Un composant nommé (domaine classé, module ou mot précis) qui reste introuvable est réellement absent ; sans aucun nom : non identifié.
  return cherche.length > 0 && (!DOMAINES_GENERIQUES.has(domaine) || cherche.some((c) => c !== domaine))
    ? { etat: "absent", cherche: [...new Set(cherche)] }
    : { etat: "non_identifie" };
}

/* ------------------------------------------------------------------ */
/* Preuve du correctif                                                  */
/* ------------------------------------------------------------------ */

const MOTIF_CHEMIN = /(?:^|[\s`'"(])((?:[\w.-]+\/)+[\w.-]+\.(?:ts|tsx|js|mjs|sql|json|css|md|yml))(?=[\s`'":,.)]|$)/g;

/** Chemins de fichiers nommés dans un texte de proposition. */
export function cheminsCites(texte: string): string[] {
  const chemins = new Set<string>();
  for (const m of texte.matchAll(MOTIF_CHEMIN)) chemins.add(m[1]!);
  return [...chemins].slice(0, 40);
}

/* ------------------------------------------------------------------ */
/* Exécution                                                            */
/* ------------------------------------------------------------------ */

const ETAPES_REPRISES = new Set<CleEtape>(["architecture", "analyse", "correctif", "dossier"]);
const DEPENDANCE_STRICTE = new Set<CleEtape>(["deploiement"]);

function tronque(t: string, n: number): string {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function etapeVers(e: Etape): EtapeMission {
  return {
    etape: e.etape,
    libelle: e.libelle,
    statut: e.statut,
    categorie: categorie(e.statut),
    capacite: e.capacite,
    permission: e.permission,
    niveauRequis: e.niveauRequis,
    observe: e.observe,
    preuve: e.preuve,
    dureeMs: e.dureeMs,
  };
}

function missionAClarifier(objectif: string, candidats: { id: number; objectif: string }[]): Mission {
  const options = candidats.length > 0 ? ` Missions inachevées possibles : ${candidats.map((c) => `#${c.id} « ${tronque(c.objectif, 80)} »`).join(" ; ")}.` : "";
  return {
    id: 0,
    objectif,
    domaine: "non_classe",
    statut: "a_clarifier",
    arretSur: "",
    motif: candidats.length > 0 ? "Plusieurs missions inachevées : laquelle reprendre ?" : "Aucune mission active identifiable.",
    rapport: "",
    resume: [
      "Mission : non identifiée — aucune mission active reconnue dans cette conversation.",
      "Travail réalisé : aucun (rien n'a été lancé, rien n'a été enregistré).",
      `Information manquante : la tâche à réaliser.${options}`,
      `Prochaine action : ${QUESTION_MISSION}`,
    ].join("\n"),
    compteur: compter([]),
    repriseDe: null,
    clarification: QUESTION_MISSION,
    candidats,
    prochaineAction: QUESTION_MISSION,
    devRequestId: null,
    pipelineRunId: null,
    testRunId: null,
    deploiementDemandeId: null,
    etapes: [],
  };
}

/**
 * Exécute une mission. Le résultat est toujours écrit en base : une mission arrêtée reste consultable, avec l'étape exacte
 * qui a bloqué. Sauf demande trop courte sans mission identifiable : rien n'est lancé, rien n'est écrit, une question est posée.
 */
export async function orchestrer(input: OrchestrerInput, deps: DepsOrchestrateur = DEPS_REELLES): Promise<Mission> {
  const debutMission = Date.now();
  const saisie = input.objectif.trim();
  let objectif = saisie;
  let reprise: MissionActive | null = null;

  /* 1. Identification de la mission ------------------------------------ */
  if (demandeCourte(saisie)) {
    const r = await trouverMissionActive(deps.store, { actorId: input.actorId, missionActiveId: input.missionActiveId, contexte: input.contexte });
    if (r.etat === "aucune") return missionAClarifier(saisie, []);
    if (r.etat === "ambigue") return missionAClarifier(saisie, r.candidats);
    objectif = r.mission.objectif;
    reprise = r.mission.id ? r.mission : null;
  } else if (input.actorId !== undefined) {
    // Une phrase précise : elle reprend la mission inachevée de même objectif, ou complète celle que l'écran désigne quand
    // celle-ci s'est arrêtée faute de périmètre (la réponse de l'utilisateur est alors la précision attendue).
    const cle = objectifNormalise(saisie);
    const depuis = new Date(Date.now() - FENETRE_JOURS * 24 * 3600 * 1000);
    const memeObjectif = (await deps.store.inachevees(input.actorId, depuis)).find((m) => objectifNormalise(m.objectif) === cle);
    if (memeObjectif) {
      reprise = { id: memeObjectif.id, objectif: memeObjectif.objectif, domaine: memeObjectif.domaine, devRequestId: memeObjectif.devRequestId, etapes: await deps.store.etapesDe(memeObjectif.id), via: "historique" };
    } else if (input.missionActiveId) {
      const prec = await deps.store.parId(input.missionActiveId);
      if (prec && prec.actorId === input.actorId && prec.statut === "arretee" && prec.arretSur === "architecture" && !domaineResolu(prec.domaine)) {
        objectif = `${prec.objectif} — précision : ${saisie}`;
        reprise = { id: prec.id, objectif: prec.objectif, domaine: prec.domaine, devRequestId: prec.devRequestId, etapes: await deps.store.etapesDe(prec.id), via: "ecran" };
      }
    }
  }

  const classe = classerObjectif(objectif);
  let { domaine } = classe;
  const { autonomie } = classe;
  if (reprise && domaineResolu(reprise.domaine) && !domaineResolu(domaine)) domaine = reprise.domaine!;
  if (domaine === "boutique") return travailOutille(input, objectif, domaine, autonomie);
  const accordees = await deps.permissionsDuRole(input.role);

  const missionId = await deps.store.creer({ objectif, domaine, actorId: input.actorId ?? null, repriseDe: reprise?.id ?? null });
  const acquis = new Map<string, { observe: string }>();
  for (const e of reprise?.etapes ?? []) if (e.statut === "fait" && ETAPES_REPRISES.has(e.etape as CleEtape)) acquis.set(e.etape, { observe: e.observe.replace(/\nPreuve : [\s\S]*$/, "") });

  const etapes: Etape[] = [];
  const statutDe = new Map<CleEtape, StatutEtape>();
  let devRequestId: number | null = reprise?.devRequestId ?? null;
  let testRunId: number | null = null;
  let deploiementDemandeId: number | null = null;
  let perimetre: Perimetre | null = null;

  // Contexte accumulé et transmis d'une étape à l'autre : c'est ce qui distingue une mission d'une suite d'appels indépendants.
  let contexteArchitecture = "";
  let contexteExperience = "";
  let contexteAnalyse = "";
  let capaciteConseillee: CodeCapacite = "raisonnement";
  let images: string[] = [];
  let texteQuestion = objectif;
  let nonRelancee: string | null = null; // cause du non-lancement d'un parcours dépendant du périmètre

  for (const def of PLAN) {
    const base: Etape = {
      etape: def.etape,
      libelle: def.libelle,
      permission: def.permission,
      capacite: def.capacite,
      statut: "non_execute",
      observe: "",
      preuve: "",
      dureeMs: 0,
      niveauRequis: 1,
    };
    const fin = (statut: StatutEtape) => {
      base.statut = statut;
      statutDe.set(def.etape, statut);
      etapes.push(base);
    };

    /* 2. Dépendances : seule une étape dont dépend celle-ci peut l'arrêter. */
    const manque = def.depend.find((d) => {
      const s = statutDe.get(d);
      return DEPENDANCE_STRICTE.has(def.etape) ? s !== "fait" : s !== "fait" && s !== "partielle";
    });
    if (manque) {
      const de = PLAN.find((p) => p.etape === manque)!;
      base.observe = nonRelancee && manque === "architecture"
        ? `Non exécutée : ${nonRelancee}`
        : `Non exécutée : dépend de « ${de.libelle} » (${statutDe.get(manque) === "non_execute" ? "non exécutée" : statutDe.get(manque) === "refuse" || statutDe.get(manque) === "en_attente_autorisation" ? "bloquée" : "sans résultat"}).`;
      fin("non_execute");
      continue;
    }

    /* 3. Résultat déjà établi par une mission précédente (reprise). */
    const repris = acquis.get(def.etape);
    if (repris) {
      base.observe = repris.observe;
      base.preuve = `résultat établi dans la mission #${reprise!.id}, conservé`;
      if (def.etape === "architecture") contexteArchitecture = repris.observe;
      if (def.etape === "analyse") contexteAnalyse = repris.observe;
      if (def.etape === "architecture") {
        perimetre = null;
      }
      if (def.etape === "dossier") devRequestId = reprise!.devRequestId ?? devRequestId;
      fin("fait");
      continue;
    }

    /* 4. Autorisation : celle de l'opération réellement effectuée. */
    let permission = def.permission;
    let action = def.action;
    let dossierExistant: { id: number; status: string } | null = null;
    if (def.etape === "dossier") {
      dossierExistant = await deps.centre.trouverDossierOuvert({ need: objectif, id: devRequestId });
      if (dossierExistant) {
        permission = "READ";
        action = `consultation du dossier de développement #${dossierExistant.id} déjà ouvert (aucune écriture, aucun doublon créé)`;
      }
    }
    base.permission = permission;
    const verdict = await deps.autorise(autonomie, permission);
    base.niveauRequis = verdict.niveauRequis;

    if (!accordees.includes(permission)) {
      base.observe = `Action bloquée : ${action}. Autorisation manquante : la permission ${permission} n'est pas accordée au rôle « ${input.role ?? "aucun"} ».`;
      fin("refuse");
      continue;
    }
    if (!verdict.autorise) {
      base.observe = `Action bloquée : ${action}. Autorisation manquante : niveau ${verdict.niveauRequis} requis sur « ${autonomie} », le curseur est au niveau ${verdict.niveauAccorde}. Rien n'a été modifié.`;
      fin("en_attente_autorisation");
      continue;
    }

    const debut = Date.now();
    try {
      switch (def.etape) {
        case "comprendre": {
          const n = await deps.normaliser(objectif, input.pieces ?? []);
          texteQuestion = n.texte;
          images = n.images;
          capaciteConseillee = n.capaciteConseillee;
          const lues = n.pieces.filter((p) => p.lue).length;
          const libelleDomaine = domaineResolu(domaine) ? `Domaine identifié : ${domaine}.` : "Domaine non encore classé (le périmètre sera résolu à l'étape suivante).";
          base.observe = [
            `${libelleDomaine} Capacité principale : ${capaciteConseillee}.`,
            n.pieces.length === 0 ? "Aucune pièce jointe." : `${lues}/${n.pieces.length} pièce(s) réellement lue(s).`,
            ...n.nonLues.map((p) => `Non lue — ${p.nom} : ${p.motif}`),
          ].join("\n");
          base.preuve = `demande lue (${objectif.length} caractères), ${lues}/${n.pieces.length} pièce(s) lue(s)`;
          base.statut = n.nonLues.length > 0 ? "partielle" : "fait";
          break;
        }

        case "architecture": {
          perimetre = await resoudrePerimetre(objectif, domaine, deps);
          if (perimetre.etat === "identifie") {
            const i = perimetre.impact;
            if (domaine === "inconnu" || DOMAINES_GENERIQUES.has(domaine)) domaine = perimetre.libelle.slice(0, 48);
            const connus = await deps.graphe.fichiersConnus(i.fichiers);
            const lecture = `${i.fichiers.length} fichier(s), ${i.api.length} API, ${i.tables.length} table(s), ${i.tests.length} contrôle(s), ${i.dependants.length} module(s) dépendant(s).${
              i.avertissements.length > 0 ? ` Avertissements : ${i.avertissements.join(" ")}` : ""
            }`;
            base.observe = `Périmètre : « ${perimetre.libelle} » (${perimetre.via}). ${lecture}`;
            if (connus.size > 0) {
              base.preuve = `${connus.size}/${i.fichiers.length} fichier(s) confirmé(s) au relevé de code (ex. ${[...connus].slice(0, 3).join(", ")})`;
              base.statut = "fait";
            } else {
              base.preuve = "composant trouvé au relevé, mais aucun fichier rattaché confirmé";
              base.observe += " Aucun fichier du relevé ne peut être cité : lecture partielle.";
              base.statut = "partielle";
            }
            contexteArchitecture = base.observe;
          } else if (perimetre.etat === "absent") {
            base.observe = `Relevé de code inspecté : ${perimetre.cherche.map((c) => `« ${c} »`).join(", ")} n'y figure pas. Le composant est réellement absent du relevé (ou pas encore ingéré) : aucun fichier existant à modifier ne peut être cité.`;
            base.preuve = `recherche faite au relevé de code sur ${perimetre.cherche.length} terme(s), aucun résultat`;
            base.statut = "partielle";
            contexteArchitecture = base.observe;
          } else if (perimetre.etat === "releve_absent") {
            base.observe = "Aucun relevé de code n'a été ingéré : l'architecture ne peut pas être lue.";
            base.statut = "echec";
            nonRelancee = "aucun relevé de code ingéré (la lecture de l'architecture est impossible).";
          } else {
            base.observe = "Périmètre non identifié : la demande ne désigne ni page, ni moteur, ni fonctionnalité. Rien n'a été cherché dans le code — ce n'est pas un composant absent.";
            base.statut = "non_execute";
            nonRelancee = "le périmètre n'est pas identifié (aucun composant désigné dans la demande).";
          }
          break;
        }

        case "experience": {
          // Deux mémoires distinctes, aucune recopiée : le relevé de code sait ce qui a déjà été corrigé dans le dépôt, la
          // mémoire d'Intelligences sait ce qu'une mission précédente a réellement vécu (point 139).
          const r = await deps.graphe.reconnaitre(objectif);
          const vu = await deps.memoire.dejaVu(domaine, objectif);
          contexteExperience = [r.verdict, vu.verdict].join("\n");
          base.observe = `${r.verdict}\n${vu.verdict}`;
          base.preuve = `mémoire du relevé et mémoire des missions consultées (${vu.experiences} expérience(s) comparable(s)${vu.corrigeVerifie ? ", dont une correction vérifiée" : ", aucune correction vérifiée"})`;
          base.statut = "fait";
          break;
        }

        case "analyse": {
          const r = await deps.router({
            capacite: capaciteConseillee === "code" ? "raisonnement" : capaciteConseillee,
            moteur: MOTEUR,
            role: input.role,
            systeme:
              "Tu analyses une plateforme automobile réelle. Dis ce que tu constates, distingue ce que tu sais de ce que tu supposes, et nomme ce qui manque pour conclure.",
            message: [
              `Objectif : ${texteQuestion}`,
              contexteArchitecture ? `Architecture en jeu : ${contexteArchitecture}` : "",
              contexteExperience ? `Mémoire des corrections : ${contexteExperience}` : "",
            ]
              .filter((l) => l.length > 0)
              .join("\n\n"),
            confidentialite: input.confidentialite ?? "interne",
            countryCode: input.countryCode ?? null,
            images: images.length > 0 ? images : undefined,
          });
          if (r.ok && r.texte.trim().length > 0) {
            contexteAnalyse = r.texte;
            base.statut = "fait";
            base.observe = r.texte;
            base.preuve = `analyse produite par le modèle (${r.texte.trim().length} caractères) à partir de l'architecture lue`;
          } else {
            base.statut = "echec";
            base.observe = `${r.motif} Repli : ${r.repli}`;
          }
          break;
        }

        case "correctif": {
          const r = await deps.router({
            capacite: "code",
            moteur: MOTEUR,
            role: input.role,
            systeme:
              "Tu proposes un correctif pour un dépôt existant. Nomme les fichiers, décris la modification, indique le risque de régression et le retour arrière. N'invente aucun fichier dont l'existence n'est pas établie.",
            message: [
              `Objectif : ${objectif}`,
              contexteArchitecture ? `Architecture : ${contexteArchitecture}` : "",
              contexteAnalyse ? `Analyse : ${contexteAnalyse}` : "",
            ]
              .filter((l) => l.length > 0)
              .join("\n\n"),
            confidentialite: "interne",
            countryCode: input.countryCode ?? null,
          });
          if (!r.ok) {
            base.statut = "echec";
            base.observe = `${r.motif} Repli : ${r.repli}`;
            break;
          }
          // Un texte explicatif ne valide pas un correctif : il doit nommer des fichiers qui existent réellement au relevé.
          const cites = cheminsCites(r.texte);
          const connus = cites.length > 0 ? await deps.graphe.fichiersConnus(cites) : new Set<string>();
          const inconnus = cites.filter((c) => !connus.has(c));
          base.observe = r.texte;
          if (connus.size > 0) {
            base.statut = "fait";
            base.preuve = `${connus.size} fichier(s) cité(s) confirmé(s) au relevé de code${inconnus.length > 0 ? `, ${inconnus.length} non retrouvé(s) (à créer ou à vérifier : ${inconnus.slice(0, 3).join(", ")})` : ""}`;
          } else {
            base.statut = "partielle";
            base.observe = `${cites.length === 0 ? "Texte sans aucun fichier nommé" : `Fichiers cités introuvables au relevé : ${inconnus.slice(0, 3).join(", ")}`} : ce n'est pas encore un correctif exploitable.\n${r.texte}`;
          }
          break;
        }

        case "dossier": {
          if (dossierExistant) {
            devRequestId = dossierExistant.id;
            base.statut = "fait";
            base.observe = `Dossier de développement #${dossierExistant.id} déjà ouvert (${dossierExistant.status}) : réutilisé, aucun doublon créé.`;
            base.preuve = `dossier #${dossierExistant.id} retrouvé en base`;
            break;
          }
          const dossier = await deps.centre.ouvrirDossier({ need: objectif, countryCode: input.countryCode ?? null, requestedBy: input.actorId });
          devRequestId = dossier?.id ?? null;
          if (dossier) {
            base.statut = "fait";
            base.observe = `Dossier de développement #${dossier.id} créé (${dossier.status}). ${dossier.blockedReason ?? ""}`.trim();
            base.preuve = `dossier #${dossier.id} créé en base, hors production`;
          } else {
            base.statut = "echec";
            base.observe = "Ouverture du dossier refusée par le Centre de Commandes.";
          }
          break;
        }

        case "tests": {
          const run = await deps.tests.lancer({ portee: perimetre?.etat === "identifie" ? perimetre.cle : domaine, requestedBy: input.actorId });
          testRunId = run.runId;
          if (run.total === 0) {
            base.statut = "partielle";
            base.observe = `Aucun contrôle ne couvre le périmètre « ${domaine} » : rien ne prouve que la correction n'a rien cassé.`;
            base.preuve = `campagne #${run.runId} sans aucun contrôle applicable`;
          } else {
            base.observe = `Campagne #${run.runId} : ${run.reussis} réussi(s), ${run.echecs} échec(s), ${run.ignores} ignoré(s), ${run.regressions} régression(s).`;
            base.preuve = `campagne #${run.runId} : ${run.reussis}/${run.total} contrôle(s) réussi(s)`;
            base.statut = run.echecs === 0 && run.regressions === 0 ? "fait" : "partielle";
          }
          break;
        }

        case "deploiement": {
          const gate = await deps.tests.verrou();
          // L'orchestrateur ne déploie pas : il constate le verrou, puis pose une vraie demande devant la ou les personnes
          // désignées (server/intelligences/deploiement) — jamais un déploiement direct.
          if (gate.autorise) {
            const demande = await deps.deploiement.demander({ missionId, demandeParId: input.actorId });
            deploiementDemandeId = demande.id;
            base.statut = "fait";
            base.preuve = `demande de déploiement #${demande.id} créée (aucun déploiement effectué)`;
            base.observe =
              demande.approbateurs.length > 0
                ? `Verrou ouvert : ${gate.motif} Demande de déploiement #${demande.id} posée devant : ${demande.approbateurs.join(", ")}.`
                : `Verrou ouvert : ${gate.motif} Demande de déploiement #${demande.id} créée, mais aucun approbateur n'est désigné — le propriétaire doit d'abord en choisir un (Réglages → Approbateurs de déploiement).`;
          } else {
            base.statut = "en_attente_autorisation";
            base.observe = `Action bloquée : demande de déploiement. Autorisation manquante : verrou fermé — ${gate.motif}${gate.bloquants.length > 0 ? ` Bloquants : ${gate.bloquants.map((b) => b.scenario).join(", ")}.` : ""}`;
          }
          break;
        }
      }
    } catch (e) {
      base.statut = "echec";
      base.observe = `Étape interrompue : ${e instanceof Error ? e.message : "erreur inconnue"}`;
    }

    base.dureeMs = Date.now() - debut;
    fin(base.statut);
  }

  /* 5. Issue, état court, mémoire ---------------------------------- */
  const compteur = compter(etapes);
  const premierManque = etapes.find((e) => e.statut !== "fait" && e.statut !== "non_applicable");
  const bloquee = etapes.find((e) => categorie(e.statut) === "bloquee");
  const enEchec = etapes.find((e) => e.statut === "echec");
  const statut: Mission["statut"] = !premierManque ? "accomplie" : enEchec ? "echouee" : "arretee";
  const perimetreManquant = perimetre !== null && perimetre.etat === "non_identifie";
  const arretSur = premierManque?.etape ?? "";
  const motif = premierManque ? tronque(premierManque.observe, 400) : "";

  const nature: NatureResultat = perimetreManquant
    ? "mission_insuffisante"
    : bloquee
      ? "blocage_autorisation"
      : enEchec
        ? "echec_technique"
        : premierManque
          ? "partielle"
          : "accomplie_non_verifiee";

  const clarification = perimetreManquant ? "Quelle page, quel moteur ou quelle fonctionnalité est concerné ?" : null;
  const prochaineAction = clarification
    ? clarification
    : bloquee
      ? bloquee.permission && !accordees.includes(bloquee.permission)
        ? `Le rôle « ${input.role ?? "aucun"} » n'a pas la permission ${bloquee.permission} : seul le propriétaire peut l'accorder. Rien n'est contourné.`
        : bloquee.etape === "deploiement"
          ? "Le verrou de déploiement doit d'abord s'ouvrir (contrôles au vert) : le propriétaire décide de la suite."
          : `Si le propriétaire l'autorise : monter le curseur « ${autonomie} » au niveau ${bloquee.niveauRequis}, puis relancer « continue » — le travail reprendra à « ${bloquee.libelle} » avec les résultats déjà établis.`
      : enEchec
        ? `Corriger la cause technique de « ${enEchec.libelle} » (${tronque(enEchec.observe, 140)}) puis relancer « continue ».`
        : premierManque
          ? `Compléter « ${premierManque.libelle} » : ${tronque(premierManque.observe, 160)}`
          : "Le propriétaire décide de la suite : la mise en production reste sa décision.";

  const faits = etapes.filter((e) => e.statut === "fait").map((e) => e.libelle);
  const resume = [
    `Mission #${missionId} : « ${tronque(objectif, 140)} »${reprise ? ` — reprise de la mission #${reprise.id}${reprise.via === "ecran" ? "" : " (identifiée dans la conversation)"}` : ""}${perimetre?.etat === "identifie" ? ` · périmètre « ${perimetre.libelle} »` : ""}.`,
    `Travail réalisé : ${faits.length > 0 ? faits.join(" ; ") : "aucune étape n'a abouti"}. ${phraseCompteur(compteur)}.`,
    premierManque ? `Arrêt : « ${premierManque.libelle} » — ${tronque(premierManque.observe, 300)}` : "Toutes les étapes du plan ont abouti ; la mise en production reste une décision du propriétaire.",
    `Prochaine action : ${prochaineAction}`,
  ].join("\n");

  const rapport = [
    resume,
    "",
    ...etapes.map((e) => `[${categorie(e.statut)}] ${e.libelle}${e.preuve ? ` — preuve : ${e.preuve}` : ""}`),
  ].join("\n");

  const niveauAccorde = (await deps.autorise(autonomie, "READ")).niveauAccorde;
  await deps.store.ajouterEtapes(
    missionId,
    etapes.map((e) => ({
      etape: e.etape,
      libelle: e.libelle,
      statut: e.statut,
      observe: e.preuve ? `${e.observe}\nPreuve : ${e.preuve}` : e.observe,
      capacite: e.capacite,
      permission: e.permission,
      niveauRequis: e.niveauRequis,
      dureeMs: e.dureeMs,
    })),
  );
  await deps.store.maj(missionId, {
    domaine,
    statut,
    arretSur,
    motif,
    rapport,
    devRequestId,
    testRunId,
    niveauRequis: Math.max(1, ...etapes.map((e) => e.niveauRequis)),
    niveauAccorde,
    dureeMs: Date.now() - debutMission,
  });

  // Point 139 — la mission se mémorise, réussie ou arrêtée, sous sa NATURE (mission floue, autorisation, panne technique…).
  // Une même issue répétée sans rien de nouveau n'ajoute qu'une tentative : jamais une « correction acquise ».
  await deps.memoire.retenir({
    domaine,
    probleme: objectif,
    diagnostic: etapes.find((e) => e.etape === "analyse" && e.statut === "fait")?.observe ?? (contexteArchitecture || "Analyse non exécutée."),
    solution: etapes.find((e) => e.etape === "correctif" && e.statut === "fait")?.observe ?? "",
    resultat: nature,
    blocage: premierManque ? `${premierManque.etape} — ${tronque(premierManque.observe, 300)}` : "",
    missionId,
    testRunId,
    devRequestId,
  });

  return {
    id: missionId,
    objectif,
    domaine,
    statut,
    arretSur,
    motif,
    rapport,
    resume,
    compteur,
    repriseDe: reprise?.id ?? null,
    clarification,
    candidats: [],
    prochaineAction,
    devRequestId,
    pipelineRunId: null,
    testRunId,
    deploiementDemandeId,
    etapes: etapes.map(etapeVers),
  };
}

export async function missions(limit = 60) {
  return db.select().from(inMissions).orderBy(desc(inMissions.id)).limit(limit);
}

export async function mission(id: number) {
  const [m] = await db.select().from(inMissions).where(eq(inMissions.id, id)).limit(1);
  if (!m) return null;
  const etapes = await db
    .select()
    .from(inMissionEtapes)
    .where(eq(inMissionEtapes.missionId, id))
    .orderBy(inMissionEtapes.rang);
  return { ...m, etapes };
}


/**
 * Travail d'exploitation de la boutique : même moteur de conversation que le Chat (mémoire, connaissances, consigne
 * d'autonomie), mais en environnement Travail — tous les outils actifs sont proposés, dont `boutique.*`. Chaque appel
 * d'outil devient une étape lisible du rapport (fait / refusé / échec), jamais une action annoncée sans preuve.
 */
async function travailOutille(input: OrchestrerInput, objectif: string, domaine: string, autonomie: string): Promise<Mission> {
  const debut = Date.now();
  const [ligne] = await db
    .insert(inMissions)
    .values({ objectif: objectif.slice(0, 4000), domaine, cote: "direction", actorId: input.actorId ?? null })
    .returning({ id: inMissions.id });

  const etapes: Etape[] = [];
  const niveau = (await autorise(autonomie, "READ")).niveauRequis;
  const n = await normaliser(objectif, input.pieces ?? []);
  etapes.push({
    etape: "comprendre",
    libelle: "Comprendre l'objectif et les pièces jointes",
    permission: "READ",
    capacite: null,
    statut: "fait",
    preuve: "demande lue",
    observe: [
      `Domaine identifié : ${domaine} (travail d'exploitation de la boutique).`,
      n.pieces.length === 0 ? "Aucune pièce jointe." : `${n.pieces.filter((p) => p.lue).length}/${n.pieces.length} pièce(s) réellement lue(s).`,
    ].join("\n"),
    dureeMs: 0,
    niveauRequis: niveau,
  });

  let reponse = "";
  let ok = false;
  let motif = "";
  let appels: { toolId: string; verdictPolitique: string; statutExecution: string | null; motif: string }[] = [];
  const t0 = Date.now();
  try {
    const { demander } = await import("./service.js");
    const r = await demander({
      question: n.texte,
      cote: "direction",
      mode: "travail",
      userId: input.actorId ?? null,
      role: input.role,
      countryCode: input.countryCode ?? null,
      images: n.images.length > 0 ? n.images : undefined,
    });
    ok = r.ok;
    reponse = r.reponse;
    motif = r.motif;
    appels = r.appelsOutils;
  } catch (e) {
    motif = `Travail interrompu : ${e instanceof Error ? e.message : "erreur inconnue"}`;
  }
  for (const a of appels) {
    const refuse = a.verdictPolitique === "refuse";
    const attente = a.verdictPolitique === "attente_approbation_humaine";
    const echec = a.statutExecution !== null && a.statutExecution !== "execute";
    etapes.push({
      etape: "outil",
      libelle: `Outil : ${a.toolId}`,
      permission: "READ",
      capacite: null,
      statut: refuse ? "refuse" : attente ? "en_attente_autorisation" : echec ? "echec" : "fait",
      preuve: refuse || attente || echec ? "" : `outil exécuté (${a.statutExecution ?? a.verdictPolitique})`,
      observe: a.motif || (a.statutExecution ?? a.verdictPolitique),
      dureeMs: 0,
      niveauRequis: niveau,
    });
  }
  etapes.push({
    etape: "travail",
    libelle: "Exécuter le travail et rendre compte",
    permission: "READ",
    capacite: null,
    statut: ok ? "fait" : "echec",
    preuve: ok ? `réponse du moteur de travail (${reponse.length} caractères, ${appels.length} outil(s) appelé(s))` : "",
    observe: ok ? reponse : `${motif || "Le moteur n'a pas répondu."}`,
    dureeMs: Date.now() - t0,
    niveauRequis: niveau,
  });

  const statut: Mission["statut"] = ok ? "accomplie" : "echouee";
  const arretSur = ok ? "" : "travail";
  const rapport = [`Objectif : ${objectif}`, `Domaine : ${domaine}.`, `${appels.length} outil(s) appelé(s).`, "", ok ? reponse : `Arrêt : ${motif}`].join("\n");
  await db
    .update(inMissions)
    .set({ statut, arretSur, motif: ok ? "" : motif, rapport, niveauRequis: niveau, niveauAccorde: niveau, dureeMs: Date.now() - debut })
    .where(eq(inMissions.id, ligne!.id));
  await db.insert(inMissionEtapes).values(
    etapes.map((e, i) => ({
      missionId: ligne!.id,
      rang: i + 1,
      etape: e.etape,
      libelle: e.libelle,
      statut: e.statut,
      capacite: e.capacite,
      permission: e.permission,
      niveauRequis: e.niveauRequis,
      observe: e.observe.slice(0, 20000),
      dureeMs: e.dureeMs,
    })),
  );
  const compteur = compter(etapes);
  const resume = [
    `Mission #${ligne!.id} : « ${tronque(objectif, 140)} » (travail d'exploitation de la boutique).`,
    `Travail réalisé : ${etapes.filter((e) => e.statut === "fait").length > 0 ? etapes.filter((e) => e.statut === "fait").map((e) => e.libelle).join(" ; ") : "aucune étape n'a abouti"}. ${phraseCompteur(compteur)}.`,
    ok ? "Le travail demandé a été rendu." : `Arrêt : ${tronque(motif, 300)}`,
    `Prochaine action : ${ok ? "Le propriétaire lit le compte rendu et décide de la suite." : "Corriger la cause indiquée puis relancer « continue »."}`,
  ].join("\n");
  return {
    id: ligne!.id,
    objectif,
    domaine,
    statut,
    arretSur,
    motif: ok ? "" : motif,
    rapport,
    resume,
    compteur,
    repriseDe: null,
    clarification: null,
    candidats: [],
    prochaineAction: ok ? "Le propriétaire lit le compte rendu et décide de la suite." : "Corriger la cause indiquée puis relancer « continue ».",
    devRequestId: null,
    pipelineRunId: null,
    testRunId: null,
    deploiementDemandeId: null,
    etapes: etapes.map(etapeVers),
  };
}
