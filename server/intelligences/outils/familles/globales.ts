/**
 * MKA.P-MS Intelligence — Tool Registry, familles globales (hors véhicules).
 *
 * Règle de la direction : toutes les familles prévues doivent être
 * enregistrées dès maintenant, même sans implémentation réelle derrière.
 * L'absence de code n'est jamais une absence de fiche — chaque outil ici
 * porte `implementationStatus: "REGISTERED_NOT_IMPLEMENTED"` et reste
 * `enabled: false` (rien ne s'exécute tant que personne n'a écrit son
 * executeur) jusqu'à son propre lot d'implémentation.
 *
 * Champs volontairement prudents par défaut pour toute capacité sensible :
 * risque au moins MEDIUM et permission WRITE/FINANCIAL/ADMINISTRATION dès
 * qu'une écriture réelle est en jeu, HIGH/CRITICAL + requiresHumanApproval
 * pour l'argent, les rôles, la sécurité et le déploiement — non pas pour les
 * exclure, mais pour qu'elles n'apparaissent jamais « prêtes » avant qu'une
 * politique explicite ne soit écrite lot par lot.
 */
import type { Categorie, OutilSpec } from "../registre.js";

const SCHEMA_VIDE = { type: "object", properties: {}, required: [] } as const;

function fiche(partiel: {
  toolId: string;
  name: string;
  description: string;
  category: Categorie;
  schemaInput?: Record<string, unknown>;
  riskLevel: OutilSpec["riskLevel"];
  allowedRoles: string[];
  requiredPermissions: OutilSpec["requiredPermissions"];
  requiresHumanApproval?: boolean;
  requiresStrongAuthentication?: boolean;
  provider: string;
  legalBasis?: string;
}): OutilSpec {
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
    allowedRoles: partiel.allowedRoles,
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: partiel.requiredPermissions,
    requiredSubscription: null,
    requiresHumanApproval: partiel.requiresHumanApproval ?? false,
    requiresStrongAuthentication: partiel.requiresStrongAuthentication ?? false,
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

const METIER = ["pro", "garage", "society", "employee", "admin", "super_admin"];
const INTERNE = ["employee", "admin", "super_admin"];
const DIRECTION = ["admin", "super_admin"];
const PDG = ["super_admin"];

export const OUTILS_GLOBAUX: OutilSpec[] = [
  // ── Paiements ──────────────────────────────────────────────────────
  fiche({ toolId: "paiements.initiatePayment", name: "initiatePayment", description: "Initie un encaissement.", category: "paiements", riskLevel: "CRITICAL", allowedRoles: METIER, requiredPermissions: ["FINANCIAL"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "payment-engine", legalBasis: "Réglementation des services de paiement, applicable par pays." }),
  fiche({ toolId: "paiements.capturePayment", name: "capturePayment", description: "Capture un paiement pré-autorisé.", category: "paiements", riskLevel: "CRITICAL", allowedRoles: METIER, requiredPermissions: ["FINANCIAL"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "payment-engine" }),
  fiche({ toolId: "paiements.voidPayment", name: "voidPayment", description: "Annule un paiement non capturé.", category: "paiements", riskLevel: "HIGH", allowedRoles: METIER, requiredPermissions: ["FINANCIAL"], requiresHumanApproval: true, provider: "payment-engine" }),

  // ── Remboursements ─────────────────────────────────────────────────
  fiche({ toolId: "remboursements.initiateRefund", name: "initiateRefund", description: "Initie un remboursement.", category: "remboursements", riskLevel: "HIGH", allowedRoles: DIRECTION, requiredPermissions: ["FINANCIAL"], requiresHumanApproval: true, provider: "payment-engine" }),
  fiche({ toolId: "remboursements.checkRefundStatus", name: "checkRefundStatus", description: "Consulte le statut d'un remboursement.", category: "remboursements", riskLevel: "LOW", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "payment-engine" }),

  // ── Payouts ────────────────────────────────────────────────────────
  fiche({ toolId: "payouts.initiatePayout", name: "initiatePayout", description: "Initie un virement vers un compte professionnel.", category: "payouts", riskLevel: "CRITICAL", allowedRoles: DIRECTION, requiredPermissions: ["FINANCIAL"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "payment-engine" }),
  fiche({ toolId: "payouts.checkPayoutStatus", name: "checkPayoutStatus", description: "Consulte le statut d'un virement.", category: "payouts", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["FINANCIAL"], provider: "payment-engine" }),

  // ── Ledger / comptabilité ──────────────────────────────────────────
  fiche({ toolId: "ledger_comptabilite.getLedgerEntry", name: "getLedgerEntry", description: "Consulte une écriture comptable.", category: "ledger_comptabilite", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["FINANCIAL"], provider: "comptabilite" }),
  fiche({ toolId: "ledger_comptabilite.exportComptaReport", name: "exportComptaReport", description: "Exporte un rapport comptable.", category: "ledger_comptabilite", riskLevel: "HIGH", allowedRoles: DIRECTION, requiredPermissions: ["FINANCIAL"], requiresHumanApproval: true, provider: "comptabilite" }),

  // ── Fournisseurs ───────────────────────────────────────────────────
  fiche({ toolId: "fournisseurs.listSuppliers", name: "listSuppliers", description: "Liste les fournisseurs référencés.", category: "fournisseurs", riskLevel: "LOW", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "partner_engine" }),
  fiche({ toolId: "fournisseurs.checkSupplierCompliance", name: "checkSupplierCompliance", description: "Vérifie la conformité d'un fournisseur.", category: "fournisseurs", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["ANALYZE"], provider: "partner_engine" }),

  // ── Pièces ─────────────────────────────────────────────────────────
  fiche({ toolId: "pieces.searchParts", name: "searchParts", description: "Recherche une pièce au catalogue.", category: "pieces", riskLevel: "READ_ONLY", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "pieces" }),
  fiche({ toolId: "pieces.getPartDetails", name: "getPartDetails", description: "Détail d'une pièce (référence, prix, stock déclaré).", category: "pieces", riskLevel: "READ_ONLY", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "pieces" }),

  // ── Compatibilité pièces ───────────────────────────────────────────
  fiche({ toolId: "compatibilite_pieces.checkPartCompatibility", name: "checkPartCompatibility", description: "Vérifie la compatibilité d'une pièce avec un véhicule.", category: "compatibilite_pieces", riskLevel: "READ_ONLY", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "pieces + donnees_vehicules" }),

  // ── Stock ──────────────────────────────────────────────────────────
  fiche({ toolId: "stock.getStockLevel", name: "getStockLevel", description: "Consulte le niveau de stock d'une référence.", category: "stock", riskLevel: "READ_ONLY", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "pieces" }),
  fiche({ toolId: "stock.adjustStock", name: "adjustStock", description: "Ajuste un niveau de stock déclaré.", category: "stock", riskLevel: "HIGH", allowedRoles: METIER, requiredPermissions: ["WRITE"], requiresHumanApproval: true, provider: "pieces" }),

  // ── Transport ──────────────────────────────────────────────────────
  fiche({ toolId: "transport.getShippingQuote", name: "getShippingQuote", description: "Cotation de transport pour un corridor donné.", category: "transport", riskLevel: "LOW", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "transporteurs_corridors (absent)" }),
  fiche({ toolId: "transport.bookTransport", name: "bookTransport", description: "Réserve un transport.", category: "transport", riskLevel: "HIGH", allowedRoles: METIER, requiredPermissions: ["WRITE"], requiresHumanApproval: true, provider: "transporteurs_corridors (absent)" }),

  // ── Livraison ──────────────────────────────────────────────────────
  fiche({ toolId: "livraison.getDeliveryStatus", name: "getDeliveryStatus", description: "Consulte le statut d'une livraison.", category: "livraison", riskLevel: "READ_ONLY", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "livraison_vehicule" }),
  fiche({ toolId: "livraison.scheduleDelivery", name: "scheduleDelivery", description: "Planifie une livraison.", category: "livraison", riskLevel: "MEDIUM", allowedRoles: METIER, requiredPermissions: ["WRITE"], provider: "livraison_vehicule" }),

  // ── Douane ─────────────────────────────────────────────────────────
  fiche({ toolId: "douane.getCustomsDuty", name: "getCustomsDuty", description: "Estime les droits de douane à l'importation par pays.", category: "douane", riskLevel: "MEDIUM", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "douane_tarifs (absent)" }),
  fiche({ toolId: "douane.checkImportCompliance", name: "checkImportCompliance", description: "Vérifie la conformité réglementaire d'une importation par pays.", category: "douane", riskLevel: "MEDIUM", allowedRoles: METIER, requiredPermissions: ["ANALYZE"], provider: "risque_import" }),

  // ── Documents ──────────────────────────────────────────────────────
  fiche({ toolId: "documents.uploadDocument", name: "uploadDocument", description: "Dépose un document (facture, carte grise, contrat).", category: "documents", riskLevel: "MEDIUM", allowedRoles: METIER, requiredPermissions: ["WRITE"], provider: "document_os", legalBasis: "Donnée personnelle selon le document." }),
  fiche({ toolId: "documents.verifyDocumentAuthenticity", name: "verifyDocumentAuthenticity", description: "Vérifie l'authenticité d'un document déposé.", category: "documents", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["ANALYZE"], provider: "media_authenticity" }),
  fiche({ toolId: "documents.getDocument", name: "getDocument", description: "Récupère un document déposé.", category: "documents", riskLevel: "MEDIUM", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "document_os", legalBasis: "Donnée personnelle selon le document." }),

  // ── Fichiers ───────────────────────────────────────────────────────
  fiche({ toolId: "fichiers.uploadFile", name: "uploadFile", description: "Dépose un fichier générique.", category: "fichiers", riskLevel: "LOW", allowedRoles: METIER, requiredPermissions: ["WRITE"], provider: "mkapms" }),
  fiche({ toolId: "fichiers.deleteFile", name: "deleteFile", description: "Supprime un fichier déposé.", category: "fichiers", riskLevel: "HIGH", allowedRoles: DIRECTION, requiredPermissions: ["WRITE"], requiresHumanApproval: true, provider: "mkapms" }),

  // ── Recherche ──────────────────────────────────────────────────────
  fiche({ toolId: "recherche.webSearch", name: "webSearch", description: "Recherche web sourcée.", category: "recherche", riskLevel: "LOW", allowedRoles: METIER, requiredPermissions: ["ANALYZE"], provider: "recherche_web_externe (absent, WEB_SEARCH_API_KEY)" }),
  fiche({ toolId: "recherche.internalSearch", name: "internalSearch", description: "Recherche interne à la plateforme.", category: "recherche", riskLevel: "READ_ONLY", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "search_os" }),

  // ── Communication ──────────────────────────────────────────────────
  fiche({ toolId: "communication.sendEmail", name: "sendEmail", description: "Envoie un e-mail à un utilisateur réel.", category: "communication", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["WRITE"], provider: "email" }),
  fiche({ toolId: "communication.sendSMS", name: "sendSMS", description: "Envoie un SMS à un utilisateur réel.", category: "communication", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["WRITE"], provider: "sms (absent)" }),

  // ── Notifications ──────────────────────────────────────────────────
  fiche({ toolId: "notifications.sendNotification", name: "sendNotification", description: "Envoie une notification applicative.", category: "notifications", riskLevel: "LOW", allowedRoles: METIER, requiredPermissions: ["WRITE"], provider: "notification-os" }),
  fiche({ toolId: "notifications.getNotificationStatus", name: "getNotificationStatus", description: "Consulte le statut d'une notification envoyée.", category: "notifications", riskLevel: "READ_ONLY", allowedRoles: METIER, requiredPermissions: ["READ"], provider: "notification-os" }),

  // ── Comptes ────────────────────────────────────────────────────────
  fiche({ toolId: "comptes.getAccountProfile", name: "getAccountProfile", description: "Consulte le profil d'un compte.", category: "comptes", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["READ"], provider: "identity", legalBasis: "Donnée personnelle." }),
  fiche({ toolId: "comptes.suspendAccount", name: "suspendAccount", description: "Suspend un compte utilisateur.", category: "comptes", riskLevel: "CRITICAL", allowedRoles: DIRECTION, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "identity" }),

  // ── Rôles ──────────────────────────────────────────────────────────
  fiche({ toolId: "roles.assignRole", name: "assignRole", description: "Attribue un rôle à un utilisateur.", category: "roles", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "permission-engine" }),
  fiche({ toolId: "roles.revokeRole", name: "revokeRole", description: "Retire un rôle à un utilisateur.", category: "roles", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "permission-engine" }),

  // ── Permissions ────────────────────────────────────────────────────
  fiche({ toolId: "permissions.grantPermission", name: "grantPermission", description: "Accorde une permission à un rôle ou un moteur.", category: "permissions", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "intelligences (permissions.ts)" }),
  fiche({ toolId: "permissions.revokePermission", name: "revokePermission", description: "Retire une permission à un rôle ou un moteur.", category: "permissions", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "intelligences (permissions.ts)" }),

  // ── Sécurité ───────────────────────────────────────────────────────
  fiche({ toolId: "securite.lockAccount", name: "lockAccount", description: "Verrouille un compte par mesure de sécurité.", category: "securite", riskLevel: "CRITICAL", allowedRoles: DIRECTION, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "identity" }),
  fiche({ toolId: "securite.rotateSecret", name: "rotateSecret", description: "Fait tourner un secret applicatif (jamais sa valeur transmise au modèle).", category: "securite", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "mkapms" }),

  // ── Administration ─────────────────────────────────────────────────
  fiche({ toolId: "administration.getSystemConfig", name: "getSystemConfig", description: "Consulte une configuration système (noms de variables, jamais leur valeur secrète).", category: "administration", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["ADMINISTRATION"], provider: "mkapms" }),
  fiche({ toolId: "administration.updateSystemConfig", name: "updateSystemConfig", description: "Modifie une configuration système.", category: "administration", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "mkapms" }),

  // ── Données (RGPD et assimilés) ────────────────────────────────────
  fiche({ toolId: "donnees.exportUserData", name: "exportUserData", description: "Exporte les données d'un utilisateur (droit d'accès).", category: "donnees", riskLevel: "HIGH", allowedRoles: DIRECTION, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, provider: "identity", legalBasis: "Droit d'accès (RGPD art. 15 et équivalents locaux)." }),
  fiche({ toolId: "donnees.deleteUserData", name: "deleteUserData", description: "Supprime les données d'un utilisateur (droit à l'effacement).", category: "donnees", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["ADMINISTRATION"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "identity", legalBasis: "Droit à l'effacement (RGPD art. 17 et équivalents locaux)." }),

  // ── Marketplace ────────────────────────────────────────────────────
  fiche({ toolId: "marketplace.moderateListing", name: "moderateListing", description: "Modère une annonce publiée.", category: "marketplace", riskLevel: "MEDIUM", allowedRoles: DIRECTION, requiredPermissions: ["WRITE"], provider: "achat/vente" }),
  fiche({ toolId: "marketplace.removeListing", name: "removeListing", description: "Retire une annonce de la marketplace.", category: "marketplace", riskLevel: "HIGH", allowedRoles: DIRECTION, requiredPermissions: ["WRITE"], requiresHumanApproval: true, provider: "achat/vente" }),

  // ── Railway / déploiement ──────────────────────────────────────────
  fiche({ toolId: "railway_deploiement.getDeploymentStatus", name: "getDeploymentStatus", description: "Consulte le statut d'un déploiement Railway.", category: "railway_deploiement", riskLevel: "MEDIUM", allowedRoles: PDG, requiredPermissions: ["INFRASTRUCTURE"], provider: "Railway (RAILWAY_TOKEN)" }),
  fiche({ toolId: "railway_deploiement.triggerDeployment", name: "triggerDeployment", description: "Déclenche un déploiement — jamais sans décision explicite de la direction.", category: "railway_deploiement", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["INFRASTRUCTURE"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "Railway (RAILWAY_TOKEN)" }),
  fiche({ toolId: "railway_deploiement.rollbackDeployment", name: "rollbackDeployment", description: "Revient à un déploiement précédent.", category: "railway_deploiement", riskLevel: "CRITICAL", allowedRoles: PDG, requiredPermissions: ["INFRASTRUCTURE"], requiresHumanApproval: true, requiresStrongAuthentication: true, provider: "Railway (RAILWAY_TOKEN)" }),

  // ── Observabilité ──────────────────────────────────────────────────
  fiche({ toolId: "observabilite.getSystemHealth", name: "getSystemHealth", description: "Consulte l'état de santé du système (registre des moteurs).", category: "observabilite", riskLevel: "READ_ONLY", allowedRoles: INTERNE, requiredPermissions: ["READ"], provider: "engine_registry" }),
  fiche({ toolId: "observabilite.getErrorLogs", name: "getErrorLogs", description: "Consulte les journaux d'erreur récents.", category: "observabilite", riskLevel: "LOW", allowedRoles: INTERNE, requiredPermissions: ["READ"], provider: "monitoring" }),

  // ── API externes ───────────────────────────────────────────────────
  fiche({ toolId: "api_externes.listConnectedProviders", name: "listConnectedProviders", description: "Liste les fournisseurs externes réellement configurés (jamais leurs clés).", category: "api_externes", riskLevel: "LOW", allowedRoles: DIRECTION, requiredPermissions: ["READ"], provider: "ai-fabric" }),
  fiche({ toolId: "api_externes.testProviderConnection", name: "testProviderConnection", description: "Teste la joignabilité d'un fournisseur externe configuré.", category: "api_externes", riskLevel: "LOW", allowedRoles: DIRECTION, requiredPermissions: ["ANALYZE"], provider: "ai-fabric" }),

  // ── Futurs moteurs MKA.P-MS ────────────────────────────────────────
  fiche({ toolId: "futurs_moteurs.reserve", name: "reserve", description: "Emplacement réservé : aucun futur moteur MKA.P-MS n'est absent du registre par principe, même avant d'être nommé.", category: "futurs_moteurs", riskLevel: "READ_ONLY", allowedRoles: PDG, requiredPermissions: ["READ"], provider: "mkapms (à venir)" }),
];
