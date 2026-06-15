import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { deliveryProfiles, deliveryMissions, deliveryPricing, deliveryTracking, serviceTracking } from "../schema.js";
import { notifications } from "../modules/core.js";

// Univers Livraison (Plan Partie 2 §7 + Partie 6 §4). Règle moto: 20 kg / 60x40x40 cm max.
const MOTO_MAX_KG = 20;
const MOTO_MAX_DIM = { l: 60, w: 40, h: 40 };

type DeliveryVehicle = "moto" | "utilitaire" | "fourgon" | "camion";

// Pièces volumineuses qui interdisent automatiquement la moto (Partie 6 §4).
export const HEAVY_PARTS = [
  "moteur",
  "boite_vitesse",
  "capot",
  "pare_chocs",
  "porte",
  "jantes",
  "pneus",
] as const;

function recommendVehicle(
  poidsKg?: number,
  l?: number,
  w?: number,
  h?: number,
  heavyPart?: boolean,
): { vehicle: DeliveryVehicle; motoAllowed: boolean; reason: string | null } {
  const poids = poidsKg ?? 0;
  const maxDim = Math.max(l ?? 0, w ?? 0, h ?? 0);
  // Très lourd / très grand → camion ; lourd → fourgon.
  if (poids > 500 || maxDim > 250) return { vehicle: "camion", motoAllowed: false, reason: "Colis très lourd ou très volumineux" };
  if (poids > 150 || maxDim > 180) return { vehicle: "fourgon", motoAllowed: false, reason: "Colis volumineux" };
  const overWeight = poids > MOTO_MAX_KG;
  const overDim = (l ?? 0) > MOTO_MAX_DIM.l || (w ?? 0) > MOTO_MAX_DIM.w || (h ?? 0) > MOTO_MAX_DIM.h;
  if (heavyPart) return { vehicle: "utilitaire", motoAllowed: false, reason: "Pièce mécanique lourde (moteur, capot, jantes…)" };
  if (overWeight || overDim) return { vehicle: "utilitaire", motoAllowed: false, reason: "Dépasse 20 kg ou 60×40×40 cm" };
  return { vehicle: "moto", motoAllowed: true, reason: null };
}

function vehicleTypeForParcel(poidsKg?: number, l?: number, w?: number, h?: number, heavyPart?: boolean): DeliveryVehicle {
  return recommendVehicle(poidsKg, l, w, h, heavyPart).vehicle;
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
        heavyPart: z.boolean().default(false),
        countryCode: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const rec = recommendVehicle(input.poidsKg, input.longueurCm, input.largeurCm, input.hauteurCm, input.heavyPart);
      const recommended = rec.vehicle;
      const conds = [eq(deliveryPricing.vehicleType, recommended), eq(deliveryPricing.active, true)];
      const [pricing] = await db.select().from(deliveryPricing).where(and(...conds)).limit(1);
      const fallbackBase: Record<DeliveryVehicle, number> = { moto: 5, utilitaire: 15, fourgon: 25, camion: 45 };
      const fallbackPerKm: Record<DeliveryVehicle, number> = { moto: 0.8, utilitaire: 1.5, fourgon: 2, camion: 2.8 };
      const base = pricing ? Number(pricing.prixBase) : fallbackBase[recommended];
      const perKm = pricing ? Number(pricing.prixParKm) : fallbackPerKm[recommended];
      const mult = input.urgent ? 1.5 : 1;
      const tarif = Math.round((base + perKm * input.distanceKm) * mult * 100) / 100;
      return { recommendedVehicleType: recommended, tarif, motoAllowed: rec.motoAllowed, reason: rec.reason };
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
      await db.insert(serviceTracking).values({
        userId: ctx.user.uid,
        serviceType: "livraison",
        serviceId: m.id,
        reference: `LIV-${m.id}`,
        titre: `Livraison LIV-${m.id}`,
        status: "creee",
        statusLabel: "Mission créée",
      });
      return m;
    }),

  myMissions: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(deliveryMissions).where(eq(deliveryMissions.clientId, ctx.user.uid)).orderBy(desc(deliveryMissions.createdAt));
  }),

  track: publicProcedure.input(z.object({ missionId: z.number() })).query(async ({ input }) => {
    return db.select().from(deliveryTracking).where(eq(deliveryTracking.missionId, input.missionId)).orderBy(desc(deliveryTracking.createdAt));
  }),

  updateMissionStatus: protectedProcedure
    .input(z.object({
      missionId: z.number(),
      status: z.enum(["creee", "en_recherche", "acceptee", "refusee", "en_cours", "livree", "annulee", "litige"]),
      detail: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [mission] = await db.select().from(deliveryMissions).where(eq(deliveryMissions.id, input.missionId)).limit(1);
      if (!mission) throw new Error("Mission introuvable");
      await db.update(deliveryMissions).set({ status: input.status }).where(eq(deliveryMissions.id, input.missionId));
      await db.insert(deliveryTracking).values({
        missionId: input.missionId,
        status: input.status,
        note: input.detail ?? null,
      });
      const statusLabels: Record<string, string> = {
        creee: "Mission créée",
        en_recherche: "Recherche de livreur",
        acceptee: "Livreur assigné",
        refusee: "Refusée",
        en_cours: "En cours de livraison",
        livree: "Livré",
        annulee: "Annulée",
        litige: "Litige ouvert",
      };
      await db.insert(serviceTracking).values({
        userId: mission.clientId,
        serviceType: "livraison",
        serviceId: mission.id,
        reference: `LIV-${mission.id}`,
        titre: `Livraison LIV-${mission.id}`,
        status: input.status,
        statusLabel: statusLabels[input.status] ?? input.status,
        detail: input.detail,
      });
      await db.insert(notifications).values({
        userId: mission.clientId,
        type: "livraison",
        title: `Livraison LIV-${mission.id} — ${statusLabels[input.status]}`,
        body: input.detail ?? `Votre livraison est maintenant : ${statusLabels[input.status]}`,
        url: "/compte",
      });
      return { ok: true };
    }),
});
