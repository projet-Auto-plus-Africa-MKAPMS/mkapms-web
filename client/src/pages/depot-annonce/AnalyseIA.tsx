import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Bot, Check, AlertTriangle, Shield, Star, Award } from "lucide-react";
const CHECKS = [
  { label: "Cohérence du prix", status: "ok", detail: "Prix dans la fourchette du marché" },
  { label: "Qualité des photos", status: "ok", detail: "15/18 photos ajoutées, bonne qualité" },
  { label: "Documents vérifiés", status: "ok", detail: "Carte grise et CT conformes" },
  { label: "Détection doublons", status: "ok", detail: "Aucun doublon détecté" },
  { label: "Détection fraude", status: "ok", detail: "Aucune anomalie détectée" },
  { label: "Description analysée", status: "warning", detail: "Ajouter historique entretien recommandé" },
];
const BADGES_AUTO = [
  { badge: "PRO", color: "#3B82F6", active: true },
  { badge: "VÉRIFIÉ", color: "#10B981", active: true },
  { badge: "PREMIUM", color: "#D4AF37", active: false },
];
export default function AnalyseIA() {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => { const t = setInterval(() => setProgress(p => { if (p >= 100) { setDone(true); clearInterval(t); return 100; } return p + 5; }), 100); return () => clearInterval(t); }, []);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/options-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Options</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Bot size={20} className="text-[#D4AF37]" /> Analyse IA</h1>
      </div>
      {!done && <div className="px-4 mt-4"><div className="rounded-xl bg-white border border-[#E5E7EB] p-6 text-center shadow-sm"><Bot size={32} className="text-[#D4AF37] mx-auto mb-3 animate-pulse" /><p className="text-sm font-bold text-[#111] mb-2">Analyse en cours...</p><div className="w-full bg-[#E5E7EB] rounded-full h-2 mb-1"><div className="h-2 rounded-full bg-[#D4AF37] transition-all" style={{ width: `${progress}%` }} /></div><p className="text-[10px] text-[#6B7280]">{progress}% — Vérification prix, photos, documents, doublons, fraude</p></div></div>}
      {done && <div className="px-4 mt-4 space-y-3">
        <div className="rounded-xl bg-green-50 border border-green-200 p-3 flex items-center gap-2"><Check size={16} className="text-green-500" /><p className="text-sm font-bold text-green-700">Analyse terminée — Annonce conforme</p></div>
        <h2 className="text-xs font-bold text-[#6B7280] uppercase">Résultats</h2>
        {CHECKS.map(c => (<div key={c.label} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
          {c.status === "ok" ? <Check size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-yellow-500" />}
          <div className="flex-1"><p className="text-xs font-semibold text-[#111]">{c.label}</p><p className="text-[9px] text-[#6B7280]">{c.detail}</p></div>
        </div>))}
        <h2 className="text-xs font-bold text-[#6B7280] uppercase mt-2">Badges attribués automatiquement</h2>
        <div className="flex gap-2">{BADGES_AUTO.map(b => (<span key={b.badge} className={`text-[10px] font-bold px-3 py-1.5 rounded-full text-white ${b.active ? "" : "opacity-30"}`} style={{ backgroundColor: b.color }}>{b.badge}</span>))}</div>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm flex items-center gap-2"><Star size={14} className="text-[#D4AF37]" /><div><p className="text-xs font-bold text-[#111]">Score qualité : 85/100</p><p className="text-[9px] text-[#6B7280]">Bonne annonce ! Ajoutez l'historique d'entretien pour atteindre 95/100</p></div></div>
        <Link to="/depot-annonce/publication-annonce" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center mt-2">Publier l'annonce</Link>
      </div>}
    </div>
  );
}
