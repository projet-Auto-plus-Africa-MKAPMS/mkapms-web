import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import {
  cgDossiers, cgDocuments, cgAgences, cgAgenceMembres, cgAbonnements,
  cgPacks, cgCredits, cgEtapes, cgAuditLog, serviceTracking, comptaEcritures,
} from "../schema.js";
import { notifications } from "../modules/core.js";

const STATUS_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  documents_a_verifier: "Documents à vérifier",
  en_verification: "En vérification",
  documents_valides: "Documents validés",
  document_manquant: "Document manquant",
  document_refuse: "Document refusé",
  renvoye: "Renvoyé",
  envoye_agence: "Envoyé à l'agence",
  en_traitement: "En traitement",
  accepte: "Accepté",
  bloque: "Bloqué",
  termine: "Terminé",
  annule: "Annulé",
  archive: "Archivé",
};

async function logAudit(dossierId: number | null, action: string, detail: string, userId: number, userEmail?: string) {
  await db.insert(cgAuditLog).values({
    dossierId, action: action as any, detail,
    userId, userEmail,
  });
}

let dossierCounter = 0;
function genRef(type: string): string {
  dossierCounter++;
  const prefix = type === "declaration_achat" ? "DA" : type === "declaration_cession" ? "DC" : type === "carte_grise" ? "CG" : type === "changement_titulaire" ? "CT" : type === "vehicule_etranger" ? "VE" : type === "ww_cpi" ? "WW" : type === "w_garage" ? "WG" : "MK";
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${String(dossierCounter).padStart(3, "0")}`;
}

export const carteGriseRouter = router({
  // ── Créer un dossier ──────────────────────────────────────────────────
  createDossier: protectedProcedure
    .input(z.object({
      type: z.enum(["declaration_achat", "declaration_cession", "changement_titulaire", "carte_grise", "vehicule_etranger", "ww_cpi", "w_garage", "duplicata", "correction", "autre"]),
      immatriculation: z.string().optional(),
      vin: z.string().optional(),
      marque: z.string().optional(),
      modele: z.string().optional(),
      annee: z.number().optional(),
      voVehiculeId: z.number().optional(),
      annonceId: z.number().optional(),
      vendeurNom: z.string().optional(),
      acheteurNom: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const ref = genRef(input.type);
      const [d] = await db.insert(cgDossiers).values({
        reference: ref,
        type: input.type,
        status: "documents_a_verifier",
        clientId: ctx.user.uid,
        immatriculation: input.immatriculation,
        vin: input.vin,
        marque: input.marque,
        modele: input.modele,
        annee: input.annee,
        voVehiculeId: input.voVehiculeId,
        annonceId: input.annonceId,
        vendeurNom: input.vendeurNom,
        acheteurNom: input.acheteurNom,
        notes: input.notes,
        createdBy: ctx.user.uid,
      }).returning();
      await db.insert(cgEtapes).values({
        dossierId: d.id, status: "documents_a_verifier",
        statusLabel: "Dossier créé — Documents à fournir",
        createdBy: ctx.user.uid,
      });
      await db.insert(serviceTracking).values({
        userId: ctx.user.uid, serviceType: "carte_grise", serviceId: d.id,
        reference: ref, titre: `Carte Grise — ${ref}`,
        status: "documents_a_verifier", statusLabel: "Documents à fournir",
      });
      await logAudit(d.id, "creation_dossier", `Dossier ${ref} créé (${input.type})`, ctx.user.uid, ctx.user.email ?? undefined);
      return d;
    }),

  // ── Lister les dossiers (client ou agence) ────────────────────────────
  mesDossiers: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(cgDossiers)
      .where(eq(cgDossiers.clientId, ctx.user.uid))
      .orderBy(desc(cgDossiers.dateCreation));
  }),

  dossiersPourAgence: protectedProcedure
    .input(z.object({ agenceId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(cgDossiers)
        .where(eq(cgDossiers.agenceId, input.agenceId))
        .orderBy(desc(cgDossiers.dateCreation));
    }),

  allDossiers: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      type: z.string().optional(),
      limit: z.number().min(1).max(500).default(100),
    }).default({}))
    .query(async ({ input }) => {
      const conds = [];
      if (input.status) conds.push(eq(cgDossiers.status, input.status as any));
      if (input.type) conds.push(eq(cgDossiers.type, input.type as any));
      return db.select().from(cgDossiers)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(cgDossiers.dateCreation))
        .limit(input.limit);
    }),

  // ── Détail dossier ────────────────────────────────────────────────────
  detail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [d] = await db.select().from(cgDossiers).where(eq(cgDossiers.id, input.id)).limit(1);
      if (!d) throw new Error("Dossier introuvable");
      const docs = await db.select().from(cgDocuments).where(eq(cgDocuments.dossierId, input.id)).orderBy(desc(cgDocuments.createdAt));
      const etapes = await db.select().from(cgEtapes).where(eq(cgEtapes.dossierId, input.id)).orderBy(cgEtapes.createdAt);
      const audit = await db.select().from(cgAuditLog).where(eq(cgAuditLog.dossierId, input.id)).orderBy(desc(cgAuditLog.createdAt));
      return { dossier: d, documents: docs, etapes, audit };
    }),

  // ── Ajouter un document ────────────────────────────────────────────────
  addDocument: protectedProcedure
    .input(z.object({
      dossierId: z.number(),
      type: z.string().min(1),
      nom: z.string().min(1),
      url: z.string().min(1),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [doc] = await db.insert(cgDocuments).values({
        ...input, status: "recu", uploadedBy: ctx.user.uid,
      }).returning();
      await logAudit(input.dossierId, "ajout_document", `Document ajouté : ${input.type} (${input.nom})`, ctx.user.uid, ctx.user.email ?? undefined);
      return doc;
    }),

  // ── Valider / Refuser un document ──────────────────────────────────────
  verifyDocument: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      dossierId: z.number(),
      action: z.enum(["valide", "refuse"]),
      motifRefus: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.update(cgDocuments).set({
        status: input.action,
        motifRefus: input.action === "refuse" ? input.motifRefus : null,
        verifieePar: ctx.user.uid,
        dateVerification: new Date(),
      }).where(eq(cgDocuments.id, input.documentId));
      const actionLabel = input.action === "valide" ? "validation_document" : "refus_document";
      const detail = input.action === "valide" ? "Document validé" : `Document refusé : ${input.motifRefus ?? ""}`;
      await logAudit(input.dossierId, actionLabel, detail, ctx.user.uid, ctx.user.email ?? undefined);
      // Notify client
      const [dossier] = await db.select().from(cgDossiers).where(eq(cgDossiers.id, input.dossierId)).limit(1);
      if (dossier?.clientId) {
        const title = input.action === "valide" ? `${dossier.reference} — Document validé` : `${dossier.reference} — Document refusé`;
        await db.insert(notifications).values({
          userId: dossier.clientId, type: "carte_grise", title,
          body: detail, url: "/carte-grise",
        });
      }
      // Update dossier status if document refused
      if (input.action === "refuse") {
        await db.update(cgDossiers).set({ status: "document_refuse", updatedAt: new Date() }).where(eq(cgDossiers.id, input.dossierId));
      }
      return { ok: true };
    }),

  // ── Changer le statut d'un dossier ─────────────────────────────────────
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum([
        "brouillon", "documents_a_verifier", "en_verification", "documents_valides",
        "document_manquant", "document_refuse", "renvoye", "envoye_agence",
        "en_traitement", "accepte", "bloque", "termine", "annule", "archive",
      ]),
      commentaire: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [dossier] = await db.select().from(cgDossiers).where(eq(cgDossiers.id, input.id)).limit(1);
      if (!dossier) throw new Error("Dossier introuvable");
      const updates: Record<string, unknown> = { status: input.status, updatedAt: new Date() };
      if (input.status === "termine") updates.dateCloture = new Date();
      await db.update(cgDossiers).set(updates).where(eq(cgDossiers.id, input.id));
      await db.insert(cgEtapes).values({
        dossierId: input.id, status: input.status,
        statusLabel: STATUS_LABELS[input.status] ?? input.status,
        commentaire: input.commentaire,
        createdBy: ctx.user.uid,
      });
      await db.insert(serviceTracking).values({
        userId: dossier.clientId ?? ctx.user.uid,
        serviceType: "carte_grise", serviceId: dossier.id,
        reference: dossier.reference, titre: `Carte Grise — ${dossier.reference}`,
        status: input.status, statusLabel: STATUS_LABELS[input.status] ?? input.status,
        detail: input.commentaire,
      });
      await logAudit(input.id, "changement_statut", `Statut → ${STATUS_LABELS[input.status]} ${input.commentaire ? `(${input.commentaire})` : ""}`, ctx.user.uid, ctx.user.email ?? undefined);
      // Notify
      if (dossier.clientId) {
        await db.insert(notifications).values({
          userId: dossier.clientId, type: "carte_grise",
          title: `${dossier.reference} — ${STATUS_LABELS[input.status]}`,
          body: input.commentaire ?? `Votre dossier est maintenant : ${STATUS_LABELS[input.status]}`,
          url: "/carte-grise",
        });
      }
      return { ok: true };
    }),

  // ── Affecter à une agence ──────────────────────────────────────────────
  affecterAgence: protectedProcedure
    .input(z.object({ dossierId: z.number(), agenceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(cgDossiers).set({ agenceId: input.agenceId, status: "envoye_agence", updatedAt: new Date() }).where(eq(cgDossiers.id, input.dossierId));
      await logAudit(input.dossierId, "affectation_agence", `Dossier affecté à l'agence #${input.agenceId}`, ctx.user.uid, ctx.user.email ?? undefined);
      return { ok: true };
    }),

  // ── AGENCES ────────────────────────────────────────────────────────────
  createAgence: protectedProcedure
    .input(z.object({
      nom: z.string().min(1),
      siret: z.string().optional(),
      adresse: z.string().optional(),
      codePostal: z.string().optional(),
      ville: z.string().optional(),
      telephone: z.string().optional(),
      email: z.string().optional(),
      siteWeb: z.string().optional(),
      kbisUrl: z.string().optional(),
      identiteDirigeantUrl: z.string().optional(),
      justificatifDomicileUrl: z.string().optional(),
      assuranceProUrl: z.string().optional(),
      habilitationSivUrl: z.string().optional(),
      agrementUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const status = input.kbisUrl && input.identiteDirigeantUrl ? "documents_soumis" : "en_attente";
      const [a] = await db.insert(cgAgences).values({
        ...input, responsableId: ctx.user.uid, status: status as any,
      }).returning();
      await db.insert(cgAgenceMembres).values({
        agenceId: a.id, userId: ctx.user.uid, role: "responsable",
      });
      return a;
    }),

  agences: protectedProcedure.query(async () => {
    return db.select().from(cgAgences).orderBy(desc(cgAgences.createdAt));
  }),

  monAgence: protectedProcedure.query(async ({ ctx }) => {
    const membre = await db.select().from(cgAgenceMembres).where(eq(cgAgenceMembres.userId, ctx.user.uid)).limit(1);
    if (!membre.length) return null;
    const [a] = await db.select().from(cgAgences).where(eq(cgAgences.id, membre[0].agenceId)).limit(1);
    return a ?? null;
  }),

  validerAgence: protectedProcedure
    .input(z.object({ agenceId: z.number(), action: z.enum(["validee", "refusee"]) }))
    .mutation(async ({ ctx, input }) => {
      await db.update(cgAgences).set({
        status: input.action as any,
        validePar: ctx.user.uid,
        dateValidation: new Date(),
        updatedAt: new Date(),
      }).where(eq(cgAgences.id, input.agenceId));
      return { ok: true };
    }),

  // ── ABONNEMENTS & PACKS ────────────────────────────────────────────────
  abonnements: protectedProcedure.query(async () => {
    return db.select().from(cgAbonnements).where(eq(cgAbonnements.actif, true)).orderBy(cgAbonnements.prixHT);
  }),

  packs: protectedProcedure.query(async () => {
    return db.select().from(cgPacks).where(eq(cgPacks.actif, true)).orderBy(cgPacks.nbDossiers);
  }),

  // ── STATS ──────────────────────────────────────────────────────────────
  stats: protectedProcedure.query(async () => {
    const all = await db.select().from(cgDossiers);
    const total = all.length;
    const enCours = all.filter((d) => !["termine", "annule", "archive"].includes(d.status)).length;
    const termines = all.filter((d) => d.status === "termine").length;
    const bloques = all.filter((d) => d.status === "bloque").length;
    const docsManquants = all.filter((d) => d.status === "document_manquant").length;
    return { total, enCours, termines, bloques, docsManquants };
  }),

  // ── AUDIT LOG ──────────────────────────────────────────────────────────
  auditLog: protectedProcedure
    .input(z.object({ dossierId: z.number().optional(), limit: z.number().default(100) }).default({}))
    .query(async ({ input }) => {
      const conds = [];
      if (input.dossierId) conds.push(eq(cgAuditLog.dossierId, input.dossierId));
      return db.select().from(cgAuditLog)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(cgAuditLog.createdAt))
        .limit(input.limit);
    }),
});
