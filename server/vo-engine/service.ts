/**
 * VO Engine (points 32-33).
 *
 * Estimation : marché local d'abord (annonces réellement publiées dans le
 * pays), barème de décote seulement en repli — et le résultat dit toujours
 * lequel des deux a servi, avec le nombre de comparables trouvés.
 *
 * Aucune valeur certaine n'est produite : le moteur renvoie une fourchette et
 * un niveau de confiance qui tombe à « faible » quand il n'a rien pour se
 * comparer.
 */
import { and, avg, count, desc, eq, gte, ilike, lte, sql, type SQL } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";
import { voDossierItems, voEstimations, voRepriseRequests } from "./schema.js";

export interface EstimateInput {
  userId?: number | null;
  plaque?: string | null;
  vin?: string | null;
  marque: string;
  modele: string;
  version?: string | null;
  annee?: number | null;
  kilometrage?: number | null;
  carburant?: string | null;
  boite?: string | null;
  etat?: string | null;
  countryCode?: string;
}

export interface EstimateResult {
  id: number;
  low: number;
  mid: number;
  high: number;
  currency: string;
  method: "comparables" | "modele";
  sampleSize: number;
  confidence: "faible" | "moyenne" | "bonne";
  /** Phrase honnête à afficher : ce que vaut réellement cette estimation. */
  disclaimer: string;
}

const ETAT_FACTORS: Record<string, number> = {
  excellent: 1.1,
  tres_bon: 1.05,
  bon: 1.0,
  correct: 0.9,
  a_renover: 0.7,
};

/** Barème de repli : décote par ancienneté à partir d'un prix neuf moyen. */
function baremeFallback(input: EstimateInput): number {
  const base = 22000;
  const year = new Date().getFullYear();
  const age = input.annee ? Math.max(0, year - input.annee) : 6;
  let mid = age === 0 ? base : base * 0.8 * Math.pow(0.9, Math.max(0, age - 1));

  if (input.kilometrage && input.kilometrage > 0) {
    const normal = Math.max(1, age) * 15000;
    const excess = Math.max(0, input.kilometrage - normal);
    mid -= (excess / 5000) * mid * 0.005;
    if (input.kilometrage > 250000) mid *= 0.65;
    else if (input.kilometrage > 150000) mid *= 0.85;
  }
  if (input.etat) mid *= ETAT_FACTORS[input.etat] ?? 1;
  return Math.max(500, Math.round(mid));
}

export async function estimate(input: EstimateInput): Promise<EstimateResult> {
  const country = (input.countryCode ?? "FR").toUpperCase();

  // 1) Marché local : annonces publiées du même modèle, année proche.
  const conds: SQL[] = [
    eq(annonces.status, "publiee"),
    ilike(annonces.marque, input.marque),
    ilike(annonces.modele, input.modele),
  ];
  if (input.annee) {
    conds.push(gte(annonces.annee, input.annee - 3));
    conds.push(lte(annonces.annee, input.annee + 3));
  }

  const [stats] = await db
    .select({
      n: count(),
      moyenne: avg(annonces.prix),
      kmMedian: sql<number>`percentile_cont(0.5) within group (order by ${annonces.kilometrage})`,
    })
    .from(annonces)
    .where(and(...conds));

  const sampleSize = Number(stats?.n ?? 0);
  let mid: number;
  let method: "comparables" | "modele";

  if (sampleSize >= 3 && stats?.moyenne) {
    mid = Number(stats.moyenne);
    method = "comparables";
    // Correction kilométrique par rapport à la médiane du marché observé.
    const medianKm = Number(stats.kmMedian ?? 0);
    if (input.kilometrage && medianKm > 0) {
      const factor = Math.min(1.2, Math.max(0.8, 1 + (medianKm - input.kilometrage) / (medianKm * 4)));
      mid *= factor;
    }
    if (input.etat) mid *= ETAT_FACTORS[input.etat] ?? 1;
    mid = Math.max(500, Math.round(mid));
  } else {
    mid = baremeFallback(input);
    method = "modele";
  }

  // La fourchette s'élargit quand on a moins de comparables : moins on sait,
  // moins on doit être précis.
  const spread = method === "comparables" ? (sampleSize >= 10 ? 0.1 : 0.15) : 0.2;
  const low = Math.round(mid * (1 - spread));
  const high = Math.round(mid * (1 + spread));

  const confidence: EstimateResult["confidence"] =
    method === "modele" ? "faible" : sampleSize >= 10 ? "bonne" : "moyenne";

  const disclaimer =
    method === "comparables"
      ? `Fourchette calculée sur ${sampleSize} annonce(s) comparable(s) réellement publiée(s). Ce n'est pas un prix de vente garanti.`
      : "Aucune annonce comparable disponible : fourchette calculée sur un barème de décote. Estimation indicative uniquement.";

  const [row] = await db
    .insert(voEstimations)
    .values({
      userId: input.userId ?? null,
      plaque: input.plaque ?? null,
      vin: input.vin ?? null,
      marque: input.marque,
      modele: input.modele,
      version: input.version ?? null,
      annee: input.annee ?? null,
      kilometrage: input.kilometrage ?? null,
      carburant: input.carburant ?? null,
      boite: input.boite ?? null,
      etat: input.etat ?? null,
      countryCode: country,
      low: String(low),
      mid: String(mid),
      high: String(high),
      method,
      sampleSize,
      confidence,
    })
    .returning({ id: voEstimations.id });

  return { id: row.id, low, mid, high, currency: "EUR", method, sampleSize, confidence, disclaimer };
}

