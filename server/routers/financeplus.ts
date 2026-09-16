/**
 * MKA.P-MS Finance+ — Surface tRPC.
 *
 * Le schéma (server/modules/financeplus.ts) existait depuis longtemps sans
 * aucun routeur : les 15 écrans réels du domaine finance n'avaient donc
 * aucune donnée réelle à consommer. Ce routeur branche le socle
 * réellement construit — jamais un taux, une mensualité ou une règle
 * d'octroi inventés.
 *
 * Architecture imposée par le chantier : Pays → Éligibilité produit →
 * Règles légales → Contrat → Tarification → Approbation → Paiement.
 * L'éligibilité pays est déjà un moteur réel et actif (Country Policy
 * Engine, domaine réglementé "credit" déjà déclaré) : Finance+ s'y
 * raccorde au lieu d'inventer un second système de règles pays. Tant
 * qu'aucune règle "credit" n'est confirmée pour un pays (server/
 * country-policy — le PDG la déclare puis la confirme via
 * CentreReglesPays.tsx, déjà réel), toute création de contrat y est
 * refusée avec le motif exact — jamais une autorisation par défaut.
 */
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { finplusContrats, finplusPaiements, finplusDocuments, finplusNotifications } from "../modules/financeplus.js";
import { evaluateAction } from "../country-policy/service.js";

// Le paiement fractionné a déjà son propre moteur réel et testé (routers/
// installments.ts, sous le moteur "payment") : ce routeur ne couvre QUE la
// LOA, jamais un second système de paiement fractionné en parallèle.
const TYPE_CONTRAT = ["loa"] as const;
const CLIENT_TYPE = ["particulier", "professionnel"] as const;
const DOMAINE_REGLEMENTAIRE = "credit";

export const financeplusRouter = router({
  /**
   * Première étape imposée : ce pays autorise-t-il aujourd'hui un contrat
   * Finance+ ? Sans règle confirmée, la réponse est honnête :
   * "validation_requise" — jamais "autorisé" par défaut.
   */
  eligibilite: publicProcedure
    .input(z.object({ countryCode: z.string().min(2).max(4).optional() }))
    .query(async ({ input }) => {
      return evaluateAction({
        actionType: "financeplus_contrat",
        domain: DOMAINE_REGLEMENTAIRE,
        countryCode: input.countryCode ?? null,
      });
    }),

  mesContrats: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(finplusContrats)
      .where(eq(finplusContrats.clientId, ctx.user.uid))
      .orderBy(desc(finplusContrats.createdAt));
  }),

  contrat: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [contrat] = await db
        .select()
        .from(finplusContrats)
        .where(and(eq(finplusContrats.id, input.id), eq(finplusContrats.clientId, ctx.user.uid)))
        .limit(1);
      if (!contrat) return null;
      const paiements = await db
        .select()
        .from(finplusPaiements)
        .where(eq(finplusPaiements.contratId, contrat.id))
        .orderBy(finplusPaiements.numero);
      const documents = await db.select().from(finplusDocuments).where(eq(finplusDocuments.contratId, contrat.id));
      return { ...contrat, paiements, documents };
    }),

  mesNotifications: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(finplusNotifications)
      .where(eq(finplusNotifications.clientId, ctx.user.uid))
      .orderBy(desc(finplusNotifications.createdAt));
  }),

  /**
   * Ouvre une simulation. Refusée sans règle pays confirmée pour le
   * domaine "credit" (voir `eligibilite`). Aucun taux, aucune mensualité
   * n'est calculé ici : ces champs restent absents tant que la
   * configuration métier/légale (barème, frais, conditions d'octroi) n'a
   * pas été déclarée par la Direction — jamais une valeur inventée pour
   * combler le manque.
   */
  creerSimulation: protectedProcedure
    .input(
      z.object({
        type: z.enum(TYPE_CONTRAT),
        countryCode: z.string().min(2).max(4),
        prixVehicule: z.number().positive(),
        apportInitial: z.number().min(0).default(0),
        dureeMois: z.number().int().positive(),
        annonceId: z.number().optional(),
        vehiculeType: z.string().max(32).optional(),
        vehiculeMarque: z.string().max(96).optional(),
        vehiculeModele: z.string().max(96).optional(),
        clientType: z.enum(CLIENT_TYPE).default("particulier"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const decision = await evaluateAction({
        actionType: "financeplus_contrat",
        domain: DOMAINE_REGLEMENTAIRE,
        countryCode: input.countryCode,
        actorId: ctx.user.uid,
        context: { prixVehicule: input.prixVehicule, dureeMois: input.dureeMois, type: input.type },
      });

      if (decision.verdict !== "autorise") {
        throw new TRPCError({ code: "FORBIDDEN", message: decision.reason });
      }

      const [contrat] = await db
        .insert(finplusContrats)
        .values({
          clientId: ctx.user.uid,
          type: input.type,
          status: "simulation",
          prixVehicule: String(input.prixVehicule),
          apportInitial: String(input.apportInitial),
          dureeMois: input.dureeMois,
          annonceId: input.annonceId,
          vehiculeType: input.vehiculeType,
          vehiculeMarque: input.vehiculeMarque,
          vehiculeModele: input.vehiculeModele,
          clientType: input.clientType,
        })
        .returning();

      return contrat;
    }),
});
