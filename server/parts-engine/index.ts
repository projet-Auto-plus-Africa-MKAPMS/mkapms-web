/**
 * Parts Engine — router tRPC (LOT 3 du Plan Maître Fournisseurs, PIÈCES
 * AUTOMOBILES UNIQUEMENT). La publication (`validerEtPublier`) est réservée
 * à `directionProcedure` — même principe que `activerFournisseur` (LOT 1) et
 * `validerEtPublier` du Vehicle Engine (LOT 2).
 */
import { z } from "zod";
import { adminProcedure, directionProcedure, publicProcedure, router } from "../trpc.js";
import {
  analyserCompatibilite,
  analyserIA,
  calculerPrix,
  consommerReservationStock,
  controlCenterFeed,
  controlerQualite,
  dashboard,
  declarerEquivalence,
  deciderCorrespondanceCanonique,
  deciderEquivalence,
  definirStock,
  definirTerritoiresPiece,
  healthStatus,
  identifierPieceEtCanonique,
  ingererPiece,
  journalAudit,
  libererReservationStock,
  libererReservationsExpirees,
  listerPieces,
  mapperEtNormaliser,
  marquerDiscontinued,
  obtenirPieceDetail,
  preparerPourPublication,
  rechercherEquivalences,
  reserverStock,
  retirerPiece,
  signalerErreurSync,
  synchroniserPiece,
  validerCompatibilite,
  validerEtPublier,
  VERSION,
} from "./service.js";
import { COMPATIBILITY_LEVELS, PART_SYNC_STATUSES, PARTS_ENGINE_META } from "./contract.js";

