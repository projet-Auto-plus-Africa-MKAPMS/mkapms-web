/**
 * Centre Cyber-Électrique — sauvegarde et restauration du schéma « frontier », pour préparer (et prouver) le passage à une base physiquement séparée.
 *
 * Principes :
 *  - une sauvegarde est un DOSSIER : `manifeste.json` + un fichier `<table>.ndjson` par table, chacun avec son empreinte SHA-256 ; la lecture est faite
 *    dans UNE transaction en lecture seule à isolation répétable (cliché cohérent), fuseau UTC ;
 *  - elle ne contient aucun secret : le centre ne stocke que des RÉFÉRENCES de secrets (nom de variable, chemin de coffre), jamais une valeur ;
 *  - une restauration n'écrit que dans une base dont les tables du centre sont VIDES, dans UNE transaction, et ne valide (COMMIT) que si l'empreinte et le
 *    nombre de lignes de chaque table sont identiques à ceux du manifeste — sinon tout est annulé ;
 *  - la restauration ne rebranche rien : les portes de passage sont restaurées telles qu'elles étaient (donc coupées si elles l'étaient) ;
 *  - toutes les fonctions reçoivent leurs pools en paramètre : rien n'agit sur la base courante du centre par accident.
 */
import { createHash } from "node:crypto";
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { once } from "node:events";
import path from "node:path";
import type pg from "pg";
import { dossierMigrations } from "./base/migrateur.js";
import { VERSION_CENTRE } from "./fondation.js";

export const FORMAT_SAUVEGARDE = "frontier-sauvegarde/1";
const IDENT = /^[a-z_][a-z0-9_]*$/;
const TAILLE_LOT = 500;

export interface TableSauvegardee {
  nom: string;
  lignes: number;
  sha256: string;
  fichier: string;
}

export interface ManifesteSauvegarde {
  format: typeof FORMAT_SAUVEGARDE;
  creeLe: string;
  versionCentre: string;
  schema: "frontier";
  migrations: { nom: string; checksum: string }[];
  tables: TableSauvegardee[];
  /** Empreinte de l'ensemble (tables dans l'ordre du manifeste). */
  sha256: string;
  avertissement: string;
}

const sha = (t: string) => createHash("sha256").update(t).digest("hex");
const ident = (n: string) => {
  if (!IDENT.test(n)) throw new Error(`Nom de table refusé : ${n}`);
  return `frontier."${n}"`;
};

interface InfosTable {
  nom: string;
  cle: string[];
  colonnes: string[];
  sequences: { colonne: string; sequence: string }[];
}

/** Tables du schéma, triées de façon à ce que toute table vienne APRÈS celles qu'elle référence (clés étrangères). La table des migrations est exclue. */
export async function lireStructure(c: pg.Pool | pg.PoolClient): Promise<InfosTable[]> {
  const tables = (await c.query<{ nom: string }>("SELECT c.relname AS nom FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'frontier' AND c.relkind = 'r' AND c.relname <> 'migrations' ORDER BY c.relname")).rows.map((r) => r.nom);
  const fk = (await c.query<{ enfant: string; parent: string }>("SELECT cl.relname AS enfant, cp.relname AS parent FROM pg_constraint k JOIN pg_class cl ON cl.oid = k.conrelid JOIN pg_class cp ON cp.oid = k.confrelid JOIN pg_namespace n ON n.oid = cl.relnamespace WHERE k.contype = 'f' AND n.nspname = 'frontier'")).rows;
  const deps = new Map<string, Set<string>>(tables.map((t) => [t, new Set<string>()]));
  for (const { enfant, parent } of fk) if (enfant !== parent && deps.has(enfant) && deps.has(parent)) deps.get(enfant)!.add(parent);
  const ordre: string[] = [];
  const faits = new Set<string>();
  while (ordre.length < tables.length) {
    const pretes = tables.filter((t) => !faits.has(t) && [...deps.get(t)!].every((p) => faits.has(p)));
    if (pretes.length === 0) throw new Error(`Dépendance circulaire entre tables du centre : ${tables.filter((t) => !faits.has(t)).join(", ")}`);
    for (const t of pretes) {
      faits.add(t);
      ordre.push(t);
    }
  }
  const infos: InfosTable[] = [];
  for (const nom of ordre) {
    const cle = (await c.query<{ a: string }>("SELECT a.attname AS a FROM pg_index i JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY (i.indkey) WHERE i.indrelid = $1::regclass AND i.indisprimary ORDER BY array_position(i.indkey::int2[], a.attnum)", [`frontier."${nom}"`])).rows.map((r) => r.a);
    if (cle.length === 0) throw new Error(`La table ${nom} n'a pas de clé primaire : l'ordre de sauvegarde ne serait pas déterministe.`);
    const colonnes = (await c.query<{ column_name: string }>("SELECT column_name FROM information_schema.columns WHERE table_schema = 'frontier' AND table_name = $1 ORDER BY ordinal_position", [nom])).rows.map((r) => r.column_name);
    const sequences: InfosTable["sequences"] = [];
    for (const col of colonnes) {
      const s = (await c.query<{ s: string | null }>("SELECT pg_get_serial_sequence($1, $2) AS s", [`frontier."${nom}"`, col])).rows[0]?.s;
      if (s) sequences.push({ colonne: col, sequence: s });
    }
    infos.push({ nom, cle, colonnes, sequences });
  }
  return infos;
}

