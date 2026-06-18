import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Calendar, ChevronRight as CR } from "lucide-react";
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const RDV = [
  { heure: "08:00", vehicule: "3008 GT", client: "Marie L.", intervention: "Révision", mecanicien: "Ahmed B." },
  { heure: "09:30", vehicule: "BMW 320d", client: "Jean D.", intervention: "Freinage", mecanicien: "Paul M." },
  { heure: "11:00", vehicule: "Clio V", client: "SAS Auto+", intervention: "Distribution", mecanicien: "Ahmed B." },
  { heure: "14:00", vehicule: "Classe E", client: "Pierre L.", intervention: "Diagnostic", mecanicien: "Jean D." },
];
export default function PlanningAtelier() {
  const [vue, setVue] = useState<"jour"|"semaine"|"mois">("jour");
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Calendar size={20} className="text-[#D4AF37]" /> Planning atelier</h1></div>
      <div className="px-4 mt-4 flex gap-2">{(["jour","semaine","mois"] as const).map(v => (<button key={v} onClick={() => setVue(v)} className={`flex-1 rounded-lg py-2 text-xs font-bold capitalize ${vue === v ? "bg-[#D4AF37] text-white" : "bg-white border border-[#E5E7EB] text-[#6B7280]"}`}>{v}</button>))}</div>
      <div className="px-4 mt-3 space-y-1.5">{RDV.map(r => (
        <div key={r.heure} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          <span className="text-sm font-black text-[#D4AF37] w-12">{r.heure}</span>
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{r.vehicule} — {r.intervention}</h3><p className="text-[9px] text-[#6B7280]">{r.client} · {r.mecanicien}</p></div>
        </div>))}</div>
    </div>
  );
}
