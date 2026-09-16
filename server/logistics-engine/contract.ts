/**
 * Logistics Engine — contrat public (types stables, règle MOS #12).
 *
 * LOT 4 du Plan Maître Fournisseurs : Delivery / Logistics API Gateway,
 * Carrier Connectors, Delivery Quote/Routing Engine, Multi-Leg Engine,
 * Tracking Engine. Aucune vraie clé transporteur n'existe aujourd'hui —
 * chaque connecteur reste honnêtement NOT_CONNECTED tant qu'un secret réel
 * n'est pas fourni (même principe que le Connector Engine du LOT 1).
 *
 * Rappel impératif (cause du blocage de déploiement Railway des LOT 2/3,
 * voir PR #335) : le nom officiel du système est MKA.P-MS AI,
 * jamais une autre appellation abrégée pour la même idée.
 */
import { CANONICAL_SHIPMENT_FIELDS, CONNECTION_METHODS } from "../supplier-engine/contract.js";
import { TRANSPORT_MODES } from "../vehicle-engine/contract.js";

export { CANONICAL_SHIPMENT_FIELDS, TRANSPORT_MODES };
/** Méthodes techniques de connexion transporteur — mêmes 22 méthodes que le Connector Engine (LOT 1), jamais recréées. */
export { CONNECTION_METHODS as CARRIER_CONNECTION_METHODS };

export const CARRIER_CATEGORIES = ["colis", "fret", "vehicules"] as const;
export type CarrierCategory = (typeof CARRIER_CATEGORIES)[number];

/**
 * Catalogue des transporteurs nommés par le plan (§66). Une entrée = une
 * intégration possible, honnêtement NOT_CONNECTED tant qu'aucune clé réelle
 * n'est configurée. Ajouter un transporteur = ajouter une ligne ici, jamais
 * coder la plateforme autour d'un transporteur en particulier.
 */
export interface CarrierDef {
  code: string;
  label: string;
  categories: CarrierCategory[];
  /** Nom de la variable d'environnement attendue pour la clé API (jamais la valeur). */
  envVar: string;
}

export const CARRIER_CATALOG: CarrierDef[] = [
  { code: "dhl", label: "DHL", categories: ["colis"], envVar: "CARRIER_DHL_API_KEY" },
  { code: "dhl_express", label: "DHL Express", categories: ["colis"], envVar: "CARRIER_DHL_EXPRESS_API_KEY" },
  { code: "dpd", label: "DPD", categories: ["colis"], envVar: "CARRIER_DPD_API_KEY" },
  { code: "geopost", label: "Geopost", categories: ["colis"], envVar: "CARRIER_GEOPOST_API_KEY" },
  { code: "chronopost", label: "Chronopost", categories: ["colis"], envVar: "CARRIER_CHRONOPOST_API_KEY" },
  { code: "ups", label: "UPS", categories: ["colis"], envVar: "CARRIER_UPS_API_KEY" },
  { code: "fedex", label: "FedEx", categories: ["colis"], envVar: "CARRIER_FEDEX_API_KEY" },
  { code: "gls", label: "GLS", categories: ["colis"], envVar: "CARRIER_GLS_API_KEY" },
  { code: "colissimo", label: "Colissimo", categories: ["colis"], envVar: "CARRIER_COLISSIMO_API_KEY" },
  { code: "mondial_relay", label: "Mondial Relay", categories: ["colis"], envVar: "CARRIER_MONDIAL_RELAY_API_KEY" },
  { code: "sendcloud", label: "Sendcloud", categories: ["colis"], envVar: "CARRIER_SENDCLOUD_API_KEY" },
  { code: "cainiao", label: "Cainiao", categories: ["colis"], envVar: "CARRIER_CAINIAO_API_KEY" },
  { code: "dhl_freight", label: "DHL Freight", categories: ["fret"], envVar: "CARRIER_DHL_FREIGHT_API_KEY" },
  { code: "ceva", label: "CEVA", categories: ["fret", "vehicules"], envVar: "CARRIER_CEVA_API_KEY" },
  { code: "db_schenker", label: "DB Schenker", categories: ["fret"], envVar: "CARRIER_DB_SCHENKER_API_KEY" },
  { code: "hiflow", label: "Hiflow", categories: ["vehicules"], envVar: "CARRIER_HIFLOW_API_KEY" },
  { code: "mosolf", label: "MOSOLF", categories: ["vehicules"], envVar: "CARRIER_MOSOLF_API_KEY" },
  { code: "agl", label: "AGL", categories: ["vehicules"], envVar: "CARRIER_AGL_API_KEY" },
  { code: "grimaldi", label: "Grimaldi", categories: ["vehicules"], envVar: "CARRIER_GRIMALDI_API_KEY" },
];

