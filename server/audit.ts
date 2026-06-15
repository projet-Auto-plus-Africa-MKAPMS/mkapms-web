// Journalisation des actions d'administration (traçabilité « radar » pour le PDG).
// Parcours §10 (« Toutes les actions sont loggées ») et Partie 7 (« qui a fait quoi,
// quand, depuis quel appareil et quelle IP »).
import type { Request } from "express";
import { db } from "./db.js";
import { auditLogs } from "./schema.js";

export interface ClientMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Extrait l'IP réelle (derrière le proxy Railway) + l'appareil (User-Agent).
export function clientMeta(req?: Request): ClientMeta {
  if (!req) return {};
  const fwd = req.headers["x-forwarded-for"];
  const ip = Array.isArray(fwd)
    ? fwd[0]
    : (fwd as string | undefined)?.split(",")[0]?.trim() || req.socket?.remoteAddress || null;
  const ua = (req.headers["user-agent"] as string | undefined) ?? null;
  return { ipAddress: ip ?? null, userAgent: ua ? ua.slice(0, 255) : null };
}

export async function logAction(
  actorId: number | null,
  action: string,
  entityType?: string,
  entityId?: number | null,
  metadata?: Record<string, unknown>,
  meta?: ClientMeta,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorId: actorId ?? null,
      action,
      entityType: entityType ?? null,
      entityId: entityId ?? null,
      metadata: metadata ?? null,
      ipAddress: meta?.ipAddress ?? null,
      userAgent: meta?.userAgent ?? null,
    });
  } catch (err) {
    // Le log ne doit jamais bloquer l'action métier.
    console.error("[audit] échec d'écriture:", err);
  }
}
