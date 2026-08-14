/**
 * MKA.P-MS Payment Engine — Sub-router TRPC (connexion contrôlée).
 *
 * Utilisateur connecté : créer une transaction, lister ses paiements, gérer ses RIB.
 * PDG : centre de contrôle (stats, transactions, virements, statuts, remboursements,
 * règles par pays, vérification RIB).
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  router,
  publicProcedure,
  protectedProcedure,
  proProcedure,
  pdgProcedure,
} from "../trpc.js";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "./constants.js";
import {
  createTransaction,
  getTransaction,
  getByReference,
  listByUser,
  setStatus,
  getEvents,
  createBankTransfer,
  reconcileBankTransfer,
  listPendingBankTransfers,
  createRefund,
  addProRib,
  listProRib,
  verifyProRib,
  getCountryRule,
  upsertCountryRule,
  listCountryRules,
  getStats,
  listTransactions,
} from "./service.js";
import { createPaymentCheckout, type PaymentKind } from "./checkout.js";
import { paymentAudit } from "./audit.js";
import { paymentChainAudit } from "./chain-audit.js";
import {
  listProducts,
  resolveProduct,
  computePrice,
  seedProducts,
  upsertProduct,
} from "./products.js";

const method = z.enum(PAYMENT_METHODS);
const status = z.enum(PAYMENT_STATUSES);

/**
 * Correspondance registre produit → encaissement branché.
 *
 * D'abord par code produit (cas nommés), puis par cas de paiement. Un cas
 * absent de ces tables n'est pas encaissé « en attendant » : la demande est
 * refusée avec son motif, car le webhook ne saurait pas quoi confirmer.
 */
const KIND_BY_PRODUCT_CODE: Record<string, PaymentKind> = {
  carte_grise_service: "carte_grise_service",
  kyc_verification: "kyc_verification",
  depotvente_frais: "depotvente_frais",
};
const KIND_BY_PAYMENT_CASE: Record<string, PaymentKind> = {
  boost_annonce: "annonce_boost",
  photos_supplementaires: "annonce_boost",
  depot_annonce: "depotvente_frais",
  garage: "garage_prestation",
};

