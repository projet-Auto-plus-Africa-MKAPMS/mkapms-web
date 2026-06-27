import { Link } from "react-router-dom";
import { ChevronLeft, User, Wrench, Clock, Star, BarChart3 } from "lucide-react";
const TECH = { nom: "Ahmed B.", fonction: "Chef mécanicien", stats: { reparations: 142, diagnostics: 85, tempsMoyen: "2h15", taux: 98, note: 4.9 } };
export default function FichesTechniciens() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage/mecaniciens" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Mécaniciens</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><User size={20} className="text-[#D4AF37]" /> {TECH.nom}</h1><p className="mt-1 text-sm text-white/60">{TECH.fonction}</p></div>
      <div className="px-4 -mt-3 relative z-10 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center"><p className="text-lg font-black text-[#D4AF37]">{TECH.stats.reparations}</p><p className="text-[8px] text-[#6B7280]">Réparations</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center"><p className="text-lg font-black text-[#D4AF37]">{TECH.stats.diagnostics}</p><p className="text-[8px] text-[#6B7280]">Diagnostics</p></div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center"><p className="text-lg font-black text-[#D4AF37]">{TECH.stats.note}</p><p className="text-[8px] text-[#6B7280]">Note /5</p></div>
      </div>
      <div className="px-4 mt-3 space-y-2">
        {[{l:"Temps moyen",v:TECH.stats.tempsMoyen},{l:"Taux réussite",v:TECH.stats.taux+"%"},{l:"Retours clients",v:"Excellent"}].map(s => (
          <div key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex justify-between"><span className="text-sm text-[#6B7280]">{s.l}</span><span className="text-sm font-bold text-[#111]">{s.v}</span></div>))}
      </div>
    </div>
  );
}
