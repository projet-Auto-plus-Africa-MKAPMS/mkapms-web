/**
 * Moteur de candidature de location flotte (tâche #56).
 *
 * rentalApplications existait déjà dans le schéma (token/userId/vehicleId/
 * garageId/applicantType/data/currentStep/status/rejectionReason/
 * depositAmount/depositCurrency/depositPaid/depositStripeSessionId) mais
 * n'était utilisé nulle part — aucun routeur ne la touchait. C'est un
 * modèle de candidature/qualification (comme une demande de financement),
 * pas un calendrier de créneaux jour par jour : draft → submitted →
 * approved/rejected → paid (caution réglée) → completed. Réutilisé tel
 * quel, aucune seconde table créée.
 */
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../trpc.js";
import { db } from "../db.js";
import { rentalApplications } from "../schema.js";
import { notifications } from "../modules/core.js";
import { createPaymentCheckout } from "../payment-engine/checkout.js";

const APPLICANT_TYPES = ["individual", "society", "vtc", "taxi"] as const;

export const rentalApplicationsRouter = router({
  // ── Côté candidat ────────────────────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        vehicleId: z.number().optional(),
        garageId: z.number().optional(),
        applicantType: z.enum(APPLICANT_TYPES).default("individual"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [app] = await db
        .insert(rentalApplications)
        .values({
          token: randomUUID(),
          userId: ctx.user.uid,
          vehicleId: input.vehicleId ?? null,
          garageId: input.garageId ?? null,
          applicantType: input.applicantType,
          data: {},
          currentStep: 0,
          status: "draft",
        })
        .returning();
      return app;
    }),

  mine: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(rentalApplications)
      .where(eq(rentalApplications.userId, ctx.user.uid))
      .orderBy(desc(rentalApplications.createdAt));
  }),

  detail: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [app] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, input.id)).limit(1);
      if (!app || app.userId !== ctx.user.uid) throw new TRPCError({ code: "NOT_FOUND" });
      return app;
    }),

  // Sauvegarde progressive du formulaire multi-étapes (jamais accessible
  // une fois la candidature soumise : les données deviendraient trompeuses
  // pour l'agent qui l'examine).
  updateStep: protectedProcedure
    .input(z.object({ id: z.number(), data: z.record(z.string(), z.unknown()), currentStep: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const [app] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, input.id)).limit(1);
      if (!app || app.userId !== ctx.user.uid) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette candidature n'est plus modifiable." });
      const existant = (app.data && typeof app.data === "object" ? app.data : {}) as Record<string, unknown>;
      const [updated] = await db
        .update(rentalApplications)
        .set({ data: { ...existant, ...input.data }, currentStep: input.currentStep, updatedAt: new Date() })
        .where(eq(rentalApplications.id, input.id))
        .returning();
      return updated;
    }),

  submit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [app] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, input.id)).limit(1);
      if (!app || app.userId !== ctx.user.uid) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST", message: "Candidature déjà soumise." });
      const [updated] = await db
        .update(rentalApplications)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(eq(rentalApplications.id, input.id))
        .returning();
      return updated;
    }),

  // Règle une caution/acompte réellement fixée par l'agent lors de
  // l'approbation — jamais un montant calculé ou deviné côté client.
  payDeposit: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [app] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, input.id)).limit(1);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.userId !== ctx.user.uid) throw new TRPCError({ code: "FORBIDDEN", message: "Cette candidature ne vous appartient pas." });
      if (app.status !== "approved") throw new TRPCError({ code: "BAD_REQUEST", message: "La candidature doit être approuvée avant de régler la caution." });
      const amount = app.depositAmount ? parseFloat(app.depositAmount) : 0;
      if (amount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Le montant de la caution n'a pas encore été fixé par l'agence." });
      const { url } = await createPaymentCheckout({
        userId: ctx.user.uid,
        kind: "rental_deposit",
        amount,
        currency: app.depositCurrency || "EUR",
        label: `Caution location — candidature #${app.id}`,
        metadata: { applicationId: app.id },
        successPath: `/location/mes-candidatures?paid=1`,
        cancelPath: `/location/mes-candidatures?canceled=1`,
      });
      return { url };
    }),

  // ── Côté back-office (agent/Direction) ──────────────────────────────
  list: adminProcedure
    .input(z.object({ status: z.enum(["draft", "submitted", "approved", "rejected", "paid", "completed"]).optional() }).default({}))
    .query(async ({ input }) => {
      const rows = await db.select().from(rentalApplications).orderBy(desc(rentalApplications.createdAt));
      return input.status ? rows.filter((r) => r.status === input.status) : rows;
    }),

  decide: adminProcedure
    .input(
      z.object({
        id: z.number(),
        decision: z.enum(["approved", "rejected"]),
        rejectionReason: z.string().max(500).optional(),
        // Fixé par l'agent au moment de l'approbation — jamais un défaut
        // inventé côté serveur : sans montant, le candidat ne peut pas
        // encore payer (payDeposit le refuse explicitement).
        depositAmount: z.number().min(0).optional(),
        depositCurrency: z.string().length(3).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const [app] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, input.id)).limit(1);
      if (!app) throw new TRPCError({ code: "NOT_FOUND" });
      if (app.status !== "submitted") throw new TRPCError({ code: "BAD_REQUEST", message: "Seule une candidature soumise peut être décidée." });
      const [updated] = await db
        .update(rentalApplications)
        .set({
          status: input.decision,
          rejectionReason: input.decision === "rejected" ? (input.rejectionReason ?? null) : null,
          depositAmount: input.decision === "approved" && input.depositAmount != null ? String(input.depositAmount) : app.depositAmount,
          depositCurrency: input.decision === "approved" ? (input.depositCurrency ?? app.depositCurrency ?? "EUR") : app.depositCurrency,
          updatedAt: new Date(),
        })
        .where(eq(rentalApplications.id, input.id))
        .returning();
      await db.insert(notifications).values({
        userId: app.userId,
        type: "reservation",
        title: input.decision === "approved" ? "Candidature de location approuvée" : "Candidature de location refusée",
        body:
          input.decision === "approved"
            ? "Votre candidature a été approuvée. Réglez la caution pour confirmer votre location."
            : input.rejectionReason || "Votre candidature de location a été refusée.",
        url: "/location/mes-candidatures",
      });
      return updated;
    }),
});
