/**
 * MKA.P-MS Engine Registry — Service (logique métier).
 *
 * Fournit au Core Engine et au portail PDG :
 *  - l'enregistrement idempotent des moteurs ;
 *  - la lecture de l'état / santé / dépendances ;
 *  - le changement d'état (journalisé) ;
 *  - la publication et le routage des événements inter-moteurs.
 *
 * Aucune écriture directe dans les tables d'un autre moteur.
 */
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  engineRegistry,
  engineEvents,
  engineHealthLog,
  engineAdminLog,
} from "./schema.js";
import { ENGINE_CATALOG } from "./catalog.js";

export type EngineState =
  | "active"
  | "read_only"
  | "maintenance"
  | "disabled"
  | "staging";
export type EngineHealth = "ok" | "degraded" | "down" | "unknown";

export interface RegisterInput {
  name: string;
  label: string;
  category?: "core" | "transversal" | "univers";
  version?: string;
  state?: EngineState;
  description?: string;
  dependencies?: string[];
}

/**
 * Enregistre (ou met à jour) un moteur. Idempotent : si le moteur existe déjà,
 * on met à jour label/version/description/dépendances mais on NE force PAS
 * l'état (l'état est piloté par le PDG via setState).
 */
export async function registerEngine(input: RegisterInput) {
  const now = new Date();
  const [existing] = await db
    .select()
    .from(engineRegistry)
    .where(eq(engineRegistry.name, input.name))
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(engineRegistry)
      .set({
        label: input.label,
        category: input.category ?? existing.category,
        version: input.version ?? existing.version,
        description: input.description ?? existing.description,
        dependencies: input.dependencies ?? existing.dependencies,
        updatedAt: now,
      })
      .where(eq(engineRegistry.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(engineRegistry)
    .values({
      name: input.name,
      label: input.label,
      category: input.category ?? "univers",
      version: input.version ?? "0.0.0",
      state: input.state ?? "active",
      description: input.description ?? null,
      dependencies: input.dependencies ?? [],
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return row;
}

/**
 * Amorce le registre à partir du catalogue de référence. Idempotent :
 * n'ajoute que les moteurs manquants, ne touche pas aux moteurs existants.
 */
export async function ensureSeeded() {
  const rows = await db.select({ name: engineRegistry.name }).from(engineRegistry);
  const known = new Set(rows.map((r) => r.name));
  for (const e of ENGINE_CATALOG) {
    if (known.has(e.name)) continue;
    await db.insert(engineRegistry).values({
      name: e.name,
      label: e.label,
      category: e.category,
      state: e.state,
      description: e.description,
      dependencies: e.dependencies,
    });
  }
}

export async function listEngines() {
  await ensureSeeded();
  return db
    .select()
    .from(engineRegistry)
    .orderBy(engineRegistry.category, engineRegistry.name);
}

/**
 * Vrai si un humain a déjà décidé de l'état de ce moteur. Sert de garde-fou :
 * une correction automatique ne doit jamais écraser un choix du PDG.
 */
export async function hasManualStateDecision(name: string): Promise<boolean> {
  const [row] = await db
    .select({ id: engineAdminLog.id })
    .from(engineAdminLog)
    .where(
      and(
        eq(engineAdminLog.engineName, name),
        eq(engineAdminLog.action, "set_state"),
        isNotNull(engineAdminLog.userId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function getEngine(name: string) {
  const [row] = await db
    .select()
    .from(engineRegistry)
    .where(eq(engineRegistry.name, name))
    .limit(1);
  return row ?? null;
}

/** Change l'état d'un moteur (action sensible → journalisée). */
export async function setState(name: string, state: EngineState, userId?: number) {
  const current = await getEngine(name);
  if (!current) throw new Error(`Moteur inconnu: ${name}`);
  const [row] = await db
    .update(engineRegistry)
    .set({ state, updatedAt: new Date() })
    .where(eq(engineRegistry.name, name))
    .returning();
  await db.insert(engineAdminLog).values({
    engineName: name,
    action: "set_state",
    fromState: current.state,
    toState: state,
    userId: userId ?? null,
  });
  return row;
}

/** Heartbeat + santé envoyés par un moteur. */
export async function heartbeat(
  name: string,
  status: EngineHealth,
  opts?: { message?: string; metrics?: unknown; version?: string },
) {
  const now = new Date();
  await db
    .update(engineRegistry)
    .set({
      health: status,
      lastHeartbeat: now,
      version: opts?.version ?? sql`${engineRegistry.version}`,
      updatedAt: now,
    })
    .where(eq(engineRegistry.name, name));
  await db.insert(engineHealthLog).values({
    engineName: name,
    status: status === "unknown" ? "down" : status,
    message: opts?.message ?? null,
    metrics: (opts?.metrics as object) ?? null,
  });
  return { ok: true };
}

/**
 * Publie un événement inter-moteurs. Le routage réel vers les moteurs abonnés
 * sera assuré par le Core Engine ; ici on persiste l'événement (statut
 * "pending") de façon traçable. Les moteurs désactivés ne reçoivent rien.
 */
export async function publishEvent(input: {
  source: string;
  type: string;
  payload?: unknown;
  targets?: string[];
}) {
  const [row] = await db
    .insert(engineEvents)
    .values({
      source: input.source,
      type: input.type,
      payload: (input.payload as object) ?? null,
      targets: input.targets ?? [],
      status: "pending",
    })
    .returning();
  return row;
}

export async function listEvents(limit = 100) {
  return db
    .select()
    .from(engineEvents)
    .orderBy(desc(engineEvents.createdAt))
    .limit(limit);
}

export async function markEventDispatched(id: number, error?: string) {
  const [row] = await db
    .update(engineEvents)
    .set({
      status: error ? "failed" : "dispatched",
      error: error ?? null,
      dispatchedAt: new Date(),
    })
    .where(eq(engineEvents.id, id))
    .returning();
  return row;
}

export async function getStats() {
  await ensureSeeded();
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${engineRegistry.state} = 'active')::int`,
      disabled: sql<number>`count(*) filter (where ${engineRegistry.state} = 'disabled')::int`,
      degraded: sql<number>`count(*) filter (where ${engineRegistry.health} = 'degraded')::int`,
      down: sql<number>`count(*) filter (where ${engineRegistry.health} = 'down')::int`,
    })
    .from(engineRegistry);

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [eventTotals] = await db
    .select({
      events24h: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${engineEvents.status} = 'pending')::int`,
      failed: sql<number>`count(*) filter (where ${engineEvents.status} = 'failed')::int`,
    })
    .from(engineEvents)
    .where(sql`${engineEvents.createdAt} >= ${since24h}`);

  return {
    totalEngines: totals?.total ?? 0,
    activeEngines: totals?.active ?? 0,
    disabledEngines: totals?.disabled ?? 0,
    degradedEngines: totals?.degraded ?? 0,
    downEngines: totals?.down ?? 0,
    events24h: eventTotals?.events24h ?? 0,
    pendingEvents: eventTotals?.pending ?? 0,
    failedEvents: eventTotals?.failed ?? 0,
  };
}

export async function getHealthLog(name: string, limit = 50) {
  return db
    .select()
    .from(engineHealthLog)
    .where(eq(engineHealthLog.engineName, name))
    .orderBy(desc(engineHealthLog.createdAt))
    .limit(limit);
}

/**
 * Journalise une action d'exploitation d'un moteur (démarrage, redémarrage,
 * changement de version, dépendance manquante, erreur critique…). Additif :
 * écrit uniquement dans engine_admin_log.
 */
export async function journalAdmin(
  engineName: string,
  action: string,
  opts?: { fromState?: string; toState?: string; userId?: number },
) {
  await db.insert(engineAdminLog).values({
    engineName,
    action,
    fromState: opts?.fromState ?? null,
    toState: opts?.toState ?? null,
    userId: opts?.userId ?? null,
  });
}

export async function getAdminLog(limit = 100) {
  return db
    .select()
    .from(engineAdminLog)
    .orderBy(desc(engineAdminLog.createdAt))
    .limit(limit);
}
