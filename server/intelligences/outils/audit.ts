/**
 * MKA.P-MS Intelligence — Audit / Observability des outils.
 *
 * Historique complet : une ligne par outil demandé, quelle qu'en soit
 * l'issue. N'exécute rien, ne décide rien — journalise ce que politique.ts et
 * executeur.ts ont déjà décidé et fait.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../../db.js";
import { inOutilsJournal } from "../schema.js";
import type { VerdictPolitique } from "./politique.js";

/** Longueur tronquée : ce journal trace l'activité, il ne remplace pas un stockage de données. */
const TRONQUER = 2000;

export interface EntreeJournal {
  toolId: string;
  moteur: string;
  role: string | null;
  verdictPolitique: VerdictPolitique;
  statutExecution: "execute" | "erreur" | "timeout" | "arguments_invalides" | null;
  motif: string;
  arguments: unknown;
  resultat: unknown;
  dureeMs: number;
  auditCategory: string | null;
}

function tronquer(valeur: unknown): string | null {
  if (valeur === undefined) return null;
  try {
    return JSON.stringify(valeur).slice(0, TRONQUER);
  } catch {
    return String(valeur).slice(0, TRONQUER);
  }
}

export async function journaliser(entree: EntreeJournal): Promise<void> {
  try {
    await db.insert(inOutilsJournal).values({
      toolId: entree.toolId,
      moteur: entree.moteur,
      role: entree.role,
      verdictPolitique: entree.verdictPolitique,
      statutExecution: entree.statutExecution,
      motif: entree.motif.slice(0, 2000),
      argumentsJson: tronquer(entree.arguments),
      resultatJson: tronquer(entree.resultat),
      dureeMs: entree.dureeMs,
      auditCategory: entree.auditCategory,
    });
  } catch {
    // L'audit ne doit jamais faire échouer la boucle qu'il observe — comme
    // le reste de la mesure d'appels dans ce moteur (voir provider.ts).
  }
}

export async function historique(limit = 100) {
  return db.select().from(inOutilsJournal).orderBy(desc(inOutilsJournal.createdAt)).limit(limit);
}

export async function historiquePourOutil(toolId: string, limit = 50) {
  return db
    .select()
    .from(inOutilsJournal)
    .where(eq(inOutilsJournal.toolId, toolId))
    .orderBy(desc(inOutilsJournal.createdAt))
    .limit(limit);
}
