import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, CreditCard, Car, Home, Wrench, Truck, Package, Check, Star, Crown, Shield } from "lucide-react";

type Tab = "vente" | "location" | "garage" | "depannage" | "pieces";

const PLANS = {
  vente: [
    { nom: "Particulier", prix: "Gratuit", badge: "", color: "#6B7280", features: ["3 annonces", "5 photos/annonce", "Pas de vidéo", "Pas de badge", "Pas de mise en avant", "Durée 30 jours"] },
    { nom: "Pro", prix: "49 €/mois", badge: "PRO", color: "#3B82F6", features: ["20 annonces", "15 photos/annonce", "1 vidéo/annonce", "Badge bleu PRO", "Mise en avant basique", "Réservation en ligne", "Durée illimitée"] },
    { nom: "Pro Premium", prix: "99 €/mois", badge: "PREMIUM", color: "#D4AF37", features: ["50 annonces", "25 photos/annonce", "3 vidéos/annonce", "Badge or PREMIUM", "Mise en avant prioritaire", "Réservation + paiement", "Statistiques avancées", "Support prioritaire"] },
    { nom: "Pro Elite", prix: "199 €/mois", badge: "ELITE", color: "#111", features: ["Annonces illimitées", "Photos illimitées", "Vidéos illimitées", "Badge noir/or ELITE", "Mise en avant nationale", "Multi-sites", "Employés illimités", "API accès", "Gestionnaire dédié"] },
  ],
  location: [
    { nom: "Loueur Individuel", prix: "29 €/mois", badge: "", color: "#6B7280", features: ["3 véhicules", "Calendrier basique", "Réservation manuelle", "Pas de dépôt garantie auto"] },
    { nom: "Loueur Pro", prix: "79 €/mois", badge: "PRO", color: "#3B82F6", features: ["15 véhicules", "Calendrier avancé", "Réservation automatique", "Dépôt garantie intégré", "Contrats numériques", "Badge bleu PRO"] },
    { nom: "Loueur Premium", prix: "149 €/mois", badge: "PREMIUM", color: "#D4AF37", features: ["50 véhicules", "Multi-agences", "Gestion conducteurs", "LOA intégrée", "Statistiques avancées", "Badge or PREMIUM", "Support prioritaire"] },
    { nom: "Loueur Elite", prix: "299 €/mois", badge: "ELITE", color: "#111", features: ["Véhicules illimités", "Agences illimitées", "Flotte connectée", "API complète", "Gestionnaire dédié", "Badge noir/or ELITE"] },
  ],
  garage: [
    { nom: "Garage Basic", prix: "39 €/mois", badge: "", color: "#6B7280", features: ["Devis illimités", "Planning basique", "2 mécaniciens", "50 dossiers/mois"] },
    { nom: "Garage Premium", prix: "89 €/mois", badge: "PREMIUM", color: "#D4AF37", features: ["Devis + photos", "Planning avancé", "10 mécaniciens", "Dossiers illimités", "Pièces intégrées", "Badge or PREMIUM", "Statistiques"] },
    { nom: "Garage Elite", prix: "179 €/mois", badge: "ELITE", color: "#111", features: ["Multi-garages", "Employés illimités", "Contrôle qualité", "Flottes entreprises", "API complète", "Badge noir/or ELITE", "Gestionnaire dédié"] },
  ],
  depannage: [
    { nom: "Dépanneur Individuel", prix: "29 €/mois", badge: "", color: "#6B7280", features: ["Zone 50 km", "Demandes basiques", "GPS intégré"] },
    { nom: "Société Dépannage", prix: "99 €/mois", badge: "PRO", color: "#3B82F6", features: ["Zone illimitée", "Multi-véhicules", "Dispatch automatique", "Suivi temps réel", "Badge PRO", "Statistiques"] },
  ],
  pieces: [
    { nom: "Vendeur Pièces", prix: "49 €/mois", badge: "", color: "#6B7280", features: ["200 références", "Gestion stock basique", "Expédition manuelle"] },
    { nom: "Grossiste", prix: "149 €/mois", badge: "PRO", color: "#3B82F6", features: ["2 000 références", "Stock automatisé", "Multi-entrepôts", "API catalogue", "Badge PRO"] },
    { nom: "Distributeur", prix: "299 €/mois", badge: "ELITE", color: "#111", features: ["Références illimitées", "Réseau national", "Logistique intégrée", "Badge ELITE", "Gestionnaire dédié"] },
  ],
};

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "vente", label: "Vente", icon: Car },
  { key: "location", label: "Location", icon: Home },
  { key: "garage", label: "Garage", icon: Wrench },
  { key: "depannage", label: "Dépannage", icon: Truck },
  { key: "pieces", label: "Pièces", icon: Package },
];

export default function AbonnementsDefinitifs() {
  const [tab, setTab] = useState<Tab>("vente");

  return (
    <div className="min-h-screen bg-[#F5F3EF] pb-24">
      <div className="bg-gradient-to-b from-[#111] to-[#1a1a1a] px-4 pt-6 pb-6">
        <Link to="/superadmin" className="flex items-center gap-1 text-sm text-white/60 mb-2"><ChevronLeft size={14} /> Super Admin</Link>
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><CreditCard size={22} className="text-[#D4AF37]" /> Abonnements MKA.P-MS</h1>
        <p className="mt-1 text-xs text-white/50">Plans définitifs · Tous les services</p>
      </div>

      <div className="px-4 -mt-3 relative z-10 flex gap-1.5 overflow-x-auto pb-2 mb-3">
        {TABS.map(t => { const Icon = t.icon; return (
          <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-xl text-[10px] font-bold border ${tab === t.key ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
            <Icon size={12} /> {t.label}
          </button>); })}
      </div>

      <div className="px-4 space-y-3">
        {PLANS[tab].map((plan, i) => (
          <div key={plan.nom} className="rounded-2xl bg-white border-2 shadow-sm overflow-hidden" style={{ borderColor: plan.color + "40" }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: plan.color + "08" }}>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-base font-black text-[#111]">{plan.nom}</p>
                  {plan.badge && <span className="text-[8px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: plan.color }}>{plan.badge}</span>}
                </div>
                <p className="text-lg font-black mt-0.5" style={{ color: plan.color }}>{plan.prix}</p>
              </div>
              {i === (PLANS[tab].length - 1) && <Crown size={20} style={{ color: plan.color }} />}
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2"><Check size={12} className="text-green-500 shrink-0" /><span className="text-xs text-[#374151]">{f}</span></div>
              ))}
            </div>
            <div className="px-4 pb-3">
              <button className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: plan.color }}>
                {plan.prix === "Gratuit" ? "Commencer gratuitement" : "Choisir ce plan"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
