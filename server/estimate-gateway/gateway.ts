/**
 * MKA.P-MS Estimate Gateway (LOT IA02E).
 *
 * Point d'entrée unique pour toute estimation de prix demandée par
 * MKA.P-MS Intelligences. Ne calcule RIEN elle-même : elle appelle le
 * moteur métier réel déjà propriétaire du calcul (VO Engine, Vehicle
 * Delivery, Import Risk, catalogue pièces, devis garage, devises) et
 * traduit son résultat dans le schéma canonique (`types.ts`).
 *
 * Deux règles non négociables, tenues dans tout ce fichier :
 * 1. Un montant ne sort d'ici que s'il vient réellement du moteur appelé.
 * 2. L'absence de moteur métier (LOA, VTC, droits de douane…) est déclarée
 *    `BUSINESS_ENGINE_MISSING` — cette passerelle ne construit jamais le
 *    moteur manquant, elle le nomme.
 */
import { estimate as estimerVoEngine, type EstimateInput } from "../vo-engine/service.js";
import { devis as devisVehiculeDelivery } from "../vehicle-delivery/service.js";
import type { VdCategorie, VdMode } from "../vehicle-delivery/schema.js";
import { calculerTarifColis } from "../routers/livraison.js";
import { calculerMontantDevis, devisDuClient } from "../routers/devis.js";
import { voletPieces } from "../estimation-hub/service.js";
import { diagnostiquer } from "../import-risk/service.js";
import { getRates } from "../routers/currency.js";
import { db } from "../db.js";
import { partsCatalog, partsStock } from "../schema.js";
import { eq } from "drizzle-orm";
import {
  estimationIndisponible,
  moteurMetierAbsent,
  nouvelleEstimationVide,
  type ResultatEstimation,
} from "./types.js";

function confianceDepuis(c: "faible" | "moyenne" | "bonne"): "haute" | "moyenne" | "faible" {
  return c === "bonne" ? "haute" : c === "moyenne" ? "moyenne" : "faible";
}

// ── Véhicule : valeur de marché / reprise / détail / marge ────────────────
// Un seul appel réel au VO Engine (server/vo-engine/service.ts::estimate) ;
// les quatre fonctions ci-dessous ne font que lire un bord différent de la
// même fourchette — aucune règle de prix dupliquée.

async function estimerVehicule(input: EstimateInput, traceId: string, estimateType: string) {
  const base = nouvelleEstimationVide({
    estimateType,
    engineId: "vo-engine",
    traceId,
    country: input.countryCode ?? null,
    parameters: { marque: input.marque, modele: input.modele, annee: input.annee ?? null, kilometrage: input.kilometrage ?? null },
  });
  const r = await estimerVoEngine(input);
  return { base, r };
}

export async function estimerValeurMarche(input: EstimateInput, traceId: string): Promise<ResultatEstimation> {
  const { base, r } = await estimerVehicule(input, traceId, "vehicle.marketValue");
  return {
    ...base,
    status: "ok",
    quality: r.method === "comparables" ? "REAL_DATA_ESTIMATE" : "REFERENCE_RANGE",
    amount: r.mid,
    currency: r.currency,
    minAmount: r.low,
    maxAmount: r.high,
    confidence: confianceDepuis(r.confidence),
    sourceIds: [String(r.id)],
    assumptions: r.method === "modele" ? ["Barème de décote documenté — aucun comparable réel trouvé pour ce marché."] : [],
    missingData: [],
    warnings: [r.disclaimer],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
  };
}

export async function estimerValeurReprise(input: EstimateInput, traceId: string): Promise<ResultatEstimation> {
  const { base, r } = await estimerVehicule(input, traceId, "vehicle.tradeIn");
  return {
    ...base,
    status: "ok",
    quality: r.method === "comparables" ? "REAL_DATA_ESTIMATE" : "REFERENCE_RANGE",
    amount: r.low,
    currency: r.currency,
    minAmount: r.low,
    maxAmount: r.low,
    confidence: confianceDepuis(r.confidence),
    sourceIds: [String(r.id)],
    assumptions: ["Valeur de reprise = bas de la fourchette de marché — l'offre ferme reste posée par un humain (server/vo-engine/service.ts::offerReprise)."],
    missingData: [],
    warnings: [r.disclaimer],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
  };
}

