import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { depotVente, serviceTracking } from "../schema.js";
import { notifications } from "../modules/core.js";

const statusLabels: Record<string, string> = {
  demande: "Demande reçue",
  expertise: "Expertise en cours",
  accepte: "Véhicule accepté",
  photos_en_cours: "Séance photos en cours",
  en_ligne: "Annonce en ligne",
  negociation: "Négociation en cours",
  vendu: "Véhicule vendu",
  paiement_client: "Paiement en cours",
  termine: "Dépôt-vente terminé",
  refuse: "Véhicule refusé",
  annule: "Annulé",
};

export const depotVenteRouter = router({
  create: protectedProcedure
    .input(z.object({
      marque: z.string().min(1),
      modele: z.string().min(1),
      annee: z.number().optional(),
      immatriculation: z.string().optional(),
      vin: z.string().optional(),
      kilometrage: z.number().optional(),
      carburant: z.string().optional(),
      boiteVitesse: z.string().optional(),
      couleur: z.string().optional(),
      description: z.string().optional(),
      prixSouhaite: z.number().optional(),
      photos: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const { photos, prixSouhaite, ...rest } = input;
      const [created] = await db.insert(depotVente).values({
        clientId: ctx.user.uid,
        ...rest,
        prixSouhaite: prixSouhaite != null ? String(prixSouhaite) : undefined,
        photos: photos.length ? photos.join("\n") : null,
        status: "demande",
      }).returning();
      await db.insert(serviceTracking).values({
        userId: ctx.user.uid,
        serviceType: "depot_vente",
        serviceId: created.id,
        reference: `DV-${created.id}`,
        titre: `Dépôt-vente ${input.marque} ${input.modele}`,
        status: "demande",
        statusLabel: "Demande reçue",
      });
      await db.insert(notifications).values({
        userId: ctx.user.uid,
        type: "depot_vente",
        title: `Dépôt-vente #DV-${created.id} enregistré`,
        body: `Votre demande de dépôt-vente pour ${input.marque} ${input.modele} a été reçue. Nous vous contacterons pour l'expertise.`,
        url: "/compte",
      });
      return created;
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db.select().from(depotVente).where(eq(depotVente.clientId, ctx.user.uid)).orderBy(desc(depotVente.createdAt));
  }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["demande", "expertise", "accepte", "photos_en_cours", "en_ligne", "negociation", "vendu", "paiement_client", "termine", "refuse", "annule"]),
      detail: z.string().optional(),
      prixExpertise: z.number().optional(),
      prixVenteEffectif: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const [dv] = await db.select().from(depotVente).where(eq(depotVente.id, input.id)).limit(1);
      if (!dv) throw new Error("Dépôt-vente introuvable");
      const updates: Record<string, unknown> = { status: input.status, updatedAt: new Date() };
      if (input.prixExpertise != null) updates.prixExpertise = String(input.prixExpertise);
      if (input.prixVenteEffectif != null) {
        updates.prixVenteEffectif = String(input.prixVenteEffectif);
        const commPct = Number(dv.commissionPct ?? 10);
        updates.commissionMontant = String(Math.round(input.prixVenteEffectif * commPct) / 100);
      }
      if (input.status === "vendu") updates.dateVente = new Date();
      if (input.status === "termine") updates.datePaiement = new Date();
      await db.update(depotVente).set(updates).where(eq(depotVente.id, input.id));
      await db.insert(serviceTracking).values({
        userId: dv.clientId,
        serviceType: "depot_vente",
        serviceId: dv.id,
        reference: `DV-${dv.id}`,
        titre: `Dépôt-vente ${dv.marque} ${dv.modele}`,
        status: input.status,
        statusLabel: statusLabels[input.status] ?? input.status,
        detail: input.detail,
      });
      await db.insert(notifications).values({
        userId: dv.clientId,
        type: "depot_vente",
        title: `Dépôt-vente #DV-${dv.id} — ${statusLabels[input.status]}`,
        body: input.detail ?? `Votre dépôt-vente est maintenant : ${statusLabels[input.status]}`,
        url: "/compte",
      });
      return { ok: true };
    }),
});
