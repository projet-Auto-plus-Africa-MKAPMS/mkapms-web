import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Calendar, Check, Clock, AlertTriangle, FileText } from "lucide-react";
const HISTORIQUE = [
  { date: "15/01/2025", resultat: "Favorable", centre: "MKA.P-MS Paris", prochain: "15/01/2027" },
  { date: "10/01/2023", resultat: "Favorable", centre: "CT Express Lyon", prochain: "10/01/2025" },
];
export default function ControleTechnique() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-green-700 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Contrôle technique</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-green-50 border border-green-200 p-4 text-center"><Check size={24} className="mx-auto text-green-600" /><p className="text-base font-bold text-green-700 mt-1">CT valide</p><p className="text-xs text-green-600">Prochain: 15/01/2027</p></div>
      <div className="px-4 mt-4"><Link to="/garage/rendez-vous" className="block w-full rounded-xl bg-green-700 py-3 text-center text-sm font-bold text-white active:scale-[0.98]">Prendre rendez-vous CT</Link></div>
      <div className="px-4 mt-4"><h3 className="text-sm font-bold text-[#111] mb-2">Historique</h3>{HISTORIQUE.map(h => (
        <div key={h.date} className="rounded-xl bg-white border border-[#E5E7EB] p-3 mb-2 flex items-center gap-3">
          <Check size={14} className="text-green-600" /><div className="flex-1"><p className="text-sm text-[#111]">{h.date} — {h.resultat}</p><p className="text-[9px] text-[#6B7280]">{h.centre}</p></div>
        </div>))}</div>
    </div>
  );
}
