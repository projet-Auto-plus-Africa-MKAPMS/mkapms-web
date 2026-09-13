/**
 * LOT IA02F, point 5 — Project Memory.
 *
 * Journal structuré, append-only, par projet Chantier (in_projets). Ne
 * remplace pas `in_projets.dernierPlan` (toujours mis à jour par
 * chantier/projets.ts::majPlan) : ceci ajoute une mémoire détaillée et
 * historisée (une ligne par objectif/décision/erreur/etc.) là où
 * `dernierPlan` n'a jamais gardé que le texte du DERNIER plan généré.
 *
 * Isolation réutilisée telle quelle depuis chantier/projets.ts::ouvrir() —
 * jamais une seconde vérification de propriété réimplémentée.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { inMemoireProjet } from "./schema.js";
import { ouvrir as ouvrirProjet } from "./chantier/projets.js";

export const TYPES_MEMOIRE_PROJET = [
  "objectif",
  "architecture",
  "decision",
  "convention",
  "tache",
  "erreur",
  "environnement",
  "dependance",
] as const;
export type TypeMemoireProjet = (typeof TYPES_MEMOIRE_PROJET)[number];

export interface EntreeMemoireProjet {
  id: number;
  projetId: number;
  type: string;
  titre: string;
  contenu: string;
  statut: string;
  createdAt: Date;
}

function versEntree(l: typeof inMemoireProjet.$inferSelect): EntreeMemoireProjet {
  return { id: l.id, projetId: l.projetId, type: l.type, titre: l.titre, contenu: l.contenu, statut: l.statut, createdAt: l.createdAt };
}

/** Lit la mémoire d'UN projet — refuse si le projet n'appartient pas à `ownerId`. */
export async function lire(projetId: number, ownerId: number, type?: TypeMemoireProjet): Promise<EntreeMemoireProjet[]> {
  const projet = await ouvrirProjet(projetId, ownerId);
  if (!projet) throw new Error("Projet introuvable ou appartenant à un autre compte.");
  const conds = [eq(inMemoireProjet.projetId, projetId)];
  if (type) conds.push(eq(inMemoireProjet.type, type));
  const lignes = await db.select().from(inMemoireProjet).where(and(...conds)).orderBy(desc(inMemoireProjet.createdAt)).limit(300);
  return lignes.map(versEntree);
}

export async function ecrire(input: {
  projetId: number;
  ownerId: number;
  type: TypeMemoireProjet;
  titre: string;
  contenu: string;
  statut?: "actif" | "resolu" | "abandonne";
}): Promise<EntreeMemoireProjet> {
  const projet = await ouvrirProjet(input.projetId, input.ownerId);
  if (!projet) throw new Error("Projet introuvable ou appartenant à un autre compte.");
  const [ligne] = await db
    .insert(inMemoireProjet)
    .values({
      projetId: input.projetId,
      type: input.type,
      titre: input.titre.slice(0, 200),
      contenu: input.contenu.slice(0, 8000),
      statut: input.statut ?? "actif",
      actorId: input.ownerId,
    })
    .returning();
  return versEntree(ligne);
}

/** Résumé bref injectable dans le contexte modèle pour le projet actif. */
export async function contexteInjectable(projetId: number, ownerId: number, limit = 10): Promise<string[]> {
  try {
    const lignes = await lire(projetId, ownerId);
    return lignes.slice(0, limit).map((l) => `[${l.type}${l.statut !== "actif" ? `/${l.statut}` : ""}] ${l.titre || l.contenu.slice(0, 120)}`);
  } catch {
    return [];
  }
}
