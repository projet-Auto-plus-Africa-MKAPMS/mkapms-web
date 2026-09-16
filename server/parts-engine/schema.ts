/**
 * Parts Engine — schéma (LOT 3 du Plan Maître Fournisseurs, PIÈCES
 * AUTOMOBILES UNIQUEMENT — jamais Transport/Livraison [LOT 4] ni Paiements
 * complets [LOT 5]).
 *
 * Ce moteur est la porte d'entrée d'une pièce fournie par un fournisseur déjà
 * enregistré dans le Supplier Engine (LOT 1). Il ne recrée pas la marketplace
 * pièces déjà existante et réellement utilisée (`parts_shops`, `parts_catalog`,
 * `parts_compatibility`, `parts_stock`, `parts_orders` — `server/schema.ts`,
 * exploitées par `server/routers/pieces.ts`) : il l'ÉTEND. La publication
 * d'une pièce fournisseur crée une vraie ligne `parts_catalog` (et
 * `parts_stock`/`parts_compatibility` associées), exactement comme le Vehicle
 * Engine (LOT 2) publie dans `annonces` au lieu de dupliquer la marketplace
 * véhicules.
 *
 * `supplier_profile_id` référence `supplier_profiles.id` (LOT 1) en lecture
 * seule, sans contrainte FK dure (moteur indépendant, règle MOS #11).
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
 * Pièce canonique MKA.P-MS : une identité produit unique, indépendante du
 * fournisseur. Plusieurs `parts_supplier_items` (donc plusieurs offres
 * `parts_catalog`) peuvent partager la même pièce canonique — jamais fusionnés
 * automatiquement, seulement liés après une correspondance suffisamment sûre
 * (voir `parts_supplier_items.canonical_match_status`).
 */
export const partsCanonical = pgTable(
  "parts_canonical",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    referenceOem: varchar("reference_oem", { length: 96 }),
    marquePiece: varchar("marque_piece", { length: 128 }),
    categorie: varchar("categorie", { length: 128 }),
    sousCategorie: varchar("sous_categorie", { length: 128 }),
    nomPiece: varchar("nom_piece", { length: 255 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    oemIdx: index("parts_canonical_oem_idx").on(t.referenceOem),
  }),
);

/**
 * Fiche d'ingestion d'une pièce fournisseur — même séparation stricte des
 * origines de données que le Vehicle Engine (LOT 2) : rawData jamais modifiée,
 * normalizedData (mapping appliqué), enrichedData (contrôles déterministes),
 * aiData (suggestions MKA.P-MS AI seules), validatedData
 * (corrections humaines, toujours prioritaires).
 */
export const partsSupplierItems = pgTable(
  "parts_supplier_items",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    supplierProfileId: integer("supplier_profile_id").notNull(),
    supplierPartId: varchar("supplier_part_id", { length: 128 }).notNull(),
    ingestMethod: varchar("ingest_method", { length: 32 }).notNull(),

    referenceOem: varchar("reference_oem", { length: 96 }),
    ean: varchar("ean", { length: 32 }),

    /**
     * "IMPORTED" | "MAPPING_PENDING" | "ANALYSIS_PENDING" |
     * "COMPATIBILITY_PENDING" | "VALIDATION_PENDING" | "READY_TO_PUBLISH" |
     * "PUBLISHED" | "LOW_STOCK" | "OUT_OF_STOCK" | "UNAVAILABLE" |
     * "DISCONTINUED" | "REMOVED" | "ERROR" | "SYNC_ERROR"
     */
    status: varchar("status", { length: 24 }).notNull().default("IMPORTED"),
    statusReason: text("status_reason"),

    rawData: jsonb("raw_data").$type<Record<string, unknown>>().notNull().default({}),
    normalizedData: jsonb("normalized_data").$type<Record<string, unknown>>().notNull().default({}),
    enrichedData: jsonb("enriched_data").$type<Record<string, unknown>>().notNull().default({}),
    aiData: jsonb("ai_data").$type<Record<string, unknown>>().notNull().default({}),
    validatedData: jsonb("validated_data").$type<Record<string, unknown>>().notNull().default({}),
    mappingVersion: integer("mapping_version"),

    /** Pièce canonique liée, une fois l'identité suffisamment sûre (jamais devinée). */
    canonicalPartId: integer("canonical_part_id"),
    /** "non_evalue" | "a_verifier" | "confirme" | "nouvelle_piece" */
    canonicalMatchStatus: varchar("canonical_match_status", { length: 24 }).notNull().default("non_evalue"),

    /** Créée seulement à la publication — `parts_catalog.id`, entier libre. */
    catalogId: integer("catalog_id"),

    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("parts_supplier_items_supplier_idx").on(t.supplierProfileId, t.supplierPartId),
    statusIdx: index("parts_supplier_items_status_idx").on(t.status),
    oemIdx: index("parts_supplier_items_oem_idx").on(t.referenceOem),
    eanIdx: index("parts_supplier_items_ean_idx").on(t.ean),
    catalogIdx: index("parts_supplier_items_catalog_idx").on(t.catalogId),
  }),
);

