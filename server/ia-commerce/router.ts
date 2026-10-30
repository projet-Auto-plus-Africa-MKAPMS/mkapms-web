import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, pdgProcedure } from "../trpc.js";
import { db } from "../db.js";
import { subscriptions } from "../schema.js";
import { resolveProduct, upsertProduct } from "../payment-engine/products.js";
import { createPaymentCheckout } from "../payment-engine/checkout.js";
import {
  listIaCatalog,
  seedIaCatalog,
  setIaProductActive,
  planMargin,
  estimateUnitsCost,
  walletBalance,
  walletLedger,
  creditWallet,
} from "./service.js";
import type { IaPlanMeta } from "./catalog.js";

const upsertInput = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1).max(160),
  paymentCase: z.string().min(1).max(48),
  price: z.number().min(0),
  currency: z.string().max(8).optional(),
  vatRate: z.number().min(0).max(100).optional(),
  countryCode: z.string().max(4).optional(),
  paymentType: z.enum(["unique", "recurring"]).optional(),
  periodicity: z.enum(["monthly", "quarterly", "yearly"]).nullable().optional(),
  validityDays: z.number().int().min(0).optional(),
  refundPolicy: z.string().max(500).nullable().optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const iaCommerceRouter = router({
  // ── Pages commerciales publiques (offre découverte, abonnements, crédits) ──
  catalog: publicProcedure.query(() => listIaCatalog(true)),

  // ── Espace de pilotage PDG — modifie les prix sans toucher au code ──
  adminCatalog: pdgProcedure.query(() => listIaCatalog(false)),

  adminSeed: pdgProcedure.mutation(() => seedIaCatalog()),

  adminUpsert: pdgProcedure.input(upsertInput).mutation(({ input }) =>
    upsertProduct({ ...input, univers: "ia", beneficiary: "mkapms" }),
  ),

  adminSetActive: pdgProcedure
    .input(z.object({ code: z.string(), active: z.boolean() }))
    .mutation(({ input }) => setIaProductActive(input.code, input.active)),

  // Calculs de coûts/rentabilité en direct (toujours recalculés depuis le tarif réel mesuré,
  // jamais un chiffre figé) — section « preuves réelles » de la mission tarifaire.
  adminMargins: pdgProcedure.query(async () => {
    const all = await listIaCatalog(false);
    return all.map((p) => ({ code: p.code, name: p.name, active: p.active, ...planMargin(p) }));
  }),

  estimateCost: pdgProcedure.input(z.object({ unites: z.number().min(0) })).query(({ input }) => estimateUnitsCost(input.unites)),

  // ── Portefeuille de crédits (utilisateur connecté) ──
  walletMine: protectedProcedure.query(async ({ ctx }) => ({
    balance: await walletBalance(ctx.user.uid),
    ledger: await walletLedger(ctx.user.uid, 50),
  })),

  // Essai gratuit — une seule fois par compte, jamais de paiement.
  startFreeTrial: protectedProcedure.mutation(async ({ ctx }) => {
    const [deja] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, ctx.user.uid), eq(subscriptions.category, "ia_decouverte")))
      .limit(1);
    if (deja) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Essai gratuit déjà utilisé sur ce compte." });
    }
    const produit = await resolveProduct("ia_essai_gratuit_3j").catch(() => null);
    if (!produit || !produit.active) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Essai gratuit non activé par la Direction pour le moment." });
    }
    const meta = produit.metadata as unknown as IaPlanMeta | null;
    const credits = meta?.creditsInclus ?? 0;
    const finPeriode = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    await db.insert(subscriptions).values({
      userId: ctx.user.uid,
      planCode: produit.code,
      category: "ia_decouverte",
      status: "active",
      currentPeriodEnd: finPeriode,
      amount: "0",
      currency: "EUR",
      quotaUnitesIa: credits,
    });
    if (credits > 0) {
      await creditWallet(ctx.user.uid, credits, { type: "bonus_essai", note: "Essai gratuit 3 jours" });
    }
    return { ok: true, finPeriode, creditsInclus: credits };
  }),

  // Mes abonnements/achats IA — déjà visibles sur l'écran existant « Mes abonnements »
  // (abonnementsRouter.mine, sans filtre de catégorie) ; exposé ici en plus pour les pages IA dédiées.
  mine: protectedProcedure.query(({ ctx }) =>
    db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, ctx.user.uid), eq(subscriptions.category, "ia_abonnement")))
      .orderBy(desc(subscriptions.createdAt)),
  ),

  // Découverte (5-7€, 3 jours) et périodes d'abonnement — paiement réel (ou simulation si
  // Stripe non configuré), jamais de prélèvement récurrent automatique à ce stade : chaque
  // période se (re)souscrit explicitement, rien n'est tacitement reconduit.
  checkoutAbonnement: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const produit = await resolveProduct(input.code).catch(() => null);
      if (!produit || produit.univers !== "ia") throw new TRPCError({ code: "BAD_REQUEST", message: "Offre IA inconnue." });
      if (!produit.active) throw new TRPCError({ code: "FORBIDDEN", message: "Cette offre n'est pas encore activée par la Direction." });
      const meta = produit.metadata as unknown as IaPlanMeta | null;
      const kind = meta?.kind === "decouverte" ? "ia_decouverte" : meta?.kind === "credits" ? "ia_credits" : "ia_abonnement";
      return createPaymentCheckout({
        userId: ctx.user.uid,
        kind,
        productCode: produit.code,
        metadata: { plan_code: produit.code, credits_inclus: meta?.creditsInclus ?? 0, ia_tier: meta?.tier ?? "" },
        successPath: "/ia/abonnements?success=1",
        cancelPath: "/ia/abonnements?canceled=1",
      });
    }),
});
