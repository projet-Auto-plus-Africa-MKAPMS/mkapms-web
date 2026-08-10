/**
 * Dépendances, validations, anomalies et retour arrière (points 43-44).
 *
 * Le registre connaissait les dépendances déclarées de chaque moteur, mais rien
 * ne s'en servait :
 *   • personne ne voyait l'effet en cascade d'une extinction — désactiver un
 *     moteur central coupait silencieusement tous ceux qui en dépendent ;
 *   • une dépendance circulaire n'était jamais détectée ;
 *   • un changement d'état était journalisé mais irréversible à la main : il
 *     fallait se souvenir de l'état précédent.
 *
 * Ce module apporte donc :
 *   1. le graphe des dépendances (avec cycles) ;
 *   2. l'impact en cascade d'un moteur ;
 *   3. la validation d'une action sensible AVANT exécution ;
 *   4. les anomalies consolidées du registre ;
 *   5. le retour arrière du dernier changement d'état, à partir du journal.
 *
 * Aucune action n'est appliquée automatiquement : la validation informe, c'est
 * la direction qui décide.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { engineAdminLog, engineRegistry } from "./schema.js";
import { setState, type EngineState } from "./service.js";
import { registryOverview, type EngineReadiness } from "./readiness.js";

export interface DependencyNode {
  name: string;
  label: string;
  category: string;
  state: string;
  health: string;
  /** Moteurs dont celui-ci a besoin. */
  dependsOn: string[];
  /** Moteurs qui ont besoin de celui-ci. */
  requiredBy: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: { from: string; to: string }[];
  /** Dépendances déclarées vers un moteur absent du registre. */
  missing: { engine: string; dependency: string }[];
  /** Cycles détectés (A → B → A) : une boucle empêche tout démarrage ordonné. */
  cycles: string[][];
}

/** Graphe complet des dépendances entre moteurs. */
export async function dependencyGraph(): Promise<DependencyGraph> {
  const rows = await db.select().from(engineRegistry).orderBy(engineRegistry.name);
  const byName = new Map(rows.map((r) => [r.name, r]));

  const edges: { from: string; to: string }[] = [];
  const missing: { engine: string; dependency: string }[] = [];
  const requiredBy = new Map<string, string[]>();

  for (const r of rows) {
    for (const dep of r.dependencies ?? []) {
      if (!byName.has(dep)) {
        missing.push({ engine: r.name, dependency: dep });
        continue;
      }
      edges.push({ from: r.name, to: dep });
      requiredBy.set(dep, [...(requiredBy.get(dep) ?? []), r.name]);
    }
  }

  const nodes: DependencyNode[] = rows.map((r) => ({
    name: r.name,
    label: r.label,
    category: r.category,
    state: r.state,
    health: r.health,
    dependsOn: (r.dependencies ?? []).filter((d) => byName.has(d)),
    requiredBy: requiredBy.get(r.name) ?? [],
  }));

  return { nodes, edges, missing, cycles: findCycles(nodes) };
}

/** Détection des dépendances circulaires (parcours en profondeur). */
function findCycles(nodes: DependencyNode[]): string[][] {
  const deps = new Map(nodes.map((n) => [n.name, n.dependsOn]));
  const cycles: string[][] = [];
  const seen = new Set<string>();
  const stack: string[] = [];
  const inStack = new Set<string>();

  const visit = (name: string) => {
    if (inStack.has(name)) {
      const start = stack.indexOf(name);
      if (start >= 0) {
        const cycle = [...stack.slice(start), name];
        const key = [...cycle].sort().join(">");
        if (!cycles.some((c) => [...c].sort().join(">") === key)) cycles.push(cycle);
      }
      return;
    }
    if (seen.has(name)) return;
    seen.add(name);
    inStack.add(name);
    stack.push(name);
    for (const d of deps.get(name) ?? []) visit(d);
    stack.pop();
    inStack.delete(name);
  };

  for (const n of nodes) visit(n.name);
  return cycles;
}

export interface ImpactReport {
  engine: string;
  /** Moteurs qui dépendent directement de celui-ci. */
  direct: string[];
  /** Tous les moteurs touchés en cascade (dépendants des dépendants). */
  cascade: string[];
  /** Parmi eux, ceux qui tournent réellement en ce moment. */
  activeAffected: string[];
}

/** Ce qui tombe si ce moteur s'arrête. */
export async function impactOf(name: string): Promise<ImpactReport> {
  const graph = await dependencyGraph();
  const byName = new Map(graph.nodes.map((n) => [n.name, n]));

  const cascade = new Set<string>();
  const queue = [...(byName.get(name)?.requiredBy ?? [])];
  while (queue.length > 0) {
    const cur = queue.shift();
    if (!cur || cur === name || cascade.has(cur)) continue;
    cascade.add(cur);
    queue.push(...(byName.get(cur)?.requiredBy ?? []));
  }

  return {
    engine: name,
    direct: byName.get(name)?.requiredBy ?? [],
    cascade: [...cascade],
    activeAffected: [...cascade].filter((n) => byName.get(n)?.state === "active"),
  };
}

export interface StateChangeValidation {
  engine: string;
  from: string;
  to: EngineState;
  /** Faux uniquement si l'action est impossible (moteur inconnu). */
  possible: boolean;
  /** Vrai si l'action a un effet sur d'autres moteurs → confirmation requise. */
  confirmationRequise: boolean;
  blocages: string[];
  avertissements: string[];
  impact: ImpactReport | null;
}

