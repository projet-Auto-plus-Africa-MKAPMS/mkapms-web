/**
 * LOT IA02F, points 6-8 — File System Intelligence.
 *
 * Pipeline honnête : uploaded → validated → parsed → chunked → indexed →
 * searchable → ready_for_rag, ou `failed` avec l'erreur réelle à chaque
 * étape. Un document n'est jamais marqué "prêt" si l'indexation a échoué
 * (point 7). Stockage en base64 (`donnees`) : même convention que
 * kyc_documents/annonces, aucun objet de stockage (S3) n'existe dans ce
 * dépôt et ce lot n'en construit pas un.
 *
 * Isolation stricte par propriétaire, et par projet quand un fichier est
 * rattaché à un projet Chantier (jamais un accès cross-user ou cross-projet,
 * point 14/24).
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "../db.js";
import { inFichierMorceaux, inFichiers } from "./schema.js";
import { ouvrir as ouvrirProjet } from "./chantier/projets.js";
import { extraire, decouper, TYPES_SUPPORTES } from "./fichiers-extraction.js";
import { versTsQuery } from "./recherche-texte.js";

export const STATUTS_PIPELINE = ["uploaded", "validated", "parsed", "chunked", "indexed", "searchable", "ready_for_rag", "failed"] as const;
export type StatutPipeline = (typeof STATUTS_PIPELINE)[number];

const TAILLE_MAX_OCTETS = 20 * 1024 * 1024; // 20 Mo décodés

export interface FichierResume {
  id: number;
  ownerId: number;
  projetId: number | null;
  nom: string;
  typeMime: string;
  tailleOctets: number;
  statutPipeline: string;
  erreur: string;
  nbPages: number | null;
  createdAt: Date;
}

function versResume(l: typeof inFichiers.$inferSelect): FichierResume {
  return {
    id: l.id,
    ownerId: l.ownerId,
    projetId: l.projetId,
    nom: l.nom,
    typeMime: l.typeMime,
    tailleOctets: l.tailleOctets,
    statutPipeline: l.statutPipeline,
    erreur: l.erreur,
    nbPages: l.nbPages,
    createdAt: l.createdAt,
  };
}

/** Vérifie l'appartenance (directe, ou via un projet possédé) avant tout accès. */
async function exigerAcces(id: number, ownerId: number): Promise<typeof inFichiers.$inferSelect> {
  const [ligne] = await db.select().from(inFichiers).where(eq(inFichiers.id, id)).limit(1);
  if (!ligne) throw new Error("Fichier introuvable.");
  if (ligne.ownerId === ownerId) return ligne;
  if (ligne.projetId) {
    const projet = await ouvrirProjet(ligne.projetId, ownerId);
    if (projet) return ligne;
  }
  throw new Error("Ce fichier appartient à un autre compte ou projet.");
}

/**
 * Dépose un fichier, le valide, puis lance immédiatement son traitement
 * (parse → chunk → index). Pas de file d'attente asynchrone dans ce lot
 * (aucune infrastructure de job n'existe dans le dépôt) : le traitement est
 * synchrone, borné par la taille max et par le propre comportement borné des
 * extracteurs (point 28).
 */
export async function deposer(input: {
  ownerId: number;
  projetId?: number | null;
  nom: string;
  typeMime: string;
  donneesBase64: string;
}): Promise<FichierResume> {
  if (input.projetId) {
    const projet = await ouvrirProjet(input.projetId, input.ownerId);
    if (!projet) throw new Error("Projet introuvable ou appartenant à un autre compte.");
  }

  const buffer = Buffer.from(input.donneesBase64, "base64");
  if (buffer.length === 0) throw new Error("Fichier vide ou données invalides.");
  if (buffer.length > TAILLE_MAX_OCTETS) {
    throw new Error(`Fichier trop volumineux (${Math.round(buffer.length / 1024 / 1024)} Mo, maximum ${TAILLE_MAX_OCTETS / 1024 / 1024} Mo).`);
  }

  const hash = createHash("sha256").update(buffer).digest("hex");
  const extension = (input.nom.split(".").pop() ?? "").toLowerCase().slice(0, 16);
  const supporte = TYPES_SUPPORTES.includes(input.typeMime);

  const [ligne] = await db
    .insert(inFichiers)
    .values({
      ownerId: input.ownerId,
      projetId: input.projetId ?? null,
      nom: input.nom.slice(0, 260),
      typeMime: input.typeMime,
      extension,
      tailleOctets: buffer.length,
      hashSha256: hash,
      donnees: input.donneesBase64,
      statutPipeline: supporte ? "validated" : "failed",
      erreur: supporte ? "" : `Type non supporté pour l'extraction : ${input.typeMime || "inconnu"}.`,
    })
    .returning();

  if (!supporte) return versResume(ligne);

  return traiter(ligne.id);
}

