/**
 * server/partner-engine/world-countries.ts — données statiques, test pur
 * (aucune base de données nécessaire).
 *
 * Lancement : `npx tsx server/partner-engine/__tests__/world-countries.test.ts`
 */
import assert from "node:assert/strict";
import { WORLD_COUNTRIES, WORLD_COUNTRY_CODES, isKnownCountryCode } from "../world-countries.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

function main() {
  verif("la liste couvre un nombre réaliste de pays (au moins 150)", WORLD_COUNTRIES.length >= 150);

  const codes = WORLD_COUNTRIES.map((c) => c.code);
  verif("chaque code est unique (pas de doublon)", new Set(codes).size === codes.length);
  verif(
    "chaque code fait exactement 2 lettres majuscules (ISO 3166-1 alpha-2)",
    WORLD_COUNTRIES.every((c) => /^[A-Z]{2}$/.test(c.code)),
  );
  verif(
    "chaque pays a un nom français non vide",
    WORLD_COUNTRIES.every((c) => c.nameFr.trim().length > 0),
  );

  // Pays réels couverts par le Country OS (les ~20 pays opérationnels) :
  // doivent aussi être dans la liste mondiale (sous-ensemble cohérent).
  for (const code of ["FR", "CI", "SN", "MA", "US", "DE"]) {
    verif(`la liste mondiale contient ${code} (déjà opérationnel)`, WORLD_COUNTRY_CODES.has(code));
  }

  // Pays réels mais absents du Country OS : exactement le cas que la
  // candidature investisseur doit désormais accepter.
  for (const code of ["GN", "NG", "JP", "BR", "IN", "GB" /* non dupliqué */]) {
    verif(`la liste mondiale contient ${code} (hors Country OS)`, WORLD_COUNTRY_CODES.has(code));
  }

  verif("isKnownCountryCode() reconnaît un code réel en minuscules", isKnownCountryCode("fr"));
  verif("isKnownCountryCode() rejette un code qui n'existe pas", !isKnownCountryCode("ZZ"));
  verif("isKnownCountryCode() rejette une chaîne vide", !isKnownCountryCode(""));

  console.log(`\n${ok}/${total} assertions réussies.`);
  if (ok !== total) process.exit(1);
}

main();
