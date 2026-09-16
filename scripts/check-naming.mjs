/**
 * Garde-fou de nom : aucune régression vers l'ancienne appellation.
 *
 * Le nom officiel du système est désormais MKA.P-MS AI (anciennement
 * « MKA.P-MS Intelligence(s) »). Un renommage manuel revient toujours en
 * arrière au fil des écrans ajoutés : ce contrôle échoue le build dès qu'une
 * chaîne visible réintroduit l'ancienne appellation.
 *
 * Ce qui reste toléré :
 *  - le journal historique des livraisons (server/intelligences/livraisons.ts)
 *    et les fichiers générés à partir de sources déjà corrigées
 *    (server/data/moteurs.ts) : réécrire l'historique serait mentir sur ce
 *    qui a réellement été livré sous l'ancien nom ;
 *  - le texte des règles qui citent explicitement l'ancien nom pour
 *    documenter la migration.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RACINES = ["client/src", "server", "shared"];
const EXTENSIONS = new Set([".ts", ".tsx"]);

// Ancienne appellation refusée, en tant que chaîne visible.
const MOTIFS = [/MKA\.P-MS Intelligences?\b/g];

const FICHIERS_TOLERES = [
  "server/intelligences/livraisons.ts",
  "server/data/moteurs.ts",
];

const TOLERE = [
  // Les règles et consignes de migration citent l'ancien nom pour le documenter.
  /check-naming/,
  /ancien nom/i,
  /anciennement/i,
  /renommage/i,
];

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
    if (FICHIERS_TOLERES.includes(complet)) continue;
    const lignes = readFileSync(complet, "utf8").split("\n");
    lignes.forEach((ligne, i) => {
      if (TOLERE.some((t) => t.test(ligne))) return;
      for (const motif of MOTIFS) {
        motif.lastIndex = 0;
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
    `\n[nom] ${fautes.length} occurrence(s) de l'ancienne appellation « MKA.P-MS Intelligence(s) » restante(s). Le nom officiel est désormais « MKA.P-MS AI » :\n`,
  );
  for (const f of fautes) console.error(`  ${f}`);
  console.error("\nRemplace l'appellation par « MKA.P-MS AI ».\n");
  process.exit(1);
}

console.log("[nom] Aucune régression vers l'ancien nom : « MKA.P-MS AI » respecté.");
