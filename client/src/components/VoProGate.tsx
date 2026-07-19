import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Check, Crown } from "lucide-react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";
import { isVoStaff, hasActiveVoSubscription } from "@shared/vo-access";

/**
 * Verrou d'accès au VO Pro (espace de gestion des véhicules d'occasion des clients).
 *
 * - Équipe MKA.P-MS (PDG / Directeur / Admin / Employés) : accès total gratuit.
 * - Clients (Particulier / Pro) : aperçu VISIBLE mais VERROUILLÉ tant que
 *   l'abonnement VO n'est pas actif → bouton « S'abonner ».
 */
export default function VoProGate({ children }: { children: ReactNode }) {
  const { user, isSessionLoading } = useAuth();
  const staff = isVoStaff(user?.role);
  const mine = trpc.abonnements.mine.useQuery(undefined, { enabled: !!user && !staff });

  if (isSessionLoading) {
    return <div className="p-8 text-center text-[#6B7280]">Chargement…</div>;
  }

  // Équipe : accès complet immédiat.
  if (staff) return <>{children}</>;

  // Client connecté : attendre le chargement des abonnements.
  if (user && mine.isLoading) {
    return <div className="p-8 text-center text-[#6B7280]">Vérification de l'abonnement…</div>;
  }

  if (user && hasActiveVoSubscription(mine.data)) return <>{children}</>;

  // Sinon : aperçu verrouillé.
  return <VoLockedPreview loggedIn={!!user} />;
}

function VoLockedPreview({ loggedIn }: { loggedIn: boolean }) {
  const avantages = [
    "Gestion complète de votre stock de véhicules d'occasion",
    "Suivi des étapes : achat → transport → diagnostic → vente",
    "Réservations et acomptes en ligne",
    "Dossier véhicule complet + historique des ventes",
    "Boost des annonces et priorité dans la recherche",
  ];
  return (
    <div className="min-h-screen bg-[#F5F3EF] px-4 py-10">
      <div className="mx-auto max-w-lg rounded-2xl border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4AF37]/10">
          <Lock size={28} className="text-[#D4AF37]" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#111]">Espace VO Pro</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          L'espace de gestion des véhicules d'occasion est réservé aux membres abonnés.
          Souscrivez un abonnement VO pour le débloquer.
        </p>

        <ul className="mt-6 space-y-2 text-left">
          {avantages.map((a) => (
            <li key={a} className="flex items-start gap-2 text-sm text-[#374151]">
              <Check size={16} className="mt-0.5 shrink-0 text-[#16A34A]" />
              <span>{a}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 space-y-2">
          {loggedIn ? (
            <Link to="/inscription-pro-vo" className="btn-primary flex w-full items-center justify-center gap-2">
              <Crown size={16} /> S'abonner au VO Pro
            </Link>
          ) : (
            <>
              <Link to="/connexion?tab=register" className="btn-primary flex w-full items-center justify-center gap-2">
                <Crown size={16} /> Créer un compte puis s'abonner
              </Link>
              <Link to="/connexion" className="btn-outline w-full">Se connecter</Link>
            </>
          )}
          <Link to="/abonnements" className="block text-xs font-medium text-[#6B7280] hover:text-[#111]">
            Voir toutes les offres VO
          </Link>
        </div>
      </div>
    </div>
  );
}
