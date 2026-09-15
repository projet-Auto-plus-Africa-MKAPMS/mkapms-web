/**
 * Vehicle Engine — schéma (LOT 2 du Plan Maître Fournisseurs, VÉHICULES
 * UNIQUEMENT — jamais Pièces [LOT 3] ni Transport/Livraison [LOT 4]).
 *
 * Ce moteur est la porte d'entrée d'un véhicule fourni par un fournisseur
 * déjà enregistré dans le Supplier Engine (LOT 1, `server/supplier-engine/`).
 * Il ne recrée rien de ce qui existe déjà :
 *  - le fournisseur lui-même, ses connecteurs et son mapping restent dans
 *    `server/supplier-engine/` (référencé ici en entier libre `supplierProfileId`,
 *    jamais en table dupliquée) ;
 *  - la géographie/devise/pays reste au Country OS (`server/country-os/`) et
 *    les règles d'autorisation (export, etc.) au Country Policy Engine
 *    (`server/country-policy/`) ;
 *  - la valeur de marché reste au VO Engine (`server/vo-engine/service.ts::estimate`) ;
 *  - la publication finale crée une ligne `annonces` déjà existante
 *    (`server/routers/annonces.ts`) — ce moteur ne republie pas un système de
 *    petites annonces parallèle, il alimente celui qui existe.
 *
 * `vehicleItems` sépare strictement, par colonne, la donnée originale
 * fournisseur, la donnée normalisée, la donnée enrichie et la donnée validée
 * humainement (point "DONNÉES FOURNISSEUR" du plan) : aucune étape n'écrase
 * la précédente, et MKA.P-MS Intelligences n'a jamais accès en écriture aux
 * colonnes originale/validée.
 */
import {
  bigserial,
  boolean,
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
 * Fiche canonique d'un véhicule fourni par un fournisseur. Une ligne par
 * véhicule et par fournisseur : le même véhicule physique peut légitimement
 * apparaître chez plusieurs sources (point "DOUBLONS" du plan) — la
 * déduplication est une décision explicite (`vehicleDuplicates`), jamais une
 * fusion automatique silencieuse.
 */
export const vehicleItems = pgTable(
  "vehicle_items",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    /** `supplier_profiles.id` (Supplier Engine, LOT 1) — entier libre, pas de FK dure. */
    supplierProfileId: integer("supplier_profile_id").notNull(),
    /** Identifiant du véhicule chez le fournisseur — sert à la synchronisation continue. */
    supplierVehicleId: varchar("supplier_vehicle_id", { length: 128 }).notNull(),
    /** Méthode d'ingestion réellement utilisée pour cette ligne (`supplier_connections.method`). */
    ingestMethod: varchar("ingest_method", { length: 32 }).notNull(),

    vin: varchar("vin", { length: 17 }),
    plaque: varchar("plaque", { length: 16 }),

    /**
     * "IMPORTED" | "ANALYSIS_PENDING" | "VALIDATION_PENDING" |
     * "READY_TO_PUBLISH" | "PUBLISHED" | "RESERVED" | "SOLD" | "UNAVAILABLE" |
     * "REMOVED" | "ERROR" | "SYNC_ERROR" — voir VEHICLE_SYNC_STATUSES (contract.ts).
     */
    status: varchar("status", { length: 24 }).notNull().default("IMPORTED"),
    statusReason: text("status_reason"),

    /** Donnée brute exactement comme reçue du fournisseur — jamais modifiée après ingestion. */
    rawData: jsonb("raw_data").$type<Record<string, unknown>>().notNull().default({}),
    /** Donnée mappée vers les champs canoniques (CANONICAL_VEHICLE_FIELDS, supplier-engine/contract.ts). */
    normalizedData: jsonb("normalized_data").$type<Record<string, unknown>>().notNull().default({}),
    /** Enrichissements déterministes (décodage VIN, devise convertie…) — jamais un fait inventé. */
    enrichedData: jsonb("enriched_data").$type<Record<string, unknown>>().notNull().default({}),
    /** Suggestions MKA.P-MS Intelligences seules : descriptions, score qualité — jamais une valeur contractuelle. */
    aiData: jsonb("ai_data").$type<Record<string, unknown>>().notNull().default({}),
    /** Corrections/validations humaines explicites — priment toujours sur normalizedData/aiData. */
    validatedData: jsonb("validated_data").$type<Record<string, unknown>>().notNull().default({}),
    /** Version du mapping fournisseur (`supplier_mappings.version`) utilisée pour ce véhicule. */
    mappingVersion: integer("mapping_version"),

    /** Créée seulement au moment de la publication — `annonces.id`, entier libre. */
    annonceId: integer("annonce_id"),

    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("vehicle_items_supplier_idx").on(t.supplierProfileId, t.supplierVehicleId),
    statusIdx: index("vehicle_items_status_idx").on(t.status),
    vinIdx: index("vehicle_items_vin_idx").on(t.vin),
    plaqueIdx: index("vehicle_items_plaque_idx").on(t.plaque),
    annonceIdx: index("vehicle_items_annonce_idx").on(t.annonceId),
  }),
);

