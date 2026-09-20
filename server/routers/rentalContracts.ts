/**
 * Contrat de location actif (tâche #56, item 2).
 *
 * rentalApplications (candidature) prouve qu'un acompte a été payé, jamais
 * qu'un véhicule est attribué sur une période — la pièce manquante que
 * RenouvellementFlotte.tsx et RemplacementVehicule.tsx présupposaient sans
 * qu'elle existe. Un contrat est créé par un agent une fois la candidature
 * payée, avec un véhicule et des dates réelles fixés explicitement à ce
 * moment-là (jamais devinés ou calculés côté client).
 */
import { z } from "zod";
import { desc, eq, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { rentalContracts, rentalApplications, annonces } from "../schema.js";

export const rentalContractsRouter = router({
  // ── Côté back-office (agent/Direction) ──────────────────────────────
  createContract: adminProcedure
    .input(
      z.object({
        applicationId: z.number(),
        vehicleId: z.number(),
        startDate: z.string(),
        endDate: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [application] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, input.applicationId)).limit(1);
      if (!application) throw new TRPCError({ code: "NOT_FOUND", message: "Candidature introuvable." });
      if (application.status !== "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Un contrat ne peut être créé que pour une candidature dont l'acompte a été payé." });
      }
      const [vehicule] = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.id, input.vehicleId)).limit(1);
      if (!vehicule) throw new TRPCError({ code: "BAD_REQUEST", message: "Véhicule introuvable." });

      const [contrat] = await db
        .insert(rentalContracts)
        .values({
          applicationId: input.applicationId,
          vehicleId: input.vehicleId,
          userId: application.userId,
          startDate: new Date(input.startDate),
          endDate: input.endDate ? new Date(input.endDate) : null,
          status: "actif",
        })
        .returning();

      await db.update(rentalApplications).set({ status: "completed", updatedAt: new Date() }).where(eq(rentalApplications.id, input.applicationId));

      return contrat;
    }),

  list: adminProcedure.query(async () => {
    return db.select().from(rentalContracts).orderBy(desc(rentalContracts.createdAt));
  }),

  // ── Côté locataire ───────────────────────────────────────────────────
  myContracts: protectedProcedure.query(async ({ ctx }) => {
    const contrats = await db
      .select()
      .from(rentalContracts)
      .where(eq(rentalContracts.userId, ctx.user.uid))
      .orderBy(rentalContracts.endDate);
    const ids = contrats.map((c) => c.vehicleId).filter((id): id is number => id != null);
    const vehiculeMap = new Map<number, { titre: string | null; marque: string; modele: string }>();
    if (ids.length) {
      const rows = await db
        .select({ id: annonces.id, titre: annonces.titre, marque: annonces.marque, modele: annonces.modele })
        .from(annonces)
        .where(inArray(annonces.id, ids));
      for (const r of rows) vehiculeMap.set(r.id, { titre: r.titre, marque: r.marque, modele: r.modele });
    }
    return contrats.map((c) => ({
      ...c,
      vehicule: c.vehicleId ? vehiculeMap.get(c.vehicleId) ?? null : null,
    }));
  }),
});
