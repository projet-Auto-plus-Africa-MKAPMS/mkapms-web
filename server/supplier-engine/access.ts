/**
 * LOT 7 (suite) — RBAC Fournisseur/Transporteur.
 *
 * Architecture et permissions uniquement : ce fichier ne crée aucun compte
 * réel. `grantSupplierAccess`/`grantCarrierAccess` ne servent que lorsqu'un
 * PDG décide explicitement d'accorder un accès à un compte de connexion
 * déjà existant — jamais un onboarding automatique.
 *
 * Isolation stricte par construction : `resolveAccess` est la SEULE façon
 * de savoir à quelle fiche un compte est lié, et elle ne lit jamais un
 * identifiant fourni par l'appelant — seulement son propre `userId` de
 * session. Un fournisseur ne peut donc jamais, même par erreur côté
 * client, interroger la fiche d'un autre fournisseur.
 */
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { users } from "../schema.js";
import { supplierCarrierAccounts, supplierProfiles } from "./schema.js";
import { partners } from "../modules/operations.js";

export type AccountType = "supplier" | "carrier";
export type AccessStatus = "ready_for_onboarding" | "active" | "suspended" | "revoked";

export interface SupplierCarrierAccess {
  id: number;
  userId: number;
  accountType: AccountType;
  supplierProfileId: number | null;
  partnerId: number | null;
  status: AccessStatus;
  grantedBy: number;
}

/** Lecture stricte : la propre ligne de l'appelant, jamais une autre. */
export async function resolveAccess(userId: number): Promise<SupplierCarrierAccess | null> {
  const [row] = await db.select().from(supplierCarrierAccounts).where(eq(supplierCarrierAccounts.userId, userId)).limit(1);
  return (row as SupplierCarrierAccess | undefined) ?? null;
}

async function existingActiveLink(userId: number) {
  const [row] = await db.select().from(supplierCarrierAccounts).where(eq(supplierCarrierAccounts.userId, userId)).limit(1);
  return row ?? null;
}

/**
 * Accorde un accès Fournisseur. Le compte (`userId`) doit déjà exister ;
 * son rôle passe à "supplier" et il est lié à EXACTEMENT une fiche
 * `supplier_profiles` réelle — jamais une fiche inventée.
 */
export async function grantSupplierAccess(input: { userId: number; supplierProfileId: number; grantedBy: number }) {
  const [profil] = await db.select({ id: supplierProfiles.id }).from(supplierProfiles).where(eq(supplierProfiles.id, input.supplierProfileId)).limit(1);
  if (!profil) throw new Error(`Fiche fournisseur #${input.supplierProfileId} introuvable : aucun accès accordé à une fiche qui n'existe pas.`);

  const existant = await existingActiveLink(input.userId);
  if (existant) throw new Error(`Ce compte est déjà lié (type ${existant.accountType}, statut ${existant.status}) : révoquer d'abord l'accès existant.`);

  const [row] = await db
    .insert(supplierCarrierAccounts)
    .values({ userId: input.userId, accountType: "supplier", supplierProfileId: input.supplierProfileId, status: "ready_for_onboarding", grantedBy: input.grantedBy })
    .returning();
  await db.update(users).set({ role: "supplier", updatedAt: new Date() }).where(eq(users.id, input.userId));
  return row;
}

/**
 * Accorde un accès Transporteur. La fiche `partners` référencée doit être
 * réellement de type "transporteur" — jamais un autre type de partenaire.
 */
export async function grantCarrierAccess(input: { userId: number; partnerId: number; grantedBy: number }) {
  const [partenaire] = await db.select({ id: partners.id, type: partners.type }).from(partners).where(eq(partners.id, input.partnerId)).limit(1);
  if (!partenaire) throw new Error(`Partenaire #${input.partnerId} introuvable : aucun accès accordé à une fiche qui n'existe pas.`);
  if (partenaire.type !== "transporteur") {
    throw new Error(`Le partenaire #${input.partnerId} est de type "${partenaire.type}", pas "transporteur" : accès transporteur refusé.`);
  }

  const existant = await existingActiveLink(input.userId);
  if (existant) throw new Error(`Ce compte est déjà lié (type ${existant.accountType}, statut ${existant.status}) : révoquer d'abord l'accès existant.`);

  const [row] = await db
    .insert(supplierCarrierAccounts)
    .values({ userId: input.userId, accountType: "carrier", partnerId: input.partnerId, status: "ready_for_onboarding", grantedBy: input.grantedBy })
    .returning();
  await db.update(users).set({ role: "carrier", updatedAt: new Date() }).where(eq(users.id, input.userId));
  return row;
}

/** Fait réellement passer un accès prêt à "actif" — décision humaine distincte de l'octroi. */
export async function activateAccess(userId: number) {
  const [row] = await db.update(supplierCarrierAccounts).set({ status: "active", updatedAt: new Date() }).where(eq(supplierCarrierAccounts.userId, userId)).returning();
  return row ?? null;
}

/** Révoque l'accès et fait retomber le compte au rôle "user" — jamais un compte fournisseur/transporteur orphelin. */
export async function revokeAccess(userId: number, revokedBy: number) {
  const [row] = await db
    .update(supplierCarrierAccounts)
    .set({ status: "revoked", revokedBy, revokedAt: new Date(), updatedAt: new Date() })
    .where(eq(supplierCarrierAccounts.userId, userId))
    .returning();
  if (row) {
    await db.update(users).set({ role: "user", updatedAt: new Date() }).where(eq(users.id, userId));
  }
  return row ?? null;
}
