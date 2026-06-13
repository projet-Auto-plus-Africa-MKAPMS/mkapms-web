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
  | "franchise";

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
}

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

// §8.2 — Offres professionnelles (abonnement mensuel)
export const PRO_PLANS: Plan[] = [
  {
    code: "pro_starter",
    label: "Pro Starter",
    audience: "pro",
    category: "pro_vente",
    priceEur: 49,
    recurring: true,
    features: [
      "20 annonces actives",
      "Badge « PRO »",
      "Statistiques mensuelles",
      "Page vitrine garage",
      "Support email sous 48 h",
    ],
    quotas: { maxAnnonces: 20, maxPhotos: 15, maxVideos: 1 },
  },
  {
    code: "pro_business",
    label: "Pro Business",
    audience: "pro",
    category: "pro_vente",
    priceEur: 89,
    recurring: true,
    highlight: true,
    features: [
      "50 annonces actives",
      "Mise en avant auto des nouvelles annonces (24 h)",
      "Statistiques temps réel",
      "Multi-utilisateurs (3 comptes)",
      "Export comptable mensuel",
      "Support téléphone + email prioritaire",
    ],
    quotas: { maxAnnonces: 50, maxPhotos: 20, maxVideos: 3 },
  },
  {
    code: "pro_premium",
    label: "Pro Premium",
    audience: "pro",
    category: "pro_vente",
    priceEur: 149,
    recurring: true,
    features: [
      "Annonces illimitées",
      "Top placement permanent (badge or)",
      "Multi-utilisateurs illimités",
      "Accès API (synchro stock)",
      "Account manager dédié",
      "Reporting hebdo + mise en avant homepage",
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

// Garage+ Pro — paliers (parcours §3). Grille tarifaire à confirmer par la Direction.
export const GARAGE_PLANS: Plan[] = [
  { code: "garage_start", label: "Garage Start", audience: "pro", category: "garage", priceEur: null, recurring: true, features: ["Fiche garage", "Devis & RDV", "Agenda"], quotas: q(null) },
  { code: "garage_premium", label: "Garage Premium", audience: "pro", category: "garage", priceEur: null, recurring: true, highlight: true, features: ["Tout Start", "Stock & atelier", "Employés"], quotas: q(null) },
  { code: "garage_elite", label: "Garage Elite", audience: "pro", category: "garage", priceEur: null, recurring: true, features: ["Tout Premium", "Facturation", "Priorité annuaire"], quotas: q(null) },
  { code: "garage_max", label: "Garage Max", audience: "pro", category: "garage", priceEur: null, recurring: true, features: ["Tout Elite", "Multi-établissements", "Support dédié"], quotas: q(null) },
];

// Location Pro — paliers (parcours §4). Grille à confirmer.
export const LOCATION_PLANS: Plan[] = [
  { code: "location_start", label: "Location Start", audience: "pro", category: "location", priceEur: null, recurring: true, features: ["Mise en location", "Contrats automatiques", "État des lieux"], quotas: q(null) },
  { code: "location_premium", label: "Location Premium", audience: "pro", category: "location", priceEur: null, recurring: true, highlight: true, features: ["Tout Start", "Flotte étendue", "Tarifs jour/sem/mois"], quotas: q(null) },
  { code: "location_elite", label: "Location Elite", audience: "pro", category: "location", priceEur: null, recurring: true, features: ["Tout Premium", "Caution & options", "Priorité"], quotas: q(null) },
  { code: "location_max", label: "Location Max", audience: "pro", category: "location", priceEur: null, recurring: true, features: ["Tout Elite", "Multi-agences"], quotas: q(null) },
  { code: "location_ultimate", label: "Location Ultimate", audience: "pro", category: "location", priceEur: null, recurring: true, features: ["Tout Max", "Flotte illimitée", "Support dédié"], quotas: q(null) },
];

// VTC / TAXI — paliers (parcours §5). Grille à confirmer.
export const VTC_TAXI_PLANS: Plan[] = [
  { code: "vtc_start", label: "VTC/TAXI Start", audience: "pro", category: "vtc_taxi", priceEur: null, recurring: true, features: ["Gestion chauffeurs", "Gestion véhicules"], quotas: q(null) },
  { code: "vtc_premium", label: "VTC/TAXI Premium", audience: "pro", category: "vtc_taxi", priceEur: null, recurring: true, highlight: true, features: ["Tout Start", "Flotte étendue", "Réservations"], quotas: q(null) },
  { code: "vtc_elite", label: "VTC/TAXI Elite", audience: "pro", category: "vtc_taxi", priceEur: null, recurring: true, features: ["Tout Premium", "Priorité"], quotas: q(null) },
  { code: "vtc_max", label: "VTC/TAXI Max", audience: "pro", category: "vtc_taxi", priceEur: null, recurring: true, features: ["Tout Elite", "Multi-sociétés"], quotas: q(null) },
];

// Pièces Auto — Boutique + Gestion Stock (parcours §6, prix communiqués).
export const PIECES_PLANS: Plan[] = [
  { code: "pieces_boutique", label: "Boutique seule", audience: "pro", category: "pieces", priceEur: 14.9, recurring: true, features: ["Boutique en ligne", "Logo, horaires, GPS", "WhatsApp & avis"], quotas: q(null) },
  { code: "pieces_stock_start", label: "Boutique + Stock Start", audience: "pro", category: "pieces", priceEur: 29.9, recurring: true, features: ["Boutique", "Gestion stock", "Références OEM"], quotas: q(null) },
  { code: "pieces_stock_premium", label: "Boutique + Stock Premium", audience: "pro", category: "pieces", priceEur: 49.9, recurring: true, highlight: true, features: ["Tout Start", "Compatibilités", "Factures"], quotas: q(null) },
  { code: "pieces_stock_elite", label: "Boutique + Stock Elite", audience: "pro", category: "pieces", priceEur: 79.9, recurring: true, features: ["Tout Premium", "Commission optimisée"], quotas: q(null) },
  { code: "pieces_stock_max", label: "Boutique + Stock Max", audience: "pro", category: "pieces", priceEur: 119.9, recurring: true, features: ["Tout Elite", "Volume illimité"], quotas: q(null) },
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

export const ALL_PLANS: Plan[] = [
  ...PARTICULIER_PLANS,
  ...PRO_PLANS,
  ...GARAGE_PLANS,
  ...LOCATION_PLANS,
  ...VTC_TAXI_PLANS,
  ...PIECES_PLANS,
  ...LIVRAISON_PLANS,
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
  franchise: "Franchise MKA.P-MS",
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
