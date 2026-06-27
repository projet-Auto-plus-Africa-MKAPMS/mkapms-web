import { Link } from "react-router-dom";
import { ChevronLeft, Users, Star, Check, Clock } from "lucide-react";
const PARTENAIRES = [
  { nom: "Garage Express Montreuil", note: 4.8, satisfaction: "97%", delai: "2.1 jours" },
  { nom: "Auto Service Vincennes", note: 4.5, satisfaction: "94%", delai: "2.8 jours" },
  { nom: "Méca Pro Boulogne", note: 4.3, satisfaction: "91%", delai: "3.2 jours" },
];
export default function ReseauPartenaires() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Users size={20} className="text-[#D4AF37]" /> Réseau partenaires</h1></div>
      <div className="px-4 mt-4 space-y-2">{PARTENAIRES.map(p => (
        <div key={p.nom} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <h3 className="text-sm font-bold text-[#111]">{p.nom}</h3>
          <div className="mt-1.5 flex gap-3 text-[10px] text-[#6B7280]"><span className="flex items-center gap-0.5"><Star size={8} className="text-[#D4AF37]" /> {p.note}/5</span><span>{p.satisfaction}</span><span><Clock size={8} className="inline" /> {p.delai}</span></div>
        </div>))}</div>
    </div>
  );
}
