/**
 * Cycle de vie d'une demande de déploiement.
 *
 * Le moteur n'exécute jamais lui-même un déploiement (voir orchestrateur.ts,
 * étape "deploiement" : il constate seulement le verrou). Ce fichier ajoute la
 * brique manquante demandée par le PDG : une fois le verrou ouvert, une vraie
 * demande est posée devant une personne désignée (approbateurs.ts). Une fois
 * cette personne intervenue réellement (elle pousse le code, hors de cette
 * application), l'état Railway constaté ici vient toujours d'un appel réel.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../../db.js";
import { inDeploiements } from "../schema.js";
import { estApprobateur, listerApprobateurs } from "./approbateurs.js";
import { dernierEtat } from "./railway.js";

export type StatutDeploiement =
  | "en_attente_approbation"
  | "approuve"
  | "refuse"
  | "publie_ok"
  | "publie_echec";

export async function demander(input: {
  missionId?: number | null;
  demandeParId?: number;
}): Promise<{ id: number; approbateurs: string[] }> {
  const approbateurs = await listerApprobateurs();
  const actifs = approbateurs.filter((a) => a.actif);
  const [ligne] = await db
    .insert(inDeploiements)
    .values({
      missionId: input.missionId ?? null,
      demandeParId: input.demandeParId ?? null,
    })
    .returning({ id: inDeploiements.id });
  return { id: ligne.id, approbateurs: actifs.map((a) => a.nom) };
}

export async function approuver(input: {
  id: number;
  approuveParId: number;
  motif: string;
}): Promise<{ ok: boolean; detail: string }> {
  const autorise = await estApprobateur(input.approuveParId);
  if (!autorise) {
    return { ok: false, detail: "Cette personne n'est pas désignée comme approbatrice de déploiement." };
  }
  const [ligne] = await db.select().from(inDeploiements).where(eq(inDeploiements.id, input.id)).limit(1);
  if (!ligne) return { ok: false, detail: "Demande de déploiement introuvable." };
  if (ligne.statut !== "en_attente_approbation") {
    return { ok: false, detail: `Cette demande est déjà tranchée (${ligne.statut}).` };
  }
  await db
    .update(inDeploiements)
    .set({
      statut: "approuve",
      approuveParId: input.approuveParId,
      approuveLe: new Date(),
      motifDecision: input.motif.slice(0, 2000),
      updatedAt: new Date(),
    })
    .where(eq(inDeploiements.id, input.id));
  return {
    ok: true,
    detail:
      "Déploiement approuvé. Cette application ne pousse jamais le code elle-même : une fois le déploiement réellement fait, revenez vérifier la publication.",
  };
}

export async function refuser(input: {
  id: number;
  approuveParId: number;
  motif: string;
}): Promise<{ ok: boolean; detail: string }> {
  const autorise = await estApprobateur(input.approuveParId);
  if (!autorise) {
    return { ok: false, detail: "Cette personne n'est pas désignée comme approbatrice de déploiement." };
  }
  const [ligne] = await db.select().from(inDeploiements).where(eq(inDeploiements.id, input.id)).limit(1);
  if (!ligne) return { ok: false, detail: "Demande de déploiement introuvable." };
  if (ligne.statut !== "en_attente_approbation") {
    return { ok: false, detail: `Cette demande est déjà tranchée (${ligne.statut}).` };
  }
  await db
    .update(inDeploiements)
    .set({
      statut: "refuse",
      approuveParId: input.approuveParId,
      approuveLe: new Date(),
      motifDecision: input.motif.slice(0, 2000),
      updatedAt: new Date(),
    })
    .where(eq(inDeploiements.id, input.id));
  return { ok: true, detail: "Déploiement refusé." };
}

export async function verifierPublication(id: number): Promise<{ ok: boolean; detail: string }> {
  const [ligne] = await db.select().from(inDeploiements).where(eq(inDeploiements.id, id)).limit(1);
  if (!ligne) return { ok: false, detail: "Demande de déploiement introuvable." };
  if (ligne.statut !== "approuve" && ligne.statut !== "publie_ok" && ligne.statut !== "publie_echec") {
    return { ok: false, detail: "Cette demande n'a pas encore été approuvée : rien à vérifier côté Railway." };
  }
  const etat = await dernierEtat(1);
  if (!etat.disponible) {
    return { ok: false, detail: etat.motif };
  }
  const plusRecent = etat.deploiements[0];
  if (!plusRecent) {
    return { ok: false, detail: "Aucun déploiement Railway trouvé pour ce service." };
  }
  const statut: StatutDeploiement =
    plusRecent.status === "SUCCESS"
      ? "publie_ok"
      : plusRecent.status === "FAILED" || plusRecent.status === "CRASHED"
        ? "publie_echec"
        : (ligne.statut as StatutDeploiement);
  await db
    .update(inDeploiements)
    .set({
      railwayDeploymentId: plusRecent.id,
      railwayStatut: plusRecent.status,
      statut,
      updatedAt: new Date(),
    })
    .where(eq(inDeploiements.id, id));
  return {
    ok: true,
    detail: `Railway rapporte, pour son déploiement le plus récent (${plusRecent.createdAt}) : ${plusRecent.status}.`,
  };
}

export async function enAttentePour(userId: number) {
  const autorise = await estApprobateur(userId);
  if (!autorise) return [];
  return db
    .select()
    .from(inDeploiements)
    .where(eq(inDeploiements.statut, "en_attente_approbation"))
    .orderBy(desc(inDeploiements.createdAt));
}

export async function historique(limit = 40) {
  return db.select().from(inDeploiements).orderBy(desc(inDeploiements.createdAt)).limit(limit);
}
