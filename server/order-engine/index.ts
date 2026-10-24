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
import { lancerAssistantDepot, preparerPublicationAssistee, publierEtLierVehiculeSurCommande } from "./vehicule-sur-commande-ia.js";
import { INTERNAL_ORDER_STATUSES, LISTING_CREATION_MODES, ORDER_DECISIONS, ORDER_DOCUMENT_TYPES, ORDER_ENGINE_META } from "./contract.js";
import {
  OrderEngineError,
  VERSION,
  attribuerEmploye,
  avancerStatut,
  controlCenterFeed,
  creerCheckoutAcompte,
  creerCheckoutSolde,
  creerCommande,
  dashboard,
  deriveCustomerStatus,
  enregistrerAnnonceSurCommande,
  enregistrerDocument,
  genererDocumentCommande,
  healthStatus,
  journalAudit,
  listerCommandesClient,
  listerCommandesEmploye,
  listerDocuments,
  obtenirCommandeDetail,
  obtenirLabelPublicParAnnonce,
  obtenirListingParAnnonce,
  poserDecision,
  rembourserCommande,
  validerPrixEtMarge,
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

  // Lie une annonce déjà publiée (mode assisté par IA OU bouton « Manuel »,
  // jamais l'inverse — voir section « règle Manuel », demande PDG du 21/10)
  // à son fournisseur, avant même toute commande client.
  enregistrerAnnonceSurCommande: adminProcedure
    .input(
      z.object({
        annonceId: z.number().int().positive(),
        supplierProfileId: z.number().int().positive(),
        vehicleItemId: z.number().int().positive().optional(),
        creationMode: z.enum(LISTING_CREATION_MODES),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await enregistrerAnnonceSurCommande({ ...input, employeeId: ctx.user.uid });
      } catch (e) {
        toTrpcError(e);
      }
    }),

  // ── Mode assisté par IA (sections 2, 4, 5, demande PDG) : outil d'aide
  // uniquement, jamais une condition. Réutilise le Vehicle Engine existant.
  assistantDepot: adminProcedure
    .input(
      z.object({
        supplierProfileId: z.number().int().positive(),
        supplierVehicleId: z.string().min(1).max(128),
        ingestMethod: z.string().min(1).max(32),
        rawData: z.record(z.unknown()),
      }),
    )
    .mutation(({ input, ctx }) => lancerAssistantDepot({ ...input, actorId: ctx.user.uid })),

  preparerPublicationAssistee: adminProcedure
    .input(
      z.object({
        vehicleItemId: z.number().int().positive(),
        supplierPrice: z.number().positive(),
        supplierCurrency: z.string().min(3).max(8),
        commissionRatePct: z.number().min(0).max(100),
        pickupCity: z.string().max(120).optional(),
        pickupCountryCode: z.string().min(2).max(4).optional(),
      }),
    )
    .mutation(({ input, ctx }) => preparerPublicationAssistee({ ...input, actorId: ctx.user.uid })),

  // Publication réelle : réservée aux comptes internes (employé compris, demande PDG
  // du 23/10 — l'employé qui dépose l'annonce doit pouvoir la publier), jamais une
  // mise en ligne automatique, jamais un particulier ou un autre type de compte.
  publierVehiculeSurCommande: adminProcedure
    .input(z.object({ vehicleItemId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await publierEtLierVehiculeSurCommande({ vehicleItemId: input.vehicleItemId, actorId: ctx.user.uid });
      } catch (e) {
        toTrpcError(e);
      }
    }),

  // Statut public dérivé (sections 3 et 6) — appelé par `annonces.get`,
  // jamais en lisant `order_items` directement depuis un autre moteur.
  labelPublic: publicProcedure.input(z.object({ annonceId: z.number().int().positive() })).query(({ input }) => obtenirLabelPublicParAnnonce(input.annonceId)),

  // Le client ne connaît et ne transmet jamais vehicleItemId/supplierProfileId
  // (confidentiels, section 6) : l'engine les relit depuis l'annonce liée.
  creerCommande: protectedProcedure
    .input(z.object({ annonceId: z.number().int().positive(), currency: z.string().length(3).optional() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await creerCommande({ annonceId: input.annonceId, customerId: ctx.user.uid, currency: input.currency });
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

  // Étape 8 « Prix et marge validés » : toujours une saisie humaine. Le
  // prix fournisseur reste strictement confidentiel (jamais lu côté client).
  validerPrixEtMarge: adminProcedure
    .input(
      z.object({
        orderItemId: z.number().int().positive(),
        totalAmount: z.number().positive(),
        depositAmount: z.number().nonnegative(),
        balanceAmount: z.number().nonnegative(),
        supplierPrice: z.number().positive(),
        currency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        return await validerPrixEtMarge({ ...input, actorId: ctx.user.uid });
      } catch (e) {
        toTrpcError(e);
      }
    }),

  // Paiement réel (Stripe, jamais un second système) — toujours à
  // l'initiative du client ; la confirmation n'arrive que par webhook.
  creerCheckoutAcompte: protectedProcedure
    .input(z.object({ orderItemId: z.number().int().positive(), successPath: z.string(), cancelPath: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await creerCheckoutAcompte({ orderItemId: input.orderItemId, customerId: ctx.user.uid, successPath: input.successPath, cancelPath: input.cancelPath });
      } catch (e) {
        toTrpcError(e);
      }
    }),

  creerCheckoutSolde: protectedProcedure
    .input(z.object({ orderItemId: z.number().int().positive(), successPath: z.string(), cancelPath: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await creerCheckoutSolde({ orderItemId: input.orderItemId, customerId: ctx.user.uid, successPath: input.successPath, cancelPath: input.cancelPath });
      } catch (e) {
        toTrpcError(e);
      }
    }),

  // Section 11 — génère réellement un document via le Document OS existant.
  genererDocument: adminProcedure
    .input(z.object({ orderItemId: z.number().int().positive(), documentType: z.enum(ORDER_DOCUMENT_TYPES) }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await genererDocumentCommande({ orderItemId: input.orderItemId, documentType: input.documentType, actorId: ctx.user.uid });
      } catch (e) {
        toTrpcError(e);
      }
    }),

  rembourserCommande: adminProcedure
    .input(
      z.object({
        orderItemId: z.number().int().positive(),
        amount: z.number().positive(),
        currency: z.string().length(3),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await rembourserCommande({ orderItemId: input.orderItemId, amount: input.amount, currency: input.currency, actorId: ctx.user.uid, note: input.note });
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
        // Adresse exacte de remise (demande PDG) : jamais sur la fiche produit
        // publique (annonces.get) — communiquée au client uniquement une fois
        // sa propre commande sortie de « véhicule sélectionné » (disponibilité
        // confirmée ou au-delà), jamais avant.
        const listing = commande.status !== "vehicule_selectionne" ? await obtenirListingParAnnonce(commande.annonceId) : null;
        return {
          orderItemId: commande.id,
          reference: commande.reference,
          statutClient: deriveCustomerStatus(commande.status as never, decision?.decision as never),
          estimatedReadyAt: commande.estimatedReadyAt,
          totalAmount: commande.totalAmount,
          depositAmount: commande.depositAmount,
          balanceAmount: commande.balanceAmount,
          // Jamais l'id de paiement interne — seulement « payé ou non ».
          depositPaid: commande.depositPaymentRef !== null,
          balancePaid: commande.balancePaymentRef !== null,
          currency: commande.currency,
          documents,
          etapes: historique.length,
          exactPickupAddress: listing?.exactPickupAddress ?? null,
        };
      } catch (e) {
        toTrpcError(e);
      }
    }),
});

export * as orderEngineSchema from "./schema.js";
export * as orderEngineContract from "./contract.js";
export { ORDER_ENGINE_META };
