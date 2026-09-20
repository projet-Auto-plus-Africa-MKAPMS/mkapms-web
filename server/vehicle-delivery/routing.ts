/**
 * Distance routière réelle entre deux villes — Google Maps Distance Matrix.
 *
 * Utilisée par devis() (server/vehicle-delivery/service.ts) pour chiffrer les
 * étapes au barème kilométrique. Tant que GOOGLE_MAPS_API_KEY n'est pas
 * fournie, ou en cas d'échec réel de l'appel, retourne null — le devis reste
 * alors honnêtement "non mesuré" (voir le manque "connecteur d'itinéraire"),
 * jamais une distance à vol d'oiseau ou approximée substituée en silence.
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

/**
 * Distance routière en kilomètres entre deux villes ("Ville, Pays").
 * Retourne null si la clé n'est pas configurée ou si l'appel échoue —
 * jamais une valeur inventée ou approximée en remplacement.
 */
export async function calculerDistanceRoutiere(
  origine: { ville: string; pays: string },
  destination: { ville: string; pays: string },
): Promise<number | null> {
  if (!env.GOOGLE_MAPS_API_KEY) return null;

  const params = new URLSearchParams({
    origins: `${origine.ville}, ${origine.pays}`,
    destinations: `${destination.ville}, ${destination.pays}`,
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
    return Math.round((element.distance.value / 1000) * 10) / 10;
  } catch {
    // Réseau, timeout, clé invalide, quota dépassé… : aucune distance
    // inventée, le devis reste "non mesuré" comme sans connecteur du tout.
    return null;
  }
}
