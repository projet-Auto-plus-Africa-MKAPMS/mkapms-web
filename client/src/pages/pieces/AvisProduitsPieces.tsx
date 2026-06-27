import { Link } from "react-router-dom";
import { ChevronLeft, Star } from "lucide-react";
const AVIS = [
  { produit: "Plaquettes Bosch", note: 5, texte: "Excellent rapport qualité-prix", auteur: "Jean D." },
  { produit: "Huile Total 5W30", note: 4, texte: "Bonne qualité, livraison rapide", auteur: "Marie L." },
  { produit: "Pneu Michelin Primacy", note: 5, texte: "Parfait, montage inclus", auteur: "Pierre M." },
];
export default function AvisProduitsPieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Star size={20} className="text-[#D4AF37]" /> Avis produits</h1></div>
      <div className="px-4 mt-4 space-y-2">{AVIS.map(a => (
        <div key={a.auteur} className="rounded-xl bg-white border border-[#E5E7EB] p-4"><div className="flex items-center gap-1">{Array.from({length:5},(_, i) => <Star key={i} size={12} className={i < a.note ? "text-[#D4AF37]" : "text-[#E5E7EB]"} fill={i < a.note ? "#D4AF37" : "none"} />)}</div><p className="text-sm text-[#111] mt-1">{a.texte}</p><p className="text-[9px] text-[#6B7280] mt-0.5">{a.auteur} · {a.produit}</p></div>))}</div>
    </div>
  );
}
