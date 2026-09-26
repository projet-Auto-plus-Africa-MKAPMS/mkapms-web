/**
 * MKA.P-MS AI — Tool Registry, capacités demandées par le PDG mais encore
 * sans aucune implémentation réelle.
 *
 * Contexte : le PDG a demandé d'enregistrer TOUTES les fonctions de chaque
 * API connue, même celles encore à construire, pour pouvoir ensuite décider
 * lui-même — dans un écran Paramètres dédié (server/routers/outils-etat.ts,
 * client/src/pages/ParametresIA.tsx) — lesquelles activer. Chaque entrée ici
 * est donc volontairement `REGISTERED_NOT_IMPLEMENTED` / `enabled: false` :
 * la fiche existe, rien ne s'exécute tant que personne n'a écrit le code
 * réel ET que la direction n'a pas explicitement activé la capacité.
 *
 * Quatre familles explicitement demandées et jamais couvertes ailleurs :
 *  - voix (Speech-to-Text / Text-to-Speech / Realtime) ;
 *  - mcp (connecteurs Model Context Protocol vers des outils tiers) ;
 *  - agents_autonomes (tâches IA déclenchées sans supervision humaine à
 *    chaque appel — capacité sensible, jamais construite sans cas d'usage
 *    nommé, voir la livraison « moderation-contenu-avis-et-audit-... ») ;
 * Deux familles ajoutées de notre propre initiative (« autre », comme
 * demandé), choisies pour un lien réel avec la marketplace automobile :
 *  - images (retouche/génération pour les photos d'annonces) ;
 *  - batch (traitement en lot, ex. modérer un arriéré d'avis existants).
 *
 * Volontairement absentes d'ici (déjà réellement couvertes ailleurs, pas
 * dupliquées) : recherche web (globales.ts::recherche.webSearch),
 * modération (api-externes.ts::moderateContent), mémoire documentaire/RAG
 * (fichiers-rag.ts — déjà entièrement IMPLEMENTED), génération/édition de
 * code et shell (chantier.ts — déjà entièrement IMPLEMENTED, confiné au
 * PDG).
 */
import type { Categorie, OutilSpec } from "../registre.js";

function fiche(partiel: {
  toolId: string;
  name: string;
  description: string;
  category: Categorie;
  schemaInput?: Record<string, unknown>;
  riskLevel: OutilSpec["riskLevel"];
  requiredPermissions: OutilSpec["requiredPermissions"];
  provider: string;
  legalBasis?: string;
}): OutilSpec {
  const SCHEMA_VIDE = { type: "object", properties: {}, required: [] } as const;
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
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
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
    fallback: "Aucun — famille pas encore implémentée.",
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
    description: "Transcrit un enregistrement audio en texte (Speech-to-Text).",
    category: "voix",
    riskLevel: "LOW",
    requiredPermissions: ["READ"],
    provider: "openai (Speech-to-Text, absent)",
  }),
  fiche({
    toolId: "voix.synthetiserParole",
    name: "synthetiserParole",
    description: "Génère un audio parlé à partir d'un texte (Text-to-Speech).",
    category: "voix",
    riskLevel: "LOW",
    requiredPermissions: ["READ"],
    provider: "openai (Text-to-Speech, absent)",
  }),
  fiche({
    toolId: "voix.conversationTempsReel",
    name: "conversationTempsReel",
    description: "Ouvre une session vocale bidirectionnelle en temps réel (Realtime API) — usage prévu : futur assistant vocal support client.",
    category: "voix",
    riskLevel: "MEDIUM",
    requiredPermissions: ["READ"],
    provider: "openai (Realtime API, absent)",
  }),

  // ── Images ───────────────────────────────────────────────────────────
  fiche({
    toolId: "images.genererImage",
    name: "genererImage",
    description: "Génère une image à partir d'une description — usage prévu : visuels marketing, jamais une photo d'annonce présentée comme réelle.",
    category: "images",
    riskLevel: "LOW",
    requiredPermissions: ["WRITE"],
    provider: "openai (gpt-image, absent)",
  }),
  fiche({
    toolId: "images.retoucherPhotoAnnonce",
    name: "retoucherPhotoAnnonce",
    description: "Retouche une photo réelle déposée par un vendeur (luminosité, recadrage, filigrane) — ne remplace jamais la photo réelle par une image inventée.",
    category: "images",
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    provider: "openai (gpt-image, absent)",
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
    provider: "mcp (protocole ouvert, aucun serveur connecté à ce jour)",
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
    provider: "openai (Batch API, absent)",
  }),
];
