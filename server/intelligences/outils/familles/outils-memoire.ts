/**
 * MKA.P-MS AI — implémentations réelles de la famille "memoire"
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
  "automobile.rechercherMemoire": async (args) => {
    const ake = await import("../../../knowledge-engine/service.js");
    const texte = typeof args.recherche === "string" ? args.recherche.trim().slice(0, 120) : "";
    const limite = typeof args.limite === "number" && Number.isFinite(args.limite) ? Math.min(60, Math.max(1, Math.trunc(args.limite))) : 20;
    if (!texte) {
      const lignes = await db.execute(sql`SELECT domain, kind, count(*)::int AS n, count(*) FILTER (WHERE status = 'confirme')::int AS confirmes FROM ake_nodes GROUP BY domain, kind ORDER BY domain, kind`);
      const sources = await db.execute(sql`SELECT code, label, status, ever_synced AS "synchronisee", last_sync_at AS "derniere", last_sync_detail AS "detail" FROM ake_sources ORDER BY code`);
      return { etat: { noeuds: (lignes as unknown as { rows?: unknown[] }).rows ?? lignes, sources: (sources as unknown as { rows?: unknown[] }).rows ?? sources } };
    }
    const lignes = await ake.searchNodes({
      query: texte,
      domain: typeof args.domaine === "string" ? args.domaine : undefined,
      limit: limite * 3,
    });
    const type = typeof args.type === "string" ? args.type : "";
    const filtrees = (type ? lignes.filter((l) => l.kind === type) : lignes).slice(0, limite);
    return {
      resultats: filtrees.map((l) => ({
        domaine: l.domain,
        type: l.kind,
        libelle: l.label,
        resume: (l.summary ?? "").slice(0, 400),
        statut: l.status,
        observations: l.observations,
        verifie: l.status === "confirme",
      })),
      note: filtrees.length === 0 ? "Rien dans la mémoire automobile pour cette recherche : ne pas deviner." : undefined,
    };
  },

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
