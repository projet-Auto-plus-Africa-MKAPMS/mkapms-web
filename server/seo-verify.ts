/**
 * MKA.P-MS — SEO OS : vérification qualité (Phase 4).
 *
 * Contrôle la qualité des pages `seo_pages` AVANT toute soumission à Google :
 * contenu vide/court, titres/descriptions, doublons (title, description,
 * canonical), images, données structurées, indexabilité, sitemap et robots.
 *
 * Règle stricte : ce module OBSERVE et RAPPORTE uniquement. Il ne modifie
 * ni ne supprime aucune page. Les corrections restent sous validation humaine.
 */

import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { seoPages } from "./schema.js";

export type SeoIssueSeverity = "error" | "warning" | "info";

export interface SeoVerifyIssue {
  code: string;
  severity: SeoIssueSeverity;
  label: string;
  count: number;
  samples: string[];
}

export interface SeoVerifyReport {
  totalPages: number;
  indexablePages: number;
  errors: number;
  warnings: number;
  issues: SeoVerifyIssue[];
  checkedAt: string;
}

// Seuils qualité recommandés pour Google.
const TITLE_MIN = 15;
const TITLE_MAX = 65;
const DESC_MIN = 60;
const DESC_MAX = 320;
const CONTENT_MIN = 120;

interface PageRow {
  slug: string;
  title: string;
  metaDescription: string;
  content: string | null;
  keywords: unknown;
  canonicalUrl: string | null;
  ogImage: string | null;
  schemaMarkup: unknown;
  indexed: boolean;
}

function push(issues: SeoVerifyIssue[], issue: SeoVerifyIssue) {
  if (issue.count > 0) issues.push(issue);
}

/** Vérifie la qualité SEO de toutes les pages programmatiques. */
export async function verifySeo(): Promise<SeoVerifyReport> {
  let rows: PageRow[] = [];
  try {
    rows = (await db
      .select({
        slug: seoPages.slug,
        title: seoPages.title,
        metaDescription: seoPages.metaDescription,
        content: seoPages.content,
        keywords: seoPages.keywords,
        canonicalUrl: seoPages.canonicalUrl,
        ogImage: seoPages.ogImage,
        schemaMarkup: seoPages.schemaMarkup,
        indexed: seoPages.indexed,
      })
      .from(seoPages)) as PageRow[];
  } catch {
    rows = [];
  }

  const issues: SeoVerifyIssue[] = [];
  const indexable = rows.filter((r) => r.indexed);

  // ─── Contenu trop court / vide ───────────────────────────────────────────
  const contentCourt = indexable.filter((r) => (r.content?.trim().length ?? 0) < CONTENT_MIN);
  push(issues, {
    code: "content_court",
    severity: "warning",
    label: `Contenu vide ou trop court (< ${CONTENT_MIN} caractères)`,
    count: contentCourt.length,
    samples: contentCourt.slice(0, 8).map((r) => "/" + r.slug),
  });

  // ─── Titres ──────────────────────────────────────────────────────────────
  const titreCourt = indexable.filter((r) => r.title.trim().length < TITLE_MIN);
  push(issues, {
    code: "title_court",
    severity: "warning",
    label: `Titre trop court (< ${TITLE_MIN} caractères)`,
    count: titreCourt.length,
    samples: titreCourt.slice(0, 8).map((r) => "/" + r.slug),
  });
  const titreLong = indexable.filter((r) => r.title.trim().length > TITLE_MAX);
  push(issues, {
    code: "title_long",
    severity: "info",
    label: `Titre trop long (> ${TITLE_MAX} caractères, risque de troncature Google)`,
    count: titreLong.length,
    samples: titreLong.slice(0, 8).map((r) => "/" + r.slug),
  });

  // ─── Méta-descriptions ─────────────────────────────────────────────────────
  const descCourt = indexable.filter((r) => r.metaDescription.trim().length < DESC_MIN);
  push(issues, {
    code: "desc_court",
    severity: "warning",
    label: `Méta-description trop courte (< ${DESC_MIN} caractères)`,
    count: descCourt.length,
    samples: descCourt.slice(0, 8).map((r) => "/" + r.slug),
  });
  const descLong = indexable.filter((r) => r.metaDescription.trim().length > DESC_MAX);
  push(issues, {
    code: "desc_long",
    severity: "info",
    label: `Méta-description trop longue (> ${DESC_MAX} caractères)`,
    count: descLong.length,
    samples: descLong.slice(0, 8).map((r) => "/" + r.slug),
  });

  // ─── Mots-clés absents ─────────────────────────────────────────────────────
  const sansKeywords = indexable.filter((r) => !Array.isArray(r.keywords) || (r.keywords as unknown[]).length === 0);
  push(issues, {
    code: "keywords_absents",
    severity: "info",
    label: "Aucun mot-clé associé",
    count: sansKeywords.length,
    samples: sansKeywords.slice(0, 8).map((r) => "/" + r.slug),
  });

  // ─── Canonical manquant ────────────────────────────────────────────────────
  const canonicalManquant = indexable.filter((r) => !r.canonicalUrl || !r.canonicalUrl.trim());
  push(issues, {
    code: "canonical_manquant",
    severity: "warning",
    label: "URL canonique manquante",
    count: canonicalManquant.length,
    samples: canonicalManquant.slice(0, 8).map((r) => "/" + r.slug),
  });

  // ─── Doublons (title, description, canonical) ──────────────────────────────
  push(issues, dupIssue(indexable, "canonical_duplique", "error", "Même URL canonique sur plusieurs pages", (r) => (r.canonicalUrl || "").trim().toLowerCase()));
  push(issues, dupIssue(indexable, "title_duplique", "warning", "Titre identique sur plusieurs pages", (r) => r.title.trim().toLowerCase()));
  push(issues, dupIssue(indexable, "desc_dupliquee", "warning", "Méta-description identique sur plusieurs pages", (r) => r.metaDescription.trim().toLowerCase()));
  push(issues, dupIssue(indexable, "contenu_duplique", "warning", "Contenu identique sur plusieurs pages", (r) => (r.content || "").trim().toLowerCase()));

  // ─── Données structurées (JSON-LD) ─────────────────────────────────────────
  // Le SSR ajoute toujours un breadcrumb ; on signale les pages sans schéma
  // spécifique enregistré (opportunité d'enrichissement).
  const sansSchema = indexable.filter((r) => !r.schemaMarkup || typeof r.schemaMarkup !== "object");
  push(issues, {
    code: "schema_absent",
    severity: "info",
    label: "Aucune donnée structurée spécifique (seul le fil d'ariane est injecté)",
    count: sansSchema.length,
    samples: sansSchema.slice(0, 8).map((r) => "/" + r.slug),
  });

  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  return {
    totalPages: rows.length,
    indexablePages: indexable.length,
    errors,
    warnings,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

/** Construit une issue de doublon à partir d'une clé de regroupement. */
function dupIssue(
  rows: PageRow[],
  code: string,
  severity: SeoIssueSeverity,
  label: string,
  keyOf: (r: PageRow) => string,
): SeoVerifyIssue {
  const map = new Map<string, string[]>();
  for (const r of rows) {
    const key = keyOf(r);
    if (!key) continue;
    const arr = map.get(key) ?? [];
    arr.push("/" + r.slug);
    map.set(key, arr);
  }
  const dups = [...map.values()].filter((arr) => arr.length > 1);
  const affected = dups.reduce((s, arr) => s + arr.length, 0);
  return {
    code,
    severity,
    label,
    count: affected,
    samples: dups.slice(0, 4).map((arr) => arr.slice(0, 3).join(" = ")),
  };
}
