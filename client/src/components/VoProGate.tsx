import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Lock, Check, Crown, ShieldCheck } from "lucide-react";
import { useAuth } from "../lib/auth";
import { trpc } from "../lib/trpc";

/**
 * Verrou d'accès à l'espace VO professionnel.
 *
 * La décision n'est plus prise dans le navigateur : elle vient de
 * `voEspaces.acces`, calculée côté serveur à partir du rôle et de l'abonnement
 * VO réellement enregistré. Les écrans ne servent qu'à afficher ce verdict.
 *
 * - Équipe MKA.P-MS : espace officiel, accès sans abonnement (stock officiel
 *   dans VO Interne, jamais mélangé avec celui d'un professionnel) ;
 * - Professionnel abonné : son propre espace, son propre stock ;
 * - Professionnel sans abonnement : envoyé vers l'offre VO ;
 * - Particulier : espace fermé.
 */
export default function VoProGate({ children }: { children: ReactNode }) {
  const { user, isSessionLoading } = useAuth();
  const acces = trpc.voEspaces.acces.useQuery(undefined, { enabled: !!user });

  if (isSessionLoading) {
    return <div className="p-8 text-center text-[#6B7280]">Chargement…</div>;
  }

  if (!user) return <VoVerrouille etat="invite" />;

  if (acces.isLoading) {
    return <div className="p-8 text-center text-[#6B7280]">Vérification de l'accès VO…</div>;
  }

  if (acces.data?.autorise) return <>{children}</>;

  return (
    <VoVerrouille
      etat={acces.data?.espace === "particulier" ? "particulier" : "pro_sans_abonnement"}
      motif={acces.data?.motif}
      redirection={acces.data?.redirection}
    />
  );
}

type EtatVerrou = "invite" | "particulier" | "pro_sans_abonnement";

function VoVerrouille({
  etat,
  motif,
  redirection,
}: {
  etat: EtatVerrou;
  motif?: string;
  redirection?: string;
}) {
  const avantages = [
    "Votre propre stock de véhicules d'occasion, visible de vous seul",
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
        <h1 className="text-2xl font-extrabold text-[#111]">Espace VO professionnel</h1>
        <p className="mt-2 text-sm text-[#6B7280]">
          {motif ||
            "L'espace de gestion des véhicules d'occasion est réservé aux comptes professionnels abonnés."}
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-lg bg-[#F9FAFB] p-3 text-left text-xs text-[#374151]">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#16A34A]" />
          <span>
            Chaque espace est cloisonné : un professionnel ne voit que son propre stock, jamais
            celui d'un autre professionnel ni le stock officiel MKA.P-MS.
          </span>
        </div>

        {etat !== "particulier" && (
          <ul className="mt-6 space-y-2 text-left">
            {avantages.map((a) => (
              <li key={a} className="flex items-start gap-2 text-sm text-[#374151]">
                <Check size={16} className="mt-0.5 shrink-0 text-[#16A34A]" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 space-y-2">
          {etat === "invite" ? (
            <>
              <Link
                to="/connexion?tab=register"
                className="btn-primary flex w-full items-center justify-center gap-2"
              >
                <Crown size={16} /> Créer un compte professionnel
              </Link>
              <Link to="/connexion" className="btn-outline w-full">
                Se connecter
              </Link>
            </>
          ) : etat === "particulier" ? (
            <>
              <Link to="/acheter/mes-annonces" className="btn-primary w-full">
                Gérer mes annonces
              </Link>
              <Link to={redirection || "/inscription-pro-vo"} className="btn-outline w-full">
                Devenir professionnel
              </Link>
            </>
          ) : (
            <Link
              to={redirection || "/inscription-pro-vo"}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              <Crown size={16} /> Souscrire l'abonnement VO
            </Link>
          )}
          <Link
            to="/abonnements"
            className="block text-xs font-medium text-[#6B7280] hover:text-[#111]"
          >
            Voir toutes les offres VO
          </Link>
        </div>
      </div>
    </div>
  );
}
