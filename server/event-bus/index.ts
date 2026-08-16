/**
 * Points 104-107 — Event Bus central (accès PDG / Direction).
 */
import { z } from "zod";
import { router, adminProcedure } from "../trpc.js";
import { EVENT_TYPES, SUBSCRIPTIONS } from "./catalog.js";
import {
  dispatchHistory,
  dispatchPending,
  emit,
  observability,
  recentDeliveries,
  setSubscriptionActive,
} from "./service.js";

export const eventBusRouter = router({
  /** Contrat du bus : ce qui peut être publié et qui l'écoute. */
  catalogue: adminProcedure.query(() => ({ types: EVENT_TYPES, abonnements: SUBSCRIPTIONS })),

  /** Point 107 — ce qui circule, ce qui arrive, ce qui n'arrive pas. */
  observabilite: adminProcedure.query(() => observability()),

  remises: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
    .query(({ input }) => recentDeliveries(input?.limit ?? 50)),

  passes: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(100).default(20) }).optional())
    .query(({ input }) => dispatchHistory(input?.limit ?? 20)),

  /** Reprend les événements en attente ou en échec. */
  distribuer: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .mutation(({ input, ctx }) =>
      dispatchPending({
        limit: input?.limit ?? 100,
        trigger: "manuel",
        requestedBy: ctx.user?.uid,
      }),
    ),

  /** Publication manuelle — sert au contrôle d'une chaîne de bout en bout. */
  publier: adminProcedure
    .input(
      z.object({
        type: z.string().min(3).max(128),
        payload: z.record(z.unknown()).default({}),
      }),
    )
    .mutation(({ input }) => emit({ source: "pdg", type: input.type, payload: input.payload })),

  basculerAbonnement: adminProcedure
    .input(z.object({ id: z.number().int().positive(), actif: z.boolean() }))
    .mutation(({ input }) => setSubscriptionActive(input.id, input.actif)),
});
