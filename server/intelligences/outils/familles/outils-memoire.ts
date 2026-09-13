/**
 * MKA.P-MS Intelligence — implémentations réelles de la famille "memoire"
 * (server/intelligences/outils/familles/memoire.ts).
 *
 * `contexte.actorId` est l'identifiant de la session authentifiée qui a
 * lancé la boucle d'outils — jamais un userId transmis par le modèle dans
 * ses arguments, qu'il pourrait falsifier.
 */
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../db.js";
import { inMessages, inSessions } from "../../schema.js";
import * as memoireUtilisateur from "../../memoire-utilisateur.js";
import * as memoireProjet from "../../memoire-projet.js";
import { versTsQuery } from "../../recherche-texte.js";
import type { ImplementationOutil } from "../outils-test.js";

function exigerActeur(contexte?: { actorId?: number | null }): number {
  if (!contexte?.actorId) throw new Error("Aucun compte authentifié pour cet outil de mémoire.");
  return contexte.actorId;
}

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "memory.read": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    const entrees = await memoireUtilisateur.lister(userId, typeof args.categorie === "string" ? args.categorie : undefined);
    return { entrees };
  },

  "memory.write": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    const entree = await memoireUtilisateur.ecrire({
      userId,
      categorie: String(args.categorie ?? "preference"),
      cle: String(args.cle ?? ""),
      contenu: String(args.contenu ?? ""),
      actorId: userId,
    });
    return { id: entree.id };
  },

  "memory.update": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    if (typeof args.id !== "number") throw new Error("id requis.");
    const entree = await memoireUtilisateur.modifier({ id: args.id, userId, contenu: typeof args.contenu === "string" ? args.contenu : undefined });
    return { id: entree.id };
  },

  "memory.delete": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    if (typeof args.id !== "number") throw new Error("id requis.");
    await memoireUtilisateur.supprimer(args.id, userId);
    return { ok: true };
  },

  "conversation.search": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    const tsq = versTsQuery(String(args.q ?? ""));
    if (!tsq) return { resultats: [] };
    const lignes = await db
      .select({ id: inMessages.id, sessionId: inMessages.sessionId, contenu: inMessages.contenu, createdAt: inMessages.createdAt })
      .from(inMessages)
      .innerJoin(inSessions, eq(inSessions.id, inMessages.sessionId))
      .where(and(eq(inSessions.userId, userId), sql`to_tsvector('french', ${inMessages.contenu}) @@ to_tsquery('french', ${tsq})`))
      .limit(10);
    return { resultats: lignes.map((l) => ({ id: l.id, sessionId: l.sessionId, extrait: l.contenu.slice(0, 300), date: l.createdAt })) };
  },

  "project.memory.read": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    if (typeof args.projetId !== "number") throw new Error("projetId requis.");
    const entrees = await memoireProjet.lire(args.projetId, userId);
    return { entrees };
  },

  "project.memory.write": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    if (typeof args.projetId !== "number") throw new Error("projetId requis.");
    const entree = await memoireProjet.ecrire({
      projetId: args.projetId,
      ownerId: userId,
      type: (args.type as never) ?? "decision",
      titre: String(args.titre ?? ""),
      contenu: String(args.contenu ?? ""),
    });
    return { id: entree.id };
  },
};
