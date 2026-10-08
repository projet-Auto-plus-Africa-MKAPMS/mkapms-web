/** Aides communes aux tests d'intégration du centre : une seule porte vers la base jetable, avec garde. */
export function urlDeTest(): string {
  const url = process.env.FRONTIER_TEST_DB ?? process.env.SHOP_KNOWLEDGE_TEST_DB ?? "";
  if (!url) throw new Error("FRONTIER_TEST_DB absente : ces tests exigent une base jetable locale.");
  const u = new URL(url);
  if (!["localhost", "127.0.0.1"].includes(u.hostname)) throw new Error(`Base refusée (hôte ${u.hostname}) : seules les bases locales sont autorisées.`);
  if (!/_test$/.test(u.pathname.replace(/^\//, ""))) throw new Error("Base refusée : le nom doit finir par _test.");
  return url;
}

import { configurerBase, dbFrontier, fermerBase, poolFrontier } from "../base/connexion.js";
import { assurerBase, oublierEtatBasePourTests } from "../base/demarrage.js";
import { assurerFondation, oublierFondationPourTests } from "../fondation.js";
import { lines } from "../base/schema.js";
import { eq } from "drizzle-orm";

/** Base neuve : schéma supprimé, migrations propres, fondation. */
export async function baseNeuve(): Promise<void> {
  await configurerBase(urlDeTest());
  await poolFrontier().query("DROP SCHEMA IF EXISTS frontier CASCADE");
  oublierEtatBasePourTests();
  oublierFondationPourTests();
  const e = await assurerBase();
  if (!e.prete) throw new Error(`Base du centre non prête : ${e.erreur}`);
  await assurerFondation();
}

export const fermer = () => fermerBase();

/** Identifiant d'une ligne réelle d'après la clé de son intermédiaire (ex. « shop-documents-only »). */
export async function ligneDe(cle: string): Promise<number> {
  const [l] = await dbFrontier().select({ id: lines.id }).from(lines).where(eq(lines.intermediaryRef, cle)).limit(1);
  if (!l) throw new Error(`Ligne inconnue : ${cle}`);
  return l.id;
}
export const PDG = { type: "pdg", id: 1 } as const;

/** Remet l'état d'exploitation à zéro entre deux essais SANS toucher à la fondation (lignes, coupures, portes, paires restent). */
export async function remiseAZero(): Promise<void> {
  const p = poolFrontier();
  await p.query(`
    UPDATE frontier.cuts SET requested = 'none', observed = 'unknown', progress = 'idle', error = NULL, last_proof = NULL, last_checked_at = NULL, last_command_id = NULL;
    UPDATE frontier.gates SET open = false, changed_by = NULL;
    UPDATE frontier.lines SET locked = false, enabled = true WHERE kind = 'real';
    UPDATE frontier.groups SET contact_locked = false;
    UPDATE frontier.engines SET running = true, health = 'unknown', health_checked_at = NULL WHERE platform_code = 'frontier';
    DELETE FROM frontier.command_receipts;
    DELETE FROM frontier.test_steps;
    DELETE FROM frontier.test_sessions;
    DELETE FROM frontier.repairs;
    DELETE FROM frontier.incidents;
    DELETE FROM frontier.exchanges;
    UPDATE frontier.commands SET parent_id = NULL;
    DELETE FROM frontier.commands;
    DELETE FROM frontier.measurements;
  `);
}
