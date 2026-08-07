/**
 * Backup & Recovery OS — sauvegarde et restauration (Phase 50).
 *
 * Registre applicatif des sauvegardes logiques (manifeste + comptages par
 * table) et flux de restauration SÉCURISÉ. Les sauvegardes physiques de la
 * base restent gérées par l'hébergeur (Railway) ; ce moteur ajoute la couche
 * métier : historique, sauvegarde sélective, et restauration soumise à
 * VALIDATION HUMAINE (jamais exécutée automatiquement — règle des garde-fous).
 *
 * Interconnexion : Supervision & Opérations (feed MOS).
 */
import { desc, eq, sql } from "drizzle-orm";
import { bigserial, integer, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db.js";
import { publicProcedure, adminProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Schéma ────────────────────────────────────────────────────────────────
export const backupSnapshots = pgTable("backup_snapshots", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  scope: jsonb("scope").$type<string[]>().notNull(),
  rowCounts: jsonb("row_counts").$type<Record<string, number>>().default({}),
  totalRows: integer("total_rows").notNull().default(0),
  status: varchar("status", { length: 16 }).notNull().default("captured"), // captured | failed
  note: varchar("note", { length: 255 }),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const backupRestoreRequests = pgTable("backup_restore_requests", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  snapshotId: integer("snapshot_id").notNull(),
  scope: jsonb("scope").$type<string[]>().notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"), // pending | approved | rejected
  requestedBy: integer("requested_by"),
  decidedBy: integer("decided_by"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tables sauvegardables (liste blanche stricte — protège contre l'injection
 * de noms de table arbitraires dans les comptages SQL).
 */
export const BACKUPABLE_TABLES = [
  "users",
  "annonces",
  "annonce_photos",
  "garages",
  "pieces",
  "reservations",
  "messages",
  "notifications",
  "doc_documents",
  "payment_products",
  "seo_keywords",
] as const;
export type BackupableTable = (typeof BACKUPABLE_TABLES)[number];

function isBackupable(t: string): t is BackupableTable {
  return (BACKUPABLE_TABLES as readonly string[]).includes(t);
}

// ── Service ─────────────────────────────────────────────────────────────
/** Compte les lignes d'une table de la liste blanche (0 si indisponible). */
async function countRows(table: BackupableTable): Promise<number> {
  try {
    const res = await db.execute(sql`SELECT count(*)::int AS n FROM ${sql.identifier(table)}`);
    const rows = (res as unknown as { rows?: { n: number }[] }).rows ?? (res as unknown as { n: number }[]);
    const first = Array.isArray(rows) ? rows[0] : undefined;
    return Number(first?.n ?? 0);
  } catch {
    return 0;
  }
}

/** Crée une sauvegarde logique : manifeste + comptages par table. */
export async function createSnapshot(input: { tables?: string[]; note?: string; createdBy?: number }) {
  const scope = (input.tables && input.tables.length > 0 ? input.tables : [...BACKUPABLE_TABLES]).filter(isBackupable);
  const rowCounts: Record<string, number> = {};
  let total = 0;
  for (const t of scope) {
    const n = await countRows(t);
    rowCounts[t] = n;
    total += n;
  }
  const [row] = await db.insert(backupSnapshots).values({
    scope, rowCounts, totalRows: total, status: "captured",
    note: input.note ?? null, createdBy: input.createdBy ?? null,
  }).returning();
  return row;
}

export async function listSnapshots(limit = 50) {
  return db.select().from(backupSnapshots).orderBy(desc(backupSnapshots.createdAt)).limit(limit);
}

/**
 * Demande de restauration — NE restaure PAS. Enregistre une demande en attente
 * de validation humaine (PDG). La restauration effective est un acte manuel
 * contrôlé (garde-fou : jamais automatique).
 */
export async function requestRestore(input: { snapshotId: number; tables?: string[]; requestedBy?: number }) {
  const [snap] = await db.select().from(backupSnapshots).where(eq(backupSnapshots.id, input.snapshotId)).limit(1);
  if (!snap) return { ok: false as const, reason: "snapshot_introuvable" };
  const scope = (input.tables && input.tables.length > 0 ? input.tables : snap.scope).filter(isBackupable);
  const [row] = await db.insert(backupRestoreRequests).values({
    snapshotId: input.snapshotId, scope, status: "pending", requestedBy: input.requestedBy ?? null,
  }).returning();
  return { ok: true as const, request: row };
}

export async function decideRestore(input: { requestId: number; approve: boolean; decidedBy?: number }) {
  const [row] = await db.update(backupRestoreRequests).set({
    status: input.approve ? "approved" : "rejected",
    decidedBy: input.decidedBy ?? null,
    decidedAt: new Date(),
  }).where(eq(backupRestoreRequests.id, input.requestId)).returning();
  return row ?? null;
}

export async function listRestoreRequests(limit = 50) {
  return db.select().from(backupRestoreRequests).orderBy(desc(backupRestoreRequests.createdAt)).limit(limit);
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_2_complete";
export const BACKUP_OS_META = {
  name: "backup-os" as const,
  label: "Backup & Recovery Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/backup-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let snapshots = 0, pendingRestores = 0, lastBackupAgeH: number | null = null;
  try {
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(backupSnapshots);
    snapshots = Number(a?.n ?? 0);
    const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(backupRestoreRequests).where(eq(backupRestoreRequests.status, "pending"));
    pendingRestores = Number(b?.n ?? 0);
    const [last] = await db.select({ at: backupSnapshots.createdAt }).from(backupSnapshots).orderBy(desc(backupSnapshots.createdAt)).limit(1);
    if (last?.at) lastBackupAgeH = Math.round((Date.now() - new Date(last.at).getTime()) / 3600000);
  } catch { status = "degraded"; }
  // Absence de snapshot ou sauvegarde ancienne = point d'attention métier,
  // pas une panne du moteur (qui reste opérationnel et prêt à sauvegarder).
  const attention = snapshots === 0 || (lastBackupAgeH !== null && lastBackupAgeH > 24 * 7);
  return { engine: "backup-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { snapshots, pendingRestores, lastBackupAgeH, attention, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: BACKUP_OS_META.name, label: BACKUP_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: h.metrics.snapshots },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return { ...feed, businessMetrics: { snapshots: h.metrics.snapshots, pending_restores: h.metrics.pendingRestores, backupable_tables: BACKUPABLE_TABLES.length }, recentEvents: [], recentErrors: [] };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const backupOsRouter = router({
  meta: publicProcedure.query(() => BACKUP_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  tables: adminProcedure.query(() => [...BACKUPABLE_TABLES]),
  snapshots: adminProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(50) }).optional())
    .query(({ input }) => listSnapshots(input?.limit ?? 50)),
  createSnapshot: adminProcedure
    .input(z.object({ tables: z.array(z.string().max(64)).optional(), note: z.string().max(255).optional() }).optional())
    .mutation(({ ctx, input }) => createSnapshot({ tables: input?.tables, note: input?.note, createdBy: ctx.user.uid })),

  restoreRequests: adminProcedure.query(() => listRestoreRequests()),
  requestRestore: adminProcedure
    .input(z.object({ snapshotId: z.number().int().positive(), tables: z.array(z.string().max(64)).optional() }))
    .mutation(({ ctx, input }) => requestRestore({ snapshotId: input.snapshotId, tables: input.tables, requestedBy: ctx.user.uid })),
  decideRestore: adminProcedure
    .input(z.object({ requestId: z.number().int().positive(), approve: z.boolean() }))
    .mutation(({ ctx, input }) => decideRestore({ requestId: input.requestId, approve: input.approve, decidedBy: ctx.user.uid })),
});
