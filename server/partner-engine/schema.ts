/**
 * Partner Engine (points 36-37) — schéma.
 *
 * La table historique `partners` est un simple carnet d'adresses interne
 * (nom, type, pays, actif). Elle est conservée telle quelle : ces tables la
 * complètent avec ce qui manquait pour en faire un vrai réseau — zone couverte,
 * contrat, leads, performance — et avec l'acquisition (point 37) : candidature
 * « Devenir partenaire » et opportunités détectées là où la demande dépasse
 * l'offre.
 *
 * Aucune donnée n'est fabriquée : la performance est agrégée depuis les leads
 * réellement enregistrés, et une opportunité n'existe que si des recherches
 * réelles la justifient.
 */
import {
  bigserial,
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

/**
 * Candidature « Devenir partenaire MKA.P-MS » — entrée commerciale publique du
 * portail Pro. Une candidature n'est JAMAIS acceptée automatiquement : elle
 * attend une décision humaine, comme le dossier professionnel (point 24).
 */
export const partnerApplications = pgTable(
  "partner_applications",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    /** Compte à l'origine de la candidature, s'il est connecté. */
    userId: integer("user_id"),
    companyName: varchar("company_name", { length: 180 }).notNull(),
    /** Métier candidat, aligné sur les métiers du portail Pro. */
    profession: varchar("profession", { length: 48 }).notNull(),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    city: varchar("city", { length: 120 }),
    /** Zone d'intervention déclarée (rayon en km autour de la ville). */
    zoneRadiusKm: integer("zone_radius_km"),
    /** Services que le candidat souhaite couvrir. */
    services: jsonb("services").$type<string[]>().notNull().default([]),
    contactName: varchar("contact_name", { length: 160 }),
    contactEmail: varchar("contact_email", { length: 255 }),
    contactPhone: varchar("contact_phone", { length: 32 }),
    message: text("message"),
    /** "recue" | "en_examen" | "acceptee" | "refusee" */
    status: varchar("status", { length: 16 }).notNull().default("recue"),
    /** Opportunité (point 37) qui a motivé la candidature, si elle vient de là. */
    opportunityId: integer("opportunity_id"),
    reviewedBy: integer("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    reviewNote: text("review_note"),
    /** Partenaire créé à l'acceptation (table `partners`). */
    partnerId: integer("partner_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    statusIdx: index("partner_applications_status_idx").on(t.status, t.countryCode),
    zoneIdx: index("partner_applications_zone_idx").on(t.profession, t.countryCode, t.city),
  }),
);

/**
 * Zone réellement couverte par un partenaire : pays, ville, service, rayon.
 * C'est cette table qui permet de dire « seulement deux partenaires contrôle
 * technique à Lyon » sans le deviner.
 */
export const partnerCoverage = pgTable(
  "partner_coverage",
  {
    id: serial("id").primaryKey(),
    partnerId: integer("partner_id").notNull(),
    service: varchar("service", { length: 48 }).notNull(),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    city: varchar("city", { length: 120 }),
    radiusKm: integer("radius_km"),
    /** "active" | "suspendue" */
    status: varchar("status", { length: 16 }).notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    zoneIdx: index("partner_coverage_zone_idx").on(t.service, t.countryCode, t.city, t.status),
    partnerIdx: index("partner_coverage_partner_idx").on(t.partnerId),
  }),
);

/**
 * Contrat partenaire. La commission est portée par le contrat, pas par le code :
 * deux partenaires du même métier peuvent avoir des conditions différentes.
 */
export const partnerContracts = pgTable(
  "partner_contracts",
  {
    id: serial("id").primaryKey(),
    partnerId: integer("partner_id").notNull(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    /** "apporteur_affaires" | "prestataire" | "distribution" | "cadre" */
    kind: varchar("kind", { length: 32 }).notNull().default("prestataire"),
    commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }),
    currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
    startsAt: timestamp("starts_at"),
    endsAt: timestamp("ends_at"),
    /** "brouillon" | "en_signature" | "actif" | "expire" | "resilie" */
    status: varchar("status", { length: 16 }).notNull().default("brouillon"),
    signedBy: integer("signed_by"),
    signedAt: timestamp("signed_at"),
    terms: text("terms"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    partnerIdx: index("partner_contracts_partner_idx").on(t.partnerId, t.status),
  }),
);

/**
 * Lead transmis à un partenaire. Source de vérité de la performance : la
 * performance n'est jamais saisie à la main, elle se déduit d'ici.
 */
export const partnerLeads = pgTable(
  "partner_leads",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    partnerId: integer("partner_id"),
    service: varchar("service", { length: 48 }).notNull(),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    city: varchar("city", { length: 120 }),
    /** Origine : "recherche" | "demande_devis" | "reservation" | "campagne" | "manuel" */
    source: varchar("source", { length: 32 }).notNull().default("recherche"),
    /** "nouveau" | "accepte" | "refuse" | "conclu" | "perdu" */
    status: varchar("status", { length: 16 }).notNull().default("nouveau"),
    userId: integer("user_id"),
    /** Montant conclu, uniquement lorsqu'il est réellement connu. */
    amount: numeric("amount", { precision: 14, scale: 2 }),
    detail: text("detail"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    partnerIdx: index("partner_leads_partner_idx").on(t.partnerId, t.status),
    zoneIdx: index("partner_leads_zone_idx").on(t.service, t.countryCode, t.city),
  }),
);

/**
 * Point 37 — opportunité d'acquisition détectée par le moteur : la demande
 * réelle (recherches) dépasse l'offre disponible (partenaires couvrant la zone).
 *
 * `demandSignals` et `partnersAvailable` sont des mesures, pas des estimations :
 * une opportunité sans signal réel n'est pas créée.
 */
export const partnerOpportunities = pgTable(
  "partner_opportunities",
  {
    id: serial("id").primaryKey(),
    service: varchar("service", { length: 48 }).notNull(),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    city: varchar("city", { length: 120 }),
    /** Nombre de recherches réelles observées sur la période analysée. */
    demandSignals: integer("demand_signals").notNull().default(0),
    /** Recherches restées sans résultat : le manque le plus coûteux. */
    demandWithoutResults: integer("demand_without_results").notNull().default(0),
    /** Partenaires couvrant réellement la zone au moment de la détection. */
    partnersAvailable: integer("partners_available").notNull().default(0),
    /** "critique" | "important" | "a_surveiller" */
    priority: varchar("priority", { length: 16 }).notNull().default("a_surveiller"),
    /** "ouverte" | "en_cours" | "pourvue" | "abandonnee" */
    status: varchar("status", { length: 16 }).notNull().default("ouverte"),
    /** Actions d'acquisition préparées (jamais publiées sans validation). */
    actions: jsonb("actions").$type<Record<string, unknown>[]>().notNull().default([]),
    periodDays: integer("period_days").notNull().default(30),
    detectedAt: timestamp("detected_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    zoneIdx: index("partner_opportunities_zone_idx").on(t.service, t.countryCode, t.city),
    statusIdx: index("partner_opportunities_status_idx").on(t.status, t.priority),
  }),
);