/** Filtres fixes (jamais construits à partir d'une entrée) appliqués à la seule COMPARAISON de deux bases. */
const FILTRES_COMPARAISON: Readonly<Record<string, string>> = {
  // La sauvegarde se consigne elle-même au journal après coup : cette ligne-là n'est pas une différence de contenu.
  audit_log: "x.action <> 'backup'",
};

async function* lignesDeTable(c: pg.PoolClient, t: InfosTable, filtre?: string): AsyncGenerator<string> {
  const curseur = `cur_${t.nom}`;
  await c.query(`DECLARE ${curseur} NO SCROLL CURSOR FOR SELECT to_jsonb(x)::text AS l FROM ${ident(t.nom)} x${filtre ? ` WHERE ${filtre}` : ""} ORDER BY ${t.cle.map((k) => `x."${k}"`).join(", ")}`);
  for (;;) {
    const r = await c.query<{ l: string }>(`FETCH ${TAILLE_LOT} FROM ${curseur}`);
    if (r.rows.length === 0) break;
    for (const l of r.rows) yield l.l;
  }
  await c.query(`CLOSE ${curseur}`);
}

async function ouvrirLecture(pool: pg.Pool): Promise<pg.PoolClient> {
  const c = await pool.connect();
  await c.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
  await c.query("SET LOCAL TIME ZONE 'UTC'");
  return c;
}

/** Empreinte et nombre de lignes de chaque table, lues dans un cliché cohérent. Sert à la sauvegarde, à la vérification de restauration et à la comparaison. */
export async function empreintes(pool: pg.Pool, pourComparaison = false): Promise<TableSauvegardee[]> {
  const c = await ouvrirLecture(pool);
  try {
    const structure = await lireStructure(c);
    const sortie: TableSauvegardee[] = [];
    for (const t of structure) {
      const h = createHash("sha256");
      let n = 0;
      for await (const l of lignesDeTable(c, t, pourComparaison ? FILTRES_COMPARAISON[t.nom] : undefined)) {
        h.update(l);
        h.update("\n");
        n += 1;
      }
      sortie.push({ nom: t.nom, lignes: n, sha256: h.digest("hex"), fichier: `${t.nom}.ndjson` });
    }
    return sortie;
  } finally {
    await c.query("ROLLBACK").catch(() => undefined);
    c.release();
  }
}

async function migrationsAppliquees(c: pg.Pool | pg.PoolClient): Promise<{ nom: string; checksum: string }[]> {
  return (await c.query<{ name: string; checksum: string }>("SELECT name, checksum FROM frontier.migrations ORDER BY name")).rows.map((r) => ({ nom: r.name, checksum: r.checksum }));
}

