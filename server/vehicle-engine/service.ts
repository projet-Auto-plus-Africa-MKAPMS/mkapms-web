/**
 * Vehicle Engine — service (LOT 2 du Plan Maître Fournisseurs, VÉHICULES
 * UNIQUEMENT). Un véhicule DOIT déjà venir d'un fournisseur actif du Supplier
 * Engine (LOT 1) — ce moteur ne réinvente ni le fournisseur, ni ses
 * connecteurs, ni son mapping.
 *
 * Pipeline (point "OBJECTIF LOT 2" du plan) : ingestion → mapping →
 * normalisation → détection doublon → analyse VIN/données → contrôle
 * qualité → analyse IA → contrôle prix → contrôle territoires → contrôle
 * disponibilité → préparation annonce → validation → publication →
 * synchronisation continue → réservation → vente → retrait.
 *
 * Aucune étape n'invente une donnée : un contrôle qui ne peut pas conclure
 * répond honnêtement (avertissement, erreur, NOT_CONNECTED) plutôt que de
 * fabriquer un résultat.
 */
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  annonces,
  annonceBoiteEnum,
  annonceCarburantEnum,
  annonceCategorieEnum,
  annonceEtatEnum,
} from "../schema.js";
import { getCountry, listCurrencies } from "../country-os/index.js";
import { evaluateAction } from "../country-policy/service.js";
import { emitSafe } from "../event-bus/service.js";
import { obtenirFournisseurDetail } from "../supplier-engine/service.js";
import { checkDuplicates } from "../smart-engine/services/duplicate-detection.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import {
  vehicleAuditLog,
  vehicleAvailability,
  vehicleConditionReports,
  vehicleDuplicates,
  vehicleHealthLog,
  vehicleItems,
  vehiclePricing,
  vehiclePublicationLog,
  vehicleQualityChecks,
  vehicleTerritories,
} from "./schema.js";
import {
  CANONICAL_VEHICLE_FIELDS,
  VEHICLE_ENGINE_META,
  type ConditionStage,
  type DuplicateMatchType,
  type DuplicateStatus,
  type VehicleSyncStatus,
} from "./contract.js";

export const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_1_minimal";

function reference(): string {
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `VEH-${Date.now().toString(36).toUpperCase()}-${rnd}`;
}

async function journaliser(input: {
  vehicleItemId: number | null;
  action: string;
  actorId?: number | null;
  detail?: Record<string, unknown>;
}) {
  await db.insert(vehicleAuditLog).values({
    vehicleItemId: input.vehicleItemId,
    action: input.action,
    actorId: input.actorId ?? null,
    detail: input.detail ?? {},
  });
}

async function obtenirVehicule(vehicleItemId: number) {
  const [row] = await db.select().from(vehicleItems).where(eq(vehicleItems.id, vehicleItemId)).limit(1);
  if (!row) throw new Error(`Véhicule fournisseur #${vehicleItemId} introuvable.`);
  return row;
}

/**
 * Transition de statut : toujours journalisée dans `vehicle_publication_log`
 * (historique complet, jamais écrasé) et dans l'audit. `actorId` null =
 * transition automatique du moteur, pas une décision humaine.
 */
async function transitionner(input: {
  vehicleItemId: number;
  fromStatus: string;
  toStatus: VehicleSyncStatus;
  reason?: string | null;
  actorId?: number | null;
}) {
  await db
    .update(vehicleItems)
    .set({ status: input.toStatus, statusReason: input.reason ?? null, updatedAt: new Date() })
    .where(eq(vehicleItems.id, input.vehicleItemId));
  await db.insert(vehiclePublicationLog).values({
    vehicleItemId: input.vehicleItemId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    reason: input.reason ?? null,
    actorId: input.actorId ?? null,
  });
}

// ───────────────────────── 1. Ingestion ─────────────────────────

export interface IngererVehiculeInput {
  supplierProfileId: number;
  supplierVehicleId: string;
  ingestMethod: string;
  rawData: Record<string, unknown>;
  actorId?: number | null;
}

/**
 * Ingère un véhicule fourni par un fournisseur déjà actif. Exige : fournisseur
 * actif, type compatible (vehicules/multi — jamais un fournisseur pièces ou
 * transport seul), et une méthode de connexion réellement enregistrée pour ce
 * fournisseur (le Connector Engine du LOT 1, jamais recréé ici).
 */
