/**
 * Notification OS — Moteur unifié multi-canaux MKA.P-MS (règle MOS #15).
 *
 * Consolide et ÉTEND `server/routers/notifications.ts` existant (list,
 * unreadCount, markRead, markAllRead — 100 % conservés côté appRouter
 * dans le namespace `notifications.*`). Ce moteur ajoute :
 *   • Templates multi-langues par canal (email, sms, push, in-app)
 *   • Préférences utilisateur (activer/désactiver par canal, digest,
 *     quiet hours, catégories mutées)
 *   • Dispatch avec journal (log de chaque envoi et son statut)
 *   • Standards MOS : meta / healthStatus / controlCenterFeed / dashboard
 *
 * Interconnexion :
 *   - Country OS → langue par défaut du pays
 *   - Language OS → traduction dynamique des templates (fallback fr)
 *   - Identity OS → préférences utilisateur (identityId ↔ userId)
 */
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { bigserial, boolean, integer, jsonb, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db.js";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Schéma ──────────────────────────────────────────────────────────────
export const notifTemplates = pgTable("notif_templates", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 96 }).notNull(),
  channel: varchar("channel", { length: 16 }).notNull(),
  language: varchar("language", { length: 8 }).notNull(),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique("notif_templates_unique").on(t.key, t.channel, t.language) }));

