import { Link } from "react-router-dom";
import { ChevronLeft, BarChart3, TrendingUp, Clock, Star, Euro } from "lucide-react";
const STATS = [
  { label: "Véhicules traités", value: "142", icon: BarChart3, color: "text-[#D4AF37]" },
  { label: "Chiffre d'affaires", value: "42 500 €", icon: Euro, color: "text-green-600" },
  { label: "Temps moyen réparation", value: "2h45", icon: Clock, color: "text-blue-600" },
  { label: "Rentabilité", value: "12%", icon: TrendingUp, color: "text-purple-600" },
  { label: "Satisfaction clients", value: "4.8/5", icon: Star, color: "text-[#D4AF37]" },
];
export default function StatistiquesGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><BarChart3 size={20} className="text-[#D4AF37]" /> Statistiques garage</h1><p className="mt-1 text-sm text-white/60">Mars 2025</p></div>
      <div className="px-4 mt-4 space-y-2">{STATS.map(s => { const Icon = s.icon; return (
        <div key={s.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4 flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]"><Icon size={16} className={s.color} /></div><div className="flex-1"><p className="text-xs text-[#6B7280]">{s.label}</p><p className={`text-lg font-black ${s.color}`}>{s.value}</p></div></div>); })}</div>
    </div>
  );
}
