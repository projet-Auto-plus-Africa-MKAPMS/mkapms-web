/**
 * Points 116-117-118 — lecture du code, apprentissage, mémoire des anomalies.
 *
 * Ce service ne devine rien : il ingère l'artefact produit au build par
 * `scripts/code-graph.mjs` (point 117), compare le relevé au précédent pour
 * apprendre ce qui a changé (point 116), et transforme les corrections
 * réellement enregistrées par les autres agents en classes d'anomalies
 * réutilisables (point 118).
 *
 * Si l'artefact n'a pas été généré, le service le **dit** — il ne fabrique pas
 * un graphe approximatif à partir de suppositions.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import { ctResults } from "../continuous-test/schema.js";
import { smartAlerts } from "../smart-engine/schema.js";
import { cgEdges, cgLessons, cgNodes, cgObservations, cgSnapshots } from "./schema.js";

const CHEMIN = path.resolve(process.cwd(), "server/data/code-graph.json");

export interface GrapheArtefact {
  generatedAt: string;
  commit: string | null;
  conventions: Record<string, number>;
  stats: Record<string, number>;
  noeuds: { id: string; type: string; label: string; [k: string]: unknown }[];
  aretes: { from: string; to: string; type: string }[];
}

export async function lireArtefact(): Promise<
  { ok: true; graphe: GrapheArtefact } | { ok: false; motif: string }
> {
  try {
    const brut = await readFile(CHEMIN, "utf8");
    const graphe = JSON.parse(brut) as GrapheArtefact;
    if (!Array.isArray(graphe.noeuds) || !Array.isArray(graphe.aretes))
      return { ok: false, motif: "Artefact illisible : structure inattendue." };
    return { ok: true, graphe };
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return {
      ok: false,
      motif:
        err.code === "ENOENT"
          ? "Le graphe n'a pas encore été généré (npm run build:graph). Aucune lecture du code n'est possible sans lui."
          : `Artefact inutilisable : ${err.message ?? "erreur inconnue"}`,
    };
  }
}

const TYPES_SUIVIS = new Set(["moteur", "table", "route", "api", "evenement", "test", "module"]);

function comprehension(kind: "apparition" | "disparition", type: string, cle: string): string {
  const nom = cle.split(":").slice(1).join(":");
  if (kind === "apparition") {
    switch (type) {
      case "table":
        return `Nouvelle table « ${nom} » : toute écriture dans ce domaine passe désormais aussi par elle.`;
      case "route":
        return `Nouvelle route « ${nom} » : une destination de plus à contrôler (bouton, redirection, permission).`;
      case "moteur":
        return `Nouveau moteur « ${nom} » : il doit être enregistré, sondé et couvert par au moins un contrôle.`;
      case "api":
        return `Nouvelles procédures dans « ${nom} » : vérifier le niveau de permission avant tout usage.`;
      case "evenement":
        return `Nouvel événement « ${nom} » : sans abonné, il reste orphelin.`;
      case "test":
        return `Nouveau contrôle « ${nom} » : une preuve de plus, rattachée à son domaine.`;
      default:
        return `Nouveau module « ${nom} » dans l'architecture.`;
    }
  }
  return `« ${nom} » (${type}) a disparu du code : toute dépendance vers lui est cassée jusqu'à preuve du contraire.`;
}

/**
 * Point 116 — relève le code tel qu'il est, le compare au relevé précédent et
 * enregistre ce qui a été appris. Aucune modification du code n'est faite ici :
 * c'est le mode observation, et il est le seul actif aujourd'hui.
 */
