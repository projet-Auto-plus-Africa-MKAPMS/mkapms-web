/**
 * MKA.P-MS Payment Orchestrator (point 29).
 *
 * Moteur séparé du Payment Engine : le Payment Engine encaisse et suit la
 * transaction, l'orchestrateur décide QUI encaisse. Cette séparation permet
 * d'ajouter un prestataire — ou d'en retirer un dans un pays — sans toucher
 * au checkout ni aux univers métier.
 */
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc.js";
import {
  listProviders,
  orchestratorHealth,
  seedProviders,
  selectProvider,
  setProviderActive,
} from "./service.js";

export const PAYMENT_ORCHESTRATOR_META = {
  code: "payment_orchestrator",
  name: "Payment Orchestrator",
  role: "Sélection du prestataire de paiement selon pays, devise, service, disponibilité et préférence.",
} as const;

export const paymentOrchestratorRouter = router({
  /** Registre public : quels prestataires existent, lesquels sont réellement branchés. */
  providers: publicProcedure.query(() => listProviders()),

  /** Qui encaisserait ce paiement ? Utilisé avant d'afficher un bouton payant. */
  resolve: publicProcedure
    .input(
      z.object({
        countryCode: z.string().min(2).max(4),
        currency: z.string().min(3).max(8),
        service: z.string().max(64).optional(),
        method: z.string().max(24).optional(),
        preferred: z.string().max(32).optional(),
      }),
    )
    .query(({ input }) =>
      selectProvider({
        countryCode: input.countryCode.toUpperCase(),
        currency: input.currency.toUpperCase(),
        service: input.service ?? null,
        method: input.method ?? null,
        preferred: input.preferred ?? null,
      }),
    ),

  health: adminProcedure.query(() => orchestratorHealth()),

  setActive: adminProcedure
    .input(z.object({ code: z.string().min(1).max(32), active: z.boolean() }))
    .mutation(({ input }) => setProviderActive(input.code, input.active)),

  seed: adminProcedure.mutation(() => seedProviders()),
});

export { seedProviders, orchestratorHealth, selectProvider, routePayment, NO_PROVIDER_REASON } from "./service.js";
