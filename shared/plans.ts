// Catalogue d'offres et de tarifs — source unique (cahier des charges §8).
// Partagé entre le frontend (affichage) et le backend (Stripe / quotas).

export type PlanAudience = "particulier" | "pro" | "franchise";

export interface PlanQuotas {
  maxAnnonces: number | null; // null = illimité
  maxPhotos: number | null;
  maxVideos: number | null;
}

export interface Plan {
  code: string;
  label: string;
  audience: PlanAudience;
  priceEur: number; // prix mensuel (pro/franchise) ou prix unitaire (boost particulier)
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

export const ALL_PLANS: Plan[] = [
  ...PARTICULIER_PLANS,
  ...PRO_PLANS,
  FRANCHISE_PLAN,
];

export function getPlan(code: string): Plan | undefined {
  return ALL_PLANS.find((p) => p.code === code);
}

// §4.5 — Paliers d'acompte de réservation
export const ACOMPTE_PALIERS = [250, 500, 1000, 1500] as const;
export type AcomptePalier = (typeof ACOMPTE_PALIERS)[number];
