/**
 * Logistics Engine — router tRPC (LOT 4 du Plan Maître Fournisseurs,
 * TRANSPORT/LIVRAISON). Usage interne (Direction/admin) : la surface
 * externe pour les transporteurs est `server/logistics-engine/api.ts`
 * (REST, clé API dédiée), jamais tRPC.
 */
import { z } from "zod";
import { adminProcedure, directionProcedure, publicProcedure, router } from "../trpc.js";
import {
  choisirOptionDevis,
  controlCenterFeed,
  creerCleApiTransporteur,
  creerExpedition,
  dashboard,
  enregistrerConnexionTransporteur,
  genererDevis,
  healthStatus,
  journalAudit,
  listerClesApiTransporteur,
  listerConnexionsTransporteur,
  listerExpeditions,
  mettreAJourStatutLeg,
  obtenirSuiviExpedition,
  reserverExpedition,
  testerConnexionTransporteur,
  VERSION,
} from "./service.js";
import { CARRIER_CATALOG, CARRIER_CATEGORIES, LOGISTICS_ENGINE_META, QUOTE_TIERS, TRACKING_STATUSES } from "./contract.js";

export const logisticsEngineRouter = router({
  meta: publicProcedure.query(() => ({ ...LOGISTICS_ENGINE_META, version: VERSION })),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  carrierCatalog: publicProcedure.query(() => CARRIER_CATALOG),

  // ── Carrier Connector Engine ─────────────────────────────────────────
  enregistrerConnexion: adminProcedure
    .input(
      z.object({
        carrierCode: z.string().min(1).max(32),
        method: z.string().min(1).max(32),
        supplierProfileId: z.number().int().positive().optional(),
        authType: z.string().max(16).optional(),
        environment: z.string().max(16).optional(),
        endpointUrl: z.string().max(1000).optional(),
        secretRef: z.string().max(128).optional(),
        config: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(({ ctx, input }) => enregistrerConnexionTransporteur({ ...input, actorId: ctx.user.uid })),

  testerConnexion: adminProcedure.input(z.object({ connectionId: z.number().int().positive() })).mutation(({ ctx, input }) => testerConnexionTransporteur(input.connectionId, ctx.user.uid)),

  listerConnexions: adminProcedure.input(z.object({ carrierCode: z.string().max(32).optional() }).optional()).query(({ input }) => listerConnexionsTransporteur(input?.carrierCode)),

  // ── Delivery Quote Engine ────────────────────────────────────────────
  genererDevis: adminProcedure
    .input(
      z.object({
        categorie: z.enum(CARRIER_CATEGORIES),
        origineVille: z.string().max(128).optional(),
        originePays: z.string().max(4).nullable(),
        destinationVille: z.string().max(128).optional(),
        destinationPays: z.string().max(4).nullable(),
        poidsKg: z.number().positive().optional(),
        valeurDeclaree: z.number().positive().optional(),
        devise: z.string().min(3).max(8).optional(),
        annonceId: z.number().int().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) => genererDevis({ ...input, actorId: ctx.user.uid })),

  // ── Delivery Routing Engine ──────────────────────────────────────────
  choisirOption: adminProcedure
    .input(z.object({ quoteId: z.number().int().positive(), tier: z.enum(QUOTE_TIERS) }))
    .mutation(({ ctx, input }) => choisirOptionDevis({ ...input, actorId: ctx.user.uid })),

  // ── Multi-Leg Engine ──────────────────────────────────────────────────
  creerExpedition: adminProcedure
    .input(
      z.object({
        sourceType: z.enum(["vehicle_engine", "parts_engine", "manuel", "api_transporteur"]).optional(),
        sourceItemId: z.number().int().positive().optional(),
        categorie: z.enum(CARRIER_CATEGORIES),
        origineVille: z.string().max(128).optional(),
        originePays: z.string().max(4).nullable(),
        destinationVille: z.string().max(128).optional(),
        destinationPays: z.string().max(4).nullable(),
        poidsKg: z.number().positive().optional(),
        valeurDeclaree: z.number().positive().optional(),
        devise: z.string().min(3).max(8).optional(),
        legs: z
          .array(
            z.object({
              carrierCode: z.string().min(1).max(32),
              mode: z.string().min(1).max(16),
              origineVille: z.string().max(128).optional(),
              originePays: z.string().max(4).optional(),
              destinationVille: z.string().max(128).optional(),
              destinationPays: z.string().max(4).optional(),
              tarif: z.number().positive().optional(),
              devise: z.string().min(3).max(8).optional(),
              delaiJoursMin: z.number().int().min(0).optional(),
              delaiJoursMax: z.number().int().min(0).optional(),
              responsabilite: z.string().max(2000).optional(),
              conditionPaiement: z.string().max(2000).optional(),
            }),
          )
          .min(1)
          .max(4),
      }),
    )
    .mutation(({ ctx, input }) => creerExpedition({ ...input, actorId: ctx.user.uid })),

  reserverExpedition: adminProcedure.input(z.object({ shipmentId: z.number().int().positive() })).mutation(({ ctx, input }) => reserverExpedition({ ...input, actorId: ctx.user.uid })),

  liste: adminProcedure.input(z.object({ categorie: z.enum(CARRIER_CATEGORIES).optional(), status: z.enum(TRACKING_STATUSES).optional() }).optional()).query(({ input }) => listerExpeditions(input)),

  detail: adminProcedure.input(z.object({ shipmentId: z.number().int().positive() })).query(({ input }) => obtenirSuiviExpedition(input.shipmentId)),

  auditLog: adminProcedure.input(z.object({ shipmentId: z.number().int().positive(), limit: z.number().int().min(1).max(500).default(200) })).query(({ input }) => journalAudit(input.shipmentId, input.limit)),

  // ── Tracking Engine ───────────────────────────────────────────────────
  mettreAJourStatut: adminProcedure
    .input(z.object({ legId: z.number().int().positive(), status: z.enum(TRACKING_STATUSES), rawCarrierStatus: z.string().max(255).optional(), detail: z.record(z.unknown()).optional() }))
    .mutation(({ ctx, input }) => mettreAJourStatutLeg({ ...input, source: "manuel", actorId: ctx.user.uid })),

  // ── API MKA.P-MS pour transporteurs (gestion des clés) ────────────────
  creerCleApi: directionProcedure
    .input(z.object({ carrierCode: z.string().min(1).max(32), name: z.string().min(2).max(160), scopes: z.string().max(255).optional() }))
    .mutation(({ ctx, input }) => creerCleApiTransporteur({ ...input, actorId: ctx.user.uid })),

  listerClesApi: adminProcedure.query(() => listerClesApiTransporteur()),
});

export * as logisticsEngineSchema from "./schema.js";
export * as logisticsEngineContract from "./contract.js";
export { LOGISTICS_ENGINE_META };
