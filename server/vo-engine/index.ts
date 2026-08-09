/**
 * VO Engine (points 32-33) — router tRPC.
 *
 * Estimation intelligente → puis les suites possibles : vendre sur MKA.P-MS,
 * demander une reprise, déposer en enchère (Auction Engine) ou trouver un
 * professionnel. Le moteur ne décide jamais d'un prix ferme.
 */
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  addDossierItem,
  createRepriseRequest,
  DOSSIER_CATEGORIES,
  estimate,
  getDossier,
  listRepriseRequests,
  myEstimations,
  myRepriseRequests,
  offerReprise,
  updateRepriseStatus,
  voEngineHealth,
} from "./service.js";

export const VO_ENGINE_META = {
  code: "vo_engine",
  name: "VO Engine",
  role: "Reprise, estimation intelligente en fourchette et dossier VO de confiance.",
} as const;

export const voEngineRouter = router({
  /** Publique : estimer ne demande pas de compte. */
  estimate: publicProcedure
    .input(
      z.object({
        plaque: z.string().max(24).optional(),
        vin: z.string().max(32).optional(),
        marque: z.string().min(1).max(80),
        modele: z.string().min(1).max(120),
        version: z.string().max(160).optional(),
        annee: z.number().int().min(1900).max(2100).optional(),
        kilometrage: z.number().int().min(0).max(2_000_000).optional(),
        carburant: z.string().max(32).optional(),
        boite: z.string().max(32).optional(),
        etat: z.enum(["excellent", "tres_bon", "bon", "correct", "a_renover"]).optional(),
        countryCode: z.string().min(2).max(4).optional(),
      }),
    )
    .mutation(({ ctx, input }) => estimate({ ...input, userId: ctx.user?.uid ?? null })),

  myEstimations: protectedProcedure.query(({ ctx }) => myEstimations(ctx.user.uid)),

  requestReprise: protectedProcedure
    .input(
      z.object({
        estimationId: z.number().int().positive().optional(),
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        contactPhone: z.string().max(40).optional(),
        message: z.string().max(2000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => createRepriseRequest({ ...input, userId: ctx.user.uid })),

  myRepriseRequests: protectedProcedure.query(({ ctx }) => myRepriseRequests(ctx.user.uid)),

  repriseQueue: adminProcedure
    .input(z.object({ status: z.string().max(16).optional() }).default({}))
    .query(({ input }) => listRepriseRequests(input.status)),

  /** Chiffrer une reprise reste une décision humaine. */
  offerReprise: adminProcedure
    .input(z.object({ id: z.number().int().positive(), amount: z.number().positive() }))
    .mutation(({ ctx, input }) => offerReprise({ ...input, offerBy: ctx.user.uid })),

  setRepriseStatus: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["envoyee", "en_etude", "offre_proposee", "acceptee", "refusee", "annulee"]),
      }),
    )
    .mutation(({ input }) => updateRepriseStatus(input.id, input.status)),

  // ── Dossier VO (point 33) ────────────────────────────────────────────
  dossier: publicProcedure
    .input(
      z.object({
        annonceId: z.number().int().positive().optional(),
        voVehiculeId: z.number().int().positive().optional(),
      }),
    )
    .query(({ input }) => getDossier(input)),

  addDossierItem: protectedProcedure
    .input(
      z.object({
        annonceId: z.number().int().positive().optional(),
        voVehiculeId: z.number().int().positive().optional(),
        estimationId: z.number().int().positive().optional(),
        category: z.enum(DOSSIER_CATEGORIES),
        title: z.string().min(2).max(200),
        detail: z.string().max(4000).optional(),
        documentUrl: z.string().max(2000).optional(),
        occurredAt: z.string().optional(),
        amount: z.number().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      addDossierItem({
        ...input,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : null,
        createdBy: ctx.user.uid,
      }),
    ),

  health: adminProcedure.query(() => voEngineHealth()),
});

export { voEngineHealth } from "./service.js";
