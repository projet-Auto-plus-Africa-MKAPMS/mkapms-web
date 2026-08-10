/**
 * MKA.P-MS Reviews & Reputation Engine (points 46-48) — router tRPC.
 *
 * Le dépôt, la modération et les réponses restent dans `reviewsV2` (module
 * historique complet). Ce moteur expose la couche réputation : lecture
 * consolidée par cible / univers / pays, univers couverts, demandes ouvertes et
 * santé remontée au registre central.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { directionProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  REPUTATION_UNIVERS,
  pendingReviewRequests,
  reputationEngineHealth,
  reputationOf,
} from "./service.js";
import { fraudSignals, linkedAccounts, resolveFraudSignal } from "./fraud.js";
import { isTargetOwner } from "./ownership.js";
import { reviewsForOwner, suggestResponse } from "./responses.js";
import { reputationTrends } from "./trends.js";
import { platformAverage, reputationForTargets } from "./ranking.js";

export const REPUTATION_ENGINE_META = {
  code: "avis_reputation",
  name: "Reviews & Reputation Engine",
  role: "Réputation MKA.P-MS : avis par univers et par pays, expériences vérifiées après transaction réelle.",
} as const;

export const reputationEngineRouter = router({
  univers: publicProcedure.query(() =>
    Object.entries(REPUTATION_UNIVERS).map(([code, label]) => ({ code, label })),
  ),

  reputation: publicProcedure
    .input(
      z.object({
        targetType: z.string().min(1).max(32),
        targetId: z.number().int().positive(),
        univers: z.string().max(64).optional(),
        countryCode: z.string().max(4).optional(),
      }),
    )
    .query(async ({ input }) => reputationOf(input)),

  mesDemandes: protectedProcedure.query(async ({ ctx }) => pendingReviewRequests(ctx.user.uid)),

  // ── Point 50 — espace réponse du professionnel ──────────────────────────
  /** Avis portant sur les fiches réellement détenues par le compte. */
  avisDeMesCibles: protectedProcedure.query(async ({ ctx }) => reviewsForOwner(ctx.user.uid)),

  /**
   * Proposition de réponse : le professionnel doit la relire puis publier
   * lui-même via `reviewsV2.respond`. Le moteur ne publie jamais.
   */
  suggestionReponse: protectedProcedure
    .input(z.object({ reviewId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const suggestion = await suggestResponse(input.reviewId);
      if (!suggestion) throw new TRPCError({ code: "NOT_FOUND", message: "Avis introuvable." });
      const { avis } = await reviewsForOwner(ctx.user.uid, 200);
      const cible = avis.find((a) => a.id === input.reviewId);
      if (!cible) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cet avis ne concerne pas une de vos fiches.",
        });
      }
      const autorise = await isTargetOwner(ctx.user.uid, cible.targetType, cible.targetId);
      if (!autorise) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cet avis ne concerne pas une de vos fiches." });
      }
      return suggestion;
    }),

  // ── Point 49 — supervision des faux avis (direction) ────────────────────
  signaux: directionProcedure
    .input(
      z
        .object({
          severity: z.enum(["info", "attention", "critique"]).optional(),
          onlyOpen: z.boolean().optional(),
          limit: z.number().int().min(1).max(200).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => fraudSignals(input ?? {})),

  comptesLies: directionProcedure.query(async () => linkedAccounts()),

  /** Décision humaine sur un signal : le motif est obligatoire. */
  traiterSignal: directionProcedure
    .input(
      z.object({
        signalId: z.number().int().positive(),
        decision: z.string().min(3).max(500),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      resolveFraudSignal({
        signalId: input.signalId,
        actorId: ctx.user.uid,
        decision: input.decision,
      }),
    ),

  // ── Point 54 — tendances expliquées, remontées au système intelligent ────
  tendances: directionProcedure.query(async () => reputationTrends()),

  /** Point 53 — note lissée par le volume, telle qu'utilisée par la recherche. */
  scoreClassement: directionProcedure
    .input(
      z.object({
        targetType: z.string().min(1).max(32),
        targetIds: z.array(z.number().int().positive()).min(1).max(100),
      }),
    )
    .query(async ({ input }) => {
      const reps = await reputationForTargets(input.targetType, input.targetIds);
      const plateforme = await platformAverage();
      return { plateforme, cibles: Array.from(reps.values()) };
    }),

  health: directionProcedure.query(async () => reputationEngineHealth()),
});
