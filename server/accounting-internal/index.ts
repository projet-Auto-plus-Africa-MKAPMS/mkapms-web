/**
 * MKA.P-MS Internal Accounting Engine (point 26 A).
 *
 * Comptabilité interne de la plateforme : rapprochement des paiements avec les
 * écritures, contrôle des écarts, santé du moteur. Séparé de la marketplace
 * de comptables indépendants.
 */
import { z } from "zod";
import { adminProcedure, router } from "../trpc.js";
import {
  internalAccountingHealth,
  listRapprochements,
  listUnreconciled,
  reconcilePayments,
} from "./service.js";

export const ACCOUNTING_INTERNAL_META = {
  code: "accounting_internal",
  name: "Internal Accounting Engine",
  role: "Comptabilité interne MKA.P-MS : rapprochement paiement ↔ écriture, écarts et contrôle.",
} as const;

export const accountingInternalRouter = router({
  reconcile: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(2000).optional() }).optional())
    .mutation(({ input }) => reconcilePayments(input?.limit ?? 500)),

  rapprochements: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional())
    .query(({ input }) => listRapprochements(input?.limit ?? 100)),

  /** Paiements encaissés sans écriture : la liste à traiter. */
  unreconciled: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional())
    .query(({ input }) => listUnreconciled(input?.limit ?? 100)),

  health: adminProcedure.query(() => internalAccountingHealth()),
});

export { reconcilePayments, internalAccountingHealth } from "./service.js";
