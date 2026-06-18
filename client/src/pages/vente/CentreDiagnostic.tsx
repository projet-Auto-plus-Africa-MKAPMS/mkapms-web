import { Link } from "react-router-dom";
import { ChevronLeft, Wrench, AlertCircle, Check, Clock } from "lucide-react";
const DEFAUTS = [
  { label: "Plaquettes avant usées", priorite: "Haute", cout: 180, statut: "termine" },
  { label: "Pneu arrière gauche", priorite: "Haute", cout: 120, statut: "en_cours" },
  { label: "Rayure portière droite", priorite: "Moyenne", cout: 350, statut: "a_faire" },
  { label: "Filtre habitacle", priorite: "Basse", cout: 45, statut: "a_faire" },
];
export default function CentreDiagnostic() {
  const total = DEFAUTS.reduce((s, d) => s + d.cout, 0);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/stock" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Stock</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Wrench size={20} /> Centre Diagnostic</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3 flex justify-between"><span className="text-sm font-bold text-[#111]">Estimation totale</span><span className="text-lg font-black text-blue-800">{total} €</span></div>
      <div className="px-4 mt-3 space-y-2">{DEFAUTS.map((d) => (
        <div key={d.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          {d.statut === "termine" ? <Check size={14} className="text-green-600" /> : d.statut === "en_cours" ? <Clock size={14} className="text-amber-500" /> : <AlertCircle size={14} className="text-red-500" />}
          <div className="flex-1"><p className="text-sm text-[#111]">{d.label}</p><p className="text-[9px] text-[#6B7280]">Priorité: {d.priorite}</p></div>
          <span className="text-sm font-bold text-blue-800">{d.cout} €</span>
        </div>))}</div>
    </div>
  );
}
