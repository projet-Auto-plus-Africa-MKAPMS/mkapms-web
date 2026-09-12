import { Link } from "react-router-dom";
import { ChevronLeft, Home } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   HISTORIQUE LOCATIONS (/utilisateurs/historique-locations)
   Données réelles : trpc.reservations.mine (table bookings), filtré sur
   type "rental". Le nom du véhicule n'est pas joint par cette procédure :
   plutôt que d'inventer un titre, un lien réel vers la fiche véhicule.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_LABEL: Record<string, string> = {
  pending: "En attente",
  accepted: "Acceptée",
  rejected: "Refusée",
  cancelled: "Annulée",
  completed: "Terminée",
};

export default function HistoriqueLocations() {
  const mine = trpc.reservations.mine.useQuery();
  const locations = (mine.data ?? []).filter((b) => b.type === "rental");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Home size={20} className="text-[#D4AF37]" /> Historique locations</h1>
        <p className="mt-1 text-sm text-white/60">Vos réservations de location</p>
      </div>

      {mine.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {locations.map((b) => (
          <Link key={b.id} to={`/vehicule/${b.vehicleId}`} className="block rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111]">Véhicule #{b.vehicleId}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{STATUT_LABEL[b.status] ?? b.status}</span>
            </div>
            <p className="text-[10px] text-[#6B7280] mt-1">
              Du {new Date(b.startDate).toLocaleDateString("fr-FR")}{b.endDate ? ` au ${new Date(b.endDate).toLocaleDateString("fr-FR")}` : ""}
            </p>
            {b.cautionAmount && (
              <p className="text-[10px] text-[#6B7280] mt-0.5">Caution : {Number(b.cautionAmount).toLocaleString("fr-FR")} {b.cautionCurrency ?? "EUR"} — {b.cautionStatus}</p>
            )}
          </Link>
        ))}
      </div>

      {!mine.isLoading && locations.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <Home size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucune location pour le moment.</p>
        </div>
      )}
    </div>
  );
}
