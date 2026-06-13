// Journalisation des actions d'administration (traçabilité « radar » pour le PDG).
// Parcours §10 (« Toutes les actions sont loggées ») et §11 (« actions sensibles enregistrées »).
import { db } from "./db.js";
import { auditLogs } from "./schema.js";

export async function logAction(
  actorId: number | null,
  action: string,
  entityType?: string,
  entityId?: number | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: actorId ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
    });
  } catch (err) {
    // Le log ne doit jamais bloquer l'action métier.
    console.error("[audit] échec d'écriture:", err);
  }
}
