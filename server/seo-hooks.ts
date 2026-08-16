/**
 * SEO OS — hooks de publication (§1).
 *
 * À chaque publication/mise à jour d'une annonce, le SEO OS :
 *  1. soumet l'URL propre à l'indexation (IndexNow — no-op honnête sans clé) ;
 *  2. enregistre l'événement au Journal du Système Intelligent (Control Center).
 *
 * L'annonce est déjà couverte dynamiquement par le sitemap (server/seo.ts) et
 * l'injection SSR des meta/JSON-LD : ce hook ne crée pas de page en double, il
 * déclenche l'indexation active + la supervision. Fire-and-forget : n'échoue
 * jamais le flux de publication.
 */
import { env } from "./env.js";
import { submitIndexNow } from "./seo-indexing.js";
import { logActivity } from "./smart-engine/services/activity-log.js";
import { watchNewPage } from "./indexation/service.js";

export async function onAnnoncePublished(
  annonceId: number,
  event: "published" | "updated" = "published",
  userId?: number,
): Promise<void> {
  const baseUrl = (env.PUBLIC_URL || "").replace(/\/+$/, "");
  const url = `${baseUrl}/vehicule/${annonceId}`;
  // La page entre sous surveillance d'indexation. Elle y reste « en attente » :
  // une soumission IndexNow ne prouve jamais que Google a indexé la page.
  try {
    await watchNewPage({ url, famille: "vehicule", pipeline: "annonce", soumise: !!baseUrl });
  } catch { /* la surveillance ne bloque jamais la publication */ }

  try {
    const res = baseUrl
      ? await submitIndexNow(baseUrl, [url])
      : { configured: false, submitted: 0, success: false, detail: "PUBLIC_URL non configurée" };
    await logActivity({
      action: `seo.annonce_${event}`,
      userId,
      targetType: "annonce",
      targetId: annonceId,
      data: { url, indexnow: res.configured, submitted: res.submitted, detail: res.detail },
      result: res.configured ? (res.success ? "success" : "failure") : "pending",
    });
  } catch (err) {
    // Supervision best-effort — ne bloque jamais la publication.
    try {
      await logActivity({
        action: `seo.annonce_${event}`,
        userId,
        targetType: "annonce",
        targetId: annonceId,
        data: { url, error: (err as Error).message },
        result: "failure",
      });
    } catch { /* noop */ }
  }
}
