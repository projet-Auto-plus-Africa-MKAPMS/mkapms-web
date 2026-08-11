/**
 * Points 84-85-86-88 — couche d'abstraction des fournisseurs externes,
 * traçabilité des routages, coûts, et sauvegarde de la mémoire intelligente.
 *
 * Tables strictement additives, propres à cette couche. Aucun secret n'est
 * stocké ici : seuls les NOMS des variables d'environnement attendues, jamais
 * leur valeur (`af_providers.env_keys`).
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
 * Point 84-85 — fournisseurs externes par capacité.
 *
 * `status` n'est jamais déclaré à la main : il est recalculé depuis la présence
 * réelle des variables d'environnement et depuis un usage réellement constaté.
 * Un fournisseur ne peut donc pas apparaître « actif » sans preuve.
 */
export const afProviders = pgTable("af_providers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  code: varchar("code", { length: 48 }).notNull().unique(),
  label: varchar("label", { length: 120 }).notNull(),
  /** Capacité rendue : ia_texte, hebergement, paiement, cartographie… */
  capability: varchar("capability", { length: 32 }).notNull(),
  /** Noms des variables d'environnement attendues — jamais les valeurs. */
  envKeys: jsonb("env_keys").$type<string[]>().notNull().default([]),
  /** non_configure | configure | actif | suspendu */
  status: varchar("status", { length: 16 }).notNull().default("non_configure"),
  /** Pays ou zone où la donnée est traitée ; null = non documenté. */
  dataResidency: varchar("data_residency", { length: 64 }),
  /** Classe de confidentialité maximale acceptée par ce fournisseur. */
  confidentialityMax: varchar("confidentiality_max", { length: 16 })
    .notNull()
    .default("publique"),
  /** Coût unitaire déclaré en centimes ; null = non renseigné, pas gratuit. */
  unitCostCents: integer("unit_cost_cents"),
  unitLabel: varchar("unit_label", { length: 40 }),
  /** Ce qu'il faudrait refaire pour en changer — mesure du verrouillage. */
  switchingNote: text("switching_note"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Point 85 — chaque demande de routage laisse une trace, y compris les refus.
 * Un refus non journalisé donnerait l'impression d'un système muet.
 */
export const afRoutes = pgTable("af_routes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  capability: varchar("capability", { length: 32 }).notNull(),
  taskType: varchar("task_type", { length: 64 }).notNull(),
  engine: varchar("engine", { length: 48 }),
  countryCode: varchar("country_code", { length: 4 }),
  confidentiality: varchar("confidentiality", { length: 16 }).notNull().default("publique"),
  /** route | aucun_fournisseur | refus_confidentialite | refus_pays | refus_capacite */
  verdict: varchar("verdict", { length: 24 }).notNull(),
  providerCode: varchar("provider_code", { length: 48 }),
  reason: text("reason").notNull(),
  candidates: jsonb("candidates").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 86 — coûts et économie. `manualOpsAvoided` est un nombre DÉCLARÉ par
 * l'appelant : il n'est jamais estimé par le système, pour ne pas transformer
 * une hypothèse en économie affichée.
 */
export const afCostEntries = pgTable("af_cost_entries", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  engine: varchar("engine", { length: 48 }).notNull(),
  taskType: varchar("task_type", { length: 64 }).notNull(),
  providerCode: varchar("provider_code", { length: 48 }),
  capability: varchar("capability", { length: 32 }).notNull(),
  units: integer("units").notNull().default(1),
  unitLabel: varchar("unit_label", { length: 40 }),
  costCents: integer("cost_cents").notNull().default(0),
  /** Coût mesuré chez le fournisseur, ou seulement estimé côté MKA.P-MS. */
  measured: boolean("measured").notNull().default(false),
  manualOpsAvoided: integer("manual_ops_avoided"),
  countryCode: varchar("country_code", { length: 4 }),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 88 — sauvegardes de la mémoire intelligente.
 *
 * La ligne référence la sauvegarde du Backup OS (`snapshot_id`) : cette couche
 * ne crée pas un second système de sauvegarde, elle cible le périmètre mémoire
 * et y ajoute une empreinte d'intégrité et une version.
 */
export const afMemoryBackups = pgTable("af_memory_backups", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  snapshotId: integer("snapshot_id"),
  version: integer("version").notNull().default(1),
  scope: jsonb("scope").$type<string[]>().notNull().default([]),
  rowCounts: jsonb("row_counts").$type<Record<string, number>>().notNull().default({}),
  totalRows: integer("total_rows").notNull().default(0),
  /** Empreinte du manifeste : détecte une altération de l'enregistrement. */
  checksum: varchar("checksum", { length: 64 }).notNull(),
  /** intacte | alteree | non_verifiee */
  integrity: varchar("integrity", { length: 16 }).notNull().default("non_verifiee"),
  verifiedAt: timestamp("verified_at"),
  note: text("note"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
