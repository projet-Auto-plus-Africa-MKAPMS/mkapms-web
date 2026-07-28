import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { wallets, walletTransactions, payouts, bankAccounts } from "../schema.js";

// ─── Helper : créer ou récupérer le wallet de l'utilisateur ──────────────────
async function ensureWallet(userId: number) {
  const [w] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (w) return w;
  const [created] = await db.insert(wallets).values({ userId }).returning();
  return created;
}

export const walletRouter = router({

  // Mon wallet (solde + infos)
  me: protectedProcedure.query(async ({ ctx }) => {
    return ensureWallet(ctx.user.uid);
  }),

  // Historique des transactions
  transactions: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
    .query(async ({ ctx, input }) => {
      const w = await ensureWallet(ctx.user.uid);
      return db
        .select()
        .from(walletTransactions)
        .where(eq(walletTransactions.walletId, w.id))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(input?.limit ?? 50);
    }),

  // Historique des virements
  payouts: protectedProcedure.query(async ({ ctx }) => {
    const w = await ensureWallet(ctx.user.uid);
    return db
      .select()
      .from(payouts)
      .where(eq(payouts.walletId, w.id))
      .orderBy(desc(payouts.createdAt));
  }),

  // Demande de virement manuel
  requestPayout: protectedProcedure
    .input(z.object({
      montant: z.number().positive(),
      bankAccountId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const w = await ensureWallet(ctx.user.uid);
      const dispo = Number(w.soldeDisponible);
      if (input.montant > dispo) {
        throw new Error("Solde disponible insuffisant");
      }
      const [p] = await db.insert(payouts).values({
        walletId: w.id,
        userId: ctx.user.uid,
        montant: String(input.montant),
        currency: w.currency,
        status: "demande",
        automatique: false,
        bankAccountId: input.bankAccountId ?? null,
        frais: "0",
      }).returning();
      await db.insert(walletTransactions).values({
        walletId: w.id,
        type: "retrait",
        montant: String(-input.montant),
        currency: w.currency,
        description: `Demande de virement — ${input.montant.toFixed(2)} ${w.currency}`,
        reference: `PAYOUT-${p.id}`,
      });
      await db.update(wallets)
        .set({ soldeDisponible: String(dispo - input.montant), updatedAt: new Date() })
        .where(eq(wallets.id, w.id));
      return p;
    }),

  // Configurer la fréquence de virement automatique
  setPayoutFrequency: protectedProcedure
    .input(z.object({ frequency: z.enum(["manuel", "hebdomadaire", "mensuel"]) }))
    .mutation(async ({ ctx, input }) => {
      const w = await ensureWallet(ctx.user.uid);
      let nextDate: Date | null = null;
      if (input.frequency === "hebdomadaire") {
        nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + (7 - nextDate.getDay()));
      } else if (input.frequency === "mensuel") {
        nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + 1, 1);
      }
      const [updated] = await db
        .update(wallets)
        .set({ payoutFrequency: input.frequency, nextPayoutDate: nextDate, updatedAt: new Date() })
        .where(eq(wallets.id, w.id))
        .returning();
      return updated;
    }),

  // Comptes bancaires — liste
  bankAccounts: protectedProcedure.query(async ({ ctx }) => {
    const w = await ensureWallet(ctx.user.uid);
    return db.select().from(bankAccounts).where(eq(bankAccounts.walletId, w.id)).orderBy(desc(bankAccounts.createdAt));
  }),

  // Ajouter un compte bancaire
  addBankAccount: protectedProcedure
    .input(z.object({
      titulaire: z.string().min(2).max(128),
      iban: z.string().min(15).max(34),
      bic: z.string().max(11).optional(),
      banque: z.string().max(128).optional(),
      isDefault: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const w = await ensureWallet(ctx.user.uid);
      if (input.isDefault) {
        await db.update(bankAccounts).set({ isDefault: false }).where(eq(bankAccounts.walletId, w.id));
      }
      const [account] = await db.insert(bankAccounts).values({
        userId: ctx.user.uid,
        walletId: w.id,
        titulaire: input.titulaire,
        iban: input.iban.replace(/\s/g, "").toUpperCase(),
        bic: input.bic?.toUpperCase(),
        banque: input.banque,
        isDefault: input.isDefault,
      }).returning();
      return account;
    }),

  // Supprimer un compte bancaire
  deleteBankAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const w = await ensureWallet(ctx.user.uid);
      await db.delete(bankAccounts).where(and(eq(bankAccounts.id, input.id), eq(bankAccounts.walletId, w.id)));
      return { success: true };
    }),

  // Définir le compte bancaire par défaut
  setDefaultBankAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const w = await ensureWallet(ctx.user.uid);
      await db.update(bankAccounts).set({ isDefault: false }).where(eq(bankAccounts.walletId, w.id));
      const [updated] = await db
        .update(bankAccounts)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(and(eq(bankAccounts.id, input.id), eq(bankAccounts.walletId, w.id)))
        .returning();
      return updated;
    }),

  // ADMIN — tous les wallets
  adminAllWallets: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const limit = input?.limit ?? 50;
      const offset = input?.offset ?? 0;
      const rows = await db.select().from(wallets).orderBy(desc(wallets.updatedAt)).limit(limit).offset(offset);
      const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(wallets);
      return { wallets: rows, total: count };
    }),

  // ADMIN — tous les virements
  adminAllPayouts: adminProcedure
    .input(z.object({
      status: z.enum(["demande", "en_cours", "paye", "echoue", "annule"]).optional(),
      limit: z.number().default(50),
    }).optional())
    .query(async ({ input }) => {
      const conditions = input?.status ? eq(payouts.status, input.status) : undefined;
      return db.select().from(payouts).where(conditions).orderBy(desc(payouts.createdAt)).limit(input?.limit ?? 50);
    }),

  // ADMIN — mettre à jour le statut d'un virement
  adminUpdatePayoutStatus: adminProcedure
    .input(z.object({
      payoutId: z.number(),
      status: z.enum(["en_cours", "paye", "echoue", "annule"]),
      stripePayoutId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const [updated] = await db
        .update(payouts)
        .set({
          status: input.status,
          stripePayoutId: input.stripePayoutId,
          processedAt: input.status === "paye" ? new Date() : undefined,
          updatedAt: new Date(),
        })
        .where(eq(payouts.id, input.payoutId))
        .returning();
      if (input.status === "paye") {
        const [w] = await db.select().from(wallets).where(eq(wallets.id, updated.walletId)).limit(1);
        if (w) {
          await db.update(wallets).set({
            totalVire: String(Number(w.totalVire) + Number(updated.montant)),
            updatedAt: new Date(),
          }).where(eq(wallets.id, updated.walletId));
        }
      }
      return updated;
    }),

  // ADMIN — créditer manuellement un wallet
  adminCreditWallet: adminProcedure
    .input(z.object({
      userId: z.number(),
      montant: z.number().positive(),
      description: z.string().optional(),
      sourceType: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const w = await ensureWallet(input.userId);
      await db.insert(walletTransactions).values({
        walletId: w.id,
        type: "credit",
        montant: String(input.montant),
        currency: w.currency,
        description: input.description ?? "Crédit manuel admin",
        sourceType: input.sourceType,
      });
      const [updated] = await db
        .update(wallets)
        .set({
          soldeDisponible: String(Number(w.soldeDisponible) + input.montant),
          totalEncaisse: String(Number(w.totalEncaisse) + input.montant),
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, w.id))
        .returning();
      return updated;
    }),
});
