/**
 * Logistics Engine — schéma (LOT 4 du Plan Maître Fournisseurs, TRANSPORT/
 * LIVRAISON). Aucun transporteur n'est codé en dur : `carrier_code` référence
 * le catalogue `CARRIER_CATALOG` (contract.ts), jamais une table dédiée par
 * transporteur. `supplier_profile_id` référence `supplier_profiles.id`
 * (LOT 1, `supplierType: "transport"`) en lecture seule, sans FK dure.
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
 * Connecteur transporteur (§67-68) — même principe honnête que
 * `supplier_connections` (LOT 1) : sans secret réel, le statut reste
 * `not_connected`, jamais simulé comme actif.
 */
export const logisticsCarrierConnections = pgTable(
  "logistics_carrier_connections",
  {
    id: serial("id").primaryKey(),
    carrierCode: varchar("carrier_code", { length: 32 }).notNull(),
    /** Fournisseur transporteur du Supplier Engine (LOT 1), si le transporteur s'est enregistré comme fournisseur. */
    supplierProfileId: integer("supplier_profile_id"),
    method: varchar("method", { length: 32 }).notNull(),
    authType: varchar("auth_type", { length: 16 }).notNull().default("none"),
    environment: varchar("environment", { length: 16 }).notNull().default("sandbox"),
    status: varchar("status", { length: 16 }).notNull().default("not_connected"),
    endpointUrl: text("endpoint_url"),
    secretRef: varchar("secret_ref", { length: 128 }),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    lastHealthCheckAt: timestamp("last_health_check_at"),
    lastHealthStatus: varchar("last_health_status", { length: 16 }).notNull().default("not_connected"),
    lastHealthMessage: text("last_health_message"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    carrierIdx: index("logistics_carrier_connections_carrier_idx").on(t.carrierCode, t.active),
  }),
);

/** MASTER SHIPMENT (§71) — l'expédition globale, agrégat des legs. */
export const logisticsShipments = pgTable(
  "logistics_shipments",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    /** "vehicle_engine" | "parts_engine" | "manuel" | "api_transporteur" */
    sourceType: varchar("source_type", { length: 24 }).notNull().default("manuel"),
    /** `vehicle_items.id` ou `parts_supplier_items.id` selon sourceType — entier libre. */
    sourceItemId: integer("source_item_id"),
    categorie: varchar("categorie", { length: 16 }).notNull(),
    origineVille: varchar("origine_ville", { length: 128 }),
    originePays: varchar("origine_pays", { length: 4 }),
    destinationVille: varchar("destination_ville", { length: 128 }),
    destinationPays: varchar("destination_pays", { length: 4 }),
    poidsKg: numeric("poids_kg", { precision: 10, scale: 3 }),
    valeurDeclaree: numeric("valeur_declaree", { precision: 12, scale: 2 }),
    devise: varchar("devise", { length: 8 }).notNull().default("EUR"),
    /** Statut normalisé agrégé (TRACKING_STATUSES) — dérivé des legs, jamais saisi directement. */
    status: varchar("status", { length: 24 }).notNull().default("CREATED"),
    totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    sourceIdx: index("logistics_shipments_source_idx").on(t.sourceType, t.sourceItemId),
    statusIdx: index("logistics_shipments_status_idx").on(t.status),
  }),
);

/** LEG 1-4 (§71) — un transporteur, une responsabilité, des documents et une condition de paiement par leg. */
export const logisticsLegs = pgTable(
  "logistics_legs",
  {
    id: serial("id").primaryKey(),
    shipmentId: integer("shipment_id").notNull(),
    legIndex: integer("leg_index").notNull(),
    carrierCode: varchar("carrier_code", { length: 32 }).notNull(),
    carrierConnectionId: integer("carrier_connection_id"),
    mode: varchar("mode", { length: 16 }).notNull(),
    origineVille: varchar("origine_ville", { length: 128 }),
    originePays: varchar("origine_pays", { length: 4 }),
    destinationVille: varchar("destination_ville", { length: 128 }),
    destinationPays: varchar("destination_pays", { length: 4 }),
    tarif: numeric("tarif", { precision: 12, scale: 2 }),
    devise: varchar("devise", { length: 8 }).notNull().default("EUR"),
    delaiJoursMin: integer("delai_jours_min"),
    delaiJoursMax: integer("delai_jours_max"),
    status: varchar("status", { length: 24 }).notNull().default("CREATED"),
    /** Qui répond juridiquement de la marchandise sur ce leg — jamais fusionné entre legs. */
    responsabilite: text("responsabilite"),
    conditionPaiement: text("condition_paiement"),
    numeroSuivi: varchar("numero_suivi", { length: 128 }),
    urlSuivi: text("url_suivi"),
    documents: jsonb("documents").$type<{ type: string; url: string }[]>().notNull().default([]),
    preuves: jsonb("preuves").$type<{ type: string; url: string; horodatage: string }[]>().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    shipmentIdx: index("logistics_legs_shipment_idx").on(t.shipmentId, t.legIndex),
    carrierIdx: index("logistics_legs_carrier_idx").on(t.carrierCode),
  }),
);

