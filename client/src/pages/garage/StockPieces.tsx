import { Link } from "react-router-dom";
import { ChevronLeft, Package, Search, AlertTriangle } from "lucide-react";
const PIECES = [
  { ref: "BOS-0986494", label: "Plaquettes avant Bosch", compat: "3008/5008", achat: 28, vente: 55, stock: 12, min: 5 },
  { ref: "MIC-225-45-18", label: "Pneu Michelin 225/45 R18", compat: "Universel", achat: 65, vente: 120, stock: 8, min: 4 },
  { ref: "FIL-HAB-3008", label: "Filtre habitacle charbon", compat: "3008/308", achat: 8, vente: 25, stock: 3, min: 5 },
  { ref: "HUI-5W30", label: "Huile 5W30 5L Total", compat: "Universel", achat: 22, vente: 45, stock: 15, min: 8 },
];
export default function StockPieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-[#D4AF37]" /> Stock pièces</h1></div>
      <div className="px-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-3"><div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Rechercher par référence…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">{PIECES.map(p => (
        <div key={p.ref} className={`rounded-xl bg-white border p-3 ${p.stock <= p.min ? "border-red-300" : "border-[#E5E7EB]"}`}>
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{p.label}</h3>{p.stock <= p.min && <AlertTriangle size={12} className="text-red-500" />}</div>
          <p className="text-[9px] text-[#6B7280]">{p.ref} · {p.compat}</p>
          <div className="mt-1 grid grid-cols-4 gap-1 text-center text-[9px]"><div><p className="text-[#6B7280]">Achat</p><p className="font-bold">{p.achat}€</p></div><div><p className="text-[#6B7280]">Vente</p><p className="font-bold">{p.vente}€</p></div><div><p className="text-[#6B7280]">Stock</p><p className={`font-bold ${p.stock <= p.min ? "text-red-600" : "text-green-600"}`}>{p.stock}</p></div><div><p className="text-[#6B7280]">Min</p><p className="font-bold">{p.min}</p></div></div>
        </div>))}</div>
    </div>
  );
}
