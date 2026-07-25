/**
 * Document OS — Registre unifié des documents MKA.P-MS (règle MOS #15).
 *
 * Consolide les tables existantes (`factures`, `devis`, `invoices`,
 * `quotes`, `devisItems`, `contrats`, etc.) SANS les modifier, en
 * ajoutant :
 *   • un registre des types de documents (facture, contrat, devis,
 *     bon_commande, attestation, CGV, mandat_vente, ...)
 *   • des templates HTML multi-langues par type + pays (branché sur
 *     Language OS + Country OS)
 *   • un journal unifié `doc_documents` (référence, propriétaire,
 *     contrepartie, montants HT/TTC, devise, statut, signature)
 *   • standards MOS (meta / healthStatus / controlCenterFeed / dashboard)
 *
 * Interconnexion :
 *   - Language OS → traduction dynamique des templates (fallback fr)
 *   - Country OS  → format d'adresse / TVA / devise par défaut
 *   - Notification OS → notifier propriétaire à l'émission
 *   - Identity OS → owner / counterparty via userId legacy
 */
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { bigserial, boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp, unique, varchar } from "drizzle-orm/pg-core";
import { z } from "zod";
import { db } from "../db.js";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Schéma ──────────────────────────────────────────────────────────────
export const docTypes = pgTable("doc_types", {
  code: varchar("code", { length: 48 }).primaryKey(),
  labelFr: varchar("label_fr", { length: 120 }).notNull(),
  labelEn: varchar("label_en", { length: 120 }),
  category: varchar("category", { length: 32 }).notNull(),
  requiresSignature: boolean("requires_signature").notNull().default(false),
  legalRetentionYears: integer("legal_retention_years").notNull().default(10),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const docTemplates = pgTable("doc_templates", {
  id: serial("id").primaryKey(),
  typeCode: varchar("type_code", { length: 48 }).notNull(),
  language: varchar("language", { length: 8 }).notNull(),
  countryCode: varchar("country_code", { length: 2 }),
  htmlBody: text("html_body").notNull(),
  variables: jsonb("variables").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique("doc_templates_unique").on(t.typeCode, t.language, t.countryCode) }));

export const docDocuments = pgTable("doc_documents", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  reference: varchar("reference", { length: 64 }).notNull().unique(),
  typeCode: varchar("type_code", { length: 48 }).notNull(),
  language: varchar("language", { length: 8 }).notNull().default("fr"),
  countryCode: varchar("country_code", { length: 2 }),
  ownerUserId: integer("owner_user_id"),
  counterpartyUserId: integer("counterparty_user_id"),
  linkedEntityType: varchar("linked_entity_type", { length: 32 }),
  linkedEntityId: integer("linked_entity_id"),
  amountHt: numeric("amount_ht", { precision: 14, scale: 2 }),
  amountTtc: numeric("amount_ttc", { precision: 14, scale: 2 }),
  currency: varchar("currency", { length: 4 }),
  status: varchar("status", { length: 16 }).notNull().default("brouillon"),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  signedAt: timestamp("signed_at", { withTimezone: true }),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  storageKey: varchar("storage_key", { length: 255 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const docHealthLog = pgTable("doc_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Métadonnées ─────────────────────────────────────────────────────────
const V = "0.3.0";
const M: MaturityLevel = "sprint_3_automation";
export const DOCUMENT_OS_META = {
  name: "document-os" as const,
  label: "Document Operating System" as const,
  version: V,
  maturityLevel: M,
  contract: "server/document-os/index.ts",
};

// ── Service ─────────────────────────────────────────────────────────────
/** Génère une référence lisible (ex: FAC-2026-000123). */
export function makeDocRef(typeCode: string, seq: number): string {
  const year = new Date().getFullYear();
  const prefix = typeCode.slice(0, 3).toUpperCase();
  return `${prefix}-${year}-${String(seq).padStart(6, "0")}`;
}

export async function listTypes(activeOnly = true) {
  const q = db.select().from(docTypes).orderBy(docTypes.code);
  return activeOnly ? q.where(eq(docTypes.active, true)) : q;
}

export async function getTemplate(typeCode: string, language: string, countryCode?: string) {
  const rows = await db.select().from(docTemplates)
    .where(and(eq(docTemplates.typeCode, typeCode), eq(docTemplates.active, true)));
  // Priorité : (langue+pays) → (langue seul) → (fr+pays) → (fr seul) → 1er dispo
  return (
    rows.find((r) => r.language === language && r.countryCode === (countryCode ?? null)) ??
    rows.find((r) => r.language === language && r.countryCode === null) ??
    rows.find((r) => r.language === "fr" && r.countryCode === (countryCode ?? null)) ??
    rows.find((r) => r.language === "fr" && r.countryCode === null) ??
    rows[0] ?? null
  );
}

export async function upsertTemplate(input: { typeCode: string; language: string; countryCode?: string | null; htmlBody: string; variables?: string[]; active?: boolean }) {
  const values = {
    typeCode: input.typeCode, language: input.language,
    countryCode: input.countryCode ?? null,
    htmlBody: input.htmlBody, variables: (input.variables ?? []) as any,
    active: input.active ?? true, updatedAt: new Date(),
  };
  const [row] = await db.insert(docTemplates).values(values as any)
    .onConflictDoUpdate({
      target: [docTemplates.typeCode, docTemplates.language, docTemplates.countryCode],
      set: { htmlBody: values.htmlBody, variables: values.variables, active: values.active, updatedAt: new Date() },
    }).returning();
  return row;
}

/** Crée un document — retourne la ligne (référence auto-générée). */
export async function createDocument(input: {
  typeCode: string; language?: string; countryCode?: string;
  ownerUserId?: number; counterpartyUserId?: number;
  linkedEntityType?: string; linkedEntityId?: number;
  amountHt?: number; amountTtc?: number; currency?: string;
  metadata?: Record<string, unknown>;
}) {
  const [seqRow] = await db.select({ n: sql<number>`count(*)::int` })
    .from(docDocuments).where(and(
      eq(docDocuments.typeCode, input.typeCode),
      sql`extract(year from ${docDocuments.createdAt}) = ${new Date().getFullYear()}`,
    ));
  const reference = makeDocRef(input.typeCode, Number(seqRow?.n ?? 0) + 1);
  const [row] = await db.insert(docDocuments).values({
    reference, typeCode: input.typeCode,
    language: input.language ?? "fr", countryCode: input.countryCode ?? null,
    ownerUserId: input.ownerUserId ?? null,
    counterpartyUserId: input.counterpartyUserId ?? null,
    linkedEntityType: input.linkedEntityType ?? null,
    linkedEntityId: input.linkedEntityId ?? null,
    amountHt: input.amountHt !== undefined ? String(input.amountHt) : null,
    amountTtc: input.amountTtc !== undefined ? String(input.amountTtc) : null,
    currency: input.currency ?? null,
    status: "brouillon",
    metadata: (input.metadata ?? {}) as any,
  }).returning();
  return row;
}

export async function updateDocumentStatus(id: number, next: "brouillon" | "emis" | "signe" | "annule" | "archive") {
  const patch: any = { status: next };
  if (next === "emis") patch.issuedAt = new Date();
  if (next === "signe") patch.signedAt = new Date();
  if (next === "annule") patch.cancelledAt = new Date();
  const [row] = await db.update(docDocuments).set(patch).where(eq(docDocuments.id, id)).returning();
  return row ?? null;
}

/** Interpole {{variables}} d'un template avec un dict.
 *  Injecte automatiquement les variables de marque MKA.P-MS
 *  (logo_url, brand_name, brand_tagline, issuer_*) si l'appelant
 *  ne les fournit pas. Le logo par défaut est le "logo fermé"
 *  (Version 1 – Terre / Unité), conformément à la charte.
 */
export function renderDocument(html: string, vars: Record<string, string | number>): string {
  const BRAND_DEFAULTS: Record<string, string> = {
    logo_url: process.env.MKA_LOGO_URL ?? "/logo-closed.png",
    brand_name: "MKA.P-MS",
    brand_tagline: "Auto Plus Africa",
    issuer_name: "MKA.P-MS SAS",
    issuer_address: "12 Avenue des Champs-Élysées, 75008 Paris",
    issuer_siret: "123 456 789 00012",
    issuer_vat: "FR 12 345678901",
    currency: "EUR",
    doc_language: "fr",
    signature_block: "",
    legal_mentions: "Document généré par MKA.P-MS conformément aux articles L.441-9 et suivants du Code de commerce.",
  };
  const merged: Record<string, string | number> = { ...BRAND_DEFAULTS, ...vars };
  return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_m, k) => String(merged[k] ?? ""));
}

export async function listDocuments(ownerUserId?: number, limit = 100) {
  const q = db.select().from(docDocuments).orderBy(desc(docDocuments.createdAt)).limit(limit);
  return typeof ownerUserId === "number" ? q.where(eq(docDocuments.ownerUserId, ownerUserId)) : q;
}

// ── Health / Feed / Dashboard ───────────────────────────────────────────
export async function healthStatus() {
  const s = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let types = 0, templates = 0, docs24h = 0, signed24h = 0;
  try {
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(docTypes).where(eq(docTypes.active, true));
    types = Number(a?.n ?? 0);
    const [b] = await db.select({ n: sql<number>`count(*)::int` }).from(docTemplates).where(eq(docTemplates.active, true));
    templates = Number(b?.n ?? 0);
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(docDocuments).where(gt(docDocuments.createdAt, since));
    docs24h = Number(c?.n ?? 0);
    const [d] = await db.select({ n: sql<number>`count(*)::int` }).from(docDocuments).where(and(gt(docDocuments.createdAt, since), eq(docDocuments.status, "signe")));
    signed24h = Number(d?.n ?? 0);
  } catch { status = "degraded"; }
  return {
    engine: "document-os" as const, version: V, status,
    checkedAt: new Date().toISOString(),
    metrics: { typesActive: types, templatesActive: templates, docs24h, signed24h, responseMs: Date.now() - s },
  };
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const s = Date.now();
  const h = await healthStatus();
  return {
    engine: DOCUMENT_OS_META.name, label: DOCUMENT_OS_META.label,
    version: V, maturityLevel: M, health: h.status,
    load: { events5m: 0, events24h: h.metrics.docs24h },
    performance: { lastResponseMs: Date.now() - s },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return {
    ...feed,
    businessMetrics: {
      types_active: h.metrics.typesActive,
      templates_active: h.metrics.templatesActive,
      documents_24h: h.metrics.docs24h,
      documents_signed_24h: h.metrics.signed24h,
    },
    recentEvents: [], recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const documentOsRouter = router({
  meta: publicProcedure.query(() => DOCUMENT_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  types: publicProcedure
    .input(z.object({ activeOnly: z.boolean().default(true) }).optional())
    .query(({ input }) => listTypes(input?.activeOnly ?? true)),

  templates: router({
    get: publicProcedure
      .input(z.object({
        typeCode: z.string().min(1).max(48),
        language: z.string().min(2).max(8),
        countryCode: z.string().length(2).optional(),
      }))
      .query(({ input }) => getTemplate(input.typeCode, input.language, input.countryCode)),
    upsert: adminProcedure
      .input(z.object({
        typeCode: z.string().min(1).max(48),
        language: z.string().min(2).max(8),
        countryCode: z.string().length(2).nullable().optional(),
        htmlBody: z.string().min(1).max(100000),
        variables: z.array(z.string()).default([]),
        active: z.boolean().default(true),
      }))
      .mutation(({ input }) => upsertTemplate(input)),
  }),

  documents: router({
    create: protectedProcedure
      .input(z.object({
        typeCode: z.string().min(1).max(48),
        language: z.string().min(2).max(8).default("fr"),
        countryCode: z.string().length(2).optional(),
        counterpartyUserId: z.number().int().positive().optional(),
        linkedEntityType: z.string().max(32).optional(),
        linkedEntityId: z.number().int().positive().optional(),
        amountHt: z.number().nonnegative().optional(),
        amountTtc: z.number().nonnegative().optional(),
        currency: z.string().max(4).optional(),
        metadata: z.record(z.unknown()).optional(),
      }))
      .mutation(({ ctx, input }) => createDocument({ ...input, ownerUserId: ctx.user.uid })),
    mine: protectedProcedure
      .input(z.object({ limit: z.number().int().min(1).max(500).default(100) }).optional())
      .query(({ ctx, input }) => listDocuments(ctx.user.uid, input?.limit ?? 100)),
    updateStatus: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        status: z.enum(["brouillon", "emis", "signe", "annule", "archive"]),
      }))
      .mutation(({ input }) => updateDocumentStatus(input.id, input.status)),
  }),

  render: adminProcedure
    .input(z.object({
      typeCode: z.string().min(1).max(48),
      language: z.string().min(2).max(8),
      countryCode: z.string().length(2).optional(),
      variables: z.record(z.union([z.string(), z.number()])),
    }))
    .query(async ({ input }) => {
      const tpl = await getTemplate(input.typeCode, input.language, input.countryCode);
      if (!tpl) return { ok: false as const, reason: "template_not_found" };
      return { ok: true as const, html: renderDocument(tpl.htmlBody, input.variables), template: { typeCode: tpl.typeCode, language: tpl.language, countryCode: tpl.countryCode } };
    }),
});
