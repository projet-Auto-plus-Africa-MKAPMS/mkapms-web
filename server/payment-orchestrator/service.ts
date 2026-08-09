/**
 * MKA.P-MS Payment Orchestrator — sélection du prestataire.
 *
 * Le checkout ne demande jamais « est-ce que Stripe est là ? ». Il demande
 * « qui peut encaisser CE montant, dans CE pays, pour CE service ? ». Ajouter
 * un prestataire = ajouter une ligne, pas réécrire le parcours d'achat.
 *
 * Règle d'honnêteté : un prestataire déclaré mais non intégré ou non
 * configuré n'est JAMAIS retenu. Quand aucun prestataire n'est utilisable, on
 * renvoie explicitement « PAYS CONFIGURÉ — PRESTATAIRE DE PAIEMENT MANQUANT »
 * au lieu de laisser croire à un paiement possible.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { env } from "../env.js";
import { paymentProviders, paymentRoutingDecisions } from "./schema.js";

export const NO_PROVIDER_REASON = "PAYS CONFIGURÉ — PRESTATAIRE DE PAIEMENT MANQUANT";

export interface ProviderQuery {
  countryCode: string;
  currency: string;
  service?: string | null;
  method?: string | null;
  /** Préférence utilisateur : respectée seulement si le prestataire est utilisable. */
  preferred?: string | null;
  userId?: number | null;
}

export interface ProviderDecision {
  providerCode: string | null;
  providerLabel: string | null;
  reason: string;
  rejected: { code: string; reason: string }[];
}

/** Prestataires connus du code : seuls ceux-là possèdent un connecteur d'exécution. */
const IMPLEMENTED_CONNECTORS = new Set<string>(["stripe"]);

/** Le prestataire dispose-t-il de ses secrets ? Lu à l'exécution, jamais journalisé. */
function isConfigured(envKey: string | null): boolean {
  if (!envKey) return false;
  const value = (env as unknown as Record<string, string | undefined>)[envKey]
    ?? process.env[envKey];
  return typeof value === "string" && value.length > 0;
}

function matches(list: string[] | null | undefined, value: string | null | undefined): boolean {
  if (!list || list.length === 0) return true;
  if (list.includes("*")) return true;
  if (!value) return false;
  return list.includes(value.toUpperCase()) || list.includes(value.toLowerCase());
}

/**
 * Choisit le prestataire pour un contexte donné.
 * Le repli sur Stripe s'applique uniquement si le registre est vide (base pas
 * encore initialisée) : il évite de casser les paiements en cours.
 */
export async function selectProvider(query: ProviderQuery): Promise<ProviderDecision> {
  const rows = await db
    .select()
    .from(paymentProviders)
    .where(eq(paymentProviders.active, true));

  if (rows.length === 0) {
    return {
      providerCode: "stripe",
      providerLabel: "Stripe",
      reason: "Registre des prestataires vide — repli sur le connecteur historique",
      rejected: [],
    };
  }

  const rejected: { code: string; reason: string }[] = [];
  const eligible = rows.filter((p) => {
    if (!IMPLEMENTED_CONNECTORS.has(p.code) || !p.integrated) {
      rejected.push({ code: p.code, reason: "connecteur non intégré" });
      return false;
    }
    if (!isConfigured(p.configEnvKey)) {
      rejected.push({ code: p.code, reason: "prestataire non configuré (secret absent)" });
      return false;
    }
    if (!matches(p.countries, query.countryCode)) {
      rejected.push({ code: p.code, reason: `pays ${query.countryCode} non couvert` });
      return false;
    }
    if (!matches(p.currencies, query.currency)) {
      rejected.push({ code: p.code, reason: `devise ${query.currency} non couverte` });
      return false;
    }
    if (query.service && !matches(p.services, query.service)) {
      rejected.push({ code: p.code, reason: `service ${query.service} non couvert` });
      return false;
    }
    if (query.method && p.methods.length > 0 && !matches(p.methods, query.method)) {
      rejected.push({ code: p.code, reason: `moyen ${query.method} non porté` });
      return false;
    }
    return true;
  });

  if (eligible.length === 0) {
    return { providerCode: null, providerLabel: null, reason: NO_PROVIDER_REASON, rejected };
  }

  const preferred = query.preferred
    ? eligible.find((p) => p.code === query.preferred)
    : undefined;
  const chosen = preferred ?? eligible.sort((a, b) => a.priority - b.priority)[0];

  return {
    providerCode: chosen.code,
    providerLabel: chosen.label,
    reason: preferred
      ? "préférence utilisateur respectée"
      : `priorité ${chosen.priority} — pays/devise/service compatibles`,
    rejected,
  };
}

/** Enregistre la décision : sans trace, un refus de paiement reste inexplicable. */
export async function recordDecision(
  query: ProviderQuery,
  decision: ProviderDecision,
): Promise<void> {
  await db.insert(paymentRoutingDecisions).values({
    countryCode: query.countryCode,
    currency: query.currency,
    service: query.service ?? null,
    method: query.method ?? null,
    providerCode: decision.providerCode,
    reason: decision.reason.slice(0, 200),
    rejected: decision.rejected,
    userId: query.userId ?? null,
  });
}