export async function ingererVehicule(input: IngererVehiculeInput) {
  const detail = await obtenirFournisseurDetail(input.supplierProfileId);
  if (detail.profil.status !== "actif") {
    throw new Error(`Fournisseur #${input.supplierProfileId} non actif (statut "${detail.profil.status}") : ingestion refusée.`);
  }
  if (!["vehicules", "multi"].includes(detail.profil.supplierType)) {
    throw new Error(
      `Fournisseur #${input.supplierProfileId} de type "${detail.profil.supplierType}" : ne fournit pas de véhicules (LOT 2 = véhicules uniquement).`,
    );
  }
  const connexion = detail.connexions.find((c) => c.method === input.ingestMethod);
  if (!connexion || connexion.status === "not_connected") {
    throw new Error(
      `Méthode de connexion "${input.ingestMethod}" non configurée pour le fournisseur #${input.supplierProfileId} (Connector Engine, LOT 1).`,
    );
  }

  const [row] = await db
    .insert(vehicleItems)
    .values({
      reference: reference(),
      supplierProfileId: input.supplierProfileId,
      supplierVehicleId: input.supplierVehicleId,
      ingestMethod: input.ingestMethod,
      rawData: input.rawData,
      status: "IMPORTED",
      createdBy: input.actorId ?? null,
    })
    .returning();

  await journaliser({ vehicleItemId: row.id, action: "vehicle.imported", actorId: input.actorId, detail: { supplierProfileId: input.supplierProfileId } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.importe", payload: { vehicleItemId: row.id, supplierProfileId: input.supplierProfileId } });
  return row;
}

// ─────────────────── 2-3. Mapping + normalisation ───────────────────

/**
 * Applique le mapping actif du fournisseur (Universal Mapping Engine, LOT 1)
 * pour cette entité "vehicule". Refuse tant qu'aucun mapping n'est défini :
 * jamais de correspondance devinée entre champ fournisseur et champ canonique.
 */
export async function mapperEtNormaliser(vehicleItemId: number, actorId?: number | null) {
  const item = await obtenirVehicule(vehicleItemId);
  const detail = await obtenirFournisseurDetail(item.supplierProfileId);
  const regles = detail.mappings.filter((m) => m.entityType === "vehicule");
  if (regles.length === 0) {
    throw new Error(
      `Aucun mapping "vehicule" actif pour le fournisseur #${item.supplierProfileId} (Universal Mapping Engine, LOT 1) : impossible de normaliser sans correspondance définie.`,
    );
  }

  const raw = item.rawData as Record<string, unknown>;
  const normalized: Record<string, unknown> = {};
  for (const regle of regles) {
    if (Object.prototype.hasOwnProperty.call(raw, regle.supplierField)) {
      normalized[regle.canonicalField] = raw[regle.supplierField];
    }
  }

  const vin = typeof normalized.vin === "string" ? normalized.vin.toUpperCase().trim() : null;
  const plaque = typeof normalized.immatriculation === "string" ? normalized.immatriculation.toUpperCase().trim() : null;
  const version = regles[0]?.version ?? null;

  await db
    .update(vehicleItems)
    .set({ normalizedData: normalized, vin, plaque, mappingVersion: version, updatedAt: new Date() })
    .where(eq(vehicleItems.id, vehicleItemId));
  await transitionner({ vehicleItemId, fromStatus: item.status, toStatus: "ANALYSIS_PENDING", actorId });
  await journaliser({ vehicleItemId, action: "vehicle.mapped", actorId, detail: { mappingVersion: version, champs: Object.keys(normalized).length } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.mappe", payload: { vehicleItemId, mappingVersion: version } });
  return obtenirVehicule(vehicleItemId);
}

// ───────────────────── 4. Vehicle Duplicate Engine ─────────────────────

function confidenceFor(matchType: DuplicateMatchType): number {
  switch (matchType) {
    case "vin":
      return 98;
    case "supplier_vehicle_id":
      return 90;
    case "plaque":
      return 95;
    case "caracteristiques":
      return 60;
    default:
      return 50;
  }
}

/**
 * Détecte les doublons possibles (VIN, identifiant fournisseur, plaque,
 * caractéristiques). Chaque correspondance est écrite comme une ligne
 * "à vérifier" — jamais fusionnée ni supprimée automatiquement, conformément
 * au plan ("ne jamais fusionner une donnée sensible sans règle claire").
 */
export async function detecterDoublons(vehicleItemId: number, actorId?: number | null) {
  const item = await obtenirVehicule(vehicleItemId);
  const candidats: { id: number; matchType: DuplicateMatchType }[] = [];

  if (item.vin) {
    const rows = await db
      .select({ id: vehicleItems.id })
      .from(vehicleItems)
      .where(and(eq(vehicleItems.vin, item.vin), ne(vehicleItems.id, vehicleItemId), ne(vehicleItems.status, "REMOVED")));
    for (const r of rows) candidats.push({ id: r.id, matchType: "vin" });
  }
  if (item.plaque) {
    const rows = await db
      .select({ id: vehicleItems.id })
      .from(vehicleItems)
      .where(and(eq(vehicleItems.plaque, item.plaque), ne(vehicleItems.id, vehicleItemId), ne(vehicleItems.status, "REMOVED")));
    for (const r of rows) candidats.push({ id: r.id, matchType: "plaque" });
  }
  const rowsSameSupplier = await db
    .select({ id: vehicleItems.id })
    .from(vehicleItems)
    .where(
      and(
        eq(vehicleItems.supplierProfileId, item.supplierProfileId),
        eq(vehicleItems.supplierVehicleId, item.supplierVehicleId),
        ne(vehicleItems.id, vehicleItemId),
        ne(vehicleItems.status, "REMOVED"),
      ),
    );
  for (const r of rowsSameSupplier) candidats.push({ id: r.id, matchType: "supplier_vehicle_id" });

  const dejaSignalees = await db
    .select({ matchedVehicleItemId: vehicleDuplicates.matchedVehicleItemId })
    .from(vehicleDuplicates)
    .where(eq(vehicleDuplicates.vehicleItemId, vehicleItemId));
  const dejaSignaleesSet = new Set(dejaSignalees.map((d) => d.matchedVehicleItemId));

  const inserts: { matchedId: number; matchType: DuplicateMatchType; confidence: number }[] = [];
  for (const c of candidats) {
    if (dejaSignaleesSet.has(c.id)) continue;
    inserts.push({ matchedId: c.id, matchType: c.matchType, confidence: confidenceFor(c.matchType) });
    dejaSignaleesSet.add(c.id);
  }
  for (const ins of inserts) {
    await db.insert(vehicleDuplicates).values({
      vehicleItemId,
      matchedVehicleItemId: ins.matchedId,
      matchType: ins.matchType,
      confidencePct: String(ins.confidence),
      status: "a_verifier",
    });
    await emitSafe({
      source: "vehicle_engine",
      type: "vehicule.doublon_detecte",
      payload: { vehicleItemId, matchedVehicleItemId: ins.matchedId, matchType: ins.matchType, confidencePct: ins.confidence },
    });
  }
  await journaliser({ vehicleItemId, action: "vehicle.duplicates_checked", actorId, detail: { trouves: inserts.length } });
  return db.select().from(vehicleDuplicates).where(eq(vehicleDuplicates.vehicleItemId, vehicleItemId)).orderBy(desc(vehicleDuplicates.createdAt));
}

/** Décision humaine sur un doublon détecté — jamais automatique. */
export async function deciderDoublon(input: { duplicateId: number; decision: Extract<DuplicateStatus, "confirme" | "ecarte">; actorId: number }) {
  const [row] = await db
    .update(vehicleDuplicates)
    .set({ status: input.decision, decidedBy: input.actorId, decidedAt: new Date() })
    .where(eq(vehicleDuplicates.id, input.duplicateId))
    .returning();
  if (!row) throw new Error(`Doublon #${input.duplicateId} introuvable.`);
  await journaliser({ vehicleItemId: row.vehicleItemId, action: "vehicle.duplicate_decided", actorId: input.actorId, detail: { duplicateId: input.duplicateId, decision: input.decision } });
  return row;
}

// ───────────────────── 5. Analyse VIN / données ─────────────────────

/** Décodage structurel local (ISO 3779) — même principe qu'un décodage sans base externe : format uniquement, jamais une donnée inventée. */
export function decoderVinStructurel(vin: string): { valide: boolean; motif: string } {
  const v = vin.toUpperCase().trim();
  if (v.length !== 17) return { valide: false, motif: `Longueur invalide (${v.length}, attendu 17).` };
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) return { valide: false, motif: "Caractère interdit (I, O, Q exclus par ISO 3779) ou non alphanumérique." };
  return { valide: true, motif: "Format ISO 3779 valide." };
}

/**
 * Analyse déterministe des données normalisées : validité du VIN, présence
 * des champs canoniques minimaux. N'invente jamais un kilométrage, un
 * historique, un accident ou une option — seulement une lecture honnête de ce
 * qui est déjà là.
 */
export async function analyserDonnees(vehicleItemId: number, actorId?: number | null) {
  const item = await obtenirVehicule(vehicleItemId);
  const normalized = item.normalizedData as Record<string, unknown>;
  const enrichment: Record<string, unknown> = {};

  if (item.vin) {
    enrichment.vinCheck = decoderVinStructurel(item.vin);
  } else {
    enrichment.vinCheck = { valide: false, motif: "Aucun VIN fourni par le fournisseur." };
  }

  const champsRequis = ["marque", "modele", "prixFournisseur"] as const;
  const manquants = champsRequis.filter((c) => normalized[c] === undefined || normalized[c] === null || normalized[c] === "");
  enrichment.champsManquants = manquants;
  enrichment.identifiantPresent = Boolean(item.vin || item.supplierVehicleId);

  await db.update(vehicleItems).set({ enrichedData: enrichment, updatedAt: new Date() }).where(eq(vehicleItems.id, vehicleItemId));
  await journaliser({ vehicleItemId, action: "vehicle.data_analyzed", actorId, detail: enrichment });
  return enrichment;
}

// ───────────────────── 6. Vehicle Data Quality Engine ─────────────────────

const CATEGORIES_VALIDES = new Set(annonceCategorieEnum.enumValues as readonly string[]);
const ETATS_VALIDES = new Set(annonceEtatEnum.enumValues as readonly string[]);
const CARBURANTS_VALIDES = new Set(annonceCarburantEnum.enumValues as readonly string[]);
const BOITES_VALIDES = new Set(annonceBoiteEnum.enumValues as readonly string[]);

/**
 * Contrôle qualité déterministe avant publication : champs requis présents,
 * VIN structurellement valide s'il est fourni, prix positif, valeurs
 * compatibles avec les énumérations réelles de la marketplace (`annonces`).
 * Un champ non conforme est une "error" qui bloque la publication — jamais
 * corrigé silencieusement.
 */
export async function controlerQualite(vehicleItemId: number, actorId?: number | null) {
  const item = await obtenirVehicule(vehicleItemId);
  const n = item.normalizedData as Record<string, unknown>;
  const checks: { checkType: string; result: "ok" | "warning" | "error"; detail: string }[] = [];

  const req = (champ: string) => {
    const v = n[champ];
    checks.push(v === undefined || v === null || v === "" ? { checkType: `requis:${champ}`, result: "error", detail: `Champ requis absent : ${champ}.` } : { checkType: `requis:${champ}`, result: "ok", detail: `${champ} présent.` });
  };
  req("marque");
  req("modele");
  req("prixFournisseur");

  const prix = Number(n.prixFournisseur);
  checks.push(
    Number.isFinite(prix) && prix > 0
      ? { checkType: "prix_positif", result: "ok", detail: `Prix ${prix}.` }
      : { checkType: "prix_positif", result: "error", detail: `Prix fournisseur invalide ou non positif : "${n.prixFournisseur}".` },
  );

  if (item.vin) {
    const vinCheck = decoderVinStructurel(item.vin);
    checks.push(vinCheck.valide ? { checkType: "vin_format", result: "ok", detail: vinCheck.motif } : { checkType: "vin_format", result: "error", detail: vinCheck.motif });
  } else {
    checks.push({ checkType: "vin_format", result: "warning", detail: "Aucun VIN fourni — déduplication VIN impossible pour ce véhicule." });
  }

  const enumCheck = (champ: string, ensemble: Set<string>, label: string) => {
    const v = n[champ];
    if (v === undefined || v === null || v === "") {
      checks.push({ checkType: `enum:${champ}`, result: "warning", detail: `${label} non fourni — valeur par défaut de la marketplace utilisée à la publication.` });
      return;
    }
    checks.push(
      ensemble.has(String(v))
        ? { checkType: `enum:${champ}`, result: "ok", detail: `${label} "${v}" reconnu.` }
        : { checkType: `enum:${champ}`, result: "error", detail: `${label} "${v}" non reconnu par la marketplace — valeur à corriger (validation humaine).` },
    );
  };
  // "carrosserie" et "transmission" sont les champs canoniques réels
  // (CANONICAL_VEHICLE_FIELDS) — la marketplace les nomme "categorie"/"boite".
  enumCheck("carrosserie", CATEGORIES_VALIDES, "Catégorie (carrosserie)");
  enumCheck("etat", ETATS_VALIDES, "État");
  enumCheck("carburant", CARBURANTS_VALIDES, "Carburant");
  enumCheck("transmission", BOITES_VALIDES, "Boîte (transmission)");

  await db.insert(vehicleQualityChecks).values(checks.map((c) => ({ vehicleItemId, checkType: c.checkType, result: c.result, detail: c.detail })));

  const pire: "ok" | "warning" | "error" = checks.some((c) => c.result === "error") ? "error" : checks.some((c) => c.result === "warning") ? "warning" : "ok";
  if (pire === "error") {
    await transitionner({ vehicleItemId, fromStatus: item.status, toStatus: "ERROR", reason: "Contrôle qualité en échec — voir vehicle_quality_checks.", actorId });
  } else if (item.status === "ANALYSIS_PENDING") {
    await transitionner({ vehicleItemId, fromStatus: item.status, toStatus: "VALIDATION_PENDING", actorId });
  }
  await journaliser({ vehicleItemId, action: "vehicle.quality_checked", actorId, detail: { resultat: pire, controles: checks.length } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.controle_qualite", payload: { vehicleItemId, resultat: pire } });
  return { resultat: pire, checks };
}

// ───────────────────── 7. Vehicle AI Engine (honnête) ─────────────────────

/**
 * Point d'intégration IA : aucune clé/modèle dédié "description auto" ou
 * "score qualité photo" n'est branché aujourd'hui (voir audit LOT 2). Répond
 * honnêtement NOT_CONNECTED plutôt que d'inventer une suggestion — ne bloque
 * jamais le reste du pipeline.
 */
export async function analyserIA(vehicleItemId: number, actorId?: number | null) {
  const item = await obtenirVehicule(vehicleItemId);
  const aiData = {
    status: "NOT_CONNECTED" as const,
    reason: "Aucun moteur IA véhicule (description automatique, score qualité photo) branché pour l'instant — voir server/intelligences/outils/familles/vehicules.ts.",
    suggestions: null,
  };
  await db.update(vehicleItems).set({ aiData, updatedAt: new Date() }).where(eq(vehicleItems.id, vehicleItemId));
  await journaliser({ vehicleItemId, action: "vehicle.ai_analyzed", actorId, detail: aiData });
  return aiData;
}

// ───────────────────── 8. Vehicle Pricing Engine ─────────────────────

async function tauxDevise(code: string): Promise<number | null> {
  const devises = await listCurrencies();
  const row = devises.find((d) => d.code === code.toUpperCase());
  return row ? Number(row.rateFromEur) : null;
}

export interface CalculerPrixInput {
  vehicleItemId: number;
  supplierPrice: number;
  supplierCurrency: string;
  commissionRatePct?: number;
  publicCurrency?: string;
  minPriceContractual?: number;
  actorId?: number | null;
}

/**
 * Calcule le prix public à partir du prix fournisseur et de la commission.
 * Conversion réelle via les taux du Country OS (`country_currencies`) — pas
 * de moteur de devise séparé, pas de taux inventé : une devise inconnue du
 * Country OS bloque la conversion avec un message clair.
 */
export async function calculerPrix(input: CalculerPrixInput) {
  await obtenirVehicule(input.vehicleItemId);
  const tauxSource = await tauxDevise(input.supplierCurrency);
  if (!tauxSource) throw new Error(`Devise fournisseur "${input.supplierCurrency}" inconnue du Country OS.`);
  const deviseCible = input.publicCurrency ?? input.supplierCurrency;
  const tauxCible = await tauxDevise(deviseCible);
  if (!tauxCible) throw new Error(`Devise publique "${deviseCible}" inconnue du Country OS.`);

  const commission = input.commissionRatePct ?? 0;
  const montantEnEur = input.supplierPrice / tauxSource;
  const publicPrice = Math.round(montantEnEur * tauxCible * (1 + commission / 100) * 100) / 100;

  const [row] = await db
    .insert(vehiclePricing)
    .values({
      vehicleItemId: input.vehicleItemId,
      supplierPrice: String(input.supplierPrice),
      supplierCurrency: input.supplierCurrency.toUpperCase(),
      commissionRatePct: String(commission),
      publicPrice: String(publicPrice),
      publicCurrency: deviseCible.toUpperCase(),
      minPriceContractual: input.minPriceContractual != null ? String(input.minPriceContractual) : null,
      computedAt: new Date(),
      computedBy: input.actorId ?? null,
    })
    .onConflictDoUpdate({
      target: vehiclePricing.vehicleItemId,
      set: {
        supplierPrice: String(input.supplierPrice),
        supplierCurrency: input.supplierCurrency.toUpperCase(),
        commissionRatePct: String(commission),
        publicPrice: String(publicPrice),
        publicCurrency: deviseCible.toUpperCase(),
        minPriceContractual: input.minPriceContractual != null ? String(input.minPriceContractual) : null,
        computedAt: new Date(),
        computedBy: input.actorId ?? null,
        updatedAt: new Date(),
      },
    })
    .returning();

  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.priced", actorId: input.actorId, detail: { publicPrice, publicCurrency: deviseCible } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.prix_calcule", payload: { vehicleItemId: input.vehicleItemId, publicPrice, publicCurrency: deviseCible.toUpperCase() } });
  return row;
}

// ───────────────────── 9. Vehicle Territory Engine ─────────────────────

export interface DefinirTerritoiresVehiculeInput {
  vehicleItemId: number;
  allowedSaleCountries: string[];
  excludedSaleCountries?: string[];
  exportAllowed?: boolean;
  euExportAllowed?: boolean;
  worldwideExportAllowed?: boolean;
  pickupCity?: string | null;
  pickupCountryCode?: string | null;
  vehicleReadyDelay?: number | null;
  documentsReadyForExport?: boolean;
  transportEligible?: boolean;
  transportModesAllowed?: string[];
  actorId: number;
}

/**
 * Ne recrée pas de moteur pays : les codes pays sont vérifiés au Country OS,
 * et toute demande d'export est soumise au Country Policy Engine — l'absence
 * de règle confirmée entraîne un export refusé par défaut, jamais autorisé
 * par défaut ("l'absence d'information n'est pas une autorisation").
 */
export async function definirTerritoiresVehicule(input: DefinirTerritoiresVehiculeInput) {
  await obtenirVehicule(input.vehicleItemId);
  const tousLesCodes = [...new Set([...input.allowedSaleCountries, ...(input.excludedSaleCountries ?? [])])];
  const rejetes: string[] = [];
  for (const code of tousLesCodes) {
    const pays = await getCountry(code);
    if (!pays || !pays.active) rejetes.push(code);
  }
  const allowed = input.allowedSaleCountries.filter((c) => !rejetes.includes(c));
  const excluded = (input.excludedSaleCountries ?? []).filter((c) => !rejetes.includes(c));

  let exportAllowed = false;
  let euExportAllowed = false;
  let worldwideExportAllowed = false;
  let motifExport = "Aucun export demandé.";
  if (input.exportAllowed || input.euExportAllowed || input.worldwideExportAllowed) {
    const paysDepart = input.pickupCountryCode ?? null;
    const decision = await evaluateAction({
      actionType: "vehicule_export",
      countryCode: paysDepart,
      actorId: input.actorId,
      context: { vehicleItemId: input.vehicleItemId },
    });
    motifExport = decision.reason;
    if (decision.verdict === "autorise") {
      exportAllowed = Boolean(input.exportAllowed);
      euExportAllowed = Boolean(input.euExportAllowed);
      worldwideExportAllowed = Boolean(input.worldwideExportAllowed);
    }
  }

  const [row] = await db
    .insert(vehicleTerritories)
    .values({
      vehicleItemId: input.vehicleItemId,
      allowedSaleCountries: allowed,
      excludedSaleCountries: excluded,
      exportAllowed,
      euExportAllowed,
      worldwideExportAllowed,
      pickupCity: input.pickupCity ?? null,
      pickupCountryCode: input.pickupCountryCode ?? null,
      vehicleReadyDelay: input.vehicleReadyDelay ?? null,
      documentsReadyForExport: input.documentsReadyForExport ?? false,
      transportEligible: input.transportEligible ?? false,
      transportModesAllowed: input.transportModesAllowed ?? [],
      updatedBy: input.actorId,
    })
    .onConflictDoUpdate({
      target: vehicleTerritories.vehicleItemId,
      set: {
        allowedSaleCountries: allowed,
        excludedSaleCountries: excluded,
        exportAllowed,
        euExportAllowed,
        worldwideExportAllowed,
        pickupCity: input.pickupCity ?? null,
        pickupCountryCode: input.pickupCountryCode ?? null,
        vehicleReadyDelay: input.vehicleReadyDelay ?? null,
        documentsReadyForExport: input.documentsReadyForExport ?? false,
        transportEligible: input.transportEligible ?? false,
        transportModesAllowed: input.transportModesAllowed ?? [],
        updatedBy: input.actorId,
        updatedAt: new Date(),
      },
    })
    .returning();

  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.territories_set", actorId: input.actorId, detail: { allowed, excluded, rejetes, exportAllowed, motifExport } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.territoires_definis", payload: { vehicleItemId: input.vehicleItemId } });
  return { ...row, rejetes, motifExport };
}

// ───────────────────── 10. Vehicle Availability Engine ─────────────────────

/** Garantit une ligne de disponibilité "available" par véhicule — jamais devinée à la publication. */
export async function assurerDisponibilite(vehicleItemId: number) {
  const [existant] = await db.select().from(vehicleAvailability).where(eq(vehicleAvailability.vehicleItemId, vehicleItemId)).limit(1);
  if (existant) return existant;
  const [row] = await db.insert(vehicleAvailability).values({ vehicleItemId, status: "available" }).returning();
  return row;
}

// ───────────────────── 11-12. Préparation + validation ─────────────────────

/**
 * Vérifie que toutes les conditions préalables sont réunies (données
 * normalisées, contrôle qualité sans erreur, territoires définis, prix
 * calculé, disponibilité connue) et fait passer le véhicule en
 * READY_TO_PUBLISH. Sinon, reste en VALIDATION_PENDING avec le motif exact —
 * jamais publié par défaut.
 */
export async function preparerPourPublication(vehicleItemId: number, actorId?: number | null) {
  const item = await obtenirVehicule(vehicleItemId);
  const manques: string[] = [];

  const [dernierControle] = await db
    .select()
    .from(vehicleQualityChecks)
    .where(eq(vehicleQualityChecks.vehicleItemId, vehicleItemId))
    .orderBy(desc(vehicleQualityChecks.createdAt))
    .limit(1);
  if (!dernierControle) manques.push("Aucun contrôle qualité effectué.");
  const [{ n: erreurs }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(vehicleQualityChecks)
    .where(and(eq(vehicleQualityChecks.vehicleItemId, vehicleItemId), eq(vehicleQualityChecks.result, "error")));
  if (Number(erreurs) > 0) manques.push(`${erreurs} contrôle(s) qualité en erreur.`);

  const [territoires] = await db.select().from(vehicleTerritories).where(eq(vehicleTerritories.vehicleItemId, vehicleItemId)).limit(1);
  if (!territoires) manques.push("Territoires non définis (Vehicle Territory Engine).");

  const [prix] = await db.select().from(vehiclePricing).where(eq(vehiclePricing.vehicleItemId, vehicleItemId)).limit(1);
  if (!prix || !prix.publicPrice) manques.push("Prix public non calculé (Vehicle Pricing Engine).");

  const dispo = await assurerDisponibilite(vehicleItemId);
  if (dispo.status !== "available") manques.push(`Disponibilité actuelle "${dispo.status}" : non publiable.`);

  const nUnresolvedDupes = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(vehicleDuplicates)
    .where(and(eq(vehicleDuplicates.vehicleItemId, vehicleItemId), eq(vehicleDuplicates.status, "a_verifier")));
  if (Number(nUnresolvedDupes[0]?.n ?? 0) > 0) manques.push("Doublon(s) potentiel(s) non tranché(s) (Vehicle Duplicate Engine).");

  if (manques.length > 0) {
    await transitionner({ vehicleItemId, fromStatus: item.status, toStatus: "VALIDATION_PENDING", reason: manques.join(" "), actorId });
    await journaliser({ vehicleItemId, action: "vehicle.preparation_incomplete", actorId, detail: { manques } });
    return { pret: false, manques };
  }

  await transitionner({ vehicleItemId, fromStatus: item.status, toStatus: "READY_TO_PUBLISH", actorId });
  await journaliser({ vehicleItemId, action: "vehicle.ready_to_publish", actorId });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.pret_a_publier", payload: { vehicleItemId } });
  return { pret: true, manques: [] as string[] };
}

// ───────────────────── 13. Publication ─────────────────────

/**
 * Décision humaine de publication (jamais automatique — même principe que
 * `activerFournisseur` du LOT 1) : crée l'annonce dans la marketplace déjà
 * existante (`annonces`) à partir de la donnée normalisée, avec toute
 * correction humaine (`validatedData`) prioritaire sur la donnée normalisée.
 */
export async function validerEtPublier(input: { vehicleItemId: number; actorId: number }) {
  const item = await obtenirVehicule(input.vehicleItemId);
  if (item.status !== "READY_TO_PUBLISH") {
    throw new Error(`Statut actuel "${item.status}" : la publication exige READY_TO_PUBLISH (préparation complète).`);
  }
  const n = { ...(item.normalizedData as Record<string, unknown>), ...(item.validatedData as Record<string, unknown>) };
  const [prix] = await db.select().from(vehiclePricing).where(eq(vehiclePricing.vehicleItemId, input.vehicleItemId)).limit(1);
  if (!prix?.publicPrice) throw new Error("Prix public introuvable : publication refusée.");
  const [territoires] = await db.select().from(vehicleTerritories).where(eq(vehicleTerritories.vehicleItemId, input.vehicleItemId)).limit(1);

  const categorie = CATEGORIES_VALIDES.has(String(n.carrosserie)) ? (n.carrosserie as string) : undefined;
  const etat = ETATS_VALIDES.has(String(n.etat)) ? (n.etat as string) : undefined;
  const carburant = CARBURANTS_VALIDES.has(String(n.carburant)) ? (n.carburant as string) : undefined;
  const boite = BOITES_VALIDES.has(String(n.transmission)) ? (n.transmission as string) : undefined;

  const [annonce] = await db
    .insert(annonces)
    .values({
      // `annonces.reference` est un varchar(24) : trop court pour porter la
      // référence complète du véhicule fournisseur (`item.reference`), qui
      // reste la clé de traçabilité côté vehicle_items.
      reference: `MKA-VEH-${item.id}`,
      ownerId: input.actorId,
      type: "vente",
      status: "publiee",
      titre: `${n.marque ?? "Véhicule"} ${n.modele ?? ""}`.trim(),
      description: typeof n.description === "string" ? n.description : null,
      marque: String(n.marque ?? ""),
      modele: String(n.modele ?? ""),
      version: typeof n.version === "string" ? n.version : null,
      ...(categorie ? { categorie: categorie as (typeof annonceCategorieEnum.enumValues)[number] } : {}),
      ...(etat ? { etat: etat as (typeof annonceEtatEnum.enumValues)[number] } : {}),
      ...(carburant ? { carburant: carburant as (typeof annonceCarburantEnum.enumValues)[number] } : {}),
      ...(boite ? { boite: boite as (typeof annonceBoiteEnum.enumValues)[number] } : {}),
      annee: Number.isFinite(Number(n.annee)) ? Number(n.annee) : null,
      kilometrage: Number.isFinite(Number(n.kilometrage)) ? Number(n.kilometrage) : null,
      couleur: typeof n.couleur === "string" ? n.couleur : null,
      prix: String(prix.publicPrice),
      devise: prix.publicCurrency ?? "EUR",
      ville: territoires?.pickupCity ?? null,
      pays: territoires?.pickupCountryCode ?? "FR",
      vendeurType: "professionnel",
      vin: item.vin,
      plaque: item.plaque,
    } as typeof annonces.$inferInsert)
    .returning();

  await db.update(vehicleItems).set({ annonceId: annonce.id, updatedAt: new Date() }).where(eq(vehicleItems.id, input.vehicleItemId));
  await transitionner({ vehicleItemId: input.vehicleItemId, fromStatus: "READY_TO_PUBLISH", toStatus: "PUBLISHED", actorId: input.actorId });
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.published", actorId: input.actorId, detail: { annonceId: annonce.id } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.publie", payload: { vehicleItemId: input.vehicleItemId, annonceId: annonce.id } });
  checkDuplicates(annonce.id).catch(() => {});
  return { vehicleItemId: input.vehicleItemId, annonceId: annonce.id };
}

