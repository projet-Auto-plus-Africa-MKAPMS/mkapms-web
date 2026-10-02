/**
 * Accès aux missions de l'agent développeur (lecture et écriture), séparé de la logique d'orchestration pour que celle-ci
 * se vérifie sans base. Aucune règle métier ici : seulement ce qu'il faut stocker et retrouver.
 */
import { and, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db.js";
import { inMissionEtapes, inMissions } from "./schema.js";

export interface LigneMission {
  id: number;
  objectif: string;
  domaine: string;
  statut: string;
  arretSur: string;
  motif: string;
  actorId: number | null;
  devRequestId: number | null;
  createdAt: Date;
}

export interface LigneEtape {
  etape: string;
  libelle: string;
  statut: string;
  observe: string;
  capacite: string | null;
  permission: string | null;
  niveauRequis: number;
  dureeMs: number;
}

export interface StoreMissions {
  creer(v: { objectif: string; domaine: string; actorId: number | null; repriseDe?: number | null }): Promise<number>;
  maj(id: number, patch: Record<string, unknown>): Promise<void>;
  ajouterEtapes(missionId: number, etapes: LigneEtape[]): Promise<void>;
  /** Missions de cet acteur restées inachevées (arrêtées ou en échec) depuis la date donnée, la plus récente d'abord. */
  inachevees(actorId: number, depuis: Date): Promise<LigneMission[]>;
  parId(id: number): Promise<LigneMission | null>;
  /** La reprise (la plus récente) d'une mission, s'il en existe une. */
  reprisePar(id: number): Promise<LigneMission | null>;
  etapesDe(missionId: number): Promise<LigneEtape[]>;
}

const colonnes = {
  id: inMissions.id,
  objectif: inMissions.objectif,
  domaine: inMissions.domaine,
  statut: inMissions.statut,
  arretSur: inMissions.arretSur,
  motif: inMissions.motif,
  actorId: inMissions.actorId,
  devRequestId: inMissions.devRequestId,
  createdAt: inMissions.createdAt,
};

export const STORE_REEL: StoreMissions = {
  async creer(v) {
    // Une mission d'origine n'a qu'UNE reprise (index unique) : une requête concurrente ne peut pas la reprendre aussi.
    const [m] = await db
      .insert(inMissions)
      .values({ objectif: v.objectif.slice(0, 4000), domaine: v.domaine, cote: "direction", actorId: v.actorId, repriseDe: v.repriseDe ?? null })
      .onConflictDoNothing()
      .returning({ id: inMissions.id });
    if (!m) throw new Error("reprise_deja_en_cours");
    return m.id;
  },
  async reprisePar(id) {
    const [m] = await db.select(colonnes).from(inMissions).where(eq(inMissions.repriseDe, id)).orderBy(desc(inMissions.id)).limit(1);
    return m ?? null;
  },
  async maj(id, patch) {
    await db.update(inMissions).set(patch).where(eq(inMissions.id, id));
  },
  async ajouterEtapes(missionId, etapes) {
    if (etapes.length === 0) return;
    await db.insert(inMissionEtapes).values(
      etapes.map((e, i) => ({
        missionId,
        rang: i + 1,
        etape: e.etape,
        libelle: e.libelle.slice(0, 160),
        statut: e.statut,
        capacite: e.capacite,
        permission: e.permission,
        niveauRequis: e.niveauRequis,
        observe: e.observe.slice(0, 20000),
        dureeMs: e.dureeMs,
      })),
    );
  },
  async inachevees(actorId, depuis) {
    return db
      .select(colonnes)
      .from(inMissions)
      .where(and(eq(inMissions.actorId, actorId), inArray(inMissions.statut, ["arretee", "echouee"]), gte(inMissions.createdAt, depuis), ne(inMissions.domaine, "boutique"),
        // Une mission déjà reprise par une autre n'est plus « inachevée » : c'est la reprise qui porte la suite.
        sql`not exists (select 1 from in_missions r where r.reprise_de = ${inMissions.id})`))
      .orderBy(desc(inMissions.id))
      .limit(30);
  },
  async parId(id) {
    const [m] = await db.select(colonnes).from(inMissions).where(eq(inMissions.id, id)).limit(1);
    return m ?? null;
  },
  async etapesDe(missionId) {
    return db
      .select({
        etape: inMissionEtapes.etape,
        libelle: inMissionEtapes.libelle,
        statut: inMissionEtapes.statut,
        observe: inMissionEtapes.observe,
        capacite: inMissionEtapes.capacite,
        permission: inMissionEtapes.permission,
        niveauRequis: inMissionEtapes.niveauRequis,
        dureeMs: inMissionEtapes.dureeMs,
      })
      .from(inMissionEtapes)
      .where(eq(inMissionEtapes.missionId, missionId))
      .orderBy(inMissionEtapes.rang);
  },
};
