import { Link } from "react-router-dom";
import { ChevronLeft, Search, AlertCircle, Clock, Home, ArrowRight } from "lucide-react";
const DEFAUTS = [
  { label: "Plaquettes avant usées à 80%", priorite: "Haute", recommandation: "Remplacement immédiat" },
  { label: "Filtre habitacle encrassé", priorite: "Moyenne", recommandation: "Remplacement conseillé" },
  { label: "Fuite légère boîte de direction", priorite: "Haute", recommandation: "Réparation nécessaire" },
  { label: "Pneu avant droit — 2mm", priorite: "Haute", recommandation: "Remplacement obligatoire" },
];
export default function DiagnosticGarage() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-5 pb-4"><Link to="/garage" className="flex items-center gap-1 text-xs text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-lg font-black text-white flex items-center gap-2"><Search size={19} className="text-[#D4AF37]" /> Diagnostic</h1><p className="mt-1 text-xs text-white/60">Peugeot 3008 GT — AB-123-CD</p></div>
      <div className="mx-4 mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 flex items-center gap-2"><Clock size={14} className="text-amber-600" /><span className="text-xs font-bold text-amber-700">Diagnostic en cours</span></div>
      <div className="px-4 mt-2.5 space-y-1.5">{DEFAUTS.map(d => (
        <div key={d.label} className={`rounded-xl bg-white border px-3 py-3 ${d.priorite === "Haute" ? "border-red-200" : "border-[#E5E7EB]"}`}>
          <div className="flex items-center gap-2"><AlertCircle size={14} className={d.priorite === "Haute" ? "text-red-500" : "text-amber-500"} /><h3 className="text-[13px] leading-5 font-bold text-[#111]">{d.label}</h3></div>
          <div className="mt-1 flex items-center gap-2 text-[10px]"><span className={`rounded-full px-2 py-0.5 font-bold ${d.priorite === "Haute" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{d.priorite}</span><span className="text-[#6B7280]">{d.recommandation}</span></div>
        </div>))}</div>
      <div className="mx-4 mt-3 rounded-xl border border-[#B7E3E8] bg-gradient-to-br from-[#EAF8FA] to-white p-3 shadow-sm">
        <Link to="/devis?estimation=1&service=mecanicien-domicile" className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B6B8F] text-white"><Home size={17} /></span>
          <span className="min-w-0 flex-1"><span className="block text-xs font-black text-[#102A43]">Mécanicien à domicile</span><span className="block mt-0.5 text-[10px] leading-4 text-[#64748B]">Demandez une estimation pour une intervention sur place.</span></span>
          <ArrowRight size={16} className="shrink-0 text-[#0B6B8F]" />
        </Link>
      </div>
    </div>
  );
}