/** Traite (ou retraite) un fichier déjà déposé : parse, chunk, index. Statut honnête à chaque étape. */
export async function traiter(fichierId: number): Promise<FichierResume> {
  const [ligne] = await db.select().from(inFichiers).where(eq(inFichiers.id, fichierId)).limit(1);
  if (!ligne) throw new Error("Fichier introuvable.");

  const buffer = Buffer.from(ligne.donnees, "base64");
  const extraction = await extraire(buffer, ligne.typeMime);

  if (!extraction.ok) {
    const [maj] = await db
      .update(inFichiers)
      .set({ statutPipeline: "failed", erreur: extraction.erreur, updatedAt: new Date() })
      .where(eq(inFichiers.id, fichierId))
      .returning();
    return versResume(maj);
  }

  await db.update(inFichiers).set({ statutPipeline: "parsed", contenuTexte: extraction.texte, nbPages: extraction.nbPages, erreur: "", updatedAt: new Date() }).where(eq(inFichiers.id, fichierId));

  const morceaux = decouper(extraction.texte);
  await db.delete(inFichierMorceaux).where(eq(inFichierMorceaux.fichierId, fichierId));
  if (morceaux.length === 0) {
    const [maj] = await db
      .update(inFichiers)
      .set({ statutPipeline: "failed", erreur: "Aucun morceau exploitable après découpage.", updatedAt: new Date() })
      .where(eq(inFichiers.id, fichierId))
      .returning();
    return versResume(maj);
  }
  await db.insert(inFichierMorceaux).values(morceaux.map((contenu, ordre) => ({ fichierId, ordre, contenu })));

  // chunked → indexed (l'index plein texte est fonctionnel, posé par la migration, rien à écrire de plus) → searchable → ready_for_rag.
  const [final] = await db
    .update(inFichiers)
    .set({ statutPipeline: "ready_for_rag", updatedAt: new Date() })
    .where(eq(inFichiers.id, fichierId))
    .returning();
  return versResume(final);
}

export async function mesFichiers(ownerId: number, projetId?: number | null): Promise<FichierResume[]> {
  const conds = projetId ? [eq(inFichiers.projetId, projetId)] : [eq(inFichiers.ownerId, ownerId)];
  const lignes = await db.select().from(inFichiers).where(and(...conds)).orderBy(desc(inFichiers.createdAt)).limit(200);
  return lignes.map(versResume);
}

export async function lireFichier(id: number, ownerId: number): Promise<{ resume: FichierResume; contenuTexte: string | null; morceaux: number }> {
  const ligne = await exigerAcces(id, ownerId);
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(inFichierMorceaux).where(eq(inFichierMorceaux.fichierId, id));
  return { resume: versResume(ligne), contenuTexte: ligne.contenuTexte, morceaux: n };
}

export async function supprimerFichier(id: number, ownerId: number): Promise<void> {
  await exigerAcces(id, ownerId);
  await db.delete(inFichierMorceaux).where(eq(inFichierMorceaux.fichierId, id));
  await db.delete(inFichiers).where(eq(inFichiers.id, id));
}

export interface ResultatRechercheFichier {
  fichierId: number;
  nom: string;
  ordre: number;
  extrait: string;
  score: number;
}

/**
 * Recherche plein texte réelle (PostgreSQL `ts_rank`) dans les fichiers
 * réellement accessibles à `ownerId` — jamais un fichier d'un autre compte,
 * et seulement les fichiers dont le statut est `ready_for_rag` (un fichier en
 * échec ou non indexé n'est jamais présenté comme cherchable, point 24).
 */
export async function rechercherDansFichiers(query: string, ownerId: number, limit = 10): Promise<ResultatRechercheFichier[]> {
  const tsq = versTsQuery(query);
  if (!tsq) return [];
  const lignes = await db
    .select({
      fichierId: inFichierMorceaux.fichierId,
      ordre: inFichierMorceaux.ordre,
      contenu: inFichierMorceaux.contenu,
      nom: inFichiers.nom,
      score: sql<number>`ts_rank(to_tsvector('french', ${inFichierMorceaux.contenu}), to_tsquery('french', ${tsq}))`,
    })
    .from(inFichierMorceaux)
    .innerJoin(inFichiers, eq(inFichiers.id, inFichierMorceaux.fichierId))
    .where(
      and(
        eq(inFichiers.ownerId, ownerId),
        eq(inFichiers.statutPipeline, "ready_for_rag"),
        sql`to_tsvector('french', ${inFichierMorceaux.contenu}) @@ to_tsquery('french', ${tsq})`,
      ),
    )
    .orderBy(sql`ts_rank(to_tsvector('french', ${inFichierMorceaux.contenu}), to_tsquery('french', ${tsq})) desc`)
    .limit(limit);

  return lignes.map((l) => ({ fichierId: l.fichierId, nom: l.nom, ordre: l.ordre, extrait: l.contenu.slice(0, 400), score: Number(l.score) }));
}
