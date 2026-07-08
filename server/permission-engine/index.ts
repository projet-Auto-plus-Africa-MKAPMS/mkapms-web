/**
 * MKA.P-MS Permission Engine
 *
 * Nom visible : "Moteur de Permissions MKA.P-MS"
 * Nom technique : "MKA.P-MS Permission Engine"
 *
 * Module isolé — moteur central d'autorisation développé séparément de la
 * plateforme principale, connecté de manière contrôlée via TRPC sub-router.
 *
 * Rôle :
 *  - contrôler l'accès aux pages, boutons, API et données sensibles ;
 *  - fournir des menus dynamiques (chaque rôle ne voit que ce qui le concerne) ;
 *  - garder les endpoints (rôle + propriété de la donnée) ;
 *  - journaliser chaque tentative d'accès sensible (autorisée ou refusée) ;
 *  - gérer les accès temporaires accordés par le PDG.
 *
 * La matrice des permissions est définie dans `shared/permissions.ts`
 * (source de vérité unique partagée client/serveur).
 */
export { permissionEngineRouter } from "./router.js";
export { logAccess } from "./journal.js";
export * as permSchema from "./schema.js";
