/**
 * Distance routière réelle entre deux villes.
 *
 * Utilisée par devis() (server/vehicle-delivery/service.ts) pour chiffrer les
 * étapes au barème kilométrique. Deux connecteurs, essayés dans cet ordre :
 *  1. Google Maps Distance Matrix, si GOOGLE_MAPS_API_KEY est fournie ;
 *  2. connecteur ouvert OpenStreetMap : géocodage Nominatim puis itinéraire
 *     routier OSRM (adresses réglables, serveurs auto-hébergeables), sauf si
 *     ROUTAGE_OUVERT=off.
 * Si aucun ne répond, retourne null — le devis reste alors honnêtement
 * "non mesuré" (voir le manque "connecteur d'itinéraire"), jamais une
 * distance à vol d'oiseau ou approximée substituée en silence.
 */
import { env } from "../env.js";

interface DistanceMatrixElement {
  status: string;
  distance?: { value: number };
}
interface DistanceMatrixResponse {
  status: string;
  rows?: { elements: DistanceMatrixElement[] }[];
}
interface NominatimResultat {
  lat: string;
  lon: string;
  address?: { country_code?: string };
}
interface OsrmReponse {
  code: string;
  routes?: { distance: number }[];
}

export type SourceDistance = "google" | "osm";

export interface MesureItineraire {
  distanceKm: number;
  source: SourceDistance;
  /** Code pays ISO alpha-2 (majuscules) constaté par le géocodage, null s'il n'est pas connu. */
  paysOrigine: string | null;
  paysDestination: string | null;
}

interface Lieu {
  ville: string;
  pays?: string | null;
}

interface PointGeocode {
  lat: number;
  lon: number;
  pays: string | null;
}

const DUREE_CACHE_MS = 30 * 24 * 3600 * 1000;
const TAILLE_CACHE = 2000;
const INTERVALLE_NOMINATIM_MS = 1100;

const cacheGeocodage = new Map<string, { valeur: PointGeocode; expire: number }>();
const cacheItineraire = new Map<string, { valeur: number; expire: number }>();
let fileNominatim: Promise<void> = Promise.resolve();
let dernierAppelNominatim = 0;

function lireCache<T>(cache: Map<string, { valeur: T; expire: number }>, cle: string): T | undefined {
  const e = cache.get(cle);
  if (!e) return undefined;
  if (e.expire < Date.now()) {
    cache.delete(cle);
    return undefined;
  }
  return e.valeur;
}

function ecrireCache<T>(cache: Map<string, { valeur: T; expire: number }>, cle: string, valeur: T) {
  if (cache.size >= TAILLE_CACHE) {
    const premiere = cache.keys().next().value;
    if (premiere !== undefined) cache.delete(premiere);
  }
  cache.set(cle, { valeur, expire: Date.now() + DUREE_CACHE_MS });
}

/** Vide les caches du connecteur ouvert (tests). */
export function viderCacheItineraire() {
  cacheGeocodage.clear();
  cacheItineraire.clear();
}

function arrondiKm(metres: number): number {
  return Math.round((metres / 1000) * 10) / 10;
}

function sansBarreFinale(url: string): string {
  return url.replace(/\/+$/, "");
}

function enTeteContact(): Record<string, string> {
  const contact = env.ROUTAGE_CONTACT ? `; ${env.ROUTAGE_CONTACT}` : "";
  return { "User-Agent": `MKAPMS-livraison-vehicule/1.0 (+https://www.mkapms.fr${contact})`, "Accept-Language": "fr" };
}

/** La politique d'usage de Nominatim impose au plus une requête par seconde : les appels sont mis en file. */
function tourNominatim(): Promise<void> {
  const tour = fileNominatim.then(async () => {
    const attente = dernierAppelNominatim + INTERVALLE_NOMINATIM_MS - Date.now();
    if (attente > 0) await new Promise((r) => setTimeout(r, attente));
    dernierAppelNominatim = Date.now();
  });
  fileNominatim = tour.catch(() => undefined);
  return tour;
}

async function distanceGoogle(origine: Lieu, destination: Lieu): Promise<number | null> {
  if (!env.GOOGLE_MAPS_API_KEY) return null;

  const params = new URLSearchParams({
    origins: origine.pays ? `${origine.ville}, ${origine.pays}` : origine.ville,
    destinations: destination.pays ? `${destination.ville}, ${destination.pays}` : destination.ville,
    units: "metric",
    key: env.GOOGLE_MAPS_API_KEY,
  });

  try {
    const resp = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as DistanceMatrixResponse;
    if (data.status !== "OK") return null;
    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK" || !element.distance) return null;
    return arrondiKm(element.distance.value);
  } catch {
    // Réseau, timeout, clé invalide, quota dépassé… : aucune distance inventée.
    return null;
  }
}

