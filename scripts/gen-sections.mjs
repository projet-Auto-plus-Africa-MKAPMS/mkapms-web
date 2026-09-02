/**
 * Inventaire des sections sans page d'accueil — génération et contrôle.
 *
 * Des centaines d'écrans vivent sous un préfixe (/labs/…, /operations/…) dont
 * la page d'accueil n'existe pas : chacun affiche un lien « Retour » vers une
 * page introuvable, et aucun visiteur ne peut atteindre la section. Ce script
 * relève ces sections depuis App.tsx, avec le titre réel de chaque écran et
 * s'il est encore vide (gabarit « Module … » sans contenu).
 *
 *   node scripts/gen-sections.mjs          → écrit le fichier
 *   node scripts/gen-sections.mjs --check  → échoue si l'inventaire est périmé
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SOURCE = "client/src/App.tsx";
const CIBLE = "shared/sections.ts";
const SEUIL_SECTION = 3;
const TITRES = {
  "/automatisations": "Automatisations",
  "/communaute": "Communauté",
  "/conformite": "Conformité",
  "/corporate": "L'entreprise MKA.P-MS",
  "/entreprises": "Entreprises et flottes",
  "/expansion": "Expansion internationale",
  "/formations": "Formations",
  "/ia": "MKA.P-MS Intelligences",
  "/international": "International",
  "/labs": "Laboratoires MKA.P-MS",
  "/marketing": "Marketing",
  "/mobile": "Applications mobiles",
  "/operations": "Opérations",
  "/pro": "Espace professionnel",
  "/recrutement": "Recrutement",
};

const app = readFileSync(SOURCE, "utf8");

const fichierParComposant = new Map();
for (const m of app.matchAll(
  /const\s+(\w+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\("\.\/([^"]+)"\)/g,
)) {
  const base = `client/src/${m[2]}`;
  const fichier = [base, `${base}.tsx`, `${base}.ts`, `${base}/index.tsx`].find((f) =>
    existsSync(f),
  );
  if (fichier) fichierParComposant.set(m[1], fichier);
}

const routes = [];
const avecIndex = new Set();
// Une route joker (`/admin/*`) gère elle-même ses sous-chemins : la section a
// déjà sa page d'accueil.
for (const m of app.matchAll(/<Route\s+[^>]*path="([^"]*\*[^"]*)"/g)) {
  const base = m[1].replace(/\/?\*+$/, "").replace(/\/+$/, "");
  if (base) avecIndex.add("/" + base.split("/").filter(Boolean)[0]);
}
for (const m of app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{([\s\S]*?)\}\s*\/>/g)) {
  const chemin = m[1].trim();
  if (!chemin.startsWith("/") || chemin.includes(":") || chemin.includes("*")) continue;
  const propre = chemin.replace(/\/+$/, "") || "/";
  const segments = propre.split("/").filter(Boolean);
  const composant = [...m[2].matchAll(/<(\w+)\s*\/>/g)].map((c) => c[1]).pop() ?? null;
  // La page d'accueil générique (SectionAccueil) est alimentée par ce fichier :
  // la compter comme « section déjà pourvue » viderait l'inventaire dès qu'elle
  // est branchée, et la section redeviendrait un sommaire vide.
  if (segments.length <= 1 && composant !== "SectionAccueil")
    avecIndex.add("/" + (segments[0] ?? ""));
  if (segments.length === 2) routes.push({ chemin: propre, prefixe: "/" + segments[0], composant });
}

function titreEcran(fichier, chemin) {
  if (fichier && existsSync(fichier)) {
    const src = readFileSync(fichier, "utf8");
    const h1 = src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (h1) {
      const texte = h1[1]
        .replace(/<[^>]*>/g, " ")
        .replace(/\{[^{}]*\}/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      // Un titre d'écran non connecté (« Connectez-vous pour… ») décrit l'état
      // du visiteur, pas la section : le chemin est plus fiable.
      if (texte.length >= 3 && texte.length <= 48 && !/connect/i.test(texte)) return texte;
    }
  }
  const slug = chemin.split("/").pop() ?? "";
  return slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/**
 * Un écran est vide quand il n'affiche que son titre et le gabarit
 * « Module … » : le déclarer prêt serait un mensonge de plus.
 */
