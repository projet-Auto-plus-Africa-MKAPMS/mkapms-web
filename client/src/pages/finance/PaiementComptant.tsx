import { Link } from "react-router-dom";
import { ChevronLeft, Euro, Check, Clock } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "En attente", className: "bg-amber-50 text-amber-600" },
  paid: { label: "Payé", className: "bg-green-50 text-green-600" },
  failed: { label: "Échoué", className: "bg-red-50 text-red-600" },
  refunded: { label: "Remboursé", className: "bg-blue-50 text-blue-600" },
  cancelled: { label: "Annulé", className: "bg-gray-50 text-gray-600" },
};

export default function PaiementComptant() {
  const { user } = useAuth();
  const mesPaiements = trpc.reservations.mesPaiements.useQuery(undefined, { enabled: !!user });
  const achatsComptant = (mesPaiements.data ?? []).filter((p) => p.type === "vehicle_purchase");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Paiement comptant</h1>
      </div>

      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">
        <p className="text-sm text-[#6B7280]">Le paiement comptant se règle directement depuis la fiche du véhicule choisi, avec le prix réel de cette annonce.</p>
        <Link to="/recherche" className="mt-3 block w-full rounded-xl bg-[#D4AF37] py-3 text-center text-sm font-bold text-white active:scale-[0.98]">Parcourir les véhicules</Link>
      </div>

      <div className="px-4 mt-6">
        <h3 className="text-sm font-bold text-[#111] mb-2">Vos achats comptant</h3>
        {!user ? (
          <p className="text-xs text-[#6B7280]">Connecte-toi pour voir tes achats comptant.</p>
        ) : mesPaiements.isLoading ? (
          <p className="text-xs text-[#6B7280]">Chargement…</p>
        ) : achatsComptant.length === 0 ? (
          <p className="text-xs text-[#6B7280]">Aucun achat comptant pour le moment.</p>
        ) : (
          achatsComptant.map((a) => {
            const meta = STATUT_LABEL[a.status] ?? { label: a.status, className: "bg-gray-50 text-gray-600" };
            return (
              <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 mb-2 flex items-center gap-3">
                {a.status === "paid" ? <Check size={14} className="text-green-600" /> : <Clock size={14} className="text-amber-500" />}
                <div className="flex-1">
                  <p className="text-sm text-[#111]">{Number(a.amount).toLocaleString("fr-FR")} {a.currency}</p>
                  <p className="text-[9px] text-[#6B7280]">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${meta.className}`}>{meta.label}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