export async function estimerPrixDetail(input: EstimateInput, traceId: string): Promise<ResultatEstimation> {
  const { base, r } = await estimerVehicule(input, traceId, "vehicle.retail");
  return {
    ...base,
    status: "ok",
    quality: r.method === "comparables" ? "REAL_DATA_ESTIMATE" : "REFERENCE_RANGE",
    amount: r.high,
    currency: r.currency,
    minAmount: r.mid,
    maxAmount: r.high,
    confidence: confianceDepuis(r.confidence),
    sourceIds: [String(r.id)],
    assumptions: [],
    missingData: [],
    warnings: [r.disclaimer],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
  };
}

export async function estimerMarge(input: EstimateInput, traceId: string): Promise<ResultatEstimation> {
  const { base, r } = await estimerVehicule(input, traceId, "vehicle.margin");
  return {
    ...base,
    status: "ok",
    quality: r.method === "comparables" ? "REAL_DATA_ESTIMATE" : "REFERENCE_RANGE",
    amount: Math.round((r.high - r.low) * 100) / 100,
    currency: r.currency,
    minAmount: null,
    maxAmount: null,
    confidence: confianceDepuis(r.confidence),
    sourceIds: [String(r.id)],
    assumptions: ["Marge = haut moins bas de la même fourchette VO Engine — calcul arithmétique, aucune règle de marge inventée."],
    missingData: [],
    warnings: [r.disclaimer],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
  };
}

// ── Garage / réparation ────────────────────────────────────────────────────
// Aucun moteur n'auto-prédit un coût de réparation à partir de symptômes :
// audit LOT IA02E confirmé (server/routers/devis.ts n'a pas de formule
// temps × taux horaire). Si un devis existe déjà (lignes saisies par le
// garage), on renvoie son montant réel — sinon BUSINESS_ENGINE_MISSING.

export async function estimerReparationGarage(
  input: { devisId?: number | null; userId?: number | null },
  traceId: string,
): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({
    estimateType: "garage.repair",
    engineId: "devis-garage",
    traceId,
    parameters: { devisId: input.devisId ?? null },
  });
  if (!input.devisId || !input.userId) {
    return moteurMetierAbsent(
      base,
      "Aucun moteur MKA.P-MS ne prédit un coût de réparation à partir d'un véhicule et d'une panne : un devis doit d'abord être chiffré par un garage (server/routers/devis.ts).",
    );
  }
  const devis = await devisDuClient(input.devisId, input.userId);
  const montant = await calculerMontantDevis(devis);
  if (!montant.chiffrable) {
    return estimationIndisponible({ ...base, country: devis.pays ?? null }, [montant.manque ?? "Devis sans ligne chiffrée par le garage."]);
  }
  return {
    ...base,
    country: devis.pays ?? null,
    status: "ok",
    quality: "LIVE_QUOTE",
    amount: montant.totalTtc,
    currency: montant.devise,
    minAmount: montant.totalTtc,
    maxAmount: montant.totalTtc,
    confidence: "haute",
    sourceIds: [String(devis.id)],
    assumptions: [],
    missingData: [],
    warnings: [],
    isLiveQuote: true,
    isBinding: devis.status === "accepte",
    validUntil: null,
  };
}

// ── Pièces automobiles ─────────────────────────────────────────────────────

