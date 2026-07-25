/**
 * MKA.P-MS Redirection Engine
 *
 * Nom visible : "Moteur de Redirection MKA.P-MS"
 * Nom technique : "MKA.P-MS Redirection Engine"
 *
 * Module isolé — moteur central de redirection développé séparément de la
 * plateforme principale, connecté de manière contrôlée via TRPC sub-router.
 *
 * Rôle :
 *  - centraliser les redirections (boutons, services, routes) ;
 *  - éviter le câblage en dur : on résout une "clé" → une destination ;
 *  - journaliser chaque résolution (pour repérer les clés sans règle) ;
 *  - permettre au PDG de configurer/activer/désactiver les règles en direct.
 *
 * Le moteur ne supprime rien de sensible et ne modifie pas le code : il
 * fournit uniquement des destinations. Une clé sans règle active renvoie
 * null (le client garde alors son comportement par défaut).
 */
export { redirectionEngineRouter } from "./router.js";
export { ensureDefaultRules } from "./service.js";
export * as redirSchema from "./schema.js";
