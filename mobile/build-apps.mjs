#!/usr/bin/env node
/**
 * Produit les paquets Android des applications MKA.P-MS déclarées dans
 * mobile/variants.json — un seul projet, un seul cœur, cinq applications.
 * Chaque variante est un « product flavor » Gradle (android/app/build.gradle) :
 * la tâche à lancer porte donc son nom (ex. bundleProRelease, jamais
 * bundleRelease tout court une fois des flavors déclarés).
 *
 *   node mobile/build-apps.mjs               # les cinq
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
// Reflète exactement la résolution faite par android/app/build.gradle
// (signingForFlavor) : une variable d'environnement présente mais pointant
// vers un fichier absent ne compte pas comme un trousseau valide — sinon cet
// avertissement resterait silencieux alors que Gradle, lui, retombe sur le
// trousseau partagé (ou produit un paquet non signé si celui-ci est, lui
// aussi, absent).
const signaturePartagee = existsSync(join(racine, "android/keystore.properties"))
  || (Boolean(process.env.MKAPMS_KEYSTORE_FILE) && existsSync(process.env.MKAPMS_KEYSTORE_FILE));

// Chaque variante peut retomber sur le trousseau partagé OU utiliser le
// sien (MKAPMS_KEYSTORE_FILE_<FLAVOR>, ex. _COMMAND) — voir
// android/app/build.gradle. Avertir variante par variante plutôt
// qu'une seule fois pour tout le lot : un trousseau dédié manquant pour
// une seule application ne doit pas laisser croire que les quatre autres
// seraient, elles aussi, non signées.
for (const nom of aConstruire) {
  const cheminDedie = process.env[`MKAPMS_KEYSTORE_FILE_${nom.toUpperCase()}`];
  const aSaSignature = Boolean(cheminDedie) && existsSync(cheminDedie);
  if (!signaturePartagee && !aSaSignature) {
    console.warn(
      `[mkapms] ${nom} : aucun trousseau de signature — le paquet produit ne sera PAS publiable sur le Play Store.`,
    );
  }
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
