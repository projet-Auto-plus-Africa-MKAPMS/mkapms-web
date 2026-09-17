import { Link } from "react-router-dom";
import { ChevronLeft, Building2, Check, Clock, Ban } from "lucide-react";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";

const STATUT_LABEL: Record<string, { label: string; className: string; icon: typeof Check }> = {
  pending: { label: "En attente", className: "bg-amber-50 text-amber-600", icon: Clock },
  active: { label: "Actif", className: "bg-green-50 text-green-600", icon: Check },
  past_due: { label: "Impayé", className: "bg-red-50 text-red-600", icon: Ban },
  cancelled: { label: "Résilié", className: "bg-gray-50 text-gray-600", icon: Ban },
  expired: { label: "Expiré", className: "bg-gray-50 text-gray-600", icon: Ban },
};

export default function PaiementsProfessionnels() {
  const { user } = useAuth();
  const mesAbonnements = trpc.abonnements.mine.useQuery(undefined, { enabled: !!user });
  const ouvrirPortail = trpc.abonnements.openPortal.useMutation({
    onSuccess: (r) => { window.location.href = r.url; },
  });

  const abonnementsPro = (mesAbonnements.data ?? []).filter((a) => a.category !== "particulier_boost");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Building2 size={20} className="text-[#D4AF37]" /> Paiements pro</h1>
      </div>
      <div className="px-4 mt-4 space-y-2">
        {!user ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Connecte-toi pour voir tes paiements professionnels.</p>
        ) : mesAbonnements.isLoading ? (
          <p className="text-center text-sm text-[#6B7280] mt-4">Chargement…</p>
        ) : abonnementsPro.length === 0 ? (
          <p className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center text-sm text-[#6B7280]">Aucun abonnement professionnel actif pour le moment.</p>
        ) : (
          <>
            {abonnementsPro.map((a) => {
              const meta = STATUT_LABEL[a.status] ?? { label: a.status, className: "bg-gray-50 text-gray-600", icon: Clock };
              const Icon = meta.icon;
              return (
                <div key={a.id} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-[#111]">{a.planCode}</h3>
                    <p className="text-[9px] text-[#6B7280]">{a.amount ? `${Number(a.amount).toLocaleString("fr-FR")} ${a.currency}` : ""} {a.currentPeriodEnd ? `· renouvellement ${new Date(a.currentPeriodEnd).toLocaleDateString("fr-FR")}` : ""}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold flex items-center gap-1 ${meta.className}`}><Icon size={10} /> {meta.label}</span>
                </div>
              );
            })}
            <button
              onClick={() => ouvrirPortail.mutate({})}
              disabled={ouvrirPortail.isPending}
              className="w-full rounded-xl bg-[#111] py-3 text-sm font-bold text-white active:scale-[0.98] disabled:opacity-60 mt-2"
            >
              {ouvrirPortail.isPending ? "Ouverture…" : "Gérer mes paiements pro"}
            </button>
            {ouvrirPortail.error && <p className="text-xs text-red-600 text-center">{ouvrirPortail.error.message}</p>}
          </>
        )}
      </div>
    </div>
  );
}
