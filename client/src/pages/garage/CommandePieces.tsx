import { Link } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Search, Plus, Check } from "lucide-react";
const RESULTATS = [
  { ref: "BOS-0986494", label: "Plaquettes avant Bosch", prix: 55, dispo: true },
  { ref: "BOS-0986495", label: "Plaquettes arrière Bosch", prix: 48, dispo: true },
  { ref: "VAL-830700", label: "Disques avant Valeo", prix: 85, dispo: false },
];
export default function CommandePieces() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><ShoppingCart size={20} className="text-[#D4AF37]" /> Commande pièces</h1></div>
      <div className="px-4 -mt-3 relative z-10 flex gap-2"><div className="flex-1 flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Plaque, VIN ou référence…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-2">{RESULTATS.map(r => (
        <div key={r.ref} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{r.label}</h3><p className="text-[9px] text-[#6B7280]">{r.ref}</p></div>
          <span className="text-sm font-bold text-[#D4AF37]">{r.prix} €</span>
          <button className={`rounded-lg px-3 py-1.5 text-xs font-bold ${r.dispo ? "bg-[#D4AF37] text-white" : "bg-[#E5E7EB] text-red-500"}`} disabled={!r.dispo}>{r.dispo ? "Ajouter" : "Indispo"}</button>
        </div>))}</div>
    </div>
  );
}
