import { useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";

const TYPE_LABELS: Record<string, string> = {
  achat_vehicule: "Achat véhicule",
  vente_vehicule: "Vente véhicule",
  facture_fournisseur: "Facture fournisseur",
  facture_client: "Facture client",
  depense: "Dépense",
  remboursement: "Remboursement",
  abonnement: "Abonnement",
  commission: "Commission",
  salaire: "Salaire",
  tva: "TVA",
  transport: "Transport",
  reparation: "Réparation",
  piece: "Pièce",
  lavage: "Lavage",
  autre: "Autre",
};

export default function Comptabilite() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"dashboard" | "ecritures" | "rapports">("dashboard");

  /* Accessible à tous les utilisateurs (connectés ou non) */

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold text-[#111]">Comptabilité MKA.P-MS</h1>
      <p className="mb-6 text-[#6B7280]">Achats, ventes, factures, dépenses, TVA, rapports mensuels et trimestriels.</p>

      <div className="mb-6 flex gap-2 border-b border-[#E5E7EB]">
        {(["dashboard", "ecritures", "rapports"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium ${tab === t ? "border-b-2 border-[#D4AF37] text-[#D4AF37]" : "text-[#6B7280]"}`}>
            {t === "dashboard" ? "Tableau de bord" : t === "ecritures" ? "Écritures" : "Rapports"}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <Dashboard />}
      {tab === "ecritures" && <Ecritures />}
      {tab === "rapports" && <Rapports />}
    </div>
  );
}

function Dashboard() {
  const { data: stats, isLoading } = trpc.comptabilite.stats.useQuery();
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!stats) return null;

  const cards = [
    { label: "Total dépenses (débits)", value: `${stats.totalDebits.toLocaleString()} €`, color: "#DC2626" },
    { label: "Total revenus (crédits)", value: `${stats.totalCredits.toLocaleString()} €`, color: "#16A34A" },
    { label: "Bénéfice net", value: `${stats.benefice.toLocaleString()} €`, color: stats.benefice >= 0 ? "#16A34A" : "#DC2626" },
    { label: "TVA collectée", value: `${stats.totalTVA.toLocaleString()} €`, color: "#F59E0B" },
    { label: "À valider", value: stats.aValider, color: "#2563EB" },
    { label: "En retard", value: stats.enRetard, color: "#DC2626" },
    { label: "Nb écritures", value: stats.nbEcritures, color: "#111" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-[#E5E7EB] bg-white p-5 text-center">
          <div className="mb-1 text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          <div className="text-sm text-[#6B7280]">{c.label}</div>
        </div>
      ))}
    </div>
  );
}

function Ecritures() {
  const { data: ecritures, isLoading } = trpc.comptabilite.ecritures.useQuery({});
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!ecritures?.length) return <div className="py-8 text-center text-[#6B7280]">Aucune écriture comptable.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[#E5E7EB] text-[#6B7280]">
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Label</th>
            <th className="px-3 py-2">HT</th>
            <th className="px-3 py-2">TVA</th>
            <th className="px-3 py-2">TTC</th>
            <th className="px-3 py-2">Sens</th>
            <th className="px-3 py-2">Statut</th>
          </tr>
        </thead>
        <tbody>
          {ecritures.map((e) => (
            <tr key={e.id} className="border-b border-[#F3F4F6] hover:bg-[#F9FAFB]">
              <td className="px-3 py-2 text-[#6B7280]">{new Date(e.dateEcriture).toLocaleDateString("fr-FR")}</td>
              <td className="px-3 py-2">{TYPE_LABELS[e.type] ?? e.type}</td>
              <td className="px-3 py-2 font-medium text-[#111]">{e.label}</td>
              <td className="px-3 py-2">{Number(e.montantHT).toLocaleString()} €</td>
              <td className="px-3 py-2 text-[#6B7280]">{Number(e.tvaMontant ?? 0).toLocaleString()} €</td>
              <td className="px-3 py-2 font-semibold">{Number(e.montantTTC).toLocaleString()} €</td>
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${e.sens === "credit" ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FEE2E2] text-[#DC2626]"}`}>
                  {e.sens === "credit" ? "Crédit" : "Débit"}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${e.statut === "valide" ? "bg-[#DCFCE7] text-[#16A34A]" : e.statut === "en_retard" ? "bg-[#FEE2E2] text-[#DC2626]" : "bg-[#FEF3C7] text-[#92400E]"}`}>
                  {e.statut}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Rapports() {
  const { data: rapports, isLoading } = trpc.comptabilite.rapports.useQuery();
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!rapports?.length) return <div className="py-8 text-center text-[#6B7280]">Aucun rapport généré. Utilisez le back-office pour générer un rapport mensuel ou trimestriel.</div>;

  return (
    <div className="space-y-4">
      {rapports.map((r) => (
        <div key={r.id} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-bold text-[#111]">Rapport {r.type} — {r.periode}</h3>
            <span className="text-xs text-red-500">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div><span className="text-[#6B7280]">Achats :</span> {Number(r.totalAchats ?? 0).toLocaleString()} €</div>
            <div><span className="text-[#6B7280]">Ventes :</span> {Number(r.totalVentes ?? 0).toLocaleString()} €</div>
            <div><span className="text-[#6B7280]">Dépenses :</span> {Number(r.totalDepenses ?? 0).toLocaleString()} €</div>
            <div><span className="text-[#6B7280]">Commissions :</span> {Number(r.totalCommissions ?? 0).toLocaleString()} €</div>
            <div><span className="text-[#6B7280]">Abonnements :</span> {Number(r.totalAbonnements ?? 0).toLocaleString()} €</div>
            <div><span className="text-[#6B7280]">TVA :</span> {Number(r.totalTVA ?? 0).toLocaleString()} €</div>
            <div className={Number(r.beneficeNet ?? 0) >= 0 ? "text-[#16A34A]" : "text-[#DC2626]"}>
              <span className="text-[#6B7280]">Bénéfice net :</span> {Number(r.beneficeNet ?? 0).toLocaleString()} €
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
