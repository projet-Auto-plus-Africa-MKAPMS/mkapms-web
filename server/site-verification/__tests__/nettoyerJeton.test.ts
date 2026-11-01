/**
 * nettoyerJeton() (server/site-verification/index.ts) — le jeton est collé à la
 * main par le Fondateur dans le champ "vérification du site". Un texte libre
 * collé par erreur (une phrase destinée à Claude, pas un jeton Google) a déjà
 * fini publié tel quel dans le <head> de toutes les pages publiques, en
 * `<meta name="google-site-verification" content="…phrase…">` — trouvé en lisant
 * le HTML brut réellement servi. Un vrai jeton de vérification (Google, Bing,
 * Yandex, Meta, Pinterest) n'est jamais une phrase : ni espace, ni ponctuation
 * de phrase. Pur, sans base de données : lançable directement.
 *
 * Lancement : `npx tsx server/site-verification/__tests__/nettoyerJeton.test.ts`
 */
import assert from "node:assert/strict";
import { nettoyerJeton } from "../index.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

verif(
  "une phrase collée par erreur (espaces + '?') est rejetée, jamais publiée",
  nettoyerJeton("google", "Est-ce que tu peux vérifier la plate-forme complet sur Google ?") === "",
);
verif("un texte libre avec '!' est rejeté", nettoyerJeton("bing", "oui fais-le !") === "");
verif(
  "un vrai jeton Google (balise complète) reste accepté",
  nettoyerJeton("google", '<meta name="google-site-verification" content="aDRdt_DayR7oAuQsy8jb9DpiG2are6jt_yq4Y7C9iqA" />') ===
    "aDRdt_DayR7oAuQsy8jb9DpiG2are6jt_yq4Y7C9iqA",
);
verif(
  "un vrai jeton Google (valeur seule, sans balise) reste accepté",
  nettoyerJeton("google", "337eced33e02e5ba") === "337eced33e02e5ba",
);
verif("un jeton Bing (msvalidate.01, alphanumérique) reste accepté", nettoyerJeton("bing", "ABC123DEF456") === "ABC123DEF456");
verif("une saisie vide reste vide", nettoyerJeton("google", "") === "");
verif("une saisie faite uniquement d'espaces est rejetée", nettoyerJeton("google", "   ") === "");

console.log(`\n${ok}/${total} vérifications réussies.`);
if (ok !== total) process.exitCode = 1;
