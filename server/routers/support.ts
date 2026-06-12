import { z } from "zod";
import { router, publicProcedure } from "../trpc.js";
import { db } from "../db.js";
import { supportTickets } from "../schema.js";

// Centre d'aide / contact (§11.4)
export const supportRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        contactNom: z.string().min(1),
        contactEmail: z.string().email(),
        sujet: z.string().min(1),
        message: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [t] = await db
        .insert(supportTickets)
        .values({
          userId: ctx.user?.uid ?? null,
          contactNom: input.contactNom,
          contactEmail: input.contactEmail,
          sujet: input.sujet,
          message: input.message,
          status: "ouvert",
        })
        .returning();
      return { id: t.id };
    }),

  faq: publicProcedure.query(() => [
    {
      q: "La plateforme est-elle gratuite pour les particuliers ?",
      a: "Oui. Le dépôt d'annonce est gratuit avec jusqu'à 4 photos. Des options de mise en avant (Boost) sont disponibles à l'unité.",
    },
    {
      q: "Comment fonctionne la réservation avec acompte ?",
      a: "Vous bloquez le véhicule 24 h en versant un acompte (250, 500, 1 000 ou 1 500 €) via paiement sécurisé Stripe, le temps de finaliser l'achat.",
    },
    {
      q: "Quels sont les délais de location ?",
      a: "Particulier : 24 h après paiement. VTC et Professionnel/Utilitaire : 48 h. Taxi : disponible le jour même.",
    },
    {
      q: "Les paiements sont-ils sécurisés ?",
      a: "Tous les paiements transitent par Stripe (certifié PCI-DSS Level 1). Aucune donnée bancaire n'est stockée sur nos serveurs.",
    },
  ]),
});
