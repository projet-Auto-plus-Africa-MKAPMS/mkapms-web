/**
 * Connexion du Système Intelligent aux autres moteurs (§ "connecter le
 * Système Intelligent à tous les moteurs + API").
 *
 * Le Système Intelligent agit comme hub d'observation : il lit (lecture
 * seule) TOUS les moteurs déclarés dans le registre central (`engine_registry`)
 * et l'expose au PDG dans un onglet unique « Moteurs connectés ». Chaque moteur
 * installé (via le registre central) y apparaît automatiquement, avec son état,
 * sa santé, sa version, ses dépendances et son dernier signal.
 *
 * Pour les 3 moteurs disposant de métriques métier détaillées (Système
 * Intelligent lui-même, Permission, Redirection), on enrichit la synthèse avec
 * leurs indicateurs propres. Lecture seule : aucune écriture dans les tables
 * d'autrui, aucune décision humaine automatisée.
 */
import { db } from "../../db.js";
import { gte, sql } from "drizzle-orm";
import { smartAlerts, smartHealthChecks } from "../schema.js";
import { permSecurityLog, permTemporaryGrants } from "../../permission-engine/schema.js";
import { redirRules, redirLogs } from "../../redirection-engine/schema.js";
import { listEngines } from "../../engine-registry/service.js";

export interface EngineMetric {
  label: string;
  value: number | string;
}

export interface EngineStatus {
  key: string;
  name: string;
  category: string;
  status: "actif" | "prévu";
  /** État réel dans le registre central : active/read_only/maintenance/staging/disabled. */
  state: string;
  /** Santé remontée par heartbeat : ok/degraded/down/unknown. */
  health: string;
  version: string;
  dependencies: string[];
  lastHeartbeat: string | null;
  description: string;
  controlPath?: string; // centre de contrôle PDG dédié
  metrics: EngineMetric[];
}

/** Centre de contrôle dédié de chaque moteur (si une page existe). */
const CONTROL_ROUTE: Record<string, string> = {
  core: "/superadmin/core-engine-beta",
  identity: "/superadmin/identity-os",
  smart: "/superadmin/smart-engine",
  permission: "/superadmin/permission-engine",
  country: "/superadmin/country-os",
  language: "/superadmin/language-os",
  notification: "/superadmin/notification-os",
  redirection: "/superadmin/redirection-engine",
};

/** États du registre considérés comme « en service » pour l'affichage. */
const LIVE_STATES = new Set(["active", "read_only", "maintenance"]);

/**
 * Calcule les métriques métier détaillées des moteurs qui en exposent.
 * Chaque bloc est protégé : si une table manque (moteur non migré), on
 * renvoie simplement aucune métrique pour ce moteur, sans casser le hub.
 */
async function richMetricsByKey(): Promise<Record<string, EngineMetric[]>> {
  const out: Record<string, EngineMetric[]> = {};
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ── Système Intelligent (self) ───────────────────────────────────────
  try {
    const [alertRow] = await db
      .select({
        open: sql<number>`count(*) filter (where ${smartAlerts.status} = 'open')::int`,
        critical: sql<number>`count(*) filter (where ${smartAlerts.severity} = 'critical' and ${smartAlerts.status} = 'open')::int`,
      })
      .from(smartAlerts);
    const [healthRow] = await db
      .select({
        broken: sql<number>`count(*) filter (where ${smartHealthChecks.status} = 'broken')::int`,
        total: sql<number>`count(*)::int`,
      })
      .from(smartHealthChecks);
    out.smart = [
      { label: "Alertes ouvertes", value: alertRow?.open ?? 0 },
      { label: "Alertes critiques", value: alertRow?.critical ?? 0 },
      { label: "Éléments cassés", value: healthRow?.broken ?? 0 },
      { label: "Éléments surveillés", value: healthRow?.total ?? 0 },
    ];
  } catch {
    /* table indisponible — pas de métriques détaillées */
  }

  // ── Permission Engine ────────────────────────────────────────────────
  try {
    const [permRow] = await db
      .select({
        total: sql<number>`count(*)::int`,
        denied: sql<number>`count(*) filter (where ${permSecurityLog.allowed} = false)::int`,
      })
      .from(permSecurityLog)
      .where(gte(permSecurityLog.createdAt, since24h));
    const [grantRow] = await db
      .select({
        active: sql<number>`count(*) filter (where ${permTemporaryGrants.revoked} = false)::int`,
      })
      .from(permTemporaryGrants);
    out.permission = [
      { label: "Événements (24h)", value: permRow?.total ?? 0 },
      { label: "Accès refusés (24h)", value: permRow?.denied ?? 0 },
      { label: "Accès temporaires actifs", value: grantRow?.active ?? 0 },
    ];
  } catch {
    /* ignore */
  }

  // ── Redirection Engine ───────────────────────────────────────────────
  try {
    const [ruleRow] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${redirRules.active} = true)::int`,
        hits: sql<number>`coalesce(sum(${redirRules.hitCount}), 0)::int`,
      })
      .from(redirRules);
    const [logRow] = await db
      .select({
        unmatched24h: sql<number>`count(*) filter (where ${redirLogs.matched} = false)::int`,
      })
      .from(redirLogs)
      .where(gte(redirLogs.createdAt, since24h));
    out.redirection = [
      { label: "Règles", value: ruleRow?.total ?? 0 },
      { label: "Règles actives", value: ruleRow?.active ?? 0 },
      { label: "Redirections servies", value: ruleRow?.hits ?? 0 },
      { label: "Clés sans règle (24h)", value: logRow?.unmatched24h ?? 0 },
    ];
  } catch {
    /* ignore */
  }

  return out;
}

/**
 * Synthèse de TOUS les moteurs installés (source : registre central), enrichie
 * des métriques métier pour ceux qui en exposent. C'est ce qui « connecte » le
 * Système Intelligent à l'ensemble des moteurs de la plateforme.
 */
export async function getEnginesOverview(): Promise<EngineStatus[]> {
  const [engines, rich] = await Promise.all([listEngines(), richMetricsByKey()]);

  return engines.map((e): EngineStatus => {
    const state = e.state ?? "disabled";
    const health = e.health ?? "unknown";
    const summary: EngineMetric[] = [
      { label: "Santé", value: health },
      { label: "État", value: state },
      { label: "Version", value: `v${e.version ?? "0.0.0"}` },
      { label: "Dépendances", value: (e.dependencies ?? []).length },
    ];
    return {
      key: e.name,
      name: e.label,
      category: e.category,
      status: LIVE_STATES.has(state) ? "actif" : "prévu",
      state,
      health,
      version: e.version ?? "0.0.0",
      dependencies: (e.dependencies ?? []) as string[],
      lastHeartbeat: e.lastHeartbeat ? new Date(e.lastHeartbeat).toISOString() : null,
      description: e.description ?? "",
      controlPath: CONTROL_ROUTE[e.name],
      // Métriques métier détaillées si disponibles, sinon synthèse registre.
      metrics: rich[e.name] ?? summary,
    };
  });
}
