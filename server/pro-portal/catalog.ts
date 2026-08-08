/**
 * MKA.P-MS Pro Portal Engine — catalogue de départ (métiers + services).
 *
 * Ce fichier n'est qu'une amorce : il alimente la base au démarrage si elle est
 * vide. Ensuite la base fait autorité — ajouter un métier ou un service se fait
 * en base, sans retoucher le parcours ni redéployer le portail.
 */

export interface ProfessionSeed {
  code: string;
  label: string;
  description: string;
  family: "vehicule" | "atelier" | "service" | "transport" | "gestion";
  defaultModules: string[];
  requiredModules: string[];
  /** Justificatifs par pays. `*` = socle commun appliqué partout. */
  requirements: Record<string, string[]>;
  sortOrder: number;
}

export interface ModuleSeed {
  code: string;
  label: string;
  description: string;
  family: "vehicule" | "atelier" | "service" | "transport" | "gestion" | "visibilite";
  productCode?: string;
  dependencies?: string[];
  sortOrder: number;
}

/** Socle légal commun à tous les métiers, quel que soit le pays. */
const SOCLE_COMMUN = [
  "Dénomination sociale",
  "Adresse de l'établissement",
  "Représentant légal",
  "Coordonnées de contact",
];

export const PROFESSION_CATALOG: ProfessionSeed[] = [
  {
    code: "garage",
    label: "Garage / Mécanique",
    description: "Entretien, réparation, révision, diagnostic.",
    family: "atelier",
    defaultModules: ["mod_garage", "mod_planning", "mod_clients", "mod_visibilite"],
    requiredModules: ["mod_garage"],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise", "Assurance responsabilité professionnelle"],
      FR: ["Numéro SIRET", "Assurance responsabilité civile professionnelle"],
    },
    sortOrder: 10,
  },
  {
    code: "carrosserie",
    label: "Carrosserie / Peinture",
    description: "Tôlerie, débosselage, peinture, remise en état.",
    family: "atelier",
    defaultModules: ["mod_garage", "mod_planning", "mod_clients", "mod_visibilite"],
    requiredModules: ["mod_garage"],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise", "Assurance responsabilité professionnelle"],
      FR: ["Numéro SIRET", "Assurance responsabilité civile professionnelle"],
    },
    sortOrder: 20,
  },
  {
    code: "vendeur",
    label: "Vendeur automobile",
    description: "Vente de véhicules d'occasion, indépendant ou négociant.",
    family: "vehicule",
    defaultModules: ["mod_vente", "mod_visibilite", "mod_clients"],
    requiredModules: ["mod_vente"],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise"],
      FR: ["Numéro SIRET", "Numéro de TVA intracommunautaire"],
    },
    sortOrder: 30,
  },
  {
    code: "concessionnaire",
    label: "Concessionnaire",
    description: "Réseau de marque, véhicules neufs et occasions.",
    family: "vehicule",
    defaultModules: ["mod_vente", "mod_visibilite", "mod_clients", "mod_facturation", "mod_publicite"],
    requiredModules: ["mod_vente"],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise", "Justificatif de représentation de marque"],
      FR: ["Numéro SIRET", "Numéro de TVA intracommunautaire"],
    },
    sortOrder: 40,
  },
  {
    code: "loueur",
    label: "Loueur de véhicules",
    description: "Location courte et longue durée, particuliers et entreprises.",
    family: "vehicule",
    defaultModules: ["mod_location", "mod_planning", "mod_clients", "mod_facturation"],
    requiredModules: ["mod_location"],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise", "Attestation d'assurance de flotte"],
      FR: ["Numéro SIRET", "Attestation d'assurance flotte en location"],
    },
    sortOrder: 50,
  },
  {
    code: "vtc_taxi",
    label: "VTC / Taxi",
    description: "Transport de personnes avec chauffeur.",
    family: "transport",
    defaultModules: ["mod_planning", "mod_clients", "mod_visibilite"],
    requiredModules: [],
    requirements: {
      "*": [...SOCLE_COMMUN, "Autorisation de transport de personnes en vigueur", "Assurance transport de personnes"],
      FR: ["Numéro SIRET", "Carte professionnelle VTC ou licence de taxi", "Inscription au registre applicable"],
    },
    sortOrder: 60,
  },
  {
    code: "flotte",
    label: "Gestion de flotte",
    description: "Entreprise gérant un parc de véhicules.",
    family: "gestion",
    defaultModules: ["mod_clients", "mod_planning", "mod_facturation"],
    requiredModules: [],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise"],
      FR: ["Numéro SIRET"],
    },
    sortOrder: 70,
  },
  {
    code: "pieces",
    label: "Pièces automobiles",
    description: "Vente de pièces neuves, d'occasion ou reconditionnées.",
    family: "service",
    defaultModules: ["mod_pieces", "mod_livraison", "mod_visibilite"],
    requiredModules: ["mod_pieces"],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise"],
      FR: ["Numéro SIRET", "Numéro de TVA intracommunautaire"],
    },
    sortOrder: 80,
  },
  {
    code: "controle_technique",
    label: "Contrôle technique",
    description: "Centre de contrôle technique agréé.",
    family: "atelier",
    defaultModules: ["mod_planning", "mod_clients", "mod_visibilite"],
    requiredModules: [],
    requirements: {
      "*": [...SOCLE_COMMUN, "Agrément de contrôle technique en vigueur"],
      FR: ["Numéro SIRET", "Numéro d'agrément du centre"],
    },
    sortOrder: 90,
  },
  {
    code: "transport_livraison",
    label: "Transport / Livraison",
    description: "Acheminement et livraison de véhicules ou de pièces.",
    family: "transport",
    defaultModules: ["mod_livraison", "mod_planning", "mod_clients"],
    requiredModules: ["mod_livraison"],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise", "Assurance marchandises transportées"],
      FR: ["Numéro SIRET", "Licence de transport si applicable"],
    },
    sortOrder: 100,
  },
  {
    code: "depannage",
    label: "Dépannage / Remorquage",
    description: "Assistance routière, remorquage, sortie de panne.",
    family: "service",
    defaultModules: ["mod_planning", "mod_clients", "mod_visibilite"],
    requiredModules: [],
    requirements: {
      "*": [...SOCLE_COMMUN, "Numéro d'identification d'entreprise", "Assurance responsabilité professionnelle"],
      FR: ["Numéro SIRET", "Autorisation de circulation du véhicule de dépannage si applicable"],
    },
    sortOrder: 110,
  },
  {
    code: "comptabilite",
    label: "Comptabilité",
    description: "Cabinet comptable proposant ses services aux professionnels.",
    family: "gestion",
    defaultModules: ["mod_facturation", "mod_clients", "mod_visibilite"],
    requiredModules: [],
    requirements: {
      "*": [...SOCLE_COMMUN, "Inscription à l'ordre professionnel applicable"],
      FR: ["Numéro SIRET", "Inscription à l'Ordre des experts-comptables"],
    },
    sortOrder: 120,
  },
  {
    code: "assurance_finance",
    label: "Assurance / Financement",
    description: "Courtier, assureur ou organisme de financement automobile.",
    family: "gestion",
    defaultModules: ["mod_clients", "mod_visibilite"],
    requiredModules: [],
    requirements: {
      "*": [...SOCLE_COMMUN, "Habilitation réglementaire du pays d'exercice"],
      FR: ["Numéro SIRET", "Immatriculation au registre des intermédiaires"],
    },
    sortOrder: 130,
  },
];

