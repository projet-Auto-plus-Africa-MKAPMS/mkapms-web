import { Link } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const TYPE_LABEL: Record<string, string> = {
  vehicle_purchase: "Achat véhicule",
  rental_caution: "Dépôt de garantie",
  society_acompte: "Acompte réservation",
  pro_subscription: "Abonnement pro",
  franchise_subscription: "Abonnement franchise",
  vehicle_boost: "Mise en avant annonce",
};

const STATUT_LABEL: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
  cancelled: "Annulé",
};

export default function CentreFactures() {
  const { user } = useAuth();
  const mesPaiements = trpc.reservations.mesPaiements.useQuery(undefined, { enabled: !!user });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Factures</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir tes factures.</p>
        ) : mesPaiements.isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : (mesPaiements.data ?? []).length === 0 ? (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-sm text-[#6B7280]">Aucune facture pour le moment.</p>
        ) : (
          (mesPaiements.data ?? []).map((f) => (
            <div key={f.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
              <div className="flex-1">
                <h3 className="text-sm text-[#111]">{TYPE_LABEL[f.type] ?? f.type}</h3>
                <p className="text-[9px] text-[#6B7280]">FAC-{f.id} · {new Date(f.createdAt).toLocaleDateString("fr-FR")} · {STATUT_LABEL[f.status] ?? f.status}</p>
              </div>
              <span className="text-sm font-bold text-[#D4AF37]">{Number(f.amount).toLocaleString("fr-FR")} {f.currency}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
