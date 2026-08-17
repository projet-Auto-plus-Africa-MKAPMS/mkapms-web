/**
 * Points 67-68 — chaque travail d'agent alimente le Système Intelligent, et
 * chaque dépôt est analysé automatiquement.
 *
 * Défaut corrigé : un changement déclaré restait une ligne de journal. Personne
 * ne disait ce qu'il pouvait casser, quels moteurs et quels pays il touchait,
 * ni s'il était rattrapable. Ici, chaque changement reçoit un verdict :
 *
 *   VALIDE | VALIDE_AVEC_AVERTISSEMENT | REFUSE
 *
 * Le verdict ne s'appuie que sur des faits constatables (moteur identifié ou
 * non, retour arrière documenté ou non, domaines sensibles mentionnés, santé
 * réelle des moteurs dépendants, tests déclarés). Aucun risque n'est inventé, et
 * un verdict n'autorise ni ne bloque rien tout seul : il informe la décision
 * humaine, qui reste la seule à valider.
 */
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db.js";
import { agentChangeLog } from "./agent-changes.js";
import { engineRegistry } from "./schema.js";
import { impactOf } from "./dependencies.js";

export type ImpactVerdict = "valide" | "valide_avec_avertissement" | "refuse";

export interface ImpactFinding {
  /** Domaine examiné : moteurs, pages, pays, permissions, paiement, seo… */
  domain: string;
  /** "info" | "avertissement" | "critique" */
  level: "info" | "avertissement" | "critique";
  detail: string;
}

export interface ChangeImpactReport {
  changeId: number;
  verdict: ImpactVerdict;
  findings: ImpactFinding[];
  /** Moteurs qui tombent en cascade si le moteur touché se dégrade. */
  enginesAffected: string[];
  /** Pays déclarés par l'agent ; vide = portée mondiale non précisée. */
  countries: string[];
  analyzedAt: string;
}

/**
 * Domaines sensibles reconnaissables dans le titre, le détail ou la liste de
 * fichiers déclarée. On ne devine pas l'intention : on signale seulement qu'un
 * domaine à risque est touché, pour que la relecture humaine soit ciblée.
 */
const SENSITIVE_DOMAINS: { domain: string; patterns: RegExp; critique: boolean }[] = [
  { domain: "paiement", patterns: /paiement|payment|stripe|facture|abonnement|wallet|virement/i, critique: true },
  { domain: "permissions", patterns: /permission|role|rbac|acces|admin|pdg/i, critique: true },
  { domain: "secrets", patterns: /secret|token|api[_-]?key|credential|mot de passe|password/i, critique: true },
  { domain: "donnees", patterns: /drop |delete from|truncate|migration|schema|alter table/i, critique: false },
  { domain: "redirections", patterns: /redirect|route|url|slug|404/i, critique: false },
  { domain: "seo_geo", patterns: /seo|sitemap|jsonld|json-ld|meta|hreflang|geo/i, critique: false },
  { domain: "pays", patterns: /pays|country|juridiction|tva|devise/i, critique: false },
  { domain: "notifications", patterns: /notification|email|sms|push/i, critique: false },
];

function textOf(row: { title: string; detail: string | null; metadata: Record<string, unknown> | null }): string {
  const files = row.metadata && Array.isArray(row.metadata.files) ? row.metadata.files.join(" ") : "";
  return [row.title, row.detail ?? "", files].join(" \n ");
}

function declaredCountries(metadata: Record<string, unknown> | null): string[] {
  if (!metadata) return [];
  const raw = metadata.countries ?? metadata.pays;
  if (!Array.isArray(raw)) return [];
  return raw.filter((c): c is string => typeof c === "string");
}

function declaredTests(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  const t = metadata.tests;
  if (typeof t === "string" && t.trim().length > 0) return t.trim();
  if (typeof t === "number") return String(t);
  return null;
}

/**
 * Analyse un changement déclaré et enregistre son verdict. Rejouable : une
 * nouvelle analyse remplace la précédente (le contexte, lui, a pu changer).
 */
