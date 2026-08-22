/**
 * Points 108-113 — Continuous Test Engine (accès PDG / Direction).
 */
import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import { SCENARIOS } from "./catalog.js";
import { selectionner } from "./impact.js";
import {
  comparaison,
  deploymentGate,
  overview,
  runHistory,
  runTests,
  scenarioHistory,
} from "./service.js";

const impactInput = z.object({
  fichiers: z.array(z.string().min(1).max(400)).max(500).default([]),
  moteurs: z.array(z.string().min(1).max(96)).max(100).default([]),
});

export const continuousTestRouter = router({
  /** Ce qui est réellement contrôlé, et ce qui est attendu de chaque contrôle. */
  catalogue: adminProcedure.query(() =>
    SCENARIOS.map((s) => ({
      id: s.id,
      domaine: s.domaine,
      label: s.label,
      criticite: s.criticite,
      attendu: s.attendu,
    })),
  ),

  etat: adminProcedure.query(() => overview()),

  executer: adminProcedure
    .input(z.object({ portee: z.string().min(2).max(64).default("complet") }).optional())
    .mutation(({ input, ctx }) =>
      runTests({
        portee: input?.portee ?? "complet",
        trigger: "manuel",
        requestedBy: ctx.user?.uid,
      }),
    ),

  campagnes: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(({ input }) => runHistory(input?.limit ?? 20)),

  historiqueScenario: adminProcedure
    .input(z.object({ scenario: z.string().min(2).max(96), limit: z.number().int().min(1).max(100).default(20) }))
    .query(({ input }) => scenarioHistory(input.scenario, input.limit)),

  /** Point 142 — quels contrôles une modification rend nécessaires, et pourquoi. */
  impact: adminProcedure.input(impactInput).query(({ input }) => selectionner(input)),

  /**
   * Point 142 — exécute les contrôles concernés par la modification, puis la
   * non-régression sur les domaines non concernés.
   */
  executerImpact: adminProcedure
    .input(impactInput.extend({ nonRegression: z.boolean().default(true) }))
    .mutation(async ({ input, ctx }) => {
      const selection = await selectionner(input);
      const scenarios = input.nonRegression
        ? [...selection.scenariosConcernes, ...selection.scenariosNonRegression]
        : selection.scenariosConcernes;
      const run = await runTests({
        portee: "impact",
        trigger: "modification",
        requestedBy: ctx.user?.uid,
        scenarios,
      });
      return { selection, run, comparaison: await comparaison() };
    }),

  /** Point 143 — comparaison avant/après entre les deux dernières campagnes. */
  comparaison: adminProcedure.query(() => comparaison()),

  /** Point 113 — le déploiement est autorisé ou refusé, avec la raison nommée. */
  verrouDeploiement: adminProcedure.query(() => deploymentGate()),
});
