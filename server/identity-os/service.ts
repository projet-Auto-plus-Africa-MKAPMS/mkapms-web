/**
 * Identity OS — Service (Sprint 1)
 *
 * Logique métier isolée du transport tRPC. Aucun accès direct depuis
 * l'extérieur : les autres moteurs passent uniquement par le router
 * ou par les événements Identity OS (règle MOS #11).
 *
 * Best-effort par défaut (règle MOS #5) : aucun de ces appels ne doit
 * bloquer un flux critique en cas d'erreur.
 */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  identities,
  identityAuditLog,
  identityHealthLog,
  identitySessions,
} from "./schema.js";
import {
  IDENTITY_TYPES,
  type ControlCenterFeed,
  type EngineDashboard,
  type IdentityRole,
  type IdentityType,
  type MaturityLevel,
} from "./contract.js";

// ── Résolution d'identité ────────────────────────────────────────────────

export interface ResolveOptions {
  /** Fallback : quand aucune identité n'existe encore pour ce user legacy,
   *  on la crée à la volée en mode `active` (migration progressive). */
  createIfMissing?: boolean;
}

/**
 * Retourne (et éventuellement crée) l'identité liée à un `users.id` legacy.
 * C'est le point d'entrée principal tant que la migration user → identity
 * n'est pas terminée. Aucune écriture destructive sur la table `users`.
 */
export async function resolveIdentityForUser(
  legacyUserId: number,
  hint: { type?: IdentityType; email?: string; name?: string; roles?: IdentityRole[] } = {},
  opts: ResolveOptions = { createIfMissing: true },
) {
  const [existing] = await db
    .select()
    .from(identities)
    .where(eq(identities.legacyUserId, legacyUserId))
    .limit(1);
  if (existing) return existing;
  if (!opts.createIfMissing) return null;

  const type: IdentityType = hint.type ?? "user";
  if (!IDENTITY_TYPES.includes(type)) {
    throw new Error(`identity: type invalide « ${type} »`);
  }
  const [created] = await db
    .insert(identities)
    .values({
      legacyUserId,
      type,
      roles: (hint.roles ?? []) as string[],
      email: hint.email ?? null,
      displayName: hint.name ?? null,
      status: "active",
    })
    .returning();
  await audit({
    identityId: created.id,
    action: "identity.created",
    metadata: { via: "legacy_user_bridge", legacyUserId, type },
  });
  return created;
}

// ── Audit ────────────────────────────────────────────────────────────────

