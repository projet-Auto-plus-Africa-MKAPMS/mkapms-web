import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, CreditCard, ChevronDown, Users, TrendingUp, AlertCircle, X } from "lucide-react";
import { trpc } from "../../lib/trpc";

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN ABONNEMENTS
   Données réelles : trpc.abonnements.adminList/adminStats/adminHistory
   (server/routers/abonnements.ts, table subscriptions déjà alimentée par le
   webhook Stripe checkout.session.completed). "Gérer" n'imite jamais une
   annulation ou un changement de plan côté admin : cela reste au client via
   openPortal (le vrai portail Stripe) — l'admin ne peut ici que consulter.
   ══════════════════════════════════════════════════════════════════════════ */

const STATUT_LABEL: Record<string, string> = {
  pending: "En attente",
  active: "Actif",
  cancelled: "Annulé",
  past_due: "Impayé",
  expired: "Expiré",
};

export default function AdminAbonnements() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [historique, setHistorique] = useState<number | null>(null);

  const statsQ = trpc.abonnements.adminStats.useQuery();
  const listQ = trpc.abonnements.adminList.useQuery({});
  const historyQ = trpc.abonnements.adminHistory.useQuery({ subscriptionId: historique ?? 0 }, { enabled: historique !== null });

  const mrrTotal = statsQ.data?.mrrParDevise.map((m) => `${Math.round(Number(m.total)).toLocaleString("fr-FR")} ${m.currency}`).join(" + ") ?? "—";

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><CreditCard size={20} className="text-[#D4AF37]" /> Abonnements</h1>
      </div>

      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {[
          { l: "Actifs", v: String(statsQ.data?.actifs ?? "…"), c: "text-green-500", bg: "bg-green-50", icon: Users },
          { l: "MRR", v: mrrTotal, c: "text-[#D4AF37]", bg: "bg-[#D4AF37]/10", icon: TrendingUp },
          { l: "Expirés", v: String(statsQ.data?.expires ?? "…"), c: "text-red-500", bg: "bg-red-50", icon: AlertCircle },
          { l: "Nouveaux/mois", v: statsQ.data ? `+${statsQ.data.nouveauxCeMois}` : "…", c: "text-blue-500", bg: "bg-blue-50", icon: TrendingUp },
        ].map((s) => { const Icon = s.icon; return (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg ${s.bg} grid place-items-center shrink-0`}><Icon size={16} className={s.c} /></div>
            <div className="text-left min-w-0"><p className="text-[10px] text-[#6B7280]">{s.l}</p><p className={`text-sm font-black truncate ${s.c}`}>{s.v}</p></div>
          </div>
        ); })}
      </div>

      <div className="px-4 mt-4 space-y-2">
        {listQ.isLoading && <p className="text-xs text-[#9CA3AF]">Chargement…</p>}
        {listQ.data?.length === 0 && <p className="text-xs text-[#6B7280]">Aucun abonnement pour le moment.</p>}
        {listQ.data?.map((a) => {
          const isExp = expanded === a.id;
          return (
            <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
              <button onClick={() => setExpanded(isExp ? null : a.id)} className="w-full text-left p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#111] truncate">{a.userName || a.userEmail || `Utilisateur #${a.userId}`}</p>
                  <p className="text-[10px] text-[#6B7280]">{a.planCode}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${a.status === "active" ? "bg-green-50 text-green-700" : a.status === "expired" || a.status === "cancelled" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{STATUT_LABEL[a.status] ?? a.status}</span>
                  <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
                </div>
              </button>
              {isExp && (
                <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Prix</span><p className="font-bold text-[#D4AF37]">{a.amount ? `${a.amount} ${a.currency}/mois` : "—"}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Catégorie</span><p className="font-bold text-[#111]">{a.category}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Débuté le</span><p className="font-bold text-[#111]">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</p></div>
                    <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Fin de période</span><p className="font-bold text-[#111]">{a.currentPeriodEnd ? new Date(a.currentPeriodEnd).toLocaleDateString("fr-FR") : "—"}</p></div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => setHistorique(a.id)} className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Historique</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {historique !== null && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setHistorique(null)}>
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-[#111]">Historique de facturation</h2>
              <button onClick={() => setHistorique(null)}><X size={18} className="text-[#6B7280]" /></button>
            </div>
            {historyQ.isLoading && <p className="text-xs text-[#9CA3AF]">Chargement…</p>}
            {historyQ.data?.length === 0 && <p className="text-xs text-[#6B7280]">Aucun paiement enregistré pour cet abonnement.</p>}
            <div className="space-y-2">
              {historyQ.data?.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg bg-[#F5F3EF] p-2 text-xs">
                  <span className="text-[#6B7280]">{new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                  <span className="font-bold text-[#111]">{p.amount} {p.currency}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${p.status === "paid" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
