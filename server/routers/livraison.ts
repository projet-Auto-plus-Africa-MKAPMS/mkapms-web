import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { deliveryProfiles, deliveryMissions, deliveryPricing, deliveryTracking } from "../schema.js";

// Univers Livraison (Plan Partie 2 §7). Règle moto: 20 kg / 60x40x40 cm max.
const MOTO_MAX_KG = 20;
const MOTO_MAX_DIM = { l: 60, w: 40, h: 40 };

function vehicleTypeForParcel(poidsKg?: number, l?: number, w?: number, h?: number): "moto" | "utilitaire" {
  const overWeight = (poidsKg ?? 0) > MOTO_MAX_KG;
  const overDim = (l ?? 0) > MOTO_MAX_DIM.l || (w ?? 0) > MOTO_MAX_DIM.w || (h ?? 0) > MOTO_MAX_DIM.h;
  return overWeight || overDim ? "utilitaire" : "moto";
}

export const livraisonRouter = router({
  providers: publicProcedure
    .input(z.object({ country: z.string().optional(), limit: z.number().min(1).max(100).default(30) }).default({}))
    .query(async ({ input }) => {
      const conds = [eq(deliveryProfiles.active, true)];
      if (input.country) conds.push(eq(deliveryProfiles.countryCode, input.country));
      return db.select().from(deliveryProfiles).where(and(...conds)).orderBy(desc(deliveryProfiles.rating)).limit(input.limit);
    }),

  registerProvider: protectedProcedure
    .input(
      z.object({
        nom: z.string().min(2),
        type: z.enum(["moto", "scooter", "vehicule_leger", "utilitaire", "fourgon", "camion"]).default("moto"),
        isSociete: z.boolean().default(false),
        zone: z.string().optional(),
        countryCode: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [p] = await db.insert(deliveryProfiles).values({ ...input, userId: ctx.user.uid }).returning();
      return p;
    }),

  // Calcul tarif + recommandation de véhicule (refuse moto si trop lourd/volumineux).
  quote: publicProcedure
    .input(
      z.object({
        poidsKg: z.number().optional(),
        longueurCm: z.number().optional(),
        largeurCm: z.number().optional(),
        hauteurCm: z.number().optional(),
        distanceKm: z.number().default(0),
        urgent: z.boolean().default(false),
        countryCode: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const recommended = vehicleTypeForParcel(input.poidsKg, input.longueurCm, input.largeurCm, input.hauteurCm);
      const conds = [eq(deliveryPricing.type, recommended), eq(deliveryPricing.active, true)];
      const [pricing] = await db.select().from(deliveryPricing).where(and(...conds)).limit(1);
      const base = pricing ? Number(pricing.baseFee) : recommended === "moto" ? 5 : 15;
      const perKm = pricing ? Number(pricing.perKm) : recommended === "moto" ? 0.8 : 1.5;
      const mult = input.urgent ? (pricing ? Number(pricing.urgentMultiplier) : 1.5) : 1;
      const tarif = Math.round((base + perKm * input.distanceKm) * mult * 100) / 100;
      return { recommendedVehicleType: recommended, tarif, motoAllowed: recommended === "moto" };
    }),

  createMission: protectedProcedure
    .input(
      z.object({
        typeColis: z.string().optional(),
        poidsKg: z.number().optional(),
        longueurCm: z.number().optional(),
        largeurCm: z.number().optional(),
        hauteurCm: z.number().optional(),
        adresseDepart: z.string().optional(),
        adresseArrivee: z.string().optional(),
        distanceKm: z.number().optional(),
        urgent: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const vt = vehicleTypeForParcel(input.poidsKg, input.longueurCm, input.largeurCm, input.hauteurCm);
      const [m] = await db.insert(deliveryMissions).values({
        clientId: ctx.user.uid,
        typeColis: input.typeColis,
        poidsKg: input.poidsKg != null ? String(input.poidsKg) : undefined,
        longueurCm: input.longueurCm,
        largeurCm: input.largeurCm,
        hauteurCm: input.hauteurCm,
        adresseDepart: input.adresseDepart,
        adresseArrivee: input.adresseArrivee,
        distanceKm: input.distanceKm != null ? String(input.distanceKm) : undefined,
        urgent: input.urgent,
        vehicleTypeRequis: vt,
        status: "creee",
      }).returning();
      return m;
    }),

  myMissions: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(deliveryMissions).where(eq(deliveryMissions.clientId, ctx.user.uid)).orderBy(desc(deliveryMissions.createdAt));
  }),

  track: publicProcedure.input(z.object({ missionId: z.number() })).query(async ({ input }) => {
    return db.select().from(deliveryTracking).where(eq(deliveryTracking.missionId, input.missionId)).orderBy(desc(deliveryTracking.createdAt));
  }),
});
