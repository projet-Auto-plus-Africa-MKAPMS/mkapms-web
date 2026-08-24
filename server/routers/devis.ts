import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { devisGarageRequests, serviceTracking } from "../schema.js";
import { notifications } from "../modules/core.js";
import { createPaymentCheckout } from "../payment-engine/checkout.js";

// Module Devis Garage (§6) — parcours en 7 étapes côté front, persisté ici.
export const devisRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        contactNom: z.string().min(1),
        contactEmail: z.string().email(),
        contactTelephone: z.string().optional(),
        vehiculeMarque: z.string().optional(),
        vehiculeModele: z.string().optional(),
        vehiculeAnnee: z.number().optional(),
        immatriculation: z.string().optional(),
        typeIntervention: z.string().min(1),
        description: z.string().optional(),
        ville: z.string().optional(),
        codePostal: z.string().optional(),
        pays: z.string().default("FR"),
        photos: z.array(z.string()).default([]),
        devisType: z.enum(["main_oeuvre", "pieces_main_oeuvre", "pieces_seules"]).default("main_oeuvre"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { photos, ...rest } = input;
      const [created] = await db
        .insert(devisGarageRequests)
        .values({
          userId: ctx.user.uid,
          ...rest,
          photos: photos.length ? photos.join("\n") : null,
          status: "nouveau",
        })
        .returning();
      await db.insert(serviceTracking).values({
        userId: ctx.user.uid,
        serviceType: "devis",
        serviceId: created.id,
        reference: `DEV-${created.id}`,
        titre: `Devis ${input.typeIntervention}`,
        status: "nouveau",
        statusLabel: "Demande envoyée",
      });
      await db.insert(notifications).values({
        userId: ctx.user.uid,
        type: "devis",
        title: `Votre demande de devis #DEV-${created.id}`,
        body: `Votre demande de devis pour "${input.typeIntervention}" a été envoyée. Vous serez notifié dès qu'un garage répond.`,
        url: "/compte",
      });
      return created;
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(devisGarageRequests)
      .where(eq(devisGarageRequests.userId, ctx.user.uid))
      .orderBy(desc(devisGarageRequests.createdAt));
  }),

  updateStatus: protectedProcedure
    .input(z.object({
      devisId: z.number(),
      status: z.enum(["nouveau", "recu_par_garages", "offres_recues", "accepte", "refuse", "annule", "termine"]),
      detail: z.string().optional(),
      montantHT: z.number().optional(),
      montantTTC: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [devis] = await db.select().from(devisGarageRequests).where(eq(devisGarageRequests.id, input.devisId)).limit(1);
      if (!devis) throw new Error("Devis introuvable");
      await db.update(devisGarageRequests).set({ status: input.status }).where(eq(devisGarageRequests.id, input.devisId));
      const statusLabels: Record<string, string> = {
        nouveau: "Demande envoyée",
        recu_par_garages: "Reçu par les garages",
        offres_recues: "Offres reçues — à valider",
        accepte: "Devis accepté",
        refuse: "Devis refusé",
        annule: "Annulé",
        termine: "Intervention terminée",
      };
      if (!devis.userId) throw new Error("Devis sans userId");
      await db.insert(serviceTracking).values({
        userId: devis.userId,
        serviceType: "devis",
        serviceId: devis.id,
        reference: `DEV-${devis.id}`,
        titre: `Devis ${devis.typeIntervention}`,
        status: input.status,
        statusLabel: statusLabels[input.status] ?? input.status,
        detail: input.detail,
      });
      await db.insert(notifications).values({
        userId: devis.userId!,
        type: "devis",
        title: `Devis #DEV-${devis.id} — ${statusLabels[input.status]}`,
        body: input.detail ?? `Votre devis est maintenant : ${statusLabels[input.status]}`,
        url: "/compte",
      });
      return { ok: true };
    }),

  /**
   * Paiement d'un devis accepté — checkout Stripe unifié via le Payment Engine.
   * Le devis doit être en statut "accepte". Le montant TTC vient de l'écran
   * (calculé côté client à partir des devisItems du garage — audit possible
   * plus tard). Le webhook Stripe déclenche la mise en statut "termine".
   */
  payerDevis: protectedProcedure
    .input(z.object({
      devisId: z.number().int().positive(),
      montantTTC: z.number().positive(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [devis] = await db
        .select()
        .from(devisGarageRequests)
        .where(eq(devisGarageRequests.id, input.devisId))
        .limit(1);
      if (!devis) throw new Error("Devis introuvable");
      if (devis.userId !== ctx.user.uid) throw new Error("Ce devis n'est pas le vôtre");
      if (devis.status !== "accepte") {
        throw new Error("Seuls les devis acceptés peuvent être payés");
      }

      const { url } = await createPaymentCheckout({
        userId: ctx.user.uid,
        kind: "garage_prestation",
        amount: input.montantTTC,
        currency: "EUR",
        label: `Devis ${devis.typeIntervention} — ${devis.vehiculeMarque ?? ""} ${devis.vehiculeModele ?? ""}`.trim(),
        metadata: { devisId: devis.id, type: "devis_garage" },
        successPath: `/compte?devis=${devis.id}&paid=1`,
        cancelPath: `/compte?devis=${devis.id}&canceled=1`,
        paymentTypeSql: "garage_prestation",
      });
      return { url };
    }),
});
