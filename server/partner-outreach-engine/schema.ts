/**
 * Partner Outreach Engine — schéma.
 *
 * Registre des contacts APPROCHÉS par MKA.P-MS (fournisseurs véhicules,
 * pièces, garages, transporteurs, logisticiens, boutique) AVANT qu'ils ne
 * deviennent une candidature (`partner_applications`, server/partner-engine/)
 * ou une fiche fournisseur exploitable (`supplier_profiles`,
 * server/supplier-engine/). Ce registre couvre l'étape qui manquait : le
 * suivi d'une prise de contact à froid, de "identifié" jusqu'à "qualifié"
 * ou "refusé" — ni `partner-engine` (candidature entrante "Devenir
 * partenaire", jamais une prospection sortante) ni `supplier-engine` (suppose
 * déjà la décision d'onboarder prise, démarre à "brouillon") ne couvrent
 * cette étape. Rien n'est dupliqué : une fois qualifié, un contact est
 * promu vers ces moteurs existants via `promotedToApplicationId` /
 * `promotedToSupplierProfileId`, jamais recréé en double.
 */
import {
  bigserial,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const outreachContacts = pgTable(
  "outreach_contacts",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    domain: varchar("domain", { length: 160 }),
    /** Libellé lisible dérivé du domaine — jamais une affirmation d'identité confirmée. */
    companyName: varchar("company_name", { length: 200 }),
    /** Pays — rempli uniquement quand réellement confirmé (ccTLD ou vérification humaine). */
    country: varchar("country", { length: 80 }),
    city: varchar("city", { length: 120 }),
    phone: varchar("phone", { length: 32 }),
    website: varchar("website", { length: 255 }),
    /** Catégorie large — voir OUTREACH_CATEGORIES (contract.ts). NULL tant que non vérifiée. */
    category: varchar("category", { length: 32 }),
    /** Capacités déclarées/supposées — voir OUTREACH_CAPACITIES. Jamais pré-rempli par supposition. */
    capacities: jsonb("capacities").$type<string[]>().notNull().default([]),
    zonesDesservies: jsonb("zones_desservies").$type<string[]>().notNull().default([]),
    langues: jsonb("langues").$type<string[]>().notNull().default([]),
    /** "b2b" | "b2c" | "b2b_b2c" — NULL tant que non vérifié. */
    modeleCommercial: varchar("modele_commercial", { length: 16 }),
    documents: jsonb("documents").$type<string[]>().notNull().default([]),
    licences: text("licences"),
    assurances: text("assurances"),
    conditionsCommerciales: text("conditions_commerciales"),
    /** Voir OUTREACH_STATUSES (contract.ts) — 11 statuts du Plan Maître. */
    status: varchar("status", { length: 24 }).notNull().default("identifie"),
    /** Un e-mail marqué "envoyé" ne prouve pas qu'il a été reçu (règle explicite de la mission). */
    emailSentAt: timestamp("email_sent_at"),
    emailDeliveryConfirmed: boolean("email_delivery_confirmed").notNull().default(false),
    emailBounced: boolean("email_bounced").notNull().default(false),
    responseReceivedAt: timestamp("response_received_at"),
    responseSummary: text("response_summary"),
    qualificationNote: text("qualification_note"),
    /** Brouillon de réponse en préparation — jamais envoyé automatiquement. */
    draftReplyText: text("draft_reply_text"),
    /** Promotion vers les moteurs existants, jamais une duplication. */
    promotedToApplicationId: integer("promoted_to_application_id"),
    promotedToSupplierProfileId: integer("promoted_to_supplier_profile_id"),
    source: varchar("source", { length: 32 }).notNull().default("campagne_26_10"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    statusIdx: index("outreach_contacts_status_idx").on(t.status, t.category),
    domainIdx: index("outreach_contacts_domain_idx").on(t.domain),
    countryIdx: index("outreach_contacts_country_idx").on(t.country),
  }),
);

/** Audit obligatoire (même règle que supplier_audit_log) — chaque décision, pas seulement les erreurs. */
export const outreachStatusLog = pgTable(
  "outreach_status_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    outreachContactId: integer("outreach_contact_id").notNull(),
    action: varchar("action", { length: 48 }).notNull(),
    actorId: integer("actor_id"),
    fromStatus: varchar("from_status", { length: 24 }),
    toStatus: varchar("to_status", { length: 24 }),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    contactIdx: index("outreach_status_log_contact_idx").on(t.outreachContactId, t.createdAt),
  }),
);

/** Journal de santé (même mécanique que supplier_health_log / country_health_log). */
export const outreachHealthLog = pgTable("outreach_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
