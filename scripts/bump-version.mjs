#!/usr/bin/env node
/**
 * Version unique de la plateforme et des trois applications.
 *
 * Une livraison qui ajoute une fonctionnalité doit faire monter la version :
 * sans cela, le site, l'application grand public, PRO et COMMAND affichent un
 * numéro qui ne correspond plus à ce qui tourne, et l'écran « Version & mise à
 * jour » ne peut plus prouver qu'un appareil est à jour.
 *
 * Source unique : le champ "version" de package.json. Le client l'injecte au
 * build (__APP_VERSION__), le serveur le sert sur /api/version, et Android en
 * dérive versionName + versionCode (voir android/app/build.gradle).
 *
 * Usage : node scripts/bump-version.mjs [patch|minor|major]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const niveaux = ["patch", "minor", "major"];
const niveau = process.argv[2] ?? "patch";
if (!niveaux.includes(niveau)) {
  console.error(`Niveau inconnu : ${niveau}. Attendu : ${niveaux.join(", ")}.`);
  process.exit(1);
}

const racine = join(dirname(fileURLToPath(import.meta.url)), "..");
const chemin = join(racine, "package.json");
const brut = readFileSync(chemin, "utf8");
const pkg = JSON.parse(brut);
const parts = String(pkg.version).split(".").map((n) => Number.parseInt(n, 10));
if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
  console.error(`Version illisible dans package.json : ${pkg.version}`);
  process.exit(1);
}

let [major, minor, patch] = parts;
if (niveau === "major") {
  major += 1;
  minor = 0;
  patch = 0;
} else if (niveau === "minor") {
  minor += 1;
  patch = 0;
} else {
  patch += 1;
}

const suivante = `${major}.${minor}.${patch}`;
writeFileSync(chemin, brut.replace(`"version": "${pkg.version}"`, `"version": "${suivante}"`));
console.log(`Version ${pkg.version} → ${suivante} (versionCode Android ${major * 10000 + minor * 100 + patch}).`);
