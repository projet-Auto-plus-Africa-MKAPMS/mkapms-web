/**
 * Chantier de développement — Project Engine.
 *
 * Un projet = une ligne `in_projets` + un dossier réel sur disque, hors du
 * dépôt git, propre à son propriétaire. Aucune fonction de ce fichier ne
 * mélange jamais les fichiers de deux utilisateurs : `ouvrir()` vérifie
 * toujours `ownerId === appelant` avant de renvoyer un `workspacePath`.
 *
 * Racine des workspaces : `CHANTIER_WORKSPACE_ROOT` si défini, sinon un
 * dossier temporaire du système — volontairement hors du dépôt. Ce chemin
 * n'est jamais persistant entre deux déploiements Railway (disque éphémère) :
 * cohérent avec la règle du lot — aperçu et projet restent un bac à sable de
 * travail, jamais un stockage définitif tant que la persistance réelle
 * (objet de stockage, volume) n'a pas été demandée dans un lot ultérieur.
 */
import { and, desc, eq } from "drizzle-orm";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { db } from "../../db.js";
import { inProjets } from "../schema.js";

function racineWorkspaces(): string {
  return process.env.CHANTIER_WORKSPACE_ROOT || path.join(os.tmpdir(), "mkapms-chantier");
}

const DIACRITIQUES = /[̀-ͯ]/g;

function slug(nom: string): string {
  const net = nom
    .toLowerCase()
    .normalize("NFD")
    .replace(DIACRITIQUES, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return net || "projet";
}

export type StatutProjet = "cree" | "en_cours" | "pret" | "erreur" | "archive";

export interface Projet {
  id: number;
  ownerId: number;
  nom: string;
  description: string;
  typeProjet: string;
  workspacePath: string;
  statut: StatutProjet;
  countryCode: string | null;
  deploymentStatus: string;
  dernierPlan: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function creerProjet(input: {
  ownerId: number;
  nom: string;
  description?: string;
  typeProjet?: string;
  countryCode?: string | null;
  sessionId?: number | null;
}): Promise<Projet> {
  const nomSur = input.nom.trim().slice(0, 120) || "Projet sans nom";
  const dossier = path.join(racineWorkspaces(), `u${input.ownerId}`, `${Date.now()}-${slug(nomSur)}`);
  await fs.mkdir(dossier, { recursive: true });

  const [ligne] = await db
    .insert(inProjets)
    .values({
      ownerId: input.ownerId,
      nom: nomSur,
      description: (input.description ?? "").slice(0, 4000),
      typeProjet: input.typeProjet ?? "site_vitrine",
      workspacePath: dossier,
      statut: "cree",
      countryCode: input.countryCode ?? null,
      sessionId: input.sessionId ?? null,
      actorId: input.ownerId,
    })
    .returning();
  return versProjet(ligne);
}

function versProjet(l: typeof inProjets.$inferSelect): Projet {
  return {
    id: l.id,
    ownerId: l.ownerId,
    nom: l.nom,
    description: l.description,
    typeProjet: l.typeProjet,
    workspacePath: l.workspacePath,
    statut: l.statut as StatutProjet,
    countryCode: l.countryCode,
    deploymentStatus: l.deploymentStatus,
    dernierPlan: l.dernierPlan,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

/** Vérifie l'appartenance avant de renvoyer quoi que ce soit — jamais de projet d'un autre utilisateur. */
export async function ouvrir(projetId: number, ownerId: number): Promise<Projet | null> {
  const [ligne] = await db
    .select()
    .from(inProjets)
    .where(and(eq(inProjets.id, projetId), eq(inProjets.ownerId, ownerId)))
    .limit(1);
  return ligne ? versProjet(ligne) : null;
}

export async function mesProjets(ownerId: number, limit = 40): Promise<Projet[]> {
  const lignes = await db
    .select()
    .from(inProjets)
    .where(eq(inProjets.ownerId, ownerId))
    .orderBy(desc(inProjets.updatedAt))
    .limit(limit);
  return lignes.map(versProjet);
}

export async function majStatut(projetId: number, statut: StatutProjet): Promise<void> {
  await db.update(inProjets).set({ statut, updatedAt: new Date() }).where(eq(inProjets.id, projetId));
}

export async function majPlan(projetId: number, plan: string): Promise<void> {
  await db.update(inProjets).set({ dernierPlan: plan.slice(0, 20000), updatedAt: new Date() }).where(eq(inProjets.id, projetId));
}

export async function toucher(projetId: number): Promise<void> {
  await db.update(inProjets).set({ updatedAt: new Date() }).where(eq(inProjets.id, projetId));
}
