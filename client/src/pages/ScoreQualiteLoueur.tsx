import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft, Star, Shield, TrendingUp, Clock, Check,
  MessageSquare, Car, Users, Award, ThumbsUp
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   SCORE QUALITÉ DU LOUEUR
   Visible aux clients. Exemple : 🟢 Excellent · ⭐ 4.9/5 · 2 500 locations · 98%
   ══════════════════════════════════════════════════════════════════════════ */

const LOUEUR = {
  nom: "Auto Premium Location",
  photo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200&h=200&fit=crop",
  note: 4.9, avis: 247, locations: 2500, satisfaction: 98, anciennete: "3 ans",
  badges: ["Réponse rapide", "Super loueur", "Véhicules premium"],
};

const CRITERES_LOUEUR = [
  { label: "Qualité des véhicules", score: 98, icon: Car },
  { label: "Réactivité", score: 95, icon: Clock },
  { label: "Respect des délais", score: 97, icon: Check },
  { label: "Communication", score: 94, icon: MessageSquare },
  { label: "Réclamations résolues", score: 96, icon: Shield },
];

const AVIS = [
  { client: "Jean D.", note: 5, texte: "Véhicule impeccable, retrait rapide. Parfait pour mon activité VTC.", date: "Il y a 2 jours" },
  { client: "Marie L.", note: 5, texte: "Très professionnel. Le véhicule était propre et prêt à l'heure.", date: "Il y a 1 semaine" },
  { client: "SAS Transport+", note: 4, texte: "Bonne flotte, bon rapport qualité/prix pour nos besoins pro.", date: "Il y a 2 semaines" },
];

function getQualite(score: number) {
  if (score >= 95) return { label: "Excellent", emoji: "🟢", color: "text-green-600" };
  if (score >= 85) return { label: "Très bien", emoji: "🔵", color: "text-blue-600" };
  if (score >= 70) return { label: "Bien", emoji: "🟡", color: "text-amber-600" };
  return { label: "À améliorer", emoji: "🟠", color: "text-orange-600" };
}

export default function ScoreQualiteLoueur() {
  const avgScore = Math.round(CRITERES_LOUEUR.reduce((s, c) => s + c.score, 0) / CRITERES_LOUEUR.length);
  const qualite = getQualite(avgScore);

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/louer" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Retour Location</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Award size={20} className="text-[#D4AF37]" /> Score qualité loueur</h1>
        <p className="mt-1 text-sm text-white/60">Visible par tous les clients</p>
      </div>

      {/* Loueur card */}
      <div className="mx-4 -mt-3 relative z-10 rounded-xl bg-white border border-[#E5E7EB] p-4 shadow-md">
        <div className="flex items-center gap-3">
          <img src={LOUEUR.photo} alt="" className="h-14 w-14 rounded-full object-cover" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-[#111]">{LOUEUR.nom}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((n) => (<Star key={n} size={12} className="text-[#D4AF37]" fill={n <= Math.floor(LOUEUR.note) ? "#D4AF37" : "none"} />))}</span>
              <span className="text-sm font-bold text-[#111]">{LOUEUR.note}</span>
              <span className="text-xs text-[#6B7280]">({LOUEUR.avis} avis)</span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Locations</p><p className="text-sm font-black text-[#111]">{LOUEUR.locations.toLocaleString("fr-FR")}</p></div>
          <div className="rounded-lg bg-green-50 p-2 text-center"><p className="text-[9px] text-green-600">Satisfaction</p><p className="text-sm font-black text-green-600">{LOUEUR.satisfaction} %</p></div>
          <div className="rounded-lg bg-[#F5F3EF] p-2 text-center"><p className="text-[9px] text-[#6B7280]">Ancienneté</p><p className="text-sm font-black text-[#111]">{LOUEUR.anciennete}</p></div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {LOUEUR.badges.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 rounded-full bg-[#D4AF37]/10 px-2.5 py-0.5 text-[9px] font-bold text-[#D4AF37]"><Award size={10} /> {b}</span>
          ))}
        </div>
      </div>

      {/* Quality indicator */}
      <div className="mx-4 mt-4 rounded-xl bg-gradient-to-r from-[#111] to-[#1a1a1a] p-4 text-center">
        <p className="text-3xl">{qualite.emoji}</p>
        <p className={`text-xl font-black mt-1 ${qualite.color}`}>{qualite.label}</p>
        <p className="text-sm font-bold text-white mt-0.5">{avgScore}/100</p>
      </div>

      {/* Criteria */}
      <div className="px-4 mt-4 space-y-2">
        <h2 className="text-base font-bold text-[#111]">Détail des critères</h2>
        {CRITERES_LOUEUR.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl bg-white border border-[#E5E7EB] p-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F3EF]"><Icon size={14} className="text-[#6B7280]" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between"><span className="text-sm text-[#111]">{c.label}</span><span className="text-sm font-black text-[#D4AF37]">{c.score}%</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden"><div className="h-full rounded-full bg-[#D4AF37]" style={{ width: `${c.score}%` }} /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Avis */}
      <div className="px-4 mt-4">
        <h2 className="text-base font-bold text-[#111]">Derniers avis clients</h2>
        <div className="mt-2 space-y-2">
          {AVIS.map((a, i) => (
            <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#111]">{a.client}</span>
                <span className="flex items-center gap-0.5">{Array.from({ length: a.note }, (_, n) => (<Star key={n} size={10} className="text-[#D4AF37]" fill="#D4AF37" />))}</span>
              </div>
              <p className="text-xs text-[#6B7280] mt-1">{a.texte}</p>
              <p className="text-[9px] text-[#9CA3AF] mt-1">{a.date}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
