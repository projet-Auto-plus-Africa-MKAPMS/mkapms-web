/**
 * LOT IA02A — garde-fou : aucune interface publique ou utilisateur ne doit
 * nommer un fournisseur de modèle externe, son modèle, sa variable
 * d'environnement ou son URL.
 *
 * Distinct de scripts/check-providers.mjs (qui interdit un appel réseau
 * direct à un fournisseur) et de scripts/check-naming.mjs (qui interdit les
 * mots « IA »/« AI » comme nom de produit) : ce script cherche des noms de
 * marque et des détails techniques dans le code CLIENT, avec une liste
 * blanche explicite et motivée pour les écrans réellement réservés à la
 * direction (ils ont le droit de connaître le fournisseur, voir la
 * correction du PDG dans le chantier maître Intelligence).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RACINE = "client/src";
const EXTENSIONS = new Set([".ts", ".tsx"]);

/**
 * Écrans/composants de direction, backés par une procédure tRPC réservée
 * (pdgProcedure) : le détail fournisseur y est un choix assumé, pas une
 * fuite. Toute nouvelle exception doit être motivée ici, jamais ajoutée en
 * silence.
 */
const LISTE_BLANCHE = new Set([
  join("client", "src", "components", "IaConfigWarning.tsx"), // Centre Commandes / Centre Intelligence & Coûts, backé par configStatusDirection (pdgProcedure)
  join("client", "src", "pages", "CentreIA.tsx"), // écran direction — /admin/ia-couts
  join("client", "src", "pages", "CentreCommandes.tsx"), // écran direction — /admin/commandes
  join("client", "src", "lib", "vehicleData.ts"), // "Mistral" y est un modèle utilitaire Renault, pas le fournisseur
]);

const MOTIFS = [
  { motif: /\bopenai\b/i, quoi: "nom fournisseur (OpenAI)" },
  { motif: /\banthropic\b/i, quoi: "nom fournisseur (Anthropic)" },
  { motif: /\bmistral\s+ai\b/i, quoi: "nom fournisseur (Mistral AI)" },
  { motif: /\bgpt[-\s]?\d/i, quoi: "identifiant modèle (GPT-x)" },
  { motif: /_API_KEY\b/, quoi: "variable d'environnement de clé fournisseur" },
  { motif: /\bLOCAL_LLM_URL\b/, quoi: "variable d'environnement de modèle local" },
  { motif: /platform\.openai\.com/i, quoi: "URL fournisseur (OpenAI)" },
  { motif: /console\.mistral\.ai/i, quoi: "URL fournisseur (Mistral)" },
];

const fautes = { noms: [], env: [], urls: [] };

function categorie(quoi) {
  if (quoi.startsWith("variable")) return "env";
  if (quoi.startsWith("URL")) return "urls";
  return "noms";
}

function parcourir(chemin) {
  for (const entree of readdirSync(chemin)) {
    if (entree === "node_modules" || entree.startsWith(".")) continue;
    const complet = join(chemin, entree);
    if (statSync(complet).isDirectory()) {
      parcourir(complet);
      continue;
    }
    if (!EXTENSIONS.has(extname(complet))) continue;
    if (LISTE_BLANCHE.has(complet)) continue;
    const lignes = readFileSync(complet, "utf8").split("\n");
    lignes.forEach((ligne, i) => {
      for (const { motif, quoi } of MOTIFS) {
        if (motif.test(ligne)) {
          fautes[categorie(quoi)].push(`${complet}:${i + 1} — ${quoi} : ${ligne.trim().slice(0, 140)}`);
          return;
        }
      }
    });
  }
}

parcourir(RACINE);

const total = fautes.noms.length + fautes.env.length + fautes.urls.length;

console.log(`public_provider_names_visible=${fautes.noms.length}`);
console.log(`public_provider_env_names=${fautes.env.length}`);
console.log(`public_provider_urls=${fautes.urls.length}`);

if (total > 0) {
  console.error(`\n[fuites-fournisseurs-public] ${total} occurrence(s) hors liste blanche :\n`);
  for (const f of [...fautes.noms, ...fautes.env, ...fautes.urls]) console.error(`  ${f}`);
  console.error(
    "\nSi l'écran est réellement réservé à la direction et backé par une procédure pdgProcedure, ajoute-le à LISTE_BLANCHE avec le motif exact. Sinon, retire le détail fournisseur de l'interface.\n",
  );
  process.exit(1);
}

console.log("[fuites-fournisseurs-public] Aucune occurrence hors liste blanche.");
