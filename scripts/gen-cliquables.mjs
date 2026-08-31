/**
 * Inventaire de TOUS les éléments cliquables — génération et contrôle.
 *
 * L'inventaire des boutons sans action ne voyait qu'un défaut : le bouton muet.
 * Il en existe trois autres, invisibles jusqu'ici :
 *
 *  - un lien dont la destination n'est déclarée dans aucune route (404 garanti) ;
 *  - un bouton qui exécute du code local sans passer par le Moteur de boutons,
 *    donc dont personne — ni Redirection, ni Système Intelligent, ni
 *    MKA.P-MS Intelligences — ne sait ce qu'il fait ;
 *  - un `<BoutonMoteur code="…">` dont le code n'est pas au catalogue du moteur.
 *
 * Ce script relève chaque élément cliquable des écrans, le classe, et nomme les
 * anomalies. Le module d'auto-branchement (`server/auto-branchement/`) lit cet
 * inventaire, le remet aux moteurs et laisse la correction à la revue humaine :
 * aucun code de production n'est modifié automatiquement.
 *
 *   node scripts/gen-cliquables.mjs           → écrit le fichier
 *   node scripts/gen-cliquables.mjs --check   → échoue s'il est périmé
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const RACINE = "client/src";
const CIBLE = "server/data/cliquables.ts";
const ROUTES = "server/data/client-routes.ts";
const CATALOGUE = "server/button-engine/catalogue.ts";

function fichiers(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) fichiers(p, acc);
    else if (e.name.endsWith(".tsx")) acc.push(p);
  }
  return acc;
}

/** Routes réellement déclarées côté client (inventaire déjà généré). */
function routesDeclarees() {
  const src = readFileSync(ROUTES, "utf8");
  const debut = src.indexOf("CLIENT_ROUTES");
  return new Set(
    [...src.slice(debut).matchAll(/"(\/[^"]*)"/g)].map((m) => m[1]),
  );
}

/** Racines de routes joker : `/admin/*` couvre tout `/admin/…`. */
function prefixesDeclares() {
  const src = readFileSync(ROUTES, "utf8");
  const debut = src.indexOf("CLIENT_ROUTE_PREFIXES");
  if (debut === -1) return [];
  const fin = src.indexOf("];", debut);
  return [...src.slice(debut, fin).matchAll(/"(\/[^"]*)"/g)].map((m) => m[1]);
}

/** Codes d'action déclarés au Moteur de boutons. */
function codesCatalogue() {
  const src = readFileSync(CATALOGUE, "utf8");
  return new Set([...src.matchAll(/code:\s*"([a-z0-9_]+)"/g)].map((m) => m[1]));
}

/**
 * Une route déclarée peut porter des paramètres (`/vehicule/:id`). Un chemin
 * concret est routable si un motif déclaré lui correspond.
 */
