/**
 * Messagerie OS — moteur unique de messagerie (Phase 43).
 *
 * Ne duplique PAS la messagerie existante : les fils et messages restent dans
 * `message_threads` / `messages` (`server/routers/messages.ts`). Messagerie OS
 * ajoute la couche transversale exigée par la Phase 43 :
 *   - sécurité : blocage (réutilise `user_blocks`), anti-spam, signalement ;
 *   - modération : file de signalements + résolution ;
 *   - audit : chaque action sensible est journalisée (Audit OS / audit.ts) ;
 *   - supervision : surface MOS standard (health / feed / dashboard).
 *
 * Les garde-fous `assertCanSend()` sont branchés dans `messages.send` afin que
 * TOUT envoi passe par ce moteur unique.
 */
import { and, desc, eq, gte, or, sql } from "drizzle-orm";
import { bigserial, integer, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "../db.js";
import { messages, messageThreads, userBlocks } from "../schema.js";
import { logAction } from "../audit.js";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

export const REPORT_REASONS = ["spam", "arnaque", "insulte", "contenu_illicite", "hors_sujet", "autre"] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const messageReports = pgTable("message_reports", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  messageId: integer("message_id"),
  threadId: integer("thread_id"),
  reporterId: integer("reporter_id").notNull(),
  reportedId: integer("reported_id"),
  reason: varchar("reason", { length: 64 }).notNull(),
  detail: varchar("detail", { length: 500 }),
  status: varchar("status", { length: 16 }).notNull().default("ouvert"),
  resolvedBy: integer("resolved_by"),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Anti-spam : fenêtre glissante + détection de doublon.
const SPAM_WINDOW_MS = 60_000;
const SPAM_MAX_PER_WINDOW = 10;

/** true si `blockerId` a bloqué `blockedId`, ou l'inverse. */
export async function isBlocked(a: number, b: number): Promise<boolean> {
  const [row] = await db
    .select({ id: userBlocks.id })
    .from(userBlocks)
    .where(
      or(
        and(eq(userBlocks.blockerId, a), eq(userBlocks.blockedId, b)),
        and(eq(userBlocks.blockerId, b), eq(userBlocks.blockedId, a)),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Détecte le spam : trop de messages récents ou doublon exact récent. */
export async function isSpam(senderId: number, content: string): Promise<boolean> {
  const since = new Date(Date.now() - SPAM_WINDOW_MS);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(messages)
    .where(and(eq(messages.senderId, senderId), gte(messages.createdAt, since)));
  if (Number(row?.n ?? 0) >= SPAM_MAX_PER_WINDOW) return true;
  const [dup] = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.senderId, senderId), eq(messages.content, content), gte(messages.createdAt, since)))
    .limit(1);
  return Boolean(dup);
}

/**
 * Garde-fou central appelé avant tout envoi. Lève une erreur tRPC si l'envoi
 * doit être refusé (blocage ou spam).
 */
export async function assertCanSend(senderId: number, recipientId: number, content: string): Promise<void> {
  if (await isBlocked(senderId, recipientId)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Conversation bloquée." });
  }
  if (await isSpam(senderId, content)) {
    throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Trop de messages envoyés. Réessayez dans un instant." });
  }
}

export async function blockUser(blockerId: number, blockedId: number) {
  const existing = await isBlocked(blockerId, blockedId);
  if (!existing) {
    await db.insert(userBlocks).values({ blockerId, blockedId });
  }
  await logAction(blockerId, "messaging.block", "user", blockedId);
  return { ok: true };
}

export async function unblockUser(blockerId: number, blockedId: number) {
  await db.delete(userBlocks).where(and(eq(userBlocks.blockerId, blockerId), eq(userBlocks.blockedId, blockedId)));
  await logAction(blockerId, "messaging.unblock", "user", blockedId);
  return { ok: true };
}

export async function reportMessage(input: {
  reporterId: number;
  messageId?: number;
  threadId?: number;
  reportedId?: number;
  reason: ReportReason;
  detail?: string;
}) {
  const [row] = await db.insert(messageReports).values({
    messageId: input.messageId,
    threadId: input.threadId,
    reporterId: input.reporterId,
    reportedId: input.reportedId,
    reason: input.reason,
    detail: input.detail,
    status: "ouvert",
  }).returning();
  await logAction(input.reporterId, "messaging.report", "message", input.messageId ?? null, { reason: input.reason });
  return row;
}

export async function resolveReport(reportId: number, resolverId: number, action: "traite" | "rejete") {
  const [row] = await db
    .update(messageReports)
    .set({ status: action, resolvedBy: resolverId, resolvedAt: new Date() })
    .where(eq(messageReports.id, reportId))
    .returning();
  await logAction(resolverId, "messaging.report_resolved", "message_report", reportId, { action });
  return row;
}

export async function openReports(limit = 100) {
  return db.select().from(messageReports).where(eq(messageReports.status, "ouvert")).orderBy(desc(messageReports.createdAt)).limit(limit);
}

export async function stats() {
  const [open] = await db.select({ n: sql<number>`count(*)::int` }).from(messageReports).where(eq(messageReports.status, "ouvert"));
  const [threads] = await db.select({ n: sql<number>`count(*)::int` }).from(messageThreads);
  const since = new Date(Date.now() - 86400000);
  const [msgs24h] = await db.select({ n: sql<number>`count(*)::int` }).from(messages).where(gte(messages.createdAt, since));
  const [blocks] = await db.select({ n: sql<number>`count(*)::int` }).from(userBlocks);
  return {
    openReports: Number(open?.n ?? 0),
    threads: Number(threads?.n ?? 0),
    messages24h: Number(msgs24h?.n ?? 0),
    blocks: Number(blocks?.n ?? 0),
  };
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const VERSION = "0.1.0";
const MATURITY: MaturityLevel = "sprint_2_complete";
export const MESSAGING_OS_META = {
  name: "messaging-os" as const,
  label: "Messagerie Operating System" as const,
  version: VERSION,
  maturityLevel: MATURITY,
  contract: "server/messaging-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let open = 0, msgs24h = 0;
  try {
    const st = await stats();
    open = st.openReports;
    msgs24h = st.messages24h;
  } catch {
    status = "degraded";
  }
  return { engine: "messaging-os" as const, version: VERSION, status, checkedAt: new Date().toISOString(), metrics: { openReports: open, messages24h: msgs24h, attention: open > 0, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: MESSAGING_OS_META.name,
    label: MESSAGING_OS_META.label,
    version: VERSION,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: h.metrics.messages24h },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: h.metrics.openReports },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const st = await stats();
  return {
    ...feed,
    businessMetrics: { open_reports: st.openReports, threads: st.threads, messages_24h: st.messages24h, blocks: st.blocks },
    recentEvents: [],
    recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const messagingOsRouter = router({
  meta: publicProcedure.query(() => MESSAGING_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  reasons: publicProcedure.query(() => REPORT_REASONS),

  block: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(({ ctx, input }) => blockUser(ctx.user.uid, input.userId)),
  unblock: protectedProcedure.input(z.object({ userId: z.number().int().positive() })).mutation(({ ctx, input }) => unblockUser(ctx.user.uid, input.userId)),

  report: protectedProcedure
    .input(z.object({
      messageId: z.number().int().positive().optional(),
      threadId: z.number().int().positive().optional(),
      reportedId: z.number().int().positive().optional(),
      reason: z.enum(REPORT_REASONS),
      detail: z.string().max(500).optional(),
    }))
    .mutation(({ ctx, input }) => reportMessage({ ...input, reporterId: ctx.user.uid })),

  openReports: adminProcedure.query(() => openReports()),
  resolveReport: adminProcedure
    .input(z.object({ reportId: z.number().int().positive(), action: z.enum(["traite", "rejete"]) }))
    .mutation(({ ctx, input }) => resolveReport(input.reportId, ctx.user.uid, input.action)),

  stats: adminProcedure.query(() => stats()),
});