export async function ingest(): Promise<{
  ok: boolean;
  motif: string;
  snapshotId: number | null;
  noeuds: number;
  aretes: number;
  observations: number;
}> {
  const lu = await lireArtefact();
  if (!lu.ok)
    return { ok: false, motif: lu.motif, snapshotId: null, noeuds: 0, aretes: 0, observations: 0 };
  const g = lu.graphe;

  const [precedent] = await db.select().from(cgSnapshots).orderBy(desc(cgSnapshots.id)).limit(1);
  if (precedent && precedent.generatedAt.toISOString() === new Date(g.generatedAt).toISOString()) {
    return {
      ok: true,
      motif: `Relevé déjà ingéré (généré le ${precedent.generatedAt.toISOString()}) : rien de nouveau à apprendre.`,
      snapshotId: precedent.id,
      noeuds: precedent.fichiers,
      aretes: precedent.aretes,
      observations: 0,
    };
  }

  const [snap] = await db
    .insert(cgSnapshots)
    .values({
      generatedAt: new Date(g.generatedAt),
      commit: g.commit ?? null,
      fichiers: g.stats.fichiers ?? 0,
      modules: g.stats.modules ?? 0,
      moteurs: g.stats.moteurs ?? 0,
      tables: g.stats.tables ?? 0,
      api: g.stats.api ?? 0,
      evenements: g.stats.evenements ?? 0,
      tests: g.stats.tests ?? 0,
      routes: g.stats.routes ?? 0,
      aretes: g.aretes.length,
      conventions: g.conventions ?? {},
    })
    .returning({ id: cgSnapshots.id });

  const paquets = <T>(arr: T[], n: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
    return out;
  };

  const vus = new Set<string>();
  const noeuds = g.noeuds
    .filter((n) => {
      if (vus.has(n.id)) return false;
      vus.add(n.id);
      return true;
    })
    .map((n) => ({
      snapshotId: snap.id,
      type: n.type.slice(0, 16),
      key: n.id.slice(0, 300),
      label: String(n.label ?? n.id).slice(0, 300),
      meta: Object.fromEntries(
        Object.entries(n).filter(([k]) => !["id", "type", "label"].includes(k)),
      ),
    }));
  for (const p of paquets(noeuds, 500)) await db.insert(cgNodes).values(p);

  const aretes = g.aretes.map((a) => ({
    snapshotId: snap.id,
    source: a.from.slice(0, 300),
    target: a.to.slice(0, 300),
    kind: a.type.slice(0, 16),
  }));
  for (const p of paquets(aretes, 800)) await db.insert(cgEdges).values(p);

  // Comparaison avec le relevé précédent : c'est là que l'agent apprend.
  let observations = 0;
  if (precedent) {
    const avant = await db
      .select({ type: cgNodes.type, key: cgNodes.key })
      .from(cgNodes)
      .where(and(eq(cgNodes.snapshotId, precedent.id), inArray(cgNodes.type, [...TYPES_SUIVIS])));
    const avantSet = new Set(avant.map((a) => a.key));
    const apresSuivis = noeuds.filter((n) => TYPES_SUIVIS.has(n.type));
    const apresSet = new Set(apresSuivis.map((n) => n.key));

    const lignes: {
      snapshotId: number;
      kind: string;
      nodeType: string;
      key: string;
      comprehension: string;
    }[] = [];
    for (const n of apresSuivis) {
      if (!avantSet.has(n.key))
        lignes.push({
          snapshotId: snap.id,
          kind: "apparition",
          nodeType: n.type,
          key: n.key,
          comprehension: comprehension("apparition", n.type, n.key),
        });
    }
    for (const a of avant) {
      if (!apresSet.has(a.key))
        lignes.push({
          snapshotId: snap.id,
          kind: "disparition",
          nodeType: a.type,
          key: a.key,
          comprehension: comprehension("disparition", a.type, a.key),
        });
    }
    for (const p of paquets(lignes, 500)) await db.insert(cgObservations).values(p);
    observations = lignes.length;
  }

  // On ne conserve que les 5 derniers relevés : la comparaison a besoin d'un
  // historique, pas d'une accumulation infinie.
  const anciens = await db
    .select({ id: cgSnapshots.id })
    .from(cgSnapshots)
    .orderBy(desc(cgSnapshots.id));
  const aSupprimer = anciens.slice(5).map((s) => s.id);
  if (aSupprimer.length > 0) {
    await db.delete(cgEdges).where(inArray(cgEdges.snapshotId, aSupprimer));
    await db.delete(cgNodes).where(inArray(cgNodes.snapshotId, aSupprimer));
    await db.delete(cgSnapshots).where(inArray(cgSnapshots.id, aSupprimer));
  }

  return {
    ok: true,
    motif: `Relevé ingéré : ${noeuds.length} nœuds, ${aretes.length} liens, ${observations} observation(s).`,
    snapshotId: snap.id,
    noeuds: noeuds.length,
    aretes: aretes.length,
    observations,
  };
}

async function dernierSnapshot() {
  const [s] = await db.select().from(cgSnapshots).orderBy(desc(cgSnapshots.id)).limit(1);
  return s ?? null;
}

