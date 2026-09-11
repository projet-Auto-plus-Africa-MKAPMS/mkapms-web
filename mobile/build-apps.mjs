#!/usr/bin/env node
/**
 * Produit les paquets Android des applications MKA.P-MS déclarées dans
 * mobile/variants.json — un seul projet, un seul cœur, quatre applications.
 * Chaque variante est un « product flavor » Gradle (android/app/build.gradle) :
 * la tâche à lancer porte donc son nom (ex. bundleProRelease, jamais
 * bundleRelease tout court une fois des flavors déclarés).
 *
 *   node mobile/build-apps.mjs               # les quatre
 *   node mobile/build-apps.mjs pro           # une seule
 *   MOBILE_APP_URL=https://staging… node mobile/build-apps.mjs
 *
 * Les paquets signés arrivent dans mobile/dist/. La signature exige un trousseau
 * fourni hors du dépôt (android/keystore.properties ou MKAPMS_KEYSTORE_*) : sans
 * lui, Gradle produit un paquet non signé et on le dit au lieu de le présenter
 * comme publiable.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const racine = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const variantes = JSON.parse(readFileSync(join(racine, "mobile/variants.json"), "utf8"));
const demandees = process.argv.slice(2);

for (const nom of demandees) {
  if (!variantes[nom]) {
    console.error(
      `Variante inconnue : « ${nom} ». Variantes déclarées : ${Object.keys(variantes).join(", ")}.`,
    );
    process.exit(1);
  }
}

const aConstruire = demandees.length > 0 ? demandees : Object.keys(variantes);
const signature = existsSync(join(racine, "android/keystore.properties"))
  || Boolean(process.env.MKAPMS_KEYSTORE_FILE);

if (!signature) {
  console.warn(
    "[mkapms] Aucun trousseau de signature : les paquets produits ne seront PAS publiables sur le Play Store.",
  );
}

const sortie = join(racine, "mobile/dist");
mkdirSync(sortie, { recursive: true });

const lancer = (commande, args, env = {}, cwd = racine) =>
  execFileSync(commande, args, {
    cwd,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });

const majuscule = (nom) => nom.charAt(0).toUpperCase() + nom.slice(1);

for (const nom of aConstruire) {
  const v = variantes[nom];
  const flavor = majuscule(nom);
  console.log(`\n[mkapms] ${v.appName} — ${v.appId} (diffusion ${v.distribution})`);

  lancer("npx", ["cap", "sync", "android"], { MOBILE_APP_VARIANT: nom });
  lancer(
    "./gradlew",
    [`bundle${flavor}Release`, `assemble${flavor}Release`],
    { MOBILE_APP_VARIANT: nom },
    join(racine, "android"),
  );

  for (const [source, cible] of [
    [`android/app/build/outputs/bundle/${nom}Release/app-${nom}-release.aab`, `${v.appId}.aab`],
    [`android/app/build/outputs/apk/${nom}/release/app-${nom}-release.apk`, `${v.appId}.apk`],
  ]) {
    if (existsSync(join(racine, source))) {
      copyFileSync(join(racine, source), join(sortie, cible));
      console.log(`[mkapms] → mobile/dist/${cible}`);
    }
  }
}
