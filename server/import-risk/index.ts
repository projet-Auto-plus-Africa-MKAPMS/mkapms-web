/**
 * MKA.P-MS IMPORT RISK ENGINE — routeur tRPC.
 *
 * Le diagnostic est **public** : un acheteur doit connaître le risque avant de
 * payer, pas après. Il ne divulgue rien de confidentiel — uniquement des règles
 * pays déjà confirmées et publiables, et la mention explicite de ce que la
 * plateforme ne sait pas encore mesurer.
 */
import { z } from "zod";
import { publicProcedure, router } from "../trpc.js";
import { NIVEAU_LABELS, diagnostiquer } from "./service.js";

export const IMPORT_RISK_META = {
  code: "risque_import",
  name: "Import Risk Engine",
  role:
    "Diagnostic d'importation et d'homologation avant achat : ce qui bloque, ce qui doit être vérifié, ce qui n'est pas mesuré.",
} as const;

export const importRiskRouter = router({
  niveaux: publicProcedure.query(() =>
    Object.entries(NIVEAU_LABELS).map(([code, label]) => ({ code, label })),
  ),

  diagnostic: publicProcedure
    .input(
      z.object({
        annonceId: z.number().int().positive(),
        paysDestination: z.string().max(4).nullable().optional(),
      }),
    )
    .query(async ({ input }) =>
      diagnostiquer({
        annonceId: input.annonceId,
        paysDestination: input.paysDestination ?? null,
      }),
    ),
});

export { controlCenterFeed, diagnostiquer } from "./service.js";
export type { Diagnostic, Niveau, Risque } from "./service.js";
