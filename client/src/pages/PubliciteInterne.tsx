import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Megaphone, Eye, MapPin, BarChart3, Euro, Clock, Star, Crown, Zap } from "lucide-react";

const EMPLACEMENTS = [
  { zone: "Page accueil", format: "Bannière 728x90", tarif: "500 €/semaine", impressions: "~50 000/sem", disponible: true },
  { zone: "Page accueil", format: "Mise en avant véhicule", tarif: "200 €/semaine", impressions: "~30 000/sem", disponible: true },
  { zone: "Page recherche", format: "Résultat sponsorisé", tarif: "150 €/semaine", impressions: "~20 000/sem", disponible: false },
  { zone: "Page catégories", format: "Bannière latérale", tarif: "100 €/semaine", impressions: "~15 000/sem", disponible: true },
  { zone: "Page produit", format: "Suggestion sponsorisée", tarif: "80 €/semaine", impressions: "~10 000/sem", disponible: true },
];

const TYPES = [
  { type: "Bannière", icon: Eye, prix: "à partir de 100 €/sem", desc: "Affichage visuel sur les pages principales" },
  { type: "Mise en avant", icon: Star, prix: "à partir de 50 €/sem", desc: "Annonce remontée dans les résultats" },
  { type: "Urgent", icon: Zap, prix: "15 €/annonce", desc: "Badge rouge URGENT sur l'annonce" },
  { type: "Premium", icon: Crown, prix: "à partir de 200 €/sem", desc: "Position #1 garantie dans la catégorie" },
  { type: "Elite", icon: Crown, prix: "à partir de 500 €/sem", desc: "Affichage national + page accueil" },
];

export default function PubliciteInterne() {
  const [tab, setTab] = useState<"emplacements"|"types">("emplacements");
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Megaphone size={22} className="text-[#D4AF37]" /> Publicité MKA.P-MS</h1>
        <p className="mt-1 text-xs text-white/50">Emplacements · Tarifs · Rotation automatique</p>
      </div>
      <div className="px-4 -mt-3 relative z-10 flex gap-2 mb-4">
        {(["emplacements", "types"] as const).map(t => (<button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${tab === t ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>{t === "emplacements" ? "Emplacements & Tarifs" : "Types de pub"}</button>))}
      </div>
      {tab === "emplacements" && <div className="px-4 space-y-2">
        {EMPLACEMENTS.map((e, i) => (
          <div key={i} className="rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1"><p className="text-sm font-bold text-[#111]">{e.zone}</p><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${e.disponible ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{e.disponible ? "Disponible" : "Réservé"}</span></div>
            <p className="text-[10px] text-[#6B7280] mb-1">{e.format} · {e.impressions}</p>
            <p className="text-sm font-black text-[#D4AF37]">{e.tarif}</p>
          </div>))}
        <div className="rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3"><div className="flex items-center gap-2"><Clock size={14} className="text-[#D4AF37]" /><p className="text-[10px] text-[#6B7280]"><span className="font-bold text-[#D4AF37]">Rotation automatique :</span> Les publicités tournent automatiquement selon le crédit restant et la date d'expiration.</p></div></div>
      </div>}
      {tab === "types" && <div className="px-4 space-y-2">
        {TYPES.map(t => { const Icon = t.icon; return (
          <div key={t.type} className="flex items-center gap-3 rounded-xl bg-white border border-[#E5E7EB] p-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37]/10"><Icon size={16} className="text-[#D4AF37]" /></div>
            <div className="flex-1"><p className="text-sm font-bold text-[#111]">{t.type}</p><p className="text-[10px] text-[#6B7280]">{t.desc}</p></div>
            <p className="text-xs font-bold text-[#D4AF37]">{t.prix}</p>
          </div>); })}
      </div>}
    </div>
  );
}
