/**
 * LOT IA02F, points 10-13 — RAG Engine.
 *
 * question → query understanding → retrieval → ranking → permission
 * filtering → context building → answer → citations.
 *
 * Retrieval réel aujourd'hui : recherche plein texte PostgreSQL (`ts_rank`),
 * jamais des embeddings — voir `embeddingGateway` ci-dessous, honnêtement
 * `unavailable` tant qu'aucun fournisseur n'est connecté (point 13). Le
 * classement par pertinence lexicale est réel, pas un classement inventé :
 * seule la MÉTHODE (lexicale plutôt que sémantique) est une limite déclarée,
 * jamais cachée (`method` sur chaque résultat).
 *
 * Règle absolue (point 12) : si aucune source n'est trouvée ou accessible,
 * la réponse est SOURCE_NOT_FOUND ou INSUFFICIENT_SOURCE_DATA — jamais un
 * texte inventé à la place.
 */
import { randomUUID } from "node:crypto";
import { rechercherDansFichiers } from "./fichiers.js";
import { rechercher as rechercherConnaissance } from "./connaissance.js";
import { appeler } from "./provider.js";
import { tracerRetrieval } from "./retrieval-audit.js";

/**
 * Embedding Gateway (point 13) — abstraction remplaçable. Aucun fournisseur
 * d'embeddings n'est connecté dans ce dépôt (confirmé par l'audit LOT IA02F :
 * server/governance/settings-registry.ts déclare déjà intelligence.embeddings
 * NOT_CONNECTED). Cette fonction ne fait rien d'autre que déclarer cette
 * absence honnêtement ; le jour où un fournisseur est câblé, la passerelle
 * change ici, jamais dans les appelants (rag.ts / recherche-globale.ts
 * resteraient inchangés, seul `qualite` deviendrait "semantique").
 */
export async function embeddingGateway(_textes: string[]): Promise<{ ok: false; methode: "unavailable"; motif: string }> {
  return {
    ok: false,
    methode: "unavailable",
    motif: "Aucun fournisseur d'embeddings connecté (server/governance/settings-registry.ts::intelligence.embeddings = NOT_CONNECTED). Repli sur la recherche plein texte PostgreSQL.",
  };
}

export interface Citation {
  index: number;
  sourceType: "fichier" | "connaissance";
  sourceId: number | string;
  titre: string;
  extrait: string;
  score: number;
}

export interface ResultatRetrieval {
  citations: Citation[];
  methode: "lexical";
  traceId: string;
}

export async function retrieve(input: {
  query: string;
  userId: number;
  visibiliteConnaissance?: string[];
  limit?: number;
}): Promise<ResultatRetrieval> {
  const debut = Date.now();
  const traceId = randomUUID();
  const limit = input.limit ?? 6;
  const q = input.query.trim();

  const citations: Citation[] = [];
  if (q) {
    const fichiers = await rechercherDansFichiers(q, input.userId, limit);
    for (const f of fichiers) {
      citations.push({ index: 0, sourceType: "fichier", sourceId: `${f.fichierId}:${f.ordre}`, titre: f.nom, extrait: f.extrait, score: f.score });
    }
    const connaissance = await rechercherConnaissance(q, input.visibiliteConnaissance ?? ["interne"], limit);
    for (const k of connaissance) {
      citations.push({ index: 0, sourceType: "connaissance", sourceId: k.id, titre: k.titre, extrait: k.extrait, score: k.score });
    }
  }
  citations.sort((a, b) => b.score - a.score);
  const finales = citations.slice(0, limit).map((c, i) => ({ ...c, index: i + 1 }));

  await tracerRetrieval({
    userId: input.userId,
    source: "rag",
    requete: q,
    resultIds: finales.map((c) => c.sourceId),
    scores: finales.map((c) => c.score),
    permissionsAppliquees: `userId=${input.userId}`,
    dureeMs: Date.now() - debut,
    traceId,
  });

  return { citations: finales, methode: "lexical", traceId };
}

export type StatutRag = "ok" | "source_not_found" | "insufficient_source_data";

export interface ResultatRag {
  status: StatutRag;
  reponse: string | null;
  citations: Citation[];
  traceId: string;
}

const SYSTEME_RAG =
  "Tu réponds UNIQUEMENT à partir des extraits numérotés fournis ci-dessous, jamais de connaissances générales. " +
  "Cite le numéro de l'extrait entre crochets après chaque affirmation qui en dépend, par exemple [2]. " +
  "Si les extraits ne contiennent pas de quoi répondre à la question, réponds exactement le mot INSUFFICIENT_SOURCE_DATA et rien d'autre. " +
  "N'invente jamais un montant, une date ou un fait absent des extraits.";

export async function answer(input: { query: string; userId: number; visibiliteConnaissance?: string[] }): Promise<ResultatRag> {
  const r = await retrieve({ query: input.query, userId: input.userId, visibiliteConnaissance: input.visibiliteConnaissance });
  if (r.citations.length === 0) {
    return { status: "source_not_found", reponse: null, citations: [], traceId: r.traceId };
  }

  const extraits = r.citations.map((c) => `[${c.index}] (${c.sourceType} — ${c.titre})\n${c.extrait}`).join("\n\n");
  const resultat = await appeler({
    capacite: "ia_texte",
    tache: "rag_answer",
    moteur: "intelligences",
    systeme: SYSTEME_RAG,
    message: `Extraits disponibles :\n\n${extraits}\n\nQuestion : ${input.query}`,
    confidentialite: "interne",
    maxTokens: 700,
  });

  if (!resultat.ok) {
    return { status: "insufficient_source_data", reponse: null, citations: r.citations, traceId: r.traceId };
  }
  if (resultat.texte.trim().toUpperCase().includes("INSUFFICIENT_SOURCE_DATA")) {
    return { status: "insufficient_source_data", reponse: null, citations: r.citations, traceId: r.traceId };
  }
  return { status: "ok", reponse: resultat.texte, citations: r.citations, traceId: r.traceId };
}
