/**
 * AL-HOUDOUD·M — Catalogue tarifaire recommandé (grille à valider par le PDG).
 *
 * Chaque ligne devient une ligne du registre central `payment_products`
 * (univers="ia") via seedIaCatalog() — jamais une table parallèle. Toutes les
 * lignes sont seedées `active: false` : rien n'est vendable publiquement tant
 * que le PDG ne les active pas une à une (ou en masse) depuis l'espace de
 * pilotage. Modifier un prix après seed ne passe plus par ce fichier : le PDG
 * édite la ligne en base via l'écran d'administration (upsertProduct), sans
 * toucher au code — ce fichier ne sert qu'à l'amorçage initial, idempotent.
 *
 * Unité de facturation : « unité AL-HOUDOUD·M ».
 * Coût réel mesuré (voir server/intelligences/provider.ts, TARIFS_TEXTE_CENTS_PAR_1000_JETONS,
 * modèle gpt-5.5, $5/$30 par million de jetons entrée/sortie, vérifié 17/10/2026) pour un
 * échange "profil moyen" (800 jetons entrée, 1200 sortie) ≈ 0,04 € — c'est la définition de
 * l'unité. Une opération plus lourde (code, long document) consomme plusieurs unités, mesurées
 * réellement après coup via af_cost_entries, jamais estimées à l'avance comme un forfait caché.
 */
import type { ProductSeed } from "../payment-engine/products.js";

/** Coût réel estimé par unité (profil moyen gpt-5.5) — voir en-tête de fichier. Jamais arrondi à 0. */
export const UNITE_COUT_REEL_EUR = 0.04;
/** Valeur d'une unité incluse dans un abonnement (tarif groupé, remisé vs la recharge seule). */
export const UNITE_PRIX_ABONNEMENT_EUR = 0.09;
/** Prix d'une unité achetée seule (recharge prépayée ou dépassement de quota). */
export const UNITE_PRIX_RECHARGE_EUR = 0.15;

export type IaAudience =
  | "decouverte"
  | "particulier"
  | "professionnel"
  | "developpeur"
  | "automobile"
  | "marchand"
  | "equipe"
  | "specialise";

export type IaKind = "decouverte" | "essai_gratuit" | "abonnement" | "credits";

export interface IaPlanMeta {
  audience: IaAudience;
  kind: IaKind;
  tier: string;
  periodiciteLabel: "hebdomadaire" | "mensuel" | "annuel" | "ponctuel";
  creditsInclus: number;
  overageEurParUnite: number | null;
  features: string[];
  seatBased?: boolean;
  /** Coût réel estimé si le quota est entièrement consommé (créditsInclus × coût réel/unité). */
  coutReelEstimeEur: number;
}

function withMeta(seed: Omit<ProductSeed, "metadata" | "active" | "univers">, meta: Omit<IaPlanMeta, "coutReelEstimeEur">): ProductSeed {
  return {
    ...seed,
    univers: "ia",
    active: false,
    metadata: { ...meta, coutReelEstimeEur: Math.round(meta.creditsInclus * UNITE_COUT_REEL_EUR * 100) / 100 },
  };
}

// ── Offre découverte & essai gratuit (distinctes des abonnements normaux) ──
const DECOUVERTE_ET_ESSAI: ProductSeed[] = [
  withMeta(
    { code: "ia_decouverte_3j", name: "AL-HOUDOUD·M — Découverte 3 jours", paymentCase: "ia_decouverte", price: 5.9, paymentType: "unique", validityDays: 3, refundPolicy: "Non remboursable : offre de découverte courte durée, prix symbolique." },
    { audience: "decouverte", kind: "decouverte", tier: "Découverte", periodiciteLabel: "ponctuel", creditsInclus: 25, overageEurParUnite: UNITE_PRIX_RECHARGE_EUR, features: ["Accès 3 jours aux fonctionnalités courantes (chat, rédaction, recherche)", "25 unités incluses", "Sans engagement, non reconductible automatiquement"] },
  ),
  withMeta(
    { code: "ia_essai_gratuit_3j", name: "AL-HOUDOUD·M — Essai gratuit 3 jours", paymentCase: "ia_essai_gratuit", price: 0, paymentType: "unique", validityDays: 3, refundPolicy: "Gratuit — une seule fois par compte." },
    { audience: "decouverte", kind: "essai_gratuit", tier: "Essai gratuit", periodiciteLabel: "ponctuel", creditsInclus: 5, overageEurParUnite: null, features: ["Accès 3 jours aux fonctionnalités sans coût externe significatif", "5 unités incluses", "Une seule fois par compte"] },
  ),
];

