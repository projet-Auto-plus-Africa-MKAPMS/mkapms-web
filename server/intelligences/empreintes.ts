/**
 * Mémoire par le sens : empreintes (embeddings) de la mémoire et des connaissances de l'IA.
 *
 * Rien ne s'allume tout seul : tant que la fonctionnalité « Recherche par le sens » n'est pas activée par le PDG,
 * rien n'est calculé et la recherche reste purement textuelle. Une fois activée :
 *  - chaque souvenir et chaque connaissance écrits sont indexés (le hash du texte évite de recalculer l'inchangé) ;
 *  - une recherche calcule l'empreinte de la question et classe les sources par similarité cosinus ;
 *  - si le fournisseur échoue, la recherche textuelle continue seule : jamais une réponse vide à sa place.
 *
 * Limite assumée : les vecteurs sont comparés en mémoire du serveur (au plus LIMITE_COMPARAISON sources par type,
 * les plus récentes). Suffisant pour une mémoire de direction ; au-delà, une base vectorielle dédiée sera à prévoir.
 * Le seuil de similarité est une valeur de départ non étalonnée sur les données réelles de MKA.P-MS.
 */
import { createHash } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db.js";
import { MODELE_EMPREINTES_DEFAUT, creerEmpreintes } from "./provider.js";
import { memoriserModeleEmpreintesEffectif, modeleEmpreintesEffectif, modeleValide } from "./sonde-store.js";
import { inConnaissance, inEmpreintes, inFonctions, inMemoire } from "./schema.js";

export type TypeSource = "memoire" | "connaissance";

export const LIMITE_COMPARAISON = 8000;
/** Valeur de départ, non étalonnée : en dessous, une source n'est pas considérée proche. */
export const SEUIL_SIMILARITE = 0.3;
const FONCTION = "empreintes_semantiques";

export async function empreintesActives(): Promise<boolean> {
  try {
    const [l] = await db.select({ active: inFonctions.active }).from(inFonctions).where(eq(inFonctions.fonction, FONCTION)).limit(1);
    return l?.active === true;
  } catch {
    return false;
  }
}

/** Modèle d'empreintes en vigueur : celui que la sonde a prouvé, sinon le défaut. Une empreinte d'un autre modèle n'est pas comparable. */
export async function modeleCourant(): Promise<string> {
  return (await modeleEmpreintesEffectif()) ?? (await modeleValide("empreintes_semantiques")) ?? MODELE_EMPREINTES_DEFAUT;
}

/** Retire les empreintes d'une source (souvenir déclassé en historique, par exemple) : elles ne doivent plus faire remonter une version périmée. */
export async function retirerEmpreintes(type: TypeSource, id: number): Promise<void> {
  try {
    await db.delete(inEmpreintes).where(and(eq(inEmpreintes.sourceType, type), eq(inEmpreintes.sourceId, id)));
  } catch {
    // Jamais bloquant pour l'écriture qui l'a déclenché.
  }
}

const hashTexte = (t: string) => createHash("sha256").update(t).digest("hex");

export function similariteCosinus(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let ab = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) {
    ab += a[i] * b[i];
    aa += a[i] * a[i];
    bb += b[i] * b[i];
  }
  return aa === 0 || bb === 0 ? 0 : ab / Math.sqrt(aa * bb);
}

export interface SourceAIndexer {
  type: TypeSource;
  id: number;
  texte: string;
}

