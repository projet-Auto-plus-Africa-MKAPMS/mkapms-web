import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, X, User } from "lucide-react";
const CHECKLIST = [
  { label: "Travaux conformes", ok: true }, { label: "Niveaux vérifiés", ok: true },
  { label: "Test freinage", ok: true }, { label: "Test route", ok: true },
  { label: "Voyants éteints", ok: true }, { label: "Propreté", ok: true },
];
const VALIDATIONS = [
  { role: "Mécanicien", nom: "Ahmed B.", valide: true, date: "15/03 16:30" },
  { role: "Responsable atelier", nom: "Marc D.", valide: false, date: "" },
];
export default function ControleQualitePremium() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> CQ Premium</h1><p className="mt-1 text-sm text-white/60">Double validation obligatoire</p></div>
      <div className="px-4 mt-4 space-y-1.5">{CHECKLIST.map(c => (<div key={c.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">{c.ok ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-red-500" />}<span className="text-sm text-[#111]">{c.label}</span></div>))}</div>
      <div className="mx-4 mt-3 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2"><h3 className="text-sm font-bold text-[#111]">Validations obligatoires</h3>{VALIDATIONS.map(v => (
        <div key={v.role} className="flex items-center gap-3 py-2 border-b border-[#F3F4F6] last:border-0">{v.valide ? <Check size={14} className="text-green-600" /> : <div className="h-4 w-4 rounded-full border-2 border-[#D4D4D4]" />}<div className="flex-1"><p className="text-sm font-semibold text-[#111]">{v.role} — {v.nom}</p>{v.date && <p className="text-[9px] text-[#6B7280]">{v.date}</p>}</div>{!v.valide && <button className="rounded-lg bg-[#D4AF37] px-3 py-1 text-xs font-bold text-white">Valider</button>}</div>))}</div>
    </div>
  );
}
