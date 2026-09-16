/**
 * Parts Engine — service (LOT 3 du Plan Maître Fournisseurs, PIÈCES
 * AUTOMOBILES UNIQUEMENT). Une pièce DOIT déjà venir d'un fournisseur actif
 * du Supplier Engine (LOT 1). Ce moteur ÉTEND la marketplace pièces déjà
 * existante (`parts_catalog`/`parts_stock`/`parts_compatibility`,
 * `server/schema.ts`, exploitée par `server/routers/pieces.ts`) au lieu de la
 * dupliquer : la publication crée une vraie ligne `parts_catalog`.
 *
 * Pipeline (point "OBJECTIF PRINCIPAL" du plan) : ingestion → mapping →
 * normalisation → identification pièce/OEM/aftermarket → détection doublon
 * (= correspondance canonique) → compatibilité véhicule → analyse → contrôle
 * stock → contrôle prix → contrôle territoire → contrôle qualité →
 * enrichissement → préparation fiche → publication → synchronisation.
 *
 * Aucune étape n'invente une donnée : référence OEM, compatibilité,
 * fabricant, stock, garantie, prix et caractéristiques techniques restent
 * ce que le fournisseur ou un humain a réellement fourni/validé.
 */
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  partsCatalog,
  partsCompatibility,
  partsConditionEnum,
  partsShops,
  partsStock,
  warehouses,
} from "../schema.js";
import { getCountry, listCurrencies } from "../country-os/index.js";
import { evaluateAction } from "../country-policy/service.js";
import { emitSafe } from "../event-bus/service.js";
import { obtenirFournisseurDetail } from "../supplier-engine/service.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import {
  partsAuditLog,
  partsCanonical,
  partsCompatibilityChecks,
  partsHealthLog,
  partsOemCrossReferences,
  partsPricing,
  partsPublicationLog,
  partsQualityChecks,
  partsStockLedger,
  partsStockReservations,
  partsSupplierItems,
  partsSupplierShopLinks,
  partsTerritories,
} from "./schema.js";
import {
  CANONICAL_PART_FIELDS,
  PARTS_ENGINE_META,
  type CompatibilityLevel,
  type CrossReferenceStatus,
  type PartSyncStatus,
  type StockStatus,
} from "./contract.js";

export const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_1_minimal";

const CONDITIONS_VALIDES = new Set(partsConditionEnum.enumValues as readonly string[]);

function reference(): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PIE-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}
function referenceCanonique(): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `PCE-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

async function journaliser(input: { supplierItemId: number | null; action: string; actorId?: number | null; detail?: Record<string, unknown> }) {
  await db.insert(partsAuditLog).values({
    supplierItemId: input.supplierItemId,
    action: input.action,
    actorId: input.actorId ?? null,
    detail: input.detail ?? {},
  });
}

async function obtenirPiece(supplierItemId: number) {
  const [row] = await db.select().from(partsSupplierItems).where(eq(partsSupplierItems.id, supplierItemId)).limit(1);
  if (!row) throw new Error(`Pièce fournisseur #${supplierItemId} introuvable.`);
  return row;
}

async function transitionner(input: { supplierItemId: number; fromStatus: string; toStatus: PartSyncStatus; reason?: string | null; actorId?: number | null }) {
  await db.update(partsSupplierItems).set({ status: input.toStatus, statusReason: input.reason ?? null, updatedAt: new Date() }).where(eq(partsSupplierItems.id, input.supplierItemId));
  await db.insert(partsPublicationLog).values({
    supplierItemId: input.supplierItemId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    reason: input.reason ?? null,
    actorId: input.actorId ?? null,
  });
}

// ───────────────────────── 1. Ingestion ─────────────────────────

export interface IngererPieceInput {
  supplierProfileId: number;
  supplierPartId: string;
  ingestMethod: string;
  rawData: Record<string, unknown>;
  actorId?: number | null;
}

/** Exige : fournisseur actif, type compatible (pieces/multi), méthode de connexion réellement configurée (Connector Engine, LOT 1). */
export async function ingererPiece(input: IngererPieceInput) {
  const detail = await obtenirFournisseurDetail(input.supplierProfileId);
  if (detail.profil.status !== "actif") {
    throw new Error(`Fournisseur #${input.supplierProfileId} non actif (statut "${detail.profil.status}") : ingestion refusée.`);
  }
  if (!["pieces", "multi"].includes(detail.profil.supplierType)) {
    throw new Error(`Fournisseur #${input.supplierProfileId} de type "${detail.profil.supplierType}" : ne fournit pas de pièces (LOT 3 = pièces uniquement).`);
  }
  const connexion = detail.connexions.find((c) => c.method === input.ingestMethod);
  if (!connexion || connexion.status === "not_connected") {
    throw new Error(`Méthode de connexion "${input.ingestMethod}" non configurée pour le fournisseur #${input.supplierProfileId} (Connector Engine, LOT 1).`);
  }

  const [row] = await db
    .insert(partsSupplierItems)
    .values({
      reference: reference(),
      supplierProfileId: input.supplierProfileId,
      supplierPartId: input.supplierPartId,
      ingestMethod: input.ingestMethod,
      rawData: input.rawData,
      status: "IMPORTED",
      createdBy: input.actorId ?? null,
    })
    .returning();

  await journaliser({ supplierItemId: row.id, action: "part.imported", actorId: input.actorId, detail: { supplierProfileId: input.supplierProfileId } });
  await emitSafe({ source: "parts_engine", type: "part.imported", payload: { supplierItemId: row.id, supplierProfileId: input.supplierProfileId } });
  return row;
}

// ─────────────────── 2-3. Mapping + normalisation ───────────────────