/** Delivery Quote Engine (§69) — historique des devis générés, toujours ÉCONOMIQUE/RECOMMANDÉ/EXPRESS. */
export const logisticsQuotes = pgTable(
  "logistics_quotes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    shipmentId: integer("shipment_id"),
    categorie: varchar("categorie", { length: 16 }).notNull(),
    requestPayload: jsonb("request_payload").$type<Record<string, unknown>>().notNull().default({}),
    options: jsonb("options").$type<Record<string, unknown>[]>().notNull().default([]),
    chosenTier: varchar("chosen_tier", { length: 16 }),
    chosenCarrierCode: varchar("chosen_carrier_code", { length: 32 }),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    shipmentIdx: index("logistics_quotes_shipment_idx").on(t.shipmentId),
  }),
);

/** Tracking Engine (§72-73) — chaque mise à jour de statut journalisée, jamais écrasée. */
export const logisticsTrackingEvents = pgTable(
  "logistics_tracking_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    shipmentId: integer("shipment_id").notNull(),
    legId: integer("leg_id"),
    status: varchar("status", { length: 24 }).notNull(),
    /** Statut brut du transporteur avant normalisation — jamais perdu. */
    rawCarrierStatus: text("raw_carrier_status"),
    /** "carrier_webhook" | "api_transporteur" | "manuel" | "systeme" */
    source: varchar("source", { length: 24 }).notNull(),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    shipmentIdx: index("logistics_tracking_events_shipment_idx").on(t.shipmentId, t.occurredAt),
  }),
);

/**
 * Clé API délivrée à un transporteur pour appeler l'API MKA.P-MS (§74).
 * Même patron que `partner_api_keys` (server/routers/operations.ts) : seul
 * le hash est stocké, la valeur en clair n'est montrée qu'à la création.
 */
export const logisticsApiKeys = pgTable(
  "logistics_api_keys",
  {
    id: serial("id").primaryKey(),
    carrierCode: varchar("carrier_code", { length: 32 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    keyPrefix: varchar("key_prefix", { length: 32 }).notNull(),
    keyHash: varchar("key_hash", { length: 128 }).notNull(),
    scopes: varchar("scopes", { length: 255 }),
    active: boolean("active").notNull().default(true),
    lastUsedAt: timestamp("last_used_at"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    carrierIdx: index("logistics_api_keys_carrier_idx").on(t.carrierCode, t.active),
    prefixIdx: index("logistics_api_keys_prefix_idx").on(t.keyPrefix),
  }),
);

/**
 * Journal de chaque webhook transporteur reçu (§66) : signature invalide ou
 * non traitée reste visible, jamais silencieusement ignorée.
 */
export const logisticsWebhookLog = pgTable(
  "logistics_webhook_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    carrierCode: varchar("carrier_code", { length: 32 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    signatureValid: boolean("signature_valid").notNull().default(false),
    status: varchar("status", { length: 24 }).notNull().default("recu"),
    error: text("error"),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
  },
  (t) => ({
    carrierIdx: index("logistics_webhook_log_carrier_idx").on(t.carrierCode, t.receivedAt),
  }),
);

/** Audit obligatoire (règle MOS #12 : table `<engine>_audit_log`). */
export const logisticsAuditLog = pgTable(
  "logistics_audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    shipmentId: integer("shipment_id"),
    action: varchar("action", { length: 48 }).notNull(),
    actorId: integer("actor_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    shipmentIdx: index("logistics_audit_log_shipment_idx").on(t.shipmentId, t.createdAt),
  }),
);

/** Journal de santé (même mécanique que `vehicle_health_log`/`parts_health_log`). */
export const logisticsHealthLog = pgTable("logistics_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
