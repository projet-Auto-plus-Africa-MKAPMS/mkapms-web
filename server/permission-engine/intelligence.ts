/**
 * Permission OS — Moteur d'intelligence contextuelle (niveau 2)
 *
 * Résout une demande d'accès en combinant deux niveaux :
 *   Niveau 1 — Permissions classiques (matrice rôle → modules) via
 *              `shared/permissions.ts` (existant, source de vérité).
 *   Niveau 2 — Politiques contextuelles évaluées dynamiquement (règles
 *              pays × type × rôle × abonnement × contrat × univers ×
 *              ancienneté × device × risk).
 *
 * Ordre d'évaluation :
 *   1. Délégations actives  → si trouvée & non expirée / non révoquée  → allow
 *   2. Grants temporaires   → existant `permTemporaryGrants`           → allow
 *   3. Politiques DENY      → tri par priorité, premier match          → deny
 *   4. Matrice rôle         → si autorisé                              → allow
 *   5. Politiques ALLOW     → tri par priorité, premier match          → allow
 *   6. Défaut               →                                           → deny
 *
 * Chaque décision est journalisée (`perm_resolution_log`) et renvoyée avec
 * une explication FR lisible (règle PDG : « expliquer les refus »).
 */
import { and, desc, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { canAccessModule } from "@shared/permissions.js";
import { permDelegations, permPolicies, permResolutionLog, permTemporaryGrants } from "./schema.js";
import type {
  PermissionAction,
  PermissionContext,
  PermissionDecision,
  PermissionModule,
  PermissionPolicy,
  PermissionPolicyCondition,
} from "./contract.js";

// ── Évaluation d'une condition sur un contexte ──────────────────────────
function contextMatchesConditions(ctx: PermissionContext, cond: PermissionPolicyCondition): boolean {
  if (cond.roles?.length && !cond.roles.includes(ctx.role)) return false;
  if (cond.identityTypes?.length && ctx.identityType && !cond.identityTypes.includes(ctx.identityType)) return false;
  if (cond.countries?.length && (!ctx.countryCode || !cond.countries.includes(ctx.countryCode))) return false;
  if (cond.countriesExcept?.length && ctx.countryCode && cond.countriesExcept.includes(ctx.countryCode)) return false;
  if (cond.universes?.length && (!ctx.universe || !cond.universes.includes(ctx.universe))) return false;
  if (cond.subscriptionTiers?.length && (!ctx.subscriptionTier || !cond.subscriptionTiers.includes(ctx.subscriptionTier))) return false;
  if (cond.contractTypes?.length && (!ctx.contractType || !cond.contractTypes.includes(ctx.contractType))) return false;
  if (cond.minAccountAgeDays !== undefined && (ctx.accountAgeDays ?? 0) < cond.minAccountAgeDays) return false;
  if (cond.maxRiskScore !== undefined && (ctx.riskScore ?? 0) > cond.maxRiskScore) return false;
  if (cond.requireDeviceTrusted && !ctx.deviceTrusted) return false;
  // Fenêtre horaire — évaluation "now" du contexte, ou heure serveur.
  if (cond.timeWindow) {
    const now = ctx.now ?? new Date();
    const dow = now.getUTCDay();
    const hour = now.getUTCHours();
    if (cond.timeWindow.dayOfWeek?.length && !cond.timeWindow.dayOfWeek.includes(dow)) return false;
    if (cond.timeWindow.hourFrom !== undefined && hour < cond.timeWindow.hourFrom) return false;
    if (cond.timeWindow.hourTo !== undefined && hour > cond.timeWindow.hourTo) return false;
  }
  return true;
}

/**
 * Résolution complète — retourne une `PermissionDecision` traçable.
 * Ne journalise QUE si `record=true` (par défaut) pour permettre les
 * simulations sans polluer les logs.
 */
export async function resolvePermission(
  ctx: PermissionContext,
  module: PermissionModule,
  action: PermissionAction = "voir",
  opts: { record?: boolean } = { record: true },
): Promise<PermissionDecision> {
  const now = ctx.now ?? new Date();
  const summary: Partial<PermissionContext> = {
    role: ctx.role,
    identityType: ctx.identityType,
    countryCode: ctx.countryCode,
    universe: ctx.universe,
    subscriptionTier: ctx.subscriptionTier,
  };

  const decide = async (
    allowed: boolean,
    reason: PermissionDecision["reason"],
    policyId: number | null,
    human: string,
  ): Promise<PermissionDecision> => {
    const dec: PermissionDecision = {
      allowed,
      reason,
      policyId,
      humanExplanation: human,
      evaluatedAt: now.toISOString(),
      contextSummary: summary,
    };
    if (opts.record !== false) {
      db.insert(permResolutionLog)
        .values({
          identityId: ctx.identityId ?? null,
          userId: ctx.userId ?? null,
          role: ctx.role,
          module,
          action,
          allowed,
          reason,
          policyId,
          context: summary as any,
        })
        .catch(() => {});
    }
    return dec;
  };

  // 1. Délégation active (identité → identité, module compatible)
  if (ctx.identityId) {
    const [delegation] = await db
      .select()
      .from(permDelegations)
      .where(
        and(
          eq(permDelegations.toIdentityId, ctx.identityId),
          eq(permDelegations.module, module),
          isNull(permDelegations.revokedAt),
          or(isNull(permDelegations.expiresAt), gt(permDelegations.expiresAt, now)),
        ),
      )
      .limit(1);
    if (delegation) {
      return decide(true, "delegation_pass", null, `Accès accordé par délégation active sur ${module}.`);
    }
  }

  // 2. Grants temporaires (existant, table `perm_temporary_grants`)
  if (ctx.userId) {
    const [grant] = await db
      .select()
      .from(permTemporaryGrants)
      .where(
        and(
          eq(permTemporaryGrants.userId, ctx.userId),
          eq(permTemporaryGrants.module, module),
          eq(permTemporaryGrants.revoked, false),
          or(isNull(permTemporaryGrants.expiresAt), gt(permTemporaryGrants.expiresAt, now)),
        ),
      )
      .limit(1);
    if (grant) {
      // Grants sont read-only par défaut → refuse actions destructives.
      const destructive: PermissionAction[] = ["creer", "modifier", "supprimer", "publier", "archiver", "valider"];
      if (grant.readOnly && destructive.includes(action)) {
        return decide(false, "readonly_action", null, `Accès temporaire en lecture seule — action « ${action} » refusée.`);
      }
      return decide(true, "temporary_grant_pass", null, `Accès accordé par autorisation temporaire du PDG.`);
    }
  }

  // 3. Politiques actives — évaluation par priorité, DENY d'abord.
  const policies = await db
    .select()
    .from(permPolicies)
    .where(
      and(
        eq(permPolicies.active, true),
        or(isNull(permPolicies.expiresAt), gt(permPolicies.expiresAt, now)),
      ),
    )
    .orderBy(permPolicies.priority);

  const applicable = policies.filter((p) => {
    if (p.module !== "*" && p.module !== module) return false;
    if (p.action !== "*" && p.action !== action) return false;
    return contextMatchesConditions(ctx, p.conditions as PermissionPolicyCondition);
  });

  // Deny explicite → gagne
  const denyPolicy = applicable.find((p) => p.effect === "deny");
  if (denyPolicy) {
    return decide(false, "policy_deny", denyPolicy.id, `Refusé par la règle « ${denyPolicy.name} ».`);
  }

  // 4. Matrice rôle (niveau 1 — permissions classiques)
  if (canAccessModule(ctx.role, module)) {
    return decide(true, "role_matrix_pass", null, `Accès accordé par la matrice de rôle (${ctx.role} → ${module}).`);
  }

  // 5. Allow explicite via politique → gagne malgré la matrice négative
  const allowPolicy = applicable.find((p) => p.effect === "allow");
  if (allowPolicy) {
    return decide(true, "policy_pass", allowPolicy.id, `Accès accordé par la règle contextuelle « ${allowPolicy.name} ».`);
  }

  // 6. Aucun match → refus par défaut
  return decide(
    false,
    applicable.length === 0 ? "no_matching_rule" : "role_matrix_deny",
    null,
    `Aucune règle n'autorise le rôle ${ctx.role} à accéder à ${module}.`,
  );
}

/** Simulation — même logique sans journalisation. */
export function simulatePermission(ctx: PermissionContext, module: PermissionModule, action: PermissionAction = "voir") {
  return resolvePermission(ctx, module, action, { record: false });
}

/** Comptage rapide des décisions dans une fenêtre (pour Health + Dashboard). */
export async function countRecentDecisions(sinceMin = 5): Promise<{ allowed: number; denied: number; total: number }> {
  const since = new Date(Date.now() - sinceMin * 60 * 1000);
  const [row] = await db
    .select({
      allowed: sql<number>`count(*) filter (where ${permResolutionLog.allowed} = true)::int`,
      denied: sql<number>`count(*) filter (where ${permResolutionLog.allowed} = false)::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(permResolutionLog)
    .where(gt(permResolutionLog.createdAt, since));
  return {
    allowed: Number(row?.allowed ?? 0),
    denied: Number(row?.denied ?? 0),
    total: Number(row?.total ?? 0),
  };
}

export async function recentResolutions(limit = 100, onlyDenied = false) {
  const q = db.select().from(permResolutionLog).orderBy(desc(permResolutionLog.createdAt)).limit(limit);
  if (onlyDenied) return q.where(eq(permResolutionLog.allowed, false));
  return q;
}

// Petit garde-fou pour éviter le tree-shake abusif de `lte` importé.
export const _internalOps = { lte };
