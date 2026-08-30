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
import { analyser, type RapportMedia } from "../media-authenticity/service.js";
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

/**
 * Constat d'un justificatif, tel qu'il est rendu à l'écran et écrit dans le
 * dossier. « verifie » ne veut pas dire « authentique » : la machine constate
 * ce qui est constatable (empreinte, métadonnées, réutilisation du même
 * fichier ailleurs, provenance signée, cohérence technique, lecture par
 * MKA.P-MS Intelligences quand le fournisseur vision est configuré) et
 * n'établit jamais qu'un KBIS ou une pièce d'identité est un vrai document
 * administratif. Cette décision reste humaine.
 */
export interface ControleDocument {
  docType: string;
  libelle: string;
  /** Vrai quand un constat exige un examen humain avant validation. */
  aExaminer: boolean;
  niveau: "faible" | "moyen" | "eleve" | "indetermine" | "illisible";
  motif: string;
  /** Détecteurs qui n'ont pas pu s'exécuter — jamais rassurant. */
  nonVerifie: string[];
}

/**
 * Analyse une pièce par le moteur d'authenticité des médias. Le contexte
 * « kyc_document » relie le constat au justificatif enregistré : la direction
 * retrouve le détail, les preuves et les incidents dans le moteur.
 */
async function controler(
  docType: string,
  fileName: string | undefined,
  fileUrl: string,
  mimeType: string | undefined,
  cible: { documentId: number; userId: number },
): Promise<ControleDocument> {
  const libelle = fileName ?? docType;
  let rapport: RapportMedia;
  try {
    rapport = await analyser({
      contenu: fileUrl,
      contexte: "kyc_document",
      contexteId: cible.documentId,
      ownerId: cible.userId,
      mime: mimeType,
      kind: mimeType && mimeType.startsWith("image/") ? "image" : "document",
    });
  } catch (e) {
    // Une pièce illisible n'est pas une pièce acceptée : elle part en examen.
    return {
      docType,
      libelle,
      aExaminer: true,
      niveau: "illisible",
      motif: `Pièce non analysable (${(e as Error).message}) : elle doit être examinée à la main avant toute validation.`,
      nonVerifie: [],
    };
  }

  const nonVerifie = rapport.detecteursIndisponibles.map(
    (d) => `${d.detecteur} — ${d.dependance}`,
  );
  return {
    docType,
    libelle,
    aExaminer: rapport.niveau === "eleve" || rapport.niveau === "indetermine",
    niveau: rapport.niveau,
    motif: rapport.motif,
    nonVerifie,
  };
}

function resumeControles(controles: ControleDocument[]): string {
  const lignes = controles.map(
    (c) =>
      `• ${c.libelle} — ${c.niveau}${c.aExaminer ? " (à examiner)" : ""} : ${c.motif}${
        c.nonVerifie.length ? ` [non vérifié : ${c.nonVerifie.join(" ; ")}]` : ""
      }`,
  );
  return [
    "Contrôle d'authenticité des pièces (constat automatique, décision humaine) :",
    ...lignes,
  ].join("\n");
}

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

      const controles: ControleDocument[] = [];

      for (const doc of input.documents) {
        const doublons = existants.filter(
          (e) => e.docType === doc.docType && (e.fileName ?? "") === (doc.fileName ?? ""),
        );
        for (const d of doublons) {
          await db.delete(kycDocuments).where(eq(kycDocuments.id, d.id));
        }
        const [enregistre] = await db
          .insert(kycDocuments)
          .values({
            profileId: profile.id,
            docType: doc.docType,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName ?? null,
            mimeType: doc.mimeType ?? null,
            sizeBytes: doc.sizeBytes ?? null,
          })
          .returning({ id: kycDocuments.id });

        controles.push(
          await controler(doc.docType, doc.fileName, doc.fileUrl, doc.mimeType, {
            documentId: enregistre.id,
            userId: ctx.user.uid,
          }),
        );
      }

      // Le constat est écrit dans le dossier : la personne qui valide voit ce
      // que la machine a réellement pu vérifier, et ce qu'elle n'a pas pu.
      const aExaminer = controles.filter((c) => c.aExaminer);
      await db
        .update(kycProfiles)
        .set({ notes: resumeControles(controles), updatedAt: new Date() })
        .where(eq(kycProfiles.id, profile.id));

      const total = await db
        .select({ id: kycDocuments.id })
        .from(kycDocuments)
        .where(eq(kycDocuments.profileId, profile.id));

      return {
        status: "en_validation" as const,
        profileId: profile.id,
        documentsEnregistres: total.length,
        controles,
        piecesAExaminer: aExaminer.length,
      };
    }),
});
