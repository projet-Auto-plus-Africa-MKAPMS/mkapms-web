/**
 * Partner Outreach Engine — router tRPC.
 *
 * Toute lecture/écriture est réservée à `adminProcedure` : ce registre
 * contient des contacts d'entreprises externes, jamais exposé publiquement.
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc.js";
import {
  changerStatut,
  controlCenterFeed,
  dashboard,
  enregistrerBrouillonReponse,
  enregistrerContact,
  enregistrerReponse,
  healthStatus,
  historique,
  importerContacts,
  lister,
  marquerEnvoye,
  marquerNonLivre,
  obtenir,
  statistiques,
  VERSION,
} from "./service.js";
import {
  OUTREACH_CAPACITIES,
  OUTREACH_CATEGORIES,
  OUTREACH_COMMERCIAL_MODELS,
  OUTREACH_SOURCES,
  OUTREACH_STATUSES,
  PARTNER_OUTREACH_ENGINE_META,
} from "./contract.js";

const contactInputSchema = z.object({
  email: z.string().email().max(255),
  domain: z.string().max(160).optional(),
  companyName: z.string().max(200).optional(),
  country: z.string().max(80).optional(),
  city: z.string().max(120).optional(),
  phone: z.string().max(32).optional(),
  website: z.string().max(255).optional(),
  category: z.enum(OUTREACH_CATEGORIES).optional(),
  capacities: z.array(z.enum(OUTREACH_CAPACITIES)).max(20).optional(),
  zonesDesservies: z.array(z.string().max(80)).max(100).optional(),
  langues: z.array(z.string().max(40)).max(20).optional(),
  modeleCommercial: z.enum(OUTREACH_COMMERCIAL_MODELS).optional(),
  source: z.enum(OUTREACH_SOURCES).optional(),
});

export const partnerOutreachEngineRouter = router({
  meta: publicProcedure.query(() => ({ ...PARTNER_OUTREACH_ENGINE_META, version: VERSION })),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  statistiques: adminProcedure.query(() => statistiques()),

  liste: adminProcedure
    .input(
      z
        .object({
          status: z.enum(OUTREACH_STATUSES).optional(),
          category: z.enum(OUTREACH_CATEGORIES).optional(),
          search: z.string().max(200).optional(),
        })
        .optional(),
    )
    .query(({ input }) => lister(input)),

  detail: adminProcedure.input(z.object({ id: z.number().int().positive() })).query(({ input }) => obtenir(input.id)),

  historique: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ input }) => historique(input.id)),

  creer: adminProcedure.input(contactInputSchema).mutation(({ ctx, input }) => enregistrerContact(input, ctx.user.uid)),

  importer: adminProcedure
    .input(z.object({ contacts: z.array(contactInputSchema).min(1).max(1000) }))
    .mutation(({ ctx, input }) => importerContacts(input.contacts, ctx.user.uid)),

  changerStatut: adminProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(OUTREACH_STATUSES), note: z.string().max(2000).optional() }))
    .mutation(({ ctx, input }) => changerStatut(input.id, input.status, ctx.user.uid, input.note)),

  enregistrerReponse: adminProcedure
    .input(z.object({ id: z.number().int().positive(), resume: z.string().min(1).max(4000) }))
    .mutation(({ ctx, input }) => enregistrerReponse(input.id, input.resume, ctx.user.uid)),

  enregistrerBrouillon: adminProcedure
    .input(z.object({ id: z.number().int().positive(), texte: z.string().max(8000) }))
    .mutation(({ ctx, input }) => enregistrerBrouillonReponse(input.id, input.texte, ctx.user.uid)),

  marquerEnvoye: adminProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ ctx, input }) => marquerEnvoye(input.id, ctx.user.uid)),

  marquerNonLivre: adminProcedure
    .input(z.object({ id: z.number().int().positive(), motif: z.string().max(500).optional() }))
    .mutation(({ ctx, input }) => marquerNonLivre(input.id, ctx.user.uid, input.motif)),
});

export * as partnerOutreachEngineSchema from "./schema.js";
export * as partnerOutreachEngineContract from "./contract.js";
export { PARTNER_OUTREACH_ENGINE_META };
