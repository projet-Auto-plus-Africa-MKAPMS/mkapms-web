import { z } from "zod";
import { and, desc, eq, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure, proProcedure } from "../trpc.js";
import { db } from "../db.js";
import { notifyEvent } from "../notification-os/triggers.js";
import { annonces, garagesPublics, rdvGarage, serviceTracking, users } from "../schema.js";
import { ingest as ingestVisibility } from "../visibility-os/index.js";
import { requestReviewAfterCompletion } from "../reputation-engine/service.js";
import { alertesStock, tracerReportRdv } from "../atelier-engine/service.js";
import { scheduleTask } from "../scheduler-os/index.js";

/**
 * Étapes d'une intervention atelier, déclarées par le moteur : code, libellé
 * montré au client et ordre. Les écrans (Atelier Pro, suivi client) lisent
 * cette liste au lieu d'en tenir une copie.
 */
export const ETAPES_INTERVENTION = [
  { code: "planifiee", libelle: "Rendez-vous planifié", ordre: 1 },
  { code: "accueil", libelle: "Véhicule réceptionné", ordre: 2 },
  { code: "diagnostic", libelle: "Diagnostic en cours", ordre: 3 },
  { code: "devis_envoye", libelle: "Devis envoyé", ordre: 4 },
  { code: "en_reparation", libelle: "Réparation en cours", ordre: 5 },
  { code: "controle_qualite", libelle: "Contrôle qualité", ordre: 6 },
  { code: "pret", libelle: "Véhicule prêt — à récupérer", ordre: 7 },
  { code: "termine", libelle: "Intervention terminée", ordre: 8 },
  { code: "annulee", libelle: "Intervention annulée", ordre: 9 },
] as const;

export type CodeEtapeIntervention = (typeof ETAPES_INTERVENTION)[number]["code"];
const CODES_ETAPES = ETAPES_INTERVENTION.map((e) => e.code) as [CodeEtapeIntervention, ...CodeEtapeIntervention[]];
const LIBELLES_ETAPES: Record<CodeEtapeIntervention, string> = Object.fromEntries(
  ETAPES_INTERVENTION.map((e) => [e.code, e.libelle]),
) as Record<CodeEtapeIntervention, string>;
const RAPPEL_RDV_AVANT_MS = 24 * 3600000;

/**
 * Un professionnel n'agit que sur les rendez-vous de ses propres garages.
 * Sans ce contrôle, `proProcedure` laissait n'importe quel compte pro modifier
 * l'intervention d'un confrère.
 */
