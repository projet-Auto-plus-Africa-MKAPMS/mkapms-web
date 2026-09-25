/**
 * Liste d'attente (ListeAttente.tsx) — aucun moteur n'existait avant : la
 * page affichait 3 entrées 100% fabriquées, dont une avec un faux statut
 * "disponible" prêt à réserver.
 *
 * join/list/cancel sont réels : la position affichée est toujours recalculée
 * en direct (rang réel parmi les inscriptions "en_attente" antérieures sur
 * la même annonce), jamais stockée ni devinée.
 *
 * Le statut "disponible" du mock d'origine n'a pas d'équivalent réel : cette
 * plateforme n'a aujourd'hui aucun moteur de verrou de disponibilité/
 * calendrier pour la location (aucune annonce n'est jamais marquée "louee"
 * par le code existant — vérifié : recherche vide dans tout server/). Sans
 * cette brique (tâches #44/#56 — flux de paiement location + réservation
 * flotte), il n'existe aucun signal réel de "ce véhicule vient de se
 * libérer" à observer. Plutôt que d'inventer une transition automatique,
 * ce routeur ne construit que ce qui est vérifiable aujourd'hui : une vraie
 * inscription, une vraie position, une vraie annulation.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { waitlistEntries, annonces, annoncePhotos } from "../schema.js";

export const waitlistRouter = router({
  join: protectedProcedure
    .input(z.object({ annonceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const [annonce] = await db
        .select({ id: annonces.id, type: annonces.type, ownerId: annonces.ownerId })
        .from(annonces)
        .where(eq(annonces.id, input.annonceId))
        .limit(1);
      if (!annonce) throw new TRPCError({ code: "NOT_FOUND", message: "Annonce introuvable" });
      if (annonce.type !== "location") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La liste d'attente n'existe que pour les annonces de location" });
      }
      if (annonce.ownerId === ctx.user.uid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Impossible de s'inscrire sur sa propre annonce" });
      }
      const [existant] = await db
        .select({ id: waitlistEntries.id })
        .from(waitlistEntries)
        .where(and(eq(waitlistEntries.userId, ctx.user.uid), eq(waitlistEntries.annonceId, input.annonceId), eq(waitlistEntries.status, "en_attente")))
        .limit(1);
      if (existant) throw new TRPCError({ code: "CONFLICT", message: "Déjà inscrit sur la liste d'attente pour cette annonce" });

      const [created] = await db.insert(waitlistEntries).values({ userId: ctx.user.uid, annonceId: input.annonceId }).returning();
      return created;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const mine = await db
      .select()
      .from(waitlistEntries)
      .where(eq(waitlistEntries.userId, ctx.user.uid))
      .orderBy(desc(waitlistEntries.createdAt));
    if (!mine.length) return [];

    const ids = [...new Set(mine.map((m) => m.annonceId))];
    const annoncesRows = await db
      .select({ id: annonces.id, titre: annonces.titre, marque: annonces.marque, modele: annonces.modele, prixJour: annonces.prixJour, prix: annonces.prix })
      .from(annonces)
      .where(inArray(annonces.id, ids));
    const annonceMap = new Map(annoncesRows.map((a) => [a.id, a]));

    const photos = await db.select().from(annoncePhotos).where(inArray(annoncePhotos.annonceId, ids)).orderBy(annoncePhotos.ordre);
    const photoMap = new Map<number, string>();
    for (const p of photos) if (!photoMap.has(p.annonceId!)) photoMap.set(p.annonceId!, p.url);

    // Position réelle : rang parmi les inscriptions "en_attente" antérieures
    // sur la même annonce — jamais une valeur stockée qui pourrait se périmer.
    const positions = new Map<number, number>();
    for (const m of mine) {
      if (m.status !== "en_attente") continue;
      const [r] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(waitlistEntries)
        .where(and(eq(waitlistEntries.annonceId, m.annonceId), eq(waitlistEntries.status, "en_attente"), sql`${waitlistEntries.createdAt} < ${m.createdAt}`));
      positions.set(m.id, (r?.n ?? 0) + 1);
    }

    return mine.map((m) => ({
      id: m.id,
      annonceId: m.annonceId,
      status: m.status,
      createdAt: m.createdAt,
      position: positions.get(m.id) ?? null,
      annonce: annonceMap.get(m.annonceId) ?? null,
      photo: photoMap.get(m.annonceId) ?? null,
    }));
  }),

  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const changed = await db
        .update(waitlistEntries)
        .set({ status: "annule" })
        .where(and(eq(waitlistEntries.id, input.id), eq(waitlistEntries.userId, ctx.user.uid), eq(waitlistEntries.status, "en_attente")))
        .returning({ id: waitlistEntries.id });
      if (!changed.length) throw new TRPCError({ code: "NOT_FOUND", message: "Inscription introuvable ou déjà annulée" });
      return { ok: true };
    }),
});
