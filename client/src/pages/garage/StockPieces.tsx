import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Package, Search, AlertTriangle, ChevronDown, ShoppingCart } from "lucide-react";
const PIECES = [
  { id: 1, ref: "BOS-0986494", label: "Plaquettes avant Bosch", compat: "3008/5008", achat: 28, vente: 55, stock: 12, min: 5 },
  { id: 2, ref: "MIC-225-45-18", label: "Pneu Michelin 225/45 R18", compat: "Universel", achat: 65, vente: 120, stock: 8, min: 4 },
  { id: 3, ref: "FIL-HAB-3008", label: "Filtre habitacle charbon", compat: "3008/308", achat: 8, vente: 25, stock: 3, min: 5 },
  { id: 4, ref: "HUI-5W30", label: "Huile 5W30 5L Total", compat: "Universel", achat: 22, vente: 45, stock: 15, min: 8 },
  { id: 5, ref: "COU-DIST-PSA", label: "Kit courroie distribution PSA", compat: "308/3008/C4", achat: 85, vente: 180, stock: 2, min: 3 },
];
export default function StockPieces() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Package size={20} className="text-[#D4AF37]" /> Stock pieces</h1></div>
      <div className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { l: "References", v: "5", c: "text-[#D4AF37]" },
          { l: "Alertes stock", v: "2", c: "text-red-500" },
          { l: "Valeur stock", v: "4 820 EUR", c: "text-green-500" },
        ].map(s => (<button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]"><p className={`text-sm font-black ${s.c}`}>{s.v}</p><p className="text-[8px] text-[#6B7280]">{s.l}</p></button>))}
      </div>
      <div className="px-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-3"><div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Rechercher par reference..." className="w-full bg-transparent text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">{PIECES.map(p => {
        const isExp = expanded === p.id;
        return (
          <div key={p.id} className={`rounded-xl bg-white border overflow-hidden ${p.stock <= p.min ? "border-red-300" : "border-[#E5E7EB]"}`}>
            <button onClick={() => setExpanded(isExp ? null : p.id)} className="w-full text-left p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h3 className="text-sm font-bold text-[#111] truncate">{p.label}</h3>{p.stock <= p.min && <AlertTriangle size={10} className="text-red-500" />}</div>
                <p className="text-[9px] text-[#6B7280]">{p.ref} · {p.compat}</p>
              </div>
              <span className={`text-xs font-bold ${p.stock <= p.min ? "text-red-600" : "text-green-600"}`}>{p.stock}</span>
              <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
            </button>
            {isExp && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                <div className="grid grid-cols-4 gap-1.5 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-[#6B7280]">Achat</span><p className="font-bold">{p.achat} EUR</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-[#6B7280]">Vente</span><p className="font-bold">{p.vente} EUR</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-[#6B7280]">Stock</span><p className={`font-bold ${p.stock <= p.min ? "text-red-600" : "text-green-600"}`}>{p.stock}</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><span className="text-[#6B7280]">Min</span><p className="font-bold">{p.min}</p></div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><ShoppingCart size={10} /> Commander</button>
                  <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Modifier</button>
                </div>
              </div>
            )}
          </div>
        );
      })}</div>
    </div>
  );
}
