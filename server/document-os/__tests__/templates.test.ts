/**
 * Document OS — conformité aux règles maîtres documentaires MKA.P-MS 2026
 * (fichier "Instructions Maîtres Agents Documents", transmis par la direction).
 *
 * Ce test couvre uniquement ce qui est vérifiable SANS l'asset visuel
 * verrouillé (filigrane VO v7, couverture premium) : règle #6 (ordre des
 * signatures), #7 (pied de page par défaut) et #8 (donnée obligatoire
 * manquante jamais silencieusement vide). Les règles qui dépendent du
 * référentiel visuel restent honnêtement non couvertes ici.
 *
 * Lancement : `npx tsx server/document-os/__tests__/templates.test.ts`
 */
import assert from "node:assert/strict";
import { CHAMP_A_COMPLETER, renderDocument } from "../index.js";
import { DEFAULT_TEMPLATES } from "../templates.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

function main() {
  // ── Règle #8 : une variable jamais fournie devient visible, jamais blanche ──
  const html = renderDocument("Client : {{client_name}} — Remise : {{remise}}", { client_name: "Ahmed Diallo", remise: "" });
  verif("8. variable fournie non vide : rendue telle quelle", html.includes("Ahmed Diallo"));
  verif("8. variable fournie vide explicitement : reste vide (valeur assumée)", html.endsWith("Remise : "));

  const htmlManquant = renderDocument("Adresse : {{client_address}}", {});
  verif("8. variable jamais fournie : marquée visible, jamais blanche", htmlManquant.includes(CHAMP_A_COMPLETER));
  verif("8. le marqueur est bien « [À COMPLÉTER] »", CHAMP_A_COMPLETER === "[À COMPLÉTER]");

  // ── Règle #7 : pied de page par défaut www.mkapms.site ─────────────────
  for (const t of DEFAULT_TEMPLATES) {
    verif(`7. ${t.typeCode} : pied de page contient www.mkapms.site`, t.htmlBody.includes("www.mkapms.site"));
  }

  // ── Règle #6 : autre partie à gauche, MKA.P-MS toujours à droite ───────
  // Dans une grille CSS 2 colonnes, le premier bloc du DOM est à gauche : le
  // bloc client/contrepartie doit donc apparaître AVANT le bloc {{brand_name}}
  // dans le HTML de la section signature.
  for (const t of DEFAULT_TEMPLATES) {
    const signIdx = t.htmlBody.indexOf('class="sign"');
    if (signIdx === -1) continue; // types sans bloc signature (aucun dans DEFAULT_TEMPLATES aujourd'hui)
    const signSection = t.htmlBody.slice(signIdx);
    const idxClient = signSection.indexOf("{{client_name}}");
    const idxBrand = signSection.indexOf("{{brand_name}}");
    verif(
      `6. ${t.typeCode} : contrepartie ({{client_name}}) avant MKA.P-MS ({{brand_name}}) dans le bloc signature`,
      idxClient !== -1 && idxBrand !== -1 && idxClient < idxBrand,
    );
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main();
