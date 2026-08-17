/**
 * Point 117 — générateur du Code Knowledge Graph.
 *
 * Lit le dépôt (jamais une liste écrite à la main) et produit
 * `server/data/code-graph.json` : la mémoire technique de la plateforme.
 *
 *   service/moteur → fichiers → API → tables → événements → permissions
 *                  → tests → dépendances
 *
 * Exécuté au build (`npm run build:graph`) : l'artefact est ainsi disponible en
 * production même si le serveur n'a pas accès aux sources. Il est régénérable à
 * tout moment, et l'écran PDG affiche la date de génération : un graphe périmé
 * est signalé comme tel au lieu d'être présenté comme la vérité.
 *
 * Aucune interprétation : ce fichier ne contient que ce qui a été lu.
 */
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import path from "node:path";

const RACINE = path.resolve(import.meta.dirname, "..");
const CIBLES = ["server", "client/src", "drizzle"];
const EXT = new Set([".ts", ".tsx", ".sql"]);

/** Fichiers à ignorer : artefacts, dépendances, sorties de build. */
const IGNORE = new Set(["node_modules", "dist", "build", ".git", "android", "ios", "coverage"]);

async function fichiers(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(path.join(RACINE, dir), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (IGNORE.has(e.name)) continue;
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await fichiers(rel)));
    else if (EXT.has(path.extname(e.name))) out.push(rel);
  }
  return out;
}

/** Module d'appartenance : `server/<module>` ou `client/src/<dossier>`. */
function moduleDe(rel) {
  const p = rel.split(path.sep);
  if (p[0] === "server") return p.length > 2 ? `server/${p[1]}` : "server/core";
  if (p[0] === "client") return p.length > 3 ? `client/${p[2]}` : "client/racine";
  if (p[0] === "drizzle") return "drizzle";
  return p[0];
}

function tous(re, texte) {
  const out = [];
  let m;
  const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : `${re.flags}g`);
  while ((m = r.exec(texte)) !== null) out.push(m);
  return out;
}

const noeuds = new Map();
const aretes = [];

function noeud(id, type, label, extra = {}) {
  if (!noeuds.has(id)) noeuds.set(id, { id, type, label, ...extra });
  return noeuds.get(id);
}

function arete(from, to, type) {
  const cle = `${from}|${to}|${type}`;
  if (!aretes.some((a) => `${a.from}|${a.to}|${a.type}` === cle)) aretes.push({ from, to, type });
}

