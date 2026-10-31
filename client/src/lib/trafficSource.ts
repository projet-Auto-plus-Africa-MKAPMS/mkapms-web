/**
 * Catégorie d'arrivée du visiteur — même logique que mkapms-shop
 * (public/traffic-source.js, PR #471) : Google / réseaux sociaux / direct /
 * autre, calculée côté client (seul endroit avec accès à document.referrer).
 * Jamais l'URL complète du référent n'est transmise ni conservée — seulement
 * une des 4 catégories ci-dessous.
 */
export const TRAFFIC_SOURCES = ["google", "social", "direct", "other"] as const;
export type TrafficSource = (typeof TRAFFIC_SOURCES)[number];

const GOOGLE_HOST = /(^|\.)google\.[a-z.]+$/i;
const SOCIAL_HOST = /(^|\.)(facebook|instagram|twitter|x|tiktok|linkedin|pinterest|snapchat|whatsapp|reddit)\.[a-z.]+$/i;
const SOCIAL_EXACT_HOST = new Set(["t.co", "fb.me", "lnkd.in"]);

export function classifyTrafficSource(referrer: string | undefined | null, currentOrigin?: string): TrafficSource {
  const ref = String(referrer || "").trim();
  if (!ref) return "direct";
  if (currentOrigin && ref.toLowerCase().startsWith(String(currentOrigin).toLowerCase())) return "direct";
  let host: string;
  try {
    host = new URL(ref).hostname;
  } catch {
    return "other";
  }
  if (GOOGLE_HOST.test(host)) return "google";
  if (SOCIAL_HOST.test(host) || SOCIAL_EXACT_HOST.has(host.toLowerCase())) return "social";
  return "other";
}