/** Applique le mapping actif "piece" du fournisseur (Universal Mapping Engine, LOT 1). Refuse tant qu'aucun mapping n'existe. */
export async function mapperEtNormaliser(supplierItemId: number, actorId?: number | null) {
  const item = await obtenirPiece(supplierItemId);
  const detail = await obtenirFournisseurDetail(item.supplierProfileId);
  const regles = detail.mappings.filter((m) => m.entityType === "piece");
  if (regles.length === 0) {
    throw new Error(`Aucun mapping "piece" actif pour le fournisseur #${item.supplierProfileId} (Universal Mapping Engine, LOT 1) : impossible de normaliser sans correspondance définie.`);
  }

  const raw = item.rawData as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};
  for (const regle of regles) {
    if (Object.prototype.hasOwnProperty.call(raw, regle.supplierField)) {
      normalized[regle.canonicalField] = raw[regle.supplierField];
    }
  }

  const referenceOem = typeof normalized.referenceOem === "string" ? normalized.referenceOem.toUpperCase().trim() : null;
  const ean = typeof normalized.eanGtin === "string" ? normalized.eanGtin.trim() : null;
  const version = regles[0]?.version ?? null;

  await db.update(partsSupplierItems).set({ normalizedData: normalized, referenceOem, ean, mappingVersion: version, updatedAt: new Date() }).where(eq(partsSupplierItems.id, supplierItemId));
  await transitionner({ supplierItemId, fromStatus: item.status, toStatus: "ANALYSIS_PENDING", actorId });
  await journaliser({ supplierItemId, action: "part.normalized", actorId, detail: { mappingVersion: version, champs: Object.keys(normalized).length } });
  await emitSafe({ source: "parts_engine", type: "part.normalized", payload: { supplierItemId, mappingVersion: version } });
  await emitSafe({ source: "parts_engine", type: "part.mapping.completed", payload: { supplierItemId, mappingVersion: version } });
  return obtenirPiece(supplierItemId);
}

// ───────────── 4-5. Identification pièce / OEM / doublon (canonique) ─────────────

/**
 * Identifie la pièce (référence OEM) et rattache la fiche canonique
 * MKA.P-MS : une correspondance sur une pièce canonique déjà existante reste
 * "à vérifier" (décision humaine) ; l'absence de correspondance crée une
 * NOUVELLE pièce canonique (ce n'est jamais une fusion, donc jamais une
 * décision à risque) — voir "MULTI-FOURNISSEURS" du plan.
 */
export async function identifierPieceEtCanonique(supplierItemId: number, actorId?: number | null) {
  const item = await obtenirPiece(supplierItemId);
  if (!item.referenceOem) {
    await db.update(partsSupplierItems).set({ canonicalMatchStatus: "non_evalue" }).where(eq(partsSupplierItems.id, supplierItemId));
    await journaliser({ supplierItemId, action: "part.canonical_skipped", actorId, detail: { motif: "Aucune référence OEM fournie." } });
    return { canonicalPartId: null as number | null, matchStatus: "non_evalue" as const };
  }

  const [existant] = await db.select().from(partsCanonical).where(eq(partsCanonical.referenceOem, item.referenceOem)).limit(1);
  if (existant) {
    await db.update(partsSupplierItems).set({ canonicalPartId: existant.id, canonicalMatchStatus: "a_verifier" }).where(eq(partsSupplierItems.id, supplierItemId));
    await journaliser({ supplierItemId, action: "part.canonical_match_found", actorId, detail: { canonicalPartId: existant.id, referenceOem: item.referenceOem } });
    return { canonicalPartId: existant.id, matchStatus: "a_verifier" as const };
  }

  const normalized = item.normalizedData as Record<string, unknown>;
  const [nouveau] = await db
    .insert(partsCanonical)
    .values({
      reference: referenceCanonique(),
      referenceOem: item.referenceOem,
      marquePiece: typeof normalized.marquePiece === "string" ? normalized.marquePiece : null,
      categorie: typeof normalized.categorie === "string" ? normalized.categorie : null,
      sousCategorie: typeof normalized.sousCategorie === "string" ? normalized.sousCategorie : null,
      nomPiece: typeof normalized.nomPiece === "string" ? normalized.nomPiece : null,
    })
    .returning();
  await db.update(partsSupplierItems).set({ canonicalPartId: nouveau.id, canonicalMatchStatus: "nouvelle_piece" }).where(eq(partsSupplierItems.id, supplierItemId));
  await journaliser({ supplierItemId, action: "part.canonical_created", actorId, detail: { canonicalPartId: nouveau.id, referenceOem: item.referenceOem } });
  return { canonicalPartId: nouveau.id, matchStatus: "nouvelle_piece" as const };
}

/** Décision humaine : confirme ou écarte le rattachement à une pièce canonique existante. */
export async function deciderCorrespondanceCanonique(input: { supplierItemId: number; decision: "confirme" | "ecarte"; actorId: number }) {
  const item = await obtenirPiece(input.supplierItemId);
  if (item.canonicalMatchStatus !== "a_verifier") throw new Error(`Statut de correspondance "${item.canonicalMatchStatus}" : rien à décider.`);
  if (input.decision === "ecarte") {
    const normalized = item.normalizedData as Record<string, unknown>;
    const [nouveau] = await db
      .insert(partsCanonical)
      .values({
        reference: referenceCanonique(),
        referenceOem: item.referenceOem,
        marquePiece: typeof normalized.marquePiece === "string" ? normalized.marquePiece : null,
        categorie: typeof normalized.categorie === "string" ? normalized.categorie : null,
      })
      .returning();
    await db.update(partsSupplierItems).set({ canonicalPartId: nouveau.id, canonicalMatchStatus: "nouvelle_piece" }).where(eq(partsSupplierItems.id, input.supplierItemId));
    await journaliser({ supplierItemId: input.supplierItemId, action: "part.canonical_match_rejected", actorId: input.actorId, detail: { nouveauCanonicalPartId: nouveau.id } });
    return obtenirPiece(input.supplierItemId);
  }
  await db.update(partsSupplierItems).set({ canonicalMatchStatus: "confirme" }).where(eq(partsSupplierItems.id, input.supplierItemId));
  await journaliser({ supplierItemId: input.supplierItemId, action: "part.canonical_match_confirmed", actorId: input.actorId, detail: { canonicalPartId: item.canonicalPartId } });
  return obtenirPiece(input.supplierItemId);
}

// ───────────────────── OEM / Cross-Reference Engine ─────────────────────

export interface DeclarerEquivalenceInput {
  referenceOem: string;
  referenceAlternative: string;
  marqueAlternative?: string | null;
  sourceType: "fournisseur" | "manuel" | "tecdoc" | "equipementier";
  sourceRef?: string | null;
  confidencePct: number;
  actorId: number;
}

/** Déclare une équivalence OEM ↔ aftermarket/équipementier. Reste "à vérifier" tant qu'un humain ne l'a pas confirmée. */
export async function declarerEquivalence(input: DeclarerEquivalenceInput) {
  const [row] = await db
    .insert(partsOemCrossReferences)
    .values({
      referenceOem: input.referenceOem.toUpperCase().trim(),
      referenceAlternative: input.referenceAlternative.toUpperCase().trim(),
      marqueAlternative: input.marqueAlternative ?? null,
      sourceType: input.sourceType,
      sourceRef: input.sourceRef ?? null,
      confidencePct: String(input.confidencePct),
      status: "a_verifier",
      createdBy: input.actorId,
    })
    .returning();
  await journaliser({ supplierItemId: null, action: "part.cross_reference_declared", actorId: input.actorId, detail: { id: row.id, referenceOem: row.referenceOem } });
  return row;
}

