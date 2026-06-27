// MKA.P-MS — Système de badges officiels
// Chaque badge est attribué automatiquement selon le compte, l'abonnement, le statut du véhicule.
// Maximum 3 badges affichés simultanément, classés par priorité.

export interface Badge {
  code: string;
  label: string;
  color: string;       // Tailwind bg class
  textColor: string;   // Tailwind text class
  borderColor?: string;
  priority: number;    // Lower = higher priority (1 = most important)
  category: "mkapms" | "abonnement" | "vendeur" | "annonce" | "location" | "historique";
}

/* ── BADGES MKA.P-MS ── */
export const BADGE_MKAPMS_OFFICIEL: Badge = {
  code: "mkapms_officiel", label: "MKA.P-MS OFFICIEL",
  color: "bg-[#111]", textColor: "text-[#D4AF37]", borderColor: "border-[#D4AF37]",
  priority: 1, category: "mkapms",
};
export const BADGE_STOCK_OFFICIEL: Badge = {
  code: "stock_officiel", label: "STOCK OFFICIEL",
  color: "bg-[#D4AF37]", textColor: "text-white",
  priority: 2, category: "mkapms",
};
export const BADGE_CERTIFIE: Badge = {
  code: "certifie", label: "CERTIFIÉ",
  color: "bg-emerald-600", textColor: "text-white", borderColor: "border-[#D4AF37]",
  priority: 3, category: "mkapms",
};

/* ── BADGES ABONNEMENTS ── */
export const BADGE_ENTERPRISE: Badge = {
  code: "enterprise", label: "ENTERPRISE",
  color: "bg-gradient-to-r from-[#D4AF37] to-[#C5A028]", textColor: "text-white",
  priority: 4, category: "abonnement",
};
export const BADGE_BUSINESS: Badge = {
  code: "business", label: "BUSINESS",
  color: "bg-[#111]", textColor: "text-[#D4AF37]", borderColor: "border-[#D4AF37]",
  priority: 5, category: "abonnement",
};
export const BADGE_ELITE: Badge = {
  code: "elite", label: "ELITE",
  color: "bg-[#111]", textColor: "text-white", borderColor: "border-[#D4AF37]",
  priority: 6, category: "abonnement",
};
export const BADGE_PREMIUM: Badge = {
  code: "premium", label: "PREMIUM",
  color: "bg-[#D4AF37]", textColor: "text-[#111]",
  priority: 7, category: "abonnement",
};
export const BADGE_START: Badge = {
  code: "start", label: "START",
  color: "bg-slate-300", textColor: "text-slate-700",
  priority: 8, category: "abonnement",
};

/* ── BADGES VENDEURS ── */
export const BADGE_PRO_RECOMMANDE: Badge = {
  code: "pro_recommande", label: "PRO RECOMMANDÉ MKA.P-MS",
  color: "bg-emerald-700", textColor: "text-white", borderColor: "border-[#D4AF37]",
  priority: 9, category: "vendeur",
};
export const BADGE_SOCIETE_VERIFIEE: Badge = {
  code: "societe_verifiee", label: "SOCIÉTÉ VÉRIFIÉE",
  color: "bg-blue-700", textColor: "text-white",
  priority: 10, category: "vendeur",
};
export const BADGE_GARAGE_VERIFIE: Badge = {
  code: "garage_verifie", label: "GARAGE VÉRIFIÉ",
  color: "bg-blue-600", textColor: "text-white",
  priority: 11, category: "vendeur",
};
export const BADGE_VENDEUR_PRO: Badge = {
  code: "vendeur_pro", label: "VENDEUR PRO",
  color: "bg-blue-800", textColor: "text-white",
  priority: 12, category: "vendeur",
};
export const BADGE_PARTICULIER: Badge = {
  code: "particulier", label: "PARTICULIER",
  color: "bg-slate-200", textColor: "text-slate-600",
  priority: 20, category: "vendeur",
};

