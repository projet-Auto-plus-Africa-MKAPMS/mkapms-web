/**
 * Point 129 — interdiction d'appeler un fournisseur de modèle en direct.
 *
 * Un moteur métier demande une **capacité** à `server/intelligences/routeur.ts`.
 * Il ne connaît ni l'URL, ni la clé, ni le nom du fournisseur : sinon changer de
 * fournisseur devient impossible, et la confidentialité comme le coût cessent
 * d'être contrôlables.
 *
 * Ce contrôle échoue le build si un fichier hors de la couche autorisée touche
 * une adresse de fournisseur ou une clé de modèle.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RACINES = ["client/src", "server", "shared"];
const EXTENSIONS = new Set([".ts", ".tsx"]);

// Seuls ces fichiers ont le droit de parler à un fournisseur de modèle.
const AUTORISES = new Set([
  join("server", "intelligences", "provider.ts"),
  // La Fabrique possède le catalogue : elle nomme les fournisseurs et leurs clés
  // pour constater leur état, sans jamais émettre l'appel du modèle.
  join("server", "ai-fabric", "service.ts"),
  join("server", "env.ts"),
]);

const INTERDITS = [
  { motif: /api\.openai\.com/, quoi: "adresse OpenAI" },
  { motif: /api\.anthropic\.com/, quoi: "adresse Anthropic" },
  { motif: /api\.mistral\.ai/, quoi: "adresse Mistral" },
  { motif: /generativelanguage\.googleapis\.com/, quoi: "adresse Google" },
  { motif: /OPENAI_API_KEY/, quoi: "clé OpenAI" },
  { motif: /ANTHROPIC_API_KEY/, quoi: "clé Anthropic" },
  { motif: /MISTRAL_API_KEY/, quoi: "clé Mistral" },
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
    if (AUTORISES.has(complet)) continue;
    const lignes = readFileSync(complet, "utf8").split("\n");
    lignes.forEach((ligne, i) => {
      if (/check-providers/.test(ligne)) return;
      for (const { motif, quoi } of INTERDITS) {
        if (motif.test(ligne)) {
          fautes.push(`${complet}:${i + 1} — ${quoi} : ${ligne.trim().slice(0, 120)}`);
          return;
        }
      }
    });
  }
}

for (const racine of RACINES) parcourir(racine);

if (fautes.length > 0) {
  console.error(
    `\n[fournisseurs] ${fautes.length} appel direct à un fournisseur de modèle hors de la couche autorisée :\n`,
  );
  for (const f of fautes) console.error(`  ${f}`);
  console.error(
    "\nPasse par server/intelligences/routeur.ts (demande de capacité). La couche fournisseur reste server/intelligences/provider.ts.\n",
  );
  process.exit(1);
}

console.log("[fournisseurs] Aucun appel direct : le routage des capacités est respecté.");
