/**
 * MKA.P-MS Redirection Engine — Service (logique métier).
 */
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { redirRules, redirLogs } from "./schema.js";
import { DEFAULT_REDIRECT_RULES } from "./catalog.js";
import { logActivity } from "../smart-engine/services/activity-log.js";

export interface ResolveResult {
  matched: boolean;
  target: string | null;
  external: boolean;
  key: string;
}

/**
 * Résout une clé vers sa destination selon les règles actives (priorité la
 * plus haute d'abord). Journalise la résolution et incrémente le compteur.
 */
export async function resolveKey(
  key: string,
  who?: { userId?: number; role?: string; source?: string },
): Promise<ResolveResult> {
  const [rule] = await db
    .select()
    .from(redirRules)
    .where(and(eq(redirRules.key, key), eq(redirRules.active, true)))
    .orderBy(desc(redirRules.priority), desc(redirRules.updatedAt))
    .limit(1);

  const matched = !!rule;

  await db.insert(redirLogs).values({
    key,
    matched,
    resolvedTo: rule?.target ?? null,
    source: who?.source ?? null,
    outcome: matched ? "resolved" : "unmatched",
    userId: who?.userId ?? null,
    role: who?.role ?? null,
  });

  if (rule) {
    await db
      .update(redirRules)
      .set({ hitCount: sql`${redirRules.hitCount} + 1` })
      .where(eq(redirRules.id, rule.id));
    return { matched: true, target: rule.target, external: !!rule.external, key };
  }
  return { matched: false, target: null, external: false, key };
}

/**
 * Enregistre le RÉSULTAT réel d'un parcours (rapporté par le client après la
 * navigation) : clic navigué, page introuvable (404), ou erreur. C'est ce qui
 * permet au moteur de superviser les parcours de bout en bout et de remonter
 * automatiquement les redirections cassées.
 */
export interface OutcomeInput {
  key: string;
  source?: string;
  outcome: "navigated" | "not_found" | "error";
  resolvedTo?: string;
  durationMs?: number;
  error?: string;
}

export async function reportOutcome(
  input: OutcomeInput,
  who?: { userId?: number; role?: string },
): Promise<{ recorded: true }> {
  await db.insert(redirLogs).values({
    key: input.key.slice(0, 128),
    matched: input.outcome !== "not_found",
    resolvedTo: input.resolvedTo?.slice(0, 512) ?? null,
    source: input.source?.slice(0, 256) ?? null,
    outcome: input.outcome,
    durationMs: input.durationMs ?? null,
    error: input.error ?? null,
    userId: who?.userId ?? null,
    role: who?.role ?? null,
  });
  return { recorded: true };
}

/**
 * Normalise un chemin d'URL : retire query/hash et le "/" final.
 */
function normalizePath(input: string): string {
  let p = input;
  try { p = decodeURI(p); } catch { /* garde tel quel */ }
  p = p.split("?")[0].split("#")[0].trim();
  if (p.length > 1 && p.endsWith("/")) p = p.replace(/\/+$/, "");
  return p || "/";
}

export interface HealResult {
  healed: boolean;
  target: string | null;
  source: string;
}

/**
 * AUTO-RÉSOLUTION DES 404 (règle utilisateur : « quand on clique sur un truc
 * 404, il règle le problème à 100 % »).
 *
 * Appelée par la page 404 : le moteur cherche un alias de chemin actif
 * ("path:<chemin>") ; s'il en trouve un, il renvoie la destination pour une
 * redirection immédiate, journalise le succès (outcome "auto_healed") et
 * l'enregistre dans le Journal du Système Intelligent (apprentissage). Sinon,
 * il journalise le 404 non résolu pour que le PDG/Smart Engine crée une règle.
 */
export async function resolvePath(
  pathname: string,
  who?: { userId?: number; role?: string },
): Promise<HealResult> {
  const path = normalizePath(pathname);
  const key = `path:${path}`;

  const [rule] = await db
    .select()
    .from(redirRules)
    .where(and(eq(redirRules.key, key), eq(redirRules.active, true)))
    .orderBy(desc(redirRules.priority), desc(redirRules.updatedAt))
    .limit(1);

  if (rule && rule.target && normalizePath(rule.target) !== path) {
    await db.insert(redirLogs).values({
      key,
      matched: true,
      resolvedTo: rule.target,
      source: path.slice(0, 256),
      outcome: "auto_healed",
      userId: who?.userId ?? null,
      role: who?.role ?? null,
    });
    await db
      .update(redirRules)
      .set({ hitCount: sql`${redirRules.hitCount} + 1` })
      .where(eq(redirRules.id, rule.id));

    // Apprentissage : consigner dans le Journal du Système Intelligent COMMENT
    // le problème a été résolu (non bloquant).
    try {
      await logActivity({
        action: "redirection.auto_heal",
        userId: who?.userId,
        targetType: "route",
        data: { from: path, to: rule.target },
        result: "success",
        proposedDecision: `Page introuvable ${path} redirigée automatiquement vers ${rule.target}`,
      });
    } catch { /* journal best-effort */ }

    return { healed: true, target: rule.target, source: path };
  }

  // Aucun correctif connu → journaliser le 404 pour apprentissage/supervision.
  await db.insert(redirLogs).values({
    key: "route_404",
    matched: false,
    source: path.slice(0, 256),
    outcome: "not_found",
    userId: who?.userId ?? null,
    role: who?.role ?? null,
  });
  return { healed: false, target: null, source: path };
}

/**
 * Redirections cassées des 7 derniers jours : clés sans règle, pages 404 et
 * erreurs, regroupées par clé + source avec leur nombre et la dernière erreur.
 * Alimente le centre de contrôle PDG et le Système Intelligent.
 */