export async function estimerPrixPiece(
  input: { catalogId?: number | null; marque?: string | null; modele?: string | null; annee?: number | null },
  traceId: string,
): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({
    estimateType: "parts.price",
    engineId: "pieces",
    traceId,
    parameters: { catalogId: input.catalogId ?? null, marque: input.marque ?? null, modele: input.modele ?? null },
  });

  if (input.catalogId) {
    const [piece] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, input.catalogId)).limit(1);
    if (!piece) return estimationIndisponible(base, [`Pièce ${input.catalogId} introuvable au catalogue.`]);
    const stocks = await db.select().from(partsStock).where(eq(partsStock.catalogId, input.catalogId));
    const disponible = stocks.reduce((s, st) => s + st.quantite - st.quantiteReservee, 0) > 0;
    return {
      ...base,
      status: "ok",
      quality: disponible ? "LIVE_QUOTE" : "REAL_DATA_ESTIMATE",
      amount: piece.prixTtc ? Number(piece.prixTtc) : Number(piece.prixHt) * (1 + Number(piece.tvaRate) / 100),
      currency: piece.currency,
      minAmount: null,
      maxAmount: null,
      confidence: "haute",
      sourceIds: [String(piece.id)],
      assumptions: disponible ? [] : ["Prix catalogue réel mais pièce actuellement hors stock chez ce vendeur."],
      missingData: [],
      warnings: [],
      isLiveQuote: disponible,
      isBinding: false,
      validUntil: null,
    };
  }

  if (input.marque && input.modele) {
    const budget = await voletPieces(input.marque, input.modele, input.annee ?? null);
    if (budget.qualite === "non_mesure" || budget.montant === null) {
      return estimationIndisponible(base, [budget.manque ?? "Échantillon de pièces compatibles insuffisant."]);
    }
    return {
      ...base,
      status: "ok",
      quality: "REAL_DATA_ESTIMATE",
      amount: budget.montant,
      currency: budget.devise,
      minAmount: budget.montantBas,
      maxAmount: budget.montantHaut,
      confidence: "moyenne",
      sourceIds: [],
      assumptions: ["Médiane des prix catalogue réels des pièces compatibles publiées — pas un devis pour une pièce précise."],
      missingData: budget.manque ? [budget.manque] : [],
      warnings: [],
      isLiveQuote: false,
      isBinding: false,
      validUntil: null,
    };
  }

  return estimationIndisponible(base, ["Ni identifiant catalogue, ni marque/modèle transmis : aucune pièce à chiffrer."]);
}

// ── Location courte durée / LOA — moteur absent, confirmé par l'audit ─────

export async function estimerLocation(traceId: string, type: "rental" | "loa"): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({ estimateType: type === "rental" ? "rental" : "loa", engineId: "aucun", traceId });
  return moteurMetierAbsent(
    base,
    type === "rental"
      ? "Aucun moteur de location courte durée n'existe côté serveur (aucune table, aucun service) : rien à chiffrer."
      : "server/modules/financeplus.ts déclare les tables LOA mais aucun service ne calcule de mensualité — l'écran client (LocationLOA.tsx) affiche des chiffres statiques, pas un calcul.",
  );
}

// ── VTC / Taxi — moteur absent, confirmé par l'audit ───────────────────────

export async function estimerVtc(traceId: string): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({ estimateType: "vtc", engineId: "aucun", traceId });
  return moteurMetierAbsent(
    base,
    "Aucun calcul de course VTC/taxi n'existe (transportBookings.prix n'est jamais renseigné, aucune formule distance/durée/tarif) : rien à chiffrer.",
  );
}

// ── Transport véhicule (maritime/plateau/etc.) ─────────────────────────────

export async function estimerTransportVehicule(
  input: {
    annonceId?: number | null;
    mode?: VdMode | null;
    categorie?: VdCategorie | null;
    paysDepart?: string | null;
    paysArrivee?: string | null;
    distanceKm?: number | null;
  },
  traceId: string,
): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({
    estimateType: "transport",
    engineId: "vehicle-delivery",
    traceId,
    origin: input.paysDepart ?? null,
    destination: input.paysArrivee ?? null,
  });
  const d = await devisVehiculeDelivery(input);
  if (d.total === null) {
    return estimationIndisponible(base, d.manques);
  }
  return {
    ...base,
    status: "ok",
    quality: d.qualite === "confirme" ? "LIVE_QUOTE" : d.qualite === "estime" ? "REAL_DATA_ESTIMATE" : "REFERENCE_RANGE",
    amount: d.total,
    currency: d.devise,
    minAmount: d.total,
    maxAmount: d.total,
    confidence: d.qualite === "confirme" ? "haute" : d.qualite === "estime" ? "moyenne" : "faible",
    sourceIds: d.devisId ? [String(d.devisId)] : [],
    assumptions: d.qualite !== "confirme" ? ["Barème interne non encore vérifié par un transporteur — voir manques."] : [],
    missingData: d.manques,
    warnings: [],
    isLiveQuote: d.qualite === "confirme",
    isBinding: false,
    validUntil: null,
  };
}