/** Un relevé de code a-t-il été ingéré ? Sans lui, « composant absent » n'a aucun sens : rien n'a été inspecté. */
export async function relevePresent(): Promise<boolean> {
  return (await dernierSnapshot()) !== null;
}

/** Parmi ces chemins, ceux qui existent réellement dans le dernier relevé de code (jamais un fichier supposé). */
export async function fichiersConnus(chemins: string[]): Promise<Set<string>> {
  const propres = [...new Set(chemins.map((c) => c.trim()).filter((c) => c.length > 0 && c.length < 300))].slice(0, 60);
  if (propres.length === 0) return new Set();
  const snap = await dernierSnapshot();
  if (!snap) return new Set();
  const lignes = await db
    .selectDistinct({ cible: cgEdges.target })
    .from(cgEdges)
    .where(and(eq(cgEdges.snapshotId, snap.id), inArray(cgEdges.target, propres.map((c) => `fichier:${c}`))));
  return new Set(lignes.map((l) => l.cible.slice("fichier:".length)));
}

export interface GrapheEtat {
  checkedAt: string;
  artefact: { present: boolean; motif: string | null; generatedAt: string | null; commit: string | null };
  snapshot: {
    id: number;
    generatedAt: string;
    ingestedAt: string;
    commit: string | null;
    perime: boolean;
    stats: Record<string, number>;
    conventions: Record<string, number>;
  } | null;
  observations: { kind: string; nodeType: string; key: string; comprehension: string; date: string }[];
  /** Moteurs du graphe qu'aucun contrôle ne prouve : l'angle mort du code. */
  moteursSansTest: string[];
  /** Tables qu'aucun module ne revendique : personne ne sait qui les écrit. */
  tablesOrphelines: string[];
}

export async function etat(): Promise<GrapheEtat> {
  const lu = await lireArtefact();
  const snap = await dernierSnapshot();
  const observations = snap
    ? await db
        .select()
        .from(cgObservations)
        .where(eq(cgObservations.snapshotId, snap.id))
        .orderBy(desc(cgObservations.id))
        .limit(60)
    : [];

  let moteursSansTest: string[] = [];
  let tablesOrphelines: string[] = [];
  if (snap) {
    const moteurs = await db
      .select({ key: cgNodes.key, label: cgNodes.label })
      .from(cgNodes)
      .where(and(eq(cgNodes.snapshotId, snap.id), eq(cgNodes.type, "moteur")));
    const preuves = await db
      .select({ target: cgEdges.target })
      .from(cgEdges)
      .where(and(eq(cgEdges.snapshotId, snap.id), eq(cgEdges.kind, "prouve")));
    const prouves = new Set(preuves.map((p) => p.target));
    moteursSansTest = moteurs.filter((m) => !prouves.has(m.key)).map((m) => m.label);

    const tables = await db
      .select({ key: cgNodes.key, label: cgNodes.label })
      .from(cgNodes)
      .where(and(eq(cgNodes.snapshotId, snap.id), eq(cgNodes.type, "table")));
    const possedees = await db
      .select({ target: cgEdges.target })
      .from(cgEdges)
      .where(and(eq(cgEdges.snapshotId, snap.id), eq(cgEdges.kind, "possede")));
    const owned = new Set(possedees.map((p) => p.target));
    tablesOrphelines = tables.filter((t) => !owned.has(t.key)).map((t) => t.label);
  }

  const perime =
    snap !== null && lu.ok
      ? new Date(lu.graphe.generatedAt).getTime() > snap.generatedAt.getTime()
      : false;

  return {
    checkedAt: new Date().toISOString(),
    artefact: {
      present: lu.ok,
      motif: lu.ok ? null : lu.motif,
      generatedAt: lu.ok ? lu.graphe.generatedAt : null,
      commit: lu.ok ? lu.graphe.commit : null,
    },
    snapshot: snap
      ? {
          id: snap.id,
          generatedAt: snap.generatedAt.toISOString(),
          ingestedAt: snap.ingestedAt.toISOString(),
          commit: snap.commit,
          perime,
          stats: {
            fichiers: snap.fichiers,
            modules: snap.modules,
            moteurs: snap.moteurs,
            tables: snap.tables,
            api: snap.api,
            evenements: snap.evenements,
            tests: snap.tests,
            routes: snap.routes,
            aretes: snap.aretes,
          },
          conventions: snap.conventions,
        }
      : null,
    observations: observations.map((o) => ({
      kind: o.kind,
      nodeType: o.nodeType,
      key: o.key,
      comprehension: o.comprehension,
      date: o.createdAt.toISOString(),
    })),
    moteursSansTest,
    tablesOrphelines,
  };
}

