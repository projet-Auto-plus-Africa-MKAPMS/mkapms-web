/**
 * Document Engine — router tRPC (LOT 6 du Plan Maître Fournisseurs).
 * Usage interne (Direction/admin). Les documents eux-mêmes restent
 * consultables via `documentOs.*` (Document OS, inchangé).
 */
import { z } from "zod";
import { adminProcedure, directionProcedure, publicProcedure, router } from "../trpc.js";
import {
  auditLog,
  checkStepBlocking,
  computeVehicleExportReadiness,
  controlCenterFeed,
  dashboard,
  defineCustodyRequirement,
  handOverCustody,
  healthStatus,
  listCustodyRecords,
  listCustodyRequirements,
  listSupplierDocuments,
  listVehicleDocuments,
  receiveCustody,
  registerSupplierDocument,
  registerVehicleDocument,
  supplierDocumentGaps,
  vehicleDocumentGaps,
} from "./service.js";
import {
  CUSTODY_ENTITY_TYPES,
  CUSTODY_KINDS,
  DOCUMENT_ENGINE_META,
  SUPPLIER_DOCUMENT_TYPES,
  VEHICLE_DOCUMENT_TYPES,
} from "./contract.js";

export const documentEngineRouter = router({
  meta: publicProcedure.query(() => DOCUMENT_ENGINE_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  // ── Supplier Document Engine (§33) ────────────────────────────────────
  registerSupplierDocument: adminProcedure
    .input(z.object({
      supplierProfileId: z.number().int().positive(),
      docType: z.enum(SUPPLIER_DOCUMENT_TYPES),
      ownerUserId: z.number().int().positive().optional(),
      amountTtc: z.number().nonnegative().optional(),
      currency: z.string().max(4).optional(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(({ ctx, input }) => registerSupplierDocument({ ...input, actorId: ctx.user.uid })),

  listSupplierDocuments: adminProcedure.input(z.object({ supplierProfileId: z.number().int().positive() })).query(({ input }) => listSupplierDocuments(input.supplierProfileId)),

  supplierDocumentGaps: adminProcedure.input(z.object({ supplierProfileId: z.number().int().positive() })).query(({ input }) => supplierDocumentGaps(input.supplierProfileId)),

  // ── Vehicle Document Engine (§34) ─────────────────────────────────────
  registerVehicleDocument: adminProcedure
    .input(z.object({
      vehicleItemId: z.number().int().positive(),
      docType: z.enum(VEHICLE_DOCUMENT_TYPES),
      ownerUserId: z.number().int().positive().optional(),
      notes: z.string().max(2000).optional(),
    }))
    .mutation(({ ctx, input }) => registerVehicleDocument({ ...input, actorId: ctx.user.uid })),

  listVehicleDocuments: adminProcedure.input(z.object({ vehicleItemId: z.number().int().positive() })).query(({ input }) => listVehicleDocuments(input.vehicleItemId)),

  vehicleDocumentGaps: adminProcedure.input(z.object({ vehicleItemId: z.number().int().positive() })).query(({ input }) => vehicleDocumentGaps(input.vehicleItemId)),

  checkVehicleExportReadiness: adminProcedure.input(z.object({ vehicleItemId: z.number().int().positive() })).query(({ input }) => computeVehicleExportReadiness(input.vehicleItemId)),

  // ── Document Custody Engine (§35) ─────────────────────────────────────
  receiveCustody: adminProcedure
    .input(z.object({
      entityType: z.enum(CUSTODY_ENTITY_TYPES),
      entityId: z.number().int().positive(),
      docType: z.string().min(1).max(48),
      kind: z.enum(CUSTODY_KINDS).optional(),
      currentHolder: z.string().min(1).max(160),
      docDocumentId: z.number().int().positive().optional(),
    }))
    .mutation(({ ctx, input }) => receiveCustody({ ...input, actorId: ctx.user.uid })),

  handOverCustody: adminProcedure
    .input(z.object({ custodyId: z.number().int().positive(), recipient: z.string().min(1).max(160), proofOfHandover: z.string().min(1).max(2000) }))
    .mutation(({ ctx, input }) => handOverCustody({ ...input, actorId: ctx.user.uid })),

  listCustodyRecords: adminProcedure.input(z.object({ entityType: z.enum(CUSTODY_ENTITY_TYPES), entityId: z.number().int().positive() })).query(({ input }) => listCustodyRecords(input.entityType, input.entityId)),

  // Décision engageante (une exigence bloque un flux métier) : Direction uniquement.
  defineCustodyRequirement: directionProcedure
    .input(z.object({ entityType: z.enum(CUSTODY_ENTITY_TYPES), step: z.string().min(1).max(48), docType: z.string().min(1).max(48), mandatory: z.boolean().optional() }))
    .mutation(({ ctx, input }) => defineCustodyRequirement({ ...input, actorId: ctx.user.uid })),

  listCustodyRequirements: adminProcedure.input(z.object({ entityType: z.enum(CUSTODY_ENTITY_TYPES), step: z.string().max(48).optional() })).query(({ input }) => listCustodyRequirements(input.entityType, input.step)),

  checkStepBlocking: adminProcedure.input(z.object({ entityType: z.enum(CUSTODY_ENTITY_TYPES), entityId: z.number().int().positive(), step: z.string().min(1).max(48) })).query(({ input }) => checkStepBlocking(input)),

  auditLog: adminProcedure.input(z.object({ entityType: z.string().max(32).optional(), entityId: z.number().int().positive().optional(), limit: z.number().int().min(1).max(500).optional() }).optional()).query(({ input }) => auditLog(input?.entityType, input?.entityId, input?.limit)),
});

export * as documentEngineSchema from "./schema.js";
export * as documentEngineContract from "./contract.js";
export { DOCUMENT_ENGINE_META };
export { checkStepBlocking, seedDocumentTypes } from "./service.js";
