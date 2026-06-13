import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import {
  voVehicules, voDocuments, voEtapes, voDiagnostics, voReparations, voLavage,
  serviceTracking, comptaEcritures,
} from "../schema.js";
import { notifications } from "../modules/core.js";

const VO_STATUS_LABELS: Record<string, string> = {
  achat_enregistre: "Achat enregistré",
  en_attente_recuperation: "En attente récupération",
  en_cours_transport: "En cours de transport",
  vehicule_recu: "Véhicule réceptionné",
  diagnostic_en_cours: "Diagnostic en cours",
  diagnostic_termine: "Diagnostic terminé",
  en_attente_pieces: "En attente de pièces",
  en_reparation: "En réparation",
  reparation_terminee: "Réparation terminée",
  controle_final: "Contrôle final",
  preparation_esthetique: "Préparation esthétique",
  pret: "Véhicule prêt",
  en_vente: "En vente",
  en_location: "Disponible location",
  vendu: "Vendu",
  loue: "Loué",
  exporte: "Exporté",
  stock_interne: "Stock interne",
  a_revoir: "À revoir",
  archive: "Archivé",
};

// Protected = Admin/Employé/Super Admin only (trpc protectedProcedure checks auth).
export const voRouter = router({
  // ── Créer un véhicule VO (Étape 1: Achat) ────────────────────────────
  create: protectedProcedure
    .input(z.object({
      immatriculation: z.string().optional(),
      vin: z.string().optional(),
      marque: z.string().min(1),
      modele: z.string().min(1),
      version: z.string().optional(),
      annee: z.number().optional(),
      kilometrage: z.number().optional(),
      carburant: z.string().optional(),
      boiteVitesse: z.string().optional(),
      couleur: z.string().optional(),
      puissance: z.string().optional(),
      prixAchat: z.number().optional(),
      fournisseur: z.string().optional(),
      modeAchat: z.enum(["auto1", "fournisseur", "particulier", "pro", "enchere", "depot_vente", "autre"]).optional(),
      dateAchat: z.string().optional(),
      lieuAchat: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [v] = await db.insert(voVehicules).values({
        ...input,
        prixAchat: input.prixAchat != null ? String(input.prixAchat) : undefined,
        dateAchat: input.dateAchat ? new Date(input.dateAchat) : undefined,
        status: "achat_enregistre",
        createdBy: ctx.user.uid,
      }).returning();
      await db.insert(voEtapes).values({
        vehiculeId: v.id,
        status: "achat_enregistre",
        statusLabel: "Achat enregistré",
        responsable: ctx.user.email ?? undefined,
      });
      await db.insert(serviceTracking).values({
        userId: ctx.user.uid,
        serviceType: "vo_interne",
        serviceId: v.id,
        reference: `VO-${v.id}`,
        titre: `VO ${input.marque} ${input.modele}`,
        status: "achat_enregistre",
        statusLabel: "Achat enregistré",
      });
      // Écriture comptable automatique
      if (input.prixAchat != null) {
        await db.insert(comptaEcritures).values({
          type: "achat_vehicule",
          label: `Achat VO ${input.marque} ${input.modele}`,
          montantHT: String(input.prixAchat),
          montantTTC: String(input.prixAchat),
          sens: "debit",
          statut: "valide",
          voVehiculeId: v.id,
          fournisseur: input.fournisseur,
          createdBy: ctx.user.uid,
        });
      }
      return v;
    }),

  // ── Lister tous les VO ────────────────────────────────────────────────
  list: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      limit: z.number().min(1).max(200).default(50),
    }).default({}))
    .query(async ({ input }) => {
      const conds = [];
      if (input.status) conds.push(eq(voVehicules.status, input.status as any));
      const items = await db.select().from(voVehicules)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(voVehicules.createdAt))
        .limit(input.limit);
      return items;
    }),

  // ── Détail d'un VO ────────────────────────────────────────────────────
  detail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [v] = await db.select().from(voVehicules).where(eq(voVehicules.id, input.id)).limit(1);
      if (!v) throw new Error("Véhicule VO introuvable");
      const docs = await db.select().from(voDocuments).where(eq(voDocuments.vehiculeId, input.id)).orderBy(desc(voDocuments.createdAt));
      const etapes = await db.select().from(voEtapes).where(eq(voEtapes.vehiculeId, input.id)).orderBy(voEtapes.createdAt);
      const diags = await db.select().from(voDiagnostics).where(eq(voDiagnostics.vehiculeId, input.id));
      const reps = await db.select().from(voReparations).where(eq(voReparations.vehiculeId, input.id));
      const lavages = await db.select().from(voLavage).where(eq(voLavage.vehiculeId, input.id));
      return { vehicule: v, documents: docs, etapes, diagnostics: diags, reparations: reps, lavages };
    }),

  // ── Changer le statut (avancer dans le cycle) ─────────────────────────
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum([
        "achat_enregistre", "en_attente_recuperation", "en_cours_transport", "vehicule_recu",
        "diagnostic_en_cours", "diagnostic_termine", "en_attente_pieces", "en_reparation",
        "reparation_terminee", "controle_final", "preparation_esthetique", "pret",
        "en_vente", "en_location", "vendu", "loue", "exporte", "stock_interne", "a_revoir", "archive",
      ]),
      commentaire: z.string().optional(),
      responsable: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [v] = await db.select().from(voVehicules).where(eq(voVehicules.id, input.id)).limit(1);
      if (!v) throw new Error("Véhicule VO introuvable");
      const updates: Record<string, unknown> = { status: input.status, updatedAt: new Date() };
      if (input.status === "vendu") updates.dateVente = new Date();
      await db.update(voVehicules).set(updates).where(eq(voVehicules.id, input.id));
      await db.insert(voEtapes).values({
        vehiculeId: input.id,
        status: input.status,
        statusLabel: VO_STATUS_LABELS[input.status] ?? input.status,
        responsable: input.responsable,
        commentaire: input.commentaire,
        validePar: ctx.user.uid,
        dateValidation: new Date(),
      });
      await db.insert(serviceTracking).values({
        userId: v.createdBy ?? ctx.user.uid,
        serviceType: "vo_interne",
        serviceId: v.id,
        reference: `VO-${v.id}`,
        titre: `VO ${v.marque} ${v.modele}`,
        status: input.status,
        statusLabel: VO_STATUS_LABELS[input.status] ?? input.status,
        detail: input.commentaire,
      });
      // Notifier le créateur
      if (v.createdBy) {
        await db.insert(notifications).values({
          userId: v.createdBy,
          type: "vo",
          title: `VO-${v.id} ${v.marque} ${v.modele} — ${VO_STATUS_LABELS[input.status]}`,
          body: input.commentaire ?? `Le véhicule est maintenant : ${VO_STATUS_LABELS[input.status]}`,
          url: "/admin/vo",
        });
      }
      return { ok: true };
    }),

  // ── Mettre à jour les infos transport ──────────────────────────────────
  updateTransport: protectedProcedure
    .input(z.object({
      id: z.number(),
      coutTransport: z.number().optional(),
      transporteur: z.string().optional(),
      adresseDepart: z.string().optional(),
      adresseArrivee: z.string().optional(),
      dateRecupPrevue: z.string().optional(),
      responsableTransport: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, dateRecupPrevue, coutTransport, ...rest } = input;
      await db.update(voVehicules).set({
        ...rest,
        coutTransport: coutTransport != null ? String(coutTransport) : undefined,
        dateRecupPrevue: dateRecupPrevue ? new Date(dateRecupPrevue) : undefined,
        updatedAt: new Date(),
      }).where(eq(voVehicules.id, id));
      return { ok: true };
    }),

  // ── Réception du véhicule ──────────────────────────────────────────────
  updateReception: protectedProcedure
    .input(z.object({
      id: z.number(),
      kilometrageReception: z.number().optional(),
      niveauCarburant: z.string().optional(),
      etatCarrosserie: z.string().optional(),
      etatInterieur: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      await db.update(voVehicules).set({ ...rest, dateReception: new Date(), updatedAt: new Date() }).where(eq(voVehicules.id, id));
      return { ok: true };
    }),

  // ── Ajouter un document ────────────────────────────────────────────────
  addDocument: protectedProcedure
    .input(z.object({
      vehiculeId: z.number(),
      category: z.enum([
        "facture_achat", "bon_commande", "certificat_cession", "carte_grise",
        "controle_technique", "photo_achat", "preuve_paiement", "facture_transport",
        "bon_enlevement", "bon_livraison", "rapport_diagnostic", "photo_defaut",
        "devis_interne", "facture_piece", "bon_commande_piece",
        "photo_avant_reparation", "photo_apres_reparation", "facture_lavage",
        "photo_avant_lavage", "photo_apres_lavage", "facture_vente", "contrat_vente",
        "piece_identite_acheteur", "contrat_location", "assurance", "etat_lieux", "autre",
      ]),
      etape: z.string().optional(),
      nom: z.string().min(1),
      url: z.string().min(1),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [doc] = await db.insert(voDocuments).values({
        ...input,
        uploadedBy: ctx.user.uid,
      }).returning();
      return doc;
    }),

  // ── Ajouter un diagnostic ─────────────────────────────────────────────
  addDiagnostic: protectedProcedure
    .input(z.object({
      vehiculeId: z.number(),
      categorie: z.string().min(1),
      resultat: z.enum(["ok", "a_reparer", "a_controler", "piece_a_commander"]),
      detail: z.string().optional(),
      codeDefaut: z.string().optional(),
      photoUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.insert(voDiagnostics).values({
        ...input,
        createdBy: ctx.user.uid,
      }).returning();
      return d;
    }),

  // ── Ajouter une réparation ─────────────────────────────────────────────
  addReparation: protectedProcedure
    .input(z.object({
      vehiculeId: z.number(),
      prestation: z.string().min(1),
      mecanicien: z.string().optional(),
      piecesUtilisees: z.string().optional(),
      tempsMainOeuvre: z.number().optional(),
      coutPieces: z.number().optional(),
      coutMainOeuvre: z.number().optional(),
      photoAvant: z.string().optional(),
      photoApres: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const coutTotal = (input.coutPieces ?? 0) + (input.coutMainOeuvre ?? 0);
      const [r] = await db.insert(voReparations).values({
        vehiculeId: input.vehiculeId,
        prestation: input.prestation,
        mecanicien: input.mecanicien,
        piecesUtilisees: input.piecesUtilisees,
        tempsMainOeuvre: input.tempsMainOeuvre != null ? String(input.tempsMainOeuvre) : undefined,
        coutPieces: input.coutPieces != null ? String(input.coutPieces) : undefined,
        coutMainOeuvre: input.coutMainOeuvre != null ? String(input.coutMainOeuvre) : undefined,
        coutTotal: String(coutTotal),
        photoAvant: input.photoAvant,
        photoApres: input.photoApres,
        status: "en_cours",
        createdBy: ctx.user.uid,
      }).returning();
      // Update vehicle costs
      await db.update(voVehicules).set({
        coutReparation: sql`COALESCE(${voVehicules.coutReparation}, '0')::numeric + ${String(coutTotal)}`,
        coutPieces: sql`COALESCE(${voVehicules.coutPieces}, '0')::numeric + ${String(input.coutPieces ?? 0)}`,
        coutMainOeuvre: sql`COALESCE(${voVehicules.coutMainOeuvre}, '0')::numeric + ${String(input.coutMainOeuvre ?? 0)}`,
        updatedAt: new Date(),
      }).where(eq(voVehicules.id, input.vehiculeId));
      // Écriture comptable
      if (coutTotal > 0) {
        await db.insert(comptaEcritures).values({
          type: "reparation",
          label: `Réparation VO-${input.vehiculeId}: ${input.prestation}`,
          montantHT: String(coutTotal),
          montantTTC: String(coutTotal),
          sens: "debit",
          statut: "valide",
          voVehiculeId: input.vehiculeId,
          createdBy: ctx.user.uid,
        });
      }
      return r;
    }),

  // ── Ajouter un lavage ──────────────────────────────────────────────────
  addLavage: protectedProcedure
    .input(z.object({
      vehiculeId: z.number(),
      lavageInterieur: z.boolean().default(false),
      lavageExterieur: z.boolean().default(false),
      detailing: z.boolean().default(false),
      renovationOptique: z.boolean().default(false),
      nettoyageMoteur: z.boolean().default(false),
      cout: z.number().optional(),
      prestataireExterne: z.boolean().default(false),
      photoAvant: z.string().optional(),
      photoApres: z.string().optional(),
      factureUrl: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [l] = await db.insert(voLavage).values({
        ...input,
        cout: input.cout != null ? String(input.cout) : undefined,
        status: "termine",
        createdBy: ctx.user.uid,
      }).returning();
      if (input.cout) {
        await db.update(voVehicules).set({
          coutLavage: sql`COALESCE(${voVehicules.coutLavage}, '0')::numeric + ${String(input.cout)}`,
          updatedAt: new Date(),
        }).where(eq(voVehicules.id, input.vehiculeId));
        await db.insert(comptaEcritures).values({
          type: "lavage",
          label: `Lavage VO-${input.vehiculeId}`,
          montantHT: String(input.cout),
          montantTTC: String(input.cout),
          sens: "debit",
          statut: "valide",
          voVehiculeId: input.vehiculeId,
          createdBy: ctx.user.uid,
        });
      }
      return l;
    }),

  // ── Choisir la destination ─────────────────────────────────────────────
  setDestination: protectedProcedure
    .input(z.object({
      id: z.number(),
      destination: z.enum(["vente", "location", "vente_directe", "export_africa", "stock_interne", "a_revoir"]),
      prixVente: z.number().optional(),
      prixJour: z.number().optional(),
      prixSemaine: z.number().optional(),
      prixMois: z.number().optional(),
      caution: z.number().optional(),
      kmInclus: z.number().optional(),
      equipements: z.string().optional(),
      garantie: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const statusMap: Record<string, string> = {
        vente: "en_vente",
        location: "en_location",
        vente_directe: "en_vente",
        export_africa: "exporte",
        stock_interne: "stock_interne",
        a_revoir: "a_revoir",
      };
      await db.update(voVehicules).set({
        destination: input.destination,
        status: statusMap[input.destination] as any,
        prixVente: input.prixVente != null ? String(input.prixVente) : undefined,
        prixJour: input.prixJour != null ? String(input.prixJour) : undefined,
        prixSemaine: input.prixSemaine != null ? String(input.prixSemaine) : undefined,
        prixMois: input.prixMois != null ? String(input.prixMois) : undefined,
        caution: input.caution != null ? String(input.caution) : undefined,
        kmInclus: input.kmInclus,
        equipements: input.equipements,
        garantie: input.garantie,
        updatedAt: new Date(),
      }).where(eq(voVehicules.id, input.id));
      return { ok: true };
    }),

  // ── Enregistrer une vente ──────────────────────────────────────────────
  enregistrerVente: protectedProcedure
    .input(z.object({
      id: z.number(),
      prixVenteEffectif: z.number(),
      acheteurNom: z.string().optional(),
      acheteurId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [v] = await db.select().from(voVehicules).where(eq(voVehicules.id, input.id)).limit(1);
      if (!v) throw new Error("Véhicule VO introuvable");
      const coutTotal = Number(v.prixAchat ?? 0) + Number(v.coutTransport ?? 0) + Number(v.coutReparation ?? 0) + Number(v.coutLavage ?? 0);
      const margeBrute = input.prixVenteEffectif - Number(v.prixAchat ?? 0);
      const margeNette = input.prixVenteEffectif - coutTotal;
      await db.update(voVehicules).set({
        status: "vendu",
        prixVenteEffectif: String(input.prixVenteEffectif),
        acheteurNom: input.acheteurNom,
        acheteurId: input.acheteurId,
        dateVente: new Date(),
        coutTotal: String(coutTotal),
        margeBrute: String(margeBrute),
        margeNette: String(margeNette),
        updatedAt: new Date(),
      }).where(eq(voVehicules.id, input.id));
      await db.insert(comptaEcritures).values({
        type: "vente_vehicule",
        label: `Vente VO-${v.id} ${v.marque} ${v.modele}`,
        montantHT: String(input.prixVenteEffectif),
        montantTTC: String(input.prixVenteEffectif),
        sens: "credit",
        statut: "valide",
        voVehiculeId: v.id,
        createdBy: ctx.user.uid,
      });
      return { ok: true, margeBrute, margeNette, coutTotal };
    }),

  // ── Stats dashboard VO ─────────────────────────────────────────────────
  stats: protectedProcedure.query(async () => {
    const all = await db.select().from(voVehicules);
    const total = all.length;
    const enStock = all.filter((v) => !["vendu", "archive", "exporte"].includes(v.status)).length;
    const vendus = all.filter((v) => v.status === "vendu").length;
    const enReparation = all.filter((v) => ["en_reparation", "en_attente_pieces", "diagnostic_en_cours"].includes(v.status)).length;
    const enVente = all.filter((v) => v.status === "en_vente").length;
    const enLocation = all.filter((v) => ["en_location", "loue"].includes(v.status)).length;
    const totalAchats = all.reduce((s, v) => s + Number(v.prixAchat ?? 0), 0);
    const totalVentes = all.filter((v) => v.status === "vendu").reduce((s, v) => s + Number(v.prixVenteEffectif ?? 0), 0);
    const totalMarges = all.filter((v) => v.status === "vendu").reduce((s, v) => s + Number(v.margeNette ?? 0), 0);
    return { total, enStock, vendus, enReparation, enVente, enLocation, totalAchats, totalVentes, totalMarges };
  }),
});
