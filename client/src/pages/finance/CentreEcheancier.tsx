import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, Check, Clock, AlertTriangle } from "lucide-react";
const ECHEANCES = [
  { date: "15/04/2025", montant: "350 €", type: "LOA", statut: "a_venir" },
  { date: "15/03/2025", montant: "350 €", type: "LOA", statut: "paye" },
  { date: "01/03/2025", montant: "5 000 €", type: "Fractionné 3/5", statut: "paye" },
  { date: "01/02/2025", montant: "5 000 €", type: "Fractionné 2/5", statut: "retard" },
];
export default function CentreEcheancier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/finance" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Finance</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Échéancier</h1></div>
      <div className="px-4 mt-4 space-y-2">{ECHEANCES.map(e => (
        <div key={e.date+e.type} className={`rounded-xl bg-white border-2 p-3 flex items-center gap-3 ${e.statut === "retard" ? "border-red-300" : "border-[#E5E7EB]"}`}>
          {e.statut === "paye" ? <Check size={14} className="text-green-600" /> : e.statut === "retard" ? <AlertTriangle size={14} className="text-red-500" /> : <Clock size={14} className="text-amber-500" />}
          <div className="flex-1"><h3 className="text-sm text-[#111]">{e.type}</h3><p className="text-[9px] text-[#6B7280]">{e.date}</p></div><span className="text-sm font-bold">{e.montant}</span></div>))}</div>
    </div>
  );
}