export interface Impact {
  cle: string;
  trouve: boolean;
  type: string | null;
  label: string | null;
  fichiers: string[];
  api: string[];
  tables: string[];
  evenements: string[];
  tests: string[];
  routes: string[];
  dependances: string[];
  dependants: string[];
  /** Ce qu'un agent doit vérifier avant de toucher à ce service. */
  avertissements: string[];
}

/**
 * Point 117 — « Paiement » : le système répond précisément quels fichiers,
 * quelles API, quelles tables, quels événements et quels tests sont en jeu.
 * C'est ce qui permet de modifier sans casser ailleurs.
 */
export async function impact(cle: string): Promise<Impact> {
  const snap = await dernierSnapshot();
  const vide: Impact = {
    cle,
    trouve: false,
    type: null,
    label: null,
    fichiers: [],
    api: [],
    tables: [],
    evenements: [],
    tests: [],
    routes: [],
    dependances: [],
    dependants: [],
    avertissements: [],
  };
  if (!snap) return { ...vide, avertissements: ["Aucun relevé de code ingéré."] };

  const recherche = cle.includes(":") ? cle : `moteur:${cle}`;
  const [noeud] = await db
    .select()
    .from(cgNodes)
    .where(and(eq(cgNodes.snapshotId, snap.id), eq(cgNodes.key, recherche)))
    .limit(1);
  if (!noeud)
    return {
      ...vide,
      avertissements: [`« ${cle} » n'existe pas dans le relevé : rien ne peut être affirmé.`],
    };

  // Modules portés par ce nœud (un moteur porte un ou plusieurs modules).
  const sortantes = await db
    .select({ target: cgEdges.target, kind: cgEdges.kind })
    .from(cgEdges)
    .where(and(eq(cgEdges.snapshotId, snap.id), eq(cgEdges.source, recherche)));
  const entrantes = await db
    .select({ source: cgEdges.source, kind: cgEdges.kind })
    .from(cgEdges)
    .where(and(eq(cgEdges.snapshotId, snap.id), eq(cgEdges.target, recherche)));

  const modules = new Set<string>(
    sortantes.filter((e) => e.kind === "porte").map((e) => e.target),
  );
  if (noeud.type === "module") modules.add(recherche);

  const liens =
    modules.size > 0
      ? await db
          .select({ source: cgEdges.source, target: cgEdges.target, kind: cgEdges.kind })
          .from(cgEdges)
          .where(
            and(eq(cgEdges.snapshotId, snap.id), inArray(cgEdges.source, [...modules])),
          )
      : [];

  const brut = (pref: string, arr: string[]) =>
    Array.from(new Set(arr.filter((v) => v.startsWith(pref)).map((v) => v.slice(pref.length))));

  const cibles = liens.map((l) => l.target);
  const fichiers = brut("fichier:", cibles);
  const api = brut("api:", cibles);
  const tables = brut("table:", cibles);
  const evenements = brut("evenement:", cibles);
  const dependances = brut("module:", cibles);
  const tests = Array.from(
    new Set(entrantes.filter((e) => e.kind === "prouve").map((e) => e.source.slice(5))),
  );
  const routes = Array.from(
    new Set(sortantes.filter((e) => e.kind === "rend").map((e) => e.target.slice(5))),
  );
  const dependants = Array.from(
    new Set(
      (
        await db
          .select({ source: cgEdges.source })
          .from(cgEdges)
          .where(
            and(
              eq(cgEdges.snapshotId, snap.id),
              eq(cgEdges.kind, "depend"),
              modules.size > 0
                ? inArray(cgEdges.target, [...modules])
                : eq(cgEdges.target, recherche),
            ),
          )
      ).map((e) => e.source.replace(/^module:/, "")),
    ),
  );

  const avertissements: string[] = [];
  if (tests.length === 0)
    avertissements.push(
      "Aucun contrôle continu ne prouve ce service : une modification ne pourra pas être validée par une preuve.",
    );
  if (tables.length > 0 && api.length === 0)
    avertissements.push(
      "Des tables sans procédure exposée : les données existent mais rien ne les sert.",
    );
  if (dependants.length > 3)
    avertissements.push(
      `${dependants.length} modules dépendent de ce service : toute modification se propage.`,
    );

  return {
    cle: recherche,
    trouve: true,
    type: noeud.type,
    label: noeud.label,
    fichiers: fichiers.slice(0, 200),
    api,
    tables,
    evenements,
    tests,
    routes: routes.slice(0, 100),
    dependances,
    dependants,
    avertissements,
  };
}