/**
 * Vehicle Territory Engine — ne recrée pas de moteur pays : consomme le
 * Country OS (codes pays valides) et le Country Policy Engine (autorisation
 * d'export, jamais déduite par défaut).
 */
export const vehicleTerritories = pgTable(
  "vehicle_territories",
  {
    id: serial("id").primaryKey(),
    vehicleItemId: integer("vehicle_item_id").notNull().unique(),
    allowedSaleCountries: jsonb("allowed_sale_countries").$type<string[]>().notNull().default([]),
    excludedSaleCountries: jsonb("excluded_sale_countries").$type<string[]>().notNull().default([]),
    exportAllowed: boolean("export_allowed").notNull().default(false),
    euExportAllowed: boolean("eu_export_allowed").notNull().default(false),
    worldwideExportAllowed: boolean("worldwide_export_allowed").notNull().default(false),
    pickupCity: varchar("pickup_city", { length: 120 }),
    pickupCountryCode: varchar("pickup_country_code", { length: 4 }),
    /** Jours avant que le véhicule soit physiquement prêt à être enlevé. */
    vehicleReadyDelay: integer("vehicle_ready_delay"),
    documentsReadyForExport: boolean("documents_ready_for_export").notNull().default(false),
    /** Point d'intégration LOT 4 (Logistics Engine) — préparé, jamais un connecteur transporteur réel ici. */
    transportEligible: boolean("transport_eligible").notNull().default(false),
    /** ex. ["route","maritime","aerien","rail","roro"] — vocabulaire, pas de connecteur. */
    transportModesAllowed: jsonb("transport_modes_allowed").$type<string[]>().notNull().default([]),
    updatedBy: integer("updated_by"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_territories_vehicle_idx").on(t.vehicleItemId),
  }),
);

/** Vehicle Availability Engine — distinct du statut `annonces` : un véhicule fournisseur peut être réservé avant même publication. */
export const vehicleAvailability = pgTable(
  "vehicle_availability",
  {
    id: serial("id").primaryKey(),
    vehicleItemId: integer("vehicle_item_id").notNull().unique(),
    /** "available" | "reserved" | "sold" | "unavailable" */
    status: varchar("status", { length: 16 }).notNull().default("available"),
    reservedBy: integer("reserved_by"),
    reservedAt: timestamp("reserved_at"),
    reservedUntil: timestamp("reserved_until"),
    /** `bookings.id` existant si la réservation vient de la marketplace — entier libre. */
    bookingId: integer("booking_id"),
    soldAt: timestamp("sold_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_availability_vehicle_idx").on(t.vehicleItemId),
    statusIdx: index("vehicle_availability_status_idx").on(t.status),
  }),
);

