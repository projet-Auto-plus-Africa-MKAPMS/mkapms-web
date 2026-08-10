/**
 * Point 52 — router du connecteur Google Business Profile.
 *
 * Toutes les procédures sont réservées à la direction : rattacher une fiche
 * Google à un établissement engage la marque, et un relevé saisi à la main doit
 * être imputable à quelqu'un.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { directionProcedure, router } from "../../trpc.js";
import {
  compareSources,
  connectorStatus,
  declareLocation,
  listLocations,
  recordManualSnapshot,
  verifyLocation,
} from "./service.js";

export const GOOGLE_BUSINESS_CONNECTOR_META = {
  code: "connecteur_google_business",
  name: "Connecteur Google Business Profile",
  role: "Rattachement des établissements physiques éligibles et relevé séparé de leur réputation Google. Aucun avis n'est copié entre les deux sources.",
} as const;

export const googleBusinessRouter = router({
  etat: directionProcedure.query(async () => connectorStatus()),

  etablissements: directionProcedure.query(async () => listLocations()),

  declarer: directionProcedure
    .input(
      z.object({
        targetType: z.string().min(1).max(32),
        targetId: z.number().int().positive(),
        nom: z.string().min(2).max(200),
        countryCode: z.string().max(4).optional(),
        ville: z.string().max(120).optional(),
        placeId: z.string().max(128).optional(),
        gbpLocationName: z.string().max(200).optional(),
        gbpUrl: z.string().url().max(500).optional(),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => declareLocation({ ...input, actorId: ctx.user.uid })),

  verifier: directionProcedure
    .input(
      z.object({
        locationId: z.number().int().positive(),
        verifie: z.boolean(),
        notes: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => verifyLocation({ ...input, actorId: ctx.user.uid })),

  /**
   * Relevé manuel de la note Google. Il est enregistré comme tel : la
   * plateforme ne prétend pas l'avoir obtenu de Google.
   */
  releveManuel: directionProcedure
    .input(
      z.object({
        locationId: z.number().int().positive(),
        averageRating: z.number().min(1).max(5),
        reviewCount: z.number().int().min(0),
        detail: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => recordManualSnapshot({ ...input, actorId: ctx.user.uid })),

  /** Avis MKA.P-MS et avis Google affichés séparément, jamais fusionnés. */
  comparer: directionProcedure
    .input(z.object({ locationId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const res = await compareSources(input.locationId);
      if (!res) throw new TRPCError({ code: "NOT_FOUND", message: "Établissement introuvable." });
      return res;
    }),
});
