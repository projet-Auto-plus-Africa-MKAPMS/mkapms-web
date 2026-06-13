// Univers transverses (Parties 7-18) — litiges, partenaires, entrepôts, pays,
// fidélité, coffre-fort, dossier véhicule.
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

// ===== PARTIE 18 — PROGRAMME FIDÉLITÉ (Points MKA) =====
export const loyaltyTierEnum = pgEnum("loyalty_tier", ["bronze", "silver", "gold", "platinum", "elite"]);

export const loyaltyAccounts = pgTable("loyalty_accounts", {
  userId: integer("user_id").primaryKey(),
  points: integer("points").notNull().default(0),
  tier: loyaltyTierEnum("tier").notNull().default("bronze"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  points: integer("points").notNull(), // signé (+ gain, - dépense)
  reason: varchar("reason", { length: 128 }).notNull(),
  refType: varchar("ref_type", { length: 32 }),
  refId: integer("ref_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== PARTIE 19 — GOUVERNANCE : FILIALES, SITES, FRANCHISES =====
// Hiérarchie : Global → Pays → Villes → Sites locaux. Une seule base, cloisonnée par pays.
export const subsidiaries = pgTable("subsidiaries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  countryCode: varchar("country_code", { length: 4 }).notNull(),
  city: varchar("city", { length: 96 }),
  managerId: integer("manager_id"), // responsable (user)
  budget: numeric("budget", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteTypeEnum = pgEnum("site_type", [
  "agence",
  "entrepot",
  "garage",
  "karting",
  "lavage",
  "autre",
]);

export const sites = pgTable("sites", {
  id: serial("id").primaryKey(),
  subsidiaryId: integer("subsidiary_id"),
  type: siteTypeEnum("type").notNull().default("agence"),
  name: varchar("name", { length: 160 }).notNull(),
  countryCode: varchar("country_code", { length: 4 }).notNull(),
  city: varchar("city", { length: 96 }),
  address: text("address"),
  lat: numeric("lat", { precision: 9, scale: 6 }),
  lng: numeric("lng", { precision: 9, scale: 6 }),
  managerId: integer("manager_id"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const franchiseTypeEnum = pgEnum("franchise_type", [
  "garage",
  "lavage",
  "karting",
  "agence",
  "autre",
]);
export const franchiseStatusEnum = pgEnum("franchise_status", [
  "prospect",
  "active",
  "suspendue",
  "resiliee",
]);

export const franchises = pgTable("franchises", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  type: franchiseTypeEnum("type").notNull().default("garage"),
  countryCode: varchar("country_code", { length: 4 }).notNull(),
  zone: varchar("zone", { length: 160 }), // ville / région exclusive
  ownerId: integer("owner_id"), // franchisé (user)
  redevance: numeric("redevance", { precision: 12, scale: 2 }), // redevance mensuelle
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  contractStart: timestamp("contract_start"),
  contractEnd: timestamp("contract_end"),
  status: franchiseStatusEnum("status").notNull().default("prospect"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== PARTIE 20 — PLAN DE CONTINUITÉ ET SÉCURITÉ =====
export const platformSettings = pgTable("platform_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const monitoringSeverityEnum = pgEnum("monitoring_severity", [
  "info",
  "warning",
  "error",
  "critical",
]);

export const monitoringEvents = pgTable("monitoring_events", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 48 }).notNull(), // api, paiement, serveur, base, autre
  severity: monitoringSeverityEnum("severity").notNull().default("info"),
  message: text("message").notNull(),
  meta: text("meta"),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const backupStatusEnum = pgEnum("backup_status", ["success", "failed", "running"]);

export const backupLogs = pgTable("backup_logs", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 32 }).notNull().default("database"), // database, documents
  status: backupStatusEnum("status").notNull().default("success"),
  location: text("location"),
  sizeBytes: integer("size_bytes"),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== PARTIE 21 — CONFORMITÉ : POLICES D'ASSURANCE (par univers) =====
export const insuranceTypeEnum = pgEnum("insurance_type", [
  "location",
  "transport",
  "garage",
  "vtc",
  "livraison",
  "autre",
]);
export const insuranceStatusEnum = pgEnum("insurance_status", [
  "active",
  "expiree",
  "suspendue",
]);

export const insurancePolicies = pgTable("insurance_policies", {
  id: serial("id").primaryKey(),
  type: insuranceTypeEnum("type").notNull().default("autre"),
  compagnie: varchar("compagnie", { length: 160 }).notNull(),
  numeroPolice: varchar("numero_police", { length: 96 }),
  refType: varchar("ref_type", { length: 32 }), // univers/entité couverte
  refId: integer("ref_id"),
  countryCode: varchar("country_code", { length: 4 }),
  primeMensuelle: numeric("prime_mensuelle", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  dateDebut: timestamp("date_debut"),
  dateFin: timestamp("date_fin"),
  documentUrl: text("document_url"),
  status: insuranceStatusEnum("status").notNull().default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== PARTIE 23 — MKA.P-MS LAB (expériences / feature flags) =====
export const experimentStatusEnum = pgEnum("experiment_status", [
  "brouillon",
  "test",
  "actif",
  "desactive",
]);

export const labExperiments = pgTable("lab_experiments", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 48 }), // offre, page, service, paiement, ia, autre
  description: text("description"),
  status: experimentStatusEnum("status").notNull().default("brouillon"),
  config: text("config"), // JSON libre
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== PREMIUM 2 — DOSSIER VÉHICULE INTELLIGENT (carnet de santé) =====
export const dossierEventTypeEnum = pgEnum("dossier_event_type", [
  "achat",
  "entretien",
  "reparation",
  "controle_technique",
  "sinistre",
  "photo",
  "vente",
  "autre",
]);

export const vehicleDossiers = pgTable("vehicle_dossiers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  marque: varchar("marque", { length: 96 }),
  modele: varchar("modele", { length: 96 }),
  immatriculation: varchar("immatriculation", { length: 32 }),
  vin: varchar("vin", { length: 32 }),
  annee: integer("annee"),
  kilometrage: integer("kilometrage"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicleDossierEvents = pgTable("vehicle_dossier_events", {
  id: serial("id").primaryKey(),
  dossierId: integer("dossier_id").notNull(),
  type: dossierEventTypeEnum("type").notNull().default("autre"),
  title: varchar("title", { length: 160 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  eventDate: timestamp("event_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
