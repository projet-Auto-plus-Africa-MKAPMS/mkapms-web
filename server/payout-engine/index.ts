/**
 * Payout Engine — router tRPC (LOT 5 du Plan Maître Fournisseurs, §32).
 * Usage interne (Direction/admin) uniquement : aucun fournisseur ni
 * transporteur n'appelle ce router directement — ils consultent leur solde
 * via leur portail respectif, branché sur le Ledger (`wallet.me`).
 */
import { z } from "zod";
import { adminProcedure, directionProcedure, publicProcedure, router } from "../trpc.js";
import {
  auditLog,
  controlCenterFeed,
  createPolicy,
  dashboard,
  healthStatus,
  listPolicies,
  listSchedules,
  getSchedule,
  setPolicyActive,
  triggerStage,
  validateStage,
} from "./service.js";
import { PAYOUT_ENGINE_META, PAYOUT_SPLIT_PRESETS, PAYOUT_TARGET_TYPES, PAYOUT_TRIGGERS } from "./contract.js";

export const payoutEngineRouter = router({
  meta: publicProcedure.query(() => PAYOUT_ENGINE_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  splitPresets: publicProcedure.query(() => PAYOUT_SPLIT_PRESETS),

  // ── Politiques (Direction : engage l'argent versé aux partenaires) ────
  createPolicy: directionProcedure
    .input(
      z.object({
        targetType: z.enum(PAYOUT_TARGET_TYPES),
        supplierProfileId: z.number().int().positive().optional(),
        carrierCode: z.string().max(32).optional(),
        contractRef: z.string().max(64).optional(),
        splitCode: z.string().min(1).max(32),
        requiresHumanValidation: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => createPolicy({ ...input, createdBy: ctx.user.uid })),

  listPolicies: adminProcedure.input(z.object({ targetType: z.enum(PAYOUT_TARGET_TYPES).optional() }).optional()).query(({ input }) => listPolicies(input?.targetType)),

  setPolicyActive: directionProcedure.input(z.object({ id: z.number().int().positive(), active: z.boolean() })).mutation(({ input }) => setPolicyActive(input.id, input.active)),

  // ── Schedules ───────────────────────────────────────────────────────
  listSchedules: adminProcedure
    .input(z.object({ targetType: z.enum(PAYOUT_TARGET_TYPES).optional(), status: z.string().optional(), limit: z.number().int().min(1).max(500).optional() }).optional())
    .query(({ input }) => listSchedules(input)),

  detail: adminProcedure.input(z.object({ scheduleId: z.number().int().positive() })).query(({ input }) => getSchedule(input.scheduleId)),

  auditLog: adminProcedure.input(z.object({ scheduleId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => auditLog(input?.scheduleId, input?.limit)),

  // ── Déclenchement / validation (l'argent bouge ici) ────────────────
  triggerStage: adminProcedure
    .input(z.object({ scheduleId: z.number().int().positive(), trigger: z.enum(PAYOUT_TRIGGERS) }))
    .mutation(({ ctx, input }) => triggerStage(input.scheduleId, input.trigger, { actorId: ctx.user.uid })),

  validateStage: directionProcedure
    .input(z.object({ scheduleId: z.number().int().positive(), trigger: z.enum(PAYOUT_TRIGGERS) }))
    .mutation(({ ctx, input }) => validateStage(input.scheduleId, input.trigger, ctx.user.uid)),
});

export * as payoutEngineSchema from "./schema.js";
export * as payoutEngineContract from "./contract.js";
export { PAYOUT_ENGINE_META };
export { openPayoutSchedule, triggerStage as triggerPayoutStage } from "./service.js";
