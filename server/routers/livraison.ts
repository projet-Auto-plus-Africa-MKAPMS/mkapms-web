import { z } from "zod";
import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { notifyEvent } from "../notification-os/triggers.js";
import { deliveryProfiles, deliveryMissions, deliveryPricing, deliveryTracking, serviceTracking } from "../schema.js";
import { createPaymentCheckout } from "../payment-engine/checkout.js";
import { requestReviewAfterCompletion } from "../reputation-engine/service.js";

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

const FALLBACK_BASE: Record<DeliveryVehicle, number> = { moto: 5, utilitaire: 15, fourgon: 25, camion: 45 };
const FALLBACK_PAR_KM: Record<DeliveryVehicle, number> = { moto: 0.8, utilitaire: 1.5, fourgon: 2, camion: 2.8 };

async function tarifPourVehicule(vehicleType: DeliveryVehicle): Promise<{ base: number; perKm: number }> {
  const conds = [eq(deliveryPricing.vehicleType, vehicleType), eq(deliveryPricing.active, true)];
  const [pricing] = await db.select().from(deliveryPricing).where(and(...conds)).limit(1);
  return {
    base: pricing ? Number(pricing.prixBase) : FALLBACK_BASE[vehicleType],
    perKm: pricing ? Number(pricing.prixParKm) : FALLBACK_PAR_KM[vehicleType],
  };
}

/**
 * Calcul du tarif d'un colis à partir de ses dimensions — utilisé par le
 * devis public (`quote`) et par l'Estimate Gateway (LOT IA02E). Seule
 * fonction qui connaît la formule : aucune duplication ailleurs.
 */
export async function calculerTarifColis(input: {
  poidsKg?: number | null;
  longueurCm?: number | null;
  largeurCm?: number | null;
  hauteurCm?: number | null;
  distanceKm?: number | null;
  urgent?: boolean;
  heavyPart?: boolean;
}): Promise<{ recommendedVehicleType: DeliveryVehicle; tarif: number | null; motoAllowed: boolean; reason: string | null; manque?: string }> {
  const rec = recommendVehicle(input.poidsKg ?? undefined, input.longueurCm ?? undefined, input.largeurCm ?? undefined, input.hauteurCm ?? undefined, input.heavyPart);
  const recommended = rec.vehicle;
  if (input.distanceKm == null) {
    return {
      recommendedVehicleType: recommended,
      tarif: null,
      motoAllowed: rec.motoAllowed,
      reason: rec.reason,
      manque: "Distance entre les deux adresses non connue : le montant ne peut pas être calculé.",
    };
  }
  const { base, perKm } = await tarifPourVehicule(recommended);
  const mult = input.urgent ? 1.5 : 1;
  const tarif = Math.round((base + perKm * input.distanceKm) * mult * 100) / 100;
  return { recommendedVehicleType: recommended, tarif, motoAllowed: rec.motoAllowed, reason: rec.reason };
}

/**
 * Montant réellement dû pour une mission déjà créée — recalculé à partir des
 * champs enregistrés à la création (jamais depuis un montant transmis par le
 * client). Utilisé par `payMission` et par l'Estimate Gateway.
 */
export async function calculerTarifMission(mission: {
  vehicleTypeRequis: string | null;
  distanceKm: string | null;
  urgent: boolean | null;
}): Promise<{ tarif: number | null; manque?: string }> {
  const distanceKm = mission.distanceKm != null ? Number(mission.distanceKm) : null;
  if (distanceKm === null) {
    return { tarif: null, manque: "Distance de la mission non connue : le montant ne peut pas être calculé." };
  }
  const vehicleType = (mission.vehicleTypeRequis as DeliveryVehicle) ?? "moto";
  const { base, perKm } = await tarifPourVehicule(vehicleType);
  const mult = mission.urgent ? 1.5 : 1;
  return { tarif: Math.round((base + perKm * distanceKm) * mult * 100) / 100 };
}

export const livraisonRouter = router({
  providers: publicProcedure
    .input(z.object({ country: z.string().optional(), limit: z.number().min(1).max(100).default(30) }).default({}))
    .query(async ({ input }) => {
      const conds = [eq(deliveryProfiles.active, true)];
      if (input.country) conds.push(or(eq(deliveryProfiles.countryCode, input.country), isNull(deliveryProfiles.countryCode))!);
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
      return calculerTarifColis(input);
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
      await notifyEvent({
        userId: mission.clientId,
        event: "livraison",
        vars: {
          reference: `LIV-${mission.id}`,
          statut: input.detail ?? statusLabels[input.status],
        },
        url: "/compte",
      });

      // Point 48 — livraison réellement effectuée → demande d'avis vérifiée.
      // Sans transporteur assigné (`profileId`), il n'y a personne à évaluer :
      // aucune demande n'est créée plutôt que d'en créer une sans cible.
      if (input.status === "livree" && mission.profileId) {
        const [profil] = await db
          .select({ nom: deliveryProfiles.nom, countryCode: deliveryProfiles.countryCode })
          .from(deliveryProfiles)
          .where(eq(deliveryProfiles.id, mission.profileId))
          .limit(1);
        await requestReviewAfterCompletion({
          userId: mission.clientId,
          targetType: "transporteur",
          targetId: mission.profileId,
          univers: "livraison",
          transactionType: "mission_livraison",
          transactionId: mission.id,
          countryCode: profil?.countryCode ?? null,
          triggerReason: "prestation_terminee",
          libelle: `Votre livraison LIV-${mission.id}${profil?.nom ? ` par ${profil.nom}` : ""} est effectuée.`,
        }).catch(() => {});
      }
      return { ok: true };
    }),

  // Paiement d'une mission de livraison par le client.
  // Le montant est TOUJOURS recalculé ici depuis les champs de la mission
  // (distance, gabarit, urgence) — jamais depuis une valeur transmise par le
  // navigateur. Une mission sans distance connue n'est pas payable.
  payMission: protectedProcedure
    .input(z.object({ missionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [m] = await db.select().from(deliveryMissions).where(eq(deliveryMissions.id, input.missionId)).limit(1);
      if (!m) throw new TRPCError({ code: "NOT_FOUND", message: "Mission introuvable" });
      if (m.clientId !== ctx.user.uid) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Mission d'un autre client" });
      }
      const { tarif, manque } = await calculerTarifMission(m);
      if (tarif === null) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: manque ?? "Montant non calculable pour cette mission : le paiement est refusé plutôt que d'encaisser un chiffre inventé.",
        });
      }
      const res = await createPaymentCheckout({
        userId: ctx.user.uid,
        kind: "livraison_mission",
        amount: tarif,
        currency: "EUR",
        label: `Livraison LIV-${m.id} — ${m.typeColis ?? "Colis"}`,
        metadata: { missionId: m.id, vehicleType: m.vehicleTypeRequis ?? "" },
        successPath: `/compte/livraisons?paid=${m.id}`,
        cancelPath: `/compte/livraisons?canceled=${m.id}`,
      });
      return res;
    }),
});