/* ── BADGES ANNONCES ── */
export const BADGE_URGENT: Badge = {
  code: "urgent", label: "URGENT",
  color: "bg-red-600", textColor: "text-white",
  priority: 13, category: "annonce",
};
export const BADGE_NOUVEAU: Badge = {
  code: "nouveau", label: "NOUVEAU",
  color: "bg-emerald-500", textColor: "text-white",
  priority: 14, category: "annonce",
};
export const BADGE_COUP_DE_COEUR: Badge = {
  code: "coup_de_coeur", label: "COUP DE CŒUR",
  color: "bg-pink-500", textColor: "text-white",
  priority: 15, category: "annonce",
};
export const BADGE_PRIX_EN_BAISSE: Badge = {
  code: "prix_en_baisse", label: "PRIX EN BAISSE",
  color: "bg-orange-500", textColor: "text-white",
  priority: 16, category: "annonce",
};
export const BADGE_RESERVE: Badge = {
  code: "reserve", label: "RÉSERVÉ",
  color: "bg-orange-700", textColor: "text-white",
  priority: 17, category: "annonce",
};
export const BADGE_VENDU: Badge = {
  code: "vendu", label: "VENDU",
  color: "bg-red-800", textColor: "text-white",
  priority: 18, category: "annonce",
};

/* ── BADGES LOCATION ── */
export const BADGE_LOCATION_PRO: Badge = {
  code: "location_pro", label: "LOCATION PRO",
  color: "bg-blue-800", textColor: "text-white",
  priority: 12, category: "location",
};
export const BADGE_VTC_TAXI: Badge = {
  code: "vtc_taxi", label: "VTC / TAXI",
  color: "bg-[#111]", textColor: "text-[#D4AF37]", borderColor: "border-[#D4AF37]",
  priority: 11, category: "location",
};
export const BADGE_DISPONIBLE: Badge = {
  code: "disponible", label: "DISPONIBLE",
  color: "bg-emerald-500", textColor: "text-white",
  priority: 14, category: "location",
};
export const BADGE_RESERVE_LOCATION: Badge = {
  code: "reserve_location", label: "RÉSERVÉ",
  color: "bg-orange-500", textColor: "text-white",
  priority: 17, category: "location",
};
export const BADGE_LOUE: Badge = {
  code: "loue", label: "LOUÉ",
  color: "bg-red-800", textColor: "text-white",
  priority: 18, category: "location",
};
export const BADGE_EN_ENTRETIEN: Badge = {
  code: "en_entretien", label: "EN ENTRETIEN",
  color: "bg-slate-600", textColor: "text-white",
  priority: 19, category: "location",
};
export const BADGE_LOA_DISPONIBLE: Badge = {
  code: "loa_disponible", label: "LOA DISPONIBLE",
  color: "bg-[#D4AF37]", textColor: "text-white",
  priority: 15, category: "location",
};
export const BADGE_PAIEMENT_FRACTIONNE: Badge = {
  code: "paiement_fractionne", label: "PAIEMENT EN PLUSIEURS FOIS",
  color: "bg-blue-600", textColor: "text-white",
  priority: 16, category: "location",
};

/* ── BADGES HISTORIQUE ── */
export const BADGE_HISTORIQUE_DISPONIBLE: Badge = {
  code: "historique_disponible", label: "HISTORIQUE DISPONIBLE",
  color: "bg-emerald-500", textColor: "text-white",
  priority: 19, category: "historique",
};
export const BADGE_HISTORIQUE_VERIFIE: Badge = {
  code: "historique_verifie", label: "HISTORIQUE VÉRIFIÉ",
  color: "bg-emerald-700", textColor: "text-white",
  priority: 18, category: "historique",
};

/* ── Calcul automatique des badges ── */
export const MAX_BADGES = 3;

export interface BadgeInput {
  id: number;
  vendeurType?: string | null;
  type?: string | null;              // "vente" | "location"
  status?: string | null;            // "publiee" | "vendue" | "reservee" | "archivee"
  boosted?: boolean | null;
  certified?: boolean | null;
  tier?: string | null;              // "elite" | "business" | "enterprise"
  planCode?: string | null;          // "start" | "premium" | "elite" | "business" | "enterprise"
  garageVerifie?: boolean | null;
  societeVerifiee?: boolean | null;
  urgent?: boolean | null;
  coupDeCoeur?: boolean | null;
  prixEnBaisse?: boolean | null;
  createdAt?: string | Date | null;
  historiqueDisponible?: boolean | null;
  historiqueVerifie?: boolean | null;
  loaDisponible?: boolean | null;
  paiementFractionne?: boolean | null;
  vendeurSales?: number | null;      // nombre de ventes
  vendeurRating?: number | null;     // note moyenne
  vendeurLitiges?: number | null;    // nombre de litiges graves
  segmentLocation?: string | null;
}

