/**
 * MKA.P-MS Payment Engine — Sub-router TRPC (connexion contrôlée).
 *
 * Utilisateur connecté : créer une transaction, lister ses paiements, gérer ses RIB.
 * PDG : centre de contrôle (stats, transactions, virements, statuts, remboursements,
 * règles par pays, vérification RIB).
 */
import { z } from "zod";
import {
  router,
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
import { paymentAudit } from "./audit.js";

const method = z.enum(PAYMENT_METHODS);
const status = z.enum(PAYMENT_STATUSES);

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
