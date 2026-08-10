import { z } from "zod";
import { and, desc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, proProcedure } from "../trpc.js";
import { db } from "../db.js";
import { garagesPublics, rdvGarage, serviceTracking } from "../schema.js";
import { notifications } from "../modules/core.js";
import { ingest as ingestVisibility } from "../visibility-os/index.js";
import { requestReviewAfterCompletion } from "../reputation-engine/service.js";

export const garagesRouter = router({
  // Annuaire public des garages (§7.1)
  list: publicProcedure
    .input(
      z.object({
        q: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ input }) => {
      const conds = [eq(garagesPublics.status, "valide")];
      if (input.city) conds.push(ilike(garagesPublics.city, `%${input.city}%`));
      // Filtrage par pays actif : on tolère les fiches sans pays (legacy) pour
      // ne masquer aucun garage existant. Même règle que les annonces.
      if (input.country) {
        conds.push(or(eq(garagesPublics.country, input.country), isNull(garagesPublics.country))!);
      }
      if (input.q) conds.push(ilike(garagesPublics.name, `%${input.q}%`));
      const where = and(...conds);
      const items = await db
        .select()
        .from(garagesPublics)
        .where(where)
        .orderBy(desc(garagesPublics.featured), desc(garagesPublics.rating))
        .limit(input.limit)
        .offset(input.offset);
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(garagesPublics)
        .where(where);
      return { total: count, items };
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const [g] = await db
        .select()
        .from(garagesPublics)
        .where(eq(garagesPublics.id, input.id))
        .limit(1);
      if (!g) throw new TRPCError({ code: "NOT_FOUND" });
      return g;
    }),

  // Fiche publique par slug (ou id numérique) — pages SEO indexées /garages/:slug
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ input }) => {
      const isNumeric = /^\d+$/.test(input.slug);
      const [g] = await db
        .select()
        .from(garagesPublics)
        .where(
          and(
            eq(garagesPublics.status, "valide"),
            isNumeric ? eq(garagesPublics.id, Number(input.slug)) : eq(garagesPublics.slug, input.slug),
          ),
        )
        .limit(1);
      if (!g) throw new TRPCError({ code: "NOT_FOUND" });
      return g;
    }),

  // Inscription d'un garage (§7.3) — création de la fiche en attente de validation
  register: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2),
        description: z.string().optional(),
        addressLine: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().default("FR"),
        phone: z.string().optional(),
        email: z.string().email().optional(),
        services: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const slug =
        input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") +
        "-" +
        Date.now().toString(36);
      const [created] = await db
        .insert(garagesPublics)
        .values({
          ownerId: ctx.user.uid,
          name: input.name,
          slug,
          description: input.description,
          addressLine: input.addressLine,
          city: input.city,
          postalCode: input.postalCode,
          country: input.country,
          phone: input.phone,
          email: input.email,
          services: input.services.join(", "),
          status: "en_attente",
        })
        .returning();

      // Injection automatique dans le Moteur de Visibilité (fire-and-forget).
      ingestVisibility({
        sourceType: "garage",
        sourceId: String(created.id),
        title: created.name,
        body: (
          created.description ||
          `Garage ${created.name}${created.city ? ` à ${created.city}` : ""}${input.services.length ? ` — ${input.services.join(", ")}` : ""}`
        ).slice(0, 2000),
        country: (created.country || "FR").slice(0, 2).toUpperCase(),
        link: `/garages/${created.slug}`,
        keywords: [created.name, created.city, ...input.services].filter(
          (x): x is string => typeof x === "string" && x.length > 0,
        ),
      }).catch(() => {});

      return created;
    }),

  // ── SUIVI INTERVENTION GARAGE (client voit chaque étape) ──
  updateIntervention: proProcedure
    .input(z.object({
      rdvId: z.number(),
      status: z.enum(["planifiee", "accueil", "diagnostic", "devis_envoye", "en_reparation", "controle_qualite", "pret", "termine", "annulee"]),
      detail: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const statusLabels: Record<string, string> = {
        planifiee: "Rendez-vous planifié",
        accueil: "Véhicule réceptionné",
        diagnostic: "Diagnostic en cours",
        devis_envoye: "Devis envoyé",
        en_reparation: "Réparation en cours",
        controle_qualite: "Contrôle qualité",
        pret: "Véhicule prêt — à récupérer",
        termine: "Intervention terminée",
        annulee: "Intervention annulée",
      };

      // Update RDV status
      const [rdv] = await db.update(rdvGarage)
        .set({ status: input.status as "en_attente", updatedAt: new Date() })
        .where(eq(rdvGarage.id, input.rdvId))
        .returning();
      if (!rdv) throw new TRPCError({ code: "NOT_FOUND" });

      // Service tracking event
      await db.insert(serviceTracking).values({
        userId: rdv.clientId,
        serviceType: "garage",
        serviceId: rdv.id,
        reference: `RDV-${rdv.id}`,
        titre: `Intervention garage`,
        status: input.status,
        statusLabel: statusLabels[input.status] ?? input.status,
        detail: input.detail,
      });

      // Notification client
      await db.insert(notifications).values({
        userId: rdv.clientId,
        type: "garage",
        title: `Garage — ${statusLabels[input.status]}`,
        body: input.detail ?? `Votre véhicule est maintenant : ${statusLabels[input.status]}.`,
        url: "/compte",
      });

      // Point 48 — intervention réellement terminée → demande d'avis vérifiée.
      if (input.status === "termine") {
        const [garage] = await db
          .select({ name: garagesPublics.name, country: garagesPublics.country })
          .from(garagesPublics)
          .where(eq(garagesPublics.id, rdv.garageId))
          .limit(1);
        await requestReviewAfterCompletion({
          userId: rdv.clientId,
          targetType: "garage",
          targetId: rdv.garageId,
          univers: "garage",
          transactionType: "rdv_garage",
          transactionId: rdv.id,
          countryCode: garage?.country ?? null,
          triggerReason: "intervention_terminee",
          libelle: `Votre intervention chez ${garage?.name ?? "le garage"} est terminée.`,
        }).catch(() => {});
      }

      return rdv;
    }),

  // Client: voir le suivi de ses interventions garage
  myInterventions: protectedProcedure.query(async ({ ctx }) => {
    const rdvs = await db.select().from(rdvGarage)
      .where(eq(rdvGarage.clientId, ctx.user.uid))
      .orderBy(desc(rdvGarage.createdAt));
    return rdvs;
  }),
});