/** Indexe des sources (par lots). Ignore celles dont le texte n'a pas changé. Ne jette jamais. */
export async function indexer(sources: SourceAIndexer[], options: { forcer?: boolean; fetchImpl?: typeof fetch } = {}): Promise<{ indexees: number; inchangees: number; echec: string | null }> {
  const resultat = { indexees: 0, inchangees: 0, echec: null as string | null };
  if (sources.length === 0) return resultat;
  if (!options.forcer && !(await empreintesActives())) return { ...resultat, echec: "Fonctionnalité éteinte." };
  try {
    for (let i = 0; i < sources.length; i += 48) {
      const lot = sources.slice(i, i + 48).filter((s) => s.texte.trim().length > 0);
      if (lot.length === 0) continue;
      const courant = await modeleCourant();
      const existantes = await db
        .select({ type: inEmpreintes.sourceType, id: inEmpreintes.sourceId, hash: inEmpreintes.hash })
        .from(inEmpreintes)
        .where(and(inArray(inEmpreintes.sourceId, lot.map((s) => s.id)), eq(inEmpreintes.modele, courant)));
      const aCalculer = lot.filter((s) => {
        const h = hashTexte(s.texte);
        const dejaLa = existantes.some((e) => e.type === s.type && e.id === s.id && e.hash === h);
        if (dejaLa) resultat.inchangees++;
        return !dejaLa;
      });
      if (aCalculer.length === 0) continue;
      const r = await creerEmpreintes(aCalculer.map((s) => s.texte), options.fetchImpl);
      if (!r.ok) return { ...resultat, echec: r.motif };
      await memoriserModeleEmpreintesEffectif(r.modele);
      for (let k = 0; k < aCalculer.length; k++) {
        const s = aCalculer[k];
        // Verrou partagé sur la source, puis insertion, dans une même transaction : un remplacement concurrent (qui modifie la
        // ligne source) attend la fin de l'insertion, puis supprime l'empreinte ; s'il est passé avant, la source n'est plus
        // active et rien n'est écrit. Aucune empreinte périmée ne peut survivre à cette course.
        const vecteur = `{${r.vecteurs[k].join(",")}}`;
        const ecrit = await db.transaction(async (tx) => {
          const verrou = s.type === "memoire"
            ? await tx.execute(sql`select 1 from in_memoire where id = ${s.id} and cycle = 'actif' for share`)
            : await tx.execute(sql`select 1 from in_connaissance where id = ${s.id} and statut = 'confirme' for share`);
          if (verrou.rows.length === 0) return { rows: [] as unknown[] };
          return tx.execute(sql`
            insert into in_empreintes (source_type, source_id, modele, dimensions, hash, vecteur, updated_at)
            values (${s.type}, ${s.id}, ${r.modele}, ${r.dimensions}, ${hashTexte(s.texte)}, ${vecteur}::real[], now())
            on conflict (source_type, source_id, modele)
            do update set dimensions = excluded.dimensions, hash = excluded.hash, vecteur = excluded.vecteur, updated_at = excluded.updated_at
            returning 1`);
        });
        if (ecrit.rows.length === 0) continue;
        // Une empreinte d'un autre modèle n'est plus comparable : elle est retirée pour que la source ne soit jamais « indexée » à tort.
        await db.delete(inEmpreintes).where(and(eq(inEmpreintes.sourceType, s.type), eq(inEmpreintes.sourceId, s.id), sql`${inEmpreintes.modele} <> ${r.modele}`));
        resultat.indexees++;
      }
    }
  } catch (e) {
    return { ...resultat, echec: e instanceof Error ? e.message.slice(0, 120) : "erreur" };
  }
  return resultat;
}

export interface Proche {
  id: number;
  score: number;
}

/**
 * Sources les plus proches du sens de la question, ou null quand la recherche par le sens n'est pas disponible
 * (fonctionnalité éteinte, fournisseur en échec, aucune empreinte) : l'appelant garde alors sa recherche textuelle.
 *
 * Les droits sont appliqués AVANT le classement final : seuls les souvenirs actifs (jamais une version périmée) et les
 * connaissances confirmées dont la visibilité est autorisée entrent dans la comparaison, de sorte qu'une source
 * interdite ne puisse jamais évincer une source permise du haut du classement.
 */