export async function myEstimations(userId: number) {
  return db
    .select()
    .from(voEstimations)
    .where(eq(voEstimations.userId, userId))
    .orderBy(desc(voEstimations.createdAt))
    .limit(50);
}

export async function createRepriseRequest(input: {
  userId: number;
  estimationId?: number | null;
  countryCode: string;
  city?: string | null;
  contactPhone?: string | null;
  message?: string | null;
}) {
  const reference = `VO-${Date.now().toString(36).toUpperCase()}`;
  const [row] = await db
    .insert(voRepriseRequests)
    .values({
      reference,
      userId: input.userId,
      estimationId: input.estimationId ?? null,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city ?? null,
      contactPhone: input.contactPhone ?? null,
      message: input.message ?? null,
      status: "envoyee",
    })
    .returning();
  return row;
}

export async function myRepriseRequests(userId: number) {
  return db
    .select()
    .from(voRepriseRequests)
    .where(eq(voRepriseRequests.userId, userId))
    .orderBy(desc(voRepriseRequests.createdAt))
    .limit(50);
}

export async function listRepriseRequests(status?: string, limit = 100) {
  const conds: SQL[] = [];
  if (status) conds.push(eq(voRepriseRequests.status, status));
  return db
    .select()
    .from(voRepriseRequests)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(voRepriseRequests.createdAt))
    .limit(limit);
}

/** L'offre de reprise est posée par un humain : le moteur ne chiffre jamais un engagement. */
export async function offerReprise(input: {
  id: number;
  amount: number;
  offerBy: number;
}) {
  const [row] = await db
    .update(voRepriseRequests)
    .set({
      offerAmount: String(input.amount),
      offerBy: input.offerBy,
      offerAt: new Date(),
      status: "offre_proposee",
      updatedAt: new Date(),
    })
    .where(eq(voRepriseRequests.id, input.id))
    .returning();
  return row ?? null;
}

export async function updateRepriseStatus(id: number, status: string) {
  const [row] = await db
    .update(voRepriseRequests)
    .set({ status, updatedAt: new Date() })
    .where(eq(voRepriseRequests.id, id))
    .returning();
  return row ?? null;
}

// ── Dossier VO (point 33) ──────────────────────────────────────────────

export const DOSSIER_CATEGORIES = [
  "historique",
  "rapport_atelier",
  "controle",
  "piece_remplacee",
  "facture",
  "preparation",
  "photo",
  "defaut_declare",
  "garantie",
  "livraison",
  "document",
] as const;

export type DossierCategory = (typeof DOSSIER_CATEGORIES)[number];

