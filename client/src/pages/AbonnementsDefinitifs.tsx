import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, CreditCard, Car, Home, Wrench, Truck, Package, Check, Star, Crown, Shield, Globe, MapPin, Zap, Gavel, Paintbrush, Settings, BarChart3 } from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════
   ABONNEMENTS DÉFINITIFS MKA.P-MS V1
   SEO Google + Géolocalisation mondiale intégrés dans tous les plans Pro
   ══════════════════════════════════════════════════════════════════════════ */

type Tab = "vente" | "location" | "garage" | "encheres" | "carrosserie" | "atelier" | "comptabilite" | "depannage" | "pieces";

const PLANS = {
  vente: [
    { nom: "Particulier", prix: "Gratuit", badge: "", color: "#6B7280", features: [
      "3 annonces", "5 photos/annonce", "Pas de vidéo", "Pas de badge", "Pas de mise en avant", "Durée 30 jours",
      "─── SEO Google ───", "URL optimisée", "Indexation Google basique",
      "─── Géolocalisation ───", "Visible autour de l'acheteur",
    ]},
    { nom: "Pro", prix: "49 €/mois", badge: "PRO", color: "#3B82F6", features: [
      "20 annonces", "15 photos/annonce", "1 vidéo/annonce", "Badge bleu PRO", "Mise en avant basique", "Réservation en ligne", "Durée illimitée",
      "─── SEO Google Standard ───", "URL optimisée SEO", "Titre Google automatique", "Description Google automatique", "Indexation Google", "Sitemap dynamique", "Open Graph + Twitter Card", "Schema.org Vehicle",
      "─── Géolocalisation ───", "Recherche géolocalisée", "Visible autour de l'acheteur", "Recherche par ville", "Recherche par pays",
    ]},
    { nom: "Pro Premium", prix: "99 €/mois", badge: "PREMIUM", color: "#D4AF37", features: [
      "50 annonces", "25 photos/annonce", "3 vidéos/annonce", "Badge or PREMIUM", "Mise en avant prioritaire", "Réservation + paiement", "Statistiques avancées", "Support prioritaire",
      "─── SEO Google Premium ───", "Tout SEO Standard", "Pages locales optimisées", "Priorité Sitemap", "Score SEO amélioré", "Données enrichies schema.org",
      "─── Géolocalisation Premium ───", "Mise en avant régionale", "Priorité résultats géo", "Distance visible acheteur", "Carte interactive",
    ]},
    { nom: "Pro Elite", prix: "199 €/mois", badge: "ELITE", color: "#111", features: [
      "Annonces illimitées", "Photos illimitées", "Vidéos illimitées", "Badge noir/or ELITE", "Mise en avant nationale", "Multi-sites", "Employés illimités", "API accès", "Gestionnaire dédié",
      "─── SEO Google Elite ───", "Tout SEO Premium", "Pages locales renforcées", "Mise en avant SEO maximale", "Priorité nationale Google",
      "─── Géolocalisation Elite ───", "Priorité nationale géo", "Priorité résultats recherche", "Mise en avant carte", "Visibilité maximale mondiale",
    ]},
  ],
  location: [
    { nom: "Loueur Individuel", prix: "29 €/mois", badge: "", color: "#6B7280", features: [
      "3 véhicules", "Calendrier basique", "Réservation manuelle", "Pas de dépôt garantie auto",
      "─── SEO + Géo ───", "URL optimisée", "Indexation Google", "Visible géolocalisation",
    ]},
    { nom: "Loueur Pro", prix: "79 €/mois", badge: "PRO", color: "#3B82F6", features: [
      "15 véhicules", "Calendrier avancé", "Réservation automatique", "Dépôt garantie intégré", "Contrats numériques", "Badge bleu PRO",
      "─── SEO Standard + Géo ───", "SEO Google Standard complet", "Recherche géolocalisée", "Recherche par ville/pays",
    ]},
    { nom: "Loueur Premium", prix: "149 €/mois", badge: "PREMIUM", color: "#D4AF37", features: [
      "50 véhicules", "Multi-agences", "Gestion conducteurs", "LOA intégrée", "Statistiques avancées", "Badge or PREMIUM", "Support prioritaire",
      "─── SEO Premium + Géo ───", "SEO Google Premium complet", "Pages locales optimisées", "Priorité géo régionale", "Carte interactive",
    ]},
    { nom: "Loueur Elite", prix: "299 €/mois", badge: "ELITE", color: "#111", features: [
      "Véhicules illimités", "Agences illimitées", "Flotte connectée", "API complète", "Gestionnaire dédié", "Badge noir/or ELITE",
      "─── SEO Elite + Géo ───", "SEO Google Elite complet", "Priorité nationale géo", "Visibilité maximale mondiale",
    ]},
  ],
  garage: [
    { nom: "Garage Basic", prix: "39 €/mois", badge: "", color: "#6B7280", features: [
      "Devis illimités", "Planning basique", "2 mécaniciens", "50 dossiers/mois",
      "─── SEO + Géo ───", "Page garage indexée Google", "Schema.org AutoRepair", "Visible géolocalisation",
    ]},
    { nom: "Garage Premium", prix: "89 €/mois", badge: "PREMIUM", color: "#D4AF37", features: [
      "Devis + photos", "Planning avancé", "10 mécaniciens", "Dossiers illimités", "Pièces intégrées", "Badge or PREMIUM", "Statistiques",
      "─── SEO Premium + Géo ───", "SEO Google Premium", "Page locale /garage-auto optimisée", "Priorité géo régionale", "Carte interactive",
    ]},
    { nom: "Garage Elite", prix: "179 €/mois", badge: "ELITE", color: "#111", features: [
      "Multi-garages", "Employés illimités", "Contrôle qualité", "Flottes entreprises", "API complète", "Badge noir/or ELITE", "Gestionnaire dédié",
      "─── SEO Elite + Géo ───", "SEO Google Elite", "Priorité nationale", "Visibilité maximale",
    ]},
  ],
  encheres: [
    { nom: "Enchères Accès", prix: "19 €/mois", badge: "", color: "#6B7280", features: [
      "Accès aux enchères publiques", "5 enchères/mois", "Alertes basiques",
      "─── Enchères ───", "Voir lots disponibles", "Historique enchères",
    ]},
    { nom: "Enchères Premium", prix: "49 €/mois", badge: "PREMIUM", color: "#D4AF37", features: [
      "Enchères illimitées", "Surenchère automatique", "Alertes temps réel", "Accès lots exclusifs", "Badge or PREMIUM",
      "─── Enchères Premium ───", "Priorité sur les lots", "Statistiques enchères", "Notifications push",
    ]},
    { nom: "Enchères Elite", prix: "99 €/mois", badge: "ELITE", color: "#111", features: [
      "Tout Premium", "Accès VIP lots MKA.P-MS", "Lots export", "Multi-comptes", "API enchères", "Badge noir/or ELITE",
      "─── Enchères Elite ───", "Priorité maximale", "Contact direct vendeur", "Gestionnaire dédié",
    ]},
  ],
  carrosserie: [
    { nom: "Carrosserie Basic", prix: "29 €/mois", badge: "", color: "#6B7280", features: [
      "Devis carrosserie illimités", "Photos avant/après", "2 techniciens",
      "─── SEO + Géo ───", "Page indexée Google", "Visible géolocalisation",
    ]},
    { nom: "Carrosserie Premium", prix: "59 €/mois", badge: "PREMIUM", color: "#D4AF37", features: [
      "Devis + photos HD", "Planning avancé", "Débosselage, Peinture, Marbre", "5 techniciens", "Badge or PREMIUM",
      "─── SEO Premium + Géo ───", "SEO Google Premium", "Carte interactive", "Priorité régionale",
    ]},
    { nom: "Carrosserie Elite", prix: "99 €/mois", badge: "ELITE", color: "#111", features: [
      "Multi-centres", "Techniciens illimités", "Expertise véhicules accidentés", "Badge noir/or ELITE",
      "─── SEO Elite + Géo ───", "Priorité nationale", "Visibilité maximale",
    ]},
  ],
  atelier: [
    { nom: "Atelier Start", prix: "39 €/mois", badge: "", color: "#6B7280", features: [
      "Planning atelier", "Ordres de réparation", "Devis", "2 mécaniciens", "50 dossiers/mois",
      "─── Atelier ───", "Suivi intervention basique", "Gestion clients",
    ]},
    { nom: "Atelier Pro", prix: "89 €/mois", badge: "PRO", color: "#3B82F6", features: [
      "Tout Start", "Catalogue technique AutoData", "Suivi temps réel", "Stock magasin", "10 mécaniciens", "Notifications client", "Badge bleu PRO",
      "─── Atelier Pro ───", "Couples de serrage", "Temps barémés", "Pièces cliquables", "Gestion employés",
    ]},
    { nom: "Atelier Premium", prix: "149 €/mois", badge: "PREMIUM", color: "#D4AF37", features: [
      "Tout Pro", "Stock avancé + alertes rupture", "Commande fournisseur auto", "Multi-ateliers", "Employés illimités", "Productivité employés", "Badge or PREMIUM",
      "─── Atelier Premium ───", "Inventaire complet", "Rapports performance", "Intégration comptabilité",
    ]},
    { nom: "Atelier Elite", prix: "249 €/mois", badge: "ELITE", color: "#111", features: [
      "Tout Premium", "API catalogue complet", "Réseau multi-sites", "Flottes entreprises", "Badge noir/or ELITE", "Gestionnaire dédié",
      "─── Atelier Elite ───", "Priorité nationale", "Formation équipe", "Support 24/7",
    ]},
  ],
  comptabilite: [
    { nom: "Compta Start", prix: "29 €/mois", badge: "", color: "#6B7280", features: [
      "Tableau de bord CA", "Suivi paiements", "Factures basiques", "1 utilisateur",
      "─── Comptabilité ───", "CA par univers", "Export CSV",
    ]},
    { nom: "Compta Premium", prix: "59 €/mois", badge: "PREMIUM", color: "#D4AF37", features: [
      "Tout Start", "Suivi employés", "Alertes financières", "Remboursements", "Commissions", "Abonnements actifs", "Badge or PREMIUM",
      "─── Comptabilité Premium ───", "CA détaillé", "Objectifs", "Performance employés", "Export PDF",
    ]},
    { nom: "Compta Elite", prix: "99 €/mois", badge: "ELITE", color: "#111", features: [
      "Tout Premium", "Multi-sites", "API comptable", "Intégration Sage/EBP", "Audit automatique", "Badge noir/or ELITE",
      "─── Comptabilité Elite ───", "Rapports automatiques", "Anomalies IA", "Gestionnaire dédié",
    ]},
  ],
  depannage: [
    { nom: "Dépanneur Individuel", prix: "29 €/mois", badge: "", color: "#6B7280", features: [
      "Zone 50 km", "Demandes basiques", "GPS intégré",
      "─── Géo ───", "Visible géolocalisation", "Distance visible client",
    ]},
    { nom: "Société Dépannage", prix: "99 €/mois", badge: "PRO", color: "#3B82F6", features: [
      "Zone illimitée", "Multi-véhicules", "Dispatch automatique", "Suivi temps réel", "Badge PRO", "Statistiques",
      "─── SEO + Géo ───", "Page indexée Google", "Priorité géo", "Carte interactive",
    ]},
  ],
  pieces: [
    { nom: "Vendeur Pièces", prix: "49 €/mois", badge: "", color: "#6B7280", features: [
      "200 références", "Gestion stock basique", "Expédition manuelle",
      "─── SEO + Géo ───", "Produits indexés Google", "Visible géolocalisation",
    ]},
    { nom: "Grossiste", prix: "149 €/mois", badge: "PRO", color: "#3B82F6", features: [
      "2 000 références", "Stock automatisé", "Multi-entrepôts", "API catalogue", "Badge PRO",
      "─── SEO + Géo ───", "SEO Google Standard", "Recherche géolocalisée", "Pages locales",
    ]},
    { nom: "Distributeur", prix: "299 €/mois", badge: "ELITE", color: "#111", features: [
      "Références illimitées", "Réseau national", "Logistique intégrée", "Badge ELITE", "Gestionnaire dédié",
      "─── SEO Elite + Géo ───", "SEO Google Elite", "Priorité nationale", "Visibilité maximale",
    ]},
  ],
};

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "vente", label: "Vente", icon: Car },
  { key: "location", label: "Location", icon: Home },
  { key: "garage", label: "Garage", icon: Wrench },
  { key: "encheres", label: "Enchères", icon: Gavel },
  { key: "carrosserie", label: "Carrosserie", icon: Paintbrush },
  { key: "atelier", label: "Atelier Pro", icon: Settings },
  { key: "comptabilite", label: "Comptabilité", icon: BarChart3 },
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
        <p className="mt-1 text-xs text-white/50">Plans définitifs · SEO Google + Géolocalisation inclus</p>
      </div>

      {/* SEO + Géo badge */}
      <div className="mx-4 -mt-3 relative z-10 rounded-xl bg-gradient-to-r from-[#D4AF37]/10 to-blue-50 border border-[#D4AF37]/30 p-3 flex items-center gap-3 mb-3">
        <div className="flex gap-1.5">
          <div className="h-8 w-8 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center"><Globe size={14} className="text-[#D4AF37]" /></div>
          <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin size={14} className="text-blue-500" /></div>
        </div>
        <div>
          <p className="text-[10px] font-bold text-[#111]">SEO Google + Géolocalisation mondiale inclus</p>
          <p className="text-[8px] text-[#6B7280]">Annonces visibles sur Google · Recherche par distance · 7+ pays</p>
        </div>
      </div>

      <div className="px-4 flex gap-1.5 overflow-x-auto pb-2 mb-3">
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
              {plan.features.map(f => {
                if (f.startsWith("───")) {
                  return <p key={f} className="text-[9px] font-black text-[#D4AF37] uppercase mt-2 mb-0.5 flex items-center gap-1">
                    {f.includes("SEO") && <Globe size={10} />}{f.includes("Géo") && <MapPin size={10} />}{f.replace(/─/g, "").trim()}
                  </p>;
                }
                return <div key={f} className="flex items-center gap-2"><Check size={12} className="text-green-500 shrink-0" /><span className="text-xs text-[#374151]">{f}</span></div>;
              })}
            </div>
            <div className="px-4 pb-3">
              <button className="w-full py-2.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: plan.color }}>
                {plan.prix === "Gratuit" ? "Commencer gratuitement" : "Choisir ce plan"}
              </button>
            </div>
          </div>
        ))}

        {/* Option SEO Boost */}
        <div className="rounded-2xl bg-gradient-to-br from-[#111] to-[#1a1a1a] border-2 border-[#D4AF37] shadow-lg overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-black text-white">SEO Boost</p>
                <span className="text-[8px] font-black px-2 py-0.5 rounded-full bg-[#D4AF37] text-white flex items-center gap-0.5"><Zap size={8} /> OPTION</span>
              </div>
              <p className="text-lg font-black text-[#D4AF37] mt-0.5">29 €/mois</p>
            </div>
            <Globe size={24} className="text-[#D4AF37]" />
          </div>
          <div className="px-4 py-3 space-y-1.5">
            {["Mise en avant SEO renforcée", "Priorité pages catégories", "Priorité résultats recherche", "Optimisation Google renforcée", "Pages locales premium", "Rapport SEO mensuel", "Recommandations IA", "Campagne Google Ads (accompagnement)"].map(f => (
              <div key={f} className="flex items-center gap-2"><Check size={12} className="text-[#D4AF37] shrink-0" /><span className="text-xs text-white/80">{f}</span></div>
            ))}
          </div>
          <div className="px-4 pb-3">
            <button className="w-full py-2.5 rounded-xl text-xs font-bold text-[#111] bg-[#D4AF37]">Ajouter SEO Boost</button>
          </div>
        </div>
      </div>
    </div>
  );
}
