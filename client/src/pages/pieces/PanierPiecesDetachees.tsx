import { Link } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Trash2, Wrench } from "lucide-react";
const PANIER = [
  { label: "Plaquettes Bosch avant", prix: 55, montage: true, montageP: 30 },
  { label: "Huile Total 5W30 5L", prix: 45, montage: false, montageP: 0 },
  { label: "Filtre habitacle Mahle", prix: 25, montage: true, montageP: 15 },
];
export default function PanierPiecesDetachees() {
  const total = PANIER.reduce((s, p) => s + p.prix + (p.montage ? p.montageP : 0), 0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/pieces" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Pièces</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><ShoppingCart size={20} className="text-[#D4AF37]" /> Mon panier</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">{PANIER.map(p => (
        <div key={p.label} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6]"><div className="flex-1"><h3 className="text-sm text-[#111]">{p.label}</h3>{p.montage && <p className="text-[9px] text-[#D4AF37] flex items-center gap-0.5"><Wrench size={8} /> + Montage {p.montageP} €</p>}</div><span className="text-sm font-bold">{p.prix + (p.montage ? p.montageP : 0)} €</span><Trash2 size={14} className="text-[#9CA3AF]" /></div>))}
        <div className="flex justify-between pt-2 border-t-2 border-[#D4AF37] text-base"><span className="font-black">Total TTC</span><span className="font-black text-[#D4AF37]">{total} €</span></div>
        <button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Commander</button>
      </div>
    </div>
  );
}
