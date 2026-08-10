/**
 * Registre central complet — état opérationnel réel de chaque moteur (point 41).
 *
 * Le registre ne disait que deux choses : un état administratif (`state`) décidé
 * par la direction, et une santé technique (`health`) issue du dernier battement
 * de cœur. Ce n'est pas suffisant pour piloter : un moteur pouvait afficher
 * « actif » et « ok » alors qu'il n'avait jamais battu une seule fois, ou que la
 * dépendance dont il a besoin était éteinte.
 *
 * Cinq états, calculés — jamais déclarés :
 *   • `ok`             vivant, sain, dépendances satisfaites
 *   • `partiel`        vivant mais limité (lecture seule, maintenance, battement
 *                      périmé, dépendance dégradée)
 *   • `degrade`        santé dégradée signalée par le moteur lui-même
 *   • `hors_service`   santé en panne, ou désactivé par la direction
 *   • `non_configure`  déclaré mais jamais mis en service (aucun battement) ou
 *                      dépendance absente du registre
 *
 * Un moteur n'est jamais présenté comme `ok` par défaut : sans preuve de vie,
 * c'est `non_configure`.
 */
import { db } from "../db.js";
import { engineRegistry } from "./schema.js";

export const OPERATIONAL_STATES = [
  "ok",
  "partiel",
  "degrade",
  "hors_service",
  "non_configure",
] as const;

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export const OPERATIONAL_STATE_LABELS: Record<OperationalState, string> = {
  ok: "Opérationnel",
  partiel: "Partiel",
  degrade: "Dégradé",
  hors_service: "Hors service",
  non_configure: "Non configuré",
};

/** Au-delà de ce délai sans battement, un moteur n'est plus « à jour ». */
const HEARTBEAT_STALE_MS = 2 * 60 * 60 * 1000;

export interface EngineReadiness {
  name: string;
  label: string;
  category: string;
  version: string;
  /** État administratif décidé par la direction. */
  state: string;
  /** Santé technique déclarée par le moteur. */
  health: string;
  operational: OperationalState;
  /** Pourquoi cet état — jamais un état sans motif. */
  reason: string;
  lastHeartbeat: string | null;
  heartbeatStale: boolean;
  dependencies: string[];
  /** Dépendances absentes du registre. */
  missingDependencies: string[];
  /** Dépendances présentes mais pas opérationnelles. */
  unhealthyDependencies: string[];
}

function evaluate(
  row: typeof engineRegistry.$inferSelect,
  byName: Map<string, typeof engineRegistry.$inferSelect>,
): EngineReadiness {
  const dependencies = row.dependencies ?? [];
  const missingDependencies = dependencies.filter((d) => !byName.has(d));
  const unhealthyDependencies = dependencies.filter((d) => {
    const dep = byName.get(d);
    if (!dep) return false;
    return dep.health === "down" || dep.state === "disabled";
  });
  const heartbeatStale = row.lastHeartbeat
    ? Date.now() - new Date(row.lastHeartbeat).getTime() > HEARTBEAT_STALE_MS
    : true;

  let operational: OperationalState;
  let reason: string;

  if (row.state === "disabled") {
    operational = "hors_service";
    reason = "Désactivé par la direction.";
  } else if (row.health === "down") {
    operational = "hors_service";
    reason = "Le moteur signale une panne.";
  } else if (missingDependencies.length > 0) {
    operational = "non_configure";
    reason = `Dépendance absente du registre : ${missingDependencies.join(", ")}.`;
  } else if (!row.lastHeartbeat) {
    operational = "non_configure";
    reason = "Déclaré mais jamais mis en service : aucun signe de vie reçu.";
  } else if (row.state === "staging") {
    operational = "non_configure";
    reason = "En préproduction : pas encore mis en service.";
  } else if (row.health === "degraded") {
    operational = "degrade";
    reason = "Le moteur signale un fonctionnement dégradé.";
  } else if (unhealthyDependencies.length > 0) {
    operational = "partiel";
    reason = `Dépendance indisponible : ${unhealthyDependencies.join(", ")}.`;
  } else if (row.state === "read_only") {
    operational = "partiel";
    reason = "En lecture seule : les écritures sont refusées.";
  } else if (row.state === "maintenance") {
    operational = "partiel";
    reason = "En maintenance.";
  } else if (heartbeatStale) {
    operational = "partiel";
    reason = "Dernier signe de vie trop ancien : état non garanti.";
  } else if (row.health === "unknown") {
    operational = "partiel";
    reason = "Santé inconnue : le moteur n'expose pas encore de sonde.";
  } else {
    operational = "ok";
    reason = "Vivant, sain, dépendances satisfaites.";
  }

  return {
    name: row.name,
    label: row.label,
    category: row.category,
    version: row.version,
    state: row.state,
    health: row.health,
    operational,
    reason,
    lastHeartbeat: row.lastHeartbeat ? new Date(row.lastHeartbeat).toISOString() : null,
    heartbeatStale,
    dependencies,
    missingDependencies,
    unhealthyDependencies,
  };
}

export interface RegistryOverview {
  total: number;
  parEtat: Record<OperationalState, number>;
  moteurs: EngineReadiness[];
  /** Moteurs dont une dépendance est absente ou indisponible. */
  dependancesEnDefaut: EngineReadiness[];
  checkedAt: string;
}

/** Registre complet : chaque moteur avec son état opérationnel et son motif. */
export async function registryOverview(): Promise<RegistryOverview> {
  const rows = await db.select().from(engineRegistry).orderBy(engineRegistry.name);
  const byName = new Map(rows.map((r) => [r.name, r]));
  const moteurs = rows.map((r) => evaluate(r, byName));

  const parEtat = OPERATIONAL_STATES.reduce(
    (acc, s) => ({ ...acc, [s]: moteurs.filter((m) => m.operational === s).length }),
    {} as Record<OperationalState, number>,
  );

  return {
    total: moteurs.length,
    parEtat,
    moteurs,
    dependancesEnDefaut: moteurs.filter(
      (m) => m.missingDependencies.length > 0 || m.unhealthyDependencies.length > 0,
    ),
    checkedAt: new Date().toISOString(),
  };
}

/** État opérationnel d'un seul moteur. */
export async function engineReadiness(name: string): Promise<EngineReadiness | null> {
  const rows = await db.select().from(engineRegistry);
  const byName = new Map(rows.map((r) => [r.name, r]));
  const row = byName.get(name);
  return row ? evaluate(row, byName) : null;
}