// ───────────────────── 14. Synchronisation continue ─────────────────────

/** Ré-ingestion d'une mise à jour fournisseur — la donnée brute d'origine reste tracée séparément à chaque appel. */
export async function synchroniserVehicule(input: { vehicleItemId: number; rawData: Record<string, unknown>; actorId?: number | null }) {
  const item = await obtenirVehicule(input.vehicleItemId);
  await db.update(vehicleItems).set({ rawData: input.rawData, updatedAt: new Date() }).where(eq(vehicleItems.id, input.vehicleItemId));
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.resynchronized", actorId: input.actorId, detail: { fromStatus: item.status } });
  return mapperEtNormaliser(input.vehicleItemId, input.actorId);
}

/**
 * Le fournisseur signale (par son connecteur) que le véhicule a été vendu ou
 * retiré ailleurs — MKA.P-MS le retire de sa propre marketplace en
 * conséquence. `actorId` absent = signal automatique du connecteur.
 */
export async function signalerIndisponibiliteFournisseur(input: { vehicleItemId: number; reason: string; actorId?: number | null }) {
  const item = await obtenirVehicule(input.vehicleItemId);
  await transitionner({ vehicleItemId: input.vehicleItemId, fromStatus: item.status, toStatus: "UNAVAILABLE", reason: input.reason, actorId: input.actorId });
  if (item.annonceId) {
    await db.update(annonces).set({ status: "archivee", updatedAt: new Date() }).where(eq(annonces.id, item.annonceId));
  }
  await db
    .insert(vehicleAvailability)
    .values({ vehicleItemId: input.vehicleItemId, status: "unavailable" })
    .onConflictDoUpdate({ target: vehicleAvailability.vehicleItemId, set: { status: "unavailable", updatedAt: new Date() } });
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.unavailable", actorId: input.actorId, detail: { reason: input.reason } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.indisponible", payload: { vehicleItemId: input.vehicleItemId, reason: input.reason } });
  return obtenirVehicule(input.vehicleItemId);
}

