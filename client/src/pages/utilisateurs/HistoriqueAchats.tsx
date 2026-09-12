import { Link } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Check, Clock, X } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   HISTORIQUE ACHATS (/utilisateurs/historique-achats)
   Données réelles : trpc.reservations.mesPaiements filtré sur les paiements
   liés à un achat de véhicule ou de pièces (type "vehicle_purchase", ou
   payment_kind "pieces_order" dans les métadonnées) — jamais une commande
   inventée.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT: Record<string, { label: string; icon: typeof Check; color: string }> = {
  paid: { label: "Payé", icon: Check, color: "text-green-600 bg-green-50" },
  pending: { label: "En attente", icon: Clock, color: "text-amber-600 bg-amber-50" },
  failed: { label: "Échoué", icon: X, color: "text-red-600 bg-red-50" },
  refunded: { label: "Remboursé", icon: Check, color: "text-slate-600 bg-slate-100" },
  cancelled: { label: "Annulé", icon: X, color: "text-slate-600 bg-slate-100" },
};

export default function HistoriqueAchats() {
  const paiements = trpc.reservations.mesPaiements.useQuery();
  const achats = (paiements.data ?? []).filter((p) => {
    const kind = (p.metadata as Record<string, unknown> | null)?.payment_kind;
    return p.type === "vehicle_purchase" || kind === "pieces_order";
  });

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><ShoppingCart size={20} className="text-[#D4AF37]" /> Historique achats</h1>
        <p className="mt-1 text-sm text-white/60">Vos achats de véhicules et de pièces</p>
      </div>

      {paiements.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      <div className="px-4 mt-4 space-y-2">
        {achats.map((p) => {
          const s = STATUT[p.status] ?? STATUT.pending;
          const SIcon = s.icon;
          return (
            <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10">
                <ShoppingCart size={16} className="text-[#D4AF37]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-[#111]">{p.type === "vehicle_purchase" ? "Achat véhicule" : "Commande pièces"}</h3>
                <p className="text-[10px] text-[#6B7280]">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#111]">{Number(p.amount).toLocaleString("fr-FR")} {p.currency}</p>
                <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold ${s.color}`}>
                  <SIcon size={8} /> {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {!paiements.isLoading && achats.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <ShoppingCart size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun achat pour le moment.</p>
        </div>
      )}
    </div>
  );
}
