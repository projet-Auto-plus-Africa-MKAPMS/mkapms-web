/**
 * Insurance Engine (point 45) — schéma.
 *
 * La page « MKA.P-MS Assurance » était un module vide, et la seule table
 * existante (`user_assurances`) ne sert qu'à ranger le contrat qu'un client a
 * DÉJÀ souscrit ailleurs : rien ne permettait de demander une couverture ni de
 * savoir quel assureur travaille dans quel pays.
 *
 * Deux tables neuves, aucune table existante modifiée :
 *   • les assureurs partenaires réellement référencés par pays ;
 *   • les demandes de devis, avec les assureurs effectivement sollicités.
 *
 * Aucune prime n'est calculée par la plateforme : un tarif d'assurance engage
 * un assureur, il est donc saisi par un humain (offre) et jamais deviné.
 */
import {
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Formules de couverture proposées. */
export const INSURANCE_FORMULAS = ["tiers", "tiers_plus", "tous_risques"] as const;
export type InsuranceFormula = (typeof INSURANCE_FORMULAS)[number];

/** Usage déclaré du véhicule : il change l'offre, il est donc demandé. */
export const INSURANCE_USAGES = [
  "personnel",
  "trajet_travail",
  "professionnel",
  "vtc_taxi",
  "flotte",
] as const;
export type InsuranceUsage = (typeof INSURANCE_USAGES)[number];

/** Assureur partenaire, référencé pays par pays par la direction. */
export const insurancePartners = pgTable(
  "insurance_partners",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 160 }).notNull(),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    /** Formules réellement couvertes par cet assureur. */
    formulas: jsonb("formulas").$type<string[]>().notNull().default([]),
    /** Usages acceptés (un assureur peut refuser le VTC, par exemple). */
    usages: jsonb("usages").$type<string[]>().notNull().default([]),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    /** "actif" | "suspendu" */
    status: varchar("status", { length: 16 }).notNull().default("actif"),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    zoneIdx: index("insurance_partners_zone_idx").on(t.countryCode, t.status),
  }),
);

/**
 * Demande de devis. `contactedPartners` garde la trace des assureurs
 * réellement sollicités : sans cette trace, on ne pourrait pas distinguer
 * « demande transmise » de « demande enregistrée sans destinataire ».
 */
export const insuranceQuoteRequests = pgTable(
  "insurance_quote_requests",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    userId: integer("user_id"),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    city: varchar("city", { length: 120 }),
    formula: varchar("formula", { length: 24 }).notNull(),
    usage: varchar("usage", { length: 24 }).notNull(),
    vehicleBrand: varchar("vehicle_brand", { length: 80 }),
    vehicleModel: varchar("vehicle_model", { length: 120 }),
    vehicleYear: integer("vehicle_year"),
    /** Saisie manuelle : jamais déduite d'une plaque sans confirmation. */
    plate: varchar("plate", { length: 24 }),
    driverLicenseYear: integer("driver_license_year"),
    claimsLast3Years: integer("claims_last_3_years"),
    contactName: varchar("contact_name", { length: 160 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    message: text("message"),
    /** "transmise" | "sans_assureur" | "offre_recue" | "souscrite" | "abandonnee" */
    status: varchar("status", { length: 20 }).notNull().default("transmise"),
    contactedPartners: jsonb("contacted_partners").$type<number[]>().notNull().default([]),
    /** Offre saisie par un humain : montant, assureur, validité. */
    offerPartnerId: integer("offer_partner_id"),
    offerAmount: numeric("offer_amount", { precision: 12, scale: 2 }),
    offerCurrency: varchar("offer_currency", { length: 8 }),
    offerValidUntil: timestamp("offer_valid_until"),
    offerNote: text("offer_note"),
    offerBy: integer("offer_by"),
    offerAt: timestamp("offer_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("insurance_quote_requests_status_idx").on(t.status, t.countryCode),
    userIdx: index("insurance_quote_requests_user_idx").on(t.userId),
  }),
);
