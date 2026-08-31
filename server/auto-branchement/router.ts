/**
 * Module d'auto-branchement — sous-routeur tRPC.
 *
 * Réservé à la direction : c'est un état de la plateforme, pas une donnée
 * publique. `analyser` relance la passe complète (publication au bus comprise)
 * sans attendre le prochain passage automatique.
 */
import { z } from "zod";
import { router, pdgProcedure } from "../trpc.js";
import {
  analyser,
  codesNonDeclares,
  destinationsMortes,
  ecransMuets,
  propositions,
  synthese,
} from "./service.js";

export const autoBranchementRouter = router({
  synthese: pdgProcedure.query(() => synthese()),

  destinations: pdgProcedure.query(async () => destinationsMortes()),

  ecrans: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(400).default(60) }).optional())
    .query(({ input }) => ecransMuets().slice(0, input?.limit ?? 60)),

  codesNonDeclares: pdgProcedure.query(() => codesNonDeclares()),

  propositions: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(400).default(60) }).optional())
    .query(async ({ input }) => (await propositions()).slice(0, input?.limit ?? 60)),

  analyser: pdgProcedure.mutation(async () => analyser({ trigger: "direction" })),
});
