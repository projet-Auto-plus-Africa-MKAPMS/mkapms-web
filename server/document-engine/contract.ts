/**
 * Document Engine — contrat (LOT 6 du Plan Maître Fournisseurs).
 *
 * Trois sous-moteurs nommés par le plan, un seul module technique (même
 * décomposition que le Supplier Engine, §65 du plan) :
 *   §33 Supplier Document Engine — documents contractuels fournisseur.
 *   §34 Vehicle Document Engine  — documents véhicule (hors démarche SIV,
 *       déjà couverte par le Carte Grise Engine existant, jamais dupliquée).
 *   §35 Document Custody Engine  — chaîne de possession générique,
 *       réutilisable par n'importe quel type de document et d'entité.
 *
 * Aucun registre de document n'est recréé ici : chaque document réel est une
 * ligne du Document OS existant (`server/document-os/`, `doc_documents`).
 * Ce moteur ne fait qu'ajouter le registre des exigences (quel document est
 * requis, pour qui, à quelle étape) et le suivi de possession physique —
 * jamais un second stockage de documents.
 */

/** Types de documents fournisseur (§33) — un `doc_types.code` Document OS par valeur. */
export const SUPPLIER_DOCUMENT_TYPES = [
  "convention_cadre",
  "annexe_commerciale",
  "annexe_technique",
  "annexe_api",
  "annexe_territoires",
  "annexe_donnees",
  "autorisation_diffusion",
  "rgpd",
  "confidentialite",
  "facture_fournisseur",
  "releve_fournisseur",
] as const;
export type SupplierDocumentType = (typeof SUPPLIER_DOCUMENT_TYPES)[number];

/**
 * Documents contractuels minimaux avant qu'un fournisseur ne soit considéré
 * pleinement onboardé (§33). Une politique par fournisseur peut compléter
 * cette liste (jamais la réduire) via `supplier_document_requirements`.
 */
export const SUPPLIER_DOCUMENT_BASELINE: SupplierDocumentType[] = [
  "convention_cadre",
  "rgpd",
  "confidentialite",
];

/** Types de documents véhicule (§34) — carte_grise/certificat_cession/situation_administrative sont aussi trackés ici même quand le Carte Grise Engine gère leur démarche SIV, pour les véhicules importés hors démarche française. */
export const VEHICLE_DOCUMENT_TYPES = [
  "carte_grise",
  "controle_technique",
  "certificat_cession",
  "situation_administrative",
  "coc",
  "facture_vehicule",
  "entretien",
  "garantie",
  "export",
  "douane",
  "document_pays",
] as const;
export type VehicleDocumentType = (typeof VEHICLE_DOCUMENT_TYPES)[number];

/** Documents minimaux exigés avant d'autoriser l'export d'un véhicule (§34 + point d'intégration `vehicle_territories.documentsReadyForExport`, LOT 2). */
export const VEHICLE_EXPORT_BASELINE: VehicleDocumentType[] = ["carte_grise", "coc", "douane"];

/** Original vs copie (§35) — une copie ne vaut jamais preuve légale au même titre qu'un original. */
export const CUSTODY_KINDS = ["original", "copie"] as const;
export type CustodyKind = (typeof CUSTODY_KINDS)[number];

/** Cycle de vie d'une possession (§35). */
export const CUSTODY_STATUSES = ["attendu", "en_possession", "remis", "perdu", "detruit"] as const;
export type CustodyStatus = (typeof CUSTODY_STATUSES)[number];

/**
 * Types d'entités pouvant porter une exigence documentaire ou une
 * possession — générique, jamais un moteur par type d'entité (§35 est
 * transversal par construction).
 */
export const CUSTODY_ENTITY_TYPES = [
  "supplier_profile",
  "vehicle_item",
  "logistics_shipment",
  "payout_schedule",
] as const;
export type CustodyEntityType = (typeof CUSTODY_ENTITY_TYPES)[number];

export interface CustodyStepCheck {
  blocked: boolean;
  satisfied: string[];
  missing: string[];
}

export const DOCUMENT_ENGINE_META = {
  name: "document_engine",
  label: "Document Engine",
  version: "0.1.0",
  planReference: "Plan Maître Fournisseurs §33-35 (LOT 6)",
} as const;

/** Événements typés publiés par ce moteur (voir server/event-bus/catalog.ts). */
export type DocumentEngineEvent =
  | { type: "document.supplier.registered"; payload: { supplierProfileId: number; docType: SupplierDocumentType } }
  | { type: "document.vehicle.registered"; payload: { vehicleItemId: number; docType: VehicleDocumentType } }
  | { type: "document.custody.received"; payload: { entityType: CustodyEntityType; entityId: number; docType: string } }
  | { type: "document.custody.handed_over"; payload: { entityType: CustodyEntityType; entityId: number; docType: string; recipient: string } }
  | { type: "document.requirement.blocked"; payload: { entityType: CustodyEntityType; entityId: number; step: string; missing: string[] } };