/** Vehicle Pricing Engine — prix fournisseur → prix public, jamais l'inverse. */
export const vehiclePricing = pgTable(
  "vehicle_pricing",
  {
    id: serial("id").primaryKey(),
    vehicleItemId: integer("vehicle_item_id").notNull().unique(),
    supplierPrice: numeric("supplier_price", { precision: 12, scale: 2 }).notNull(),
    supplierCurrency: varchar("supplier_currency", { length: 8 }).notNull(),
    commissionRatePct: numeric("commission_rate_pct", { precision: 6, scale: 3 }).notNull().default("0"),
    publicPrice: numeric("public_price", { precision: 12, scale: 2 }),
    publicCurrency: varchar("public_currency", { length: 8 }),
    minPriceContractual: numeric("min_price_contractual", { precision: 12, scale: 2 }),
    computedAt: timestamp("computed_at"),
    computedBy: integer("computed_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_pricing_vehicle_idx").on(t.vehicleItemId),
  }),
);

/** Vehicle Duplicate Engine — chaque correspondance est une ligne décidée, jamais une fusion automatique. */
export const vehicleDuplicates = pgTable(
  "vehicle_duplicates",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    vehicleItemId: integer("vehicle_item_id").notNull(),
    matchedVehicleItemId: integer("matched_vehicle_item_id").notNull(),
    /** "vin" | "supplier_vehicle_id" | "plaque" | "caracteristiques" | "photo" */
    matchType: varchar("match_type", { length: 24 }).notNull(),
    confidencePct: numeric("confidence_pct", { precision: 5, scale: 2 }).notNull(),
    /** "a_verifier" | "confirme" | "ecarte" — jamais fusionné/supprimé automatiquement. */
    status: varchar("status", { length: 16 }).notNull().default("a_verifier"),
    decidedBy: integer("decided_by"),
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_duplicates_vehicle_idx").on(t.vehicleItemId, t.status),
  }),
);

/** Vehicle Condition Engine — rapport d'état multi-étapes (fournisseur → ... → client). */
export const vehicleConditionReports = pgTable(
  "vehicle_condition_reports",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    vehicleItemId: integer("vehicle_item_id").notNull(),
    /** "fournisseur" | "transporteur_depart" | "port" | "intermediaire" | "transporteur_arrivee" | "client" */
    stage: varchar("stage", { length: 24 }).notNull(),
    reportedBy: integer("reported_by"),
    kilometrage: integer("kilometrage"),
    notes: text("notes"),
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    videos: jsonb("videos").$type<string[]>().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_condition_reports_vehicle_idx").on(t.vehicleItemId, t.stage),
  }),
);

/** Vehicle Data Quality Engine — chaque contrôle journalisé, jamais un simple booléen final. */
export const vehicleQualityChecks = pgTable(
  "vehicle_quality_checks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    vehicleItemId: integer("vehicle_item_id").notNull(),
    checkType: varchar("check_type", { length: 48 }).notNull(),
    /** "ok" | "warning" | "error" */
    result: varchar("result", { length: 16 }).notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_quality_checks_vehicle_idx").on(t.vehicleItemId),
  }),
);

/** Vehicle Publication Engine — historique des transitions de statut, jamais écrasé. */
export const vehiclePublicationLog = pgTable(
  "vehicle_publication_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    vehicleItemId: integer("vehicle_item_id").notNull(),
    fromStatus: varchar("from_status", { length: 24 }),
    toStatus: varchar("to_status", { length: 24 }).notNull(),
    reason: text("reason"),
    /** null = transition automatique du moteur, pas une décision humaine. */
    actorId: integer("actor_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_publication_log_vehicle_idx").on(t.vehicleItemId, t.createdAt),
  }),
);

/** Audit obligatoire (règle MOS #12 : table `<engine>_audit_log`). */
export const vehicleAuditLog = pgTable(
  "vehicle_audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    vehicleItemId: integer("vehicle_item_id"),
    action: varchar("action", { length: 48 }).notNull(),
    actorId: integer("actor_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_audit_log_vehicle_idx").on(t.vehicleItemId, t.createdAt),
  }),
);

/** Journal de santé (même mécanique que `country_health_log` / `supplier_health_log`). */
export const vehicleHealthLog = pgTable("vehicle_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
