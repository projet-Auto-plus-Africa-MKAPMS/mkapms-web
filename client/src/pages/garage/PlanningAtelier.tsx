import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, ChevronDown, Clock, User, Wrench } from "lucide-react";
const RDV = [
  { id: 1, heure: "08:00", vehicule: "3008 GT", client: "Marie L.", intervention: "Revision", mecanicien: "Ahmed B.", duree: "1h30", statut: "en_cours" },
  { id: 2, heure: "09:30", vehicule: "BMW 320d", client: "Jean D.", intervention: "Freinage", mecanicien: "Paul M.", duree: "2h", statut: "planifie" },
  { id: 3, heure: "11:00", vehicule: "Clio V", client: "SAS Auto+", intervention: "Distribution", mecanicien: "Ahmed B.", duree: "3h", statut: "planifie" },
  { id: 4, heure: "14:00", vehicule: "Classe E", client: "Pierre L.", intervention: "Diagnostic", mecanicien: "Jean D.", duree: "1h", statut: "planifie" },
  { id: 5, heure: "15:30", vehicule: "Golf 8", client: "Sophie K.", intervention: "Vidange", mecanicien: "Paul M.", duree: "45min", statut: "planifie" },
];
export default function PlanningAtelier() {
  const [vue, setVue] = useState<"jour"|"semaine"|"mois">("jour");
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Planning atelier</h1></div>
      <div className="px-4 mt-4 flex gap-2">{(["jour","semaine","mois"] as const).map(v => (<button key={v} onClick={() => setVue(v)} className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize ${vue === v ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>{v}</button>))}</div>
      <div className="px-4 mt-3 grid grid-cols-2 gap-2 mb-3">
        {[
          { l: "RDV aujourd'hui", v: "5", c: "text-[#D4AF37]" },
          { l: "En cours", v: "1", c: "text-green-500" },
        ].map(s => (<button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]"><p className={`text-lg font-black ${s.c}`}>{s.v}</p><p className="text-[9px] text-[#6B7280]">{s.l}</p></button>))}
      </div>
      <div className="px-4 space-y-2">{RDV.map(r => {
        const isExp = expanded === r.id;
        return (
          <div key={r.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <button onClick={() => setExpanded(isExp ? null : r.id)} className="w-full text-left p-3 flex items-center gap-3">
              <span className="text-sm font-black text-[#D4AF37] w-12">{r.heure}</span>
              <div className="flex-1 min-w-0"><h3 className="text-sm font-bold text-[#111] truncate">{r.vehicule} — {r.intervention}</h3><p className="text-[9px] text-[#6B7280]">{r.client}</p></div>
              <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold ${r.statut === "en_cours" ? "bg-green-50 text-green-700" : "bg-slate-50 text-slate-500"}`}>{r.statut === "en_cours" ? "En cours" : "Planifie"}</span>
              <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
            </button>
            {isExp && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><User size={10} className="text-[#D4AF37]" /><div><span className="text-[#6B7280]">Mecanicien</span><p className="font-bold text-[#111]">{r.mecanicien}</p></div></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2 flex items-center gap-1"><Clock size={10} className="text-[#D4AF37]" /><div><span className="text-[#6B7280]">Duree</span><p className="font-bold text-[#111]">{r.duree}</p></div></div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 rounded-lg bg-[#D4AF37] py-1.5 text-[9px] font-bold text-white">Commencer</button>
                  <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37]">Reporter</button>
                </div>
              </div>
            )}
          </div>
        );
      })}</div>
    </div>
  );
}
