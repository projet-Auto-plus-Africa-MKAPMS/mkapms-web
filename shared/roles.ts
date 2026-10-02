// Rôles & permissions (cahier des charges §3 + §10).

export type UserRole =
  | "user" // particulier
  | "pro"
  | "garage"
  | "employee"
  | "society"
  | "admin"
  | "super_admin"
  // LOT 7 (suite) — RBAC Fournisseur/Transporteur : portail en lecture
  // strictement isolée à leur propre fiche (supplier_carrier_accounts),
  // jamais dans ADMIN_ROLES/DIRECTION_ROLES/PRO_ROLES. Aucun compte réel
  // n'est ouvert avec ces rôles tant qu'un PDG n'y consent pas
  // explicitement (server/supplier-engine/access.ts).
  | "supplier"
  | "carrier";

export type StaffPosition =
  | "pdg"
  | "directeur"
  | "sous_directeur"
  | "adjoint"
  | "gerant"
  | "chef_equipe"
  | "comptable"
  | "agent"
  // Intitulés externes : un investisseur ou un partenaire n'est pas un
  // membre de l'équipe interne — son compte reste un compte « user » sans
  // aucun accès back-office (voir POSITIONS_EXTERNES).
  | "investisseur"
  | "partenaire";

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Particulier",
  pro: "Professionnel",
  garage: "Garage",
  employee: "Employé",
  society: "Société",
  admin: "Administration",
  super_admin: "Direction (PDG)",
  supplier: "Fournisseur",
  carrier: "Transporteur",
};

export const STAFF_LABELS: Record<StaffPosition, string> = {
  pdg: "PDG",
  directeur: "Directeur",
  sous_directeur: "Sous-directeur",
  adjoint: "Adjoint de direction",
  gerant: "Gérant",
  chef_equipe: "Chef d'équipe",
  comptable: "Comptable",
  agent: "Agent",
  investisseur: "Investisseur",
  partenaire: "Partenaire",
};

// Postes que le PDG/la direction peut attribuer (le PDG lui-même n'est jamais
// attribuable : il est fixé par le rôle super_admin).
export const POSITIONS_ATTRIBUABLES = [
  "directeur", "sous_directeur", "adjoint", "gerant", "chef_equipe", "comptable", "agent", "investisseur", "partenaire",
] as const satisfies readonly StaffPosition[];
export type PositionAttribuable = (typeof POSITIONS_ATTRIBUABLES)[number];

// Postes externes : jamais de rôle back-office. Le droit vient du rôle, pas de
// l'intitulé — un investisseur/partenaire créé par le PDG reste « user ».
export const POSITIONS_EXTERNES: readonly StaffPosition[] = ["investisseur", "partenaire"];
export function isPositionExterne(position?: string | null): boolean {
  return !!position && (POSITIONS_EXTERNES as readonly string[]).includes(position);
}

// Rôles disposant de l'accès au back-office
export const ADMIN_ROLES: UserRole[] = ["admin", "super_admin", "employee"];
// Rôles « direction » (accès complet au back-office, dont création de produits)
// Le Directeur (admin + staffPosition directeur) a accès mais avec des limites
// côté serveur (ne peut pas supprimer comptes pro ni PDG).
export const DIRECTION_ROLES: UserRole[] = ["super_admin", "admin"];
// Rôles professionnels (espace Garage+)
export const PRO_ROLES: UserRole[] = ["pro", "garage", "society"];
// Rôles Fournisseur/Transporteur (LOT 7 suite) : jamais dans ADMIN_ROLES,
// DIRECTION_ROLES ni PRO_ROLES — un fournisseur ou un transporteur n'a
// jamais accès aux données Direction/PDG ni à l'espace pro marketplace.
export const SUPPLIER_CARRIER_ROLES: UserRole[] = ["supplier", "carrier"];

export function isAdmin(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole);
}
export function isDirection(role?: string | null): boolean {
  return !!role && DIRECTION_ROLES.includes(role as UserRole);
}
export function isPro(role?: string | null): boolean {
  return !!role && PRO_ROLES.includes(role as UserRole);
}
export function isSupplierOrCarrier(role?: string | null): boolean {
  return !!role && SUPPLIER_CARRIER_ROLES.includes(role as UserRole);
}
