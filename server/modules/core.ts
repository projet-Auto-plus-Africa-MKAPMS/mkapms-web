// ===== MODULE: CORE STRUCTUREL =====
// RBAC configurable en base + registre de modules (fédération d'univers) + i18n.
// Plan Partie 1 §1-§4, §8, §15. Aucune table existante n'est modifiée ici.
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

// --- Registre des modules (chaque univers activable/désactivable) ---
export const moduleStatusEnum = pgEnum("module_status", ["active", "masque", "maintenance", "desactive"]);

export const modules = pgTable("modules", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(), // ex: vente, location, pieces...
  nom: varchar("nom", { length: 128 }).notNull(),
  description: text("description"),
  status: moduleStatusEnum("status").notNull().default("active"),
  ordre: integer("ordre").notNull().default(0),
  icone: varchar("icone", { length: 64 }),
  visiblePublic: boolean("visible_public").notNull().default(true),
  config: jsonb("config"), // paramètres libres par module (Super Admin)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- RBAC configurable ---
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 64 }).notNull().unique(), // super_admin, admin, directeur...
  label: varchar("label", { length: 128 }).notNull(),
  level: integer("level").notNull().default(0), // 0=user ... 100=super_admin
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 96 }).notNull().unique(), // ex: annonces.validate
  module: varchar("module", { length: 64 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull(),
  permissionId: integer("permission_id").notNull(),
  allowed: boolean("allowed").notNull().default(true),
});

export const staffProfiles = pgTable("staff_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  position: varchar("position", { length: 64 }).notNull(),
  department: varchar("department", { length: 64 }),
  managerId: integer("manager_id"),
  salary: numeric("salary", { precision: 12, scale: 2 }),
  status: varchar("status", { length: 32 }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Internationalisation (multi-pays / devises / langues / règles) ---
export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(), // EUR, GNF, XOF, USD
  symbol: varchar("symbol", { length: 8 }).notNull(),
  name: varchar("name", { length: 64 }).notNull(),
  rateToEur: numeric("rate_to_eur", { precision: 18, scale: 6 }),
  active: boolean("active").notNull().default(true),
});

export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(), // fr, en
  name: varchar("name", { length: 64 }).notNull(),
  active: boolean("active").notNull().default(true),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 96 }).notNull().unique(),
  value: jsonb("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const countryRules = pgTable("country_rules", {
  id: serial("id").primaryKey(),
  countryCode: varchar("country_code", { length: 4 }).notNull(),
  defaultCurrency: varchar("default_currency", { length: 8 }),
  defaultLanguage: varchar("default_language", { length: 8 }),
  vatRate: numeric("vat_rate", { precision: 6, scale: 3 }),
  importAllowed: boolean("import_allowed").notNull().default(false),
  exportAllowed: boolean("export_allowed").notNull().default(false),
  config: jsonb("config"),
});

// --- Types de documents + vérifications (transverse) ---
export const documentTypes = pgTable("document_types", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  label: varchar("label", { length: 128 }).notNull(),
  appliesTo: varchar("applies_to", { length: 64 }), // profil concerné
  required: boolean("required").notNull().default(false),
});

export const documentVerifications = pgTable("document_verifications", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  userId: integer("user_id"),
  status: varchar("status", { length: 32 }).notNull().default("en_attente"),
  verifiedBy: integer("verified_by"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Demandes de suppression de compte (workflow d'approbation Direction) ---
// Un Employé ne peut PAS supprimer un compte directement : il dépose une demande,
// la Direction (PDG) approuve ou refuse. §3 + parcours §10.
export const accountDeletionRequests = pgTable("account_deletion_requests", {
  id: serial("id").primaryKey(),
  targetUserId: integer("target_user_id").notNull(),
  requestedBy: integer("requested_by").notNull(),
  reason: text("reason"),
  status: varchar("status", { length: 24 }).notNull().default("en_attente"), // en_attente|approuvee|refusee
  decidedBy: integer("decided_by"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Recherches sauvegardées + alertes (Partie 6, demande utilisateur) ---
// L'utilisateur enregistre un filtre de recherche ; dès qu'une nouvelle annonce
// correspond, une notification est créée (alerte). Relié au compte (base unique).
export const savedSearches = pgTable("saved_searches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  label: varchar("label", { length: 128 }).notNull(),
  univers: varchar("univers", { length: 32 }).notNull().default("vente"), // vente|location...
  filters: jsonb("filters").notNull(), // { q, marque, modele, categorie, famille, prixMax, ville, ... }
  alertEnabled: boolean("alert_enabled").notNull().default(true),
  lastNotifiedAt: timestamp("last_notified_at"),
  lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Notifications utilisateur (transverse, base unique) ---
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: varchar("type", { length: 48 }).notNull(), // saved_search|reservation|message|validation|systeme
  title: varchar("title", { length: 160 }).notNull(),
  body: text("body"),
  url: varchar("url", { length: 255 }), // lien profond (ex: /vehicule/123)
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