function estVide(fichier) {
  if (!fichier || !existsSync(fichier)) return false;
  const src = readFileSync(fichier, "utf8");
  return /<p[^>]*>\s*Module [^<]*<\/p>/.test(src) && src.length < 2500;
}

const parPrefixe = new Map();
for (const r of routes) {
  if (avecIndex.has(r.prefixe)) continue;
  if (!parPrefixe.has(r.prefixe)) parPrefixe.set(r.prefixe, []);
  parPrefixe.get(r.prefixe).push(r);
}

const sections = [];
for (const [prefixe, entrees] of [...parPrefixe].sort((a, b) => a[0].localeCompare(b[0]))) {
  if (entrees.length < SEUIL_SECTION) continue;
  const liste = entrees
    .map((r) => {
      const fichier = r.composant ? (fichierParComposant.get(r.composant) ?? null) : null;
      return {
        chemin: r.chemin,
        titre: titreEcran(fichier, r.chemin),
        vide: estVide(fichier),
      };
    })
    .sort((a, b) => a.titre.localeCompare(b.titre, "fr"));
  sections.push({
    prefixe,
    titre:
      TITRES[prefixe] ?? prefixe.slice(1).replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
    entrees: liste,
  });
}

const totalEcrans = sections.reduce((n, s) => n + s.entrees.length, 0);
const totalVides = sections.reduce((n, s) => n + s.entrees.filter((e) => e.vide).length, 0);

const contenu = `/**
 * Sommaire des sections dont la page d'accueil est générique, et état réel
 * de leurs écrans.
 *
 * Fichier GÉNÉRÉ par scripts/gen-sections.mjs depuis client/src/App.tsx.
 * Ne pas éditer à la main : \`npm run gen:sections\` le régénère, et la
 * construction échoue s'il est périmé.
 *
 * Sert à deux choses : rendre la section atteignable (page d'accueil réelle
 * listant ses écrans), et dire au Système Intelligent combien d'écrans sont
 * encore des gabarits vides au lieu de les compter comme livrés.
 */
export interface EntreeSection {
  readonly chemin: string;
  readonly titre: string;
  /** Gabarit « Module … » : l'écran existe mais n'affiche aucun contenu. */
  readonly vide: boolean;
}

export interface SectionSommaire {
  readonly prefixe: string;
  readonly titre: string;
  readonly entrees: readonly EntreeSection[];
}

export const SECTIONS_SOMMAIRE: readonly SectionSommaire[] = [
${sections
  .map(
    (s) => `  {
    prefixe: ${JSON.stringify(s.prefixe)},
    titre: ${JSON.stringify(s.titre)},
    entrees: [
${s.entrees
  .map(
    (e) =>
      `      { chemin: ${JSON.stringify(e.chemin)}, titre: ${JSON.stringify(e.titre)}, vide: ${e.vide} },`,
  )
  .join("\n")}
    ],
  },`,
  )
  .join("\n")}
];

export const SECTIONS_ECRANS_TOTAL = ${totalEcrans};
export const SECTIONS_ECRANS_VIDES = ${totalVides};

/** Section correspondant à un préfixe (\`/labs\`), ou null. */
export function sectionParPrefixe(prefixe: string): SectionSommaire | null {
  return SECTIONS_SOMMAIRE.find((s) => s.prefixe === prefixe) ?? null;
}
`;

const check = process.argv.includes("--check");
const actuel = existsSync(CIBLE) ? readFileSync(CIBLE, "utf8") : "";

if (check) {
  if (actuel !== contenu) {
    console.error(`Inventaire des sections périmé (${CIBLE}).`);
    console.error("  Lancer : npm run gen:sections");
    process.exit(1);
  }
  console.log(
    `Inventaire des sections à jour (${sections.length} section(s), ${totalEcrans} écran(s), ${totalVides} vide(s)).`,
  );
} else {
  writeFileSync(CIBLE, contenu);
  console.log(
    `Inventaire régénéré : ${sections.length} section(s), ${totalEcrans} écran(s), ${totalVides} vide(s) → ${CIBLE}`,
  );
}
