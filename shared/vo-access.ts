// Règles d'accès VO — source unique (partagé client/serveur).
//
// Principe : la plateforme appartient à MKA.P-MS.
//   • L'équipe (PDG / Directeur / Admin / Employés) = propriétaires → accès total GRATUIT.
//   • Les clients (Particulier / Professionnel) = doivent un abonnement VO actif.
//
// Module additif : n'enlève ni ne modifie aucune permission existante.

import { getPlan } from "./plans.js";
import { ADMIN_ROLES } from "./roles.js";

export interface VoSubscriptionLike {
  planCode: string;
  status: string;
}

/** L'utilisateur fait-il partie de l'équipe MKA.P-MS (accès gratuit) ? */
export function isVoStaff(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

/** L'utilisateur a-t-il au moins un abonnement VO actif ? */
export function hasActiveVoSubscription(
  subs: VoSubscriptionLike[] | undefined | null,
): boolean {
  if (!subs?.length) return false;
  return subs.some((s) => {
    if (s.status !== "active") return false;
    return getPlan(s.planCode)?.category === "vo";
  });
}

/** Accès au VO Pro : équipe (gratuit) ou client avec abonnement VO actif. */
export function canUseVoPro(
  role: string | null | undefined,
  subs: VoSubscriptionLike[] | undefined | null,
): boolean {
  return isVoStaff(role) || hasActiveVoSubscription(subs);
}
