import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MapPin, Video, Phone, Calendar, Clock, Check } from "lucide-react";
const MODES_VISITE = [{ label: "Visite sur place", icon: MapPin, desc: "Rendez-vous au garage" }, { label: "Visio", icon: Video, desc: "Appel vidéo en direct" }, { label: "Appel vidéo", icon: Phone, desc: "Tour du véhicule en vidéo" }];
const CRENEAUX = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
export default function CentreVisiteVehicule() {
  const [mode, setMode] = useState(0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/acheter" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Vente</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Visite véhicule</h1></div>
      <div className="px-4 mt-4 space-y-2">{MODES_VISITE.map((m, i) => { const Icon = m.icon; return (
        <button key={i} onClick={() => setMode(i)} className={`w-full rounded-xl p-4 flex items-center gap-3 border-2 ${mode === i ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-white"}`}>
          <Icon size={18} className={mode === i ? "text-[#D4AF37]" : "text-[#6B7280]"} /><div className="flex-1 text-left"><p className="text-sm font-bold text-[#111]">{m.label}</p><p className="text-[10px] text-[#6B7280]">{m.desc}</p></div>
        </button>); })}</div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4"><h3 className="text-sm font-bold text-[#111] mb-2">Choisir un créneau</h3><input type="date" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm mb-2" /><div className="flex flex-wrap gap-1.5">{CRENEAUX.map(c => (<button key={c} className="rounded-lg bg-[#F5F3EF] px-3 py-1.5 text-xs font-semibold text-[#111]">{c}</button>))}</div></div>
      <div className="px-4 mt-4"><button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white active:scale-[0.98]">Confirmer la visite</button></div>
    </div>
  );
}
