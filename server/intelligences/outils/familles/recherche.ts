/**
 * MKA.P-MS AI — Tool Registry, famille "recherche".
 *
 * `webSearchNatifOpenAI` est la seule fonction réellement câblée
 * (IMPLEMENTED) : recherche web via l'outil natif d'OpenAI (/v1/responses,
 * tools=[{type:"web_search"}], server/intelligences/provider.ts::
 * rechercherWebNatif) — réutilise la clé déjà configurée pour le fournisseur
 * de texte, aucune clé supplémentaire. Capacité réellement vérifiée
 * accessible par un appel réel au compte de production (HTTP 200, 2026-09-26).
 *
 * `webSearch` (Brave Search) reste REGISTERED_NOT_IMPLEMENTED comme outil de
 * CONVERSATION : son exécution réelle existe déjà pour un besoin différent
 * (server/market-price-intelligence/service.ts::comparerPrixExterne,
 * comparaison de prix externe), pas dupliquée ici — webSearchNatifOpenAI
 * couvre le besoin conversationnel sans dépendre de WEB_SEARCH_API_KEY,
 * absente sur ce serveur.
 *
 * `internalSearch` reste REGISTERED_NOT_IMPLEMENTED : server/search-os/ sert
 * déjà la marketplace (annonces, garages, villes, services), pas encore
 * exposé comme outil que le modèle peut demander en conversation.
 *
 * Gouverné par la direction (server/intelligences/fonctions.ts, code
 * "recherche_web", Centre Intelligence → onglet Fonctions) : le code est
 * prêt et vérifié statiquement, mais rien ne s'exécute tant que le PDG n'a
 * pas explicitement allumé la fonctionnalité, avec son motif, dans cet
 * écran — jamais un outil qui s'active tout seul parce qu'un modèle sait le
 * demander (même règle que api_externes.moderateContent).
 */
import type { Categorie, NiveauRisque, OutilSpec, StatutImplementation } from "../registre.js";

const CATEGORY: Categorie = "recherche";

function outil(partiel: {
  toolId: string;
  name: string;
  description: string;
  schemaInput: Record<string, unknown>;
  schemaOutput: Record<string, unknown>;
  implementationStatus: StatutImplementation;
  riskLevel: NiveauRisque;
  allowedRoles: string[];
  requiredPermissions: OutilSpec["requiredPermissions"];
  provider: string;
  providerCapability?: string;
  verifiedAccessible?: boolean;
  lastVerifiedAt?: string;
  fallback: string;
  internalReplacementStatus: string;
}): OutilSpec {
  return {
    toolId: partiel.toolId,
    name: partiel.name,
    description: partiel.description,
    category: CATEGORY,
    version: "1.0.0",
    schemaInput: partiel.schemaInput,
    schemaOutput: partiel.schemaOutput,
    available: true,
    enabled: partiel.implementationStatus !== "REGISTERED_NOT_IMPLEMENTED",
    implementationStatus: partiel.implementationStatus,
    allowedRoles: partiel.allowedRoles,
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: partiel.requiredPermissions,
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: partiel.riskLevel,
    legalBasis: "Aucune donnée personnelle nouvelle traitée par cet outil.",
    provider: partiel.provider,
    providerCapability: partiel.providerCapability,
    verifiedAccessible: partiel.verifiedAccessible,
    lastVerifiedAt: partiel.lastVerifiedAt,
    fallback: partiel.fallback,
    internalReplacementStatus: partiel.internalReplacementStatus,
    idempotent: true,
    timeoutMs: 30_000,
    auditCategory: "recherche",
  };
}

const METIER = ["pro", "garage", "society", "employee", "admin", "super_admin"];

export const OUTILS_RECHERCHE: OutilSpec[] = [
  outil({
    toolId: "recherche.webSearchNatifOpenAI",
    name: "webSearchNatifOpenAI",
    description:
      "Recherche une information réelle et actuelle sur le web (actualité, événement récent, information hors plateforme) via l'outil de recherche natif d'OpenAI. Chaque réponse ne cite que des sources réellement renvoyées par la recherche — jamais une URL inventée.",
    schemaInput: { type: "object", properties: { requete: { type: "string" } }, required: ["requete"] },
    schemaOutput: {
      type: "object",
      properties: {
        disponible: { type: "boolean" },
        reponse: { type: "string" },
        sources: { type: "array", items: { type: "object", properties: { titre: { type: "string" }, url: { type: "string" } } } },
        motif: { type: "string" },
      },
    },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: METIER,
    requiredPermissions: ["ANALYZE"],
    provider: "openai",
    providerCapability: "responses.tools[web_search]",
    verifiedAccessible: true,
    lastVerifiedAt: "2026-09-26",
    fallback: "Clé de fournisseur absente, réponse illisible ou recherche refusée par le fournisseur : disponible=false et motif honnête, jamais une réponse supposée à jour.",
    internalReplacementStatus: "recherche.webSearch (Brave) sert un besoin différent (comparaison de prix externe, server/market-price-intelligence/service.ts) — pas dupliqué ici.",
  }),
  outil({
    toolId: "recherche.webSearch",
    name: "webSearch",
    description: "Recherche web sourcée (Brave Search) comme outil de conversation autonome — pas encore câblée sous cette forme.",
    schemaInput: { type: "object", properties: { requete: { type: "string" } }, required: ["requete"] },
    schemaOutput: { type: "object", properties: {} },
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
    riskLevel: "LOW",
    allowedRoles: METIER,
    requiredPermissions: ["ANALYZE"],
    provider: "recherche_web_externe (absent, WEB_SEARCH_API_KEY)",
    fallback: "recherche.webSearchNatifOpenAI couvre déjà le même besoin conversationnel sans clé supplémentaire.",
    internalReplacementStatus: "server/market-price-intelligence/service.ts (comparerPrixExterne) utilise déjà ce moteur pour l'estimation de prix — jamais dupliqué ici.",
  }),
  outil({
    toolId: "recherche.internalSearch",
    name: "internalSearch",
    description: "Recherche interne à la plateforme, comme outil de conversation autonome — pas encore câblée sous cette forme.",
    schemaInput: { type: "object", properties: { requete: { type: "string" } }, required: ["requete"] },
    schemaOutput: { type: "object", properties: {} },
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: METIER,
    requiredPermissions: ["READ"],
    provider: "search_os",
    fallback: "server/search-os/ sert déjà la marketplace (annonces, garages, villes, services) en dehors de la conversation.",
    internalReplacementStatus: "server/search-os/ existe et sert un besoin distinct (marketplace) — pas dupliqué ici.",
  }),
];
