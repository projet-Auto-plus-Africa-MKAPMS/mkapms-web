import { Link } from "react-router-dom";
import { ChevronLeft, Check, Clock, FileText, Send } from "lucide-react";
const ETAPES = [
  { label: "Dossier reçu", fait: true, date: "15/03 10:00" },
  { label: "En traitement", fait: true, date: "15/03 14:00" },
  { label: "Validation", fait: false, date: "" },
  { label: "Finalisé", fait: false, date: "" },
];
export default function SuiviDossier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><FileText size={20} className="text-[#D4AF37]" /> Suivi dossier</h1><p className="mt-1 text-sm text-white/60">DOS-2025-0142</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4">{ETAPES.map((e, i) => (
        <div key={i} className="flex items-start gap-3"><div className="flex flex-col items-center"><div className={`h-8 w-8 rounded-full flex items-center justify-center ${e.fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`}>{e.fait ? <Check size={12} className="text-white" /> : <Clock size={12} className="text-red-500" />}</div>{i < ETAPES.length - 1 && <div className={`w-0.5 h-6 ${e.fait ? "bg-[#D4AF37]" : "bg-[#E5E7EB]"}`} />}</div><div className="pb-3"><p className={`text-sm ${e.fait ? "font-bold text-[#111]" : "text-red-500"}`}>{e.label}</p>{e.date && <p className="text-[9px] text-red-500">{e.date}</p>}</div></div>))}</div>
    </div>
  );
}
