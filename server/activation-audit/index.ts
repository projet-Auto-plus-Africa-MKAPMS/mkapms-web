/**
 * MKA.P-MS Activation Audit — Surface tRPC (point 91).
 *
 * Lecture réservée à la direction : l'audit expose l'état réel de la
 * plateforme, y compris ses manques.
 */
import { z } from "zod";
import { adminProcedure, router } from "../trpc.js";
import {
  ACTIVATION_STATE_LABELS,
  auditHistory,
  domainDetail,
  latestActivationAudit,
  recordTestEvidence,
  runActivationAudit,
} from "./service.js";

export const ACTIVATION_AUDIT_META = {
  code: "activation_audit",
  name: "Audit d'activation",
  role: "Vérifie, domaine par domaine, ce qui est réellement connecté, activé, accessible, utilisé et prouvé par un test.",
} as const;

export const activationAuditRouter = router({
  /** Libellés des cinq états, pour que l'affichage n'invente pas les siens. */
  states: adminProcedure.query(() => ACTIVATION_STATE_LABELS),

  /** Dernière photographie enregistrée (aucun recalcul). */
  latest: adminProcedure.query(() => latestActivationAudit()),

  /** Relance l'audit et enregistre une nouvelle photographie. */
  run: adminProcedure.mutation(({ ctx }) =>
    runActivationAudit({ trigger: "manuel", requestedBy: ctx.user?.uid }),
  ),

  domain: adminProcedure
    .input(z.object({ domain: z.string().min(1).max(64) }))
    .query(({ input }) => domainDetail(input.domain)),

  history: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(20) }).optional())
    .query(({ input }) => auditHistory(input?.limit ?? 20)),

  /** Dépôt d'une preuve de test (Continuous Test Engine, agent, PDG). */
  recordTest: adminProcedure
    .input(
      z.object({
        domain: z.string().min(1).max(64),
        kind: z.string().max(24).optional(),
        scenario: z.string().min(1).max(255),
        passed: z.number().int().min(0),
        total: z.number().int().min(0),
        detail: z.string().max(2000).optional(),
        source: z.string().max(64).optional(),
      }),
    )
    .mutation(({ input }) => recordTestEvidence(input)),
});

export { runActivationAudit, latestActivationAudit, recordTestEvidence } from "./service.js";