// ── Livraison de colis ─────────────────────────────────────────────────────

export async function estimerLivraisonColis(
  input: {
    poidsKg?: number | null;
    longueurCm?: number | null;
    largeurCm?: number | null;
    hauteurCm?: number | null;
    distanceKm?: number | null;
    urgent?: boolean;
  },
  traceId: string,
): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({ estimateType: "delivery", engineId: "livraison-colis", traceId, parameters: { ...input } });
  const r = await calculerTarifColis(input);
  if (r.tarif === null) {
    return estimationIndisponible(base, [r.manque ?? "Distance inconnue."]);
  }
  return {
    ...base,
    status: "ok",
    quality: "REAL_DATA_ESTIMATE",
    amount: r.tarif,
    currency: "EUR",
    minAmount: r.tarif,
    maxAmount: r.tarif,
    confidence: "moyenne",
    sourceIds: [],
    assumptions: ["Tarif calculé depuis la grille active ou, en son absence, la grille de repli par gabarit."],
    missingData: [],
    warnings: [],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
  };
}

// ── Importation / douane — droits jamais inventés (confirmé par l'audit) ──

export async function estimerImportation(
  input: { annonceId: number; paysDestination?: string | null },
  traceId: string,
): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({
    estimateType: "import",
    engineId: "import-risk",
    traceId,
    destination: input.paysDestination ?? null,
  });
  const diag = await diagnostiquer(input);
  return {
    ...base,
    status: "ok",
    quality: "REFERENCE_RANGE",
    amount: null,
    currency: null,
    minAmount: null,
    maxAmount: null,
    confidence: diag.bloquant ? "haute" : diag.confirmationRequise ? "moyenne" : "faible",
    sourceIds: [],
    assumptions: [],
    missingData: diag.domainesNonCouverts,
    warnings: [diag.resume, ...diag.risques.filter((r) => r.niveau === "bloquant" || r.niveau === "important").map((r) => r.message)],
    isLiveQuote: false,
    isBinding: false,
    validUntil: null,
  };
}

export async function estimerDouane(traceId: string, country: string | null): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({ estimateType: "customs", engineId: "aucun", traceId, country });
  return moteurMetierAbsent(
    base,
    "Aucun barème douanier n'est connecté pour aucun pays : ni server/vehicle-delivery/service.ts ni server/import-risk/service.ts ne chiffrent de droits ou de taxes — un chiffre inventé coûterait plus cher au client qu'une absence de chiffre.",
  );
}

// ── Devises ─────────────────────────────────────────────────────────────

export async function estimerConversionDevise(
  input: { montant: number; de: string; vers: string },
  traceId: string,
): Promise<ResultatEstimation> {
  const base = nouvelleEstimationVide({
    estimateType: "currency",
    engineId: "currency",
    traceId,
    parameters: { montant: input.montant, de: input.de, vers: input.vers },
  });
  const de = input.de.toUpperCase();
  const vers = input.vers.toUpperCase();
  const c = await getRates();
  if (!(de in c.rates) || !(vers in c.rates)) {
    return estimationIndisponible(base, [`Devise inconnue : ${!(de in c.rates) ? de : vers}.`]);
  }
  const montantEur = input.montant / c.rates[de];
  const converti = Math.round(montantEur * c.rates[vers] * 100) / 100;
  return {
    ...base,
    status: "ok",
    quality: c.live ? "LIVE_QUOTE" : "REFERENCE_RANGE",
    amount: converti,
    currency: vers,
    minAmount: converti,
    maxAmount: converti,
    confidence: c.live ? "haute" : "moyenne",
    sourceIds: [],
    assumptions: c.live ? [] : ["Taux de repli statique — fournisseur de taux de change momentanément indisponible."],
    missingData: [],
    warnings: [],
    isLiveQuote: c.live,
    isBinding: false,
    validUntil: new Date(c.fetchedAt + 60 * 60 * 1000).toISOString(),
  };
}
