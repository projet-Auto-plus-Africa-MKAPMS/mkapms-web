/**
 * Journal des modifications d'agents (point 42).
 *
 * Plusieurs agents interviennent sur la plateforme. Sans registre, personne ne
 * peut dire quelle modification est réellement en production, qui l'a posée, ni
 * ce qu'il faut défaire pour revenir en arrière.
 *
 * Deux sources, jamais inventées :
 *   1. les **migrations réellement appliquées en base** (`__drizzle_migrations`),
 *      relevées automatiquement : c'est la trace physique d'un changement de
 *      structure. Une migration présente dans le dépôt mais absente en base est
 *      signalée comme « non appliquée », pas comme livrée ;
 *   2. les **déclarations d'agents** enregistrées explicitement (moteur touché,
 *      référence, procédure de retour arrière).
 *
 * Une entrée est `declaree` par défaut : la validation humaine reste requise, et
 * une entrée sans procédure de retour arrière est signalée comme telle plutôt
 * que présentée comme sûre.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import {
  bigserial,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "../db.js";

export const AGENT_CHANGE_STATUSES = [
  "declaree",
  "validee",
  "rejetee",
  "annulee",
] as const;
export type AgentChangeStatus = (typeof AGENT_CHANGE_STATUSES)[number];

export const AGENT_CHANGE_KINDS = [
  "migration",
  "moteur",
  "fonctionnalite",
  "correction",
  "configuration",
] as const;
export type AgentChangeKind = (typeof AGENT_CHANGE_KINDS)[number];

export const agentChangeLog = pgTable(
  "agent_change_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    /** Auteur du changement (agent ou humain). */
    agent: varchar("agent", { length: 96 }).notNull(),
    kind: varchar("kind", { length: 24 }).notNull(),
    /** Clé stable du changement : évite les doublons au relevé automatique. */
    reference: varchar("reference", { length: 200 }).notNull(),
    title: varchar("title", { length: 240 }).notNull(),
    detail: text("detail"),
    /** Moteur / module concerné, si identifiable. */
    engineName: varchar("engine_name", { length: 64 }),
    status: varchar("status", { length: 16 }).notNull().default("declaree"),
    /** Comment défaire ce changement. Vide = retour arrière non documenté. */
    rollbackPlan: text("rollback_plan"),
    /** Vrai uniquement si la trace physique du changement est constatée. */
    appliedInDb: integer("applied_in_db").notNull().default(0),
    appliedAt: timestamp("applied_at"),
    reviewedBy: integer("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    reviewNote: text("review_note"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    /** Points 67-68 : verdict de l'analyse automatique du dépôt. */
    impactVerdict: varchar("impact_verdict", { length: 32 }),
    impactFindings: jsonb("impact_findings").$type<Record<string, unknown>>(),
    impactAt: timestamp("impact_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    uniq: unique("agent_change_log_reference_unique").on(t.kind, t.reference),
    kindIdx: index("agent_change_log_kind_idx").on(t.kind, t.status),
  }),
);

export interface DeclareChangeInput {
  agent: string;
  kind: AgentChangeKind;
  reference: string;
  title: string;
  detail?: string | null;
  engineName?: string | null;
  rollbackPlan?: string | null;
  metadata?: Record<string, unknown> | null;
}

/** Déclaration d'un changement par un agent. Idempotente sur (kind, reference). */
export async function declareChange(input: DeclareChangeInput) {
  const values = {
    agent: input.agent.slice(0, 96),
    kind: input.kind,
    reference: input.reference.slice(0, 200),
    title: input.title.slice(0, 240),
    detail: input.detail ?? null,
    engineName: input.engineName ?? null,
    rollbackPlan: input.rollbackPlan ?? null,
    metadata: input.metadata ?? null,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(agentChangeLog)
    .values(values)
    .onConflictDoUpdate({
      target: [agentChangeLog.kind, agentChangeLog.reference],
      set: values,
    })
    .returning();
  return row;
}

/**
 * Nom lisible d'une migration à partir de son horodatage d'application.
 * Drizzle enregistre le `when` du journal du dépôt : c'est ce qui permet de
 * retrouver le nom du fichier. Sans correspondance, on garde le hash brut
 * plutôt que d'inventer un libellé.
 */
async function migrationTags(): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const raw = await readFile(
      path.resolve(process.cwd(), "drizzle", "meta", "_journal.json"),
      "utf8",
    );
    const parsed = JSON.parse(raw) as { entries?: { when: number; tag: string }[] };
    for (const e of parsed.entries ?? []) map.set(e.when, e.tag);
  } catch {
    // Journal du dépôt indisponible : on n'invente pas de nom.
  }
  return map;
}

