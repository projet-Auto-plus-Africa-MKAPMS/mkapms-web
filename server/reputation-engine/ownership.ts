/**
 * Point 50 — qui a le droit de répondre à un avis.
 *
 * `reviewsV2.respond` n'autorisait la réponse que si `targetType === "user"` et
 * `targetId === uid`, ou si le compte était administrateur. Conséquence : un
 * garage, une boutique de pièces, un transporteur ou un dépanneur — c'est-à-dire
 * la quasi-totalité des cibles réelles — ne pouvaient **jamais** répondre aux
 * avis les concernant. La propriété est ici résolue à partir de la table
 * métier de chaque type de cible.
 */
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { garagesPublics } from "../schema.js";
import { partsShops } from "../modules/pieces.js";
import { deliveryProfiles } from "../modules/livraison.js";
import { breakdownProviders } from "../modules/depannage.js";

export async function ownerOfTarget(
  targetType: string,
  targetId: number,
): Promise<number | null> {
  switch (targetType) {
    case "user":
    case "employe":
      return targetId;
    case "garage": {
      const [row] = await db
        .select({ ownerId: garagesPublics.ownerId })
        .from(garagesPublics)
        .where(eq(garagesPublics.id, targetId))
        .limit(1);
      return row?.ownerId ?? null;
    }
    case "boutique_pieces":
    case "boutique": {
      const [row] = await db
        .select({ ownerId: partsShops.ownerId })
        .from(partsShops)
        .where(eq(partsShops.id, targetId))
        .limit(1);
      return row?.ownerId ?? null;
    }
    case "transporteur": {
      const [row] = await db
        .select({ userId: deliveryProfiles.userId })
        .from(deliveryProfiles)
        .where(eq(deliveryProfiles.id, targetId))
        .limit(1);
      return row?.userId ?? null;
    }
    case "depanneur": {
      const [row] = await db
        .select({ userId: breakdownProviders.userId })
        .from(breakdownProviders)
        .where(eq(breakdownProviders.id, targetId))
        .limit(1);
      return row?.userId ?? null;
    }
    default:
      // Type de cible sans propriétaire identifiable (plateforme, annonce,
      // véhicule…) : personne n'hérite du droit de réponse professionnel.
      return null;
  }
}

export async function isTargetOwner(
  userId: number,
  targetType: string,
  targetId: number,
): Promise<boolean> {
  const owner = await ownerOfTarget(targetType, targetId);
  return owner !== null && owner === userId;
}
