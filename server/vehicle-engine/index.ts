/**
 * Vehicle Engine — router tRPC (LOT 2 du Plan Maître Fournisseurs, VÉHICULES
 * UNIQUEMENT). La publication effective (`validerEtPublier`) est réservée à
 * `directionProcedure` — même principe que `activerFournisseur` du LOT 1 :
 * jamais une mise en ligne automatique.
 */
import { z } from "zod";
import { adminProcedure, directionProcedure, publicProcedure, router } from "../trpc.js";
import {
  ajouterRapportEtat,
  analyserDonnees,
  analyserIA,
  assurerDisponibilite,
  calculerPrix,
  controlCenterFeed,
  controlerQualite,
  dashboard,
  deciderDoublon,
  definirTerritoiresVehicule,
  detecterDoublons,
  healthStatus,
  ingererVehicule,
  journalAudit,
  libererReservation,
  listerVehicules,
  mapperEtNormaliser,
  marquerVendu,
  obtenirVehiculeDetail,
  preparerPourPublication,
  reserverVehicule,
  retirerVehicule,
  signalerErreurSync,
  signalerIndisponibiliteFournisseur,
  synchroniserVehicule,
  validerEtPublier,
  VERSION,
} from "./service.js";
import { CONDITION_STAGES, TRANSPORT_MODES, VEHICLE_ENGINE_META, VEHICLE_SYNC_STATUSES } from "./contract.js";