interface TierDef {
  code: string;
  tier: string;
  audience: IaAudience;
  priceMensuel: number;
  creditsMensuel: number;
  overage: number;
  features: string[];
  durations: Array<"hebdo" | "mensuel" | "annuel">;
  seatBased?: boolean;
}

const DUREES: Record<"hebdo" | "mensuel" | "annuel", { label: IaPlanMeta["periodiciteLabel"]; periodicity: ProductSeed["periodicity"]; validityDays: number; priceFactor: (p: number) => number; creditsFactor: (c: number) => number }> = {
  hebdo: { label: "hebdomadaire", periodicity: undefined, validityDays: 7, priceFactor: (p) => Math.round(((p / 4) * 1.15) * 20) / 20, creditsFactor: (c) => Math.round(c / 4) },
  mensuel: { label: "mensuel", periodicity: "monthly", validityDays: 30, priceFactor: (p) => p, creditsFactor: (c) => c },
  annuel: { label: "annuel", periodicity: "yearly", validityDays: 365, priceFactor: (p) => p * 10, creditsFactor: (c) => c * 12 },
};

function buildTiers(defs: TierDef[]): ProductSeed[] {
  const out: ProductSeed[] = [];
  for (const d of defs) {
    for (const dur of d.durations) {
      const cfg = DUREES[dur];
      const price = cfg.priceFactor(d.priceMensuel);
      const credits = cfg.creditsFactor(d.creditsMensuel);
      out.push(
        withMeta(
          {
            code: `${d.code}_${dur}`,
            name: `AL-HOUDOUD·M — ${d.tier} (${cfg.label})`,
            paymentCase: "ia_abonnement",
            price,
            paymentType: "recurring",
            periodicity: cfg.periodicity,
            validityDays: cfg.validityDays,
            refundPolicy: "Résiliable à tout moment, sans remboursement de la période entamée.",
          },
          {
            audience: d.audience,
            kind: "abonnement",
            tier: d.tier,
            periodiciteLabel: cfg.label,
            creditsInclus: credits,
            overageEurParUnite: d.overage,
            features: d.features,
            seatBased: d.seatBased,
          },
        ),
      );
    }
  }
  return out;
}

