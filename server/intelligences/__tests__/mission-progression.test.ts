import { test } from "node:test";
import assert from "node:assert/strict";
import { DUREE_CONSERVATION_MS, lireSuivi, ouvrirSuivi, publierEtape, terminerSuivi } from "../mission-progression.js";

test("les étapes publiées sont relues dans l'ordre, mises à jour en place, puis la mission est marquée terminée", () => {
  ouvrirSuivi("suivi-ordre-01", 7, 1000);
  publierEtape("suivi-ordre-01", { etape: "comprendre", libelle: "Comprendre", statut: "en_cours" }, 1100);
  publierEtape("suivi-ordre-01", { etape: "comprendre", libelle: "Comprendre", statut: "fait", observe: "objectif lu" }, 1200);
  publierEtape("suivi-ordre-01", { etape: "architecture", libelle: "Architecture", statut: "en_cours" }, 1300);
  const enCours = lireSuivi("suivi-ordre-01", 7, 1400);
  assert.equal(enCours?.termine, false);
  assert.deepEqual(enCours?.etapes.map((e) => [e.etape, e.statut]), [["comprendre", "fait"], ["architecture", "en_cours"]]);
  assert.equal(enCours?.etapes[0].observe, "objectif lu");
  terminerSuivi("suivi-ordre-01", 1500);
  assert.equal(lireSuivi("suivi-ordre-01", 7, 1600)?.termine, true);
});

test("un suivi n'est lisible que par celui qui a lancé la mission", () => {
  ouvrirSuivi("suivi-prive-01", 7, 1000);
  assert.equal(lireSuivi("suivi-prive-01", 8, 1000), null);
  assert.equal(lireSuivi("inconnu-0001", 7, 1000), null);
});

test("un suivi inactif est oublié après la durée de conservation", () => {
  ouvrirSuivi("suivi-ancien-01", 7, 0);
  ouvrirSuivi("suivi-recent-01", 7, DUREE_CONSERVATION_MS + 1);
  assert.equal(lireSuivi("suivi-ancien-01", 7, DUREE_CONSERVATION_MS + 1), null);
  assert.notEqual(lireSuivi("suivi-recent-01", 7, DUREE_CONSERVATION_MS + 1), null);
});

test("l'aperçu d'une étape est borné", () => {
  ouvrirSuivi("suivi-borne-01", 7, 0);
  publierEtape("suivi-borne-01", { etape: "analyse", libelle: "Analyse", statut: "fait", observe: "x".repeat(5000) }, 1);
  assert.equal(lireSuivi("suivi-borne-01", 7, 2)?.etapes[0].observe.length, 600);
});
