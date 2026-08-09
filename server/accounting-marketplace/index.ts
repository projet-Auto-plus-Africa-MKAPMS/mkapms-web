/**
 * MKA.P-MS Accounting Marketplace Engine (point 26 B).
 *
 * « Je cherche un comptable » : annuaire de professionnels indépendants,
 * recherché par pays, ville, spécialité, langue, disponibilité et note.
 * Techniquement séparé de la comptabilité interne : ce moteur n'accède à
 * aucune écriture MKA.P-MS.
 */
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  createRequest,
  marketplaceHealth,
  myProfile,
  myRequests,
  reviewProfile,
  searchAccountants,
  upsertProfile,
} from "./service.js";

export const ACCOUNTING_MARKETPLACE_META = {
  code: "accounting_marketplace",
  name: "Accounting Marketplace Engine",
  role: "Annuaire de comptables indépendants : recherche par pays, ville, spécialité, langue, disponibilité.",
} as const;

export const accountingMarketplaceRouter = router({
  search: publicProcedure
    .input(
      z.object({
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        specialty: z.string().max(48).optional(),
        language: z.string().max(8).optional(),
        availableOnly: z.boolean().optional(),
        limit: z.number().int().min(1).max(100).optional(),
      }),
    )
    .query(({ input }) => searchAccountants(input)),

  myProfile: protectedProcedure.query(({ ctx }) => myProfile(ctx.user.uid)),

  saveProfile: protectedProcedure
    .input(
      z.object({
        displayName: z.string().min(1).max(160),
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        postalCode: z.string().max(16).optional(),
        cabinetId: z.number().int().positive().optional(),
        specialties: z.array(z.string().max(48)).max(20).optional(),
        languages: z.array(z.string().max(8)).max(10).optional(),
        hourlyRate: z.number().positive().optional(),
        currency: z.string().max(8).optional(),
        availability: z.enum(["disponible", "complet", "sur_rdv"]).optional(),
        bio: z.string().max(2000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => upsertProfile({ ...input, userId: ctx.user.uid })),

  /** Publication après vérification humaine : jamais automatique. */
  review: adminProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        verified: z.boolean(),
        published: z.boolean(),
      }),
    )
    .mutation(({ input }) => reviewProfile(input)),

  requestAccountant: protectedProcedure
    .input(
      z.object({
        accountantId: z.number().int().positive().optional(),
        countryCode: z.string().min(2).max(4),
        city: z.string().max(120).optional(),
        specialty: z.string().max(48).optional(),
        message: z.string().max(2000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => createRequest({ ...input, userId: ctx.user.uid })),

  myRequests: protectedProcedure.query(({ ctx }) => myRequests(ctx.user.uid)),

  health: adminProcedure.query(() => marketplaceHealth()),
});

export { marketplaceHealth } from "./service.js";