/** Sélection + trace, utilisée par le checkout. */
export async function routePayment(query: ProviderQuery): Promise<ProviderDecision> {
  const decision = await selectProvider(query);
  try {
    await recordDecision(query, decision);
  } catch {
    // La traçabilité ne doit jamais empêcher un paiement d'aboutir.
  }
  return decision;
}

/** Catalogue par défaut : Stripe intégré, les autres déclarés mais non promis. */
const DEFAULT_PROVIDERS = [
  {
    code: "stripe",
    label: "Stripe",
    countries: ["*"],
    currencies: ["*"],
    methods: ["card"],
    services: ["*"],
    priority: 10,
    integrated: true,
    configEnvKey: "STRIPE_SECRET_KEY",
    notes: "Connecteur historique. Carte bancaire, couverture internationale.",
  },
  {
    code: "paypal",
    label: "PayPal",
    countries: ["*"],
    currencies: ["*"],
    methods: ["wallet"],
    services: ["*"],
    priority: 20,
    integrated: false,
    configEnvKey: "PAYPAL_CLIENT_SECRET",
    notes: "Déclaré, connecteur non écrit : jamais proposé tant qu'il n'existe pas.",
  },
  {
    code: "mobile_money",
    label: "Paiement mobile (opérateur local)",
    countries: ["GN", "SN", "CI", "ML"],
    currencies: ["GNF", "XOF"],
    methods: ["mobile_money"],
    services: ["*"],
    priority: 30,
    integrated: false,
    configEnvKey: "MOBILE_MONEY_API_KEY",
    notes: "Réservé aux pays où le paiement mobile domine. Connecteur à écrire.",
  },
  {
    code: "bank_transfer",
    label: "Virement bancaire",
    countries: ["*"],
    currencies: ["*"],
    methods: ["bank_transfer"],
    services: ["*"],
    priority: 90,
    integrated: false,
    configEnvKey: null,
    notes: "Encaissement hors ligne : rapprochement manuel dans le Payment Engine.",
  },
] as const;

/** Seed idempotent : ne réécrit jamais un prestataire déjà personnalisé. */
export async function seedProviders(): Promise<{ inserted: number }> {
  let inserted = 0;
  for (const p of DEFAULT_PROVIDERS) {
    const existing = await db
      .select({ id: paymentProviders.id })
      .from(paymentProviders)
      .where(eq(paymentProviders.code, p.code))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(paymentProviders).values({
      code: p.code,
      label: p.label,
      countries: [...p.countries],
      currencies: [...p.currencies],
      methods: [...p.methods],
      services: [...p.services],
      priority: p.priority,
      integrated: p.integrated,
      configEnvKey: p.configEnvKey,
      notes: p.notes,
    });
    inserted += 1;
  }
  return { inserted };
}

export interface OrchestratorHealth {
  health: "ok" | "degraded" | "down";
  prestatairesDeclares: number;
  prestatairesUtilisables: number;
  paysSansPrestataire: string[];
  details: string[];
}

/**
 * Santé du routage. Un pays sans prestataire est une information métier
 * (à combler commercialement), pas une panne du moteur.
 */
export async function orchestratorHealth(
  countries: string[] = ["FR", "BE", "ES", "MA", "TN", "SN", "CI", "ML", "GN"],
): Promise<OrchestratorHealth> {
  const rows = await db.select().from(paymentProviders).where(eq(paymentProviders.active, true));
  const usable = rows.filter(
    (p) => p.integrated && IMPLEMENTED_CONNECTORS.has(p.code) && isConfigured(p.configEnvKey),
  );

  const paysSansPrestataire: string[] = [];
  for (const country of countries) {
    const ok = usable.some((p) => matches(p.countries, country));
    if (!ok) paysSansPrestataire.push(country);
  }

  const details: string[] = [
    `${rows.length} prestataire(s) déclaré(s), ${usable.length} réellement utilisable(s).`,
  ];
  if (paysSansPrestataire.length > 0) {
    details.push(`${NO_PROVIDER_REASON} : ${paysSansPrestataire.join(", ")}.`);
  }

  return {
    health: usable.length > 0 ? "ok" : "degraded",
    prestatairesDeclares: rows.length,
    prestatairesUtilisables: usable.length,
    paysSansPrestataire,
    details,
  };
}

/** Vue registre : ce qui est promis, et ce qui est réellement branché. */
export async function listProviders() {
  const rows = await db.select().from(paymentProviders);
  return rows
    .map((p) => ({
      code: p.code,
      label: p.label,
      countries: p.countries,
      currencies: p.currencies,
      methods: p.methods,
      services: p.services,
      priority: p.priority,
      active: p.active,
      integrated: p.integrated && IMPLEMENTED_CONNECTORS.has(p.code),
      configured: isConfigured(p.configEnvKey),
      notes: p.notes,
    }))
    .sort((a, b) => a.priority - b.priority);
}

export async function setProviderActive(code: string, active: boolean) {
  await db
    .update(paymentProviders)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(paymentProviders.code, code)));
  return { code, active };
}
