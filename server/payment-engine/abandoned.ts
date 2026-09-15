/**
 * Abandoned Payment Engine (LOT 5 du Plan Maître Fournisseurs, §31).
 *
 * Ne détecte que ce qui est réellement observable : une transaction interne
 * créée mais jamais confirmée par le prestataire. Relance 24 h/48 h/72 h,
 * puis expiration réelle de la réservation associée. Une notification déjà
 * envoyée pour un palier donné n'est jamais renvoyée (journal `payment_events`
 * comme preuve, pas un simple compteur en mémoire).
 */
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db.js";
import { paymentTransactions, paymentEvents } from "./schema.js";
import { notifications } from "../modules/core.js";
import { setStatus } from "./service.js";

/** Relances configurables (§31). Le dernier palier expire la réservation au lieu de relancer. */
export const ABANDONED_THRESHOLDS_HOURS = [24, 48, 72] as const;

const PENDING_STATUSES = ["cree", "en_attente", "en_attente_virement", "autorise"] as const;

function eventTypeFor(hours: number): string {
  return `abandoned_notice_${hours}h`;
}

export interface AbandonedScanResult {
  scanned: number;
  notified: { hours: number; count: number }[];
  expired: number;
}

/**
 * Passe unique : pour chaque palier (du plus grand au plus petit), notifie
 * les transactions qui l'ont atteint et n'ont pas déjà reçu cette relance. Au
 * dernier palier (72 h), la transaction est expirée au lieu d'être relancée
 * (§31 "Expiration réservation").
 */
export async function scanAbandonedPayments(now: Date = new Date()): Promise<AbandonedScanResult> {
  const pending = await db
    .select()
    .from(paymentTransactions)
    .where(inArray(paymentTransactions.status, [...PENDING_STATUSES]));

  let expired = 0;
  const notified: { hours: number; count: number }[] = [];
  const sorted = [...ABANDONED_THRESHOLDS_HOURS].sort((a, b) => b - a);
  const finalThreshold = sorted[0];
  const alreadyExpired = new Set<number>();

  for (const hours of sorted) {
    const cutoff = new Date(now.getTime() - hours * 60 * 60 * 1000);
    const candidates = pending.filter((tx) => !alreadyExpired.has(tx.id) && tx.createdAt <= cutoff);
    let count = 0;
    for (const tx of candidates) {
      const [already] = await db
        .select({ id: paymentEvents.id })
        .from(paymentEvents)
        .where(and(eq(paymentEvents.transactionId, tx.id), eq(paymentEvents.type, eventTypeFor(hours))))
        .limit(1);
      if (already) continue;

      const isFinal = hours === finalThreshold;
      if (isFinal) {
        await setStatus(tx.id, "expire", { type: eventTypeFor(hours), data: { hours } });
        alreadyExpired.add(tx.id);
        expired += 1;
      } else {
        await db.insert(paymentEvents).values({
          transactionId: tx.id,
          type: eventTypeFor(hours),
          data: { hours },
        });
      }
      if (tx.userId) {
        try {
          await db.insert(notifications).values({
            userId: tx.userId,
            type: "paiement",
            title: isFinal ? "Réservation expirée — paiement non finalisé" : "Paiement en attente",
            body: isFinal
              ? `Votre paiement ${tx.reference} n'a pas été finalisé dans le délai imparti : la réservation associée a été libérée.`
              : `Votre paiement ${tx.reference} est toujours en attente depuis ${hours} h. Finalisez-le ou il sera automatiquement annulé.`,
            url: "/compte",
          });
        } catch (err) {
          console.error("[payment] notification abandon échouée:", (err as Error).message);
        }
      }
      count += 1;
    }
    notified.push({ hours, count });
  }

  return { scanned: pending.length, notified, expired };
}
