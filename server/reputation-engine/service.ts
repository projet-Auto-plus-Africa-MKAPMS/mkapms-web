/**
 * MKA.P-MS Reviews & Reputation Engine (points 46-48) — service.
 *
 * Le module d'avis (`reviews_v2`) existait déjà avec ses agrégats, mais deux
 * maillons manquaient et rendaient la réputation peu fiable :
 *
 * 1. `review_requests` n'était **jamais** alimentée : aucune fin de prestation
 *    ne déclenchait de demande d'avis. La table servait de boîte vide.
 * 2. La mention « Expérience vérifiée » était accordée dès que le client
 *    envoyait un `transactionType`/`transactionId` dans sa requête — donc
 *    n'importe qui pouvait se déclarer vérifié. Ici la vérification est
 *    reconstituée côté serveur : elle n'existe que si la plateforme a elle-même
 *    enregistré la transaction terminée.
 *
 * La réputation est calculée par pays parce qu'un professionnel peut être
 * excellent dans un pays et absent dans un autre : une note mondiale unique
 * masquerait cette différence.
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { notifyEvent } from "../notification-os/triggers.js";
import { reviewAggregates, reviewRequests, reviewsV2 } from "../modules/reviews.js";

/** Univers couverts par le moteur — libellés affichés au visiteur. */
export const REPUTATION_UNIVERS: Record<string, string> = {
  plateforme: "MKA.P-MS",
  vente: "Vendeur professionnel",
  garage: "Garage",
  location: "Loueur",
  controle_technique: "Contrôle technique",
  pieces: "Pièces automobiles",
  vtc_taxi: "VTC / Taxi",
  partenaire: "Partenaire",
  prestation: "Prestation",
  vehicule: "Véhicule",
  depannage: "Dépannage",
  livraison: "Livraison",
  comptable: "Cabinet comptable",
  depot_vente: "Dépôt-vente",
  vo: "Véhicule d'occasion",
};

export interface CompletedTransaction {
  userId: number;
  targetType: string;
  targetId: number;
  univers: string;
  transactionType: string;
  transactionId: number;
  countryCode?: string | null;
  /** Ce que le client a réellement fait faire — repris dans la notification. */
  libelle?: string | null;
  /** Motif de déclenchement, conservé pour l'audit de la demande. */
  triggerReason: string;
}

/** Une demande d'avis ne relance pas le client indéfiniment. */
const REQUEST_VALIDITY_DAYS = 60;

export interface ReviewRequestResult {
  created: boolean;
  requestId: number | null;
  raison?: string;
}

/**
 * Fin de prestation réelle → demande d'avis.
 *
 * Idempotent : une transaction ne peut générer qu'une seule demande, sinon un
 * professionnel qui repasse un dossier en « terminé » relancerait le client à
 * chaque fois.
 */
export async function requestReviewAfterCompletion(
  tx: CompletedTransaction,
): Promise<ReviewRequestResult> {
  if (!tx.userId || !tx.targetId) {
    return { created: false, requestId: null, raison: "client ou cible inconnu" };
  }

  const existing = await db
    .select({ id: reviewRequests.id })
    .from(reviewRequests)
    .where(
      and(
        eq(reviewRequests.userId, tx.userId),
        eq(reviewRequests.transactionType, tx.transactionType),
        eq(reviewRequests.transactionId, tx.transactionId),
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    return { created: false, requestId: existing[0].id, raison: "demande déjà enregistrée" };
  }

  const alreadyReviewed = await db
    .select({ id: reviewsV2.id })
    .from(reviewsV2)
    .where(
      and(
        eq(reviewsV2.authorId, tx.userId),
        eq(reviewsV2.transactionType, tx.transactionType),
        eq(reviewsV2.transactionId, tx.transactionId),
      ),
    )
    .limit(1);
  if (alreadyReviewed.length > 0) {
    return { created: false, requestId: null, raison: "avis déjà déposé" };
  }

  const [created] = await db
    .insert(reviewRequests)
    .values({
      userId: tx.userId,
      targetType: tx.targetType,
      targetId: tx.targetId,
      univers: tx.univers,
      transactionType: tx.transactionType,
      transactionId: tx.transactionId,
      countryCode: tx.countryCode ?? null,
      triggerReason: tx.triggerReason,
      status: "sent",
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + REQUEST_VALIDITY_DAYS * 24 * 60 * 60 * 1000),
    })
    .returning({ id: reviewRequests.id });

  await notifyEvent({
    userId: tx.userId,
    event: "avis_demande_apres_prestation",
    vars: {
      service: REPUTATION_UNIVERS[tx.univers] ?? tx.univers,
      detail: tx.libelle ?? "Votre prestation est terminée.",
    },
    url: "/compte/avis",
  }).catch(() => {});

  return { created: true, requestId: created.id };
}

