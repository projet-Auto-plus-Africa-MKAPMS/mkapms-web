/**
 * Suppression de compte — surface tRPC.
 *
 * Trois niveaux d'accès, contrôlés côté serveur :
 *  - `publicProcedure` : formulaire public, exigé quand la personne n'a plus
 *    accès à son application. Enregistre une demande, ne supprime rien.
 *  - `protectedProcedure` : le titulaire connecté supprime son propre compte.
 *  - `directionProcedure` : traitement des demandes publiques.
 */
import { z } from "zod";
import { directionProcedure, protectedProcedure, publicProcedure, router } from "../trpc.js";
import { db } from "../db.js";
import { eq } from "drizzle-orm";
import { users } from "../schema.js";
import { comparePassword } from "../auth.js";
import { TRPCError } from "@trpc/server";
import { CONSERVATIONS, enregistrerDemande, listerDemandes, traiterDemande } from "./service.js";

export const accountDeletionRouter = router({
  /** Ce que la suppression retire et ce qu'elle conserve, affiché avant de cliquer. */
  conditions: publicProcedure.query(() => ({
    supprime: [
      "Votre identité sur le compte : e-mail, nom, téléphone, adresse, photo, mot de passe et connexion Google.",
      "Vos annonces, retirées du public immédiatement.",
      "Vos favoris et vos notifications.",
      "Vos conversations, fermées et détachées de votre nom.",
    ],
    conserve: CONSERVATIONS,
    delai:
      "Depuis votre compte : immédiat. Par le formulaire public : après vérification de votre identité, 30 jours au plus.",
  })),

  /** Demande publique — sans preuve d'identité, elle n'exécute rien. */
  demanderPublique: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        motif: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const r = await enregistrerDemande({
        userId: null,
        email: input.email,
        origine: "formulaire_public",
        motif: input.motif ?? "",
        executer: false,
        actorId: null,
      });
      return {
        id: r.id,
        statut: r.statut,
        message:
          "Demande enregistrée. Nous vérifions que cette adresse est bien la vôtre avant toute suppression : sans cette vérification, n'importe qui pourrait faire supprimer le compte d'un autre.",
      };
    }),

  /** Suppression par le titulaire connecté : identité déjà prouvée. */
  supprimerMonCompte: protectedProcedure
    .input(
      z.object({
        confirmation: z.literal("SUPPRIMER"),
        motDePasse: z.string().optional(),
        motif: z.string().max(1000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [u] = await db.select().from(users).where(eq(users.id, ctx.user.uid)).limit(1);
      if (!u) throw new TRPCError({ code: "NOT_FOUND", message: "Compte introuvable" });

      // Un compte avec mot de passe le redemande : un téléphone laissé ouvert
      // ne doit pas permettre d'effacer le compte de son propriétaire.
      if (u.passwordHash) {
        if (!input.motDePasse) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Mot de passe requis pour supprimer le compte" });
        }
        const ok = await comparePassword(input.motDePasse, u.passwordHash);
        if (!ok) throw new TRPCError({ code: "UNAUTHORIZED", message: "Mot de passe incorrect" });
      }

      const r = await enregistrerDemande({
        userId: u.id,
        email: u.email,
        origine: "compte_connecte",
        motif: input.motif ?? "",
        executer: true,
        actorId: u.id,
      });
      return { statut: r.statut, effets: r.effets };
    }),

  /** File des demandes, côté direction. */
  demandes: directionProcedure.query(() => listerDemandes()),

  traiter: directionProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        action: z.enum(["effectuer", "refuser"]),
        decision: z.string().max(1000).default(""),
      }),
    )
    .mutation(({ ctx, input }) =>
      traiterDemande({ id: input.id, action: input.action, decision: input.decision, actorId: ctx.user.uid }),
    ),
});
