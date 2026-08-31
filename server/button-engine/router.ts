/**
 * MKA.P-MS Button Engine — Sub-router TRPC (connexion contrôlée).
 *
 *  - resoudre   : « ce bouton, qu'est-ce qu'il fait ? » (public)
 *  - signaler   : résultat réel du clic — journalisé par le Moteur de
 *                 Redirection, remis au Système Intelligent et aux
 *                 Intelligences en cas d'échec (public, best-effort)
 *  - inventaire : état des boutons de la plateforme (PDG)
 */
import { z } from "zod";
import { router, publicProcedure, pdgProcedure } from "../trpc.js";
import { resoudreAction, inventaire, signalerClic } from "./service.js";

export const buttonEngineRouter = router({
  resoudre: publicProcedure
    .input(z.object({ code: z.string().min(1).max(128) }))
    .query(async ({ ctx, input }) => {
      return resoudreAction(input.code, { userId: ctx.user?.uid, role: ctx.user?.role });
    }),

  signaler: publicProcedure
    .input(
      z.object({
        code: z.string().min(1).max(128),
        source: z.string().max(256).optional(),
        outcome: z.enum(["navigated", "not_found", "error"]),
        resolvedTo: z.string().max(512).optional(),
        error: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return signalerClic(input, { userId: ctx.user?.uid, role: ctx.user?.role });
    }),

  inventaire: pdgProcedure.query(() => inventaire()),
});
