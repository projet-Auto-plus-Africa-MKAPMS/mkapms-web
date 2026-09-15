/**
 * Ledger — helpers partagés par porteur (LOT 5 §29, complété LOT 7).
 *
 * `server/modules/wallet.ts` ne porte que le schéma. Le Payout Engine (LOT 5)
 * avait sa propre copie locale de ces deux fonctions ; elles vivent
 * maintenant ici, au niveau du Ledger lui-même, pour que le Payout Engine ET
 * les futurs écrans Direction/Comptabilité (LOT 7) les consomment sans
 * dupliquer la logique de recherche/création de wallet.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { wallets } from "./wallet.js";

export type LedgerOwnerType = "supplier" | "carrier";

export interface LedgerOwnerRef {
  ownerType: LedgerOwnerType;
  supplierProfileId?: number | null;
  carrierCode?: string | null;
}

/** Trouve ou crée le wallet d'un fournisseur/transporteur. Jamais deux wallets pour le même porteur. */
export async function findOrCreateWallet(owner: LedgerOwnerRef, currency = "EUR") {
  const conditions =
    owner.ownerType === "supplier"
      ? and(eq(wallets.ownerType, "supplier"), eq(wallets.supplierProfileId, owner.supplierProfileId!))
      : and(eq(wallets.ownerType, "carrier"), eq(wallets.carrierCode, owner.carrierCode!));
  const [existing] = await db.select().from(wallets).where(conditions).limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(wallets)
    .values({
      ownerType: owner.ownerType,
      supplierProfileId: owner.ownerType === "supplier" ? owner.supplierProfileId : null,
      carrierCode: owner.ownerType === "carrier" ? owner.carrierCode : null,
      currency,
    })
    .returning();
  return created;
}

/** Wallet plateforme unique (solde MKA.P-MS, §29) — créé au premier besoin. */
export async function findOrCreatePlatformWallet(currency = "EUR") {
  const [existing] = await db.select().from(wallets).where(eq(wallets.ownerType, "platform")).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(wallets).values({ ownerType: "platform", currency }).returning();
  return created;
}

/** Recherche seule (sans création) — pour un écran qui ne doit jamais faire apparaître un wallet vide par accident. */
export async function findWallet(owner: LedgerOwnerRef) {
  const conditions =
    owner.ownerType === "supplier"
      ? and(eq(wallets.ownerType, "supplier"), eq(wallets.supplierProfileId, owner.supplierProfileId!))
      : and(eq(wallets.ownerType, "carrier"), eq(wallets.carrierCode, owner.carrierCode!));
  const [row] = await db.select().from(wallets).where(conditions).limit(1);
  return row ?? null;
}
