/**
 * Points 102-103 — audit et activation du Système Intelligent (PDG / Direction).
 *
 * Réservé au back-office : l'état réel des capacités du système n'est pas une
 * donnée visiteur.
 */
import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import { CAPACITES, ETAT_LABELS } from "./capabilities.js";
import {
  auditHistory,
  codeGenerationState,
  cycleHistory,
  latestSmartAudit,
  runCycle,
  runSmartAudit,
} from "./service.js";

export const smartAuditRouter = router({
  /** Référentiel des 16 capacités attendues, dans l'ordre du cycle. */
  referentiel: adminProcedure.query(() => ({ capacites: CAPACITES, etats: ETAT_LABELS })),

  /** Dernier audit connu — null tant qu'aucun n'a été lancé. */
  latest: adminProcedure.query(() => latestSmartAudit()),

  historique: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(({ input }) => auditHistory(input?.limit ?? 20)),

  /** Relance l'audit sur l'état réel de la base et du code. */
  auditer: adminProcedure.mutation(({ ctx }) =>
    runSmartAudit({ trigger: "manuel", requestedBy: ctx.user?.uid }),
  ),

  /** État réel de la capacité de génération de code (agent développeur). */
  generationCode: adminProcedure.query(() => codeGenerationState()),

  /** Exécute une fois le cycle complet sur les données réelles. */
  executerCycle: adminProcedure.mutation(({ ctx }) =>
    runCycle({ trigger: "manuel", requestedBy: ctx.user?.uid }),
  ),

  cycles: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(({ input }) => cycleHistory(input?.limit ?? 20)),
});
