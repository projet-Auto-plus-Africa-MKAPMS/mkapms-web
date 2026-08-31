/**
 * MKA.P-MS Button Engine
 *
 * Nom visible : "Moteur de boutons MKA.P-MS"
 * Nom technique : "MKA.P-MS Button Engine"
 *
 * Module isolé, sans table propre : il s'appuie sur le Moteur de Redirection
 * pour la destination et sur son journal pour la supervision.
 *
 * Rôle :
 *  - un bouton ne décide plus lui-même de ce qu'il fait : il déclare un code
 *    et demande au moteur ;
 *  - la destination d'un bouton de navigation reste modifiable par le PDG via
 *    le Moteur de Redirection, sans toucher au code de l'écran ;
 *  - chaque clic est signalé, donc un bouton qui mène au vide devient visible
 *    côté direction sans qu'on ait à le tester à la main ;
 *  - une action déclarée que rien n'exécute côté serveur est rendue
 *    `non_branchee` avec le manque nommé — jamais un faux succès.
 */
export { buttonEngineRouter } from "./router.js";
export { ACTIONS_BOUTONS, actionParCode } from "./catalogue.js";
export { resoudreAction, inventaire } from "./service.js";
