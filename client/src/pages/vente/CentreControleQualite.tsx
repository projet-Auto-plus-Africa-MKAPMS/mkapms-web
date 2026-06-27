import { Link } from "react-router-dom";
import { ChevronLeft, Shield, Check, X, Camera, FileText, History } from "lucide-react";
const CHECKLIST = [
  { label: "Photos complètes (8 min)", ok: true }, { label: "Documents véhicule", ok: true },
  { label: "Historique vérifié", ok: true }, { label: "CT valide", ok: true },
  { label: "Carte grise à jour", ok: false }, { label: "TVA conforme", ok: true },
  { label: "KBIS valide", ok: true },
];
export default function CentreControleQualite() {
  const done = CHECKLIST.filter(c => c.ok).length;
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-blue-800 px-4 pt-6 pb-5"><Link to="/vente/tableau-de-bord-pro" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dashboard</Link><h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} /> Contrôle Qualité & Conformité</h1></div>
      <div className="mx-4 mt-4 rounded-xl bg-white border border-[#E5E7EB] p-3 flex justify-between"><span className="text-sm font-bold">{done}/{CHECKLIST.length} validés</span><div className="h-2 flex-1 ml-3 rounded-full bg-[#E5E7EB] self-center"><div className="h-full rounded-full bg-blue-600" style={{width:`${(done/CHECKLIST.length)*100}%`}} /></div></div>
      <div className="px-4 mt-3 space-y-1.5">{CHECKLIST.map(c => (
        <div key={c.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
          {c.ok ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-red-500" />}
          <span className={`text-sm ${c.ok ? "text-[#111]" : "text-red-600 font-semibold"}`}>{c.label}</span>
        </div>))}</div>
      <div className="px-4 mt-4"><button className={`w-full rounded-xl py-3 text-sm font-bold text-white ${done === CHECKLIST.length ? "bg-green-600" : "bg-[#D4D4D4]"}`} disabled={done !== CHECKLIST.length}>{done === CHECKLIST.length ? "Publier l'annonce" : "Complétez tous les points"}</button></div>
    </div>
  );
}
