/**
 * MKA.P-MS Investissement — schéma dédié au droit économique temporaire
 * qu'un investisseur obtient sur un univers + pays + durée.
 *
 * Ne pas confondre avec le « Mode Investisseurs » déjà existant
 * (server/routers/operations.ts::investorRouter, routes /investisseurs/*) :
 * celui-ci est un tableau de bord interne, masqué, de croissance/valorisation
 * pour pitcher des investisseurs en capital (VC, tours Pre-Seed/Seed/Série A)
 * — un sujet totalement différent, jamais touché ici. Ce module utilise donc
 * le nom "investment" (jamais "investor"/"investisseur" seuls) pour ne créer
 * aucune collision de routeur, de moteur ou de route avec l'existant.
 *
 * Aucune nouvelle valeur ajoutée à userRoleEnum (server/schema.ts) : le statut
 * investisseur est une capacité additive (table investors, une ligne par
 * identité qui investit), jamais un remplacement du rôle de base — un compte
 * "pro" doit pouvoir devenir aussi investisseur sans perdre son rôle Pro.
 *
 * Hors du périmètre de drizzle.config.ts (qui ne lit que server/schema.ts,
 * comme pour vo-engine/, country-os/, intelligences/) : migration écrite à la
 * main dans drizzle/, comme pour ces modules.
 */
