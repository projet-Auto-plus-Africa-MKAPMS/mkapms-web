/**
 * Contrat OS — cycle de vie centralisé des contrats (Phase 45).
 *
 * Ne duplique PAS le moteur de contrats existant : les contrats restent stockés
 * dans `generated_documents` (voir `server/routers/contracts.ts` + Document OS)
 * et signés via `document_signatures`. Contrat OS ajoute UNIQUEMENT la couche
 * cycle de vie (durée, renouvellement, expiration, résiliation, historique) via
 * la table `contract_terms`, et branche les rappels sur le Scheduler OS existant.
 *
 * Interconnexion : Document OS (stockage), Scheduler OS (rappels), Supervision
 * & Opérations (feed MOS).
 */
import { and, desc, eq, isNotNull, lte, sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  integer,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db.js";
import { scheduleTask } from "../scheduler-os/index.js";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// Parties contractantes couvertes par la Phase 45.
export const CONTRACT_PARTIES = [
  "vendeur",
  "garage",
  "loueur",
  "vtc",
  "taxi",
  "franchise",
  "partenariat",
  "investisseur",
  "employe",
] as const;
export type ContractParty = (typeof CONTRACT_PARTIES)[number];

export type ContractLifecycleStatus = "actif" | "expire" | "resilie" | "renouvele";

export const contractTerms = pgTable("contract_terms", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  documentId: integer("document_id").notNull(),
  party: varchar("party", { length: 32 }).notNull(),
  counterpartyName: varchar("counterparty_name", { length: 192 }),
  startAt: timestamp("start_at", { withTimezone: true }),
  endAt: timestamp("end_at", { withTimezone: true }),
  renewalMonths: integer("renewal_months"),
  autoRenew: boolean("auto_renew").notNull().default(false),
  status: varchar("status", { length: 16 }).notNull().default("actif"),
  terminatedAt: timestamp("terminated_at", { withTimezone: true }),
  terminationReason: varchar("termination_reason", { length: 255 }),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

const MS_PER_DAY = 86400000;

/**
 * Attache le cycle de vie à un contrat déjà présent dans `generated_documents`.
 * Programme un rappel de renouvellement (Scheduler OS) 15 jours avant l'échéance.
 */
export async function registerTerms(input: {
  documentId: number;
  party: ContractParty;
  counterpartyName?: string;
  startAt?: Date;
  endAt?: Date;
  renewalMonths?: number;
  autoRenew?: boolean;
  createdBy?: number;
}) {
  const [row] = await db
    .insert(contractTerms)
    .values({
      documentId: input.documentId,
      party: input.party,
      counterpartyName: input.counterpartyName,
      startAt: input.startAt,
      endAt: input.endAt,
      renewalMonths: input.renewalMonths,
      autoRenew: input.autoRenew ?? false,
      status: "actif",
      createdBy: input.createdBy,
    })
    .returning();

  if (input.endAt && input.createdBy) {
    const remindAt = new Date(input.endAt.getTime() - 15 * MS_PER_DAY);
    if (remindAt.getTime() > Date.now()) {
      await scheduleTask({
        taskType: "renouvellement",
        runAt: remindAt,
        userId: input.createdBy,
        payload: { event: "contrat_renouvellement", vars: { party: input.party }, url: `/compte/contrats/${input.documentId}` },
      });
    }
  }
  return row;
}

/** Renouvelle un contrat : décale l'échéance de `renewalMonths` mois. */
export async function renewContract(id: number) {
  const [t] = await db.select().from(contractTerms).where(eq(contractTerms.id, id)).limit(1);
  if (!t) throw new Error("Contrat introuvable");
  const base = t.endAt && t.endAt.getTime() > Date.now() ? t.endAt : new Date();
  const months = t.renewalMonths ?? 12;
  const newEnd = new Date(base);
  newEnd.setMonth(newEnd.getMonth() + months);
  const [row] = await db
    .update(contractTerms)
    .set({ endAt: newEnd, status: "renouvele", updatedAt: new Date() })
    .where(eq(contractTerms.id, id))
    .returning();
  return row;
}

/** Résilie un contrat (acte explicite, historisé). */
export async function terminateContract(id: number, reason?: string) {
  const [row] = await db
    .update(contractTerms)
    .set({ status: "resilie", terminatedAt: new Date(), terminationReason: reason, updatedAt: new Date() })
    .where(eq(contractTerms.id, id))
    .returning();
  return row;
}

/** Contrats arrivant à échéance dans `days` jours (encore actifs). */
export async function expiring(days = 30) {
  const until = new Date(Date.now() + days * MS_PER_DAY);
  return db
    .select()
    .from(contractTerms)
    .where(and(eq(contractTerms.status, "actif"), isNotNull(contractTerms.endAt), lte(contractTerms.endAt, until)))
    .orderBy(contractTerms.endAt);
}

/** Marque comme `expire` les contrats actifs dont l'échéance est dépassée. */
export async function markExpired(now = new Date()) {
  const res = await db
    .update(contractTerms)
    .set({ status: "expire", updatedAt: new Date() })
    .where(and(eq(contractTerms.status, "actif"), isNotNull(contractTerms.endAt), lte(contractTerms.endAt, now)))
    .returning({ id: contractTerms.id });
  return { expired: res.length };
}

export async function history(documentId: number) {
  return db.select().from(contractTerms).where(eq(contractTerms.documentId, documentId)).orderBy(desc(contractTerms.createdAt));
}

export async function stats() {
  const rows = await db
    .select({ party: contractTerms.party, status: contractTerms.status, n: sql<number>`count(*)::int` })
    .from(contractTerms)
    .groupBy(contractTerms.party, contractTerms.status);
  const soon = await expiring(30);
  return { byPartyStatus: rows, expiringSoon: soon.length };
}

// ── Métadonnées / Health / Feed / Dashboard ──────────────────────────────
const V = "0.1.0";
const M: MaturityLevel = "sprint_2_complete";
export const CONTRACT_OS_META = {
  name: "contract-os" as const,
  label: "Contrat Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/contract-os/index.ts",
};

export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let active = 0, expiringSoon = 0;
  try {
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(contractTerms).where(eq(contractTerms.status, "actif"));
    active = Number(a?.n ?? 0);
    expiringSoon = (await expiring(15)).length;
    if (expiringSoon > 0) status = "degraded";
  } catch {
    status = "degraded";
  }
  return { engine: "contract-os" as const, version: V, status, checkedAt: new Date().toISOString(), metrics: { active, expiringSoon, responseMs: Date.now() - s } };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: CONTRACT_OS_META.name,
    label: CONTRACT_OS_META.label,
    version: V,
    maturityLevel: M,
    health: h.status,
    load: { events5m: 0, events24h: h.metrics.active },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const st = await stats();
  return {
    ...feed,
    businessMetrics: { expiring_30d: st.expiringSoon, categories: st.byPartyStatus.length },
    recentEvents: [],
    recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const contractOsRouter = router({
  meta: publicProcedure.query(() => CONTRACT_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),
  parties: publicProcedure.query(() => CONTRACT_PARTIES),

  register: protectedProcedure
    .input(z.object({
      documentId: z.number().int().positive(),
      party: z.enum(CONTRACT_PARTIES),
      counterpartyName: z.string().max(192).optional(),
      startAt: z.coerce.date().optional(),
      endAt: z.coerce.date().optional(),
      renewalMonths: z.number().int().min(1).max(120).optional(),
      autoRenew: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) => registerTerms({ ...input, createdBy: ctx.user.uid })),

  renew: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(({ input }) => renewContract(input.id)),
  terminate: adminProcedure
    .input(z.object({ id: z.number().int().positive(), reason: z.string().max(255).optional() }))
    .mutation(({ input }) => terminateContract(input.id, input.reason)),

  expiring: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(365).default(30) }).optional())
    .query(({ input }) => expiring(input?.days ?? 30)),

  history: protectedProcedure.input(z.object({ documentId: z.number().int().positive() })).query(({ input }) => history(input.documentId)),
  stats: adminProcedure.query(() => stats()),
});
