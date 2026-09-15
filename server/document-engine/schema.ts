/**
 * Document Engine — schéma (LOT 6 du Plan Maître Fournisseurs). Aucun
 * registre de documents n'est recréé : `docDocumentId` référence
 * `doc_documents.id` (Document OS, server/document-os/index.ts) en lecture
 * seule, sans FK dure — même principe que partout ailleurs dans le plan.
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

/** Supplier Document Engine (§33) — un document fournisseur = une ligne Document OS + son type métier. */
export const supplierDocuments = pgTable(
  "supplier_documents",
  {
    id: serial("id").primaryKey(),
    supplierProfileId: integer("supplier_profile_id").notNull(),
    docType: varchar("doc_type", { length: 48 }).notNull(),
    /** `doc_documents.id` (Document OS) — la ligne réelle du document. */
    docDocumentId: integer("doc_document_id"),
    notes: text("notes"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    supplierIdx: index("supplier_documents_supplier_idx").on(t.supplierProfileId, t.docType),
  }),
);

/** Vehicle Document Engine (§34) — même principe pour les documents véhicule. */
export const vehicleDocuments = pgTable(
  "vehicle_documents",
  {
    id: serial("id").primaryKey(),
    vehicleItemId: integer("vehicle_item_id").notNull(),
    docType: varchar("doc_type", { length: 48 }).notNull(),
    docDocumentId: integer("doc_document_id"),
    notes: text("notes"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("vehicle_documents_vehicle_idx").on(t.vehicleItemId, t.docType),
  }),
);

/**
 * Document Custody Engine (§35) — chaîne de possession, générique par
 * entité. Une entrée = un document (original ou copie) physiquement ou
 * numériquement détenu par quelqu'un, avec sa date de réception et, le cas
 * échéant, sa remise.
 */
export const custodyRecords = pgTable(
  "custody_records",
  {
    id: serial("id").primaryKey(),
    entityType: varchar("entity_type", { length: 32 }).notNull(),
    entityId: integer("entity_id").notNull(),
    docType: varchar("doc_type", { length: 48 }).notNull(),
    /** `doc_documents.id` (Document OS), si le document a une ligne dans le registre unifié. */
    docDocumentId: integer("doc_document_id"),
    kind: varchar("kind", { length: 16 }).notNull().default("original"),
    status: varchar("status", { length: 16 }).notNull().default("attendu"),
    /** Détenteur actuel — libellé libre (ex. "MKA.P-MS", "Client #42", "Transporteur DHL"), jamais un second registre d'identité. */
    currentHolder: varchar("current_holder", { length: 160 }),
    receivedAt: timestamp("received_at"),
    handedOverAt: timestamp("handed_over_at"),
    recipient: varchar("recipient", { length: 160 }),
    /** Preuve de remise (URL de signature, référence de bordereau…) — jamais une remise sans trace. */
    proofOfHandover: text("proof_of_handover"),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index("custody_records_entity_idx").on(t.entityType, t.entityId, t.docType),
    statusIdx: index("custody_records_status_idx").on(t.status),
  }),
);

/**
 * "Document requis par étape" / "Blocage si document manquant" (§35) — une
 * exigence déclarative, jamais une déduction automatique. Une étape sans
 * exigence déclarée ne bloque jamais rien : le silence n'est pas un accord,
 * mais il ne doit pas non plus inventer une contrainte non voulue.
 */
export const custodyRequirements = pgTable(
  "custody_requirements",
  {
    id: serial("id").primaryKey(),
    entityType: varchar("entity_type", { length: 32 }).notNull(),
    step: varchar("step", { length: 48 }).notNull(),
    docType: varchar("doc_type", { length: 48 }).notNull(),
    mandatory: boolean("mandatory").notNull().default(true),
    active: boolean("active").notNull().default(true),
    createdBy: integer("created_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    stepIdx: index("custody_requirements_step_idx").on(t.entityType, t.step, t.active),
  }),
);

/** Audit obligatoire (règle MOS #12 : table `<engine>_audit_log`). */
export const documentEngineAuditLog = pgTable(
  "document_engine_audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    entityType: varchar("entity_type", { length: 32 }),
    entityId: integer("entity_id"),
    action: varchar("action", { length: 48 }).notNull(),
    actorId: integer("actor_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    entityIdx: index("document_engine_audit_log_entity_idx").on(t.entityType, t.entityId, t.createdAt),
  }),
);

/** Journal de santé (même mécanique que les autres moteurs LOT 1-5). */
export const documentEngineHealthLog = pgTable("document_engine_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