export const notifUserPreferences = pgTable("notif_user_preferences", {
  userId: integer("user_id").primaryKey(),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  smsEnabled: boolean("sms_enabled").notNull().default(false),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  inappEnabled: boolean("inapp_enabled").notNull().default(true),
  digestEnabled: boolean("digest_enabled").notNull().default(false),
  digestFrequency: varchar("digest_frequency", { length: 16 }).notNull().default("daily"),
  quietHoursFrom: integer("quiet_hours_from"),
  quietHoursTo: integer("quiet_hours_to"),
  mutedCategories: jsonb("muted_categories").$type<string[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifDispatchLog = pgTable("notif_dispatch_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: integer("user_id"),
  templateKey: varchar("template_key", { length: 96 }),
  channel: varchar("channel", { length: 16 }).notNull(),
  language: varchar("language", { length: 8 }),
  status: varchar("status", { length: 16 }).notNull(),
  error: text("error"),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  sentAt: timestamp("sent_at", { withTimezone: true }),
});

export const notifHealthLog = pgTable("notif_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Métadonnées ─────────────────────────────────────────────────────────
const V = "0.3.0";
const M: MaturityLevel = "sprint_3_automation";
export const NOTIFICATION_OS_META = {
  name: "notification-os" as const,
  label: "Notification Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/notification-os/index.ts",
};

// ── Service ─────────────────────────────────────────────────────────────
export async function getUserPrefs(userId: number) {
  const [row] = await db.select().from(notifUserPreferences).where(eq(notifUserPreferences.userId, userId)).limit(1);
  return row ?? {
    userId, emailEnabled: true, smsEnabled: false, pushEnabled: true, inappEnabled: true,
    digestEnabled: false, digestFrequency: "daily", quietHoursFrom: null, quietHoursTo: null,
    mutedCategories: [] as string[], updatedAt: new Date(),
  };
}

export async function setUserPrefs(userId: number, patch: Record<string, unknown>) {
  const values = { userId, ...patch, updatedAt: new Date() };
  const [row] = await db
    .insert(notifUserPreferences).values(values as any)
    .onConflictDoUpdate({ target: notifUserPreferences.userId, set: { ...patch, updatedAt: new Date() } })
    .returning();
  return row;
}

/** Récupère un template avec fallback : lang demandée → fr → défaut. */
export async function getTemplate(key: string, channel: string, language: string) {
  const rows = await db
    .select().from(notifTemplates)
    .where(and(eq(notifTemplates.key, key), eq(notifTemplates.channel, channel), eq(notifTemplates.active, true)));
  return rows.find((r) => r.language === language) ?? rows.find((r) => r.language === "fr") ?? rows[0] ?? null;
}

export async function upsertTemplate(input: { key: string; channel: string; language: string; subject?: string; body: string; variables?: string[]; active?: boolean }) {
  const values = {
    key: input.key, channel: input.channel, language: input.language,
    subject: input.subject ?? null, body: input.body,
    variables: (input.variables ?? []) as any, active: input.active ?? true,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(notifTemplates).values(values as any)
    .onConflictDoUpdate({
      target: [notifTemplates.key, notifTemplates.channel, notifTemplates.language],
      set: { subject: values.subject, body: values.body, variables: values.variables, active: values.active, updatedAt: new Date() },
    })
    .returning();
  return row;
}

/** Interpole {{variables}} d'un template avec un dict de valeurs. */
export function renderTemplate(body: string, vars: Record<string, string | number>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => String(vars[k] ?? ""));
}

/**
 * Dispatch — best-effort. N'exécute PAS l'envoi réel (pas de connecteur
 * SMS/push par défaut). Journalise et permet aux services d'envoi externes
 * (email.ts existant, futur SMS provider) de consommer la file.
 */
export async function dispatch(input: {
  userId: number;
  templateKey: string;
  channel: "email" | "sms" | "push" | "inapp";
  language?: string;
  vars?: Record<string, string | number>;
  category?: string;
}) {
  const prefs = await getUserPrefs(input.userId);
  const channelEnabled = ({
    email: prefs.emailEnabled, sms: prefs.smsEnabled, push: prefs.pushEnabled, inapp: prefs.inappEnabled,
  } as any)[input.channel];
  if (!channelEnabled || (input.category && (prefs.mutedCategories as string[]).includes(input.category))) {
    await db.insert(notifDispatchLog).values({
      userId: input.userId, templateKey: input.templateKey, channel: input.channel,
      language: input.language ?? "fr", status: "skipped", payload: (input.vars ?? {}) as any,
    });
    return { status: "skipped" as const };
  }
  const tpl = await getTemplate(input.templateKey, input.channel, input.language ?? "fr");
  if (!tpl) {
    await db.insert(notifDispatchLog).values({
      userId: input.userId, templateKey: input.templateKey, channel: input.channel,
      language: input.language ?? "fr", status: "failed", error: "template_not_found",
    });
    return { status: "failed" as const, reason: "template_not_found" };
  }
  const rendered = renderTemplate(tpl.body, input.vars ?? {});
  const subject = tpl.subject ? renderTemplate(tpl.subject, input.vars ?? {}) : undefined;
  const [row] = await db.insert(notifDispatchLog).values({
    userId: input.userId, templateKey: input.templateKey, channel: input.channel,
    language: tpl.language, status: "queued",
    payload: { rendered, subject, vars: input.vars ?? {} } as any,
  }).returning();
  return { status: "queued" as const, dispatchId: row.id, rendered, subject };
}

// ── Health / Feed / Dashboard ───────────────────────────────────────────
export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let templates = 0, prefs = 0, dispatched24h = 0, failed24h = 0;
  try {
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(notifTemplates).where(eq(notifTemplates.active, true));
    templates = Number(a?.n ?? 0);
    const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(notifUserPreferences);
    prefs = Number(b?.n ?? 0);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(notifDispatchLog).where(gt(notifDispatchLog.createdAt, since));
    dispatched24h = Number(c?.n ?? 0);
    const [d] = await db.select({ n: sql<number>`count(*)::int` }).from(notifDispatchLog).where(and(gt(notifDispatchLog.createdAt, since), eq(notifDispatchLog.status, "failed")));
    failed24h = Number(d?.n ?? 0);
  } catch { status = "degraded"; }
  return {
    engine: "notification-os" as const, version: V, status,
    checkedAt: new Date().toISOString(),
    metrics: { templates, userPreferences: prefs, dispatched24h, failed24h, responseMs: Date.now() - s },
  };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: NOTIFICATION_OS_META.name, label: NOTIFICATION_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: h.metrics.dispatched24h },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: h.metrics.failed24h },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return {
    ...feed,
    businessMetrics: {
      templates_active: h.metrics.templates,
      user_preferences: h.metrics.userPreferences,
      dispatched_24h: h.metrics.dispatched24h,
      failed_24h: h.metrics.failed24h,
    },
    recentEvents: [], recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const notificationOsRouter = router({
  meta: publicProcedure.query(() => NOTIFICATION_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  preferences: router({
    me: protectedProcedure.query(({ ctx }) => getUserPrefs(ctx.user.uid)),
    update: protectedProcedure
      .input(z.object({
        emailEnabled: z.boolean().optional(),
        smsEnabled: z.boolean().optional(),
        pushEnabled: z.boolean().optional(),
        inappEnabled: z.boolean().optional(),
        digestEnabled: z.boolean().optional(),
        digestFrequency: z.enum(["realtime", "daily", "weekly"]).optional(),
        quietHoursFrom: z.number().int().min(0).max(23).nullable().optional(),
        quietHoursTo: z.number().int().min(0).max(23).nullable().optional(),
        mutedCategories: z.array(z.string()).optional(),
      }))
      .mutation(({ ctx, input }) => setUserPrefs(ctx.user.uid, input)),
  }),

  templates: router({
    upsert: adminProcedure
      .input(z.object({
        key: z.string().min(2).max(96),
        channel: z.enum(["email", "sms", "push", "inapp"]),
        language: z.string().min(2).max(8),
        subject: z.string().max(255).optional(),
        body: z.string().min(1).max(10000),
        variables: z.array(z.string()).default([]),
        active: z.boolean().default(true),
      }))
      .mutation(({ input }) => upsertTemplate(input)),
    list: adminProcedure.query(async () => db.select().from(notifTemplates).orderBy(notifTemplates.key)),
  }),

  dispatch: adminProcedure
    .input(z.object({
      userId: z.number().int().positive(),
      templateKey: z.string().min(2).max(96),
      channel: z.enum(["email", "sms", "push", "inapp"]),
      language: z.string().min(2).max(8).optional(),
      vars: z.record(z.union([z.string(), z.number()])).optional(),
      category: z.string().max(48).optional(),
    }))
    .mutation(({ input }) => dispatch(input as any)),

  log: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
    .query(({ input }) =>
      db.select().from(notifDispatchLog).orderBy(desc(notifDispatchLog.createdAt)).limit(input?.limit ?? 100),
    ),
});
