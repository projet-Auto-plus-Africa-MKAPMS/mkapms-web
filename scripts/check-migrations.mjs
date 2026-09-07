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
 * Ce contrôle casse le build dans ces deux cas, quand une entrée du
 * journal ne correspond à aucun fichier, et quand une migration modifie
 * (ALTER / INDEX / INSERT / UPDATE) une table qu'aucune migration précédente
 * n'a créée hors d'un bloc `DO $$` conditionnel : Drizzle exécute toute la
 * série pendante dans une seule transaction, une seule référence en avance
 * annule donc toutes les migrations suivantes.
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

const creees = new Set();
for (const entree of journal.entries) {
  const chemin = join(DOSSIER, `${entree.tag}.sql`);
  if (!existsSync(chemin)) continue;
  const sql = readFileSync(chemin, "utf8")
    .replace(/--[^\n]*/g, "")
    .replace(/DO \$\$[\s\S]*?\$\$;?/gi, "");
  const nouvelles = [...sql.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+"?([a-z_0-9]+)"?/gi)].map((m) => m[1].toLowerCase());
  const references = [
    ...sql.matchAll(
      /(?:ALTER TABLE(?:\s+IF EXISTS)?(?:\s+ONLY)?|CREATE(?:\s+UNIQUE)?\s+INDEX(?:\s+IF NOT EXISTS)?\s+"?[a-z_0-9]+"?\s+ON|INSERT INTO|UPDATE|DELETE FROM)\s+"?([a-z_0-9]+)"?/gi,
    ),
  ].map((m) => m[1].toLowerCase());
  for (const table of references) {
    if (creees.has(table) || nouvelles.includes(table)) continue;
    erreurs.push(
      `${entree.tag} modifie « ${table} » avant toute création (table créée plus tard ou jamais) — la série entière échouerait`,
    );
  }
  for (const t of nouvelles) creees.add(t);
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
