/**
 * Scheduler OS — moteur du temps (Phase 53).
 *
 * Registre central des tâches planifiées de la plateforme : rendez-vous,
 * réservations, disponibilités, livraisons, rappels, expirations et
 * renouvellements. Une seule boucle (`tick`) exécute les tâches dues et
 * reprogramme les tâches récurrentes.
 *
 * Interconnexions : Notification OS (`notifyEvent` pour les rappels) et
 * Supervision & Opérations (feed MOS). Aucun second moteur de notification.
 */
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { bigserial, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db.js";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc.js";
import { notifyEvent } from "../notification-os/index.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Schéma ────────────────────────────────────────────────────────────────
export const schedulerTasks = pgTable("scheduler_tasks", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  taskType: varchar("task_type", { length: 48 }).notNull(),
  runAt: timestamp("run_at", { withTimezone: true }).notNull(),
  recurrence: varchar("recurrence", { length: 16 }), // null | hourly | daily | weekly | monthly
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | done | failed | cancelled
  userId: integer("user_id"),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  attempts: integer("attempts").notNull().default(0),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastError: varchar("last_error", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Recurrence = "hourly" | "daily" | "weekly" | "monthly";

const RECUR_MS: Record<Recurrence, number> = {
  hourly: 3600000,
  daily: 86400000,
  weekly: 604800000,
  monthly: 2592000000, // ~30j
};

// ── Service ─────────────────────────────────────────────────────────────
/** Planifie une tâche. Retourne la ligne créée. */
export async function scheduleTask(input: {
  taskType: string;
  runAt: Date;
  recurrence?: Recurrence;
  userId?: number;
  payload?: Record<string, unknown>;
}) {
  const [row] = await db.insert(schedulerTasks).values({
    taskType: input.taskType,
    runAt: input.runAt,
    recurrence: input.recurrence ?? null,
    userId: input.userId ?? null,
    payload: (input.payload ?? {}) as Record<string, unknown>,
    status: "pending",
  }).returning();
  return row;
}

export async function cancelTask(id: number) {
  const [row] = await db.update(schedulerTasks)
    .set({ status: "cancelled" })
    .where(and(eq(schedulerTasks.id, id), eq(schedulerTasks.status, "pending")))
    .returning();
  return row ?? null;
}

/**
 * Exécute une tâche. Les rappels passent par Notification OS. Les autres
 * types sont journalisés (extensible sans créer de second moteur).
 */
async function runTask(task: typeof schedulerTasks.$inferSelect): Promise<void> {
  const p = task.payload ?? {};
  switch (task.taskType) {
    case "rappel":
    case "rappel_rdv":
    case "renouvellement":
    case "abonnement_expiration": {
      const userId = task.userId;
      const event = typeof p.event === "string" ? p.event : task.taskType === "rappel_rdv" ? "rappel_rdv" : "rappel";
      if (typeof userId === "number") {
        await notifyEvent({
          userId,
          event,
          vars: (p.vars as Record<string, string | number>) ?? {},
          url: typeof p.url === "string" ? p.url : undefined,
        });
      }
      return;
    }
    default:
      // Type inconnu : marqué exécuté (no-op) — un handler pourra être branché.
      return;
  }
}

/** Traite toutes les tâches dues. Best-effort, ne lève jamais. */
export async function tick(now = new Date(), max = 100): Promise<{ processed: number; failed: number }> {
  let processed = 0, failed = 0;
  let due: (typeof schedulerTasks.$inferSelect)[] = [];
  try {
    due = await db.select().from(schedulerTasks)
      .where(and(eq(schedulerTasks.status, "pending"), lte(schedulerTasks.runAt, now)))
      .orderBy(asc(schedulerTasks.runAt))
      .limit(max);
  } catch {
    return { processed, failed };
  }
  for (const task of due) {
    try {
      await runTask(task);
      processed += 1;
      const recur = task.recurrence as Recurrence | null;
      if (recur && RECUR_MS[recur]) {
        // Reprogramme la prochaine occurrence.
        await db.update(schedulerTasks).set({
          runAt: new Date(task.runAt.getTime() + RECUR_MS[recur]),
          lastRunAt: now,
          attempts: task.attempts + 1,
          lastError: null,
        }).where(eq(schedulerTasks.id, task.id));
      } else {
        await db.update(schedulerTasks).set({
          status: "done", lastRunAt: now, attempts: task.attempts + 1, lastError: null,
        }).where(eq(schedulerTasks.id, task.id));
      }
    } catch (err) {
      failed += 1;
      const attempts = task.attempts + 1;
      await db.update(schedulerTasks).set({
        status: attempts >= 5 ? "failed" : "pending",
        lastRunAt: now,
        attempts,
        lastError: (err as Error).message.slice(0, 255),
      }).where(eq(schedulerTasks.id, task.id)).catch(() => {});
    }
  }
  return { processed, failed };
}

export async function listTasks(status?: string, limit = 100) {
  const q = db.select().from(schedulerTasks).orderBy(asc(schedulerTasks.runAt)).limit(limit);
  return status ? q.where(eq(schedulerTasks.status, status)) : q;
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_2_complete";
export const SCHEDULER_OS_META = {
  name: "scheduler-os" as const,
  label: "Scheduler Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/scheduler-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let pending = 0, overdue = 0, failed = 0;
  try {
    const now = new Date();
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(schedulerTasks).where(eq(schedulerTasks.status, "pending"));
    pending = Number(a?.n ?? 0);
    const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(schedulerTasks).where(and(eq(schedulerTasks.status, "pending"), lte(schedulerTasks.runAt, now)));
    overdue = Number(b?.n ?? 0);
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(schedulerTasks).where(eq(schedulerTasks.status, "failed"));
    failed = Number(c?.n ?? 0);
    if (failed > 0 || overdue > 50) status = "degraded";
  } catch { status = "degraded"; }
  return { engine: "scheduler-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { pending, overdue, failed, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: SCHEDULER_OS_META.name, label: SCHEDULER_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: h.metrics.pending },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: h.metrics.failed },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return { ...feed, businessMetrics: { pending: h.metrics.pending, overdue: h.metrics.overdue, failed: h.metrics.failed }, recentEvents: [], recentErrors: [] };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const schedulerOsRouter = router({
  meta: publicProcedure.query(() => SCHEDULER_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  list: adminProcedure
    .input(z.object({ status: z.enum(["pending", "done", "failed", "cancelled"]).optional(), limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(({ input }) => listTasks(input?.status, input?.limit ?? 100)),

  runNow: adminProcedure.mutation(() => tick()),

  schedule: protectedProcedure
    .input(z.object({
      taskType: z.string().min(2).max(48),
      runAt: z.string().datetime(),
      recurrence: z.enum(["hourly", "daily", "weekly", "monthly"]).optional(),
      payload: z.record(z.unknown()).optional(),
    }))
    .mutation(({ ctx, input }) => scheduleTask({
      taskType: input.taskType,
      runAt: new Date(input.runAt),
      recurrence: input.recurrence,
      userId: ctx.user.uid,
      payload: input.payload,
    })),

  cancel: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(({ input }) => cancelTask(input.id)),
});
