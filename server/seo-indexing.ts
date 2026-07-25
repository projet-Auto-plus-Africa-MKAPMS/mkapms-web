/**
 * MKA.P-MS — Soumission aux moteurs de recherche (indexation).
 *
 * IMPORTANT (honnêteté) : ajouter une URL ici ne garantit PAS son indexation.
 * Google/Bing restent seuls décideurs et le crawl n'est pas instantané.
 *
 * - IndexNow (Bing, Yandex, Seznam, Naver…) : soumission active, nécessite une
 *   clé `INDEXNOW_KEY` exposée sur `/{clé}.txt`. Sans clé → no-op explicite.
 * - Ping sitemap : les endpoints ping de Google/Bing sont DÉPRÉCIÉS ; on tente
 *   par compatibilité et on journalise honnêtement le résultat.
 */

import { db } from "./db.js";
import { seoIndexingLog } from "./schema.js";
import { env } from "./env.js";

async function log(url: string, action: string, success: boolean, responseCode?: number, responseBody?: string) {
  try {
    await db.insert(seoIndexingLog).values({
      url,
      action,
      source: "seo-os",
      success,
      responseCode: responseCode ?? null,
      responseBody: responseBody ? responseBody.slice(0, 2000) : null,
    });
  } catch {
    /* la journalisation ne doit jamais bloquer */
  }
}

export interface SubmitResult {
  provider: string;
  configured: boolean;
  submitted: number;
  success: boolean;
  detail: string;
}

/** Soumet une liste d'URLs à IndexNow (si une clé est configurée). */
export async function submitIndexNow(baseUrl: string, urls: string[]): Promise<SubmitResult> {
  const key = env.INDEXNOW_KEY;
  if (!key) {
    return { provider: "IndexNow", configured: false, submitted: 0, success: false, detail: "INDEXNOW_KEY non configurée" };
  }
  if (urls.length === 0) {
    return { provider: "IndexNow", configured: true, submitted: 0, success: true, detail: "Aucune URL à soumettre" };
  }
  const host = new URL(baseUrl).host;
  const payload = {
    host,
    key,
    keyLocation: `${baseUrl}/${key}.txt`,
    urlList: urls.slice(0, 10000),
  };
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    const success = res.ok;
    await log(`${baseUrl} (${urls.length} URLs)`, "indexnow", success, res.status, body);
    return {
      provider: "IndexNow",
      configured: true,
      submitted: payload.urlList.length,
      success,
      detail: `HTTP ${res.status}${success ? "" : ` — ${body.slice(0, 200)}`}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log(`${baseUrl} (${urls.length} URLs)`, "indexnow", false, undefined, msg);
    return { provider: "IndexNow", configured: true, submitted: 0, success: false, detail: msg };
  }
}

/**
 * Tente un ping du sitemap (endpoints historiques Google/Bing, dépréciés).
 * Journalise honnêtement — le vrai canal moderne est GSC/Bing Webmaster + IndexNow.
 */
export async function pingSitemaps(baseUrl: string): Promise<SubmitResult[]> {
  const sitemap = encodeURIComponent(`${baseUrl}/sitemap.xml`);
  const targets = [
    { provider: "Google (déprécié)", url: `https://www.google.com/ping?sitemap=${sitemap}` },
    { provider: "Bing (déprécié)", url: `https://www.bing.com/ping?sitemap=${sitemap}` },
  ];
  const results: SubmitResult[] = [];
  for (const t of targets) {
    try {
      const res = await fetch(t.url, { method: "GET" });
      await log(`${baseUrl}/sitemap.xml`, "sitemap_ping", res.ok, res.status);
      results.push({ provider: t.provider, configured: true, submitted: res.ok ? 1 : 0, success: res.ok, detail: `HTTP ${res.status}` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await log(`${baseUrl}/sitemap.xml`, "sitemap_ping", false, undefined, msg);
      results.push({ provider: t.provider, configured: true, submitted: 0, success: false, detail: msg });
    }
  }
  return results;
}
