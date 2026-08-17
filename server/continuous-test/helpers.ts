/**
 * Points 108-113 — outils partagés par les familles de contrôles.
 *
 * Ces fonctions interrogent la plateforme **réellement en service** (HTTP
 * public, base de données). Aucune d'elles ne simule : quand l'observation est
 * impossible, elles le disent au lieu de renvoyer un succès.
 */
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { env } from "../env.js";

export type Statut = "reussi" | "echec" | "ignore";

export interface Observation {
  statut: Statut;
  observe: string;
}

export interface Scenario {
  id: string;
  /** Moteur contrôlé — le même nom qu'au registre, pour alimenter l'audit d'activation. */
  domaine: string;
  label: string;
  criticite: "critique" | "normale";
  /** Ce qui doit être vrai. Écrit noir sur blanc, y compris à l'écran. */
  attendu: string;
  run: () => Promise<Observation>;
}

export function base(): string | null {
  const u = (env.PUBLIC_URL || "").replace(/\/+$/, "");
  return u || null;
}

export type Reponse =
  | { ok: true; status: number; corps: string }
  | { ok: false; motif: string; reseau: boolean };

/** Récupère une URL publique du site. Une absence d'adresse publique n'est pas un échec. */
export async function http(
  chemin: string,
  init?: { entetes?: Record<string, string>; methode?: string; corps?: string },
): Promise<Reponse> {
  const b = base();
  if (!b) {
    return {
      ok: false,
      reseau: false,
      motif: "PUBLIC_URL n'est pas configurée : aucune adresse publique à interroger.",
    };
  }
  try {
    const res = await fetch(`${b}${chemin}`, {
      redirect: "follow",
      method: init?.methode ?? "GET",
      headers: init?.entetes,
      body: init?.corps,
    });
    const corps = await res.text();
    return { ok: true, status: res.status, corps };
  } catch (e) {
    return { ok: false, reseau: true, motif: (e as Error).message };
  }
}

/** Nombre de lignes d'une table, ou null si la table n'existe pas. */
export async function compte(table: string): Promise<number | null> {
  try {
    const r = await db.execute<{ n: number }>(
      sql.raw(`SELECT count(*)::int AS n FROM "${table}"`),
    );
    const rows = (r as unknown as { rows?: { n: number }[] }).rows ?? [];
    return rows[0]?.n ?? 0;
  } catch {
    return null;
  }
}

export async function scalaire(requete: string): Promise<number | null> {
  try {
    const r = await db.execute<{ n: number }>(sql.raw(requete));
    const rows = (r as unknown as { rows?: { n: number }[] }).rows ?? [];
    return rows[0]?.n ?? 0;
  } catch {
    return null;
  }
}

/** Lignes brutes d'une requête, ou null si la table n'existe pas. */
export async function lignes<T extends Record<string, unknown>>(
  requete: string,
): Promise<T[] | null> {
  try {
    const r = await db.execute<T>(sql.raw(requete));
    return (r as unknown as { rows?: T[] }).rows ?? [];
  } catch {
    return null;
  }
}

/** Une page servie par l'application est-elle une vraie page, ou l'écran « introuvable » ? */
export function estIntrouvable(corps: string): boolean {
  return /page introuvable|404 —|not ?found/i.test(corps.slice(0, 4000));
}