export async function deciderEquivalence(input: { crossReferenceId: number; decision: Extract<CrossReferenceStatus, "confirme" | "ecarte">; actorId: number }) {
  const [row] = await db
    .update(partsOemCrossReferences)
    .set({ status: input.decision, decidedBy: input.actorId, decidedAt: new Date() })
    .where(eq(partsOemCrossReferences.id, input.crossReferenceId))
    .returning();
  if (!row) throw new Error(`Équivalence #${input.crossReferenceId} introuvable.`);
  await journaliser({ supplierItemId: null, action: "part.cross_reference_decided", actorId: input.actorId, detail: { crossReferenceId: input.crossReferenceId, decision: input.decision } });
  return row;
}

export async function rechercherEquivalences(referenceOem: string) {
  return db
    .select()
    .from(partsOemCrossReferences)
    .where(and(eq(partsOemCrossReferences.referenceOem, referenceOem.toUpperCase().trim()), eq(partsOemCrossReferences.status, "confirme")));
}

// ───────────────────── Parts Compatibility Engine ─────────────────────

export interface AnalyserCompatibiliteInput {
  supplierItemId: number;
  marque: string;
  modele?: string | null;
  generation?: string | null;
  anneeDebut?: number | null;
  anneeFin?: number | null;
  codeMoteur?: string | null;
  codeBoite?: string | null;
  carburant?: string | null;
  transmission?: string | null;
  actorId?: number | null;
}

/**
 * Détermine un niveau de compatibilité déterministe, jamais "compatible"
 * uniquement parce que les mots se ressemblent : la déclaration du
 * fournisseur reste "LIKELY_COMPATIBLE" (probable, non vérifiée) tant qu'un
 * humain (ou une source technique tierce) ne la confirme pas
 * VERIFIED_COMPATIBLE via `validerCompatibilite`.
 */
export async function analyserCompatibilite(input: AnalyserCompatibiliteInput) {
  const item = await obtenirPiece(input.supplierItemId);
  let matchLevel: CompatibilityLevel;
  let source: string;
  if (!input.modele || (!input.anneeDebut && !input.anneeFin)) {
    matchLevel = "MANUAL_VALIDATION_REQUIRED";
    source = "Donnée fournisseur incomplète (modèle ou plage d'années manquante) : validation humaine requise.";
  } else {
    matchLevel = "LIKELY_COMPATIBLE";
    source = "Déclaration du fournisseur (marque/modèle/années) — non vérifiée par une source technique tierce.";
  }
  const [row] = await db
    .insert(partsCompatibilityChecks)
    .values({
      supplierItemId: input.supplierItemId,
      marque: input.marque,
      modele: input.modele ?? null,
      generation: input.generation ?? null,
      anneeDebut: input.anneeDebut ?? null,
      anneeFin: input.anneeFin ?? null,
      codeMoteur: input.codeMoteur ?? null,
      codeBoite: input.codeBoite ?? null,
      carburant: input.carburant ?? null,
      transmission: input.transmission ?? null,
      matchLevel,
      source,
    })
    .returning();
  if (item.status === "ANALYSIS_PENDING") {
    await transitionner({ supplierItemId: input.supplierItemId, fromStatus: item.status, toStatus: "COMPATIBILITY_PENDING", actorId: input.actorId });
  }
  await journaliser({ supplierItemId: input.supplierItemId, action: "part.compatibility_checked", actorId: input.actorId, detail: { matchLevel } });
  await emitSafe({ source: "parts_engine", type: "part.compatibility.checked", payload: { supplierItemId: input.supplierItemId, matchLevel } });
  return row;
}

/** Décision humaine (ou source technique tierce future) qui confirme ou écarte une compatibilité déclarée. */
export async function validerCompatibilite(input: { checkId: number; decision: Extract<CompatibilityLevel, "VERIFIED_COMPATIBLE" | "INCOMPATIBLE">; actorId: number }) {
  const [row] = await db
    .update(partsCompatibilityChecks)
    .set({ matchLevel: input.decision, decidedBy: input.actorId, decidedAt: new Date(), source: sql`${partsCompatibilityChecks.source} || ' — validé humainement.'` })
    .where(eq(partsCompatibilityChecks.id, input.checkId))
    .returning();
  if (!row) throw new Error(`Contrôle de compatibilité #${input.checkId} introuvable.`);
  await journaliser({ supplierItemId: row.supplierItemId, action: "part.compatibility_decided", actorId: input.actorId, detail: { checkId: input.checkId, decision: input.decision } });
  return row;
}

// ───────────────────── 6. Vehicle... Parts Data Quality Engine ─────────────────────

