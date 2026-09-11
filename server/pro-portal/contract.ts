/**
 * Pro Portal Engine — Contrat
 *
 * Surface publique minimale que les autres moteurs peuvent consommer sans
 * importer l'implémentation interne du portail (server/pro-portal/service.ts,
 * qui gère aussi le panier, le paiement et la composition d'offre — hors
 * sujet pour un moteur voisin).
 *
 * Pro Account en a besoin pour savoir quels justificatifs réunir avant
 * l'activation d'un dossier (server/pro-account/service.ts). C'est un besoin
 * métier réel et vérifié (le catalogue des métiers/pays est une donnée du
 * portail) : ce contrat ne le supprime pas, il en fait la seule porte
 * d'entrée officielle, au même titre que identity-os/contract.ts ou
 * permission-engine/contract.ts pour leurs moteurs respectifs.
 */
export { requirementsFor } from "./service.js";
