/**
 * MKA.P-MS Auction Engine (points 30-31) — router tRPC.
 *
 * Deux entrées : enchères particuliers et enchères professionnels. Les règles
 * (qui peut enchérir, quel pas, quelle réserve) sont portées par le moteur,
 * pas par l'écran.
 */
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  auctionDetail,
  auctionHealth,
  cancelAuction,
  closeAuction,
  closeExpiredAuctions,
  createAuction,
  listAuctions,
  myAuctions,
  myBids,
  myWonAuctions,
  placeBid,
  publishAuction,
} from "./service.js";
import { BUYER_PROFILES, CATALOG_CATEGORIES } from "./contract.js";

export const AUCTION_ENGINE_META = {
  code: "auction_engine",
  name: "Auction Engine",
  role: "Enchères particuliers et professionnels : lots, offres, adjudication, historique, notifications.",
} as const;

const conditionStatus = z.enum(["bon", "moyen", "a_prevoir", "a_reparer", "non_controle"]);
const lotDetailsSchema = z.object({
  nbVehicules: z.number().int().positive().optional(),
  vehicules: z.array(z.object({
    marque: z.string().max(80), modele: z.string().max(80), annee: z.number().int(), km: z.number().int().nonnegative(), etat: z.string().max(200),
  })).max(50).optional(),
  photosCategories: z.record(z.array(z.string())).optional(),
  marque: z.string().max(80).optional(),
  modele: z.string().max(80).optional(),
  version: z.string().max(80).optional(),
  annee: z.string().max(8).optional(),
  km: z.string().max(16).optional(),
  energie: z.string().max(32).optional(),
  boite: z.string().max(32).optional(),
  puissance: z.string().max(16).optional(),
  typeVehicule: z.enum(["auto", "moto", "utilitaire", "camion", "quad"]).optional(),
  cylindree: z.string().max(16).optional(),
  nbRoues: z.string().max(8).optional(),
  ptac: z.string().max(16).optional(),
  nbEssieux: z.string().max(8).optional(),
  hauteur: z.string().max(16).optional(),
  vin: z.string().max(24).optional(),
  etatGeneral: z.string().max(200).optional(),
  roulant: z.boolean().optional(),
  etatDetail: z.record(conditionStatus).optional(),
  rapportDefauts: z.array(z.string().max(300)).max(30).optional(),
  rapportTravaux: z.array(z.string().max(300)).max(30).optional(),
  rapportEstimation: z.number().nonnegative().optional(),
  rapportDocuments: z.array(z.string().max(300)).max(30).optional(),
  rapportRemarques: z.array(z.string().max(300)).max(30).optional(),
  badges: z.array(z.string().max(40)).max(10).optional(),
}).partial();

export const auctionEngineRouter = router({
  list: publicProcedure
    .input(
      z.object({
        audience: z.enum(["particulier", "professionnel"]).optional(),
        countryCode: z.string().min(2).max(4).optional(),
        status: z.string().max(16).optional(),
        category: z.enum(CATALOG_CATEGORIES).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }).default({}),
    )
    .query(({ input }) => listAuctions(input)),

  catalogCategories: publicProcedure.query(() => CATALOG_CATEGORIES),
  buyerProfiles: publicProcedure.query(() => BUYER_PROFILES),

  detail: publicProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => auctionDetail(input.id)),

  create: protectedProcedure
    .input(
      z.object({
        audience: z.enum(["particulier", "professionnel"]),
        title: z.string().min(3).max(200),
        description: z.string().max(4000).optional(),
        annonceId: z.number().int().positive().optional(),
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        currency: z.string().max(8).optional(),
        startPrice: z.number().positive(),
        reservePrice: z.number().positive().optional(),
        increment: z.number().positive().optional(),
        startsAt: z.string(),
        endsAt: z.string(),
        allowedProfiles: z.array(z.string().max(32)).max(20).optional(),
        photos: z.array(z.string()).max(30).optional(),
        category: z.enum(CATALOG_CATEGORIES).optional(),
        lotDetails: lotDetailsSchema.optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      createAuction({
        ...input,
        sellerId: ctx.user.uid,
        startsAt: new Date(input.startsAt),
        endsAt: new Date(input.endsAt),
      }),
    ),

  publish: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => publishAuction(input.id, ctx.user.uid)),

  /** Le montant est validé côté serveur : le navigateur ne décide de rien. */
  bid: protectedProcedure
    .input(z.object({ auctionId: z.number().int().positive(), amount: z.number().positive() }))
    .mutation(({ ctx, input }) => placeBid({ ...input, bidderId: ctx.user.uid })),

  myAuctions: protectedProcedure.query(({ ctx }) => myAuctions(ctx.user.uid)),
  myBids: protectedProcedure.query(({ ctx }) => myBids(ctx.user.uid)),
  myWonAuctions: protectedProcedure.query(({ ctx }) => myWonAuctions(ctx.user.uid)),

  cancel: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), reason: z.string().min(3).max(300) }))
    .mutation(({ ctx, input }) => cancelAuction(input.id, ctx.user.uid, input.reason)),

  close: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => closeAuction(input.id)),

  closeExpired: adminProcedure.mutation(() => closeExpiredAuctions()),

  health: adminProcedure.query(() => auctionHealth()),
});

export { closeExpiredAuctions, auctionHealth } from "./service.js";
