import { Link } from "react-router-dom";
import { ChevronLeft, Euro, TrendingUp } from "lucide-react";
const DONNEES = [
  { label: "Chiffre d'affaires", value: "42 500 €", color: "text-[#D4AF37]" },
  { label: "Main-d'œuvre", value: "18 200 €", color: "text-blue-600" },
  { label: "Pièces", value: "15 800 €", color: "text-orange-600" },
  { label: "Autres charges", value: "3 500 €", color: "text-[#6B7280]" },
  { label: "Bénéfice net", value: "5 000 €", color: "text-green-600" },
];
export default function RentabiliteAtelier() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><TrendingUp size={20} className="text-[#D4AF37]" /> Rentabilité atelier</h1><p className="mt-1 text-sm text-white/60">Mars 2025</p></div>
      <div className="px-4 mt-4 space-y-2">{DONNEES.map(d => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex justify-between"><span className="text-sm text-[#6B7280]">{d.label}</span><span className={`text-base font-black ${d.color}`}>{d.value}</span></div>))}</div>
    </div>
  );
}
