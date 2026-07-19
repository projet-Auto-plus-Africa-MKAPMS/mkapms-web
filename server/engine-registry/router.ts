/**
 * MKA.P-MS Engine Registry — Sub-router TRPC (connexion contrôlée).
 *
 * Lecture (PDG) : liste des moteurs, statistiques, journaux.
 * Administration (PDG) : changement d'état d'un moteur (journalisé).
 * Interne (admin/moteurs) : heartbeat, publication d'événements.
 *
 * Le registre ne modifie aucune table existante : il coordonne uniquement.
 */
import { z } from "zod";
import { router, adminProcedure, pdgProcedure } from "../trpc.js";
import {
  listEngines,
  getEngine,
  setState,
  heartbeat,
  publishEvent,
  listEvents,
  getStats,
  getHealthLog,
  getAdminLog,
} from "./service.js";
import {
  ENGINE_CONTRACTS,
  getContract,
  contractSummary,
} from "./contracts.js";

const engineState = z.enum([
  "active",
  "read_only",
  "maintenance",
  "disabled",
  "staging",
]);
const engineHealth = z.enum(["ok", "degraded", "down", "unknown"]);

export const engineRegistryRouter = router({
  // ── Lecture (PDG) ────────────────────────────────────────────────────
  list: pdgProcedure.query(async () => {
    return listEngines();
  }),

  stats: pdgProcedure.query(async () => {
    return getStats();
  }),

  get: pdgProcedure
    .input(z.object({ name: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      return getEngine(input.name);
    }),

  events: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      return listEvents(input?.limit ?? 100);
    }),

  healthLog: pdgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    )
    .query(async ({ input }) => {
      return getHealthLog(input.name, input.limit);
    }),

  adminLog: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      return getAdminLog(input?.limit ?? 100);
    }),

  // ── Contrats des moteurs (PR 2) ──────────────────────────────────────
  contracts: pdgProcedure.query(async () => {
    return contractSummary();
  }),

  allContracts: pdgProcedure.query(async () => {
    return ENGINE_CONTRACTS;
  }),

  contract: pdgProcedure
    .input(z.object({ id: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      return getContract(input.id) ?? null;
    }),

  /**
   * Vue temps réel pour le Centre PDG : fusionne le contrat et l'état
   * enregistré (état, santé, dernier heartbeat) de chaque moteur.
   */
  contractsHealth: pdgProcedure.query(async () => {
    const engines = await listEngines();
    const byName = new Map(engines.map((e) => [e.name, e]));
    return ENGINE_CONTRACTS.map((c) => {
      const row = byName.get(c.id);
      return {
        id: c.id,
        publicName: c.publicName,
        version: c.version,
        declaredVersion: c.version,
        registeredVersion: row?.version ?? null,
        dependencies: c.dependencies,
        controlCenter: c.controlCenter,
        state: row?.state ?? "disabled",
        health: row?.health ?? "unknown",
        lastHeartbeat: row?.lastHeartbeat ?? null,
        registered: !!row,
      };
    });
  }),

  // ── Administration (PDG) ─────────────────────────────────────────────
  setState: pdgProcedure
    .input(z.object({ name: z.string().min(1).max(64), state: engineState }))
    .mutation(async ({ ctx, input }) => {
      return setState(input.name, input.state, ctx.user.uid);
    }),

  // ── Interne (admin / moteurs, appelé côté serveur) ────────────────────
  heartbeat: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        status: engineHealth,
        message: z.string().max(2000).optional(),
        version: z.string().max(32).optional(),
        metrics: z.unknown().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return heartbeat(input.name, input.status, {
        message: input.message,
        version: input.version,
        metrics: input.metrics,
      });
    }),

  publishEvent: adminProcedure
    .input(
      z.object({
        source: z.string().min(1).max(64),
        type: z.string().min(1).max(128),
        payload: z.unknown().optional(),
        targets: z.array(z.string().max(64)).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      return publishEvent(input);
    }),
});
