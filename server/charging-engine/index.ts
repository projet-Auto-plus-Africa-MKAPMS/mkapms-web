/**
 * Charging Engine (point 45) — router tRPC.
 *
 * La recherche est publique. La déclaration d'une borne exige un compte (pour
 * savoir qui l'a déclarée), et la publication reste une décision humaine de
 * l'administration.
 */
import { z } from "zod";
import {
  adminProcedure,
  directionProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../trpc.js";
import { CHARGING_ACCESS, CHARGING_CONNECTORS } from "./schema.js";
import {
  chargingCatalog,
  chargingEngineHealth,
  declareChargingPoint,
  listChargingPoints,
  reviewChargingPoint,
  searchChargingPoints,
} from "./service.js";

export const CHARGING_ENGINE_META = {
  code: "energie_recharge",
  name: "Energy Engine — Recharge",
  role: "Annuaire des bornes de recharge : recherche filtrée par pays/ville/prise/puissance, déclarations validées par un humain.",
} as const;

export const chargingEngineRouter = router({
  catalog: publicProcedure.query(() => chargingCatalog()),

  rechercher: publicProcedure
    .input(
      z.object({
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        connector: z.enum(CHARGING_CONNECTORS).optional(),
        minPowerKw: z.number().int().min(0).max(1000).optional(),
        access: z.enum(CHARGING_ACCESS).optional(),
        limit: z.number().int().min(1).max(200).default(60),
      }),
    )
    .query(async ({ input }) => searchChargingPoints(input)),

  declarer: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(180),
        operator: z.string().max(160).optional(),
        countryCode: z.string().min(2).max(4),
        city: z.string().min(1).max(120),
        postalCode: z.string().max(16).optional(),
        address: z.string().max(255).optional(),
        latitude: z.number().min(-90).max(90).optional(),
        longitude: z.number().min(-180).max(180).optional(),
        connectors: z.array(z.enum(CHARGING_CONNECTORS)).min(1),
        powerKw: z.number().int().min(1).max(1000).optional(),
        outlets: z.number().int().min(1).max(500).optional(),
        access: z.enum(CHARGING_ACCESS),
        pricingNote: z.string().max(200).optional(),
        openingHours: z.string().max(160).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      declareChargingPoint({ ...input, userId: ctx.user.uid }),
    ),

  bornes: directionProcedure
    .input(
      z
        .object({
          status: z.enum(["en_attente", "publie", "rejete", "hors_service"]).optional(),
          countryCode: z.string().max(4).optional(),
          limit: z.number().int().min(1).max(500).default(200),
        })
        .optional(),
    )
    .query(async ({ input }) =>
      listChargingPoints({
        status: input?.status,
        countryCode: input?.countryCode,
        limit: input?.limit ?? 200,
      }),
    ),

  examiner: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        decision: z.enum(["publie", "rejete", "hors_service"]),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      reviewChargingPoint({ ...input, reviewerId: ctx.user.uid }),
    ),

  health: directionProcedure.query(async () => chargingEngineHealth()),
});
