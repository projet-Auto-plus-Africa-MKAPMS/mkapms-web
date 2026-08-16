/**
 * MKA.P-MS Indexation Monitor — diagnostic et suivi (points 92-93-98-99-100-101).
 *
 * Règle fondatrice : soumettre une URL au sitemap ou à IndexNow ne prouve
 * JAMAIS que Google l'a indexée. Ce module sépare donc trois choses :
 *   • ce que la plateforme fait      → publier, déclarer, autoriser le crawl ;
 *   • ce que le serveur répond       → statut, canonical, contenu, schéma ;
 *   • ce que Google fait réellement  → connu seulement via Search Console.
 *
 * Sans accès Search Console, le statut d'index reste « EN ATTENTE » ou
 * « ACTION REQUISE » — jamais « INDEXÉ ».
 */
import { desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { env } from "../env.js";
import { raiseAlert } from "../smart-engine/services/alert-engine.js";
import { indexationAudits, indexationUrlChecks, indexationWatch } from "./schema.js";
import {
  buildUrlSample,
  publicPageCounts,
  recentAnnonceUrls,
  type Famille,
  type Pipeline,
  type UrlCandidate,
} from "./inventory.js";
import { crawlAutorise, fetchRobots, fetchSitemap, observePage, type RobotsRules } from "./probe.js";

/** Statuts exigés au point 98 — aucun autre n'est utilisé. */
export const STATUTS = [
  "indexe",
  "non_indexe",
  "bloque",
  "erreur",
  "decouvert_non_indexe",
  "action_requise",
] as const;

export type Statut = (typeof STATUTS)[number];

export const STATUT_LABELS: Record<Statut, string> = {
  indexe: "INDEXÉ",
  non_indexe: "NON INDEXÉ",
  bloque: "BLOQUÉ",
  erreur: "ERREUR",
  decouvert_non_indexe: "DÉCOUVERT MAIS PAS ENCORE INDEXÉ",
  action_requise: "ACTION REQUISE",
};

/** Causes nommées au point 100. */
export const CAUSES = [
  "canonical",
  "robots",
  "sitemap",
  "contenu_duplique",
  "redirection",
  "page_absente",
  "rendu_javascript",
  "erreur_serveur",
] as const;

export type Cause = (typeof CAUSES)[number];

export const CAUSE_LABELS: Record<Cause, string> = {
  canonical: "URL canonique qui désigne une autre page",
  robots: "crawl interdit par robots.txt ou balise noindex",
  sitemap: "URL absente du sitemap",
  contenu_duplique: "contenu ou titre identique à une autre page",
  redirection: "redirection vers une autre URL",
  page_absente: "page absente (404)",
  rendu_javascript: "contenu produit seulement par le navigateur",
  erreur_serveur: "erreur du serveur",
};

export interface SearchConsoleState {
  configure: boolean;
  detail: string;
}

/**
 * État réel du connecteur Search Console. Tant qu'aucun accès n'est fourni,
 * la plateforme ne peut PAS savoir ce que Google a indexé, et le dit.
 */
export function searchConsoleState(): SearchConsoleState {
  const brut = process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS ?? process.env.GSC_SERVICE_ACCOUNT_JSON;
  if (!brut) {
    return {
      configure: false,
      detail:
        "Aucun accès Search Console fourni : le statut d'index Google ne peut pas être lu. Les pages conformes restent « EN ATTENTE » — la plateforme ne déclare jamais « INDEXÉ » sans preuve.",
    };
  }
  return {
    configure: true,
    detail: "Accès Search Console fourni : le statut d'index peut être relevé auprès de Google.",
  };
}

function baseUrl(): string {
  return (env.PUBLIC_URL || "https://www.mkapms.fr").replace(/\/+$/, "");
}

export interface UrlDiagnostic {
  url: string;
  famille: Famille;
  pipeline: Pipeline;
  httpStatus: number | null;
  publique: boolean;
  indexable: boolean;
  crawlAutorise: boolean;
  dansSitemap: boolean;
  canonical: string | null;
  canonicalCoherent: boolean;
  title: string | null;
  description: string | null;
  contenuVisible: number;
  donneesStructurees: string[];
  langue: string | null;
  pays: string | null;
  statut: Statut;
  causeProbable: Cause | null;
  motif: string;
  manquant: string[];
}

/** Diagnostique une URL, champ par champ, puis la classe honnêtement. */
export async function diagnoseUrl(
  candidat: UrlCandidate,
  contexte: { base: string; robots: RobotsRules; sitemapUrls: Set<string>; gsc: SearchConsoleState },
): Promise<UrlDiagnostic> {
  const url = candidat.url.startsWith("http") ? candidat.url : `${contexte.base}${candidat.url}`;
  const path = new URL(url).pathname;
  const obs = await observePage(url);
  const autorise = crawlAutorise(path, contexte.robots);
  const dansSitemap =
    contexte.sitemapUrls.has(url) ||
    contexte.sitemapUrls.has(url.replace(/\/$/, "")) ||
    contexte.sitemapUrls.has(`${url}/`);

  const canonicalCoherent = !obs.canonical
    ? false
    : obs.canonical.replace(/\/$/, "") === url.replace(/\/$/, "");

  const manquant: string[] = [];
  if (!obs.title) manquant.push("titre absent");
  if (!obs.description) manquant.push("méta-description absente");
  if (!obs.canonical) manquant.push("URL canonique absente");
  if (!dansSitemap) manquant.push("URL absente du sitemap");
  if (obs.donneesStructurees.length === 0) manquant.push("aucune donnée structurée");
  if (!obs.langue) manquant.push("langue de la page non déclarée");
  if (obs.contenuVisible < 400) manquant.push("contenu visible très faible pour un robot");

  const publique = obs.httpStatus !== null && obs.httpStatus >= 200 && obs.httpStatus < 400;
  const indexable = publique && !obs.noindex && autorise;

  let statut: Statut;
  let cause: Cause | null = null;
  let motif: string;

  if (obs.erreur) {
    statut = "erreur";
    cause = "erreur_serveur";
    motif = `La page n'a pas pu être lue : ${obs.erreur}.`;
  } else if (obs.httpStatus === 404) {
    statut = "erreur";
    cause = "page_absente";
    motif = "Le serveur répond 404 : l'URL est publiée quelque part mais la page n'existe pas.";
  } else if (obs.httpStatus !== null && obs.httpStatus >= 500) {
    statut = "erreur";
    cause = "erreur_serveur";
    motif = `Le serveur répond ${obs.httpStatus} : Google abandonne le crawl sur ce type de réponse.`;
  } else if (!autorise) {
    statut = "bloque";
    cause = "robots";
    motif = "robots.txt interdit ce chemin : Google ne peut pas explorer la page.";
  } else if (obs.noindex) {
    statut = "bloque";
    cause = "robots";
    motif = `La page se déclare non indexable (robots : ${obs.robotsMeta}).`;
  } else if (obs.canonical && !canonicalCoherent) {
    statut = "non_indexe";
    cause = "canonical";
    motif = `L'URL canonique désigne une autre page (${obs.canonical}) : Google indexera l'autre, pas celle-ci.`;
  } else if (obs.redirigeVers) {
    statut = "non_indexe";
    cause = "redirection";
    motif = `L'URL redirige vers ${obs.redirigeVers} : c'est la destination qui peut être indexée.`;
  } else if (obs.renduJsRequis) {
    statut = "action_requise";
    cause = "rendu_javascript";
    motif =
      "La page arrive presque vide pour un robot : le contenu n'est produit que par le navigateur. Le rendu serveur doit couvrir cette URL.";
  } else if (!dansSitemap) {
    statut = "action_requise";
    cause = "sitemap";
    motif =
      "La page est accessible et indexable, mais elle n'est déclarée dans aucun sitemap : Google devra la découvrir seul.";
  } else if (!contexte.gsc.configure) {
    // Point clé : conforme ≠ indexé. Sans Search Console, on s'arrête ici.
    statut = "decouvert_non_indexe";
    motif =
      "Page conforme et déclarée. L'indexation reste EN ATTENTE : sans accès Search Console, personne ne peut affirmer que Google l'a indexée.";
  } else {
    statut = "decouvert_non_indexe";
    motif =
      "Page conforme et déclarée ; le statut d'index réel doit être relevé auprès de Search Console lors du prochain relevé.";
  }

  return {
    url,
    famille: candidat.famille,
    pipeline: candidat.pipeline,
    httpStatus: obs.httpStatus,
    publique,
    indexable,
    crawlAutorise: autorise,
    dansSitemap,
    canonical: obs.canonical,
    canonicalCoherent,
    title: obs.title,
    description: obs.description,
    contenuVisible: obs.contenuVisible,
    donneesStructurees: Array.from(new Set(obs.donneesStructurees)),
    langue: obs.langue,
    pays: candidat.pays ?? null,
    statut,
    causeProbable: cause,
    motif,
    manquant,
  };
}

export interface IndexationReport {
  auditId: number;
  base: string;
  checkedAt: string;
  robotsTrouve: boolean;
  sitemapTrouve: boolean;
  sitemapUrls: number;
  searchConsole: SearchConsoleState;
  total: number;
  parStatut: Record<Statut, number>;
  parFamille: Record<string, Record<string, number>>;
  famillesVides: { famille: string; motif: string }[];
  items: UrlDiagnostic[];
  pagesPubliques: Record<string, number>;
}

/**
 * Exécute l'audit d'indexation sur un échantillon réel et enregistre le
 * résultat. Chaque anomalie de visibilité crée une alerte du Système
 * Intelligent avec sa cause probable (point 100).
 */
export async function runIndexationAudit(options?: {
  trigger?: string;
  requestedBy?: number;
  parFamille?: number;
}): Promise<IndexationReport> {
  const base = baseUrl();
  const gsc = searchConsoleState();
  const [robots, sitemap, inventaire, pagesPubliques] = await Promise.all([
    fetchRobots(base),
    fetchSitemap(base),
    buildUrlSample({ parFamille: options?.parFamille ?? 3 }),
    publicPageCounts(),
  ]);

  const candidats = inventaire.flatMap((f) => f.candidats);
  const items: UrlDiagnostic[] = [];
  for (const candidat of candidats) {
    items.push(await diagnoseUrl(candidat, { base, robots, sitemapUrls: sitemap.urls, gsc }));
  }

  const parStatut = STATUTS.reduce(
    (acc, s) => ({ ...acc, [s]: items.filter((i) => i.statut === s).length }),
    {} as Record<Statut, number>,
  );

  const parFamille: Record<string, Record<string, number>> = {};
  for (const item of items) {
    parFamille[item.famille] ??= {};
    parFamille[item.famille][item.statut] = (parFamille[item.famille][item.statut] ?? 0) + 1;
  }

  const [audit] = await db
    .insert(indexationAudits)
    .values({
      trigger: options?.trigger ?? "manuel",
      requestedBy: options?.requestedBy ?? null,
      baseUrl: base,
      robotsFound: robots.found,
      sitemapFound: sitemap.found,
      sitemapUrls: sitemap.urls.size,
      total: items.length,
      parStatut,
      parFamille,
      searchConsole: { configure: gsc.configure, detail: gsc.detail },
      finishedAt: new Date(),
    })
    .returning();

  if (items.length > 0) {
    await db.insert(indexationUrlChecks).values(
      items.map((i) => ({
        auditId: audit.id,
        url: i.url.slice(0, 512),
        famille: i.famille,
        pipeline: i.pipeline,
        httpStatus: i.httpStatus,
        publique: i.publique,
        indexable: i.indexable,
        crawlAutorise: i.crawlAutorise,
        dansSitemap: i.dansSitemap,
        canonical: i.canonical?.slice(0, 512) ?? null,
        canonicalCoherent: i.canonicalCoherent,
        title: i.title?.slice(0, 320) ?? null,
        description: i.description ?? null,
        contenuVisible: i.contenuVisible,
        donneesStructurees: i.donneesStructurees,
        langue: i.langue?.slice(0, 16) ?? null,
        pays: i.pays?.slice(0, 8) ?? null,
        statut: i.statut,
        causeProbable: i.causeProbable,
        motif: i.motif,
        manquant: i.manquant,
      })),
    );
  }

  await syncWatch(items);
  await raiseVisibilityAlerts(items, { robots, sitemapTrouve: sitemap.found });

  return {
    auditId: audit.id,
    base,
    checkedAt: new Date().toISOString(),
    robotsTrouve: robots.found,
    sitemapTrouve: sitemap.found,
    sitemapUrls: sitemap.urls.size,
    searchConsole: gsc,
    total: items.length,
    parStatut,
    parFamille,
    famillesVides: inventaire
      .filter((f) => f.motifVide)
      .map((f) => ({ famille: f.famille, motif: f.motifVide as string })),
    items,
    pagesPubliques,
  };
}

/** Met à jour la surveillance continue d'une page publique (point 98). */
async function syncWatch(items: UrlDiagnostic[]): Promise<void> {
  for (const item of items) {
    const indexGoogle: string =
      item.statut === "bloque" ? "bloque" : item.statut === "erreur" ? "erreur" : "en_attente";
    try {
      await db
        .insert(indexationWatch)
        .values({
          url: item.url.slice(0, 512),
          famille: item.famille,
          pipeline: item.pipeline,
          pays: item.pays?.slice(0, 8) ?? null,
          langue: item.langue?.slice(0, 16) ?? null,
          validee: item.publique,
          seoPrepare: !!item.title && !!item.description,
          dansSitemap: item.dansSitemap,
          crawlAutorise: item.crawlAutorise,
          indexable: item.indexable,
          indexGoogle,
          dernierControle: new Date(),
          dernierMotif: item.motif,
        })
        .onConflictDoUpdate({
          target: indexationWatch.url,
          set: {
            validee: item.publique,
            seoPrepare: !!item.title && !!item.description,
            dansSitemap: item.dansSitemap,
            crawlAutorise: item.crawlAutorise,
            indexable: item.indexable,
            indexGoogle,
            dernierControle: new Date(),
            dernierMotif: item.motif,
          },
        });
    } catch {
      /* la surveillance ne doit jamais faire échouer l'audit */
    }
  }
}

/**
 * Anomalie de visibilité → alerte du Système Intelligent, avec la cause
 * probable nommée. Une page simplement « en attente d'indexation » n'est PAS
 * une anomalie : on n'inonde pas le PDG d'alertes inutiles.
 */
async function raiseVisibilityAlerts(
  items: UrlDiagnostic[],
  contexte: { robots: RobotsRules; sitemapTrouve: boolean },
): Promise<number> {
  let levees = 0;

  if (!contexte.sitemapTrouve) {
    const ok = await raiseAlert({
      category: "seo",
      title: "Sitemap introuvable",
      description:
        "Le sitemap n'a pas pu être lu sur le site public : Google ne dispose d'aucune déclaration d'URLs.",
      level: "critical",
      signature: "indexation:sitemap_absent",
      lastOccurredAt: new Date(),
    });
    if (ok) levees += 1;
  }

  const parCause = new Map<Cause, UrlDiagnostic[]>();
  for (const item of items) {
    if (!item.causeProbable) continue;
    if (item.statut === "decouvert_non_indexe") continue;
    const liste = parCause.get(item.causeProbable) ?? [];
    liste.push(item);
    parCause.set(item.causeProbable, liste);
  }

  for (const [cause, liste] of parCause) {
    const niveau =
      cause === "erreur_serveur" || cause === "page_absente"
        ? "critical"
        : cause === "robots" || cause === "canonical" || cause === "rendu_javascript"
          ? "important"
          : "warning";
    const ok = await raiseAlert({
      category: "seo",
      title: `Visibilité : ${CAUSE_LABELS[cause]} (${liste.length} page(s))`,
      description: `Exemple : ${liste[0].url} — ${liste[0].motif}`,
      level: niveau,
      signature: `indexation:cause:${cause}`,
      lastOccurredAt: new Date(),
    });
    if (ok) levees += 1;
  }

  return levees;
}

/** Dernier rapport enregistré, sans relancer les requêtes réseau. */
export async function latestIndexationAudit(): Promise<IndexationReport | null> {
  const [audit] = await db
    .select()
    .from(indexationAudits)
    .orderBy(desc(indexationAudits.id))
    .limit(1);
  if (!audit) return null;

  const rows = await db
    .select()
    .from(indexationUrlChecks)
    .where(eq(indexationUrlChecks.auditId, audit.id));

  return {
    auditId: audit.id,
    base: audit.baseUrl,
    checkedAt: (audit.finishedAt ?? audit.startedAt).toISOString(),
    robotsTrouve: audit.robotsFound,
    sitemapTrouve: audit.sitemapFound,
    sitemapUrls: audit.sitemapUrls,
    searchConsole: (audit.searchConsole ?? searchConsoleState()) as unknown as SearchConsoleState,
    total: audit.total,
    parStatut: (audit.parStatut ?? {}) as Record<Statut, number>,
    parFamille: (audit.parFamille ?? {}) as Record<string, Record<string, number>>,
    famillesVides: [],
    items: rows.map((r) => ({
      url: r.url,
      famille: r.famille as Famille,
      pipeline: r.pipeline as Pipeline,
      httpStatus: r.httpStatus,
      publique: r.publique,
      indexable: r.indexable,
      crawlAutorise: r.crawlAutorise,
      dansSitemap: r.dansSitemap,
      canonical: r.canonical,
      canonicalCoherent: r.canonicalCoherent,
      title: r.title,
      description: r.description,
      contenuVisible: r.contenuVisible,
      donneesStructurees: r.donneesStructurees ?? [],
      langue: r.langue,
      pays: r.pays,
      statut: r.statut as Statut,
      causeProbable: (r.causeProbable as Cause | null) ?? null,
      motif: r.motif,
      manquant: r.manquant ?? [],
    })),
    pagesPubliques: await publicPageCounts(),
  };
}

export interface MonitorSnapshot {
  pagesPubliques: number;
  indexees: number;
  enAttente: number;
  exclues: number;
  erreurs: number;
  parFamille: {
    famille: string;
    suivies: number;
    indexees: number;
    enAttente: number;
    exclues: number;
    erreurs: number;
  }[];
  detailPubliques: Record<string, number>;
  searchConsole: SearchConsoleState;
  dernierControle: string | null;
}

/**
 * Moniteur d'indexation PDG (point 99) : pages publiques, indexées, en attente,
 * exclues, erreurs — avec la répartition par famille. Les compteurs viennent de
 * la surveillance réelle, jamais d'une estimation.
 */
export async function monitorSnapshot(): Promise<MonitorSnapshot> {
  const detailPubliques = await publicPageCounts();
  const pagesPubliques = Object.values(detailPubliques).reduce((a, b) => a + b, 0);

  let rows: { famille: string; indexGoogle: string; n: number }[] = [];
  try {
    const res = await db.execute(
      sql`SELECT famille, index_google AS "indexGoogle", COUNT(*)::int AS n FROM "indexation_watch" GROUP BY famille, index_google`,
    );
    rows = (res.rows ?? []) as { famille: string; indexGoogle: string; n: number }[];
  } catch {
    rows = [];
  }

  const parFamilleMap = new Map<string, MonitorSnapshot["parFamille"][number]>();
  let indexees = 0;
  let enAttente = 0;
  let exclues = 0;
  let erreurs = 0;
  for (const row of rows) {
    const entry =
      parFamilleMap.get(row.famille) ??
      { famille: row.famille, suivies: 0, indexees: 0, enAttente: 0, exclues: 0, erreurs: 0 };
    entry.suivies += row.n;
    if (row.indexGoogle === "indexe") {
      entry.indexees += row.n;
      indexees += row.n;
    } else if (row.indexGoogle === "bloque" || row.indexGoogle === "non_indexe") {
      entry.exclues += row.n;
      exclues += row.n;
    } else if (row.indexGoogle === "erreur") {
      entry.erreurs += row.n;
      erreurs += row.n;
    } else {
      entry.enAttente += row.n;
      enAttente += row.n;
    }
    parFamilleMap.set(row.famille, entry);
  }

  let dernierControle: string | null = null;
  try {
    const [audit] = await db
      .select({ at: indexationAudits.finishedAt, started: indexationAudits.startedAt })
      .from(indexationAudits)
      .orderBy(desc(indexationAudits.id))
      .limit(1);
    if (audit) dernierControle = (audit.at ?? audit.started).toISOString();
  } catch {
    dernierControle = null;
  }

  return {
    pagesPubliques,
    indexees,
    enAttente,
    exclues,
    erreurs,
    parFamille: [...parFamilleMap.values()].sort((a, b) => b.suivies - a.suivies),
    detailPubliques,
    searchConsole: searchConsoleState(),
    dernierControle,
  };
}

/**
 * Cycle d'une nouvelle page publique (point 98) :
 * création → validation → SEO → sitemap → contrôle indexabilité → surveillance.
 *
 * Appelé à la publication : la page entre en surveillance avec un statut
 * honnête (« Index Google : EN ATTENTE ») au lieu d'être considérée indexée.
 */
export async function watchNewPage(input: {
  url: string;
  famille: Famille;
  pipeline?: Pipeline;
  pays?: string | null;
  langue?: string | null;
  soumise?: boolean;
}): Promise<void> {
  const base = baseUrl();
  const url = input.url.startsWith("http") ? input.url : `${base}${input.url}`;
  try {
    await db
      .insert(indexationWatch)
      .values({
        url: url.slice(0, 512),
        famille: input.famille,
        pipeline: input.pipeline ?? "annonce",
        pays: input.pays?.slice(0, 8) ?? null,
        langue: input.langue?.slice(0, 16) ?? null,
        validee: true,
        indexGoogle: "en_attente",
        soumisLe: input.soumise ? new Date() : null,
        dernierMotif:
          "Page publiée et déclarée. L'indexation Google reste EN ATTENTE : une soumission n'est pas une indexation.",
      })
      .onConflictDoUpdate({
        target: indexationWatch.url,
        set: {
          validee: true,
          soumisLe: input.soumise ? new Date() : undefined,
        },
      });
  } catch {
    /* jamais bloquant pour la publication */
  }
}

/** Historique des audits : ce qui a réellement bougé entre deux relevés. */
export async function indexationHistory(limit = 20) {
  const rows = await db
    .select()
    .from(indexationAudits)
    .orderBy(desc(indexationAudits.id))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    date: (r.finishedAt ?? r.startedAt).toISOString(),
    trigger: r.trigger,
    total: r.total,
    parStatut: (r.parStatut ?? {}) as Record<string, number>,
    sitemapUrls: r.sitemapUrls,
  }));
}

/**
 * Contrôle de surveillance des dernières annonces publiées : passe en revue les
 * URLs récentes et met à jour leur statut réel.
 */
export async function watchRecentPages(limit = 20): Promise<{ controlees: number }> {
  const base = baseUrl();
  const gsc = searchConsoleState();
  const [robots, sitemap, candidats] = await Promise.all([
    fetchRobots(base),
    fetchSitemap(base),
    recentAnnonceUrls(limit),
  ]);
  const items: UrlDiagnostic[] = [];
  for (const candidat of candidats.slice(0, limit)) {
    items.push(await diagnoseUrl(candidat, { base, robots, sitemapUrls: sitemap.urls, gsc }));
  }
  await syncWatch(items);
  await raiseVisibilityAlerts(items, { robots, sitemapTrouve: sitemap.found });
  return { controlees: items.length };
}
