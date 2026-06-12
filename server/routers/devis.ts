import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { devisGarageRequests } from "../schema.js";

// Module Devis Garage (§6) — parcours en 7 étapes côté front, persisté ici.
export const devisRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        contactNom: z.string().min(1),
        contactEmail: z.string().email(),
        contactTelephone: z.string().optional(),
        vehiculeMarque: z.string().optional(),
        vehiculeModele: z.string().optional(),
        vehiculeAnnee: z.number().optional(),
        immatriculation: z.string().optional(),
        typeIntervention: z.string().min(1),
        description: z.string().optional(),
        ville: z.string().optional(),
        codePostal: z.string().optional(),
        pays: z.string().default("FR"),
        photos: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { photos, ...rest } = input;
      const [created] = await db
        .insert(devisGarageRequests)
        .values({
          userId: ctx.user.uid,
          ...rest,
          photos: photos.length ? photos.join("\n") : null,
          status: "nouveau",
        })
        .returning();
      return created;
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(devisGarageRequests)
      .where(eq(devisGarageRequests.userId, ctx.user.uid))
      .orderBy(desc(devisGarageRequests.createdAt));
  }),
});
