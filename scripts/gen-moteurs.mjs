/**
 * Périmètre réel de chaque moteur — génération et contrôle de fraîcheur.
 *
 * Le registre connaissait, pour chaque moteur, une liste de dépendances écrite
 * à la main. Rien ne prouvait qu'elle correspondait au code : un moteur
 * pouvait afficher zéro dépendant alors que vingt écrans l'appellent, ou se
 * dire branché à l'Event Bus sans publier un seul événement.
 *
 * Ce script lit le code et calcule, pour chacun des moteurs déclarés dans
 * `server/engine-registry/perimetres.ts` :
 *   - les dépendances RÉELLES (imports serveur entre moteurs, appels tRPC des
 *     écrans vers les routeurs d'autres moteurs, usage de BoutonMoteur) ;
 *   - les dépendants (l'inverse) ;
 *   - les événements publiés (appels emit/emitSafe) et consommés (abonnements) ;
 *   - les boutons déclarés au Moteur de boutons et leur emplacement exact ;
 *   - les écrans servis, avec leurs cliquables, leurs textes et leurs mots ;
 *   - les procédures tRPC, les tables, les niveaux d'accès ;
 *   - ce qui MANQUE : bouton sans action, code non déclaré, événement hors
 *     catalogue ou sans abonné, source d'émission non reconnue, route sans
 *     écran, dépendance non déclarée, moteur sans battement ni sonde.
 *
 *   node scripts/gen-moteurs.mjs          → écrit server/data/moteurs.ts
 *   node scripts/gen-moteurs.mjs --check   → échoue s'il est périmé ou si le
 *                                            périmètre déclaré est incohérent
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, relative, dirname, resolve } from "node:path";
import { transformSync } from "esbuild";

const CIBLE = "server/data/moteurs.ts";
const SERVEUR = "server";
const CLIENT = "client/src";

// ── Chargement des catalogues TypeScript (fichiers sans import) ───────────
async function chargerTs(chemin) {
  const js = transformSync(readFileSync(chemin, "utf8"), {
    loader: "ts",
    format: "esm",
    target: "es2022",
  }).code;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`);
}

const { PERIMETRES } = await chargerTs("server/engine-registry/perimetres.ts");
const { ENGINE_CATALOG } = await chargerTs("server/engine-registry/catalog.ts");
const { EVENT_TYPES, SUBSCRIPTIONS } = await chargerTs("server/event-bus/catalog.ts");
const { ACTIONS_BOUTONS } = await chargerTs("server/button-engine/catalogue.ts");
const { CLIENT_ROUTES, CLIENT_ROUTE_PATTERNS } = await chargerTs("server/data/client-routes.ts");
const { CLIQUABLES_PAR_ECRAN, CLIQUABLES_ANOMALIES } = await chargerTs("server/data/cliquables.ts");

const erreurs = [];

// ── 1. Périmètre déclaré : unicité des dossiers, routeurs et routes ───────
const moteurParDossier = new Map();
const moteurParRouteur = new Map();
const moteurParRoute = new Map();
const nomsMoteurs = new Set(PERIMETRES.map((p) => p.moteur));

for (const p of PERIMETRES) {
  for (const d of p.dossiers) {
    if (moteurParDossier.has(d)) erreurs.push(`dossier ${d} déclaré par ${moteurParDossier.get(d)} et ${p.moteur}`);
    moteurParDossier.set(d, p.moteur);
    if (!existsSync(join(SERVEUR, d))) erreurs.push(`${p.moteur}: dossier serveur introuvable ${d}`);
  }
  for (const r of p.routeurs) {
    if (moteurParRouteur.has(r)) erreurs.push(`routeur ${r} déclaré par ${moteurParRouteur.get(r)} et ${p.moteur}`);
    moteurParRouteur.set(r, p.moteur);
  }
  for (const r of p.routes) {
    if (moteurParRoute.has(r)) erreurs.push(`route ${r} déclarée par ${moteurParRoute.get(r)} et ${p.moteur}`);
    moteurParRoute.set(r, p.moteur);
  }
}

// Les 88 moteurs = catalogue + pont OS ; tous doivent avoir un périmètre.
const catalogue = new Set(ENGINE_CATALOG.map((e) => e.name));
for (const n of catalogue) if (!nomsMoteurs.has(n)) erreurs.push(`moteur du catalogue sans périmètre : ${n}`);
for (const n of nomsMoteurs) if (!catalogue.has(n)) erreurs.push(`moteur avec périmètre mais absent du catalogue : ${n}`);

// Routeurs réellement montés dans server/router.ts.
const routerTs = readFileSync("server/router.ts", "utf8");
const routeursMontes = new Map();
for (const m of routerTs.matchAll(/^\s+([a-zA-Z]+): ([a-zA-Z]+Router),?$/gm)) routeursMontes.set(m[1], m[2]);
for (const r of moteurParRouteur.keys()) if (!routeursMontes.has(r)) erreurs.push(`routeur ${r} non monté dans server/router.ts`);
const routeursOrphelins = [...routeursMontes.keys()].filter((r) => !moteurParRouteur.has(r));

// ── 2. Fichiers ───────────────────────────────────────────────────────────
function fichiersDe(dir, ext, acc = []) {
  if (!existsSync(dir)) return acc;
  if (statSync(dir).isFile()) return acc.concat(dir);
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      fichiersDe(p, ext, acc);
    } else if (ext.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

const fichiersServeur = fichiersDe(SERVEUR, [".ts"]).map((f) => f.split("\\").join("/"));

/** Moteur propriétaire d'un fichier serveur (le dossier le plus long gagne). */
function proprietaireServeur(fichier) {
  const rel = relative(SERVEUR, fichier).split("\\").join("/");
  let meilleur = null;
  for (const [d, m] of moteurParDossier) {
    if (rel === d || rel.startsWith(d + "/")) {
      if (!meilleur || d.length > meilleur.d.length) meilleur = { d, m };
    }
  }
  return meilleur?.m ?? null;
}

