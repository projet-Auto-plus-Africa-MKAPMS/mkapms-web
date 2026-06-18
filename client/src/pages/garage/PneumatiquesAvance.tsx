import { Link } from "react-router-dom";
import { ChevronLeft, Circle, Search, Check, Wrench } from "lucide-react";
const SERVICES_PNEU = [
  { label: "Montage", prix: "15 €/pneu", duree: "15 min" },
  { label: "Équilibrage", prix: "10 €/roue", duree: "10 min" },
  { label: "Géométrie", prix: "69 €", duree: "30 min" },
  { label: "Réparation crevaison", prix: "25 €", duree: "20 min" },
  { label: "Permutation", prix: "20 €", duree: "15 min" },
];
export default function PneumatiquesAvance() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gray-800 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Circle size={20} /> Centre pneumatiques</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3"><div className="flex items-center gap-2 rounded-lg bg-[#F5F3EF] px-3 py-2.5"><Search size={14} className="text-[#6B7280]" /><input type="text" placeholder="Plaque, VIN ou dimensions…" className="w-full bg-transparent text-sm outline-none" /></div></div>
      <div className="px-4 mt-3 space-y-1.5">{SERVICES_PNEU.map(s => (
        <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3"><Wrench size={12} className="text-gray-600" /><div className="flex-1"><p className="text-sm font-bold text-[#111]">{s.label}</p><p className="text-[9px] text-[#6B7280]">{s.duree}</p></div><span className="text-sm font-bold text-gray-700">{s.prix}</span></div>))}</div>
    </div>
  );
}