export const partsEngineRouter = router({
  meta: publicProcedure.query(() => ({ ...PARTS_ENGINE_META, version: VERSION })),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  // ── 1. Ingestion ────────────────────────────────────────────────────
  ingerer: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        supplierPartId: z.string().min(1).max(128),
        ingestMethod: z.string().min(1).max(32),
        rawData: z.record(z.unknown()),
      }),
    )
    .mutation(({ ctx, input }) => ingererPiece({ ...input, actorId: ctx.user.uid })),

  liste: adminProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive().optional(), status: z.enum(PART_SYNC_STATUSES).optional() }).optional())
    .query(({ input }) => listerPieces(input)),

  detail: adminProcedure.input(z.object({ supplierItemId: z.number().int().positive() })).query(({ input }) => obtenirPieceDetail(input.supplierItemId)),

  auditLog: adminProcedure
    .input(z.object({ supplierItemId: z.number().int().positive(), limit: z.number().int().min(1).max(500).default(200) }))
    .query(({ input }) => journalAudit(input.supplierItemId, input.limit)),

  // ── 2-3. Mapping + normalisation ───────────────────────────────────
  mapperEtNormaliser: adminProcedure.input(z.object({ supplierItemId: z.number().int().positive() })).mutation(({ ctx, input }) => mapperEtNormaliser(input.supplierItemId, ctx.user.uid)),

  // ── 4-5. Identification pièce / OEM / canonique (doublon) ───────────
  identifierPieceEtCanonique: adminProcedure.input(z.object({ supplierItemId: z.number().int().positive() })).mutation(({ ctx, input }) => identifierPieceEtCanonique(input.supplierItemId, ctx.user.uid)),

  deciderCorrespondanceCanonique: adminProcedure
    .input(z.object({ supplierItemId: z.number().int().positive(), decision: z.enum(["confirme", "ecarte"]) }))
    .mutation(({ ctx, input }) => deciderCorrespondanceCanonique({ ...input, actorId: ctx.user.uid })),

  // ── OEM / Cross-Reference Engine ─────────────────────────────────────
  declarerEquivalence: adminProcedure
    .input(
      z.object({
        referenceOem: z.string().min(1).max(96),
        referenceAlternative: z.string().min(1).max(96),
        marqueAlternative: z.string().max(128).optional(),
        sourceType: z.enum(["fournisseur", "manuel", "tecdoc", "equipementier"]),
        sourceRef: z.string().max(2000).optional(),
        confidencePct: z.number().min(0).max(100),
      }),
    )
    .mutation(({ ctx, input }) => declarerEquivalence({ ...input, actorId: ctx.user.uid })),

  deciderEquivalence: adminProcedure
    .input(z.object({ crossReferenceId: z.number().int().positive(), decision: z.enum(["confirme", "ecarte"]) }))
    .mutation(({ ctx, input }) => deciderEquivalence({ ...input, actorId: ctx.user.uid })),

  rechercherEquivalences: publicProcedure.input(z.object({ referenceOem: z.string().min(1).max(96) })).query(({ input }) => rechercherEquivalences(input.referenceOem)),

  // ── Parts Compatibility Engine ───────────────────────────────────────
  analyserCompatibilite: adminProcedure
    .input(
      z.object({
        supplierItemId: z.number().int().positive(),
        marque: z.string().min(1).max(96),
        modele: z.string().max(128).optional(),
        generation: z.string().max(64).optional(),
        anneeDebut: z.number().int().min(1900).max(2100).optional(),
        anneeFin: z.number().int().min(1900).max(2100).optional(),
        codeMoteur: z.string().max(64).optional(),
        codeBoite: z.string().max(64).optional(),
        carburant: z.string().max(32).optional(),
        transmission: z.string().max(32).optional(),
      }),
    )
    .mutation(({ ctx, input }) => analyserCompatibilite({ ...input, actorId: ctx.user.uid })),

  validerCompatibilite: adminProcedure
    .input(z.object({ checkId: z.number().int().positive(), decision: z.enum(["VERIFIED_COMPATIBLE", "INCOMPATIBLE"]) }))
    .mutation(({ ctx, input }) => validerCompatibilite({ ...input, actorId: ctx.user.uid })),

  // ── Parts Data Quality Engine ────────────────────────────────────────
  controlerQualite: adminProcedure.input(z.object({ supplierItemId: z.number().int().positive() })).mutation(({ ctx, input }) => controlerQualite(input.supplierItemId, ctx.user.uid)),

  // ── Parts AI Engine ──────────────────────────────────────────────────
  analyserIA: adminProcedure.input(z.object({ supplierItemId: z.number().int().positive() })).mutation(({ ctx, input }) => analyserIA(input.supplierItemId, ctx.user.uid)),

  // ── Parts Pricing Engine ─────────────────────────────────────────────
  calculerPrix: adminProcedure
    .input(
      z.object({
        supplierItemId: z.number().int().positive(),
        supplierPrice: z.number().positive(),
        supplierCurrency: z.string().min(3).max(8),
        commissionRatePct: z.number().min(0).max(100).optional(),
        vatRatePct: z.number().min(0).max(100).optional(),
        retailCurrency: z.string().min(3).max(8).optional(),
        minPriceContractual: z.number().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) => calculerPrix({ ...input, actorId: ctx.user.uid })),

  // ── Parts Stock Engine ───────────────────────────────────────────────
  definirStock: adminProcedure
    .input(
      z.object({
        supplierItemId: z.number().int().positive(),
        warehouseId: z.number().int().positive().optional(),
        countryCode: z.string().min(2).max(4).optional(),
        physicalQuantity: z.number().int().min(0),
        incomingQuantity: z.number().int().min(0).optional(),
        restockDate: z.coerce.date().optional(),
        lowStockThreshold: z.number().int().min(0).optional(),
      }),
    )
    .mutation(({ ctx, input }) => definirStock({ ...input, actorId: ctx.user.uid })),

  reserverStock: adminProcedure
    .input(z.object({ supplierItemId: z.number().int().positive(), quantity: z.number().int().positive(), orderRef: z.string().max(64).optional(), expiresAt: z.coerce.date().optional() }))
    .mutation(({ ctx, input }) => reserverStock({ ...input, actorId: ctx.user.uid })),

  libererReservationStock: adminProcedure
    .input(z.object({ reservationId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => libererReservationStock({ ...input, actorId: ctx.user.uid })),

  consommerReservationStock: adminProcedure
    .input(z.object({ reservationId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => consommerReservationStock({ ...input, actorId: ctx.user.uid })),

  libererReservationsExpirees: adminProcedure.mutation(() => libererReservationsExpirees()),

  // ── Parts Territory Engine ───────────────────────────────────────────
  definirTerritoires: adminProcedure
    .input(
      z.object({
        supplierItemId: z.number().int().positive(),
        allowedSaleCountries: z.array(z.string().min(2).max(4)).max(300).default([]),
        excludedSaleCountries: z.array(z.string().min(2).max(4)).max(300).optional(),
        restrictedCountries: z.array(z.string().min(2).max(4)).max(300).optional(),
        exportAllowed: z.boolean().optional(),
        countryCodeOrigine: z.string().min(2).max(4).optional(),
        hazardousMaterial: z.boolean().optional(),
        fragile: z.boolean().optional(),
        oversized: z.boolean().optional(),
        transportRestrictions: z.array(z.string().max(64)).optional(),
        preparationDelay: z.number().int().min(0).max(90).optional(),
      }),
    )
    .mutation(({ ctx, input }) => definirTerritoiresPiece({ ...input, actorId: ctx.user.uid })),

  // ── 11-12. Préparation + publication ─────────────────────────────────
  preparerPourPublication: adminProcedure.input(z.object({ supplierItemId: z.number().int().positive() })).mutation(({ ctx, input }) => preparerPourPublication(input.supplierItemId, ctx.user.uid)),

  validerEtPublier: directionProcedure.input(z.object({ supplierItemId: z.number().int().positive() })).mutation(({ ctx, input }) => validerEtPublier({ ...input, actorId: ctx.user.uid })),

  // ── Synchronisation / fin de vie ─────────────────────────────────────
  synchroniser: adminProcedure
    .input(z.object({ supplierItemId: z.number().int().positive(), rawData: z.record(z.unknown()) }))
    .mutation(({ ctx, input }) => synchroniserPiece({ ...input, actorId: ctx.user.uid })),

  signalerErreurSync: adminProcedure
    .input(z.object({ supplierItemId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ input }) => signalerErreurSync(input)),

  marquerDiscontinued: adminProcedure
    .input(z.object({ supplierItemId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => marquerDiscontinued({ ...input, actorId: ctx.user.uid })),

  retirer: adminProcedure
    .input(z.object({ supplierItemId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => retirerPiece({ ...input, actorId: ctx.user.uid })),
});

export type { CompatibilityLevel } from "./contract.js";
export { COMPATIBILITY_LEVELS };
export * as partsEngineSchema from "./schema.js";
export * as partsEngineContract from "./contract.js";
export { PARTS_ENGINE_META };
