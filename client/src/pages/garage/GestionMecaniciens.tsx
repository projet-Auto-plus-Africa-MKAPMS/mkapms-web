import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Users, ChevronDown, Phone, Mail } from "lucide-react";
const MECANICIENS = [
  { id: 1, nom: "Ahmed B.", fonction: "Chef mecanicien", competences: ["Mecanique", "Diagnostic", "Electronique"], heures: 38, interventions: 12, tel: "06 12 34 56 78", email: "ahmed@garage.fr", perf: 94 },
  { id: 2, nom: "Paul M.", fonction: "Carrossier", competences: ["Carrosserie", "Peinture", "Debosselage"], heures: 35, interventions: 8, tel: "06 98 76 54 32", email: "paul@garage.fr", perf: 87 },
  { id: 3, nom: "Jean D.", fonction: "Mecanicien", competences: ["Mecanique", "Pneumatiques", "Freinage"], heures: 40, interventions: 15, tel: "06 55 44 33 22", email: "jean@garage.fr", perf: 91 },
  { id: 4, nom: "Sophie K.", fonction: "Receptionniste", competences: ["Accueil", "Devis", "Facturation"], heures: 35, interventions: 0, tel: "06 11 22 33 44", email: "sophie@garage.fr", perf: 95 },
];
export default function GestionMecaniciens() {
  const [expanded, setExpanded] = useState<number | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Mecaniciens</h1></div>
      <div className="px-4 mt-4 grid grid-cols-2 gap-2">
        {[
          { l: "Equipe", v: "4", c: "text-[#D4AF37]" },
          { l: "Perf. moyenne", v: "92%", c: "text-green-500" },
        ].map(s => (<button key={s.l} className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-center active:scale-[0.97]"><p className={`text-lg font-black ${s.c}`}>{s.v}</p><p className="text-[9px] text-[#6B7280]">{s.l}</p></button>))}
      </div>
      <div className="px-4 mt-3 space-y-2">{MECANICIENS.map(m => {
        const isExp = expanded === m.id;
        return (
          <div key={m.id} className="rounded-xl bg-white border border-[#E5E7EB] overflow-hidden">
            <button onClick={() => setExpanded(isExp ? null : m.id)} className="w-full text-left p-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-[#D4AF37] flex items-center justify-center text-sm font-bold text-white shrink-0">{m.nom[0]}</div>
              <div className="flex-1 min-w-0"><h3 className="text-sm font-bold text-[#111]">{m.nom}</h3><p className="text-[9px] text-[#6B7280]">{m.fonction}</p></div>
              <span className="text-xs font-black text-green-600">{m.perf}%</span>
              <ChevronDown size={12} className={`text-[#9CA3AF] transition ${isExp ? "rotate-180" : ""}`} />
            </button>
            {isExp && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB] pt-2">
                <div className="flex flex-wrap gap-1 mb-2">{m.competences.map(c => (<span key={c} className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[8px] font-semibold text-[#D4AF37]">{c}</span>))}</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Heures/sem</span><p className="font-bold text-[#111]">{m.heures}h</p></div>
                  <div className="rounded-lg bg-[#F5F3EF] p-2"><span className="text-[#6B7280]">Interventions</span><p className="font-bold text-[#111]">{m.interventions}</p></div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="flex-1 rounded-lg bg-blue-500 py-1.5 text-[9px] font-bold text-white flex items-center justify-center gap-1"><Phone size={10} /> Appeler</button>
                  <button className="flex-1 rounded-lg bg-[#111] py-1.5 text-[9px] font-bold text-[#D4AF37] flex items-center justify-center gap-1"><Mail size={10} /> Email</button>
                </div>
              </div>
            )}
          </div>
        );
      })}</div>
    </div>
  );
}
