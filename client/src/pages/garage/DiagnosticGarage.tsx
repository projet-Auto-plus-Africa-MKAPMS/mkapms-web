import { Link } from "react-router-dom";
import { ChevronLeft, Search, AlertCircle, Clock, Home, ArrowRight, ShieldCheck, Wrench } from "lucide-react";
const DEFAUTS = [
  { label: "Plaquettes avant usées à 80%", priorite: "Haute", recommandation: "Remplacement immédiat" },
  { label: "Filtre habitacle encrassé", priorite: "Moyenne", recommandation: "Remplacement conseillé" },
  { label: "Fuite légère boîte de direction", priorite: "Haute", recommandation: "Réparation nécessaire" },
  { label: "Pneu avant droit — 2mm", priorite: "Haute", recommandation: "Remplacement obligatoire" },
];
export default function DiagnosticGarage() {
  return <div className="min-h-screen bg-[#F5F3EF] pb-24 text-[#102A43]">
    <header className="relative overflow-hidden bg-gradient-to-br from-[#102A43] via-[#123E56] to-[#0B6B8F] px-4 pb-7 pt-5 text-white">
      <Link to="/garage" className="relative flex items-center gap-1 text-sm text-white/75"><ChevronLeft size={17}/> Garage</Link>
      <div className="relative mt-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#D4AF37] text-[#102A43]"><Search size={22}/></span><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F4D35E]">Contrôle automobile</p><h1 className="text-2xl font-black">Diagnostic</h1></div></div>
      <p className="relative mt-3 text-sm text-white/75">Peugeot 3008 GT — AB-123-CD</p>
    </header>
    <main className="mx-auto max-w-3xl px-4">
      <div className="-mt-3 rounded-2xl border border-[#F5D66B] bg-[#FFF9E8] p-4 shadow-sm"><div className="flex items-center gap-3"><Clock size={20} className="text-[#C27A00]"/><div><p className="font-extrabold text-[#A65B00]">Diagnostic en cours</p><p className="mt-0.5 text-xs text-[#8A5A20]">Les résultats sont présentés par niveau de priorité.</p></div></div></div>
      <section className="mt-5 space-y-3">{DEFAUTS.map((d) => <article key={d.label} className={`rounded-2xl border bg-white p-4 shadow-sm ${d.priorite === "Haute" ? "border-[#F7B4B4]" : "border-[#DCE6EE]"}`}><div className="flex items-start gap-3"><AlertCircle size={19} className={d.priorite === "Haute" ? "mt-0.5 shrink-0 text-[#DC2626]" : "mt-0.5 shrink-0 text-[#D97706]"}/><div className="min-w-0 flex-1"><h2 className="text-base font-extrabold leading-6 text-[#102A43]">{d.label}</h2><div className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-extrabold ${d.priorite === "Haute" ? "bg-[#FFF0F0] text-[#C62828]" : "bg-[#FFF7E0] text-[#B66A00]"}`}>{d.priorite}</span><span className="text-sm text-[#64748B]">{d.recommandation}</span></div></div></div></article>)}</section>
      <section className="mt-5 rounded-2xl border border-[#B7E3E8] bg-gradient-to-br from-[#EAF8FA] to-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B6B8F] text-white"><Home size={21}/></span><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0B6B8F]">Intervention sur place</p><h2 className="mt-1 text-base font-black text-[#102A43]">Mécanicien à domicile</h2><p className="mt-1 text-sm leading-5 text-[#64748B]">Demandez une estimation pour faire contrôler ou réparer votre véhicule directement chez vous.</p><Link to="/devis?estimation=1&service=mecanicien-domicile" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0B6B8F] px-4 py-3 text-sm font-extrabold text-white">Voir l’estimation <ArrowRight size={16}/></Link></div></div></section>
      <div className="mt-4 rounded-2xl border border-[#DCE6EE] bg-white p-4 text-sm text-[#64748B] shadow-sm"><div className="flex items-center gap-2 font-bold text-[#102A43]"><ShieldCheck size={18} className="text-[#0B6B8F}"/> Conseils MKA.P-MS</div><p className="mt-2">Un diagnostic permet de prioriser les interventions et de comparer les solutions adaptées à votre véhicule.</p><Link to="/devis?estimation=1&service=diagnostics" className="mt-3 inline-flex items-center gap-2 font-bold text-[#0B6B8F]">Comparer les prix <ArrowRight size={15}/></Link></div>
    </main>
  </div>;
}
