/**
 * Cloisonnement des espaces VO — routeur tRPC.
 *
 * Une seule porte d'entrée pour savoir, côté serveur, quel espace VO est
 * ouvert à l'utilisateur connecté, et un stock strictement limité au sien.
 * Le refus est explicite (motif + redirection) : le navigateur n'a rien à
 * décider, il applique la réponse du serveur.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc.js";
import {
  accesVo,
  compteursProDe,
  stockProDe,
  statutsProDe,
  vehiculeProAppartient,
  type AccesVo,
} from "./service.js";

export const VO_ESPACES_META = {
  code: "vo_espaces",
  name: "VO Espaces",
  role:
    "Cloisonner les trois espaces VO (officiel, professionnel, particulier) et n'ouvrir l'espace professionnel qu'à un abonnement VO réellement actif.",
} as const;

/**
 * Garde serveur : renvoie l'accès ou refuse avec le motif et la redirection.
 * Chaque résultat reste borné au compte appelant, y compris pour l'équipe :
 * le stock officiel (table vo_vehicules) n'est jamais servi par ce routeur.
 */
async function exigerEspacePro(user: { uid: number; role: string }): Promise<AccesVo> {
  const acces = await accesVo(user);
  if (!acces.autorise) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${acces.motif}|redirection=${acces.redirection}`,
    });
  }
  return acces;
}

export const voEspacesRouter = router({
  /** Décision d'accès — appelée par la barrière d'écran VO professionnel. */
  acces: protectedProcedure.query(({ ctx }) => accesVo(ctx.user)),

  /** Stock du professionnel abonné : uniquement ses propres véhicules. */
  stock: protectedProcedure
    .input(
      z
        .object({
          status: z.string().max(24).optional(),
          limit: z.number().int().min(1).max(200).default(100),
        })
        .default({}),
    )
    .query(async ({ ctx, input }) => {
      await exigerEspacePro(ctx.user);
      return stockProDe(ctx.user.uid, { status: input.status, limit: input.limit });
    }),

  /** Compteurs réels du professionnel (aucune valeur d'exemple). */
  compteurs: protectedProcedure.query(async ({ ctx }) => {
    const acces = await exigerEspacePro(ctx.user);
    return compteursProDe(ctx.user.uid, acces.abonnement?.quotaAnnonces ?? null);
  }),

  /** Filtres proposés à partir des statuts réellement présents. */
  statuts: protectedProcedure.query(async ({ ctx }) => {
    await exigerEspacePro(ctx.user);
    return statutsProDe(ctx.user.uid);
  }),

  /** Contrôle d'appartenance avant toute action sur un véhicule. */
  appartient: protectedProcedure
    .input(z.object({ annonceId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await exigerEspacePro(ctx.user);
      return { appartient: await vehiculeProAppartient(ctx.user.uid, input.annonceId) };
    }),
});