async function rdvDeMesGarages(userId: number, rdvId: number) {
  const [ligne] = await db
    .select({ rdv: rdvGarage, ownerId: garagesPublics.ownerId })
    .from(rdvGarage)
    .innerJoin(garagesPublics, eq(garagesPublics.id, rdvGarage.garageId))
    .where(eq(rdvGarage.id, rdvId))
    .limit(1);

  if (!ligne) throw new TRPCError({ code: "NOT_FOUND", message: "Rendez-vous introuvable." });
  if (ligne.ownerId !== userId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Ce rendez-vous appartient à un garage qui n'est pas le vôtre.",
    });
  }
  return ligne.rdv;
}

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
      status: z.enum(CODES_ETAPES),
      detail: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await rdvDeMesGarages(ctx.user.uid, input.rdvId);

      const statusLabels = LIBELLES_ETAPES;

      // Update RDV status
      const [rdv] = await db.update(rdvGarage)
        .set({ status: input.status, updatedAt: new Date() })
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
      await notifyEvent({
        userId: rdv.clientId,
        event: "garage_statut",
        vars: {
          statut: statusLabels[input.status],
          detail: input.detail ?? `Votre véhicule est maintenant : ${statusLabels[input.status]}.`,
        },
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

  /**
   * Atelier Pro : synthèse calculée par le moteur pour les garages du compte.
   * Interventions (rdv_garage) avec client et véhicule, clients et véhicules
   * distincts, compteurs par étape et alertes de stock. L'écran n'affiche que
   * ce résultat ; aucun chiffre n'est fabriqué côté client.
   */
  atelierSynthese: proProcedure.query(async ({ ctx }) => {
    const miens = await db
      .select({ id: garagesPublics.id, name: garagesPublics.name })
      .from(garagesPublics)
      .where(eq(garagesPublics.ownerId, ctx.user.uid));
    const garageIds = miens.map((g) => g.id);
    if (garageIds.length === 0) {
      return {
        garages: miens,
        interventions: [],
        clients: [],
        vehicules: [],
        compteurs: {} as Record<string, number>,
        alertesStock: [],
        etapes: ETAPES_INTERVENTION,
      };
    }
    const lignes = await db
      .select({
        id: rdvGarage.id,
        garageId: rdvGarage.garageId,
        clientId: rdvGarage.clientId,
        annonceId: rdvGarage.annonceId,
        type: rdvGarage.type,
        status: rdvGarage.status,
        dateHeure: rdvGarage.dateHeure,
        motif: rdvGarage.motif,
        notes: rdvGarage.notes,
        updatedAt: rdvGarage.updatedAt,
        clientNom: users.name,
        clientEmail: users.email,
        clientPhone: users.phone,
        vehiculeMarque: annonces.marque,
        vehiculeModele: annonces.modele,
        vehiculeTitre: annonces.titre,
      })
      .from(rdvGarage)
      .leftJoin(users, eq(users.id, rdvGarage.clientId))
      .leftJoin(annonces, eq(annonces.id, rdvGarage.annonceId))
      .where(inArray(rdvGarage.garageId, garageIds))
      .orderBy(desc(rdvGarage.dateHeure))
      .limit(300);

    const compteurs: Record<string, number> = {};
    const clientsMap = new Map<number, { id: number; nom: string; email: string | null; phone: string | null; interventions: number; derniere: Date }>();
    const vehiculesMap = new Map<number, { annonceId: number; url: string; marque: string; modele: string; titre: string; interventions: number; derniere: Date }>();
    for (const l of lignes) {
      compteurs[l.status] = (compteurs[l.status] ?? 0) + 1;
      const c = clientsMap.get(l.clientId);
      if (c) {
        c.interventions += 1;
        if (l.dateHeure > c.derniere) c.derniere = l.dateHeure;
      } else {
        clientsMap.set(l.clientId, {
          id: l.clientId,
          nom: l.clientNom ?? `Client #${l.clientId}`,
          email: l.clientEmail,
          phone: l.clientPhone,
          interventions: 1,
          derniere: l.dateHeure,
        });
      }
      if (l.annonceId && l.vehiculeMarque && l.vehiculeModele) {
        const v = vehiculesMap.get(l.annonceId);
        if (v) {
          v.interventions += 1;
          if (l.dateHeure > v.derniere) v.derniere = l.dateHeure;
        } else {
          vehiculesMap.set(l.annonceId, {
            annonceId: l.annonceId,
            url: `/vehicule/${l.annonceId}`,
            marque: l.vehiculeMarque,
            modele: l.vehiculeModele,
            titre: l.vehiculeTitre ?? `${l.vehiculeMarque} ${l.vehiculeModele}`,
            interventions: 1,
            derniere: l.dateHeure,
          });
        }
      }
    }

    const alertes = await alertesStock(garageIds);

    return {
      garages: miens,
      interventions: lignes,
      clients: [...clientsMap.values()].sort((a, b) => b.derniere.getTime() - a.derniere.getTime()),
      vehicules: [...vehiculesMap.values()].sort((a, b) => b.derniere.getTime() - a.derniere.getTime()),
      compteurs,
      alertesStock: alertes,
      etapes: ETAPES_INTERVENTION,
    };
  }),

  // Atelier : rendez-vous réellement enregistrés pour les garages du compte.
  planningAtelier: proProcedure.query(async ({ ctx }) => {
    const miens = await db
      .select({ id: garagesPublics.id, name: garagesPublics.name })
      .from(garagesPublics)
      .where(eq(garagesPublics.ownerId, ctx.user.uid));
    if (miens.length === 0) return { garages: [], rdvs: [] };
    const rdvs = await db
      .select()
      .from(rdvGarage)
      .where(inArray(rdvGarage.garageId, miens.map((g) => g.id)))
      .orderBy(desc(rdvGarage.dateHeure))
      .limit(200);
    return { garages: miens, rdvs };
  }),

  /**
   * Report d'un rendez-vous : la date est réellement déplacée dans
   * `rdv_garage`, l'ancienne et la nouvelle date sont conservées par le Moteur
   * d'Atelier, et le client est prévenu. Un report non tracé, c'est un client
   * qui se présente pour rien.
   */
  reporterRdv: proProcedure
    .input(
      z.object({
        rdvId: z.number().int().positive(),
        nouvelleDate: z.string().min(1),
        motif: z.string().min(3).max(300),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const rdv = await rdvDeMesGarages(ctx.user.uid, input.rdvId);

      const nouvelleDate = new Date(input.nouvelleDate);
      if (Number.isNaN(nouvelleDate.getTime())) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Date de report illisible." });
      }
      if (nouvelleDate.getTime() <= Date.now()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Un rendez-vous ne peut pas être reporté à une date déjà passée.",
        });
      }

      const ancienneDate = rdv.dateHeure;
      const [maj] = await db
        .update(rdvGarage)
        .set({ dateHeure: nouvelleDate, updatedAt: new Date() })
        .where(eq(rdvGarage.id, rdv.id))
        .returning();

      await tracerReportRdv({
        rdvId: rdv.id,
        ancienneDate,
        nouvelleDate,
        motif: input.motif,
        parUser: ctx.user.uid,
      });

      if (nouvelleDate.getTime() - Date.now() > RAPPEL_RDV_AVANT_MS) {
        await scheduleTask({
          taskType: "rappel_rdv",
          runAt: new Date(nouvelleDate.getTime() - RAPPEL_RDV_AVANT_MS),
          userId: rdv.clientId,
          payload: { vars: { date: nouvelleDate.toLocaleString("fr-FR") }, url: "/compte", rdvId: rdv.id },
        });
      }

      await db.insert(serviceTracking).values({
        userId: rdv.clientId,
        serviceType: "garage",
        serviceId: rdv.id,
        reference: `RDV-${rdv.id}`,
        titre: "Intervention garage",
        status: "planifiee",
        statusLabel: "Rendez-vous reporté",
        detail: `Nouvelle date : ${nouvelleDate.toLocaleString("fr-FR")}. Motif : ${input.motif}`,
      });

      await notifyEvent({
        userId: rdv.clientId,
        event: "garage_rdv_reporte",
        vars: { date: nouvelleDate.toLocaleString("fr-FR"), motif: input.motif },
        url: "/compte",
      });

      return maj;
    }),

  // Client: voir le suivi de ses interventions garage
  myInterventions: protectedProcedure.query(async ({ ctx }) => {
    const rdvs = await db.select().from(rdvGarage)
      .where(eq(rdvGarage.clientId, ctx.user.uid))
      .orderBy(desc(rdvGarage.createdAt));
    return rdvs;
  }),
});
