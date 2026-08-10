/**
 * Mémoire organisée des moteurs (point 40).
 *
 * Chaque moteur peut mémoriser ce qu'il a constaté, rangé par domaine
 * (`scope`) puis par nature (`kind`). Une même observation n'est pas dupliquée :
 * elle est comptée. La mémoire est un journal de constats, elle ne déclenche
 * aucune action : un moteur n'apprend pas le droit de décider tout seul.
 *
 * Domaines volontairement fermés — une mémoire fourre-tout n'est pas
 * consultable :
 *   • `etat`          état et transitions d'état du moteur
 *   • `anomalie`      défaut constaté par le moteur
 *   • `decision`      décision prise (et son motif)
 *   • `apprentissage` valeur apprise du terrain
 *   • `dependance`    dépendance constatée envers un autre moteur/service
 */
import { and, desc, eq, sql } from "drizzle-orm";
import {
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { db } from "../db.js";

export const MEMORY_SCOPES = [
  "etat",
  "anomalie",
  "decision",
  "apprentissage",
  "dependance",
] as const;

export type MemoryScope = (typeof MEMORY_SCOPES)[number];

export const engineMemory = pgTable(
  "engine_memory",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    engineKey: varchar("engine_key", { length: 64 }).notNull(),
    scope: varchar("scope", { length: 32 }).notNull(),
    kind: varchar("kind", { length: 48 }).notNull(),
    refKey: varchar("ref_key", { length: 320 }).notNull(),
    label: varchar("label", { length: 320 }),
    value: jsonb("value").$type<Record<string, unknown>>(),
    observations: integer("observations").notNull().default(1),
    firstSeenAt: timestamp("first_seen_at").notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: unique("engine_memory_unique").on(t.engineKey, t.scope, t.kind, t.refKey),
    engineIdx: index("engine_memory_engine_idx").on(t.engineKey, t.scope),
  }),
);

export interface RememberInput {
  engineKey: string;
  scope: MemoryScope;
  kind: string;
  /** Identifiant stable du constat : c'est lui qui évite les doublons. */
  refKey: string;
  label?: string | null;
  value?: Record<string, unknown> | null;
}

/**
 * Mémorise un constat. Best-effort : la mémoire ne doit jamais faire échouer
 * le moteur qui écrit dedans.
 */
export async function remember(input: RememberInput): Promise<boolean> {
  try {
    await db
      .insert(engineMemory)
      .values({
        engineKey: input.engineKey.slice(0, 64),
        scope: input.scope,
        kind: input.kind.slice(0, 48),
        refKey: input.refKey.slice(0, 320),
        label: input.label?.slice(0, 320) ?? null,
        value: input.value ?? null,
      })
      .onConflictDoUpdate({
        target: [engineMemory.engineKey, engineMemory.scope, engineMemory.kind, engineMemory.refKey],
        set: {
          observations: sql`${engineMemory.observations} + 1`,
          lastSeenAt: new Date(),
          label: input.label?.slice(0, 320) ?? sql`${engineMemory.label}`,
          value: input.value ?? sql`${engineMemory.value}`,
        },
      });
    return true;
  } catch {
    return false;
  }
}

/**
 * Mémorise l'état d'un moteur et signale un vrai changement d'état.
 * Sans cette mémoire, un moteur tombé était re-signalé à chaque passage de
 * sonde (alertes en boucle) ou pas signalé du tout.
 */
export async function recordState(
  engineKey: string,
  health: string,
  message?: string | null,
): Promise<{ previous: string | null; changed: boolean }> {
  let previous: string | null = null;
  try {
    const [row] = await db
      .select({ value: engineMemory.value })
      .from(engineMemory)
      .where(
        and(
          eq(engineMemory.engineKey, engineKey),
          eq(engineMemory.scope, "etat"),
          eq(engineMemory.kind, "etat_courant"),
          eq(engineMemory.refKey, engineKey),
        ),
      )
      .limit(1);
    const v = row?.value;
    if (v && typeof v.health === "string") previous = v.health;
  } catch {
    return { previous: null, changed: false };
  }

  const changed = previous !== null && previous !== health;
  await remember({
    engineKey,
    scope: "etat",
    kind: "etat_courant",
    refKey: engineKey,
    label: `État courant : ${health}`,
    value: { health, message: message ?? null, at: new Date().toISOString() },
  });
  if (changed) {
    await remember({
      engineKey,
      scope: "etat",
      kind: "transition",
      refKey: `${previous}->${health}`,
      label: `${previous} → ${health}`,
      value: { from: previous, to: health, message: message ?? null, at: new Date().toISOString() },
    });
  }
  return { previous, changed };
}

/** Mémoire d'un moteur, éventuellement restreinte à un domaine. */
export async function recall(engineKey: string, scope?: MemoryScope, limit = 100) {
  const conditions = [eq(engineMemory.engineKey, engineKey)];
  if (scope) conditions.push(eq(engineMemory.scope, scope));
  return db
    .select()
    .from(engineMemory)
    .where(and(...conditions))
    .orderBy(desc(engineMemory.lastSeenAt))
    .limit(limit);
}

export interface MemorySummaryEntry {
  engineKey: string;
  total: number;
  parDomaine: Record<string, number>;
  lastSeenAt: string | null;
}

/**
 * Vue d'ensemble : combien chaque moteur a mémorisé, et dans quels domaines.
 * Un moteur sans mémoire est renvoyé à 0 par l'appelant, jamais masqué.
 */
export async function memorySummary(): Promise<MemorySummaryEntry[]> {
  const rows = await db
    .select({
      engineKey: engineMemory.engineKey,
      scope: engineMemory.scope,
      n: sql<number>`count(*)::int`,
      last: sql<Date | null>`max(${engineMemory.lastSeenAt})`,
    })
    .from(engineMemory)
    .groupBy(engineMemory.engineKey, engineMemory.scope);

  const map = new Map<string, MemorySummaryEntry>();
  for (const r of rows) {
    const entry = map.get(r.engineKey) ?? {
      engineKey: r.engineKey,
      total: 0,
      parDomaine: {},
      lastSeenAt: null,
    };
    entry.total += Number(r.n);
    entry.parDomaine[r.scope] = Number(r.n);
    const last = r.last ? new Date(r.last).toISOString() : null;
    if (last && (!entry.lastSeenAt || last > entry.lastSeenAt)) entry.lastSeenAt = last;
    map.set(r.engineKey, entry);
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}
