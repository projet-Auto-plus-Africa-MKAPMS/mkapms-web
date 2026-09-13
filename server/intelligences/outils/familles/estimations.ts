/**
 * MKA.P-MS Intelligence — Tool Registry, famille "estimations" (LOT IA02E).
 *
 * Porte d'entrée unique, pour un modèle, vers toute question de prix ou de
 * valeur. Chaque outil ici appelle l'Estimate Gateway
 * (server/estimate-gateway/gateway.ts), qui appelle lui-même le moteur
 * métier réel déjà propriétaire du calcul — jamais une formule dupliquée.
 *
 * Les quatre outils `estimate.vehicle.*` réutilisent le même VO Engine que
 * les outils historiques `vehicules.getVehicleMarketValue` et consorts
 * (server/intelligences/outils/familles/vehicules.ts) : deux portes vers le
 * même moteur, jamais deux moteurs. Ils existent en plus, pas à la place,
 * pour donner au modèle une famille `estimate.*` cohérente pour toute
 * question de prix, quel que soit l'univers.
 *
 * `estimate.rental`, `estimate.loa`, `estimate.vtc` et `estimate.customs`
 * sont `BUSINESS_ENGINE_MISSING` : l'outil s'exécute réellement et répond,
 * mais aucun moteur MKA.P-MS ne calcule cette valeur aujourd'hui (confirmé
 * par l'audit LOT IA02E) — ce lot ne construit pas le moteur manquant.
 */
import type { Categorie, NiveauRisque, OutilSpec, StatutImplementation } from "../registre.js";

const CATEGORY: Categorie = "estimations";

function outil(partiel: {
  toolId: string;
  name: string;
  description: string;
  schemaInput: Record<string, unknown>;
  schemaOutput: Record<string, unknown>;
  implementationStatus: StatutImplementation;
  riskLevel: NiveauRisque;
  allowedRoles: string[];
  provider: string;
  fallback: string;
  internalReplacementStatus: string;
}): OutilSpec {
  return {
    toolId: partiel.toolId,
    name: partiel.name,
    description: partiel.description,
    category: CATEGORY,
    version: "1.0.0",
    schemaInput: partiel.schemaInput,
    schemaOutput: partiel.schemaOutput,
    available: true,
    enabled: true,
    implementationStatus: partiel.implementationStatus,
    allowedRoles: partiel.allowedRoles,
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["READ"],
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: partiel.riskLevel,
    legalBasis: "Estimation de prix — aucune donnée personnelle au-delà de ce qui est déjà déclaré par l'utilisateur.",
    provider: partiel.provider,
    fallback: partiel.fallback,
    internalReplacementStatus: partiel.internalReplacementStatus,
    idempotent: true,
    timeoutMs: 8000,
    auditCategory: "estimations",
  };
}

const ROLES_LARGES = ["user", "pro", "garage", "society", "employee", "admin", "super_admin"];

const SCHEMA_VEHICULE = {
  type: "object",
  properties: {
    marque: { type: "string" },
    modele: { type: "string" },
    annee: { type: "number" },
    kilometrage: { type: "number" },
    etat: { type: "string" },
    countryCode: { type: "string" },
  },
  required: ["marque", "modele"],
} as const;

const SCHEMA_SORTIE_ESTIMATION = {
  type: "object",
  properties: {
    status: { type: "string" },
    quality: { type: "string" },
    amount: { type: "number" },
    currency: { type: "string" },
    minAmount: { type: "number" },
    maxAmount: { type: "number" },
    confidence: { type: "string" },
    missingData: { type: "array", items: { type: "string" } },
    warnings: { type: "array", items: { type: "string" } },
  },
} as const;

