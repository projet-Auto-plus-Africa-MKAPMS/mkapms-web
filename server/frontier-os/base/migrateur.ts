/**
 * Migrateur PROPRE du centre : applique les fichiers server/frontier-os/base/migrations/*.sql dans l'ordre de leur nom, une transaction par
 * fichier, avec son journal (frontier.migrations) et la somme de contrôle de chaque fichier. Un fichier déjà appliqué dont le contenu a changé
 * est une dérive : le migrateur refuse d'avancer (jamais de réécriture silencieuse de l'historique).
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type pg from "pg";

export interface RapportMigration {
  dossier: string;
  appliquees: string[];
  dejaAppliquees: string[];
}

export function dossierMigrations(): string {
  const ici = (() => {
    try {
      return path.dirname(fileURLToPath(import.meta.url));
    } catch {
      return process.cwd();
    }
  })();
  const candidats = [
    process.env.FRONTIER_MIGRATIONS_DIR,
    path.join(ici, "migrations"),
    path.resolve(process.cwd(), "server/frontier-os/base/migrations"),
    path.resolve(ici, "../server/frontier-os/base/migrations"),
  ].filter((x): x is string => !!x);
  const trouve = candidats.find((c) => existsSync(c) && readdirSync(c).some((f) => f.endsWith(".sql")));
  if (!trouve) throw new Error(`Migrations du centre introuvables (cherché : ${candidats.join(", ")})`);
  return trouve;
}

const empreinte = (texte: string) => createHash("sha256").update(texte).digest("hex");

export async function migrer(pool: pg.Pool, dossier = dossierMigrations()): Promise<RapportMigration> {
  const fichiers = readdirSync(dossier).filter((f) => /^\d{4}_[a-z0-9_]+\.sql$/.test(f)).sort();
  const client = await pool.connect();
  const rapport: RapportMigration = { dossier, appliquees: [], dejaAppliquees: [] };
  try {
    // Un seul démarrage à la fois, même avec plusieurs instances.
    await client.query("SELECT pg_advisory_lock(hashtext('frontier-os-migrations'))");
    await client.query("CREATE SCHEMA IF NOT EXISTS frontier");
    await client.query("CREATE TABLE IF NOT EXISTS frontier.migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    const deja = new Map((await client.query<{ name: string; checksum: string }>("SELECT name, checksum FROM frontier.migrations")).rows.map((r) => [r.name, r.checksum]));
    for (const nom of fichiers) {
      const sql = readFileSync(path.join(dossier, nom), "utf8");
      const somme = empreinte(sql);
      const connue = deja.get(nom);
      if (connue !== undefined) {
        if (connue !== somme) throw new Error(`Dérive détectée : la migration ${nom} du centre a changé depuis son application.`);
        rapport.dejaAppliquees.push(nom);
        continue;
      }
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO frontier.migrations (name, checksum) VALUES ($1, $2)", [nom, somme]);
        await client.query("COMMIT");
        rapport.appliquees.push(nom);
      } catch (e) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw new Error(`Échec de la migration ${nom} du centre : ${(e as Error).message}`);
      }
    }
    return rapport;
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('frontier-os-migrations'))").catch(() => undefined);
    client.release();
  }
}
