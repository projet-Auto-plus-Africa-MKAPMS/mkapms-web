// Soumission des documents par profil (parcours d'inscription pro → validation).
// Le client soumet ses pièces ; l'Employé/Direction valide (cf. admin.validateKyc).
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { kycProfiles, kycDocuments } from "../schema.js";

const DOC_TYPES = [
  "piece_identite",
  "permis_conduire",
  "justificatif_domicile",
  "kbis",
  "rib",
  "carte_grise",
  "controle_technique",
  "autre",
] as const;

export const kycRouter = router({
  // Mon dossier de validation + documents soumis.
  myProfile: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await db
      .select()
      .from(kycProfiles)
      .where(eq(kycProfiles.userId, ctx.user.uid))
      .orderBy(desc(kycProfiles.createdAt))
      .limit(1);
    if (!profile) return { profile: null, documents: [] };
    const documents = await db
      .select()
      .from(kycDocuments)
      .where(eq(kycDocuments.profileId, profile.id));
    return { profile, documents };
  }),

  // Soumet (ou met à jour) les documents puis passe le dossier en validation.
  submitDocuments: protectedProcedure
    .input(
      z.object({
        documents: z
          .array(
            z.object({
              docType: z.enum(DOC_TYPES),
              fileUrl: z.string().min(1),
              fileName: z.string().optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Récupère ou crée le dossier KYC de l'utilisateur.
      let [profile] = await db
        .select()
        .from(kycProfiles)
        .where(eq(kycProfiles.userId, ctx.user.uid))
        .orderBy(desc(kycProfiles.createdAt))
        .limit(1);

      const now = new Date();
      if (!profile) {
        [profile] = await db
          .insert(kycProfiles)
          .values({ userId: ctx.user.uid, status: "en_validation", submittedAt: now })
          .returning();
      } else {
        await db
          .update(kycProfiles)
          .set({ status: "en_validation", submittedAt: now, updatedAt: now })
          .where(eq(kycProfiles.id, profile.id));
      }

      // Remplace les documents du même type, puis insère les nouveaux.
      for (const doc of input.documents) {
        await db
          .delete(kycDocuments)
          .where(
            and(eq(kycDocuments.profileId, profile.id), eq(kycDocuments.docType, doc.docType)),
          );
        await db.insert(kycDocuments).values({
          profileId: profile.id,
          docType: doc.docType,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName ?? null,
        });
      }

      return { status: "en_validation" as const, profileId: profile.id };
    }),
});
