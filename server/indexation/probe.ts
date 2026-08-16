/**
 * MKA.P-MS Indexation Monitor — observation réelle d'une URL (point 92).
 *
 * On ne déduit rien du code : on demande la page au serveur public et on lit ce
 * qui est réellement renvoyé — statut HTTP, balise robots, canonical, titre,
 * description, contenu visible, données structurées, langue. Le résultat sert
 * ensuite à classer l'URL, et surtout à nommer la cause probable quand elle
 * n'est pas indexable.
 */

export interface RobotsRules {
  found: boolean;
  /** Règles Disallow applicables à `User-agent: *` et à Googlebot. */
  disallow: string[];
  allow: string[];
  sitemaps: string[];
  raw: string;
}

/** Lit le robots.txt réel du site (jamais supposé permissif). */
export async function fetchRobots(baseUrl: string): Promise<RobotsRules> {
  const vide: RobotsRules = { found: false, disallow: [], allow: [], sitemaps: [], raw: "" };
  try {
    const res = await fetch(`${baseUrl}/robots.txt`, { redirect: "follow" });
    if (!res.ok) return vide;
    const raw = await res.text();
    const disallow: string[] = [];
    const allow: string[] = [];
    const sitemaps: string[] = [];
    let applicable = false;
    for (const ligne of raw.split(/\r?\n/)) {
      const l = ligne.trim();
      if (!l || l.startsWith("#")) continue;
      const [cleBrute, ...reste] = l.split(":");
      const cle = cleBrute.trim().toLowerCase();
      const valeur = reste.join(":").trim();
      if (cle === "user-agent") {
        applicable = valeur === "*" || valeur.toLowerCase().includes("googlebot");
      } else if (cle === "sitemap") {
        sitemaps.push(valeur);
      } else if (applicable && cle === "disallow" && valeur) {
        disallow.push(valeur);
      } else if (applicable && cle === "allow" && valeur) {
        allow.push(valeur);
      }
    }
    return { found: true, disallow, allow, sitemaps, raw: raw.slice(0, 4000) };
  } catch {
    return vide;
  }
}

/** Le chemin est-il autorisé au crawl ? Règle la plus longue gagnante, comme Google. */
export function crawlAutorise(path: string, robots: RobotsRules): boolean {
  if (!robots.found) return true; // pas de robots.txt = tout est autorisé
  const match = (regles: string[]) =>
    regles
      .filter((r) => path.startsWith(r.replace(/\*$/, "")))
      .sort((a, b) => b.length - a.length)[0] ?? null;
  const deny = match(robots.disallow);
  const grant = match(robots.allow);
  if (!deny) return true;
  if (grant && grant.length >= deny.length) return true;
  return false;
}

export interface SitemapIndex {
  found: boolean;
  urls: Set<string>;
  enfants: string[];
  detail: string;
}

/**
 * Charge l'index de sitemaps et ses enfants, pour savoir si une URL est
 * réellement déclarée. Être dans le sitemap ne prouve rien sur l'indexation —
 * c'est seulement une déclaration de notre côté.
 */
export async function fetchSitemap(baseUrl: string, maxEnfants = 12): Promise<SitemapIndex> {
  const urls = new Set<string>();
  const enfants: string[] = [];
  try {
    const res = await fetch(`${baseUrl}/sitemap.xml`, { redirect: "follow" });
    if (!res.ok) {
      return { found: false, urls, enfants, detail: `sitemap.xml → HTTP ${res.status}` };
    }
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    const estIndex = /<sitemapindex/i.test(xml);
    if (!estIndex) {
      for (const loc of locs) urls.add(loc);
      return { found: true, urls, enfants, detail: `${urls.size} URL(s) déclarée(s)` };
    }
    for (const enfant of locs.slice(0, maxEnfants)) {
      enfants.push(enfant);
      try {
        const r = await fetch(enfant, { redirect: "follow" });
        if (!r.ok) continue;
        const x = await r.text();
        for (const m of x.matchAll(/<loc>([^<]+)<\/loc>/g)) urls.add(m[1].trim());
      } catch {
        /* un enfant illisible ne casse pas le contrôle */
      }
    }
    return {
      found: true,
      urls,
      enfants,
      detail: `${enfants.length} sitemap(s) enfant(s) lus, ${urls.size} URL(s) déclarée(s)`,
    };
  } catch (e) {
    return { found: false, urls, enfants, detail: (e as Error).message };
  }
}

export interface PageObservation {
  url: string;
  httpStatus: number | null;
  /** Chaîne de redirections suivie, si le serveur a redirigé. */
  redirigeVers: string | null;
  robotsMeta: string | null;
  noindex: boolean;
  canonical: string | null;
  title: string | null;
  description: string | null;
  /** Longueur du texte visible après retrait des scripts/styles/balises. */
  contenuVisible: number;
  donneesStructurees: string[];
  langue: string | null;
  /** Indice de rendu JavaScript : la page arrive quasi vide côté serveur. */
  renduJsRequis: boolean;
  erreur: string | null;
}

const UA_GOOGLEBOT =
  "Mozilla/5.0 (compatible; MKAPMS-IndexationMonitor/1.0; +https://www.mkapms.fr) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** Demande la page comme un robot d'indexation et lit ce qui revient. */
export async function observePage(url: string, timeoutMs = 15000): Promise<PageObservation> {
  const base: PageObservation = {
    url,
    httpStatus: null,
    redirigeVers: null,
    robotsMeta: null,
    noindex: false,
    canonical: null,
    title: null,
    description: null,
    contenuVisible: 0,
    donneesStructurees: [],
    langue: null,
    renduJsRequis: false,
    erreur: null,
  };

  const ctrl = new AbortController();
  const minuteur = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA_GOOGLEBOT, Accept: "text/html" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    base.httpStatus = res.status;
    if (res.url && res.url.replace(/\/$/, "") !== url.replace(/\/$/, "")) base.redirigeVers = res.url;

    const enTeteRobots = res.headers.get("x-robots-tag");
    const html = await res.text();

    const head = html.slice(0, 200000);
    base.robotsMeta =
      enTeteRobots ??
      head.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i)?.[1] ??
      null;
    base.noindex = /noindex/i.test(base.robotsMeta ?? "");
    base.canonical = head.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? null;
    base.title = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? null;
    base.description =
      head.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)?.[1]?.trim() ?? null;
    base.langue = head.match(/<html[^>]+lang=["']([^"']+)["']/i)?.[1] ?? null;

    for (const m of html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    )) {
      try {
        const parsed = JSON.parse(m[1].trim()) as unknown;
        const noeuds = Array.isArray(parsed) ? parsed : [parsed];
        for (const noeud of noeuds) {
          const type = (noeud as { "@type"?: string | string[] })?.["@type"];
          if (typeof type === "string") base.donneesStructurees.push(type);
          else if (Array.isArray(type)) base.donneesStructurees.push(...type.map(String));
        }
      } catch {
        base.donneesStructurees.push("json_ld_invalide");
      }
    }

    const texte = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    base.contenuVisible = texte.length;
    // Une page servie quasi vide au robot signale un contenu produit seulement
    // par le navigateur : Google peut l'indexer sans contenu, ou pas du tout.
    base.renduJsRequis = res.ok && texte.length < 400;
    return base;
  } catch (e) {
    base.erreur = (e as Error).name === "AbortError" ? `délai dépassé (${timeoutMs} ms)` : (e as Error).message;
    return base;
  } finally {
    clearTimeout(minuteur);
  }
}