export async function recherche(q: string, limit = 40) {
  const snap = await dernierSnapshot();
  if (!snap) return [];
  const motif = `%${q.toLowerCase()}%`;
  return db
    .select({ type: cgNodes.type, key: cgNodes.key, label: cgNodes.label })
    .from(cgNodes)
    .where(and(eq(cgNodes.snapshotId, snap.id), sql`lower(${cgNodes.label}) LIKE ${motif}`))
    .limit(limit);
}

/** Classe une anomalie : c'est la clé de la reconnaissance (point 118). */
export function classer(texte: string): string {
  const t = texte.toLowerCase();
  if (/bouton|route inconnue|destination|redirection|404/.test(t)) return "parcours_casse";
  if (/clé|api key|prestataire|stripe|encaiss/.test(t)) return "prestataire_paiement_indisponible";
  if (/index|sitemap|robots|canonical/.test(t)) return "visibilite_google";
  if (/permission|role|rôle|acc[eè]s|unauthorized/.test(t)) return "permission_insuffisante";
  if (/migration/.test(t)) return "structure_base";
  if (/heartbeat|sonde|dégrad|degrade|hors service/.test(t)) return "moteur_muet";
  if (/orphelin|abonné|abonne|événement|evenement/.test(t)) return "evenement_sans_abonne";
  if (/devise|pays|langue/.test(t)) return "couverture_pays";
  if (/photo|upload|image/.test(t)) return "media_non_transmis";
  if (/régression|regression/.test(t)) return "regression_controle";
  return "anomalie_non_classee";
}

/**
 * Point 118 — apprend des corrections réellement enregistrées : journal des
 * modifications d'agents, régressions du contrôle continu, alertes traitées.
 * Rien n'est inventé : chaque leçon porte sa source et sa référence.
 */
