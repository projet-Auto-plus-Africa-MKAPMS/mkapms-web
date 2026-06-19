import { Link } from "react-router-dom";
import { ChevronLeft, Truck, ChevronRight } from "lucide-react";
const FOURNISSEURS = [
  { nom: "Bosch", type: "Équipementier", produits: 2500 },
  { nom: "Valeo", type: "Équipementier", produits: 1800 },
  { nom: "ADNAuto", type: "Grossiste", produits: 5000 },
  { nom: "Oscaro Pro", type: "Distributeur", produits: 8000 },
];
export default function FournisseursPieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Truck size={20} className="text-[#D4AF37]" /> Fournisseurs</h1></div>
      <div className="px-4 mt-4 space-y-2">{FOURNISSEURS.map(f => (
        <div key={f.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3"><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{f.nom}</h3><p className="text-[9px] text-[#6B7280]">{f.type} · {f.produits} réf.</p></div><ChevronRight size={16} className="text-red-500" /></div>))}</div>
    </div>
  );
}
