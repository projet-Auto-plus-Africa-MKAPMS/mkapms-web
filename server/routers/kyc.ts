// Soumission des documents par profil (parcours d'inscription pro → validation).
// Le client soumet ses pièces ; l'Employé/Direction valide (cf. admin.validateKyc).
//
// Règle : c'est le serveur qui décide si un dossier est recevable. Un dossier
// dont une pièce obligatoire manque est refusé — l'écran ne peut pas passer
// outre en n'envoyant rien (« ça valide et ça part directement »).
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { kycProfiles, kycDocuments } from "../schema.js";
import { PROFILES, documentsObligatoires, type ProfileType } from "@shared/profiles.js";

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

const PROFILE_TYPES = Object.keys(PROFILES) as [ProfileType, ...ProfileType[]];

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
        // Profil visé : détermine les pièces exigées (shared/profiles).
        profileType: z.enum(PROFILE_TYPES).optional(),
        documents: z
          .array(
            z.object({
              docType: z.enum(DOC_TYPES),
              fileUrl: z.string().min(1),
              // Libellé de la pièce demandée : plusieurs pièces partagent le
              // type « autre » (assurance, bail…) et doivent rester distinctes.
              fileName: z.string().max(255).optional(),
              mimeType: z.string().max(64).optional(),
              sizeBytes: z.number().int().min(0).optional(),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Contrôle de recevabilité côté serveur, avant toute écriture.
      if (input.profileType) {
        const attendu = PROFILES[input.profileType];
        const fournies = new Set(
          input.documents.map((d) => `${d.docType}|${d.fileName ?? ""}`),
        );
        const fourniesParType = new Set(input.documents.map((d) => d.docType));
        const manquantes = documentsObligatoires(attendu).filter(
          (d) =>
            !fournies.has(`${d.docType}|${d.label}`) &&
            // Repli : une pièce d'un type unique reste reconnue même si
            // l'écran n'a pas renvoyé le libellé exact.
            !(
              attendu.documents.filter((x) => x.docType === d.docType).length === 1 &&
              fourniesParType.has(d.docType)
            ),
        );
        if (manquantes.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Dossier incomplet — pièces manquantes : ${manquantes
              .map((d) => d.label)
              .join(", ")}.`,
          });
        }
      }

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

      // Remplace la pièce de même type ET de même libellé, puis insère la
      // nouvelle. Supprimer par type seul effaçait les autres pièces « autre »
      // du même envoi (assurance, bail, INSEE…).
      const existants = await db
        .select({
          id: kycDocuments.id,
          docType: kycDocuments.docType,
          fileName: kycDocuments.fileName,
        })
        .from(kycDocuments)
        .where(eq(kycDocuments.profileId, profile.id));

      for (const doc of input.documents) {
        const doublons = existants.filter(
          (e) => e.docType === doc.docType && (e.fileName ?? "") === (doc.fileName ?? ""),
        );
        for (const d of doublons) {
          await db.delete(kycDocuments).where(eq(kycDocuments.id, d.id));
        }
        await db.insert(kycDocuments).values({
          profileId: profile.id,
          docType: doc.docType,
          fileUrl: doc.fileUrl,
          fileName: doc.fileName ?? null,
          mimeType: doc.mimeType ?? null,
          sizeBytes: doc.sizeBytes ?? null,
        });
      }

      const total = await db
        .select({ id: kycDocuments.id })
        .from(kycDocuments)
        .where(eq(kycDocuments.profileId, profile.id));

      return {
        status: "en_validation" as const,
        profileId: profile.id,
        documentsEnregistres: total.length,
      };
    }),
});
