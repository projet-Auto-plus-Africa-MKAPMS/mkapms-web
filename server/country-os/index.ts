/**
 * Country OS — Registre mondial des pays (règles MOS #11/#12/#13/#14/#15).
 *
 * Consolide `shared/currency.ts` en tables interrogeables + configuration
 * complète par pays. Ajouter un nouveau pays = INSERT dans `country_countries`
 * (aucune modification de code métier).
 */
import { boolean, bigserial, integer, jsonb, numeric, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../trpc.js";
import { z } from "zod";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";

// ── Schéma Drizzle ──────────────────────────────────────────────────────
export const countryCountries = pgTable("country_countries", {
  code: varchar("code", { length: 2 }).primaryKey(),
  code3: varchar("code3", { length: 3 }),
  nameFr: varchar("name_fr", { length: 120 }).notNull(),
  nameEn: varchar("name_en", { length: 120 }),
  defaultLanguage: varchar("default_language", { length: 8 }).notNull().default("fr"),
  availableLanguages: jsonb("available_languages").$type<string[]>().notNull().default(["fr"]),
  defaultCurrency: varchar("default_currency", { length: 4 }).notNull(),
  tvaRate: numeric("tva_rate", { precision: 5, scale: 2 }).notNull().default("0"),
  phonePrefix: varchar("phone_prefix", { length: 6 }),
  timezone: varchar("timezone", { length: 48 }).notNull().default("UTC"),
  addressFormat: jsonb("address_format").default({}),
  paymentMethods: jsonb("payment_methods").$type<string[]>().notNull().default([]),
  requiredDocs: jsonb("required_docs").$type<string[]>().notNull().default([]),
  universesEnabled: jsonb("universes_enabled").$type<string[]>().notNull().default(["auto"]),
  regulations: jsonb("regulations").default({}),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const countryCurrencies = pgTable("country_currencies", {
  code: varchar("code", { length: 4 }).primaryKey(),
  symbol: varchar("symbol", { length: 8 }).notNull(),
  nameFr: varchar("name_fr", { length: 80 }).notNull(),
  rateFromEur: numeric("rate_from_eur", { precision: 18, scale: 6 }).notNull().default("1"),
  locale: varchar("locale", { length: 16 }).notNull().default("fr-FR"),
  noDecimals: boolean("no_decimals").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const countryHealthLog = pgTable("country_health_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  status: varchar("status", { length: 16 }).notNull(),
  message: text("message"),
  metrics: jsonb("metrics"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Métadonnées + Contract ──────────────────────────────────────────────
const COUNTRY_OS_VERSION = "0.3.0";
const COUNTRY_OS_MATURITY: MaturityLevel = "sprint_3_automation";
export const COUNTRY_OS_META = {
  name: "country-os" as const,
  label: "Country Operating System" as const,
  version: COUNTRY_OS_VERSION,
  maturityLevel: COUNTRY_OS_MATURITY,
  contract: "server/country-os/index.ts",
};

// ── Service ─────────────────────────────────────────────────────────────
export async function listCountries(opts: { activeOnly?: boolean } = { activeOnly: true }) {
  const q = db.select().from(countryCountries).orderBy(countryCountries.nameFr);
  if (opts.activeOnly) return q.where(eq(countryCountries.active, true));
  return q;
}

export async function getCountry(code: string) {
  const [row] = await db.select().from(countryCountries).where(eq(countryCountries.code, code.toUpperCase())).limit(1);
  return row ?? null;
}

export async function upsertCountry(input: {
  code: string; code3?: string; nameFr: string; nameEn?: string;
  defaultLanguage?: string; availableLanguages?: string[];
  defaultCurrency: string; tvaRate?: number; phonePrefix?: string;
  timezone?: string; paymentMethods?: string[]; requiredDocs?: string[];
  universesEnabled?: string[]; regulations?: Record<string, unknown>;
  active?: boolean;
}) {
  const values = {
    code: input.code.toUpperCase(),
    code3: input.code3 ?? null,
    nameFr: input.nameFr,
    nameEn: input.nameEn ?? null,
    defaultLanguage: input.defaultLanguage ?? "fr",
    availableLanguages: input.availableLanguages ?? ["fr"],
    defaultCurrency: input.defaultCurrency,
    tvaRate: String(input.tvaRate ?? 0),
    phonePrefix: input.phonePrefix ?? null,
    timezone: input.timezone ?? "UTC",
    paymentMethods: input.paymentMethods ?? [],
    requiredDocs: input.requiredDocs ?? [],
    universesEnabled: input.universesEnabled ?? ["auto"],
    regulations: (input.regulations ?? {}) as any,
    active: input.active ?? true,
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(countryCountries)
    .values(values as any)
    .onConflictDoUpdate({ target: countryCountries.code, set: values as any })
    .returning();
  return row;
}

export async function listCurrencies() {
  return db.select().from(countryCurrencies).orderBy(countryCurrencies.code);
}

// ── Health + Dashboard + Feed (standards MOS) ───────────────────────────
export async function healthStatus() {
  const startedAt = Date.now();
  let status: "ok" | "degraded" | "down" = "ok";
  let message: string | undefined;
  let countriesActive = 0, currencies = 0;
  try {
    const [c1] = await db.select({ n: sql<number>`count(*)::int` }).from(countryCountries).where(eq(countryCountries.active, true));
    countriesActive = Number(c1?.n ?? 0);
    const [c2] = await db.select({ n: sql<number>`count(*)::int` }).from(countryCurrencies);
    currencies = Number(c2?.n ?? 0);
  } catch (e) { status = "degraded"; message = (e as Error).message; }
  const result = {
    engine: "country-os" as const, version: COUNTRY_OS_VERSION, status,
    checkedAt: new Date().toISOString(), message,
    metrics: { countriesActive, currencies, responseMs: Date.now() - startedAt },
  };
  db.insert(countryHealthLog).values({ status, message: message ?? null, metrics: result.metrics as any }).catch(() => {});
  return result;
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: COUNTRY_OS_META.name, label: COUNTRY_OS_META.label,
    version: COUNTRY_OS_VERSION, maturityLevel: COUNTRY_OS_MATURITY,
    health: h.status, load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: 0 }, lastSyncAt: new Date().toISOString(), status: "active",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const h = await healthStatus();
  return {
    ...feed,
    businessMetrics: { countries_active: h.metrics.countriesActive, currencies: h.metrics.currencies },
    recentEvents: [], recentErrors: [],
  };
}

// ── Router tRPC ─────────────────────────────────────────────────────────
export const countryOsRouter = router({
  meta: publicProcedure.query(() => COUNTRY_OS_META),
  healthStatus: publicProcedure.query(() => healthStatus()),
  controlCenterFeed: publicProcedure.query(() => controlCenterFeed()),
  dashboard: adminProcedure.query(() => dashboard()),

  list: publicProcedure
    .input(z.object({ activeOnly: z.boolean().default(true) }).optional())
    .query(({ input }) => listCountries({ activeOnly: input?.activeOnly ?? true })),

  get: publicProcedure
    .input(z.object({ code: z.string().length(2) }))
    .query(({ input }) => getCountry(input.code)),

  currencies: publicProcedure.query(() => listCurrencies()),

  // Ajouter un pays = pure configuration (aucune modification de code métier).
  upsert: adminProcedure
    .input(z.object({
      code: z.string().length(2),
      code3: z.string().length(3).optional(),
      nameFr: z.string().min(1).max(120),
      nameEn: z.string().max(120).optional(),
      defaultLanguage: z.string().max(8).default("fr"),
      availableLanguages: z.array(z.string()).default(["fr"]),
      defaultCurrency: z.string().min(2).max(4),
      tvaRate: z.number().min(0).max(100).default(0),
      phonePrefix: z.string().max(6).optional(),
      timezone: z.string().max(48).default("UTC"),
      paymentMethods: z.array(z.string()).default([]),
      requiredDocs: z.array(z.string()).default([]),
      universesEnabled: z.array(z.string()).default(["auto"]),
      regulations: z.record(z.unknown()).optional(),
      active: z.boolean().default(true),
    }))
    .mutation(({ input }) => upsertCountry(input)),

  disable: adminProcedure
    .input(z.object({ code: z.string().length(2) }))
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(countryCountries)
        .set({ active: false, updatedAt: new Date() })
        .where(eq(countryCountries.code, input.code.toUpperCase()))
        .returning();
      return row ?? null;
    }),
});