export function findCarrier(code: string): CarrierDef | undefined {
  return CARRIER_CATALOG.find((c) => c.code === code);
}

export function carriersForCategory(categorie: CarrierCategory): CarrierDef[] {
  return CARRIER_CATALOG.filter((c) => c.categories.includes(categorie));
}

export const CONNECTION_STATUSES = ["not_connected", "configured", "active", "suspended", "disabled"] as const;
export type CarrierConnectionStatus = (typeof CONNECTION_STATUSES)[number];

/**
 * Statuts normalisés de suivi (§72). Tous les transporteurs, quelle que soit
 * leur méthode technique, sont ramenés à ce vocabulaire unique.
 */
export const TRACKING_STATUSES = [
  "CREATED",
  "BOOKED",
  "PICKUP_SCHEDULED",
  "PICKED_UP",
  "IN_TRANSIT",
  "AT_HUB",
  "AT_PORT",
  "CUSTOMS_EXPORT",
  "HANDED_OVER",
  "ON_VESSEL",
  "ARRIVED_PORT",
  "CUSTOMS_IMPORT",
  "LAST_MILE",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "RETURNED",
  "DISPUTED",
] as const;
export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

/** Ordre de progression indicatif — sert à ne jamais faire "reculer" le statut d'une expédition multi-legs sans raison explicite. */
export const TRACKING_PROGRESSION: Record<TrackingStatus, number> = {
  CREATED: 0,
  BOOKED: 1,
  PICKUP_SCHEDULED: 2,
  PICKED_UP: 3,
  IN_TRANSIT: 4,
  AT_HUB: 5,
  CUSTOMS_EXPORT: 6,
  HANDED_OVER: 7,
  AT_PORT: 8,
  ON_VESSEL: 9,
  ARRIVED_PORT: 10,
  CUSTOMS_IMPORT: 11,
  LAST_MILE: 12,
  OUT_FOR_DELIVERY: 13,
  DELIVERED: 14,
  FAILED: 15,
  RETURNED: 16,
  DISPUTED: 17,
};

export const QUOTE_TIERS = ["ECONOMIQUE", "RECOMMANDE", "EXPRESS"] as const;
export type QuoteTier = (typeof QUOTE_TIERS)[number];

export const WEBHOOK_LOG_STATUSES = ["recu", "signature_invalide", "traite", "erreur"] as const;
export type WebhookLogStatus = (typeof WEBHOOK_LOG_STATUSES)[number];

/** Bus d'événements typés (règle MOS #12), publiés aussi sur l'Event Bus central (§73). */
export type LogisticsEngineEvent =
  | { type: "delivery.quote.created"; shipmentId: number | null; quoteId: number }
  | { type: "delivery.booked"; shipmentId: number; legId: number; carrierCode: string }
  | { type: "pickup.scheduled"; shipmentId: number; legId: number }
  | { type: "pickup.completed"; shipmentId: number; legId: number }
  | { type: "shipment.in_transit"; shipmentId: number; legId: number }
  | { type: "shipment.handover.completed"; shipmentId: number; legId: number }
  | { type: "shipment.at_port"; shipmentId: number; legId: number }
  | { type: "shipment.customs.started"; shipmentId: number; legId: number }
  | { type: "shipment.customs.completed"; shipmentId: number; legId: number }
  | { type: "shipment.on_vessel"; shipmentId: number; legId: number }
  | { type: "shipment.arrived"; shipmentId: number; legId: number }
  | { type: "delivery.out_for_delivery"; shipmentId: number; legId: number }
  | { type: "delivery.completed"; shipmentId: number; legId: number }
  | { type: "delivery.failed"; shipmentId: number; legId: number; reason: string }
  | { type: "delivery.disputed"; shipmentId: number; legId: number; reason: string };

export const LOGISTICS_ENGINE_META = {
  name: "logistics_engine" as const,
  label: "Logistics Engine" as const,
  contract: "server/logistics-engine/index.ts",
};
