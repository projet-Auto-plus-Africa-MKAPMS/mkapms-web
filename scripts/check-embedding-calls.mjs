#!/usr/bin/env node
/**
 * LOT IA02F — contrôle permanent : aucun appel direct à un fournisseur
 * d'embeddings en dehors de la passerelle unique (server/intelligences/rag.ts
 * ::embeddingGateway). Aujourd'hui aucun fournisseur n'est connecté (repli
 * lexical assumé) — ce script garantit que le jour où un fournisseur est
 * câblé, il ne l'est qu'à cet unique endroit, jamais dispersé dans le code
 * métier (même principe que scripts/check-providers.mjs).
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RACINE = "server";
const IGNORES = new Set(["__tests__", "node_modules"]);
const AUTORISE = join("server", "intelligences", "rag.ts");

const MOTIFS = [/\.embeddings\.create\(/, /text-embedding-/i, /openai\.embeddings/i];

function fichiersTs(dossier) {
  const resultats = [];
  for (const entree of readdirSync(dossier)) {
    if (IGNORES.has(entree)) continue;
    const chemin = join(dossier, entree);
    const stat = statSync(chemin);
    if (stat.isDirectory()) resultats.push(...fichiersTs(chemin));
    else if (extname(entree) === ".ts") resultats.push(chemin);
  }
  return resultats;
}

let violations = 0;
const detail = [];
for (const fichier of fichiersTs(RACINE)) {
  if (fichier === AUTORISE) continue;
  const contenu = readFileSync(fichier, "utf8");
  for (const motif of MOTIFS) {
    if (motif.test(contenu)) {
      violations++;
      detail.push(`${fichier} — ${motif}`);
    }
  }
}

console.log(`external_embedding_direct_calls=${violations}`);
if (detail.length > 0) {
  console.log("Détail :");
  for (const d of detail) console.log(`  - ${d}`);
}
if (violations > 0) {
  console.error("[check-embedding-calls] ÉCHEC : un appel d'embeddings existe hors de la passerelle unique.");
  process.exit(1);
}
console.log("[check-embedding-calls] Aucun appel direct à un fournisseur d'embeddings hors de la passerelle.");