export const paymentEngineRouter = router({
  // ── Utilisateur connecté ──────────────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        entityType: z.string().max(32).optional(),
        entityId: z.string().max(64).optional(),
        univers: z.string().max(48).optional(),
        service: z.string().max(64).optional(),
        amount: z.number().positive(),
        currency: z.string().max(8).optional(),
        method: method.optional(),
        countryCode: z.string().max(4).optional(),
        metadata: z.unknown().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createTransaction({ ...input, userId: ctx.user.uid });
    }),

  mine: protectedProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(100) }).optional())
    .query(async ({ ctx, input }) => {
      return listByUser(ctx.user.uid, input?.limit ?? 100);
    }),

  byReference: protectedProcedure
    .input(z.object({ reference: z.string().min(1).max(40) }))
    .query(async ({ ctx, input }) => {
      const tx = await getByReference(input.reference);
      if (!tx) return null;
      // Un utilisateur ne voit que ses propres transactions (le PDG passe par le
      // centre de contrôle).
      if (tx.userId !== ctx.user.uid && ctx.user.role !== "super_admin") return null;
      return tx;
    }),

  countryRule: protectedProcedure
    .input(z.object({ countryCode: z.string().max(4).default("FR") }))
    .query(async ({ input }) => {
      return getCountryRule(input.countryCode);
    }),

  // ── Registre central des produits & tarifs (Phase 24) ─────────────────
  // Liste publique (prix affichés aux visiteurs) : uniquement les produits actifs.
  products: publicProcedure.query(async () => {
    return listProducts(true);
  }),

  // Résolution serveur d'un prix depuis un code produit. Le prix ne vient
  // jamais du navigateur : on renvoie le détail calculé côté serveur.
  productPrice: publicProcedure
    .input(z.object({ code: z.string().min(1).max(64), quantity: z.number().int().min(1).max(50).default(1) }))
    .query(async ({ input }) => {
      const product = await resolveProduct(input.code);
      return { product, price: computePrice(product, input.quantity) };
    }),

  /**
   * Démarrage d'un encaissement à partir d'un code produit du registre.
   *
   * Sert aux écrans de service (démarches administratives, options payantes…)
   * qui n'ont pas d'entité métier propre à facturer. Le montant vient du
   * registre central, jamais du navigateur, et le retour est un chemin interne
   * validé : une URL externe fournie par le client est refusée.
   */
  startProductCheckout: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(50).default(1),
        returnPath: z.string().min(1).max(200).regex(/^\/[A-Za-z0-9\-_/?=&.]*$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const product = await resolveProduct(input.code);
      const kind = KIND_BY_PRODUCT_CODE[product.code] ?? KIND_BY_PAYMENT_CASE[product.paymentCase];
      if (!kind) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Aucun encaissement en ligne n'est branché pour « ${product.paymentCase} » (produit ${product.code}).`,
        });
      }
      const sep = input.returnPath.includes("?") ? "&" : "?";
      return createPaymentCheckout({
        userId: ctx.user.uid,
        kind,
        productCode: product.code,
        quantity: input.quantity,
        successPath: `${input.returnPath}${sep}paid=1`,
        cancelPath: `${input.returnPath}${sep}canceled=1`,
        countryCode: product.countryCode,
      });
    }),

  // ── RIB professionnels ────────────────────────────────────────────────
  addRib: proProcedure
    .input(
      z.object({
        holder: z.string().min(1).max(160),
        iban: z.string().min(5).max(40),
        bic: z.string().max(16).optional(),
        countryCode: z.string().max(4).optional(),
        bankName: z.string().max(120).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return addProRib({ ...input, userId: ctx.user.uid });
    }),

  myRibs: proProcedure.query(async ({ ctx }) => {
    return listProRib(ctx.user.uid);
  }),

  // ── Centre de contrôle PDG ────────────────────────────────────────────
  stats: pdgProcedure.query(async () => {
    return getStats();
  }),

  // Audit de couverture (Phase 23) — observe et rapporte uniquement.
  audit: pdgProcedure.query(async () => {
    return paymentAudit();
  }),

  // Audit mondial de bout en bout (point 28) : chaque maillon avec sa preuve.
  chainAudit: pdgProcedure.query(async () => {
    return paymentChainAudit();
  }),

  // ── Registre produits (administration PDG) ────────────────────────────
  productsAll: pdgProcedure.query(async () => {
    return listProducts(false);
  }),

  seedProducts: pdgProcedure.mutation(async () => {
    return seedProducts();
  }),

  upsertProduct: pdgProcedure
    .input(
      z.object({
        code: z.string().min(1).max(64),
        name: z.string().min(1).max(160),
        univers: z.string().min(1).max(48),
        paymentCase: z.string().min(1).max(48),
        price: z.number().min(0),
        currency: z.string().max(8).optional(),
        vatRate: z.number().min(0).max(100).optional(),
        countryCode: z.string().max(4).optional(),
        paymentType: z.enum(["unique", "recurring"]).optional(),
        periodicity: z.enum(["monthly", "quarterly", "yearly"]).nullable().optional(),
        beneficiary: z.enum(["mkapms", "pro", "partner"]).optional(),
        commissionRate: z.number().min(0).max(100).optional(),
        validityDays: z.number().int().min(0).optional(),
        refundPolicy: z.string().max(500).nullable().optional(),
        active: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return upsertProduct(input);
    }),

  transactions: pdgProcedure
    .input(
      z
        .object({
          status: status.optional(),
          limit: z.number().int().min(1).max(500).default(200),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return listTransactions({ status: input?.status, limit: input?.limit });
    }),

  transaction: pdgProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ input }) => {
      const tx = await getTransaction(input.id);
      if (!tx) return null;
      return { transaction: tx, events: await getEvents(input.id) };
    }),

  setStatus: pdgProcedure
    .input(z.object({ id: z.number().int(), status }))
    .mutation(async ({ input }) => {
      return setStatus(input.id, input.status, { type: "manual_status_change" });
    }),

  pendingBankTransfers: pdgProcedure.query(async () => {
    return listPendingBankTransfers();
  }),

  createBankTransfer: pdgProcedure
    .input(
      z.object({
        transactionId: z.number().int(),
        beneficiary: z.string().min(1).max(160),
        iban: z.string().min(5).max(40),
        bic: z.string().max(16).optional(),
        expectedAmount: z.number().positive(),
        currency: z.string().max(8).optional(),
        dueInDays: z.number().int().min(1).max(365).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return createBankTransfer(input);
    }),

  reconcileBankTransfer: pdgProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      return reconcileBankTransfer(input.id, ctx.user.uid);
    }),

  createRefund: pdgProcedure
    .input(
      z.object({
        transactionId: z.number().int(),
        amount: z.number().positive(),
        reason: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return createRefund({ ...input, createdBy: ctx.user.uid });
    }),

  verifyRib: pdgProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      return verifyProRib(input.id);
    }),

  countryRules: pdgProcedure.query(async () => {
    return listCountryRules();
  }),

  upsertCountryRule: pdgProcedure
    .input(
      z.object({
        countryCode: z.string().min(2).max(4),
        currency: z.string().min(2).max(8),
        methods: z.array(z.string().max(24)),
        active: z.boolean().optional(),
        notes: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return upsertCountryRule(input);
    }),
});
