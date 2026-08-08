/**
 * MKA.P-MS Pro Portal Engine — logique du parcours professionnel.
 *
 * Parcours : métier → pays → besoins → composition de l'offre → panier →
 * compte → paiement → activation.
 *
 * Règle stricte : le montant du panier est TOUJOURS recalculé ici depuis le
 * registre central des tarifs. Le navigateur n'envoie que des codes de modules,
 * jamais un prix.
 */
import { asc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { getCountry, listCountries } from "../country-os/index.js";
import { resolveProduct } from "../payment-engine/products.js";
import { proPortalProfessions, proPortalModules, proPortalDrafts } from "./schema.js";
import { PROFESSION_CATALOG, MODULE_CATALOG } from "./catalog.js";

export interface PortalProfession {
  code: string;
  label: string;
  description: string | null;
  family: string;
  defaultModules: string[];
  requiredModules: string[];
}

export interface PortalModule {
  code: string;
  label: string;
  description: string | null;
  family: string;
  dependencies: string[];
  /** Prix résolu depuis le registre central. `null` si aucun tarif publié. */
  price: number | null;
  currency: string | null;
  periodicity: string | null;
  /** Imposé par le métier choisi : le professionnel ne peut pas le retirer. */
  required: boolean;
  /** Pré-coché à l'arrivée, mais retirable. */
  recommended: boolean;
}

export interface PortalQuoteLine {
  code: string;
  label: string;
  price: number;
  currency: string;
  periodicity: string | null;
  required: boolean;
}

export interface PortalQuote {
  professionCode: string;
  countryCode: string;
  lines: PortalQuoteLine[];
  currency: string;
  monthlyTotal: number;
  oneTimeTotal: number;
  /** Modules demandés sans tarif publié : signalés, jamais facturés au hasard. */
  unpriced: string[];
  /** Dépendances ajoutées automatiquement à la sélection. */
  autoAdded: string[];
  /** Le pays a-t-il un moyen de paiement compatible ? Jamais supposé vrai. */
  paymentReady: boolean;
}

/** Un catalogue vide vaut « ouvert à tous les pays ». */
function servesCountry(countries: string[] | null | undefined, countryCode: string): boolean {
  if (!countries || countries.length === 0) return true;
  return countries.includes(countryCode.toUpperCase());
}

/**
 * Amorce la base depuis le catalogue curé. Idempotent : un métier ou un module
 * déjà présent n'est jamais écrasé — la base fait autorité une fois amorcée,
 * de sorte qu'un nouveau métier puisse être ajouté sans redéploiement.
 */
export async function seedProPortal(): Promise<{ professions: number; modules: number }> {
  let professions = 0;
  for (const p of PROFESSION_CATALOG) {
    const [existing] = await db
      .select({ id: proPortalProfessions.id })
      .from(proPortalProfessions)
      .where(eq(proPortalProfessions.code, p.code));
    if (existing) continue;
    await db.insert(proPortalProfessions).values({
      code: p.code,
      label: p.label,
      description: p.description,
      family: p.family,
      defaultModules: p.defaultModules,
      requiredModules: p.requiredModules,
      requirements: p.requirements,
      sortOrder: p.sortOrder,
    });
    professions += 1;
  }

  let modules = 0;
  for (const m of MODULE_CATALOG) {
    const [existing] = await db
      .select({ id: proPortalModules.id })
      .from(proPortalModules)
      .where(eq(proPortalModules.code, m.code));
    if (existing) continue;
    await db.insert(proPortalModules).values({
      code: m.code,
      label: m.label,
      description: m.description,
      family: m.family,
      productCode: m.productCode ?? null,
      dependencies: m.dependencies ?? [],
      sortOrder: m.sortOrder,
    });
    modules += 1;
  }

  return { professions, modules };
}

/** Métiers proposés, filtrés sur le pays lorsqu'il est déjà choisi. */
export async function listProfessions(countryCode?: string): Promise<PortalProfession[]> {
  const rows = await db
    .select()
    .from(proPortalProfessions)
    .where(eq(proPortalProfessions.active, true))
    .orderBy(asc(proPortalProfessions.sortOrder), asc(proPortalProfessions.label));

  return rows
    .filter((r) => !countryCode || servesCountry(r.countries, countryCode))
    .map((r) => ({
      code: r.code,
      label: r.label,
      description: r.description,
      family: r.family,
      defaultModules: r.defaultModules ?? [],
      requiredModules: r.requiredModules ?? [],
    }));
}

/** Pays ouverts au portail professionnel (registre Country OS, sans doublon). */
export async function listPortalCountries(): Promise<
  { code: string; name: string; currency: string; paymentReady: boolean }[]
> {
  const rows = await listCountries({ activeOnly: true });
  return rows.map((c) => ({
    code: c.code,
    name: c.nameFr,
    currency: c.defaultCurrency,
    // Un pays peut être ouvert sans moyen de paiement compatible : on le dit,
    // plutôt que de laisser le professionnel arriver à un checkout impossible.
    paymentReady: (c.paymentMethods ?? []).length > 0,
  }));
}

async function priceOf(productCode: string | null): Promise<{ price: number; currency: string; periodicity: string | null } | null> {
  if (!productCode) return null;
  try {
    const product = await resolveProduct(productCode);
    return { price: product.price, currency: product.currency, periodicity: product.periodicity };
  } catch {
    // Tarif non publié : le module reste proposé mais sans montant inventé.
    return null;
  }
}

/**
 * Catalogue de services pour un métier donné, avec les tarifs réels.
 * Les modules imposés par le métier sont marqués `required`.
 */
export async function listModulesFor(professionCode: string, countryCode: string): Promise<PortalModule[]> {
  const [profession] = await db
    .select()
    .from(proPortalProfessions)
    .where(eq(proPortalProfessions.code, professionCode));
  if (!profession) throw new Error(`Métier inconnu : ${professionCode}`);

  const rows = await db
    .select()
    .from(proPortalModules)
    .where(eq(proPortalModules.active, true))
    .orderBy(asc(proPortalModules.sortOrder), asc(proPortalModules.label));

  const required = new Set(profession.requiredModules ?? []);
  const recommended = new Set(profession.defaultModules ?? []);

  const out: PortalModule[] = [];
  for (const r of rows) {
    if (!servesCountry(r.countries, countryCode)) continue;
    const tarif = await priceOf(r.productCode);
    out.push({
      code: r.code,
      label: r.label,
      description: r.description,
      family: r.family,
      dependencies: r.dependencies ?? [],
      price: tarif?.price ?? null,
      currency: tarif?.currency ?? null,
      periodicity: tarif?.periodicity ?? null,
      required: required.has(r.code),
      recommended: recommended.has(r.code) || required.has(r.code),
    });
  }
  return out;
}

/**
 * Compose l'offre : ajoute les modules imposés et les dépendances, puis
 * calcule le total à partir des tarifs du registre central.
 */
export async function buildQuote(input: {
  professionCode: string;
  countryCode: string;
  moduleCodes: string[];
}): Promise<PortalQuote> {
  const modules = await listModulesFor(input.professionCode, input.countryCode);
  const byCode = new Map(modules.map((m) => [m.code, m]));

  const selected = new Set<string>();
  const autoAdded: string[] = [];

  const add = (code: string, auto: boolean) => {
    const mod = byCode.get(code);
    if (!mod || selected.has(code)) return;
    selected.add(code);
    if (auto) autoAdded.push(code);
    for (const dep of mod.dependencies) add(dep, true);
  };

  for (const m of modules) if (m.required) add(m.code, true);
  for (const code of input.moduleCodes) add(code, false);

  const lines: PortalQuoteLine[] = [];
  const unpriced: string[] = [];
  let monthlyTotal = 0;
  let oneTimeTotal = 0;
  let currency = "EUR";

  for (const code of selected) {
    const mod = byCode.get(code);
    if (!mod) continue;
    if (mod.price == null || mod.currency == null) {
      unpriced.push(mod.label);
      continue;
    }
    currency = mod.currency;
    if (mod.periodicity) monthlyTotal += mod.price;
    else oneTimeTotal += mod.price;
    lines.push({
      code: mod.code,
      label: mod.label,
      price: mod.price,
      currency: mod.currency,
      periodicity: mod.periodicity,
      required: mod.required,
    });
  }

  lines.sort((a, b) => a.label.localeCompare(b.label));

  const pays = await getCountry(input.countryCode);

  return {
    professionCode: input.professionCode,
    countryCode: input.countryCode,
    lines,
    currency,
    paymentReady: (pays?.paymentMethods ?? []).length > 0,
    monthlyTotal: Math.round(monthlyTotal * 100) / 100,
    oneTimeTotal: Math.round(oneTimeTotal * 100) / 100,
    unpriced,
    autoAdded,
  };
}

/**
 * Justificatifs à réunir avant l'activation : socle commun du métier, complété
 * des exigences propres au pays lorsqu'elles diffèrent.
 */
export async function requirementsFor(professionCode: string, countryCode: string): Promise<string[]> {
  const [profession] = await db
    .select()
    .from(proPortalProfessions)
    .where(eq(proPortalProfessions.code, professionCode));
  if (!profession) throw new Error(`Métier inconnu : ${professionCode}`);

  const map = profession.requirements ?? {};
  const commun = map["*"] ?? [];
  const metierPays = map[countryCode.toUpperCase()] ?? [];
  // Documents exigés par le pays lui-même (Country OS) : ils s'ajoutent sans
  // être recopiés dans chaque métier.
  const pays = await getCountry(countryCode);
  const docsPays = pays?.requiredDocs ?? [];
  return Array.from(new Set([...commun, ...metierPays, ...docsPays]));
}

/** Sauvegarde (ou reprend) une composition d'offre en cours. */
export async function saveDraft(input: {
  sessionKey: string;
  userId?: number | null;
  professionCode?: string | null;
  countryCode?: string | null;
  moduleCodes?: string[];
  step?: string;
}): Promise<{ ok: true; quote: PortalQuote | null }> {
  let quote: PortalQuote | null = null;
  if (input.professionCode && input.countryCode) {
    quote = await buildQuote({
      professionCode: input.professionCode,
      countryCode: input.countryCode,
      moduleCodes: input.moduleCodes ?? [],
    });
  }

  const values = {
    sessionKey: input.sessionKey,
    userId: input.userId ?? null,
    professionCode: input.professionCode ?? null,
    countryCode: input.countryCode ?? null,
    moduleCodes: input.moduleCodes ?? [],
    step: input.step ?? "metier",
    quote: quote ? (quote as unknown as Record<string, unknown>) : null,
    updatedAt: new Date(),
  };

  await db
    .insert(proPortalDrafts)
    .values(values)
    .onConflictDoUpdate({ target: proPortalDrafts.sessionKey, set: values });

  return { ok: true, quote };
}

export async function getDraft(sessionKey: string) {
  const [row] = await db.select().from(proPortalDrafts).where(eq(proPortalDrafts.sessionKey, sessionKey));
  return row ?? null;
}

/** Santé du moteur : le portail ne peut fonctionner sans son catalogue. */
export async function portalHealth(): Promise<{
  health: "ok" | "degraded" | "down";
  professions: number;
  modules: number;
  unpricedModules: number;
  drafts: number;
  details: string[];
}> {
  const details: string[] = [];
  try {
    const [prof] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(proPortalProfessions)
      .where(eq(proPortalProfessions.active, true));
    const mods = await db.select().from(proPortalModules).where(eq(proPortalModules.active, true));
    const [drafts] = await db.select({ n: sql<number>`count(*)::int` }).from(proPortalDrafts);

    let unpriced = 0;
    for (const m of mods) {
      if (!(await priceOf(m.productCode))) unpriced += 1;
    }
    if (unpriced > 0) details.push(`${unpriced} module(s) sans tarif publié`);

    const professions = prof?.n ?? 0;
    const health = professions === 0 || mods.length === 0 ? "down" : unpriced > 0 ? "degraded" : "ok";
    if (professions === 0) details.push("aucun métier actif");
    if (mods.length === 0) details.push("aucun service actif");

    return { health, professions, modules: mods.length, unpricedModules: unpriced, drafts: drafts?.n ?? 0, details };
  } catch (err) {
    return {
      health: "down",
      professions: 0,
      modules: 0,
      unpricedModules: 0,
      drafts: 0,
      details: [(err as Error).message],
    };
  }
}
