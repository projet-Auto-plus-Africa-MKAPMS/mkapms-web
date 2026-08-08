import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

interface Props {
  univers: string;
  vehiculeRef: string;
  vehiculeTitre: string;
  dateDebut?: string;
  dateFin?: string;
  montantEstime?: number;
  devise?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Bouton de demande de réservation d'un véhicule de location.
 *
 * Le catalogue de location n'est pas encore adossé au paiement : plutôt que de
 * laisser un bouton sans action ou d'afficher une fausse confirmation, la
 * demande est réellement enregistrée et notifiée, et l'utilisateur voit ce qui
 * se passe ensuite.
 */
export default function ReserverLocationButton({
  univers,
  vehiculeRef,
  vehiculeTitre,
  dateDebut,
  dateFin,
  montantEstime,
  devise = "EUR",
  className,
  children,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reference, setReference] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const demande = trpc.reservations.requestLocation.useMutation({
    onSuccess: (r) => setReference(r.reference),
    onError: (e) => setErreur(e.message || "Demande impossible pour le moment."),
  });

  function onClick() {
    setErreur(null);
    if (!user) {
      navigate(`/connexion?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    demande.mutate({ univers, vehiculeRef, vehiculeTitre, dateDebut, dateFin, montantEstime, devise });
  }

  if (reference) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-3 px-4">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <p className="text-xs font-semibold text-emerald-800">
            Demande #{reference} envoyée. Le loueur confirme la disponibilité et le montant définitif avant tout paiement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/compte")}
          className="w-full rounded-xl border border-[#E5E7EB] py-2.5 text-xs font-bold text-[#111]"
        >
          Suivre ma demande
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <button type="button" onClick={onClick} disabled={demande.isPending} className={className}>
        {demande.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" /> Envoi…
          </span>
        ) : (
          children
        )}
      </button>
      {erreur && <p className="text-center text-[11px] font-semibold text-red-600">{erreur}</p>}
    </div>
  );
}