export function computeBadges(v: BadgeInput): Badge[] {
  const badges: Badge[] = [];

  // MKA.P-MS Officiel (IDs 8000-8005 = stock interne)
  if (v.id >= 8000 && v.id <= 8005) {
    badges.push(BADGE_MKAPMS_OFFICIEL);
    badges.push(BADGE_STOCK_OFFICIEL);
  }

  // Certifié
  if (v.certified) badges.push(BADGE_CERTIFIE);

  // Abonnement
  const plan = v.planCode || v.tier;
  if (plan === "enterprise") badges.push(BADGE_ENTERPRISE);
  else if (plan === "business") badges.push(BADGE_BUSINESS);
  else if (plan === "elite" || (v.boosted && v.vendeurType === "professionnel" && v.id >= 8000)) badges.push(BADGE_ELITE);
  else if (plan === "premium" || v.boosted) badges.push(BADGE_PREMIUM);
  else if (plan === "start") badges.push(BADGE_START);

  // PRO RECOMMANDÉ MKA.P-MS (50+ ventes, 4.5+/5, 0 litige grave)
  if (
    v.vendeurType === "professionnel" &&
    (v.vendeurSales ?? 0) >= 50 &&
    (v.vendeurRating ?? 0) >= 4.5 &&
    (v.vendeurLitiges ?? 0) === 0
  ) {
    badges.push(BADGE_PRO_RECOMMANDE);
  }

  // Vendeur
  if (v.societeVerifiee) badges.push(BADGE_SOCIETE_VERIFIEE);
  if (v.garageVerifie) badges.push(BADGE_GARAGE_VERIFIE);
  if (v.vendeurType === "professionnel" || v.vendeurType === "concession") {
    if (!badges.some((b) => b.category === "vendeur")) badges.push(BADGE_VENDEUR_PRO);
  } else if (v.vendeurType === "particulier" || !v.vendeurType) {
    if (!badges.some((b) => b.category === "vendeur")) badges.push(BADGE_PARTICULIER);
  }

  // Statut annonce
  if (v.status === "vendue") badges.push(BADGE_VENDU);
  else if (v.status === "reservee") badges.push(BADGE_RESERVE);
  if (v.urgent) badges.push(BADGE_URGENT);
  if (v.coupDeCoeur) badges.push(BADGE_COUP_DE_COEUR);
  if (v.prixEnBaisse) badges.push(BADGE_PRIX_EN_BAISSE);

  // Nouveau (< 7 jours)
  if (v.createdAt) {
    const created = new Date(v.createdAt);
    const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays <= 7) badges.push(BADGE_NOUVEAU);
  }

  // Location badges
  if (v.type === "location") {
    // Type de location
    if (v.segmentLocation === "vtc_taxi") badges.push(BADGE_VTC_TAXI);
    else if (v.vendeurType === "professionnel" || v.vendeurType === "concession") badges.push(BADGE_LOCATION_PRO);
    // Statut location
    if (v.status === "louee") badges.push(BADGE_LOUE);
    else if (v.status === "reservee") badges.push(BADGE_RESERVE_LOCATION);
    else if (v.status === "entretien") badges.push(BADGE_EN_ENTRETIEN);
    else if (v.status === "publiee" || !v.status) badges.push(BADGE_DISPONIBLE);
    if (v.loaDisponible) badges.push(BADGE_LOA_DISPONIBLE);
    if (v.paiementFractionne) badges.push(BADGE_PAIEMENT_FRACTIONNE);
  }

  // Historique
  if (v.historiqueVerifie) badges.push(BADGE_HISTORIQUE_VERIFIE);
  else if (v.historiqueDisponible) badges.push(BADGE_HISTORIQUE_DISPONIBLE);

  // Trier par priorité et limiter à MAX_BADGES
  badges.sort((a, b) => a.priority - b.priority);
  return badges.slice(0, MAX_BADGES);
}
