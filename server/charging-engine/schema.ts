/**
 * Charging Engine (point 45) — schéma.
 *
 * La page « Energy — Recharge » était vide et aucune table ne décrivait une
 * borne de recharge. Un annuaire de bornes ne peut pas être inventé : chaque
 * point vient soit de la direction, soit d'une déclaration (professionnel ou
 * particulier) qui reste « en attente » jusqu'à validation humaine.
 *
 * Les coordonnées sont facultatives : sans elles, la borne est trouvable par
 * ville mais aucune distance n'est affichée plutôt qu'une distance fausse.
 */
import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Types de prise réellement rencontrés sur le terrain. */
export const CHARGING_CONNECTORS = [
  "type2",
  "ccs",
  "chademo",
  "type1",
  "domestique",
] as const;
export type ChargingConnector = (typeof CHARGING_CONNECTORS)[number];

/** Conditions d'accès : elles changent tout pour un conducteur. */
export const CHARGING_ACCESS = ["public", "reserve_clients", "prive", "abonnement"] as const;
export type ChargingAccess = (typeof CHARGING_ACCESS)[number];

export const chargingPoints = pgTable(
  "charging_points",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 180 }).notNull(),
    operator: varchar("operator", { length: 160 }),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    city: varchar("city", { length: 120 }).notNull(),
    postalCode: varchar("postal_code", { length: 16 }),
    address: varchar("address", { length: 255 }),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    /** Prises disponibles sur le site. */
    connectors: jsonb("connectors").$type<string[]>().notNull().default([]),
    /** Puissance maximale annoncée, en kW. */
    powerKw: integer("power_kw"),
    /** Nombre de points de charge sur le site. */
    outlets: integer("outlets"),
    /** "public" | "reserve_clients" | "prive" | "abonnement" */
    access: varchar("access", { length: 24 }).notNull().default("public"),
    /** Tarif tel qu'annoncé par l'exploitant, en texte : jamais recalculé. */
    pricingNote: varchar("pricing_note", { length: 200 }),
    openingHours: varchar("opening_hours", { length: 160 }),
    /** "direction" | "declaration" | "partenaire" */
    source: varchar("source", { length: 24 }).notNull().default("declaration"),
    declaredBy: integer("declared_by"),
    /** "en_attente" | "publie" | "rejete" | "hors_service" */
    status: varchar("status", { length: 16 }).notNull().default("en_attente"),
    reviewedBy: integer("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    reviewNote: text("review_note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    zoneIdx: index("charging_points_zone_idx").on(t.countryCode, t.city, t.status),
    statusIdx: index("charging_points_status_idx").on(t.status),
  }),
);
