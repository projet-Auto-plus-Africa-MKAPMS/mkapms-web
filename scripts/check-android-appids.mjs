#!/usr/bin/env node
/**
 * Vérifie que les 5 applications Android MKA.P-MS pointent exactement vers
 * les bons applicationId, et qu'aucune ancienne entrée Play Console
 * (com.mkapms.direction, com.mkapms.particulier, com.mkapms.Pro — des
 * applications distinctes, déjà existantes, jamais à confondre avec les 5
 * nouvelles) n'est jamais réintroduite par erreur dans mobile/variants.json.
 *
 *   node scripts/check-android-appids.mjs
 */
import { readFileSync } from "node:fs";

const ATTENDUS = {
  grandpublic: "com.mkapms.app",
  pro: "com.mkapms.pro",
  command: "com.mkapms.command",
  intelligence: "com.mkapms.intelligence",
  investor: "com.mkapms.investor",
};

const INTERDITS = ["com.mkapms.direction", "com.mkapms.particulier", "com.mkapms.Pro"];

const variantes = JSON.parse(readFileSync("mobile/variants.json", "utf8"));

let erreurs = 0;

for (const [nom, appId] of Object.entries(ATTENDUS)) {
  const v = variantes[nom];
  if (!v) {
    console.error(`✗ Variante "${nom}" manquante dans mobile/variants.json.`);
    erreurs++;
    continue;
  }
  if (v.appId !== appId) {
    console.error(`✗ Variante "${nom}" : applicationId attendu "${appId}", trouvé "${v.appId}".`);
    erreurs++;
  } else {
    console.log(`✓ ${nom} → ${v.appId}`);
  }
}

const variantesInconnues = Object.keys(variantes).filter((n) => !(n in ATTENDUS));
if (variantesInconnues.length > 0) {
  console.error(`✗ Variante(s) non attendue(s) dans mobile/variants.json : ${variantesInconnues.join(", ")}.`);
  erreurs++;
}

const texteComplet = JSON.stringify(variantes);
for (const ancien of INTERDITS) {
  if (texteComplet.includes(ancien)) {
    console.error(
      `✗ Ancien applicationId "${ancien}" (Play Console historique, application distincte) trouvé dans mobile/variants.json.`,
    );
    erreurs++;
  }
}

if (erreurs > 0) {
  console.error(`\n[check-android-appids] ${erreurs} erreur(s).`);
  process.exit(1);
}
console.log("\n[check-android-appids] Les 5 applicationId sont corrects, aucune ancienne entrée Play Console mélangée.");
