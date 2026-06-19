import { Link } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Trash2, Wrench, Check } from "lucide-react";
const PANIER = [
  { label: "Plaquettes Bosch", prix: 55, montage: true, montageP: 30 },
  { label: "Filtre habitacle Mahle", prix: 25, montage: true, montageP: 15 },
];
export default function PanierPieces() {
  const totalPieces = PANIER.reduce((s, p) => s + p.prix, 0);
  const totalMontage = PANIER.reduce((s, p) => s + (p.montage ? p.montageP : 0), 0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage/boutique-pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Boutique</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><ShoppingCart size={20} className="text-[#D4AF37]" /> Mon panier</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">{PANIER.map(p => (
        <div key={p.label} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6]"><div className="flex-1"><h3 className="text-sm text-[#111]">{p.label}</h3>{p.montage && <p className="text-[9px] text-[#D4AF37]">+ Montage {p.montageP} €</p>}</div><span className="text-sm font-bold">{p.prix + (p.montage ? p.montageP : 0)} €</span><Trash2 size={14} className="text-red-500" /></div>))}
        <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Pièces</span><span className="font-bold">{totalPieces} €</span></div>
        <div className="flex justify-between text-sm"><span className="text-[#6B7280]">Montage</span><span className="font-bold">{totalMontage} €</span></div>
        <div className="flex justify-between pt-2 border-t-2 border-[#D4AF37] text-base"><span className="font-black">Total TTC</span><span className="font-black text-[#D4AF37]">{totalPieces + totalMontage} €</span></div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Commander</button>
      </div>
    </div>
  );
}
