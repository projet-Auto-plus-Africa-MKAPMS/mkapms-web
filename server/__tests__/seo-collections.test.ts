/**
 * server/seo.ts — collections réelles par carburant / marque (/carburant/:valeur,
 * /marque/:valeur). Demande PDG : une recherche générique ("véhicule électrique")
 * doit trouver une vraie page de résultats, pas seulement une fiche isolée.
 *
 * Base de données réelle (DATABASE_URL), déjà migrée. Lancement :
 * `npx tsx server/__tests__/seo-collections.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";
import { injectAnnonceSeo } from "../seo.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR = 900993;
const PREFIX = "TEST-SEO-COLLECTION-";

function fakeRequest(path: string) {
  return {
    path,
    protocol: "https",
    headers: { host: "www.mkapms.fr" },
  } as never;
}

async function nettoyer() {
  await db.delete(annonces).where(eq(annonces.ownerId, VENDEUR));
}

async function main() {
  await nettoyer();

  // ── 1. Deux annonces électriques publiées → page /carburant/electrique réelle ──
  await db.insert(annonces).values([
    { ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}Zoe`, marque: "Renault", modele: "Zoe", carburant: "electrique" },
    { ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}e-208`, marque: "Peugeot", modele: "e-208", carburant: "electrique" },
    // Brouillon non publié : ne doit jamais compter dans la collection.
    { ownerId: VENDEUR, status: "brouillon", titre: `${PREFIX}ID.3 brouillon`, marque: "Volkswagen", modele: "ID.3", carburant: "electrique" },
  ]);

  const html1 = await injectAnnonceSeo(fakeRequest("/carburant/electrique"), "<html><!--SEO--></html>");
  verif("1. titre mentionne Électrique", html1.includes("Électrique"));
  verif("1. canonical pointe vers /carburant/electrique", html1.includes("https://www.mkapms.fr/carburant/electrique"));
  verif("1. JSON-LD CollectionPage présent", html1.includes('"@type":"CollectionPage"'));
  const jsonLd1 = JSON.parse(html1.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]);
  verif("1. exactement 2 annonces publiées listées (le brouillon est exclu)", jsonLd1.mainEntity.numberOfItems === 2);

  // ── 2. Marque réelle (insensible à la casse de l'URL) ──
  const html2 = await injectAnnonceSeo(fakeRequest("/marque/renault"), "<html><!--SEO--></html>");
  verif("2. la casse de l'URL ne bloque pas la correspondance de marque", html2.includes('"@type":"CollectionPage"'));
  verif("2. titre mentionne la marque", html2.toLowerCase().includes("renault"));

  // ── 3. Carburant sans aucune annonce publiée → aucune page de collection fabriquée ──
  await nettoyer();
  const html3 = await injectAnnonceSeo(fakeRequest("/carburant/hydrogene"), "<html><!--SEO--></html>");
  verif("3. aucune CollectionPage pour une valeur sans annonce publiée", !html3.includes('"@type":"CollectionPage"'));

  await nettoyer();
  console.log(`${ok}/${total} vérifications réussies.`);
  process.exit(ok === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
