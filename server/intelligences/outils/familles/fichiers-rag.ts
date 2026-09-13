/**
 * MKA.P-MS Intelligence — Tool Registry, fichiers/documents/RAG (LOT IA02F).
 *
 * `files.*` et `documents.*` réutilisent server/intelligences/fichiers.ts
 * (pipeline réel : uploaded → validated → parsed → chunked → indexed →
 * searchable → ready_for_rag). `knowledge.search` réutilise connaissance.ts.
 * `rag.retrieve`/`rag.answer` réutilisent rag.ts — recherche plein texte
 * réelle, jamais des embeddings inventés (voir rag.ts::embeddingGateway,
 * honnêtement `unavailable`).
 *
 * Coexistent avec les fiches historiques `fichiers.uploadFile`/`deleteFile`
 * et `documents.uploadDocument`/`getDocument`/`verifyDocumentAuthenticity`
 * (server/intelligences/outils/familles/globales.ts, toujours
 * REGISTERED_NOT_IMPLEMENTED) : ce sont des toolId distincts dans les mêmes
 * catégories, pas un doublon — globales.ts couvre l'upload générique
 * plateforme (hors périmètre de ce lot), ici couvre l'usage Intelligence
 * (fichiers déposés pour une conversation, RAG).
 */
import type { Categorie, NiveauRisque, OutilSpec, StatutImplementation } from "../registre.js";

function outil(partiel: {
  toolId: string;
  name: string;
  description: string;
  category: Categorie;
  schemaInput: Record<string, unknown>;
  schemaOutput: Record<string, unknown>;
  implementationStatus: StatutImplementation;
  riskLevel: NiveauRisque;
}): OutilSpec {
  return {
    toolId: partiel.toolId,
    name: partiel.name,
    description: partiel.description,
    category: partiel.category,
    version: "1.0.0",
    schemaInput: partiel.schemaInput,
    schemaOutput: partiel.schemaOutput,
    available: true,
    enabled: true,
    implementationStatus: partiel.implementationStatus,
    allowedRoles: ["super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["READ"],
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: partiel.riskLevel,
    legalBasis: "Fichiers et connaissances propres au compte appelant ou à la plateforme — jamais un accès cross-compte.",
    provider: "mkapms",
    fallback: partiel.toolId.startsWith("rag.")
      ? "Recherche plein texte PostgreSQL en repli permanent — aucun fournisseur d'embeddings connecté (Embedding Gateway, rag.ts)."
      : "Aucun nécessaire — moteur propriétaire.",
    internalReplacementStatus: "Déjà propriétaire.",
    idempotent: partiel.riskLevel === "READ_ONLY",
    timeoutMs: 10000,
    auditCategory: partiel.category,
  };
}

export const OUTILS_FICHIERS_RAG: OutilSpec[] = [
  outil({
    toolId: "files.list",
    name: "filesList",
    description: "Liste les fichiers déposés par l'appelant (ou par un projet dont il est propriétaire).",
    category: "fichiers",
    schemaInput: { type: "object", properties: { projetId: { type: "number" } }, required: [] },
    schemaOutput: { type: "object", properties: { fichiers: { type: "array" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "files.read",
    name: "filesRead",
    description: "Lit le contenu texte extrait d'un fichier déjà traité par le pipeline.",
    category: "fichiers",
    schemaInput: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
    schemaOutput: { type: "object", properties: { contenuTexte: { type: "string" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "files.search",
    name: "filesSearch",
    description: "Recherche plein texte dans les fichiers réellement indexés (statut ready_for_rag) de l'appelant.",
    category: "fichiers",
    schemaInput: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
    schemaOutput: { type: "object", properties: { resultats: { type: "array" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "files.delete",
    name: "filesDelete",
    description: "Supprime un fichier et ses morceaux indexés.",
    category: "fichiers",
    schemaInput: { type: "object", properties: { id: { type: "number" } }, required: ["id"] },
    schemaOutput: { type: "object", properties: { ok: { type: "boolean" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "MEDIUM",
  }),
  outil({
    toolId: "documents.parse",
    name: "documentsParse",
    description: "(Re)traite un fichier déjà déposé : extraction, découpage, indexation. Renvoie le statut réel, jamais « prêt » sur un échec.",
    category: "documents",
    schemaInput: { type: "object", properties: { fichierId: { type: "number" } }, required: ["fichierId"] },
    schemaOutput: { type: "object", properties: { statutPipeline: { type: "string" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
  }),
  outil({
    toolId: "documents.index",
    name: "documentsIndex",
    description: "Statut d'indexation réel d'un fichier — jamais déclaré « searchable » si l'étape a échoué.",
    category: "documents",
    schemaInput: { type: "object", properties: { fichierId: { type: "number" } }, required: ["fichierId"] },
    schemaOutput: { type: "object", properties: { statutPipeline: { type: "string" }, morceaux: { type: "number" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "knowledge.search",
    name: "knowledgeSearch",
    description: "Recherche dans la base de connaissances MKA.P-MS (documentation, règles, procédures…) selon la visibilité autorisée.",
    category: "recherche",
    schemaInput: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
    schemaOutput: { type: "object", properties: { resultats: { type: "array" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "rag.retrieve",
    name: "ragRetrieve",
    description: "Retrouve les extraits (fichiers + connaissance) les plus pertinents pour une question, avec citation exacte de chaque source.",
    category: "recherche",
    schemaInput: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
    schemaOutput: { type: "object", properties: { citations: { type: "array" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
  }),
  outil({
    toolId: "rag.answer",
    name: "ragAnswer",
    description: "Répond à une question UNIQUEMENT à partir des sources retrouvées, avec citations — répond SOURCE_NOT_FOUND ou INSUFFICIENT_SOURCE_DATA plutôt que d'inventer.",
    category: "recherche",
    schemaInput: { type: "object", properties: { q: { type: "string" } }, required: ["q"] },
    schemaOutput: { type: "object", properties: { status: { type: "string" }, reponse: { type: "string" }, citations: { type: "array" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
  }),
];
