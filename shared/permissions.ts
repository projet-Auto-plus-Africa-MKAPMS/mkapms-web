// MKA.P-MS Permission Engine — Catalogue central des permissions (partagé client/serveur).
//
// Source de vérité unique : quels rôles peuvent accéder à quels modules.
// Le client s'en sert pour afficher des menus dynamiques ; le serveur s'en sert
// pour garder les endpoints. Aucun particulier ne doit voir les modules internes.
//
// Module développé séparément (Permission Engine), connecté de façon contrôlée.

import type { UserRole } from "./roles.js";

// ── Modules de la plateforme ────────────────────────────────────────────
export type PermissionModule =
  // Modules "particulier" (visibles par tous les comptes connectés)
  | "annonces"
  | "favoris"
  | "recherches"
  | "reservations"
  | "devis"
  | "abonnements"
  | "litiges"
  | "rewards"
  | "coffre"
  | "dossiers"
  | "rapports"
  | "notifications"
  | "messages"
  | "profil"
  | "support"
  // Modules professionnels
  | "espace_pro"
  | "stock_pro"
  | "atelier"
  | "catalogue_technique"
  | "suivi_vehicule"
  // Modules internes MKA.P-MS (jamais visibles par un particulier)
  | "vo_interne"
  | "comptabilite"
  | "employes"
  | "dossier_client"
  | "journal_activite"
  | "toutes_annonces"
  | "publicites"
  | "centre_pdg"
  | "back_office"
  | "super_admin";

// ── Actions possibles sur un module (matrice §5 du plan) ─────────────────
export type PermissionAction =
  | "voir"
  | "creer"
  | "modifier"
  | "supprimer"
  | "valider"
  | "exporter"
  | "publier"
  | "archiver";

// ── Matrice d'accès : rôles autorisés à VOIR chaque module ───────────────
// Tout module absent de la liste d'un rôle est refusé pour ce rôle.
const PARTICULIER_MODULES: PermissionModule[] = [
  "annonces",
  "favoris",
  "recherches",
  "reservations",
  "devis",
  "abonnements",
  "litiges",
  "rewards",
  "coffre",
  "dossiers",
  "rapports",
  "notifications",
  "messages",
  "profil",
  "support",
];

const PRO_MODULES: PermissionModule[] = [
  ...PARTICULIER_MODULES,
  "espace_pro",
  "stock_pro",
  "atelier",
  "catalogue_technique",
  "suivi_vehicule",
];

const GARAGE_MODULES: PermissionModule[] = [
  ...PARTICULIER_MODULES,
  "espace_pro",
  "stock_pro",
  "atelier",
  "catalogue_technique",
  "suivi_vehicule",
];

const EMPLOYEE_MODULES: PermissionModule[] = [
  ...PARTICULIER_MODULES,
  "espace_pro",
  "atelier",
  "catalogue_technique",
  "suivi_vehicule",
  "dossier_client",
  "vo_interne",
  "back_office",
];

const ADMIN_MODULES: PermissionModule[] = [
  ...PRO_MODULES,
  "vo_interne",
  "comptabilite",
  "employes",
  "dossier_client",
  "journal_activite",
  "toutes_annonces",
  "publicites",
  "back_office",
];

// Le PDG (super_admin) a accès à TOUT.
const ALL_MODULES: PermissionModule[] = [
  ...ADMIN_MODULES,
  "centre_pdg",
  "super_admin",
];

export const MODULE_ACCESS: Record<UserRole, PermissionModule[]> = {
  user: PARTICULIER_MODULES,
  pro: PRO_MODULES,
  garage: GARAGE_MODULES,
  society: PRO_MODULES,
  employee: EMPLOYEE_MODULES,
  admin: ADMIN_MODULES,
  super_admin: ALL_MODULES,
};

/** Un rôle peut-il voir/utiliser un module ? */
export function canAccessModule(
  role: string | null | undefined,
  module: PermissionModule,
): boolean {
  if (!role) return false;
  const allowed = MODULE_ACCESS[role as UserRole];
  if (!allowed) return false;
  return allowed.includes(module);
}

// ── Correspondance chemin de service → module ────────────────────────────
// Permet de filtrer une liste de liens/services par permission.
export const SERVICE_MODULE_BY_PATH: Record<string, PermissionModule> = {
  "/atelier-pro": "atelier",
  "/catalogue-technique": "catalogue_technique",
  "/suivi-vehicule": "suivi_vehicule",
  "/compta-dirigeant": "comptabilite",
  "/dossier-client": "dossier_client",
  "/journal-activite": "journal_activite",
  "/vo": "vo_interne",
};

/**
 * Un rôle peut-il accéder à un chemin de service ?
 * Les chemins non listés dans SERVICE_MODULE_BY_PATH sont publics (autorisés).
 */
export function canAccessServicePath(
  role: string | null | undefined,
  path: string,
): boolean {
  const module = SERVICE_MODULE_BY_PATH[path];
  if (!module) return true; // service public
  return canAccessModule(role, module);
}

// ── Message d'accès refusé (§8 du plan) ──────────────────────────────────
export const ACCESS_DENIED_MESSAGE = "Accès non autorisé.";
