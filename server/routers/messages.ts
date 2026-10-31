import { z } from "zod";
import { and, desc, eq, inArray, ne, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { messageThreads, messages, messageOffers, annonces, users } from "../schema.js";
import { assertCanSend } from "../messaging-os/index.js";
import { notifyEvent } from "../notification-os/triggers.js";
import { nomPublic } from "../identity-os/identite-officielle.js";

/**
 * Messagerie interne MKA.P-MS — conversations liées à une annonce et à un
 * vendeur précis (comme LeBonCoin / La Centrale). Chaque annonce d'un même
 * vendeur ouvre sa propre conversation.
 */

/** Résout le vendeur d'une annonce + un aperçu pour l'en-tête de conversation. */
async function loadAnnonce(annonceId: number) {
  const [a] = await db
    .select({
      id: annonces.id,
      reference: annonces.reference,
      titre: annonces.titre,
      ownerId: annonces.ownerId,
      type: annonces.type,
      // Demande Direction (26/10) : le lien du produit affiché en messagerie
      // doit porter le prix, côté client comme côté propriétaire — jamais
      // seulement un titre. categorieAnnonce/vendeurType servent à construire
      // l'URL directe du bon univers (getAnnonceUrl), sans passer par la
      // route générique /vehicule/:id et sa redirection.
      prix: annonces.prix,
      categorieAnnonce: annonces.categorieAnnonce,
      vendeurType: annonces.vendeurType,
      // Négociation structurée (proposerOffre) : le client a besoin de
      // savoir si l'offre est proposable, et dans quelle devise l'afficher.
      negociable: annonces.negociable,
      devise: annonces.devise,
    })
    .from(annonces)
    .where(eq(annonces.id, annonceId))
    .limit(1);
  return a ?? null;
}

async function partyInfo(userId: number) {
  const [u] = await db
    .select({ id: users.id, name: users.name, companyName: users.companyName, role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return { id: userId, nom: "Vendeur" };
  return { id: u.id, nom: nomPublic(u), role: u.role };
}

export const messagesRouter = router({
  /**
   * Ouvre (ou crée) la conversation entre l'utilisateur courant et le vendeur
   * de l'annonce donnée. Renvoie l'identifiant du fil.
   */
  openThread: protectedProcedure
    .input(z.object({ annonceId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const a = await loadAnnonce(input.annonceId);
      if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "Annonce introuvable" });

      const buyer = ctx.user.uid;
      const seller = a.ownerId;
      if (buyer === seller) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Vous êtes le vendeur de cette annonce." });
      }

      const [existing] = await db
        .select()
        .from(messageThreads)
        .where(
          and(
            eq(messageThreads.annonceId, input.annonceId),
            or(
              and(eq(messageThreads.user1Id, buyer), eq(messageThreads.user2Id, seller)),
              and(eq(messageThreads.user1Id, seller), eq(messageThreads.user2Id, buyer)),
            ),
          ),
        )
        .limit(1);
      if (existing) return { threadId: existing.id };

      const [created] = await db
        .insert(messageThreads)
        .values({ user1Id: buyer, user2Id: seller, annonceId: input.annonceId })
        .returning();
      return { threadId: created.id };
    }),

  /** Liste des conversations de l'utilisateur, plus récente en premier. */
  listThreads: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.user.uid;
    const rows = await db
      .select()
      .from(messageThreads)
      .where(or(eq(messageThreads.user1Id, uid), eq(messageThreads.user2Id, uid)))
      .orderBy(desc(messageThreads.lastMessageAt));

    const result = [];
    for (const t of rows) {
      const otherId = t.user1Id === uid ? t.user2Id : t.user1Id;
      const other = await partyInfo(otherId);
      const a = t.annonceId ? await loadAnnonce(t.annonceId) : null;
      const [last] = await db
        .select({ content: messages.content, createdAt: messages.createdAt })
        .from(messages)
        .where(eq(messages.threadId, t.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      const [unread] = await db
        .select({ n: sql<number>`count(*)::int` })
        .from(messages)
        .where(
          and(
            eq(messages.threadId, t.id),
            ne(messages.senderId, uid),
            eq(messages.status, "envoye"),
          ),
        );
      result.push({
        id: t.id,
        annonceId: t.annonceId,
        annonceTitre: a?.titre ?? null,
        annonceRef: a?.reference ?? null,
        annoncePrix: a?.prix ?? null,
        annonceCategorieAnnonce: a?.categorieAnnonce ?? null,
        annonceVendeurType: a?.vendeurType ?? null,
        other,
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.createdAt ?? t.lastMessageAt,
        unread: unread?.n ?? 0,
      });
    }
    return result;
  }),

  /** Contenu d'une conversation (messages + en-tête). */
  getThread: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const uid = ctx.user.uid;
      const [t] = await db.select().from(messageThreads).where(eq(messageThreads.id, input.id)).limit(1);
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      if (t.user1Id !== uid && t.user2Id !== uid) throw new TRPCError({ code: "FORBIDDEN" });

      const otherId = t.user1Id === uid ? t.user2Id : t.user1Id;
      const other = await partyInfo(otherId);
      const a = t.annonceId ? await loadAnnonce(t.annonceId) : null;
      const msgs = await db
        .select()
        .from(messages)
        .where(eq(messages.threadId, t.id))
        .orderBy(messages.createdAt);

      const offerIds = msgs.map((m) => m.offerId).filter((id): id is number => id != null);
      const offerRows = offerIds.length
        ? await db.select().from(messageOffers).where(inArray(messageOffers.id, offerIds))
        : [];
      const offerById = new Map(offerRows.map((o) => [o.id, o]));

      return {
        id: t.id,
        annonceId: t.annonceId,
        annonce: a ? { id: a.id, titre: a.titre, reference: a.reference, type: a.type, prix: a.prix, categorieAnnonce: a.categorieAnnonce, vendeurType: a.vendeurType, negociable: a.negociable, devise: a.devise } : null,
        other,
        messages: msgs.map((m) => {
          const o = m.offerId != null ? offerById.get(m.offerId) : null;
          return {
            id: m.id,
            content: m.content,
            mine: m.senderId === uid,
            createdAt: m.createdAt,
            status: m.status,
            // Négociation structurée : présent uniquement sur le message qui
            // porte une offre/contre-offre/réponse. Le statut dit si c'est
            // encore à l'autre partie de répondre (voir Messagerie.tsx).
            offer: o ? { id: o.id, montant: o.montant, devise: o.devise, status: o.status } : null,
          };
        }),
      };
    }),

  /** Envoi d'un message dans une conversation existante. */
  send: protectedProcedure
    .input(z.object({ threadId: z.number(), content: z.string().trim().min(1).max(4000) }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.user.uid;
      const [t] = await db.select().from(messageThreads).where(eq(messageThreads.id, input.threadId)).limit(1);
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      if (t.user1Id !== uid && t.user2Id !== uid) throw new TRPCError({ code: "FORBIDDEN" });

      const recipientId = t.user1Id === uid ? t.user2Id : t.user1Id;
      await assertCanSend(uid, recipientId, input.content);

      const [msg] = await db
        .insert(messages)
        .values({ threadId: input.threadId, senderId: uid, content: input.content })
        .returning();
      await db
        .update(messageThreads)
        .set({ lastMessageAt: new Date() })
        .where(eq(messageThreads.id, input.threadId));
      await notifyEvent({
        userId: recipientId,
        event: "message_nouveau",
        url: `/messagerie?thread=${input.threadId}`,
      }).catch(() => undefined);
      return { id: msg.id };
    }),

  /**
   * Propose un prix sur l'annonce du fil — une offre structurée, pas un
   * message texte à interpréter : l'autre partie peut l'accepter, la
   * refuser ou contre-offrir via repondreOffre. Une seule offre en attente
   * à la fois par fil (répondre à celle en cours plutôt qu'en ouvrir une
   * seconde en parallèle).
   */
  proposerOffre: protectedProcedure
    .input(z.object({ threadId: z.number(), montant: z.number().positive().max(100_000_000) }))
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.user.uid;
      const [t] = await db.select().from(messageThreads).where(eq(messageThreads.id, input.threadId)).limit(1);
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      if (t.user1Id !== uid && t.user2Id !== uid) throw new TRPCError({ code: "FORBIDDEN" });
      if (!t.annonceId) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette conversation n'est liée à aucune annonce." });

      const [a] = await db
        .select({ id: annonces.id, negociable: annonces.negociable, status: annonces.status, devise: annonces.devise })
        .from(annonces)
        .where(eq(annonces.id, t.annonceId))
        .limit(1);
      if (!a) throw new TRPCError({ code: "NOT_FOUND", message: "Annonce introuvable." });
      if (!a.negociable) throw new TRPCError({ code: "BAD_REQUEST", message: "Cette annonce n'est pas négociable." });
      if (a.status !== "publiee") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette annonce n'est plus disponible à la négociation." });

      const [enCours] = await db
        .select({ id: messageOffers.id })
        .from(messageOffers)
        .where(and(eq(messageOffers.threadId, input.threadId), eq(messageOffers.status, "en_attente")))
        .limit(1);
      if (enCours) throw new TRPCError({ code: "BAD_REQUEST", message: "Une offre est déjà en attente de réponse sur ce fil." });

      const recipientId = t.user1Id === uid ? t.user2Id : t.user1Id;
      const content = `💰 Offre proposée : ${input.montant.toLocaleString("fr-FR")} ${a.devise}`;
      await assertCanSend(uid, recipientId, content);

      const [offre] = await db
        .insert(messageOffers)
        .values({ threadId: input.threadId, annonceId: a.id, fromUserId: uid, montant: String(input.montant), devise: a.devise })
        .returning();
      const [msg] = await db
        .insert(messages)
        .values({ threadId: input.threadId, senderId: uid, content, offerId: offre.id })
        .returning();
      await db.update(messageThreads).set({ lastMessageAt: new Date() }).where(eq(messageThreads.id, input.threadId));
      await notifyEvent({
        userId: recipientId,
        event: "offre_recue",
        url: `/messagerie?thread=${input.threadId}`,
        vars: { montant: input.montant.toLocaleString("fr-FR"), devise: a.devise },
      }).catch(() => undefined);
      return { id: msg.id, offerId: offre.id };
    }),

  /** Répond à une offre en attente : acceptée, refusée, ou contre-offre. */
  repondreOffre: protectedProcedure
    .input(
      z.object({
        offerId: z.number(),
        decision: z.enum(["acceptee", "refusee", "contre_offre"]),
        contreMontant: z.number().positive().max(100_000_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.user.uid;
      const [offre] = await db.select().from(messageOffers).where(eq(messageOffers.id, input.offerId)).limit(1);
      if (!offre) throw new TRPCError({ code: "NOT_FOUND" });
      const [t] = await db.select().from(messageThreads).where(eq(messageThreads.id, offre.threadId)).limit(1);
      if (!t) throw new TRPCError({ code: "NOT_FOUND" });
      if (t.user1Id !== uid && t.user2Id !== uid) throw new TRPCError({ code: "FORBIDDEN" });
      if (offre.fromUserId === uid) throw new TRPCError({ code: "BAD_REQUEST", message: "Vous ne pouvez pas répondre à votre propre offre." });
      if (offre.status !== "en_attente") throw new TRPCError({ code: "BAD_REQUEST", message: "Cette offre n'est plus en attente de réponse." });
      if (input.decision === "contre_offre" && input.contreMontant == null) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Montant de la contre-offre manquant." });
      }

      const recipientId = offre.fromUserId;

      if (input.decision === "acceptee") {
        await db.update(messageOffers).set({ status: "acceptee", repondueA: new Date() }).where(eq(messageOffers.id, offre.id));
        const content = `✅ Offre acceptée : ${Number(offre.montant).toLocaleString("fr-FR")} ${offre.devise}`;
        await assertCanSend(uid, recipientId, content);
        const [msg] = await db.insert(messages).values({ threadId: offre.threadId, senderId: uid, content, offerId: offre.id }).returning();
        await db.update(messageThreads).set({ lastMessageAt: new Date() }).where(eq(messageThreads.id, offre.threadId));
        await notifyEvent({
          userId: recipientId,
          event: "offre_acceptee",
          url: `/messagerie?thread=${offre.threadId}`,
          vars: { montant: Number(offre.montant).toLocaleString("fr-FR"), devise: offre.devise },
        }).catch(() => undefined);
        return { id: msg.id, status: "acceptee" as const };
      }

      if (input.decision === "refusee") {
        await db.update(messageOffers).set({ status: "refusee", repondueA: new Date() }).where(eq(messageOffers.id, offre.id));
        const content = `❌ Offre refusée`;
        await assertCanSend(uid, recipientId, content);
        const [msg] = await db.insert(messages).values({ threadId: offre.threadId, senderId: uid, content, offerId: offre.id }).returning();
        await db.update(messageThreads).set({ lastMessageAt: new Date() }).where(eq(messageThreads.id, offre.threadId));
        await notifyEvent({ userId: recipientId, event: "offre_refusee", url: `/messagerie?thread=${offre.threadId}` }).catch(() => undefined);
        return { id: msg.id, status: "refusee" as const };
      }

      const montant = input.contreMontant!;
      await db.update(messageOffers).set({ status: "contre_offre", repondueA: new Date() }).where(eq(messageOffers.id, offre.id));
      const content = `💰 Contre-offre : ${montant.toLocaleString("fr-FR")} ${offre.devise}`;
      await assertCanSend(uid, recipientId, content);
      const [nouvelle] = await db
        .insert(messageOffers)
        .values({
          threadId: offre.threadId,
          annonceId: offre.annonceId,
          fromUserId: uid,
          montant: String(montant),
          devise: offre.devise,
          precedenteOffreId: offre.id,
        })
        .returning();
      const [msg] = await db.insert(messages).values({ threadId: offre.threadId, senderId: uid, content, offerId: nouvelle.id }).returning();
      await db.update(messageThreads).set({ lastMessageAt: new Date() }).where(eq(messageThreads.id, offre.threadId));
      await notifyEvent({
        userId: recipientId,
        event: "offre_recue",
        url: `/messagerie?thread=${offre.threadId}`,
        vars: { montant: montant.toLocaleString("fr-FR"), devise: offre.devise },
      }).catch(() => undefined);
      return { id: msg.id, offerId: nouvelle.id, status: "contre_offre" as const };
    }),

  /** Marque comme lus les messages reçus dans une conversation. */
  markRead: protectedProcedure
    .input(z.object({ threadId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .update(messages)
        .set({ status: "lu" })
        .where(
          and(
            eq(messages.threadId, input.threadId),
            ne(messages.senderId, ctx.user.uid),
            eq(messages.status, "envoye"),
          ),
        );
      return { ok: true };
    }),

  /** Nombre total de messages non lus (pour la pastille). */
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.user.uid;
    const [row] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(messages)
      .innerJoin(messageThreads, eq(messages.threadId, messageThreads.id))
      .where(
        and(
          or(eq(messageThreads.user1Id, uid), eq(messageThreads.user2Id, uid)),
          ne(messages.senderId, uid),
          eq(messages.status, "envoye"),
        ),
      );
    return row?.n ?? 0;
  }),
});