function routable(chemin, routes, prefixes) {
  const propre = chemin.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (routes.has(propre)) return true;
  if (prefixes.some((base) => propre.startsWith(base + "/"))) return true;
  const segments = propre.split("/");
  for (const r of routes) {
    const rs = r.replace(/\/+$/, "").split("/");
    const optionnels = rs.filter((s) => s.endsWith("?")).length;
    if (segments.length > rs.length || segments.length < rs.length - optionnels) continue;
    let ok = true;
    for (let i = 0; i < segments.length; i++) {
      const attendu = rs[i];
      if (attendu === undefined) {
        ok = false;
        break;
      }
      if (attendu.startsWith(":")) continue;
      if (attendu !== segments[i]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

function libelle(contenu) {
  return contenu
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

function ligneDe(source, index) {
  return source.slice(0, index).split("\n").length;
}

function dansFormulaireSoumis(source, index) {
  const avant = source.slice(0, index);
  const ouverture = avant.lastIndexOf("<form");
  if (ouverture === -1) return false;
  if (avant.lastIndexOf("</form>") > ouverture) return false;
  const finBalise = source.indexOf(">", ouverture);
  return /onSubmit/.test(source.slice(ouverture, finBalise === -1 ? ouverture : finBalise));
}

const routes = routesDeclarees();
const prefixes = prefixesDeclares();
const codes = codesCatalogue();

/** Un écran = un fichier. On compte par genre, et on nomme les anomalies. */
const parEcran = new Map();
const anomalies = [];

function compter(fichier, champ) {
  const e = parEcran.get(fichier) ?? {
    fichier,
    total: 0,
    moteur: 0,
    liens: 0,
    boutonsLocaux: 0,
    sansAction: 0,
    zones: 0,
  };
  e.total += 1;
  e[champ] += 1;
  parEcran.set(fichier, e);
}

function anomalie(entree) {
  anomalies.push(entree);
}

for (const f of fichiers(RACINE)) {
  const source = readFileSync(f, "utf8");
  const fichier = relative(".", f).split("\\").join("/");

  // 1. Boutons passés au Moteur de boutons.
  for (const m of source.matchAll(/<BoutonMoteur\b([\s\S]{0,400}?)>/g)) {
    compter(fichier, "moteur");
    const code = /code="([a-z0-9_]+)"/.exec(m[1])?.[1];
    if (!code) {
      anomalie({
        fichier,
        ligne: ligneDe(source, m.index),
        genre: "moteur",
        libelle: "BoutonMoteur sans code littéral",
        motif: "code_non_declare",
      });
    } else if (!codes.has(code)) {
      anomalie({
        fichier,
        ligne: ligneDe(source, m.index),
        genre: "moteur",
        libelle: code,
        motif: "code_non_declare",
      });
    }
  }

  // 2. Liens internes : la destination doit exister.
  for (const m of source.matchAll(/<Link\b[^>]*?\bto=(?:"([^"]*)"|\{`([^`$]*)`\})/g)) {
    compter(fichier, "liens");
    const cible = m[1] ?? m[2];
    if (!cible || cible.startsWith("http")) continue;
    if (!routable(cible, routes, prefixes)) {
      anomalie({
        fichier,
        ligne: ligneDe(source, m.index),
        genre: "lien",
        libelle: cible,
        motif: "destination_inconnue",
      });
    }
  }

  // 3. Boutons et zones cliquables.
  for (const m of source.matchAll(/<button\b([^>]*)>([\s\S]{0,400}?)<\/button>/g)) {
    const attributs = m[1];
    const actif =
      /onClick|onMouseDown|onPointerDown|type="submit"|form=/.test(attributs) ||
      dansFormulaireSoumis(source, m.index);
    if (actif) {
      compter(fichier, "boutonsLocaux");
      continue;
    }
    compter(fichier, "sansAction");
    anomalie({
      fichier,
      ligne: ligneDe(source, m.index),
      genre: "bouton",
      libelle: libelle(m[2]) || "(sans texte)",
      motif: "sans_action",
    });
  }

  // 4. Éléments non-bouton rendus cliquables : invisibles pour le moteur.
  for (const m of source.matchAll(/<(div|span|li|tr|td|article|section|img)\b[^>]*onClick/g)) {
    compter(fichier, "zones");
  }
}

const ecrans = [...parEcran.values()].sort((a, b) => a.fichier.localeCompare(b.fichier));
anomalies.sort(
  (a, b) => a.motif.localeCompare(b.motif) || a.fichier.localeCompare(b.fichier) || a.ligne - b.ligne,
);

const total = ecrans.reduce((n, e) => n + e.total, 0);

const contenu = `/**
 * Inventaire des éléments cliquables de la plateforme.
 *
 * Fichier GÉNÉRÉ par scripts/gen-cliquables.mjs depuis client/src.
 * Ne pas éditer à la main : \`npm run gen:cliquables\` le régénère, et la
 * construction échoue s'il est périmé.
 *
 * Il sert au module d'auto-branchement : chaque écran est compté par genre de
 * cliquable, et chaque anomalie est nommée avec son fichier et sa ligne, de
 * sorte que le Moteur de boutons, le Moteur de Redirection, le contrôle
 * continu, le Système Intelligent et MKA.P-MS Intelligences travaillent sur des
 * faits et non sur une impression d'écran.
 */

/** Comptage des cliquables d'un écran, par genre. */
export interface EcranCliquables {
  readonly fichier: string;
  /** Tous genres confondus. */
  readonly total: number;
  /** Passés par \`BoutonMoteur\` : le moteur sait ce qu'ils font. */
  readonly moteur: number;
  /** Liens de navigation interne. */
  readonly liens: number;
  /** Boutons avec exécution locale (onClick / submit) hors moteur. */
  readonly boutonsLocaux: number;
  /** Boutons qui ne déclenchent rien du tout. */
  readonly sansAction: number;
  /** Éléments non-bouton rendus cliquables (div, ligne de tableau, image…). */
  readonly zones: number;
}

export type MotifAnomalie = "sans_action" | "destination_inconnue" | "code_non_declare";

export interface AnomalieCliquable {
  readonly fichier: string;
  readonly ligne: number;
  readonly genre: "bouton" | "lien" | "moteur";
  /** Texte du bouton, destination du lien, ou code d'action selon le genre. */
  readonly libelle: string;
  readonly motif: MotifAnomalie;
}

export const CLIQUABLES_TOTAL = ${total};

export const CLIQUABLES_PAR_ECRAN: readonly EcranCliquables[] = [
${ecrans
  .map(
    (e) =>
      `  { fichier: ${JSON.stringify(e.fichier)}, total: ${e.total}, moteur: ${e.moteur}, liens: ${e.liens}, boutonsLocaux: ${e.boutonsLocaux}, sansAction: ${e.sansAction}, zones: ${e.zones} },`,
  )
  .join("\n")}
];

export const CLIQUABLES_ANOMALIES: readonly AnomalieCliquable[] = [
${anomalies
  .map(
    (a) =>
      `  { fichier: ${JSON.stringify(a.fichier)}, ligne: ${a.ligne}, genre: ${JSON.stringify(a.genre)}, libelle: ${JSON.stringify(a.libelle)}, motif: ${JSON.stringify(a.motif)} },`,
  )
  .join("\n")}
];

/** Anomalies d'un motif donné. */
export function anomaliesParMotif(motif: MotifAnomalie): readonly AnomalieCliquable[] {
  return CLIQUABLES_ANOMALIES.filter((a) => a.motif === motif);
}
`;

if (process.argv.includes("--check")) {
  let actuel = "";
  try {
    actuel = readFileSync(CIBLE, "utf8");
  } catch {
    console.error(`Inventaire des cliquables absent (${CIBLE}). Lancer : npm run gen:cliquables`);
    process.exit(1);
  }
  if (actuel !== contenu) {
    console.error(`Inventaire des cliquables périmé (${CIBLE}).`);
    console.error(`  Code : ${total} cliquable(s), ${anomalies.length} anomalie(s).`);
    console.error("  Lancer : npm run gen:cliquables");
    process.exit(1);
  }
  console.log(
    `Inventaire des cliquables à jour (${total} cliquable(s), ${anomalies.length} anomalie(s)).`,
  );
} else {
  writeFileSync(CIBLE, contenu);
  console.log(
    `Inventaire régénéré : ${total} cliquable(s) sur ${ecrans.length} écran(s), ${anomalies.length} anomalie(s) → ${CIBLE}`,
  );
}
