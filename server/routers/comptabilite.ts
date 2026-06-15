import { z } from "zod";
import { and, between, desc, eq, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import {
  comptaEcritures, comptaDocuments, comptaRapports,
  cabinetsComptables, cabinetMembres, cabinetClients, cabinetDossiers, cabinetDocuments,
} from "../schema.js";

// ── Comptabilité interne MKA.P-MS ──────────────────────────────────────
export const comptabiliteRouter = router({
  // Écritures
  ecritures: protectedProcedure
    .input(z.object({
      type: z.string().optional(),
      statut: z.string().optional(),
      limit: z.number().min(1).max(500).default(100),
    }).default({}))
    .query(async ({ input }) => {
      const conds = [];
      if (input.type) conds.push(eq(comptaEcritures.type, input.type as any));
      if (input.statut) conds.push(eq(comptaEcritures.statut, input.statut as any));
      return db.select().from(comptaEcritures)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(comptaEcritures.dateEcriture))
        .limit(input.limit);
    }),

  createEcriture: protectedProcedure
    .input(z.object({
      type: z.enum(["achat_vehicule", "vente_vehicule", "facture_fournisseur", "facture_client", "depense", "remboursement", "abonnement", "commission", "salaire", "tva", "transport", "reparation", "piece", "lavage", "autre"]),
      label: z.string().min(1),
      montantHT: z.number(),
      tvaRate: z.number().optional(),
      sens: z.enum(["debit", "credit"]).default("debit"),
      fournisseur: z.string().optional(),
      vehiculeId: z.number().optional(),
      voVehiculeId: z.number().optional(),
      clientId: z.number().optional(),
      reference: z.string().optional(),
      notes: z.string().optional(),
      dateEcheance: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const tvaRate = input.tvaRate ?? 20;
      const tvaMontant = Math.round(input.montantHT * tvaRate) / 100;
      const montantTTC = input.montantHT + tvaMontant;
      const [e] = await db.insert(comptaEcritures).values({
        type: input.type,
        label: input.label,
        montantHT: String(input.montantHT),
        tvaRate: String(tvaRate),
        tvaMontant: String(tvaMontant),
        montantTTC: String(montantTTC),
        sens: input.sens,
        statut: "a_valider",
        fournisseur: input.fournisseur,
        vehiculeId: input.vehiculeId,
        voVehiculeId: input.voVehiculeId,
        clientId: input.clientId,
        reference: input.reference,
        notes: input.notes,
        dateEcheance: input.dateEcheance ? new Date(input.dateEcheance) : undefined,
        createdBy: ctx.user.uid,
      }).returning();
      return e;
    }),

  validerEcriture: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.update(comptaEcritures).set({ statut: "valide", validePar: ctx.user.uid, dateValidation: new Date(), updatedAt: new Date() }).where(eq(comptaEcritures.id, input.id));
      return { ok: true };
    }),

  // Documents comptables
  documents: protectedProcedure
    .input(z.object({ ecritureId: z.number().optional(), vehiculeId: z.number().optional() }).default({}))
    .query(async ({ input }) => {
      const conds = [];
      if (input.ecritureId) conds.push(eq(comptaDocuments.ecritureId, input.ecritureId));
      if (input.vehiculeId) conds.push(eq(comptaDocuments.vehiculeId, input.vehiculeId));
      return db.select().from(comptaDocuments)
        .where(conds.length ? and(...conds) : undefined)
        .orderBy(desc(comptaDocuments.createdAt));
    }),

  addDocument: protectedProcedure
    .input(z.object({
      ecritureId: z.number().optional(),
      vehiculeId: z.number().optional(),
      clientId: z.number().optional(),
      type: z.enum(["facture", "recu", "bon_commande", "avoir", "devis", "releve", "contrat", "photo", "scan", "autre"]),
      nom: z.string().min(1),
      url: z.string().min(1),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.insert(comptaDocuments).values({ ...input, uploadedBy: ctx.user.uid }).returning();
      return d;
    }),

  // Dashboard stats
  stats: protectedProcedure.query(async () => {
    const all = await db.select().from(comptaEcritures);
    const totalDebits = all.filter((e) => e.sens === "debit").reduce((s, e) => s + Number(e.montantTTC), 0);
    const totalCredits = all.filter((e) => e.sens === "credit").reduce((s, e) => s + Number(e.montantTTC), 0);
    const aValider = all.filter((e) => e.statut === "a_valider").length;
    const enRetard = all.filter((e) => e.statut === "en_retard").length;
    const totalTVA = all.reduce((s, e) => s + Number(e.tvaMontant ?? 0), 0);
    return { totalDebits, totalCredits, benefice: totalCredits - totalDebits, aValider, enRetard, totalTVA, nbEcritures: all.length };
  }),

  // Rapports
  rapports: protectedProcedure.query(async () => {
    return db.select().from(comptaRapports).orderBy(desc(comptaRapports.createdAt));
  }),

  genererRapport: protectedProcedure
    .input(z.object({
      type: z.enum(["mensuel", "trimestriel"]),
      dateDebut: z.string(),
      dateFin: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const debut = new Date(input.dateDebut);
      const fin = new Date(input.dateFin);
      const ecritures = await db.select().from(comptaEcritures)
        .where(between(comptaEcritures.dateEcriture, debut, fin));
      const totalAchats = ecritures.filter((e) => e.type === "achat_vehicule").reduce((s, e) => s + Number(e.montantTTC), 0);
      const totalVentes = ecritures.filter((e) => e.type === "vente_vehicule").reduce((s, e) => s + Number(e.montantTTC), 0);
      const totalDepenses = ecritures.filter((e) => e.sens === "debit" && e.type !== "achat_vehicule").reduce((s, e) => s + Number(e.montantTTC), 0);
      const totalCommissions = ecritures.filter((e) => e.type === "commission").reduce((s, e) => s + Number(e.montantTTC), 0);
      const totalAbonnements = ecritures.filter((e) => e.type === "abonnement").reduce((s, e) => s + Number(e.montantTTC), 0);
      const totalTVA = ecritures.reduce((s, e) => s + Number(e.tvaMontant ?? 0), 0);
      const beneficeNet = totalVentes + totalCommissions + totalAbonnements - totalAchats - totalDepenses;
      const periode = input.type === "mensuel"
        ? `${debut.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`
        : `T${Math.ceil((debut.getMonth() + 1) / 3)} ${debut.getFullYear()}`;
      const [r] = await db.insert(comptaRapports).values({
        type: input.type,
        periode,
        dateDebut: debut,
        dateFin: fin,
        totalAchats: String(totalAchats),
        totalVentes: String(totalVentes),
        totalDepenses: String(totalDepenses),
        totalCommissions: String(totalCommissions),
        totalAbonnements: String(totalAbonnements),
        totalTVA: String(totalTVA),
        beneficeNet: String(beneficeNet),
        createdBy: ctx.user.uid,
      }).returning();
      return r;
    }),
});

// ── Cabinets comptables externes ────────────────────────────────────────
export const cabinetsRouter = router({
  create: protectedProcedure
    .input(z.object({
      nom: z.string().min(1),
      siret: z.string().optional(),
      adresse: z.string().optional(),
      telephone: z.string().optional(),
      email: z.string().optional(),
      siteWeb: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [c] = await db.insert(cabinetsComptables).values({ ...input, responsableId: ctx.user.uid }).returning();
      await db.insert(cabinetMembres).values({ cabinetId: c.id, userId: ctx.user.uid, role: "expert_comptable" });
      return c;
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await db.select().from(cabinetMembres).where(eq(cabinetMembres.userId, ctx.user.uid));
    if (!memberships.length) return [];
    const ids = memberships.map((m) => m.cabinetId);
    const cabinets = [];
    for (const id of ids) {
      const [c] = await db.select().from(cabinetsComptables).where(eq(cabinetsComptables.id, id)).limit(1);
      if (c) cabinets.push(c);
    }
    return cabinets;
  }),

  addMembre: protectedProcedure
    .input(z.object({
      cabinetId: z.number(),
      userId: z.number(),
      role: z.enum(["expert_comptable", "collaborateur", "assistant", "stagiaire"]).default("collaborateur"),
    }))
    .mutation(async ({ input }) => {
      const [m] = await db.insert(cabinetMembres).values(input).returning();
      return m;
    }),

  clients: protectedProcedure
    .input(z.object({ cabinetId: z.number() }))
    .query(async ({ input }) => {
      return db.select().from(cabinetClients).where(eq(cabinetClients.cabinetId, input.cabinetId)).orderBy(desc(cabinetClients.createdAt));
    }),

  addClient: protectedProcedure
    .input(z.object({
      cabinetId: z.number(),
      nom: z.string().min(1),
      siret: z.string().optional(),
      email: z.string().optional(),
      telephone: z.string().optional(),
      clientUserId: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [c] = await db.insert(cabinetClients).values(input).returning();
      return c;
    }),

  dossiers: protectedProcedure
    .input(z.object({ cabinetId: z.number(), clientId: z.number().optional() }))
    .query(async ({ input }) => {
      const conds = [eq(cabinetDossiers.cabinetId, input.cabinetId)];
      if (input.clientId) conds.push(eq(cabinetDossiers.clientId, input.clientId));
      return db.select().from(cabinetDossiers).where(and(...conds)).orderBy(desc(cabinetDossiers.createdAt));
    }),

  addDossier: protectedProcedure
    .input(z.object({
      cabinetId: z.number(),
      clientId: z.number(),
      titre: z.string().min(1),
      type: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.insert(cabinetDossiers).values({ ...input, responsableId: ctx.user.uid }).returning();
      return d;
    }),

  addDocumentDossier: protectedProcedure
    .input(z.object({
      dossierId: z.number(),
      cabinetId: z.number(),
      nom: z.string().min(1),
      url: z.string().min(1),
      type: z.enum(["facture", "recu", "bon_commande", "avoir", "devis", "releve", "contrat", "photo", "scan", "autre"]),
      mimeType: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [d] = await db.insert(cabinetDocuments).values({ ...input, uploadedBy: ctx.user.uid }).returning();
      return d;
    }),
});
