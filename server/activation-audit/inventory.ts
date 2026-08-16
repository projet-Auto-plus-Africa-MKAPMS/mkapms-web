/**
 * MKA.P-MS Activation Audit — Collecte des preuves (point 91).
 *
 * Aucune liste de fonctionnalités n'est écrite en dur ici : l'inventaire est
 * reconstruit à chaque exécution à partir de ce que la plateforme expose
 * réellement —
 *   • le registre central des moteurs (état opérationnel calculé) ;
 *   • la surface tRPC (espaces et procédures réellement montés) ;
 *   • les routes visiteur déclarées côté client ;
 *   • le stockage de chaque domaine (lignes réellement présentes) ;
 *   • les preuves de test enregistrées.
 *
 * Ajouter un moteur, un espace tRPC ou une route les fait apparaître ici sans
 * modifier une seule ligne de ce fichier.
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { CLIENT_ROUTES } from "../data/client-routes.js";
import { ENGINE_PROBES } from "../engine-registry/probes.js";
import { registryOverview, type EngineReadiness } from "../engine-registry/readiness.js";
import { activationTestEvidence } from "./schema.js";

/** Clé de domaine normalisée : sans accents, sans séparateurs, en minuscules. */
export function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/** Variantes acceptables d'un même domaine : « voEngine », « vo_engine », « vo ». */
export function keyVariants(value: string): string[] {
  const base = normalizeKey(value);
  const stripped = base.replace(/(engine|os|router|service)$/g, "");
  return Array.from(new Set([base, stripped].filter((v) => v.length >= 2)));
}

export interface RouterSurface {
  /** Espace tRPC : « seo », « paymentOrchestrator »… */
  namespace: string;
  queries: number;
  mutations: number;
}

/**
 * Espaces tRPC réellement montés dans l'application.
 *
 * Import différé : le routeur importe ce module (l'audit y est monté), le lire
 * au chargement créerait un cycle.
 */
export async function collectRouterSurface(): Promise<RouterSurface[]> {
  const { appRouter } = await import("../router.js");
  const procedures = (appRouter as unknown as {
    _def: { procedures: Record<string, { _def?: { type?: string } }> };
  })._def.procedures;

  const byNamespace = new Map<string, RouterSurface>();
  for (const [path, proc] of Object.entries(procedures)) {
    const namespace = path.split(".")[0];
    if (!namespace) continue;
    const entry = byNamespace.get(namespace) ?? { namespace, queries: 0, mutations: 0 };
    if (proc?._def?.type === "mutation") entry.mutations += 1;
    else entry.queries += 1;
    byNamespace.set(namespace, entry);
  }
  return [...byNamespace.values()].sort((a, b) => a.namespace.localeCompare(b.namespace));
}

export interface RouteFamily {
  /** Premier segment significatif de l'URL : « acheter », « garages »… */
  segment: string;
  routes: string[];
}

/** Familles de routes visiteur, regroupées par segment d'URL. */
export function collectRouteFamilies(): RouteFamily[] {
  const families = new Map<string, RouteFamily>();
  for (const route of CLIENT_ROUTES) {
    const segments = route.split("/").filter(Boolean);
    if (segments.length === 0) continue;
    for (const segment of segments.slice(0, 2)) {
      if (segment.startsWith(":")) continue;
      const key = normalizeKey(segment);
      if (!key) continue;
      const entry = families.get(key) ?? { segment: key, routes: [] };
      if (!entry.routes.includes(route)) entry.routes.push(route);
      families.set(key, entry);
    }
  }
  return [...families.values()];
}

export interface DomainUsage {
  engine: string;
  /** Lignes réellement présentes dans le stockage du domaine. */
  rows: number;
  tablesPresentes: number;
  tablesAbsentes: string[];
}

/** Le domaine porte-t-il de vraies données, ou seulement du code ? */
export async function collectUsage(): Promise<Map<string, DomainUsage>> {
  const usage = new Map<string, DomainUsage>();
  for (const probe of ENGINE_PROBES) {
    let rows = 0;
    let tablesPresentes = 0;
    const tablesAbsentes: string[] = [];
    for (const table of probe.tables) {
      // Le nom vient du catalogue interne ; on refuse tout de même un
      // identifiant non conforme avant de le concaténer.
      if (!/^[a-z0-9_]+$/.test(table)) {
        tablesAbsentes.push(table);
        continue;
      }
      try {
        const res = await db.execute(
          sql`SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ${table}`,
        );
        const exists = Number((res.rows?.[0] as { n?: number })?.n ?? 0) > 0;
        if (!exists) {
          tablesAbsentes.push(table);
          continue;
        }
        tablesPresentes += 1;
        const count = await db.execute(sql.raw(`SELECT COUNT(*)::int AS n FROM "${table}"`));
        rows += Number((count.rows?.[0] as { n?: number })?.n ?? 0);
      } catch {
        tablesAbsentes.push(table);
      }
    }
    usage.set(probe.engine, { engine: probe.engine, rows, tablesPresentes, tablesAbsentes });
  }
  return usage;
}

export interface TestEvidenceSummary {
  domain: string;
  scenarios: number;
  passed: number;
  total: number;
  allSuccess: boolean;
  lastAt: string | null;
}

/** Preuves de test enregistrées — la seule chose qui rend un domaine « testé ». */
export async function collectTestEvidence(): Promise<Map<string, TestEvidenceSummary>> {
  const rows = await db.select().from(activationTestEvidence);
  const byDomain = new Map<string, TestEvidenceSummary>();
  for (const row of rows) {
    const key = normalizeKey(row.domain);
    const entry =
      byDomain.get(key) ??
      ({ domain: row.domain, scenarios: 0, passed: 0, total: 0, allSuccess: true, lastAt: null } as TestEvidenceSummary);
    entry.scenarios += 1;
    entry.passed += row.passed;
    entry.total += row.total;
    entry.allSuccess = entry.allSuccess && row.success;
    const at = row.recordedAt ? new Date(row.recordedAt).toISOString() : null;
    if (at && (!entry.lastAt || at > entry.lastAt)) entry.lastAt = at;
    byDomain.set(key, entry);
  }
  return byDomain;
}

export interface Inventory {
  engines: EngineReadiness[];
  routers: RouterSurface[];
  routeFamilies: RouteFamily[];
  usage: Map<string, DomainUsage>;
  tests: Map<string, TestEvidenceSummary>;
}

export async function collectInventory(): Promise<Inventory> {
  const [overview, routers, usage, tests] = await Promise.all([
    registryOverview(),
    collectRouterSurface(),
    collectUsage(),
    collectTestEvidence(),
  ]);
  return {
    engines: overview.moteurs,
    routers,
    routeFamilies: collectRouteFamilies(),
    usage,
    tests,
  };
}