import {
  bigserial,
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/** Univers réellement investissables : doivent correspondre à un moteur existant du registre (server/engine-registry/perimetres.ts). Jamais une catégorie inventée sans moteur derrière. */
export const INVESTABLE_UNIVERSES = [
  "vente_particulier",
  "vente_pro",
  "vente_officiel",
  "location_particulier",
  "location_pro",
  "garage",
  "atelier",
  "depannage",
  "encheres",
  "controle_technique",
  "livraison",
  "livraison_vehicule",
  "pieces",
  "transport",
  "assurance",
  "comptabilite",
] as const;
export type InvestableUniverse = (typeof INVESTABLE_UNIVERSES)[number];

export const investorTypeEnum = pgEnum("investor_type", [
  "PASSIVE_INVESTOR",
  "OPERATOR_INVESTOR",
  "STRATEGIC_PARTNER",
]);

export const investorKycStatusEnum = pgEnum("investor_kyc_status", [
  "non_verifie",
  "en_cours",
  "verifie",
  "refuse",
]);

/** Cycle de vie complet du contrat d'investissement (12 statuts non négociables). */
export const investmentStatusEnum = pgEnum("investment_status", [
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "AWAITING_SIGNATURE",
  "AWAITING_PAYMENT",
  "ACTIVATING",
  "ACTIVE",
  "SUSPENDED",
  "EXPIRING",
  "EXPIRED",
  "TERMINATED",
  "CANCELLED",
]);

export const pricingModelEnum = pgEnum("investment_pricing_model", [
  "fixed_price",
  "revenue_share",
  "hybrid",
]);

export const payoutFrequencyEnum = pgEnum("investment_payout_frequency", [
  "hebdomadaire",
  "mensuel",
  "autre",
]);

export const ledgerEntryStatusEnum = pgEnum("investor_ledger_status", [
  "en_attente",
  "disponible",
  "verse",
  "litige",
]);

export const payoutStatusEnum = pgEnum("investor_payout_status", [
  "en_attente",
  "paye",
  "echoue",
  "annule",
]);

/** Société que l'investisseur représente (KYB) — distincte de investorOrganizations d'un futur système d'organisations généraliste, qui n'existe pas encore dans ce dépôt. */
export const investorOrganizations = pgTable("investor_organizations", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  nom: varchar("nom", { length: 192 }).notNull(),
  proprietaireUserId: integer("proprietaire_user_id").notNull(),
  kybStatus: investorKycStatusEnum("kyb_status").notNull().default("non_verifie"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Capacité additive : une identité MKA.P-MS existante devient aussi investisseur, sans perdre son rôle de base. */
export const investors = pgTable("investors", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id").notNull().unique(),
  investorType: investorTypeEnum("investor_type").notNull().default("PASSIVE_INVESTOR"),
  organizationId: integer("organization_id"),
  kycStatus: investorKycStatusEnum("kyc_status").notNull().default("non_verifie"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Le contrat d'investissement lui-même : univers + pays + durée + modèle
 * financier + permissions. Champs minimums exigés par la direction :
 * investment_id (id), investor_id, organization_id, universe_id,
 * country_code, contract_id (contractDocumentId), start_at, end_at, status,
 * pricing_model, fixed_price, revenue_share, currency, payout_schedule.
 */
export const investments = pgTable("investments", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  investorId: integer("investor_id").notNull(),
  organizationId: integer("organization_id"),
  universeId: varchar("universe_id", { length: 64 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  /** Document réel dans le Document OS existant (generated_documents) — jamais un stockage de contrat dupliqué. */
  contractDocumentId: integer("contract_document_id"),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  status: investmentStatusEnum("status").notNull().default("DRAFT"),
  /** Vrai si ce contrat revendique l'exclusivité économique sur univers+pays+période — condition du blocage de double attribution. */
  exclusive: boolean("exclusive").notNull().default(true),
  pricingModel: pricingModelEnum("pricing_model").notNull().default("fixed_price"),
  fixedPrice: numeric("fixed_price", { precision: 14, scale: 2 }),
  /** Fraction (0.03 = 3%), jamais un pourcentage entier ambigu. */
  revenueShare: numeric("revenue_share", { precision: 6, scale: 4 }),
  currency: varchar("currency", { length: 4 }).notNull().default("EUR"),
  payoutSchedule: payoutFrequencyEnum("payout_schedule").notNull().default("mensuel"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Historique immuable des transitions de statut — un avenant ne remplace jamais l'historique. */
export const investmentStatusHistory = pgTable("investment_status_history", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  investmentId: integer("investment_id").notNull(),
  fromStatus: investmentStatusEnum("from_status"),
  toStatus: investmentStatusEnum("to_status").notNull(),
  motif: varchar("motif", { length: 255 }),
  changedBy: integer("changed_by"),
  changedAt: timestamp("changed_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Grand livre Investisseur — comptabilité séparée, jamais mélangée aux autres périmètres. */
export const investorLedger = pgTable("investor_ledger", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  investmentId: integer("investment_id").notNull(),
  /** Dénormalisé : filtrer par investisseur sans jointure, et garantir l'isolation entre investisseurs même en cas d'erreur de requête. */
  investorId: integer("investor_id").notNull(),
  countryCode: varchar("country_code", { length: 2 }).notNull(),
  universeId: varchar("universe_id", { length: 64 }).notNull(),
  /** Référence de la transaction d'origine (paiement, abonnement...) — unique pour empêcher une double attribution du même événement. */
  transactionRef: varchar("transaction_ref", { length: 128 }).notNull().unique(),
  montantBrut: numeric("montant_brut", { precision: 14, scale: 2 }).notNull(),
  commission: numeric("commission", { precision: 14, scale: 2 }).notNull().default("0"),
  taxe: numeric("taxe", { precision: 14, scale: 2 }).notNull().default("0"),
  remboursement: numeric("remboursement", { precision: 14, scale: 2 }).notNull().default("0"),
  montantNet: numeric("montant_net", { precision: 14, scale: 2 }).notNull(),
  devise: varchar("devise", { length: 4 }).notNull(),
  statut: ledgerEntryStatusEnum("statut").notNull().default("en_attente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Versements réels à l'investisseur. */
export const investorPayouts = pgTable("investor_payouts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  investorId: integer("investor_id").notNull(),
  periodeDebut: timestamp("periode_debut", { withTimezone: true }).notNull(),
  periodeFin: timestamp("periode_fin", { withTimezone: true }).notNull(),
  montantBrut: numeric("montant_brut", { precision: 14, scale: 2 }).notNull(),
  deductions: numeric("deductions", { precision: 14, scale: 2 }).notNull().default("0"),
  montantNet: numeric("montant_net", { precision: 14, scale: 2 }).notNull(),
  devise: varchar("devise", { length: 4 }).notNull(),
  statut: payoutStatusEnum("statut").notNull().default("en_attente"),
  reference: varchar("reference", { length: 128 }),
  preuveUrl: varchar("preuve_url", { length: 512 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
