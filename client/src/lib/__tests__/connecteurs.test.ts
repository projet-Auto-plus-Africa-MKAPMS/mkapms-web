/**
 * Catalogue « Connecter les outils » du Coffre : noms uniques (la coche se base
 * dessus), types valides, aucun secret ni logo de marque, et résumé fidèle aux
 * seuls NOMS présents dans le coffre.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONNECTEURS, resumerConnecteur } from "../connecteurs.js";

test("catalogue : noms d'éléments uniques, types valides, usage franc, aucun secret", () => {
  const noms = CONNECTEURS.flatMap((c) => c.elements.map((e) => e.nom.toLowerCase()));
  assert.equal(new Set(noms).size, noms.length, "deux éléments ne peuvent pas partager un nom (la coche s'y fie)");
  assert.equal(new Set(CONNECTEURS.map((c) => c.id)).size, CONNECTEURS.length);
  for (const c of CONNECTEURS) {
    assert.ok(c.elements.some((e) => !e.facultatif), `${c.id} : au moins un élément obligatoire`);
    assert.ok(c.usage.length > 30, `${c.id} : dit ce que le moteur en fait réellement`);
    assert.ok(c.initiale.length === 1, `${c.id} : initiale neutre, pas de logo de marque`);
    for (const e of c.elements) {
      assert.ok(["identifiants", "cle_api", "fichier"].includes(e.type), e.nom);
      assert.ok(e.nom.length >= 2 && e.nom.length <= 120, e.nom);
      assert.ok(!/(?:\bsk-|-----BEGIN|ghp_|github_pat_)/.test(e.aide), `secret apparent dans « ${e.nom} »`);
    }
  }
  for (const id of ["google-play", "apple", "github", "railway", "boutique-shop", "boite-mail"]) {
    assert.ok(CONNECTEURS.some((c) => c.id === id), `connecteur ${id}`);
  }
});

test("résumé : compte seulement les obligatoires, insensible à la casse, ignore les noms inconnus", () => {
  const gp = CONNECTEURS.find((c) => c.id === "google-play")!;
  const vide = resumerConnecteur(gp, []);
  assert.equal(vide.complet, false);
  assert.equal(vide.obligatoiresDeposes, 0);

  const obligatoires = gp.elements.filter((e) => !e.facultatif).map((e) => e.nom);
  const partiel = resumerConnecteur(gp, [obligatoires[0]!.toUpperCase(), "Un autre secret"]);
  assert.equal(partiel.obligatoiresDeposes, 1);
  assert.equal(partiel.complet, false);

  const complet = resumerConnecteur(gp, obligatoires);
  assert.equal(complet.complet, true);
  assert.equal(complet.obligatoiresDeposes, complet.obligatoiresTotal);
  // un élément facultatif absent ne bloque pas la complétude
  assert.ok(complet.etats.some((e) => e.etat === "a_deposer"));
});
