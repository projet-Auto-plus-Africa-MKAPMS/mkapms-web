import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Video, Play, Lock, Crown, RotateCw, Eye } from "lucide-react";

const VIDEO_TYPES = [
  { type: "Vidéo classique", icon: Play, duree: "15-60 sec", desc: "Présentation simple du véhicule", dispo: "Tous les comptes", locked: false },
  { type: "Vidéo 360°", icon: RotateCw, duree: "30-90 sec", desc: "Présentation complète extérieur + intérieur + tableau de bord + coffre", dispo: "Pro Premium / Elite", locked: false },
  { type: "Visite virtuelle 360°", icon: Eye, duree: "Interactif", desc: "L'acheteur tourne autour du véhicule, zoome, regarde l'intérieur depuis téléphone ou ordinateur", dispo: "Pro Elite uniquement", locked: false },
];

const DUREES = [
  { label: "15 secondes", desc: "Aperçu rapide", plan: "Tous" },
  { label: "30 secondes", desc: "Présentation standard", plan: "Pro" },
  { label: "60 secondes", desc: "Présentation complète", plan: "Premium / Elite" },
];

export default function VideosAnnonce() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/depot-annonce/photos-vehicule" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Photos</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Video size={20} className="text-[#D4AF37]" /> Vidéos</h1>
        <p className="text-xs text-white/50 mt-1">Classique · 360° · Visite virtuelle selon abonnement</p>
      </div>
      <div className="px-4 mt-4 space-y-3">
        <h2 className="text-xs font-bold text-[#6B7280] uppercase">Types de vidéo</h2>
        {VIDEO_TYPES.map(v => { const Icon = v.icon; return (
          <button key={v.type} onClick={() => setSelected(v.type)} className={`w-full rounded-xl border-2 p-4 text-left shadow-sm ${selected === v.type ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-[#E5E7EB] bg-white"}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10"><Icon size={18} className="text-[#D4AF37]" /></div>
              <div className="flex-1">
                <p className="text-sm font-bold text-[#111]">{v.type}</p>
                <p className="text-[10px] text-[#6B7280]">{v.desc}</p>
              </div>
              {v.locked && <Lock size={14} className="text-[#D4D4D4]" />}
            </div>
            <div className="mt-2 flex items-center gap-3"><span className="text-[9px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full font-bold">{v.duree}</span><span className="text-[9px] text-[#6B7280]">{v.dispo}</span></div>
          </button>); })}
        <h2 className="text-xs font-bold text-[#6B7280] uppercase mt-4">Durée selon abonnement</h2>
        <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm space-y-2">
          {DUREES.map(d => (<div key={d.label} className="flex items-center justify-between py-1 border-b border-[#F3F4F6] last:border-0"><div><p className="text-xs font-semibold text-[#111]">{d.label}</p><p className="text-[9px] text-[#6B7280]">{d.desc}</p></div><span className="text-[9px] font-bold bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded-full">{d.plan}</span></div>))}
        </div>
        <Link to="/depot-annonce/description-annonce" className="block w-full py-3 bg-[#D4AF37] text-white rounded-xl text-sm font-bold text-center mt-4">Continuer → Description</Link>
      </div>
    </div>
  );
}
