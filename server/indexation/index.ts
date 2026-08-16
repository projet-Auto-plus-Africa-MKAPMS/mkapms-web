/**
 * MKA.P-MS Indexation Monitor — accès PDG / Direction.
 *
 * Réservé au back-office (adminProcedure) : le diagnostic d'indexation expose
 * l'état réel de la visibilité, ce n'est pas une donnée visiteur.
 */
import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import {
  CAUSE_LABELS,
  STATUT_LABELS,
  indexationHistory,
  latestIndexationAudit,
  monitorSnapshot,
  runIndexationAudit,
  searchConsoleState,
  watchRecentPages,
} from "./service.js";

export const indexationRouter = router({
  /** Libellés officiels des statuts et causes (pour l'écran PDG). */
  labels: adminProcedure.query(() => ({ statuts: STATUT_LABELS, causes: CAUSE_LABELS })),

  /** État réel du connecteur Search Console — jamais supposé actif. */
  searchConsole: adminProcedure.query(() => searchConsoleState()),

  /** Moniteur d'indexation : publiques / indexées / en attente / exclues / erreurs. */
  monitor: adminProcedure.query(() => monitorSnapshot()),

  /** Dernier audit enregistré (sans relancer les appels réseau). */
  latest: adminProcedure.query(() => latestIndexationAudit()),

  /** Relance l'audit réel URL par URL. */
  run: adminProcedure
    .input(z.object({ parFamille: z.number().int().min(1).max(10).default(3) }).optional())
    .mutation(({ ctx, input }) =>
      runIndexationAudit({
        trigger: "manuel",
        requestedBy: ctx.user?.uid,
        parFamille: input?.parFamille ?? 3,
      }),
    ),

  /** Contrôle de surveillance des dernières pages publiées. */
  watchRecent: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
    .mutation(({ input }) => watchRecentPages(input?.limit ?? 20)),

  history: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(({ input }) => indexationHistory(input?.limit ?? 20)),
});
