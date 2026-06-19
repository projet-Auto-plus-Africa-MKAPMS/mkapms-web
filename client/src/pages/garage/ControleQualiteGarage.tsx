import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, X, User } from "lucide-react";
const CHECKLIST = [
  { label: "Travaux terminés", ok: true }, { label: "Niveaux vérifiés", ok: true },
  { label: "Freinage testé", ok: true }, { label: "Voyants éteints", ok: true },
  { label: "Propreté intérieure", ok: false }, { label: "Test route effectué", ok: false },
];
export default function ControleQualiteGarage() {
  const done = CHECKLIST.filter(c => c.ok).length;
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Contrôle qualité</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3"><div className="flex justify-between text-sm"><span className="font-bold">{done}/{CHECKLIST.length}</span></div><div className="mt-1.5 h-2 rounded-full bg-[#E5E7EB]"><div className="h-full rounded-full bg-[#D4AF37]" style={{width:`${(done/CHECKLIST.length)*100}%`}} /></div></div>
      <div className="px-4 mt-3 space-y-1.5">{CHECKLIST.map(c => (
        <div key={c.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">{c.ok ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-red-500" />}<span className="text-sm text-[#111]">{c.label}</span></div>))}</div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-4 space-y-2"><h3 className="text-sm font-bold text-[#111]">Validations</h3><div className="flex gap-2"><button className="flex-1 rounded-lg bg-[#F5F3EF] py-2 text-xs font-bold text-[#111]">Validation atelier ✓</button><button className="flex-1 rounded-lg bg-[#E5E7EB] py-2 text-xs font-bold text-red-500">Validation responsable</button></div></div>
    </div>
  );
}
