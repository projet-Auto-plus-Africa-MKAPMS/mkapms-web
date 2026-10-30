/**
 * server/seo.ts — en-tête SEO d'une annonce (injectAnnonceSeo).
 *
 * Corrige un vrai défaut constaté en production (page /vehicule/54 réelle,
 * vérifiée en direct) : une photo stockée en data: URI (base64, faute de
 * stockage objet pour cette annonce) était exposée telle quelle en og:image
 * et dans le tableau `image` du JSON-LD schema.org/Vehicle — gonflant la
 * page de ~190 Ko pour rien, et invalide pour les données structurées
 * Google (qui exige une URL d'image accessible, jamais un data: URI).
 * Ce test prouve que ce cas est désormais écarté, et que le repli d'image
 * (/favicon.svg, qui n'existe pas) pointe vers un fichier réel.
 *
 * Base de données réelle (DATABASE_URL), déjà migrée. Lancement :
 * `npx tsx server/__tests__/seo-annonce-image.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { annonces, annoncePhotos } from "../schema.js";
import { injectAnnonceSeo } from "../seo.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR = 900992;
const PREFIX = "TEST-SEO-IMAGE-";

function fakeRequest(path: string) {
  return {
    path,
    protocol: "https",
    headers: { host: "www.mkapms.fr" },
  } as never;
}

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.ownerId, VENDEUR));
  for (const a of mesAnnonces) {
    await db.delete(annoncePhotos).where(eq(annoncePhotos.annonceId, a.id));
    await db.delete(annonces).where(eq(annonces.id, a.id));
  }
}

async function main() {
  await nettoyer();

  // ── 1. Annonce avec UNIQUEMENT une photo en data: URI (le cas réel constaté en production) ──
  const [annonceBase64] = await db
    .insert(annonces)
    .values({ ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}Peugeot 5008`, marque: "Peugeot", modele: "5008" })
    .returning();
  await db.insert(annoncePhotos).values({
    annonceId: annonceBase64.id,
    url: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAA==",
    ordre: 0,
  });

  const html1 = await injectAnnonceSeo(fakeRequest(`/vehicule/${annonceBase64.id}`), "<html><!--SEO--></html>");
  verif("1. aucune donnée base64 dans la page (og:image/JSON-LD)", !html1.includes("base64"));
  verif("1. le repli d'image pointe vers un fichier réel (logo-open.png), jamais favicon.svg", html1.includes("logo-open.png") && !html1.includes("favicon.svg"));
  const jsonLd1 = JSON.parse(html1.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]);
  verif("1. le JSON-LD n'a pas de champ image vide/invalide (omis plutôt que data: URI)", !("image" in jsonLd1) || !String(jsonLd1.image).includes("base64"));

  // ── 2. Annonce avec une vraie photo (http) ET une photo base64 : la vraie photo est utilisée, la fausse jamais ──
  const [annonceMixte] = await db
    .insert(annonces)
    .values({ ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}Renault Clio`, marque: "Renault", modele: "Clio" })
    .returning();
  await db.insert(annoncePhotos).values([
    { annonceId: annonceMixte.id, url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB", ordre: 0 },
    { annonceId: annonceMixte.id, url: "https://cdn.mkapms.fr/photos/clio-avant.jpg", ordre: 1 },
  ]);
  const html2 = await injectAnnonceSeo(fakeRequest(`/vehicule/${annonceMixte.id}`), "<html><!--SEO--></html>");
  verif("2. aucune donnée base64 dans la page", !html2.includes("base64"));
  verif("2. la vraie photo https est utilisée en og:image", html2.includes("https://cdn.mkapms.fr/photos/clio-avant.jpg"));
  const jsonLd2 = JSON.parse(html2.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)![1]);
  verif("2. le JSON-LD ne contient que la vraie photo", JSON.stringify(jsonLd2.image) === JSON.stringify(["https://cdn.mkapms.fr/photos/clio-avant.jpg"]));

  await nettoyer();
  console.log(`${ok}/${total} vérifications réussies.`);
  process.exit(ok === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
