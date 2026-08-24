/**
 * Inventaire des routes client — génération et contrôle de fraîcheur.
 *
 * Le Moteur de Redirection et l'auto-réparation des 404 valident une
 * destination contre `server/data/client-routes.ts`. Tant que ce fichier était
 * un instantané recopié à la main, une route ajoutée dans App.tsx restait
 * invisible : le moteur refusait de rediriger vers une page qui existait
 * pourtant. Ce script régénère l'inventaire depuis App.tsx.
 *
 *   node scripts/gen-client-routes.mjs          → écrit le fichier
 *   node scripts/gen-client-routes.mjs --check  → échoue si l'inventaire est périmé
 */
import { readFileSync, writeFileSync } from "node:fs";

const SOURCE = "client/src/App.tsx";
const CIBLE = "server/data/client-routes.ts";

const app = readFileSync(SOURCE, "utf8");
const routes = new Set();
const motifs = new Set();
for (const m of app.matchAll(/<Route\s+[^>]*path="([^"]+)"/g)) {
  const p = m[1].trim();
  if (!p.startsWith("/")) continue;
  if (p.includes("*")) continue;
  const propre = p.replace(/\/+$/, "") || "/";
  // Une route à segment dynamique (/vehicule/:id) est une page réelle : sans
  // elle, le moteur considérait comme inexistante toute fiche véhicule ou
  // page ville, et refusait de rediriger vers elles.
  // Un motif dont le premier segment est dynamique (/:pays/:ville) accepterait
  // n'importe quel chemin : il ne prouve pas qu'une page existe.
  if (propre.includes(":")) {
    if (!propre.split("/")[1]?.startsWith(":")) motifs.add(propre);
  }
  else routes.add(propre);
}

const triees = [...routes].sort();
const motifsTries = [...motifs].sort();
const contenu = `/**
 * Liste des routes CLIENT valides.
 *
 * Fichier GÉNÉRÉ par scripts/gen-client-routes.mjs depuis client/src/App.tsx.
 * Ne pas éditer à la main : \`npm run gen:routes\` le régénère, et la
 * construction échoue s'il est périmé.
 *
 * Sert au Moteur de Redirection et au Système Intelligent pour VALIDER une
 * destination avant de créer une règle : on ne redirige que vers une page qui
 * existe réellement.
 */
export const CLIENT_ROUTES: readonly string[] = [
${triees.map((r) => `  ${JSON.stringify(r)},`).join("\n")}
];

/** Routes à segment dynamique (/vehicule/:id, /ville/:slug…). */
export const CLIENT_ROUTE_PATTERNS: readonly string[] = [
${motifsTries.map((r) => `  ${JSON.stringify(r)},`).join("\n")}
];

const ROUTE_SET = new Set(CLIENT_ROUTES);

const PATTERN_REGEX = CLIENT_ROUTE_PATTERNS.map((motif) => {
  const source = motif
    .split("/")
    .slice(1)
    .map((seg) => {
      if (seg.startsWith(":")) {
        return seg.endsWith("?") ? "(?:/[^/]+)?" : "/[^/]+";
      }
      return "/" + seg.replace(/[^a-zA-Z0-9_-]/g, (c) => "\\\\" + c);
    })
    .join("");
  return new RegExp("^" + source + "$");
});

function normaliser(path: string): string {
  return path.split("?")[0].split("#")[0].replace(/\\/+$/, "") || "/";
}

/** Vrai si le chemin correspond à une route client concrète existante. */
export function isKnownRoute(path: string): boolean {
  return ROUTE_SET.has(normaliser(path));
}

/**
 * Vrai si le chemin correspond à une page réelle, y compris une page à
 * paramètre (fiche véhicule, page ville, fiche garage…).
 */
export function isRoutablePath(path: string): boolean {
  const p = normaliser(path);
  if (ROUTE_SET.has(p)) return true;
  return PATTERN_REGEX.some((re) => re.test(p));
}
`;

const check = process.argv.includes("--check");
const actuel = readFileSync(CIBLE, "utf8");

if (check) {
  if (actuel !== contenu) {
    const anciennes = new Set(
      [...actuel.matchAll(/^  "([^"]+)",$/gm)].map((m) => m[1]),
    );
    const attendues = new Set([...triees, ...motifsTries]);
    const ajoutees = [...attendues].filter((r) => !anciennes.has(r));
    const retirees = [...anciennes].filter((r) => !attendues.has(r));
    console.error(`Inventaire des routes périmé (${CIBLE}).`);
    if (ajoutees.length) console.error(`  Routes absentes de l'inventaire : ${ajoutees.join(", ")}`);
    if (retirees.length) console.error(`  Routes disparues d'App.tsx : ${retirees.join(", ")}`);
    console.error("  Lancer : npm run gen:routes");
    process.exit(1);
  }
  console.log(`Inventaire des routes à jour (${triees.length} routes).`);
} else {
  writeFileSync(CIBLE, contenu);
  console.log(`Inventaire régénéré : ${triees.length} routes → ${CIBLE}`);
}
