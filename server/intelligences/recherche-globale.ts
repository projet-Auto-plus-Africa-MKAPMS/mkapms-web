/**
 * LOT IA02F, point 9 — Search Engine interne centralisé.
 *
 * Cherche dans les cinq types de contexte séparés (conversations, mémoire
 * utilisateur, mémoire projet, fichiers, base de connaissances) sans les
 * mélanger : chaque source garde son filtre de permission propre, appliqué
 * AVANT tout retour de résultat — jamais un résultat d'un autre compte ou
 * d'un autre projet, jamais une conversation d'un autre compte.
 *
 * Distinct de server/search-os/ (moteur marketplace : annonces, garages,
 * villes, services — un domaine entièrement différent, pas dupliqué ici).
 */
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { inMemoire, inMessages, inSessions } from "./schema.js";
import { rechercherDansFichiers } from "./fichiers.js";
import { rechercher as rechercherConnaissance, type CategorieConnaissance } from "./connaissance.js";
import { lister as listerMemoireUtilisateur } from "./memoire-utilisateur.js";
import { tracerRetrieval } from "./retrieval-audit.js";
import { versTsQuery } from "./recherche-texte.js";
import { randomUUID } from "node:crypto";

export type SourceRecherche = "conversation" | "memoire" | "memoire_entreprise" | "fichier" | "connaissance";

export interface ResultatRecherche {
  source: SourceRecherche;
  id: number | string;
  titre: string;
  extrait: string;
  score: number;
  date: Date | null;
  projetId: number | null;
}

async function chercherConversations(query: string, userId: number, limit: number): Promise<ResultatRecherche[]> {
  const tsq = versTsQuery(query);
  if (!tsq) return [];
  const lignes = await db
    .select({
      id: inMessages.id,
      sessionId: inMessages.sessionId,
      contenu: inMessages.contenu,
      createdAt: inMessages.createdAt,
      score: sql<number>`ts_rank(to_tsvector('french', ${inMessages.contenu}), to_tsquery('french', ${tsq}))`,
    })
    .from(inMessages)
    .innerJoin(inSessions, eq(inSessions.id, inMessages.sessionId))
    .where(
      and(
        eq(inSessions.userId, userId),
        sql`to_tsvector('french', ${inMessages.contenu}) @@ to_tsquery('french', ${tsq})`,
      ),
    )
    .orderBy(sql`ts_rank(to_tsvector('french', ${inMessages.contenu}), to_tsquery('french', ${tsq})) desc`)
    .limit(limit);

  return lignes.map((l) => ({
    source: "conversation" as const,
    id: l.id,
    titre: `Message #${l.id} (conversation #${l.sessionId})`,
    extrait: l.contenu.slice(0, 300),
    score: Number(l.score),
    date: l.createdAt,
    projetId: null,
  }));
}

async function chercherMemoire(query: string, userId: number, limit: number): Promise<ResultatRecherche[]> {
  const q = query.toLowerCase();
  const entrees = await listerMemoireUtilisateur(userId);
  return entrees
    .filter((e) => e.contenu.toLowerCase().includes(q) || e.cle.toLowerCase().includes(q))
    .slice(0, limit)
    .map((e) => ({
      source: "memoire" as const,
      id: e.id,
      titre: `[${e.categorie}] ${e.cle}`,
      extrait: e.contenu.slice(0, 300),
      score: 1,
      date: e.updatedAt,
      projetId: null,
    }));
}

/**
 * Mémoire d'entreprise (memoire.ts, in_memoire — 13 catégories globales,
 * dont "conversations", alimentée automatiquement par conversation-resume.ts
 * après chaque échange direction) : requête directe et minimale, distincte de
 * memoire.rechercher() qui fédère en plus code_graph/knowledge_engine/
 * expériences — déjà couverts séparément par contexteDirection() dans
 * service.ts, pas la peine de les redemander ici.
 */
async function chercherMemoireEntreprise(query: string, limit: number): Promise<ResultatRecherche[]> {
  const motif = `%${query}%`;
  const lignes = await db
    .select()
    .from(inMemoire)
    .where(
      and(
        eq(inMemoire.cycle, "actif"),
        or(ilike(inMemoire.titre, motif), ilike(inMemoire.contenu, motif), ilike(inMemoire.cle, motif)),
      ),
    )
    .orderBy(desc(inMemoire.updatedAt))
    .limit(limit);

  return lignes.map((l) => ({
    source: "memoire_entreprise" as const,
    id: l.id,
    titre: `[${l.categorie}] ${l.titre}`,
    extrait: l.contenu.slice(0, 300),
    score: 1,
    date: l.updatedAt,
    projetId: null,
  }));
}

export interface OptionsRechercheGlobale {
  sources?: SourceRecherche[];
  visibiliteConnaissance?: string[];
  limit?: number;
  sessionId?: number | null;
  projetId?: number | null;
}

/**
 * Recherche unifiée. `visibiliteConnaissance` doit venir d'une vérification
 * de rôle réelle côté appelant (jamais "tout autoriser" par défaut) — voir
 * server/intelligences/index.ts.
 */
export async function rechercherGlobale(query: string, userId: number, options: OptionsRechercheGlobale = {}): Promise<ResultatRecherche[]> {
  const debut = Date.now();
  const traceId = randomUUID();
  const limit = options.limit ?? 10;
  const sources = options.sources ?? ["conversation", "memoire", "fichier", "connaissance"];
  const q = query.trim();
  if (!q) return [];

  const resultats: ResultatRecherche[] = [];

  if (sources.includes("conversation")) resultats.push(...(await chercherConversations(q, userId, limit)));
  if (sources.includes("memoire")) resultats.push(...(await chercherMemoire(q, userId, limit)));
  if (sources.includes("memoire_entreprise")) resultats.push(...(await chercherMemoireEntreprise(q, limit)));
  if (sources.includes("fichier")) {
    const r = await rechercherDansFichiers(q, userId, limit);
    resultats.push(
      ...r.map((f) => ({ source: "fichier" as const, id: `${f.fichierId}:${f.ordre}`, titre: f.nom, extrait: f.extrait, score: f.score, date: null, projetId: null })),
    );
  }
  if (sources.includes("connaissance")) {
    const r = await rechercherConnaissance(q, options.visibiliteConnaissance ?? ["interne"], limit);
    resultats.push(...r.map((k) => ({ source: "connaissance" as const, id: k.id, titre: `[${k.categorie}] ${k.titre}`, extrait: k.extrait, score: k.score, date: null, projetId: null })));
  }

  resultats.sort((a, b) => b.score - a.score);
  const finaux = resultats.slice(0, limit * sources.length);

  await tracerRetrieval({
    userId,
    projetId: options.projetId ?? null,
    sessionId: options.sessionId ?? null,
    source: "global",
    requete: q,
    resultIds: finaux.map((r) => r.id),
    scores: finaux.map((r) => r.score),
    permissionsAppliquees: `userId=${userId}, sources=${sources.join(",")}`,
    dureeMs: Date.now() - debut,
    traceId,
  });

  return finaux;
}
