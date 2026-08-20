/**
 * Point 123 — garde-fou de nom : aucune appellation « IA » / « AI » visible.
 *
 * Le nom officiel du système est MKA.P-MS Intelligence. Un renommage manuel
 * revient toujours en arrière au fil des écrans ajoutés : ce contrôle échoue le
 * build dès qu'une chaîne visible réintroduit l'ancienne appellation.
 *
 * Ce qui reste autorisé, parce que ce ne sont pas des noms MKA.P-MS :
 *  - les marques de fournisseurs (« Mistral AI », « OpenAI ») ;
 *  - les clés internes et identifiants techniques (ai_fabric, ia_texte…) ;
 *  - le texte des règles qui interdisent justement ces mots.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RACINES = ["client/src", "server", "shared"];
const EXTENSIONS = new Set([".ts", ".tsx"]);

// Appellations refusées, en tant que mot isolé.
const MOTIFS = [/\bIA\b/g, /\bAI\b/g, /intelligence artificielle/gi];

// Un mot isolé peut appartenir à un tiers ou à une phrase de règle : on
// n'accuse pas une ligne qui contient l'une de ces marques.
const TOLERE = [
  /Mistral AI/,
  /OpenAI/,
  /Google AI/,
  /Adobe/,
  /\bAI Act\b/,
  /EU AI Act/,
  // Les règles et consignes du moteur citent les mots interdits pour les interdire.
  /N'emploie pas les mots/,
  /Aucune mention/,
  /appellation/i,
  /check-naming/,
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
    `\n[nom] ${fautes.length} appellation(s) « IA » / « AI » restante(s). Le nom officiel est « MKA.P-MS Intelligence » :\n`,
  );
  for (const f of fautes) console.error(`  ${f}`);
  console.error(
    "\nRemplace l'appellation par « MKA.P-MS Intelligence » (ou « Intelligence » dans un titre déjà préfixé).\n",
  );
  process.exit(1);
}

console.log("[nom] Aucune appellation « IA » / « AI » : nom officiel respecté.");
