import { Link } from "react-router-dom";
import { ChevronLeft, Package, Search, ShoppingCart, Star } from "lucide-react";
const PIECES = [
  { ref: "BOS-0986494", marque: "Bosch", label: "Plaquettes frein avant", prix: 55, stock: 12, compat: "3008/5008/308", photo: true },
  { ref: "MIC-P4-225", marque: "Michelin", label: "Pneu Primacy 4 225/45 R18", prix: 120, stock: 8, compat: "Universel", photo: true },
  { ref: "TOT-5W30-5L", marque: "Total", label: "Huile Quartz 5W30 5L", prix: 45, stock: 15, compat: "Universel", photo: true },
  { ref: "MAH-FH-308", marque: "Mahle", label: "Filtre habitacle charbon actif", prix: 25, stock: 3, compat: "308/3008/5008", photo: true },
];
export default function BoutiquePieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-[#D4AF37]" /> Boutique pièces</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3"><div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Référence, plaque ou VIN…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">{PIECES.map(p => (
        <div key={p.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><div><span className="text-[8px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">{p.marque}</span><h3 className="text-sm font-bold text-[#111] mt-0.5">{p.label}</h3></div><span className="text-base font-black text-[#D4AF37]">{p.prix} €</span></div>
          <p className="text-[9px] text-[#6B7280] mt-0.5">{p.ref} · Compatible: {p.compat} · Stock: {p.stock}</p>
          <div className="mt-2 grid grid-cols-2 gap-2"><button className="rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white">Pièce + montage</button><button className="rounded-lg bg-white border border-[#E5E7EB] py-2 text-xs font-bold text-[#111]">Pièce seule</button></div>
        </div>))}</div>
    </div>
  );
}
