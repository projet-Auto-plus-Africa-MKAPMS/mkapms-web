import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, proProcedure } from "../trpc.js";
import { db } from "../db.js";
import { transportCompanies, drivers, transportVehicles, transportBookings } from "../schema.js";

// Univers VTC / TAXI (Plan Partie 2 §3 / Partie 3 §7).
export const transportRouter = router({
  companies: publicProcedure
    .input(z.object({ type: z.enum(["vtc", "taxi", "mixte"]).optional(), country: z.string().optional(), limit: z.number().min(1).max(100).default(30) }).default({}))
    .query(async ({ input }) => {
      const conds = [eq(transportCompanies.active, true)];
      if (input.type) conds.push(eq(transportCompanies.type, input.type));
      if (input.country) conds.push(eq(transportCompanies.countryCode, input.country));
      return db.select().from(transportCompanies).where(and(...conds)).orderBy(desc(transportCompanies.createdAt)).limit(input.limit);
    }),

  company: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [c] = await db.select().from(transportCompanies).where(eq(transportCompanies.id, input.id)).limit(1);
    if (!c) return null;
    const vehicles = await db.select().from(transportVehicles).where(eq(transportVehicles.companyId, c.id));
    return { ...c, vehicles };
  }),

  createCompany: proProcedure
    .input(
      z.object({
        nom: z.string().min(2),
        type: z.enum(["vtc", "taxi", "mixte"]).default("vtc"),
        countryCode: z.string().optional(),
        kbis: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [c] = await db.insert(transportCompanies).values({ ...input, ownerId: ctx.user.uid }).returning();
      return c;
    }),

  addDriver: proProcedure
    .input(z.object({ companyId: z.number(), nom: z.string().min(2), type: z.enum(["vtc", "taxi", "mixte"]).default("vtc"), telephone: z.string().optional() }))
    .mutation(async ({ input }) => {
      const [d] = await db.insert(drivers).values(input).returning();
      return d;
    }),

  addVehicle: proProcedure
    .input(z.object({ companyId: z.number(), categorie: z.string().optional(), marque: z.string().optional(), modele: z.string().optional(), immatriculation: z.string().optional() }))
    .mutation(async ({ input }) => {
      const [v] = await db.insert(transportVehicles).values(input).returning();
      return v;
    }),

  book: protectedProcedure
    .input(
      z.object({
        companyId: z.number(),
        vehicleId: z.number().optional(),
        depart: z.string().optional(),
        arrivee: z.string().optional(),
        dateService: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [b] = await db.insert(transportBookings).values({
        companyId: input.companyId,
        clientId: ctx.user.uid,
        vehicleId: input.vehicleId,
        depart: input.depart,
        arrivee: input.arrivee,
        dateService: input.dateService,
        status: "demande",
      }).returning();
      return b;
    }),

  myBookings: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(transportBookings).where(eq(transportBookings.clientId, ctx.user.uid)).orderBy(desc(transportBookings.createdAt));
  }),
});