export async function controlerQualite(supplierItemId: number, actorId?: number | null) {
  const item = await obtenirPiece(supplierItemId);
  const n = item.normalizedData as Record<string, unknown>;
  const checks: { checkType: string; result: "ok" | "warning" | "error"; detail: string }[] = [];

  const req = (champ: string, niveau: "ok" | "error" = "error") => {
    const v = n[champ];
    const manquant = v === undefined || v === null || v === "";
    checks.push(manquant ? { checkType: `requis:${champ}`, result: niveau, detail: `Champ requis absent : ${champ}.` } : { checkType: `requis:${champ}`, result: "ok", detail: `${champ} présent.` });
  };
  req("marquePiece");
  req("categorie");
  req("prixFournisseur");

  const prix = Number(n.prixFournisseur);
  checks.push(
    Number.isFinite(prix) && prix > 0
      ? { checkType: "prix_positif", result: "ok", detail: `Prix ${prix}.` }
      : { checkType: "prix_positif", result: "error", detail: `Prix fournisseur invalide ou non positif : "${n.prixFournisseur}".` },
  );

  const ean = item.ean;
  if (ean) {
    const valide = /^\d{8}$|^\d{12,14}$/.test(ean);
    checks.push(valide ? { checkType: "ean_format", result: "ok", detail: "EAN/GTIN au format attendu." } : { checkType: "ean_format", result: "warning", detail: `EAN/GTIN "${ean}" de longueur inhabituelle (8, 12, 13 ou 14 attendus).` });
  } else {
    checks.push({ checkType: "ean_format", result: "warning", detail: "Aucun EAN/GTIN fourni." });
  }

  const etat = n.etatPiece;
  if (etat === undefined || etat === null || etat === "") {
    checks.push({ checkType: "etat_piece", result: "warning", detail: "État de la pièce non fourni — « neuf » par défaut à la publication." });
  } else {
    checks.push(
      CONDITIONS_VALIDES.has(String(etat))
        ? { checkType: "etat_piece", result: "ok", detail: `État "${etat}" reconnu.` }
        : { checkType: "etat_piece", result: "error", detail: `État "${etat}" non reconnu par la marketplace — valeur à corriger (validation humaine).` },
    );
  }

  await db.insert(partsQualityChecks).values(checks.map((c) => ({ supplierItemId, checkType: c.checkType, result: c.result, detail: c.detail })));

  const pire: "ok" | "warning" | "error" = checks.some((c) => c.result === "error") ? "error" : checks.some((c) => c.result === "warning") ? "warning" : "ok";
  if (pire === "error") {
    await transitionner({ supplierItemId, fromStatus: item.status, toStatus: "ERROR", reason: "Contrôle qualité en échec — voir parts_quality_checks.", actorId });
  } else if (["VALIDATION_PENDING", "ANALYSIS_PENDING", "COMPATIBILITY_PENDING"].includes(item.status)) {
    await transitionner({ supplierItemId, fromStatus: item.status, toStatus: "VALIDATION_PENDING", actorId });
  }
  await journaliser({ supplierItemId, action: "part.quality_checked", actorId, detail: { resultat: pire, controles: checks.length } });
  return { resultat: pire, checks };
}

// ───────────────────── 7. Parts Intelligence Engine (honnête) ─────────────────────

/** Aucune brique MKA.P-MS AI dédiée aux pièces (nettoyage titre, traduction, détection OEM, comparaison d'offres) n'est branchée aujourd'hui. Répond honnêtement, ne bloque jamais le pipeline. */
export async function analyserIA(supplierItemId: number, actorId?: number | null) {
  await obtenirPiece(supplierItemId);
  const aiData = {
    status: "NOT_CONNECTED" as const,
    reason: "Aucune brique MKA.P-MS AI dédiée aux pièces (nettoyage titre, traduction, classification, détection OEM, comparaison d'offres) branchée pour l'instant.",
    suggestions: null,
  };
  await db.update(partsSupplierItems).set({ aiData, updatedAt: new Date() }).where(eq(partsSupplierItems.id, supplierItemId));
  await journaliser({ supplierItemId, action: "part.ai_analyzed", actorId, detail: aiData });
  return aiData;
}

// ───────────────────── 8. Parts Pricing Engine ─────────────────────

async function tauxDevise(code: string): Promise<number | null> {
  const devises = await listCurrencies();
  const row = devises.find((d) => d.code === code.toUpperCase());
  return row ? Number(row.rateFromEur) : null;
}

export interface CalculerPrixPieceInput {
  supplierItemId: number;
  supplierPrice: number;
  supplierCurrency: string;
  commissionRatePct?: number;
  vatRatePct?: number;
  retailCurrency?: string;
  minPriceContractual?: number;
  actorId?: number | null;
}