export interface AuditInput {
  identityId?: number;
  actorIdentityId?: number;
  action: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Enregistre un événement d'audit. Best-effort : les erreurs sont avalées
 * pour ne jamais bloquer le flux appelant (doctrine MOS #5).
 */
export async function audit(input: AuditInput) {
  try {
    await db.insert(identityAuditLog).values({
      identityId: input.identityId ?? null,
      actorIdentityId: input.actorIdentityId ?? null,
      action: input.action,
      reason: input.reason ?? null,
      metadata: (input.metadata ?? null) as any,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (err) {
    // Journal auxiliaire — ne doit jamais casser l'application
    console.warn("[identity-os] audit failed:", (err as Error)?.message);
  }
}

export async function recentAudit(limit = 50, identityId?: number) {
  const q = db.select().from(identityAuditLog).orderBy(desc(identityAuditLog.createdAt));
  if (typeof identityId === "number") {
    return q.where(eq(identityAuditLog.identityId, identityId)).limit(limit);
  }
  return q.limit(limit);
}

// ── Sessions ─────────────────────────────────────────────────────────────

export async function listActiveSessions(identityId: number) {
  return db
    .select()
    .from(identitySessions)
    .where(and(eq(identitySessions.identityId, identityId), isNull(identitySessions.revokedAt)))
    .orderBy(desc(identitySessions.lastActiveAt));
}

export async function revokeSession(
  sessionId: number,
  identityId: number,
  reason: "logout" | "expired" | "revoked" = "revoked",
) {
  const [row] = await db
    .update(identitySessions)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(and(eq(identitySessions.id, sessionId), eq(identitySessions.identityId, identityId)))
    .returning();
  if (row) {
    await audit({
      identityId,
      action: "identity.session.ended",
      metadata: { sessionId, reason },
    });
  }
  return row ?? null;
}

// ── Health Status (obligatoire — doctrine MOS #11) ───────────────────────

export interface HealthStatus {
  engine: "identity-os";
  version: string;
  status: "ok" | "degraded" | "down";
  checkedAt: string;
  message?: string;
  metrics: {
    identitiesTotal: number;
    identitiesActive: number;
    identitiesSuspended: number;
    identitiesArchived: number;
    activeSessions: number;
    auditEventsLast24h: number;
  };
}

const IDENTITY_OS_VERSION = "0.4.0"; // Sprint 3 — complétude fonctionnelle (règle MOS #15)
const IDENTITY_OS_MATURITY: MaturityLevel = "sprint_3_automation";

/**
 * Retourne l'état de santé standardisé de l'Identity OS.
 * Publie également une ligne dans `identity_health_log` (best-effort).
 */
export async function healthStatus(): Promise<HealthStatus> {
  const startedAt = Date.now();
  let status: HealthStatus["status"] = "ok";
  let message: string | undefined;
  const metrics: HealthStatus["metrics"] = {
    identitiesTotal: 0,
    identitiesActive: 0,
    identitiesSuspended: 0,
    identitiesArchived: 0,
    activeSessions: 0,
    auditEventsLast24h: 0,
  };

  try {
    const [totalRow] = await db.select({ n: sql<number>`count(*)::int` }).from(identities);
    metrics.identitiesTotal = Number(totalRow?.n ?? 0);

    const [activeRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identities)
      .where(eq(identities.status, "active"));
    metrics.identitiesActive = Number(activeRow?.n ?? 0);

    const [suspRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identities)
      .where(eq(identities.status, "suspended"));
    metrics.identitiesSuspended = Number(suspRow?.n ?? 0);

    const [archRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identities)
      .where(eq(identities.status, "archived"));
    metrics.identitiesArchived = Number(archRow?.n ?? 0);

    const [sessRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identitySessions)
      .where(isNull(identitySessions.revokedAt));
    metrics.activeSessions = Number(sessRow?.n ?? 0);

    const [auditRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identityAuditLog)
      .where(sql`${identityAuditLog.createdAt} > now() - interval '24 hours'`);
    metrics.auditEventsLast24h = Number(auditRow?.n ?? 0);
  } catch (err) {
    status = "degraded";
    message = `Lecture partielle : ${(err as Error)?.message ?? "erreur DB"}`;
  }

  const elapsed = Date.now() - startedAt;
  if (elapsed > 2000 && status === "ok") {
    status = "degraded";
    message = message ?? `Réponse lente (${elapsed}ms)`;
  }

  const result: HealthStatus = {
    engine: "identity-os",
    version: IDENTITY_OS_VERSION,
    status,
    checkedAt: new Date().toISOString(),
    message,
    metrics,
  };

  // Historisation best-effort
  db.insert(identityHealthLog)
    .values({ status, message: message ?? null, metrics: metrics as any })
    .catch((e) => console.warn("[identity-os] health log failed:", (e as Error)?.message));

  return result;
}

export const IDENTITY_OS_META = {
  name: "identity-os",
  label: "Identity Operating System",
  version: IDENTITY_OS_VERSION,
  maturityLevel: IDENTITY_OS_MATURITY,
  contract: "server/identity-os/contract.ts",
} as const;

// ────────────────────────────────────────────────────────────────────────
// Standards MOS — Dashboard + Control Center Feed (règles #12/#13/#14)
// ────────────────────────────────────────────────────────────────────────

/**
 * Feed standardisé consommé par le MOS Control Center.
 * Format 100 % conforme au type `ControlCenterFeed` du contrat.
 */
export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const health = await healthStatus();

  let events5m = 0;
  let events24h = 0;
  let errors24h = 0;
  try {
    const [r5] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identityAuditLog)
      .where(sql`${identityAuditLog.createdAt} > now() - interval '5 minutes'`);
    events5m = Number(r5?.n ?? 0);
    const [r24] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identityAuditLog)
      .where(sql`${identityAuditLog.createdAt} > now() - interval '24 hours'`);
    events24h = Number(r24?.n ?? 0);
    const [rErr] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(identityAuditLog)
      .where(sql`${identityAuditLog.createdAt} > now() - interval '24 hours' AND ${identityAuditLog.action} LIKE 'identity.error%'`);
    errors24h = Number(rErr?.n ?? 0);
  } catch (err) {
    console.warn("[identity-os] feed metrics degraded:", (err as Error)?.message);
  }

  return {
    engine: IDENTITY_OS_META.name,
    label: IDENTITY_OS_META.label,
    version: IDENTITY_OS_META.version,
    maturityLevel: IDENTITY_OS_META.maturityLevel,
    health: health.status === "ok" ? "ok" : health.status,
    load: { events5m, events24h },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: errors24h },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

/**
 * Tableau de bord dédié Identity OS (règle MOS #13).
 * Reprend le feed standard et ajoute des métriques métier + historique.
 */
export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const health = await healthStatus();

  const businessMetrics = {
    identities_total: health.metrics.identitiesTotal,
    identities_active: health.metrics.identitiesActive,
    identities_suspended: health.metrics.identitiesSuspended,
    identities_archived: health.metrics.identitiesArchived,
    sessions_active: health.metrics.activeSessions,
    audit_events_24h: health.metrics.auditEventsLast24h,
  } as const;

  let recentEvents: EngineDashboard["recentEvents"] = [];
  let recentErrors: EngineDashboard["recentErrors"] = [];
  try {
    const rows = await db
      .select({
        createdAt: identityAuditLog.createdAt,
        action: identityAuditLog.action,
        metadata: identityAuditLog.metadata,
      })
      .from(identityAuditLog)
      .orderBy(desc(identityAuditLog.createdAt))
      .limit(20);
    recentEvents = rows.map((r) => ({
      at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      action: r.action,
      metadata: (r.metadata as Record<string, unknown>) ?? undefined,
    }));
    recentErrors = rows
      .filter((r) => r.action.startsWith("identity.error"))
      .slice(0, 10)
      .map((r) => ({
        at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        message:
          typeof (r.metadata as any)?.message === "string"
            ? (r.metadata as any).message
            : r.action,
      }));
  } catch (err) {
    console.warn("[identity-os] dashboard degraded:", (err as Error)?.message);
  }

  return { ...feed, businessMetrics, recentEvents, recentErrors };
}
