import { Link } from "react-router-dom";
import { ChevronLeft, Search, AlertCircle, Check, Clock, Camera } from "lucide-react";
const DEFAUTS = [
  { label: "Plaquettes avant usées à 80%", priorite: "Haute", recommandation: "Remplacement immédiat" },
  { label: "Filtre habitacle encrassé", priorite: "Moyenne", recommandation: "Remplacement conseillé" },
  { label: "Fuite légère boîte de direction", priorite: "Haute", recommandation: "Réparation nécessaire" },
  { label: "Pneu avant droit — 2mm", priorite: "Haute", recommandation: "Remplacement obligatoire" },
];
export default function DiagnosticGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Search size={20} className="text-[#D4AF37]" /> Diagnostic</h1><p className="mt-1 text-sm text-white/60">Peugeot 3008 GT — AB-123-CD</p></div>
      <div className="mx-4 mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-center gap-2"><Clock size={14} className="text-amber-600" /><span className="text-sm font-bold text-amber-700">Diagnostic en cours</span></div>
      <div className="px-4 mt-3 space-y-2">{DEFAUTS.map(d => (
        <div key={d.label} className={`rounded-xl bg-white border p-4 ${d.priorite === "Haute" ? "border-red-200" : "border-[#E5E7EB]"}`}>
          <div className="flex items-center gap-2"><AlertCircle size={14} className={d.priorite === "Haute" ? "text-red-500" : "text-amber-500"} /><h3 className="text-sm font-bold text-[#111]">{d.label}</h3></div>
          <div className="mt-1 flex gap-2 text-[10px]"><span className={`rounded-full px-2 py-0.5 font-bold ${d.priorite === "Haute" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{d.priorite}</span><span className="text-[#6B7280]">{d.recommandation}</span></div>
        </div>))}</div>
    </div>
  );
}
