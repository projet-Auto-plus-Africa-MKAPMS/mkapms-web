/**
 * MKA.P-MS Reviews & Reputation Engine (points 46-48) — router tRPC.
 *
 * Le dépôt, la modération et les réponses restent dans `reviewsV2` (module
 * historique complet). Ce moteur expose la couche réputation : lecture
 * consolidée par cible / univers / pays, univers couverts, demandes ouvertes et
 * santé remontée au registre central.
 */
import { z } from "zod";
import { directionProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  REPUTATION_UNIVERS,
  pendingReviewRequests,
  reputationEngineHealth,
  reputationOf,
} from "./service.js";

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

  health: directionProcedure.query(async () => reputationEngineHealth()),
});
