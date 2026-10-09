/**
 * Connexion PROPRE du Centre Cyber-Électrique : son pool, son client Drizzle, son schéma « frontier ».
 *
 * Indépendance, dans l'ordre de ce qui est garanti aujourd'hui :
 *  1. le centre n'utilise JAMAIS le pool, le client ni le migrateur de la plateforme pour ses propres données ;
 *  2. il a son schéma (frontier), son journal de migrations (frontier.migrations) et son dossier de migrations ;
 *  3. il écrit seulement dans cette base ; ce qu'il lit de la plateforme (registre des moteurs, câble de la Boutique) passe par le client de
 *     la plateforme, en LECTURE SEULE ;
 *  4. si FRONTIER_DATABASE_URL est définie, la base du centre est une base PHYSIQUEMENT séparée (autre serveur Postgres). Sinon — tant que le PDG
 *     n'a pas créé ce second Postgres — le schéma « frontier » vit dans le serveur Postgres de la plateforme : séparé en droit, pas en
 *     matériel. L'état courant est affiché dans le centre (`separee`).
 */
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

const { Pool } = pg;

export type DbFrontier = NodePgDatabase<typeof schema>;
/** Un client Drizzle ordinaire ou celui d'une transaction. */
export type TxFrontier = Parameters<Parameters<DbFrontier["transaction"]>[0]>[0];
export type BaseFrontier = DbFrontier | TxFrontier;

let urlForcee: string | null | undefined;
let pool: pg.Pool | null = null;
let db: DbFrontier | null = null;

/** Résout l'URL de la base du centre. `separee` dit si c'est une base physiquement distincte de celle de la plateforme. */
export function resoudreUrl(): { url: string; separee: boolean } | null {
  const propre = urlForcee !== undefined ? urlForcee : process.env.FRONTIER_DATABASE_URL;
  if (propre) return { url: propre, separee: propre !== (process.env.DATABASE_URL ?? "") };
  const plateforme = process.env.DATABASE_URL;
  return plateforme ? { url: plateforme, separee: false } : null;
}

/** Vrai si une adresse propre au centre est posée (FRONTIER_DATABASE_URL, ou adresse imposée par un test). */
export function variableFournie(): boolean {
  return urlForcee !== undefined ? !!urlForcee : !!process.env.FRONTIER_DATABASE_URL;
}

/** Pour les tests : impose l'URL (ou la retire avec null) et ferme le pool courant. */
export async function configurerBase(url: string | null | undefined): Promise<void> {
  await fermerBase();
  urlForcee = url;
}

/** Crée un pool vers l'adresse donnée (mêmes réglages SSL que ceux du centre). Sert au centre lui-même, à la sauvegarde et à la restauration. */
export function creerPool(url: string, max = 5): pg.Pool {
  const ssl = /proxy\.rlwy\.net|\.railway\.app|sslmode=require/.test(url) && !/railway\.internal/.test(url);
  const p = new Pool({ connectionString: url, ssl: ssl ? { rejectUnauthorized: false } : undefined, max, connectionTimeoutMillis: 10_000, idleTimeoutMillis: 30_000, statement_timeout: 20_000 });
  p.on("error", (e) => console.error("[frontier] erreur de connexion inactive :", e.message));
  return p;
}

export function poolFrontier(): pg.Pool {
  if (pool) return pool;
  const r = resoudreUrl();
  if (!r) throw new Error("Base du centre indisponible : ni FRONTIER_DATABASE_URL ni DATABASE_URL.");
  pool = creerPool(r.url);
  return pool;
}

export function dbFrontier(): DbFrontier {
  if (!db) db = drizzle(poolFrontier(), { schema });
  return db;
}

export async function fermerBase(): Promise<void> {
  const p = pool;
  pool = null;
  db = null;
  if (p) await p.end().catch(() => undefined);
}
