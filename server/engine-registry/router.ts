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
import { engineReadiness, OPERATIONAL_STATE_LABELS, registryOverview } from "./readiness.js";
import {
  dependencyGraph,
  impactOf,
  registryAnomalies,
  revertLastStateChange,
  validateStateChange,
} from "./dependencies.js";
import {
  AGENT_CHANGE_KINDS,
  AGENT_CHANGE_STATUSES,
  changeStats,
  declareChange,
  listChanges,
  reviewChange,
  syncAppliedMigrations,
} from "./agent-changes.js";
import {
  analyzeChangeImpact,
  analyzePendingChanges,
  impactSummary,
} from "./change-impact.js";
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
import { diagnoseAllEngines, diagnoseEngine, retryEngineSupervision } from "./diagnose.js";

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

  // ── Dépendances & anomalies (points 43-44) ───────────────────────────
  dependencyGraph: directionProcedure.query(async () => {
    return dependencyGraph();
  }),

  // ── Diagnostic & remédiation des moteurs dégradés/HS ─────────────────
  // Pourquoi ce moteur est-il dégradé ? Réponse actionnable, moteur par
  // moteur : tables manquantes, dépendances non satisfaites, feed OS KO.
  diagnose: directionProcedure.query(async () => {
    return diagnoseAllEngines();
  }),
  diagnoseOne: directionProcedure
    .input(z.object({ name: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      return diagnoseEngine(input.name);
    }),
  /** Relance manuelle de la supervision d'un moteur (sonde ou feed OS). */
  retrySupervision: pdgProcedure
    .input(z.object({ name: z.string().min(1).max(64) }))
    .mutation(async ({ input }) => {
      return retryEngineSupervision(input.name);
    }),

  impact: directionProcedure
    .input(z.object({ name: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      return impactOf(input.name);
    }),

  anomalies: directionProcedure.query(async () => {
    return registryAnomalies();
  }),

  /** Avis avant une action sensible. N'applique rien. */
  validateStateChange: directionProcedure
    .input(z.object({ name: z.string().min(1).max(64), state: engineState }))
    .query(async ({ input }) => {
      return validateStateChange(input.name, input.state);
    }),

  /** Retour arrière du dernier changement d'état journalisé. */
  revertState: pdgProcedure
    .input(z.object({ name: z.string().min(1).max(64) }))
    .mutation(async ({ ctx, input }) => {
      return revertLastStateChange(input.name, ctx.user.uid);
    }),

  // ── Administration (PDG) ─────────────────────────────────────────────
  /**
   * Changement d'état. Une action qui coupe des moteurs actifs exige
   * `confirm: true` : sans confirmation, l'impact exact est renvoyé et rien
   * n'est appliqué.
   */
  setStateChecked: pdgProcedure
    .input(
      z.object({
        name: z.string().min(1).max(64),
        state: engineState,
        confirm: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const validation = await validateStateChange(input.name, input.state);
      if (!validation.possible || (validation.confirmationRequise && !input.confirm)) {
        return { applied: false as const, validation, engine: null };
      }
      const engine = await setState(input.name, input.state, ctx.user.uid);
      return { applied: true as const, validation, engine };
    }),

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

  // ── Registre central complet (point 41) ──────────────────────────────
  // Cinq états opérationnels CALCULÉS (jamais déclarés), avec le motif.
  overview: directionProcedure.query(async () => {
    return registryOverview();
  }),

  operationalStateLabels: directionProcedure.query(() => OPERATIONAL_STATE_LABELS),

  readiness: directionProcedure
    .input(z.object({ name: z.string().min(1).max(64) }))
    .query(async ({ input }) => {
      return engineReadiness(input.name);
    }),

  // ── Journal des modifications d'agents (point 42) ────────────────────
  agentChanges: directionProcedure
    .input(
      z
        .object({
          kind: z.enum(AGENT_CHANGE_KINDS).optional(),
          status: z.enum(AGENT_CHANGE_STATUSES).optional(),
          limit: z.number().int().min(1).max(500).default(100),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return listChanges({
        kind: input?.kind,
        status: input?.status,
        limit: input?.limit ?? 100,
      });
    }),

  agentChangeStats: directionProcedure.query(async () => {
    return changeStats();
  }),

  /** Relève les migrations réellement appliquées en base. Lecture seule côté métier. */
  syncMigrations: pdgProcedure.mutation(async () => {
    const releve = await syncAppliedMigrations();
    // Point 68 : un dépôt relevé est analysé tout de suite, pas plus tard.
    const analyse = await analyzePendingChanges({ limit: 100 });
    return { ...releve, analyse };
  }),

  // ── Points 67-68 — analyse automatique après chaque dépôt ────────────
  changeImpact: directionProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input }) => {
      return analyzeChangeImpact(input.id);
    }),

  analyzeChanges: pdgProcedure
    .input(z.object({ sinceDays: z.number().int().min(1).max(365).default(30) }).optional())
    .mutation(async ({ input }) => {
      return analyzePendingChanges({ sinceDays: input?.sinceDays ?? 30 });
    }),

  changeImpactSummary: directionProcedure.query(async () => {
    return impactSummary();
  }),

  declareAgentChange: adminProcedure
    .input(
      z.object({
        agent: z.string().min(1).max(96),
        kind: z.enum(AGENT_CHANGE_KINDS),
        reference: z.string().min(1).max(200),
        title: z.string().min(1).max(240),
        detail: z.string().max(4000).optional(),
        engineName: z.string().max(64).optional(),
        rollbackPlan: z.string().max(4000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const row = await declareChange(input);
      // Le changement est analysé au moment du dépôt : ce qu'il peut casser,
      // les moteurs et pays concernés, le retour arrière, les tests déclarés.
      const impact = row ? await analyzeChangeImpact(row.id) : null;
      return { ...row, impact };
    }),

  /** Décision humaine : aucun changement ne se valide tout seul. */
  reviewAgentChange: pdgProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        decision: z.enum(["validee", "rejetee", "annulee"]),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return reviewChange({
        id: input.id,
        decision: input.decision,
        reviewerId: ctx.user.uid,
        note: input.note,
      });
    }),
});