export async function apprendre(): Promise<{
  nouvelles: number;
  renforcees: number;
  sources: Record<string, number>;
}> {
  let nouvelles = 0;
  let renforcees = 0;
  const sources: Record<string, number> = { agent_change: 0, regression: 0, alerte: 0 };

  const upsert = async (l: {
    classe: string;
    source: string;
    sourceRef: string;
    probleme: string;
    proposition?: string | null;
    correctif?: string | null;
    tests?: string | null;
    validation: string;
    resultat?: string | null;
    moteurs: string[];
  }) => {
    const existante = await db
      .select({
        id: cgLessons.id,
        occurrences: cgLessons.occurrences,
        releves: cgLessons.releves,
        validation: cgLessons.validation,
        resultat: cgLessons.resultat,
      })
      .from(cgLessons)
      .where(
        and(
          eq(cgLessons.classe, l.classe),
          eq(cgLessons.source, l.source),
          eq(cgLessons.sourceRef, l.sourceRef),
        ),
      )
      .limit(1);
    if (existante.length > 0) {
      // Relire le même événement source n'est PAS une nouvelle occurrence : seul un changement réel de validation ou de
      // résultat compte comme un épisode de plus. La relecture est tout de même tracée (releves, dernière date).
      const e = existante[0];
      const change = e.validation !== l.validation || (e.resultat ?? null) !== (l.resultat ?? null);
      await db
        .update(cgLessons)
        .set({
          occurrences: change ? e.occurrences + 1 : e.occurrences,
          releves: e.releves + 1,
          lastSeenAt: new Date(),
          validation: l.validation,
          resultat: l.resultat ?? null,
        })
        .where(eq(cgLessons.id, e.id));
      if (change) renforcees += 1;
      return;
    }
    await db.insert(cgLessons).values({
      classe: l.classe,
      source: l.source,
      sourceRef: l.sourceRef,
      probleme: l.probleme,
      proposition: l.proposition ?? null,
      correctif: l.correctif ?? null,
      tests: l.tests ?? null,
      validation: l.validation,
      resultat: l.resultat ?? null,
      moteurs: l.moteurs,
    });
    nouvelles += 1;
  };

  // 1) Modifications déclarées par les autres agents.
  try {
    const rows = await db.execute<{
      id: number;
      agent: string;
      kind: string;
      title: string;
      summary: string | null;
      engine: string | null;
      status: string;
      rollback: string | null;
    }>(
      sql.raw(
        `SELECT "id", "agent", "kind", "title", "detail" AS summary, "engine_name" AS engine,
                "status", "rollback_plan" AS rollback
           FROM "agent_change_log" ORDER BY "id" DESC LIMIT 200`,
      ),
    );
    for (const r of (rows as unknown as { rows?: Record<string, unknown>[] }).rows ?? []) {
      const titre = String(r.title ?? "");
      const resume = r.summary ? String(r.summary) : "";
      await upsert({
        classe: classer(`${titre} ${resume} ${String(r.kind ?? "")}`),
        source: "agent_change",
        sourceRef: `change:${String(r.id)}`,
        probleme: titre,
        proposition: resume || null,
        correctif: `Modification ${String(r.kind)} posée par ${String(r.agent)}.`,
        tests: null,
        validation:
          r.status === "validee" ? "validee" : r.status === "rejetee" ? "rejetee" : "en_attente",
        resultat: r.rollback
          ? `Retour arrière documenté : ${String(r.rollback)}`
          : "Aucune procédure de retour arrière déclarée.",
        moteurs: r.engine ? [String(r.engine)] : [],
      });
      sources.agent_change += 1;
    }
  } catch {
    // Journal absent : on n'invente pas de leçon.
  }

  // 2) Régressions nommées par le contrôle continu.
  try {
    const rows = await db
      .select({
        scenario: ctResults.scenario,
        domaine: ctResults.domaine,
        label: ctResults.label,
        observe: ctResults.observe,
        attendu: ctResults.attendu,
      })
      .from(ctResults)
      .where(and(eq(ctResults.statut, "echec"), isNotNull(ctResults.regression)))
      .orderBy(desc(ctResults.id))
      .limit(100);
    for (const r of rows) {
      await upsert({
        classe: classer(`${r.label} ${r.observe} régression`),
        source: "regression",
        sourceRef: `ct:${r.scenario}`,
        probleme: `${r.label} — observé : ${r.observe}`,
        proposition: `Attendu : ${r.attendu}`,
        correctif: null,
        tests: r.scenario,
        validation: "en_attente",
        resultat: "Régression : ce contrôle passait avant.",
        moteurs: r.domaine ? [r.domaine] : [],
      });
      sources.regression += 1;
    }
  } catch {
    // Contrôle continu pas encore exécuté.
  }

  // 3) Alertes réellement traitées : la correction validée par un humain.
  try {
    const rows = await db
      .select({
        id: smartAlerts.id,
        category: smartAlerts.category,
        title: smartAlerts.title,
        description: smartAlerts.description,
      })
      .from(smartAlerts)
      .where(eq(smartAlerts.status, "resolved"))
      .orderBy(sql`${smartAlerts.resolvedAt} desc nulls last`)
      .limit(100);
    for (const r of rows) {
      await upsert({
        classe: classer(`${r.title} ${r.description ?? ""}`),
        source: "alerte",
        sourceRef: `alerte:${r.id}`,
        probleme: r.title,
        proposition: r.description,
        correctif: null,
        tests: null,
        validation: "validee",
        resultat: "Alerte traitée puis refermée.",
        moteurs: r.category ? [r.category] : [],
      });
      sources.alerte += 1;
    }
  } catch {
    // Système Intelligent pas encore alimenté.
  }

  return { nouvelles, renforcees, sources };
}

const MOTS_VIDES_LECON = new Set(["pour", "dans", "avec", "cette", "cela", "mais", "plus", "tout", "sont", "être", "etre", "faire", "comme"]);

function motsDe(texte: string): string[] {
  return [...new Set(texte.toLowerCase().split(/[^a-zà-ÿ0-9_]+/).filter((m) => m.length >= 4 && !MOTS_VIDES_LECON.has(m)))];
}

/**
 * « Je connais cette classe d'anomalie » — ou l'inverse, dit franchement.
 *
 * Une classe n'est « connue » que si des corrections VALIDÉES existent pour elle. Une observation en attente, une
 * correction rejetée, une relecture répétée ou la classe « non classée » ne sont jamais présentées comme une correction
 * acquise. Les leçons rendues sont les plus pertinentes pour le problème posé (mots communs), pas seulement les plus récentes.
 */
