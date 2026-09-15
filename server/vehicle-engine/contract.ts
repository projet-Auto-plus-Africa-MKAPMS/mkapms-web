/**
 * Vehicle Engine — contrat public (types stables, règle MOS #12).
 *
 * Les autres moteurs (Publication, futur Logistics Engine du LOT 4) passent
 * par ces types et par les fonctions exportées de `service.ts` — jamais en
 * lisant directement les tables `vehicle_*`.
 */
import { CANONICAL_VEHICLE_FIELDS } from "../supplier-engine/contract.js";

export { CANONICAL_VEHICLE_FIELDS };

/**
 * Cycle de synchronisation d'un véhicule fournisseur (point "SYNCHRONISATION"
 * du plan). `ERROR` = échec de traitement interne ; `SYNC_ERROR` = échec côté
 * fournisseur (connecteur, données rejetées) — distingués pour ne jamais
 * confondre une panne MKA.P-MS avec une panne fournisseur.
 */
export const VEHICLE_SYNC_STATUSES = [
  "IMPORTED",
  "ANALYSIS_PENDING",
  "VALIDATION_PENDING",
  "READY_TO_PUBLISH",
  "PUBLISHED",
  "RESERVED",
  "SOLD",
  "UNAVAILABLE",
  "REMOVED",
  "ERROR",
  "SYNC_ERROR",
] as const;
export type VehicleSyncStatus = (typeof VEHICLE_SYNC_STATUSES)[number];

export const VEHICLE_AVAILABILITY_STATUSES = ["available", "reserved", "sold", "unavailable"] as const;
export type VehicleAvailabilityStatus = (typeof VEHICLE_AVAILABILITY_STATUSES)[number];

export const DUPLICATE_MATCH_TYPES = [
  "vin",
  "supplier_vehicle_id",
  "plaque",
  "caracteristiques",
  "photo",
] as const;
export type DuplicateMatchType = (typeof DUPLICATE_MATCH_TYPES)[number];

export const DUPLICATE_STATUSES = ["a_verifier", "confirme", "ecarte"] as const;
export type DuplicateStatus = (typeof DUPLICATE_STATUSES)[number];

export const CONDITION_STAGES = [
  "fournisseur",
  "transporteur_depart",
  "port",
  "intermediaire",
  "transporteur_arrivee",
  "client",
] as const;
export type ConditionStage = (typeof CONDITION_STAGES)[number];

export const QUALITY_CHECK_RESULTS = ["ok", "warning", "error"] as const;
export type QualityCheckResult = (typeof QUALITY_CHECK_RESULTS)[number];

/**
 * Vocabulaire des modes de transport — sert uniquement à déclarer une
 * éligibilité (`transportModesAllowed`). Aucun connecteur transporteur réel :
 * ça reste le LOT 4 (Logistics Engine).
 */
export const TRANSPORT_MODES = ["route", "maritime", "aerien", "rail", "roro", "convoyage"] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

/** Bus d'événements typés (règle MOS #12). Publiés aussi sur l'Event Bus central (server/event-bus). */
export type VehicleEngineEvent =
  | { type: "vehicle.imported"; vehicleItemId: number; supplierProfileId: number }
  | { type: "vehicle.mapped"; vehicleItemId: number; mappingVersion: number }
  | { type: "vehicle.duplicate_detected"; vehicleItemId: number; matchedVehicleItemId: number; matchType: DuplicateMatchType; confidencePct: number }
  | { type: "vehicle.quality_checked"; vehicleItemId: number; result: QualityCheckResult }
  | { type: "vehicle.priced"; vehicleItemId: number; publicPrice: number; publicCurrency: string }
  | { type: "vehicle.territories_set"; vehicleItemId: number }
  | { type: "vehicle.validated"; vehicleItemId: number; actorId: number }
  | { type: "vehicle.ready_to_publish"; vehicleItemId: number }
  | { type: "vehicle.published"; vehicleItemId: number; annonceId: number }
  | { type: "vehicle.reserved"; vehicleItemId: number }
  | { type: "vehicle.sold"; vehicleItemId: number }
  | { type: "vehicle.unavailable"; vehicleItemId: number; reason: string }
  | { type: "vehicle.removed"; vehicleItemId: number; reason: string }
  | { type: "vehicle.sync_error"; vehicleItemId: number; reason: string };

export const VEHICLE_ENGINE_META = {
  name: "vehicle_engine" as const,
  label: "Vehicle Engine" as const,
  contract: "server/vehicle-engine/index.ts",
};
