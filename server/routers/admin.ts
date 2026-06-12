import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { router, adminProcedure, directionProcedure } from "../trpc.js";
import { db } from "../db.js";
import {
  users,
  annonces,
  garagesPublics,
  subscriptions,
  payments,
  supportTickets,
  devisGarageRequests,
} from "../schema.js";

// Back-office (§10)
export const adminRouter = router({
  stats: adminProcedure.query(async () => {
    const [u] = await db.select({ c: sql<number>`count(*)::int` }).from(users);
    const [a] = await db.select({ c: sql<number>`count(*)::int` }).from(annonces);
    const [g] = await db.select({ c: sql<number>`count(*)::int` }).from(garagesPublics);
    const [s] = await db.select({ c: sql<number>`count(*)::int` }).from(subscriptions);
    const [p] = await db.select({ c: sql<number>`count(*)::int` }).from(payments);
    const [d] = await db.select({ c: sql<number>`count(*)::int` }).from(devisGarageRequests);
    return {
      users: u.c, annonces: a.c, garages: g.c,
      subscriptions: s.c, payments: p.c, devis: d.c,
    };
  }),

  usersList: adminProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return db
        .select({
          id: users.id, email: users.email, name: users.name,
          role: users.role, accountType: users.accountType,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  // Modération des annonces (§10.3)
  annoncesPending: adminProcedure.query(async () => {
    return db
      .select()
      .from(annonces)
      .where(eq(annonces.status, "en_validation"))
      .orderBy(desc(annonces.createdAt));
  }),

  moderateAnnonce: adminProcedure
    .input(z.object({ id: z.number(), action: z.enum(["publiee", "refusee", "archivee"]) }))
    .mutation(async ({ input }) => {
      await db
        .update(annonces)
        .set({ status: input.action, updatedAt: new Date() })
        .where(eq(annonces.id, input.id));
      return { ok: true };
    }),

  // Validation des garages (§7.3 / §10.3)
  garagesPending: adminProcedure.query(async () => {
    return db
      .select()
      .from(garagesPublics)
      .where(eq(garagesPublics.status, "en_attente"))
      .orderBy(desc(garagesPublics.createdAt));
  }),

  validateGarage: adminProcedure
    .input(z.object({ id: z.number(), action: z.enum(["valide", "refuse", "suspendu"]) }))
    .mutation(async ({ input }) => {
      await db
        .update(garagesPublics)
        .set({ status: input.action, updatedAt: new Date() })
        .where(eq(garagesPublics.id, input.id));
      return { ok: true };
    }),

  ticketsList: adminProcedure.query(async () => {
    return db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  }),

  // Réservé direction : changement de rôle (§10.1)
  setUserRole: directionProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "pro", "garage", "employee", "society", "admin", "super_admin"]),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .update(users)
        .set({ role: input.role, updatedAt: new Date() })
        .where(eq(users.id, input.userId));
      return { ok: true };
    }),
});
