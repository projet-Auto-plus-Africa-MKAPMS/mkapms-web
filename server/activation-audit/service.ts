/**
 * MKA.P-MS Activation Audit — Calcul et enregistrement (point 91).
 *
 * Pour chaque domaine : existe → connecté → activé → accessible → testé →
 * utilisé réellement → moteur connecté → Système Intelligent connecté.
 *
 * Règle non négociable : un domaine n'est jamais 🟢 parce que son code existe.
 * Il l'est quand chaque maillon est prouvé par une observation — une procédure
 * réellement montée, un battement de cœur reçu, des lignes en base, une preuve
 * de test enregistrée. À défaut, l'état porte le motif exact du manque.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import {
  activationAuditItems,
  activationAuditRuns,
  activationTestEvidence,
} from "./schema.js";
import {
  collectInventory,
  keyVariants,
  normalizeKey,
  type Inventory,
  type RouteFamily,
  type RouterSurface,
} from "./inventory.js";

export const ACTIVATION_STATES = [
  "operationnelle",
  "partielle",
  "non_connectee",
  "hors_service",
  "non_configuree",
] as const;

export type ActivationState = (typeof ACTIVATION_STATES)[number];

export const ACTIVATION_STATE_LABELS: Record<ActivationState, string> = {
  operationnelle: "🟢 Opérationnelle et testée",
  partielle: "🟡 Existe mais partielle",
  non_connectee: "🟠 Existe mais non connectée",
  hors_service: "🔴 Ne fonctionne pas",
  non_configuree: "⚪ Non configurée",
};

export interface AuditItem {
  domain: string;
  label: string;
  category: string;
  existe: boolean;
  connecte: boolean;
  active: boolean;
  accessible: boolean;
  teste: boolean;
  utilise: boolean;
  moteurConnecte: boolean;
  systemeIntelligentConnecte: boolean;
  etat: ActivationState;
  motif: string;
  preuves: Record<string, unknown>;
  manquant: string[];
}

/** Trouve l'espace tRPC correspondant à un moteur, sans table de correspondance figée. */
function matchRouter(engineName: string, routers: RouterSurface[]): RouterSurface | null {
  const variants = new Set(keyVariants(engineName));
  let fallback: RouterSurface | null = null;
  for (const r of routers) {
    const rVariants = keyVariants(r.namespace);
    if (rVariants.some((v) => variants.has(v))) return r;
    // Correspondance élargie : « accounting_internal » ↔ « accountingInternal ».
    if (!fallback && rVariants.some((v) => [...variants].some((e) => v.startsWith(e) || e.startsWith(v)))) {
      fallback = r;
    }
  }
  return fallback;
}

/** Familles de routes visiteur rattachables à ce moteur. */
function matchRoutes(engineName: string, families: RouteFamily[]): string[] {
  const variants = keyVariants(engineName);
  const routes: string[] = [];
  for (const family of families) {
    if (variants.some((v) => family.segment === v || family.segment.startsWith(v) || v.startsWith(family.segment))) {
      routes.push(...family.routes);
    }
  }
  return Array.from(new Set(routes));
}

