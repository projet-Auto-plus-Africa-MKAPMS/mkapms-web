/**
 * Permission OS — Service (dashboard, health, delegations, policies)
 *
 * Regroupe la logique transverse : santé du moteur, tableau de bord dédié
 * (règle MOS #13), feed standard MOS (règle #14), gestion des délégations
 * et des politiques. Réutilise l'existant `permSecurityLog` / `permTemporaryGrants`.
 */
import { and, desc, eq, gt, gte, isNull, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  permDelegations,
  permHealthLog,
  permPolicies,
  permResolutionLog,
  permSecurityLog,
  permTemporaryGrants,
} from "./schema.js";
import type {
  ControlCenterFeed,
  EngineDashboard,
  MaturityLevel,
} from "../identity-os/contract.js";
import type { PermissionEngineMeta, PermissionPolicyCondition } from "./contract.js";

const PERMISSION_OS_VERSION = "0.3.0"; // Sprint 3 — complétude fonctionnelle
const PERMISSION_OS_MATURITY: MaturityLevel = "sprint_3_automation";

export const PERMISSION_OS_META: PermissionEngineMeta = {
  name: "permission-os",
  label: "Permission Operating System",
  version: PERMISSION_OS_VERSION,
  maturityLevel: PERMISSION_OS_MATURITY,
  contract: "server/permission-engine/contract.ts",
};

// ── Health Status (règle MOS #11) ───────────────────────────────────────

export interface PermissionHealth {
  engine: "permission-os";
  version: string;
  status: "ok" | "degraded" | "down";
  checkedAt: string;
  message?: string;
  metrics: {
    activePolicies: number;
    activeDelegations: number;
    activeGrants: number;
    resolutions24h: number;
    denials24h: number;
    denialRate: number;
  };
}

export async function healthStatus(): Promise<PermissionHealth> {
  const startedAt = Date.now();
  let status: PermissionHealth["status"] = "ok";
  let message: string | undefined;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const metrics: PermissionHealth["metrics"] = {
    activePolicies: 0,
    activeDelegations: 0,
    activeGrants: 0,
    resolutions24h: 0,
    denials24h: 0,
    denialRate: 0,
  };
  try {
    const [pol] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(permPolicies)
      .where(and(eq(permPolicies.active, true), or(isNull(permPolicies.expiresAt), gt(permPolicies.expiresAt, new Date()))));
    metrics.activePolicies = Number(pol?.n ?? 0);
    const [del] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(permDelegations)
      .where(and(isNull(permDelegations.revokedAt), or(isNull(permDelegations.expiresAt), gt(permDelegations.expiresAt, new Date()))));
    metrics.activeDelegations = Number(del?.n ?? 0);
    const [gr] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(permTemporaryGrants)
      .where(and(eq(permTemporaryGrants.revoked, false), or(isNull(permTemporaryGrants.expiresAt), gt(permTemporaryGrants.expiresAt, new Date()))));
    metrics.activeGrants = Number(gr?.n ?? 0);
    const [res] = await db
      .select({
        total: sql<number>`count(*)::int`,
        denied: sql<number>`count(*) filter (where ${permResolutionLog.allowed} = false)::int`,
      })
      .from(permResolutionLog)
      .where(gte(permResolutionLog.createdAt, since));
    metrics.resolutions24h = Number(res?.total ?? 0);
    metrics.denials24h = Number(res?.denied ?? 0);
    metrics.denialRate = metrics.resolutions24h > 0
      ? Math.round((metrics.denials24h * 1000) / metrics.resolutions24h) / 10
      : 0;
  } catch (err) {
    status = "degraded";
    message = `Lecture partielle : ${(err as Error)?.message ?? "erreur DB"}`;
  }
  const elapsed = Date.now() - startedAt;
  if (elapsed > 2000 && status === "ok") {
    status = "degraded";
    message = message ?? `Réponse lente (${elapsed}ms)`;
  }
  const result: PermissionHealth = {
    engine: "permission-os",
    version: PERMISSION_OS_VERSION,
    status,
    checkedAt: new Date().toISOString(),
    message,
    metrics,
  };
  db.insert(permHealthLog)
    .values({ status, message: message ?? null, metrics: metrics as any })
    .catch(() => {});
  return result;
}

