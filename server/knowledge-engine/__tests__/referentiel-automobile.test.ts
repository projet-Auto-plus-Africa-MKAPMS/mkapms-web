/**
 * Référentiel automobile de départ : cohérence des données (sans base). Les faits eux-mêmes sont de la connaissance générale
 * NON vérifiée ; ce test garantit seulement leur forme, l'absence de doublon et quelques faits de contrôle très connus.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CARROSSERIES, CATEGORIES_VEHICULE, ENERGIES, MARQUES_REFERENTIEL, SYSTEMES_PIECES, TRANSMISSIONS } from "../referentiel-automobile.js";
import { normaliserNomMarque } from "../nhtsa.js";
import { nomPays } from "../referentiel-seed.js";

test("marques : plus de quatre cents, noms uniques, pays et catégories valides, états connus", () => {
  assert.ok(MARQUES_REFERENTIEL.length >= 400, String(MARQUES_REFERENTIEL.length));
  const noms = MARQUES_REFERENTIEL.map((m) => m.nom.toLowerCase().replace(/\s+/g, " "));
  assert.equal(new Set(noms).size, noms.length, "aucun doublon (la signature du graphe est insensible à la casse)");
  for (const m of MARQUES_REFERENTIEL) {
    assert.ok(m.nom.trim() === m.nom && m.nom.length >= 2 && m.nom.length <= 120, m.nom);
    assert.match(m.pays, /^[A-Z]{2}$/, m.nom);
    assert.ok(m.categories.length > 0, m.nom);
    for (const l of m.categories) assert.ok(l in CATEGORIES_VEHICULE, `${m.nom} : catégorie ${l}`);
    assert.ok(["active", "disparue", "relancee"].includes(m.etat), m.nom);
  }
});

test("couverture : voitures, motos, camions, bus, engins, agricole, camping-cars, voiturettes, sur plusieurs continents", () => {
  for (const lettre of Object.keys(CATEGORIES_VEHICULE)) {
    assert.ok(MARQUES_REFERENTIEL.some((m) => m.categories.includes(lettre)), `catégorie ${lettre} sans marque`);
  }
  const pays = new Set(MARQUES_REFERENTIEL.map((m) => m.pays));
  for (const p of ["FR", "DE", "IT", "GB", "JP", "KR", "CN", "IN", "US", "BR", "TR", "RU", "SE", "ES", "NG", "GH", "KE", "TN", "MA", "IR", "MY", "VN"]) assert.ok(pays.has(p), p);
  assert.ok(MARQUES_REFERENTIEL.some((m) => m.etat === "disparue") && MARQUES_REFERENTIEL.some((m) => m.etat === "relancee"));
});

test("faits de contrôle très connus", () => {
  const trouver = (n: string) => MARQUES_REFERENTIEL.find((m) => m.nom === n)!;
  assert.equal(trouver("Renault").pays, "FR");
  assert.equal(trouver("Dacia").pays, "RO");
  assert.equal(trouver("Toyota").pays, "JP");
  assert.equal(trouver("Tesla").pays, "US");
  assert.equal(trouver("Ducati").pays, "IT");
  assert.equal(trouver("Škoda").pays, "CZ");
  assert.equal(trouver("Saab").etat, "disparue");
  assert.ok(trouver("Ducati").categories.includes("M"));
  assert.ok(trouver("Scania").categories.includes("C"));
  assert.ok(trouver("Yutong").categories.includes("B"));
});

test("taxonomies et pièces : listes non vides, sans doublon, aucune référence ni prix ni compatibilité", () => {
  for (const liste of [ENERGIES, CARROSSERIES, TRANSMISSIONS]) {
    assert.ok(liste.length >= 10);
    assert.equal(new Set(liste.map((x) => x.toLowerCase())).size, liste.length);
  }
  assert.ok(SYSTEMES_PIECES.length >= 20);
  assert.equal(new Set(SYSTEMES_PIECES.map((s) => s.code)).size, SYSTEMES_PIECES.length);
  const familles = SYSTEMES_PIECES.flatMap((s) => s.familles.map((f) => f.toLowerCase()));
  assert.equal(new Set(familles).size, familles.length, "une famille n'appartient qu'à un système (le graphe l'exige)");
  assert.ok(familles.length >= 150);
  for (const f of familles) assert.equal(/\d+\s?(€|eur|\$)|réf(érence)?\s*:|compatible avec/i.test(f), false, f);
});

test("noms de pays en français ; normalisation des noms de la NHTSA", () => {
  assert.equal(nomPays("FR"), "France");
  assert.equal(nomPays("DE"), "Allemagne");
  assert.equal(nomPays("MC"), "Monaco");
  assert.equal(normaliserNomMarque("  RENAULT   TRUCKS "), "RENAULT TRUCKS");
  for (const mauvais of ["", " ", "7", "1234", "x", null, undefined, 42, "A".repeat(121)]) assert.equal(normaliserNomMarque(mauvais), null);
});
