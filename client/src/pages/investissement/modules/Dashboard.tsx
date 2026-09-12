import { TrendingUp, Clock, Banknote, Layers } from "lucide-react";
import { trpc } from "../../../lib/trpc";

function Stat({ label, valeur, icon: Icon }: { label: string; valeur: string; icon: typeof TrendingUp }) {
  return (
    <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
      <div className="flex items-center gap-2 text-[#6B7280]"><Icon size={16} /><span className="text-xs font-semibold">{label}</span></div>
      <p className="mt-2 text-xl font-black text-[#111]">{valeur}</p>
    </div>
  );
}

export function Dashboard() {
  const investissements = trpc.investment.mesInvestissements.useQuery();
  const ledger = trpc.investment.monLedger.useQuery();
  const versements = trpc.investment.mesVersements.useQuery();
  const devenirInvestisseur = trpc.investment.devenirInvestisseur.useMutation({
    onSuccess: () => {
      investissements.refetch();
      ledger.refetch();
    },
  });

  if (investissements.isLoading || ledger.isLoading || versements.isLoading) {
    return <p className="py-10 text-center text-sm text-[#6B7280]">Chargement…</p>;
  }

  const actifs = (investissements.data ?? []).filter((i) => i.status === "ACTIVE").length;
  const totalNet = (ledger.data ?? []).reduce((s, l) => s + Number(l.montantNet), 0);
  const enAttente = (ledger.data ?? []).filter((l) => l.statut === "en_attente" || l.statut === "disponible").reduce((s, l) => s + Number(l.montantNet), 0);
  const prochain = (versements.data ?? []).filter((p) => p.statut === "en_attente").sort((a, b) => new Date(a.datePrevue).getTime() - new Date(b.datePrevue).getTime())[0];

  if ((investissements.data ?? []).length === 0) {
    return (
      <div className="rounded-xl bg-white border border-[#E5E7EB] p-6 text-center">
        <p className="text-sm text-[#6B7280]">Vous n'avez pas encore d'investissement MKA.P-MS.</p>
        <button
          onClick={() => devenirInvestisseur.mutate({})}
          disabled={devenirInvestisseur.isPending}
          className="mt-4 rounded-xl bg-[#111] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {devenirInvestisseur.isPending ? "…" : "Créer mon profil investisseur"}
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      <Stat label="Investissements actifs" valeur={String(actifs)} icon={Layers} />
      <Stat label="Revenu net cumulé" valeur={totalNet.toFixed(2)} icon={TrendingUp} />
      <Stat label="Montant en attente" valeur={enAttente.toFixed(2)} icon={Clock} />
      <Stat label="Prochain versement" valeur={prochain ? new Date(prochain.datePrevue).toLocaleDateString("fr-FR") : "Aucun"} icon={Banknote} />
    </div>
  );
}
