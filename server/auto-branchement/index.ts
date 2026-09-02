/**
 * MKA.P-MS Auto-Branchement Engine
 *
 * Nom visible : « Module d'auto-branchement MKA.P-MS »
 * Nom technique : « MKA.P-MS Auto-Branchement Engine »
 *
 * Module isolé, sans table propre : il travaille sur l'inventaire généré des
 * cliquables et alimente les moteurs existants.
 *
 * Rôle :
 *  - relever chaque élément cliquable de chaque écran et dire lequel est piloté
 *    par le Moteur de boutons et lequel ne l'est pas ;
 *  - vérifier, à l'exécution, que chaque destination existe encore — ou qu'une
 *    règle du Moteur de Redirection la rattrape ;
 *  - publier chaque défaut à l'Event Bus pour que le Système Intelligent ouvre
 *    l'alerte et que MKA.P-MS Intelligences ouvre le dossier de correction ;
 *  - conserver l'état en mémoire technique et battre au registre des moteurs.
 *
 * Ce module ne modifie jamais le code de production : il constate, propose et
 * trace. La correction reste gouvernée.
 */
export { autoBranchementRouter } from "./router.js";
export {
  analyser,
  codesNonDeclares,
  destinationsMortes,
  ecransMuets,
  health,
  propositions,
  sectionsVides,
  synthese,
  type Proposition,
  type SectionVide,
  type RapportAutoBranchement,
  type SyntheseAutoBranchement,
} from "./service.js";
