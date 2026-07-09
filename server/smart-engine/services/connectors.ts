/**
 * Connexion du Système Intelligent aux autres moteurs (§ "connecter le
 * Système Intelligent à tous les moteurs + API").
 *
 * Le Système Intelligent agit comme hub d'observation : il lit (lecture
 * seule) une synthèse des autres moteurs isolés et l'expose au PDG dans un
 * onglet unique « Moteurs connectés ». Chaque nouveau moteur installé sera
 * ajouté ici.
 */
import { db } from "../../db.js";
import { gte, sql } from "drizzle-orm";
import { smartAlerts, smartHealthChecks } from "../schema.js";
import { permSecurityLog, permTemporaryGrants } from "../../permission-engine/schema.js";
import { redirRules, redirLogs } from "../../redirection-engine/schema.js";

export interface EngineMetric {
  label: string;
  value: number | string;
}

export interface EngineStatus {
  key: string;
  name: string;
  status: "actif" | "prévu";
  description: string;
  controlPath?: string; // centre de contrôle PDG
  metrics: EngineMetric[];
}

export async function getEnginesOverview(): Promise<EngineStatus[]> {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // ── Système Intelligent (self) ───────────────────────────────────────
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

  // ── Permission Engine ────────────────────────────────────────────────
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

  return [
    {
      key: "smart",
      name: "Système Intelligent MKA.P-MS",
      status: "actif",
      description: "Analyse, mémoire, recommandations, santé, apprentissage.",
      controlPath: "/superadmin/smart-engine",
      metrics: [
        { label: "Alertes ouvertes", value: alertRow?.open ?? 0 },
        { label: "Alertes critiques", value: alertRow?.critical ?? 0 },
        { label: "Éléments cassés", value: healthRow?.broken ?? 0 },
        { label: "Éléments surveillés", value: healthRow?.total ?? 0 },
      ],
    },
    {
      key: "permission",
      name: "Permission Engine",
      status: "actif",
      description: "Contrôle des accès (rôles, API, menus), journal de sécurité, accès temporaires.",
      controlPath: "/superadmin/permission-engine",
      metrics: [
        { label: "Événements (24h)", value: permRow?.total ?? 0 },
        { label: "Accès refusés (24h)", value: permRow?.denied ?? 0 },
        { label: "Accès temporaires actifs", value: grantRow?.active ?? 0 },
      ],
    },
    await (async () => {
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
      return {
        key: "redirection",
        name: "Moteur de Redirection",
        status: "actif" as const,
        description: "Gestion centralisée des redirections (boutons, services, routes) — plus de câblage en dur.",
        controlPath: "/superadmin/redirection-engine",
        metrics: [
          { label: "Règles", value: ruleRow?.total ?? 0 },
          { label: "Règles actives", value: ruleRow?.active ?? 0 },
          { label: "Redirections servies", value: ruleRow?.hits ?? 0 },
          { label: "Clés sans règle (24h)", value: logRow?.unmatched24h ?? 0 },
        ],
      };
    })(),
  ];
}
