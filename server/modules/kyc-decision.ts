/** Décision humaine du moteur KYC existant. La transaction sérialise les décisions concurrentes. */
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { kycProfiles, kycDocuments, auditLogs } from "../schema.js";

export async function deciderKyc(actorId: number, input: { profileId: number; action: "valide" | "refuse"; reason?: string }) {
  const reason = input.reason?.trim();
  if (input.action === "refuse" && !reason) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Un motif de refus est obligatoire." });
  }
  return db.transaction(async (tx) => {
    const [profile] = await tx.select().from(kycProfiles).where(eq(kycProfiles.id, input.profileId)).for("update");
    if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "Dossier introuvable." });
    if (profile.status === input.action && (input.action !== "refuse" || profile.rejectionReason === reason)) return { ok: true };
    if (profile.status !== "en_validation") {
      throw new TRPCError({ code: "CONFLICT", message: "Ce dossier n'est plus en attente de validation. Rechargez la liste." });
    }
    if (input.action === "valide") {
      const pieces = await tx.select().from(kycDocuments).where(eq(kycDocuments.profileId, profile.id));
      if (!pieces.length || pieces.some((p) => !p.fileUrl.trim() || (p.expiresAt && p.expiresAt <= new Date()))) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Des pièces sont absentes ou expirées. Le dossier ne peut pas être validé." });
      }
    }
    await tx.update(kycProfiles).set({ status: input.action, validatedAt: new Date(), validatedBy: actorId,
      rejectionReason: input.action === "refuse" ? reason : null, updatedAt: new Date() }).where(eq(kycProfiles.id, profile.id));
    await tx.insert(auditLogs).values({ actorId, action: `kyc.${input.action}`, entityType: "kyc_profile", entityId: profile.id });
    return { ok: true };
  });
}
