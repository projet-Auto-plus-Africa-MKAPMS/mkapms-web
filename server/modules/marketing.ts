// ===== MODULE: MARKETING / QR CODE / ACQUISITION =====
// Plan Partie 1 §7 (Marketing) + Partie 2 §18.
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const qrCodeTypeEnum = pgEnum("qr_code_type", [
  "depot_vehicule",
  "pro",
  "garage",
  "location",
  "pieces",
  "campagne",
]);

export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  type: qrCodeTypeEnum("type").notNull(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  targetUrl: text("target_url"),
  ownerId: integer("owner_id"),
  scans: integer("scans").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Codes promotionnels gérés par la Direction (PDG) — §3.1.
export const promoCodeTypeEnum = pgEnum("promo_code_type", ["pourcentage", "montant"]);

export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 48 }).notNull().unique(),
  type: promoCodeTypeEnum("type").notNull().default("pourcentage"),
  value: integer("value").notNull().default(0), // % (0-100) ou montant en centimes
  description: text("description"),
  scope: varchar("scope", { length: 48 }), // abonnement, boost, location, tous...
  maxUses: integer("max_uses"),
  usedCount: integer("used_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  validUntil: timestamp("valid_until"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const referralCodes = pgTable("referral_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  ownerId: integer("owner_id"),
  usesCount: integer("uses_count").notNull().default(0),
  maxUses: integer("max_uses"),
  reward: varchar("reward", { length: 96 }),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  nom: varchar("nom", { length: 160 }).notNull(),
  description: text("description"),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id"),
  titre: varchar("titre", { length: 160 }),
  imageUrl: text("image_url"),
  targetUrl: text("target_url"),
  position: varchar("position", { length: 64 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  titre: varchar("titre", { length: 160 }),
  imageUrl: text("image_url"),
  targetUrl: text("target_url"),
  emplacement: varchar("emplacement", { length: 64 }),
  ordre: integer("ordre").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
