/**
 * Proximity Engine — router tRPC (points 34 & 35).
 *
 * La recherche « près de moi » est publique : un visiteur non connecté doit
 * pouvoir chercher un garage autour de lui. La matrice des mini-plateformes
 * est un outil de pilotage : elle reste réservée à l'administration.
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc.js";
import { localServiceCatalog, nearby, proximityHealth, universePlatforms } from "./service.js";

export const PROXIMITY_ENGINE_META = {
  code: "proximity_engine",
  name: "Proximity Engine",
  role: "Recherche locale « près de moi » par service et matrice de complétude des mini-plateformes.",
} as const;

export const proximityEngineRouter = router({
  /** Services locaux déclarés + ceux qui ne sont pas encore branchés. */
  services: publicProcedure.query(() => localServiceCatalog()),

  nearby: publicProcedure
    .input(
      z.object({
        service: z.string().min(2),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        city: z.string().max(120).optional(),
        countryCode: z.string().length(2).optional(),
        radiusKm: z.number().min(1).max(500).optional(),
        limit: z.number().min(1).max(100).optional(),
      }),
    )
    .query(({ input }) =>
      nearby({
        service: input.service,
        position:
          input.latitude != null && input.longitude != null
            ? { latitude: input.latitude, longitude: input.longitude }
            : null,
        city: input.city ?? null,
        countryCode: input.countryCode,
        radiusKm: input.radiusKm,
        limit: input.limit,
      }),
    ),

  /** Point 34 : où en est réellement chaque univers en tant que mini-plateforme. */
  universes: adminProcedure.query(() => universePlatforms()),

  health: adminProcedure.query(() => proximityHealth()),
});
