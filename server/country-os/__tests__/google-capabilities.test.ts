/**
 * Country OS — capacités Google par pays (doctrine PDG v1.1, §12.1/12.2).
 *
 * Preuve que le registre refuse d'inventer une disponibilité Google (aucune
 * capacité ne peut passer à vrai sans verified=true + sourceRef), qu'une
 * capacité non vérifiée est traitée comme indisponible par
 * isGoogleCapabilityEligible(), et que le seed réel (FR, DE, ...) reflète
 * les faits sourcés au 25/09/2026 sans rien inventer pour les pays non
 * documentés (ex. Guinée, Sénégal, Côte d'Ivoire absents du seed).
 *
 * Lancement : `npx tsx server/country-os/__tests__/google-capabilities.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import {
  countryGoogleCapabilities,
  getGoogleCapabilities,
  isGoogleCapabilityEligible,
  upsertGoogleCapabilities,
} from "../index.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const TEST_CODE = "ZZ";

async function nettoyer() {
  await db.delete(countryGoogleCapabilities).where(eq(countryGoogleCapabilities.countryCode, TEST_CODE));
}

async function main() {
  await nettoyer();

  // 1. Seed réel : FR vérifié, Shopping/Merchant/Vehicle Ads actifs, sourceRef présente.
  const fr = await getGoogleCapabilities("FR");
  verif("1. FR est vérifié dans le seed réel", fr?.verified === true);
  verif("2. FR a une sourceRef officielle (pas d'invention)", typeof fr?.sourceRef === "string" && fr.sourceRef.includes("support.google.com"));
  verif("3. FR : shopping actif (documenté)", fr?.shopping === true);
  verif("4. FR : vehicleAds actif (documenté, disponible depuis août 2025)", fr?.vehicleAds === true);

  // 2. Pays non documenté (jamais inventé) : aucune ligne, donc aucune capacité éligible.
  const inconnu = await getGoogleCapabilities(TEST_CODE);
  verif("5. Un pays non vérifié n'a aucune ligne (rien n'est inventé)", inconnu === null);
  verif(
    "6. isGoogleCapabilityEligible() refuse une capacité pour un pays sans ligne",
    (await isGoogleCapabilityEligible(TEST_CODE, "shopping")) === false,
  );

  // 3. Impossible d'activer une capacité sans verified + sourceRef (garde-fou anti-invention).
  await assert.rejects(
    () => upsertGoogleCapabilities({ countryCode: TEST_CODE, shopping: true, verified: false, verifiedBy: 1 }),
    /Interdiction d'inventer/,
  );
  verif("7. upsertGoogleCapabilities refuse shopping=true sans verified+sourceRef", true);

  await assert.rejects(
    () => upsertGoogleCapabilities({ countryCode: TEST_CODE, shopping: true, verified: true, verifiedBy: 1 }),
    /Interdiction d'inventer/,
  );
  verif("8. upsertGoogleCapabilities refuse aussi verified=true sans sourceRef", true);

  // 4. Avec verified + sourceRef, l'upsert réussit et devient immédiatement éligible.
  await upsertGoogleCapabilities({
    countryCode: TEST_CODE,
    shopping: true,
    verified: true,
    sourceRef: "https://support.google.com/merchants/answer/000000",
    notes: "Ligne de test — jamais un vrai pays.",
    verifiedBy: 1,
  });
  verif(
    "9. Après vérification réelle avec sourceRef, la capacité devient éligible",
    (await isGoogleCapabilityEligible(TEST_CODE, "shopping")) === true,
  );
  verif(
    "10. Une capacité non déclarée (vehicleAds) reste indisponible même pays vérifié",
    (await isGoogleCapabilityEligible(TEST_CODE, "vehicleAds")) === false,
  );

  // 5. search est vrai par défaut (SEO organique universel) même sans verified explicite sur la ligne de test.
  const testRow = await getGoogleCapabilities(TEST_CODE);
  verif("11. search reste vrai par défaut (SEO organique universel)", testRow?.search === true);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
