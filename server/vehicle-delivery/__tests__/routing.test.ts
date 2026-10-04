/**
 * Vehicle Delivery — connecteur de distance routière réelle (routing.ts).
 *
 * Aucune clé Google Maps n'est fournie en environnement de développement à
 * ce jour : ce test vérifie donc surtout qu'en son absence, rien ne change
 * pour l'utilisateur (le devis reste honnêtement "non mesuré", comme avant
 * l'ajout de ce connecteur) — puis, avec une clé factice et un fetch simulé,
 * que le chemin de succès parse correctement une vraie réponse Google Maps
 * Distance Matrix. Le vrai appel réseau, lui, ne pourra être vérifié que le
 * jour où une clé réelle sera fournie par la direction (voir tâche dédiée).
 *
 * Lancement : `npx tsx server/vehicle-delivery/__tests__/routing.test.ts`
 */
import assert from "node:assert/strict";
import { env } from "../../env.js";
import { calculerDistanceRoutiere, mesurerItineraire, viderCacheItineraire } from "../routing.js";
import { devis } from "../service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  const cleOriginale = env.GOOGLE_MAPS_API_KEY;
  const routageOriginal = env.ROUTAGE_OUVERT;
  // Scénarios 1 à 4 : Google seul, connecteur ouvert coupé (aucun appel réseau réel).
  env.ROUTAGE_OUVERT = "off";

  // 1. Sans clé (état réel actuel) : jamais d'appel réseau, jamais de distance inventée.
  env.GOOGLE_MAPS_API_KEY = "";
  const sansCle = await calculerDistanceRoutiere({ ville: "Paris", pays: "FR" }, { ville: "Lyon", pays: "FR" });
  verif("Sans clé configurée : aucune distance retournée (null)", sansCle === null);

  // 2. Le devis complet reste inchangé sans clé : toujours "non mesuré" avec le manque nommé.
  const devisSansCle = await devis({
    paysDepart: "FR",
    villeDepart: "Paris",
    paysArrivee: "FR",
    villeArrivee: "Lyon",
    categorie: "berline",
  });
  verif("devis() sans clé : distanceKm toujours null (comportement inchangé)", devisSansCle.distanceKm === null);
  verif(
    "devis() sans clé : le manque \"connecteur d'itinéraire\" est toujours signalé",
    devisSansCle.manques.some((m) => m.includes("connecteur d'itinéraire")),
  );

  // 3. Avec une clé (factice) et un fetch simulé : le chemin de succès parse bien une vraie forme de réponse Google.
  env.GOOGLE_MAPS_API_KEY = "cle-test-factice";
  const fetchOriginal = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({ status: "OK", rows: [{ elements: [{ status: "OK", distance: { value: 465000 } }] }] }),
      { status: 200 },
    )) as typeof fetch;
  try {
    const avecCle = await calculerDistanceRoutiere({ ville: "Paris", pays: "FR" }, { ville: "Lyon", pays: "FR" });
    verif("Avec clé + réponse Google simulée : distance réelle parsée (465 km)", avecCle === 465);
  } finally {
    globalThis.fetch = fetchOriginal;
    env.GOOGLE_MAPS_API_KEY = cleOriginale;
  }

  // 4. Une réponse d'échec Google (ex: ZERO_RESULTS) ne doit jamais produire une distance inventée.
  env.GOOGLE_MAPS_API_KEY = "cle-test-factice";
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ status: "OK", rows: [{ elements: [{ status: "NOT_FOUND" }] }] }), { status: 200 })) as typeof fetch;
  try {
    const echec = await calculerDistanceRoutiere({ ville: "Villeinconnue", pays: "FR" }, { ville: "Lyon", pays: "FR" });
    verif("Réponse Google NOT_FOUND : retourne null, jamais une distance inventée", echec === null);
  } finally {
    globalThis.fetch = fetchOriginal;
    env.GOOGLE_MAPS_API_KEY = cleOriginale;
  }

  // 5. Connecteur ouvert OpenStreetMap (sans clé Google) : géocodage Nominatim puis itinéraire OSRM simulés.
  env.GOOGLE_MAPS_API_KEY = "";
  env.ROUTAGE_OUVERT = "on";
  viderCacheItineraire();
  const appels: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url);
    appels.push(u);
    if (u.includes("/search?")) {
      const q = new URL(u).searchParams.get("q");
      const point = q === "Paris" ? { lat: "48.8566", lon: "2.3522" } : { lat: "45.764", lon: "4.8357" };
      return new Response(JSON.stringify([{ ...point, address: { country_code: "fr" } }]), { status: 200 });
    }
    if (u.includes("/route/v1/driving/")) {
      return new Response(JSON.stringify({ code: "Ok", routes: [{ distance: 465321 }] }), { status: 200 });
    }
    return new Response("{}", { status: 404 });
  }) as typeof fetch;
  try {
    const mesure = await mesurerItineraire({ ville: "Paris", pays: null }, { ville: "Lyon", pays: "FR" });
    verif("OSM : distance routière réelle parsée (465,3 km)", mesure?.distanceKm === 465.3);
    verif("OSM : source « osm »", mesure?.source === "osm");
    verif("OSM : pays absent complété par le géocodage (FR)", mesure?.paysOrigine === "FR");
    verif("OSM : pays connu transmis à Nominatim (countrycodes=fr)", appels.some((a) => a.includes("countrycodes=fr")));
    const nbAppels = appels.length;
    await mesurerItineraire({ ville: "Paris", pays: null }, { ville: "Lyon", pays: "FR" });
    verif("OSM : seconde mesure servie par le cache (aucun nouvel appel)", appels.length === nbAppels);
  } finally {
    globalThis.fetch = fetchOriginal;
  }

  // 6. OSRM sans itinéraire routier (ex : NoRoute) : jamais de distance inventée.
  viderCacheItineraire();
  globalThis.fetch = (async (url: string | URL | Request) => {
    const u = String(url);
    if (u.includes("/search?")) return new Response(JSON.stringify([{ lat: "48.85", lon: "2.35" }]), { status: 200 });
    return new Response(JSON.stringify({ code: "NoRoute" }), { status: 200 });
  }) as typeof fetch;
  try {
    const sansRoute = await mesurerItineraire({ ville: "Paris", pays: "FR" }, { ville: "Ajaccio", pays: "FR" });
    verif("OSRM NoRoute : retourne null, jamais une distance inventée", sansRoute === null);
  } finally {
    globalThis.fetch = fetchOriginal;
    env.GOOGLE_MAPS_API_KEY = cleOriginale;
    env.ROUTAGE_OUVERT = routageOriginal;
    viderCacheItineraire();
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
