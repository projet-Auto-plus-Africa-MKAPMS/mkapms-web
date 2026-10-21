/**
 * Order Engine — schéma (Plan Maître Fournisseurs §36-37, section "COMMANDES").
 *
 * Portail « Véhicule sur commande » (demande PDG). Ce moteur prend le relais
 * du Vehicle Engine (LOT 2, `server/vehicle-engine/`) une fois qu'un véhicule
 * fournisseur est publié (`vehicle_items.status = "PUBLISHED"`, une ligne
 * `annonces` existe) : il ne recrée ni la fiche véhicule, ni le fournisseur,
 * ni la publication — il gère uniquement ce qui vient après, côté client et
 * côté fournisseur, pour UNE commande précise :
 *
 *  - §36 Order Engine (client)           : réservation → paiement → confirmation
 *    → préparation → transport → livraison → documents → clôture / annulation
 *    / retour / litige / remboursement.
 *  - §37 Supplier Order Engine (interne) : confirmation fournisseur →
 *    préparation → véhicule prêt → documents → remise transporteur.
 *
 * Le statut interne (riche, 10 étapes + branches) et le statut client (7
 * étapes, toujours un sous-ensemble simplifié) sont DEUX PROJECTIONS du même
 * historique (`orderStatusHistory`) — jamais deux champs stockés séparément
 * qui pourraient diverger. Voir `deriveCustomerStatus()` dans service.ts.
 *
 * Le système VO existant (`server/modules/vo.ts`, véhicules déjà achetés par
 * MKA.P-MS) reste totalement séparé et n'est touché par aucune table ici.
 *
 * Toute donnée fournisseur confidentielle (nom, prix d'achat, marge) reste
 * dans le Vehicle Engine / Supplier Engine — jamais recopiée ici en clair ;
 * seules des références entières libres (`vehicleItemId`, `supplierProfileId`)
 * sont stockées, comme partout ailleurs dans le MOS (règle du contrat public).
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
 * Une commande = un véhicule sur commande + un client. Un même `vehicleItem`
 * ne peut avoir qu'une commande active à la fois (contrôlé en service.ts,
 * jamais par contrainte SQL seule — un retour peut en légitimement précéder
 * une seconde commande sur le même véhicule remis en stock).
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),

    /** `vehicle_items.id` (Vehicle Engine, LOT 2) — entier libre, jamais de FK dure inter-moteur. */
    vehicleItemId: integer("vehicle_item_id").notNull(),
    /** `annonces.id` — la fiche publique réutilisée telle quelle, jamais dupliquée. */
    annonceId: integer("annonce_id").notNull(),
    /** `supplier_profiles.id` (Supplier Engine, LOT 1) — copié pour éviter une jointure inter-moteur à chaque lecture. */
    supplierProfileId: integer("supplier_profile_id").notNull(),

    /** `users.id` — le client qui a passé commande. */
    customerId: integer("customer_id").notNull(),
    /** `users.id` — l'employé auquel ce véhicule est attribué (section 7, demande PDG). Null tant que non attribué. */
    assignedEmployeeId: integer("assigned_employee_id"),
    assignedAt: timestamp("assigned_at"),
    assignedBy: integer("assigned_by"),

    /** Statut interne courant — toujours égal au dernier `orderStatusHistory.status` de cette commande. */
    status: varchar("status", { length: 32 }).notNull().default("vehicule_selectionne"),

    /** Montants : jamais recalculés ici à partir d'une estimation — toujours posés par le Pricing Engine / Payment Orchestrator. */
    totalAmount: numeric("total_amount", { precision: 12, scale: 2 }),
    depositAmount: numeric("deposit_amount", { precision: 12, scale: 2 }),
    balanceAmount: numeric("balance_amount", { precision: 12, scale: 2 }),
    currency: varchar("currency", { length: 4 }).notNull().default("EUR"),

    /** `payments.id` / `bookings.id` existants — entiers libres, jamais un second système de paiement. */
    depositPaymentRef: integer("deposit_payment_ref"),
    balancePaymentRef: integer("balance_payment_ref"),

    /** Date limite attendue de mise à disposition — affichée au client comme « estimation de livraison » (section 6). */
    estimatedReadyAt: timestamp("estimated_ready_at"),

    deadlineAt: timestamp("deadline_at"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    vehicleIdx: index("order_items_vehicle_idx").on(t.vehicleItemId),
    customerIdx: index("order_items_customer_idx").on(t.customerId),
    employeeIdx: index("order_items_employee_idx").on(t.assignedEmployeeId),
    statusIdx: index("order_items_status_idx").on(t.status),
  }),
);

/**
 * Historique des statuts — source de vérité unique. `orderItems.status` est
 * toujours une copie du dernier statut ici, jamais l'inverse (évite toute
 * divergence entre le statut courant affiché et l'historique réel).
 */
export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    orderItemId: integer("order_item_id").notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    /** "systeme" | "employe" | "fournisseur" | "client" */
    actorType: varchar("actor_type", { length: 16 }).notNull(),
    actorId: integer("actor_id"),
    note: text("note"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("order_status_history_order_idx").on(t.orderItemId, t.createdAt),
  }),
);

/**
 * Décision finale après visite/inspection (section 10, demande PDG) :
 * "accepte" | "retourne" | "garde". Une seule décision active par commande —
 * posée par un employé, jamais calculée automatiquement.
 */
export const orderDecisions = pgTable(
  "order_decisions",
  {
    id: serial("id").primaryKey(),
    orderItemId: integer("order_item_id").notNull().unique(),
    decision: varchar("decision", { length: 16 }).notNull(),
    decidedBy: integer("decided_by").notNull(),
    note: text("note"),
    /** Renseigné uniquement pour "retourne" — dossier de retour (Logistics Engine). */
    returnReference: varchar("return_reference", { length: 64 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("order_decisions_order_idx").on(t.orderItemId),
  }),
);

/**
 * Pointeurs vers les documents générés pour cette commande (section 11).
 * Aucun stockage de fichier ici : chaque document réel reste une ligne
 * `doc_documents` du Document OS existant (`server/document-os/`) — ce
 * moteur se contente de savoir QUEL document appartient à QUELLE commande.
 */
export const orderDocuments = pgTable(
  "order_documents",
  {
    id: serial("id").primaryKey(),
    orderItemId: integer("order_item_id").notNull(),
    /** Voir ORDER_DOCUMENT_TYPES (contract.ts). */
    documentType: varchar("document_type", { length: 32 }).notNull(),
    /** `doc_documents.id` (Document OS) — entier libre. */
    docDocumentId: integer("doc_document_id").notNull(),
    generatedBy: integer("generated_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("order_documents_order_idx").on(t.orderItemId, t.documentType),
  }),
);

/** Journal d'audit obligatoire (règle MOS #12). */
export const orderEngineAuditLog = pgTable(
  "order_engine_audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    action: varchar("action", { length: 64 }).notNull(),
    orderItemId: integer("order_item_id"),
    actorId: integer("actor_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    orderIdx: index("order_engine_audit_log_order_idx").on(t.orderItemId, t.createdAt),
  }),
);
