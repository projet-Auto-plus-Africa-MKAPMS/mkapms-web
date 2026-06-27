import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { router, publicProcedure, directionProcedure } from "../trpc.js";
import { db } from "../db.js";
import { modules } from "../schema.js";

// Registre des modules — chaque univers activable/désactivable (fédération).
// Plan Partie 1 §2/§15 : "tout module doit pouvoir être désactivé sans casser les autres".
export const modulesRouter = router({
  // Liste publique des modules visibles + actifs (pour la navigation).
  list: publicProcedure.query(async () => {
    return db.select().from(modules).orderBy(asc(modules.ordre));
  }),

  // Vérifie l'état d'un module (utilisable par les autres univers avant action).
  status: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const [m] = await db.select().from(modules).where(eq(modules.code, input.code)).limit(1);
      return m ?? null;
    }),

  // Super Admin : activer / masquer / mettre en maintenance / désactiver un module.
  setStatus: directionProcedure
    .input(
      z.object({
        code: z.string(),
        status: z.enum(["active", "masque", "maintenance", "desactive"]),
      }),
    )
    .mutation(async ({ input }) => {
      const [m] = await db
        .update(modules)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(modules.code, input.code))
        .returning();
      return m;
    }),

  // Super Admin : mise à jour config / visibilité d'un module.
  update: directionProcedure
    .input(
      z.object({
        code: z.string(),
        nom: z.string().optional(),
        description: z.string().optional(),
        ordre: z.number().optional(),
        visiblePublic: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { code, ...rest } = input;
      const [m] = await db
        .update(modules)
        .set({ ...rest, updatedAt: new Date() })
        .where(eq(modules.code, code))
        .returning();
      return m;
    }),
});
