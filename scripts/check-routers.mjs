/**
 * Garde-fou de démarrage : tRPC refuse `then`, `call` et `apply` comme noms de
 * procédure, mais l'erreur n'apparaît qu'à l'exécution du serveur — la
 * compilation passe, le conteneur démarre puis meurt. Ce contrôle fait échouer
 * la construction tout de suite, avant la mise en ligne.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const RESERVED = ["then", "call", "apply"];
const PATTERN = new RegExp(`^\\s*(${RESERVED.join("|")})\\s*:\\s*\\w*Procedure\\b`);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const problems = [];
for (const file of walk("server")) {
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, i) => {
    const m = PATTERN.exec(line);
    if (m) problems.push(`${file}:${i + 1} — procédure « ${m[1]} » : nom réservé par tRPC.`);
  });
}

if (problems.length > 0) {
  console.error("Noms de procédure interdits (le serveur refuserait de démarrer) :");
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}
console.log("Routers tRPC : aucun nom réservé.");
