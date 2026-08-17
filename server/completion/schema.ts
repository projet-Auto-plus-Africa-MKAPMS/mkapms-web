/**
 * Points 119-120-121 — définition de TERMINÉ, rapports obligatoires,
 * Completion Center.
 *
 * Tables isolées, préfixe `cp_`. Aucune table existante n'est touchée.
 */
import {
  bigserial,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Une photographie datée de ce qui est terminé et de ce qui reste. */
export const cpSnapshots = pgTable("cp_snapshots", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  trigger: varchar("trigger", { length: 24 }).notNull().default("manuel"),
  requestedBy: integer("requested_by"),
  /** Nombre de domaines métier examinés. */
  domaines: integer("domaines").notNull().default(0),
  termines: integer("termines").notNull().default(0),
  /** Moyenne calculée des maillons prouvés — jamais saisie à la main. */
  avancement: integer("avancement").notNull().default(0),
  detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
});

/**
 * Verdict par domaine métier : les 9 maillons de la règle TERMINÉ, prouvés ou
 * manquants. Un maillon absent suffit à écrire PAS TERMINÉ.
 */
export const cpDomainVerdicts = pgTable("cp_domain_verdicts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  snapshotId: integer("snapshot_id").notNull(),
  domaine: varchar("domaine", { length: 48 }).notNull(),
  label: varchar("label", { length: 160 }).notNull(),
  termine: boolean("termine").notNull().default(false),
  avancement: integer("avancement").notNull().default(0),
  maillons: jsonb("maillons").$type<Record<string, boolean>>().default({}),
  manquant: jsonb("manquant").$type<string[]>().default([]),
  dependancesManquantes: jsonb("dependances_manquantes").$type<string[]>().default([]),
  restant: jsonb("restant").$type<string[]>().default([]),
  motif: text("motif").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Point 120 — rapport obligatoire de fin de travail. Les champs calculables
 * (tests, régressions, Système Intelligent informé, rollback, statut final)
 * sont remplis par la plateforme, pas déclarés par l'auteur du travail.
 */
export const cpWorkReports = pgTable("cp_work_reports", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  tache: text("tache").notNull(),
  domaine: varchar("domaine", { length: 48 }),
  existant: text("existant").notNull().default(""),
  modifie: text("modifie").notNull().default(""),
  active: text("active").notNull().default(""),
  moteursConnectes: jsonb("moteurs_connectes").$type<string[]>().default([]),
  testsExecutes: integer("tests_executes").notNull().default(0),
  testsReussis: integer("tests_reussis").notNull().default(0),
  regressions: jsonb("regressions").$type<string[]>().default([]),
  dependancesManquantes: jsonb("dependances_manquantes").$type<string[]>().default([]),
  seoConcerne: text("seo_concerne").notNull().default(""),
  paysConcernes: jsonb("pays_concernes").$type<string[]>().default([]),
  paiementConcerne: boolean("paiement_concerne").notNull().default(false),
  systemeInformer: boolean("systeme_informe").notNull().default(false),
  rollbackDisponible: boolean("rollback_disponible").notNull().default(false),
  /** "termine" | "pas_termine" — calculé selon la règle du point 119. */
  statutFinal: varchar("statut_final", { length: 16 }).notNull().default("pas_termine"),
  motif: text("motif").notNull().default(""),
  auteur: varchar("auteur", { length: 64 }).notNull().default("agent"),
  requestedBy: integer("requested_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
