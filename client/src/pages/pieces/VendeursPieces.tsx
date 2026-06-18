import { Link } from "react-router-dom";
import { ChevronLeft, Users, Star, Package, ChevronRight } from "lucide-react";
const VENDEURS = [
  { nom: "Pièces Auto Express", note: 4.8, produits: 1250, livraison: "24-48h" },
  { nom: "Pneu Pro Service", note: 4.6, produits: 450, livraison: "48h" },
  { nom: "Mécaparts", note: 4.5, produits: 890, livraison: "24h" },
];
export default function VendeursPieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Vendeurs pièces</h1></div>
      <div className="px-4 mt-4 space-y-2">{VENDEURS.map(v => (
        <div key={v.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">{v.nom}</h3>
          <div className="mt-1 flex gap-3 text-[10px] text-[#6B7280]"><span className="flex items-center gap-0.5"><Star size={8} className="text-[#D4AF37]" /> {v.note}/5</span><span>{v.produits} produits</span><span>{v.livraison}</span></div>
        </div>))}</div>
    </div>
  );
}
