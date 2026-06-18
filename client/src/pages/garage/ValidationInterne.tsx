import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, X, User } from "lucide-react";
const VALIDATIONS = [
  { role: "Mécanicien", nom: "Ahmed B.", valide: true, date: "15/03 16:30" },
  { role: "Chef atelier", nom: "Marc D.", valide: true, date: "15/03 17:00" },
  { role: "Responsable", nom: "Direction", valide: false, date: "" },
];
export default function ValidationInterne() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Validation interne</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-3">{VALIDATIONS.map(v => (
        <div key={v.role} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0">
          {v.valide ? <Check size={16} className="text-green-600" /> : <div className="h-4 w-4 rounded-full border-2 border-[#D4D4D4]" />}
          <div className="flex-1"><p className="text-sm font-bold text-[#111]">{v.role}</p><p className="text-[9px] text-[#6B7280]">{v.nom}{v.date && ` · ${v.date}`}</p></div>
          {!v.valide && <button className="rounded-lg bg-[#D4AF37] px-3 py-1 text-xs font-bold text-white">Valider</button>}
        </div>))}</div>
    </div>
  );
}
