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
import { router, adminProcedure, directionProcedure, pdgProcedure } from "../trpc.js";
import { MEMORY_SCOPES, memorySummary, recall } from "./memory.js";
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
  // ── Lecture (PDG + Directeur) ────────────────────────────────────────
  // Lecture ouverte à la Direction (super_admin + admin). Les actions
  // sensibles (setState) restent réservées au PDG (super_admin).
  list: directionProcedure.query(async () => {
    return listEngines();
  }),

  stats: directionProcedure.query(async () => {
    return getStats();
  }),

  get: directionProcedure
    .input(z.object({ name: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      return getEngine(input.name);
    }),

  events: directionProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      return listEvents(input?.limit ?? 100);
    }),

  healthLog: directionProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        limit: z.number().int().min(1).max(200).default(50),
      }),
    )
    .query(async ({ input }) => {
      return getHealthLog(input.name, input.limit);
    }),

  adminLog: directionProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(async ({ input }) => {
      return getAdminLog(input?.limit ?? 100);
    }),

  // ── Contrats des moteurs (PR 2) ──────────────────────────────────────
  contracts: directionProcedure.query(async () => {
    return contractSummary();
  }),

  allContracts: directionProcedure.query(async () => {
    return ENGINE_CONTRACTS;
  }),

  contract: directionProcedure
    .input(z.object({ id: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      return getContract(input.id) ?? null;
    }),

  /**
   * Vue temps réel pour le Centre PDG : fusionne le contrat et l'état
   * enregistré (état, santé, dernier heartbeat) de chaque moteur.
   */
  contractsHealth: directionProcedure.query(async () => {
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

  // ── Mémoire des moteurs (point 40) ───────────────────────────────────
  // Ce que chaque moteur a réellement retenu, rangé par domaine. Lecture
  // seule : consulter une mémoire ne déclenche aucune action.
  memoryScopes: directionProcedure.query(() => MEMORY_SCOPES),

  memorySummary: directionProcedure.query(async () => {
    return memorySummary();
  }),

  memory: directionProcedure
    .input(
      z.object({
        engine: z.string().min(1).max(64),
        scope: z.enum(MEMORY_SCOPES).optional(),
        limit: z.number().int().min(1).max(500).default(100),
      }),
    )
    .query(async ({ input }) => {
      return recall(input.engine, input.scope, input.limit);
    }),
});
