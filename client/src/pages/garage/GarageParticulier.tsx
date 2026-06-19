import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, Check, ChevronRight, Calendar, Euro, Clock } from "lucide-react";

const SERVICES = [
  { label: "Révision complète", prix: "À partir de 189 €", delai: "2-3h" },
  { label: "Vidange + filtre", prix: "À partir de 79 €", delai: "1h" },
  { label: "Freinage (plaquettes + disques)", prix: "À partir de 149 €", delai: "2h" },
  { label: "Distribution", prix: "À partir de 490 €", delai: "4-6h" },
  { label: "Embrayage", prix: "À partir de 590 €", delai: "6-8h" },
  { label: "Climatisation (recharge)", prix: "À partir de 69 €", delai: "30 min" },
  { label: "Diagnostic électronique", prix: "À partir de 49 €", delai: "30 min" },
  { label: "Pneumatiques", prix: "Selon dimensions", delai: "1h" },
  { label: "Contrôle technique", prix: "À partir de 65 €", delai: "45 min" },
];

export default function GarageParticulier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} className="text-[#D4AF37]" /> Garage Particulier</h1>
        <p className="mt-1 text-sm text-white/60">Entretien et réparation pour particuliers</p>
      </div>
      <div className="px-4 mt-4 space-y-2">{SERVICES.map((s) => (
        <Link key={s.label} to="/garage/devis" className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-4 active:scale-[0.99] transition">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#111]">{s.label}</h3>
            <div className="mt-1 flex gap-3 text-[10px] text-[#6B7280]"><span className="flex items-center gap-0.5"><Euro size={8} /> {s.prix}</span><span className="flex items-center gap-0.5"><Clock size={8} /> {s.delai}</span></div>
          </div>
          <ChevronRight size={16} className="text-red-500" />
        </Link>
      ))}</div>
      <div className="px-4 mt-4">
        <Link to="/garage/rendez-vous" className="block w-full rounded-xl bg-[#D4AF37] py-3 text-center text-sm font-bold text-white active:scale-[0.98]">Prendre rendez-vous</Link>
      </div>
    </div>
  );
}