/**
 * OEM / Cross-Reference Engine : relie une référence constructeur à ses
 * équivalents (équipementier, aftermarket). Chaque équivalence porte sa
 * source — jamais considérée vraie sans preuve suffisante.
 */
export const partsOemCrossReferences = pgTable(
  "parts_oem_cross_references",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    referenceOem: varchar("reference_oem", { length: 96 }).notNull(),
    referenceAlternative: varchar("reference_alternative", { length: 96 }).notNull(),
    marqueAlternative: varchar("marque_alternative", { length: 128 }),
    /** "fournisseur" | "manuel" | "tecdoc" | "equipementier" */
    sourceType: varchar("source_type", { length: 24 }).notNull(),
    sourceRef: text("source_ref"),
    confidencePct: numeric("confidence_pct", { precision: 5, scale: 2 }).notNull(),
    /** "a_verifier" | "confirme" | "ecarte" — jamais appliqué sans décision humaine. */
    status: varchar("status", { length: 16 }).notNull().default("a_verifier"),
    decidedBy: integer("decided_by"),
    decidedAt: timestamp("decided_at"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    oemIdx: index("parts_oem_cross_references_oem_idx").on(t.referenceOem, t.status),
  }),
);

/**
 * Parts Compatibility Engine : résultat de compatibilité pour une pièce
 * fournisseur donnée. Une fois publiée, seules les lignes
 * VERIFIED_COMPATIBLE/LIKELY_COMPATIBLE sont matérialisées dans
 * `parts_compatibility` (table marketplace déjà existante, filtrage acheteur).
 */
export const partsCompatibilityChecks = pgTable(
  "parts_compatibility_checks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    supplierItemId: integer("supplier_item_id").notNull(),
    marque: varchar("marque", { length: 96 }).notNull(),
    modele: varchar("modele", { length: 128 }),
    generation: varchar("generation", { length: 64 }),
    anneeDebut: integer("annee_debut"),
    anneeFin: integer("annee_fin"),
    codeMoteur: varchar("code_moteur", { length: 64 }),
    codeBoite: varchar("code_boite", { length: 64 }),
    carburant: varchar("carburant", { length: 32 }),
    transmission: varchar("transmission", { length: 32 }),
    /** "VERIFIED_COMPATIBLE" | "LIKELY_COMPATIBLE" | "MANUAL_VALIDATION_REQUIRED" | "INCOMPATIBLE" | "UNKNOWN" */
    matchLevel: varchar("match_level", { length: 32 }).notNull().default("UNKNOWN"),
    /** Ce sur quoi repose le niveau — jamais "parce que les mots se ressemblent". */
    source: text("source").notNull(),
    decidedBy: integer("decided_by"),
    decidedAt: timestamp("decided_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    itemIdx: index("parts_compatibility_checks_item_idx").on(t.supplierItemId, t.matchLevel),
  }),
);

/** Parts Pricing Engine — prix fournisseur → prix public, TVA, commission. */
export const partsPricing = pgTable(
  "parts_pricing",
  {
    id: serial("id").primaryKey(),
    supplierItemId: integer("supplier_item_id").notNull().unique(),
    supplierPrice: numeric("supplier_price", { precision: 12, scale: 2 }).notNull(),
    supplierCurrency: varchar("supplier_currency", { length: 8 }).notNull(),
    commissionRatePct: numeric("commission_rate_pct", { precision: 6, scale: 3 }).notNull().default("0"),
    vatRatePct: numeric("vat_rate_pct", { precision: 5, scale: 2 }).notNull().default("20"),
    retailPriceHt: numeric("retail_price_ht", { precision: 12, scale: 2 }),
    retailPriceTtc: numeric("retail_price_ttc", { precision: 12, scale: 2 }),
    retailCurrency: varchar("retail_currency", { length: 8 }),
    minPriceContractual: numeric("min_price_contractual", { precision: 12, scale: 2 }),
    computedAt: timestamp("computed_at"),
    computedBy: integer("computed_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    itemIdx: index("parts_pricing_item_idx").on(t.supplierItemId),
  }),
);

/**
 * Parts Stock Engine : stock par entrepôt/pays. `warehouseId` référence
 * `warehouses.id` (existant, `server/modules/importafrica.ts`) en entier
 * libre — aucun moteur entrepôt recréé.
 */
export const partsStockLedger = pgTable(
  "parts_stock_ledger",
  {
    id: serial("id").primaryKey(),
    supplierItemId: integer("supplier_item_id").notNull().unique(),
    warehouseId: integer("warehouse_id"),
    countryCode: varchar("country_code", { length: 4 }),
    physicalQuantity: integer("physical_quantity").notNull().default(0),
    reservedQuantity: integer("reserved_quantity").notNull().default(0),
    incomingQuantity: integer("incoming_quantity").notNull().default(0),
    restockDate: timestamp("restock_date"),
    /** "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "BACKORDER" | "DISCONTINUED" | "UNKNOWN" */
    stockStatus: varchar("stock_status", { length: 16 }).notNull().default("UNKNOWN"),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(2),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    itemIdx: index("parts_stock_ledger_item_idx").on(t.supplierItemId),
    statusIdx: index("parts_stock_ledger_status_idx").on(t.stockStatus),
  }),
);