export const MODULE_CATALOG: ModuleSeed[] = [
  { code: "mod_vente", label: "Vente automobile", description: "Publier et gérer vos véhicules à la vente.", family: "vehicule", productCode: "pro_mod_vente", sortOrder: 10 },
  { code: "mod_location", label: "Location", description: "Mettre vos véhicules en location et gérer les réservations.", family: "vehicule", productCode: "pro_mod_location", sortOrder: 20 },
  { code: "mod_garage", label: "Garage", description: "Fiche garage, devis, ordres de réparation, rendez-vous.", family: "atelier", productCode: "pro_mod_garage", sortOrder: 30 },
  { code: "mod_pieces", label: "Pièces", description: "Catalogue de pièces, stock et demandes clients.", family: "service", productCode: "pro_mod_pieces", sortOrder: 40 },
  { code: "mod_livraison", label: "Livraison", description: "Courses, acheminement et suivi des livraisons.", family: "transport", productCode: "pro_mod_livraison", sortOrder: 50 },
  { code: "mod_publicite", label: "Publicité", description: "Mises en avant et emplacements publicitaires.", family: "visibilite", productCode: "pro_mod_publicite", sortOrder: 60 },
  { code: "mod_audience", label: "Audience", description: "Audiences locales construites à partir des signaux réels.", family: "visibilite", productCode: "pro_mod_audience", dependencies: ["mod_visibilite"], sortOrder: 70 },
  { code: "mod_visibilite", label: "Visibilité", description: "Référencement de votre établissement et contenus prêts à diffuser.", family: "visibilite", productCode: "pro_mod_visibilite", sortOrder: 80 },
  { code: "mod_clients", label: "Gestion clients", description: "Fiches clients, demandes, historique et relances.", family: "gestion", productCode: "pro_mod_clients", sortOrder: 90 },
  { code: "mod_facturation", label: "Facturation", description: "Devis, factures, encaissements et suivi comptable.", family: "gestion", productCode: "pro_mod_facturation", sortOrder: 100 },
  { code: "mod_planning", label: "Planning", description: "Agenda, rendez-vous et disponibilités.", family: "gestion", productCode: "pro_mod_planning", sortOrder: 110 },
];
