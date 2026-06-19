import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Plus, Euro, FileText, ChevronRight } from "lucide-react";
const FOURNISSEURS = [
  { nom: "Pièces Auto Express", type: "Pièces", commandes: 45, total: "12 500 €" },
  { nom: "Pneu Pro Service", type: "Pneus", commandes: 18, total: "8 200 €" },
  { nom: "Transport Rapide", type: "Transporteur", commandes: 12, total: "4 800 €" },
  { nom: "Carrosserie Lyon", type: "Partenaire", commandes: 8, total: "6 300 €" },
];
export default function CentreFournisseurs() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} /> Fournisseurs</h1></div>
      <div className="px-4 mt-4 space-y-2">{FOURNISSEURS.map(f => (
        <div key={f.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{f.nom}</h3><p className="text-[10px] text-[#6B7280]">{f.type} · {f.commandes} commandes</p></div>
          <span className="text-sm font-bold text-blue-700">{f.total}</span><ChevronRight size={14} className="text-red-500" />
        </div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl border-2 border-dashed border-blue-400 bg-blue-50/50 py-3 text-sm font-bold text-blue-700 flex items-center justify-center gap-2"><Plus size={16} /> Ajouter fournisseur</button></div>
    </div>
  );
}
