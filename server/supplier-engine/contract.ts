/**
 * Supplier Engine — contrat public (types stables, règle MOS #12).
 *
 * Les autres moteurs qui ont besoin de connaître un fournisseur passent par
 * ces types et par les fonctions exportées de `service.ts` — jamais en lisant
 * directement les tables `supplier_*`.
 */

export const SUPPLIER_TYPES = ["vehicules", "pieces", "transport", "multi"] as const;
export type SupplierType = (typeof SUPPLIER_TYPES)[number];

export const SUPPLIER_STATUSES = [
  "brouillon",
  "en_verification",
  "valide_direction",
  "contrat_signe",
  "test_connexion",
  "actif",
  "suspendu",
  "desactive",
] as const;
export type SupplierStatus = (typeof SUPPLIER_STATUSES)[number];

export const KYB_STATUSES = ["non_verifie", "en_cours", "verifie", "refuse"] as const;
export type KybStatus = (typeof KYB_STATUSES)[number];

/** Les 15 étapes du point 2 du Plan Maître, dans l'ordre attendu. */
export const ONBOARDING_STEPS = [
  "creation",
  "verification_entreprise",
  "validation_direction",
  "signature_contrat",
  "selection_territoires",
  "selection_categories",
  "selection_connexion",
  "test_connexion",
  "mapping_donnees",
  "import_test",
  "controle_qualite",
  "validation_production",
  "activation",
  "suspension",
  "desactivation",
] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const ONBOARDING_STEP_STATUSES = ["a_faire", "en_cours", "valide", "refuse"] as const;
export type OnboardingStepStatus = (typeof ONBOARDING_STEP_STATUSES)[number];

/**
 * Les 22 méthodes de connexion du point 3, avec ce qui détermine si elles
 * peuvent réellement fonctionner sans intervention externe. `requiresSecret`
 * = true veut dire : sans clé/identifiant réel fourni, le connecteur reste
 * honnêtement "not_connected" — jamais simulé comme actif.
 */
export interface ConnectionMethodDef {
  code: string;
  label: string;
  requiresSecret: boolean;
  /** "fichier" | "flux" | "api" | "manuel" */
  category: "fichier" | "flux" | "api" | "manuel";
}

export const CONNECTION_METHODS: ConnectionMethodDef[] = [
  { code: "manuel", label: "Saisie manuelle", requiresSecret: false, category: "manuel" },
  { code: "formulaire_pro", label: "Formulaire Pro", requiresSecret: false, category: "manuel" },
  { code: "csv", label: "CSV", requiresSecret: false, category: "fichier" },
  { code: "xlsx", label: "XLS/XLSX", requiresSecret: false, category: "fichier" },
  { code: "google_sheets", label: "Google Sheets", requiresSecret: true, category: "fichier" },
  { code: "xml", label: "XML", requiresSecret: false, category: "fichier" },
  { code: "json", label: "JSON", requiresSecret: false, category: "fichier" },
  { code: "jsonl", label: "JSONL", requiresSecret: false, category: "fichier" },
  { code: "url_catalogue", label: "URL catalogue", requiresSecret: false, category: "flux" },
  { code: "ftp", label: "FTP", requiresSecret: true, category: "flux" },
  { code: "sftp", label: "SFTP", requiresSecret: true, category: "flux" },
  { code: "api_rest", label: "API REST", requiresSecret: true, category: "api" },
  { code: "graphql", label: "GraphQL", requiresSecret: true, category: "api" },
  { code: "soap", label: "SOAP", requiresSecret: true, category: "api" },
  { code: "webhook", label: "Webhooks", requiresSecret: true, category: "api" },
  { code: "dms", label: "DMS", requiresSecret: true, category: "api" },
  { code: "erp", label: "ERP", requiresSecret: true, category: "api" },
  { code: "pim", label: "PIM", requiresSecret: true, category: "api" },
  { code: "marketplace_feed", label: "Marketplace feed", requiresSecret: true, category: "flux" },
  { code: "connecteur_proprietaire", label: "Connecteur propriétaire", requiresSecret: true, category: "api" },
  { code: "import_programme", label: "Import programmé", requiresSecret: false, category: "fichier" },
  { code: "import_manuel_secours", label: "Import manuel de secours", requiresSecret: false, category: "manuel" },
];

export function findConnectionMethod(code: string): ConnectionMethodDef | undefined {
  return CONNECTION_METHODS.find((m) => m.code === code);
}

export const CONNECTION_AUTH_TYPES = ["none", "api_key", "oauth2", "hmac", "basic_auth"] as const;
export type ConnectionAuthType = (typeof CONNECTION_AUTH_TYPES)[number];

