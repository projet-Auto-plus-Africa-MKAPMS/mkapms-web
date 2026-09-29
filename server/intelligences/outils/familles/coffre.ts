/**
 * MKA.P-MS AI — Tool Registry, famille "securite" : coffre de secrets du PDG.
 *
 * `listerSecrets` est la seule fonction exposée au modèle : elle lui dit QUELS
 * secrets existent (nom, service visé, type, aperçu masqué, dernier usage)
 * pour qu'il sache quelles actions il peut proposer — jamais une valeur. Le
 * contenu d'un secret ne passe jamais par le modèle : seul le code serveur
 * d'un outil précis le déchiffre (server/intelligences/coffre.ts,
 * lireSecretPourOutil), avec un motif, et chaque usage est journalisé.
 *
 * Réservée au PDG, comme le coffre lui-même.
 */
import type { OutilSpec } from "../registre.js";

export const OUTILS_COFFRE: OutilSpec[] = [
  {
    toolId: "securite.listerSecrets",
    name: "listerSecrets",
    description:
      "Liste les secrets déposés dans le coffre du PDG : nom, service visé, type, aperçu masqué et dernier usage. Ne renvoie jamais une valeur — sert uniquement à savoir quels identifiants, clés ou fichiers existent avant de proposer une action.",
    category: "securite",
    version: "1.0.0",
    schemaInput: { type: "object", properties: {}, required: [] },
    schemaOutput: {
      type: "object",
      properties: {
        secrets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              nom: { type: "string" },
              service: { type: "string" },
              type: { type: "string" },
              apercu: { type: "string" },
              dernierUsageAt: { type: ["string", "null"] },
            },
          },
        },
      },
    },
    available: true,
    enabled: true,
    implementationStatus: "IMPLEMENTED",
    allowedRoles: ["super_admin"],
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: ["READ"],
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: "READ_ONLY",
    legalBasis: "Métadonnées masquées propres au PDG — aucune valeur de secret n'est jamais renvoyée.",
    provider: "mkapms (coffre de secrets)",
    fallback: "Sans clé maître ou sans secret déposé : liste vide, dite telle quelle — jamais un secret supposé.",
    internalReplacementStatus: "Sans objet — ce coffre est propriétaire.",
    idempotent: true,
    timeoutMs: 5_000,
    auditCategory: "securite",
  },
];
