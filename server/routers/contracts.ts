import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { generatedDocuments, documentSignatures } from "../schema.js";

// Contrats intelligents (Plan Partie 1 §12) — génération + signature + archivage.
const contractTypes = [
  "vente_vehicule", "reservation", "location", "vtc_taxi", "depannage", "livraison",
  "paiement_fractionne", "import_export", "depot_vente", "partenariat_fournisseur",
] as const;

export const contractsRouter = router({
  mine: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(generatedDocuments).where(eq(generatedDocuments.userId, ctx.user.uid)).orderBy(desc(generatedDocuments.createdAt));
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const [d] = await db.select().from(generatedDocuments).where(eq(generatedDocuments.id, input.id)).limit(1);
    if (!d) return null;
    const signatures = await db.select().from(documentSignatures).where(eq(documentSignatures.documentId, d.id));
    return { ...d, signatures };
  }),

  generate: protectedProcedure
    .input(
      z.object({
        type: z.enum(contractTypes),
        titre: z.string().optional(),
        refType: z.string().optional(),
        refId: z.number().optional(),
        contenu: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.insert(generatedDocuments).values({
        type: input.type,
        titre: input.titre ?? `Contrat ${input.type}`,
        refType: input.refType,
        refId: input.refId,
        contenu: input.contenu,
        userId: ctx.user.uid,
        status: "genere",
      }).returning();
      return d;
    }),

  sign: protectedProcedure
    .input(z.object({ documentId: z.number(), signatureData: z.string().optional(), signerName: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const [s] = await db.insert(documentSignatures).values({
        documentId: input.documentId,
        signerId: ctx.user.uid,
        signerName: input.signerName,
        signerEmail: ctx.user.email,
        signatureData: input.signatureData,
        signed: true,
        signedAt: new Date(),
      }).returning();
      await db.update(generatedDocuments).set({ status: "signe", updatedAt: new Date() }).where(eq(generatedDocuments.id, input.documentId));
      return s;
    }),

  all: adminProcedure.query(async () => {
    return db.select().from(generatedDocuments).orderBy(desc(generatedDocuments.createdAt)).limit(200);
  }),
});
