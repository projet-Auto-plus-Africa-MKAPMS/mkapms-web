/**
 * server/seo.ts — buildHead()/annonceSeoHead() injectaient un second `<html lang="…">`
 * littéral à l'intérieur du <head> déjà ouvert du gabarit (via l'emplacement
 * <!--SEO-->), au lieu d'un simple fragment de <head>. Trouvé en lisant le HTML brut
 * réellement servi par /garages (curl en Googlebot) : un <html lang="fr"> dupliqué,
 * niché juste avant <title>, présent sur toutes les pages passant par buildHead()
 * (garage, réputation, collection, pages SEO statiques) et par annonceSeoHead()
 * (toutes les fiches véhicule) — pas un cas isolé.
 *
 * Base de données réelle (DATABASE_URL), déjà migrée. Lancement :
 * `npx tsx server/__tests__/seo-head-single-html-tag.test.ts`
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

const VENDEUR = 900994;
const PREFIX = "TEST-SEO-SINGLE-HTML-";

function fakeRequest(path: string) {
  return {
    path,
    protocol: "https",
    headers: { host: "www.mkapms.fr" },
  } as never;
}

// Gabarit réaliste : un <head> déjà ouvert avec l'emplacement <!--SEO-->, comme le
// vrai index.html — c'est dans ce contexte que le bug se manifestait (un deuxième
// <html> apparaissait DANS ce <head>, jamais visible avec un gabarit sans <head>).
const TEMPLATE = `<!doctype html>\n<html lang="fr">\n<head>\n<!--SEO-->\n</head>\n<body><div id="root"></div></body>\n</html>`;

function compteHtml(html: string): number {
  return (html.match(/<html[\s>]/gi) || []).length;
}

async function nettoyer() {
  await db.delete(annonces).where(eq(annonces.ownerId, VENDEUR));
}

async function main() {
  await nettoyer();

  // ── 1. Fiche annonce réelle (annonceSeoHead) ──
  const [a] = await db
    .insert(annonces)
    .values({ ownerId: VENDEUR, status: "publiee", titre: `${PREFIX}Clio`, marque: "Renault", modele: "Clio", carburant: "essence" })
    .returning();
  const htmlAnnonce = await injectAnnonceSeo(fakeRequest(`/vehicule/${a.id}`), TEMPLATE);
  verif("fiche annonce : exactement une balise <html> (jamais dupliquée)", compteHtml(htmlAnnonce) === 1);

  // ── 2. Page collection réelle (buildHead, via collectionSeoHead) ──
  const htmlCollection = await injectAnnonceSeo(fakeRequest("/marque/renault"), TEMPLATE);
  verif("page collection : exactement une balise <html>", compteHtml(htmlCollection) === 1);
  verif("page collection : bien une fiche spécifique générée (sinon le test ne prouve rien)", htmlCollection.includes('"@type":"CollectionPage"'));

  // ── 3. Page statique générique (buildHead, via staticSeoHead) ──
  const htmlStatique = await injectAnnonceSeo(fakeRequest("/garages"), TEMPLATE);
  verif("page /garages : exactement une balise <html>", compteHtml(htmlStatique) === 1);

  await nettoyer();
  console.log(`${ok}/${total} vérifications réussies.`);
  process.exit(ok === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
