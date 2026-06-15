// ===== MODULE: PIÈCES AUTO (marketplace B2B/B2C) =====
// Plan Partie 2 §6 + Partie 3 §9. Univers indépendant.
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const partsShopTypeEnum = pgEnum("parts_shop_type", [
  "magasin_pieces",
  "casse_auto",
  "grossiste",
  "distributeur",
  "centre_auto",
  "garage_vendeur",
]);
export const partsOrderStatusEnum = pgEnum("parts_order_status", [
  "panier",
  "en_attente_paiement",
  "payee",
  "preparee",
  "expediee",
  "livree",
  "annulee",
  "remboursee",
]);
export const partConditionEnum = pgEnum("part_condition", ["neuf", "occasion", "reconditionne", "echange_standard"]);

export const partsShops = pgTable("parts_shops", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  type: partsShopTypeEnum("type").notNull().default("magasin_pieces"),
  nom: varchar("nom", { length: 160 }).notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  adresse: text("adresse"),
  ville: varchar("ville", { length: 96 }),
  countryCode: varchar("country_code", { length: 4 }),
  lat: numeric("lat", { precision: 10, scale: 6 }),
  lng: numeric("lng", { precision: 10, scale: 6 }),
  telephone: varchar("telephone", { length: 32 }),
  whatsapp: varchar("whatsapp", { length: 32 }),
  horaires: text("horaires"),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).default("3.00"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partReferences = pgTable("part_references", {
  id: serial("id").primaryKey(),
  oemRef: varchar("oem_ref", { length: 96 }),
  equipmentierRef: varchar("equipmentier_ref", { length: 96 }),
  marque: varchar("marque", { length: 96 }),
  designation: varchar("designation", { length: 192 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partsCatalog = pgTable("parts_catalog", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull(),
  referenceId: integer("reference_id"),
  nom: varchar("nom", { length: 192 }).notNull(),
  description: text("description"),
  oemRef: varchar("oem_ref", { length: 96 }),
  equipmentierRef: varchar("equipmentier_ref", { length: 96 }),
  categorie: varchar("categorie", { length: 96 }),
  condition: partConditionEnum("condition").notNull().default("neuf"),
  prixHt: numeric("prix_ht", { precision: 12, scale: 2 }).notNull(),
  prixTtc: numeric("prix_ttc", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  photoUrl: text("photo_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partCompatibilities = pgTable("part_compatibilities", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").notNull(),
  marque: varchar("marque", { length: 96 }),
  modele: varchar("modele", { length: 96 }),
  motorisation: varchar("motorisation", { length: 96 }),
  anneeDebut: integer("annee_debut"),
  anneeFin: integer("annee_fin"),
});

export const partsStock = pgTable("parts_stock", {
  id: serial("id").primaryKey(),
  catalogId: integer("catalog_id").notNull(),
  quantite: integer("quantite").notNull().default(0),
  seuilAlerte: integer("seuil_alerte").notNull().default(0),
  emplacement: varchar("emplacement", { length: 96 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partsOrders = pgTable("parts_orders", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull(),
  buyerId: integer("buyer_id").notNull(),
  status: partsOrderStatusEnum("status").notNull().default("panier"),
  totalHt: numeric("total_ht", { precision: 12, scale: 2 }).notNull().default("0"),
  totalTtc: numeric("total_ttc", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }),
  deliveryMissionId: integer("delivery_mission_id"),
  paymentId: integer("payment_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const partsOrderItems = pgTable("parts_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  catalogId: integer("catalog_id").notNull(),
  quantite: integer("quantite").notNull().default(1),
  prixUnitaireHt: numeric("prix_unitaire_ht", { precision: 12, scale: 2 }).notNull(),
  prixUnitaireTtc: numeric("prix_unitaire_ttc", { precision: 12, scale: 2 }),
});
