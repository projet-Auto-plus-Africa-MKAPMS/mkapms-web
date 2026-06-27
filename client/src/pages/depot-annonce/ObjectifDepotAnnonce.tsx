import { Link } from "react-router-dom";
import { ChevronLeft, Target, Check, Star } from "lucide-react";
const OBJECTIFS = [
  "Annonce complète en moins de 5 minutes",
  "Photos guidées — plus complètes que Leboncoin et La Centrale",
  "Vidéo 360° — niveau Autohero / Auto1",
  "Identification automatique par plaque ou VIN",
  "Contrôle IA avant publication (prix, photos, docs, fraude)",
  "Badges automatiques selon le compte",
  "Score qualité visible par l'acheteur",
  "Conseils IA pour améliorer l'annonce",
  "Tableau de bord avec vues, clics, messages, réservations",
  "Notifications d'expiration automatiques",
  "Réduire les erreurs et automatiser les contrôles",
];
export default function ObjectifDepotAnnonce() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <Link to="/depot-annonce" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Dépôt annonce</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Target size={20} className="text-[#D4AF37]" /> Objectif</h1>
        <p className="text-xs text-white/50 mt-1">{"Annonces MKA.P-MS > Leboncoin > La Centrale"}</p>
      </div>
      <div className="px-4 mt-4 space-y-1.5">
        {OBJECTIFS.map(o => (<div key={o} className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm"><Check size={12} className="text-green-500 shrink-0" /><span className="text-xs text-[#374151]">{o}</span></div>))}
      </div>
      <div className="px-4 mt-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 text-center"><Star size={16} className="text-[#D4AF37] mx-auto mb-1" /><p className="text-xs font-bold text-[#D4AF37]">MKA.P-MS V1 — Conception fonctionnelle terminée</p></div>
    </div>
  );
}
