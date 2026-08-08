/**
 * Accès client à l'Account Routing Engine.
 *
 * La destination est calculée avec la même fonction partagée que le serveur :
 * une page ne peut donc pas envoyer un compte dans un univers qui n'est pas
 * le sien. Le serveur reste l'autorité (`accountRouting.mine`), cette
 * résolution locale évite seulement d'attendre un aller-retour à la connexion.
 */
import { resolveAccountRoute, type AccountRoute } from "@shared/account-routing";
import type { SessionUser } from "./auth";

export function routeForSession(user: SessionUser | null): AccountRoute {
  return resolveAccountRoute({
    role: user?.role ?? null,
    accountType: user?.accountType ?? null,
    proCategory: (user as { proCategory?: string | null } | null)?.proCategory ?? null,
    staffPosition: (user as { staffPosition?: string | null } | null)?.staffPosition ?? null,
  });
}

/** Page d'accueil du compte : là où il doit revenir après connexion. */
export function homePathForSession(user: SessionUser | null): string {
  return routeForSession(user).homePath;
}
