/**
 * Approbateurs de déploiement (point demandé par le PDG, hors lots numérotés).
 *
 * Désignation nominative uniquement : jamais un rôle entier. Le propriétaire
 * choisit une personne précise — lui-même ou un employé nommé — pour donner
 * le feu vert à une mise en production. Attribution journalisée, révocable
 * à tout moment, sans jamais supprimer l'historique des décisions passées.
 */
import { and, eq, ilike, or } from "drizzle-orm";
import { db } from "../../db.js";
import { inDeployApprovers } from "../schema.js";
import { users } from "../../schema.js";

export interface Approbateur {
  id: number;
  userId: number;
  nom: string;
  email: string;
  role: string;
  actif: boolean;
  motif: string;
  createdAt: Date;
}

export async function listerApprobateurs(): Promise<Approbateur[]> {
  const lignes = await db
    .select({
      id: inDeployApprovers.id,
      userId: inDeployApprovers.userId,
      actif: inDeployApprovers.actif,
      motif: inDeployApprovers.motif,
      createdAt: inDeployApprovers.createdAt,
      nom: users.name,
      email: users.email,
      role: users.role,
    })
    .from(inDeployApprovers)
    .innerJoin(users, eq(users.id, inDeployApprovers.userId))
    .orderBy(inDeployApprovers.createdAt);
  return lignes;
}

export async function rechercherCandidats(q: string): Promise<{ id: number; nom: string; email: string; role: string }[]> {
  const terme = q.trim();
  if (terme.length < 2) return [];
  return db
    .select({ id: users.id, nom: users.name, email: users.email, role: users.role })
    .from(users)
    .where(or(ilike(users.name, `%${terme}%`), ilike(users.email, `%${terme}%`)))
    .limit(10);
}

export async function designerApprobateur(input: {
  userId: number;
  motif: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const motif = input.motif.trim();
  if (motif.length < 10) {
    return {
      ok: false,
      detail: "Le motif doit être écrit (10 caractères minimum) pour rester opposable plus tard.",
    };
  }
  const [cible] = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1);
  if (!cible) {
    return { ok: false, detail: `Utilisateur #${input.userId} introuvable.` };
  }
  const [existant] = await db
    .select()
    .from(inDeployApprovers)
    .where(eq(inDeployApprovers.userId, input.userId))
    .limit(1);
  if (existant) {
    await db
      .update(inDeployApprovers)
      .set({ actif: true, motif, actorId: input.actorId ?? null, updatedAt: new Date() })
      .where(eq(inDeployApprovers.id, existant.id));
  } else {
    await db.insert(inDeployApprovers).values({
      userId: input.userId,
      motif,
      actorId: input.actorId ?? null,
    });
  }
  return { ok: true, detail: `${cible.name} peut désormais approuver un déploiement.` };
}

export async function retirerApprobateur(input: {
  userId: number;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const [existant] = await db
    .select()
    .from(inDeployApprovers)
    .where(eq(inDeployApprovers.userId, input.userId))
    .limit(1);
  if (!existant) return { ok: false, detail: "Cette personne n'était pas approbatrice." };
  await db
    .update(inDeployApprovers)
    .set({ actif: false, actorId: input.actorId ?? null, updatedAt: new Date() })
    .where(eq(inDeployApprovers.id, existant.id));
  return { ok: true, detail: "Droit d'approbation de déploiement retiré." };
}

export async function estApprobateur(userId: number): Promise<boolean> {
  const [ligne] = await db
    .select({ id: inDeployApprovers.id })
    .from(inDeployApprovers)
    .where(and(eq(inDeployApprovers.userId, userId), eq(inDeployApprovers.actif, true)))
    .limit(1);
  return !!ligne;
}
