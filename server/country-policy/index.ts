/**
 * MKA.P-MS COUNTRY POLICY ENGINE — router tRPC (point 66).
 *
 * Accès direction : ce moteur décide de ce que la plateforme s'autorise à faire
 * dans chaque juridiction. Confirmer une règle est un acte engageant, réservé
 * au PDG (`super_admin`), la lecture restant ouverte à la direction.
 */
import { z } from "zod";
import { directionProcedure, pdgProcedure, router } from "../trpc.js";
import {
  CPE_DOMAINS,
  CPE_EFFECTS,
  confirmRule,
  countryPolicyHealth,
  coverageMatrix,
  declareRule,
  evaluateAction,
  listRules,
  policyStats,
  recentEvaluations,
  retireRule,
} from "./service.js";

export const COUNTRY_POLICY_META = {
  code: "politique_pays",
  name: "Country Policy Engine",
  role: "Limite réglementaire de l'automatisation : une règle non confirmée bloque l'action.",
} as const;

export const countryPolicyRouter = router({
  referentiels: directionProcedure.query(() => ({
    domaines: Object.entries(CPE_DOMAINS).map(([code, label]) => ({ code, label })),
    effets: Object.entries(CPE_EFFECTS).map(([code, label]) => ({ code, label })),
  })),

  stats: directionProcedure.query(async () => policyStats()),

  regles: directionProcedure
    .input(
      z
        .object({
          countryCode: z.string().max(4).optional(),
          domain: z.string().max(48).optional(),
          limit: z.number().int().min(1).max(500).optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => listRules(input ?? {})),

  couverture: directionProcedure.query(async () => coverageMatrix()),

  evaluations: directionProcedure
    .input(z.object({ limit: z.number().int().min(1).max(300).optional() }).optional())
    .query(async ({ input }) => recentEvaluations(input?.limit ?? 100)),

  /** Évaluation à la demande, pour vérifier ce que la plateforme s'autorise. */
  evaluer: directionProcedure
    .input(
      z.object({
        actionType: z.string().min(1).max(120),
        countryCode: z.string().max(4).optional(),
        domain: z.string().max(48).optional(),
        topic: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) =>
      evaluateAction({
        actionType: input.actionType,
        countryCode: input.countryCode ?? null,
        domain: input.domain,
        topic: input.topic,
        actorId: ctx.user.uid,
      }),
    ),

  // Déclarer, confirmer ou retirer une règle engage la responsabilité de
  // l'entreprise dans une juridiction : réservé au PDG.
  declarerRegle: pdgProcedure
    .input(
      z.object({
        countryCode: z.string().min(2).max(4),
        domain: z.string().min(1).max(48),
        topic: z.string().max(120).optional(),
        rule: z.string().min(3),
        effect: z.enum(["autorise", "interdit", "conditionne"]),
        conditions: z.record(z.unknown()).optional(),
        authority: z.string().max(160).optional(),
        sourceCode: z.string().max(64).optional(),
        sourceRef: z.string().optional(),
        validFrom: z.coerce.date().optional(),
        validUntil: z.coerce.date().optional(),
        confidence: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => declareRule({ ...input, declaredBy: ctx.user.uid })),

  confirmerRegle: pdgProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        confidence: z.number().int().min(0).max(100).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => confirmRule(input.id, ctx.user.uid, input.confidence)),

  retirerRegle: pdgProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => retireRule(input.id, ctx.user.uid)),

  health: directionProcedure.query(async () => countryPolicyHealth()),
});
