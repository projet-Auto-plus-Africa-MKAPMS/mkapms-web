/**
 * Point 66 — MKA.P-MS COUNTRY POLICY ENGINE.
 *
 *   Action → pays concerné → règles applicables → permissions → contrôle →
 *   exécution ou blocage.
 *
 * Règle de conception : **l'absence d'information n'est pas une autorisation.**
 * Si le moteur ne dispose pas d'une règle confirmée et en cours de validité
 * pour le pays concerné, il répond `validation_requise` avec la mention
 * « RÈGLE PAYS NON CONFIRMÉE ». Il n'invente jamais une autorisation, et il ne
 * réutilise jamais la règle d'un autre pays — y compris la France.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { countryCountries } from "../country-os/index.js";
import { cpeEvaluations, cpeRules } from "./schema.js";

/**
 * Domaines réglementés. Une action rattachée à l'un d'eux ne peut pas être
 * exécutée automatiquement sans règle pays confirmée.
 */
export const CPE_DOMAINS: Record<string, string> = {
  tva: "TVA et taxes",
  facturation: "Facturation et mentions obligatoires",
  paiement: "Encaissement et services de paiement",
  donnees_personnelles: "Données personnelles",
  publicite: "Publicité et démarchage",
  vente_vehicule: "Vente de véhicule",
  immatriculation: "Immatriculation et carte grise",
  controle_technique: "Contrôle technique",
  assurance: "Assurance",
  transport_personnes: "Transport de personnes (VTC / taxi)",
  enchere: "Ventes aux enchères",
  credit: "Crédit et financement",
  garantie: "Garantie légale et rétractation",
  importation: "Importation et douane",
  emissions: "Émissions et environnement",
  recyclage: "Véhicules hors d'usage et recyclage",
};

export const CPE_EFFECTS: Record<string, string> = {
  autorise: "Autorisé",
  interdit: "Interdit",
  conditionne: "Autorisé sous conditions",
};

export type Verdict = "autorise" | "bloque" | "validation_requise" | "hors_perimetre";

/**
 * Rattachement d'un type d'action à un domaine réglementé. Ce qui n'est pas
 * listé n'est pas réglementé : un audit qualité ou un scan d'alertes n'a pas
 * besoin de l'accord d'un régulateur.
 */
const ACTION_DOMAINS: { pattern: RegExp; domain: string }[] = [
  { pattern: /tva|taxe/i, domain: "tva" },
  { pattern: /factur|invoice/i, domain: "facturation" },
  { pattern: /paiement|payout|payment|virement|remboursement/i, domain: "paiement" },
  { pattern: /rgpd|donnees_personnelles|consentement|anonymis|suppression_compte/i, domain: "donnees_personnelles" },
  { pattern: /publicite|campagne|emailing|prospection|demarchage/i, domain: "publicite" },
  { pattern: /vente_vehicule|cession|mandat_vente/i, domain: "vente_vehicule" },
  { pattern: /immatricul|carte_grise/i, domain: "immatriculation" },
  { pattern: /controle_technique/i, domain: "controle_technique" },
  { pattern: /assurance/i, domain: "assurance" },
  { pattern: /vtc|taxi|transport_personnes/i, domain: "transport_personnes" },
  { pattern: /enchere|auction/i, domain: "enchere" },
  { pattern: /credit|financement|leasing|lld|loa/i, domain: "credit" },
  { pattern: /garantie|retractation/i, domain: "garantie" },
  { pattern: /import|douane|export/i, domain: "importation" },
  { pattern: /emission|co2|crit_air|zfe/i, domain: "emissions" },
  { pattern: /recyclage|vhu|epave/i, domain: "recyclage" },
];

/** Domaine réglementé concerné par une action, s'il y en a un. */
export function domainForAction(actionType: string): string | null {
  const found = ACTION_DOMAINS.find((d) => d.pattern.test(actionType));
  return found ? found.domain : null;
}

export interface PolicyDecision {
  verdict: Verdict;
  /** Message affichable tel quel, en clair. */
  reason: string;
  domain: string | null;
  countryCode: string | null;
  ruleId: number | null;
  conditions: Record<string, unknown> | null;
}

