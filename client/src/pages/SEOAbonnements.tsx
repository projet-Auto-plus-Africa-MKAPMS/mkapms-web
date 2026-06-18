import { Link } from "react-router-dom";
import { ChevronLeft, Globe, Check, Star, Crown, Zap } from "lucide-react";

const PLANS_SEO = [
  {
    nom: "SEO Standard", prix: "Inclus", badge: "TOUS LES PROS", color: "#3B82F6",
    features: ["Annonce indexable Google", "URL optimisée automatique", "Titre SEO automatique", "Description SEO automatique", "Balises Open Graph", "Sitemap inclus"],
  },
  {
    nom: "SEO Premium", prix: "Inclus Premium/Elite", badge: "PREMIUM / ELITE", color: "#D4AF37",
    features: ["Tout SEO Standard", "Mise en avant SEO", "Meilleure structure texte", "Priorité sitemap", "Données enrichies schema.org", "Page vendeur optimisée", "Score SEO visible"],
  },
  {
    nom: "SEO Boost", prix: "À partir de 29 €/mois", badge: "OPTION", color: "#111",
    features: ["Tout SEO Premium", "Mise en avant pages catégories", "Annonce sponsorisée interne", "Campagne Google Ads (accompagnement)", "Rapport SEO mensuel", "Recommandations IA"],
  },
];

export default function SEOAbonnements() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-[#111] px-4 pt-6 pb-5">
        <Link to="/abonnements-definitifs" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Abonnements</Link>
        <h1 className="text-xl font-black text-white flex items-center gap-2"><Globe size={20} className="text-[#D4AF37]" /> Options SEO</h1>
        <p className="text-xs text-white/50 mt-1">Être trouvé sur Google · Visibilité maximale</p>
      </div>
      <div className="px-4 mt-4 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 p-3 mb-4">
        <p className="text-[10px] text-[#374151]"><span className="font-bold text-[#D4AF37]">Important :</span> Le SEO ne garantit pas une première position Google immédiatement. Mais votre annonce sera techniquement prête pour que Google puisse la lire, comprendre et indexer.</p>
      </div>
      <div className="px-4 space-y-3">
        {PLANS_SEO.map(p => (
          <div key={p.nom} className="rounded-2xl bg-white border-2 shadow-sm overflow-hidden" style={{ borderColor: p.color + "40" }}>
            <div className="px-4 py-3" style={{ backgroundColor: p.color + "08" }}>
              <div className="flex items-center gap-2"><p className="text-base font-black text-[#111]">{p.nom}</p><span className="text-[8px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: p.color }}>{p.badge}</span></div>
              <p className="text-sm font-bold mt-0.5" style={{ color: p.color }}>{p.prix}</p>
            </div>
            <div className="px-4 py-3 space-y-1.5">{p.features.map(f => (
              <div key={f} className="flex items-center gap-2"><Check size={12} className="text-green-500 shrink-0" /><span className="text-xs text-[#374151]">{f}</span></div>
            ))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
