/**
 * Points 79-80-81-82 — MKA.P-MS AUTOMOTIVE R&D LAB.
 *
 * Laboratoire **séparé des services commerciaux** : aucune de ces tables n'est
 * lue par une page publique, et rien de ce qui est déposé ici n'est publié.
 *
 * Un choix assumé : le laboratoire n'a pas sa propre mémoire automobile. Une
 * connaissance versée au graphe va dans `ake_nodes` (point 63), pour ne pas
 * créer une deuxième base contradictoire. Le lab garde en revanche ce qui lui
 * est propre : ses projets, ses chaînes industrielles et le registre des actifs
 * avec leur droit d'utilisation (point 82).
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
 * Point 79 — projet du laboratoire. Il ne touche à aucun service vendu :
 * `confidentiality` dit à quel point il doit rester interne.
 */
export const rdProjects = pgTable("rd_projects", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 48 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  /** Branche du lab : `vehicule`, `electronique`, `navigation`, `calculateurs`… */
  branch: varchar("branch", { length: 32 }).notNull(),
  /** Domaine précis dans la branche (voir `RD_DOMAINS`). */
  domain: varchar("domain", { length: 48 }).notNull(),
  objective: text("objective").notNull(),
  /** Null = projet non territorial. Jamais rempli par défaut. */
  countryCode: varchar("country_code", { length: 4 }),
  /** "interne" | "confidentiel" | "secret" */
  confidentiality: varchar("confidentiality", { length: 16 }).notNull().default("confidentiel"),
  /** "etude" | "en_cours" | "pause" | "archive" */
  status: varchar("status", { length: 12 }).notNull().default("etude"),
  notes: text("notes"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Point 80 — chaîne industrielle d'un projet. Chaque maillon est soit
 * renseigné avec ses faits, soit **manquant** : un maillon vide n'est jamais
 * présenté comme acquis, sinon le laboratoire donnerait l'illusion d'un
 * véhicule étudié de bout en bout.
 */
export const rdChainLinks = pgTable("rd_chain_links", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  projectId: integer("project_id").notNull(),
  /** Maillon de `INDUSTRIAL_CHAIN` (besoin_client → … → tests). */
  link: varchar("link", { length: 32 }).notNull(),
  /** Signature `projectId|link` : un maillon n'existe qu'une fois par projet. */
  signature: varchar("signature", { length: 120 }).notNull().unique(),
  content: text("content").notNull(),
  /** Ce sur quoi le maillon s'appuie : source, mesure, devis, norme. */
  evidence: text("evidence"),
  /** Nœud du graphe automobile quand le maillon s'appuie sur une connaissance versée. */
  nodeId: integer("node_id"),
  /** "renseigne" | "a_confirmer" */
  status: varchar("status", { length: 16 }).notNull().default("a_confirmer"),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Points 82 & 83 — actif de connaissance déclaré au laboratoire.
 *
 * `dataClass` et `license` sont ce qui autorise, ou non, le versement au graphe
 * partagé. Une documentation constructeur sous licence ou une donnée
 * fournisseur confidentielle reste dans le lab : elle n'est jamais absorbée
 * comme si elle était publique.
 */
export const rdAssets = pgTable("rd_assets", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: varchar("title", { length: 240 }).notNull(),
  branch: varchar("branch", { length: 32 }).notNull(),
  domain: varchar("domain", { length: 48 }).notNull(),
  summary: text("summary"),
  /** "publique" | "licence" | "mkapms" | "fournisseur" | "confidentielle" */
  dataClass: varchar("data_class", { length: 20 }).notNull(),
  /** "publique" | "licence" | "propriete_mkapms" | "fournisseur" | "inconnue" */
  license: varchar("license", { length: 24 }).notNull().default("inconnue"),
  licenseRef: text("license_ref"),
  sourceLabel: varchar("source_label", { length: 160 }),
  sourceRef: text("source_ref"),
  supplier: varchar("supplier", { length: 160 }),
  countryCode: varchar("country_code", { length: 4 }),
  projectId: integer("project_id"),
  /** Vrai seulement si le droit d'usage est réellement établi. */
  shareable: boolean("shareable").notNull().default(false),
  /** Nœud créé dans `ake_nodes` si l'actif a été versé au graphe partagé. */
  nodeId: integer("node_id"),
  blockedReason: text("blocked_reason"),
  declaredBy: integer("declared_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Point 81 — relevé daté de ce que la plateforme peut déjà fournir à un futur
 * système embarqué, par pays. Ce sont des comptages réels : garages validés,
 * bornes de recharge publiées, services actifs. Aucune carte, aucun trafic ni
 * itinéraire n'est compté tant qu'aucune licence cartographique n'existe.
 */
export const rdEcosystemSnapshots = pgTable("rd_ecosystem_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  countryCode: varchar("country_code", { length: 4 }).notNull(),
  counts: jsonb("counts").$type<Record<string, number>>().notNull().default({}),
  /** Briques encore absentes, nommées : cartographie, trafic, itinéraires… */
  missing: jsonb("missing").$type<string[]>().notNull().default([]),
  detail: text("detail"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
