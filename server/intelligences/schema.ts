/**
 * MKA.P-MS Intelligences — persistance propre au moteur.
 *
 * Deux côtés strictement séparés dans la même table par la colonne `cote` :
 *  - `direction` : le PDG. Contexte interne autorisé, commandes, code.
 *  - `public`    : les utilisateurs. Assistant automobile encadré, aucun accès
 *                  aux données internes.
 *
 * Rien ici ne duplique la mémoire du Système Intelligent ni le journal d'audit :
 * ces tables ne portent que les échanges Intelligence et leur consommation.
 */
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const inSessions = pgTable("in_sessions", {
  id: serial("id").primaryKey(),
  cote: varchar("cote", { length: 16 }).notNull().default("public"),
  titre: varchar("titre", { length: 200 }).notNull().default(""),
  userId: integer("user_id"),
  /** Empreinte du visiteur non connecté, pour les quotas. Jamais l'IP en clair. */
  visiteur: varchar("visiteur", { length: 64 }),
  countryCode: varchar("country_code", { length: 8 }),
  langue: varchar("langue", { length: 8 }).notNull().default("fr"),
  messages: integer("messages").notNull().default(0),
  dernierAt: timestamp("dernier_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const inMessages = pgTable("in_messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: integer("session_id").notNull(),
  cote: varchar("cote", { length: 16 }).notNull().default("public"),
  role: varchar("role", { length: 16 }).notNull(),
  contenu: text("contenu").notNull().default(""),
  /** Fournisseur et modèle réellement utilisés, ou null quand rien n'a répondu. */
  fournisseur: varchar("fournisseur", { length: 48 }),
  modele: varchar("modele", { length: 64 }),
  ok: boolean("ok").notNull().default(true),
  motif: text("motif").notNull().default(""),
  jetonsEntree: integer("jetons_entree").notNull().default(0),
  jetonsSortie: integer("jetons_sortie").notNull().default(0),
  dureeMs: integer("duree_ms").notNull().default(0),
  /** Éléments de contexte réellement injectés : traçabilité de ce qu'a vu le modèle. */
  contexte: jsonb("contexte").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Consommation par jour et par côté : le coût reste visible avant la facture. */
export const inUsage = pgTable("in_usage", {
  id: serial("id").primaryKey(),
  jour: varchar("jour", { length: 10 }).notNull(),
  cote: varchar("cote", { length: 16 }).notNull(),
  appels: integer("appels").notNull().default(0),
  echecs: integer("echecs").notNull().default(0),
  jetons: integer("jetons").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Commandes exécutées depuis Intelligence. La table ne réimplémente pas le
 * Centre de Commandes : elle enregistre le rattachement (dossier, passage de
 * pipeline) afin qu'aucune action ne parte sans trace côté Intelligence.
 */
export const inActions = pgTable("in_actions", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id"),
  commande: varchar("commande", { length: 48 }).notNull(),
  argument: text("argument").notNull().default(""),
  resultat: varchar("resultat", { length: 16 }).notNull().default("propose"),
  detail: text("detail").notNull().default(""),
  devRequestId: integer("dev_request_id"),
  pipelineRunId: integer("pipeline_run_id"),
  actorId: integer("actor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 132 — niveau d'autonomie par domaine. Les capacités sont construites au
 * maximum ; ce curseur décide de ce qui peut réellement s'exécuter. Une ligne
 * absente vaut le niveau par défaut (proposition), jamais l'exécution.
 */
export const inAutonomie = pgTable("in_autonomie", {
  id: serial("id").primaryKey(),
  domaine: varchar("domaine", { length: 48 }).notNull().unique(),
  niveau: integer("niveau").notNull().default(2),
  motif: text("motif").notNull().default(""),
  actorId: integer("actor_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Journal des changements de curseur : qui a monté le niveau, quand, pourquoi. */
export const inAutonomieJournal = pgTable("in_autonomie_journal", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  domaine: varchar("domaine", { length: 48 }).notNull(),
  avant: integer("avant").notNull(),
  apres: integer("apres").notNull(),
  motif: text("motif").notNull().default(""),
  actorId: integer("actor_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 130 — missions de l'orchestrateur. Un objectif reçu devient un plan
 * décomposé, exécuté jusqu'à la limite de permission et d'autonomie ; la
 * mission s'arrête en nommant l'étape et la raison, elle ne se déclare jamais
 * accomplie parce que le plan existait.
 */
export const inMissions = pgTable("in_missions", {
  id: serial("id").primaryKey(),
  objectif: text("objectif").notNull(),
  domaine: varchar("domaine", { length: 48 }).notNull().default("inconnu"),
  cote: varchar("cote", { length: 16 }).notNull().default("direction"),
  statut: varchar("statut", { length: 32 }).notNull().default("en_cours"),
  /** Étape sur laquelle la mission s'est arrêtée, quand elle s'est arrêtée. */
  arretSur: varchar("arret_sur", { length: 48 }).notNull().default(""),
  motif: text("motif").notNull().default(""),
  rapport: text("rapport").notNull().default(""),
  niveauRequis: integer("niveau_requis").notNull().default(1),
  niveauAccorde: integer("niveau_accorde").notNull().default(0),
  devRequestId: integer("dev_request_id"),
  pipelineRunId: integer("pipeline_run_id"),
  testRunId: integer("test_run_id"),
  actorId: integer("actor_id"),
  dureeMs: integer("duree_ms").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 134 — mémoire MKA.P-MS à grande capacité, indépendante des fournisseurs.
 *
 * Cette table n'héberge que les catégories qui n'ont pas déjà un moteur
 * propriétaire (mémoire entreprise, décisions, projets, recherche…). Les
 * catégories déjà tenues ailleurs — code, moteurs, automobile, erreurs —
 * restent chez leur moteur et sont seulement indexées par `memoire.ts` : la
 * mémoire est fédérée, pas recopiée.
 */
export const inMemoire = pgTable(
  "in_memoire",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    categorie: varchar("categorie", { length: 32 }).notNull(),
    /** `actif`, `historique`, `archive` — le cycle du point 134. */
    cycle: varchar("cycle", { length: 16 }).notNull().default("actif"),
    cle: varchar("cle", { length: 200 }).notNull().default(""),
    titre: varchar("titre", { length: 240 }).notNull().default(""),
    contenu: text("contenu").notNull().default(""),
    /** Mots-clés extraits : recherche utilisable sans dépendre d'un fournisseur. */
    motsCles: jsonb("mots_cles").$type<string[]>().notNull().default([]),
    /** Rattachements au graphe de connaissances (moteur, pays, mission, dossier). */
    liens: jsonb("liens").$type<Record<string, string>>().notNull().default({}),
    source: varchar("source", { length: 64 }).notNull().default("intelligences"),
    countryCode: varchar("country_code", { length: 8 }),
    poids: integer("poids").notNull().default(1),
    rappels: integer("rappels").notNull().default(0),
    actorId: integer("actor_id"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    parCategorie: index("in_memoire_categorie_idx").on(t.categorie, t.cycle),
    parCle: index("in_memoire_cle_idx").on(t.cle),
  }),
);

/**
 * Point 139 — apprentissage après chaque action. Une mission terminée devient
 * une expérience réutilisable : signature du problème, diagnostic, solution,
 * résultat constaté. La prochaine mission consulte cette table avant de
 * repartir de zéro.
 */
export const inExperiences = pgTable(
  "in_experiences",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Empreinte stable du problème : sert à retrouver le même cas plus tard. */
    signature: varchar("signature", { length: 160 }).notNull(),
    domaine: varchar("domaine", { length: 48 }).notNull().default("inconnu"),
    probleme: text("probleme").notNull().default(""),
    diagnostic: text("diagnostic").notNull().default(""),
    solution: text("solution").notNull().default(""),
    resultat: varchar("resultat", { length: 32 }).notNull().default("inconnu"),
    /** Ce qui a bloqué, quand ça a bloqué : l'échec est une leçon, pas un oubli. */
    blocage: text("blocage").notNull().default(""),
    missionId: integer("mission_id"),
    testRunId: integer("test_run_id"),
    devRequestId: integer("dev_request_id"),
    occurrences: integer("occurrences").notNull().default(1),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    parSignature: index("in_experiences_signature_idx").on(t.signature),
    parDomaine: index("in_experiences_domaine_idx").on(t.domaine),
  }),
);

export const inMissionEtapes = pgTable("in_mission_etapes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  missionId: integer("mission_id").notNull(),
  rang: integer("rang").notNull(),
  etape: varchar("etape", { length: 48 }).notNull(),
  libelle: varchar("libelle", { length: 160 }).notNull().default(""),
  /** `fait`, `refuse`, `en_attente_autorisation`, `non_execute`, `echec`. */
  statut: varchar("statut", { length: 32 }).notNull().default("non_execute"),
  capacite: varchar("capacite", { length: 32 }),
  permission: varchar("permission", { length: 24 }),
  niveauRequis: integer("niveau_requis").notNull().default(1),
  observe: text("observe").notNull().default(""),
  dureeMs: integer("duree_ms").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 146 — attribution des permissions techniques.
 *
 * Les neuf permissions existent toutes ; ce n'est pas une raison pour les
 * donner à tout le monde. Cette table porte les attributions décidées par le
 * PDG, par rôle **et** par moteur : un moteur Image n'a pas de raison d'obtenir
 * FINANCIAL, même si la permission existe. Une ligne absente vaut le défaut
 * codé, jamais « tout autorisé ».
 */
export const inPermissions = pgTable(
  "in_permissions",
  {
    id: serial("id").primaryKey(),
    /** `role` ou `moteur`. */
    portee: varchar("portee", { length: 16 }).notNull(),
    cible: varchar("cible", { length: 64 }).notNull(),
    permissions: jsonb("permissions").$type<string[]>().notNull().default([]),
    motif: text("motif").notNull().default(""),
    actorId: integer("actor_id"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    parCible: index("in_permissions_cible_idx").on(t.portee, t.cible),
  }),
);

/**
 * Point 145 — état d'activation d'une capacité, décidé par le propriétaire.
 *
 * Distinct de l'état *constaté* (fournisseur joignable ou non) : ici c'est une
 * décision humaine. Une capacité désactivée par le PDG est refusée par le
 * routeur même si le fournisseur répond parfaitement.
 */
export const inCapaciteEtat = pgTable("in_capacite_etat", {
  id: serial("id").primaryKey(),
  capacite: varchar("capacite", { length: 32 }).notNull().unique(),
  actif: boolean("actif").notNull().default(true),
  /** Fournisseur imposé par le PDG, ou null pour laisser le routage décider. */
  fournisseurImpose: varchar("fournisseur_impose", { length: 48 }),
  motif: text("motif").notNull().default(""),
  actorId: integer("actor_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Point 148 — mesure de chaque appel réellement passé à un fournisseur.
 *
 * Sans cette table, « ce moteur est meilleur » resterait une impression. La
 * qualité, elle, n'est pas déduite : elle vient d'une note humaine (`note`) ou
 * d'une comparaison shadow. Un critère sans mesure reste non mesuré.
 */
export const inAppels = pgTable(
  "in_appels",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    capacite: varchar("capacite", { length: 32 }).notNull(),
    tache: varchar("tache", { length: 64 }).notNull().default(""),
    moteur: varchar("moteur", { length: 64 }).notNull().default(""),
    fournisseur: varchar("fournisseur", { length: 48 }),
    /** `principal`, `repli` ou `candidat` (moteur MKA.P-MS en observation). */
    rang: varchar("rang", { length: 16 }).notNull().default("principal"),
    ok: boolean("ok").notNull().default(false),
    dureeMs: integer("duree_ms").notNull().default(0),
    jetonsEntree: integer("jetons_entree").notNull().default(0),
    jetonsSortie: integer("jetons_sortie").notNull().default(0),
    /** Coût en centimes quand le tarif du fournisseur est renseigné. */
    coutCents: integer("cout_cents").notNull().default(0),
    coutMesure: boolean("cout_mesure").notNull().default(false),
    motif: text("motif").notNull().default(""),
    /** Note de qualité 1-5 donnée par un humain ; null = qualité non jugée. */
    note: integer("note"),
    noteActorId: integer("note_actor_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    parCapacite: index("in_appels_capacite_idx").on(t.capacite, t.createdAt),
    parFournisseur: index("in_appels_fournisseur_idx").on(t.fournisseur, t.createdAt),
  }),
);

/**
 * Point 149 — mode shadow : le moteur MKA.P-MS candidat reçoit la même mission
 * que le fournisseur en place, sans être exposé au client.
 *
 * `part` est le pourcentage de trafic réellement servi par le candidat. Elle ne
 * monte que par paliers (10, 25, 50, 100) et seulement sur preuve : le
 * remplacement se mérite, il ne se décrète pas.
 */
export const inShadow = pgTable("in_shadow", {
  id: serial("id").primaryKey(),
  capacite: varchar("capacite", { length: 32 }).notNull().unique(),
  /** Fournisseur ou moteur candidat observé (ex. `modele_local`). */
  candidat: varchar("candidat", { length: 48 }).notNull(),
  /** Observation en parallèle active. */
  actif: boolean("actif").notNull().default(false),
  /** 0, 10, 25, 50 ou 100 — part du trafic réellement confiée au candidat. */
  part: integer("part").notNull().default(0),
  motif: text("motif").notNull().default(""),
  actorId: integer("actor_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Comparaisons shadow : une mission, deux exécutions, un écart mesuré. */
export const inShadowRuns = pgTable(
  "in_shadow_runs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    capacite: varchar("capacite", { length: 32 }).notNull(),
    tache: varchar("tache", { length: 64 }).notNull().default(""),
    fournisseur: varchar("fournisseur", { length: 48 }),
    candidat: varchar("candidat", { length: 48 }).notNull(),
    okFournisseur: boolean("ok_fournisseur").notNull().default(false),
    okCandidat: boolean("ok_candidat").notNull().default(false),
    dureeFournisseurMs: integer("duree_fournisseur_ms").notNull().default(0),
    dureeCandidatMs: integer("duree_candidat_ms").notNull().default(0),
    /** Proximité des deux réponses, 0 à 100. Null quand l'une manque. */
    similarite: integer("similarite"),
    /** `equivalent`, `candidat_faible`, `candidat_meilleur`, `candidat_absent`. */
    verdict: varchar("verdict", { length: 24 }).notNull().default("candidat_absent"),
    motifCandidat: text("motif_candidat").notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    parCapacite: index("in_shadow_runs_capacite_idx").on(t.capacite, t.createdAt),
  }),
);

/**
 * Fonctionnalités natives du fournisseur connecté, construites au maximum mais
 * **éteintes par défaut**. Le propriétaire les allume une par une : une
 * fonctionnalité activée sans avoir été essayée est une facture et un risque,
 * pas un progrès.
 */
export const inFonctions = pgTable("in_fonctions", {
  id: serial("id").primaryKey(),
  fonction: varchar("fonction", { length: 48 }).notNull().unique(),
  active: boolean("active").notNull().default(false),
  motif: text("motif").notNull().default(""),
  actorId: integer("actor_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Point 151 — plateforme développeur. Une clé n'ouvre que les capacités de sa
 * portée, jamais le catalogue entier, et son secret n'est jamais conservé en
 * clair : seule son empreinte est stockée.
 */
export const inDevCles = pgTable(
  "in_dev_cles",
  {
    id: serial("id").primaryKey(),
    nom: varchar("nom", { length: 80 }).notNull(),
    /** Préfixe lisible, affiché pour reconnaître la clé sans la révéler. */
    prefixe: varchar("prefixe", { length: 16 }).notNull(),
    empreinte: varchar("empreinte", { length: 64 }).notNull().unique(),
    /** Capacités ouvertes à cette clé. */
    portee: jsonb("portee").$type<string[]>().notNull().default([]),
    /** Rôle appliqué aux appels de la clé : ses permissions plafonnent tout. */
    role: varchar("role", { length: 24 }).notNull().default("user"),
    /** Plafond d'appels par jour ; 0 = clé fermée. */
    quotaJour: integer("quota_jour").notNull().default(0),
    active: boolean("active").notNull().default(false),
    motif: text("motif").notNull().default(""),
    actorId: integer("actor_id"),
    dernierUsage: timestamp("dernier_usage"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    parEmpreinte: index("in_dev_cles_empreinte_idx").on(t.empreinte),
  }),
);

/** Appels reçus par la plateforme développeur : usage, quota et refus tracés. */
export const inDevAppels = pgTable(
  "in_dev_appels",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    cleId: integer("cle_id").notNull(),
    capacite: varchar("capacite", { length: 32 }).notNull().default(""),
    ok: boolean("ok").notNull().default(false),
    motif: text("motif").notNull().default(""),
    dureeMs: integer("duree_ms").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    parCle: index("in_dev_appels_cle_idx").on(t.cleId, t.createdAt),
  }),
);

/** Point 150 — étapes du plan de détachement des fournisseurs, décidées par le PDG. */
export const inPlanAutonomie = pgTable("in_plan_autonomie", {
  id: serial("id").primaryKey(),
  etape: varchar("etape", { length: 48 }).notNull().unique(),
  /** `attente`, `en_cours`, `atteinte`, `abandonnee`. */
  statut: varchar("statut", { length: 16 }).notNull().default("attente"),
  motif: text("motif").notNull().default(""),
  actorId: integer("actor_id"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