/**
 * Vrai uniquement si la plateforme a elle-même constaté la transaction.
 * C'est cette fonction — et non le client — qui décide de « Expérience vérifiée ».
 */
export async function verifiedExperience(input: {
  userId: number;
  targetType: string;
  targetId: number;
  transactionType?: string | null;
  transactionId?: number | null;
}): Promise<{
  verified: boolean;
  proof: string | null;
  requestId: number | null;
  countryCode: string | null;
}> {
  const conds = [
    eq(reviewRequests.userId, input.userId),
    eq(reviewRequests.targetType, input.targetType),
    eq(reviewRequests.targetId, input.targetId),
  ];
  if (input.transactionType) conds.push(eq(reviewRequests.transactionType, input.transactionType));
  if (input.transactionId) conds.push(eq(reviewRequests.transactionId, input.transactionId));

  const [req] = await db
    .select({
      id: reviewRequests.id,
      transactionType: reviewRequests.transactionType,
      transactionId: reviewRequests.transactionId,
      countryCode: reviewRequests.countryCode,
    })
    .from(reviewRequests)
    .where(and(...conds))
    .orderBy(desc(reviewRequests.createdAt))
    .limit(1);

  if (!req) return { verified: false, proof: null, requestId: null, countryCode: null };
  return {
    verified: true,
    proof: `TXN-${req.transactionType}-${req.transactionId}`,
    requestId: req.id,
    countryCode: req.countryCode,
  };
}

export interface ReputationView {
  targetType: string;
  targetId: number;
  univers: string | null;
  countryCode: string | null;
  totalReviews: number;
  /** null quand aucun avis publié : jamais 0 présenté comme une note. */
  averageRating: number | null;
  verifiedCount: number;
  responseRatePct: number;
  distribution: Record<string, number>;
  lastReviewAt: Date | null;
  raison: string | null;
}

/**
 * Réputation d'une cible. `countryCode` restreint aux avis déposés depuis ce
 * pays ; sans lui, la lecture se fait sur les agrégats déjà consolidés.
 */
export async function reputationOf(input: {
  targetType: string;
  targetId: number;
  univers?: string | null;
  countryCode?: string | null;
}): Promise<ReputationView> {
  const empty = (raison: string): ReputationView => ({
    targetType: input.targetType,
    targetId: input.targetId,
    univers: input.univers ?? null,
    countryCode: input.countryCode ?? null,
    totalReviews: 0,
    averageRating: null,
    verifiedCount: 0,
    responseRatePct: 0,
    distribution: {},
    lastReviewAt: null,
    raison,
  });

  if (input.countryCode) {
    const conds = [
      eq(reviewsV2.targetType, input.targetType),
      eq(reviewsV2.targetId, input.targetId),
      eq(reviewsV2.status, "publie"),
      eq(reviewsV2.visibility, "public"),
      eq(reviewsV2.countryCode, input.countryCode),
    ];
    if (input.univers) conds.push(eq(reviewsV2.univers, input.univers));

    const rows = await db
      .select({
        rating: reviewsV2.ratingGlobal,
        verified: reviewsV2.verified,
        responded: sql<number>`case when ${reviewsV2.responseText} is not null then 1 else 0 end`,
        createdAt: reviewsV2.createdAt,
      })
      .from(reviewsV2)
      .where(and(...conds));

    if (rows.length === 0) {
      return empty(`Aucun avis publié pour ce pays (${input.countryCode}).`);
    }
    const distribution: Record<string, number> = {};
    let sum = 0;
    let verified = 0;
    let responded = 0;
    let last: Date | null = null;
    for (const r of rows) {
      sum += r.rating;
      if (r.verified) verified += 1;
      responded += Number(r.responded);
      distribution[String(r.rating)] = (distribution[String(r.rating)] ?? 0) + 1;
      if (!last || r.createdAt > last) last = r.createdAt;
    }
    return {
      targetType: input.targetType,
      targetId: input.targetId,
      univers: input.univers ?? null,
      countryCode: input.countryCode,
      totalReviews: rows.length,
      averageRating: Math.round((sum / rows.length) * 100) / 100,
      verifiedCount: verified,
      responseRatePct: Math.round((responded / rows.length) * 100),
      distribution,
      lastReviewAt: last,
      raison: null,
    };
  }

  const conds = [
    eq(reviewAggregates.targetType, input.targetType),
    eq(reviewAggregates.targetId, input.targetId),
  ];
  if (input.univers) conds.push(eq(reviewAggregates.univers, input.univers));
  const aggs = await db.select().from(reviewAggregates).where(and(...conds));
  if (aggs.length === 0) return empty("Aucun avis publié pour l'instant.");

  let total = 0;
  let weighted = 0;
  let verified = 0;
  let responseWeighted = 0;
  let last: Date | null = null;
  const distribution: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const a of aggs) {
    total += a.totalReviews;
    weighted += a.averageRatingX100 * a.totalReviews;
    verified += a.verifiedCount;
    responseWeighted += a.responseRatePct * a.totalReviews;
    distribution["1"] += a.rating1Count;
    distribution["2"] += a.rating2Count;
    distribution["3"] += a.rating3Count;
    distribution["4"] += a.rating4Count;
    distribution["5"] += a.rating5Count;
    if (a.lastReviewAt && (!last || a.lastReviewAt > last)) last = a.lastReviewAt;
  }
  if (total === 0) return empty("Aucun avis publié pour l'instant.");

  return {
    targetType: input.targetType,
    targetId: input.targetId,
    univers: input.univers ?? null,
    countryCode: null,
    totalReviews: total,
    averageRating: Math.round(weighted / total) / 100,
    verifiedCount: verified,
    responseRatePct: Math.round(responseWeighted / total),
    distribution,
    lastReviewAt: last,
    raison: null,
  };
}

