/**
 * MKA.P-MS Intelligence — Tool Registry, famille "vehicules".
 *
 * Premier lot d'implémentation réelle (véhicules / VIN / immatriculation /
 * estimation), choisi par la direction car central pour la marketplace
 * automobile et le futur système fournisseurs.
 *
 * Réutilise les moteurs déjà existants — aucune donnée ni logique dupliquée :
 *  - server/vo-engine/service.ts (estimate, createRepriseRequest) pour toute
 *    valeur marché/reprise ;
 *  - server/country-os/index.ts (Country Engine) pour la devise et les pays
 *    ouverts — jamais un pays par défaut codé en dur ici.
 *
 * 8 outils réellement implémentés et testés (IMPLEMENTED), 6 avec un vrai
 * chemin d'exécution mais dépendants d'un fournisseur externe absent
 * aujourd'hui (IMPLEMENTED_NOT_CONNECTED — dégradation honnête, jamais un
 * résultat inventé), 3 dont la règle métier n'est pas encore définie par la
 * direction (REGISTERED_NOT_IMPLEMENTED — la fiche existe, aucune valeur
 * inventée pour combler l'absence de politique).
 */
import type { Categorie, NiveauRisque, OutilSpec, StatutImplementation } from "../registre.js";

const CATEGORY: Categorie = "vehicules";

function outil(partiel: {
  toolId: string;
  name: string;
  description: string;
  schemaInput: Record<string, unknown>;
  schemaOutput: Record<string, unknown>;
  implementationStatus: StatutImplementation;
  riskLevel: NiveauRisque;
  allowedRoles: string[];
  requiredPermissions: OutilSpec["requiredPermissions"];
  provider: string;
  fallback: string;
  internalReplacementStatus: string;
  legalBasis?: string;
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
    enabled: partiel.implementationStatus !== "REGISTERED_NOT_IMPLEMENTED",
    implementationStatus: partiel.implementationStatus,
    allowedRoles: partiel.allowedRoles,
    allowedCountries: null, // mondial par conception — le Country Engine décide au moment de l'appel
    blockedCountries: [],
    requiredPermissions: partiel.requiredPermissions,
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: partiel.riskLevel,
    legalBasis: partiel.legalBasis ?? "Donnée véhicule non personnelle (identifiants techniques).",
    provider: partiel.provider,
    fallback: partiel.fallback,
    internalReplacementStatus: partiel.internalReplacementStatus,
    idempotent: true,
    timeoutMs: 5000,
    auditCategory: "vehicules",
  };
}

const ROLES_LARGES = ["user", "pro", "garage", "society", "employee", "admin", "super_admin"];
const ROLES_METIER = ["pro", "garage", "society", "employee", "admin", "super_admin"];

