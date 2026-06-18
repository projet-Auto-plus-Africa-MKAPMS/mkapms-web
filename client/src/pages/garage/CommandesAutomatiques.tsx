import { Link } from "react-router-dom";
import { ChevronLeft, Bell, Package, AlertTriangle, Check } from "lucide-react";
const ALERTES = [
  { piece: "Plaquettes Bosch", stock: 3, min: 5, auto: true },
  { piece: "Huile 5W30 5L", stock: 4, min: 8, auto: true },
  { piece: "Filtre habitacle charbon", stock: 2, min: 5, auto: false },
];
export default function CommandesAutomatiques() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Bell size={20} className="text-[#D4AF37]" /> Commandes automatiques</h1></div>
      <div className="px-4 mt-4 space-y-2">{ALERTES.map(a => (
        <div key={a.piece} className="rounded-xl bg-white border border-red-200 p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{a.piece}</h3><AlertTriangle size={14} className="text-red-500" /></div>
          <p className="text-[10px] text-[#6B7280]">Stock: {a.stock} / Min: {a.min}</p>
          <div className="mt-2 flex gap-2"><button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-xs font-bold text-white">{a.auto ? "Commande auto activée ✓" : "Activer commande auto"}</button><button className="rounded-lg bg-white border border-[#E5E7EB] px-3 py-1.5 text-xs font-bold text-[#111]">Commander</button></div>
        </div>))}</div>
    </div>
  );
}
