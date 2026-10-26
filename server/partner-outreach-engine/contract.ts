/**
 * Partner Outreach Engine — contrat public (types stables, règle MOS #12).
 *
 * Les autres moteurs qui ont besoin de connaître un contact approché passent
 * par ces types et par les fonctions exportées de `service.ts` — jamais en
 * lisant directement les tables `outreach_*`.
 */

/** Les 11 statuts explicitement demandés (mission Direction 26/10), dans l'ordre du funnel. */
export const OUTREACH_STATUSES = [
  "identifie",
  "contacte",
  "reponse_recue",
  "a_verifier",
  "qualifie",
  "pilote",
  "actif",
  "suspendu",
  "refuse",
  "non_livre",
  "dossier_incomplet",
] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  identifie: "Identifié",
  contacte: "Contacté",
  reponse_recue: "Réponse reçue",
  a_verifier: "À vérifier",
  qualifie: "Qualifié",
  pilote: "Pilote",
  actif: "Actif",
  suspendu: "Suspendu",
  refuse: "Refusé",
  non_livre: "Non livré",
  dossier_incomplet: "Dossier incomplet",
};

/**
 * Catégorie large. Réutilise le vocabulaire existant de `partnerTypeEnum`
 * (server/modules/operations.ts) où il couvre déjà le cas, et l'étend
 * seulement pour ce que ce vocabulaire ne distingue pas encore (transport
 * par mode, logistique/fulfillment, boutique) — jamais un doublon.
 */
export const OUTREACH_CATEGORIES = [
  "fournisseur_vehicules",
  "fournisseur_pieces",
  "garage",
  "transporteur_terrestre",
  "transporteur_maritime",
  "transporteur_aerien",
  "logisticien_fulfillment",
  "boutique_partenaire",
  "autre",
] as const;
export type OutreachCategory = (typeof OUTREACH_CATEGORIES)[number];

/** Capacités à enregistrer (section "CAPACITÉS À ENREGISTRER" de la mission). */
export const OUTREACH_CAPACITIES = [
  "vente_vehicules",
  "location",
  "pieces",
  "garage",
  "reparation",
  "transport_terrestre",
  "transport_maritime",
  "transport_aerien",
  "fret",
  "douane",
  "entreposage",
  "fulfillment",
  "dernier_kilometre",
  "retours",
  "sav",
  "catalogue",
  "dropshipping",
] as const;
export type OutreachCapacity = (typeof OUTREACH_CAPACITIES)[number];

export const OUTREACH_COMMERCIAL_MODELS = ["b2b", "b2c", "b2b_b2c"] as const;
export type OutreachCommercialModel = (typeof OUTREACH_COMMERCIAL_MODELS)[number];

/** Méthodes d'import/saisie prévues pour alimenter ce registre (point "import"). */
export const OUTREACH_SOURCES = ["campagne_26_10", "import_manuel", "formulaire", "autre"] as const;
export type OutreachSource = (typeof OUTREACH_SOURCES)[number];

export interface OutreachContactInput {
  email: string;
  domain?: string | null;
  companyName?: string | null;
  country?: string | null;
  city?: string | null;
  phone?: string | null;
  website?: string | null;
  category?: OutreachCategory | null;
  capacities?: OutreachCapacity[];
  zonesDesservies?: string[];
  langues?: string[];
  modeleCommercial?: OutreachCommercialModel | null;
  source?: OutreachSource;
}

/** Bus d'événements typés (règle MOS #12). */
export type OutreachEngineEvent =
  | { type: "outreach.contact_created"; outreachContactId: number; email: string }
  | { type: "outreach.response_recorded"; outreachContactId: number }
  | { type: "outreach.status_changed"; outreachContactId: number; from: OutreachStatus; to: OutreachStatus; actorId: number }
  | { type: "outreach.promoted_to_application"; outreachContactId: number; applicationId: number }
  | { type: "outreach.promoted_to_supplier"; outreachContactId: number; supplierProfileId: number };

export const PARTNER_OUTREACH_ENGINE_META = {
  name: "partner_outreach_engine" as const,
  label: "Partner Outreach Engine" as const,
  contract: "server/partner-outreach-engine/index.ts",
};
