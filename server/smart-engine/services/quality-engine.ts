/**
 * Partie 12 — Moteur Qualité (Quality Engine)
 *
 * Le Système Intelligent MKA.P-MS évalue en continu la QUALITÉ RÉELLE de la
 * plateforme et produit un score (0→100) par domaine + un score global.
 *
 * 100% lecture seule : on agrège des données déjà présentes (annonces, photos,
 * prix, comptes suspects, doublons, santé technique, avis). Aucune donnée
 * existante n'est modifiée. Les résultats sont enregistrés dans la table isolée
 * `smart_quality_audits`. Le système ne prend AUCUNE décision : il mesure,
 * explique et recommande ; le PDG décide des suites.
 *
 * Module additif et isolé — ne remplace ni ne modifie aucune fonction existante.
 */
import { db } from "../../db.js";
import { sql } from "drizzle-orm";
import { desc, eq } from "drizzle-orm";
import { smartQualityAudits } from "../schema.js";
import { getPlatformHealth } from "./platform-health.js";
import { logActivity } from "./activity-log.js";

export type QualityCategory =
  | "annonces"
  | "photos"
  | "descriptions"
  | "prix"
  | "confiance"
  | "doublons"
  | "sante"
  | "avis";

export type QualityStatus = "bon" | "moyen" | "faible";

export interface QualityResult {
  category: QualityCategory;
  score: number; // 0→100
  status: QualityStatus;
  headline: string;
  recommendation: string | null;
  details: Record<string, unknown>;
  sampleSize: number;
}

const CATEGORY_LABELS: Record<QualityCategory, string> = {
  annonces: "Complétude des annonces",
  photos: "Richesse photo",
  descriptions: "Qualité des descriptions",
  prix: "Renseignement du prix",
  confiance: "Confiance (comptes suspects)",
  doublons: "Doublons d'annonces",
  sante: "Santé technique",
  avis: "Satisfaction (avis)",
};

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function statusFromScore(score: number): QualityStatus {
  if (score >= 80) return "bon";
  if (score >= 50) return "moyen";
  return "faible";
}

function pct(part: number, total: number): number {
  if (total <= 0) return 100; // rien à évaluer = pas de problème
  return clamp((part / total) * 100);
}

async function count(query: ReturnType<typeof sql>): Promise<number> {
  const res: any = await db.execute(query);
  const rows = res.rows ?? res;
  const val = rows?.[0]?.n ?? rows?.[0]?.count ?? 0;
  return Number(val) || 0;
}