export const vehicleEngineRouter = router({
  meta: publicProcedure.query(() => ({ ...VEHICLE_ENGINE_META, version: VERSION })),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  // ── 1. Ingestion ────────────────────────────────────────────────────
  ingerer: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        supplierVehicleId: z.string().min(1).max(128),
        ingestMethod: z.string().min(1).max(32),
        rawData: z.record(z.unknown()),
      }),
    )
    .mutation(({ ctx, input }) => ingererVehicule({ ...input, actorId: ctx.user.uid })),

  liste: adminProcedure
    .input(z.object({ supplierProfileId: z.number().int().positive().optional(), status: z.enum(VEHICLE_SYNC_STATUSES).optional() }).optional())
    .query(({ input }) => listerVehicules(input)),

  detail: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .query(({ input }) => obtenirVehiculeDetail(input.vehicleItemId)),

  auditLog: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive(), limit: z.number().int().min(1).max(500).default(200) }))
    .query(({ input }) => journalAudit(input.vehicleItemId, input.limit)),

  // ── 2-3. Mapping + normalisation ───────────────────────────────────
  mapperEtNormaliser: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => mapperEtNormaliser(input.vehicleItemId, ctx.user.uid)),

  // ── 4. Vehicle Duplicate Engine ─────────────────────────────────────
  detecterDoublons: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => detecterDoublons(input.vehicleItemId, ctx.user.uid)),

  deciderDoublon: adminProcedure
    .input(z.object({ duplicateId: z.number().int().positive(), decision: z.enum(["confirme", "ecarte"]) }))
    .mutation(({ ctx, input }) => deciderDoublon({ ...input, actorId: ctx.user.uid })),

  // ── 5. Analyse VIN / données ────────────────────────────────────────
  analyserDonnees: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => analyserDonnees(input.vehicleItemId, ctx.user.uid)),

  // ── 6. Vehicle Data Quality Engine ──────────────────────────────────
  controlerQualite: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => controlerQualite(input.vehicleItemId, ctx.user.uid)),

  // ── 7. Vehicle Intelligence Engine ────────────────────────────────────
  analyserIA: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => analyserIA(input.vehicleItemId, ctx.user.uid)),

  // ── 8. Vehicle Pricing Engine ────────────────────────────────────────
  calculerPrix: adminProcedure
    .input(
      z.object({
        vehicleItemId: z.number().int().positive(),
        supplierPrice: z.number().positive(),
        supplierCurrency: z.string().min(3).max(8),
        commissionRatePct: z.number().min(0).max(100).optional(),
        publicCurrency: z.string().min(3).max(8).optional(),
        minPriceContractual: z.number().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) => calculerPrix({ ...input, actorId: ctx.user.uid })),

  // ── 9. Vehicle Territory Engine ─────────────────────────────────────
  definirTerritoires: adminProcedure
    .input(
      z.object({
        vehicleItemId: z.number().int().positive(),
        allowedSaleCountries: z.array(z.string().min(2).max(4)).max(300).default([]),
        excludedSaleCountries: z.array(z.string().min(2).max(4)).max(300).optional(),
        exportAllowed: z.boolean().optional(),
        euExportAllowed: z.boolean().optional(),
        worldwideExportAllowed: z.boolean().optional(),
        pickupCity: z.string().max(120).optional(),
        pickupCountryCode: z.string().min(2).max(4).optional(),
        vehicleReadyDelay: z.number().int().min(0).max(365).optional(),
        documentsReadyForExport: z.boolean().optional(),
        transportEligible: z.boolean().optional(),
        transportModesAllowed: z.array(z.enum(TRANSPORT_MODES)).optional(),
      }),
    )
    .mutation(({ ctx, input }) => definirTerritoiresVehicule({ ...input, actorId: ctx.user.uid })),

  // ── 10. Vehicle Availability Engine ─────────────────────────────────
  assurerDisponibilite: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ input }) => assurerDisponibilite(input.vehicleItemId)),

  // ── 11-12. Préparation + validation ─────────────────────────────────
  preparerPourPublication: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => preparerPourPublication(input.vehicleItemId, ctx.user.uid)),

  // ── 13. Publication (décision Direction) ────────────────────────────
  validerEtPublier: directionProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => validerEtPublier({ ...input, actorId: ctx.user.uid })),

  // ── 14. Synchronisation continue ────────────────────────────────────
  synchroniser: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive(), rawData: z.record(z.unknown()) }))
    .mutation(({ ctx, input }) => synchroniserVehicule({ ...input, actorId: ctx.user.uid })),

  signalerIndisponibilite: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => signalerIndisponibiliteFournisseur({ ...input, actorId: ctx.user.uid })),

  signalerErreurSync: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ input }) => signalerErreurSync(input)),

  // ── 15-16. Réservation / vente ───────────────────────────────────────
  reserver: adminProcedure
    .input(
      z.object({
        vehicleItemId: z.number().int().positive(),
        reservedBy: z.number().int().positive().optional(),
        reservedUntil: z.coerce.date().optional(),
        bookingId: z.number().int().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) => reserverVehicule({ ...input, actorId: ctx.user.uid })),

  libererReservation: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => libererReservation({ ...input, actorId: ctx.user.uid })),

  marquerVendu: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(({ ctx, input }) => marquerVendu({ ...input, actorId: ctx.user.uid })),

  // ── 17. Retrait ───────────────────────────────────────────────────────
  retirer: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive(), reason: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => retirerVehicule({ ...input, actorId: ctx.user.uid })),

  // ── Vehicle Condition Engine ─────────────────────────────────────────
  ajouterRapportEtat: adminProcedure
    .input(
      z.object({
        vehicleItemId: z.number().int().positive(),
        stage: z.enum(CONDITION_STAGES),
        kilometrage: z.number().int().min(0).optional(),
        notes: z.string().max(4000).optional(),
        photos: z.array(z.string().url().max(1000)).max(100).optional(),
        videos: z.array(z.string().url().max(1000)).max(20).optional(),
      }),
    )
    .mutation(({ ctx, input }) => ajouterRapportEtat({ ...input, reportedBy: ctx.user.uid })),
});

export * as vehicleEngineSchema from "./schema.js";
export * as vehicleEngineContract from "./contract.js";
export { VEHICLE_ENGINE_META };
