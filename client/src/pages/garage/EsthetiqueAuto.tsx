import { Link } from "react-router-dom";
import { ChevronLeft, Sparkles, Check, ChevronRight } from "lucide-react";
const SERVICES = [
  { label: "Polissage", prix: "89 €", desc: "Suppression micro-rayures" },
  { label: "Lustrage", prix: "69 €", desc: "Brillance longue durée" },
  { label: "Rénovation phares", prix: "49 €/paire", desc: "Phares jaunis ou ternis" },
  { label: "Traitement céramique", prix: "290 €", desc: "Protection 2 ans" },
];
export default function EsthetiqueAuto() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-pink-700 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Sparkles size={20} /> Esthétique auto</h1></div>
      <div className="px-4 mt-4 space-y-2">{SERVICES.map(s => (
        <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3"><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{s.label}</h3><p className="text-[10px] text-[#6B7280]">{s.desc}</p></div><span className="text-sm font-bold text-pink-700">{s.prix}</span><ChevronRight size={14} className="text-[#D4D4D4]" /></div>))}</div>
    </div>
  );
}
