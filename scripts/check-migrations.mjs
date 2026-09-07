/**
 * Garde-fou migrations — cohérence du journal Drizzle.
 *
 * Drizzle n'applique une migration que si son `when` est supérieur au
 * `created_at` de la dernière migration enregistrée en base. Deux défauts
 * ont donc rendu des dizaines de tables inexistantes en production sans
 * qu'aucun build n'échoue :
 *  - un fichier SQL présent sur le disque mais absent du journal ;
 *  - un `when` inférieur à celui d'une entrée précédente (jamais appliqué).
 *
 * Ce contrôle casse le build dans ces deux cas, et quand une entrée du
 * journal ne correspond à aucun fichier.
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DOSSIER = "drizzle";
const journal = JSON.parse(
  readFileSync(join(DOSSIER, "meta", "_journal.json"), "utf8"),
);

const erreurs = [];
const tags = new Set();
let precedent = 0;

for (const entree of journal.entries) {
  if (tags.has(entree.tag)) erreurs.push(`entrée dupliquée : ${entree.tag}`);
  tags.add(entree.tag);
  if (!existsSync(join(DOSSIER, `${entree.tag}.sql`)))
    erreurs.push(`fichier absent pour l'entrée du journal : ${entree.tag}.sql`);
  if (typeof entree.when !== "number" || entree.when <= precedent)
    erreurs.push(
      `ordre "when" cassé : ${entree.tag} (${entree.when}) ≤ précédent (${precedent}) — Drizzle ne l'appliquera jamais`,
    );
  precedent = Math.max(precedent, entree.when);
}

for (const fichier of readdirSync(DOSSIER)) {
  if (!fichier.endsWith(".sql")) continue;
  const tag = fichier.slice(0, -4);
  if (!tags.has(tag))
    erreurs.push(`migration hors journal : ${fichier} (jamais appliquée)`);
}

if (erreurs.length) {
  console.error(`[check:migrations] ${erreurs.length} défaut(s) :`);
  for (const e of erreurs) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(
  `[check:migrations] ${journal.entries.length} migrations journalisées, ordre cohérent.`,
);
