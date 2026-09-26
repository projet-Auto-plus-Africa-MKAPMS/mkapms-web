/**
 * MKA.P-MS AI — Tool Registry, capacités OpenAI demandées par le PDG mais
 * encore sans code d'exécution réel.
 *
 * Contexte (deuxième relance du PDG) : « je ne choisis PAS une seule des
 * options — CHOIX : TOUTES ». Toutes les capacités OpenAI réellement
 * pertinentes doivent être enregistrées, même non câblées, pour qu'une
 * décision d'activation se prenne depuis un catalogue complet, jamais à
 * l'aveugle. Chaque entrée ici reste `enabled: false` : la fiche existe,
 * rien ne s'exécute tant que personne n'a écrit le code réel ET que la
 * direction n'a pas explicitement activé la capacité (voir aussi
 * server/intelligences/fonctions.ts, qui porte cette même décision au
 * niveau capacité pour l'écran PDG existant).
 *
 * RÈGLE TENUE (demande explicite) : jamais une capacité supposée
 * accessible. Chaque `verifiedAccessible`/`lastVerifiedAt` vient d'un appel
 * réel au compte OpenAI de production, fait le 2026-09-26 :
 *  - /v1/vector_stores, /v1/files, /v1/evals, /v1/batches → HTTP 200 réels.
 *  - /v1/realtime/client_secrets → HTTP 200, vraie session créée.
 *  - /v1/responses avec tools=[web_search] / [file_search] / [image_generation]
 *    → acceptés (file_search rejeté uniquement pour vector_store_ids vide,
 *    preuve que le type d'outil lui-même est bien accessible).
 *  - /v1/responses avec tools=[computer_use_preview] → HTTP 400 « Tool
 *    'computer_use_preview' is not supported with gpt-5.5 » ; aucun modèle
 *    compatible Computer Use trouvé dans les 49 modèles du compte →
 *    WAITING_EXTERNAL_ACCESS, pas REGISTERED_NOT_IMPLEMENTED : écrire le
 *    code aujourd'hui ne suffirait pas, l'accès manque réellement.
 *  - /v1/audio/speech avec "gpt-4o-mini-tts" → HTTP 403 (modèle hors du
 *    projet) ; avec "tts-1" → HTTP 200, audio réel généré (6912 octets) :
 *    la capacité TTS est bien accessible, seul un modèle précis est bloqué.
 *  - /v1/audio/transcriptions → accepté (erreur seulement sur le fichier
 *    manquant, jamais sur l'accès), et gpt-4o-transcribe/-diarize figurent
 *    dans le catalogue réel du compte.
 *
 * Familles couvertes ici : voix (STT/TTS/Realtime), images (génération/
 * édition), mcp, agents_autonomes, batch, vector_stores (File Search/Vector
 * Stores/Embeddings natifs OpenAI — distincts de notre propre RAG déjà
 * IMPLEMENTED, voir fichiers-rag.ts), computer_use, evals (distinct de
 * notre propre évaluation réelle déjà active, voir evaluation.ts point 148).
 *
 * Volontairement absentes d'ici (déjà réellement couvertes ailleurs, pas
 * dupliquées) : recherche web Brave (globales.ts::recherche.webSearch),
 * modération (api-externes.ts::moderateContent), mémoire documentaire/RAG
 * propriétaire (fichiers-rag.ts — déjà entièrement IMPLEMENTED), génération/
 * édition de code, shell, patch de fichiers (chantier.ts — déjà entièrement
 * IMPLEMENTED, confiné au PDG — couvre Code + une partie du besoin
 * « sandbox/shell » demandé), Structured Outputs et Function Calling (déjà
 * réels dans provider.ts/routeur.ts, capacités "raisonnement"/"outils").
 */
import type { Categorie, OutilSpec, StatutImplementation } from "../registre.js";

const AUJOURD_HUI = "2026-09-26";

