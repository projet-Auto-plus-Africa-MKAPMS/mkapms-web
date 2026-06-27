import { Link } from "react-router-dom";
import { ChevronLeft, Clock, Play, Pause, Square, Check } from "lucide-react";
const INTERVENTIONS = [
  { label: "Plaquettes avant", debut: "10:00", fin: "11:45", pause: "15 min", total: "1h30", statut: "termine" },
  { label: "Réparation direction", debut: "14:00", fin: "", pause: "", total: "1h15", statut: "en_cours" },
];
export default function TempsIntervention() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Clock size={20} className="text-[#D4AF37]" /> Temps d'intervention</h1></div>
      <div className="px-4 mt-4 space-y-2">{INTERVENTIONS.map(i => (
        <div key={i.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between"><h3 className="text-sm font-bold text-[#111]">{i.label}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${i.statut === "termine" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{i.statut === "termine" ? "Terminé" : "En cours"}</span></div>
          <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]"><div><p className="text-[#6B7280]">Début</p><p className="font-bold">{i.debut}</p></div><div><p className="text-[#6B7280]">Pause</p><p className="font-bold">{i.pause || "-"}</p></div><div><p className="text-[#6B7280]">Fin</p><p className="font-bold">{i.fin || "-"}</p></div><div><p className="text-[#6B7280]">Total</p><p className="font-bold text-[#D4AF37]">{i.total}</p></div></div>
          {i.statut === "en_cours" && <div className="mt-2 flex gap-2"><button className="flex-1 rounded-lg bg-amber-500 py-1.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Pause size={10} /> Pause</button><button className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-bold text-white flex items-center justify-center gap-1"><Square size={10} /> Fin</button></div>}
        </div>))}</div>
    </div>
  );
}
