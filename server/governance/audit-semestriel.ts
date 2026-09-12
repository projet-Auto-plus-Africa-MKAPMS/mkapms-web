/**
 * MKA.P-MS Gouvernance — Audit global semestriel (règle permanente n°2 adoptée
 * à la clôture du LOT IA02B).
 *
 * Ne réimplémente aucun contrôle qui existe déjà : ce fichier ORCHESTRE les
 * scripts et rapports réels déjà construits (fuites fournisseurs, boucle
 * d'outils, Intelligence Coverage) et y ajoute ce qui manquait : le calendrier
 * (dernier audit / prochaine échéance) et le registre des réglages.
 *
 * Un audit immédiat (faille sécurité, API cassée, bug critique, changement
 * légal, dépendance supprimée, panne fournisseur) n'attend jamais les 6 mois —
 * `declencher()` accepte un motif hors cycle sans jamais bloquer sur la date.
 */
import { desc } from "drizzle-orm";
import { execFileSync } from "node:child_process";
import { db } from "../db.js";
import { gvAudits } from "./schema.js";
import { resume as resumeReglages } from "./settings-registry.js";

const SIX_MOIS_MS = 183 * 24 * 3600 * 1000;

function executer(commande: string, args: string[]): { ok: boolean; sortie: string } {
  try {
    const sortie = execFileSync(commande, args, { encoding: "utf8" });
    return { ok: true, sortie: sortie.trim() };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, sortie: (err.stderr ?? err.stdout ?? "").trim() };
  }
}

export interface RapportAudit {
  reglages: ReturnType<typeof resumeReglages>;
  fuitesFournisseurs: { ok: boolean; sortie: string };
  boucleOutils: { ok: boolean; sortie: string };
  couvertureIntelligence: { ok: boolean; sortie: string };
  typecheck: { ok: boolean; sortie: string };
}

/**
 * Exécute réellement les contrôles existants — jamais un résumé supposé.
 * Coûteux (typecheck complet du dépôt inclus) : plusieurs dizaines de
 * secondes à quelques minutes. Acceptable pour un déclenchement manuel PDG,
 * peu fréquent par nature (semestriel, ou hors cycle sur incident réel) —
 * pas conçu pour être appelé en boucle ni depuis un chemin utilisateur.
 */
export async function executerControles(): Promise<RapportAudit> {
  return {
    reglages: resumeReglages(),
    fuitesFournisseurs: executer("npx", ["tsx", "server/intelligences/__tests__/fuite-fournisseurs.test.ts"]),
    boucleOutils: executer("npx", ["tsx", "server/intelligences/outils/__tests__/boucle.test.ts"]),
    couvertureIntelligence: executer("npx", ["tsx", "scripts/gen-intelligence-coverage.ts"]),
    typecheck: executer("npx", ["tsc", "--noEmit"]),
  };
}

export interface DeclencherInput {
  type?: "semestriel" | "urgence";
  motif: string;
  actorId?: number | null;
}

/** Consigne un audit réellement exécuté (semestriel ou déclenché hors cycle). */
export async function declencher(input: DeclencherInput): Promise<{ id: number; rapport: RapportAudit }> {
  const rapport = await executerControles();
  const [ligne] = await db
    .insert(gvAudits)
    .values({
      type: input.type ?? "semestriel",
      motif: input.motif,
      rapportJson: rapport as unknown as Record<string, unknown>,
      actorId: input.actorId ?? null,
    })
    .returning({ id: gvAudits.id });
  return { id: ligne?.id ?? 0, rapport };
}

export async function dernierAudit() {
  const [ligne] = await db.select().from(gvAudits).orderBy(desc(gvAudits.createdAt)).limit(1);
  return ligne ?? null;
}

/**
 * Prochaine échéance calculée à partir du dernier audit réel — jamais une
 * date fixe recopiée. Aucun audit encore consigné → échéance immédiate (le
 * premier audit reste à faire).
 */
export async function prochaineEcheance(): Promise<{ date: Date | null; enRetard: boolean; motif: string }> {
  const dernier = await dernierAudit();
  if (!dernier) {
    return { date: null, enRetard: true, motif: "Aucun audit semestriel encore consigné : le premier reste à déclencher." };
  }
  const date = new Date(dernier.createdAt.getTime() + SIX_MOIS_MS);
  return {
    date,
    enRetard: date.getTime() < Date.now(),
    motif: `Calculée depuis le dernier audit du ${dernier.createdAt.toLocaleDateString("fr-FR")}.`,
  };
}

export async function historique(limit = 20) {
  return db.select().from(gvAudits).orderBy(desc(gvAudits.createdAt)).limit(limit);
}
