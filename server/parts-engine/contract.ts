/**
 * Parts Engine — contrat public (types stables, règle MOS #12).
 *
 * Les autres moteurs passent par ces types et par les fonctions exportées de
 * `service.ts` — jamais en lisant directement les tables `parts_*`.
 */
import { CANONICAL_PART_FIELDS } from "../supplier-engine/contract.js";

export { CANONICAL_PART_FIELDS };

/** Cycle de synchronisation d'une pièce fournisseur (point "STATUTS" du plan LOT 3). */
export const PART_SYNC_STATUSES = [
  "IMPORTED",
  "MAPPING_PENDING",
  "ANALYSIS_PENDING",
  "COMPATIBILITY_PENDING",
  "VALIDATION_PENDING",
  "READY_TO_PUBLISH",
  "PUBLISHED",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "UNAVAILABLE",
  "DISCONTINUED",
  "REMOVED",
  "ERROR",
  "SYNC_ERROR",
] as const;
export type PartSyncStatus = (typeof PART_SYNC_STATUSES)[number];

export const STOCK_STATUSES = ["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK", "BACKORDER", "DISCONTINUED", "UNKNOWN"] as const;
export type StockStatus = (typeof STOCK_STATUSES)[number];

export const RESERVATION_STATUSES = ["active", "released", "consumed", "expired"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export const CANONICAL_MATCH_STATUSES = ["non_evalue", "a_verifier", "confirme", "nouvelle_piece"] as const;
export type CanonicalMatchStatus = (typeof CANONICAL_MATCH_STATUSES)[number];

export const CROSS_REFERENCE_STATUSES = ["a_verifier", "confirme", "ecarte"] as const;
export type CrossReferenceStatus = (typeof CROSS_REFERENCE_STATUSES)[number];

/**
 * Niveaux de compatibilité (point "COMPATIBILITÉ VÉHICULE" du plan). Ne
 * jamais afficher "compatible" uniquement parce que les mots se ressemblent.
 */
export const COMPATIBILITY_LEVELS = [
  "VERIFIED_COMPATIBLE",
  "LIKELY_COMPATIBLE",
  "MANUAL_VALIDATION_REQUIRED",
  "INCOMPATIBLE",
  "UNKNOWN",
] as const;
export type CompatibilityLevel = (typeof COMPATIBILITY_LEVELS)[number];

/** Bus d'événements typés (règle MOS #12). Publiés aussi sur l'Event Bus central. */
export type PartsEngineEvent =
  | { type: "part.imported"; supplierItemId: number; supplierProfileId: number }
  | { type: "part.normalized"; supplierItemId: number; mappingVersion: number }
  | { type: "part.updated"; supplierItemId: number }
  | { type: "part.mapping.completed"; supplierItemId: number; mappingVersion: number }
  | { type: "part.compatibility.checked"; supplierItemId: number; matchLevel: CompatibilityLevel }
  | { type: "part.validation.required"; supplierItemId: number; manques: string[] }
  | { type: "part.ready"; supplierItemId: number }
  | { type: "part.published"; supplierItemId: number; catalogId: number }
  | { type: "part.price.changed"; supplierItemId: number; retailPriceTtc: number; retailCurrency: string }
  | { type: "part.stock.changed"; supplierItemId: number; stockStatus: StockStatus }
  | { type: "part.low_stock"; supplierItemId: number }
  | { type: "part.out_of_stock"; supplierItemId: number }
  | { type: "part.removed"; supplierItemId: number; reason: string }
  | { type: "part.sync.failed"; supplierItemId: number; reason: string };

export const PARTS_ENGINE_META = {
  name: "parts_engine" as const,
  label: "Parts Engine" as const,
  contract: "server/parts-engine/index.ts",
};
