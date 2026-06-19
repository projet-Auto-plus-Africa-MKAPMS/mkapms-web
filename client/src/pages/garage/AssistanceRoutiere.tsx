import { Link } from "react-router-dom";
import { ChevronLeft, Phone, Battery, Key, Fuel, Wrench, ChevronRight } from "lucide-react";
const SERVICES = [
  { label: "Batterie / Démarrage", icon: Battery, desc: "Recharge ou remplacement sur place" },
  { label: "Ouverture véhicule", icon: Key, desc: "Clés oubliées ou bloquées" },
  { label: "Carburant", icon: Fuel, desc: "Livraison carburant sur place" },
  { label: "Petite réparation", icon: Wrench, desc: "Intervention rapide sans remorquage" },
];
export default function AssistanceRoutiere() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-orange-600 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Phone size={20} /> Assistance routière</h1><p className="mt-1 text-sm text-white/80">Sans remorquage si possible</p></div>
      <div className="px-4 mt-4 space-y-2">{SERVICES.map(s => { const Icon = s.icon; return (
        <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50"><Icon size={16} className="text-orange-600" /></div><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{s.label}</h3><p className="text-[10px] text-[#6B7280]">{s.desc}</p></div><ChevronRight size={14} className="text-red-500" /></div>); })}</div>
      <div className="mx-4 mt-4 rounded-xl bg-orange-600 p-4 text-center"><p className="text-sm font-bold text-white">99 70 70 50 50</p><p className="text-xs text-white/80">24/7 · Intervention rapide</p></div>
    </div>
  );
}
