import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Shield, Star, TrendingUp, Clock, Check,
  AlertCircle, CreditCard, Car, MessageSquare, Award
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   SCORE DE CONFIANCE LOCATAIRE
   Basé sur : paiements, retours véhicules, retards, avis.
   Permet aux loueurs de filtrer les demandes.
   ══════════════════════════════════════════════════════════════════════════ */

const CRITERES = [
  { id: "paiements", label: "Paiements", desc: "Paiements à temps", score: 95, icon: CreditCard, detail: "19/20 paiements à l'heure" },
  { id: "retours", label: "Retours véhicules", desc: "Véhicules rendus en bon état", score: 90, icon: Car, detail: "9/10 retours sans problème" },
  { id: "retards", label: "Ponctualité", desc: "Retours à l'heure", score: 85, icon: Clock, detail: "1 retard sur 10 locations" },
  { id: "avis", label: "Avis loueurs", desc: "Notes laissées par les loueurs", score: 92, icon: Star, detail: "4.6/5 de moyenne" },
  { id: "documents", label: "Documents", desc: "Documents toujours à jour", score: 100, icon: Shield, detail: "Tous les documents validés" },
];

function getLevel(score: number): { label: string; color: string; bg: string; emoji: string } {
  if (score >= 95) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50", emoji: "🟢" };
  if (score >= 85) return { label: "Très bien", color: "text-blue-600", bg: "bg-blue-50", emoji: "🔵" };
  if (score >= 70) return { label: "Bien", color: "text-amber-600", bg: "bg-amber-50", emoji: "🟡" };
  if (score >= 50) return { label: "Moyen", color: "text-orange-600", bg: "bg-orange-50", emoji: "🟠" };
  return { label: "Faible", color: "text-red-600", bg: "bg-red-50", emoji: "🔴" };
}

export default function ScoreConfiance() {
  const avgScore = Math.round(CRITERES.reduce((s, c) => s + c.score, 0) / CRITERES.length);
  const level = getLevel(avgScore);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Shield size={20} className="text-[#D4AF37]" /> Score de confiance</h1>
        <p className="mt-1 text-sm text-white/60">Votre réputation de locataire MKA.P-MS</p>
      </div>

      {/* Main score */}
      <div className="mx-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-6 text-center shadow-md">
        <div className="relative inline-flex items-center justify-center w-28 h-28">
          <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" stroke="#E5E7EB" strokeWidth="8" fill="none" />
            <circle cx="50" cy="50" r="42" stroke="#D4AF37" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${avgScore * 2.64} 264`} />
          </svg>
          <div className="absolute">
            <p className="text-3xl font-black text-[#111]">{avgScore}</p>
            <p className="text-[9px] text-[#6B7280]">/ 100</p>
          </div>
        </div>
        <p className={`mt-3 text-lg font-bold ${level.color}`}>{level.emoji} {level.label}</p>
        <p className="text-xs text-[#6B7280] mt-1">Score visible par les loueurs professionnels</p>
      </div>

      {/* Criteria breakdown */}
      <div className="px-4 mt-4 space-y-2">
        <h2 className="text-base font-bold text-[#111]">Détail par critère</h2>
        {CRITERES.map((c) => {
          const Icon = c.icon;
          const cLevel = getLevel(c.score);
          return (
            <div key={c.id} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]"><Icon size={16} className="text-[#6B7280]" /></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#111]">{c.label}</h3>
                    <span className={`text-sm font-black ${cLevel.color}`}>{c.score}/100</span>
                  </div>
                  <p className="text-[10px] text-[#6B7280]">{c.desc}</p>
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                <div className={`h-full rounded-full transition-all ${c.score >= 85 ? "bg-green-500" : c.score >= 70 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${c.score}%` }} />
              </div>
              <p className="mt-1 text-[9px] text-[#9CA3AF]">{c.detail}</p>
            </div>
          );
        })}
      </div>

      {/* Tips */}
      <div className="mx-4 mt-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 p-4">
        <h3 className="text-sm font-bold text-[#111] flex items-center gap-2"><TrendingUp size={14} className="text-[#D4AF37]" /> Améliorer votre score</h3>
        <ul className="mt-2 space-y-1.5 text-xs text-[#6B7280]">
          <li className="flex items-start gap-2"><Check size={12} className="text-[#D4AF37] mt-0.5 shrink-0" /> Payez toujours à l'heure</li>
          <li className="flex items-start gap-2"><Check size={12} className="text-[#D4AF37] mt-0.5 shrink-0" /> Rendez le véhicule propre et à l'heure</li>
          <li className="flex items-start gap-2"><Check size={12} className="text-[#D4AF37] mt-0.5 shrink-0" /> Gardez vos documents à jour</li>
          <li className="flex items-start gap-2"><Check size={12} className="text-[#D4AF37] mt-0.5 shrink-0" /> Laissez des avis constructifs</li>
        </ul>
      </div>
    </div>
  );
}
