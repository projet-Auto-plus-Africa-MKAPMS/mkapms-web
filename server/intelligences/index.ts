/**
 * MKA.P-MS Intelligences — surface tRPC.
 *
 * Deux côtés, deux niveaux d'accès contrôlés côté serveur :
 *  - `direction` : réservé au compte PDG (`pdgProcedure`). Contexte interne,
 *    commandes, écriture de code.
 *  - `public` : ouvert aux visiteurs (`publicProcedure`), assistant automobile
 *    encadré, sans aucun accès interne.
 *
 * Masquer un bouton ne protège rien : la séparation est faite ici.
 */
import { z } from "zod";
import { createHash } from "node:crypto";
import { pdgProcedure, publicProcedure, router } from "../trpc.js";
import { COMMANDES, NOM_MOTEUR, REGLES } from "./regles.js";
import {
  CAPACITES,
  registre as registreCapacites,
  resume as resumeCapacites,
  type CodeCapacite,
} from "./capacites.js";
import { router as routerCapacite } from "./routeur.js";
import {
  actions,
  coder,
  demander,
  etat,
  messages,
  proposer,
  sessions,
} from "./service.js";

export const INTELLIGENCES_META = {
  code: "intelligences",
  name: NOM_MOTEUR,
  role: "Appelle réellement les fournisseurs de modèles, sépare le côté direction du côté public, et trace chaque échange, chaque coût et chaque commande.",
} as const;

/** Empreinte de visiteur pour les quotas : jamais l'adresse en clair. */
function empreinte(valeur: string | undefined): string {
  return createHash("sha256")
    .update(valeur ?? "anonyme")
    .digest("hex")
    .slice(0, 32);
}

export const intelligencesRouter = router({
  /** Nom, commandes et règles : lisibles par tous, appliquées par le serveur. */
  presentation: publicProcedure.query(() => ({
    nom: NOM_MOTEUR,
    commandes: COMMANDES.filter((c) => c.cote === "public"),
  })),

  /** Côté public — assistant automobile. */
  assistant: publicProcedure
    .input(
      z.object({
        question: z.string().min(2).max(4000),
        sessionId: z.number().int().positive().nullable().optional(),
        langue: z.string().max(8).optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      demander({
        question: input.question,
        cote: "public",
        sessionId: input.sessionId ?? null,
        userId: ctx.user?.uid ?? null,
        visiteur: empreinte(ctx.user?.uid ? `u${ctx.user.uid}` : ctx.req.ip),
        langue: input.langue ?? "fr",
        countryCode: input.countryCode ?? null,
      }),
    ),

  /** Historique d'une conversation publique (par identifiant de session). */
  filPublic: publicProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const fil = await messages(input.sessionId);
      return fil
        .filter((m) => m.cote === "public")
        .map((m) => ({
          role: m.role,
          contenu: m.contenu,
          ok: m.ok,
          motif: m.motif,
          createdAt: m.createdAt,
        }));
    }),

  // ---------------------------------------------------------------- direction

  /** Vue complète PDG : accès fournisseur réel, moteurs, coûts, commandes, règles. */
  etat: pdgProcedure.query(() => etat()),

  regles: pdgProcedure.query(() => ({ nom: NOM_MOTEUR, commandes: COMMANDES, regles: REGLES })),

  /**
   * Points 124-126 — registre des capacités avec leur état **constaté**.
   * Une capacité sans fournisseur joignable n'est jamais affichée « prête ».
   */
  capacites: pdgProcedure.query(async () => ({
    resume: await resumeCapacites(),
    capacites: await registreCapacites(),
  })),

  /**
   * Point 128 — exécution d'une capacité par le routeur interne. Le PDG choisit
   * la capacité, jamais le fournisseur : le routeur vérifie permission,
   * confidentialité et état constaté avant tout appel.
   */
  executerCapacite: pdgProcedure
    .input(
      z.object({
        capacite: z.enum(
          CAPACITES.map((c) => c.code) as [CodeCapacite, ...CodeCapacite[]],
        ),
        moteur: z.string().min(2).max(64),
        message: z.string().min(2).max(8000),
        systeme: z.string().max(2000).optional(),
        confidentialite: z
          .enum(["publique", "personnelle", "confidentielle"])
          .optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      routerCapacite({
        capacite: input.capacite,
        moteur: input.moteur,
        message: input.message,
        systeme:
          input.systeme ?? "Réponds avec exactitude. Ce que tu ignores, dis-le.",
        role: ctx.user?.role ?? null,
        confidentialite: input.confidentialite,
        countryCode: input.countryCode ?? null,
      }),
    ),

  /** Côté direction — question libre avec contexte interne réel. */
  demander: pdgProcedure
    .input(
      z.object({
        question: z.string().min(2).max(8000),
        sessionId: z.number().int().positive().nullable().optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      demander({
        question: input.question,
        cote: "direction",
        sessionId: input.sessionId ?? null,
        userId: ctx.user?.uid ?? null,
        countryCode: input.countryCode ?? null,
      }),
    ),

  conversations: pdgProcedure
    .input(z.object({ cote: z.enum(["direction", "public"]).default("direction") }).optional())
    .query(({ input }) => sessions(input?.cote ?? "direction")),

  fil: pdgProcedure
    .input(z.object({ sessionId: z.number().int().positive() }))
    .query(({ input }) => messages(input.sessionId)),

  /** Ouvre un dossier de développement traçable (Centre de Commandes). */
  proposer: pdgProcedure
    .input(
      z.object({
        besoin: z.string().min(10).max(4000),
        sessionId: z.number().int().positive().nullable().optional(),
        countryCode: z.string().max(8).nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      proposer({
        besoin: input.besoin,
        actorId: ctx.user?.uid,
        sessionId: input.sessionId ?? null,
        countryCode: input.countryCode ?? null,
      }),
    ),

  /** Écrit réellement le code du correctif. Proposition, jamais application. */
  coder: pdgProcedure
    .input(
      z.object({
        devRequestId: z.number().int().positive(),
        consigne: z.string().max(4000).optional(),
        sessionId: z.number().int().positive().nullable().optional(),
      }),
    )
    .mutation(({ input, ctx }) =>
      coder({
        devRequestId: input.devRequestId,
        consigne: input.consigne,
        actorId: ctx.user?.uid,
        sessionId: input.sessionId ?? null,
      }),
    ),

  /** Journal des commandes passées depuis Intelligence. */
  actions: pdgProcedure
    .input(z.object({ limit: z.number().int().min(1).max(200).default(60) }).optional())
    .query(({ input }) => actions(input?.limit ?? 60)),
});