export async function getBrokenRedirects(limit = 50) {
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return db
    .select({
      key: redirLogs.key,
      source: redirLogs.source,
      outcome: redirLogs.outcome,
      count: sql<number>`count(*)::int`,
      lastError: sql<string | null>`max(${redirLogs.error})`,
      lastSeen: sql<Date>`max(${redirLogs.createdAt})`,
    })
    .from(redirLogs)
    .where(
      and(
        inArray(redirLogs.outcome, ["unmatched", "not_found", "error"]),
        sql`${redirLogs.createdAt} >= ${since7d}`,
      ),
    )
    .groupBy(redirLogs.key, redirLogs.source, redirLogs.outcome)
    .orderBy(desc(sql`count(*)`))
    .limit(limit);
}

export async function listRules() {
  return db
    .select()
    .from(redirRules)
    .orderBy(desc(redirRules.priority), desc(redirRules.updatedAt));
}

export interface RuleInput {
  key: string;
  label: string;
  kind?: string;
  target: string;
  external?: boolean;
  active?: boolean;
  priority?: number;
  description?: string;
}

export async function createRule(input: RuleInput, userId: number) {
  const [row] = await db
    .insert(redirRules)
    .values({
      key: input.key.trim(),
      label: input.label.trim(),
      kind: input.kind ?? "button",
      target: input.target.trim(),
      external: input.external ?? false,
      active: input.active ?? true,
      priority: input.priority ?? 0,
      description: input.description ?? null,
      createdBy: userId,
      updatedBy: userId,
    })
    .returning();
  return row;
}

export async function updateRule(id: number, input: Partial<RuleInput>, userId: number) {
  const patch: Record<string, unknown> = { updatedBy: userId, updatedAt: new Date() };
  if (input.label !== undefined) patch.label = input.label.trim();
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.target !== undefined) patch.target = input.target.trim();
  if (input.external !== undefined) patch.external = input.external;
  if (input.active !== undefined) patch.active = input.active;
  if (input.priority !== undefined) patch.priority = input.priority;
  if (input.description !== undefined) patch.description = input.description;
  const [row] = await db.update(redirRules).set(patch).where(eq(redirRules.id, id)).returning();
  return row;
}

export async function deleteRule(id: number) {
  await db.delete(redirRules).where(eq(redirRules.id, id));
  return { deleted: true };
}

export async function getStats() {
  const [ruleTotals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${redirRules.active} = true)::int`,
      hits: sql<number>`coalesce(sum(${redirRules.hitCount}), 0)::int`,
    })
    .from(redirRules);

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [logTotals] = await db
    .select({
      resolutions24h: sql<number>`count(*)::int`,
      unmatched24h: sql<number>`count(*) filter (where ${redirLogs.matched} = false)::int`,
      notFound24h: sql<number>`count(*) filter (where ${redirLogs.outcome} = 'not_found')::int`,
      errors24h: sql<number>`count(*) filter (where ${redirLogs.outcome} = 'error')::int`,
      autoHealed24h: sql<number>`count(*) filter (where ${redirLogs.outcome} = 'auto_healed')::int`,
    })
    .from(redirLogs)
    .where(sql`${redirLogs.createdAt} >= ${since24h}`);

  // Clés demandées sans règle (à configurer) — sur les 7 derniers jours.
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const unmatchedKeys = await db
    .select({ key: redirLogs.key, count: sql<number>`count(*)::int` })
    .from(redirLogs)
    .where(and(eq(redirLogs.matched, false), sql`${redirLogs.createdAt} >= ${since7d}`))
    .groupBy(redirLogs.key)
    .orderBy(desc(sql`count(*)`))
    .limit(20);

  return {
    totalRules: ruleTotals?.total ?? 0,
    activeRules: ruleTotals?.active ?? 0,
    totalHits: ruleTotals?.hits ?? 0,
    resolutions24h: logTotals?.resolutions24h ?? 0,
    unmatched24h: logTotals?.unmatched24h ?? 0,
    notFound24h: logTotals?.notFound24h ?? 0,
    errors24h: logTotals?.errors24h ?? 0,
    autoHealed24h: logTotals?.autoHealed24h ?? 0,
    unmatchedKeys,
  };
}

export async function getRecentLogs(limit = 100) {
  return db.select().from(redirLogs).orderBy(desc(redirLogs.createdAt)).limit(limit);
}

/**
 * Connecte le Moteur de Redirection à toute la plateforme : insère les règles
 * par défaut (univers, sous-sections, services, boutons/CTA) manquantes.
 *
 * 100% idempotent et NON destructif : on n'insère que les clés absentes et on
 * ne réécrase JAMAIS une règle déjà présente (le PDG garde le contrôle total
 * des destinations qu'il a personnalisées). Appelé au démarrage du serveur.
 */
export async function ensureDefaultRules(): Promise<{ inserted: number; existing: number }> {
  const keys = DEFAULT_REDIRECT_RULES.map((r) => r.key);
  const rows = await db
    .select({ key: redirRules.key })
    .from(redirRules)
    .where(inArray(redirRules.key, keys));
  const existing = new Set(rows.map((r) => r.key));

  const toInsert = DEFAULT_REDIRECT_RULES.filter((r) => !existing.has(r.key)).map((r) => ({
    key: r.key,
    label: r.label,
    kind: r.kind,
    target: r.target,
    external: false,
    active: true,
    priority: r.priority ?? 0,
    description: "Règle par défaut MKA.P-MS (modifiable par le PDG).",
  }));

  if (toInsert.length > 0) {
    await db.insert(redirRules).values(toInsert).onConflictDoNothing({ target: redirRules.key });
  }

  return { inserted: toInsert.length, existing: existing.size };
}
