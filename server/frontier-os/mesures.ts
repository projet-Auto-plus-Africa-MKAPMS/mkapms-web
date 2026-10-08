/**
 * Centre Cyber-Électrique — MESURES. Seules des valeurs réellement mesurées entrent ici (latence des messages du bus, débit des échanges
 * livrés, mémoire et charge du processus, erreurs comptées, reprise après panne). Aucune valeur par défaut : une donnée absente est
 * « non mesurée ». Aucune température : le centre n'a aucune source qui la mesure.
 */
import os from "node:os";
import { and, count, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { dbFrontier, type BaseFrontier } from "./base/connexion.js";
import { commands, engineCapabilities, exchanges, incidents, measurements, type MetriqueMesure } from "./base/schema.js";
import { niveauJauge, type NiveauJauge } from "./regles.js";

export type SujetMesure = { kind: "center" | "engine" | "line" | "cut" | "transport"; code: string };

export async function enregistrerMesure(sujet: SujetMesure, metrique: MetriqueMesure, valeur: number, unite: string, source: string, base: BaseFrontier = dbFrontier()): Promise<void> {
  if (!Number.isFinite(valeur)) return; // une valeur non finie n'est pas une mesure
  await base.insert(measurements).values({ subjectKind: sujet.kind, subjectCode: sujet.code, metric: metrique, value: valeur, unit: unite, source });
}

/** Mesure l'état du processus du centre : mémoire résidente, charge moyenne, profondeur de la file. */
export async function echantillonnerCentre(base: BaseFrontier = dbFrontier()): Promise<{ memoireMo: number; charge: number; file: number }> {
  const memoireMo = Math.round((process.memoryUsage().rss / 1048576) * 10) / 10;
  const charge = Math.round((os.loadavg()[0]! / Math.max(1, os.cpus().length)) * 1000) / 1000;
  const [f] = await base.select({ n: count() }).from(exchanges).where(eq(exchanges.state, "queued"));
  const file = Number(f?.n ?? 0);
  await enregistrerMesure({ kind: "center", code: "center" }, "memory_mb", memoireMo, "Mo", "process.memoryUsage().rss", base);
  await enregistrerMesure({ kind: "center", code: "center" }, "cpu_load", charge, "charge/cœur", "os.loadavg()[0] / cœurs", base);
  await enregistrerMesure({ kind: "transport", code: "center:transport" }, "queue_depth", file, "échanges", "table exchanges (état queued)", base);
  return { memoireMo, charge, file };
}

/** Garde les 20 000 dernières mesures : le journal des mesures ne grossit pas sans fin. */
export async function elaguerMesures(base: BaseFrontier = dbFrontier()): Promise<number> {
  const r = await base.execute(sql`DELETE FROM frontier.measurements WHERE id < (SELECT COALESCE(MAX(id), 0) - 20000 FROM frontier.measurements)`);
  return r.rowCount ?? 0;
}

function percentile(valeurs: number[], p: number): number {
  const t = [...valeurs].sort((a, b) => a - b);
  return t[Math.min(t.length - 1, Math.max(0, Math.ceil(p * t.length) - 1))]!;
}

export interface StatsLatence {
  n: number;
  p50: number;
  p95: number;
  max: number;
  dernierLe: string;
}
export async function latenceRecente(code: string | null, limite = 200, base: BaseFrontier = dbFrontier()): Promise<StatsLatence | null> {
  const rows = await base
    .select({ v: measurements.value, at: measurements.at })
    .from(measurements)
    .where(and(eq(measurements.metric, "latency_ms"), eq(measurements.subjectKind, "engine"), ...(code ? [eq(measurements.subjectCode, code)] : [])))
    .orderBy(desc(measurements.id))
    .limit(limite);
  if (rows.length === 0) return null;
  const v = rows.map((r) => r.v);
  return { n: v.length, p50: percentile(v, 0.5), p95: percentile(v, 0.95), max: Math.max(...v), dernierLe: rows[0]!.at.toISOString() };
}

export interface Jauge {
  cle: "charge" | "latence" | "debit" | "memoire" | "erreurs" | "temperature";
  libelle: string;
  valeur: number | null;
  unite: string;
  niveau: NiveauJauge;
  /** D'où vient la valeur ; null si elle n'est pas mesurée. */
  source: string | null;
  mesureLe: string | null;
  note: string;
}

const PERIME_MS = 15 * 60 * 1000;
const recent = (d: Date | null | undefined) => (d ? Date.now() - d.getTime() < PERIME_MS : false);

/** Les six aiguilles de l'accueil. Une aiguille sans mesure est « non mesurée » (valeur null) ; le vert exige une vérification réussie. */
export async function lireJauges(base: BaseFrontier = dbFrontier()): Promise<Jauge[]> {
  const dernier = async (metrique: MetriqueMesure, sujet: string) => {
    const [r] = await base.select().from(measurements).where(and(eq(measurements.metric, metrique), eq(measurements.subjectCode, sujet))).orderBy(desc(measurements.id)).limit(1);
    return r ?? null;
  };
  const charge = await dernier("cpu_load", "center");
  const memoire = await dernier("memory_mb", "center");
  const lat = await latenceRecente(null, 100, base);
  const [livres] = await base.select({ n: count() }).from(exchanges).where(and(eq(exchanges.state, "delivered"), gt(exchanges.finishedAt, sql`now() - interval '5 minutes'`)));
  const [dernierLivre] = await base.select({ at: exchanges.finishedAt }).from(exchanges).where(eq(exchanges.state, "delivered")).orderBy(desc(exchanges.id)).limit(1);
  const [cmdKo] = await base.select({ n: count() }).from(commands).where(and(inArray(commands.status, ["failed", "partial"]), gt(commands.createdAt, sql`now() - interval '24 hours'`)));
  const [echecs] = await base.select({ n: count() }).from(exchanges).where(and(eq(exchanges.state, "failed"), gt(exchanges.createdAt, sql`now() - interval '24 hours'`)));
  const [inc] = await base.select({ n: count() }).from(incidents).where(and(eq(incidents.severity, "critical"), inArray(incidents.status, ["open", "diagnosed", "repairing"])));
  const [derniereCmd] = await base.select({ status: commands.status }).from(commands).where(inArray(commands.status, ["confirmed", "failed", "partial"])).orderBy(desc(commands.id)).limit(1);
  const erreurs = Number(cmdKo?.n ?? 0) + Number(echecs?.n ?? 0) + Number(inc?.n ?? 0);
  const livresN = Number(livres?.n ?? 0);
  const cpus = Math.max(1, os.cpus().length);
  return [
    { cle: "charge", libelle: "Charge", valeur: charge ? charge.value : null, unite: "charge/cœur", niveau: niveauJauge(charge ? charge.value : null, charge ? recent(charge.at) : null, 1), source: charge ? "os.loadavg()" : null, mesureLe: charge ? charge.at.toISOString() : null, note: charge ? `${cpus} cœur(s)` : "non mesurée" },
    { cle: "latence", libelle: "Latence des moteurs", valeur: lat ? lat.p95 : null, unite: "ms (p95)", niveau: niveauJauge(lat ? lat.p95 : null, lat ? recent(new Date(lat.dernierLe)) : null, 500), source: lat ? "messages du bus interne" : null, mesureLe: lat?.dernierLe ?? null, note: lat ? `médiane ${lat.p50} ms sur ${lat.n} messages` : "non mesurée" },
    { cle: "debit", libelle: "Débit des échanges", valeur: dernierLivre ? livresN / 5 : null, unite: "échanges/min", niveau: niveauJauge(dernierLivre ? livresN / 5 : null, dernierLivre ? true : null), source: dernierLivre ? "échanges livrés (5 dernières minutes)" : null, mesureLe: dernierLivre?.at?.toISOString() ?? null, note: dernierLivre ? "mesuré sur les échanges livrés" : "non mesuré : aucun échange livré" },
    { cle: "memoire", libelle: "Mémoire du centre", valeur: memoire ? memoire.value : null, unite: "Mo", niveau: niveauJauge(memoire ? memoire.value : null, memoire ? recent(memoire.at) : null), source: memoire ? "process.memoryUsage().rss" : null, mesureLe: memoire ? memoire.at.toISOString() : null, note: memoire ? "mémoire résidente du processus" : "non mesurée" },
    { cle: "erreurs", libelle: "Erreurs (24 h)", valeur: erreurs, unite: "erreurs", niveau: erreurs > 0 ? "alerte" : derniereCmd && derniereCmd.status !== "confirmed" ? "alerte" : "ok", source: "commandes en échec + échanges échoués + incidents critiques ouverts", mesureLe: new Date().toISOString(), note: erreurs > 0 ? "à traiter dans l'atelier" : "aucune erreur comptée" },
    { cle: "temperature", libelle: "Température", valeur: null, unite: "°C", niveau: "inconnu", source: null, mesureLe: null, note: "non mesurée : aucune source de mesure de température" },
  ];
}

/**
 * Banc d'essai : mesure le débit d'un moteur de sonde seul, puis de deux sondes en parallèle, et enregistre le FACTEUR de capacité obtenu.
 * Deux moteurs logiciels dans un même processus ne doublent pas la capacité : le facteur mesuré le montrera, et c'est lui qui fait foi.
 */
export async function mesurerCapacites(sonder: () => Promise<void>, codes: readonly string[], essais = 60, base: BaseFrontier = dbFrontier()): Promise<{ seul: number; parallele: number; facteur: number }> {
  const chrono = async (n: number, largeur: number) => {
    const t0 = performance.now();
    let restant = n;
    await Promise.all(
      Array.from({ length: largeur }, async () => {
        while (restant > 0) {
          restant -= 1;
          await sonder();
        }
      }),
    );
    return (n / Math.max(1, performance.now() - t0)) * 60_000;
  };
  const seul = await chrono(essais, 1);
  const parallele = await chrono(essais, 2);
  const facteur = Math.round((parallele / seul) * 100) / 100;
  const methode = `${essais} sondes en séquence, puis ${essais} avec deux sondes en parallèle, même processus`;
  for (const code of codes) {
    for (const [metrique, valeur, unite] of [["throughput_per_min", seul, "sondes/min"], ["capacity_factor", facteur, "×"]] as const) {
      await base
        .insert(engineCapabilities)
        .values({ engineCode: code, metric: metrique, declaredValue: null, measuredValue: valeur, unit: unite, method: methode, measuredAt: new Date() })
        .onConflictDoUpdate({ target: [engineCapabilities.engineCode, engineCapabilities.metric], set: { measuredValue: valeur, unit: unite, method: methode, measuredAt: new Date() } });
    }
  }
  await enregistrerMesure({ kind: "transport", code: "center:transport" }, "throughput_per_min", seul, "sondes/min", "banc d'essai", base);
  return { seul: Math.round(seul), parallele: Math.round(parallele), facteur };
}

export async function lireCapacites(code: string, base: BaseFrontier = dbFrontier()) {
  return base.select().from(engineCapabilities).where(eq(engineCapabilities.engineCode, code));
}
