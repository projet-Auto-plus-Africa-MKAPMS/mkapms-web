/**
 * emailCampagne() (server/services/email.ts) — le message est rédigé à la main par le
 * Fondateur, jamais garanti exempt de "&"/"<"/">" ; échappé avant mise en forme pour ne
 * jamais casser le HTML envoyé ni laisser passer une balise non voulue. Pur, sans base de
 * données : lançable directement.
 *
 * Lancement : npx tsx server/services/__tests__/email-campagne.test.ts
 */
import assert from "node:assert/strict";
import { emailCampagne } from "../email.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const html = emailCampagne("Prix < 10 000€ & options incluses.\n\nContactez-nous <ici>.", "https://mkapms.fr/desabonnement?token=abc");

verif("'&' échappé en &amp;", html.includes("10 000&amp;euro;") === false && html.includes("&amp;") === true);
verif("'<' jamais laissé tel quel dans le corps", !/Prix < 10/.test(html));
verif("le prix échappé est bien présent", html.includes("Prix &lt; 10 000€"));
verif("'<ici>' n'ouvre aucune balise", !html.includes("<ici>") && html.includes("&lt;ici&gt;"));
verif("deux paragraphes distincts (séparés par une ligne vide)", (html.match(/<p>/g) || []).length === 2);
verif("le lien de désabonnement reste une vraie balise <a>, non échappée", html.includes('<a href="https://mkapms.fr/desabonnement?token=abc"'));

console.log(`\n${ok}/${total} vérifications réussies.`);
if (ok !== total) process.exitCode = 1;