export async function analyzeChangeImpact(changeId: number): Promise<ChangeImpactReport | null> {
  const [row] = await db
    .select()
    .from(agentChangeLog)
    .where(eq(agentChangeLog.id, changeId))
    .limit(1);
  if (!row) return null;

  const findings: ImpactFinding[] = [];
  const haystack = textOf(row);

  // 1. Moteur concerné et cascade réelle.
  let enginesAffected: string[] = [];
  if (!row.engineName) {
    findings.push({
      domain: "moteurs",
      level: "avertissement",
      detail: "Aucun moteur déclaré : impossible de savoir ce que ce changement peut casser en cascade.",
    });
  } else {
    const [engine] = await db
      .select({ name: engineRegistry.name, health: engineRegistry.health, state: engineRegistry.state })
      .from(engineRegistry)
      .where(eq(engineRegistry.name, row.engineName))
      .limit(1);
    if (!engine) {
      findings.push({
        domain: "moteurs",
        level: "avertissement",
        detail: `Le moteur « ${row.engineName} » n'existe pas au registre central : le changement n'est rattaché à rien.`,
      });
    } else {
      const impact = await impactOf(engine.name);
      enginesAffected = impact.activeAffected;
      findings.push({
        domain: "moteurs",
        level: enginesAffected.length > 0 ? "avertissement" : "info",
        detail:
          enginesAffected.length > 0
            ? `${enginesAffected.length} moteur(s) actif(s) dépendent de « ${engine.name} » : ${enginesAffected.join(", ")}.`
            : `Aucun moteur actif ne dépend de « ${engine.name} ».`,
      });
      if (engine.health === "degraded" || engine.health === "down") {
        findings.push({
          domain: "sante",
          level: "critique",
          detail: `Le moteur « ${engine.name} » est actuellement ${engine.health === "down" ? "arrêté" : "dégradé"} : un dépôt supplémentaire aggrave le risque.`,
        });
      }
    }
  }

  // 2. Domaines sensibles touchés.
  for (const s of SENSITIVE_DOMAINS) {
    if (!s.patterns.test(haystack)) continue;
    const sansRetour = !row.rollbackPlan;
    findings.push({
      domain: s.domain,
      level: s.critique && sansRetour ? "critique" : s.critique ? "avertissement" : "info",
      detail: s.critique
        ? `Domaine sensible touché (${s.domain})${sansRetour ? " sans procédure de retour arrière documentée" : ""}.`
        : `Domaine ${s.domain} touché : à vérifier après mise en production.`,
    });
  }

  // 3. Retour arrière.
  if (!row.rollbackPlan) {
    findings.push({
      domain: "retour_arriere",
      level: "avertissement",
      detail: "Aucune procédure de retour arrière documentée : en cas d'incident, la remise en état sera improvisée.",
    });
  }

  // 4. Tests déclarés.
  const tests = declaredTests(row.metadata);
  findings.push({
    domain: "tests",
    level: tests ? "info" : "avertissement",
    detail: tests ? `Tests déclarés : ${tests}.` : "Aucun test déclaré pour ce changement.",
  });

  // 5. Portée pays — jamais supposée mondiale ni française par défaut.
  const countries = declaredCountries(row.metadata);
  findings.push({
    domain: "pays",
    level: countries.length > 0 ? "info" : "avertissement",
    detail:
      countries.length > 0
        ? `Portée déclarée : ${countries.join(", ")}.`
        : "Aucun pays déclaré : la portée est supposée mondiale, à confirmer avant toute règle réglementaire.",
  });

  // 6. Structure déjà en base sans relecture humaine.
  if (row.appliedInDb === 1 && row.status === "declaree") {
    findings.push({
      domain: "donnees",
      level: "avertissement",
      detail: "Le changement est déjà présent en base alors qu'aucune relecture humaine n'a été enregistrée.",
    });
  }

  const critiques = findings.filter((f) => f.level === "critique").length;
  const avertissements = findings.filter((f) => f.level === "avertissement").length;
  const verdict: ImpactVerdict =
    critiques > 0 ? "refuse" : avertissements > 0 ? "valide_avec_avertissement" : "valide";

  const analyzedAt = new Date();
  await db
    .update(agentChangeLog)
    .set({
      impactVerdict: verdict,
      impactFindings: { findings, enginesAffected, countries },
      impactAt: analyzedAt,
      updatedAt: analyzedAt,
    })
    .where(eq(agentChangeLog.id, changeId));

  return {
    changeId,
    verdict,
    findings,
    enginesAffected,
    countries,
    analyzedAt: analyzedAt.toISOString(),
  };
}

/**
 * Analyse tous les changements récents encore sans verdict. C'est ce qui rend
 * l'analyse « automatique après chaque dépôt » : rien n'attend qu'un humain
 * pense à lancer l'examen.
 */
export async function analyzePendingChanges(opts?: { sinceDays?: number; limit?: number }) {
  const since = new Date(Date.now() - (opts?.sinceDays ?? 30) * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ id: agentChangeLog.id })
    .from(agentChangeLog)
    .where(and(sql`${agentChangeLog.impactVerdict} is null`, gte(agentChangeLog.createdAt, since)))
    .orderBy(desc(agentChangeLog.createdAt))
    .limit(opts?.limit ?? 50);

  const verdicts: Record<ImpactVerdict, number> = {
    valide: 0,
    valide_avec_avertissement: 0,
    refuse: 0,
  };
  for (const r of rows) {
    const report = await analyzeChangeImpact(r.id);
    if (report) verdicts[report.verdict] += 1;
  }
  return { analyses: rows.length, verdicts };
}

export async function impactSummary() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      nonAnalyses: sql<number>`count(*) filter (where ${agentChangeLog.impactVerdict} is null)::int`,
      valides: sql<number>`count(*) filter (where ${agentChangeLog.impactVerdict} = 'valide')::int`,
      avertissements: sql<number>`count(*) filter (where ${agentChangeLog.impactVerdict} = 'valide_avec_avertissement')::int`,
      refuses: sql<number>`count(*) filter (where ${agentChangeLog.impactVerdict} = 'refuse')::int`,
    })
    .from(agentChangeLog);
  return row ?? { total: 0, nonAnalyses: 0, valides: 0, avertissements: 0, refuses: 0 };
}