export const OUTILS_VEHICULES: OutilSpec[] = [
  outil({
    toolId: "vehicules.decodeVIN",
    name: "decodeVIN",
    description: "Décode la structure d'un VIN (ISO 3779) : identifiant constructeur (WMI), pays, code année-modèle — sans base externe.",
    schemaInput: { type: "object", properties: { vin: { type: "string" } }, required: ["vin"] },
    schemaOutput: {
      type: "object",
      properties: {
        valide: { type: "boolean" },
        wmi: { type: "string" },
        pays: { type: "string" },
        constructeur: { type: "string" },
        anneeModele: { type: "number" },
        confiance: { type: "string" },
      },
    },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "mkapms",
    fallback: "Aucun nécessaire : décodage structurel local (ISO 3779), pas d'appel externe.",
    internalReplacementStatus: "Déjà propriétaire — aucun fournisseur externe requis pour cette étape.",
  }),
  outil({
    toolId: "vehicules.identifyVehicleByVIN",
    name: "identifyVehicleByVIN",
    description: "Identifie un véhicule à partir de son VIN : décodage structurel + recherche parmi les estimations MKA.P-MS déjà demandées pour ce VIN (server/vo-engine).",
    schemaInput: { type: "object", properties: { vin: { type: "string" } }, required: ["vin"] },
    schemaOutput: {
      type: "object",
      properties: { trouve: { type: "boolean" }, source: { type: "string" }, confiance: { type: "string" } },
    },
    implementationStatus: "IMPLEMENTED_NOT_CONNECTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "donnees_vehicules (VEHICLE_TECH_DATA_API_KEY, absent)",
    fallback: "1) recherche parmi les estimations déjà demandées pour ce VIN (vo_estimations) ; 2) décodage structurel du VIN seul ; sinon confiance déclarée insuffisante. Aucune colonne VIN sur les annonces publiées : ce repli ne peut pas confirmer qu'un véhicule est en vente aujourd'hui.",
    internalReplacementStatus: "Repli interne (estimations déjà demandées) déjà actif ; base technique externe absente (écart connu, server/ai-fabric/service.ts).",
  }),
  outil({
    toolId: "vehicules.identifyVehicleByPlate",
    name: "identifyVehicleByPlate",
    description: "Identifie un véhicule à partir de sa plaque d'immatriculation — registre officiel par pays.",
    schemaInput: {
      type: "object",
      properties: { plaque: { type: "string" }, countryCode: { type: "string" } },
      required: ["plaque", "countryCode"],
    },
    schemaOutput: { type: "object", properties: { trouve: { type: "boolean" }, confiance: { type: "string" } } },
    implementationStatus: "IMPLEMENTED_NOT_CONNECTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_METIER,
    requiredPermissions: ["READ"],
    provider: "registre_immatriculation_pays (aucun pays configuré)",
    fallback: "1) autre fournisseur si configuré pour ce pays ; 2) source locale si déclarée ; sinon confiance insuffisante — jamais une plaque devinée.",
    internalReplacementStatus: "Non applicable : dépend toujours d'un registre officiel par pays, jamais internalisable.",
    legalBasis: "Donnée à caractère personnel selon le pays (rattachable au propriétaire) — traitement à encadrer pays par pays.",
  }),
  outil({
    toolId: "vehicules.getVehicleTechnicalData",
    name: "getVehicleTechnicalData",
    description: "Fiche technique constructeur (motorisation, poids, dimensions...) à partir d'un VIN ou marque/modèle/année.",
    schemaInput: {
      type: "object",
      properties: { vin: { type: "string" }, marque: { type: "string" }, modele: { type: "string" }, annee: { type: "number" } },
      required: [],
    },
    schemaOutput: { type: "object", properties: { disponible: { type: "boolean" } } },
    implementationStatus: "IMPLEMENTED_NOT_CONNECTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "donnees_vehicules (VEHICLE_TECH_DATA_API_KEY, absent)",
    fallback: "Aucune donnée technique déclarée par le vendeur n'est disponible tant que ce fournisseur n'est pas connecté — jamais une fiche inventée.",
    internalReplacementStatus: "Écart déjà connu de la Fabrique Intelligence (capacité donnees_techniques).",
  }),
  outil({
    toolId: "vehicules.getVehicleOptions",
    name: "getVehicleOptions",
    description: "Liste des options d'un véhicule à partir de son VIN (finition constructeur).",
    schemaInput: { type: "object", properties: { vin: { type: "string" } }, required: ["vin"] },
    schemaOutput: { type: "object", properties: { options: { type: "array", items: { type: "string" } } } },
    implementationStatus: "IMPLEMENTED_NOT_CONNECTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "donnees_vehicules (VEHICLE_TECH_DATA_API_KEY, absent)",
    fallback: "Repli sur les options déclarées par le vendeur dans l'annonce, si présentes ; sinon liste vide déclarée incomplète.",
    internalReplacementStatus: "Écart déjà connu de la Fabrique Intelligence (capacité donnees_techniques).",
  }),
  outil({
    toolId: "vehicules.getVehicleMarketValue",
    name: "getVehicleMarketValue",
    description: "Valeur de marché estimée d'un véhicule — réutilise le moteur d'estimation VO existant (comparables réels ou barème documenté).",
    schemaInput: {
      type: "object",
      properties: {
        marque: { type: "string" },
        modele: { type: "string" },
        annee: { type: "number" },
        kilometrage: { type: "number" },
        etat: { type: "string" },
        countryCode: { type: "string" },
      },
      required: ["marque", "modele", "countryCode"],
    },
    schemaOutput: {
      type: "object",
      properties: { low: { type: "number" }, mid: { type: "number" }, high: { type: "number" }, devise: { type: "string" }, confiance: { type: "string" } },
    },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "mkapms (vo-engine)",
    fallback: "Barème de décote documenté (server/vo-engine/service.ts) quand aucun comparable réel n'existe pour ce marché.",
    internalReplacementStatus: "Déjà propriétaire — VO Engine.",
  }),
  outil({
    toolId: "vehicules.getTradeInValue",
    name: "getTradeInValue",
    description: "Valeur de reprise estimée — même moteur que la valeur de marché, cadrée pour une reprise (VO Engine).",
    schemaInput: {
      type: "object",
      properties: {
        marque: { type: "string" },
        modele: { type: "string" },
        annee: { type: "number" },
        kilometrage: { type: "number" },
        etat: { type: "string" },
        countryCode: { type: "string" },
      },
      required: ["marque", "modele", "countryCode"],
    },
    schemaOutput: { type: "object", properties: { valeurReprise: { type: "number" }, devise: { type: "string" }, confiance: { type: "string" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_METIER,
    requiredPermissions: ["READ"],
    provider: "mkapms (vo-engine)",
    fallback: "Barème de décote documenté quand aucun comparable réel n'existe pour ce marché.",
    internalReplacementStatus: "Déjà propriétaire — VO Engine.",
  }),
  outil({
    toolId: "vehicules.getWholesaleValue",
    name: "getWholesaleValue",
    description: "Valeur de gros (cession entre professionnels) — nécessite une politique de décote gros définie par la direction.",
    schemaInput: {
      type: "object",
      properties: { marque: { type: "string" }, modele: { type: "string" }, annee: { type: "number" }, countryCode: { type: "string" } },
      required: ["marque", "modele", "countryCode"],
    },
    schemaOutput: { type: "object", properties: { valeurGros: { type: "number" } } },
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
    riskLevel: "MEDIUM",
    allowedRoles: ROLES_METIER,
    requiredPermissions: ["READ"],
    provider: "mkapms (règle à définir)",
    fallback: "Aucun — pas de décote gros inventée sans politique explicite de la direction.",
    internalReplacementStatus: "En attente d'une règle métier de la direction ; le VO Engine fournit déjà la valeur de marché de base.",
  }),
  outil({
    toolId: "vehicules.getResidualValue",
    name: "getResidualValue",
    description: "Valeur résiduelle projetée (utile pour LOA/leasing) — nécessite un modèle de dépréciation validé par la direction.",
    schemaInput: {
      type: "object",
      properties: { marque: { type: "string" }, modele: { type: "string" }, annee: { type: "number" }, moisProjection: { type: "number" } },
      required: ["marque", "modele", "moisProjection"],
    },
    schemaOutput: { type: "object", properties: { valeurResiduelle: { type: "number" } } },
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
    riskLevel: "MEDIUM",
    allowedRoles: ROLES_METIER,
    requiredPermissions: ["READ"],
    provider: "mkapms (règle à définir)",
    fallback: "Aucun — aucune projection de dépréciation inventée sans modèle validé par la direction.",
    internalReplacementStatus: "En attente d'une règle métier de la direction.",
  }),
  outil({
    toolId: "vehicules.estimateRetailPrice",
    name: "estimateRetailPrice",
    description: "Prix de vente conseillé au détail — dérivé de la valeur de marché (haut de fourchette), même moteur VO Engine.",
    schemaInput: {
      type: "object",
      properties: {
        marque: { type: "string" },
        modele: { type: "string" },
        annee: { type: "number" },
        kilometrage: { type: "number" },
        etat: { type: "string" },
        countryCode: { type: "string" },
      },
      required: ["marque", "modele", "countryCode"],
    },
    schemaOutput: { type: "object", properties: { prixConseille: { type: "number" }, devise: { type: "string" }, confiance: { type: "string" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_METIER,
    requiredPermissions: ["READ"],
    provider: "mkapms (vo-engine)",
    fallback: "Barème de décote documenté quand aucun comparable réel n'existe pour ce marché.",
    internalReplacementStatus: "Déjà propriétaire — VO Engine.",
  }),
  outil({
    toolId: "vehicules.estimateMargin",
    name: "estimateMargin",
    description: "Marge estimée entre le prix de détail conseillé et la valeur de reprise — calcul arithmétique sur deux valeurs déjà réelles, aucune règle inventée.",
    schemaInput: {
      type: "object",
      properties: {
        marque: { type: "string" },
        modele: { type: "string" },
        annee: { type: "number" },
        kilometrage: { type: "number" },
        etat: { type: "string" },
        countryCode: { type: "string" },
      },
      required: ["marque", "modele", "countryCode"],
    },
    schemaOutput: { type: "object", properties: { margeEstimee: { type: "number" }, devise: { type: "string" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_METIER,
    requiredPermissions: ["READ"],
    provider: "mkapms (vo-engine)",
    fallback: "Hérite du repli de estimateRetailPrice/getTradeInValue.",
    internalReplacementStatus: "Déjà propriétaire — VO Engine.",
  }),
  outil({
    toolId: "vehicules.checkVehicleHistory",
    name: "checkVehicleHistory",
    description: "Historique du véhicule (accidents, sinistres déclarés) — registre externe par pays.",
    schemaInput: { type: "object", properties: { vin: { type: "string" }, countryCode: { type: "string" } }, required: ["vin", "countryCode"] },
    schemaOutput: { type: "object", properties: { disponible: { type: "boolean" } } },
    implementationStatus: "IMPLEMENTED_NOT_CONNECTED",
    riskLevel: "MEDIUM",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "registre_historique_pays (aucun pays configuré)",
    fallback: "Aucun historique n'est affirmé absent de sinistre tant qu'aucune source n'est connectée — déclaré « non vérifié », jamais « sain ».",
    internalReplacementStatus: "Non applicable : dépend toujours d'un registre officiel par pays.",
  }),
  outil({
    toolId: "vehicules.checkRecall",
    name: "checkRecall",
    description: "Vérifie l'existence d'un rappel constructeur pour ce véhicule.",
    schemaInput: { type: "object", properties: { vin: { type: "string" } }, required: ["vin"] },
    schemaOutput: { type: "object", properties: { disponible: { type: "boolean" } } },
    implementationStatus: "IMPLEMENTED_NOT_CONNECTED",
    riskLevel: "MEDIUM",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "base_rappels_constructeurs (absente)",
    fallback: "Aucun rappel n'est affirmé absent tant que la base constructeur n'est pas connectée — déclaré « non vérifié ».",
    internalReplacementStatus: "Non applicable : dépend toujours des constructeurs.",
  }),
  outil({
    toolId: "vehicules.checkVehicleConsistency",
    name: "checkVehicleConsistency",
    description: "Vérifie la cohérence entre les données déclarées (marque/modèle/année) et le VIN décodé — détecte une annonce incohérente.",
    schemaInput: {
      type: "object",
      properties: { vin: { type: "string" }, marqueDeclaree: { type: "string" }, anneeDeclaree: { type: "number" } },
      required: ["vin"],
    },
    schemaOutput: { type: "object", properties: { coherent: { type: "boolean" }, ecarts: { type: "array", items: { type: "string" } } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "mkapms",
    fallback: "Repose uniquement sur le décodage structurel du VIN (aucun fournisseur externe requis) ; limité à l'année-modèle décodable.",
    internalReplacementStatus: "Déjà propriétaire.",
  }),
  outil({
    toolId: "vehicules.checkSupplierVehicleAvailability",
    name: "checkSupplierVehicleAvailability",
    description: "Disponibilité d'un véhicule chez un fournisseur B2B externe — nécessite le réseau fournisseurs, pas encore construit.",
    schemaInput: { type: "object", properties: { fournisseurId: { type: "string" }, vin: { type: "string" } }, required: ["fournisseurId"] },
    schemaOutput: { type: "object", properties: { disponible: { type: "boolean" } } },
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: ROLES_METIER,
    requiredPermissions: ["READ"],
    provider: "reseau_fournisseurs (non construit)",
    fallback: "Aucun — le réseau fournisseurs B2B n'existe pas encore comme moteur MKA.P-MS.",
    internalReplacementStatus: "Dépend de la construction du moteur fournisseurs (famille « fournisseurs »).",
  }),
  outil({
    toolId: "vehicules.normalizeVehicleData",
    name: "normalizeVehicleData",
    description: "Normalise marque/modèle/carburant/boîte déclarés (casse, synonymes connus) sans appel externe.",
    schemaInput: {
      type: "object",
      properties: { marque: { type: "string" }, modele: { type: "string" }, carburant: { type: "string" }, boite: { type: "string" } },
      required: [],
    },
    schemaOutput: {
      type: "object",
      properties: { marque: { type: "string" }, modele: { type: "string" }, carburant: { type: "string" }, boite: { type: "string" } },
    },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_LARGES,
    requiredPermissions: ["READ"],
    provider: "mkapms",
    fallback: "Aucun nécessaire — traitement local.",
    internalReplacementStatus: "Déjà propriétaire.",
  }),
  outil({
    toolId: "vehicules.detectVehicleDuplicate",
    name: "detectVehicleDuplicate",
    description: "Détecte une annonce déjà publiée pour le même véhicule (VIN identique, ou marque+modèle+année+kilométrage très proches).",
    schemaInput: {
      type: "object",
      properties: {
        vin: { type: "string" },
        marque: { type: "string" },
        modele: { type: "string" },
        annee: { type: "number" },
        kilometrage: { type: "number" },
      },
      required: [],
    },
    schemaOutput: { type: "object", properties: { doublonProbable: { type: "boolean" }, annonceIds: { type: "array", items: { type: "number" } } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: ROLES_METIER,
    requiredPermissions: ["READ"],
    provider: "mkapms (annonces)",
    fallback: "Aucun nécessaire — recherche directe dans les annonces publiées.",
    internalReplacementStatus: "Déjà propriétaire.",
  }),
];
