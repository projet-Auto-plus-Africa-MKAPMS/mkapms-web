/**
 * Garde-fou d'identité : aucune donnée personnelle de la direction (prénom,
 * nom, adresse e-mail personnelle, numéro personnel) ne doit apparaître dans
 * le code — ni en exemple de saisie, ni en donnée de démonstration, ni en
 * texte visible. L'identité du PDG appartient à la base Identity OS, pas aux
 * écrans.
 *
 * Le contrôle casse le build dès qu'un fichier client, serveur ou partagé
 * contient l'un des motifs interdits. Les fichiers générés (`server/data`) et
 * les tests sont parcourus aussi : une fuite y serait tout autant publiée.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RACINES = ["client/src", "server", "shared", "scripts"];
const EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".js", ".html"]);

// Motifs refusés partout, quelle que soit la casse.
const MOTIFS = [
  /\bmoussa\b/i,
  /\bkonat[eé]\b/i,
  /moussa[._-]?[a-z]*@/i,
];

// Le garde-fou cite lui-même les motifs qu'il interdit.
const FICHIERS_TOLERES = new Set(["scripts/check-identite.mjs"]);

const fautes = [];

function parcourir(chemin) {
  for (const entree of readdirSync(chemin)) {
    if (entree === "node_modules" || entree.startsWith(".")) continue;
    const complet = join(chemin, entree);
    if (statSync(complet).isDirectory()) {
      parcourir(complet);
      continue;
    }
    if (!EXTENSIONS.has(extname(complet))) continue;
    if (FICHIERS_TOLERES.has(complet)) continue;
    const lignes = readFileSync(complet, "utf8").split("\n");
    lignes.forEach((ligne, i) => {
      for (const motif of MOTIFS) {
        if (motif.test(ligne)) {
          fautes.push(`${complet}:${i + 1} — ${ligne.trim().slice(0, 140)}`);
          return;
        }
      }
    });
  }
}

for (const racine of RACINES) parcourir(racine);

if (fautes.length > 0) {
  console.error(
    `\n[identité] ${fautes.length} occurrence(s) d'une donnée personnelle de la direction dans le code :\n`,
  );
  for (const f of fautes) console.error(`  ${f}`);
  console.error(
    "\nRemplace par un libellé neutre (« Votre prénom », « Direction (PDG) », « votre@email.com »). L'identité réelle vient d'Identity OS, jamais du code.\n",
  );
  process.exit(1);
}

console.log("[identité] Aucune donnée personnelle de la direction dans le code.");
