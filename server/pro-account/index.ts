/**
 * MKA.P-MS Pro Account Engine — création du compte professionnel avant
 * activation (point 24).
 *
 * Moteur séparé du Pro Portal : le portail compose l'offre, ce moteur-ci
 * porte le dossier légal, sa vérification humaine et l'activation. Il peut
 * donc être exploité, vendu ou loué indépendamment du portail.
 *
 * Règle stricte : l'activation n'est jamais déduite du paiement, ni du simple
 * remplissage d'un formulaire. Les deux conditions sont vérifiées séparément.
 */
import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import {
  activateAccount,
  checkCompleteness,
  listApplications,
  myApplication,
  proAccountHealth,
  requirementsForAccount,
  reviewApplication,
  saveApplication,
  seedProAccountRules,
  setPaymentStatus,
  submitApplication,
} from "./service.js";

export const PRO_ACCOUNT_META = {
  code: "pro_account",
  name: "Pro Account Engine",
  role: "Dossier professionnel légal par pays et par métier, vérification humaine et activation contrôlée.",
} as const;

const documentSchema = z.object({
  key: z.string().min(1).max(64),
  label: z.string().min(1).max(160),
  status: z.enum(["manquant", "fourni", "refuse"]),
  url: z.string().max(500).nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export const proAccountRouter = router({
  /** Ce que le pays ET le métier exigent réellement. */
  requirements: publicProcedure
    .input(z.object({ professionCode: z.string().min(1), countryCode: z.string().length(2) }))
    .query(({ input }) => requirementsForAccount(input.professionCode, input.countryCode)),

  /** Dossier du professionnel connecté (null s'il n'en a pas encore). */
  mine: protectedProcedure.query(({ ctx }) => myApplication(ctx.user!.uid)),

  /** Enregistre le dossier sans le soumettre ni l'activer. */
  save: protectedProcedure
    .input(
      z.object({
        sessionKey: z.string().min(8).max(64).nullable().optional(),
        professionCode: z.string().min(1).max(48),
        countryCode: z.string().length(2),
        moduleCodes: z.array(z.string().min(1)).max(50).optional(),
        contactFirstName: z.string().max(80).nullable().optional(),
        contactLastName: z.string().max(80).nullable().optional(),
        contactEmail: z.string().email().max(190).nullable().optional(),
        contactPhone: z.string().max(32).nullable().optional(),
        legalName: z.string().max(190).nullable().optional(),
        legalForm: z.string().max(80).nullable().optional(),
        registrationNumber: z.string().max(64).nullable().optional(),
        vatNumber: z.string().max(40).nullable().optional(),
        addressLine: z.string().max(190).nullable().optional(),
        city: z.string().max(120).nullable().optional(),
        postalCode: z.string().max(20).nullable().optional(),
        website: z.string().max(190).nullable().optional(),
        documents: z.array(documentSchema).max(40).optional(),
        termsAccepted: z.boolean().optional(),
      }),
    )
    .mutation(({ input, ctx }) => saveApplication({ ...input, userId: ctx.user!.uid })),

  /** Ce qui manque encore, dit précisément plutôt qu'un « incomplet » vague. */
  check: protectedProcedure.query(async ({ ctx }) => {
    const application = await myApplication(ctx.user!.uid);
    if (!application) return null;
    return checkCompleteness(application);
  }),

  /** Soumission à vérification humaine (refusée si le dossier est incomplet). */
  submit: protectedProcedure.mutation(({ ctx }) => submitApplication(ctx.user!.uid)),

  /** File de vérification (Direction / administration). */
  list: adminProcedure
    .input(z.object({ status: z.string().max(24).optional() }).optional())
    .query(({ input }) => listApplications(input?.status)),

  /** Décision humaine : validé, refusé ou complément demandé. */
  review: adminProcedure
    .input(
      z.object({
        applicationId: z.number().int().positive(),
        decision: z.enum(["valide", "refuse", "complement_requis"]),
        note: z.string().max(2000).optional(),
      }),
    )
    .mutation(({ input, ctx }) => reviewApplication({ ...input, reviewerId: ctx.user!.uid })),

  /**
   * État de paiement du dossier. Réservé à l'administration : un paiement
   * confirmé doit venir du Moteur de Paiement, pas du navigateur.
   */
  setPaymentStatus: adminProcedure
    .input(
      z.object({
        applicationId: z.number().int().positive(),
        paymentStatus: z.enum(["non_requis", "en_attente", "confirme"]),
        paymentReference: z.string().max(120).nullable().optional(),
      }),
    )
    .mutation(({ input }) => setPaymentStatus(input)),

  /** Activation contrôlée : retourne les blocages au lieu d'un faux succès. */
  activate: adminProcedure
    .input(z.object({ applicationId: z.number().int().positive() }))
    .mutation(({ input }) => activateAccount(input.applicationId)),

  health: adminProcedure.query(() => proAccountHealth()),

  seed: adminProcedure.mutation(() => seedProAccountRules()),
});

export { proAccountHealth, seedProAccountRules };