export async function signalerErreurSync(input: { vehicleItemId: number; reason: string }) {
  const item = await obtenirVehicule(input.vehicleItemId);
  await transitionner({ vehicleItemId: input.vehicleItemId, fromStatus: item.status, toStatus: "SYNC_ERROR", reason: input.reason, actorId: null });
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.sync_error", detail: { reason: input.reason } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.erreur_sync", payload: { vehicleItemId: input.vehicleItemId, reason: input.reason } });
  return obtenirVehicule(input.vehicleItemId);
}

// ───────────────────── 15-16. Réservation / vente ─────────────────────

export async function reserverVehicule(input: { vehicleItemId: number; reservedBy?: number | null; reservedUntil?: Date | null; bookingId?: number | null; actorId: number }) {
  const item = await obtenirVehicule(input.vehicleItemId);
  if (item.status !== "PUBLISHED") throw new Error(`Statut actuel "${item.status}" : seul un véhicule publié peut être réservé.`);
  await db
    .update(vehicleAvailability)
    .set({ status: "reserved", reservedBy: input.reservedBy ?? null, reservedAt: new Date(), reservedUntil: input.reservedUntil ?? null, bookingId: input.bookingId ?? null, updatedAt: new Date() })
    .where(eq(vehicleAvailability.vehicleItemId, input.vehicleItemId));
  await transitionner({ vehicleItemId: input.vehicleItemId, fromStatus: item.status, toStatus: "RESERVED", actorId: input.actorId });
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.reserved", actorId: input.actorId, detail: { bookingId: input.bookingId ?? null } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.reserve", payload: { vehicleItemId: input.vehicleItemId } });
  return obtenirVehicule(input.vehicleItemId);
}

