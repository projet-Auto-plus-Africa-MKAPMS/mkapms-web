/**
 * MKA.P-MS AUTOMOTIVE KNOWLEDGE ENGINE (points 60, 61, 62, 63, 83, 87) —
 * tables isolées, préfixées `ake_`.
 *
 * Ce moteur n'est pas une copie d'Internet. Trois exigences le structurent :
 *
 *  • **Point 83 — la provenance est obligatoire.** Aucune connaissance n'existe
 *    sans source, licence, pays, fiabilité et date de dernière vérification.
 *    « Trouvé sur Internet » n'est pas une licence : c'est pour cela que
 *    `license` distingue explicitement `inconnue`, qui interdit la publication.
 *  • **Point 61 — connaissance ≠ publication.** Une découverte entre par
 *    `ake_discoveries` et attend une décision humaine (oui / non / plus tard /
 *    analyser davantage) avant de devenir du contenu.
 *  • **Point 63 — la mémoire est reliée.** `ake_nodes` + `ake_edges` forment un
 *    graphe partagé : ce que le moteur Pièces apprend est lisible par Garage, VO
 *    et Estimation, sans créer quatre bases contradictoires.
 *
 * Point 87 : aucune de ces tables ne stocke de modèle entraîné. La connaissance
 * est mise à jour par écriture de faits datés, pas par réentraînement.
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Point 62 — registre des sources externes autorisées.
 *
 * `authorization` porte la base juridique réelle de l'usage. Une source dont
 * l'autorisation est `interdite` ou `a_verifier` ne peut alimenter aucun nœud :
 * le moteur préfère ne rien savoir plutôt que d'absorber illégalement.
 */
export const akeSources = pgTable("ake_sources", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  /** Clé stable, ex. `google_search`, `constructeur_peugeot`, `mkapms_interne`. */
  code: varchar("code", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 160 }).notNull(),
  /**
   * "moteur_recherche" | "api" | "base_licence" | "constructeur" | "fournisseur"
   * | "documentation" | "donnees_publiques" | "tendances" | "reglementation"
   * | "reseau_social" | "mkapms"
   */
  kind: varchar("kind", { length: 32 }).notNull(),
  /** Portée : code pays ISO, ou null quand la source est mondiale. */
  countryCode: varchar("country_code", { length: 4 }),
  /** "publique" | "api_officielle" | "licence" | "propriete_mkapms" | "a_verifier" | "interdite" */
  authorization: varchar("authorization", { length: 24 }).notNull().default("a_verifier"),
  /** Référence du contrat / des conditions d'utilisation acceptées. */
  authorizationRef: text("authorization_ref"),
  apiEndpoint: text("api_endpoint"),
  /** Limite d'appels déclarée par le fournisseur, telle quelle. */
  rateLimit: varchar("rate_limit", { length: 120 }),
  /** Fiabilité constatée (0-100), null tant qu'aucune vérification n'a eu lieu. */
  reliability: integer("reliability"),
  /** "non_configure" | "actif" | "suspendu" | "erreur" | "interdit" */
  status: varchar("status", { length: 20 }).notNull().default("non_configure"),
  lastSyncAt: timestamp("last_sync_at"),
  lastSyncDetail: text("last_sync_detail"),
  /** Vrai uniquement si une synchronisation réelle a déjà abouti. */
  everSynced: boolean("ever_synced").notNull().default(false),
  declaredBy: integer("declared_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Points 60 & 63 — nœud de connaissance automobile.
 *
 * `domain` couvre l'ensemble des domaines demandés (véhicule, moteur,
 * diagnostic, ADAS, réglementation, technologie émergente…) sans se limiter aux
 * services actuellement vendus : une connaissance peut être utile avant que le
 * service existe.
 */
