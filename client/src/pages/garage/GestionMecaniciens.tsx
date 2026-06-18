import { Link } from "react-router-dom";
import { ChevronLeft, Users, Wrench, Clock, Star, ChevronRight } from "lucide-react";
const MECANICIENS = [
  { nom: "Ahmed B.", fonction: "Chef mécanicien", competences: ["Mécanique", "Diagnostic", "Électronique"], heures: 38, interventions: 12 },
  { nom: "Paul M.", fonction: "Carrossier", competences: ["Carrosserie", "Peinture", "Débosselage"], heures: 35, interventions: 8 },
  { nom: "Jean D.", fonction: "Mécanicien", competences: ["Mécanique", "Pneumatiques", "Freinage"], heures: 40, interventions: 15 },
];
export default function GestionMecaniciens() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Mécaniciens</h1></div>
      <div className="px-4 mt-4 space-y-2">{MECANICIENS.map(m => (
        <div key={m.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-full bg-[#D4AF37] flex items-center justify-center text-sm font-bold text-white">{m.nom[0]}</div><div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{m.nom}</h3><p className="text-[10px] text-[#6B7280]">{m.fonction}</p></div></div>
          <div className="mt-2 flex flex-wrap gap-1">{m.competences.map(c => (<span key={c} className="rounded-full bg-[#D4AF37]/10 px-2 py-0.5 text-[8px] font-semibold text-[#D4AF37]">{c}</span>))}</div>
          <div className="mt-2 flex gap-3 text-[10px] text-[#6B7280]"><span>{m.heures}h/sem</span><span>{m.interventions} interventions</span></div>
        </div>))}</div>
    </div>
  );
}
