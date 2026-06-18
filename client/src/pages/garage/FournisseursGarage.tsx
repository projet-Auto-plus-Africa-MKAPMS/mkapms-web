import { Link } from "react-router-dom";
import { ChevronLeft, Truck, Package, ChevronRight, Plus } from "lucide-react";
const FOURNISSEURS = [
  { nom: "Pièces Auto Express", types: "Pièces mécaniques", commandes: 45, total: "12 500 €" },
  { nom: "Pneu Pro Service", types: "Pneumatiques", commandes: 18, total: "8 200 €" },
  { nom: "Huiles & Fluides", types: "Huiles, filtres, consommables", commandes: 32, total: "4 800 €" },
];
export default function FournisseursGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Fournisseurs</h1></div>
      <div className="px-4 mt-4 space-y-2">{FOURNISSEURS.map(f => (
        <div key={f.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3"><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{f.nom}</h3><p className="text-[10px] text-[#6B7280]">{f.types} · {f.commandes} cmd</p></div><span className="text-sm font-bold text-[#D4AF37]">{f.total}</span><ChevronRight size={14} className="text-[#D4D4D4]" /></div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl border-2 border-dashed border-[#D4AF37]/40 py-3 text-sm font-bold text-[#D4AF37] flex items-center justify-center gap-2"><Plus size={16} /> Ajouter fournisseur</button></div>
    </div>
  );
}
