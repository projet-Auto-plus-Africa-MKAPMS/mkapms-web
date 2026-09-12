import { trpc } from "../../../lib/trpc";

const LABEL_STATUT: Record<string, string> = {
  en_attente: "En attente",
  paye: "Payé",
  echoue: "Échoué",
  litige: "Litige",
  annule: "Annulé",
};

export function Versements() {
  const versements = trpc.investment.mesVersements.useQuery();

  if (versements.isLoading) return <p className="py-10 text-center text-sm text-[#6B7280]">Chargement…</p>;

  const liste = versements.data ?? [];
  if (liste.length === 0) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">Aucun versement pour le moment.</p>;
  }

  return (
    <div className="space-y-2">
      {liste.map((p) => (
        <div key={p.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#111]">{p.montantNet} {p.devise}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{LABEL_STATUT[p.statut] ?? p.statut}</span>
          </div>
          <p className="mt-1 text-xs text-[#6B7280]">
            Période : {new Date(p.periodeDebut).toLocaleDateString("fr-FR")} → {new Date(p.periodeFin).toLocaleDateString("fr-FR")}
          </p>
          <p className="mt-1 text-xs text-[#6B7280]">
            Prévu le {new Date(p.datePrevue).toLocaleDateString("fr-FR")}{p.dateReelle ? ` — versé le ${new Date(p.dateReelle).toLocaleDateString("fr-FR")}` : ""}
          </p>
          {p.motifEchec && <p className="mt-1 text-xs text-red-600">Échec : {p.motifEchec} ({p.tentatives} tentative(s))</p>}
          {p.reference && <p className="mt-1 text-[10px] text-[#6B7280]">Référence : {p.reference}</p>}
        </div>
      ))}
    </div>
  );
}
