import { trpc } from "../../../lib/trpc";

const LABEL_STATUT: Record<string, string> = {
  en_attente: "En attente",
  disponible: "Disponible",
  verse: "Versé",
  litige: "Litige",
};

export function Ledger() {
  const ledger = trpc.investment.monLedger.useQuery();

  if (ledger.isLoading) return <p className="py-10 text-center text-sm text-[#6B7280]">Chargement…</p>;

  const lignes = ledger.data ?? [];
  if (lignes.length === 0) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">Aucun mouvement au Ledger pour le moment.</p>;
  }

  return (
    <div className="space-y-2">
      {lignes.map((l) => (
        <div key={l.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-[#111]">{l.universeId} — {l.countryCode}</p>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{LABEL_STATUT[l.statut] ?? l.statut}</span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-[#6B7280]">
            <p>Brut : {l.montantBrut} {l.devise}</p>
            <p>Commission MKA.P-MS : {l.commission} {l.devise}</p>
            <p>Taxe : {l.taxe} {l.devise}</p>
            <p className="font-bold text-[#111]">Net dû : {l.montantNet} {l.devise}</p>
          </div>
          <p className="mt-1 text-[10px] text-[#6B7280]">{new Date(l.createdAt).toLocaleString("fr-FR")} — réf. {l.transactionRef}</p>
        </div>
      ))}
    </div>
  );
}