export async function reconnaitre(probleme: string): Promise<{
  classe: string;
  connue: boolean;
  occurrences: number;
  verifiees: number;
  lecons: {
    id: number;
    probleme: string;
    proposition: string | null;
    resultat: string | null;
    validation: string;
    source: string;
    moteurs: string[];
    lastSeenAt: string;
  }[];
  verdict: string;
}> {
  const classe = classer(probleme);
  if (classe === "anomalie_non_classee") {
    return {
      classe,
      connue: false,
      occurrences: 0,
      verifiees: 0,
      lecons: [],
      verdict:
        "Anomalie non classée : aucune classe reconnue, donc aucune correction acquise à rappeler. Il faut d'abord préciser le problème ou l'analyser.",
    };
  }
  const candidates = await db
    .select()
    .from(cgLessons)
    .where(eq(cgLessons.classe, classe))
    .orderBy(desc(cgLessons.lastSeenAt))
    .limit(60);
  const mots = motsDe(probleme);
  const note = (l: (typeof candidates)[number]) => {
    const t = `${l.probleme} ${l.proposition ?? ""}`.toLowerCase();
    return mots.filter((m) => t.includes(m)).length;
  };
  const triees = [...candidates].sort((a, b) => {
    const v = Number(b.validation === "validee") - Number(a.validation === "validee");
    return v !== 0 ? v : note(b) - note(a) || b.lastSeenAt.getTime() - a.lastSeenAt.getTime();
  });
  const lecons = triees.slice(0, 10);
  const validees = candidates.filter((l) => l.validation === "validee");
  // Une correction validée n'est « acquise » pour ce cas que si elle porte sur lui (au moins un mot en commun) : une
  // correction validée pour un autre problème de la même classe n'est pas une réponse à celui-ci.
  const pertinentes = validees.filter((l) => mots.length === 0 || note(l) >= 1);
  const verifiees = pertinentes.length;
  const nonValidees = candidates.length - validees.length;
  const occurrences = candidates.reduce((n, l) => n + l.occurrences, 0);
  return {
    classe,
    connue: verifiees > 0,
    occurrences,
    verifiees,
    lecons: lecons.map((l) => ({
      id: l.id,
      probleme: l.probleme,
      proposition: l.proposition,
      resultat: l.resultat,
      validation: l.validation,
      source: l.source,
      moteurs: l.moteurs,
      lastSeenAt: l.lastSeenAt.toISOString(),
    })),
    verdict:
      candidates.length === 0
        ? `Classe « ${classe} » identifiée, mais aucune correction passée enregistrée.`
        : verifiees > 0
          ? `Classe « ${classe} » : ${verifiees} correction(s) validée(s) par un humain pour ce cas${nonValidees > 0 ? `, ${nonValidees} observation(s) non validée(s) ou rejetée(s) (pas des corrections acquises)` : ""}.`
          : validees.length > 0
            ? `Classe « ${classe} » : ${validees.length} correction(s) validée(s), mais aucune ne porte sur ce cas précis — rien n'est acquis pour lui.`
            : `Classe « ${classe} » : ${candidates.length} observation(s) en mémoire, aucune correction validée — rien n'est acquis.`,
  };
}

export interface AuditLecons {
  lignes: number;
  occurrencesTotal: number;
  relevesTotal: number;
  parClasse: { classe: string; lignes: number; occurrences: number; releves: number }[];
  /** Lignes relues plusieurs fois : le compteur d'origine comptait chaque relecture comme une occurrence. */
  relues: number;
  /** Même problème, même classe, références sources différentes : doublons probables à examiner. */
  doublonsProbables: { classe: string; probleme: string; lignes: number; sources: string[] }[];
  /** Classe « non classée » : volume et part des relectures. */
  nonClassee: { lignes: number; occurrences: number; releves: number; validees: number };
  lecture: string;
}

