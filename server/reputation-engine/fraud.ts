/**
 * Point 49 — détection des comportements suspects sur les avis.
 *
 * Deux règles structurent tout ce fichier :
 *
 * 1. **Rien n'est supprimé automatiquement.** Le moteur écrit des signaux et
 *    peut placer un avis « en vérification » ; la suppression reste une décision
 *    humaine motivée. Une note basse n'est jamais un signal en elle-même : le
 *    seul critère lié à la note est l'*uniformité* d'une rafale (10 avis 5/5 en
 *    une heure est suspect, un avis 1/5 isolé ne l'est pas).
 * 2. **Tout signal est traçable** : type, gravité, explication, date. Une
 *    modération sans motif écrit n'est pas exploitable plus tard.
 */
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db } from "../db.js";
import { reviewFraudSignals, reviewsV2 } from "../modules/reviews.js";
import { isTargetOwner } from "./ownership.js";

export type FraudSeverity = "info" | "attention" | "critique";

export interface FraudSignal {
  type: string;
  severity: FraudSeverity;
  detail: string;
}

/** Rafale d'avis d'un même compte sur une fenêtre courte. */
const BURST_WINDOW_HOURS = 24;
const BURST_AUTHOR_LIMIT = 5;
/** Rafale d'avis reçus par une même cible. */
const TARGET_BURST_WINDOW_HOURS = 24;
const TARGET_BURST_LIMIT = 10;
/** Répétition du même compte sur la même cible. */
const REPEAT_TARGET_LIMIT = 3;

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000);
}

/**
 * Analyse un avis qui vient d'être déposé.
 *
 * Retourne les signaux trouvés et, si l'un d'eux est critique, demande la mise
 * en vérification. L'appelant reste maître du statut : c'est le router d'avis
 * qui applique `en_moderation`, pas ce module.
 */
export async function analyzeNewReview(input: {
  reviewId: number;
  authorId: number;
  targetType: string;
  targetId: number;
  ratingGlobal: number;
  comment?: string | null;
  verified: boolean;
  deviceType?: string | null;
  ipCountry?: string | null;
}): Promise<{ signals: FraudSignal[]; needsVerification: boolean }> {
  const signals: FraudSignal[] = [];

  const [auteur] = await db
    .select({
      recents: sql<number>`count(*) filter (where ${reviewsV2.createdAt} >= ${hoursAgo(BURST_WINDOW_HOURS)})::int`,
      surCible: sql<number>`count(*) filter (where ${reviewsV2.targetType} = ${input.targetType} and ${reviewsV2.targetId} = ${input.targetId})::int`,
      total: sql<number>`count(*)::int`,
      verifies: sql<number>`count(*) filter (where ${reviewsV2.verified})::int`,
    })
    .from(reviewsV2)
    .where(and(eq(reviewsV2.authorId, input.authorId), ne(reviewsV2.id, input.reviewId)));

  if ((auteur?.recents ?? 0) >= BURST_AUTHOR_LIMIT) {
    signals.push({
      type: "creation_massive",
      severity: "critique",
      detail: `${auteur.recents} avis déposés par ce compte en moins de ${BURST_WINDOW_HOURS} h.`,
    });
  }
  if ((auteur?.surCible ?? 0) >= REPEAT_TARGET_LIMIT) {
    signals.push({
      type: "repetition_meme_cible",
      severity: "attention",
      detail: `${auteur.surCible} avis déjà déposés par ce compte sur la même cible.`,
    });
  }
  if ((auteur?.total ?? 0) >= 5 && (auteur?.verifies ?? 0) === 0) {
    signals.push({
      type: "aucune_experience_verifiee",
      severity: "attention",
      detail: `Ce compte a ${auteur.total} avis et aucune transaction vérifiée sur la plateforme.`,
    });
  }

  const [cible] = await db
    .select({
      recents: sql<number>`count(*)::int`,
      notesDistinctes: sql<number>`count(distinct ${reviewsV2.ratingGlobal})::int`,
      auteursDistincts: sql<number>`count(distinct ${reviewsV2.authorId})::int`,
    })
    .from(reviewsV2)
    .where(
      and(
        eq(reviewsV2.targetType, input.targetType),
        eq(reviewsV2.targetId, input.targetId),
        gte(reviewsV2.createdAt, hoursAgo(TARGET_BURST_WINDOW_HOURS)),
      ),
    );

  if ((cible?.recents ?? 0) >= TARGET_BURST_LIMIT) {
    // Une rafale n'est signalée comme note artificielle que si toutes les notes
    // sont identiques : un afflux d'avis variés reste un afflux normal.
    const uniforme = (cible?.notesDistinctes ?? 0) <= 1;
    signals.push({
      type: uniforme ? "notes_uniformes_en_rafale" : "afflux_inhabituel",
      severity: uniforme ? "critique" : "attention",
      detail: uniforme
        ? `${cible.recents} avis avec la même note en moins de ${TARGET_BURST_WINDOW_HOURS} h sur cette cible.`
        : `${cible.recents} avis reçus en moins de ${TARGET_BURST_WINDOW_HOURS} h : vérification recommandée.`,
    });
  }

  if (input.comment && input.comment.trim().length > 0) {
    const doublons = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(reviewsV2)
      .where(
        and(
          ne(reviewsV2.id, input.reviewId),
          eq(reviewsV2.targetType, input.targetType),
          eq(reviewsV2.targetId, input.targetId),
          sql`lower(trim(${reviewsV2.comment})) = ${input.comment.trim().toLowerCase()}`,
        ),
      );
    if ((doublons[0]?.n ?? 0) > 0) {
      signals.push({
        type: "commentaire_duplique",
        severity: "critique",
        detail: "Un commentaire strictement identique existe déjà sur cette cible.",
      });
    }
  }

  // Conflit d'intérêt le plus direct : l'auteur note sa propre fiche.
  const proprietaire = await isTargetOwner(input.authorId, input.targetType, input.targetId);
  if (proprietaire) {
    signals.push({
      type: "conflit_interet",
      severity: "critique",
      detail: "L'auteur est le propriétaire de la cible évaluée.",
    });
  }

  if (!input.verified) {
    signals.push({
      type: "sans_transaction",
      severity: "info",
      detail: "Aucune transaction MKA.P-MS ne correspond à cet avis (avis non vérifié).",
    });
  }

  if (signals.length > 0) {
    await db.insert(reviewFraudSignals).values(
      signals.map((s) => ({
        reviewId: input.reviewId,
        authorId: input.authorId,
        targetType: input.targetType,
        targetId: input.targetId,
        signalType: s.type,
        severity: s.severity,
        detail: s.detail,
      })),
    );
  }

  return {
    signals,
    needsVerification: signals.some((s) => s.severity === "critique"),
  };
}

