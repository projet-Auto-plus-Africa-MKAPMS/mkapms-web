import { Link } from "react-router-dom";
import { ChevronLeft, Euro, Check, Clock, RotateCcw, Ban } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const STATUT_LABEL: Record<string, { label: string; className: string; icon: typeof Check }> = {
  pending: { label: "En attente", className: "bg-amber-50 text-amber-600", icon: Clock },
  paid: { label: "Payé", className: "bg-green-50 text-green-600", icon: Check },
  released: { label: "Restitué", className: "bg-blue-50 text-blue-600", icon: RotateCcw },
  captured: { label: "Retenu", className: "bg-red-50 text-red-600", icon: Ban },
};

export default function AcompteFinance() {
  const { user } = useAuth();
  const mesReservations = trpc.reservations.mine.useQuery(undefined, { enabled: !!user });
  const acomptes = (mesReservations.data ?? []).filter(
    (b) => b.type === "purchase_visit" && b.cautionAmount != null && b.cautionStatus !== "none",
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Euro size={20} className="text-[#D4AF37]" /> Acomptes</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir tes acomptes.</p>
        ) : mesReservations.isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : acomptes.length === 0 ? (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-sm text-[#6B7280]">Aucun acompte enregistré pour le moment.</p>
        ) : (
          acomptes.map((a) => {
            const meta = STATUT_LABEL[a.cautionStatus] ?? { label: a.cautionStatus, className: "bg-gray-50 text-gray-600", icon: Clock };
            const Icon = meta.icon;
            return (
              <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{Number(a.cautionAmount).toLocaleString("fr-FR")} {a.cautionCurrency ?? "€"}</h3>
                  <p className="text-[9px] text-[#6B7280]">RES-{a.id} · {new Date(a.createdAt).toLocaleDateString("fr-FR")}</p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold flex items-center gap-1 ${meta.className}`}><Icon size={10} /> {meta.label}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
