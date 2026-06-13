// Univers transverses (Parties 7-15) — litiges, partenaires, entrepôts, pays.
// Base unique : ces tables restent reliées aux mêmes users / logs / paiements.
import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
} from "drizzle-orm/pg-core";

// ===== PARTIE 8 — CENTRE DE LITIGES =====
export const disputeStatusEnum = pgEnum("dispute_status", [
  "ouvert",
  "en_analyse",
  "resolu",
  "rembourse",
  "clos",
]);
export const disputeUniversEnum = pgEnum("dispute_univers", [
  "vente",
  "location",
  "livraison",
  "pieces",
  "garage",
  "autre",
]);

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  reference: varchar("reference", { length: 24 }).unique(), // MKA-L-000123
  openedBy: integer("opened_by").notNull(),
  againstUserId: integer("against_user_id"),
  univers: disputeUniversEnum("univers").notNull().default("autre"),
  refType: varchar("ref_type", { length: 32 }), // annonce / booking / commande…
  refId: integer("ref_id"),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description").notNull(),
  status: disputeStatusEnum("status").notNull().default("ouvert"),
  resolution: text("resolution"),
  amountRefunded: numeric("amount_refunded", { precision: 12, scale: 2 }),
  decidedBy: integer("decided_by"),
  decidedAt: timestamp("decided_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const disputeEvidence = pgTable("dispute_evidence", {
  id: serial("id").primaryKey(),
  disputeId: integer("dispute_id").notNull(),
  userId: integer("user_id").notNull(),
  kind: varchar("kind", { length: 16 }).notNull().default("text"), // text / photo / document
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== PARTIE 15 — PARTENARIATS =====
export const partnerTypeEnum = pgEnum("partner_type", [
  "fournisseur_vehicules",
  "fournisseur_pieces",
  "transporteur",
  "garage",
  "vtc",
  "depanneur",
  "lavage",
  "karting",
  "autre",
]);

export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  type: partnerTypeEnum("type").notNull().default("autre"),
  country: varchar("country", { length: 4 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 32 }),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0"),
  active: boolean("active").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== PARTIE 10 — MULTI-ENTREPÔTS =====
// La table `warehouses` est définie dans le module Import Africa+ (base unique) ;
// on lui ajoute ici le journal des mouvements (entrées / sorties de stock).
export const warehouseMovements = pgTable("warehouse_movements", {
  id: serial("id").primaryKey(),
  warehouseId: integer("warehouse_id").notNull(),
  kind: varchar("kind", { length: 16 }).notNull().default("entree"), // entree / sortie
  itemType: varchar("item_type", { length: 32 }).notNull().default("vehicule"),
  itemRef: varchar("item_ref", { length: 128 }),
  quantity: integer("quantity").notNull().default(1),
  note: text("note"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== PARTIE 14 — PLAN AFRIQUE (config par pays) =====
export const countryConfigs = pgTable("country_configs", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 4 }).notNull().unique(),
  name: varchar("name", { length: 96 }).notNull(),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  importRules: text("import_rules"),
  customsRules: text("customs_rules"),
  taxes: text("taxes"),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
