import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, FileText, Check, Clock } from "lucide-react";
const STATS = [{ label: "Dossiers ouverts", value: "3" }, { label: "Dossiers terminés", value: "12" }, { label: "Délai moyen", value: "3,2 jours" }, { label: "Paiements", value: "2 845 €" }];
export default function StatistiquesDemarches() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/demarches" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Démarches</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Statistiques</h1></div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">{STATS.map(s => (<div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 text-center"><p className="text-lg font-black text-[#D4AF37]">{s.value}</p><p className="text-[9px] text-[#6B7280]">{s.label}</p></div>))}</div>
    </div>
  );
}