/** Analyse la qualité des annonces publiées (complétude, photos, description, prix). */
async function auditAnnonces(): Promise<QualityResult[]> {
  const results: QualityResult[] = [];
  const total = await count(sql`SELECT COUNT(*)::int AS n FROM annonces WHERE status = 'publiee'`);

  if (total === 0) {
    return [
      {
        category: "annonces",
        score: 100,
        status: "bon",
        headline: "Aucune annonce publiée à évaluer.",
        recommendation: null,
        details: { total: 0 },
        sampleSize: 0,
      },
    ];
  }

  // Photos : annonces avec au moins 3 photos.
  const with3Photos = await count(sql`
    SELECT COUNT(*)::int AS n FROM annonces a
    WHERE a.status = 'publiee'
      AND (SELECT COUNT(*) FROM annonce_photos p WHERE p.annonce_id = a.id) >= 3
  `);
  const photosScore = pct(with3Photos, total);
  results.push({
    category: "photos",
    score: photosScore,
    status: statusFromScore(photosScore),
    headline: `${photosScore}% des annonces ont au moins 3 photos.`,
    recommendation:
      photosScore < 80
        ? "Inciter les vendeurs à ajouter plus de photos (extérieur, intérieur, coffre)."
        : null,
    details: { total, with3Photos },
    sampleSize: total,
  });

  // Descriptions : description d'au moins 100 caractères.
  const withDesc = await count(sql`
    SELECT COUNT(*)::int AS n FROM annonces
    WHERE status = 'publiee' AND char_length(COALESCE(description, '')) >= 100
  `);
  const descScore = pct(withDesc, total);
  results.push({
    category: "descriptions",
    score: descScore,
    status: statusFromScore(descScore),
    headline: `${descScore}% des annonces ont une description détaillée (≥ 100 caractères).`,
    recommendation:
      descScore < 80 ? "Encourager des descriptions plus complètes lors du dépôt." : null,
    details: { total, withDesc },
    sampleSize: total,
  });

  // Prix : prix renseigné (> 0).
  const withPrix = await count(sql`
    SELECT COUNT(*)::int AS n FROM annonces
    WHERE status = 'publiee' AND COALESCE(prix, 0) > 0
  `);
  const prixScore = pct(withPrix, total);
  results.push({
    category: "prix",
    score: prixScore,
    status: statusFromScore(prixScore),
    headline: `${prixScore}% des annonces ont un prix renseigné.`,
    recommendation:
      prixScore < 90 ? "Vérifier les annonces sans prix (prix sur demande à cadrer)." : null,
    details: { total, withPrix },
    sampleSize: total,
  });

  // Complétude globale = photos ≥ 3 ET description ≥ 100 ET prix > 0.
  const complete = await count(sql`
    SELECT COUNT(*)::int AS n FROM annonces a
    WHERE a.status = 'publiee'
      AND COALESCE(a.prix, 0) > 0
      AND char_length(COALESCE(a.description, '')) >= 100
      AND (SELECT COUNT(*) FROM annonce_photos p WHERE p.annonce_id = a.id) >= 3
  `);
  const completeScore = pct(complete, total);
  results.push({
    category: "annonces",
    score: completeScore,
    status: statusFromScore(completeScore),
    headline: `${completeScore}% des annonces sont complètes (photos + description + prix).`,
    recommendation:
      completeScore < 70
        ? "Renforcer les contrôles de complétude à la publication."
        : null,
    details: { total, complete },
    sampleSize: total,
  });

  return results;
}

/** Confiance : comptes suspects non résolus détectés par le Smart Engine. */
async function auditConfiance(): Promise<QualityResult> {
  const unresolved = await count(
    sql`SELECT COUNT(*)::int AS n FROM smart_suspect_accounts WHERE resolved = false`,
  );
  const score = clamp(100 - unresolved * 5);
  return {
    category: "confiance",
    score,
    status: statusFromScore(score),
    headline:
      unresolved === 0
        ? "Aucun compte suspect en attente."
        : `${unresolved} compte(s) suspect(s) non résolu(s).`,
    recommendation: unresolved > 0 ? "Examiner les comptes suspects dans le centre de contrôle." : null,
    details: { unresolved },
    sampleSize: unresolved,
  };
}

/** Doublons d'annonces non résolus. */
async function auditDoublons(): Promise<QualityResult> {
  const unresolved = await count(
    sql`SELECT COUNT(*)::int AS n FROM smart_duplicates WHERE resolved = false`,
  );
  const score = clamp(100 - unresolved * 5);
  return {
    category: "doublons",
    score,
    status: statusFromScore(score),
    headline:
      unresolved === 0
        ? "Aucun doublon d'annonce en attente."
        : `${unresolved} doublon(s) d'annonce non résolu(s).`,
    recommendation: unresolved > 0 ? "Traiter les doublons signalés." : null,
    details: { unresolved },
    sampleSize: unresolved,
  };
}

/** Santé technique : dérivée du tableau de santé plateforme (Partie 9). */
async function auditSante(): Promise<QualityResult> {
  const health = await getPlatformHealth();
  const levelScore: Record<string, number> = { green: 100, yellow: 60, red: 20 };
  const cats = health.categories ?? [];
  const avg =
    cats.length > 0
      ? cats.reduce((s, c) => s + (levelScore[c.level] ?? 60), 0) / cats.length
      : 100;
  const score = clamp(avg);
  const reds = cats.filter((c) => c.level === "red").length;
  return {
    category: "sante",
    score,
    status: statusFromScore(score),
    headline: `Santé globale : ${health.overall.toUpperCase()} (${cats.length} domaines analysés).`,
    recommendation: reds > 0 ? `${reds} domaine(s) en rouge à corriger en priorité.` : null,
    details: { overall: health.overall, categories: cats.length, reds },
    sampleSize: cats.length,
  };
}