const fichiersParMoteur = new Map([...nomsMoteurs].map((n) => [n, []]));
const fichiersServeurOrphelins = [];
for (const f of fichiersServeur) {
  const m = proprietaireServeur(f);
  if (m) fichiersParMoteur.get(m).push(f);
  else fichiersServeurOrphelins.push(relative(SERVEUR, f).split("\\").join("/"));
}

// ── 3. Routes client → fichier d'écran (App.tsx) ──────────────────────────
const appTsx = readFileSync(join(CLIENT, "App.tsx"), "utf8");
const importParIdent = new Map();
for (const m of appTsx.matchAll(/^import\s+(\w+)\s+from\s+"(\.[^"]+)"/gm)) importParIdent.set(m[1], m[2]);
for (const m of appTsx.matchAll(/^const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\("(\.[^"]+)"\)\)/gm)) importParIdent.set(m[1], m[2]);
for (const m of appTsx.matchAll(/^import\s*\{([^}]+)\}\s*from\s*"(\.[^"]+)"/gm)) {
  for (const ident of m[1].split(",").map((s) => s.trim().split(/\s+as\s+/).pop()).filter(Boolean)) {
    if (!importParIdent.has(ident)) importParIdent.set(ident, m[2]);
  }
}

function resoudreClient(spec) {
  const base = resolve(CLIENT, spec);
  for (const c of [base + ".tsx", base + ".ts", join(base, "index.tsx"), join(base, "index.ts")]) {
    if (existsSync(c)) return relative(".", c).split("\\").join("/");
  }
  return null;
}

/** Route → fichier(s) d'écran. Les enveloppes (U, V, Suspense…) sont ignorées. */
const ecransParRoute = new Map();
for (const m of appTsx.matchAll(/<Route\s+path="([^"]+)"\s+element=\{([\s\S]*?)\}\s*\/>/g)) {
  const route = m[1];
  const fichiers = new Set();
  for (const c of m[2].matchAll(/<([A-Z]\w*)/g)) {
    const spec = importParIdent.get(c[1]);
    if (!spec || !spec.includes("/pages/")) continue;
    const f = resoudreClient(spec);
    if (f) fichiers.add(f);
  }
  ecransParRoute.set(route, [...fichiers]);
}

const cache = new Map();
function lire(f) {
  if (!cache.has(f)) cache.set(f, readFileSync(f, "utf8"));
  return cache.get(f);
}

/** Composants partagés (components/, lib/) → routeurs tRPC qu'ils appellent. */
const composantsClient = [];
for (const dossier of ["components", "lib"]) {
  const racine = join(CLIENT, dossier);
  if (!existsSync(racine)) continue;
  for (const f of fichiersDe(racine, [".ts", ".tsx"]).map((x) => x.split("\\").join("/"))) {
    const src = lire(f);
    const routeurs = new Set([...src.matchAll(/\btrpc\.([a-zA-Z]+)\./g)].map((m) => m[1]));
    if (routeurs.size) composantsClient.push({ fichier: f, routeurs });
  }
}
/** Écran → composants partagés qu'il importe (résolus). */
const composantsParEcran = new Map();
function composantsImportes(fichierEcran) {
  if (composantsParEcran.has(fichierEcran)) return composantsParEcran.get(fichierEcran);
  const src = lire(fichierEcran);
  const res = new Set();
  for (const m of src.matchAll(/^import[\s\S]*?from\s+"([^"]+)"/gm)) {
    const spec = m[1];
    let cible = null;
    if (spec.startsWith("@/")) cible = resoudreClient(spec.slice(2));
    else if (spec.startsWith(".")) {
      const base = resolve(dirname(fichierEcran), spec);
      for (const c of [base + ".tsx", base + ".ts", join(base, "index.tsx"), join(base, "index.ts")]) {
        if (existsSync(c)) { cible = relative(".", c).split("\\").join("/"); break; }
      }
    }
    if (cible) res.add(cible);
  }
  composantsParEcran.set(fichierEcran, res);
  return res;
}