// ── Control Center Feed (règle MOS #13/#14) ─────────────────────────────

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const health = await healthStatus();
  let events5m = 0;
  let errors24h = 0;
  try {
    const [r5] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(permResolutionLog)
      .where(gt(permResolutionLog.createdAt, new Date(Date.now() - 5 * 60 * 1000)));
    events5m = Number(r5?.n ?? 0);
    errors24h = health.metrics.denials24h; // proxy raisonnable
  } catch {
    // best-effort
  }
  return {
    engine: PERMISSION_OS_META.name,
    label: PERMISSION_OS_META.label,
    version: PERMISSION_OS_VERSION,
    maturityLevel: PERMISSION_OS_MATURITY,
    health: health.status,
    load: { events5m, events24h: health.metrics.resolutions24h },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: errors24h },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const health = await healthStatus();
  const businessMetrics = {
    active_policies: health.metrics.activePolicies,
    active_delegations: health.metrics.activeDelegations,
    active_grants: health.metrics.activeGrants,
    resolutions_24h: health.metrics.resolutions24h,
    denials_24h: health.metrics.denials24h,
    denial_rate_percent: health.metrics.denialRate,
  } as const;
  let recentEvents: EngineDashboard["recentEvents"] = [];
  let recentErrors: EngineDashboard["recentErrors"] = [];
  try {
    const rows = await db
      .select()
      .from(permResolutionLog)
      .orderBy(desc(permResolutionLog.createdAt))
      .limit(20);
    recentEvents = rows.map((r) => ({
      at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      action: `${r.allowed ? "allow" : "deny"} ${r.module}.${r.action}`,
      metadata: { reason: r.reason, policyId: r.policyId, role: r.role },
    }));
    recentErrors = rows
      .filter((r) => !r.allowed)
      .slice(0, 10)
      .map((r) => ({
        at: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
        message: `${r.role ?? "?"} → ${r.module}.${r.action} refusé (${r.reason})`,
      }));
  } catch {
    // best-effort
  }
  return { ...feed, businessMetrics, recentEvents, recentErrors };
}

// ── Délégations (identity → identity) ───────────────────────────────────

export async function createDelegation(input: {
  fromIdentityId: number;
  toIdentityId: number;
  module: string;
  action?: string;
  reason?: string;
  expiresAt?: Date;
}) {
  const [row] = await db
    .insert(permDelegations)
    .values({
      fromIdentityId: input.fromIdentityId,
      toIdentityId: input.toIdentityId,
      module: input.module,
      action: input.action ?? "voir",
      reason: input.reason ?? null,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();
  return row;
}

export async function revokeDelegation(delegationId: number, reason = "revoked") {
  const [row] = await db
    .update(permDelegations)
    .set({ revokedAt: new Date(), revokedReason: reason })
    .where(eq(permDelegations.id, delegationId))
    .returning();
  return row ?? null;
}

export async function listDelegations(identityId: number, direction: "from" | "to" | "both" = "both") {
  const where =
    direction === "from"
      ? eq(permDelegations.fromIdentityId, identityId)
      : direction === "to"
        ? eq(permDelegations.toIdentityId, identityId)
        : or(eq(permDelegations.fromIdentityId, identityId), eq(permDelegations.toIdentityId, identityId));
  return db.select().from(permDelegations).where(where).orderBy(desc(permDelegations.createdAt));
}

// ── Politiques (CRUD) ───────────────────────────────────────────────────

export async function createPolicy(input: {
  name: string;
  module: string;
  action: string;
  effect: "allow" | "deny";
  priority?: number;
  conditions?: PermissionPolicyCondition;
  active?: boolean;
  createdBy?: number;
  expiresAt?: Date;
}) {
  const [row] = await db
    .insert(permPolicies)
    .values({
      name: input.name,
      module: input.module,
      action: input.action,
      effect: input.effect,
      priority: input.priority ?? 100,
      conditions: (input.conditions ?? {}) as any,
      active: input.active ?? true,
      createdBy: input.createdBy ?? null,
      expiresAt: input.expiresAt ?? null,
    })
    .returning();
  return row;
}

export async function updatePolicy(id: number, patch: Partial<{ name: string; effect: "allow" | "deny"; priority: number; conditions: PermissionPolicyCondition; active: boolean; expiresAt: Date | null }>) {
  const [row] = await db
    .update(permPolicies)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.effect !== undefined ? { effect: patch.effect } : {}),
      ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
      ...(patch.conditions !== undefined ? { conditions: patch.conditions as any } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
      ...(patch.expiresAt !== undefined ? { expiresAt: patch.expiresAt } : {}),
      updatedAt: new Date(),
    })
    .where(eq(permPolicies.id, id))
    .returning();
  return row ?? null;
}

export async function listPolicies(opts: { activeOnly?: boolean } = {}) {
  const q = db.select().from(permPolicies).orderBy(permPolicies.priority, desc(permPolicies.createdAt));
  if (opts.activeOnly) return q.where(eq(permPolicies.active, true));
  return q;
}

export async function deletePolicy(id: number) {
  // On désactive plutôt que supprimer (doctrine MOS #8 — jamais rien supprimé).
  const [row] = await db.update(permPolicies).set({ active: false, updatedAt: new Date() }).where(eq(permPolicies.id, id)).returning();
  return row ?? null;
}

// Rappel — permSecurityLog reste l'endroit historique pour l'audit UI/API,
// permResolutionLog concentre les décisions moteur. Les deux coexistent.
export { permSecurityLog };
