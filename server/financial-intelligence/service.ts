/**
 * MKA.P-MS Financial Intelligence — moteur de surveillance financière (point 27).
 *
 * Il tourne seul, constate, classe et alerte. Il ne modifie jamais un montant,
 * ne rembourse jamais, ne clôture jamais un abonnement : une correction
 * financière reste une décision humaine.
 *
 * L'analyse est idempotente : une anomalie déjà ouverte sur le même objet
 * n'est pas recréée à chaque passage, sinon la direction recevrait la même
 * alerte indéfiniment.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { notifyDirection } from "../notification-os/triggers.js";
import { DETECTORS, type DetectedAnomaly, type Severity } from "./detectors.js";
import { financeAnomalies } from "./schema.js";

export interface AnalysisResult {
  detecteurs: number;
  detecteursEnErreur: { code: string; erreur: string }[];
  nouvelles: number;
  deja_ouvertes: number;
  parSeverite: Record<Severity, number>;
}

/** Un détecteur qui échoue est signalé, jamais transformé en « tout va bien ». */
async function runDetectors(): Promise<{
  found: DetectedAnomaly[];
  failed: { code: string; erreur: string }[];
}> {
  const found: DetectedAnomaly[] = [];
  const failed: { code: string; erreur: string }[] = [];
  for (const d of DETECTORS) {
    try {
      found.push(...(await d.run()));
    } catch (e) {
      failed.push({ code: d.code, erreur: e instanceof Error ? e.message : String(e) });
    }
  }
  return { found, failed };
}

export async function analyzeFinances(): Promise<AnalysisResult> {
  const { found, failed } = await runDetectors();

  const parSeverite: Record<Severity, number> = { critique: 0, important: 0, a_surveiller: 0 };
  let nouvelles = 0;
  let dejaOuvertes = 0;
  const critiques: DetectedAnomaly[] = [];

  for (const a of found) {
    parSeverite[a.severity] += 1;
    const existing = await db
      .select({ id: financeAnomalies.id, status: financeAnomalies.status })
      .from(financeAnomalies)
      .where(
        and(
          eq(financeAnomalies.code, a.code),
          eq(financeAnomalies.entityType, a.entityType),
          eq(financeAnomalies.entityId, a.entityId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      dejaOuvertes += 1;
      continue;
    }

    await db.insert(financeAnomalies).values({
      code: a.code,
      severity: a.severity,
      entityType: a.entityType,
      entityId: a.entityId,
      userId: a.userId,
      amount: a.amount,
      currency: a.currency,
      detail: a.detail,
    });
    nouvelles += 1;
    if (a.severity === "critique") critiques.push(a);
  }

  // Seules les nouvelles anomalies critiques déclenchent une alerte : le but
  // n'est pas d'envoyer 500 notifications, mais de ne rien laisser silencieux.
  if (critiques.length > 0) {
    const resume = critiques
      .slice(0, 5)
      .map((c) => `${c.code} (${c.entityType} ${c.entityId})`)
      .join(", ");
    await notifyDirection(
      "anomalie_financiere",
      {
        severite: "critique",
        detail: `${critiques.length} anomalie(s) critique(s) : ${resume}.`,
      },
      "/admin/finance-anomalies",
    );
  }

  return {
    detecteurs: DETECTORS.length,
    detecteursEnErreur: failed,
    nouvelles,
    deja_ouvertes: dejaOuvertes,
    parSeverite,
  };
}

export async function listAnomalies(input: {
  status?: string;
  severity?: string;
  limit?: number;
}) {
  const conditions = [];
  if (input.status) conditions.push(eq(financeAnomalies.status, input.status));
  if (input.severity) conditions.push(eq(financeAnomalies.severity, input.severity));

  const base = db.select().from(financeAnomalies);
  const rows = await (conditions.length > 0 ? base.where(and(...conditions)) : base)
    .orderBy(desc(financeAnomalies.detectedAt))
    .limit(input.limit ?? 100);
  return rows;
}

export async function resolveAnomaly(input: {
  id: number;
  status: "traitee" | "ignoree";
  note?: string;
  userId: number;
}) {
  await db
    .update(financeAnomalies)
    .set({
      status: input.status,
      resolutionNote: input.note ?? null,
      resolvedBy: input.userId,
      resolvedAt: new Date(),
    })
    .where(eq(financeAnomalies.id, input.id));
  return { id: input.id, status: input.status };
}

export interface FinancialIntelligenceHealth {
  health: "ok" | "degraded" | "down";
  detecteurs: number;
  detecteursEnErreur: { code: string; erreur: string }[];
  ouvertes: number;
  critiquesOuvertes: number;
  derniereAnalyse: Date | null;
  details: string[];
}

/**
 * Santé du moteur : capacité à détecter, pas nombre d'anomalies. Des anomalies
 * ouvertes sont du travail métier, jamais une panne du moteur.
 */
export async function financialIntelligenceHealth(): Promise<FinancialIntelligenceHealth> {
  const { failed } = await runDetectors();

  const counts = await db
    .select({
      severity: financeAnomalies.severity,
      total: sql<number>`count(*)::int`,
    })
    .from(financeAnomalies)
    .where(eq(financeAnomalies.status, "ouverte"))
    .groupBy(financeAnomalies.severity);

  const ouvertes = counts.reduce((s, c) => s + c.total, 0);
  const critiquesOuvertes = counts.find((c) => c.severity === "critique")?.total ?? 0;

  const last = await db
    .select({ detectedAt: financeAnomalies.detectedAt })
    .from(financeAnomalies)
    .orderBy(desc(financeAnomalies.detectedAt))
    .limit(1);

  const details: string[] = [
    `${DETECTORS.length - failed.length}/${DETECTORS.length} détecteurs opérationnels.`,
    `${ouvertes} anomalie(s) ouverte(s), dont ${critiquesOuvertes} critique(s).`,
  ];
  for (const f of failed) details.push(`Détecteur ${f.code} indisponible : ${f.erreur}`);

  return {
    health: failed.length === 0 ? "ok" : failed.length < DETECTORS.length ? "degraded" : "down",
    detecteurs: DETECTORS.length,
    detecteursEnErreur: failed,
    ouvertes,
    critiquesOuvertes,
    derniereAnalyse: last[0]?.detectedAt ?? null,
    details,
  };
}
