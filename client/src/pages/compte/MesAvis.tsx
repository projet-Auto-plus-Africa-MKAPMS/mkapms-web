import { Link } from "react-router-dom";
import { BadgeCheck, ChevronLeft, MessageSquare, Star } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import BlocAvis from "../../components/avis/BlocAvis";

/**
 * « Mes avis » (/compte/avis) — destination des demandes d'avis envoyées après
 * une prestation réellement terminée (point 48).
 *
 * Chaque demande listée correspond à une transaction enregistrée par la
 * plateforme : c'est ce qui donne droit à la mention « ✓ Expérience vérifiée ».
 */
const LIBELLES_UNIVERS: Record<string, string> = {
  garage: "Garage",
  pieces: "Pièces automobiles",
  livraison: "Livraison",
  depannage: "Dépannage",
  location: "Location",
  vente: "Achat / Vente",
  controle_technique: "Contrôle technique",
  vtc_taxi: "VTC / Taxi",
  prestation: "Prestation",
};

export default function MesAvis() {
  const { user } = useAuth();
  const demandes = trpc.reputationEngine.mesDemandes.useQuery(undefined, { enabled: !!user });

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-black text-[#111]">Mes avis</h1>
        <p className="mb-6 text-gray-600">Connectez-vous pour voir vos demandes d'avis.</p>
        <Link to="/connexion" className="rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white">
          Se connecter
        </Link>
      </div>
    );
  }

  const liste = demandes.data ?? [];

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 py-5">
        <Link to="/compte" className="mb-2 inline-flex items-center gap-1 text-xs text-white/70">
          <ChevronLeft size={14} /> Mon compte
        </Link>
        <h1 className="flex items-center gap-2 text-2xl font-black text-white">
          <Star size={20} className="text-[#D4AF37]" /> Mes avis
        </h1>
        <p className="mt-1 text-sm text-white/70">
          Les prestations terminées pour lesquelles votre avis est attendu.
        </p>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5">
        {demandes.isLoading && <p className="text-sm text-gray-600">Chargement…</p>}

        {!demandes.isLoading && liste.length === 0 && (
          <p className="rounded-2xl border border-[#E5E7EB] bg-white p-4 text-sm text-gray-600">
            Aucune demande d'avis en attente. Une demande vous est envoyée automatiquement lorsqu'une
            prestation réservée sur MKA.P-MS est terminée.
          </p>
        )}

        <div className="grid gap-4">
          {liste.map((d) => (
            <div key={d.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#111] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {LIBELLES_UNIVERS[d.univers] ?? d.univers}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                  <BadgeCheck size={11} /> Expérience vérifiée
                </span>
                <span className="text-[11px] text-gray-500">
                  Prestation terminée le{" "}
                  {new Date(d.sentAt ?? d.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="mb-3 flex items-center gap-1 text-xs text-gray-600">
                <MessageSquare size={12} /> Le professionnel concerné pourra répondre publiquement à
                votre avis.
              </p>
              <BlocAvis
                targetType={d.targetType}
                targetId={d.targetId}
                univers={d.univers}
                countryCode={d.countryCode}
                titre="Déposer mon avis"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
