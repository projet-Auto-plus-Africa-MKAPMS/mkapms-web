/**
 * MKA.P-MS Redirection Engine — Sub-router TRPC (connexion contrôlée).
 *
 * Expose :
 *  - resolve      : résoudre une clé → destination (public, journalisé)
 *  - rules        : liste des règles (PDG)
 *  - createRule   : créer une règle (PDG)
 *  - updateRule   : modifier une règle (PDG)
 *  - deleteRule   : supprimer une règle (PDG)
 *  - stats        : synthèse (PDG)
 *  - logs         : journal des résolutions (PDG)
 */
import { z } from "zod";
import { router, publicProcedure, pdgProcedure } from "../trpc.js";
import {
  resolveKey,
  reportOutcome,
  getBrokenRedirects,
  listRules,
  createRule,
  updateRule,
  deleteRule,
  getStats,
  getRecentLogs,
} from "./service.js";

export const redirectionEngineRouter = router({
  // Résolution d'une clé → destination. Public : tout composant peut demander
  // où mène un bouton/service. Journalisé pour repérer les clés sans règle.
  resolve: publicProcedure
    .input(z.object({ key: z.string().min(1).max(128), source: z.string().max(256).optional() }))
    .mutation(async ({ ctx, input }) => {
      return resolveKey(input.key, { userId: ctx.user?.uid, role: ctx.user?.role, source: input.source });
    }),

  // Version query (lecture) pour précharger une destination sans effet visible.
  peek: publicProcedure
    .input(z.object({ key: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      return resolveKey(input.key, { userId: ctx.user?.uid, role: ctx.user?.role });
    }),

  // Résultat réel d'un parcours (rapporté par le client après navigation) :
  // clic navigué, page 404, ou erreur. Alimente la supervision (§5).
  reportOutcome: publicProcedure
    .input(
      z.object({
        key: z.string().min(1).max(128),
        source: z.string().max(256).optional(),
        outcome: z.enum(["navigated", "not_found", "error"]),
        resolvedTo: z.string().max(512).optional(),
        durationMs: z.number().int().nonnegative().max(600000).optional(),
        error: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return reportOutcome(input, { userId: ctx.user?.uid, role: ctx.user?.role });
    }),

  // ── Administration (PDG uniquement) ────────────────────────────────────
  rules: pdgProcedure.query(async () => {
    return listRules();
  }),

  createRule: pdgProcedure
    .input(
      z.object({
        key: z.string().min(1).max(128),
        label: z.string().min(1).max(200),
        kind: z.enum(["button", "service", "route"]).default("button"),
        target: z.string().min(1).max(512),
        external: z.boolean().default(false),
        active: z.boolean().default(true),
        priority: z.number().int().default(0),
        description: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createRule(input, ctx.user.uid);
    }),

  updateRule: pdgProcedure
    .input(
      z.object({
        id: z.number(),
        label: z.string().min(1).max(200).optional(),
        kind: z.enum(["button", "service", "route"]).optional(),
        target: z.string().min(1).max(512).optional(),
        external: z.boolean().optional(),
        active: z.boolean().optional(),
        priority: z.number().int().optional(),
        description: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...patch } = input;
      return updateRule(id, patch, ctx.user.uid);
    }),

  deleteRule: pdgProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      return deleteRule(input.id);
    }),

  stats: pdgProcedure.query(async () => {
    return getStats();
  }),

  // Redirections cassées (clés sans règle, 404, erreurs) — 7 derniers jours.
  broken: pdgProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }).optional())
    .query(async ({ input }) => {
      return getBrokenRedirects(input?.limit ?? 50);
    }),

  logs: pdgProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      return getRecentLogs(input?.limit ?? 100);
    }),
});
