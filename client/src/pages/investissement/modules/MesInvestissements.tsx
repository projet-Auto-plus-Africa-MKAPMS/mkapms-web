import { trpc } from "../../../lib/trpc";

const LABEL_STATUT: Record<string, string> = {
  DRAFT: "Brouillon",
  UNDER_REVIEW: "En revue",
  APPROVED: "Approuvé",
  AWAITING_SIGNATURE: "Attente signature",
  AWAITING_PAYMENT: "Attente paiement",
  ACTIVATING: "Activation en cours",
  ACTIVE: "Actif",
  SUSPENDED: "Suspendu",
  EXPIRING: "Expire bientôt",
  EXPIRED: "Expiré",
  TERMINATED: "Résilié",
  CANCELLED: "Annulé",
};

const COULEUR_STATUT: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  SUSPENDED: "bg-amber-100 text-amber-800",
  EXPIRED: "bg-slate-200 text-slate-600",
  TERMINATED: "bg-slate-200 text-slate-600",
  CANCELLED: "bg-slate-200 text-slate-600",
};

export function MesInvestissements() {
  const investissements = trpc.investment.mesInvestissements.useQuery();

  if (investissements.isLoading) return <p className="py-10 text-center text-sm text-[#6B7280]">Chargement…</p>;

  const liste = investissements.data ?? [];
  if (liste.length === 0) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">Aucun investissement pour le moment.</p>;
  }

  return (
    <div className="space-y-2">
      {liste.map((inv) => (
        <div key={inv.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#111]">{inv.universeId} — {inv.countryCode}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${COULEUR_STATUT[inv.status] ?? "bg-slate-100 text-slate-600"}`}>
              {LABEL_STATUT[inv.status] ?? inv.status}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">
            {inv.startAt ? new Date(inv.startAt).toLocaleDateString("fr-FR") : "Début non défini"} → {inv.endAt ? new Date(inv.endAt).toLocaleDateString("fr-FR") : "Fin non définie"}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Modèle : {inv.pricingModel === "fixed_price" ? "Prix fixe" : inv.pricingModel === "revenue_share" ? `Partage de revenus (${Number(inv.revenueShare) * 100}%)` : "Hybride"}
            {inv.fixedPrice ? ` — ${inv.fixedPrice} ${inv.currency}` : ""}
          </p>
        </div>
      ))}
    </div>
  );
}
