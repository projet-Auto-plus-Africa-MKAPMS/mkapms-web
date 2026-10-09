/**
 * Générateur de l'inventaire du Centre Cyber-Électrique MKA.P-MS / Frontier OS.
 *
 *   npx tsx scripts/gen-frontier-inventaire.ts --shop ../mkapms-shop
 *
 * LECTURE SEULE : le dépôt de la Boutique est lu (jamais modifié, jamais appelé en réseau) ; le dépôt de la plateforme est lu et deux
 * fichiers `*.generated.ts` plus un document sont écrits dans CE dépôt. Chaque fait écrit vient d'un fichier relevé, avec sa référence
 * (chemin:ligne) et le commit exact. Rien n'est inventé : ce que le code ne prouve pas reste « déclaré seulement » ou « à vérifier ».
 *
 * Méthode (voir aussi docs/CENTRE-INVENTAIRE-2026-10-09.md, section « Limites de la méthode ») :
 *  - Boutique : registre `ENGINE_REGISTRY` + `ENGINE_DETAILS` (server/shop-intelligent-system.mjs), liaisons d'exécution `ENGINE_BINDINGS`
 *    (server/engine-runtime.mjs), routes réellement déclarées dans server/*.mjs, audit des exigences (server/gap-inventory.json), contrats
 *    de connexion (migrations/0057) et accès de service (server/service-access.mjs).
 *  - Plateforme : périmètre généré des moteurs (server/data/moteurs.ts), catalogue (server/engine-registry/catalog.ts), fichiers de test
 *    présents dans les dossiers de chaque moteur.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { ENGINE_CATALOG } from "../server/engine-registry/catalog.js";
import { MOTEURS } from "../server/data/moteurs.js";
import { INTERMEDIAIRES_BOUTIQUE } from "../server/frontier-os/shop-inventory.js";
import { CANAUX, CANAUX_IDS, type CanalId } from "../server/shop-link/contrats.js";
import type { ExigenceBoutique, InventaireBoutique, InventairePlateforme, LigneInventaire, SourceInventaire } from "../server/frontier-os/inventaire/types.js";

const RACINE = process.cwd();
const argShop = process.argv.indexOf("--shop");
const SHOP = path.resolve(RACINE, argShop >= 0 ? (process.argv[argShop + 1] ?? "") : "../mkapms-shop");
const AUJOURDHUI = new Date().toISOString().slice(0, 10);

if (!existsSync(path.join(SHOP, "server/shop-intelligent-system.mjs"))) {
  console.error(`Dépôt de la Boutique introuvable ou incomplet : ${SHOP}`);
  process.exit(2);
}

const git = (dir: string, ...a: string[]) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8" }).trim();
const lire = (dir: string, f: string) => readFileSync(path.join(dir, f), "utf8");

/** Extrait le littéral (objet ou tableau) qui suit `marqueur`, en ignorant chaînes et expressions régulières, puis l'évalue sans aucun accès. */
function litteral(source: string, marqueur: string): unknown {
  const debut = source.indexOf(marqueur);
  if (debut < 0) throw new Error(`Marqueur introuvable : ${marqueur}`);
  let i = debut + marqueur.length;
  while (!"[{".includes(source[i] ?? "")) i++;
  const ouvre = source[i]!;
  const ferme = ouvre === "[" ? "]" : "}";
  let profondeur = 0;
  let dernier = "";
  for (let k = i; k < source.length; k++) {
    const c = source[k]!;
    if (c === "'" || c === '"' || c === "`") {
      const q = c;
      for (k++; k < source.length && source[k] !== q; k++) if (source[k] === "\\") k++;
      dernier = q;
      continue;
    }
    if (c === "/" && "(,:=[{!&|?;".includes(dernier || "(") && source[k + 1] !== "/" && source[k + 1] !== "*") {
      let classe = false;
      for (k++; k < source.length; k++) {
        const d = source[k]!;
        if (d === "\\") k++;
        else if (d === "[") classe = true;
        else if (d === "]") classe = false;
        else if (d === "/" && !classe) break;
      }
      dernier = "/";
      continue;
    }
    if (c === ouvre) profondeur++;
    else if (c === ferme) {
      profondeur--;
      if (profondeur === 0) return vm.runInNewContext(`(${source.slice(i, k + 1)})`, Object.create(null), { timeout: 2000 });
    }
    if (!/\s/.test(c)) dernier = c;
  }
  throw new Error(`Littéral non terminé : ${marqueur}`);
}

const numeroLigne = (source: string, motif: RegExp): number => {
  const m = motif.exec(source);
  return m ? source.slice(0, m.index).split("\n").length : 0;
};

function fichiersRecursifs(dir: string, ok: (f: string) => boolean): string[] {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return [];
  return (readdirSync(dir, { recursive: true }) as string[]).filter(ok).map((f) => f.split(path.sep).join("/")).sort();
}

// ───────────────────────── Boutique ─────────────────────────
interface RegistreBoutique { id: string; label: string; area: string; level: string; tables?: string[]; env?: string[]; deps?: string[]; external?: string }
interface DetailBoutique { mission?: string; dashboard?: string; realtime?: string; nextAction?: string }

