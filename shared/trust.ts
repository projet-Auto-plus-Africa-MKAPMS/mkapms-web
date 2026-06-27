// Indice de Confiance MKA.P-MS (Partie 5 §4) — calcul transparent et déterministe.
// Utilisé côté client (fiche véhicule) et exposé côté serveur si besoin.

export interface TrustInput {
  vendeurProfessionnel: boolean;
  vendeurVerifie?: boolean; // KYC validé
  rating?: number; // note moyenne /5
  reviewCount?: number;
  photosCount: number;
  hasDescription: boolean;
  hasLocalisation: boolean;
  hasContact: boolean;
  hasHistorique?: boolean; // rapport d'historique disponible
}

export interface TrustBadge {
  code: string;
  label: string;
}

export interface TrustResult {
  score: number; // 0..100
  niveau: "excellent" | "bon" | "moyen" | "a_verifier";
  badges: TrustBadge[];
}

export function computeTrustScore(i: TrustInput): TrustResult {
  let score = 0;
  const badges: TrustBadge[] = [];

  // Vendeur
  if (i.vendeurProfessionnel) {
    score += 22;
    badges.push({ code: "pro", label: "Vendeur professionnel" });
  } else {
    score += 6;
  }
  if (i.vendeurVerifie) {
    score += 12;
    badges.push({ code: "verifie", label: "Vendeur vérifié" });
  }

  // Avis
  const rating = i.rating ?? 0;
  const reviews = i.reviewCount ?? 0;
  if (reviews >= 5 && rating >= 4.5) {
    score += 20;
    badges.push({ code: "bien_note", label: "Très bien noté" });
  } else if (reviews > 0) {
    score += 10;
  }

  // Photos
  if (i.photosCount >= 6) {
    score += 18;
    badges.push({ code: "photos", label: "Photos détaillées" });
  } else if (i.photosCount >= 3) {
    score += 10;
  }

  // Complétude de l'annonce
  if (i.hasDescription) score += 8;
  if (i.hasLocalisation) score += 5;
  if (i.hasContact) score += 5;

  // Historique
  if (i.hasHistorique) {
    score += 10;
    badges.push({ code: "historique", label: "Historique disponible" });
  }

  // Toujours : paiement sécurisé via la plateforme
  badges.push({ code: "paiement", label: "Paiement sécurisé" });

  score = Math.max(0, Math.min(100, Math.round(score)));
  const niveau =
    score >= 80 ? "excellent" : score >= 60 ? "bon" : score >= 40 ? "moyen" : "a_verifier";
  return { score, niveau, badges };
}

export const TRUST_LEVEL_LABEL: Record<TrustResult["niveau"], string> = {
  excellent: "Confiance excellente",
  bon: "Bonne confiance",
  moyen: "Confiance moyenne",
  a_verifier: "À vérifier",
};
