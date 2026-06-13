import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { installmentRequests, installmentContracts, installmentPayments } from "../schema.js";

// Paiement fractionné (Plan Partie 2 §13). Masqué par défaut, validation admin.
// Particulier: 10 fois max — Pro: 5 fois max.
export const installmentsRouter = router({
  request: protectedProcedure
    .input(
      z.object({
        refType: z.string().optional(),
        refId: z.number().optional(),
        montantTotal: z.number().positive(),
        apport: z.number().min(0).default(0),
        nbEcheances: z.number().min(2),
        isPro: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const max = input.isPro ? 5 : 10;
      if (input.nbEcheances > max) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Maximum ${max} échéances pour ce profil.` });
      }
      const [r] = await db.insert(installmentRequests).values({
        clientId: ctx.user.uid,
        refType: input.refType,
        refId: input.refId,
        montantTotal: String(input.montantTotal),
        apport: String(input.apport),
        nbEcheances: input.nbEcheances,
        isPro: input.isPro,
        status: "demande",
      }).returning();
      return r;
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(installmentRequests).where(eq(installmentRequests.clientId, ctx.user.uid)).orderBy(desc(installmentRequests.createdAt));
  }),

  pending: adminProcedure.query(async () => {
    return db.select().from(installmentRequests).orderBy(desc(installmentRequests.createdAt)).limit(200);
  }),

  // Admin valide et génère l'échéancier.
  validate: adminProcedure
    .input(z.object({ requestId: z.number(), approve: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [req] = await db.select().from(installmentRequests).where(eq(installmentRequests.id, input.requestId)).limit(1);
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      if (!input.approve) {
        const [r] = await db.update(installmentRequests).set({ status: "rejete", validatedBy: ctx.user.uid, updatedAt: new Date() }).where(eq(installmentRequests.id, input.requestId)).returning();
        return r;
      }
      const [contract] = await db.insert(installmentContracts).values({ requestId: req.id, status: "contrat" }).returning();
      const total = Number(req.montantTotal) - Number(req.apport);
      const per = Math.round((total / req.nbEcheances) * 100) / 100;
      const now = new Date();
      for (let i = 1; i <= req.nbEcheances; i++) {
        const due = new Date(now);
        due.setMonth(due.getMonth() + i);
        await db.insert(installmentPayments).values({
          contractId: contract.id,
          numero: i,
          montant: String(per),
          dueDate: due.toISOString().slice(0, 10),
        });
      }
      const [r] = await db.update(installmentRequests).set({ status: "valide_admin", validatedBy: ctx.user.uid, updatedAt: new Date() }).where(eq(installmentRequests.id, input.requestId)).returning();
      return r;
    }),

  schedule: protectedProcedure.input(z.object({ contractId: z.number() })).query(async ({ input }) => {
    return db.select().from(installmentPayments).where(eq(installmentPayments.contractId, input.contractId)).orderBy(installmentPayments.numero);
  }),
});