function signatureOf(countryCode: string, domain: string, topic: string | null): string {
  return `${countryCode.toUpperCase()}|${domain}|${(topic ?? "*").trim().toLowerCase()}`.slice(0, 400);
}

/** Règles confirmées, en cours de validité, pour un pays et un domaine. */
async function applicableRules(countryCode: string, domain: string) {
  const now = new Date();
  const rows = await db
    .select()
    .from(cpeRules)
    .where(
      and(
        eq(cpeRules.countryCode, countryCode.toUpperCase()),
        eq(cpeRules.domain, domain),
        eq(cpeRules.verified, true),
        eq(cpeRules.status, "confirmee"),
      ),
    )
    .orderBy(desc(cpeRules.updatedAt));
  return rows.filter(
    (r) =>
      (r.validFrom === null || r.validFrom <= now) &&
      (r.validUntil === null || r.validUntil >= now),
  );
}

export interface EvaluateInput {
  actionType: string;
  countryCode?: string | null;
  /** Domaine imposé par l'appelant, quand il le connaît mieux que le motif. */
  domain?: string;
  topic?: string;
  actorId?: number;
  context?: Record<string, unknown>;
}

/**
 * Évalue une action. Chaque évaluation est journalisée : un blocage
 * réglementaire doit être explicable après coup.
 */
