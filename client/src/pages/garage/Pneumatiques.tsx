import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Circle, Search, Check, ShoppingCart } from "lucide-react";
const PNEUS = [
  { marque: "Michelin Primacy 4", dim: "225/45 R18", prix: 120, stock: 8, note: 4.8 },
  { marque: "Continental PremiumContact 6", dim: "225/45 R18", prix: 110, stock: 12, note: 4.7 },
  { marque: "Bridgestone Turanza T005", dim: "225/45 R18", prix: 105, stock: 4, note: 4.5 },
  { marque: "Goodyear EfficientGrip 2", dim: "225/45 R18", prix: 95, stock: 6, note: 4.3 },
];
export default function Pneumatiques() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Circle size={20} className="text-[#D4AF37]" /> Pneumatiques</h1></div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3 space-y-2"><p className="text-xs font-bold text-[#111]">Recherche automatique par véhicule</p><div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Plaque, dimensions (225/45 R18)…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">{PNEUS.map(p => (
        <div key={p.marque} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{p.marque}</h3><span className="text-sm font-black text-[#D4AF37]">{p.prix} €</span></div>
          <p className="text-[10px] text-[#6B7280]">{p.dim} · Stock: {p.stock} · ⭐ {p.note}/5</p>
          <div className="mt-2 grid grid-cols-2 gap-2"><button className="rounded-lg bg-[#D4AF37] py-2 text-xs font-bold text-white">Montage + équilibrage</button><button className="rounded-lg bg-white border border-[#E5E7EB] py-2 text-xs font-bold text-[#111]">Pneu seul</button></div>
        </div>))}</div>
    </div>
  );
}
