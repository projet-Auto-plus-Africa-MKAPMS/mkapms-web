/**
 * MKA.P-MS AI — Tool Registry, famille "api_externes".
 *
 * Demande du PDG : pour chaque API réellement connectée, exposer TOUTES ses
 * fonctions utiles au registre — jamais seulement celles qui se sont
 * trouvées nécessaires à un autre moteur en premier. Deux fonctions sont
 * réellement câblées et testées (IMPLEMENTED) :
 *  - `moderateContent` — Moderation API OpenAI (server/intelligences/
 *    provider.ts::modererTexte), déjà utilisée en interne par
 *    server/reputation-engine/fraud.ts pour les avis, désormais aussi
 *    directement demandable par le modèle pour tout autre texte.
 *  - `getGoogleMerchantStatus` — état réel du connecteur Content API v2.1
 *    (server/product-engine/service.ts::merchantState), sans appel réseau :
 *    dit honnêtement si un compte Merchant Center réel est connecté.
 *
 * Trois autres fonctions RÉELLES du Content API v2.1 (lister/supprimer une
 * fiche, resoumettre une fiche précise à la demande) ne sont pas encore
 * câblées comme outil autonome — leur logique existe déjà dans
 * product-engine/service.ts (syncProduit) mais nécessite un vrai candidat
 * de base de données, pas un simple identifiant : REGISTERED_NOT_IMPLEMENTED
 * plutôt qu'une exécution bâclée, cohérent avec la règle du registre.
 */
import type { Categorie, NiveauRisque, OutilSpec, StatutImplementation } from "../registre.js";

const CATEGORY: Categorie = "api_externes";

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
  fallback: string;
  internalReplacementStatus: string;
  legalBasis?: string;
  idempotent?: boolean;
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
    legalBasis: partiel.legalBasis ?? "Aucune donnée personnelle nouvelle traitée par cet outil.",
    provider: partiel.provider,
    fallback: partiel.fallback,
    internalReplacementStatus: partiel.internalReplacementStatus,
    idempotent: partiel.idempotent ?? true,
    timeoutMs: 10_000,
    auditCategory: "api_externes",
  };
}

const METIER = ["employee", "admin", "super_admin"];
const DIRECTION = ["admin", "super_admin"];

export const OUTILS_API_EXTERNES: OutilSpec[] = [
  outil({
    toolId: "api_externes.moderateContent",
    name: "moderateContent",
    description: "Analyse un texte via la Moderation API OpenAI et dit s'il enfreint la politique de contenu (haine, harcèlement, sexuel, violence…), avec les catégories réelles détectées.",
    schemaInput: { type: "object", properties: { texte: { type: "string" } }, required: ["texte"] },
    schemaOutput: {
      type: "object",
      properties: {
        disponible: { type: "boolean" },
        signale: { type: "boolean" },
        categories: { type: "array", items: { type: "string" } },
        motif: { type: "string" },
      },
    },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: METIER,
    requiredPermissions: ["ANALYZE"],
    provider: "openai (Moderation API)",
    fallback: "Aucun autre fournisseur de modération connecté aujourd'hui — indisponibilité réelle rapportée telle quelle (disponible=false), jamais un texte supposé sain.",
    internalReplacementStatus: "Aucun moteur MKA.P-MS ne classe le contenu en interne à ce jour.",
  }),
  outil({
    toolId: "api_externes.getGoogleMerchantStatus",
    name: "getGoogleMerchantStatus",
    description: "Dit si un compte Google Merchant Center réel est connecté (identifiants + compte de service valides), sans appel réseau — jamais un statut supposé.",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: { type: "object", properties: { configure: { type: "boolean" }, detail: { type: "string" } } },
    implementationStatus: "IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: DIRECTION,
    requiredPermissions: ["READ"],
    provider: "google_merchant_center (Content API v2.1)",
    fallback: "Aucun — lecture de configuration locale uniquement.",
    internalReplacementStatus: "Sans objet — ce statut est propriétaire.",
  }),
  outil({
    toolId: "api_externes.resyncGoogleMerchantListing",
    name: "resyncGoogleMerchantListing",
    description: "Resoumet une fiche précise (pièce en boutique) au Content API v2.1 à la demande, hors du cycle automatique dépôt/modification/vente.",
    schemaInput: { type: "object", properties: { source: { type: "string" }, sourceId: { type: "number" } }, required: ["source", "sourceId"] },
    schemaOutput: { type: "object", properties: { itemId: { type: ["string", "null"] }, statutMerchant: { type: "string" } } },
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
    riskLevel: "MEDIUM",
    allowedRoles: DIRECTION,
    requiredPermissions: ["WRITE"],
    provider: "google_merchant_center (Content API v2.1)",
    fallback: "La resynchronisation automatique (dépôt/modification/vente) reste active — seule la resoumission à la demande manque.",
    internalReplacementStatus: "syncProduit() (server/product-engine/service.ts) fait déjà ce travail à chaque dépôt/modification/vente ; il manque seulement l'entrée « à la demande » avec lookup du candidat par identifiant.",
    idempotent: false,
  }),
  outil({
    toolId: "api_externes.listGoogleMerchantProducts",
    name: "listGoogleMerchantProducts",
    description: "Liste les fiches réellement soumises à Google Merchant Center (endpoint products.list du Content API v2.1).",
    schemaInput: { type: "object", properties: { curseur: { type: "string" } }, required: [] },
    schemaOutput: { type: "object", properties: { produits: { type: "array", items: { type: "object" } } } },
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
    riskLevel: "READ_ONLY",
    allowedRoles: DIRECTION,
    requiredPermissions: ["READ"],
    provider: "google_merchant_center (Content API v2.1)",
    fallback: "Le statut d'une fiche déjà connue reste consultable via candidatsBoutique()/candidatsInventaire() côté base MKA.P-MS.",
    internalReplacementStatus: "Non câblé : server/product-engine/merchant-center.ts n'implémente aujourd'hui que products.insert et productstatuses.get.",
  }),
  outil({
    toolId: "api_externes.deleteGoogleMerchantProduct",
    name: "deleteGoogleMerchantProduct",
    description: "Retire une fiche de Google Merchant Center (endpoint products.delete du Content API v2.1) — utile quand une pièce est vendue ou retirée du catalogue.",
    schemaInput: { type: "object", properties: { source: { type: "string" }, sourceId: { type: "number" } }, required: ["source", "sourceId"] },
    schemaOutput: { type: "object", properties: { supprime: { type: "boolean" } } },
    implementationStatus: "REGISTERED_NOT_IMPLEMENTED",
    riskLevel: "MEDIUM",
    allowedRoles: DIRECTION,
    requiredPermissions: ["WRITE"],
    provider: "google_merchant_center (Content API v2.1)",
    fallback: "syncProduit() marque déjà une pièce vendue comme indisponible (disponibilite=indisponible) lors de la resynchronisation automatique — la suppression explicite de la fiche chez Google manque encore.",
    internalReplacementStatus: "Non câblé : server/product-engine/merchant-center.ts n'implémente aujourd'hui aucun appel DELETE.",
    idempotent: true,
  }),
];
