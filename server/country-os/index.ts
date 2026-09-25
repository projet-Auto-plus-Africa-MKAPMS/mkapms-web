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
import { publicProcedure, protectedProcedure, adminProcedure, pdgProcedure, router } from "../trpc.js";
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

/**
 * Registre des capacités Google par pays (doctrine PDG v1.1, MOS §12.1/12.2).
 *
 * Interdiction absolue d'inventer une disponibilité Google. Une capacité ne
 * peut être vraie que si `verified = true` ET `sourceRef` pointe vers une
 * page officielle support.google.com. Tant qu'une ligne n'est pas vérifiée,
 * tout moteur appelant (`isGoogleCapabilityEligible`) doit la traiter comme
 * indisponible — même schéma de prudence que Country Policy Engine
 * (`cpe_rules.verified`) : pas de valeur par défaut permissive.
 *
 * `search` est la seule capacité vraie par défaut (référencement Google
 * Search/SEO organique, universel, sans restriction pays connue).
 */
export const countryGoogleCapabilities = pgTable("country_google_capabilities", {
  countryCode: varchar("country_code", { length: 2 }).primaryKey(),
  search: boolean("search").notNull().default(true),
  merchant: boolean("merchant").notNull().default(false),
  freeListings: boolean("free_listings").notNull().default(false),
  shopping: boolean("shopping").notNull().default(false),
  vehicleAds: boolean("vehicle_ads").notNull().default(false),
  googleBusiness: boolean("google_business").notNull().default(false),
  localAds: boolean("local_ads").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  sourceRef: text("source_ref"),
  notes: text("notes"),
  verifiedBy: integer("verified_by"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
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

/**
 * Pays ouvert dans le Country OS : le seul référentiel qui dit où la
 * plateforme opère. Un code inconnu ou désactivé est refusé, le moteur
 * appelant ne peut pas ouvrir une enchère, une borne ou un partenaire dans
 * un pays que la direction n'a pas ouvert.
 */
export async function requireOpenCountry(code: string) {
  const pays = await getCountry(code);
  if (!pays || !pays.active) {
    throw new Error(`Pays ${code.toUpperCase()} non ouvert dans le Country OS.`);
  }
  return pays;
}

/** Devise du pays selon le Country OS, ou null si le pays n'est pas référencé. */
export async function countryCurrency(code: string | null | undefined): Promise<string | null> {
  if (!code) return null;
  const pays = await getCountry(code);
  return pays?.defaultCurrency ?? null;
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

// ── Capacités Google par pays ───────────────────────────────────────────

export async function listGoogleCapabilities() {
  return db.select().from(countryGoogleCapabilities).orderBy(countryGoogleCapabilities.countryCode);
}

export async function getGoogleCapabilities(code: string) {
  const [row] = await db
    .select()
    .from(countryGoogleCapabilities)
    .where(eq(countryGoogleCapabilities.countryCode, code.toUpperCase()))
    .limit(1);
  return row ?? null;
}

/**
 * Une capacité n'est exploitable que vérifiée. L'absence de ligne, ou une
 * ligne non vérifiée, vaut « indisponible » — jamais « probablement oui ».
 * C'est le point d'appel que les moteurs Google (product-engine, futurs
 * moteurs §12.6) doivent utiliser au lieu de coder une liste de pays en dur.
 */
export async function isGoogleCapabilityEligible(
  code: string | null | undefined,
  capability: "search" | "merchant" | "freeListings" | "shopping" | "vehicleAds" | "googleBusiness" | "localAds",
): Promise<boolean> {
  if (!code) return false;
  const row = await getGoogleCapabilities(code);
  if (!row || !row.verified) return false;
  return Boolean(row[capability]);
}

/**
 * Déclarer/confirmer une capacité engage la plateforme dans une décision
 * marketing internationale : réservé au PDG (comme cpe_rules). Une capacité
 * ne peut passer à `true` sans `sourceRef` (référence à une page officielle
 * Google) — refus explicite sinon, pour qu'il soit impossible d'inventer une
 * disponibilité par erreur de saisie rapide.
 */
export async function upsertGoogleCapabilities(input: {
  countryCode: string;
  search?: boolean;
  merchant?: boolean;
  freeListings?: boolean;
  shopping?: boolean;
  vehicleAds?: boolean;
  googleBusiness?: boolean;
  localAds?: boolean;
  verified: boolean;
  sourceRef?: string;
  notes?: string;
  verifiedBy: number;
}) {
  const anyCapabilityTrue = Boolean(
    input.merchant || input.freeListings || input.shopping || input.vehicleAds || input.googleBusiness || input.localAds,
  );
  if (anyCapabilityTrue && (!input.verified || !input.sourceRef)) {
    throw new Error(
      "Impossible d'activer une capacité Google sans verified=true et une sourceRef (page officielle support.google.com). Interdiction d'inventer une disponibilité Google.",
    );
  }
  const values = {
    countryCode: input.countryCode.toUpperCase(),
    search: input.search ?? true,
    merchant: input.merchant ?? false,
    freeListings: input.freeListings ?? false,
    shopping: input.shopping ?? false,
    vehicleAds: input.vehicleAds ?? false,
    googleBusiness: input.googleBusiness ?? false,
    localAds: input.localAds ?? false,
    verified: input.verified,
    sourceRef: input.sourceRef ?? null,
    notes: input.notes ?? null,
    verifiedBy: input.verifiedBy,
    verifiedAt: new Date(),
    updatedAt: new Date(),
  };
  const [row] = await db
    .insert(countryGoogleCapabilities)
    .values(values)
    .onConflictDoUpdate({ target: countryGoogleCapabilities.countryCode, set: values })
    .returning();
  return row;
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
  const capabilities = await db.select().from(countryGoogleCapabilities);
  const googleCapabilitiesVerified = capabilities.filter((c) => c.verified).length;
  return {
    ...feed,
    businessMetrics: {
      countries_active: h.metrics.countriesActive,
      currencies: h.metrics.currencies,
      google_capabilities_verified: googleCapabilitiesVerified,
      google_capabilities_total: capabilities.length,
    },
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

  // Capacités Google par pays — jamais inventées (doctrine PDG v1.1, §12.1/12.2).
  google: router({
    list: publicProcedure.query(() => listGoogleCapabilities()),

    get: publicProcedure
      .input(z.object({ code: z.string().length(2) }))
      .query(({ input }) => getGoogleCapabilities(input.code)),

    isEligible: publicProcedure
      .input(
        z.object({
          code: z.string().length(2).nullable().optional(),
          capability: z.enum(["search", "merchant", "freeListings", "shopping", "vehicleAds", "googleBusiness", "localAds"]),
        }),
      )
      .query(({ input }) => isGoogleCapabilityEligible(input.code, input.capability)),

    // Décision PDG : engage la plateforme sur une disponibilité Google par pays.
    upsert: pdgProcedure
      .input(
        z.object({
          countryCode: z.string().length(2),
          search: z.boolean().optional(),
          merchant: z.boolean().optional(),
          freeListings: z.boolean().optional(),
          shopping: z.boolean().optional(),
          vehicleAds: z.boolean().optional(),
          googleBusiness: z.boolean().optional(),
          localAds: z.boolean().optional(),
          verified: z.boolean(),
          sourceRef: z.string().max(2000).optional(),
          notes: z.string().max(2000).optional(),
        }),
      )
      .mutation(({ input, ctx }) => upsertGoogleCapabilities({ ...input, verifiedBy: ctx.user.uid })),
  }),
});
