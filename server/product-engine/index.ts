/**
 * MKA.P-MS Google Product Engine — accès PDG / Direction.
 *
 * Réservé au back-office : l'état réel des destinations commerciales n'est pas
 * une donnée visiteur. Le flux produit lui-même est public (/feeds/produits.xml),
 * puisque Google doit pouvoir le lire.
 */
import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import { MAILLON_LABELS } from "./service.js";
import {
  chaine,
  latestFeedReport,
  merchantState,
  pipelinesSnapshot,
  refreshFeed,
} from "./service.js";

export const productEngineRouter = router({
  /** Libellés des maillons de la chaîne de synchronisation (point 97). */
  labels: adminProcedure.query(() => ({ maillons: MAILLON_LABELS })),

  /** État réel du connecteur Merchant Center — jamais supposé actif. */
  merchant: adminProcedure.query(() => merchantState()),

  /** Séparation des deux tuyaux Produits / Véhicules (point 94). */
  pipelines: adminProcedure.query(() => pipelinesSnapshot()),

  /** Dernier état du flux produit, sans relire le catalogue. */
  latest: adminProcedure.query(() => latestFeedReport()),

  /** Rafraîchit le flux depuis le catalogue réel (points 95-97). */
  refresh: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(1000).default(200) }).optional())
    .mutation(({ ctx, input }) =>
      refreshFeed({
        trigger: "manuel",
        requestedBy: ctx.user?.uid,
        limit: input?.limit ?? 200,
      }),
    ),

  /** Journal maillon par maillon d'une fiche précise. */
  chaine: adminProcedure
    .input(z.object({ source: z.string().max(32), sourceId: z.number().int() }))
    .query(({ input }) => chaine(input.source, input.sourceId)),
});