function buildItem(engine: Inventory["engines"][number], inv: Inventory): AuditItem {
  const router = matchRouter(engine.name, inv.routers);
  const routes = matchRoutes(engine.name, inv.routeFamilies);
  const usage = inv.usage.get(engine.name) ?? null;
  const test =
    inv.tests.get(normalizeKey(engine.name)) ??
    keyVariants(engine.name)
      .map((v) => inv.tests.get(v))
      .find(Boolean) ??
    null;

  const existe = true; // présent au registre : le domaine est déclaré
  const moteurConnecte = engine.missingDependencies.length === 0;
  const connecte = !!router && moteurConnecte;
  const active = engine.operational === "ok" || engine.operational === "partiel";
  const accessible = routes.length > 0;
  const utilise = usage ? usage.rows > 0 : false;
  const teste = !!test && test.allSuccess && test.total > 0;
  // Le Système Intelligent observe tout moteur inscrit au registre (hub de
  // lecture) : la connexion est donc réelle dès l'inscription, mais elle ne
  // vaut que si le moteur émet un signal.
  const systemeIntelligentConnecte = !!engine.lastHeartbeat;

  const manquant: string[] = [];
  if (!router) manquant.push("aucune procédure tRPC exposée pour ce moteur");
  if (engine.missingDependencies.length > 0) {
    manquant.push(`dépendance absente du registre : ${engine.missingDependencies.join(", ")}`);
  }
  if (!engine.lastHeartbeat) manquant.push("aucun battement de cœur reçu");
  if (engine.heartbeatStale && engine.lastHeartbeat) manquant.push("dernier battement périmé");
  if (!accessible) manquant.push("aucune route visiteur rattachée");
  if (!utilise) manquant.push("aucune donnée réelle dans le stockage du domaine");
  if (!teste) manquant.push("aucune preuve de test enregistrée");
  if (usage && usage.tablesAbsentes.length > 0) {
    manquant.push(`table(s) absente(s) : ${usage.tablesAbsentes.join(", ")}`);
  }

  let etat: ActivationState;
  let motif: string;
  if (engine.operational === "hors_service") {
    etat = "hors_service";
    motif = engine.reason;
  } else if (engine.operational === "non_configure") {
    etat = "non_configuree";
    motif = engine.reason;
  } else if (!connecte) {
    etat = "non_connectee";
    motif = router
      ? `Dépendance manquante : ${engine.missingDependencies.join(", ")}.`
      : "Le moteur est déclaré et vivant mais aucune procédure tRPC ne l'expose : rien ne peut l'appeler.";
  } else if (teste && active && utilise && systemeIntelligentConnecte) {
    etat = "operationnelle";
    motif = `Exposé (${router!.queries + router!.mutations} procédures), vivant, ${usage?.rows ?? 0} enregistrement(s), ${test!.passed}/${test!.total} test(s) réussi(s).`;
  } else {
    etat = "partielle";
    motif = manquant.length > 0 ? `Il manque : ${manquant.join(" ; ")}.` : engine.reason;
  }

  return {
    domain: engine.name,
    label: engine.label,
    category: engine.category,
    existe,
    connecte,
    active,
    accessible,
    teste,
    utilise,
    moteurConnecte,
    systemeIntelligentConnecte,
    etat,
    motif,
    preuves: {
      registre: {
        etat: engine.state,
        sante: engine.health,
        operationnel: engine.operational,
        dernierBattement: engine.lastHeartbeat,
        dependances: engine.dependencies,
      },
      trpc: router ? { espace: router.namespace, lectures: router.queries, ecritures: router.mutations } : null,
      routes: routes.slice(0, 12),
      routesTotal: routes.length,
      stockage: usage,
      tests: test,
    },
    manquant,
  };
}

export interface AuditReport {
  runId: number;
  checkedAt: string;
  total: number;
  parEtat: Record<ActivationState, number>;
  couverture: {
    moteurs: number;
    espacesTrpc: number;
    espacesTrpcSansMoteur: number;
    famillesRoutes: number;
    domainesAvecPreuveDeTest: number;
  };
  items: AuditItem[];
  /** Espaces tRPC montés qu'aucun moteur du registre ne revendique. */
  espacesOrphelins: string[];
}

/**
 * Exécute l'audit et l'enregistre. Chaque exécution est conservée : deux
 * photographies successives montrent ce qui a réellement avancé.
 */