/** Une réservation qui n'aboutit pas doit pouvoir revenir en disponible — sinon le véhicule reste bloqué indéfiniment. */
export async function libererReservation(input: { vehicleItemId: number; reason: string; actorId: number }) {
  const item = await obtenirVehicule(input.vehicleItemId);
  if (item.status !== "RESERVED") throw new Error(`Statut actuel "${item.status}" : rien à libérer.`);
  await db
    .update(vehicleAvailability)
    .set({ status: "available", reservedBy: null, reservedAt: null, reservedUntil: null, bookingId: null, updatedAt: new Date() })
    .where(eq(vehicleAvailability.vehicleItemId, input.vehicleItemId));
  await transitionner({ vehicleItemId: input.vehicleItemId, fromStatus: item.status, toStatus: "PUBLISHED", reason: input.reason, actorId: input.actorId });
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.reservation_released", actorId: input.actorId, detail: { reason: input.reason } });
  return obtenirVehicule(input.vehicleItemId);
}

export async function marquerVendu(input: { vehicleItemId: number; actorId: number }) {
  const item = await obtenirVehicule(input.vehicleItemId);
  if (!["RESERVED", "PUBLISHED"].includes(item.status)) {
    throw new Error(`Statut actuel "${item.status}" : seul un véhicule publié ou réservé peut être marqué vendu.`);
  }
  await db
    .update(vehicleAvailability)
    .set({ status: "sold", soldAt: new Date(), updatedAt: new Date() })
    .where(eq(vehicleAvailability.vehicleItemId, input.vehicleItemId));
  if (item.annonceId) {
    await db.update(annonces).set({ status: "vendue", updatedAt: new Date() }).where(eq(annonces.id, item.annonceId));
  }
  await transitionner({ vehicleItemId: input.vehicleItemId, fromStatus: item.status, toStatus: "SOLD", actorId: input.actorId });
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.sold", actorId: input.actorId });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.vendu", payload: { vehicleItemId: input.vehicleItemId } });
  return obtenirVehicule(input.vehicleItemId);
}