/**
 * Comptes qui se comportent comme un même acteur : mêmes cibles notées, même
 * appareil, même pays d'IP. Ce n'est pas une preuve, c'est une liste à examiner.
 */
export async function linkedAccounts(limit = 20): Promise<
  Array<{
    targetType: string;
    targetId: number;
    deviceType: string | null;
    ipCountry: string | null;
    comptes: number;
    avis: number;
  }>
> {
  const rows = await db
    .select({
      targetType: reviewsV2.targetType,
      targetId: reviewsV2.targetId,
      deviceType: reviewsV2.deviceType,
      ipCountry: reviewsV2.ipCountry,
      comptes: sql<number>`count(distinct ${reviewsV2.authorId})::int`,
      avis: sql<number>`count(*)::int`,
    })
    .from(reviewsV2)
    .where(sql`${reviewsV2.deviceType} is not null`)
    .groupBy(reviewsV2.targetType, reviewsV2.targetId, reviewsV2.deviceType, reviewsV2.ipCountry)
    .having(sql`count(distinct ${reviewsV2.authorId}) >= 3 and count(*) >= 3`)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
  return rows;
}

/** Signaux enregistrés, du plus grave au plus récent. */
export async function fraudSignals(input: {
  severity?: FraudSeverity;
  onlyOpen?: boolean;
  limit?: number;
}) {
  const conds = [];
  if (input.severity) conds.push(eq(reviewFraudSignals.severity, input.severity));
  if (input.onlyOpen) conds.push(eq(reviewFraudSignals.reviewed, false));
  const q = db
    .select({
      id: reviewFraudSignals.id,
      reviewId: reviewFraudSignals.reviewId,
      authorId: reviewFraudSignals.authorId,
      targetType: reviewFraudSignals.targetType,
      targetId: reviewFraudSignals.targetId,
      signalType: reviewFraudSignals.signalType,
      severity: reviewFraudSignals.severity,
      detail: reviewFraudSignals.detail,
      reviewed: reviewFraudSignals.reviewed,
      reviewedBy: reviewFraudSignals.reviewedBy,
      reviewedAt: reviewFraudSignals.reviewedAt,
      decision: reviewFraudSignals.decision,
      createdAt: reviewFraudSignals.createdAt,
      ratingGlobal: reviewsV2.ratingGlobal,
      comment: reviewsV2.comment,
      status: reviewsV2.status,
      univers: reviewsV2.univers,
      countryCode: reviewsV2.countryCode,
    })
    .from(reviewFraudSignals)
    .leftJoin(reviewsV2, eq(reviewsV2.id, reviewFraudSignals.reviewId))
    .orderBy(desc(reviewFraudSignals.createdAt))
    .limit(input.limit ?? 50);
  return conds.length > 0 ? q.where(and(...conds)) : q;
}

/** Une décision humaine sur un signal — toujours avec son auteur et son motif. */
export async function resolveFraudSignal(input: {
  signalId: number;
  actorId: number;
  decision: string;
}) {
  await db
    .update(reviewFraudSignals)
    .set({
      reviewed: true,
      reviewedBy: input.actorId,
      reviewedAt: new Date(),
      decision: input.decision,
    })
    .where(eq(reviewFraudSignals.id, input.signalId));
  return { ok: true };
}