function fiche(partiel: {
  toolId: string;
  name: string;
  description: string;
  category: Categorie;
  schemaInput?: Record<string, unknown>;
  riskLevel: OutilSpec["riskLevel"];
  requiredPermissions: OutilSpec["requiredPermissions"];
  provider: string;
  providerCapability?: string;
  implementationStatus?: StatutImplementation;
  verifiedAccessible?: boolean;
  lastVerifiedAt?: string;
  legalBasis?: string;
}): OutilSpec {
  const SCHEMA_VIDE = { type: "object", properties: {}, required: [] } as const;
  const statut = partiel.implementationStatus ?? "REGISTERED_NOT_IMPLEMENTED";
  return {
    toolId: partiel.toolId,
    name: partiel.name,
    description: partiel.description,
    category: partiel.category,
    version: "0.0.0",
    schemaInput: partiel.schemaInput ?? SCHEMA_VIDE,
    schemaOutput: SCHEMA_VIDE,
    available: true,
    enabled: false,
    implementationStatus: statut,
    allowedRoles: ["admin", "super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: partiel.requiredPermissions,
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: partiel.riskLevel,
    legalBasis: partiel.legalBasis ?? "À qualifier lors de l'implémentation réelle.",
    provider: partiel.provider,
    providerCapability: partiel.providerCapability,
    verifiedAccessible: partiel.verifiedAccessible,
    lastVerifiedAt: partiel.lastVerifiedAt,
    fallback:
      statut === "WAITING_EXTERNAL_ACCESS"
        ? "Aucun — l'accès externe manque, pas seulement le code."
        : "Aucun — famille pas encore implémentée.",
    internalReplacementStatus: "Sans objet tant que la famille n'est pas implémentée.",
    idempotent: false,
    timeoutMs: 5000,
    auditCategory: partiel.category,
  };
}

export const OUTILS_A_ACTIVER: OutilSpec[] = [
  // ── Voix ───────────────────────────────────────────────────────────
  fiche({
    toolId: "voix.transcrireAudio",
    name: "transcrireAudio",
    description: "Transcrit un enregistrement audio en texte (Speech-to-Text), avec diarisation optionnelle (gpt-4o-transcribe-diarize, distingue les locuteurs).",
    category: "voix",
    riskLevel: "LOW",
    requiredPermissions: ["READ"],
    provider: "openai",
    providerCapability: "audio.transcriptions (gpt-4o-transcribe / gpt-4o-transcribe-diarize)",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
  }),
  fiche({
    toolId: "voix.synthetiserParole",
    name: "synthetiserParole",
    description: "Génère un audio parlé à partir d'un texte (Text-to-Speech).",
    category: "voix",
    riskLevel: "LOW",
    requiredPermissions: ["READ"],
    provider: "openai",
    providerCapability: "audio.speech (tts-1 — vérifié réel, audio généré ; gpt-4o-mini-tts refusé pour ce projet)",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
  }),
  fiche({
    toolId: "voix.conversationTempsReel",
    name: "conversationTempsReel",
    description: "Ouvre une session vocale bidirectionnelle en temps réel (Realtime API), traduction temps réel comprise — usage prévu : futur assistant vocal support client.",
    category: "voix",
    riskLevel: "MEDIUM",
    requiredPermissions: ["READ"],
    provider: "openai",
    providerCapability: "realtime (gpt-realtime)",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
  }),

  // ── Images ───────────────────────────────────────────────────────────
  fiche({
    toolId: "images.genererImage",
    name: "genererImage",
    description: "Génère une image à partir d'une description — usage prévu : visuels marketing, jamais une photo d'annonce présentée comme réelle.",
    category: "images",
    riskLevel: "LOW",
    requiredPermissions: ["WRITE"],
    provider: "openai",
    providerCapability: "responses.tools[image_generation]",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
  }),
  fiche({
    toolId: "images.retoucherPhotoAnnonce",
    name: "retoucherPhotoAnnonce",
    description: "Retouche une photo réelle déposée par un vendeur (luminosité, recadrage, filigrane) — ne remplace jamais la photo réelle par une image inventée.",
    category: "images",
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    provider: "openai",
    providerCapability: "responses.tools[image_generation] (mode édition)",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
    legalBasis: "La photo retouchée doit rester fidèle au bien réel (droit de la consommation applicable par pays).",
  }),

  // ── MCP ────────────────────────────────────────────────────────────
  fiche({
    toolId: "mcp.connecterOutilTiers",
    name: "connecterOutilTiers",
    description: "Connecte un serveur d'outils tiers via Model Context Protocol (ex. Google Search Console, un CRM) sans coder un connecteur dédié pour chacun.",
    category: "mcp",
    riskLevel: "MEDIUM",
    requiredPermissions: ["ADMINISTRATION"],
    provider: "mcp (protocole ouvert, aucun serveur tiers connecté à ce jour)",
    providerCapability: "responses.tools[mcp]",
  }),

  // ── Agents autonomes ─────────────────────────────────────────────────
  fiche({
    toolId: "agents_autonomes.executerTacheProgrammee",
    name: "executerTacheProgrammee",
    description: "Exécute une action IA sans supervision humaine à chaque déclenchement (ex. relance automatique, veille programmée). Capacité sensible : jamais activée sans cas d'usage nommé et politique explicite (voir livraison « moderation-contenu-avis-et-audit-capacites-openai-demandees »).",
    category: "agents_autonomes",
    riskLevel: "MEDIUM",
    requiredPermissions: ["ADMINISTRATION"],
    provider: "mkapms (à définir)",
  }),

  // ── Batch ──────────────────────────────────────────────────────────
  fiche({
    toolId: "batch.soumettreTraitementLot",
    name: "soumettreTraitementLot",
    description: "Soumet un traitement en lot différé (ex. modérer un arriéré d'avis existants, ré-estimer un stock complet) — usage prévu : gros volumes sans bloquer un appel utilisateur.",
    category: "batch",
    riskLevel: "LOW",
    requiredPermissions: ["ANALYZE"],
    provider: "openai",
    providerCapability: "batches",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
  }),

  // ── Vector Stores / File Search (natifs OpenAI, distincts de notre RAG propriétaire déjà actif) ──
  fiche({
    toolId: "vector_stores.creerMagasin",
    name: "creerMagasin",
    description: "Crée un Vector Store OpenAI (espace de stockage vectoriel géré par le fournisseur).",
    category: "vector_stores",
    riskLevel: "LOW",
    requiredPermissions: ["WRITE"],
    provider: "openai",
    providerCapability: "vector_stores.create",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
  }),
  fiche({
    toolId: "vector_stores.televerserFichier",
    name: "televerserFichier",
    description: "Téléverse un fichier et l'attache à un Vector Store OpenAI pour indexation gérée par le fournisseur.",
    category: "vector_stores",
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    provider: "openai",
    providerCapability: "files.create + vector_stores.files.create",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
    legalBasis: "Un fichier contenant une donnée personnelle ne doit jamais être téléversé sans confidentialité maximale acceptée par le fournisseur.",
  }),
  fiche({
    toolId: "vector_stores.rechercherFileSearch",
    name: "rechercherFileSearch",
    description: "Interroge un ou plusieurs Vector Stores OpenAI via l'outil file_search — alternative native à notre propre RAG (server/intelligences/outils/familles/fichiers-rag.ts, déjà IMPLEMENTED et actif), utile si un jour le volume dépasse ce que notre implémentation propriétaire couvre.",
    category: "vector_stores",
    riskLevel: "READ_ONLY",
    requiredPermissions: ["READ"],
    provider: "openai",
    providerCapability: "responses.tools[file_search]",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
  }),

  // ── Computer Use ─────────────────────────────────────────────────────
  fiche({
    toolId: "computer_use.controlerNavigateur",
    name: "controlerNavigateur",
    description: "Laisse le modèle contrôler un navigateur/ordinateur via captures d'écran et actions clavier/souris (Computer Use).",
    category: "computer_use",
    riskLevel: "HIGH",
    requiredPermissions: ["ADMINISTRATION"],
    provider: "openai",
    providerCapability: "responses.tools[computer_use_preview]",
    implementationStatus: "WAITING_EXTERNAL_ACCESS",
    verifiedAccessible: false,
    lastVerifiedAt: AUJOURD_HUI,
    legalBasis: "Un contrôle d'ordinateur en conditions réelles exige une politique de sécurité dédiée avant toute activation, quelle que soit la disponibilité technique.",
  }),

  // ── Evals (distinct de notre propre évaluation réelle déjà active, point 148) ──
  fiche({
    toolId: "evals.creerEvaluation",
    name: "creerEvaluation",
    description: "Crée une évaluation OpenAI (Evals) pour mesurer la qualité d'un prompt/modèle sur un jeu de cas — complète, sans remplacer, la mesure réelle déjà active de chaque appel (server/intelligences/evaluation.ts, point 148).",
    category: "evals",
    riskLevel: "LOW",
    requiredPermissions: ["ANALYZE"],
    provider: "openai",
    providerCapability: "evals",
    verifiedAccessible: true,
    lastVerifiedAt: AUJOURD_HUI,
  }),
];
