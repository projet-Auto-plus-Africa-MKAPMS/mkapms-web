/**
 * Estimation Hub — routeur tRPC.
 *
 * Public : un acheteur doit connaître le coût complet (véhicule, acheminement,
 * importation, entretien) avant de payer. Le moteur n'expose que des volets
 * portant leur source ; ce qui n'a pas de source est renvoyé « non mesuré ».
 */
import { z } from "zod";
import { publicProcedure, router } from "../trpc.js";
import { controlCenterFeed, estimationComplete } from "./service.js";

export const ESTIMATION_HUB_META = {
  code: "estimation",
  name: "Estimation Hub",
  role:
    "Estimation unifiée d'un véhicule : valeur de marché (VO), acheminement (Vehicle Delivery), importation (Import Risk) et budget pièces, chacun avec sa source et sa qualité.",
} as const;

export const estimationHubRouter = router({
  complete: publicProcedure
    .input(
      z.object({
        annonceId: z.number().int().positive().nullable().optional(),
        marque: z.string().max(96).nullable().optional(),
        modele: z.string().max(96).nullable().optional(),
        annee: z.number().int().min(1900).max(2100).nullable().optional(),
        kilometrage: z.number().int().min(0).max(2000000).nullable().optional(),
        etat: z
          .enum(["excellent", "tres_bon", "bon", "correct", "a_renover"])
          .nullable()
          .optional(),
        paysArrivee: z.string().max(4).nullable().optional(),
        villeArrivee: z.string().max(120).nullable().optional(),
      }),
    )
    .query(async ({ ctx, input }) =>
      estimationComplete({
        annonceId: input.annonceId ?? null,
        marque: input.marque ?? null,
        modele: input.modele ?? null,
        annee: input.annee ?? null,
        kilometrage: input.kilometrage ?? null,
        etat: input.etat ?? null,
        paysArrivee: input.paysArrivee ?? null,
        villeArrivee: input.villeArrivee ?? null,
        userId: ctx.user?.uid ?? null,
      }),
    ),

  etatMoteur: publicProcedure.query(() => controlCenterFeed()),
});

export { controlCenterFeed, estimationComplete } from "./service.js";
export type { EstimationComplete, QualiteVolet, Volet } from "./service.js";