/** Conversion réelle via les taux du Country OS — même mécanisme que le Vehicle Pricing Engine (LOT 2), table dédiée, jamais partagée. */
export async function calculerPrix(input: CalculerPrixPieceInput) {
  await obtenirPiece(input.supplierItemId);
  const tauxSource = await tauxDevise(input.supplierCurrency);
  if (!tauxSource) throw new Error(`Devise fournisseur "${input.supplierCurrency}" inconnue du Country OS.`);
  const deviseCible = input.retailCurrency ?? input.supplierCurrency;
  const tauxCible = await tauxDevise(deviseCible);
  if (!tauxCible) throw new Error(`Devise publique "${deviseCible}" inconnue du Country OS.`);

  const commission = input.commissionRatePct ?? 0;
  const vat = input.vatRatePct ?? 20;
  const montantEnEur = input.supplierPrice / tauxSource;
  const retailPriceHt = Math.round(montantEnEur * tauxCible * (1 + commission / 100) * 100) / 100;
  const retailPriceTtc = Math.round(retailPriceHt * (1 + vat / 100) * 100) / 100;

  const [row] = await db
    .insert(partsPricing)
    .values({
      supplierItemId: input.supplierItemId,
      supplierPrice: String(input.supplierPrice),
      supplierCurrency: input.supplierCurrency.toUpperCase(),
      commissionRatePct: String(commission),
      vatRatePct: String(vat),
      retailPriceHt: String(retailPriceHt),
      retailPriceTtc: String(retailPriceTtc),
      retailCurrency: deviseCible.toUpperCase(),
      minPriceContractual: input.minPriceContractual != null ? String(input.minPriceContractual) : null,
      computedAt: new Date(),
      computedBy: input.actorId ?? null,
    })
    .onConflictDoUpdate({
      target: partsPricing.supplierItemId,
      set: {
        supplierPrice: String(input.supplierPrice),
        supplierCurrency: input.supplierCurrency.toUpperCase(),
        commissionRatePct: String(commission),
        vatRatePct: String(vat),
        retailPriceHt: String(retailPriceHt),
        retailPriceTtc: String(retailPriceTtc),
        retailCurrency: deviseCible.toUpperCase(),
        minPriceContractual: input.minPriceContractual != null ? String(input.minPriceContractual) : null,
        computedAt: new Date(),
        computedBy: input.actorId ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  await journaliser({ supplierItemId: input.supplierItemId, action: "part.priced", actorId: input.actorId, detail: { retailPriceTtc, retailCurrency: deviseCible } });
  await emitSafe({ source: "parts_engine", type: "part.price.changed", payload: { supplierItemId: input.supplierItemId, retailPriceTtc, retailCurrency: deviseCible.toUpperCase() } });
  return row;
}

// ───────────────────── Parts Stock Engine ─────────────────────

function calculerStockStatus(physique: number, reserve: number, seuil: number): StockStatus {
  const disponible = physique - reserve;
  if (physique <= 0) return "OUT_OF_STOCK";
  if (disponible <= 0) return "OUT_OF_STOCK";
  if (disponible <= seuil) return "LOW_STOCK";
  return "IN_STOCK";
}

async function synchroniserStatutDepuisStock(supplierItemId: number, stockStatus: StockStatus, actorId?: number | null) {
  const item = await obtenirPiece(supplierItemId);
  if (!["PUBLISHED", "LOW_STOCK", "OUT_OF_STOCK"].includes(item.status)) return; // ne touche pas le pipeline avant publication
  const cible: PartSyncStatus = stockStatus === "OUT_OF_STOCK" ? "OUT_OF_STOCK" : stockStatus === "LOW_STOCK" ? "LOW_STOCK" : "PUBLISHED";
  if (cible === item.status) return;
  await transitionner({ supplierItemId, fromStatus: item.status, toStatus: cible, actorId: actorId ?? null });
  if (cible === "OUT_OF_STOCK") await emitSafe({ source: "parts_engine", type: "part.out_of_stock", payload: { supplierItemId } });
  if (cible === "LOW_STOCK") await emitSafe({ source: "parts_engine", type: "part.low_stock", payload: { supplierItemId } });
  await emitSafe({ source: "parts_engine", type: "part.stock.changed", payload: { supplierItemId, stockStatus } });
}

export interface DefinirStockInput {
  supplierItemId: number;
  warehouseId?: number | null;
  countryCode?: string | null;
  physicalQuantity: number;
  incomingQuantity?: number;
  restockDate?: Date | null;
  lowStockThreshold?: number;
  actorId?: number | null;
}

export async function definirStock(input: DefinirStockInput) {
  await obtenirPiece(input.supplierItemId);
  const [existant] = await db.select().from(partsStockLedger).where(eq(partsStockLedger.supplierItemId, input.supplierItemId)).limit(1);
  const reservedQuantity = existant?.reservedQuantity ?? 0;
  const seuil = input.lowStockThreshold ?? existant?.lowStockThreshold ?? 2;
  const stockStatus = calculerStockStatus(input.physicalQuantity, reservedQuantity, seuil);

  const [row] = await db
    .insert(partsStockLedger)
    .values({
      supplierItemId: input.supplierItemId,
      warehouseId: input.warehouseId ?? null,
      countryCode: input.countryCode ?? null,
      physicalQuantity: input.physicalQuantity,
      reservedQuantity,
      incomingQuantity: input.incomingQuantity ?? 0,
      restockDate: input.restockDate ?? null,
      stockStatus,
      lowStockThreshold: seuil,
    })
    .onConflictDoUpdate({
      target: partsStockLedger.supplierItemId,
      set: {
        warehouseId: input.warehouseId ?? null,
        countryCode: input.countryCode ?? null,
        physicalQuantity: input.physicalQuantity,
        incomingQuantity: input.incomingQuantity ?? 0,
        restockDate: input.restockDate ?? null,
        stockStatus,
        lowStockThreshold: seuil,
        updatedAt: new Date(),
      },
    })
    .returning();

  await journaliser({ supplierItemId: input.supplierItemId, action: "part.stock_set", actorId: input.actorId, detail: { physicalQuantity: input.physicalQuantity, stockStatus } });
  await synchroniserStatutDepuisStock(input.supplierItemId, stockStatus, input.actorId);
  return row;
}

/** Réserve une quantité (une commande immobilise du stock sans le vendre). Refuse la survente. */
export async function reserverStock(input: { supplierItemId: number; quantity: number; orderRef?: string | null; expiresAt?: Date | null; actorId?: number | null }) {
  const [ledger] = await db.select().from(partsStockLedger).where(eq(partsStockLedger.supplierItemId, input.supplierItemId)).limit(1);
  if (!ledger) throw new Error(`Aucun stock défini pour la pièce #${input.supplierItemId}.`);
  const disponible = ledger.physicalQuantity - ledger.reservedQuantity;
  if (input.quantity > disponible) throw new Error(`Stock insuffisant : ${disponible} disponible(s), ${input.quantity} demandé(s).`);

  const [reservation] = await db
    .insert(partsStockReservations)
    .values({ supplierItemId: input.supplierItemId, quantity: input.quantity, orderRef: input.orderRef ?? null, expiresAt: input.expiresAt ?? null, status: "active", createdBy: input.actorId ?? null })
    .returning();
  const nouvelleReservee = ledger.reservedQuantity + input.quantity;
  const stockStatus = calculerStockStatus(ledger.physicalQuantity, nouvelleReservee, ledger.lowStockThreshold);
  await db.update(partsStockLedger).set({ reservedQuantity: nouvelleReservee, stockStatus, updatedAt: new Date() }).where(eq(partsStockLedger.supplierItemId, input.supplierItemId));
  await journaliser({ supplierItemId: input.supplierItemId, action: "part.stock_reserved", actorId: input.actorId, detail: { reservationId: reservation.id, quantity: input.quantity } });
  await synchroniserStatutDepuisStock(input.supplierItemId, stockStatus, input.actorId);
  return reservation;
}

async function terminerReservation(reservationId: number, statut: "released" | "consumed", reason: string | null, actorId?: number | null) {
  const [reservation] = await db.select().from(partsStockReservations).where(eq(partsStockReservations.id, reservationId)).limit(1);
  if (!reservation) throw new Error(`Réservation #${reservationId} introuvable.`);
  if (reservation.status !== "active") throw new Error(`Réservation #${reservationId} déjà "${reservation.status}".`);

  await db.update(partsStockReservations).set({ status: statut, releasedAt: new Date(), releasedReason: reason }).where(eq(partsStockReservations.id, reservationId));
  const [ledger] = await db.select().from(partsStockLedger).where(eq(partsStockLedger.supplierItemId, reservation.supplierItemId)).limit(1);
  if (ledger) {
    const nouvelleReservee = Math.max(0, ledger.reservedQuantity - reservation.quantity);
    const nouvellePhysique = statut === "consumed" ? Math.max(0, ledger.physicalQuantity - reservation.quantity) : ledger.physicalQuantity;
    const stockStatus = calculerStockStatus(nouvellePhysique, nouvelleReservee, ledger.lowStockThreshold);
    await db.update(partsStockLedger).set({ reservedQuantity: nouvelleReservee, physicalQuantity: nouvellePhysique, stockStatus, updatedAt: new Date() }).where(eq(partsStockLedger.supplierItemId, reservation.supplierItemId));
    await synchroniserStatutDepuisStock(reservation.supplierItemId, stockStatus, actorId);
  }
  await journaliser({ supplierItemId: reservation.supplierItemId, action: statut === "consumed" ? "part.stock_reservation_consumed" : "part.stock_reservation_released", actorId, detail: { reservationId, reason } });
  return reservation;
}

/** Libère une réservation (paiement échoué/expiré) — préparé pour le futur hook Payment Engine (LOT 5), pas implémenté ici. */
export async function libererReservationStock(input: { reservationId: number; reason: string; actorId?: number | null }) {
  return terminerReservation(input.reservationId, "released", input.reason, input.actorId);
}

/** Consomme une réservation (vente réellement conclue) : réduit le stock physique. */
export async function consommerReservationStock(input: { reservationId: number; actorId?: number | null }) {
  return terminerReservation(input.reservationId, "consumed", null, input.actorId);
}

/** Libère automatiquement toute réservation expirée — à appeler périodiquement ou par le futur Payment Engine. */
export async function libererReservationsExpirees(): Promise<number> {
  const maintenant = new Date();
  const expirees = await db
    .select()
    .from(partsStockReservations)
    .where(and(eq(partsStockReservations.status, "active"), sql`${partsStockReservations.expiresAt} is not null and ${partsStockReservations.expiresAt} <= ${maintenant}`));
  for (const r of expirees) {
    await terminerReservation(r.id, "released", "Expiration automatique (paiement non confirmé à temps).", null);
  }
  return expirees.length;
}

// ───────────────────── 12. Parts Territory Engine ─────────────────────

export interface DefinirTerritoiresPieceInput {
  supplierItemId: number;
  allowedSaleCountries: string[];
  excludedSaleCountries?: string[];
  restrictedCountries?: string[];
  exportAllowed?: boolean;
  countryCodeOrigine?: string | null;
  hazardousMaterial?: boolean;
  fragile?: boolean;
  oversized?: boolean;
  transportRestrictions?: string[];
  preparationDelay?: number | null;
  actorId: number;
}

/**
 * Ne recrée pas de moteur pays : les codes sont vérifiés au Country OS, et
 * toute demande d'export passe par le Country Policy Engine — refusé par
 * défaut sans règle pays confirmée, jamais autorisé par défaut.
 */
export async function definirTerritoiresPiece(input: DefinirTerritoiresPieceInput) {
  await obtenirPiece(input.supplierItemId);
  const tousLesCodes = [...new Set([...input.allowedSaleCountries, ...(input.excludedSaleCountries ?? []), ...(input.restrictedCountries ?? [])])];
  const rejetes: string[] = [];
  for (const code of tousLesCodes) {
    const pays = await getCountry(code);
    if (!pays || !pays.active) rejetes.push(code);
  }
  const allowed = input.allowedSaleCountries.filter((c) => !rejetes.includes(c));
  const excluded = (input.excludedSaleCountries ?? []).filter((c) => !rejetes.includes(c));
  const restricted = (input.restrictedCountries ?? []).filter((c) => !rejetes.includes(c));

  let exportAllowed = false;
  let motifExport = "Aucun export demandé.";
  if (input.exportAllowed) {
    const decision = await evaluateAction({ actionType: "piece_export", countryCode: input.countryCodeOrigine ?? null, actorId: input.actorId, context: { supplierItemId: input.supplierItemId } });
    motifExport = decision.reason;
    if (decision.verdict === "autorise") exportAllowed = true;
  }

  const [row] = await db
    .insert(partsTerritories)
    .values({
      supplierItemId: input.supplierItemId,
      allowedSaleCountries: allowed,
      excludedSaleCountries: excluded,
      restrictedCountries: restricted,
      exportAllowed,
      hazardousMaterial: input.hazardousMaterial ?? false,
      fragile: input.fragile ?? false,
      oversized: input.oversized ?? false,
      transportRestrictions: input.transportRestrictions ?? [],
      preparationDelay: input.preparationDelay ?? null,
      updatedBy: input.actorId,
    })
    .onConflictDoUpdate({
      target: partsTerritories.supplierItemId,
      set: {
        allowedSaleCountries: allowed,
        excludedSaleCountries: excluded,
        restrictedCountries: restricted,
        exportAllowed,
        hazardousMaterial: input.hazardousMaterial ?? false,
        fragile: input.fragile ?? false,
        oversized: input.oversized ?? false,
        transportRestrictions: input.transportRestrictions ?? [],
        preparationDelay: input.preparationDelay ?? null,
        updatedBy: input.actorId,
        updatedAt: new Date(),
      },
    })
    .returning();

  await journaliser({ supplierItemId: input.supplierItemId, action: "part.territories_set", actorId: input.actorId, detail: { allowed, excluded, rejetes, exportAllowed, motifExport } });
  return { ...row, rejetes, motifExport };
}

// ───────────────────── 11-12. Préparation + validation ─────────────────────

export async function preparerPourPublication(supplierItemId: number, actorId?: number | null) {
  const item = await obtenirPiece(supplierItemId);
  const manques: string[] = [];

  const [{ n: erreurs }] = await db.select({ n: sql<number>`count(*)::int` }).from(partsQualityChecks).where(and(eq(partsQualityChecks.supplierItemId, supplierItemId), eq(partsQualityChecks.result, "error")));
  if (Number(erreurs) === 0) {
    const [dernier] = await db.select().from(partsQualityChecks).where(eq(partsQualityChecks.supplierItemId, supplierItemId)).limit(1);
    if (!dernier) manques.push("Aucun contrôle qualité effectué.");
  } else {
    manques.push(`${erreurs} contrôle(s) qualité en erreur.`);
  }

  if (item.canonicalMatchStatus === "a_verifier") manques.push("Correspondance pièce canonique non tranchée (Parts Duplicate Engine).");
  if (item.canonicalMatchStatus === "non_evalue") manques.push("Identification pièce/OEM non effectuée.");

  const [prix] = await db.select().from(partsPricing).where(eq(partsPricing.supplierItemId, supplierItemId)).limit(1);
  if (!prix?.retailPriceTtc) manques.push("Prix public non calculé (Parts Pricing Engine).");

  const [stock] = await db.select().from(partsStockLedger).where(eq(partsStockLedger.supplierItemId, supplierItemId)).limit(1);
  if (!stock) manques.push("Stock non défini (Parts Stock Engine).");

  const [territoires] = await db.select().from(partsTerritories).where(eq(partsTerritories.supplierItemId, supplierItemId)).limit(1);
  if (!territoires) manques.push("Territoires non définis (Parts Territory Engine).");

  if (manques.length > 0) {
    await transitionner({ supplierItemId, fromStatus: item.status, toStatus: "VALIDATION_PENDING", reason: manques.join(" "), actorId });
    await journaliser({ supplierItemId, action: "part.validation_required", actorId, detail: { manques } });
    await emitSafe({ source: "parts_engine", type: "part.validation.required", payload: { supplierItemId, manques } });
    return { pret: false, manques };
  }

  await transitionner({ supplierItemId, fromStatus: item.status, toStatus: "READY_TO_PUBLISH", actorId });
  await journaliser({ supplierItemId, action: "part.ready", actorId });
  await emitSafe({ source: "parts_engine", type: "part.ready", payload: { supplierItemId } });
  return { pret: true, manques: [] as string[] };
}

// ───────────────────── 13. Publication ─────────────────────

export async function validerEtPublier(input: { supplierItemId: number; actorId: number }) {
  const item = await obtenirPiece(input.supplierItemId);
  if (item.status !== "READY_TO_PUBLISH") throw new Error(`Statut actuel "${item.status}" : la publication exige READY_TO_PUBLISH (préparation complète).`);
  if (!item.canonicalPartId) throw new Error("Pièce canonique non identifiée : publication refusée.");

  const n = { ...(item.normalizedData as Record<string, unknown>), ...(item.validatedData as Record<string, unknown>) };
  const [prix] = await db.select().from(partsPricing).where(eq(partsPricing.supplierItemId, input.supplierItemId)).limit(1);
  if (!prix?.retailPriceTtc) throw new Error("Prix public introuvable : publication refusée.");
  const [stock] = await db.select().from(partsStockLedger).where(eq(partsStockLedger.supplierItemId, input.supplierItemId)).limit(1);
  if (!stock) throw new Error("Stock introuvable : publication refusée.");

  const condition = CONDITIONS_VALIDES.has(String(n.etatPiece)) ? (n.etatPiece as string) : "neuf";

  // Une pièce publiée ne doit jamais laisser une ligne parts_catalog/parts_stock
  // orpheline si une étape échoue en cours de route (ex. entrepôt introuvable) :
  // tout le côté écriture de la publication est atomique.
  const catalog = await db.transaction(async (tx) => {
    const [lienExistant] = await tx.select().from(partsSupplierShopLinks).where(eq(partsSupplierShopLinks.supplierProfileId, item.supplierProfileId)).limit(1);
    let shopId: number;
    if (lienExistant) {
      shopId = lienExistant.shopId;
    } else {
      const detailFournisseur = await obtenirFournisseurDetail(item.supplierProfileId);
      const [shop] = await tx
        .insert(partsShops)
        .values({ ownerId: input.actorId, type: "grossiste", nom: `Fournisseur ${detailFournisseur.profil.reference} (${detailFournisseur.profil.companyLegalName})`, countryCode: detailFournisseur.profil.countryCode, active: true })
        .returning();
      await tx.insert(partsSupplierShopLinks).values({ supplierProfileId: item.supplierProfileId, shopId: shop.id, technique: true });
      shopId = shop.id;
    }

    const [catalog] = await tx
      .insert(partsCatalog)
      .values({
        shopId,
        nom: String(n.nomPiece ?? n.marquePiece ?? item.reference),
        description: typeof n.description === "string" ? n.description : null,
        referenceInterne: item.reference,
        referenceOem: item.referenceOem,
        referenceEquipementier: typeof n.referenceAftermarket === "string" ? n.referenceAftermarket : null,
        codeBarre: item.ean,
        categorie: typeof n.categorie === "string" ? n.categorie : null,
        sousCategorie: typeof n.sousCategorie === "string" ? n.sousCategorie : null,
        marquePiece: typeof n.marquePiece === "string" ? n.marquePiece : null,
        etat: typeof n.etatPiece === "string" ? n.etatPiece : null,
        condition: condition as (typeof partsConditionEnum.enumValues)[number],
        fournisseurId: item.supplierProfileId,
        prixHt: String(prix.retailPriceHt ?? prix.retailPriceTtc),
        prixTtc: String(prix.retailPriceTtc),
        tvaRate: prix.vatRatePct,
        currency: prix.retailCurrency ?? "EUR",
        poidsKg: n.poids != null && Number.isFinite(Number(n.poids)) ? String(n.poids) : null,
        photoUrl: Array.isArray(n.photos) && typeof n.photos[0] === "string" ? (n.photos[0] as string) : null,
        photos: Array.isArray(n.photos) ? JSON.stringify(n.photos) : null,
        active: true,
      } as typeof partsCatalog.$inferInsert)
      .returning();

    const entrepot = stock.warehouseId ? (await tx.select({ nom: warehouses.nom }).from(warehouses).where(eq(warehouses.id, stock.warehouseId)).limit(1))[0]?.nom ?? null : null;
    await tx.insert(partsStock).values({
      catalogId: catalog.id,
      siteId: null,
      quantite: stock.physicalQuantity,
      quantiteReservee: stock.reservedQuantity,
      seuilMin: stock.lowStockThreshold,
      entrepot,
    });

    const compatibilitesConfirmees = await tx
      .select()
      .from(partsCompatibilityChecks)
      .where(and(eq(partsCompatibilityChecks.supplierItemId, input.supplierItemId), sql`${partsCompatibilityChecks.matchLevel} in ('VERIFIED_COMPATIBLE','LIKELY_COMPATIBLE')`));
    if (compatibilitesConfirmees.length > 0) {
      await tx.insert(partsCompatibility).values(
        compatibilitesConfirmees.map((c) => ({
          catalogId: catalog.id,
          marque: c.marque,
          modele: c.modele,
          moteur: c.codeMoteur,
          anneeDebut: c.anneeDebut,
          anneeFin: c.anneeFin,
        })),
      );
    }

    await tx.update(partsSupplierItems).set({ catalogId: catalog.id, status: "PUBLISHED", updatedAt: new Date() }).where(eq(partsSupplierItems.id, input.supplierItemId));
    await tx.insert(partsPublicationLog).values({ supplierItemId: input.supplierItemId, fromStatus: "READY_TO_PUBLISH", toStatus: "PUBLISHED", actorId: input.actorId });
    return catalog;
  });

  await journaliser({ supplierItemId: input.supplierItemId, action: "part.published", actorId: input.actorId, detail: { catalogId: catalog.id } });
  await emitSafe({ source: "parts_engine", type: "part.published", payload: { supplierItemId: input.supplierItemId, catalogId: catalog.id } });
  return { supplierItemId: input.supplierItemId, catalogId: catalog.id };
}

// ───────────────────── 14. Synchronisation continue ─────────────────────

export async function synchroniserPiece(input: { supplierItemId: number; rawData: Record<string, unknown>; actorId?: number | null }) {
  const item = await obtenirPiece(input.supplierItemId);
  await db.update(partsSupplierItems).set({ rawData: input.rawData, updatedAt: new Date() }).where(eq(partsSupplierItems.id, input.supplierItemId));
  await journaliser({ supplierItemId: input.supplierItemId, action: "part.updated", actorId: input.actorId, detail: { fromStatus: item.status } });
  await emitSafe({ source: "parts_engine", type: "part.updated", payload: { supplierItemId: input.supplierItemId } });
  return mapperEtNormaliser(input.supplierItemId, input.actorId);
}

export async function signalerErreurSync(input: { supplierItemId: number; reason: string }) {
  const item = await obtenirPiece(input.supplierItemId);
  await transitionner({ supplierItemId: input.supplierItemId, fromStatus: item.status, toStatus: "SYNC_ERROR", reason: input.reason, actorId: null });
  await journaliser({ supplierItemId: input.supplierItemId, action: "part.sync_failed", detail: { reason: input.reason } });
  await emitSafe({ source: "parts_engine", type: "part.sync.failed", payload: { supplierItemId: input.supplierItemId, reason: input.reason } });
  return obtenirPiece(input.supplierItemId);
}

// ───────────────────── Fin de vie ─────────────────────

export async function marquerDiscontinued(input: { supplierItemId: number; reason: string; actorId?: number | null }) {
  const item = await obtenirPiece(input.supplierItemId);
  await transitionner({ supplierItemId: input.supplierItemId, fromStatus: item.status, toStatus: "DISCONTINUED", reason: input.reason, actorId: input.actorId ?? null });
  if (item.catalogId) await db.update(partsCatalog).set({ active: false, updatedAt: new Date() }).where(eq(partsCatalog.id, item.catalogId));
  await journaliser({ supplierItemId: input.supplierItemId, action: "part.discontinued", actorId: input.actorId, detail: { reason: input.reason } });
  return obtenirPiece(input.supplierItemId);
}

export async function retirerPiece(input: { supplierItemId: number; reason: string; actorId?: number | null }) {
  const item = await obtenirPiece(input.supplierItemId);
  if (item.status === "REMOVED") throw new Error("Cette pièce est déjà retirée.");
  if (item.catalogId) await db.update(partsCatalog).set({ active: false, updatedAt: new Date() }).where(eq(partsCatalog.id, item.catalogId));
  await transitionner({ supplierItemId: input.supplierItemId, fromStatus: item.status, toStatus: "REMOVED", reason: input.reason, actorId: input.actorId ?? null });
  await journaliser({ supplierItemId: input.supplierItemId, action: "part.removed", actorId: input.actorId, detail: { reason: input.reason } });
  await emitSafe({ source: "parts_engine", type: "part.removed", payload: { supplierItemId: input.supplierItemId, reason: input.reason } });
  return obtenirPiece(input.supplierItemId);
}

// ───────────────────── Lecture ─────────────────────

export async function listerPieces(filtres?: { supplierProfileId?: number; status?: PartSyncStatus }) {
  const conditions = [];
  if (filtres?.supplierProfileId) conditions.push(eq(partsSupplierItems.supplierProfileId, filtres.supplierProfileId));
  if (filtres?.status) conditions.push(eq(partsSupplierItems.status, filtres.status));
  return db.select().from(partsSupplierItems).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(partsSupplierItems.createdAt)).limit(500);
}

export async function obtenirPieceDetail(supplierItemId: number) {
  const item = await obtenirPiece(supplierItemId);
  const [pricing, stock, reservations, compat, controles, historique] = await Promise.all([
    db.select().from(partsPricing).where(eq(partsPricing.supplierItemId, supplierItemId)).limit(1),
    db.select().from(partsStockLedger).where(eq(partsStockLedger.supplierItemId, supplierItemId)).limit(1),
    db.select().from(partsStockReservations).where(eq(partsStockReservations.supplierItemId, supplierItemId)).orderBy(desc(partsStockReservations.reservedAt)),
    db.select().from(partsCompatibilityChecks).where(eq(partsCompatibilityChecks.supplierItemId, supplierItemId)).orderBy(desc(partsCompatibilityChecks.createdAt)),
    db.select().from(partsQualityChecks).where(eq(partsQualityChecks.supplierItemId, supplierItemId)).orderBy(desc(partsQualityChecks.createdAt)),
    db.select().from(partsPublicationLog).where(eq(partsPublicationLog.supplierItemId, supplierItemId)).orderBy(desc(partsPublicationLog.createdAt)),
  ]);
  return { item, pricing: pricing[0] ?? null, stock: stock[0] ?? null, reservations, compatibilites: compat, controles, historique };
}

export async function journalAudit(supplierItemId: number, limit = 200) {
  return db.select().from(partsAuditLog).where(eq(partsAuditLog.supplierItemId, supplierItemId)).orderBy(desc(partsAuditLog.createdAt)).limit(limit);
}

// ── Health + Dashboard + Feed (standards MOS) ───────────────────────────

export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let message: string | undefined;
  let total = 0;
  let publiees = 0;
  try {
    const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(partsSupplierItems);
    total = Number(t?.n ?? 0);
    const [p] = await db.select({ n: sql<number>`count(*)::int` }).from(partsSupplierItems).where(eq(partsSupplierItems.status, "PUBLISHED"));
    publiees = Number(p?.n ?? 0);
  } catch (e) {
    status = "degraded";
    message = (e as Error).message;
  }
  const result = { engine: PARTS_ENGINE_META.name, version: VERSION, status, checkedAt: new Date().toISOString(), message, metrics: { total, publiees, responseMs: Date.now() - startedAt } };
  db.insert(partsHealthLog).values({ status, message: message ?? null, metrics: result.metrics }).catch(() => {});
  return result;
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: PARTS_ENGINE_META.name,
    label: PARTS_ENGINE_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "staging",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const parStatut = await db.select({ status: partsSupplierItems.status, n: sql<number>`count(*)::int` }).from(partsSupplierItems).groupBy(partsSupplierItems.status);
  const businessMetrics: Record<string, number | string | null> = {};
  for (const r of parStatut) businessMetrics[`pieces_${r.status.toLowerCase()}`] = Number(r.n);
  return { ...feed, businessMetrics, recentEvents: [], recentErrors: [] };
}

export { CANONICAL_PART_FIELDS };
