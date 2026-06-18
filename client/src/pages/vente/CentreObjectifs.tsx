import { Link } from "react-router-dom";
import { ChevronLeft, Target, TrendingUp } from "lucide-react";
const OBJECTIFS = [
  { label: "Ventes ce mois", actuel: 8, objectif: 15, unite: "" },
  { label: "Chiffre d'affaires", actuel: 186000, objectif: 300000, unite: "€" },
  { label: "Véhicules achetés", actuel: 12, objectif: 20, unite: "" },
];
export default function CentreObjectifs() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Target size={20} /> Objectifs</h1></div>
      <div className="px-4 mt-4 space-y-3">{OBJECTIFS.map(o => { const pct = Math.round((o.actuel / o.objectif) * 100); return (
        <div key={o.label} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
          <div className="flex justify-between text-sm"><span className="font-bold text-[#111]">{o.label}</span><span className="font-black text-blue-700">{o.actuel.toLocaleString("fr-FR")}{o.unite} / {o.objectif.toLocaleString("fr-FR")}{o.unite}</span></div>
          <div className="mt-2 h-2.5 rounded-full bg-[#E5E7EB]"><div className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{width:`${Math.min(pct, 100)}%`}} /></div>
          <p className="text-right text-xs font-bold mt-1" style={{color: pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626"}}>{pct}%</p>
        </div>); })}</div>
    </div>
  );
}