// ───────────────────── 17. Retrait ─────────────────────

/** `actorId` absent = retrait automatique (déclenché par une synchronisation fournisseur). */
export async function retirerVehicule(input: { vehicleItemId: number; reason: string; actorId?: number | null }) {
  const item = await obtenirVehicule(input.vehicleItemId);
  if (item.status === "REMOVED") throw new Error("Ce véhicule est déjà retiré.");
  if (item.annonceId) {
    await db.update(annonces).set({ status: "archivee", updatedAt: new Date() }).where(eq(annonces.id, item.annonceId));
  }
  await transitionner({ vehicleItemId: input.vehicleItemId, fromStatus: item.status, toStatus: "REMOVED", reason: input.reason, actorId: input.actorId ?? null });
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.removed", actorId: input.actorId, detail: { reason: input.reason } });
  await emitSafe({ source: "vehicle_engine", type: "vehicule.retire", payload: { vehicleItemId: input.vehicleItemId, reason: input.reason } });
  return obtenirVehicule(input.vehicleItemId);
}

// ───────────────────── Rapports d'état (Vehicle Condition Engine) ─────────────────────

export async function ajouterRapportEtat(input: {
  vehicleItemId: number;
  stage: ConditionStage;
  reportedBy?: number | null;
  kilometrage?: number | null;
  notes?: string | null;
  photos?: string[];
  videos?: string[];
}) {
  await obtenirVehicule(input.vehicleItemId);
  const [row] = await db
    .insert(vehicleConditionReports)
    .values({
      vehicleItemId: input.vehicleItemId,
      stage: input.stage,
      reportedBy: input.reportedBy ?? null,
      kilometrage: input.kilometrage ?? null,
      notes: input.notes ?? null,
      photos: input.photos ?? [],
      videos: input.videos ?? [],
    })
    .returning();
  await journaliser({ vehicleItemId: input.vehicleItemId, action: "vehicle.condition_reported", actorId: input.reportedBy, detail: { stage: input.stage } });
  return row;
}