// Écrans référencés sans <Route path> littéral (sections générées).
const routesApp = new Set([...CLIENT_ROUTES, ...CLIENT_ROUTE_PATTERNS]);

function moteurDeRoute(route) {
  if (moteurParRoute.has(route)) return moteurParRoute.get(route);
  let meilleur = null;
  for (const [motif, m] of moteurParRoute) {
    if (motif.endsWith("/*")) {
      const pref = motif.slice(0, -2);
      if (route === pref || route.startsWith(pref + "/")) {
        if (!meilleur || pref.length > meilleur.pref.length) meilleur = { pref, m };
      }
    } else if (motif.endsWith("*")) {
      const pref = motif.slice(0, -1);
      if (route.startsWith(pref)) {
        if (!meilleur || pref.length > meilleur.pref.length) meilleur = { pref, m };
      }
    }
  }
  return meilleur?.m ?? null;
}

const routesParMoteur = new Map([...nomsMoteurs].map((n) => [n, []]));
const routesOrphelines = [];
for (const r of routesApp) {
  const m = moteurDeRoute(r);
  if (m) routesParMoteur.get(m).push(r);
  else routesOrphelines.push(r);
}
// Routes déclarées au périmètre qui n'existent dans aucun écran.
const routesDeclareesSansEcran = new Map();
for (const [motif, m] of moteurParRoute) {
  const existe = motif.endsWith("*")
    ? [...routesApp].some((r) => moteurDeRoute(r) === m && (r === motif.replace(/\/?\*$/, "") || r.startsWith(motif.replace(/\*$/, ""))))
    : routesApp.has(motif);
  if (!existe) routesDeclareesSansEcran.set(motif, m);
}

// ── 4. Analyse des fichiers ────────────────────────────────────────────────

function resoudreServeur(depuis, spec) {
  const base = resolve(dirname(depuis), spec.replace(/\.js$/, ""));
  for (const c of [base + ".ts", join(base, "index.ts")]) if (existsSync(c)) return c.split("\\").join("/");
  return null;
}

const codesEvenements = new Set(EVENT_TYPES.map((e) => e.code));
const codesBoutons = new Map(ACTIONS_BOUTONS.map((a) => [a.code, a]));
const abonnesParEvenement = new Map();
for (const s of SUBSCRIPTIONS) abonnesParEvenement.set(s.eventType, [...(abonnesParEvenement.get(s.eventType) ?? []), s.engine]);

/** Événements émis dans un fichier : `emit({ … type: "x.y" … })`. */
function evenementsEmis(source) {
  const codes = new Set();
  const sources = new Set();
  let dynamiques = 0;
  for (const m of source.matchAll(/\bemit(?:Safe)?\(\s*\{([\s\S]{0,600}?)\}\s*\)/g)) {
    const bloc = m[1];
    const t = /\btype:\s*(?:"([^"]+)"|`([^`]+)`|([A-Za-z_][\w.]*))/.exec(bloc);
    if (t?.[1]) codes.add(t[1]);
    else if (t?.[2] && !t[2].includes("${")) codes.add(t[2]);
    else dynamiques += 1;
    const s = /\bsource:\s*"([^"]+)"/.exec(bloc);
    if (s) sources.add(s[1]);
  }
  return { codes, sources, dynamiques };
}

/** Textes visibles d'un écran : nœuds JSX et libellés d'objets (label/title/…). */
function textesVisibles(source) {
  const phrases = [];
  const sansCode = source.replace(/\{[^{}]*\}/g, " ");
  for (const m of sansCode.matchAll(/>([^<>{}]+)</g)) {
    const t = m[1].replace(/\s+/g, " ").trim();
    if (t.length >= 3 && /[A-Za-zÀ-ÿ]{2}/.test(t)) phrases.push(t);
  }
  for (const m of source.matchAll(/\b(?:label|title|titre|libelle|description|placeholder|sousTitre|texte|nom|name):\s*"([^"\n]{3,})"/g)) {
    if (/[A-Za-zÀ-ÿ]{2}/.test(m[1])) phrases.push(m[1]);
  }
  const mots = phrases.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);
  return { textes: phrases.length, mots };
}

const ACCES = {
  publicProcedure: "public",
  protectedProcedure: "connecte",
  proProcedure: "professionnel",
  adminProcedure: "admin",
  directionProcedure: "direction",
  pdgProcedure: "pdg",
};

const cliquablesParFichier = new Map(CLIQUABLES_PAR_ECRAN.map((e) => [e.fichier, e]));
const anomaliesParFichier = new Map();
for (const a of CLIQUABLES_ANOMALIES) anomaliesParFichier.set(a.fichier, [...(anomaliesParFichier.get(a.fichier) ?? []), a]);

