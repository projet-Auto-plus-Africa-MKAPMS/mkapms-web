import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, Clock, RotateCcw, Ban } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const STATUT_LABEL: Record<string, { label: string; className: string; icon: typeof Check }> = {
  pending: { label: "Bloqué", className: "bg-amber-50 text-amber-600", icon: Clock },
  paid: { label: "Bloqué", className: "bg-amber-50 text-amber-600", icon: Clock },
  released: { label: "Restitué", className: "bg-green-50 text-green-600", icon: RotateCcw },
  captured: { label: "Retenu", className: "bg-red-50 text-red-600", icon: Ban },
};

export default function DepotGarantieFinance() {
  const { user } = useAuth();
  const mesReservations = trpc.reservations.mine.useQuery(undefined, { enabled: !!user });
  const depots = (mesReservations.data ?? []).filter(
    (b) => b.type === "rental" && b.cautionAmount != null && b.cautionStatus !== "none",
  );

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-green-700 px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Dépôts de garantie</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir tes dépôts de garantie.</p>
        ) : mesReservations.isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : depots.length === 0 ? (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-sm text-[#6B7280]">Aucun dépôt de garantie enregistré pour le moment.</p>
        ) : (
          depots.map((d) => {
            const meta = STATUT_LABEL[d.cautionStatus] ?? { label: d.cautionStatus, className: "bg-gray-50 text-gray-600", icon: Clock };
            const Icon = meta.icon;
            return (
              <div key={d.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-[#111]">{Number(d.cautionAmount).toLocaleString("fr-FR")} {d.cautionCurrency ?? "€"}</h3>
                  <p className="text-[9px] text-[#6B7280]">RES-{d.id} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}</p>
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
