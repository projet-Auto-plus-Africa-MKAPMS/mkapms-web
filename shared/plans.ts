// Catalogue d'offres et de tarifs — source unique (cahier des charges §8).
// Partagé entre le frontend (affichage) et le backend (Stripe / quotas).

export type PlanAudience = "particulier" | "pro" | "franchise";

// Catégorie = profil métier. Règle centrale (parcours §12) :
// chaque profil ne voit QUE les offres de sa catégorie.
export type PlanCategory =
  | "particulier"
  | "pro_vente"
  | "garage"
  | "location"
  | "vtc_taxi"
  | "pieces"
  | "livraison"
  | "vo"
  | "depannage"
  | "franchise"
  | "encheres"
  | "comptabilite"
  | "carrosserie"
  | "atelier_pro"
  | "autodata"
  | "publicite";

export interface PlanQuotas {
  maxAnnonces: number | null; // null = illimité
  maxPhotos: number | null;
  maxVideos: number | null;
}

export interface Plan {
  code: string;
  label: string;
  audience: PlanAudience;
  category: PlanCategory;
  priceEur: number | null; // null = « sur demande » (grille non communiquée)
  recurring: boolean;
  durationDays?: number; // pour les boosts à l'unité
  highlight?: boolean; // "le plus choisi"
  features: string[];
  quotas: PlanQuotas;
  // Partie A §2 : « jamais de blocage sauf KYC ». Au-delà du quota, on facture au lieu de bloquer.
  overageEur?: number; // coût unitaire d'une annonce supplémentaire (pro)
  commissionPct?: number; // commission plateforme sur les transactions
}

// Options photos à l'unité pour le Particulier (Partie A §1).
// 4 photos gratuites incluses ; au-delà, c'est facturé (jamais bloqué).
export interface PhotoPack {
  code: string;
  label: string;
  priceEur: number;
  extraPhotos: number; // nombre de photos supplémentaires
}
export const FREE_PHOTOS = 4;
export const PHOTO_PACKS: PhotoPack[] = [
  { code: "photo_unit", label: "+1 photo", priceEur: 1.5, extraPhotos: 1 },
  { code: "photo_pack5", label: "Pack 5 photos", priceEur: 5.9, extraPhotos: 5 },
  { code: "photo_pack8", label: "Pack 8 photos", priceEur: 7.9, extraPhotos: 8 },
  { code: "photo_pack18", label: "Pack 18 photos", priceEur: 16.9, extraPhotos: 18 },
];

// §8.1 — Offres particuliers (Boost à l'unité)
export const PARTICULIER_PLANS: Plan[] = [
  {
    code: "boost_7j",
    label: "Boost 7 jours",
    audience: "particulier",
    category: "particulier",
    priceEur: 6.9,
    recurring: false,
    durationDays: 7,
    features: [
      "Remontée en haut de liste 7 jours",
      "Badge « Boost »",
      "Statistiques de vues quotidiennes",
    ],
    quotas: { maxAnnonces: null, maxPhotos: 4, maxVideos: 0 },
  },
  {
    code: "boost_30j",
    label: "Boost 30 jours",
    audience: "particulier",
    category: "particulier",
    priceEur: 14.9,
    recurring: false,
    durationDays: 30,
    highlight: true,
    features: [
      "Remontée 30 jours",
      "Badge « Premium » doré",
      "Statistiques détaillées (vues, contacts)",
      "3 photos supplémentaires (jusqu'à 10)",
    ],
    quotas: { maxAnnonces: null, maxPhotos: 10, maxVideos: 0 },
  },
  {
    code: "premium_30j",
    label: "Premium 30 jours",
    audience: "particulier",
    category: "particulier",
    priceEur: 24.9,
    recurring: false,
    durationDays: 30,
    features: [
      "Top placement absolu",
      "Badge « Premium Or »",
      "Mise en avant page d'accueil",
      "Photos illimitées + vidéo",
      "Statistiques avancées + export PDF",
      "Support prioritaire 7j/7",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: 1 },
  },
];

