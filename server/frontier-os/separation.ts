/**
 * Centre Cyber-Électrique — séparation physique de la base du centre : ce qui est MESURÉ, jamais ce qui est déclaré.
 *
 * Variable d'environnement posée ne veut pas dire base séparée. Le niveau est établi en interrogeant les deux bases :
 *  - `schema_partage`   : FRONTIER_DATABASE_URL absente — le schéma « frontier » vit dans la base de la plateforme (séparé en droit seulement) ;
 *  - `base_distincte`   : autre base, MÊME serveur Postgres (une panne ou une saturation du serveur touche les deux) ;
 *  - `serveur_distinct` : autre serveur Postgres (instance de démarrage différente) — la séparation physique voulue ;
 *  - `identique`        : la variable est posée mais pointe vers la base de la plateforme elle-même — aucune séparation ;
 *  - `inconnu`          : au moins une des deux bases n'a pas répondu — rien n'est affirmé.
 *
 * Aucun nom d'hôte, aucun identifiant, aucun mot de passe n'est lu ni renvoyé.
 */
import type pg from "pg";

export type NiveauSeparation = "schema_partage" | "base_distincte" | "serveur_distinct" | "identique" | "inconnu";

export interface MesureServeur {
  base: string;
  /** Instant de démarrage de l'instance Postgres : identique pour deux connexions au même serveur, différent pour deux serveurs. */
  demarreLe: string;
  port: number | null;
  versionMajeure: string;
}

export interface DiagnosticSeparation {
  niveau: NiveauSeparation;
  /** FRONTIER_DATABASE_URL est-elle posée ? */
  variableFournie: boolean;
  memeServeur: boolean | null;
  memeBase: boolean | null;
  separeeMateriellement: boolean;
  centre: MesureServeur | null;
  plateforme: MesureServeur | null;
  detail: string;
  etapes: string[];
}

export const ETAPES_BASCULE = [
  "Créer un second service Postgres dédié au centre (Railway : Nouveau → Base de données → PostgreSQL) — il doit être un AUTRE service, pas une autre base du même.",
  "Sauvegarder le centre actuel : npx tsx scripts/centre-sauvegarde.ts sauvegarder (dossier daté + empreintes).",
  "Restaurer la sauvegarde dans le nouveau Postgres, base vide : npx tsx scripts/centre-sauvegarde.ts restaurer --dossier <dossier> --cible <url du nouveau Postgres> --confirme.",
  "Comparer source et cible, ligne par ligne : npx tsx scripts/centre-sauvegarde.ts comparer --source <url actuelle> --cible <url du nouveau Postgres>. Continuer seulement si « identiques ».",
  "Poser FRONTIER_DATABASE_URL (adresse du nouveau Postgres) dans les variables du service de la plateforme, puis redémarrer.",
  "Vérifier dans le centre (Cybersécurité) que le niveau affiché est « serveur distinct » et que les lignes sont revenues coupées.",
];

const DELAI_MESURE_MS = 4000;

async function mesurer(pool: pg.Pool): Promise<MesureServeur> {
  const r = await Promise.race([
    pool.query<{ base: string; demarre: Date; port: number | null; version: string }>(
      "SELECT current_database() AS base, pg_postmaster_start_time() AS demarre, inet_server_port() AS port, current_setting('server_version') AS version",
    ),
    new Promise<never>((_, rejet) => setTimeout(() => rejet(new Error("mesure trop longue")), DELAI_MESURE_MS).unref()),
  ]);
  const l = r.rows[0]!;
  return { base: l.base, demarreLe: new Date(l.demarre).toISOString(), port: l.port === null ? null : Number(l.port), versionMajeure: String(l.version).split(".")[0] ?? "?" };
}

/** Établit le niveau de séparation d'après deux mesures réelles. `plateforme` est lue en lecture seule (une requête sans effet). */
export async function diagnostiquerSeparation(centre: pg.Pool, plateforme: pg.Pool | null, variableFournie: boolean): Promise<DiagnosticSeparation> {
  let mc: MesureServeur | null = null;
  let mp: MesureServeur | null = null;
  try {
    mc = await mesurer(centre);
  } catch {
    mc = null;
  }
  try {
    mp = plateforme ? await mesurer(plateforme) : null;
  } catch {
    mp = null;
  }
  const base = { variableFournie, centre: mc, plateforme: mp, etapes: ETAPES_BASCULE };
  if (!variableFournie) {
    return { ...base, niveau: "schema_partage", memeServeur: mc && mp ? true : null, memeBase: mc && mp ? true : null, separeeMateriellement: false, detail: "FRONTIER_DATABASE_URL n'est pas posée : le schéma « frontier » vit dans la base de la plateforme. Séparé en droit (pool, migrateur, journal et propriétaires propres), pas en matériel : une panne de ce serveur touche les deux." };
  }
  if (!mc || !mp) {
    return { ...base, niveau: "inconnu", memeServeur: null, memeBase: null, separeeMateriellement: false, detail: "Au moins une des deux bases n'a pas répondu à la mesure : la séparation n'est pas affirmée." };
  }
  const memeServeur = mc.demarreLe === mp.demarreLe && mc.port === mp.port;
  const memeBase = memeServeur && mc.base === mp.base;
  if (memeBase) return { ...base, niveau: "identique", memeServeur, memeBase, separeeMateriellement: false, detail: "FRONTIER_DATABASE_URL est posée mais désigne la base de la plateforme elle-même : aucune séparation." };
  if (memeServeur) return { ...base, niveau: "base_distincte", memeServeur, memeBase, separeeMateriellement: false, detail: "Base distincte mais sur le MÊME serveur Postgres que la plateforme : isolation logique, pas de séparation physique (une panne ou une saturation du serveur touche les deux)." };
  return { ...base, niveau: "serveur_distinct", memeServeur, memeBase, separeeMateriellement: true, detail: "Serveur Postgres distinct, mesuré (instances de démarrage différentes) : le centre ne tombe pas avec la base de la plateforme." };
}

export const LIBELLE_SEPARATION: Readonly<Record<NiveauSeparation, string>> = {
  schema_partage: "Schéma partagé (séparé en droit seulement)",
  base_distincte: "Base distincte, même serveur",
  serveur_distinct: "Serveur distinct (séparation physique)",
  identique: "Aucune séparation (variable posée vers la base de la plateforme)",
  inconnu: "Non établie (mesure impossible)",
};