// ───────────────────── Lecture ─────────────────────

export async function listerVehicules(filtres?: { supplierProfileId?: number; status?: VehicleSyncStatus }) {
  const conditions = [];
  if (filtres?.supplierProfileId) conditions.push(eq(vehicleItems.supplierProfileId, filtres.supplierProfileId));
  if (filtres?.status) conditions.push(eq(vehicleItems.status, filtres.status));
  return db
    .select()
    .from(vehicleItems)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(vehicleItems.createdAt))
    .limit(500);
}

export async function obtenirVehiculeDetail(vehicleItemId: number) {
  const item = await obtenirVehicule(vehicleItemId);
  const [territoires, disponibilite, prix, doublons, controles, rapports, historique] = await Promise.all([
    db.select().from(vehicleTerritories).where(eq(vehicleTerritories.vehicleItemId, vehicleItemId)).limit(1),
    db.select().from(vehicleAvailability).where(eq(vehicleAvailability.vehicleItemId, vehicleItemId)).limit(1),
    db.select().from(vehiclePricing).where(eq(vehiclePricing.vehicleItemId, vehicleItemId)).limit(1),
    db.select().from(vehicleDuplicates).where(eq(vehicleDuplicates.vehicleItemId, vehicleItemId)).orderBy(desc(vehicleDuplicates.createdAt)),
    db.select().from(vehicleQualityChecks).where(eq(vehicleQualityChecks.vehicleItemId, vehicleItemId)).orderBy(desc(vehicleQualityChecks.createdAt)),
    db.select().from(vehicleConditionReports).where(eq(vehicleConditionReports.vehicleItemId, vehicleItemId)).orderBy(desc(vehicleConditionReports.createdAt)),
    db.select().from(vehiclePublicationLog).where(eq(vehiclePublicationLog.vehicleItemId, vehicleItemId)).orderBy(desc(vehiclePublicationLog.createdAt)),
  ]);
  return {
    item,
    territoires: territoires[0] ?? null,
    disponibilite: disponibilite[0] ?? null,
    prix: prix[0] ?? null,
    doublons,
    controles,
    rapports,
    historique,
  };
}

