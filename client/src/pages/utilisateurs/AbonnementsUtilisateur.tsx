import { Link } from "react-router-dom";
import { ChevronLeft, CreditCard } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { getPlan } from "@shared/plans";

/* Données réelles : trpc.abonnements.mine (server/routers/abonnements.ts,
   table subscriptions) + openPortal (Stripe Customer Portal réel) —
   jamais un second système d'abonnement inventé pour cet écran. */

const STATUT_LABEL: Record<string, string> = {
  pending: "En attente",
  active: "Actif",
  cancelled: "Annulé",
  past_due: "Paiement en retard",
  expired: "Expiré",
};

export default function AbonnementsUtilisateur() {
  const mesAbonnements = trpc.abonnements.mine.useQuery();
  const openPortal = trpc.abonnements.openPortal.useMutation({
    onSuccess: (r) => { if (r.url) window.location.href = r.url; },
  });
  const liste = mesAbonnements.data ?? [];
  const actifs = liste.filter((s) => s.status === "active");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/utilisateurs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mon compte</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><CreditCard size={20} className="text-[#D4AF37]" /> Abonnements</h1>
        <p className="mt-1 text-sm text-white/60">Vos abonnements et boosts MKA.P-MS</p>
      </div>

      {mesAbonnements.isLoading && <p className="px-4 mt-6 text-sm text-[#6B7280] text-center">Chargement…</p>}

      {actifs.length > 0 && (
        <div className="mx-4 mt-4">
          <button
            onClick={() => openPortal.mutate({})}
            disabled={openPortal.isPending}
            className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-50"
          >
            {openPortal.isPending ? "Ouverture…" : "Gérer mon abonnement (portail Stripe)"}
          </button>
          {openPortal.error && <p className="mt-2 text-xs text-red-600 text-center">{openPortal.error.message}</p>}
        </div>
      )}

      <div className="px-4 mt-4 space-y-2">
        {liste.map((s) => (
          <div key={s.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111]">{getPlan(s.planCode)?.label ?? s.planCode}</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{STATUT_LABEL[s.status] ?? s.status}</span>
            </div>
            {s.amount && <p className="text-xs text-[#6B7280] mt-1">{Number(s.amount).toLocaleString("fr-FR")} {s.currency}</p>}
            {s.currentPeriodEnd && <p className="text-[10px] text-[#9CA3AF] mt-1">Renouvellement : {new Date(s.currentPeriodEnd).toLocaleDateString("fr-FR")}</p>}
          </div>
        ))}
      </div>

      {!mesAbonnements.isLoading && liste.length === 0 && (
        <div className="px-4 mt-8 text-center">
          <CreditCard size={32} className="mx-auto text-[#D4AF37]" />
          <p className="mt-2 text-sm font-semibold text-[#6B7280]">Aucun abonnement pour le moment.</p>
          <Link to="/abonnements" className="mt-3 inline-block text-xs font-bold text-[#D4AF37] underline">Voir les offres</Link>
        </div>
      )}
    </div>
  );
}
