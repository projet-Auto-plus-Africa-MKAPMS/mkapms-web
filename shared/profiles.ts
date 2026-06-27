// Parcours d'inscription séparés par profil (parcours §1-§7, §12).
// Règle centrale : « Ne jamais mélanger les profils ». Source unique partagée
// frontend / backend : chaque profil a son rôle, son type de compte, ses documents.
import type { PlanCategory } from "./plans.js";
import type { UserRole } from "./roles.js";

export type ProfileType =
  | "particulier"
  | "pro_vente"
  | "garage"
  | "location"
  | "vtc_taxi"
  | "pieces"
  | "livraison";

// Types de documents (alignés sur kyc_doc_type en base).
export type DocType =
  | "piece_identite"
  | "permis_conduire"
  | "justificatif_domicile"
  | "kbis"
  | "rib"
  | "carte_grise"
  | "controle_technique"
  | "autre";

export interface RequiredDoc {
  docType: DocType;
  label: string;
}

export interface ProfileDef {
  type: ProfileType;
  label: string;
  role: UserRole; // rôle attribué (shared/roles)
  accountType: "particulier" | "professionnel";
  needsValidation: boolean; // documents à valider avant accès complet
  planCategory: PlanCategory; // n'affiche QUE ces abonnements (§12)
  documents: RequiredDoc[];
  description: string;
}

export const PROFILES: Record<ProfileType, ProfileDef> = {
  particulier: {
    type: "particulier",
    label: "Particulier",
    role: "user",
    accountType: "particulier",
    needsValidation: false,
    planCategory: "particulier",
    documents: [],
    description: "Achat, vente d'annonces, location, devis, favoris et messagerie.",
  },
  pro_vente: {
    type: "pro_vente",
    label: "Professionnel Vente",
    role: "pro",
    accountType: "professionnel",
    needsValidation: true,
    planCategory: "pro_vente",
    documents: [
      { docType: "kbis", label: "KBIS ou équivalent" },
      { docType: "piece_identite", label: "Pièce d'identité du dirigeant" },
      { docType: "justificatif_domicile", label: "Justificatif de domicile du dirigeant" },
      { docType: "autre", label: "Justificatif local / bail (si applicable)" },
    ],
    description: "Boutique pro, dépôt d'annonces avec quotas et badge après validation.",
  },
  garage: {
    type: "garage",
    label: "Garage / Atelier / Mécanicien mobile",
    role: "garage",
    accountType: "professionnel",
    needsValidation: true,
    planCategory: "garage",
    documents: [
      { docType: "kbis", label: "KBIS ou équivalent" },
      { docType: "piece_identite", label: "Pièce d'identité du dirigeant" },
      { docType: "justificatif_domicile", label: "Justificatif de domicile du dirigeant" },
      { docType: "autre", label: "Assurance professionnelle" },
      { docType: "autre", label: "Justificatif local / bail (si garage fixe)" },
    ],
    description: "Accès Garage+ : devis, atelier, planning, clients, employés.",
  },
  location: {
    type: "location",
    label: "Société de location",
    role: "society",
    accountType: "professionnel",
    needsValidation: true,
    planCategory: "location",
    documents: [
      { docType: "kbis", label: "KBIS" },
      { docType: "piece_identite", label: "Pièce d'identité du dirigeant" },
      { docType: "justificatif_domicile", label: "Justificatif de domicile du dirigeant" },
      { docType: "autre", label: "Assurance professionnelle" },
      { docType: "autre", label: "Justificatif local (si agence)" },
    ],
    description: "Mise en location de véhicules, contrats automatiques, états des lieux.",
  },
  vtc_taxi: {
    type: "vtc_taxi",
    label: "VTC / TAXI",
    role: "society",
    accountType: "professionnel",
    needsValidation: true,
    planCategory: "vtc_taxi",
    documents: [
      { docType: "kbis", label: "KBIS" },
      { docType: "piece_identite", label: "Pièce d'identité du dirigeant" },
      { docType: "justificatif_domicile", label: "Justificatif de domicile du dirigeant" },
      { docType: "autre", label: "Assurance professionnelle" },
    ],
    description: "Gestion de flotte, chauffeurs et véhicules, réservations clients.",
  },
  pieces: {
    type: "pieces",
    label: "Boutique Pièces Auto",
    role: "pro",
    accountType: "professionnel",
    needsValidation: true,
    planCategory: "pieces",
    documents: [
      { docType: "kbis", label: "KBIS" },
      { docType: "piece_identite", label: "Pièce d'identité du dirigeant" },
      { docType: "justificatif_domicile", label: "Justificatif d'adresse" },
      { docType: "autre", label: "Assurance (si nécessaire)" },
    ],
    description: "Boutique en ligne + gestion de stock, commandes et facturation.",
  },
  livraison: {
    type: "livraison",
    label: "Livraison",
    role: "pro",
    accountType: "professionnel",
    needsValidation: true,
    planCategory: "livraison",
    documents: [
      { docType: "piece_identite", label: "Pièce d'identité" },
      { docType: "permis_conduire", label: "Permis de conduire" },
      { docType: "autre", label: "Assurance" },
      { docType: "carte_grise", label: "Carte grise du véhicule" },
      { docType: "kbis", label: "KBIS (si société)" },
    ],
    description: "Missions de livraison selon véhicule, poids, dimensions et zone.",
  },
};

export const PROFILE_LIST: ProfileDef[] = Object.values(PROFILES);

export function getProfile(type: string): ProfileDef | undefined {
  return PROFILES[type as ProfileType];
}

// Profils correspondant à un rôle donné (un rôle peut couvrir plusieurs profils).
export function profilesForRole(role: string): ProfileDef[] {
  return PROFILE_LIST.filter((p) => p.role === role);
}