/** Satisfaction : moyenne des avis visibles. */
async function auditAvis(): Promise<QualityResult> {
  const res: any = await db.execute(sql`
    SELECT COUNT(*)::int AS n, COALESCE(AVG(NULLIF(rating, 0)), 0) AS avg
    FROM reviews
    WHERE COALESCE(hidden, false) = false
  `);
  const rows = res.rows ?? res;
  const n = Number(rows?.[0]?.n ?? 0) || 0;
  const avg = Number(rows?.[0]?.avg ?? 0) || 0;
  const score = n === 0 ? 100 : clamp((avg / 5) * 100);
  return {
    category: "avis",
    score,
    status: statusFromScore(score),
    headline:
      n === 0
        ? "Aucun avis à évaluer pour le moment."
        : `Note moyenne ${avg.toFixed(1)}/5 sur ${n} avis.`,
    recommendation: n > 0 && score < 70 ? "Analyser les avis négatifs récents." : null,
    details: { count: n, average: Number(avg.toFixed(2)) },
    sampleSize: n,
  };
}

/**
 * Lance un audit qualité complet : calcule chaque domaine (avec garde-fous),
 * enregistre les résultats et journalise l'action (PDG). Retourne le rapport.
 */
export async function runQualityAudit(actorId?: number) {
  const results: QualityResult[] = [];

  const safe = async (fn: () => Promise<QualityResult | QualityResult[]>) => {
    try {
      const r = await fn();
      if (Array.isArray(r)) results.push(...r);
      else results.push(r);
    } catch {
      // Un domaine en échec ne bloque pas l'audit global (isolé, additif).
    }
  };

  await safe(auditAnnonces);
  await safe(auditConfiance);
  await safe(auditDoublons);
  await safe(auditSante);
  await safe(auditAvis);

  // Persiste chaque résultat.
  for (const r of results) {
    try {
      await db.insert(smartQualityAudits).values({
        category: r.category,
        score: r.score,
        status: r.status,
        headline: r.headline,
        recommendation: r.recommendation,
        details: r.details,
        sampleSize: r.sampleSize,
      });
    } catch {
      /* isolé : une insertion en échec ne bloque pas le reste */
    }
  }

  const globalScore =
    results.length > 0
      ? clamp(results.reduce((s, r) => s + r.score, 0) / results.length)
      : 100;

  try {
    await logActivity({
      action: "quality_audit",
      userId: actorId,
      result: `Score global ${globalScore}/100 (${results.length} domaines analysés).`,
    });
  } catch {
    /* la journalisation ne doit jamais bloquer l'audit */
  }

  return {
    generatedAt: new Date().toISOString(),
    globalScore,
    globalStatus: statusFromScore(globalScore),
    results,
  };
}

/** Dernier score connu par domaine (sans relancer d'audit). */
export async function getQualityOverview() {
  const rows = await db
    .select()
    .from(smartQualityAudits)
    .orderBy(desc(smartQualityAudits.createdAt))
    .limit(200);

  const latest = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!latest.has(row.category)) latest.set(row.category, row);
  }

  const categories = Array.from(latest.values()).map((r) => ({
    category: r.category as QualityCategory,
    label: CATEGORY_LABELS[r.category as QualityCategory] ?? r.category,
    score: r.score,
    status: r.status,
    headline: r.headline,
    recommendation: r.recommendation,
    createdAt: r.createdAt,
  }));

  const globalScore =
    categories.length > 0
      ? clamp(categories.reduce((s, c) => s + c.score, 0) / categories.length)
      : 0;

  return {
    globalScore,
    globalStatus: statusFromScore(globalScore),
    categories,
    hasData: categories.length > 0,
  };
}

/** Historique des audits (pour suivre l'évolution). */
export async function listQualityAudits(category?: QualityCategory, limit = 100) {
  const base = db.select().from(smartQualityAudits);
  const rows = category
    ? await base.where(eq(smartQualityAudits.category, category)).orderBy(desc(smartQualityAudits.createdAt)).limit(limit)
    : await base.orderBy(desc(smartQualityAudits.createdAt)).limit(limit);
  return rows;
}
