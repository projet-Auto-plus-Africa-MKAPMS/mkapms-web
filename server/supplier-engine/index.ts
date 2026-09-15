/**
 * Supplier Engine — router tRPC (LOT 1 du Plan Maître Fournisseurs).
 *
 * Registre fournisseur, onboarding, Connector Engine et Universal Mapping
 * Engine. Complète `partner-engine` (candidature, contrat, couverture) sans
 * le dupliquer : un profil fournisseur exige un `partnerId` déjà créé, de
 * type fournisseur_vehicules / fournisseur_pieces / transporteur.
 *
 * Toute décision qui engage la plateforme (validation KYB, validation
 * Direction, signature contrat, activation, suspension, désactivation) est
 * réservée à `directionProcedure` — jamais automatique.
 */
import { z } from "zod";
import { adminProcedure, directionProcedure, publicProcedure, router } from "../trpc.js";
import {
  activerFournisseur,
  ajouterContact,
  avancerEtapeOnboarding,
  connectionMethodsCatalog,
  controlCenterFeed,
  creerFournisseur,
  dashboard,
  definirMapping,
  definirTerritoires,
  desactiverFournisseur,
  enregistrerConnexion,
  enregistrerContratSigne,
  healthStatus,
  journalAudit,
  listerFournisseurs,
  obtenirFournisseurDetail,
  reactiverFournisseur,
  suspendreFournisseur,
  testerConnexion,
  validerParDirection,
  verifierEntreprise,
  VERSION,
} from "./service.js";
import {
  CONNECTION_AUTH_TYPES,
  CONNECTION_ENVIRONMENTS,
  MAPPING_ENTITY_TYPES,
  ONBOARDING_STEPS,
  ONBOARDING_STEP_STATUSES,
  SUPPLIER_ENGINE_META,
  SUPPLIER_STATUSES,
  SUPPLIER_TYPES,
} from "./contract.js";

export const supplierEngineRouter = router({
  meta: publicProcedure.query(() => ({ ...SUPPLIER_ENGINE_META, version: VERSION })),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  connectionMethods: publicProcedure.query(() => connectionMethodsCatalog()),

  // ── Registre ────────────────────────────────────────────────────────
  creer: adminProcedure
    .input(
      z.object({
        partnerId: z.number().int().positive(),
        supplierType: z.enum(SUPPLIER_TYPES),
        companyLegalName: z.string().min(2).max(200),
        registrationNumber: z.string().max(64).optional(),
        vatNumber: z.string().max(32).optional(),
        countryCode: z.string().min(2).max(4),
        currency: z.string().min(3).max(8).optional(),
        paymentTermsDays: z.number().int().min(0).max(365).optional(),
        commercialTerms: z.string().max(4000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => creerFournisseur({ ...input, createdBy: ctx.user.uid })),

  liste: adminProcedure
    .input(z.object({ status: z.enum(SUPPLIER_STATUSES).optional(), supplierType: z.enum(SUPPLIER_TYPES).optional() }).optional())
    .query(({ input }) => listerFournisseurs(input)),

  detail: adminProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive() }))
    .query(({ input }) => obtenirFournisseurDetail(input.supplierProfileId)),

  ajouterContact: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        kind: z.enum(["commercial", "technique", "comptabilite"]),
        name: z.string().max(160).optional(),
        email: z.string().email().max(255).optional(),
        phone: z.string().max(32).optional(),
      }),
    )
    .mutation(({ input }) => ajouterContact(input)),

  auditLog: adminProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive(), limit: z.number().int().min(1).max(500).default(200) }))
    .query(({ input }) => journalAudit(input.supplierProfileId, input.limit)),

  // ── Onboarding ──────────────────────────────────────────────────────
  verifierEntreprise: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        decision: z.enum(["en_cours", "verifie", "refuse"]),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => verifierEntreprise({ ...input, actorId: ctx.user.uid })),

  validerParDirection: directionProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => validerParDirection({ ...input, actorId: ctx.user.uid })),

  enregistrerContratSigne: directionProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive(), contractTermsId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => enregistrerContratSigne({ ...input, actorId: ctx.user.uid })),

  definirTerritoires: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        allowed: z.array(z.string().min(2).max(4)).max(200).default([]),
        excluded: z.array(z.string().min(2).max(4)).max(200).default([]),
      }),
    )
    .mutation(({ ctx, input }) => definirTerritoires({ ...input, actorId: ctx.user.uid })),

  avancerEtape: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        step: z.enum(ONBOARDING_STEPS),
        status: z.enum(ONBOARDING_STEP_STATUSES),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(({ ctx, input }) => avancerEtapeOnboarding({ ...input, actorId: ctx.user.uid })),

  // ── Connector Engine ────────────────────────────────────────────────
  enregistrerConnexion: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        method: z.string().min(2).max(32),
        authType: z.enum(CONNECTION_AUTH_TYPES).optional(),
        environment: z.enum(CONNECTION_ENVIRONMENTS).optional(),
        endpointUrl: z.string().max(1000).optional(),
        secretRef: z.string().max(128).optional(),
        rateLimitPerMinute: z.number().int().min(1).max(100000).optional(),
        config: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => enregistrerConnexion({ ...input, actorId: ctx.user.uid })),

  testerConnexion: adminProcedure
    .input(z.object({ connectionId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => testerConnexion(input.connectionId, ctx.user.uid)),

  // ── Universal Mapping Engine ────────────────────────────────────────
  definirMapping: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        entityType: z.enum(MAPPING_ENTITY_TYPES),
        regles: z
          .array(
            z.object({
              canonicalField: z.string().min(1).max(96),
              supplierField: z.string().min(1).max(96),
              transform: z.record(z.unknown()).optional(),
            }),
          )
          .max(200),
      }),
    )
    .mutation(({ ctx, input }) => definirMapping({ ...input, actorId: ctx.user.uid })),

  // ── Cycle de vie ────────────────────────────────────────────────────
  activer: directionProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => activerFournisseur({ ...input, actorId: ctx.user.uid })),

  suspendre: directionProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => suspendreFournisseur({ ...input, actorId: ctx.user.uid })),

  reactiver: directionProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => reactiverFournisseur({ ...input, actorId: ctx.user.uid })),

  desactiver: directionProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => desactiverFournisseur({ ...input, actorId: ctx.user.uid })),
});

export * as supplierEngineSchema from "./schema.js";
export * as supplierEngineContract from "./contract.js";
export { SUPPLIER_ENGINE_META };
