/**
 * Insurance Engine (point 45) — router tRPC.
 *
 * La demande de couverture est publique : un visiteur doit pouvoir demander une
 * assurance sans compte. Tout ce qui engage la plateforme ou un assureur
 * (référencer un partenaire, enregistrer une offre, changer un statut) reste
 * réservé à l'administration.
 */
import { z } from "zod";
import {
  adminProcedure,
  directionProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../trpc.js";
import { INSURANCE_FORMULAS, INSURANCE_USAGES } from "./schema.js";
import {
  insuranceCatalog,
  insuranceEngineHealth,
  listInsurancePartners,
  listQuoteRequests,
  myQuoteRequests,
  recordOffer,
  requestQuote,
  setQuoteStatus,
  upsertInsurancePartner,
} from "./service.js";

export const INSURANCE_ENGINE_META = {
  code: "assurance",
  name: "Assurance Engine",
  role: "Mise en relation assurance auto : assureurs référencés par pays, demandes de couverture, offres saisies par un humain.",
} as const;

export const insuranceEngineRouter = router({
  catalog: publicProcedure.query(() => insuranceCatalog()),

  partners: publicProcedure
    .input(z.object({ countryCode: z.string().min(2).max(4).optional() }).optional())
    .query(async ({ input }) => listInsurancePartners(input?.countryCode)),

  /** Demande de couverture — publique, aucun prix retourné. */
  demanderDevis: publicProcedure
    .input(
      z.object({
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        formula: z.enum(INSURANCE_FORMULAS),
        usage: z.enum(INSURANCE_USAGES),
        vehicleBrand: z.string().max(80).optional(),
        vehicleModel: z.string().max(120).optional(),
        vehicleYear: z.number().int().min(1900).max(2100).optional(),
        plate: z.string().max(24).optional(),
        driverLicenseYear: z.number().int().min(1930).max(2100).optional(),
        claimsLast3Years: z.number().int().min(0).max(20).optional(),
        contactName: z.string().max(160).optional(),
        contactEmail: z.string().email().max(255).optional(),
        contactPhone: z.string().max(32).optional(),
        message: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return requestQuote({ ...input, userId: ctx.user?.uid ?? null });
    }),

  mesDemandes: protectedProcedure.query(async ({ ctx }) => myQuoteRequests(ctx.user.uid)),

  demandes: directionProcedure
    .input(
      z
        .object({
          status: z.string().max(20).optional(),
          countryCode: z.string().max(4).optional(),
          limit: z.number().int().min(1).max(500).default(100),
        })
        .optional(),
    )
    .query(async ({ input }) =>
      listQuoteRequests({
        status: input?.status,
        countryCode: input?.countryCode,
        limit: input?.limit ?? 100,
      }),
    ),

  /** Offre saisie par un humain : la plateforme ne calcule aucune prime. */
  enregistrerOffre: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        partnerId: z.number().int().positive(),
        amount: z.string().min(1).max(20),
        currency: z.string().min(1).max(8),
        validUntil: z.coerce.date().optional(),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      recordOffer({ ...input, userId: ctx.user.uid }),
    ),

  changerStatutDemande: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["transmise", "sans_assureur", "offre_recue", "souscrite", "abandonnee"]),
      }),
    )
    .mutation(async ({ input }) => setQuoteStatus(input.id, input.status)),

  enregistrerAssureur: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive().optional(),
        name: z.string().min(1).max(160),
        countryCode: z.string().min(2).max(4),
        formulas: z.array(z.enum(INSURANCE_FORMULAS)).default([]),
        usages: z.array(z.enum(INSURANCE_USAGES)).default([]),
        contactEmail: z.string().email().max(255).optional(),
        contactPhone: z.string().max(32).optional(),
        status: z.enum(["actif", "suspendu"]).default("actif"),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input }) => upsertInsurancePartner(input)),

  health: directionProcedure.query(async () => insuranceEngineHealth()),
});
