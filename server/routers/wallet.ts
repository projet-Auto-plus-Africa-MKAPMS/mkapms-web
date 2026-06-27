import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { wallets, walletTransactions, payouts } from "../schema.js";

// Wallet professionnel (Plan Partie 2 §12 / Partie 3 §15).
async function ensureWallet(userId: number) {
  const [w] = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (w) return w;
  const [created] = await db.insert(wallets).values({ userId }).returning();
  return created;
}

export const walletRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    return ensureWallet(ctx.user.uid);
  }),

  transactions: protectedProcedure.query(async ({ ctx }) => {
    const w = await ensureWallet(ctx.user.uid);
    return db.select().from(walletTransactions).where(eq(walletTransactions.walletId, w.id)).orderBy(desc(walletTransactions.createdAt));
  }),

  payouts: protectedProcedure.query(async ({ ctx }) => {
    const w = await ensureWallet(ctx.user.uid);
    return db.select().from(payouts).where(eq(payouts.walletId, w.id)).orderBy(desc(payouts.createdAt));
  }),

  requestPayout: protectedProcedure
    .input(z.object({ montant: z.number().positive() }))
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
      }).returning();
      await db.insert(walletTransactions).values({
        walletId: w.id,
        type: "retrait",
        montant: String(-input.montant),
        currency: w.currency,
        description: "Demande de retrait",
      });
      return p;
    }),

  setPayoutFrequency: protectedProcedure
    .input(z.object({ frequency: z.enum(["manuel", "hebdomadaire", "mensuel"]) }))
    .mutation(async ({ ctx, input }) => {
      const w = await ensureWallet(ctx.user.uid);
      const [updated] = await db.update(wallets).set({ payoutFrequency: input.frequency, updatedAt: new Date() }).where(eq(wallets.id, w.id)).returning();
      return updated;
    }),
});
