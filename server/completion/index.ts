/**
 * Points 119-120-121-122 — surface tRPC du Completion Center.
 *
 * Lecture réservée à la direction : cet écran dit ce qui reste à faire, y
 * compris ce qui n'a jamais été prouvé.
 */
import { z } from "zod";
import { adminProcedure, router } from "../trpc.js";
import { DOMAINES } from "./definition.js";
import {
  DEFINITION,
  dernier,
  deposerRapport,
  evaluer,
  ordreExecution,
  rapports,
} from "./service.js";

export const COMPLETION_META = {
  code: "completion_center",
  name: "MKA.P-MS Completion Center",
  role: "Répond à « qu'est-ce qui reste à faire ? » domaine par domaine, sur preuve et jamais sur estimation.",
} as const;

export const completionRouter = router({
  /** Point 119 — la règle TERMINÉ, telle qu'appliquée par le calcul. */
  definition: adminProcedure.query(() => DEFINITION),

  /** Domaines métier examinés et moteurs attendus pour chacun. */
  domaines: adminProcedure.query(() => DOMAINES),

  /** Dernière photographie enregistrée (aucun recalcul). */
  dernier: adminProcedure.query(() => dernier()),

  /** Recalcule et enregistre une photographie d'achèvement. */
  evaluer: adminProcedure.mutation(({ ctx }) =>
    evaluer({ trigger: "manuel", requestedBy: ctx.user?.uid }),
  ),

  /** Point 122 — ordre d'exécution et état réellement observé de chaque étape. */
  ordre: adminProcedure.query(() => ordreExecution()),

  /** Point 120 — rapports obligatoires déposés. */
  rapports: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(40) }).optional())
    .query(({ input }) => rapports(input?.limit ?? 40)),

  /** Point 120 — dépôt d'un rapport ; les preuves sont calculées, pas déclarées. */
  deposerRapport: adminProcedure
    .input(
      z.object({
        tache: z.string().min(3).max(500),
        domaine: z.string().max(48).optional(),
        existant: z.string().max(4000).optional(),
        modifie: z.string().max(4000).optional(),
        active: z.string().max(4000).optional(),
        moteursConnectes: z.array(z.string().max(64)).max(60).optional(),
        seoConcerne: z.string().max(1000).optional(),
        paysConcernes: z.array(z.string().max(8)).max(250).optional(),
        paiementConcerne: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      deposerRapport({ ...input, auteur: "pdg", requestedBy: ctx.user?.uid }),
    ),
});
