/**
 * MKA.P-MS FABRIQUE INTELLIGENCE — router tRPC (points 84-85-86-88-89-90).
 *
 * Lecture ouverte à la direction ; les gestes qui engagent l'entreprise
 * (suspendre un fournisseur, sauvegarder ou restaurer la mémoire) sont au PDG.
 */
import { z } from "zod";
import { directionProcedure, pdgProcedure, router } from "../trpc.js";
import {
  CAPABILITIES,
  CONFIDENTIALITY_LEVELS,
  MEMORY_TABLES,
  aiFabricHealth,
  aiFabricStats,
  backupMemory,
  chooseProvider,
  costSummary,
  dependencyReport,
  finalRule,
  listMemoryBackups,
  listRoutes,
  providerStates,
  requestMemoryRestore,
  setProviderSuspended,
  supervision,
  verifyMemoryBackup,
} from "./service.js";

export const AI_FABRIC_META = {
  code: "ai_fabric",
  name: "Fabrique Intelligence",
  role: "Abstraction des fournisseurs externes, coûts, sauvegarde de la mémoire, supervision des moteurs.",
} as const;

export const aiFabricRouter = router({
  referentiels: directionProcedure.query(() => ({
    capacites: CAPABILITIES,
    confidentialites: CONFIDENTIALITY_LEVELS,
    tablesMemoire: MEMORY_TABLES,
  })),

  stats: directionProcedure.query(() => aiFabricStats()),
  health: directionProcedure.query(() => aiFabricHealth()),

  // ─── Points 84-85 ────────────────────────────────────────────────────────
  fournisseurs: directionProcedure.query(() => providerStates()),
  dependance: directionProcedure.query(() => dependencyReport()),
  routages: directionProcedure.query(() => listRoutes()),

  simulerRoutage: directionProcedure
    .input(
      z.object({
        capacite: z.string().min(2).max(32),
        tache: z.string().min(2).max(64),
        moteur: z.string().max(48).optional(),
        pays: z.string().length(2).nullable().optional(),
        confidentialite: z.enum(CONFIDENTIALITY_LEVELS).optional(),
      }),
    )
    .mutation(({ input }) =>
      chooseProvider({
        capability: input.capacite,
        taskType: input.tache,
        engine: input.moteur,
        countryCode: input.pays ?? null,
        confidentiality: input.confidentialite,
      }),
    ),

  suspendreFournisseur: pdgProcedure
    .input(z.object({ code: z.string().min(2).max(48), suspendu: z.boolean() }))
    .mutation(({ input, ctx }) =>
      setProviderSuspended({ code: input.code, suspended: input.suspendu, actorId: ctx.user.uid }),
    ),

  // ─── Point 86 ────────────────────────────────────────────────────────────
  couts: directionProcedure
    .input(z.object({ jours: z.number().int().min(1).max(365).optional() }).optional())
    .query(({ input }) => costSummary(input?.jours ?? 30)),

  // ─── Point 88 ────────────────────────────────────────────────────────────
  sauvegardesMemoire: directionProcedure.query(() => listMemoryBackups()),

  sauvegarderMemoire: pdgProcedure
    .input(z.object({ note: z.string().max(400).optional() }).optional())
    .mutation(({ input, ctx }) => backupMemory({ note: input?.note, createdBy: ctx.user.uid })),

  verifierMemoire: directionProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => verifyMemoryBackup(input.id)),

  demanderRestauration: pdgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input, ctx }) =>
      requestMemoryRestore({ backupId: input.id, requestedBy: ctx.user.uid }),
    ),

  // ─── Points 89-90 ────────────────────────────────────────────────────────
  supervision: directionProcedure.query(() => supervision()),
  regleFinale: directionProcedure.query(() => finalRule()),
});