/**
 * Relève les migrations réellement appliquées en base et les inscrit au journal.
 * C'est la seule preuve qu'un changement de structure est bien en production.
 */
export async function syncAppliedMigrations(): Promise<{ releve: number; nouvelles: number }> {
  let rows: { hash: string; created_at: string | number | null }[] = [];
  try {
    const res = await db.execute<{ hash: string; created_at: string | number | null }>(
      sql`select hash, created_at from drizzle.__drizzle_migrations order by created_at asc`,
    );
    rows = Array.isArray(res) ? res : ((res as { rows?: typeof rows }).rows ?? []);
  } catch {
    // Table absente (base neuve, migrations non encore appliquées) : on ne
    // suppose rien plutôt que d'inventer un historique.
    return { releve: 0, nouvelles: 0 };
  }

  const tags = await migrationTags();
  let nouvelles = 0;
  for (const r of rows) {
    const when = Number(r.created_at);
    const tag = Number.isFinite(when) ? tags.get(when) : undefined;
    const ts = r.created_at === null ? null : new Date(when || String(r.created_at));
    const [existing] = await db
      .select({ id: agentChangeLog.id })
      .from(agentChangeLog)
      .where(and(eq(agentChangeLog.kind, "migration"), eq(agentChangeLog.reference, r.hash)))
      .limit(1);
    if (existing) continue;
    await db.insert(agentChangeLog).values({
      agent: "migration",
      kind: "migration",
      reference: r.hash.slice(0, 200),
      title: tag ? `Migration ${tag}` : "Migration appliquée en base",
      detail: "Relevée depuis le journal de migrations : la structure est bien en production.",
      status: "declaree",
      appliedInDb: 1,
      appliedAt: ts && !Number.isNaN(ts.getTime()) ? ts : null,
      metadata: { source: "drizzle.__drizzle_migrations", tag: tag ?? null },
    });
    nouvelles += 1;
  }
  return { releve: rows.length, nouvelles };
}

export interface ReviewChangeInput {
  id: number;
  decision: "validee" | "rejetee" | "annulee";
  reviewerId: number;
  note?: string | null;
}

/** Décision humaine sur un changement. Aucun changement ne s'auto-valide. */
export async function reviewChange(input: ReviewChangeInput) {
  const [row] = await db
    .update(agentChangeLog)
    .set({
      status: input.decision,
      reviewedBy: input.reviewerId,
      reviewedAt: new Date(),
      reviewNote: input.note ?? null,
      updatedAt: new Date(),
    })
    .where(eq(agentChangeLog.id, input.id))
    .returning();
  return row ?? null;
}

export async function listChanges(filter: {
  kind?: AgentChangeKind;
  status?: AgentChangeStatus;
  limit?: number;
}) {
  const conditions = [];
  if (filter.kind) conditions.push(eq(agentChangeLog.kind, filter.kind));
  if (filter.status) conditions.push(eq(agentChangeLog.status, filter.status));
  return db
    .select()
    .from(agentChangeLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(agentChangeLog.createdAt))
    .limit(filter.limit ?? 100);
}

export interface ChangeStats {
  total: number;
  parStatut: Record<string, number>;
  parType: Record<string, number>;
  /** Changements sans procédure de retour arrière documentée. */
  sansRetourArriere: number;
  enAttenteDeValidation: number;
}

export async function changeStats(): Promise<ChangeStats> {
  const rows = await db
    .select({
      status: agentChangeLog.status,
      kind: agentChangeLog.kind,
      rollback: agentChangeLog.rollbackPlan,
    })
    .from(agentChangeLog);

  const parStatut: Record<string, number> = {};
  const parType: Record<string, number> = {};
  let sansRetourArriere = 0;
  for (const r of rows) {
    parStatut[r.status] = (parStatut[r.status] ?? 0) + 1;
    parType[r.kind] = (parType[r.kind] ?? 0) + 1;
    if (!r.rollback) sansRetourArriere += 1;
  }
  return {
    total: rows.length,
    parStatut,
    parType,
    sansRetourArriere,
    enAttenteDeValidation: parStatut.declaree ?? 0,
  };
}
