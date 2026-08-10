/**
 * Rapport quotidien du PDG — archivage et livraison avant 23 h (point 39).
 *
 * Le rapport existait déjà (`buildDailyReport`) mais il n'était calculé que
 * lorsque quelqu'un ouvrait l'écran : aucune trace, aucune histoire, et aucune
 * remise s'il n'était pas consulté. Ce service :
 *   1. génère le rapport du jour ;
 *   2. l'archive (un seul enregistrement par date) ;
 *   3. le remet à la direction via le Notification OS.
 *
 * Garde-fous :
 *   • un seul rapport par jour, une seule remise (idempotent) ;
 *   • s'il n'y a aucun destinataire de direction, la remise est marquée
 *     `sans_destinataire` — jamais « remis » ;
 *   • le rapport n'exécute aucune correction : il constate.
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../../db.js";
import { notifyDirection } from "../../notification-os/triggers.js";
import { smartDailyReports } from "../schema.js";
import { buildDailyReport } from "./daily-report.js";

/** Heure locale (serveur) à partir de laquelle le rapport du jour est dû. */
export const REPORT_DUE_HOUR = 22;

function dayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface DeliveryOutcome {
  date: string;
  archived: boolean;
  status: "remis" | "sans_destinataire" | "deja_remis" | "echec";
  recipients: number[];
  anomalies: number;
  critiques: number;
}

/**
 * Génère, archive et remet le rapport du jour. Rejouable : si le rapport du
 * jour a déjà été remis, il n'est ni régénéré ni renvoyé.
 */
export async function archiveAndDeliverDailyReport(
  options: { force?: boolean } = {},
): Promise<DeliveryOutcome> {
  const date = dayKey();

  const [existing] = await db
    .select()
    .from(smartDailyReports)
    .where(eq(smartDailyReports.reportDate, date))
    .limit(1);

  if (existing && existing.deliveryStatus === "remis" && !options.force) {
    const summary = existing.summary as { anomalies?: number; criticalAnomalies?: number };
    return {
      date,
      archived: true,
      status: "deja_remis",
      recipients: (existing.recipients as number[]) ?? [],
      anomalies: Number(summary?.anomalies ?? 0),
      critiques: Number(summary?.criticalAnomalies ?? 0),
    };
  }

  const report = await buildDailyReport();

  const values = {
    reportDate: date,
    generatedAt: new Date(),
    summary: report.summary as unknown as Record<string, unknown>,
    anomalies: report.anomalies as unknown as Record<string, unknown>[],
    suggestions: report.suggestions as unknown as Record<string, unknown>[],
  };

  await db
    .insert(smartDailyReports)
    .values(values)
    .onConflictDoUpdate({ target: smartDailyReports.reportDate, set: values });

  const resume =
    `${report.summary.anomalies} anomalie(s) dont ${report.summary.criticalAnomalies} critique(s), ` +
    `${report.summary.suggestions} proposition(s), qualité ${report.summary.qualityScore}/100, ` +
    `${report.summary.openAlerts} alerte(s) ouverte(s).`;

  let status: DeliveryOutcome["status"] = "remis";
  let recipients: number[] = [];
  let error: string | null = null;
  try {
    const r = await notifyDirection(
      "rapport_quotidien",
      { date, resume },
      "/superadmin/smart-engine?onglet=rapport",
    );
    recipients = r.recipients;
    if (recipients.length === 0) {
      status = "sans_destinataire";
      error = "aucun compte de direction destinataire";
    }
  } catch (e) {
    status = "echec";
    error = e instanceof Error ? e.message : String(e);
  }

  await db
    .update(smartDailyReports)
    .set({
      deliveryStatus: status === "remis" ? "remis" : status,
      deliveredAt: status === "remis" ? new Date() : null,
      recipients,
      deliveryError: error,
    })
    .where(eq(smartDailyReports.reportDate, date));

  return {
    date,
    archived: true,
    status,
    recipients,
    anomalies: report.summary.anomalies,
    critiques: report.summary.criticalAnomalies,
  };
}

/**
 * Cycle appelé périodiquement : ne fait quelque chose qu'à partir de l'heure
 * due et seulement si le rapport du jour n'est pas déjà remis.
 */
export async function dailyReportTick(now = new Date()): Promise<DeliveryOutcome | null> {
  if (now.getHours() < REPORT_DUE_HOUR) return null;
  const date = dayKey(now);
  const [existing] = await db
    .select({ status: smartDailyReports.deliveryStatus })
    .from(smartDailyReports)
    .where(eq(smartDailyReports.reportDate, date))
    .limit(1);
  if (existing?.status === "remis") return null;
  return archiveAndDeliverDailyReport();
}

/** Historique des rapports archivés (résumé seul, pour la liste). */
export async function listArchivedReports(limit = 30) {
  return db
    .select({
      id: smartDailyReports.id,
      reportDate: smartDailyReports.reportDate,
      generatedAt: smartDailyReports.generatedAt,
      summary: smartDailyReports.summary,
      deliveryStatus: smartDailyReports.deliveryStatus,
      deliveredAt: smartDailyReports.deliveredAt,
      recipients: smartDailyReports.recipients,
      deliveryError: smartDailyReports.deliveryError,
    })
    .from(smartDailyReports)
    .orderBy(desc(smartDailyReports.reportDate))
    .limit(limit);
}

/** Rapport archivé complet d'une date donnée. */
export async function getArchivedReport(date: string) {
  const [row] = await db
    .select()
    .from(smartDailyReports)
    .where(eq(smartDailyReports.reportDate, date))
    .limit(1);
  return row ?? null;
}

/** État de la remise du jour, pour l'écran de supervision. */
export async function todayDeliveryState() {
  const date = dayKey();
  const [row] = await db
    .select({
      deliveryStatus: smartDailyReports.deliveryStatus,
      deliveredAt: smartDailyReports.deliveredAt,
      recipients: smartDailyReports.recipients,
      deliveryError: smartDailyReports.deliveryError,
    })
    .from(smartDailyReports)
    .where(eq(smartDailyReports.reportDate, date))
    .limit(1);
  const [count] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(smartDailyReports);
  return {
    date,
    dueHour: REPORT_DUE_HOUR,
    archives: Number(count?.n ?? 0),
    status: row?.deliveryStatus ?? "en_attente",
    deliveredAt: row?.deliveredAt ? new Date(row.deliveredAt).toISOString() : null,
    recipients: (row?.recipients as number[]) ?? [],
    error: row?.deliveryError ?? null,
  };
}