/**
 * Réservation temporaire de stock (une commande immobilise une quantité sans
 * la vendre). Somme des réservations "active" = `reservedQuantity` du ledger.
 * Le Payment Engine complet reste LOT 5 : ceci ne prépare que le hook de
 * libération automatique en cas d'échec/expiration de paiement.
 */
export const partsStockReservations = pgTable(
  "parts_stock_reservations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    supplierItemId: integer("supplier_item_id").notNull(),
    quantity: integer("quantity").notNull(),
    /** Référence externe (commande, panier) — entier libre, aucune table order recréée. */
    orderRef: varchar("order_ref", { length: 64 }),
    /** "active" | "released" | "consumed" | "expired" */
    status: varchar("status", { length: 16 }).notNull().default("active"),
    reservedAt: timestamp("reserved_at").notNull().defaultNow(),
    expiresAt: timestamp("expires_at"),
    releasedAt: timestamp("released_at"),
    releasedReason: text("released_reason"),
    createdBy: integer("created_by"),
  },
  (t) => ({
    itemIdx: index("parts_stock_reservations_item_idx").on(t.supplierItemId, t.status),
  }),
);

/**
 * Territoires et points d'intégration logistique futurs (LOT 4, jamais
 * connectés ici) — réutilise le Country OS/Country Policy Engine, aucun
 * moteur pays recréé.
 */
export const partsTerritories = pgTable(
  "parts_territories",
  {
    id: serial("id").primaryKey(),
    supplierItemId: integer("supplier_item_id").notNull().unique(),
    allowedSaleCountries: jsonb("allowed_sale_countries").$type<string[]>().notNull().default([]),
    excludedSaleCountries: jsonb("excluded_sale_countries").$type<string[]>().notNull().default([]),
    restrictedCountries: jsonb("restricted_countries").$type<string[]>().notNull().default([]),
    exportAllowed: boolean("export_allowed").notNull().default(false),
    /** Préparation LOT 4 (Logistics Engine) — jamais un connecteur transporteur réel. */
    hazardousMaterial: boolean("hazardous_material").notNull().default(false),
    fragile: boolean("fragile").notNull().default(false),
    oversized: boolean("oversized").notNull().default(false),
    transportRestrictions: jsonb("transport_restrictions").$type<string[]>().notNull().default([]),
    preparationDelay: integer("preparation_delay"),
    updatedBy: integer("updated_by"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    itemIdx: index("parts_territories_item_idx").on(t.supplierItemId),
  }),
);

/** Parts Data Quality Engine — chaque contrôle journalisé, jamais un simple booléen final. */
export const partsQualityChecks = pgTable(
  "parts_quality_checks",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    supplierItemId: integer("supplier_item_id").notNull(),
    checkType: varchar("check_type", { length: 48 }).notNull(),
    /** "ok" | "warning" | "error" */
    result: varchar("result", { length: 16 }).notNull(),
    detail: text("detail"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    itemIdx: index("parts_quality_checks_item_idx").on(t.supplierItemId),
  }),
);

/** Historique des transitions de statut — jamais écrasé. */
export const partsPublicationLog = pgTable(
  "parts_publication_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    supplierItemId: integer("supplier_item_id").notNull(),
    fromStatus: varchar("from_status", { length: 24 }),
    toStatus: varchar("to_status", { length: 24 }).notNull(),
    reason: text("reason"),
    /** null = transition automatique du moteur, pas une décision humaine. */
    actorId: integer("actor_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    itemIdx: index("parts_publication_log_item_idx").on(t.supplierItemId, t.createdAt),
  }),
);

/** Audit obligatoire (règle MOS #12 : table `<engine>_audit_log`). */
export const partsAuditLog = pgTable(
  "parts_audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    supplierItemId: integer("supplier_item_id"),
    action: varchar("action", { length: 48 }).notNull(),
    actorId: integer("actor_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    itemIdx: index("parts_audit_log_item_idx").on(t.supplierItemId, t.createdAt),
  }),
);

/** Journal de santé (même mécanique que `vehicle_health_log`/`supplier_health_log`). */
export const partsHealthLog = pgTable("parts_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Boutique fournisseur auto-provisionnée (une par fournisseur pièces) pour
 * que la publication puisse renseigner `parts_catalog.shop_id` (NOT NULL)
 * sans confondre un fournisseur B2B avec une boutique pro classique — même
 * principe que `annonces.ownerId = actorId` au LOT 2. `boolean` réservé au
 * flag "shop technique" pour ne jamais l'afficher comme une vraie boutique
 * gérée par un utilisateur.
 */
export const partsSupplierShopLinks = pgTable(
  "parts_supplier_shop_links",
  {
    id: serial("id").primaryKey(),
    supplierProfileId: integer("supplier_profile_id").notNull().unique(),
    shopId: integer("shop_id").notNull(),
    technique: boolean("technique").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("parts_supplier_shop_links_supplier_idx").on(t.supplierProfileId),
  }),
);