// Sondes, pont OS, contrats : qui a un battement de cœur ?
const probesTs = readFileSync("server/engine-registry/probes.ts", "utf8");
const bridgeTs = readFileSync("server/engine-registry/os-bridge.ts", "utf8");
const contractsTs = readFileSync("server/engine-registry/contracts.ts", "utf8");
const avecSonde = new Set([...probesTs.matchAll(/engine:\s*"([a-z_]+)"/g)].map((m) => m[1]));
const avecPont = new Set([...bridgeTs.matchAll(/name:\s*"([a-z_]+)"/g)].map((m) => m[1]));
const avecContrat = new Set([...contractsTs.matchAll(/^\s+id:\s*"([a-z_]+)"/gm)].map((m) => m[1]));

// ── 5. Périmètre calculé par moteur ───────────────────────────────────────
const resultats = new Map();

/** Moteurs transversaux atteints par un symbole partagé plutôt que par un import direct. */
const SYMBOLES_TRANSVERSAUX = [
  // Les gardes de procédure sont fournies par le socle : elles confirment une
  // dépendance déclarée à Identity/Permission sans en créer une nouvelle.
  [/\b(protectedProcedure|proProcedure|adminProcedure|directionProcedure|pdgProcedure)\b/, "identity", "exige une session Identity (procédure protégée)", true],
  [/\b(proProcedure|adminProcedure|directionProcedure|pdgProcedure)\b/, "permission", "filtre par rôle (procédure pro/admin/direction/PDG)", true],
  [/\b(hasPermission|requirePermission|permissionEngine)\b/, "permission", "interroge le Permission Engine"],
  [/\bnotifyEvent\(/, "notification", "déclenche notifyEvent"],
  [/\bsendEmail\(/, "notification", "envoie un email"],
  [/\b(raiseAlert|smartAlerts)\b/, "smart", "ouvre une alerte du Système Intelligent"],
  [/\b(schedulerOs|registerJob|scheduleJob)\b/, "scheduler", "planifie via Scheduler OS"],
  [/\b(documentOs|createDocument|genererDocument)\b/, "document", "produit un document via Document OS"],
  [/\b(ctx\.country|getCountryRule|getCountry)\b/, "country", "lit la règle pays"],
  [/\b(logAudit|auditLog)\(/, "audit", "écrit au journal d'audit"],
  [/\b(stripe\.|createCheckout|paymentEngine)\b/, "payment", "déclenche un paiement"],
  [/\bheartbeat\(/, "core", "bat au registre central"],
];

/**
 * Preuves qui n'établissent qu'une intégration technique transversale
 * (vérification de session/rôle, écriture d'un journal d'audit, usage du
 * contrat public d'un OS) plutôt qu'une dépendance métier : le moteur
 * appelant ne consomme pas la logique ou les données d'un autre domaine, il
 * traverse un port d'infrastructure partagé par toute la plateforme.
 *
 * Une dépendance déclarée n'est classée « intégration technique » (exclue du
 * graphe de cycles métier, voir server/engine-registry/dependencies.ts) que
 * si TOUTES ses preuves détectées correspondent à l'un de ces motifs — la
 * moindre preuve d'un usage métier réel (import direct d'un module business,
 * appel tRPC depuis un écran d'un autre moteur…) la fait rester une
 * dépendance métier normale.
 */
const MOTIFS_INTEGRATION_TECHNIQUE = [
  /^.+ exige une session Identity \(procédure protégée\)$/,
  /^.+ filtre par rôle \(procédure pro\/admin\/direction\/PDG\)$/,
  /^.+ écrit au journal d'audit$/,
  /^.+ importe .*identity-os\/contract\.ts$/,
];
const estPreuveTechnique = (texte) => MOTIFS_INTEGRATION_TECHNIQUE.some((m) => m.test(texte));

const emetteursParEvenement = new Map(EVENT_TYPES.map((e) => [e.code, e.emetteurs ?? []]));

const SOCLE_COMPOSITION = new Set(["router.ts", "index.ts", "migrate.ts", "seed.ts", "db.ts", "trpc.ts", "schema.ts"]);

for (const p of PERIMETRES) {
  const moteur = p.moteur;
  const seed = ENGINE_CATALOG.find((e) => e.name === moteur);
  const fichiers = fichiersParMoteur.get(moteur);
  const dependancesDetectees = new Map(); // moteur → preuves
  const preuve = (dep, texte) => {
    if (dep === moteur || !nomsMoteurs.has(dep)) return;
    const l = dependancesDetectees.get(dep) ?? [];
    if (l.length < 3 && !l.includes(texte)) l.push(texte);
    dependancesDetectees.set(dep, l);
  };

  const evenementsPublies = new Set();
  const sourcesEmission = new Set();
  let emissionsDynamiques = 0;
  const procedures = [];
  const acces = new Set();
  const tables = new Set();
  let battementInterne = false;

  for (const f of fichiers) {
    const relF = relative(SERVEUR, f).split("\\").join("/");
    // Fichiers descriptifs (inventaires, catalogues) : ils nomment les moteurs sans les utiliser.
    if (relF === "data/moteurs.ts" || relF.startsWith("engine-registry/")) continue;
    const src = lire(f);
    // Les racines de composition (router.ts, index.ts…) assemblent tous les
    // moteurs : leurs imports ne sont pas des dépendances du socle.
    const racine = SOCLE_COMPOSITION.has(relF);
    for (const m of racine ? [] : src.matchAll(/^import[\s\S]*?from\s+"(\.[^"]+)"/gm)) {
      const cible = resoudreServeur(f, m[1]);
      if (!cible) continue;
      const prop = proprietaireServeur(cible);
      if (prop) preuve(prop, `${relF} importe ${relative(SERVEUR, cible).split("\\").join("/")}`);
    }
    for (const m of racine ? [] : src.matchAll(/await import\("(\.[^"]+)"\)/g)) {
      const cible = resoudreServeur(f, m[1]);
      const prop = cible && proprietaireServeur(cible);
      if (prop) preuve(prop, `${relF} charge ${relative(SERVEUR, cible).split("\\").join("/")}`);
    }
    const ev = evenementsEmis(src);
    for (const c of ev.codes) evenementsPublies.add(c);
    for (const s of ev.sources) sourcesEmission.add(s);
    emissionsDynamiques += ev.dynamiques;
    if (ev.codes.size || ev.dynamiques) preuve("event_bus", `${relF} publie des événements`);
    for (const [motif, cible, libelle, confirmeSeulement] of racine ? [] : SYMBOLES_TRANSVERSAUX) {
      if (!motif.test(src)) continue;
      if (confirmeSeulement && !(seed?.dependencies ?? []).includes(cible)) continue;
      preuve(cible, `${relF} ${libelle}`);
    }
    for (const m of src.matchAll(/^\s+([a-zA-Z0-9_]+):\s*(publicProcedure|protectedProcedure|proProcedure|adminProcedure|directionProcedure|pdgProcedure)\b/gm)) {
      procedures.push(m[1]);
      acces.add(ACCES[m[2]]);
    }
    for (const m of src.matchAll(/pgTable\(\s*"([a-z0-9_]+)"/g)) tables.add(m[1]);
    if (/\bheartbeat\(\s*"/.test(src) || /\bheartbeat\(\s*[A-Z_]+\.code/.test(src)) battementInterne = true;
    for (const m of src.matchAll(/roles?:\s*\[([^\]]*)\]/g)) {
      for (const r of m[1].matchAll(/"([a-z_]+)"/g)) acces.add(`role:${r[1]}`);
    }
  }

  // Écrans : routes servies → fichiers → cliquables, textes, appels tRPC.
  const routes = routesParMoteur.get(moteur).sort();
  const ecrans = [];
  const fichiersEcrans = new Set();
  for (const r of routes) for (const f of ecransParRoute.get(r) ?? []) fichiersEcrans.add(f);

  // Écrans hôtes : écrans d'autres moteurs qui embarquent un composant
  // partagé appelant un routeur de ce moteur (ex. CoutTotalEstime sur une
  // fiche véhicule). Le moteur y est réellement utilisé sans posséder la route.
  const composantsDuMoteur = composantsClient.filter((c) => [...c.routeurs].some((r) => moteurParRouteur.get(r) === moteur)).map((c) => c.fichier);
  const ecransHotes = [];
  const routeursDuMoteur = p.routeurs ?? [];
  for (const [route, fichiersRoute] of ecransParRoute) {
    for (const f of fichiersRoute) {
      if (fichiersEcrans.has(f)) continue;
      const imp = composantsImportes(f);
      const via = composantsDuMoteur.filter((c) => imp.has(c)).map((c) => c.replace(/^client\/src\//, ""));
      const srcEcran = lire(f);
      for (const r of routeursDuMoteur) if (new RegExp("\\btrpc\\." + r + "\\.").test(srcEcran)) via.push(`trpc.${r}`);
      if (via.length) ecransHotes.push({ fichier: f, route, composants: via });
    }
  }
  const boutons = [];
  const manques = [];

  for (const f of [...fichiersEcrans].sort()) {
    const src = lire(f);
    const cq = cliquablesParFichier.get(f);
    const tv = textesVisibles(src);
    const routesDuFichier = routes.filter((r) => (ecransParRoute.get(r) ?? []).includes(f));
    ecrans.push({
      fichier: f,
      routes: routesDuFichier,
      cliquables: cq?.total ?? 0,
      parMoteur: cq?.moteur ?? 0,
      sansAction: cq?.sansAction ?? 0,
      textes: tv.textes,
      mots: tv.mots,
    });
    for (const m of src.matchAll(/\btrpc\.([a-zA-Z]+)\./g)) {
      const prop = moteurParRouteur.get(m[1]);
      if (prop) preuve(prop, `${f} appelle trpc.${m[1]}`);
    }
    for (const c of composantsImportes(f)) {
      const comp = composantsClient.find((x) => x.fichier === c);
      for (const r of comp?.routeurs ?? []) {
        const prop = moteurParRouteur.get(r);
        if (prop) preuve(prop, `${f} embarque ${c.replace(/^client\/src\//, "")} (trpc.${r})`);
      }
    }
    if (/<BoutonMoteur\b/.test(src)) preuve("boutons", `${f} utilise BoutonMoteur`);
    if (/useRedirection|redirectionEngine\./.test(src)) preuve("redirection", `${f} interroge le Moteur de Redirection`);
    for (const m of src.matchAll(/<BoutonMoteur\b[\s\S]{0,400}?code="([a-z0-9_]+)"/g)) {
      const ligne = src.slice(0, m.index).split("\n").length;
      const a = codesBoutons.get(m[1]);
      boutons.push({
        code: m[1],
        libelle: a?.libelle ?? "(non déclaré au Moteur de boutons)",
        genre: a?.genre ?? "non_declaree",
        ecran: routesDuFichier[0] ?? a?.ecran ?? "",
        fichier: f,
        ligne,
      });
      if (!a) manques.push({ genre: "bouton_non_declare", detail: `${m[1]} (${f}:${ligne})` });
    }
    for (const a of anomaliesParFichier.get(f) ?? []) {
      if (a.motif === "sans_action") manques.push({ genre: "bouton_sans_action", detail: `« ${a.libelle} » ${a.fichier}:${a.ligne}` });
      if (a.motif === "destination_inconnue") manques.push({ genre: "destination_inconnue", detail: `${a.libelle} ${a.fichier}:${a.ligne}` });
    }
    if (tv.textes < 5) manques.push({ genre: "ecran_sans_contenu", detail: `${f} (${tv.textes} texte(s))` });
  }

  // Boutons déclarés au catalogue pour les écrans du moteur mais absents des écrans.
  for (const a of ACTIONS_BOUTONS) {
    if (moteurDeRoute(a.ecran) !== moteur) continue;
    if (!boutons.some((b) => b.code === a.code)) {
      boutons.push({ code: a.code, libelle: a.libelle, genre: a.genre, ecran: a.ecran, fichier: "", ligne: 0 });
      manques.push({ genre: "bouton_declare_absent_ecran", detail: `${a.code} déclaré pour ${a.ecran} mais aucun écran ne l'utilise` });
    }
  }

  // Événements.
  const abonnements = SUBSCRIPTIONS.filter((s) => s.engine === moteur).map((s) => ({ eventType: s.eventType, handler: s.handler }));
  const evenementsConsommes = [...new Set(abonnements.map((a) => a.eventType))].sort();
  if (abonnements.length) preuve("event_bus", "abonné au bus");
  // Liaison par le bus : publier un événement qu'un moteur consomme, ou
  // consommer un événement qu'un moteur émet, est un branchement réel.
  for (const c of evenementsPublies) {
    for (const abonne of abonnesParEvenement.get(c) ?? []) preuve(abonne, `publie ${c}, consommé par ${abonne}`);
  }
  for (const c of evenementsConsommes) {
    for (const em of emetteursParEvenement.get(c) ?? []) {
      if ((seed?.dependencies ?? []).includes(em)) preuve(em, `consomme ${c} émis par ${em}`);
    }
  }
  for (const c of evenementsPublies) {
    if (!codesEvenements.has(c)) manques.push({ genre: "evenement_hors_catalogue", detail: c });
    else if (!(abonnesParEvenement.get(c) ?? []).length && !(abonnesParEvenement.get("*") ?? []).length) manques.push({ genre: "evenement_sans_abonne", detail: c });
  }
  const sourcesAdmises = new Set([moteur, ...(p.sourcesBus ?? [])]);
  for (const s of sourcesEmission) {
    if (!sourcesAdmises.has(s)) manques.push({ genre: "source_emission_non_reconnue", detail: `source "${s}" au lieu de "${moteur}"` });
  }
  if (emissionsDynamiques) manques.push({ genre: "emission_dynamique", detail: `${emissionsDynamiques} émission(s) au type calculé, non vérifiable statiquement` });

  // Dépendances : déclarées vs détectées.
  const declarees = seed?.dependencies ?? [];
  const detectees = [...dependancesDetectees.keys()].sort();
  for (const d of detectees) if (!declarees.includes(d)) manques.push({ genre: "dependance_non_declaree", detail: `${d} — ${dependancesDetectees.get(d)[0]}` });
  for (const d of declarees) if (!detectees.includes(d) && d !== "core") manques.push({ genre: "dependance_sans_preuve", detail: d });
  for (const d of declarees) if (!nomsMoteurs.has(d)) manques.push({ genre: "dependance_inconnue", detail: d });

  // Intégrations techniques : une dépendance dont TOUTES les preuves ne sont
  // qu'une vérification de session/rôle, une écriture d'audit ou un usage du
  // contrat public d'un OS — jamais une dépendance métier. Calculé, pas
  // déclaré : la moindre preuve d'usage métier réel exclut le moteur cible.
  const integrationsTechniques = [...dependancesDetectees.entries()]
    .filter(([, preuves]) => preuves.length > 0 && preuves.every(estPreuveTechnique))
    .map(([dep]) => dep)
    .sort();

  // Existence et battement.
  if (!fichiers.length) manques.push({ genre: "sans_logique_serveur", detail: "aucun dossier serveur : moteur d'écran seulement" });
  const battement = battementInterne || avecSonde.has(moteur) || avecPont.has(moteur) || avecContrat.has(moteur);
  if (!battement) manques.push({ genre: "sans_battement", detail: "ni sonde, ni pont OS, ni contrat, ni heartbeat dans le code" });
  for (const [motif, m] of routesDeclareesSansEcran) if (m === moteur) manques.push({ genre: "route_sans_ecran", detail: motif });
  if (!routes.length && !ecransHotes.length && fichiers.length) manques.push({ genre: "sans_ecran", detail: "aucune route client ne mène à ce moteur" });

  resultats.set(moteur, {
    moteur,
    label: seed?.label ?? moteur,
    categorie: seed?.category ?? "transversal",
    etatDeclare: seed?.state ?? "staging",
    dossiers: p.dossiers,
    routeurs: p.routeurs,
    fichiersServeur: fichiers.length,
    dependancesDeclarees: [...declarees].sort(),
    dependancesDetectees: detectees,
    dependances: [...new Set([...declarees, ...detectees])].sort(),
    integrationsTechniques,
    preuvesDependances: Object.fromEntries([...dependancesDetectees.entries()].sort()),
    dependants: [],
    evenementsPublies: [...evenementsPublies].sort(),
    evenementsConsommes,
    abonnements,
    sourcesEmission: [...sourcesEmission].sort(),
    boutons: boutons.sort((a, b) => a.code.localeCompare(b.code)),
    routes,
    ecrans,
    ecransHotes,
    procedures: [...new Set(procedures)].sort(),
    tables: [...tables].sort(),
    acces: [...acces].sort(),
    textes: ecrans.reduce((n, e) => n + e.textes, 0),
    mots: ecrans.reduce((n, e) => n + e.mots, 0),
    battement: battementInterne ? "code" : avecPont.has(moteur) ? "pont_os" : avecContrat.has(moteur) ? "contrat" : avecSonde.has(moteur) ? "sonde" : "aucun",
    manques,
  });
}

// Dépendants = inverse des dépendances réelles (déclarées ∪ détectées).
for (const r of resultats.values()) {
  for (const d of r.dependances) resultats.get(d)?.dependants.push(r.moteur);
}
for (const r of resultats.values()) r.dependants.sort();

// ── 6. Cohérence globale ──────────────────────────────────────────────────
if (erreurs.length) {
  console.error("Moteurs : périmètre déclaré incohérent —");
  for (const e of erreurs) console.error("  • " + e);
  process.exit(1);
}

const moteurs = [...resultats.values()].sort((a, b) => a.moteur.localeCompare(b.moteur));
const totalManques = moteurs.reduce((n, m) => n + m.manques.length, 0);
const parGenre = {};
for (const m of moteurs) for (const q of m.manques) parGenre[q.genre] = (parGenre[q.genre] ?? 0) + 1;

const sortie = `/**
 * Périmètre réel de chaque moteur.
 *
 * Fichier GÉNÉRÉ par scripts/gen-moteurs.mjs depuis le code du dépôt.
 * Ne pas éditer à la main : \`npm run gen:moteurs\` le régénère, et la
 * construction échoue s'il est périmé.
 *
 * Chaque moteur y trouve tout ce qui est à lui — dépendances prouvées,
 * dépendants, événements publiés et consommés, boutons et leur emplacement,
 * écrans, textes, procédures, tables, accès — et la liste nominative de ce
 * qui lui manque. Le registre central lit ce fichier : on interroge le moteur,
 * pas l'écran.
 */

export type GenreManque =
  | "bouton_sans_action"
  | "bouton_non_declare"
  | "bouton_declare_absent_ecran"
  | "destination_inconnue"
  | "ecran_sans_contenu"
  | "evenement_hors_catalogue"
  | "evenement_sans_abonne"
  | "source_emission_non_reconnue"
  | "emission_dynamique"
  | "dependance_non_declaree"
  | "dependance_sans_preuve"
  | "dependance_inconnue"
  | "sans_logique_serveur"
  | "sans_battement"
  | "sans_ecran"
  | "route_sans_ecran";

export interface ManqueMoteur {
  readonly genre: GenreManque;
  readonly detail: string;
}

export interface BoutonDuMoteur {
  readonly code: string;
  readonly libelle: string;
  readonly genre: string;
  /** Route de l'écran où vit le bouton. */
  readonly ecran: string;
  /** Fichier et ligne exacts ; vides si le bouton est déclaré mais absent. */
  readonly fichier: string;
  readonly ligne: number;
}

export interface EcranDuMoteur {
  readonly fichier: string;
  readonly routes: readonly string[];
  readonly cliquables: number;
  /** Cliquables passés par le Moteur de boutons. */
  readonly parMoteur: number;
  readonly sansAction: number;
  readonly textes: number;
  readonly mots: number;
}

export interface PerimetreMoteur {
  readonly moteur: string;
  readonly label: string;
  readonly categorie: string;
  readonly etatDeclare: string;
  readonly dossiers: readonly string[];
  readonly routeurs: readonly string[];
  readonly fichiersServeur: number;
  readonly dependancesDeclarees: readonly string[];
  readonly dependancesDetectees: readonly string[];
  /** Déclarées ∪ détectées : c'est cette liste que le registre applique. */
  readonly dependances: readonly string[];
  /**
   * Sous-ensemble de dependances dont TOUTES les preuves détectées ne sont
   * qu'une intégration technique transversale (session/rôle, audit, contrat
   * public d'un OS) — jamais une dépendance métier. Exclu du graphe de
   * cycles métier par server/engine-registry/dependencies.ts, mais toujours
   * un couplage réel pour l'impact en cascade. Preuves plafonnées à 3 par
   * dépendance (voir preuve() plus haut) : une 4e preuve métier non
   * capturée resterait invisible ici, comme pour dependance_sans_preuve.
   */
  readonly integrationsTechniques: readonly string[];
  readonly preuvesDependances: Readonly<Record<string, readonly string[]>>;
  readonly dependants: readonly string[];
  readonly evenementsPublies: readonly string[];
  readonly evenementsConsommes: readonly string[];
  readonly abonnements: readonly { readonly eventType: string; readonly handler: string }[];
  readonly sourcesEmission: readonly string[];
  readonly boutons: readonly BoutonDuMoteur[];
  readonly routes: readonly string[];
  readonly ecrans: readonly EcranDuMoteur[];
  /** Écrans d'autres moteurs où ce moteur est réellement utilisé via un composant partagé. */
  readonly ecransHotes: readonly { readonly fichier: string; readonly route: string; readonly composants: readonly string[] }[];
  readonly procedures: readonly string[];
  readonly tables: readonly string[];
  readonly acces: readonly string[];
  readonly textes: number;
  readonly mots: number;
  readonly battement: "code" | "pont_os" | "contrat" | "sonde" | "aucun";
  readonly manques: readonly ManqueMoteur[];
}

export const MOTEURS_TOTAL = ${moteurs.length};
export const MANQUES_TOTAL = ${totalManques};
export const MANQUES_PAR_GENRE: Readonly<Record<string, number>> = ${JSON.stringify(parGenre, null, 2)};

/** Routes client qu'aucun moteur ne revendique. */
export const ROUTES_SANS_MOTEUR: readonly string[] = ${JSON.stringify(routesOrphelines.sort(), null, 2)};

/** Routeurs tRPC montés qu'aucun moteur ne revendique. */
export const ROUTEURS_SANS_MOTEUR: readonly string[] = ${JSON.stringify(routeursOrphelins.sort(), null, 2)};

/** Fichiers serveur qu'aucun moteur ne possède (hors racine technique). */
export const FICHIERS_SANS_MOTEUR: readonly string[] = ${JSON.stringify(fichiersServeurOrphelins.sort(), null, 2)};

export const MOTEURS: readonly PerimetreMoteur[] = ${JSON.stringify(moteurs, null, 2)};

export function perimetreDe(moteur: string): PerimetreMoteur | undefined {
  return MOTEURS.find((m) => m.moteur === moteur);
}
`;

if (process.argv.includes("--check")) {
  const actuel = existsSync(CIBLE) ? readFileSync(CIBLE, "utf8") : "";
  if (actuel !== sortie) {
    console.error(`Moteurs : ${CIBLE} est périmé. Lancer \`npm run gen:moteurs\` et committer le résultat.`);
    process.exit(1);
  }
  console.log(`Moteurs : périmètre à jour — ${moteurs.length} moteurs, ${totalManques} manques nommés.`);
} else {
  writeFileSync(CIBLE, sortie);
  console.log(`Moteurs : ${moteurs.length} moteurs, ${totalManques} manques nommés → ${CIBLE}`);
  console.log(`  routes sans moteur : ${routesOrphelines.length}, routeurs sans moteur : ${routeursOrphelins.length}, fichiers serveur sans moteur : ${fichiersServeurOrphelins.length}`);
  console.log("  manques par genre :", parGenre);
}