export async function evaluateAction(input: EvaluateInput): Promise<PolicyDecision> {
  const domain = input.domain ?? domainForAction(input.actionType);
  const pays = input.countryCode ? input.countryCode.toUpperCase() : null;

  const journalise = async (d: PolicyDecision): Promise<PolicyDecision> => {
    await db.insert(cpeEvaluations).values({
      actionType: input.actionType,
      domain: d.domain,
      countryCode: d.countryCode,
      verdict: d.verdict,
      reason: d.reason,
      ruleId: d.ruleId,
      actorId: input.actorId ?? null,
      context: input.context ?? {},
    });
    return d;
  };

  if (!domain) {
    return journalise({
      verdict: "hors_perimetre",
      reason: "Action sans dépendance réglementaire identifiée.",
      domain: null,
      countryCode: pays,
      ruleId: null,
      conditions: null,
    });
  }

  if (!pays) {
    return journalise({
      verdict: "validation_requise",
      reason:
        `VALIDATION REQUISE — PAYS NON PRÉCISÉ. L'action touche « ${CPE_DOMAINS[domain] ?? domain} », ` +
        "un domaine réglementé : elle ne peut pas être exécutée sans savoir quelle juridiction s'applique.",
      domain,
      countryCode: null,
      ruleId: null,
      conditions: null,
    });
  }

  const [pcount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(countryCountries)
    .where(and(eq(countryCountries.code, pays), eq(countryCountries.active, true)));
  if ((pcount?.n ?? 0) === 0) {
    return journalise({
      verdict: "bloque",
      reason: `Le pays ${pays} n'est pas un pays activé de la plateforme : aucune action réglementée n'y est exécutée.`,
      domain,
      countryCode: pays,
      ruleId: null,
      conditions: null,
    });
  }

  const regles = await applicableRules(pays, domain);
  if (regles.length === 0) {
    return journalise({
      verdict: "validation_requise",
      reason:
        `VALIDATION REQUISE — RÈGLE PAYS NON CONFIRMÉE. Aucune règle vérifiée et en cours de validité pour ` +
        `« ${CPE_DOMAINS[domain] ?? domain} » en ${pays}. Le moteur n'invente pas d'autorisation.`,
      domain,
      countryCode: pays,
      ruleId: null,
      conditions: null,
    });
  }

  // Une interdiction l'emporte sur tout le reste.
  const interdit = regles.find((r) => r.effect === "interdit");
  if (interdit) {
    return journalise({
      verdict: "bloque",
      reason: `Interdit en ${pays} : ${interdit.rule}${interdit.authority ? ` (${interdit.authority})` : ""}.`,
      domain,
      countryCode: pays,
      ruleId: interdit.id,
      conditions: null,
    });
  }

  const conditionne = regles.find((r) => r.effect === "conditionne");
  if (conditionne) {
    return journalise({
      verdict: "validation_requise",
      reason: `Autorisé sous conditions en ${pays} : ${conditionne.rule}. Une validation humaine confirme que les conditions sont réunies.`,
      domain,
      countryCode: pays,
      ruleId: conditionne.id,
      conditions: conditionne.conditions,
    });
  }

  const autorise = regles[0];
  return journalise({
    verdict: "autorise",
    reason: `Autorisé en ${pays} : ${autorise.rule}${autorise.authority ? ` (${autorise.authority})` : ""}.`,
    domain,
    countryCode: pays,
    ruleId: autorise.id,
    conditions: null,
  });
}

export interface DeclareRuleInput {
  countryCode: string;
  domain: string;
  topic?: string;
  rule: string;
  effect: "autorise" | "interdit" | "conditionne";
  conditions?: Record<string, unknown>;
  authority?: string;
  sourceCode?: string;
  sourceRef?: string;
  validFrom?: Date;
  validUntil?: Date;
  confidence?: number;
  declaredBy: number;
}

/**
 * Déclare une règle. Elle entre en `projet` : déclarer n'est pas confirmer,
 * et une règle en projet n'autorise rien.
 */
export async function declareRule(input: DeclareRuleInput) {
  const signature = signatureOf(input.countryCode, input.domain, input.topic ?? null);
  const [row] = await db
    .insert(cpeRules)
    .values({
      countryCode: input.countryCode.toUpperCase(),
      domain: input.domain,
      topic: input.topic ?? null,
      rule: input.rule,
      effect: input.effect,
      conditions: input.conditions ?? {},
      authority: input.authority ?? null,
      sourceCode: input.sourceCode ?? null,
      sourceRef: input.sourceRef ?? null,
      validFrom: input.validFrom ?? null,
      validUntil: input.validUntil ?? null,
      confidence: input.confidence ?? null,
      declaredBy: input.declaredBy,
      signature,
    })
    .onConflictDoUpdate({
      target: cpeRules.signature,
      set: {
        rule: input.rule,
        effect: input.effect,
        conditions: input.conditions ?? {},
        authority: input.authority ?? null,
        sourceRef: input.sourceRef ?? null,
        validFrom: input.validFrom ?? null,
        validUntil: input.validUntil ?? null,
        confidence: input.confidence ?? null,
        // Toute modification du texte annule la confirmation précédente : une
        // règle réécrite doit être revérifiée avant de redevenir opposable.
        verified: false,
        status: "projet",
        updatedAt: new Date(),
      },
    })
    .returning();
  return row;
}

/** Confirmation humaine : c'est elle qui rend la règle opposable. */
export async function confirmRule(id: number, actorId: number, confidence?: number) {
  const now = new Date();
  const [row] = await db
    .update(cpeRules)
    .set({
      verified: true,
      verifiedBy: actorId,
      verifiedAt: now,
      status: "confirmee",
      confidence: confidence ?? null,
      updatedAt: now,
    })
    .where(eq(cpeRules.id, id))
    .returning();
  return row ?? null;
}

export async function retireRule(id: number, actorId: number) {
  const now = new Date();
  const [row] = await db
    .update(cpeRules)
    .set({ status: "obsolete", verified: false, verifiedBy: actorId, updatedAt: now })
    .where(eq(cpeRules.id, id))
    .returning();
  return row ?? null;
}

export async function listRules(input: { countryCode?: string; domain?: string; limit?: number }) {
  const conds = [];
  if (input.countryCode) conds.push(eq(cpeRules.countryCode, input.countryCode.toUpperCase()));
  if (input.domain) conds.push(eq(cpeRules.domain, input.domain));
  const rows = await db
    .select()
    .from(cpeRules)
    .where(conds.length > 0 ? and(...conds) : undefined)
    .orderBy(desc(cpeRules.updatedAt))
    .limit(input.limit ?? 200);
  return rows.map((r) => ({
    ...r,
    domainLabel: CPE_DOMAINS[r.domain] ?? r.domain,
    effectLabel: CPE_EFFECTS[r.effect] ?? r.effect,
    opposable: r.verified && r.status === "confirmee",
  }));
}

/**
 * Matrice de couverture : pour chaque pays activé et chaque domaine réglementé,
 * une règle confirmée existe-t-elle ? Les cases vides ne sont pas des trous à
 * combler par hypothèse — ce sont les endroits où l'automatisation s'arrête.
 */
export async function coverageMatrix() {
  const pays = await db
    .select({ code: countryCountries.code, nameFr: countryCountries.nameFr })
    .from(countryCountries)
    .where(eq(countryCountries.active, true))
    .orderBy(countryCountries.nameFr);

  const rows = await db
    .select({
      countryCode: cpeRules.countryCode,
      domain: cpeRules.domain,
      n: sql<number>`count(*) filter (where ${cpeRules.verified} = true and ${cpeRules.status} = 'confirmee')::int`,
    })
    .from(cpeRules)
    .groupBy(cpeRules.countryCode, cpeRules.domain);

  const map = new Map(rows.map((r) => [`${r.countryCode}|${r.domain}`, r.n]));
  const domaines = Object.keys(CPE_DOMAINS);

  return {
    domaines: domaines.map((d) => ({ code: d, label: CPE_DOMAINS[d] })),
    pays: pays.map((p) => ({
      code: p.code,
      nameFr: p.nameFr,
      couverture: domaines.map((d) => ({
        domain: d,
        confirmees: map.get(`${p.code}|${d}`) ?? 0,
      })),
    })),
  };
}

export async function recentEvaluations(limit = 100) {
  return db.select().from(cpeEvaluations).orderBy(desc(cpeEvaluations.createdAt)).limit(limit);
}

export async function policyStats() {
  const [regles] = await db
    .select({
      total: sql<number>`count(*)::int`,
      confirmees: sql<number>`count(*) filter (where ${cpeRules.verified} = true and ${cpeRules.status} = 'confirmee')::int`,
      projets: sql<number>`count(*) filter (where ${cpeRules.status} = 'projet')::int`,
      obsoletes: sql<number>`count(*) filter (where ${cpeRules.status} = 'obsolete')::int`,
      pays: sql<number>`count(distinct ${cpeRules.countryCode})::int`,
    })
    .from(cpeRules);
  const [evals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      bloques: sql<number>`count(*) filter (where ${cpeEvaluations.verdict} = 'bloque')::int`,
      validations: sql<number>`count(*) filter (where ${cpeEvaluations.verdict} = 'validation_requise')::int`,
      autorises: sql<number>`count(*) filter (where ${cpeEvaluations.verdict} = 'autorise')::int`,
    })
    .from(cpeEvaluations);
  return {
    regles: regles ?? { total: 0, confirmees: 0, projets: 0, obsoletes: 0, pays: 0 },
    evaluations: evals ?? { total: 0, bloques: 0, validations: 0, autorises: 0 },
  };
}

/** Sonde de santé du moteur, au même format que les autres moteurs. */
export async function countryPolicyHealth() {
  try {
    const s = await policyStats();
    const paysActifs = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(countryCountries)
      .where(eq(countryCountries.active, true));
    const total = paysActifs[0]?.n ?? 0;
    // Un moteur sans règle confirmée n'est pas « en bonne santé » : il bloque
    // tout. Le dire est plus utile que d'afficher un voyant vert.
    const status = s.regles.confirmees === 0 ? "degraded" : "healthy";
    return {
      status,
      message:
        s.regles.confirmees === 0
          ? `Aucune règle pays confirmée : toute action réglementée est renvoyée en validation humaine (${total} pays activé(s)).`
          : `${s.regles.confirmees} règle(s) confirmée(s) sur ${s.regles.pays} pays.`,
      metrics: { ...s.regles, paysActifs: total, evaluations: s.evaluations.total },
    };
  } catch (e) {
    return {
      status: "down" as const,
      message: e instanceof Error ? e.message : "Erreur inconnue",
      metrics: {},
    };
  }
}
