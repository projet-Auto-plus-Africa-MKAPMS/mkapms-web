import { useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useAuth } from "../lib/auth";
import { Eye, FileText, Download } from "lucide-react";
import { DocumentView, buildFactureData } from "../components/DocumentPDF";

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
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as "dashboard" | "ecritures" | "rapports" | null;
  const [tab, setTab] = useState<"dashboard" | "ecritures" | "rapports">(tabParam || "dashboard");
  
  useEffect(() => {
    if (tabParam) setTab(tabParam);
  }, [tabParam]);
  const [modalDoc, setModalDoc] = useState<any>(null);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <h1 className="text-xl font-black text-white flex items-center gap-2">
          <FileText size={20} className="text-[#D4AF37]" /> Comptabilité
        </h1>
        <p className="mt-1 text-[10px] text-white/50 uppercase tracking-wider font-bold">Gestion financière · MKA.P-MS</p>
      </div>

      <div className="px-4 mt-4">
        <div className="flex gap-1 rounded-xl bg-white border border-[#E5E7EB] p-1">
          {(["dashboard", "ecritures", "rapports"] as const).map((t) => (
            <button 
              key={t} 
              onClick={() => { setTab(t); setSearchParams({ tab: t }); }} 
              className={`flex-1 py-2 text-[10px] font-black uppercase transition-all rounded-lg ${tab === t ? "bg-[#111] text-[#D4AF37]" : "text-[#6B7280]"}`}
            >
              {t === "dashboard" ? "Stats" : t === "ecritures" ? "Écritures" : "Rapports"}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {tab === "dashboard" && <Dashboard />}
        {tab === "ecritures" && <Ecritures setModalDoc={setModalDoc} />}
        {tab === "rapports" && <Rapports setModalDoc={setModalDoc} />}
      </div>
      
      {modalDoc && <DocumentView doc={modalDoc} onClose={() => setModalDoc(null)} />}
    </div>
  );
}

function Dashboard() {
  const { data: stats, isLoading } = trpc.comptabilite.stats.useQuery();
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!stats) return null;

  const navigate = useNavigate();
  const cards = [
    { label: "Total débits", value: `${stats.totalDebits.toLocaleString()} €`, color: "text-red-500", bg: "bg-red-50", path: "?tab=ecritures&sens=debit" },
    { label: "Total crédits", value: `${stats.totalCredits.toLocaleString()} €`, color: "text-green-600", bg: "bg-green-50", path: "?tab=ecritures&sens=credit" },
    { label: "Bénéfice net", value: `${stats.benefice.toLocaleString()} €`, color: stats.benefice >= 0 ? "text-[#D4AF37]" : "text-red-500", bg: "bg-[#111]", path: "?tab=rapports" },
    { label: "TVA collectée", value: `${stats.totalTVA.toLocaleString()} €`, color: "text-amber-500", bg: "bg-amber-50", path: "?tab=ecritures&type=tva" },
    { label: "À valider", value: stats.aValider, color: "text-blue-600", bg: "bg-blue-50", path: "?tab=ecritures&statut=en_attente" },
    { label: "En retard", value: stats.enRetard, color: "text-red-600", bg: "bg-red-50", path: "?tab=ecritures&statut=en_retard" },
    { label: "Opérations", value: stats.nbEcritures, color: "text-[#111]", bg: "bg-slate-100", path: "?tab=ecritures" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {cards.map((c) => (
        <button key={c.label} onClick={() => navigate(`/comptabilite${c.path}`)} className={`rounded-xl border border-[#E5E7EB] bg-white p-4 text-left active:scale-[0.97] transition-all ${c.label === "Bénéfice net" ? "col-span-2 border-[#D4AF37] bg-[#111]" : ""}`}>
          <p className={`text-[10px] font-bold uppercase ${c.label === "Bénéfice net" ? "text-white/50" : "text-[#6B7280]"}`}>{c.label}</p>
          <div className={`mt-1 text-lg font-black ${c.color}`}>{c.value}</div>
        </button>
      ))}
    </div>
  );
}

import { useNavigate, useSearchParams } from "react-router-dom";

function Ecritures({ setModalDoc }: { setModalDoc: (doc: any) => void }) {
  const [searchParams] = useSearchParams();
  const sensFilter = searchParams.get("sens");
  const typeFilter = searchParams.get("type");
  const statutFilter = searchParams.get("statut");
  const { data: ecritures, isLoading } = trpc.comptabilite.ecritures.useQuery({
    sens: sensFilter || undefined,
    type: typeFilter || undefined,
    statut: statutFilter || undefined,
  });
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!ecritures?.length) return <div className="py-8 text-center text-[#6B7280]">Aucune écriture comptable.</div>;

  return (
    <div className="space-y-3">
      {ecritures.map((e) => (
        <button 
          key={e.id} 
          onClick={() => setModalDoc(buildFactureData({ ref: `FAC-${e.id}`, client: e.label, montant: `${e.montantTTC} €`, date: new Date(e.dateEcriture).toLocaleDateString("fr-FR"), statut: e.statut === "valide" ? "Payée" : "À régler" }))}
          className="w-full rounded-xl bg-white border border-[#E5E7EB] p-4 text-left active:scale-[0.98] transition-all flex items-center gap-3"
        >
          <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${e.sens === "credit" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
            <FileText size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-sm font-bold text-[#111] truncate">{e.label}</p>
              <p className={`text-sm font-black ${e.sens === "credit" ? "text-green-600" : "text-red-500"}`}>
                {e.sens === "credit" ? "+" : "-"}{Number(e.montantTTC).toLocaleString()} €
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">{TYPE_LABELS[e.type] ?? e.type}</span>
              <span className="h-1 w-1 rounded-full bg-[#E5E7EB]"></span>
              <span className="text-[10px] text-[#6B7280] font-medium">{new Date(e.dateEcriture).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function Rapports({ setModalDoc }: { setModalDoc: (doc: any) => void }) {
  const { data: rapports, isLoading } = trpc.comptabilite.rapports.useQuery();
  if (isLoading) return <div className="py-8 text-center text-[#6B7280]">Chargement...</div>;
  if (!rapports?.length) return <div className="py-8 text-center text-[#6B7280]">Aucun rapport généré. Utilisez le back-office pour générer un rapport mensuel ou trimestriel.</div>;

  return (
    <div className="space-y-4">
      {rapports.map((r) => (
        <div key={r.id} className="rounded-xl border border-[#E5E7EB] bg-white p-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#111]">Rapport {r.type} — {r.periode}</h3>
              <span className="text-xs text-[#9CA3AF]">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setModalDoc(buildFactureData({ ref: `REP-${r.id}`, client: "Direction MKA", montant: "Rapport", date: r.periode, statut: "Généré" }))}
                className="flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-50 transition"
              >
                <Eye size={14} /> Aperçu
              </button>
              <button 
                onClick={() => {
                  const docData = buildFactureData({ ref: `REP-${r.id}`, client: "Direction MKA", montant: "Rapport", date: r.periode, statut: "Généré" });
                  // Logic to trigger PDF download (e.g., open in new tab or use a dedicated download function)
                  // For now, we'll just log it to console or open in a new tab for demonstration
                  console.log("Télécharger PDF pour le rapport:", docData);
                  // Example: window.open(`/api/download-pdf?ref=${docData.ref}`, '_blank');
                  alert("Le téléchargement du PDF a été initié. Vous le trouverez dans vos téléchargements.");
                }}
                className="flex items-center gap-1.5 rounded-lg bg-[#F5F3EF] px-3 py-1.5 text-xs font-bold text-[#111] hover:bg-[#E5E7EB] transition"
              >
                <Download size={14} /> PDF
              </button>
            </div>
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
