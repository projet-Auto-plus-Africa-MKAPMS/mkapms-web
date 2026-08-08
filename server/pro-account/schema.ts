/**
 * MKA.P-MS Pro Account Engine — schéma isolé (tables `pro_account_*`).
 *
 * Un professionnel n'est pas activé parce qu'il a payé : il l'est parce que
 * son dossier légal est complet ET que son paiement est confirmé. Les deux
 * conditions vivent ici, séparément, pour qu'aucune ne puisse être supposée.
 *
 * Les exigences varient selon le pays ET le métier : elles sont stockées en
 * base (`pro_account_rules`), jamais codées en dur, afin qu'un pays puisse
 * être ouvert ou durci sans redéploiement.
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

/** Un justificatif attendu, et son état réel dans le dossier. */
export interface ProAccountDocument {
  key: string;
  label: string;
  /** `manquant` tant qu'aucune pièce n'est déposée. Jamais supposé fourni. */
  status: "manquant" | "fourni" | "refuse";
  url?: string | null;
  note?: string | null;
}

/**
 * Exigences légales par pays et, si besoin, par métier.
 * Une règle sans `professionCode` s'applique à tous les métiers du pays.
 */
export const proAccountRules = pgTable(
  "pro_account_rules",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    professionCode: varchar("profession_code", { length: 48 }),
    /** Champs du dossier obligatoires (ex. registrationNumber, vatNumber). */
    requiredFields: jsonb("required_fields").$type<string[]>().notNull().default([]),
    /** Justificatifs obligatoires, en plus de ceux du métier et du pays. */
    requiredDocs: jsonb("required_docs").$type<string[]>().notNull().default([]),
    /** Libellé local du numéro d'immatriculation (SIREN, NIF, RCCM…). */
    registrationLabel: varchar("registration_label", { length: 80 }),
    notes: text("notes"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    countryIdx: index("pro_account_rules_country_idx").on(t.countryCode, t.professionCode),
  }),
);

/**
 * Dossier professionnel : identité → entreprise → pays → métier →
 * informations légales → coordonnées → services → conditions → paiement →
 * activation.
 */
export const proAccountApplications = pgTable(
  "pro_account_applications",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: integer("user_id").notNull(),
    /** Rattachement au parcours du portail (composition d'offre). */
    sessionKey: varchar("session_key", { length: 64 }),

    professionCode: varchar("profession_code", { length: 48 }).notNull(),
    countryCode: varchar("country_code", { length: 2 }).notNull(),
    moduleCodes: jsonb("module_codes").$type<string[]>().notNull().default([]),

    // Identité du responsable
    contactFirstName: varchar("contact_first_name", { length: 80 }),
    contactLastName: varchar("contact_last_name", { length: 80 }),
    contactEmail: varchar("contact_email", { length: 190 }),
    contactPhone: varchar("contact_phone", { length: 32 }),

    // Entreprise
    legalName: varchar("legal_name", { length: 190 }),
    legalForm: varchar("legal_form", { length: 80 }),
    registrationNumber: varchar("registration_number", { length: 64 }),
    vatNumber: varchar("vat_number", { length: 40 }),
    addressLine: varchar("address_line", { length: 190 }),
    city: varchar("city", { length: 120 }),
    postalCode: varchar("postal_code", { length: 20 }),
    website: varchar("website", { length: 190 }),

    documents: jsonb("documents").$type<ProAccountDocument[]>().notNull().default([]),

    termsAcceptedAt: timestamp("terms_accepted_at"),

    /**
     * brouillon → soumis → en_verification → complement_requis / valide /
     * refuse → actif. « actif » n'est atteignable que par le moteur.
     */
    status: varchar("status", { length: 24 }).notNull().default("brouillon"),
    /** non_requis | en_attente | confirme — jamais déduit du statut dossier. */
    paymentStatus: varchar("payment_status", { length: 16 }).notNull().default("en_attente"),
    paymentReference: varchar("payment_reference", { length: 120 }),

    reviewNote: text("review_note"),
    reviewedBy: integer("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    submittedAt: timestamp("submitted_at"),
    activatedAt: timestamp("activated_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    userIdx: index("pro_account_applications_user_idx").on(t.userId),
    statusIdx: index("pro_account_applications_status_idx").on(t.status, t.updatedAt),
    countryIdx: index("pro_account_applications_country_idx").on(t.countryCode, t.professionCode),
  }),
);
