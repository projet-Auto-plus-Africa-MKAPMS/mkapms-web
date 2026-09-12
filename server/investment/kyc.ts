/**
 * MKA.P-MS Investissement — vérification KYC/KYB.
 *
 * Ne construit AUCUN moteur parallèle : kycProfiles/kycDocuments
 * (server/schema.ts) existent déjà, avec soumission de pièces, contrôle
 * d'authenticité (media-authenticity/service.ts) et validation humaine
 * (server/routers/kyc.ts, server/routers/admin.ts::validateKyc). Un
 * investisseur soumet ses pièces via le même trpc.kyc.submitDocuments déjà
 * en production — ce fichier ne fait que lire ce statut réel pour décider si
 * un investissement peut avancer, jamais un second statut à tenir synchrone.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { kycProfiles } from "../schema.js";
import { investorOrganizations, investors } from "./schema.js";

export interface VerificationInvestisseur {
  userId: number;
  statut: "non_demarre" | "en_cours" | "en_validation" | "valide" | "refuse" | "expire";
  motifRefus: string | null;
  organisationVerifiee: boolean | null;
}

async function statutKycPour(userId: number): Promise<{ statut: VerificationInvestisseur["statut"]; motifRefus: string | null }> {
  const [profil] = await db.select().from(kycProfiles).where(eq(kycProfiles.userId, userId)).orderBy(desc(kycProfiles.createdAt)).limit(1);
  if (!profil) return { statut: "non_demarre", motifRefus: null };
  return { statut: profil.status, motifRefus: profil.rejectionReason ?? null };
}

/**
 * Statut réel d'un investisseur (personne) et, si applicable, de la société
 * qu'il représente (KYB = même moteur, appliqué au propriétaire de
 * l'organisation). Aucune valeur inventée : "non_demarre" tant qu'aucun
 * dossier kycProfiles n'existe pour cette identité.
 */
export async function verificationInvestisseur(investorId: number): Promise<VerificationInvestisseur> {
  const [investisseur] = await db.select().from(investors).where(eq(investors.id, investorId)).limit(1);
  if (!investisseur) throw new Error(`Investisseur #${investorId} introuvable.`);

  const { statut, motifRefus } = await statutKycPour(investisseur.userId);

  let organisationVerifiee: boolean | null = null;
  if (investisseur.organizationId) {
    const [org] = await db.select().from(investorOrganizations).where(eq(investorOrganizations.id, investisseur.organizationId)).limit(1);
    if (org) {
      const kyb = await statutKycPour(org.proprietaireUserId);
      organisationVerifiee = kyb.statut === "valide";
    }
  }

  return { userId: investisseur.userId, statut, motifRefus, organisationVerifiee };
}

/**
 * Condition d'éligibilité avant AWAITING_SIGNATURE/AWAITING_PAYMENT : le
 * dossier KYC de l'investisseur doit être "valide", et si une organisation
 * est déclarée, elle aussi. Jamais une activation sans vérification réelle.
 */
export async function investisseurEligible(investorId: number): Promise<{ eligible: boolean; motif: string }> {
  const v = await verificationInvestisseur(investorId);
  if (v.statut !== "valide") {
    return { eligible: false, motif: `Dossier KYC de l'investisseur au statut "${v.statut}" — doit être "valide" avant signature/paiement.` };
  }
  if (v.organisationVerifiee === false) {
    return { eligible: false, motif: "Dossier KYB de la société représentée non validé." };
  }
  return { eligible: true, motif: "KYC (et KYB si applicable) validés." };
}
