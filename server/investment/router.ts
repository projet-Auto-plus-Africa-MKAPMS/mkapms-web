/**
 * MKA.P-MS Investissement — routeur tRPC.
 *
 * Nom "investment" (jamais "investor"/"investisseur" seuls) pour ne jamais
 * entrer en collision avec investorRouter (server/routers/operations.ts),
 * déjà existant et sans rapport (tableau de bord croissance/valorisation
 * pour investisseurs en capital).
 *
 * Isolation stricte, vérifiée côté serveur : un investisseur ne voit jamais
 * ses propres données via un investorId fourni par le client — toujours
 * dérivé de ctx.user.uid.
 */
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { adminProcedure, protectedProcedure, router } from "../trpc.js";
import { getCountry } from "../country-os/index.js";
import { logAction, clientMeta } from "../audit.js";
import {
  INVESTABLE_UNIVERSES,
  investments,
  investmentStatusHistory,
  investorLedger,
  investorPayouts,
  investors,
} from "./schema.js";
import { activer, expirerSiEcheance, transitionner } from "./contrat.js";
import { verifierConflit } from "./ownership.js";

async function investisseurDeUtilisateur(userId: number) {
  const [inv] = await db.select().from(investors).where(eq(investors.userId, userId)).limit(1);
  return inv ?? null;
}

export const investmentRouter = router({
  /** Onboarding en libre-service : une identité MKA.P-MS existante devient aussi investisseur, sans perdre son rôle de base. */
  devenirInvestisseur: protectedProcedure
    .input(z.object({ investorType: z.enum(["PASSIVE_INVESTOR", "OPERATOR_INVESTOR", "STRATEGIC_PARTNER"]).default("PASSIVE_INVESTOR") }))
    .mutation(async ({ ctx, input }) => {
      const existant = await investisseurDeUtilisateur(ctx.user.uid);
      if (existant) return existant;
      const [inv] = await db.insert(investors).values({ userId: ctx.user.uid, investorType: input.investorType }).returning();
      await logAction(ctx.user.uid, "investment.devenir_investisseur", "investor", inv.id, { investorType: input.investorType }, clientMeta(ctx.req));
      return inv;
    }),

  /** Tableau de bord : uniquement les investissements de l'appelant, jamais un investorId fourni par le client. */
  mesInvestissements: protectedProcedure.query(async ({ ctx }) => {
    const inv = await investisseurDeUtilisateur(ctx.user.uid);
    if (!inv) return [];
    return db.select().from(investments).where(eq(investments.investorId, inv.id)).orderBy(investments.createdAt);
  }),

  /** Ledger : idem, filtré côté serveur sur l'identité de l'appelant, jamais sur un paramètre client. */
  monLedger: protectedProcedure.query(async ({ ctx }) => {
    const inv = await investisseurDeUtilisateur(ctx.user.uid);
    if (!inv) return [];
    return db.select().from(investorLedger).where(eq(investorLedger.investorId, inv.id)).orderBy(investorLedger.createdAt);
  }),

  mesVersements: protectedProcedure.query(async ({ ctx }) => {
    const inv = await investisseurDeUtilisateur(ctx.user.uid);
    if (!inv) return [];
    return db.select().from(investorPayouts).where(eq(investorPayouts.investorId, inv.id)).orderBy(investorPayouts.periodeDebut);
  }),

  universUnivestissables: adminProcedure.query(() => INVESTABLE_UNIVERSES),

  /** Vérifie l'exclusivité avant de créer/approuver un contrat — jamais deviné. */
  verifierConflit: adminProcedure
    .input(z.object({ countryCode: z.string().length(2), universeId: z.string(), startAt: z.coerce.date(), endAt: z.coerce.date().nullable(), excludeInvestmentId: z.number().int().positive().optional() }))
    .query(({ input }) => verifierConflit(input)),

  /** Création du brouillon : staff MKA.P-MS uniquement (workflow de revue/approbation, jamais un auto-service investisseur). */
  creerBrouillon: adminProcedure
    .input(
      z.object({
        investorId: z.number().int().positive(),
        organizationId: z.number().int().positive().optional(),
        universeId: z.enum(INVESTABLE_UNIVERSES),
        countryCode: z.string().length(2),
        startAt: z.coerce.date().optional(),
        endAt: z.coerce.date().optional(),
        exclusive: z.boolean().default(true),
        pricingModel: z.enum(["fixed_price", "revenue_share", "hybrid"]).default("fixed_price"),
        fixedPrice: z.number().nonnegative().optional(),
        revenueShare: z.number().min(0).max(1).optional(),
        currency: z.string().length(3).default("EUR"),
        payoutSchedule: z.enum(["hebdomadaire", "mensuel", "autre"]).default("mensuel"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const pays = await getCountry(input.countryCode.toUpperCase());
      if (!pays || !pays.active) {
        throw new Error(`Pays ${input.countryCode.toUpperCase()} non ouvert au Country Engine : aucun investissement ne peut y être créé.`);
      }
      const [inv] = await db
        .insert(investments)
        .values({
          investorId: input.investorId,
          organizationId: input.organizationId ?? null,
          universeId: input.universeId,
          countryCode: input.countryCode.toUpperCase(),
          startAt: input.startAt ?? null,
          endAt: input.endAt ?? null,
          exclusive: input.exclusive,
          pricingModel: input.pricingModel,
          fixedPrice: input.fixedPrice != null ? String(input.fixedPrice) : null,
          revenueShare: input.revenueShare != null ? String(input.revenueShare) : null,
          currency: input.currency.toUpperCase(),
          payoutSchedule: input.payoutSchedule,
          createdBy: ctx.user.uid,
        })
        .returning();
      await logAction(ctx.user.uid, "investment.creer_brouillon", "investment", inv.id, { universeId: input.universeId, countryCode: input.countryCode }, clientMeta(ctx.req));
      return inv;
    }),

  transitionner: adminProcedure
    .input(z.object({ investmentId: z.number().int().positive(), vers: z.enum(["UNDER_REVIEW", "APPROVED", "AWAITING_SIGNATURE", "AWAITING_PAYMENT", "CANCELLED", "SUSPENDED", "TERMINATED"]), motif: z.string().min(1).max(255) }))
    .mutation(async ({ ctx, input }) => {
      const res = await transitionner(input.investmentId, input.vers, input.motif, ctx.user.uid);
      await logAction(ctx.user.uid, "investment.transitionner", "investment", input.investmentId, { vers: input.vers, ok: res.ok }, clientMeta(ctx.req));
      return res;
    }),

  /** Seule voie vers ACTIVE — exige un paiement réellement confirmé côté serveur. */
  activer: adminProcedure
    .input(z.object({ investmentId: z.number().int().positive(), paymentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const res = await activer(input.investmentId, input.paymentId, ctx.user.uid);
      await logAction(ctx.user.uid, "investment.activer", "investment", input.investmentId, { ok: res.ok, motif: res.motif }, clientMeta(ctx.req));
      return res;
    }),

  expirerSiEcheance: adminProcedure
    .input(z.object({ investmentId: z.number().int().positive() }))
    .mutation(({ input }) => expirerSiEcheance(input.investmentId)),

  historiqueStatuts: adminProcedure
    .input(z.object({ investmentId: z.number().int().positive() }))
    .query(({ input }) =>
      db.select().from(investmentStatusHistory).where(eq(investmentStatusHistory.investmentId, input.investmentId)).orderBy(investmentStatusHistory.changedAt),
    ),
});
