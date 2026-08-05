/**
 * Rapport quotidien consolidé — Système Intelligent MKA.P-MS (Priorité 8)
 *
 * Agrège en un seul document l'état de la plateforme : anomalies détectées
 * (boutons/liens cassés, alertes ouvertes, catégories qualité faibles,
 * recherches sans résultat) et propositions d'amélioration.
 *
 * Lecture seule : n'exécute aucune action sensible, se contente d'observer
 * l'état déjà collecté par les autres moteurs.
 */
import { getHealthStatus, getBrokenElements } from "./health-monitor.js";
import { getQualityOverview } from "./quality-engine.js";
import { alertLevelStats } from "./alert-engine.js";
import { getSearchesWithoutResults } from "./search-analytics.js";
import { getPlatformHealth } from "./platform-health.js";

type Severity = "critical" | "important" | "warning" | "info";

export interface DailyReportAnomaly {
  domain: string;
  severity: Severity;
  title: string;
  detail: string;
}

export interface DailyReportSuggestion {
  domain: string;
  action: string;
}

const QUALITY_WEAK_THRESHOLD = 60;

export async function buildDailyReport() {
  const [health, brokenElements, quality, alerts, noResultSearches, platform] =
    await Promise.all([
      getHealthStatus(),
      getBrokenElements(20),
      getQualityOverview(),
      alertLevelStats(),
      getSearchesWithoutResults(20),
      getPlatformHealth(),
    ]);

  const anomalies: DailyReportAnomaly[] = [];
  const suggestions: DailyReportSuggestion[] = [];

  // 1. Boutons / liens / pages cassés
  for (const el of brokenElements) {
    anomalies.push({
      domain: "Interface",
      severity: el.status === "missing" ? "important" : "critical",
      title: `${el.elementType} « ${el.element} » ${el.status === "missing" ? "manquant" : "cassé"}`,
      detail: `${el.page}${el.errorDetails ? ` — ${el.errorDetails}` : ""}`,
    });
    if (el.suggestedFix) {
      suggestions.push({ domain: "Interface", action: el.suggestedFix });
    }
  }
  if (brokenElements.length > 0) {
    suggestions.push({
      domain: "Interface",
      action: `Corriger ${brokenElements.length} élément(s) cassé(s)/manquant(s) puis relancer une vérification.`,
    });
  }

  // 2. Alertes ouvertes par niveau
  if (alerts.critical > 0) {
    anomalies.push({
      domain: "Alertes",
      severity: "critical",
      title: `${alerts.critical} alerte(s) critique(s) ouverte(s)`,
      detail: "Nécessite une intervention immédiate.",
    });
  }
  if (alerts.important > 0) {
    anomalies.push({
      domain: "Alertes",
      severity: "important",
      title: `${alerts.important} alerte(s) importante(s) ouverte(s)`,
      detail: "À traiter aujourd'hui.",
    });
  }

  // 3. Catégories qualité faibles
  for (const cat of quality.categories) {
    if (cat.score < QUALITY_WEAK_THRESHOLD) {
      anomalies.push({
        domain: "Qualité",
        severity: cat.score < 40 ? "important" : "warning",
        title: `${cat.label} : score ${cat.score}/100`,
        detail: cat.headline,
      });
      if (cat.recommendation) {
        suggestions.push({ domain: "Qualité", action: cat.recommendation });
      }
    }
  }

  // 4. Santé plateforme (catégories en rouge / jaune)
  for (const cat of platform.categories) {
    if (cat.level === "red" || cat.level === "yellow") {
      anomalies.push({
        domain: "Santé",
        severity: cat.level === "red" ? "critical" : "warning",
        title: `${cat.label} : ${cat.headline}`,
        detail: cat.detail,
      });
    }
  }

  // 5. Recherches sans résultat → manque de stock / mots-clés
  if (noResultSearches.length > 0) {
    const samples = noResultSearches
      .map((s) => s.query)
      .filter((q): q is string => Boolean(q))
      .slice(0, 8);
    anomalies.push({
      domain: "Recherche",
      severity: "warning",
      title: `${noResultSearches.length} recherche(s) sans résultat`,
      detail: samples.length > 0 ? `Ex. : ${samples.join(", ")}` : "Recherches récentes sans correspondance.",
    });
    suggestions.push({
      domain: "Recherche",
      action: "Enrichir le moteur de mots-clés et le stock d'annonces pour ces recherches par pays.",
    });
  }

  anomalies.sort((a, b) => severityRank(b.severity) - severityRank(a.severity));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      anomalies: anomalies.length,
      criticalAnomalies: anomalies.filter((a) => a.severity === "critical").length,
      suggestions: suggestions.length,
      brokenElements: brokenElements.length,
      openAlerts: alerts.open,
      healthOk: health.ok,
      healthBroken: health.broken,
      qualityScore: quality.globalScore,
    },
    anomalies,
    suggestions,
  };
}

function severityRank(s: Severity): number {
  switch (s) {
    case "critical":
      return 4;
    case "important":
      return 3;
    case "warning":
      return 2;
    default:
      return 1;
  }
}
