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
  placeBid,
  publishAuction,
} from "./service.js";

export const AUCTION_ENGINE_META = {
  code: "auction_engine",
  name: "Auction Engine",
  role: "Enchères particuliers et professionnels : lots, offres, adjudication, historique, notifications.",
} as const;

export const auctionEngineRouter = router({
  list: publicProcedure
    .input(
      z.object({
        audience: z.enum(["particulier", "professionnel"]).optional(),
        countryCode: z.string().min(2).max(4).optional(),
        status: z.string().max(16).optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }).default({}),
    )
    .query(({ input }) => listAuctions(input)),

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
