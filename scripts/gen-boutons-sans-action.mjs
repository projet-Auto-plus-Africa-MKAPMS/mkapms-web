/**
 * Inventaire des boutons sans action — génération et contrôle de fraîcheur.
 *
 * Le Moteur de Redirection ne voit que les destinations enregistrées : un
 * `<button>` qui n'a aucun gestionnaire de clic n'a pas de destination du tout,
 * donc il est invisible pour lui comme pour le contrôle continu. À l'écran,
 * c'est pourtant le défaut le plus visible : on appuie, rien ne se passe.
 *
 * Ce script relève statiquement chaque bouton qui ne peut rien déclencher :
 * ni `onClick`, ni `type="submit"`, ni appartenance à un formulaire soumis.
 * L'inventaire est lu par le contrôle continu, qui l'expose côté direction.
 *
 *   node scripts/gen-boutons-sans-action.mjs          → écrit le fichier
 *   node scripts/gen-boutons-sans-action.mjs --check   → échoue s'il est périmé
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const RACINE = "client/src";
const CIBLE = "server/data/boutons-sans-action.ts";

function fichiers(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) fichiers(p, acc);
    else if (e.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

/** Texte lisible du bouton : on retire les balises et les expressions JSX. */
function libelle(contenu) {
  const texte = contenu
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return texte.slice(0, 60);
}

/**
 * Un bouton placé dans un formulaire soumis (`<form onSubmit=…>`) déclenche
 * réellement cette soumission, même sans `onClick` : ce n'est pas un bouton
 * mort. On considère donc le formulaire ouvert le plus proche.
 */
function dansFormulaireSoumis(source, index) {
  const avant = source.slice(0, index);
  const ouverture = avant.lastIndexOf("<form");
  if (ouverture === -1) return false;
  if (avant.lastIndexOf("</form>") > ouverture) return false;
  const finBalise = source.indexOf(">", ouverture);
  return /onSubmit/.test(source.slice(ouverture, finBalise === -1 ? ouverture : finBalise));
}

const releves = [];
for (const f of fichiers(RACINE)) {
  const source = readFileSync(f, "utf8");
  for (const m of source.matchAll(/<button\b([^>]*)>([\s\S]{0,400}?)<\/button>/g)) {
    const attributs = m[1];
    if (/onClick|onMouseDown|onPointerDown|type="submit"|form=/.test(attributs)) continue;
    if (dansFormulaireSoumis(source, m.index)) continue;
    releves.push({
      fichier: relative(".", f).split("\\").join("/"),
      ligne: source.slice(0, m.index).split("\n").length,
      libelle: libelle(m[2]),
    });
  }
}

releves.sort((a, b) => a.fichier.localeCompare(b.fichier) || a.ligne - b.ligne);

const contenu = `/**
 * Boutons sans action — inventaire des boutons qui ne peuvent rien déclencher.
 *
 * Fichier GÉNÉRÉ par scripts/gen-boutons-sans-action.mjs depuis client/src.
 * Ne pas éditer à la main : \`npm run gen:boutons\` le régénère, et la
 * construction échoue s'il est périmé — donc tout nouveau bouton mort apparaît
 * dans la revue avant d'atteindre la production.
 *
 * Un bouton est relevé quand il n'a ni gestionnaire de clic, ni type
 * « submit », ni formulaire soumis autour de lui : à l'écran, appuyer dessus
 * ne produit rien. Le contrôle continu lit cet inventaire pour le rendre
 * visible côté direction (point 110 — boutons et redirections).
 */
export interface BoutonSansAction {
  /** Fichier source de l'écran concerné. */
  readonly fichier: string;
  /** Ligne du bouton dans ce fichier. */
  readonly ligne: number;
  /** Texte affiché sur le bouton, pour le reconnaître à l'écran. */
  readonly libelle: string;
}

export const BOUTONS_SANS_ACTION: readonly BoutonSansAction[] = [
${releves.map((r) => `  { fichier: ${JSON.stringify(r.fichier)}, ligne: ${r.ligne}, libelle: ${JSON.stringify(r.libelle)} },`).join("\n")}
];

/** Nombre d'écrans concernés. */
export function ecransConcernes(): string[] {
  return [...new Set(BOUTONS_SANS_ACTION.map((b) => b.fichier))].sort();
}
`;

if (process.argv.includes("--check")) {
  let actuel = "";
  try {
    actuel = readFileSync(CIBLE, "utf8");
  } catch {
    console.error(`Inventaire des boutons absent (${CIBLE}). Lancer : npm run gen:boutons`);
    process.exit(1);
  }
  if (actuel !== contenu) {
    const compte = (t) => (t.match(/^  \{ fichier: /gm) ?? []).length;
    console.error(`Inventaire des boutons sans action périmé (${CIBLE}).`);
    console.error(`  Inventaire : ${compte(actuel)} bouton(s) · Code : ${releves.length} bouton(s).`);
    console.error("  Lancer : npm run gen:boutons");
    process.exit(1);
  }
  console.log(`Inventaire des boutons à jour (${releves.length} bouton(s) sans action).`);
} else {
  writeFileSync(CIBLE, contenu);
  console.log(`Inventaire régénéré : ${releves.length} bouton(s) sans action → ${CIBLE}`);
}
