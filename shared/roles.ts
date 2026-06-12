// Rôles & permissions (cahier des charges §3 + §10).

export type UserRole =
  | "user" // particulier
  | "pro"
  | "garage"
  | "employee"
  | "society"
  | "admin"
  | "super_admin";

export type StaffPosition =
  | "pdg"
  | "directeur"
  | "adjoint"
  | "gerant"
  | "chef_equipe"
  | "agent";

export const ROLE_LABELS: Record<UserRole, string> = {
  user: "Particulier",
  pro: "Professionnel",
  garage: "Garage",
  employee: "Employé",
  society: "Société",
  admin: "Administration",
  super_admin: "Direction (PDG)",
};

export const STAFF_LABELS: Record<StaffPosition, string> = {
  pdg: "PDG",
  directeur: "Directeur",
  adjoint: "Adjoint de direction",
  gerant: "Gérant",
  chef_equipe: "Chef d'équipe",
  agent: "Agent",
};

// Rôles disposant de l'accès au back-office
export const ADMIN_ROLES: UserRole[] = ["admin", "super_admin", "employee"];
// Rôles « direction » (tous droits, dont création de produits)
export const DIRECTION_ROLES: UserRole[] = ["super_admin"];
// Rôles professionnels (espace Garage+)
export const PRO_ROLES: UserRole[] = ["pro", "garage", "society"];

export function isAdmin(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role as UserRole);
}
export function isDirection(role?: string | null): boolean {
  return !!role && DIRECTION_ROLES.includes(role as UserRole);
}
export function isPro(role?: string | null): boolean {
  return !!role && PRO_ROLES.includes(role as UserRole);
}
