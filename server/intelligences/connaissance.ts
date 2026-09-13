/**
 * LOT IA02F, points 16-17 — Global Knowledge Base MKA.P-MS.
 *
 * Distincte de la mémoire d'entreprise (memoire.ts, in_memoire) et du graphe
 * automobile technique (server/knowledge-engine/, ake_nodes) : ceci porte la
 * documentation/procédures/règles de la plateforme elle-même, catégorisée,
 * versionnée, sourcée — jamais un mélange avec ces deux autres mémoires.
 *
 * `connaissance_islamique` (point 17) reste une catégorie de l'architecture
 * uniquement : aucun contenu religieux massif n'est chargé dans ce lot, et sa
 * visibilité par défaut est `pdg_uniquement` tant qu'aucune revue de contenu
 * n'a eu lieu.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { inConnaissance } from "./schema.js";
import { versTsQuery } from "./recherche-texte.js";

export const CATEGORIES_CONNAISSANCE = [
  "documentation_interne",
  "architecture",
  "regles",
  "procedures",
  "produits",
  "moteurs",
  "conformite",
  "support",
  "connaissances_validees",
  "connaissance_islamique",
] as const;
export type CategorieConnaissance = (typeof CATEGORIES_CONNAISSANCE)[number];

/** Catégories sensibles : visibilité forcée pdg_uniquement à l'écriture, quoi que demande l'appelant. */
const CATEGORIES_SENSIBLES = new Set<CategorieConnaissance>(["connaissance_islamique"]);

export interface EntreeConnaissance {
  id: number;
  categorie: string;
  titre: string;
  contenu: string;
  source: string;
  version: string;
  auteur: string;
  statut: string;
  visibilite: string;
  validite: string;
  createdAt: Date;
  updatedAt: Date;
}

function versEntree(l: typeof inConnaissance.$inferSelect): EntreeConnaissance {
  return {
    id: l.id,
    categorie: l.categorie,
    titre: l.titre,
    contenu: l.contenu,
    source: l.source,
    version: l.version,
    auteur: l.auteur,
    statut: l.statut,
    visibilite: l.visibilite,
    validite: l.validite,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

export async function ecrire(input: {
  categorie: CategorieConnaissance;
  titre: string;
  contenu: string;
  source?: string;
  version?: string;
  auteur?: string;
  statut?: "propose" | "confirme" | "obsolete";
  actorId?: number | null;
}): Promise<EntreeConnaissance> {
  const [ligne] = await db
    .insert(inConnaissance)
    .values({
      categorie: input.categorie,
      titre: input.titre.slice(0, 220),
      contenu: input.contenu.slice(0, 40000),
      source: input.source ?? "",
      version: input.version ?? "1",
      auteur: input.auteur ?? "",
      statut: input.statut ?? "propose",
      visibilite: CATEGORIES_SENSIBLES.has(input.categorie) ? "pdg_uniquement" : "interne",
      actorId: input.actorId ?? null,
    })
    .returning();
  return versEntree(ligne);
}

/** `visibiliteAutorisee` restreint aux niveaux réellement accessibles à l'appelant — jamais tout par défaut. */
export async function lister(categorie: CategorieConnaissance | undefined, visibiliteAutorisee: string[]): Promise<EntreeConnaissance[]> {
  const conds = [eq(inConnaissance.statut, "confirme")];
  if (categorie) conds.push(eq(inConnaissance.categorie, categorie));
  const lignes = await db
    .select()
    .from(inConnaissance)
    .where(and(...conds))
    .orderBy(desc(inConnaissance.updatedAt))
    .limit(200);
  return lignes.filter((l) => visibiliteAutorisee.includes(l.visibilite)).map(versEntree);
}

export interface ResultatRechercheConnaissance {
  id: number;
  titre: string;
  categorie: string;
  extrait: string;
  score: number;
}

export async function rechercher(query: string, visibiliteAutorisee: string[], limit = 10): Promise<ResultatRechercheConnaissance[]> {
  const tsq = versTsQuery(query);
  if (!tsq) return [];
  const lignes = await db
    .select({
      id: inConnaissance.id,
      titre: inConnaissance.titre,
      categorie: inConnaissance.categorie,
      contenu: inConnaissance.contenu,
      visibilite: inConnaissance.visibilite,
      score: sql<number>`ts_rank(to_tsvector('french', ${inConnaissance.contenu} || ' ' || ${inConnaissance.titre}), to_tsquery('french', ${tsq}))`,
    })
    .from(inConnaissance)
    .where(
      and(
        eq(inConnaissance.statut, "confirme"),
        sql`to_tsvector('french', ${inConnaissance.contenu} || ' ' || ${inConnaissance.titre}) @@ to_tsquery('french', ${tsq})`,
      ),
    )
    .orderBy(sql`ts_rank(to_tsvector('french', ${inConnaissance.contenu} || ' ' || ${inConnaissance.titre}), to_tsquery('french', ${tsq})) desc`)
    .limit(limit * 2);

  return lignes
    .filter((l) => visibiliteAutorisee.includes(l.visibilite))
    .slice(0, limit)
    .map((l) => ({ id: l.id, titre: l.titre, categorie: l.categorie, extrait: l.contenu.slice(0, 400), score: Number(l.score) }));
}
