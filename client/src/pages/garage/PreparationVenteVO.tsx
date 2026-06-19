import { Link } from "react-router-dom";
import { ChevronLeft, Check, X, Camera, Shield } from "lucide-react";
const CHECKLIST = [
  { label: "Lavage extérieur", ok: true }, { label: "Aspirateur intérieur", ok: true },
  { label: "Plastiques traités", ok: true }, { label: "Photos prises (8 zones)", ok: false },
  { label: "Contrôle final", ok: false },
];
export default function PreparationVenteVO() {
  const done = CHECKLIST.filter(c => c.ok).length;
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5"><Link to="/garage" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Garage</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Préparation vente VO</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3"><div className="flex justify-between text-sm"><span className="font-bold">{done}/{CHECKLIST.length}</span><span className="text-[#6B7280]">{done < CHECKLIST.length ? "En cours" : "Prêt"}</span></div><div className="mt-1.5 h-2 rounded-full bg-[#E5E7EB]"><div className="h-full rounded-full bg-[#D4AF37]" style={{width:`${(done/CHECKLIST.length)*100}%`}} /></div></div>
      <div className="px-4 mt-3 space-y-1.5">{CHECKLIST.map(c => (
        <div key={c.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">{c.ok ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-red-500" />}<span className="text-sm text-[#111]">{c.label}</span></div>))}</div>
      <div className="px-4 mt-3"><button className="w-full rounded-xl bg-[#D4AF37] py-3 text-sm font-bold text-white" disabled={done < CHECKLIST.length}>{done < CHECKLIST.length ? "Checklist incomplète" : "Valider publication"}</button></div>
    </div>
  );
}
