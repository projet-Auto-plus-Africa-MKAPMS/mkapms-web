/**
 * Partner Engine (points 36-37) — router tRPC.
 *
 * « Devenir partenaire MKA.P-MS » est publique : c'est une entrée commerciale,
 * elle ne doit pas exiger un compte. Tout le reste (décisions, contrats,
 * opportunités, préparation des actions d'acquisition) est réservé à
 * l'administration ou à la direction, car ce sont des engagements.
 */
import { z } from "zod";
import { adminProcedure, directionProcedure, publicProcedure, router } from "../trpc.js";
import {
  applyAsPartner,
  createContract,
  detectOpportunities,
  listApplications,
  listOpportunities,
  partnerEngineHealth,
  partnerNetwork,
  partnerServiceCatalog,
  prepareAcquisitionActions,
  registerLead,
  reviewApplication,
  setContractStatus,
  setOpportunityStatus,
  updateLeadStatus,
} from "./service.js";

export const PARTNER_ENGINE_META = {
  code: "partner_engine",
  name: "Partner Engine",
  role: "Réseau partenaires (pays, métier, zone, contrat, leads, performance) et acquisition des professionnels manquants.",
} as const;

export const partnerEngineRouter = router({
  services: publicProcedure.query(() => partnerServiceCatalog()),

  /** Point 36 — entrée commerciale « Devenir partenaire MKA.P-MS ». */
  apply: publicProcedure
    .input(
      z.object({
        companyName: z.string().min(2).max(180),
        profession: z.string().min(2).max(48),
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        zoneRadiusKm: z.number().int().min(1).max(500).optional(),
        services: z.array(z.string().max(48)).max(20).default([]),
        contactName: z.string().max(160).optional(),
        contactEmail: z.string().email().max(255).optional(),
        contactPhone: z.string().max(32).optional(),
        message: z.string().max(2000).optional(),
        opportunityId: z.number().int().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) => applyAsPartner({ ...input, userId: ctx.user?.uid ?? null })),

  applications: adminProcedure
    .input(z.object({ status: z.string().max(16).optional() }).optional())
    .query(({ input }) => listApplications(input?.status)),

  review: directionProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        decision: z.enum(["en_examen", "acceptee", "refusee"]),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(({ ctx, input }) =>
      reviewApplication({ ...input, reviewerId: ctx.user.uid }),
    ),

  network: adminProcedure
    .input(z.object({ countryCode: z.string().min(2).max(4).optional() }).optional())
    .query(({ input }) => partnerNetwork(input?.countryCode)),

  createContract: directionProcedure
    .input(
      z.object({
        partnerId: z.number().int().positive(),
        kind: z.enum(["apporteur_affaires", "prestataire", "distribution", "cadre"]),
        commissionRate: z.number().min(0).max(100).optional(),
        currency: z.string().min(3).max(8).optional(),
        startsAt: z.coerce.date().optional(),
        endsAt: z.coerce.date().optional(),
        terms: z.string().max(8000).optional(),
      }),
    )
    .mutation(({ input }) => createContract(input)),

  setContractStatus: directionProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["brouillon", "en_signature", "actif", "expire", "resilie"]),
      }),
    )
    .mutation(({ ctx, input }) => setContractStatus(input.id, input.status, ctx.user.uid)),

  registerLead: adminProcedure
    .input(
      z.object({
        partnerId: z.number().int().positive().optional(),
        service: z.string().min(2).max(48),
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        source: z.enum(["recherche", "demande_devis", "reservation", "campagne", "manuel"]).optional(),
        detail: z.string().max(2000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => registerLead({ ...input, userId: ctx.user?.uid ?? null })),

  updateLeadStatus: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["nouveau", "accepte", "refuse", "conclu", "perdu"]),
        amount: z.number().min(0).optional(),
      }),
    )
    .mutation(({ input }) => updateLeadStatus(input.id, input.status, input.amount ?? null)),

  /** Point 37 — détection du manque d'offre à partir des recherches réelles. */
  detect: adminProcedure
    .input(z.object({ periodDays: z.number().int().min(7).max(365).optional() }).optional())
    .mutation(({ input }) => detectOpportunities(input?.periodDays ?? 30)),

  opportunities: adminProcedure
    .input(z.object({ status: z.string().max(16).optional() }).optional())
    .query(({ input }) => listOpportunities(input?.status)),

  /** Prépare page SEO, contenus et campagne — tout reste en brouillon. */
  prepareActions: directionProcedure
    .input(z.object({ opportunityId: z.number().int().positive() }))
    .mutation(({ input }) => prepareAcquisitionActions(input.opportunityId)),

  setOpportunityStatus: directionProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["ouverte", "en_cours", "pourvue", "abandonnee"]),
      }),
    )
    .mutation(({ input }) => setOpportunityStatus(input.id, input.status)),

  health: adminProcedure.query(() => partnerEngineHealth()),
});