// §8.2 — Offres professionnelles Vente (abonnement mensuel, sans engagement).
// ⚠ Grille publique 49/89/149 conservée provisoirement : la grille VERROUILLÉE
// Vente Pro (Partie A §1) était une IMAGE non transcrite → en attente des montants exacts.
// Les dépassements d'annonces sont FACTURÉS (jamais bloqués) : voir overageEur.
export const PRO_PLANS: Plan[] = [
  {
    code: "pro_start",
    label: "Pro Start",
    audience: "pro",
    category: "pro_vente",
    priceEur: 49,
    recurring: true,
    overageEur: 12,
    features: [
      "20 annonces actives",
      "Badge « PRO »",
      "Statistiques mensuelles",
      "Page vitrine garage",
      "Support email sous 48 h",
      "Dépassement facturé +12 €/annonce (jamais bloqué)",
    ],
    quotas: { maxAnnonces: 20, maxPhotos: 15, maxVideos: 1 },
  },
  {
    code: "pro_premium",
    label: "Pro Premium",
    audience: "pro",
    category: "pro_vente",
    priceEur: 89,
    recurring: true,
    highlight: true,
    overageEur: 15,
    features: [
      "50 annonces actives",
      "Mise en avant auto des nouvelles annonces (24 h)",
      "Statistiques temps réel",
      "Multi-utilisateurs (3 comptes)",
      "Export comptable mensuel",
      "Support téléphone + email prioritaire",
      "Dépassement facturé +15 €/annonce",
    ],
    quotas: { maxAnnonces: 50, maxPhotos: 20, maxVideos: 3 },
  },
  {
    code: "pro_elite",
    label: "Pro Elite",
    audience: "pro",
    category: "pro_vente",
    priceEur: 149,
    recurring: true,
    overageEur: 18,
    features: [
      "120 annonces actives",
      "Top placement permanent (badge or)",
      "Multi-utilisateurs illimités",
      "Accès API (synchro stock)",
      "Account manager dédié",
      "Reporting hebdo + mise en avant homepage",
      "Dépassement facturé +18 €/annonce",
    ],
    quotas: { maxAnnonces: 120, maxPhotos: null, maxVideos: null },
  },
  {
    code: "pro_max",
    label: "Pro Max",
    audience: "pro",
    category: "pro_vente",
    priceEur: 249,
    recurring: true,
    overageEur: 22,
    features: [
      "Annonces illimitées",
      "Tout Elite",
      "Priorité maximale",
      "Dépassement facturé +22 €/annonce",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
];

// §8.3 — Franchise
export const FRANCHISE_PLAN: Plan = {
  code: "franchise",
  label: "Franchise MKA.P-MS",
  audience: "franchise",
  category: "franchise",
  priceEur: 199,
  recurring: true,
  features: [
    "Utilisation exclusive de la marque MKA.P-MS Auto Plus Africa",
    "Vitrine garage premium",
    "Accès complet aux outils Garage+ (devis, agenda, stock, employés, facturation)",
    "Formation initiale incluse",
    "Référencement prioritaire",
    "Support technique dédié + outils marketing",
  ],
  quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
};

const q = (maxAnnonces: number | null): PlanQuotas => ({ maxAnnonces, maxPhotos: null, maxVideos: null });

// Garage+ Pro — paliers (parcours §3).
export const GARAGE_PLANS: Plan[] = [
  {
    code: "garage_start",
    label: "Garage Start",
    audience: "pro",
    category: "garage",
    priceEur: 29,
    recurring: true,
    features: [
      "Fiche garage référencée",
      "Devis en ligne",
      "Agenda RDV",
      "3 employés",
      "100 devis/mois",
      "Support standard",
    ],
    quotas: q(null),
  },
  {
    code: "garage_premium",
    label: "Garage Premium",
    audience: "pro",
    category: "garage",
    priceEur: 59,
    recurring: true,
    highlight: true,
    features: [
      "Tout Start inclus",
      "Gestion atelier complète",
      "Gestion stock pièces",
      "Gestion employés",
      "Photos avant/après travaux",
      "Devis illimités",
      "Factures automatiques",
      "Statistiques détaillées",
      "Suivi intervention temps réel",
      "Notifications client automatiques",
    ],
    quotas: q(null),
  },
  {
    code: "garage_elite",
    label: "Garage Elite",
    audience: "pro",
    category: "garage",
    priceEur: 99,
    recurring: true,
    features: [
      "Tout Premium inclus",
      "Multi-ateliers",
      "Catalogue technique AutoData",
      "Couples de serrage & temps barémés",
      "Gestion flotte clients",
      "Historique véhicules complet",
      "Signature électronique",
      "Ordres de réparation complets",
      "Stock magasin avancé",
      "Priorité dans les résultats",
      "Support prioritaire",
    ],
    quotas: q(null),
  },
  {
    code: "garage_ultimate",
    label: "Garage Ultimate",
    audience: "pro",
    category: "garage",
    priceEur: 149,
    recurring: true,
    features: [
      "Tout Elite inclus",
      "Comptabilité intégrée",
      "Gestion complète du personnel",
      "Productivité employés",
      "Commande fournisseur automatique",
      "Alertes rupture de stock",
      "IA assistance atelier",
      "API fournisseurs",
      "Journal d'activité complet",
      "Accès modules futurs en avant-première",
    ],
    quotas: q(null),
  },
];

// Location Pro — grille Partie 6 (5 paliers, HT). Commission 3 % (grandes flottes 2–2,5 %).
// La location particulier est prévue mais désactivée au lancement (module masqué).
export const LOCATION_PLANS: Plan[] = [
  { code: "loc_start", label: "Location Start", audience: "pro", category: "location", priceEur: 29.99, recurring: true, features: ["10 véhicules actifs", "20 photos", "Calendrier de disponibilité", "Messagerie", "Badge LOCATION PRO"], quotas: { maxAnnonces: 10, maxPhotos: 20, maxVideos: 0 } },
  { code: "loc_premium", label: "Location Premium", audience: "pro", category: "location", priceEur: 69.99, recurring: true, highlight: true, features: ["30 véhicules actifs", "30 photos", "2 vidéos", "Priorité recherche", "Statistiques"], quotas: { maxAnnonces: 30, maxPhotos: 30, maxVideos: 2 } },
  { code: "loc_elite", label: "Location Elite", audience: "pro", category: "location", priceEur: 99.99, recurring: true, features: ["50 véhicules actifs", "40 photos", "3 vidéos", "Gestion d'équipe"], quotas: { maxAnnonces: 50, maxPhotos: 40, maxVideos: 3 } },
  { code: "loc_max", label: "Location Max", audience: "pro", category: "location", priceEur: 159.99, recurring: true, features: ["120 véhicules actifs", "56 photos", "5 vidéos", "Multi-utilisateurs"], quotas: { maxAnnonces: 120, maxPhotos: 56, maxVideos: 5 } },
  { code: "loc_ultimate", label: "Location Ultimate", audience: "pro", category: "location", priceEur: 249.99, recurring: true, commissionPct: 3, features: ["250 véhicules actifs", "Photos illimitées", "8 vidéos", "Multi-agences", "Commission réduite (grandes flottes)"], quotas: { maxAnnonces: 250, maxPhotos: null, maxVideos: 8 } },
];

// VTC / TAXI — paliers (grille VERROUILLÉE, Partie A §1). Commission 3 %.
export const VTC_TAXI_PLANS: Plan[] = [
  { code: "vtc_start", label: "VTC/TAXI Start", audience: "pro", category: "vtc_taxi", priceEur: 49.99, recurring: true, features: ["Jusqu'à 5 véhicules", "Gestion chauffeurs", "Réservations"], quotas: q(5) },
  { code: "vtc_premium", label: "VTC/TAXI Premium", audience: "pro", category: "vtc_taxi", priceEur: 99.99, recurring: true, highlight: true, features: ["Jusqu'à 20 véhicules", "Tout Start", "Flotte étendue"], quotas: q(20) },
  { code: "vtc_elite", label: "VTC/TAXI Elite", audience: "pro", category: "vtc_taxi", priceEur: 159.99, recurring: true, features: ["Jusqu'à 50 véhicules", "Tout Premium", "Priorité"], quotas: q(50) },
  { code: "vtc_max", label: "VTC / Taxi Max", audience: "pro", category: "vtc_taxi", priceEur: 249.99, recurring: true, commissionPct: 3, features: ["Jusqu'à 120 véhicules", "Tout Elite", "Multi-sociétés"], quotas: q(120) },
];

// Pièces Auto — Boutique + Gestion Stock (parcours §6, prix communiqués).
export const PIECES_PLANS: Plan[] = [
  { code: "pieces_boutique", label: "Boutique seule", audience: "pro", category: "pieces", priceEur: 14.9, recurring: true, commissionPct: 5, features: ["Boutique en ligne", "Logo, horaires, GPS", "WhatsApp & avis", "Commission 5 %"], quotas: q(null) },
  { code: "pieces_stock_start", label: "Boutique + Stock Start", audience: "pro", category: "pieces", priceEur: 29.9, recurring: true, commissionPct: 3, features: ["Boutique", "Gestion stock", "Références OEM", "Commission 3 %"], quotas: q(null) },
  { code: "pieces_stock_premium", label: "Boutique + Stock Premium", audience: "pro", category: "pieces", priceEur: 49.9, recurring: true, highlight: true, commissionPct: 3, features: ["Tout Start", "Compatibilités", "Factures", "Commission 3 %"], quotas: q(null) },
  { code: "pieces_stock_elite", label: "Boutique + Stock Elite", audience: "pro", category: "pieces", priceEur: 79.9, recurring: true, commissionPct: 1.5, features: ["Tout Premium", "Commission optimisée 1,5 %"], quotas: q(null) },
  { code: "pieces_stock_max", label: "Boutique + Stock Max", audience: "pro", category: "pieces", priceEur: 119.9, recurring: true, commissionPct: 1.5, features: ["Tout Elite", "Volume illimité", "Commission 1,5 %"], quotas: q(null) },
];

// Livraison — Moto/Scooter & Utilitaire (parcours §7, prix communiqués).
export const LIVRAISON_PLANS: Plan[] = [
  { code: "livraison_moto_start", label: "Livraison Moto Start", audience: "pro", category: "livraison", priceEur: 14.99, recurring: true, features: ["Missions moto/scooter", "Itinéraire"], quotas: q(null) },
  { code: "livraison_moto_premium", label: "Livraison Moto Premium", audience: "pro", category: "livraison", priceEur: 19.99, recurring: true, highlight: true, features: ["Tout Start", "Priorité missions"], quotas: q(null) },
  { code: "livraison_moto_elite", label: "Livraison Moto Elite", audience: "pro", category: "livraison", priceEur: 39.99, recurring: true, features: ["Tout Premium", "Zone étendue"], quotas: q(null) },
  { code: "livraison_util_start", label: "Livraison Utilitaire Start", audience: "pro", category: "livraison", priceEur: 49.99, recurring: true, features: ["Missions utilitaire", "Poids & dimensions"], quotas: q(null) },
  { code: "livraison_util_premium", label: "Livraison Utilitaire Premium", audience: "pro", category: "livraison", priceEur: 99.99, recurring: true, features: ["Tout Start", "Volume étendu"], quotas: q(null) },
  { code: "livraison_util_elite", label: "Livraison Utilitaire Elite", audience: "pro", category: "livraison", priceEur: 159.99, recurring: true, features: ["Tout Premium", "Priorité"], quotas: q(null) },
  { code: "livraison_util_max", label: "Livraison Utilitaire Max", audience: "pro", category: "livraison", priceEur: 199.99, recurring: true, features: ["Tout Elite", "Flotte illimitée"], quotas: q(null) },
];

// §8.VO — Abonnements VO (Véhicules d'Occasion)
export const VO_PLANS: Plan[] = [
  {
    code: "vo_start", label: "VO Start", audience: "pro", category: "vo",
    priceEur: 29, recurring: true,
    features: [
      "Jusqu'à 10 véhicules",
      "Annonces illimitées",
      "Photos illimitées",
      "Messagerie clients",
      "Favoris",
      "Tableau de bord simple",
      "Statistiques de base",
    ],
    quotas: q(10),
  },
  {
    code: "vo_premium", label: "VO Premium", audience: "pro", category: "vo",
    priceEur: 59, recurring: true, highlight: true,
    features: [
      "Jusqu'à 50 véhicules",
      "Tout Start inclus",
      "Gestion stock VO",
      "Réservations",
      "Acomptes",
      "Historique des ventes",
      "Dossier véhicule complet",
      "Boost annonces",
      "Priorité recherche",
    ],
    quotas: q(50),
  },
  {
    code: "vo_elite", label: "VO Elite", audience: "pro", category: "vo",
    priceEur: 99, recurring: true,
    features: [
      "Jusqu'à 150 véhicules",
      "Tout Premium inclus",
      "Gestion employés",
      "Gestion parc automobile",
      "Multi-utilisateurs",
      "Rapports avancés",
      "Signature électronique",
      "Gestion documents",
    ],
    quotas: q(150),
  },
  {
    code: "vo_business", label: "VO Business", audience: "pro", category: "vo",
    priceEur: 199, recurring: true,
    features: [
      "Véhicules illimités",
      "Tout Elite inclus",
      "Multi-sites",
      "Multi-agences",
      "Comptabilité avancée",
      "API partenaires",
      "Reporting complet",
      "Support prioritaire 7j/7",
    ],
    quotas: q(null),
  },
];

// Modules optionnels VO
export const VO_MODULES: Plan[] = [
  {
    code: "vo_mod_encheres", label: "Module Enchères Pro", audience: "pro", category: "vo",
    priceEur: 19, recurring: true,
    features: [
      "Accès aux enchères MKA.P-MS",
      "Participation aux enchères",
      "Notifications nouvelles enchères",
      "Historique enchères",
      "Dépôt d'offres",
      "Réservé aux comptes validés",
    ],
    quotas: q(null),
  },
  {
    code: "vo_mod_historique", label: "Module Historique Véhicule", audience: "pro", category: "vo",
    priceEur: 9, recurring: true,
    features: [
      "Rapports kilométrage",
      "Historique entretien",
      "Contrôles techniques",
      "Sinistres",
    ],
    quotas: q(null),
  },
  {
    code: "vo_mod_cg", label: "Module Carte Grise", audience: "pro", category: "vo",
    priceEur: 19, recurring: true,
    features: [
      "Dossiers administratifs",
      "Suivi ANTS",
      "Signature documents",
      "Archivage automatique",
    ],
    quotas: q(null),
  },
];

// §8.9 — Abonnements Dépanneur professionnel
const dq = (m: number | null): PlanQuotas => ({ maxAnnonces: m, maxPhotos: null, maxVideos: null });
export const DEPANNAGE_PLANS: Plan[] = [
  {
    code: "depannage_start", label: "Dépannage Start", audience: "pro", category: "depannage",
    priceEur: 29, recurring: true,
    features: [
      "Jusqu'à 20 missions/mois",
      "Tableau de bord dépanneur",
      "Réception missions automatique",
      "GPS intégré",
      "Messagerie clients",
      "Facturation automatique",
    ],
    quotas: dq(20),
  },
  {
    code: "depannage_premium", label: "Dépannage Premium", audience: "pro", category: "depannage",
    priceEur: 59, recurring: true, highlight: true,
    features: [
      "Jusqu'à 100 missions/mois",
      "Tout Start",
      "Priorité d'affichage",
      "Statistiques avancées",
      "Avis clients mis en avant",
      "Badge Premium dépanneur",
      "Support prioritaire",
    ],
    quotas: dq(100),
  },
  {
    code: "depannage_elite", label: "Dépannage Elite", audience: "pro", category: "depannage",
    priceEur: 99, recurring: true,
    features: [
      "Missions illimitées",
      "Tout Premium",
      "Priorité absolue d'affichage",
      "Multi-véhicules",
      "Rapports mensuels avancés",
      "Signature électronique",
      "Gestion documents automatisée",
    ],
    quotas: dq(null),
  },
  {
    code: "depannage_business", label: "Dépannage Business", audience: "pro", category: "depannage",
    priceEur: 199, recurring: true,
    features: [
      "Missions illimitées",
      "Tout Elite",
      "Flotte complète",
      "Multi-conducteurs",
      "Multi-véhicules illimités",
      "Comptabilité intégrée",
      "API partenaires",
      "Support dédié 7j/7",
    ],
    quotas: dq(null),
  },
];

// Enchères Pro — accès aux enchères professionnelles MKA.P-MS
export const ENCHERES_PLANS: Plan[] = [
  {
    code: "encheres_acces", label: "Accès Enchères", audience: "pro", category: "encheres",
    priceEur: 19, recurring: true,
    features: [
      "Accès aux enchères MKA.P-MS",
      "Participation illimitée",
      "Notifications nouvelles enchères",
      "Historique des enchères",
      "Dépôt d'offres",
      "Réservé aux comptes pro validés",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "encheres_premium", label: "Enchères Premium", audience: "pro", category: "encheres",
    priceEur: 49, recurring: true, highlight: true,
    features: [
      "Tout Accès inclus",
      "Surenchère automatique",
      "Alertes personnalisées",
      "Accès prioritaire nouveaux lots",
      "Rapport véhicule détaillé inclus",
      "Historique complet des offres",
      "Support prioritaire",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "encheres_elite", label: "Enchères Elite", audience: "pro", category: "encheres",
    priceEur: 99, recurring: true,
    features: [
      "Tout Premium inclus",
      "Accès avant-première aux lots",
      "Négociation directe possible",
      "Livraison organisée par MKA.P-MS",
      "Factures et documents automatisés",
      "Gestionnaire dédié",
      "Multi-utilisateurs",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
];

// Comptabilité — abonnements pour agences comptables
export const COMPTABILITE_PLANS: Plan[] = [
  {
    code: "compta_start", label: "Comptabilité Start", audience: "pro", category: "comptabilite",
    priceEur: 29, recurring: true,
    features: [
      "Fiche agence référencée",
      "Jusqu'à 20 clients",
      "Tableau de bord basique",
      "Messagerie clients",
      "Badge Comptable",
    ],
    quotas: { maxAnnonces: 20, maxPhotos: null, maxVideos: null },
  },
  {
    code: "compta_premium", label: "Comptabilité Premium", audience: "pro", category: "comptabilite",
    priceEur: 59, recurring: true, highlight: true,
    features: [
      "Tout Start inclus",
      "Jusqu'à 100 clients",
      "Gestion documents",
      "Facturation automatique",
      "Statistiques avancées",
      "Priorité recherche",
      "Support prioritaire",
    ],
    quotas: { maxAnnonces: 100, maxPhotos: null, maxVideos: null },
  },
  {
    code: "compta_elite", label: "Comptabilité Elite", audience: "pro", category: "comptabilite",
    priceEur: 99, recurring: true,
    features: [
      "Tout Premium inclus",
      "Clients illimités",
      "Multi-collaborateurs",
      "API partenaires",
      "Comptabilité intégrée",
      "Gestionnaire dédié",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
];

// Carrosserie Pro — abonnements carrossiers
export const CARROSSERIE_PLANS: Plan[] = [
  {
    code: "carrosserie_start", label: "Carrosserie Start", audience: "pro", category: "carrosserie",
    priceEur: 29, recurring: true,
    features: [
      "Fiche carrossier référencée",
      "Devis en ligne",
      "Photos avant/après",
      "Agenda RDV",
      "Badge Carrossier",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "carrosserie_premium", label: "Carrosserie Premium", audience: "pro", category: "carrosserie",
    priceEur: 59, recurring: true, highlight: true,
    features: [
      "Tout Start inclus",
      "Devis illimités",
      "Gestion atelier",
      "Suivi réparations",
      "Factures automatiques",
      "Statistiques",
      "Priorité recherche",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "carrosserie_elite", label: "Carrosserie Elite", audience: "pro", category: "carrosserie",
    priceEur: 99, recurring: true,
    features: [
      "Tout Premium inclus",
      "Multi-ateliers",
      "Employés illimités",
      "Accès enchères carrosserie",
      "Gestionnaire dédié",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
];

// Atelier Pro — gestion atelier (indépendant de AutoData)
export const ATELIER_PRO_PLANS: Plan[] = [
  {
    code: "atelier_start", label: "Atelier Start", audience: "pro", category: "atelier_pro",
    priceEur: 9.9, recurring: true,
    features: [
      "Agenda atelier",
      "Devis",
      "Ordres de réparation",
      "Réception véhicule",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "atelier_premium", label: "Atelier Premium", audience: "pro", category: "atelier_pro",
    priceEur: 29.9, recurring: true, highlight: true,
    features: [
      "Tout Start inclus",
      "Gestion employés",
      "Suivi intervention temps réel",
      "Facturation automatique",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "atelier_elite", label: "Atelier Elite", audience: "pro", category: "atelier_pro",
    priceEur: 49.9, recurring: true,
    features: [
      "Tout Premium inclus",
      "Gestion stock magasin",
      "Commande fournisseurs",
      "Alertes rupture de stock",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "atelier_ultimate", label: "Atelier Ultimate", audience: "pro", category: "atelier_pro",
    priceEur: 79.9, recurring: true,
    features: [
      "Tout Elite inclus",
      "Productivité employés",
      "Reporting avancé",
      "Automatisation avancée",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
];

// Catalogue Technique / AutoData — données techniques véhicules (indépendant de Atelier)
export const AUTODATA_PLANS: Plan[] = [
  {
    code: "autodata_basic", label: "AutoData Basic", audience: "pro", category: "autodata",
    priceEur: 9.9, recurring: true,
    features: [
      "Recherche par plaque",
      "Recherche par VIN",
      "Informations véhicule",
      "Capacités huile",
      "Capacités liquides",
      "Couples de serrage principaux",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "autodata_premium", label: "AutoData Premium", audience: "pro", category: "autodata",
    priceEur: 29.9, recurring: true, highlight: true,
    features: [
      "Tout Basic inclus",
      "Schémas techniques",
      "Temps barémés",
      "Références constructeur",
      "Outils spécifiques par intervention",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
  {
    code: "autodata_pro", label: "AutoData Pro", audience: "pro", category: "autodata",
    priceEur: 49.9, recurring: true,
    features: [
      "Tout Premium inclus",
      "Catalogue complet tous systèmes",
      "Véhicules légers + Utilitaires",
      "Motos + Quads",
      "Camions",
      "Support prioritaire",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
];

// Pack Complet Atelier + AutoData (tarif préférentiel)
export const PACK_ATELIER_AUTODATA: Plan = {
  code: "pack_atelier_autodata", label: "Pack Atelier Pro + AutoData", audience: "pro", category: "atelier_pro",
  priceEur: 79.9, recurring: true,
  features: [
    "Atelier Ultimate complet",
    "AutoData Pro complet",
    "Tarif préférentiel (129,80 € → 79,90 €)",
    "Économie de 49,90 €/mois",
  ],
  quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
};

// Publicités — espaces publicitaires sur la plateforme
export interface AdPlacement {
  code: string;
  label: string;
  emplacement: string;
  priceEur: number;
  recurring: boolean;
}

export const AD_PLACEMENTS: AdPlacement[] = [
  { code: "ad_accueil_haut", label: "Bannière Accueil Haut", emplacement: "Page d'accueil — position haute", priceEur: 99, recurring: true },
  { code: "ad_accueil_milieu", label: "Bannière Accueil Milieu", emplacement: "Page d'accueil — position milieu", priceEur: 69, recurring: true },
  { code: "ad_accueil_bas", label: "Bannière Accueil Bas", emplacement: "Page d'accueil — position basse", priceEur: 49, recurring: true },
  { code: "ad_recherche", label: "Résultats Recherche", emplacement: "Pages de résultats de recherche", priceEur: 79, recurring: true },
  { code: "ad_produit", label: "Page Produit", emplacement: "Pages détail d'un véhicule", priceEur: 39, recurring: true },
  { code: "ad_sidebar", label: "Sidebar", emplacement: "Barre latérale (toutes pages)", priceEur: 29, recurring: true },
  { code: "ad_liste", label: "Insertion Liste", emplacement: "Dans les listes d'annonces", priceEur: 19, recurring: true },
];

export const AD_PACKS: Plan[] = [
  {
    code: "ad_pack_bronze", label: "Pack Bronze", audience: "pro", category: "publicite",
    priceEur: 99, recurring: true,
    features: [
      "3 emplacements publicitaires au choix",
      "Statistiques de vues",
      "Durée 30 jours",
    ],
    quotas: { maxAnnonces: 3, maxPhotos: null, maxVideos: null },
  },
  {
    code: "ad_pack_silver", label: "Pack Silver", audience: "pro", category: "publicite",
    priceEur: 199, recurring: true, highlight: true,
    features: [
      "5 emplacements publicitaires au choix",
      "Statistiques détaillées (vues, clics)",
      "Priorité d'affichage",
      "Durée 30 jours",
    ],
    quotas: { maxAnnonces: 5, maxPhotos: null, maxVideos: null },
  },
  {
    code: "ad_pack_gold", label: "Pack Gold", audience: "pro", category: "publicite",
    priceEur: 349, recurring: true,
    features: [
      "Tous les emplacements",
      "Priorité maximale d'affichage",
      "Statistiques détaillées + export",
      "Durée 30 jours",
      "Support publicitaire dédié",
    ],
    quotas: { maxAnnonces: null, maxPhotos: null, maxVideos: null },
  },
];

export const ALL_PLANS: Plan[] = [
  ...PARTICULIER_PLANS,
  ...PRO_PLANS,
  ...GARAGE_PLANS,
  ...LOCATION_PLANS,
  ...VTC_TAXI_PLANS,
  ...PIECES_PLANS,
  ...LIVRAISON_PLANS,
  ...VO_PLANS,
  ...VO_MODULES,
  ...DEPANNAGE_PLANS,
  ...ENCHERES_PLANS,
  ...COMPTABILITE_PLANS,
  ...CARROSSERIE_PLANS,
  ...ATELIER_PRO_PLANS,
  PACK_ATELIER_AUTODATA,
  ...AUTODATA_PLANS,
  ...AD_PACKS,
  FRANCHISE_PLAN,
];

// Libellés des catégories (profils) pour l'affichage groupé.
export const PLAN_CATEGORY_LABELS: Record<PlanCategory, string> = {
  particulier: "Particulier — Boost à l'unité",
  pro_vente: "Professionnel Vente",
  garage: "Garage+ Pro",
  location: "Société de location",
  vtc_taxi: "VTC / TAXI",
  pieces: "Boutique Pièces Auto",
  livraison: "Livraison",
  vo: "VO — Véhicules d'Occasion",
  depannage: "Dépannage / Assistance",
  franchise: "Franchise MKA.P-MS",
  encheres: "Enchères Pro",
  comptabilite: "Comptabilité",
  carrosserie: "Carrosserie Pro",
  atelier_pro: "Atelier Pro",
  autodata: "Catalogue Technique / AutoData",
  publicite: "Publicité",
};

export function getPlansByCategory(category: PlanCategory): Plan[] {
  return ALL_PLANS.filter((p) => p.category === category);
}

export function getPlan(code: string): Plan | undefined {
  return ALL_PLANS.find((p) => p.code === code);
}

// §4.5 — Paliers d'acompte de réservation
export const ACOMPTE_PALIERS = [250, 500, 1000, 1500] as const;
export type AcomptePalier = (typeof ACOMPTE_PALIERS)[number];