export const CONNECTION_ENVIRONMENTS = ["sandbox", "production"] as const;
export type ConnectionEnvironment = (typeof CONNECTION_ENVIRONMENTS)[number];

export const CONNECTION_STATUSES = [
  "not_connected",
  "configured",
  "active",
  "suspended",
  "disabled",
] as const;
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const MAPPING_ENTITY_TYPES = ["vehicule", "piece", "expedition"] as const;
export type MappingEntityType = (typeof MAPPING_ENTITY_TYPES)[number];

/** Champs canoniques minimaux (point 6 et point 10 du plan) que le mapping peut cibler. */
export const CANONICAL_VEHICLE_FIELDS = [
  "supplierVehicleId", "vin", "immatriculation", "marque", "modele", "version",
  "generation", "annee", "miseEnCirculation", "kilometrage", "carburant",
  "transmission", "puissance", "carrosserie", "portes", "places", "couleur",
  "co2", "normeEuro", "critAir", "equipements", "options", "etat",
  "prixFournisseur", "devise", "localisation", "photos", "disponibilite",
] as const;

export const CANONICAL_PART_FIELDS = [
  "supplierPartId", "referenceFournisseur", "referenceOem", "referenceAftermarket",
  "eanGtin", "marquePiece", "fabricant", "categorie", "sousCategorie",
  "nomPiece", "description", "compatibilites", "prixFournisseur", "devise", "stock",
  "delai", "poids", "dimensions", "photos", "garantie", "etatPiece",
  "paysOrigine", "disponibilite",
  // Ajoutés pour le LOT 3 du plan (point "MODÈLE CANONIQUE PIÈCE") — Parts
  // Engine : compatibilité véhicule structurée, dimensions détaillées, stock
  // détaillé par statut, prix public, TVA, cycle de synchronisation.
  "generation", "codeMoteur", "codeBoite", "anneeDebut", "anneeFin",
  "attributsTechniques", "longueur", "largeur", "hauteur", "documents",
  "qualiteGrade", "entrepot", "stockDisponible", "stockReserve",
  "prixPublic", "statutTva", "dateReapprovisionnement",
  "derniereMajFournisseur", "derniereSyncMkapms",
] as const;

/**
 * Champs canoniques minimaux pour une expédition/mission de transport
 * fournisseur (LOT 4, §67-69 de l'addendum). Un transporteur enregistré via
 * le Supplier Engine (`supplierType: "transport"`) mappe ses données vers
 * ces champs — jamais interprétés en dur ici, seulement validés par nom.
 */
export const CANONICAL_SHIPMENT_FIELDS = [
  "supplierShipmentId", "carrierCode", "service", "categorie",
  "origineVille", "origineCodePostal", "originePays",
  "destinationVille", "destinationCodePostal", "destinationPays",
  "poids", "longueur", "largeur", "hauteur", "valeurDeclaree", "devise",
  "assurance", "referenceCommande", "delaiJoursMin", "delaiJoursMax",
  "tarif", "statutTransporteur", "numeroSuivi", "urlSuivi",
  "dateEnlevementPrevue", "dateLivraisonPrevue", "documents", "preuves",
] as const;

/** Bus d'événements typés (règle MOS #12). */
export type SupplierEngineEvent =
  | { type: "supplier.created"; supplierProfileId: number; partnerId: number; supplierType: SupplierType }
  | { type: "supplier.kyb_verified"; supplierProfileId: number; kybStatus: KybStatus; actorId: number }
  | { type: "supplier.validated_by_direction"; supplierProfileId: number; actorId: number }
  | { type: "supplier.territories_set"; supplierProfileId: number; allowed: string[]; excluded: string[] }
  | { type: "supplier.connection_configured"; supplierProfileId: number; connectionId: number; method: string }
  | { type: "supplier.connection_tested"; supplierProfileId: number; connectionId: number; ok: boolean; motif: string }
  | { type: "supplier.mapping_saved"; supplierProfileId: number; entityType: MappingEntityType; version: number }
  | { type: "supplier.onboarding_step_completed"; supplierProfileId: number; step: OnboardingStep }
  | { type: "supplier.activated"; supplierProfileId: number; actorId: number }
  | { type: "supplier.suspended"; supplierProfileId: number; actorId: number; reason: string }
  | { type: "supplier.deactivated"; supplierProfileId: number; actorId: number };

export const SUPPLIER_ENGINE_META = {
  name: "supplier-engine" as const,
  label: "Supplier Engine" as const,
  contract: "server/supplier-engine/index.ts",
};
