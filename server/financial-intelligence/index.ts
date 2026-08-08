/**
 * MKA.P-MS Financial Intelligence Engine (point 27).
 *
 * Moteur séparé, relié au Système Intelligent central et au Notification OS.
 * Il surveille l'argent : paiement échoué, double paiement, remboursement,
 * facture manquante, abonnement expiré, commande sans paiement, paiement sans
 * commande, montant incohérent, changement de devise.
 */
import { z } from "zod";
import { adminProcedure, router } from "../trpc.js";
import { DETECTORS } from "./detectors.js";
import {
  analyzeFinances,
  financialIntelligenceHealth,
  listAnomalies,
  resolveAnomaly,
} from "./service.js";

export const FINANCIAL_INTELLIGENCE_META = {
  code: "financial_intelligence",
  name: "Financial Intelligence Engine",
  role: "Surveillance des anomalies financières : aucune anomalie ne reste silencieuse.",
} as const;

export const financialIntelligenceRouter = router({
  /** Liste des contrôles réellement exécutés — pas de promesse abstraite. */
  detectors: adminProcedure.query(() =>
    DETECTORS.map((d) => ({ code: d.code, label: d.label, severity: d.severity })),
  ),

  analyze: adminProcedure.mutation(() => analyzeFinances()),

  list: adminProcedure
    .input(
      z.object({
        status: z.enum(["ouverte", "traitee", "ignoree"]).optional(),
        severity: z.enum(["critique", "important", "a_surveiller"]).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      }),
    )
    .query(({ input }) => listAnomalies(input)),

  resolve: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["traitee", "ignoree"]),
        note: z.string().max(1000).optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      resolveAnomaly({ ...input, userId: ctx.user!.uid }),
    ),

  health: adminProcedure.query(() => financialIntelligenceHealth()),
});

export { analyzeFinances, financialIntelligenceHealth } from "./service.js";