/** Demandes d'avis encore ouvertes pour un compte. */
export async function pendingReviewRequests(userId: number, limit = 20) {
  return db
    .select()
    .from(reviewRequests)
    .where(
      and(
        eq(reviewRequests.userId, userId),
        sql`${reviewRequests.status} in ('pending','sent')`,
      ),
    )
    .orderBy(desc(reviewRequests.createdAt))
    .limit(limit);
}

export interface ReputationHealth {
  status: "ok" | "degraded" | "down";
  message: string;
  metrics: {
    avis: number;
    avisVerifies: number;
    demandesEnvoyees: number;
    demandesHonorees: number;
    ciblesNotees: number;
    avisSansPays: number;
  };
}

export async function reputationEngineHealth(): Promise<ReputationHealth> {
  const [avis] = await db
    .select({
      total: sql<number>`count(*)::int`,
      verifies: sql<number>`count(*) filter (where ${reviewsV2.verified})::int`,
      sansPays: sql<number>`count(*) filter (where ${reviewsV2.countryCode} is null)::int`,
    })
    .from(reviewsV2);
  const [req] = await db
    .select({
      envoyees: sql<number>`count(*)::int`,
      honorees: sql<number>`count(*) filter (where ${reviewRequests.status} = 'completed')::int`,
    })
    .from(reviewRequests);
  const [cibles] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reviewAggregates)
    .where(gte(reviewAggregates.totalReviews, 1));

  const metrics = {
    avis: avis?.total ?? 0,
    avisVerifies: avis?.verifies ?? 0,
    demandesEnvoyees: req?.envoyees ?? 0,
    demandesHonorees: req?.honorees ?? 0,
    ciblesNotees: cibles?.n ?? 0,
    avisSansPays: avis?.sansPays ?? 0,
  };

  if (metrics.avis === 0) {
    return {
      status: "degraded",
      message:
        "Aucun avis enregistré : le moteur répond mais n'a aucune réputation à exposer. Les pages affichent « pas encore d'avis ».",
      metrics,
    };
  }
  if (metrics.demandesEnvoyees === 0) {
    return {
      status: "degraded",
      message:
        "Des avis existent mais aucune demande automatique n'a été émise : les expériences vérifiées ne peuvent pas se constituer.",
      metrics,
    };
  }
  return {
    status: "ok",
    message: `${metrics.avis} avis dont ${metrics.avisVerifies} vérifié(s), ${metrics.demandesHonorees}/${metrics.demandesEnvoyees} demande(s) honorée(s).`,
    metrics,
  };
}