/** Écrit la sauvegarde dans `dossier` (créé, jamais écrasé s'il contient déjà un manifeste). */
export async function sauvegarder(pool: pg.Pool, dossier: string): Promise<ManifesteSauvegarde> {
  mkdirSync(dossier, { recursive: true });
  if (existsSync(path.join(dossier, "manifeste.json"))) throw new Error(`Le dossier ${dossier} contient déjà une sauvegarde : refus d'écraser.`);
  const c = await ouvrirLecture(pool);
  try {
    const structure = await lireStructure(c);
    const migrations = await migrationsAppliquees(c);
    const tables: TableSauvegardee[] = [];
    for (const t of structure) {
      const fichier = `${t.nom}.ndjson`;
      const flux = createWriteStream(path.join(dossier, fichier), { encoding: "utf8" });
      const h = createHash("sha256");
      let n = 0;
      for await (const l of lignesDeTable(c, t)) {
        h.update(l);
        h.update("\n");
        if (!flux.write(`${l}\n`)) await once(flux, "drain");
        n += 1;
      }
      flux.end();
      await once(flux, "finish");
      tables.push({ nom: t.nom, lignes: n, sha256: h.digest("hex"), fichier });
    }
    const manifeste: ManifesteSauvegarde = {
      format: FORMAT_SAUVEGARDE,
      creeLe: new Date().toISOString(),
      versionCentre: VERSION_CENTRE,
      schema: "frontier",
      migrations,
      tables,
      sha256: sha(tables.map((t) => `${t.nom}:${t.lignes}:${t.sha256}`).join("\n")),
      avertissement: "Sauvegarde logique du schéma frontier. Aucune valeur de secret : seulement des références (noms de variables, chemins de coffre). À conserver hors de la base qu'elle protège.",
    };
    writeFileSync(path.join(dossier, "manifeste.json"), `${JSON.stringify(manifeste, null, 2)}\n`);
    return manifeste;
  } finally {
    await c.query("ROLLBACK").catch(() => undefined);
    c.release();
  }
}

export function lireManifeste(dossier: string): ManifesteSauvegarde {
  const f = path.join(dossier, "manifeste.json");
  if (!existsSync(f)) throw new Error(`Aucun manifeste dans ${dossier}.`);
  const m = JSON.parse(readFileSync(f, "utf8")) as ManifesteSauvegarde;
  if (m.format !== FORMAT_SAUVEGARDE) throw new Error(`Format de sauvegarde inconnu : ${String(m.format)}.`);
  return m;
}

/** Relit les fichiers et contrôle empreintes, nombres de lignes et empreinte globale. N'interroge aucune base. */
export function verifierSauvegarde(dossier: string): { ok: boolean; erreurs: string[]; manifeste: ManifesteSauvegarde } {
  const manifeste = lireManifeste(dossier);
  const erreurs: string[] = [];
  for (const t of manifeste.tables) {
    const f = path.join(dossier, t.fichier);
    if (!existsSync(f) || !statSync(f).isFile()) {
      erreurs.push(`${t.nom} : fichier manquant`);
      continue;
    }
    const texte = readFileSync(f, "utf8");
    const lignes = texte === "" ? [] : texte.replace(/\n$/, "").split("\n");
    if (lignes.length !== t.lignes) erreurs.push(`${t.nom} : ${lignes.length} lignes au lieu de ${t.lignes}`);
    const h = createHash("sha256");
    for (const l of lignes) {
      h.update(l);
      h.update("\n");
    }
    if (h.digest("hex") !== t.sha256) erreurs.push(`${t.nom} : empreinte différente (fichier altéré)`);
  }
  const global = sha(manifeste.tables.map((t) => `${t.nom}:${t.lignes}:${t.sha256}`).join("\n"));
  if (global !== manifeste.sha256) erreurs.push("empreinte globale différente (manifeste altéré)");
  const fichiersEnTrop = readdirSync(dossier).filter((f) => f.endsWith(".ndjson") && !manifeste.tables.some((t) => t.fichier === f));
  if (fichiersEnTrop.length) erreurs.push(`fichiers hors manifeste : ${fichiersEnTrop.join(", ")}`);
  return { ok: erreurs.length === 0, erreurs, manifeste };
}

export interface RapportRestauration {
  ok: boolean;
  tables: number;
  lignes: number;
  /** Nombre de tables dont l'empreinte relue après chargement est identique à celle du manifeste. */
  tablesIdentiques: number;
  erreurs: string[];
}

/**
 * Restaure dans `cible` (qui doit déjà porter les migrations du centre et dont les tables doivent être vides). Tout ou rien :
 * si une empreinte relue après chargement diffère du manifeste, la transaction est annulée.
 */
