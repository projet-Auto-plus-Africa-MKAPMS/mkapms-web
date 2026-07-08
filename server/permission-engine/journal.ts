/**
 * MKA.P-MS Permission Engine — Journal de sécurité.
 *
 * Enregistre chaque tentative d'accès sensible (autorisée ou refusée).
 * Fire-and-forget : ne bloque jamais la requête si l'écriture échoue.
 */
import { db } from "../db.js";
import { permSecurityLog } from "./schema.js";

export interface AccessLogEntry {
  userId?: number | null;
  role?: string | null;
  module?: string | null;
  action?: string | null;
  path?: string | null;
  side?: "api" | "ui";
  allowed: boolean;
  reason?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export function logAccess(entry: AccessLogEntry): void {
  // Fire-and-forget — n'attend pas, n'échoue jamais côté appelant.
  db.insert(permSecurityLog)
    .values({
      userId: entry.userId ?? null,
      role: entry.role ?? null,
      module: entry.module ?? null,
      action: entry.action ?? null,
      path: entry.path ?? null,
      side: entry.side ?? "api",
      allowed: entry.allowed,
      reason: entry.reason ?? null,
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
    })
    .catch(() => {
      /* silencieux — le journal ne doit jamais casser la plateforme */
    });
}