export const OUTILS_ESTIMATIONS: OutilSpec[] = [
  outil({
    toolId: "estimate.vehicle.marketValue",
    name: "estimateVehicleMarketValue",
    description: "Valeur de marché estimée d'un véhicule, via l'Estimate Gateway (VO Engine).",
    schemaInput: SCHEMA_VEHICULE,
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (vo-engine, via estimate-gateway)",
    fallback: "Barème de décote documenté quand aucun comparable réel n'existe pour ce marché.",
    internalReplacementStatus: "Déjà propriétaire — VO Engine.",
  }),
  outil({
    toolId: "estimate.vehicle.tradeIn",
    name: "estimateVehicleTradeIn",
    description: "Valeur de reprise estimée d'un véhicule, via l'Estimate Gateway (VO Engine).",
    schemaInput: SCHEMA_VEHICULE,
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (vo-engine, via estimate-gateway)",
    fallback: "Barème de décote documenté quand aucun comparable réel n'existe pour ce marché.",
    internalReplacementStatus: "Déjà propriétaire — VO Engine.",
  }),
  outil({
    toolId: "estimate.vehicle.retail",
    name: "estimateVehicleRetail",
    description: "Prix de détail conseillé pour un véhicule, via l'Estimate Gateway (VO Engine).",
    schemaInput: SCHEMA_VEHICULE,
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (vo-engine, via estimate-gateway)",
    fallback: "Barème de décote documenté quand aucun comparable réel n'existe pour ce marché.",
    internalReplacementStatus: "Déjà propriétaire — VO Engine.",
  }),
  outil({
    toolId: "estimate.vehicle.margin",
    name: "estimateVehicleMargin",
    description: "Marge estimée entre prix de détail et valeur de reprise — calcul arithmétique sur une fourchette réelle.",
    schemaInput: SCHEMA_VEHICULE,
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (vo-engine, via estimate-gateway)",
    fallback: "Hérite du repli des outils de valeur de marché.",
    internalReplacementStatus: "Déjà propriétaire — VO Engine.",
  }),
  outil({
    toolId: "estimate.garage.repair",
    name: "estimateGarageRepair",
    description: "Montant réel d'un devis garage déjà chiffré par un professionnel. Ne prédit jamais un coût sans devis existant : aucun moteur ne calcule un coût de réparation à partir de symptômes.",
    schemaInput: { type: "object", properties: { devisId: { type: "number" } }, required: [] },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (devis-garage, via estimate-gateway)",
    fallback: "Sans devis existant : BUSINESS_ENGINE_MISSING déclaré, jamais un coût inventé.",
    internalReplacementStatus: "Devis réel propriétaire ; aucun moteur de prédiction de coût de réparation n'existe (constat de l'audit LOT IA02E).",
  }),
  outil({
    toolId: "estimate.parts.price",
    name: "estimatePartsPrice",
    description: "Prix réel d'une pièce au catalogue, ou budget médian d'entretien à partir des pièces compatibles publiées.",
    schemaInput: {
      type: "object",
      properties: { catalogId: { type: "number" }, marque: { type: "string" }, modele: { type: "string" }, annee: { type: "number" } },
      required: [],
    },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (pieces + estimation-hub, via estimate-gateway)",
    fallback: "Sous 3 pièces compatibles publiées : indisponible, jamais un prix moyen inventé.",
    internalReplacementStatus: "Déjà propriétaire — catalogue pièces MKA.P-MS.",
  }),
  outil({
    toolId: "estimate.rental",
    name: "estimateRental",
    description: "Location courte durée — aucun moteur MKA.P-MS ne calcule ce prix aujourd'hui.",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "BUSINESS_ENGINE_MISSING",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    provider: "aucun (constat de l'audit LOT IA02E)",
    fallback: "Aucun — déclare BUSINESS_ENGINE_MISSING, jamais un tarif inventé.",
    internalReplacementStatus: "Moteur de location courte durée à construire (aucune table, aucun service aujourd'hui).",
  }),
  outil({
    toolId: "estimate.loa",
    name: "estimateLoa",
    description: "Location avec option d'achat (LOA/leasing) — aucun moteur MKA.P-MS ne calcule de mensualité aujourd'hui.",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "BUSINESS_ENGINE_MISSING",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    provider: "aucun (constat de l'audit LOT IA02E — server/modules/financeplus.ts est un schéma sans service)",
    fallback: "Aucun — déclare BUSINESS_ENGINE_MISSING, jamais une mensualité inventée.",
    internalReplacementStatus: "Moteur de calcul de mensualité à construire ; les écrans client (LocationLOA.tsx, LOAFinance.tsx) affichent aujourd'hui des exemples statiques, pas un calcul.",
  }),
  outil({
    toolId: "estimate.vtc",
    name: "estimateVtc",
    description: "Course VTC/taxi — aucun moteur MKA.P-MS ne calcule de tarif de course aujourd'hui.",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "BUSINESS_ENGINE_MISSING",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    provider: "aucun (constat de l'audit LOT IA02E)",
    fallback: "Aucun — déclare BUSINESS_ENGINE_MISSING, jamais un tarif de course inventé.",
    internalReplacementStatus: "Moteur de tarification VTC/taxi à construire (aucune formule distance/durée/tarif aujourd'hui).",
  }),
  outil({
    toolId: "estimate.transport",
    name: "estimateTransport",
    description: "Devis de transport de véhicule (plateau, maritime, ferroviaire, aérien…), via l'Estimate Gateway (Vehicle Delivery Engine).",
    schemaInput: {
      type: "object",
      properties: {
        annonceId: { type: "number" },
        mode: { type: "string" },
        categorie: { type: "string" },
        paysDepart: { type: "string" },
        paysArrivee: { type: "string" },
        distanceKm: { type: "number" },
      },
      required: [],
    },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (vehicle-delivery, via estimate-gateway)",
    fallback: "Barème interne non vérifié en repli ; étape sans barème affichée non mesurée, jamais chiffrée au hasard.",
    internalReplacementStatus: "Déjà propriétaire — Vehicle Delivery Engine.",
  }),
  outil({
    toolId: "estimate.delivery",
    name: "estimateDelivery",
    description: "Devis de livraison de colis/pièces, via l'Estimate Gateway (moteur Livraison).",
    schemaInput: {
      type: "object",
      properties: {
        poidsKg: { type: "number" },
        longueurCm: { type: "number" },
        largeurCm: { type: "number" },
        hauteurCm: { type: "number" },
        distanceKm: { type: "number" },
        urgent: { type: "boolean" },
      },
      required: [],
    },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (livraison, via estimate-gateway)",
    fallback: "Grille de repli par gabarit quand aucune grille configurée n'est active.",
    internalReplacementStatus: "Déjà propriétaire — moteur Livraison colis.",
  }),
  outil({
    toolId: "estimate.import",
    name: "estimateImport",
    description: "Diagnostic réel de risque d'importation (légalité, homologation) pour un véhicule et un pays — jamais un montant de droits.",
    schemaInput: { type: "object", properties: { annonceId: { type: "number" }, paysDestination: { type: "string" } }, required: ["annonceId"] },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (import-risk + country-policy, via estimate-gateway)",
    fallback: "Règle non confirmée pour ce pays : déclarée « vérification requise », jamais « conforme » par défaut.",
    internalReplacementStatus: "Déjà propriétaire — Import Risk Engine / Country Policy Engine.",
  }),
  outil({
    toolId: "estimate.customs",
    name: "estimateCustoms",
    description: "Droits de douane et taxes à l'importation — aucun barème douanier n'est connecté pour aucun pays aujourd'hui.",
    schemaInput: { type: "object", properties: { countryCode: { type: "string" } }, required: [] },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "BUSINESS_ENGINE_MISSING",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    provider: "aucun (constat de l'audit LOT IA02E, confirmé par server/import-risk/service.ts)",
    fallback: "Aucun — déclare BUSINESS_ENGINE_MISSING : un montant de droits inventé coûterait plus cher au client qu'une absence de chiffre.",
    internalReplacementStatus: "Connecteur tarifaire douanier par pays à construire.",
  }),
  outil({
    toolId: "estimate.currency",
    name: "estimateCurrency",
    description: "Conversion d'un montant entre deux devises, via l'Estimate Gateway (taux live avec repli statique documenté).",
    schemaInput: {
      type: "object",
      properties: { montant: { type: "number" }, de: { type: "string" }, vers: { type: "string" } },
      required: ["montant", "de", "vers"],
    },
    schemaOutput: SCHEMA_SORTIE_ESTIMATION,
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    provider: "mkapms (currency, via estimate-gateway)",
    fallback: "Taux statiques indicatifs si le fournisseur de taux de change échoue — jamais un taux inventé.",
    internalReplacementStatus: "Déjà propriétaire — catalogue de taux de repli ; taux live dépendant d'un fournisseur gratuit sans clé.",
  }),
];