async function main() {
  const listes = await Promise.all(CIBLES.map((c) => fichiers(c)));
  const liste = listes.flat();

  const conventions = {
    modulesServeur: 0,
    modulesAvecSchema: 0,
    modulesAvecService: 0,
    modulesAvecIndex: 0,
    proceduresPubliques: 0,
    proceduresProtegees: 0,
    proceduresDirection: 0,
  };

  const parModule = new Map();

  for (const rel of liste) {
    const abs = path.join(RACINE, rel);
    const [texte, info] = await Promise.all([readFile(abs, "utf8"), stat(abs)]);
    const lignes = texte.split("\n").length;
    const mod = moduleDe(rel);
    noeud(`module:${mod}`, "module", mod);
    noeud(`fichier:${rel}`, "fichier", rel, { module: mod, lignes, octets: info.size });
    arete(`module:${mod}`, `fichier:${rel}`, "contient");

    const m = parModule.get(mod) ?? { fichiers: 0, schema: false, service: false, index: false };
    m.fichiers += 1;
    const nom = path.basename(rel);
    if (nom === "schema.ts") m.schema = true;
    if (nom === "service.ts") m.service = true;
    if (nom === "index.ts") m.index = true;
    parModule.set(mod, m);

    // Tables : la structure réelle de la base, déclarée dans le code.
    for (const t of tous(/pgTable\(\s*["'`]([a-z0-9_]+)["'`]/i, texte)) {
      noeud(`table:${t[1]}`, "table", t[1]);
      arete(`fichier:${rel}`, `table:${t[1]}`, "declare");
      arete(`module:${mod}`, `table:${t[1]}`, "possede");
    }
    // Migrations SQL : quelles tables une migration touche.
    if (rel.endsWith(".sql")) {
      for (const t of tous(/(?:CREATE TABLE(?: IF NOT EXISTS)?|ALTER TABLE)\s+"?([a-z0-9_]+)"?/i, texte)) {
        noeud(`table:${t[1]}`, "table", t[1]);
        arete(`fichier:${rel}`, `table:${t[1]}`, "migre");
      }
    }

    // Procédures tRPC : le mur de permissions, compté là où il est écrit.
    const pub = tous(/\bpublicProcedure\b/, texte).length;
    const prot = tous(/\bprotectedProcedure\b/, texte).length;
    const dir = tous(/\b(?:adminProcedure|directionProcedure|pdgProcedure)\b/, texte).length;
    conventions.proceduresPubliques += pub;
    conventions.proceduresProtegees += prot;
    conventions.proceduresDirection += dir;
    if (pub + prot + dir > 0) {
      noeud(`api:${rel}`, "api", rel, { publiques: pub, protegees: prot, direction: dir });
      arete(`module:${mod}`, `api:${rel}`, "expose");
      arete(`api:${rel}`, `fichier:${rel}`, "implemente");
    }

    // Événements du bus : émissions et abonnements réels.
    for (const e of tous(/(?:type|eventType|code):\s*["'`]([a-z_]+\.[a-z_]+)["'`]/i, texte)) {
      noeud(`evenement:${e[1]}`, "evenement", e[1]);
      arete(`module:${mod}`, `evenement:${e[1]}`, "utilise");
    }

    // Scénarios de contrôle continu : la preuve rattachée au domaine.
    if (rel.includes(`continuous-test${path.sep}`)) {
      const ids = tous(/id:\s*["'`]([a-z0-9_]+\.[a-z0-9_]+)["'`]/i, texte);
      const domaines = tous(/domaine:\s*["'`]([a-z0-9_]+)["'`]/i, texte);
      ids.forEach((id, i) => {
        noeud(`test:${id[1]}`, "test", id[1], { domaine: domaines[i]?.[1] ?? null });
        if (domaines[i]) arete(`test:${id[1]}`, `moteur:${domaines[i][1]}`, "prouve");
      });
    }

    // Dépendances entre modules : les imports réellement écrits.
    for (const i of tous(/from\s+["'](\.[^"']+)["']/, texte)) {
      const cible = path.normalize(path.join(path.dirname(rel), i[1]))
        .replace(/\.js$/, ".ts");
      const modCible = moduleDe(cible);
      if (modCible && modCible !== mod) {
        noeud(`module:${modCible}`, "module", modCible);
        arete(`module:${mod}`, `module:${modCible}`, "depend");
      }
    }
  }

  for (const [mod, m] of parModule) {
    if (!mod.startsWith("server/")) continue;
    conventions.modulesServeur += 1;
    if (m.schema) conventions.modulesAvecSchema += 1;
    if (m.service) conventions.modulesAvecService += 1;
    if (m.index) conventions.modulesAvecIndex += 1;
  }

  // Moteurs du registre : le nom officiel, relié à son module et à ses tables.
  const registre = await readFile(path.join(RACINE, "server/engine-registry/catalog.ts"), "utf8");
  const moteurs = tous(/name:\s*["'`]([a-z0-9_]+)["'`]/i, registre).map((m) => m[1]);
  for (const nom of moteurs) {
    noeud(`moteur:${nom}`, "moteur", nom);
    const candidats = [...parModule.keys()].filter(
      (mod) => mod.startsWith("server/") && mod.slice(7).replace(/-/g, "_").includes(nom),
    );
    for (const mod of candidats) arete(`moteur:${nom}`, `module:${mod}`, "porte");
  }

  // Routes client : la destination réellement déclarée, reliée à sa page.
  const app = await readFile(path.join(RACINE, "client/src/App.tsx"), "utf8");
  for (const r of tous(/path=\{?["'`]([^"'`]+)["'`]\}?[^>]*element=\{[^}]*?<(?:U name="[^"]*">\s*<)?([A-Z][A-Za-z0-9_]*)/s, app)) {
    noeud(`route:${r[1]}`, "route", r[1], { page: r[2] });
    noeud(`page:${r[2]}`, "page", r[2]);
    arete(`route:${r[1]}`, `page:${r[2]}`, "rend");
  }
  const routes = await readFile(path.join(RACINE, "server/data/client-routes.ts"), "utf8");
  for (const r of tous(/^\s*["']([^"']+)["'],\s*$/m, routes)) {
    noeud(`route:${r[1]}`, "route", r[1]);
  }

  let commit = null;
  try {
    commit = execSync("git rev-parse --short HEAD", { cwd: RACINE }).toString().trim();
  } catch {
    commit = null;
  }

  const graphe = {
    generatedAt: new Date().toISOString(),
    commit,
    conventions,
    stats: {
      fichiers: [...noeuds.values()].filter((n) => n.type === "fichier").length,
      modules: [...noeuds.values()].filter((n) => n.type === "module").length,
      moteurs: [...noeuds.values()].filter((n) => n.type === "moteur").length,
      tables: [...noeuds.values()].filter((n) => n.type === "table").length,
      api: [...noeuds.values()].filter((n) => n.type === "api").length,
      evenements: [...noeuds.values()].filter((n) => n.type === "evenement").length,
      tests: [...noeuds.values()].filter((n) => n.type === "test").length,
      routes: [...noeuds.values()].filter((n) => n.type === "route").length,
      aretes: aretes.length,
    },
    noeuds: [...noeuds.values()],
    aretes,
  };

  const sortie = path.join(RACINE, "server/data/code-graph.json");
  await writeFile(sortie, `${JSON.stringify(graphe, null, 0)}\n`, "utf8");
  console.log(
    `[code-graph] ${graphe.stats.fichiers} fichiers, ${graphe.stats.moteurs} moteurs, ${graphe.stats.tables} tables, ${graphe.stats.aretes} liens → server/data/code-graph.json`,
  );
}

await main();