const PARTICULIER_TIERS: TierDef[] = [
  { code: "ia_particulier_leger", tier: "Particulier Léger", audience: "particulier", priceMensuel: 8.9, creditsMensuel: 60, overage: 0.15, durations: ["hebdo", "mensuel", "annuel"], features: ["Chat quotidien", "Résumés courts", "Aide à la rédaction simple", "Recherche web basique"] },
  { code: "ia_particulier_essentiel", tier: "Particulier Essentiel", audience: "particulier", priceMensuel: 19.9, creditsMensuel: 200, overage: 0.15, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Léger inclus", "Mémoire des préférences", "Génération d'image légère (coût réel non mesuré — pondérée 5 unités/image par prudence)", "Export de documents"] },
  { code: "ia_particulier_confort", tier: "Particulier Confort", audience: "particulier", priceMensuel: 39.9, creditsMensuel: 500, overage: 0.15, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Essentiel inclus", "Support prioritaire", "Assistant vocal (synthèse — tarif réel TTS appliqué)", "Historique illimité"] },
];

const PRO_TIERS: TierDef[] = [
  { code: "ia_pro_essentiel", tier: "Pro Essentiel", audience: "professionnel", priceMensuel: 49, creditsMensuel: 400, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Rédaction professionnelle", "Synthèse de documents", "Recherche approfondie", "1 utilisateur"] },
  { code: "ia_pro_avance", tier: "Pro Avancé", audience: "professionnel", priceMensuel: 119, creditsMensuel: 1200, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Essentiel inclus", "Génération de documents longs", "Analyse de fichiers volumineux", "3 utilisateurs", "Support prioritaire"] },
  { code: "ia_pro_illimite_plafonne", tier: "Pro Illimité (plafonné)", audience: "professionnel", priceMensuel: 249, creditsMensuel: 3000, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Avancé inclus", "Accès API", "10 utilisateurs", "Reporting d'usage", "Gestionnaire de compte"] },
];

const DEV_TIERS: TierDef[] = [
  { code: "ia_dev_solo", tier: "Dev Solo", audience: "developpeur", priceMensuel: 39, creditsMensuel: 300, overage: 0.15, durations: ["hebdo", "mensuel", "annuel"], features: ["Assistant code", "Revue de code", "Génération de tests", "1 dépôt connecté"] },
  { code: "ia_dev_pro", tier: "Dev Pro", audience: "developpeur", priceMensuel: 99, creditsMensuel: 1000, overage: 0.15, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Solo inclus", "Dépôts illimités", "CI/CD assisté", "Déploiements assistés", "3 projets simultanés"] },
  { code: "ia_dev_studio", tier: "Dev Studio", audience: "developpeur", priceMensuel: 219, creditsMensuel: 3000, overage: 0.15, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Pro inclus", "Équipe (5 sièges)", "Webhooks / API", "Priorité infrastructure"] },
];

// Add-on IA — cumulable avec les abonnements marketplace existants (Garage+/Pro Vente/VO…),
// ne les remplace jamais (shared/plans.ts reste la source de vérité pour ces abonnements-là).
const AUTO_TIERS: TierDef[] = [
  { code: "ia_auto_vitrine", tier: "Auto IA Vitrine", audience: "automobile", priceMensuel: 19, creditsMensuel: 150, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Description d'annonce automatique", "Réponses clients assistées", "Suggestions de prix", "Compatible avec un abonnement Garage+/Pro Vente/VO existant"] },
  { code: "ia_auto_atelier", tier: "Auto IA Atelier", audience: "automobile", priceMensuel: 49, creditsMensuel: 500, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Vitrine inclus", "Diagnostics assistés", "Devis rédigés par IA", "Rapports d'intervention automatiques"] },
  { code: "ia_auto_flotte", tier: "Auto IA Flotte / Concession", audience: "automobile", priceMensuel: 119, creditsMensuel: 1500, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Atelier inclus", "Multi-utilisateurs", "Analyse de stock par IA", "Prévisions de demande"] },
];

const MARCHAND_TIERS: TierDef[] = [
  { code: "ia_marchand_starter", tier: "Marchand Starter", audience: "marchand", priceMensuel: 29, creditsMensuel: 200, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Fiches produits générées", "Réponses SAV assistées"] },
  { code: "ia_marchand_croissance", tier: "Marchand Croissance", audience: "marchand", priceMensuel: 79, creditsMensuel: 700, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Starter inclus", "Automatisation des relances", "Optimisation SEO produit", "Analyse des avis clients"] },
  { code: "ia_marchand_scale", tier: "Marchand Scale", audience: "marchand", priceMensuel: 179, creditsMensuel: 2000, overage: 0.13, durations: ["hebdo", "mensuel", "annuel"], features: ["Tout Croissance inclus", "Multi-boutiques", "Prévisions de stock", "Accès API"] },
];

const EQUIPE_TIERS: TierDef[] = [
  { code: "ia_equipe_starter", tier: "Équipe Starter (jusqu'à 5 sièges)", audience: "equipe", priceMensuel: 15, creditsMensuel: 150, overage: 0.12, durations: ["mensuel", "annuel"], seatBased: true, features: ["Prix par siège", "Quota mutualisé par siège", "Jusqu'à 5 sièges"] },
  { code: "ia_equipe_croissance", tier: "Équipe Croissance (6 à 20 sièges)", audience: "equipe", priceMensuel: 25, creditsMensuel: 300, overage: 0.12, durations: ["mensuel", "annuel"], seatBased: true, features: ["Prix par siège", "Rôles et permissions", "Tableau de bord d'usage par membre"] },
  { code: "ia_equipe_organisation", tier: "Équipe Organisation (21+ sièges)", audience: "equipe", priceMensuel: 35, creditsMensuel: 500, overage: 0.12, durations: ["mensuel", "annuel"], seatBased: true, features: ["Prix par siège, dégressif au volume (sur devis au-delà de 20 sièges)", "SSO", "Facturation centralisée", "Gestionnaire de compte dédié"] },
];

const SPECIALISE_TIERS: TierDef[] = [
  { code: "ia_specialise_vision_documents", tier: "Spécialisé Vision & Documents", audience: "specialise", priceMensuel: 89, creditsMensuel: 500, overage: 0.11, durations: ["mensuel", "annuel"], features: ["Analyse de documents longs", "Reconnaissance d'image / OCR assisté (coût image non mesuré — pondéré 5 unités/image)", "+100 unités dédiées image/mois"] },
  { code: "ia_specialise_volume_intensif", tier: "Spécialisé Volume Intensif", audience: "specialise", priceMensuel: 349, creditsMensuel: 5000, overage: 0.11, durations: ["mensuel", "annuel"], features: ["Pour les usages les plus intensifs (cabinets, grosses flottes)", "Tarif dégressif au-delà sur devis"] },
];

// ── Crédits prépayés rechargeables (jamais d'abonnement, jamais d'expiration) ──
interface CreditPack { code: string; priceEur: number; unites: number; }
const CREDIT_PACKS: CreditPack[] = [
  { code: "ia_credits_5", priceEur: 5, unites: 33 },
  { code: "ia_credits_10", priceEur: 10, unites: 70 },
  { code: "ia_credits_25", priceEur: 25, unites: 185 },
  { code: "ia_credits_50", priceEur: 50, unites: 400 },
  { code: "ia_credits_100", priceEur: 100, unites: 850 },
];

const CREDITS: ProductSeed[] = CREDIT_PACKS.map((p) =>
  withMeta(
    { code: p.code, name: `AL-HOUDOUD·M — Recharge ${p.priceEur} €`, paymentCase: "ia_credits", price: p.priceEur, paymentType: "unique", validityDays: 0, refundPolicy: "Non remboursable une fois crédité ; les unités n'expirent jamais tant que le compte est actif." },
    { audience: "decouverte", kind: "credits", tier: `Recharge ${p.priceEur} €`, periodiciteLabel: "ponctuel", creditsInclus: p.unites, overageEurParUnite: null, features: [`${p.unites} unités créditées immédiatement`, "N'expirent jamais", "Travail conservé même à solde épuisé — simple mise en pause des actions IA jusqu'à la recharge"] },
  ),
);

export const IA_PRODUCT_CATALOG: ProductSeed[] = [
  ...DECOUVERTE_ET_ESSAI,
  ...buildTiers(PARTICULIER_TIERS),
  ...buildTiers(PRO_TIERS),
  ...buildTiers(DEV_TIERS),
  ...buildTiers(AUTO_TIERS),
  ...buildTiers(MARCHAND_TIERS),
  ...buildTiers(EQUIPE_TIERS),
  ...buildTiers(SPECIALISE_TIERS),
  ...CREDITS,
];