export async function rechercherParLeSens(
  type: TypeSource,
  requete: string,
  limit = 10,
  fetchImpl?: typeof fetch,
  options: { visibilites?: string[] } = {},
): Promise<Proche[] | null> {
  const q = requete.trim();
  if (q.length < 3 || !(await empreintesActives())) return null;
  const r = await creerEmpreintes([q], fetchImpl);
  if (!r.ok) return null;
  await memoriserModeleEmpreintesEffectif(r.modele);
  const vecQ = r.vecteurs[0];
  let lignes: { id: number; vecteur: number[] }[];
  if (type === "memoire") {
    lignes = await db
      .select({ id: inEmpreintes.sourceId, vecteur: inEmpreintes.vecteur })
      .from(inEmpreintes)
      .innerJoin(inMemoire, eq(inMemoire.id, inEmpreintes.sourceId))
      .where(and(eq(inEmpreintes.sourceType, "memoire"), eq(inEmpreintes.modele, r.modele), eq(inMemoire.cycle, "actif")))
      .orderBy(desc(inEmpreintes.updatedAt))
      .limit(LIMITE_COMPARAISON);
  } else {
    const visibilites = options.visibilites ?? [];
    if (visibilites.length === 0) return [];
    lignes = await db
      .select({ id: inEmpreintes.sourceId, vecteur: inEmpreintes.vecteur })
      .from(inEmpreintes)
      .innerJoin(inConnaissance, eq(inConnaissance.id, inEmpreintes.sourceId))
      .where(and(eq(inEmpreintes.sourceType, "connaissance"), eq(inEmpreintes.modele, r.modele), eq(inConnaissance.statut, "confirme"), inArray(inConnaissance.visibilite, visibilites)))
      .orderBy(desc(inEmpreintes.updatedAt))
      .limit(LIMITE_COMPARAISON);
  }
  if (lignes.length === 0) return null;
  return lignes
    .map((l) => ({ id: l.id, score: similariteCosinus(vecQ, l.vecteur) }))
    .filter((p) => p.score >= SEUIL_SIMILARITE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Retire les empreintes dont la source n'est plus active (souvenir remplacé, connaissance retirée) : filet de sécurité contre un calcul en retard. */
export async function purgerEmpreintesPerimees(): Promise<void> {
  try {
    await db.execute(sql`
      delete from in_empreintes e
      where (e.source_type = 'memoire' and not exists (select 1 from in_memoire m where m.id = e.source_id and m.cycle = 'actif'))
         or (e.source_type = 'connaissance' and not exists (select 1 from in_connaissance c where c.id = e.source_id and c.statut = 'confirme'))`);
  } catch {
    // Jamais bloquant.
  }
}

/** Texte indexé pour un souvenir ou une connaissance. */
export const texteSouvenir = (titre: string, contenu: string) => `${titre}\n${contenu}`.slice(0, 8000);

/** Indexation au fil de l'eau, sans jamais faire échouer l'écriture qui l'a déclenchée. */
export function indexerEnArrierePlan(source: SourceAIndexer): void {
  void indexer([source]).catch(() => undefined);
}

export interface EtatEmpreintes {
  active: boolean;
  memoire: { total: number; indexees: number };
  connaissances: { total: number; indexees: number };
}

export async function etatEmpreintes(): Promise<EtatEmpreintes> {
  const courant = await modeleCourant();
  const [m] = await db.select({
    total: sql<number>`count(*)::int`,
    indexees: sql<number>`count(*) filter (where exists (select 1 from in_empreintes e where e.source_type = 'memoire' and e.source_id = in_memoire.id and e.modele = ${courant}))::int`,
  }).from(inMemoire).where(eq(inMemoire.cycle, "actif"));
  const [c] = await db.select({
    total: sql<number>`count(*)::int`,
    indexees: sql<number>`count(*) filter (where exists (select 1 from in_empreintes e where e.source_type = 'connaissance' and e.source_id = in_connaissance.id and e.modele = ${courant}))::int`,
  }).from(inConnaissance).where(eq(inConnaissance.statut, "confirme"));
  return { active: await empreintesActives(), memoire: m, connaissances: c };
}

/** Indexe un lot de sources encore sans empreinte (reprise de l'existant). Renvoie ce qu'il reste. */
export async function reindexerUnLot(taille = 96, fetchImpl?: typeof fetch): Promise<{ indexees: number; restantes: number; echec: string | null }> {
  const lot = Math.max(1, Math.min(taille, 192));
  await purgerEmpreintesPerimees();
  const courant = await modeleCourant();
  const sources: SourceAIndexer[] = [];
  const memoires = await db
    .select({ id: inMemoire.id, titre: inMemoire.titre, contenu: inMemoire.contenu })
    .from(inMemoire)
    .where(and(eq(inMemoire.cycle, "actif"), sql`not exists (select 1 from in_empreintes e where e.source_type = 'memoire' and e.source_id = in_memoire.id and e.modele = ${courant})`))
    .limit(lot);
  for (const m of memoires) sources.push({ type: "memoire", id: m.id, texte: texteSouvenir(m.titre, m.contenu) });
  if (sources.length < lot) {
    const connaissances = await db
      .select({ id: inConnaissance.id, titre: inConnaissance.titre, contenu: inConnaissance.contenu })
      .from(inConnaissance)
      .where(and(eq(inConnaissance.statut, "confirme"), sql`not exists (select 1 from in_empreintes e where e.source_type = 'connaissance' and e.source_id = in_connaissance.id and e.modele = ${courant})`))
      .limit(lot - sources.length);
    for (const c of connaissances) sources.push({ type: "connaissance", id: c.id, texte: texteSouvenir(c.titre, c.contenu) });
  }
  const r = await indexer(sources, { forcer: true, fetchImpl });
  const [m] = await db.select({ n: sql<number>`count(*)::int` }).from(inMemoire).where(and(eq(inMemoire.cycle, "actif"), sql`not exists (select 1 from in_empreintes e where e.source_type = 'memoire' and e.source_id = in_memoire.id and e.modele = ${courant})`));
  const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(inConnaissance).where(and(eq(inConnaissance.statut, "confirme"), sql`not exists (select 1 from in_empreintes e where e.source_type = 'connaissance' and e.source_id = in_connaissance.id and e.modele = ${courant})`));
  return { indexees: r.indexees, restantes: m.n + c.n, echec: r.echec };
}
