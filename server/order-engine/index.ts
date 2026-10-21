/**
 * Order Engine — router tRPC (Plan Maître Fournisseurs §36-37, section
 * "COMMANDES"). Portail « Véhicule sur commande » (demande PDG).
 *
 * Toute action qui engage réellement la plateforme (créer une commande,
 * attribuer un employé, avancer un statut, poser la décision finale) reste
 * réservée aux comptes internes (`adminProcedure`) — jamais déclenchée
 * automatiquement. Le client ne peut que consulter ses propres commandes.
 */
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import { INTERNAL_ORDER_STATUSES, ORDER_DECISIONS, ORDER_DOCUMENT_TYPES, ORDER_ENGINE_META } from "./contract.js";
import {
  OrderEngineError,
  VERSION,
  attribuerEmploye,
  avancerStatut,
  controlCenterFeed,
  creerCommande,
  dashboard,
  deriveCustomerStatus,
  enregistrerDocument,
  healthStatus,
  journalAudit,
  listerCommandesClient,
  listerCommandesEmploye,
  listerDocuments,
  obtenirCommandeDetail,
  poserDecision,
} from "./service.js";

function toTrpcError(e: unknown): never {
  if (e instanceof OrderEngineError) {
    throw new Error(e.message);
  }
  throw e;
}

export const orderEngineRouter = router({
  meta: publicProcedure.query(() => ({ ...ORDER_ENGINE_META, version: VERSION })),
  // healthStatus est volontairement sans authentification (sondé par le
  // Monitoring Operating System / l'Engine Registry, règle MOS #13).
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  creerCommande: adminProcedure
    .input(
      z.object({
        vehicleItemId: z.number().int().positive(),
        annonceId: z.number().int().positive(),
        supplierProfileId: z.number().int().positive(),
        customerId: z.number().int().positive(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await creerCommande(input);
      } catch (e) {
        toTrpcError(e);
      }
    }),

  attribuerEmploye: adminProcedure
    .input(z.object({ orderItemId: z.number().int().positive(), employeeId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await attribuerEmploye({ orderItemId: input.orderItemId, employeeId: input.employeeId, actorId: ctx.user.uid });
        return { ok: true };
      } catch (e) {
        toTrpcError(e);
      }
    }),

  avancerStatut: adminProcedure
    .input(
      z.object({
        orderItemId: z.number().int().positive(),
        to: z.enum(INTERNAL_ORDER_STATUSES),
        actorType: z.enum(["systeme", "employe", "fournisseur", "client"]),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await avancerStatut({ orderItemId: input.orderItemId, to: input.to, actorType: input.actorType, actorId: ctx.user.uid, note: input.note });
      } catch (e) {
        toTrpcError(e);
      }
    }),

  poserDecision: adminProcedure
    .input(
      z.object({
        orderItemId: z.number().int().positive(),
        decision: z.enum(ORDER_DECISIONS),
        note: z.string().max(2000).optional(),
        returnReference: z.string().max(64).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await poserDecision({ orderItemId: input.orderItemId, decision: input.decision, decidedBy: ctx.user.uid, note: input.note, returnReference: input.returnReference });
        return { ok: true };
      } catch (e) {
        toTrpcError(e);
      }
    }),

  enregistrerDocument: adminProcedure
    .input(
      z.object({
        orderItemId: z.number().int().positive(),
        documentType: z.enum(ORDER_DOCUMENT_TYPES),
        docDocumentId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await enregistrerDocument({ orderItemId: input.orderItemId, documentType: input.documentType, docDocumentId: input.docDocumentId, generatedBy: ctx.user.uid });
      } catch (e) {
        toTrpcError(e);
      }
    }),

  // ── Vue employé (section 7, demande PDG) ────────────────────────────
  mesVehiculesAttribues: adminProcedure.query(({ ctx }) => listerCommandesEmploye(ctx.user.uid)),

  detailCommandeEmploye: adminProcedure
    .input(z.object({ orderItemId: z.number().int().positive() }))
    .query(async ({ input }) => {
      try {
        const detail = await obtenirCommandeDetail(input.orderItemId);
        const documents = await listerDocuments(input.orderItemId, { employeeView: true });
        return { ...detail, documents };
      } catch (e) {
        toTrpcError(e);
      }
    }),

  journalAudit: adminProcedure.input(z.object({ orderItemId: z.number().int().positive() })).query(({ input }) => journalAudit(input.orderItemId)),

  // ── Vue client (section 9, demande PDG) : jamais les étapes internes ──
  mesCommandes: protectedProcedure.query(({ ctx }) => listerCommandesClient(ctx.user.uid)),

  detailCommandeClient: protectedProcedure
    .input(z.object({ orderItemId: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      try {
        const { commande, historique, decision } = await obtenirCommandeDetail(input.orderItemId);
        if (commande.customerId !== ctx.user.uid) throw new Error("Accès refusé.");
        const documents = await listerDocuments(input.orderItemId, { employeeView: false });
        return {
          reference: commande.reference,
          statutClient: deriveCustomerStatus(commande.status as never, decision?.decision as never),
          estimatedReadyAt: commande.estimatedReadyAt,
          totalAmount: commande.totalAmount,
          depositAmount: commande.depositAmount,
          balanceAmount: commande.balanceAmount,
          currency: commande.currency,
          documents,
          etapes: historique.length,
        };
      } catch (e) {
        toTrpcError(e);
      }
    }),
});

export * as orderEngineSchema from "./schema.js";
export * as orderEngineContract from "./contract.js";
export { ORDER_ENGINE_META };