export const akeNodes = pgTable("ake_nodes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  domain: varchar("domain", { length: 40 }).notNull(),
  /** Sous-type dans le domaine, ex. `marque`, `modele`, `motorisation`, `panne`. */
  kind: varchar("kind", { length: 40 }).notNull(),
  label: varchar("label", { length: 240 }).notNull(),
  /** Signature normalisée `domain|kind|label` : empêche les doublons. */
  signature: varchar("signature", { length: 400 }).notNull().unique(),
  summary: text("summary"),
  attributes: jsonb("attributes").$type<Record<string, unknown>>().notNull().default({}),
  /** Null = connaissance non territoriale. Jamais rempli par défaut (point 65). */
  countryCode: varchar("country_code", { length: 4 }),
  /**
   * Point 82 — classement de propriété :
   * "publique" | "licence" | "mkapms" | "fournisseur" | "confidentielle"
   */
  dataClass: varchar("data_class", { length: 20 }).notNull().default("publique"),
  /** Nombre de fois où le fait a été constaté : un fait vu une fois reste faible. */
  observations: integer("observations").notNull().default(1),
  /** "propose" | "confirme" | "conteste" | "obsolete" */
  status: varchar("status", { length: 16 }).notNull().default("propose"),
  /** Moteur qui a appris le fait, pour savoir qui interroger en cas de doute. */
  learnedByEngine: varchar("learned_by_engine", { length: 48 }),
  lastVerifiedAt: timestamp("last_verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Point 63 — relation entre deux nœuds (`Peugeot → 208 → motorisation → pièce`).
 * La relation porte aussi sa provenance : un lien de compatibilité affirmé sans
 * source ne vaut pas un lien issu du catalogue de pièces de la plateforme.
 */
export const akeEdges = pgTable("ake_edges", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  fromNodeId: integer("from_node_id").notNull(),
  toNodeId: integer("to_node_id").notNull(),
  /**
   * "appartient_a" | "motorise_par" | "compatible_avec" | "panne_connue"
   * | "entretien" | "diagnostic" | "documente_par" | "service_mkapms"
   * | "reglemente_par" | "remplace" | "concerne"
   */
  relation: varchar("relation", { length: 32 }).notNull(),
  signature: varchar("signature", { length: 400 }).notNull().unique(),
  /** Comment le lien a été établi : `catalogue`, `annonces`, `manuel`, `source`. */
  origin: varchar("origin", { length: 32 }).notNull().default("manuel"),
  confidence: integer("confidence"),
  attributes: jsonb("attributes").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 83 — provenance d'une connaissance. Plusieurs sources peuvent confirmer
 * le même nœud : chacune garde sa licence et sa date de vérification propre.
 */
export const akeProvenance = pgTable("ake_provenance", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nodeId: integer("node_id").notNull(),
  sourceCode: varchar("source_code", { length: 64 }).notNull(),
  sourceRef: text("source_ref"),
  /** "publique" | "licence" | "propriete_mkapms" | "fournisseur" | "inconnue" */
  license: varchar("license", { length: 24 }).notNull().default("inconnue"),
  licenseRef: text("license_ref"),
  countryCode: varchar("country_code", { length: 4 }),
  reliability: integer("reliability"),
  observedAt: timestamp("observed_at").notNull().defaultNow(),
  lastCheckedAt: timestamp("last_checked_at"),
  /** Moteur ayant enregistré cette provenance. */
  learnedByEngine: varchar("learned_by_engine", { length: 48 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 61 — cycle découverte → enregistrement → analyse → proposition PDG.
 * Une découverte n'est jamais publiée par le système : `decision` reste `attente`
 * jusqu'à une décision humaine, et `plus_tard` / `analyser` la gardent vivante
 * au lieu de la faire disparaître.
 */
export const akeDiscoveries = pgTable("ake_discoveries", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: varchar("title", { length: 240 }).notNull(),
  domain: varchar("domain", { length: 40 }).notNull(),
  detail: text("detail"),
  /** Pourquoi cela pourrait intéresser MKA.P-MS, avec les faits constatés. */
  interest: text("interest"),
  /** Service ou univers potentiellement concerné, s'il en existe un. */
  relatedService: varchar("related_service", { length: 64 }),
  countryCode: varchar("country_code", { length: 4 }),
  sourceCode: varchar("source_code", { length: 64 }),
  sourceRef: text("source_ref"),
  /** "critique" | "important" | "opportunite" | "information" (point 64) */
  classification: varchar("classification", { length: 16 }).notNull().default("information"),
  evidence: jsonb("evidence").$type<Record<string, unknown>>().notNull().default({}),
  nodeId: integer("node_id"),
  signature: varchar("signature", { length: 400 }).notNull().unique(),
  /** "attente" | "oui" | "non" | "plus_tard" | "analyser" */
  decision: varchar("decision", { length: 16 }).notNull().default("attente"),
  decisionNote: text("decision_note"),
  decidedBy: integer("decided_by"),
  decidedAt: timestamp("decided_at"),
  /** Tâche créée quand le PDG répond « oui » (point 69). */
  actionTaskId: integer("action_task_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