/** Audit en lecture seule des leçons : ne modifie rien, ne supprime rien. */
export async function auditerLecons(): Promise<AuditLecons> {
  const toutes = await db.select().from(cgLessons);
  const parClasseMap = new Map<string, { classe: string; lignes: number; occurrences: number; releves: number }>();
  const groupes = new Map<string, { classe: string; probleme: string; sources: Set<string>; lignes: number }>();
  for (const l of toutes) {
    const c = parClasseMap.get(l.classe) ?? { classe: l.classe, lignes: 0, occurrences: 0, releves: 0 };
    c.lignes++; c.occurrences += l.occurrences; c.releves += l.releves;
    parClasseMap.set(l.classe, c);
    const cle = `${l.classe}|${l.probleme.trim().toLowerCase().replace(/\s+/g, " ")}`;
    const g = groupes.get(cle) ?? { classe: l.classe, probleme: l.probleme.slice(0, 200), sources: new Set<string>(), lignes: 0 };
    g.lignes++; g.sources.add(`${l.source}:${l.sourceRef ?? ""}`);
    groupes.set(cle, g);
  }
  const nc = toutes.filter((l) => l.classe === "anomalie_non_classee");
  const nonClassee = {
    lignes: nc.length,
    occurrences: nc.reduce((n, l) => n + l.occurrences, 0),
    releves: nc.reduce((n, l) => n + l.releves, 0),
    validees: nc.filter((l) => l.validation === "validee").length,
  };
  const occurrencesTotal = toutes.reduce((n, l) => n + l.occurrences, 0);
  const relevesTotal = toutes.reduce((n, l) => n + l.releves, 0);
  return {
    lignes: toutes.length,
    occurrencesTotal,
    relevesTotal,
    parClasse: [...parClasseMap.values()].sort((a, b) => b.releves - a.releves),
    relues: toutes.filter((l) => l.releves > 1).length,
    doublonsProbables: [...groupes.values()].filter((g) => g.lignes > 1).sort((a, b) => b.lignes - a.lignes).slice(0, 20).map((g) => ({ classe: g.classe, probleme: g.probleme, lignes: g.lignes, sources: [...g.sources].slice(0, 5) })),
    nonClassee,
    lecture:
      `« anomalie_non_classee » : ${nonClassee.lignes} ligne(s) pour ${nonClassee.releves} relecture(s) ; ${nonClassee.validees} validée(s). ` +
      `Une ligne = un événement source (classe + source + référence) : un nombre de relectures bien supérieur au nombre de lignes signale ` +
      `un même événement relu à chaque apprentissage, pas de nouveaux incidents. Rien n'est supprimé.`,
  };
}

export async function lecons(limit = 80) {
  const rows = await db
    .select()
    .from(cgLessons)
    .orderBy(desc(cgLessons.lastSeenAt))
    .limit(limit);
  return rows.map((l) => ({
    id: l.id,
    classe: l.classe,
    source: l.source,
    sourceRef: l.sourceRef,
    probleme: l.probleme,
    proposition: l.proposition,
    validation: l.validation,
    resultat: l.resultat,
    moteurs: l.moteurs,
    occurrences: l.occurrences,
    releves: l.releves,
    lastSeenAt: l.lastSeenAt.toISOString(),
  }));
}

export async function classes() {
  const rows = await db
    .select({
      classe: cgLessons.classe,
      lecons: sql<number>`count(*)::int`,
      occurrences: sql<number>`sum(${cgLessons.occurrences})::int`,
      derniere: sql<string>`max(${cgLessons.lastSeenAt})`,
    })
    .from(cgLessons)
    .groupBy(cgLessons.classe)
    .orderBy(desc(sql`sum(${cgLessons.occurrences})`));
  return rows;
}

/** Sonde du moteur : un graphe non ingéré n'est pas un moteur en bonne santé. */
export async function health(): Promise<{ status: "up" | "degraded" | "down"; message: string }> {
  const lu = await lireArtefact();
  const snap = await dernierSnapshot();
  if (!lu.ok) return { status: "down", message: lu.motif };
  if (!snap)
    return {
      status: "degraded",
      message: "Artefact présent mais jamais ingéré : la mémoire technique est vide.",
    };
  const jours = (Date.now() - snap.generatedAt.getTime()) / 86_400_000;
  if (new Date(lu.graphe.generatedAt).getTime() > snap.generatedAt.getTime())
    return {
      status: "degraded",
      message: "Un relevé plus récent existe : la mémoire technique est en retard sur le code.",
    };
  return {
    status: "up",
    message: `Relevé #${snap.id} du ${snap.generatedAt.toISOString().slice(0, 10)} (${jours.toFixed(0)} j) : ${snap.fichiers} fichiers, ${snap.tables} tables.`,
  };
}

/** Leçons récentes, pour la supervision (24 h). */
export async function leconsRecentes() {
  const depuis = new Date(Date.now() - 24 * 3600 * 1000);
  const rows = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(cgLessons)
    .where(gte(cgLessons.lastSeenAt, depuis));
  return rows[0]?.n ?? 0;
}
