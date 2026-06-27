import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { vehicleReports, suggestions, signalements } from "../schema.js";

// Historique véhicule (rapports payants) + Suggestions/Signalements
// (Plan Partie 2 §9/§19 + Partie 3 §12/§20).
export const historiqueRouter = router({
  // Demande de rapport (recherche plaque ou VIN). Rapport payant.
  requestReport: publicProcedure
    .input(z.object({ searchType: z.enum(["plate", "vin"]), searchValue: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      const [r] = await db.insert(vehicleReports).values({
        userId: ctx.user?.uid ?? null,
        searchType: input.searchType,
        searchValue: input.searchValue,
        status: "en_attente",
        paid: false,
      }).returning();
      return r;
    }),

  myReports: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(vehicleReports).where(eq(vehicleReports.userId, ctx.user.uid)).orderBy(desc(vehicleReports.createdAt));
  }),

  report: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [r] = await db.select().from(vehicleReports).where(eq(vehicleReports.id, input.id)).limit(1);
    return r ?? null;
  }),

  // Suggestions privées (visibles admin uniquement).
  suggest: publicProcedure
    .input(z.object({ type: z.enum(["idee", "amelioration", "difficulte"]).default("idee"), contenu: z.string().min(2) }))
    .mutation(async ({ ctx, input }) => {
      const [s] = await db.insert(suggestions).values({ userId: ctx.user?.uid ?? null, type: input.type, contenu: input.contenu }).returning();
      return { id: s.id };
    }),

  // Signalements -> ticket automatique côté admin.
  report_signal: publicProcedure
    .input(
      z.object({
        type: z.enum(["bug", "fraude", "annonce_suspecte", "paiement", "compte", "comportement"]),
        description: z.string().optional(),
        refType: z.string().optional(),
        refId: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [s] = await db.insert(signalements).values({
        userId: ctx.user?.uid ?? null,
        type: input.type,
        description: input.description,
        refType: input.refType,
        refId: input.refId,
        status: "ouvert",
      }).returning();
      return { id: s.id };
    }),

  // Back-office
  listSuggestions: adminProcedure.query(async () => {
    return db.select().from(suggestions).orderBy(desc(suggestions.createdAt)).limit(200);
  }),
  listSignalements: adminProcedure.query(async () => {
    return db.select().from(signalements).orderBy(desc(signalements.createdAt)).limit(200);
  }),
});