export async function runActivationAudit(options?: {
  trigger?: string;
  requestedBy?: number;
}): Promise<AuditReport> {
  const inv = await collectInventory();
  const items = inv.engines.map((engine) => buildItem(engine, inv));

  const parEtat = ACTIVATION_STATES.reduce(
    (acc, s) => ({ ...acc, [s]: items.filter((i) => i.etat === s).length }),
    {} as Record<ActivationState, number>,
  );

  const revendiques = new Set(
    items.flatMap((i) => {
      const r = (i.preuves.trpc as { espace?: string } | null)?.espace;
      return r ? [r] : [];
    }),
  );
  const espacesOrphelins = inv.routers
    .filter((r) => !revendiques.has(r.namespace))
    .map((r) => r.namespace);

  const couverture = {
    moteurs: inv.engines.length,
    espacesTrpc: inv.routers.length,
    espacesTrpcSansMoteur: espacesOrphelins.length,
    famillesRoutes: inv.routeFamilies.length,
    domainesAvecPreuveDeTest: inv.tests.size,
  };

  const [run] = await db
    .insert(activationAuditRuns)
    .values({
      trigger: options?.trigger ?? "manuel",
      requestedBy: options?.requestedBy ?? null,
      total: items.length,
      parEtat,
      couverture,
      finishedAt: new Date(),
    })
    .returning();

  if (items.length > 0) {
    await db.insert(activationAuditItems).values(
      items.map((i) => ({
        runId: run.id,
        domain: i.domain,
        label: i.label,
        category: i.category,
        existe: i.existe,
        connecte: i.connecte,
        active: i.active,
        accessible: i.accessible,
        teste: i.teste,
        utilise: i.utilise,
        moteurConnecte: i.moteurConnecte,
        systemeIntelligentConnecte: i.systemeIntelligentConnecte,
        etat: i.etat,
        motif: i.motif,
        preuves: i.preuves,
        manquant: i.manquant,
      })),
    );
  }

  return {
    runId: run.id,
    checkedAt: new Date().toISOString(),
    total: items.length,
    parEtat,
    couverture,
    items,
    espacesOrphelins,
  };
}

/** Dernière photographie enregistrée, sans relancer l'audit. */
export async function latestActivationAudit(): Promise<AuditReport | null> {
  const [run] = await db
    .select()
    .from(activationAuditRuns)
    .orderBy(desc(activationAuditRuns.id))
    .limit(1);
  if (!run) return null;

  const rows = await db
    .select()
    .from(activationAuditItems)
    .where(eq(activationAuditItems.runId, run.id));

  return {
    runId: run.id,
    checkedAt: (run.finishedAt ?? run.startedAt).toISOString(),
    total: run.total,
    parEtat: (run.parEtat ?? {}) as Record<ActivationState, number>,
    couverture: (run.couverture ?? {}) as AuditReport["couverture"],
    items: rows.map((r) => ({
      domain: r.domain,
      label: r.label,
      category: r.category,
      existe: r.existe,
      connecte: r.connecte,
      active: r.active,
      accessible: r.accessible,
      teste: r.teste,
      utilise: r.utilise,
      moteurConnecte: r.moteurConnecte,
      systemeIntelligentConnecte: r.systemeIntelligentConnecte,
      etat: r.etat as ActivationState,
      motif: r.motif,
      preuves: (r.preuves ?? {}) as Record<string, unknown>,
      manquant: r.manquant ?? [],
    })),
    espacesOrphelins: [],
  };
}

/** Détail d'un domaine dans la dernière photographie. */
export async function domainDetail(domain: string): Promise<AuditItem | null> {
  const report = await latestActivationAudit();
  if (!report) return null;
  return report.items.find((i) => i.domain === domain) ?? null;
}

/**
 * Enregistre une preuve de test. Point d'entrée unique du Continuous Test
 * Engine (points 108-113) : sans passage par ici, aucun domaine ne peut
 * devenir 🟢.
 */
export async function recordTestEvidence(input: {
  domain: string;
  kind?: string;
  scenario: string;
  passed: number;
  total: number;
  detail?: string;
  source?: string;
}) {
  const [row] = await db
    .insert(activationTestEvidence)
    .values({
      domain: input.domain,
      kind: input.kind ?? "integration",
      scenario: input.scenario.slice(0, 255),
      passed: input.passed,
      total: input.total,
      success: input.total > 0 && input.passed === input.total,
      detail: input.detail ?? null,
      source: input.source ?? "continuous-test-engine",
    })
    .returning();
  return row;
}

/** Historique des exécutions : ce qui a réellement progressé entre deux audits. */
export async function auditHistory(limit = 20) {
  const runs = await db
    .select()
    .from(activationAuditRuns)
    .orderBy(desc(activationAuditRuns.id))
    .limit(limit);
  return runs.map((r) => ({
    id: r.id,
    date: (r.finishedAt ?? r.startedAt).toISOString(),
    trigger: r.trigger,
    total: r.total,
    parEtat: (r.parEtat ?? {}) as Record<string, number>,
  }));
}
