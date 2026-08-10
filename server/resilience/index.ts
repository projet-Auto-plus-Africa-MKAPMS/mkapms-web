/**
 * Points 73-74-76-77-78 — routeur du moteur de résilience.
 *
 * Lecture : direction. Bascule d'ouverture, confirmation critique, validation
 * d'une leçon et mise en production : PDG uniquement.
 */
import { z } from "zod";
import { directionProcedure, pdgProcedure, publicProcedure, router } from "../trpc.js";
import {
  EMERGENCY_LEVELS,
  PIPELINE_STEPS,
  PIPELINE_STEP_LABELS,
  PRESERVED_CAPABILITIES,
  RISK_LEVELS,
  confirmCritical,
  emergencyEvents,
  emergencyScopes,
  listCriticalRequests,
  listLessons,
  listPipelines,
  publicAccess,
  recordPipelineStep,
  refuseCritical,
  requestCriticalConfirmation,
  resilienceHealth,
  resilienceStats,
  runSelfHealing,
  setEmergency,
  startPipeline,
  updateLesson,
  validateLesson,
} from "./service.js";

export const RESILIENCE_META = {
  code: "resilience",
  name: "Resilience & Safety Engine",
  role: "Fermeture publique sans destruction, actions critiques protégées, pipeline obligatoire, auto-réparation vérifiée, mémoire des échecs.",
} as const;

const levelEnum = z.enum(["ouvert", "maintenance", "urgence"]);

export const resilienceRouter = router({
  /** État d'ouverture — public : un visiteur doit savoir pourquoi il est arrêté. */
  acces: publicProcedure
    .input(
      z
        .object({ countryCode: z.string().max(4).optional(), univers: z.string().max(40).optional() })
        .optional(),
    )
    .query(async ({ input }) =>
      publicAccess({ countryCode: input?.countryCode, univers: input?.univers }),
    ),

  referentiels: directionProcedure.query(() => ({
    niveaux: Object.entries(EMERGENCY_LEVELS).map(([code, label]) => ({ code, label })),
    risques: Object.entries(RISK_LEVELS).map(([niveau, v]) => ({
      niveau: Number(niveau),
      label: v.label,
      regime: v.regime,
    })),
    etapesPipeline: PIPELINE_STEPS.map((code) => ({ code, label: PIPELINE_STEP_LABELS[code] })),
    preservations: PRESERVED_CAPABILITIES,
  })),

  stats: directionProcedure.query(async () => resilienceStats()),

  // ── Point 73 ────────────────────────────────────────────────────────────
  portees: directionProcedure.query(async () => emergencyScopes()),
  journalPortees: directionProcedure
    .input(z.object({ limit: z.number().int().min(1).max(300).optional() }).optional())
    .query(async ({ input }) => emergencyEvents(input?.limit ?? 100)),

  basculer: pdgProcedure
    .input(
      z.object({
        scope: z.enum(["mondial", "pays", "univers"]),
        scopeKey: z.string().max(40).optional(),
        level: levelEnum,
        reason: z.string().max(2000).optional(),
        publicMessage: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => setEmergency({ ...input, actorId: ctx.user.uid })),

  // ── Point 74 ────────────────────────────────────────────────────────────
  demandesCritiques: directionProcedure
    .input(z.object({ limit: z.number().int().min(1).max(300).optional() }).optional())
    .query(async ({ input }) => listCriticalRequests(input?.limit ?? 100)),

  demanderConfirmation: directionProcedure
    .input(
      z.object({
        actionType: z.string().min(2).max(120),
        title: z.string().min(2).max(240),
        impact: z.string().min(3).max(4000),
        reversible: z.boolean().optional(),
        countryCode: z.string().max(4).optional(),
        params: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      requestCriticalConfirmation({ ...input, requestedBy: ctx.user.uid }),
    ),

  confirmerCritique: pdgProcedure
    .input(z.object({ id: z.number().int().positive(), phrase: z.string().min(1).max(200) }))
    .mutation(async ({ ctx, input }) => confirmCritical(input.id, ctx.user.uid, input.phrase)),

  refuserCritique: pdgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input }) => refuseCritical(input.id)),

  // ── Point 76 ────────────────────────────────────────────────────────────
  passages: directionProcedure
    .input(z.object({ limit: z.number().int().min(1).max(300).optional() }).optional())
    .query(async ({ input }) => listPipelines(input?.limit ?? 100)),

  ouvrirPassage: directionProcedure
    .input(
      z.object({
        origin: z.string().min(2).max(40),
        originRef: z.string().max(120).optional(),
        title: z.string().min(2).max(240),
        riskLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
        rollbackPlan: z.string().max(4000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => startPipeline({ ...input, createdBy: ctx.user.uid })),

  enregistrerEtape: directionProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        step: z.enum(PIPELINE_STEPS),
        status: z.enum(["ok", "echec", "info"]),
        detail: z.string().min(1).max(2000),
      }),
    )
    .mutation(async ({ input }) => recordPipelineStep(input)),

  // ── Point 77 ────────────────────────────────────────────────────────────
  autoReparer: pdgProcedure.mutation(async ({ ctx }) => runSelfHealing({ userId: ctx.user.uid })),

  // ── Point 78 ────────────────────────────────────────────────────────────
  lecons: directionProcedure
    .input(z.object({ limit: z.number().int().min(1).max(300).optional() }).optional())
    .query(async ({ input }) => listLessons(input?.limit ?? 150)),

  completerLecon: directionProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        cause: z.string().max(4000).optional(),
        solution: z.string().max(4000).optional(),
        prevention: z.string().max(4000).optional(),
      }),
    )
    .mutation(async ({ input }) => updateLesson(input)),

  validerLecon: pdgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => validateLesson(input.id, ctx.user.uid)),

  health: directionProcedure.query(async () => resilienceHealth()),
});
