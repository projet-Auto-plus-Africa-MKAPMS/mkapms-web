import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, Check, Clock, AlertTriangle } from "lucide-react";
const OUTILS = [
  { label: "Valise diagnostic Delphi", etat: "Disponible", user: null },
  { label: "Clé dynamométrique 40-200 Nm", etat: "Utilisé", user: "Ahmed B." },
  { label: "Pont mobile", etat: "Maintenance", user: null },
  { label: "Machine pneus", etat: "Disponible", user: null },
  { label: "Équilibreuse", etat: "Utilisé", user: "Jean D." },
]
export default function GestionOutillage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Outillage</h1></div>
      <div className="px-4 mt-4 space-y-2">{OUTILS.map(o => (
        <div key={o.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          {o.etat === "Disponible" ? <Check size={14} className="text-green-600" /> : o.etat === "Utilisé" ? <Clock size={14} className="text-amber-500" /> : <AlertTriangle size={14} className="text-red-500" />}
          <div className="flex-1"><h3 className="text-sm text-[#111]">{o.label}</h3>{o.user && <p className="text-[9px] text-[#6B7280]">{o.user}</p>}</div>
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${o.etat === "Disponible" ? "bg-green-50 text-green-600" : o.etat === "Utilisé" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"}`}>{o.etat}</span>
        </div>))}</div>
    </div>
  );
}
