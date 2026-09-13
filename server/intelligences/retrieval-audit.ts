/**
 * LOT IA02F, point 23 — trace de chaque retrieval (mémoire, fichier,
 * connaissance, conversation). Un seul point d'écriture, appelé par
 * recherche-globale.ts et rag.ts : jamais un journal réimplémenté deux fois.
 */
import { db } from "../db.js";
import { inRetrievalAudit } from "./schema.js";

export async function tracerRetrieval(input: {
  userId?: number | null;
  projetId?: number | null;
  sessionId?: number | null;
  source: "memoire" | "fichier" | "connaissance" | "conversation" | "global" | "rag";
  requete: string;
  resultIds: (number | string)[];
  scores: number[];
  permissionsAppliquees: string;
  dureeMs: number;
  traceId: string;
}): Promise<void> {
  await db.insert(inRetrievalAudit).values({
    userId: input.userId ?? null,
    projetId: input.projetId ?? null,
    sessionId: input.sessionId ?? null,
    source: input.source,
    requete: input.requete.slice(0, 2000),
    resultIds: input.resultIds,
    scores: input.scores,
    permissionsAppliquees: input.permissionsAppliquees,
    dureeMs: input.dureeMs,
    traceId: input.traceId,
  });
}