export async function restaurer(cible: pg.Pool, dossier: string): Promise<RapportRestauration> {
  const verif = verifierSauvegarde(dossier);
  if (!verif.ok) return { ok: false, tables: 0, lignes: 0, tablesIdentiques: 0, erreurs: ["sauvegarde invalide : " + verif.erreurs.join(" ; ")] };
  const manifeste = verif.manifeste;
  const c = await cible.connect();
  const erreurs: string[] = [];
  try {
    await c.query("BEGIN");
    await c.query("SET LOCAL TIME ZONE 'UTC'");
    // Les migrations de la cible doivent être exactement celles de la source : sinon les tables ne se correspondent pas.
    const appliquees = await migrationsAppliquees(c).catch(() => []);
    const memes = appliquees.length === manifeste.migrations.length && appliquees.every((m, i) => m.nom === manifeste.migrations[i]!.nom && m.checksum === manifeste.migrations[i]!.checksum);
    if (!memes) throw new Error("Les migrations de la cible ne sont pas celles de la source (même liste, mêmes sommes de contrôle requises) : appliquer d'abord les migrations du centre.");
    const structure = await lireStructure(c);
    const attendues = manifeste.tables.map((t) => t.nom).sort().join(",");
    if (structure.map((t) => t.nom).sort().join(",") !== attendues) throw new Error("Les tables de la cible ne sont pas celles de la sauvegarde.");
    for (const t of structure) {
      const n = Number((await c.query<{ n: string }>(`SELECT count(*)::text AS n FROM ${ident(t.nom)}`)).rows[0]!.n);
      if (n > 0) throw new Error(`Refus : la table ${t.nom} de la cible n'est pas vide (${n} lignes). Une restauration n'écrase jamais.`);
    }
    let total = 0;
    for (const t of structure) {
      const f = readFileSync(path.join(dossier, `${t.nom}.ndjson`), "utf8");
      const lignes = f === "" ? [] : f.replace(/\n$/, "").split("\n");
      const cols = t.colonnes.map((k) => `"${k}"`).join(", ");
      for (let i = 0; i < lignes.length; i += TAILLE_LOT) {
        const lot = `[${lignes.slice(i, i + TAILLE_LOT).join(",")}]`;
        await c.query(`INSERT INTO ${ident(t.nom)} (${cols}) SELECT ${cols} FROM jsonb_populate_recordset(NULL::${ident(t.nom)}, $1::jsonb)`, [lot]);
      }
      total += lignes.length;
      for (const s of t.sequences) await c.query(`SELECT setval($1::regclass, GREATEST(COALESCE((SELECT max("${s.colonne}") FROM ${ident(t.nom)}), 0), 1), (SELECT count(*) > 0 FROM ${ident(t.nom)}))`, [s.sequence]);
    }
    // Contrôle avant validation : l'empreinte relue dans la cible, table par table, doit être celle du manifeste.
    let identiques = 0;
    for (const t of structure) {
      const h = createHash("sha256");
      let n = 0;
      for await (const l of lignesDeTable(c, t)) {
        h.update(l);
        h.update("\n");
        n += 1;
      }
      const attendu = manifeste.tables.find((x) => x.nom === t.nom)!;
      if (n === attendu.lignes && h.digest("hex") === attendu.sha256) identiques += 1;
      else erreurs.push(`${t.nom} : le contenu restauré diffère de la sauvegarde`);
    }
    if (erreurs.length) throw new Error(erreurs.join(" ; "));
    await c.query("COMMIT");
    return { ok: true, tables: structure.length, lignes: total, tablesIdentiques: identiques, erreurs: [] };
  } catch (e) {
    await c.query("ROLLBACK").catch(() => undefined);
    return { ok: false, tables: 0, lignes: 0, tablesIdentiques: 0, erreurs: [(e as Error).message] };
  } finally {
    c.release();
  }
}

export interface RapportComparaison {
  identiques: boolean;
  ecarts: string[];
  tables: number;
}

/** Compare deux bases du centre table par table (nombre de lignes et empreinte), hors lignes « backup » du journal. À faire AVANT de poser FRONTIER_DATABASE_URL. */
export async function comparer(source: pg.Pool, cible: pg.Pool): Promise<RapportComparaison> {
  const [a, b] = [await empreintes(source, true), await empreintes(cible, true)];
  const ecarts: string[] = [];
  for (const t of a) {
    const u = b.find((x) => x.nom === t.nom);
    if (!u) ecarts.push(`${t.nom} : absente de la cible`);
    else if (u.lignes !== t.lignes) ecarts.push(`${t.nom} : ${t.lignes} lignes dans la source, ${u.lignes} dans la cible`);
    else if (u.sha256 !== t.sha256) ecarts.push(`${t.nom} : contenu différent`);
  }
  for (const u of b) if (!a.some((t) => t.nom === u.nom)) ecarts.push(`${u.nom} : absente de la source`);
  return { identiques: ecarts.length === 0, ecarts, tables: a.length };
}

/** Migrations connues du code, pour contrôle (affichage). */
export function migrationsDuCode(): string[] {
  return readdirSync(dossierMigrations()).filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f)).sort();
}
