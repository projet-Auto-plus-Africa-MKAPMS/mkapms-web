import { eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import { obtenirDetailsPublicSurCommande, obtenirLabelPublicParAnnonce } from "../order-engine/service.js";
import { PRODUCT_PAGE_ENGINE_META, type ProductPageConfig, type ProductPageType } from "./contract.js";

export const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_1_minimal";

/**
 * Détermine le type de fiche produit à partir des SEULS champs déjà
 * portés par `annonces` — jamais une nouvelle source de vérité : le type
 * "sur_commande" reste défini par `ownership = "partenaire"` (déjà la
 * règle dans Vehicule.tsx), "constructeur_mkapms" par le nouveau drapeau
 * optionnel, toujours faux aujourd'hui.
 */
export function determinerTypePageProduit(annonce: { ownership: string; estConstructeurMkapms: boolean | null }): ProductPageType {
  if (annonce.ownership === "partenaire") return "sur_commande";
  if (annonce.ownership === "plateforme" && annonce.estConstructeurMkapms) return "constructeur_mkapms";
  return "vente_normale";
}

export async function obtenirConfigurationPageProduit(annonceId: number): Promise<ProductPageConfig> {
  const [annonce] = await db
    .select({
      id: annonces.id,
      ownership: annonces.ownership,
      type: annonces.type,
      estConstructeurMkapms: annonces.estConstructeurMkapms,
      constructeurFicheTechnique: annonces.constructeurFicheTechnique,
      constructeurDisponibilite: annonces.constructeurDisponibilite,
      constructeurEntretienServices: annonces.constructeurEntretienServices,
      garanties: annonces.garanties,
    })
    .from(annonces)
    .where(eq(annonces.id, annonceId))
    .limit(1);
  if (!annonce) throw new Error(`Annonce #${annonceId} introuvable.`);

  const type = determinerTypePageProduit(annonce);
  const venteOuLocation = annonce.type === "location" ? "location" : "vente";

  if (type === "sur_commande") {
    const [label, details] = await Promise.all([
      obtenirLabelPublicParAnnonce(annonceId),
      obtenirDetailsPublicSurCommande(annonceId),
    ]);
    const fraisSurDevis = !details || (details.prepFee == null && details.deliveryFee == null && details.pickupFee == null);
    return {
      annonceId,
      type,
      venteOuLocation,
      afficherBlocSurCommande: true,
      afficherBlocConstructeur: false,
      afficherFinancement: !!details?.installmentPaymentAllowed,
      afficherInformationsFournisseur: true,
      surCommande: {
        label,
        localisation: details?.vehicleLocation ?? null,
        preparationDetails: details?.deliveryPrepDetails ?? null,
        delaiPreparationJours: details?.prepDelayDays ?? null,
        delaiLivraisonJours: details?.deliveryDelayDays ?? null,
        delaiRetraitJours: details?.pickupDelayDays ?? null,
        fraisPreparation: details?.prepFee != null ? String(details.prepFee) : null,
        fraisLivraison: details?.deliveryFee != null ? String(details.deliveryFee) : null,
        fraisRetrait: details?.pickupFee != null ? String(details.pickupFee) : null,
        fraisSurDevis,
        zonesLivraison: details?.deliveryZones ?? null,
        conditionsRemise: details?.handoverConditions ?? null,
        documentsRequis: details?.requiredDocuments ?? null,
        acompte: details?.depositAmount != null ? String(details.depositAmount) : null,
        conditionsRemboursement: details?.refundConditions ?? null,
        conditionsAnnulation: details?.cancellationConditions ?? null,
      },
      constructeur: null,
    };
  }

  if (type === "constructeur_mkapms") {
    return {
      annonceId,
      type,
      venteOuLocation,
      afficherBlocSurCommande: false,
      afficherBlocConstructeur: true,
      afficherFinancement: true,
      afficherInformationsFournisseur: false,
      surCommande: null,
      constructeur: {
        marque: "MKA.P-MS",
        ficheConstructeur: annonce.constructeurFicheTechnique ?? null,
        garanties: Array.isArray(annonce.garanties) ? (annonce.garanties as string[]) : [],
        disponibilite: annonce.constructeurDisponibilite ?? null,
        entretienServices: annonce.constructeurEntretienServices ?? null,
      },
    };
  }

  return {
    annonceId,
    type: "vente_normale",
    venteOuLocation,
    afficherBlocSurCommande: false,
    afficherBlocConstructeur: false,
    afficherFinancement: true,
    afficherInformationsFournisseur: false,
    surCommande: null,
    constructeur: null,
  };
}

export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let message: string | undefined;
  let total = 0;
  try {
    const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(annonces);
    total = Number(t?.n ?? 0);
  } catch (e) {
    status = "degraded";
    message = (e as Error).message;
  }
  return {
    engine: PRODUCT_PAGE_ENGINE_META.name,
    version: VERSION,
    status,
    checkedAt: new Date().toISOString(),
    message,
    metrics: { annoncesTotal: total, responseMs: Date.now() - startedAt },
  };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: PRODUCT_PAGE_ENGINE_META.name,
    label: PRODUCT_PAGE_ENGINE_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    // Déjà branché sur des données réelles (annonces, order_listings via
    // Order Engine) et un routeur appelé par Vehicule.tsx dès ce lot —
    // "active", pas "staging" : jamais un moteur déclaré en place mais
    // non connecté.
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const parType = await db
    .select({ ownership: annonces.ownership, n: sql<number>`count(*)::int` })
    .from(annonces)
    .groupBy(annonces.ownership);
  const businessMetrics: Record<string, number | string | null> = {};
  for (const r of parType) businessMetrics[`annonces_ownership_${r.ownership}`] = Number(r.n);
  const [constructeur] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(annonces)
    .where(eq(annonces.estConstructeurMkapms, true));
  businessMetrics.annonces_constructeur_mkapms = Number(constructeur?.n ?? 0);
  return { ...feed, businessMetrics, recentEvents: [], recentErrors: [] };
}
