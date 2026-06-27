import { z } from "zod";
import { desc, eq, and, lt, sql } from "drizzle-orm";
import { router, protectedProcedure, proProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { logAction } from "../audit.js";
import {
  proProfiles,
  proDocuments,
  vtcSocietes,
  vtcChauffeurs,
  vtcVehicules,
  vtcDemandes,
  locationFlotte,
  locationContrats,
  locationCalendrier,
  gpsDevices,
  venteProVehicules,
  proDashboardStats,
  livraisonPiecesRules,
  livraisonPiecesInterdites,
  users,
  annonces,
  serviceTracking,
} from "../schema.js";

const ACTIVITIES = [
  "vente_pro", "location_pro", "vtc_taxi", "garage_plus", "pieces_auto",
  "livraison", "depannage", "carte_grise", "cabinet_comptable", "boutique_stock",
] as const;

export const proRouter = router({
  // ─── PROFIL PRO ─────────────────────────────────────────

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const [p] = await db.select().from(proProfiles).where(eq(proProfiles.userId, ctx.user.uid)).limit(1);
    return p ?? null;
  }),

  createProfile: protectedProcedure
    .input(z.object({
      activity: z.enum(ACTIVITIES),
      companyName: z.string().optional(),
      siret: z.string().optional(),
      addressLine: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [p] = await db.insert(proProfiles).values({
        userId: ctx.user.uid,
        activity: input.activity,
        companyName: input.companyName,
        siret: input.siret,
        addressLine: input.addressLine,
        city: input.city,
        postalCode: input.postalCode,
        country: input.country ?? "FR",
        phone: input.phone,
        email: input.email,
      }).returning();
      // Set user to pro
      await db.update(users).set({ accountType: "professionnel" }).where(eq(users.id, ctx.user.uid));
      return p;
    }),

  // ─── DOCUMENTS PRO ─────────────────────────────────────

  listDocuments: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(proDocuments).where(eq(proDocuments.userId, ctx.user.uid)).orderBy(desc(proDocuments.createdAt));
  }),

  uploadDocument: protectedProcedure
    .input(z.object({
      type: z.string(),
      label: z.string().optional(),
      fileUrl: z.string(),
      fileName: z.string().optional(),
      mimeType: z.string().optional(),
      fileSize: z.number().optional(),
      expiresAt: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.insert(proDocuments).values({
        userId: ctx.user.uid,
        type: input.type,
        label: input.label,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
        status: "envoye",
      }).returning();
      return d;
    }),

  verifyDocument: adminProcedure
    .input(z.object({
      docId: z.number(),
      status: z.enum(["valide", "refuse", "suspect", "a_remplacer"]),
      motif: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.update(proDocuments).set({
        status: input.status,
        refusMotif: input.motif ?? null,
        verifiedBy: ctx.user.uid,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(proDocuments.id, input.docId));
      await logAction(ctx.user.uid, "doc.verify", "pro_document", input.docId, { status: input.status });
      return { ok: true };
    }),

  // Alertes documents expirés/bientôt expirés
  documentAlerts: adminProcedure.query(async () => {
    const now = new Date();
    const j30 = new Date(now.getTime() + 30 * 86400000);
    return db.select({
      id: proDocuments.id,
      userId: proDocuments.userId,
      type: proDocuments.type,
      label: proDocuments.label,
      status: proDocuments.status,
      expiresAt: proDocuments.expiresAt,
    }).from(proDocuments)
      .where(and(
        lt(proDocuments.expiresAt, j30),
        sql`${proDocuments.status} NOT IN ('refuse', 'suspect')`,
      ))
      .orderBy(proDocuments.expiresAt);
  }),

  // ─── VTC / TAXI ─────────────────────────────────────────

  vtcGetSociete: protectedProcedure.query(async ({ ctx }) => {
    const [s] = await db.select().from(vtcSocietes).where(eq(vtcSocietes.userId, ctx.user.uid)).limit(1);
    return s ?? null;
  }),

  vtcCreateSociete: protectedProcedure
    .input(z.object({
      nom: z.string(),
      siret: z.string().optional(),
      adresse: z.string().optional(),
      ville: z.string().optional(),
      codePostal: z.string().optional(),
      telephone: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [s] = await db.insert(vtcSocietes).values({
        userId: ctx.user.uid,
        nom: input.nom,
        siret: input.siret,
        adresse: input.adresse,
        ville: input.ville,
        codePostal: input.codePostal,
        telephone: input.telephone,
        email: input.email,
      }).returning();
      return s;
    }),

  vtcListChauffeurs: protectedProcedure.query(async ({ ctx }) => {
    const [soc] = await db.select().from(vtcSocietes).where(eq(vtcSocietes.userId, ctx.user.uid)).limit(1);
    if (!soc) return [];
    return db.select().from(vtcChauffeurs).where(eq(vtcChauffeurs.societeId, soc.id)).orderBy(desc(vtcChauffeurs.createdAt));
  }),

  vtcAddChauffeur: protectedProcedure
    .input(z.object({
      nom: z.string(),
      prenom: z.string(),
      telephone: z.string().optional(),
      email: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [soc] = await db.select().from(vtcSocietes).where(eq(vtcSocietes.userId, ctx.user.uid)).limit(1);
      if (!soc) throw new Error("Créez d'abord votre société VTC");
      const [c] = await db.insert(vtcChauffeurs).values({
        societeId: soc.id,
        nom: input.nom,
        prenom: input.prenom,
        telephone: input.telephone,
        email: input.email,
        status: "en_validation",
      }).returning();
      return c;
    }),

  vtcUpdateChauffeurStatus: protectedProcedure
    .input(z.object({
      chauffeurId: z.number(),
      status: z.enum(["actif", "inactif", "bloque", "suspendu"]),
      motif: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.update(vtcChauffeurs).set({
        status: input.status,
        bloqueMotif: input.motif ?? null,
        updatedAt: new Date(),
      }).where(eq(vtcChauffeurs.id, input.chauffeurId));
      return { ok: true };
    }),

  vtcListVehicules: protectedProcedure.query(async ({ ctx }) => {
    const [soc] = await db.select().from(vtcSocietes).where(eq(vtcSocietes.userId, ctx.user.uid)).limit(1);
    if (!soc) return [];
    return db.select().from(vtcVehicules).where(eq(vtcVehicules.societeId, soc.id)).orderBy(desc(vtcVehicules.createdAt));
  }),

  vtcAddVehicule: protectedProcedure
    .input(z.object({
      marque: z.string(),
      modele: z.string(),
      annee: z.number().optional(),
      immatriculation: z.string().optional(),
      vin: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [soc] = await db.select().from(vtcSocietes).where(eq(vtcSocietes.userId, ctx.user.uid)).limit(1);
      if (!soc) throw new Error("Créez d'abord votre société VTC");
      const [v] = await db.insert(vtcVehicules).values({
        societeId: soc.id,
        marque: input.marque,
        modele: input.modele,
        annee: input.annee,
        immatriculation: input.immatriculation,
        vin: input.vin,
      }).returning();
      return v;
    }),

  vtcAssignChauffeur: protectedProcedure
    .input(z.object({ vehiculeId: z.number(), chauffeurId: z.number().nullable() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(vtcVehicules).set({
        chauffeurId: input.chauffeurId,
        updatedAt: new Date(),
      }).where(eq(vtcVehicules.id, input.vehiculeId));
      return { ok: true };
    }),

  // ─── LOCATION PRO ──────────────────────────────────────

  locationListFlotte: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(locationFlotte).where(eq(locationFlotte.userId, ctx.user.uid)).orderBy(desc(locationFlotte.createdAt));
  }),

  locationAddVehicule: protectedProcedure
    .input(z.object({
      marque: z.string(),
      modele: z.string(),
      version: z.string().optional(),
      annee: z.number().optional(),
      immatriculation: z.string().optional(),
      prixJour: z.string().optional(),
      prixSemaine: z.string().optional(),
      prixMois: z.string().optional(),
      caution: z.string().optional(),
      kmInclus: z.number().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [v] = await db.insert(locationFlotte).values({
        userId: ctx.user.uid,
        marque: input.marque,
        modele: input.modele,
        version: input.version,
        annee: input.annee,
        immatriculation: input.immatriculation,
        prixJour: input.prixJour,
        prixSemaine: input.prixSemaine,
        prixMois: input.prixMois,
        caution: input.caution,
        kmInclus: input.kmInclus,
        description: input.description,
      }).returning();
      return v;
    }),

  locationUpdateStatus: protectedProcedure
    .input(z.object({
      vehiculeId: z.number(),
      status: z.enum(["disponible", "reserve", "loue", "en_entretien", "bloque", "indisponible"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.update(locationFlotte).set({
        status: input.status,
        updatedAt: new Date(),
      }).where(and(eq(locationFlotte.id, input.vehiculeId), eq(locationFlotte.userId, ctx.user.uid)));
      return { ok: true };
    }),

  locationListContrats: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(locationContrats).where(eq(locationContrats.loueurId, ctx.user.uid)).orderBy(desc(locationContrats.createdAt));
  }),

  locationCreateContrat: protectedProcedure
    .input(z.object({
      vehiculeId: z.number(),
      clientId: z.number(),
      dateDebut: z.string(),
      dateFin: z.string(),
      prixTotal: z.string().optional(),
      cautionMontant: z.string().optional(),
      kmDepart: z.number().optional(),
      etatDepartNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [c] = await db.insert(locationContrats).values({
        vehiculeId: input.vehiculeId,
        loueurId: ctx.user.uid,
        clientId: input.clientId,
        dateDebut: new Date(input.dateDebut),
        dateFin: new Date(input.dateFin),
        prixTotal: input.prixTotal,
        cautionMontant: input.cautionMontant,
        kmDepart: input.kmDepart,
        etatDepartNotes: input.etatDepartNotes,
        status: "en_cours",
      }).returning();
      // Block the calendar
      await db.insert(locationCalendrier).values({
        vehiculeId: input.vehiculeId,
        dateDebut: new Date(input.dateDebut),
        dateFin: new Date(input.dateFin),
        type: "reservation",
        contratId: c.id,
      });
      // Update vehicle status
      await db.update(locationFlotte).set({ status: "loue", updatedAt: new Date() }).where(eq(locationFlotte.id, input.vehiculeId));
      return c;
    }),

  locationGetCalendrier: protectedProcedure
    .input(z.object({ vehiculeId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(locationCalendrier).where(eq(locationCalendrier.vehiculeId, input.vehiculeId)).orderBy(locationCalendrier.dateDebut);
    }),

  // ─── LIVRAISON PIÈCES — vérification compatibilité ────

  checkPieceCompatibility: protectedProcedure
    .input(z.object({
      categoriePiece: z.string(),
      poidsKg: z.number().optional(),
      longueurCm: z.number().optional(),
      largeurCm: z.number().optional(),
      hauteurCm: z.number().optional(),
    }))
    .query(async ({ input }) => {
      // Check if forbidden for moto
      const interdit = await db.select().from(livraisonPiecesInterdites)
        .where(sql`LOWER(${livraisonPiecesInterdites.motCle}) = LOWER(${input.categoriePiece})`);
      if (interdit.length > 0) {
        return { compatible: false, reason: "interdit_moto", motif: interdit[0].motif, suggestion: "utilitaire" };
      }
      // Check weight
      if (input.poidsKg && input.poidsKg > 20) {
        return { compatible: false, reason: "poids_depasse", motif: `Poids ${input.poidsKg} kg > 20 kg max moto`, suggestion: "utilitaire" };
      }
      // Check dimensions
      if ((input.longueurCm && input.longueurCm > 60) || (input.largeurCm && input.largeurCm > 40) || (input.hauteurCm && input.hauteurCm > 40)) {
        return { compatible: false, reason: "trop_volumineux", motif: "Dimensions dépassent 60x40x40 cm", suggestion: "fourgon" };
      }
      return { compatible: true, reason: "compatible_moto", motif: null, suggestion: "moto" };
    }),

  // Pièces interdites moto (admin seed)
  listPiecesInterdites: adminProcedure.query(async () => {
    return db.select().from(livraisonPiecesInterdites).orderBy(livraisonPiecesInterdites.motCle);
  }),

  // ─── DASHBOARD PRO ─────────────────────────────────────

  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const [profile] = await db.select().from(proProfiles).where(eq(proProfiles.userId, ctx.user.uid)).limit(1);
    if (!profile) return null;

    // Count annonces
    const [annonceStats] = await db.select({
      total: sql<number>`COUNT(*)::int`,
      publiees: sql<number>`COUNT(*) FILTER (WHERE status = 'publiee')::int`,
      vendues: sql<number>`COUNT(*) FILTER (WHERE status = 'vendue')::int`,
    }).from(annonces).where(eq(annonces.ownerId, ctx.user.uid));

    // Count documents
    const [docStats] = await db.select({
      total: sql<number>`COUNT(*)::int`,
      valides: sql<number>`COUNT(*) FILTER (WHERE status = 'valide')::int`,
      enAttente: sql<number>`COUNT(*) FILTER (WHERE status = 'envoye' OR status = 'en_analyse')::int`,
      expires: sql<number>`COUNT(*) FILTER (WHERE status = 'expire')::int`,
    }).from(proDocuments).where(eq(proDocuments.userId, ctx.user.uid));

    // Activity-specific data
    let activityData: Record<string, unknown> = {};

    if (profile.activity === "vtc_taxi") {
      const [soc] = await db.select().from(vtcSocietes).where(eq(vtcSocietes.userId, ctx.user.uid)).limit(1);
      if (soc) {
        const [chauffeurStats] = await db.select({
          total: sql<number>`COUNT(*)::int`,
          actifs: sql<number>`COUNT(*) FILTER (WHERE status = 'actif')::int`,
        }).from(vtcChauffeurs).where(eq(vtcChauffeurs.societeId, soc.id));
        const [vehiculeStats] = await db.select({
          total: sql<number>`COUNT(*)::int`,
          disponibles: sql<number>`COUNT(*) FILTER (WHERE status = 'disponible')::int`,
        }).from(vtcVehicules).where(eq(vtcVehicules.societeId, soc.id));
        activityData = { chauffeurs: chauffeurStats, vehicules: vehiculeStats };
      }
    }

    if (profile.activity === "location_pro") {
      const [flotteStats] = await db.select({
        total: sql<number>`COUNT(*)::int`,
        disponibles: sql<number>`COUNT(*) FILTER (WHERE status = 'disponible')::int`,
        loues: sql<number>`COUNT(*) FILTER (WHERE status = 'loue')::int`,
      }).from(locationFlotte).where(eq(locationFlotte.userId, ctx.user.uid));
      const [contratStats] = await db.select({
        total: sql<number>`COUNT(*)::int`,
        enCours: sql<number>`COUNT(*) FILTER (WHERE status = 'en_cours')::int`,
      }).from(locationContrats).where(eq(locationContrats.loueurId, ctx.user.uid));
      activityData = { flotte: flotteStats, contrats: contratStats };
    }

    return {
      profile,
      annonces: annonceStats,
      documents: docStats,
      ...activityData,
    };
  }),
});
