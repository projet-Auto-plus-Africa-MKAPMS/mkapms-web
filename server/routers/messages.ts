import { z } from "zod";
import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db.js";
import { messageThreads, messages, annonces, users } from "../schema.js";

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
  return { id: u.id, nom: u.companyName || u.name || "Vendeur", role: u.role };
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
      return {
        id: t.id,
        annonceId: t.annonceId,
        annonce: a ? { id: a.id, titre: a.titre, reference: a.reference, type: a.type } : null,
        other,
        messages: msgs.map((m) => ({
          id: m.id,
          content: m.content,
          mine: m.senderId === uid,
          createdAt: m.createdAt,
          status: m.status,
        })),
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

      const [msg] = await db
        .insert(messages)
        .values({ threadId: input.threadId, senderId: uid, content: input.content })
        .returning();
      await db
        .update(messageThreads)
        .set({ lastMessageAt: new Date() })
        .where(eq(messageThreads.id, input.threadId));
      return { id: msg.id };
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
