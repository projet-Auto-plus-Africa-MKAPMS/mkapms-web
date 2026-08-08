/**
 * MKA.P-MS Pro Portal Engine — schéma isolé (tables `pro_portal_*`).
 *
 * Le portail professionnel est piloté par la donnée : un nouveau métier ou un
 * nouveau service se déclare en base, sans reconstruire le parcours.
 *
 * Aucune écriture dans les tables d'un autre moteur. Les prix ne vivent pas
 * ici : un module pointe vers un code produit du registre central des tarifs
 * (Payment Engine), seule source de vérité des montants.
 */
import {
  pgTable,
  bigserial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

/** Métiers professionnels proposés à l'entrée du portail .pro. */
export const proPortalProfessions = pgTable(
  "pro_portal_professions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    code: varchar("code", { length: 48 }).notNull().unique(),
    label: varchar("label", { length: 120 }).notNull(),
    description: text("description"),
    /** Famille d'affichage : vehicule, atelier, service, transport, gestion. */
    family: varchar("family", { length: 32 }).notNull().default("service"),
    /** Modules pré-cochés à l'arrivée sur l'étape « besoins ». */
    defaultModules: jsonb("default_modules").$type<string[]>().default([]).notNull(),
    /** Modules indispensables au métier : non décochables. */
    requiredModules: jsonb("required_modules").$type<string[]>().default([]).notNull(),
    /** Pays où le métier est proposé. Vide = tous les pays ouverts. */
    countries: jsonb("countries").$type<string[]>().default([]).notNull(),
    /** Justificatifs demandés à la création du compte, par pays si besoin. */
    requirements: jsonb("requirements").$type<Record<string, string[]>>().default({}).notNull(),
    sortOrder: integer("sort_order").notNull().default(100),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    familyIdx: index("pro_portal_professions_family_idx").on(t.family, t.active),
  }),
);

/** Services activables à la carte, composés librement par le professionnel. */
export const proPortalModules = pgTable(
  "pro_portal_modules",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    code: varchar("code", { length: 48 }).notNull().unique(),
    label: varchar("label", { length: 120 }).notNull(),
    description: text("description"),
    family: varchar("family", { length: 32 }).notNull().default("gestion"),
    /** Code produit du registre central des tarifs. Le prix est résolu là-bas. */
    productCode: varchar("product_code", { length: 64 }),
    /** Modules dont celui-ci dépend (cochés automatiquement avec lui). */
    dependencies: jsonb("dependencies").$type<string[]>().default([]).notNull(),
    countries: jsonb("countries").$type<string[]>().default([]).notNull(),
    sortOrder: integer("sort_order").notNull().default(100),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    familyIdx: index("pro_portal_modules_family_idx").on(t.family, t.active),
  }),
);

/**
 * Parcours en cours. Permet de reprendre une composition d'offre abandonnée
 * (le professionnel ferme l'onglet avant de créer son compte) et donne au
 * Système Intelligent la visibilité sur les abandons d'entonnoir.
 */
export const proPortalDrafts = pgTable(
  "pro_portal_drafts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Clé anonyme du navigateur tant que le compte n'existe pas encore. */
    sessionKey: varchar("session_key", { length: 64 }).notNull().unique(),
    userId: integer("user_id"),
    professionCode: varchar("profession_code", { length: 48 }),
    countryCode: varchar("country_code", { length: 2 }),
    moduleCodes: jsonb("module_codes").$type<string[]>().default([]).notNull(),
    /** Dernière étape atteinte : metier, pays, besoins, panier, compte. */
    step: varchar("step", { length: 24 }).notNull().default("metier"),
    /** Devis calculé côté serveur au moment de la dernière mise à jour. */
    quote: jsonb("quote").$type<Record<string, unknown>>(),
    status: varchar("status", { length: 16 }).notNull().default("en_cours"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    userIdx: index("pro_portal_drafts_user_idx").on(t.userId),
    statusIdx: index("pro_portal_drafts_status_idx").on(t.status, t.updatedAt),
  }),
);
