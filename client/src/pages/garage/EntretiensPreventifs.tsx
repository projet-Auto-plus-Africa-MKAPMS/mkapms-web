import { Link } from "react-router-dom";
import { ChevronLeft, Clock, AlertTriangle, Check } from "lucide-react";
const ALERTES = [
  { label: "Vidange", vehicule: "3008 GT", echeance: "65 000 km / Sep 2025", urgence: "bientot" },
  { label: "Distribution", vehicule: "BMW 320d", echeance: "120 000 km / Déc 2025", urgence: "ok" },
  { label: "Freins arrière", vehicule: "Clio V", echeance: "50 000 km", urgence: "urgent" },
  { label: "Pneus avant", vehicule: "3008 GT", echeance: "2mm restants", urgence: "urgent" },
];
export default function EntretiensPreventifs() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Entretiens préventifs</h1></div>
      <div className="px-4 mt-4 space-y-2">{ALERTES.map(a => (
        <div key={a.label+a.vehicule} className={`rounded-xl bg-white border-2 p-4 ${a.urgence === "urgent" ? "border-red-300" : a.urgence === "bientot" ? "border-amber-300" : "border-green-300"}`}>
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{a.label}</h3>{a.urgence === "urgent" ? <AlertTriangle size={14} className="text-red-500" /> : a.urgence === "bientot" ? <Clock size={14} className="text-amber-500" /> : <Check size={14} className="text-green-600" />}</div>
          <p className="text-[10px] text-[#6B7280]">{a.vehicule} · {a.echeance}</p>
        </div>))}</div>
    </div>
  );
}