async function geocoder(lieu: Lieu): Promise<PointGeocode | null> {
  const pays = lieu.pays ? lieu.pays.trim().toLowerCase() : "";
  const cle = `${lieu.ville.trim().toLowerCase()}|${pays}`;
  const enCache = lireCache(cacheGeocodage, cle);
  if (enCache) return enCache;

  const params = new URLSearchParams({ q: lieu.ville.trim(), format: "jsonv2", limit: "1", addressdetails: "1" });
  if (/^[a-z]{2}$/.test(pays)) params.set("countrycodes", pays);

  await tourNominatim();
  const resp = await fetch(`${sansBarreFinale(env.NOMINATIM_URL)}/search?${params}`, {
    headers: enTeteContact(),
    signal: AbortSignal.timeout(8000),
  });
  if (!resp.ok) return null;
  const data = (await resp.json()) as NominatimResultat[];
  const r = data[0];
  if (!r) return null;
  const lat = Number(r.lat);
  const lon = Number(r.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const code = r.address?.country_code;
  const point: PointGeocode = { lat, lon, pays: code && /^[a-z]{2}$/i.test(code) ? code.toUpperCase() : null };
  ecrireCache(cacheGeocodage, cle, point);
  return point;
}

async function itineraireOsrm(a: PointGeocode, b: PointGeocode): Promise<number | null> {
  const coords = `${a.lon},${a.lat};${b.lon},${b.lat}`;
  const enCache = lireCache(cacheItineraire, coords);
  if (enCache !== undefined) return enCache;

  const resp = await fetch(`${sansBarreFinale(env.OSRM_URL)}/route/v1/driving/${coords}?overview=false&alternatives=false&steps=false`, {
    headers: enTeteContact(),
    signal: AbortSignal.timeout(10000),
  });
  if (!resp.ok) return null;
  const data = (await resp.json()) as OsrmReponse;
  const metres = data.code === "Ok" ? data.routes?.[0]?.distance : undefined;
  if (typeof metres !== "number" || !Number.isFinite(metres) || metres <= 0) return null;
  const km = arrondiKm(metres);
  ecrireCache(cacheItineraire, coords, km);
  return km;
}

async function mesureOuverte(origine: Lieu, destination: Lieu): Promise<MesureItineraire | null> {
  if (env.ROUTAGE_OUVERT === "off") return null;
  try {
    const a = await geocoder(origine);
    if (!a) return null;
    const b = await geocoder(destination);
    if (!b) return null;
    const distanceKm = await itineraireOsrm(a, b);
    if (distanceKm === null) return null;
    return { distanceKm, source: "osm", paysOrigine: a.pays, paysDestination: b.pays };
  } catch {
    // Ville introuvable, aucun itinéraire routier (mer, île), réseau, timeout : aucune distance inventée.
    return null;
  }
}

/**
 * Mesure l'itinéraire routier réel entre deux villes. Le pays est facultatif :
 * le connecteur ouvert le constate alors au géocodage et le renvoie.
 * Retourne null si aucun connecteur ne donne de distance réelle.
 */
export async function mesurerItineraire(origine: Lieu, destination: Lieu): Promise<MesureItineraire | null> {
  if (!origine.ville.trim() || !destination.ville.trim()) return null;
  const google = await distanceGoogle(origine, destination);
  if (google !== null) {
    return {
      distanceKm: google,
      source: "google",
      paysOrigine: origine.pays ? origine.pays.toUpperCase() : null,
      paysDestination: destination.pays ? destination.pays.toUpperCase() : null,
    };
  }
  return mesureOuverte(origine, destination);
}

/**
 * Distance routière en kilomètres entre deux villes ("Ville, Pays").
 * Retourne null si aucun connecteur ne répond — jamais une valeur inventée
 * ou approximée en remplacement.
 */
export async function calculerDistanceRoutiere(
  origine: { ville: string; pays: string },
  destination: { ville: string; pays: string },
): Promise<number | null> {
  return (await mesurerItineraire(origine, destination))?.distanceKm ?? null;
}
