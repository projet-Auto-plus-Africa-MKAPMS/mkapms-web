import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { useAuth } from "../lib/auth";
import { canAccessModule, type PermissionModule } from "@shared/permissions";

/**
 * Verrou d'accès aux espaces professionnels / internes MKA.P-MS.
 *
 * Réutilise le Permission Engine déjà construit (shared/permissions.ts,
 * même matrice utilisée côté serveur pour garder les endpoints) : ce
 * composant n'invente aucune nouvelle règle d'accès, il empêche seulement
 * qu'une route professionnelle ou interne s'affiche pour un rôle qui n'y
 * est pas autorisé — une adresse tapée à la main ne doit plus suffire.
 *
 * Ne remplace jamais la sécurité serveur (les procédures tRPC restent la
 * vraie frontière) : ce verrou n'est qu'une couche d'expérience utilisateur
 * en plus, pour ne pas laisser un particulier atterrir sur un écran vide
 * ou cassé faute de contenu autorisé.
 */
export default function RequirePermission({ module, children }: { module: PermissionModule; children: ReactNode }) {
  const { user, isSessionLoading } = useAuth();

  if (isSessionLoading) {
    return <div className="p-8 text-center text-[#6B7280]">Chargement…</div>;
  }

  if (canAccessModule(user?.role, module)) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#F5F3EF] px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <Lock size={28} className="text-[#D4AF37]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#111]">Espace professionnel</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          {user
            ? "Cet espace est réservé aux comptes professionnels ou aux équipes MKA.P-MS."
            : "Connectez-vous avec un compte professionnel pour accéder à cet espace."}
        </p>
        <div className="mt-8 space-y-2">
          {!user && (
            <Link to="/connexion" className="btn-primary w-full">Se connecter</Link>
          )}
          <Link to="/compte" className="btn-outline w-full">Retour à mon compte</Link>
        </div>
      </div>
    </div>
  );
}
