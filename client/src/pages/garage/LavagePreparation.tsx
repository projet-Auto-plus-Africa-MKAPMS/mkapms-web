import { Link } from "react-router-dom";
import { ChevronLeft, Droplets, Check, ChevronRight } from "lucide-react";
const SERVICES = [
  { label: "Lavage extérieur", prix: "15 €", duree: "30 min" },
  { label: "Lavage intérieur", prix: "25 €", duree: "45 min" },
  { label: "Lavage complet", prix: "35 €", duree: "1h" },
  { label: "Préparation vente", prix: "89 €", duree: "3h" },
  { label: "Préparation livraison", prix: "59 €", duree: "2h" },
  { label: "Polissage + lustrage", prix: "120 €", duree: "4h" },
];
export default function LavagePreparation() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-cyan-700 px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Droplets size={20} /> Lavage & Préparation</h1></div>
      <div className="px-4 mt-4 space-y-2">{SERVICES.map(s => (
        <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3">
          <div className="flex-1"><h3 className="text-sm font-bold text-[#111]">{s.label}</h3><p className="text-[10px] text-[#6B7280]">{s.duree}</p></div>
          <span className="text-sm font-bold text-cyan-700">{s.prix}</span><ChevronRight size={14} className="text-[#D4D4D4]" />
        </div>))}</div>
    </div>
  );
}
