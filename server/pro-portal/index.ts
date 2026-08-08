/**
 * MKA.P-MS Pro Portal Engine — portail professionnel mondial (.pro).
 *
 * Porte d'entrée des professionnels, distincte du site grand public :
 * métier → pays → besoins → composition de l'offre → panier → compte →
 * paiement → activation → tableau de bord.
 *
 * Moteur isolé et piloté par la donnée : un nouveau métier ou un nouveau
 * service s'ajoute en base, sans reconstruire le portail.
 */
import { z } from "zod";
import { publicProcedure, adminProcedure, router } from "../trpc.js";
import {
  seedProPortal,
  listProfessions,
  listPortalCountries,
  listModulesFor,
  buildQuote,
  requirementsFor,
  saveDraft,
  getDraft,
  portalHealth,
} from "./service.js";

export const PRO_PORTAL_META = {
  code: "pro_portal",
  name: "Pro Portal Engine",
  role: "Portail professionnel mondial : métiers, catalogue de services à la carte, composition d'offre.",
} as const;

export const proPortalRouter = router({
  /** Métiers proposés, éventuellement restreints à un pays. */
  professions: publicProcedure
    .input(z.object({ countryCode: z.string().length(2).optional() }).optional())
    .query(({ input }) => listProfessions(input?.countryCode)),

  /** Pays ouverts, avec l'information honnête « paiement disponible ou non ». */
  countries: publicProcedure.query(() => listPortalCountries()),

  /** Catalogue modulaire pour un métier + pays, tarifs résolus côté serveur. */
  modules: publicProcedure
    .input(z.object({ professionCode: z.string().min(1), countryCode: z.string().length(2) }))
    .query(({ input }) => listModulesFor(input.professionCode, input.countryCode)),

  /** Panier : le montant est recalculé ici, jamais accepté du navigateur. */
  quote: publicProcedure
    .input(
      z.object({
        professionCode: z.string().min(1),
        countryCode: z.string().length(2),
        moduleCodes: z.array(z.string().min(1)).max(50).default([]),
      }),
    )
    .query(({ input }) => buildQuote(input)),

  /** Justificatifs à réunir : socle du métier + exigences propres au pays. */
  requirements: publicProcedure
    .input(z.object({ professionCode: z.string().min(1), countryCode: z.string().length(2) }))
    .query(({ input }) => requirementsFor(input.professionCode, input.countryCode)),

  /** Reprise d'un parcours abandonné. */
  saveDraft: publicProcedure
    .input(
      z.object({
        sessionKey: z.string().min(8).max(64),
        professionCode: z.string().min(1).nullable().optional(),
        countryCode: z.string().length(2).nullable().optional(),
        moduleCodes: z.array(z.string().min(1)).max(50).optional(),
        step: z.string().max(24).optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      saveDraft({ ...input, userId: ctx.user?.uid ?? null }),
    ),

  draft: publicProcedure
    .input(z.object({ sessionKey: z.string().min(8).max(64) }))
    .query(({ input }) => getDraft(input.sessionKey)),

  /** Santé réelle du moteur — jamais un vert de complaisance. */
  health: adminProcedure.query(() => portalHealth()),

  /** Amorce du catalogue (idempotent). */
  seed: adminProcedure.mutation(() => seedProPortal()),
});

export { seedProPortal, portalHealth };
