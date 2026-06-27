import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { supportTickets, notifications } from "../schema.js";
import { logAction, clientMeta } from "../audit.js";

// Centre d'aide / contact + messagerie support (§11.4)
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

  // Historique des messages de l'utilisateur connecté (messagerie support).
  myTickets: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(supportTickets)
      .where(eq(supportTickets.userId, ctx.user.uid))
      .orderBy(desc(supportTickets.createdAt));
  }),

  // Réponse de la Direction à un message (back-office). Notifie le client.
  respond: adminProcedure
    .input(
      z.object({
        id: z.number(),
        response: z.string().min(1),
        status: z.enum(["ouvert", "en_cours", "resolu", "ferme"]).default("resolu"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [t] = await db
        .update(supportTickets)
        .set({
          response: input.response,
          respondedAt: new Date(),
          status: input.status,
          assignedTo: ctx.user.uid,
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, input.id))
        .returning();
      if (t?.userId) {
        await db.insert(notifications).values({
          userId: t.userId,
          type: "support",
          title: "Réponse du support MKA.P-MS",
          body: `« ${t.sujet} » — ${input.response.slice(0, 80)}`,
          url: "/compte",
        });
      }
      await logAction(ctx.user.uid, "support.respond", "support_ticket", input.id, { status: input.status }, clientMeta(ctx.req));
      return { ok: true };
    }),

  // Mise à jour du statut sans réponse (back-office).
  setStatus: adminProcedure
    .input(z.object({ id: z.number(), status: z.enum(["ouvert", "en_cours", "resolu", "ferme"]) }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(supportTickets)
        .set({ status: input.status, updatedAt: new Date() })
        .where(eq(supportTickets.id, input.id));
      await logAction(ctx.user.uid, "support.status", "support_ticket", input.id, { status: input.status }, clientMeta(ctx.req));
      return { ok: true };
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
