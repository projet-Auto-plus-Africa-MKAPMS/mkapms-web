import { Link } from "react-router-dom";
import { ChevronLeft, Check, Clock, Wrench, Shield, Car, Bell } from "lucide-react";
const STATUTS = [
  { label: "Véhicule reçu", fait: true, date: "15/03 09:00", icon: Car },
  { label: "Diagnostic", fait: true, date: "15/03 10:30", icon: Clock },
  { label: "Attente validation", fait: true, date: "15/03 11:00", icon: Bell },
  { label: "Réparation", fait: true, date: "15/03 14:00", icon: Wrench },
  { label: "Contrôle qualité", fait: false, date: "", icon: Shield },
  { label: "Prêt", fait: false, date: "", icon: Check },
];
export default function SuiviTempsReel() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Suivi temps réel</h1><p className="mt-1 text-sm text-white/60">Peugeot 3008 GT — OR-2025-0142</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{STATUTS.map((s, i) => { const Icon = s.icon; return (
        <div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className={`h-8 w-8 rounded-full flex items-center justify-center ${s.fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}><Icon size={14} className={s.fait ? "text-white" : "text-[#9CA3AF]"} /></div>{i < STATUTS.length - 1 && <div className={`w-0.5 h-8 ${s.fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}</div><div className="pb-4"><p className={`text-sm ${s.fait ? "font-bold text-[#111]" : "text-[#9CA3AF]"}`}>{s.label}</p>{s.date && <p className="text-[9px] text-[#9CA3AF]">{s.date}</p>}</div></div>); })}</div>
    </div>
  );
}