export async function addDossierItem(input: {
  annonceId?: number | null;
  voVehiculeId?: number | null;
  estimationId?: number | null;
  category: DossierCategory;
  title: string;
  detail?: string | null;
  documentUrl?: string | null;
  occurredAt?: Date | null;
  amount?: number | null;
  createdBy: number;
}) {
  if (!input.annonceId && !input.voVehiculeId && !input.estimationId) {
    throw new Error("Un élément de dossier doit être rattaché à un véhicule.");
  }
  const [row] = await db
    .insert(voDossierItems)
    .values({
      annonceId: input.annonceId ?? null,
      voVehiculeId: input.voVehiculeId ?? null,
      estimationId: input.estimationId ?? null,
      category: input.category,
      title: input.title.slice(0, 200),
      detail: input.detail ?? null,
      documentUrl: input.documentUrl ?? null,
      occurredAt: input.occurredAt ?? null,
      amount: input.amount === null || input.amount === undefined ? null : String(input.amount),
      createdBy: input.createdBy,
    })
    .returning();
  return row;
}

export interface DossierView {
  items: (typeof voDossierItems.$inferSelect)[];
  /** Rubriques réellement documentées / rubriques attendues — sans arrondi flatteur. */
  completude: { renseignees: number; total: number; manquantes: DossierCategory[] };
}

export async function getDossier(input: {
  annonceId?: number;
  voVehiculeId?: number;
}): Promise<DossierView> {
  const conds: SQL[] = [];
  if (input.annonceId) conds.push(eq(voDossierItems.annonceId, input.annonceId));
  if (input.voVehiculeId) conds.push(eq(voDossierItems.voVehiculeId, input.voVehiculeId));
  const items = conds.length
    ? await db
        .select()
        .from(voDossierItems)
        .where(and(...conds))
        .orderBy(desc(voDossierItems.occurredAt), desc(voDossierItems.createdAt))
        .limit(300)
    : [];

  const present = new Set(items.map((i) => i.category));
  const manquantes = DOSSIER_CATEGORIES.filter((c) => !present.has(c));
  return {
    items,
    completude: {
      renseignees: DOSSIER_CATEGORIES.length - manquantes.length,
      total: DOSSIER_CATEGORIES.length,
      manquantes,
    },
  };
}

export interface VoEngineHealth {
  health: "ok" | "degraded" | "down";
  estimations30j: number;
  estimationsSansComparables: number;
  repriseEnAttente: number;
  dossiers: number;
  details: string[];
}

export async function voEngineHealth(): Promise<VoEngineHealth> {
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [recent] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(voEstimations)
    .where(gte(voEstimations.createdAt, since));
  const [fallback] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(voEstimations)
    .where(and(gte(voEstimations.createdAt, since), eq(voEstimations.method, "modele")));
  const [pending] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(voRepriseRequests)
    .where(sql`${voRepriseRequests.status} IN ('envoyee','en_etude')`);
  const [dossiers] = await db
    .select({ n: sql<number>`count(distinct coalesce(${voDossierItems.annonceId}, ${voDossierItems.voVehiculeId}))::int` })
    .from(voDossierItems);

  const total = Number(recent?.n ?? 0);
  const sansComparables = Number(fallback?.n ?? 0);
  const details = [
    `${total} estimation(s) sur 30 jours, dont ${sansComparables} sans annonce comparable.`,
    `${Number(pending?.n ?? 0)} demande(s) de reprise en attente de traitement humain.`,
    `${Number(dossiers?.n ?? 0)} dossier(s) VO alimenté(s).`,
  ];

  // Une estimation sans comparables reste utilisable mais elle est faible :
  // si c'est le cas de la majorité, le moteur le dit au lieu de rester vert.
  const degraded = total > 0 && sansComparables / total > 0.5;
  if (degraded) {
    details.push("Plus de la moitié des estimations reposent sur le barème faute de marché local suffisant.");
  }

  return {
    health: degraded ? "degraded" : "ok",
    estimations30j: total,
    estimationsSansComparables: sansComparables,
    repriseEnAttente: Number(pending?.n ?? 0),
    dossiers: Number(dossiers?.n ?? 0),
    details,
  };
}
