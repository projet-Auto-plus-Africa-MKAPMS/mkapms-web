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

    /**
     * `vehicle_items.id` (Vehicle Engine, LOT 2) — entier libre, jamais de FK
     * dure inter-moteur. NULLABLE : une annonce « véhicule sur commande »
     * déposée via le bouton « Manuel » (système de dépôt existant,
     * `annonces.create`) n'a jamais été ingérée par le Vehicle Engine — ce
     * champ n'est renseigné que lorsque le mode assisté par IA (Vehicle AI
     * Engine / Vehicle Engine) a produit l'annonce. L'IA ne doit jamais être
     * une condition pour commander : ce champ ne peut donc jamais être requis.
     */
    vehicleItemId: integer("vehicle_item_id"),
    /** `annonces.id` — la fiche publique réutilisée telle quelle, jamais dupliquée. Seule ancre réellement requise. */
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

    /**
     * Prix fournisseur et marge — posés par un employé à l'étape « Prix et
     * marge validés » (section 8, demande PDG). STRICTEMENT confidentiels :
     * jamais lus par une procédure client (`detailCommandeClient`), jamais
     * renvoyés par `annonces.get`. Nécessaires au versement fournisseur réel
     * (Payout Engine) une fois la vente acceptée — même principe que
     * `vehicle_pricing.supplierPrice` (Vehicle Engine), jamais recopiés en clair ailleurs.
     */
    supplierPriceConfidential: numeric("supplier_price_confidential", { precision: 12, scale: 2 }),
    marginConfidential: numeric("margin_confidential", { precision: 12, scale: 2 }),
    priceMarginValidatedBy: integer("price_margin_validated_by"),
    priceMarginValidatedAt: timestamp("price_margin_validated_at"),

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
 * Lien entre une annonce « véhicule sur commande » déjà publiée (mode IA
 * assistée OU bouton « Manuel » — sections 2-4, demande PDG) et son
 * fournisseur, dès la publication, avant même qu'un client ne commande.
 * Permet au statut public dérivé (sections 3 et 6) et à `creerCommande()`
 * de retrouver `supplierProfileId`/`vehicleItemId` sans jamais exiger que
 * l'appelant (client) les connaisse ou les fournisse — ces identifiants
 * restent confidentiels, jamais transmis par un client (règle MOS :
 * aucune donnée fournisseur côté client).
 */
export const orderListings = pgTable(
  "order_listings",
  {
    id: serial("id").primaryKey(),
    annonceId: integer("annonce_id").notNull().unique(),
    /** `vehicle_items.id` (Vehicle Engine) — absent si déposée via le bouton « Manuel » (système de dépôt existant, jamais un second formulaire). */
    vehicleItemId: integer("vehicle_item_id"),
    supplierProfileId: integer("supplier_profile_id").notNull(),
    /**
     * "ia_assistee" | "manuelle" — traçabilité de l'origine uniquement,
     * jamais une condition de fonctionnement : règle PDG absolue, l'IA
     * n'est jamais un passage obligé pour publier, commander ou valider.
     */
    creationMode: varchar("creation_mode", { length: 16 }).notNull(),
    createdByEmployeeId: integer("created_by_employee_id").notNull(),

    /**
     * Détails « véhicule sur commande » côté client (demande PDG, parcours
     * manuel) — affichés sur la fiche produit partagée (Vehicule.tsx),
     * section « Voir les détails » : jamais un prix ni une donnée
     * fournisseur, donc jamais confidentiels contrairement aux champs
     * ci-dessous.
     */
    vehicleLocation: varchar("vehicle_location", { length: 200 }),
    deliveryPrepDetails: text("delivery_prep_details"),

    /**
     * Bloc « Réservation et acompte » + « Livraison ou retrait » (demande
     * PDG, comparaison Autohero/Carvana/cinch) — tous affichés sur la fiche
     * produit partagée, jamais une page produit séparée. Non confidentiels :
     * aucun prix ni donnée fournisseur, seulement des conditions et délais
     * indicatifs que le client voit avant de commander.
     */
    prepDelayDays: integer("prep_delay_days"),
    deliveryDelayDays: integer("delivery_delay_days"),
    pickupDelayDays: integer("pickup_delay_days"),
    prepFee: numeric("prep_fee", { precision: 10, scale: 2 }),
    deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }),
    pickupFee: numeric("pickup_fee", { precision: 10, scale: 2 }),
    deliveryZones: text("delivery_zones"),
    handoverConditions: text("handover_conditions"),
    requiredDocuments: text("required_documents"),
    depositAmount: numeric("deposit_amount_standard", { precision: 10, scale: 2 }),
    refundConditions: text("refund_conditions"),
    cancellationConditions: text("cancellation_conditions"),
    /**
     * Adresse exacte de remise — jamais publique avant confirmation de la
     * commande (demande PDG : seule la zone/ville, dans `vehicleLocation`,
     * est visible sur la fiche produit). Lue uniquement par
     * `detailCommandeClient`, une fois le client propriétaire de la commande
     * authentifié et son statut passé « disponibilité confirmée » ou
     * au-delà — jamais par `annonces.get` (procédure publique).
     */
    exactPickupAddress: text("exact_pickup_address"),

    /**
     * Choix employé (demande PDG) : si la commande n'aboutit pas, le
     * véhicule peut entrer dans le stock MKA.P-MS — ce champ enregistre
     * uniquement l'intention pour le parcours après-vente existant (non
     * modifié ici) ; aucune bascule automatique n'est déclenchée par cette
     * valeur dans ce lot.
     */
    returnToStockIfUnsold: boolean("return_to_stock_if_unsold").notNull().default(false),
    /**
     * Tant qu'un véhicule sur commande reste en dropshipping pur (pas encore
     * entré dans le stock MKA.P-MS), « Paiement en plusieurs fois » ne doit
     * jamais être proposé sur sa fiche produit (demande PDG) — faux par
     * défaut, à activer explicitement au cas par cas.
     */
    installmentPaymentAllowed: boolean("installment_payment_allowed").notNull().default(false),

    /**
     * Estimation de prix, saisie par l'employé avant publication (demande
     * PDG, parcours manuel) — distincte de `order_items.supplier_price_confidential`
     * / `margin_confidential` (posés plus tard, à la commande, « section 8 »,
     * par le Pricing Engine / Payment Orchestrator) : ceci est une
     * planification indicative au dépôt, jamais le montant réel facturé.
     * STRICTEMENT confidentiel — jamais exposé à un client.
     */
    supplierPurchasePriceEstimated: numeric("supplier_purchase_price_estimated", { precision: 12, scale: 2 }),
    transportCostEstimated: numeric("transport_cost_estimated", { precision: 12, scale: 2 }),
    targetMarginPercent: numeric("target_margin_percent", { precision: 5, scale: 2 }),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    annonceIdx: index("order_listings_annonce_idx").on(t.annonceId),
    supplierIdx: index("order_listings_supplier_idx").on(t.supplierProfileId),
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