const shopCommit = git(SHOP, "rev-parse", "HEAD");
const shopDate = git(SHOP, "log", "-1", "--format=%cI");
const srcSysteme = lire(SHOP, "server/shop-intelligent-system.mjs");
const srcRuntime = lire(SHOP, "server/engine-runtime.mjs");
const REGISTRE = litteral(srcSysteme, "const ENGINE_REGISTRY =") as RegistreBoutique[];
const DETAILS = litteral(srcSysteme, "const ENGINE_DETAILS =") as Record<string, DetailBoutique>;
const BINDINGS = litteral(srcRuntime, "export const ENGINE_BINDINGS=") as Record<string, RegExp[]>;
const GAP = JSON.parse(lire(SHOP, "server/gap-inventory.json")) as {
  auditedCommit: string; masterPlanCompleteInRepository: boolean;
  engines: { engine: string; observed: string; evidence: string[]; criteria: Record<string, { state: "PARTIAL" | "MISSING" | "COMPLETE" }> }[];
};
if (REGISTRE.length < 50) throw new Error(`Registre de la Boutique suspect : ${REGISTRE.length} moteurs`);

// Routes déclarées dans le code de la Boutique : littérales (/api/…) et relatives montées sous un préfixe (app.use('/api/x', routeur)).
const fichiersServeur = readdirSync(path.join(SHOP, "server")).filter((f) => f.endsWith(".mjs")).sort();
const routesAbsolues = new Set<string>();
const routesRelatives = new Set<string>();
const montages = new Set<string>();
for (const f of fichiersServeur) {
  const t = lire(SHOP, `server/${f}`);
  for (const m of t.matchAll(/\b[A-Za-z_$][\w$]*\.(get|post|put|patch|delete|all|use)\(\s*(['"`])(\/[^'"`]*)\2/g)) {
    const r = m[3]!.replace(/:[A-Za-z_]+/g, "x");
    if (r.startsWith("/api")) routesAbsolues.add(r);
    else routesRelatives.add(r);
    if (m[1] === "use" && r.startsWith("/api")) montages.add(r.replace(/\/$/, ""));
  }
}
const routesPossibles = new Set<string>(routesAbsolues);
for (const mont of montages) for (const rel of routesRelatives) routesPossibles.add(mont + rel);

const testsBoutique = new Set(fichiersRecursifs(path.join(SHOP, "tests"), (f) => /\.(test|integration)\.(m?ts|mjs)$/.test(f)).map((f) => `tests/${f}`));
const migrationsBoutique = fichiersRecursifs(path.join(SHOP, "migrations"), (f) => f.endsWith(".sql"));

// Correspondance registre → exigence du plan d'ensemble de la Boutique (posée à la main, vérifiée sur les noms : pas de correspondance floue).
const EXIGENCE_DE: Readonly<Record<string, string>> = {
  "shop.engine": "Shop Engine", "commerce.kernel": "Commerce Kernel", product: "Product Engine", catalogue: "Catalog Engine", offer: "Offer Engine",
  attribute: "Attribute Engine", variant: "Variant Engine", manufacturer: "Manufacturer Engine", "search.index": "Search Index Engine", filter: "Filter Engine",
  recommendation: "Recommendation Engine", feed: "Feed Engine", seo: "SEO Engine", campaign: "Campaign Engine", promotion: "Promotion Engine", coupon: "Coupon Engine",
  pricing: "Pricing Engine", cart: "Cart Engine", checkout: "Checkout Engine", order: "Order Engine", "payment.gateway": "Payment Gateway", ledger: "Internal Ledger",
  payout: "Payout Engine", documents: "Document Engine", invoice: "Invoice Engine", inventory: "Inventory Engine", warehouse: "Warehouse Engine", supplier: "Supplier Engine",
  "supplier.connector": "Supplier Connector Engine", shipping: "Shipping Calculation Engine", customs: "Customs Engine", carrier: "Carrier Adapter Registry",
  return: "Return Engine", refund: "Refund Engine", after_sales: "After-Sales Engine", customer: "Customer Accounts", seller: "Seller Engine", review: "Review Engine",
  rating: "Rating Engine", qa: "Question/Answer Engine", trust: "Trust Engine", fraud: "Fraud Engine", moderation: "Moderation Engine", "product.policy": "Product Policy Engine",
  media: "Product Media Engine", "image.processing": "Image Processing Engine", analytics: "Analytics Engine", business_intelligence: "Business Intelligence Engine",
  "developer.agent": "IA Developer Agent", audit: "Audit Engine", privacy: "Privacy/Consent Engine", notification: "Notification Engine", webhook: "Webhook Engine",
  queue: "Queue/Job Engine", scheduler: "Scheduler Engine", cache: "Cache Engine",
};
const gapParNom = new Map(GAP.engines.map((e) => [e.engine, e]));
for (const nom of Object.values(EXIGENCE_DE)) if (!gapParNom.has(nom)) throw new Error(`Exigence inconnue dans gap-inventory.json : ${nom}`);

// Contrats de connexion de la Boutique, relus dans la migration 0057 (jamais recopiés à la main).
const sql0057 = lire(SHOP, "migrations/0057_shop_preparation_readiness.sql");
const contrats = [...sql0057.matchAll(/^ \('([a-z0-9_.-]+)','([^']*)','([^']*)','([^']*)','([^']*)',.*?'(READY|BLOCKED_EXTERNAL|DRAFT|DISABLED)','/gm)].map((m) => ({
  id: m[1]!, source: m[2]!, cible: m[3]!, moteur: m[4]!, but: m[5]!, statut: m[6]!, ligne: numeroLigne(sql0057, new RegExp(`^ \\('${m[1]!}'`, "m")),
}));
for (const i of INTERMEDIAIRES_BOUTIQUE) {
  if (i.id === "service-access") continue;
  const c = contrats.find((x) => x.id === i.id);
  if (!c) throw new Error(`Contrat ${i.id} absent de la migration 0057`);
  if (c.moteur !== i.moteurBoutique) throw new Error(`Contrat ${i.id} : moteur ${c.moteur} ≠ ${i.moteurBoutique}`);
}
if (contrats.length !== 5) throw new Error(`La migration 0057 devait porter 5 contrats, ${contrats.length} relevés`);
const accesService = existsSync(path.join(SHOP, "server/service-access.mjs"));

const routesService = [...routesPossibles].filter((r) => r.startsWith("/api/service")).sort();
const testsService = [...testsBoutique].filter((f) => /service-access/.test(f));

const intermediaireDeMoteur = new Map<string, (typeof INTERMEDIAIRES_BOUTIQUE)[number]>();
for (const i of INTERMEDIAIRES_BOUTIQUE) if (!intermediaireDeMoteur.has(i.moteurBoutique)) intermediaireDeMoteur.set(i.moteurBoutique, i);

const lignesBoutique: LigneInventaire[] = REGISTRE.map((e) => {
  const patterns = BINDINGS[e.id] ?? [];
  const entrees = [...routesPossibles].filter((r) => patterns.some((p) => p.test(r))).sort();
  const exigenceNom = EXIGENCE_DE[e.id];
  const exigence = exigenceNom ? gapParNom.get(exigenceNom) : undefined;
  const tests = exigence ? exigence.evidence.filter((f) => f.startsWith("tests/") && testsBoutique.has(f)).sort() : [];
  const critMissing = exigence ? Object.entries(exigence.criteria).filter(([, v]) => v.state === "MISSING").map(([k]) => k) : [];
  const inter = intermediaireDeMoteur.get(e.id);
  const bloqueExterne = e.level === "external" && !!e.external;
  const lieAuRuntime = patterns.length > 0 && entrees.length > 0;
  const lignRegistre = numeroLigne(srcSysteme, new RegExp(`\\{id:'${e.id.replace(/[.]/g, "\\.")}'`));
  const lignBinding = numeroLigne(srcRuntime, new RegExp(`^ '${e.id.replace(/[.]/g, "\\.")}':\\[`, "m"));

  let etat: LigneInventaire["etat"];
  if (lieAuRuntime && tests.length > 0) etat = "teste";
  else if (lieAuRuntime) etat = "installe";
  else if (inter && inter.etatDeclare === "READY") etat = "prepare";
  else etat = "incomplet";
  if (bloqueExterne && !lieAuRuntime) etat = "incomplet";

  const manques: string[] = [];
  if (!patterns.length) manques.push("aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)");
  else if (!entrees.length) manques.push("liaison déclarée mais aucune route correspondante retrouvée dans le code");
  if (bloqueExterne) manques.push(`accès externe requis : ${e.external}`);
  if (!exigence) manques.push("aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)");
  else if (!tests.length) manques.push("aucun fichier de test existant relevé pour ce moteur");
  if (critMissing.length) manques.push(`audit de la Boutique : critères manquants — ${critMissing.join(", ")}`);
  for (const dep of e.deps ?? []) if (!REGISTRE.some((x) => x.id === dep)) manques.push(`dépendance absente du registre : ${dep}`);

  const doublons: string[] = [];
  if (/legacy/i.test(e.label)) doublons.push("vue héritée : recouvre les moteurs payment.* (à retirer quand ils sont complets)");
  for (const autre of REGISTRE) {
    if (autre.id === e.id) continue;
    const t1 = [...(e.tables ?? [])].sort().join("|");
    const t2 = [...(autre.tables ?? [])].sort().join("|");
    if (t1 && t1 === t2) doublons.push(`mêmes tables que ${autre.id} (${autre.label})`);
  }

  const connexionsExistantes: string[] = [];
  const connexionsAConstruire: string[] = [];
  if (inter) {
    connexionsExistantes.push(`contrat « ${inter.id} » (${inter.etatDeclare}) déclaré côté Boutique — ${inter.preuve}`);
    if (inter.canalPlateforme) connexionsExistantes.push(`canal « ${inter.canalPlateforme} » du moteur intermédiaire shop_link côté plateforme (câble coupé par défaut)`);
    else connexionsAConstruire.push("canal du moteur intermédiaire côté plateforme");
    if (inter.sens !== "plateforme_vers_boutique") connexionsAConstruire.push("émetteur côté Boutique : la Boutique n'appelle jamais la plateforme (AGENTS.md) — à construire par les agents de la Boutique, aucune décision ici");
    if (inter.etatDeclare === "BLOCKED_EXTERNAL") connexionsAConstruire.push("accès externe requis avant toute activation");
  }

  const aVerifier: string[] = [];
  const refs = [`server/shop-intelligent-system.mjs:${lignRegistre}`];
  if (lignBinding) refs.push(`server/engine-runtime.mjs:${lignBinding}`);
  if (exigence) for (const f of exigence.evidence) if (!f.startsWith("tests/") && existsSync(path.join(SHOP, f))) refs.push(f);

  const d = DETAILS[e.id] ?? {};
  return {
    id: e.id, nom: e.label, fonction: d.mission ?? e.label, domaine: e.area, niveauDeclare: e.level,
    code: [...new Set(refs)], serviceExecution: lieAuRuntime ? "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime" : "aucun service d'exécution relevé",
    entrees: patterns.map((p) => p.source), entreesTrouvees: entrees.length, tables: e.tables ?? [], dependances: e.deps ?? [], tests,
    etat, preuve: lieAuRuntime ? (tests.length ? "tests" : "liaison") : "declare", declareSeulement: !lieAuRuntime,
    intermediairePrevu: inter?.id ?? null, connexionsExistantes, connexionsAConstruire, manques, doublons, aVerifier,
  };
});

const intermediairesBoutique: LigneInventaire[] = INTERMEDIAIRES_BOUTIQUE.map((i) => {
  const c = contrats.find((x) => x.id === i.id);
  const moteur = lignesBoutique.find((x) => x.id === i.moteurBoutique);
  const estService = i.id === "service-access";
  const emetteur = i.sens === "plateforme_vers_boutique";
  const manques: string[] = [];
  const aVerifier: string[] = [];
  let etat: LigneInventaire["etat"];
  if (estService) etat = accesService && testsService.length ? "teste" : accesService ? "installe" : "incomplet";
  else if (c?.statut === "READY") etat = "prepare";
  else etat = "incomplet";
  if (!estService) manques.push("contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte");
  if (c?.statut === "BLOCKED_EXTERNAL") manques.push("accès externe requis avant toute activation (statut BLOCKED_EXTERNAL)");
  if (!i.dansRegistreBoutique) {
    manques.push(`le moteur « ${i.moteurBoutique} » nommé par le contrat n'existe pas dans le registre des moteurs de la Boutique`);
    aVerifier.push(`moteur « ${i.moteurBoutique} » absent du registre de la Boutique`);
  }
  if (!emetteur) manques.push("aucun émetteur vers la plateforme dans la Boutique (sa règle AGENTS.md : la Boutique n'appelle jamais la plateforme)");
  if (moteur && moteur.etat === "incomplet") manques.push(`le moteur « ${moteur.id} » qu'elle expose est lui-même incomplet`);
  return {
    id: i.id, nom: i.libelle, fonction: c?.but ?? i.libelle, domaine: "intermédiaire", niveauDeclare: i.etatDeclare,
    code: estService ? ["server/service-access.mjs", "docs/SHOP-SERVICE-ACCESS-2026-10-02.md"] : [`migrations/0057_shop_preparation_readiness.sql:${c?.ligne ?? 0}`],
    serviceExecution: estService ? "mkapms-shop · serveur Express · routes /api/service/* (jeton de service)" : "aucun (contrat déclaré dans shop_strategy.connection_contracts)",
    entrees: estService ? routesService : [], entreesTrouvees: estService ? routesService.length : 0, tables: [], dependances: [i.moteurBoutique],
    tests: estService ? testsService : [], etat, preuve: estService ? (testsService.length ? "tests" : "liaison") : "declare", declareSeulement: !estService,
    intermediairePrevu: i.id,
    connexionsExistantes: i.canalPlateforme ? [`canal « ${i.canalPlateforme} » de shop_link côté plateforme`] : [],
    connexionsAConstruire: [...(i.canalPlateforme ? [] : ["canal du moteur intermédiaire côté plateforme"]), ...(emetteur ? [] : ["émetteur côté Boutique (à construire par les agents de la Boutique)"])],
    manques, doublons: [], aVerifier,
  };
});

const exigences: ExigenceBoutique[] = GAP.engines.map((g) => ({
  nom: g.engine,
  critere: Object.fromEntries(Object.entries(g.criteria).map(([k, v]) => [k, v.state])) as ExigenceBoutique["critere"],
  moteurRegistre: Object.entries(EXIGENCE_DE).find(([, nom]) => nom === g.engine)?.[0] ?? null,
  observe: g.observed,
}));
const critereTotaux: Record<string, number> = {};
for (const g of GAP.engines) for (const v of Object.values(g.criteria)) critereTotaux[v.state] = (critereTotaux[v.state] ?? 0) + 1;

const sourceBoutique: SourceInventaire = {
  depot: "projet-Auto-plus-Africa-MKAPMS/mkapms-shop", commit: shopCommit, dateCommit: shopDate, genereLe: AUJOURDHUI,
  fichiersLus: ["server/shop-intelligent-system.mjs", "server/engine-runtime.mjs", "server/gap-inventory.json", "migrations/0057_shop_preparation_readiness.sql", "server/service-access.mjs", `server/*.mjs (${fichiersServeur.length} fichiers, routes)`, `tests/ (${testsBoutique.size} fichiers)`, `migrations/ (${migrationsBoutique.length} fichiers)`],
};

const inventaireBoutique: InventaireBoutique = {
  source: sourceBoutique,
  auditExigences: { commitAudite: GAP.auditedCommit, total: GAP.engines.length, criteres: critereTotaux, planCompletDansLeDepot: GAP.masterPlanCompleteInRepository },
  moteurs: lignesBoutique,
  intermediaires: intermediairesBoutique,
  exigences,
  exigencesSansMoteur: exigences.filter((x) => !x.moteurRegistre).map((x) => x.nom),
  moteursSansExigence: lignesBoutique.filter((l) => !EXIGENCE_DE[l.id]).map((l) => l.id),
  contrats: contrats.map((c) => ({ id: c.id, moteur: c.moteur, statut: c.statut, source: c.source, cible: c.cible })),
};

// ───────────────────────── Plateforme principale ─────────────────────────
const platCommit = git(RACINE, "rev-parse", "HEAD");
const platDate = git(RACINE, "log", "-1", "--format=%cI");
const catalogue = new Map(ENGINE_CATALOG.map((e) => [e.name, e]));
const parDossier = new Map<string, string[]>();
for (const m of MOTEURS) for (const d of m.dossiers) parDossier.set(d, [...(parDossier.get(d) ?? []), m.moteur]);
const parRouteur = new Map<string, string[]>();
for (const m of MOTEURS) for (const r of m.routeurs) parRouteur.set(r, [...(parRouteur.get(r) ?? []), m.moteur]);
const dependantDeIntermediaire = new Map<string, (typeof INTERMEDIAIRES_BOUTIQUE)[number][]>();
for (const i of INTERMEDIAIRES_BOUTIQUE) dependantDeIntermediaire.set(i.moteurPlateforme, [...(dependantDeIntermediaire.get(i.moteurPlateforme) ?? []), i]);

const lignesPlateforme: LigneInventaire[] = MOTEURS.map((m) => {
  const cat = catalogue.get(m.moteur);
  const tests = m.dossiers.flatMap((d) => {
    const chemin = path.join(RACINE, "server", d);
    if (existsSync(chemin) && statSync(chemin).isFile()) {
      const voisin = chemin.replace(/\.(ts|mts)$/, ".test.ts");
      return existsSync(voisin) ? [`server/${d.replace(/\.(ts|mts)$/, ".test.ts")}`] : [];
    }
    return fichiersRecursifs(chemin, (f) => /\.(test|spec)\.(ts|mts|mjs)$/.test(f)).map((f) => `server/${d}/${f}`);
  });
  const aDuCode = m.fichiersServeur > 0 && (m.routeurs.length > 0 || m.procedures.length > 0);
  const sansServeur = m.manques.some((x) => x.genre === "sans_logique_serveur") || m.fichiersServeur === 0;
  const liens = dependantDeIntermediaire.get(m.moteur) ?? [];
  const estIntermediaire = m.moteur === "shop_link";
  let etat: LigneInventaire["etat"];
  if (aDuCode && tests.length > 0) etat = "teste";
  else if (aDuCode) etat = "installe";
  else if (m.etatDeclare === "staging" && m.fichiersServeur > 0) etat = "prepare";
  else etat = "incomplet";
  if (sansServeur && !aDuCode) etat = "incomplet";

  const genres = new Map<string, number>();
  for (const x of m.manques) genres.set(x.genre, (genres.get(x.genre) ?? 0) + 1);
  const manques = [...genres].map(([g, n]) => `${g} ×${n}`);
  if (m.battement === "aucun") manques.push("aucun battement (aucune sonde de santé)");
  if (!tests.length) manques.push("aucun fichier de test dans les dossiers du moteur");

  const doublons: string[] = [];
  const voisins = new Set<string>();
  for (const d of m.dossiers) for (const x of parDossier.get(d) ?? []) if (x !== m.moteur) voisins.add(x);
  for (const r of m.routeurs) for (const x of parRouteur.get(r) ?? []) if (x !== m.moteur) voisins.add(x);
  for (const x of voisins) doublons.push(`dossier ou routeur partagé avec ${x}`);
  const racine = m.moteur.replace(/_engine$/, "");
  for (const autre of MOTEURS) if (autre.moteur !== m.moteur && (autre.moteur === `${racine}_engine` || autre.moteur === racine) && m.moteur !== autre.moteur && (m.moteur === racine || m.moteur === `${racine}_engine`)) doublons.push(`même racine de nom que ${autre.moteur} (à vérifier : deux moteurs pour une fonction ?)`);

  const connexionsExistantes: string[] = [];
  const connexionsAConstruire: string[] = [];
  for (const i of liens) {
    connexionsExistantes.push(i.canalPlateforme ? `face à « ${i.libelle} » : canal « ${i.canalPlateforme} » de shop_link (câble coupé par défaut)` : `face à « ${i.libelle} » : aucun canal côté plateforme`);
    if (!i.canalPlateforme) connexionsAConstruire.push(`canal shop_link pour « ${i.libelle} »`);
    if (i.etatDeclare === "BLOCKED_EXTERNAL") connexionsAConstruire.push(`accès externe requis (« ${i.libelle} »)`);
  }
  if (estIntermediaire) connexionsExistantes.push("6 canaux : catalogue, état, documents, ia-mémoire (disponibles) ; paiement, google (en attente d'un accès externe)");
  if (m.moteur === "frontier_os") connexionsExistantes.push("lit le câble de shop_link et le registre central (lecture seule)");

  const aVerifier: string[] = [];
  if (!cat) aVerifier.push("moteur présent dans le périmètre généré mais absent du catalogue de seed");
  return {
    id: m.moteur, nom: m.label, fonction: cat?.description ?? m.label, domaine: m.categorie, niveauDeclare: m.etatDeclare,
    code: [...m.dossiers.map((d) => `server/${d}/`), ...m.routeurs.map((r) => `server/router.ts (routeur « ${r} »)`)],
    serviceExecution: aDuCode ? "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc" : "aucun service d'exécution relevé",
    entrees: [...m.routeurs], entreesTrouvees: m.procedures.length, tables: [...m.tables], dependances: [...m.dependances], tests,
    etat, preuve: aDuCode ? (tests.length ? "tests" : "liaison") : "declare", declareSeulement: !aDuCode,
    intermediairePrevu: liens[0]?.id ?? (estIntermediaire ? "shop_link" : null), connexionsExistantes, connexionsAConstruire, manques, doublons, aVerifier,
  };
});

// Canaux du moteur intermédiaire shop_link (côté plateforme) : un « moteur intermédiaire » par canal.
const testsShopLink = fichiersRecursifs(path.join(RACINE, "server/shop-link"), (f) => /\.test\.ts$/.test(f)).map((f) => `server/shop-link/${f}`);
const ROUTES_CANAL: Readonly<Record<CanalId, readonly string[]>> = {
  catalogue: ["(sortant) routes /api/service de la Boutique, liste blanche ROUTES_CATALOGUE"],
  etat: ["/api/shop-link/v1/etat"],
  documents: ["/api/shop-link/v1/documents"],
  "ia-memoire": ["/api/shop-link/v1/ia/boite", "/api/shop-link/v1/ia/sortants", "/api/shop-link/v1/ia/accuse"],
  paiement: [],
  google: [],
};
const intermediairesPlateforme: LigneInventaire[] = CANAUX_IDS.map((id) => {
  const c = CANAUX[id];
  const attente = c.activation === "attente_externe";
  const lie = INTERMEDIAIRES_BOUTIQUE.find((i) => i.canalPlateforme === id);
  const manques: string[] = [];
  if (attente) manques.push(`attente externe : ${c.raisonAttente ?? "accès externe requis"}`);
  if (!lie) manques.push("aucun intermédiaire correspondant préparé côté Boutique (ia-mémoire) : à convenir avec les agents de la Boutique");
  return {
    id: `shop_link:${id}`, nom: c.libelle, fonction: c.description, domaine: "intermédiaire", niveauDeclare: c.activation,
    code: ["server/shop-link/contrats.ts", "server/shop-link/entrant.ts", "server/shop-link/sortant.ts", "server/shop-link/service.ts"],
    serviceExecution: attente ? "aucun (canal non branchable : attente externe)" : "plateforme principale · serveur Node unique · /api/shop-link",
    entrees: [...ROUTES_CANAL[id]], entreesTrouvees: ROUTES_CANAL[id].length, tables: ["shop_link_cables"], dependances: [], tests: attente ? [] : testsShopLink,
    etat: attente ? "incomplet" : testsShopLink.length ? "teste" : "installe", preuve: attente ? "declare" : testsShopLink.length ? "tests" : "liaison", declareSeulement: attente,
    intermediairePrevu: lie?.id ?? null,
    connexionsExistantes: lie ? [`face au contrat « ${lie.id} » de la Boutique (${lie.etatDeclare})`] : [],
    connexionsAConstruire: lie ? (lie.sens === "plateforme_vers_boutique" ? [] : ["émetteur côté Boutique (à construire par les agents de la Boutique)"]) : ["intermédiaire côté Boutique"],
    manques, doublons: [], aVerifier: lie ? [] : ["pas de contrat correspondant côté Boutique"],
  };
});

const inventairePlateforme: InventairePlateforme = {
  source: { depot: "projet-Auto-plus-Africa-MKAPMS/mkapms-web", commit: platCommit, dateCommit: platDate, genereLe: AUJOURDHUI, fichiersLus: ["server/data/moteurs.ts", "server/engine-registry/catalog.ts", "server/<dossier>/**/*.test.ts"] },
  moteurs: lignesPlateforme,
  intermediaires: intermediairesPlateforme,
};

// ───────────────────────── Sorties ─────────────────────────
const entete = (titre: string) => `/**\n * ${titre}\n *\n * Fichier GÉNÉRÉ par scripts/gen-frontier-inventaire.ts — ne pas éditer à la main.\n * Relevé en lecture seule, daté et lié à un commit exact (voir \`source\`).\n */\nimport type { Inventaire%TYPE% } from "./types.js";\n\n`;
const ecrire = (fichier: string, type: "Boutique" | "Plateforme", nom: string, titre: string, data: unknown) =>
  writeFileSync(path.join(RACINE, "server/frontier-os/inventaire", fichier), `${entete(titre).replace("%TYPE%", type)}export const ${nom}: Inventaire${type} = ${JSON.stringify(data, null, 1)};\n`);
ecrire("boutique.generated.ts", "Boutique", "INVENTAIRE_BOUTIQUE", "Inventaire des moteurs de la Boutique (dépôt mkapms-shop).", inventaireBoutique);
ecrire("plateforme.generated.ts", "Plateforme", "INVENTAIRE_PLATEFORME", "Inventaire des moteurs de la plateforme principale (dépôt mkapms-web).", inventairePlateforme);

const compte = (l: readonly LigneInventaire[]) => {
  const c: Record<string, number> = { incomplet: 0, prepare: 0, installe: 0, teste: 0, connecte: 0, a_verifier: 0 };
  for (const x of l) c[x.etat] = (c[x.etat] ?? 0) + 1;
  return c;
};
const cb = compte(lignesBoutique);
const cp = compte(lignesPlateforme);
const L = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
const tableau = (l: readonly LigneInventaire[]) =>
  ["| Moteur | Nom | État | Preuve | Entrées trouvées | Tests | Intermédiaire prévu | Manques principaux |", "| --- | --- | --- | --- | ---: | ---: | --- | --- |",
    ...l.map((x) => `| \`${x.id}\` | ${L(x.nom)} | ${x.etat} | ${x.preuve} | ${x.entreesTrouvees} | ${x.tests.length} | ${x.intermediairePrevu ?? "—"} | ${L(x.manques.slice(0, 2).join(" ; ") || "—")} |`)].join("\n");

const doc = `# Inventaire réel des moteurs — Centre Cyber-Électrique MKA.P-MS / Frontier OS

Fichier **généré** par \`scripts/gen-frontier-inventaire.ts\` le ${AUJOURDHUI}. Lecture seule : la Boutique n'a été ni modifiée ni appelée. Les données complètes (fonction, références fichier avec ligne, tests, manques, doublons) sont dans \`server/frontier-os/inventaire/*.generated.ts\`, affichées dans le centre, salle « Moteurs ».

## Sources relevées

| Dépôt | Commit | Date du commit |
| --- | --- | --- |
| Boutique (\`mkapms-shop\`) | \`${shopCommit}\` | ${shopDate} |
| Plateforme principale (\`mkapms-web\`) | \`${platCommit}\` | ${platDate} |

## Noms exacts et identités

Noms trouvés dans le code : « MKA.P-MS SHOP » / « MKA.P-MS Shop » (dépôt \`mkapms-shop\`), « MKAPMS Shop » (une fois, \`docs/SHOP-LIVING-PANELS-2026-10-08.md\` de la Boutique), « plateforme principale » (nom employé par le registre de la Boutique et les contrats). **« MKH Shop », « MKPMS Shop » et « boutique principale » n'existent dans aucun des deux dépôts.** Un seul dépôt de boutique est accessible. Rien n'est fusionné ni inventé : ces trois noms ne désignent pas une boutique à part : **précision du PDG (9 oct. 2026)** — le système est installé dans la plateforme principale, MKAPMS Web (le mot « Israël » de la précision vocale n'est pas compris et n'est pas repris). Les dépôts \`mkapms-carte\` (Map) et \`mkapms-deployment\` existent dans l'organisation mais ne sont pas inventoriés dans ce lot (la consigne : la Boutique d'abord, puis la plateforme principale) : **à vérifier**.

## Définition des états (prouvés par le code, jamais déclarés)

- **Incomplet** : déclaré, sans liaison d'exécution relevée, ou bloqué par un accès externe.
- **Préparé** : contrat ou structure prêts pour la connexion, sans exécution raccordée.
- **Installé** : une liaison d'exécution (route, procédure) existe dans le code.
- **Testé** : installé et un fichier de test existe dans le dépôt (les tests ne sont **pas** exécutés par cet inventaire).
- **Connecté** : liaison avec une autre plateforme observée et vérifiée par le centre. **Aucun moteur ne l'est aujourd'hui.**

« Déclaré seulement » = rien dans le code ne prouve que le moteur fonctionne : une table ou une fiche de registre n'est pas un moteur (formule de l'audit de la Boutique lui-même).

## Boutique — ${lignesBoutique.length} moteurs déclarés

Répartition : incomplets ${cb.incomplet} · préparés ${cb.prepare} · installés ${cb.installe} · testés ${cb.teste} · connectés ${cb.connecte}. Déclarés seulement (aucune liaison d'exécution) : ${lignesBoutique.filter((x) => x.declareSeulement).length}.

Audit propre de la Boutique (\`server/gap-inventory.json\`, commit audité \`${GAP.auditedCommit.slice(0, 7)}\`) : ${GAP.engines.length} exigences du plan d'ensemble, ${critereTotaux["PARTIAL"] ?? 0} critères partiels, ${critereTotaux["MISSING"] ?? 0} critères manquants, ${critereTotaux["COMPLETE"] ?? 0} complets ; plan complet dans le dépôt : **${GAP.masterPlanCompleteInRepository ? "oui" : "non"}**. ${inventaireBoutique.exigencesSansMoteur.length} exigences n'ont aucun moteur dans le registre ; ${inventaireBoutique.moteursSansExigence.length} moteurs du registre n'ont pas d'exigence rattachée (correspondance non établie, donc aucun test relevé pour eux — le relevé est prudent par construction).

${tableau(lignesBoutique)}

### Exigences sans moteur dans le registre de la Boutique

${inventaireBoutique.exigencesSansMoteur.map((x) => `- ${x}`).join("\n")}

## Moteurs intermédiaires préparés par la Boutique pour la plateforme (${INTERMEDIAIRES_BOUTIQUE.length})

| Intermédiaire | Moteur Boutique | Dans le registre | Déclaré | Sens | Face à (plateforme) | Canal shop_link |
| --- | --- | --- | --- | --- | --- | --- |
${INTERMEDIAIRES_BOUTIQUE.map((i) => `| ${i.id} | \`${i.moteurBoutique}\` | ${i.dansRegistreBoutique ? "oui" : "**non**"} | ${i.etatDeclare} | ${i.sens} | \`${i.moteurPlateforme}\` | ${i.canalPlateforme ?? "— (à créer)"} |`).join("\n")}

Cinq sont des **contrats déclarés** (lignes de \`shop_strategy.connection_contracts\`, migration 0057 : ${contrats.map((c) => `${c.id}=${c.statut}`).join(", ")}) ; un seul est du **code exécutable** : l'accès de service (\`server/service-access.mjs\`${accesService ? ", présent" : ", ABSENT"}). Le registre de la Boutique affirme lui-même \`mainPlatformConnection: 'FORBIDDEN'\` pour chaque moteur et sa règle AGENTS.md interdit à la Boutique d'appeler la plateforme : les trois contrats « Boutique → plateforme » n'ont donc **aucun émetteur** côté Boutique. C'est un écart à lever par les agents de la Boutique, pas par la plateforme.

### État de chaque intermédiaire de la Boutique (relevé)

${tableau(intermediairesBoutique)}

## Plateforme principale — canaux du moteur intermédiaire shop_link (${intermediairesPlateforme.length})

${tableau(intermediairesPlateforme)}

## Plateforme principale — ${lignesPlateforme.length} moteurs

Répartition : incomplets ${cp.incomplet} · préparés ${cp.prepare} · installés ${cp.installe} · testés ${cp.teste} · connectés ${cp.connecte}.

${tableau(lignesPlateforme)}

## Doublons et recouvrements relevés

Boutique : ${lignesBoutique.filter((x) => x.doublons.length).map((x) => `\`${x.id}\` (${x.doublons.join(" ; ")})`).join(" · ") || "aucun"}.

Plateforme : ${lignesPlateforme.filter((x) => x.doublons.length).map((x) => `\`${x.id}\` (${x.doublons.join(" ; ")})`).join(" · ") || "aucun"}.

Aucun doublon n'est fusionné ni supprimé ici : le centre les signale.

## Limites de la méthode

- Les routes de la Boutique sont lues dans le code (analyse statique des déclarations \`app.use/get/post…\` et des montages) : une route construite dynamiquement ne serait pas vue. Un moteur sans route trouvée est marqué incomplet, sans prétendre qu'il ne fonctionne pas.
- La correspondance entre un moteur du registre et une exigence du plan d'ensemble est posée à la main sur des noms identiques ou quasi (table \`EXIGENCE_DE\` du générateur). Les tests ne sont relevés que par ce biais.
- Aucun test n'est exécuté, aucune mesure n'est prise en direct : l'état de chaque moteur dans l'application réellement déployée reste **non observé** tant que le centre n'a pas de liaison contrôlée.
- Les statuts des contrats sont ceux de la migration 0057 ; la base réelle de la Boutique peut les avoir modifiés depuis.
`;
writeFileSync(path.join(RACINE, "docs/CENTRE-INVENTAIRE-2026-10-09.md"), doc);

console.log(`Boutique ${lignesBoutique.length} moteurs`, cb, `| liaisons ${Object.keys(BINDINGS).length}, routes ${routesPossibles.size}, tests ${testsBoutique.size}`);
console.log(`Plateforme ${lignesPlateforme.length} moteurs`, cp);