export async function journalAudit(vehicleItemId: number, limit = 200) {
  return db.select().from(vehicleAuditLog).where(eq(vehicleAuditLog.vehicleItemId, vehicleItemId)).orderBy(desc(vehicleAuditLog.createdAt)).limit(limit);
}

// ── Health + Dashboard + Feed (standards MOS) ───────────────────────────

export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let message: string | undefined;
  let total = 0;
  let publies = 0;
  try {
    const [t] = await db.select({ n: sql<number>`count(*)::int` }).from(vehicleItems);
    total = Number(t?.n ?? 0);
    const [p] = await db.select({ n: sql<number>`count(*)::int` }).from(vehicleItems).where(eq(vehicleItems.status, "PUBLISHED"));
    publies = Number(p?.n ?? 0);
  } catch (e) {
    status = "degraded";
    message = (e as Error).message;
  }
  const result = {
    engine: VEHICLE_ENGINE_META.name,
    version: VERSION,
    status,
    checkedAt: new Date().toISOString(),
    message,
    metrics: { total, publies, responseMs: Date.now() - startedAt },
  };
  db.insert(vehicleHealthLog).values({ status, message: message ?? null, metrics: result.metrics }).catch(() => {});
  return result;
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: VEHICLE_ENGINE_META.name,
    label: VEHICLE_ENGINE_META.label,
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
  const parStatut = await db.select({ status: vehicleItems.status, n: sql<number>`count(*)::int` }).from(vehicleItems).groupBy(vehicleItems.status);
  const businessMetrics: Record<string, number | string | null> = {};
  for (const r of parStatut) businessMetrics[`vehicules_${r.status.toLowerCase()}`] = Number(r.n);
  return { ...feed, businessMetrics, recentEvents: [], recentErrors: [] };
}

export { CANONICAL_VEHICLE_FIELDS };
