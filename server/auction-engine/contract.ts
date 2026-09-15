/**
 * Auction Engine — catalogue de vocabulaire (complément apporté en
 * reconnectant /acheter/encheres, jusqu'ici une vitrine 100 % fabriquée,
 * au vrai moteur d'enchères existant).
 *
 * Rien de tout ceci n'intervient dans le calcul du prix ou de
 * l'adjudication : ce sont des champs descriptifs (catégorie du catalogue,
 * restrictions acheteur, état déclaré) — les seules règles de prix vivent
 * dans service.ts (`placeBid`/`closeAuction`), jamais ici.
 */

/** Catégories du catalogue enchères (origine/état du lot), affichées comme filtres. */
export const CATALOG_CATEGORIES = [
  "reprise",
  "stock",
  "flotte",
  "accidente",
  "mecanique",
  "carrosserie",
  "export",
  "lot",
  "roulant",
  "non_roulant",
] as const;
export type CatalogCategory = (typeof CATALOG_CATEGORIES)[number];

/** Profils professionnels pouvant être seuls autorisés à enchérir sur un lot (`auctions.allowedProfiles`). */
export const BUYER_PROFILES = ["garage", "marchand", "exportateur", "carrossier", "casse", "pro_valide"] as const;
export type BuyerProfile = (typeof BUYER_PROFILES)[number];

/** État déclaré d'un sous-système ou d'un véhicule — jamais une note chiffrée inventée. */
export const CONDITION_STATUSES = ["bon", "moyen", "a_prevoir", "a_reparer", "non_controle"] as const;
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];

export const VEHICLE_TYPES = ["auto", "moto", "utilitaire", "camion", "quad"] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

/** Un véhicule au sein d'un lot groupé (nbVehicules > 1) — résumé minimal, pas une fiche complète par véhicule. */
export interface LotVehicleSummary {
  marque: string;
  modele: string;
  annee: number;
  km: number;
  /** Description libre du défaut/état principal (ex. "Distribution à faire") — pas un statut fermé : voir `etatDetail` pour la grille normalisée par sous-système. */
  etat: string;
}

/** État détaillé par sous-système — déclaratif, jamais déduit d'une inspection automatique. */
export interface ConditionDetail {
  mecanique: ConditionStatus;
  carrosserie: ConditionStatus;
  interieur: ConditionStatus;
  pneus: ConditionStatus;
  vitrage: ConditionStatus;
  electronique: ConditionStatus;
  documents: ConditionStatus;
  roulage: ConditionStatus;
}

/** Photos groupées par angle — un tableau vide pour une catégorie signifie honnêtement "aucune photo de ce type", jamais un espace réservé. */
export interface PhotoCategories {
  exterieur: string[];
  interieur: string[];
  moteur: string[];
  coffre: string[];
  tableau_bord: string[];
  dommages: string[];
  documents: string[];
  pneus: string[];
}

/**
 * Contenu descriptif riche d'un lot (`auctions.lot_details`). Purement
 * informatif : la seule source de vérité pour le prix, les enchères et
 * l'adjudication reste la table `auctions` elle-même.
 */
export interface LotDetails {
  nbVehicules?: number;
  vehicules?: LotVehicleSummary[];
  photosCategories?: Partial<PhotoCategories>;
  marque?: string;
  modele?: string;
  version?: string;
  annee?: string;
  km?: string;
  energie?: string;
  boite?: string;
  puissance?: string;
  typeVehicule?: VehicleType;
  cylindree?: string;
  nbRoues?: string;
  ptac?: string;
  nbEssieux?: string;
  hauteur?: string;
  vin?: string;
  /** Description libre de l'état général (ex. "Accident léger avant-droit") — pas un statut fermé. */
  etatGeneral?: string;
  roulant?: boolean;
  etatDetail?: Partial<ConditionDetail>;
  rapportDefauts?: string[];
  rapportTravaux?: string[];
  rapportEstimation?: number;
  rapportDocuments?: string[];
  rapportRemarques?: string[];
  badges?: string[];
}
