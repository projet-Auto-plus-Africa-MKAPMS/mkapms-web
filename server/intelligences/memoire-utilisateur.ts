/**
 * LOT IA02F, point 4 — User Memory.
 *
 * Distincte de la mémoire d'entreprise (memoire.ts, in_memoire, 13 catégories
 * globales à la plateforme) : ceci est la mémoire propre à UN utilisateur
 * (préférences, réglages, choix persistants, contexte métier durable), jamais
 * transformée automatiquement depuis ses messages — seule une écriture
 * explicite (memoireUtilisateurEcrire) crée ou met à jour une entrée.
 */
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { inMemoireUtilisateur } from "./schema.js";

export const CATEGORIES_MEMOIRE_UTILISATEUR = [
  "preference",
  "reglage",
  "choix_persistant",
  "contexte_metier",
  "workflow",
] as const;
export type CategorieMemoireUtilisateur = (typeof CATEGORIES_MEMOIRE_UTILISATEUR)[number];

export interface EntreeMemoireUtilisateur {
  id: number;
  userId: number;
  categorie: string;
  cle: string;
  contenu: string;
  source: string;
  confiance: string;
  visibilite: string;
  retentionJours: number | null;
  createdAt: Date;
  updatedAt: Date;
}

function versEntree(l: typeof inMemoireUtilisateur.$inferSelect): EntreeMemoireUtilisateur {
  return {
    id: l.id,
    userId: l.userId,
    categorie: l.categorie,
    cle: l.cle,
    contenu: l.contenu,
    source: l.source,
    confiance: l.confiance,
    visibilite: l.visibilite,
    retentionJours: l.retentionJours,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

/** Liste la mémoire d'UN utilisateur — jamais celle d'un autre (pas de paramètre userId côté appelant, toujours celui de la session authentifiée). */
export async function lister(userId: number, categorie?: string): Promise<EntreeMemoireUtilisateur[]> {
  const conds = [eq(inMemoireUtilisateur.userId, userId)];
  if (categorie) conds.push(eq(inMemoireUtilisateur.categorie, categorie));
  const lignes = await db
    .select()
    .from(inMemoireUtilisateur)
    .where(and(...conds))
    .orderBy(desc(inMemoireUtilisateur.updatedAt))
    .limit(200);
  return lignes.map(versEntree);
}

/** Écriture explicite uniquement — jamais un message de conversation transformé automatiquement en mémoire permanente. */
export async function ecrire(input: {
  userId: number;
  categorie: string;
  cle: string;
  contenu: string;
  source?: "utilisateur" | "deduit" | "import";
  confiance?: "haute" | "moyenne" | "faible";
  visibilite?: "prive" | "projet" | "entreprise";
  retentionJours?: number | null;
  actorId?: number | null;
}): Promise<EntreeMemoireUtilisateur> {
  const valeurs = {
    userId: input.userId,
    categorie: input.categorie,
    cle: input.cle.trim().slice(0, 160),
    contenu: input.contenu.slice(0, 8000),
    source: input.source ?? "utilisateur",
    confiance: input.confiance ?? "haute",
    visibilite: input.visibilite ?? "prive",
    retentionJours: input.retentionJours ?? null,
    actorId: input.actorId ?? input.userId,
    updatedAt: new Date(),
  };
  const [ligne] = await db
    .insert(inMemoireUtilisateur)
    .values(valeurs)
    .onConflictDoUpdate({ target: [inMemoireUtilisateur.userId, inMemoireUtilisateur.cle], set: valeurs })
    .returning();
  return versEntree(ligne);
}

/** Vérifie l'appartenance avant toute modification ou suppression — jamais l'entrée d'un autre utilisateur. */
async function exigerProprietaire(id: number, userId: number): Promise<EntreeMemoireUtilisateur> {
  const [ligne] = await db
    .select()
    .from(inMemoireUtilisateur)
    .where(and(eq(inMemoireUtilisateur.id, id), eq(inMemoireUtilisateur.userId, userId)))
    .limit(1);
  if (!ligne) throw new Error("Entrée de mémoire introuvable ou appartenant à un autre compte.");
  return versEntree(ligne);
}

export async function modifier(input: { id: number; userId: number; contenu?: string; visibilite?: string; confiance?: string }): Promise<EntreeMemoireUtilisateur> {
  await exigerProprietaire(input.id, input.userId);
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (input.contenu !== undefined) set.contenu = input.contenu.slice(0, 8000);
  if (input.visibilite !== undefined) set.visibilite = input.visibilite;
  if (input.confiance !== undefined) set.confiance = input.confiance;
  const [ligne] = await db.update(inMemoireUtilisateur).set(set).where(eq(inMemoireUtilisateur.id, input.id)).returning();
  return versEntree(ligne);
}

export async function supprimer(id: number, userId: number): Promise<void> {
  await exigerProprietaire(id, userId);
  await db.delete(inMemoireUtilisateur).where(eq(inMemoireUtilisateur.id, id));
}

/** Résumé bref injectable dans le contexte modèle — quelques entrées récentes, jamais toute la mémoire. */
export async function contexteInjectable(userId: number, limit = 8): Promise<string[]> {
  const lignes = await lister(userId);
  return lignes.slice(0, limit).map((l) => `[${l.categorie}] ${l.cle} : ${l.contenu.slice(0, 200)}`);
}