/**
 * Contrôle une action sensible AVANT de l'exécuter. N'applique rien : c'est un
 * avis, avec l'effet exact sur les autres moteurs.
 */
export async function validateStateChange(
  name: string,
  to: EngineState,
): Promise<StateChangeValidation> {
  const [row] = await db
    .select()
    .from(engineRegistry)
    .where(eq(engineRegistry.name, name))
    .limit(1);

  if (!row) {
    return {
      engine: name,
      from: "inconnu",
      to,
      possible: false,
      confirmationRequise: false,
      blocages: [`Moteur inconnu dans le registre : ${name}.`],
      avertissements: [],
      impact: null,
    };
  }

  const blocages: string[] = [];
  const avertissements: string[] = [];
  const coupure = to === "disabled" || to === "maintenance";
  const impact = coupure ? await impactOf(name) : null;

  if (row.state === to) {
    avertissements.push(`Le moteur est déjà en état « ${to} » : aucun changement.`);
  }

  if (impact && impact.activeAffected.length > 0) {
    avertissements.push(
      `${impact.activeAffected.length} moteur(s) actif(s) dépendent de celui-ci et seront affectés : ${impact.activeAffected.join(", ")}.`,
    );
  }

  if (row.category === "core" && coupure) {
    avertissements.push(
      "Il s'agit du moteur principal : toute la coordination de la plateforme passe par lui.",
    );
  }

  const confirmationRequise =
    (impact?.activeAffected.length ?? 0) > 0 || (row.category === "core" && coupure);

  return {
    engine: name,
    from: row.state,
    to,
    possible: blocages.length === 0,
    confirmationRequise,
    blocages,
    avertissements,
    impact,
  };
}

export interface RegistryAnomaly {
  code:
    | "dependance_manquante"
    | "dependance_circulaire"
    | "moteur_hors_service"
    | "moteur_non_configure"
    | "signal_perime"
    | "dependance_indisponible";
  severite: "critique" | "important" | "a_surveiller";
  engine: string | null;
  detail: string;
}

/**
 * Anomalies consolidées du registre. Uniquement des faits constatés : une liste
 * vide signifie qu'aucune anomalie n'a été relevée, pas que tout est parfait.
 */
export async function registryAnomalies(): Promise<{
  anomalies: RegistryAnomaly[];
  parSeverite: Record<string, number>;
  checkedAt: string;
}> {
  const [graph, overview] = await Promise.all([dependencyGraph(), registryOverview()]);
  const anomalies: RegistryAnomaly[] = [];

  for (const m of graph.missing) {
    anomalies.push({
      code: "dependance_manquante",
      severite: "critique",
      engine: m.engine,
      detail: `Dépend de « ${m.dependency} », absent du registre.`,
    });
  }

  for (const c of graph.cycles) {
    anomalies.push({
      code: "dependance_circulaire",
      severite: "critique",
      engine: c[0] ?? null,
      detail: `Dépendance circulaire : ${c.join(" → ")}.`,
    });
  }

  const add = (m: EngineReadiness, code: RegistryAnomaly["code"], severite: RegistryAnomaly["severite"]) =>
    anomalies.push({ code, severite, engine: m.name, detail: `${m.label} — ${m.reason}` });

  for (const m of overview.moteurs) {
    if (m.operational === "hors_service") add(m, "moteur_hors_service", "critique");
    else if (m.unhealthyDependencies.length > 0) add(m, "dependance_indisponible", "important");
    else if (m.operational === "non_configure") add(m, "moteur_non_configure", "a_surveiller");
    else if (m.heartbeatStale) add(m, "signal_perime", "a_surveiller");
  }

  const parSeverite: Record<string, number> = {};
  for (const a of anomalies) parSeverite[a.severite] = (parSeverite[a.severite] ?? 0) + 1;

  return { anomalies, parSeverite, checkedAt: new Date().toISOString() };
}

export interface RevertResult {
  applied: boolean;
  engine: string;
  from?: string;
  to?: string;
  raison?: string;
}

/**
 * Retour arrière du dernier changement d'état d'un moteur, repris du journal.
 * Sans changement journalisé, on ne devine pas un état « d'origine ».
 */
export async function revertLastStateChange(
  name: string,
  userId?: number,
): Promise<RevertResult> {
  const [last] = await db
    .select()
    .from(engineAdminLog)
    .where(and(eq(engineAdminLog.engineName, name), eq(engineAdminLog.action, "set_state")))
    .orderBy(desc(engineAdminLog.createdAt))
    .limit(1);

  if (!last || !last.fromState) {
    return {
      applied: false,
      engine: name,
      raison:
        "Aucun changement d'état journalisé pour ce moteur : il n'y a pas d'état précédent à rétablir.",
    };
  }

  const previous = last.fromState as EngineState;
  const current = await db
    .select({ state: engineRegistry.state })
    .from(engineRegistry)
    .where(eq(engineRegistry.name, name))
    .limit(1);

  if (current[0]?.state === previous) {
    return {
      applied: false,
      engine: name,
      raison: `Le moteur est déjà revenu en état « ${previous} ».`,
    };
  }

  await setState(name, previous, userId);
  await db.insert(engineAdminLog).values({
    engineName: name,
    action: "revert_state",
    fromState: current[0]?.state ?? null,
    toState: previous,
    userId: userId ?? null,
  });

  return { applied: true, engine: name, from: current[0]?.state, to: previous };
}
