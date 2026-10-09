/**
 * Les moteurs INTERNES du centre : de vrais composants de code, chacun avec une fonction précise, des entrées, des sorties, un état de santé
 * mesuré et un mécanisme d'arrêt. Ils se parlent uniquement par le bus interne (bus.ts). Premier usage : aucune API externe n'est nécessaire.
 *
 * Deux familles distinctes pour toute commande : un moteur de COMMANDE (prépare et exécute) et un moteur de VÉRIFICATION (contrôle les
 * conditions puis le résultat). Leurs codes sont différents et leurs fonctions de code aussi (actionneur.ts / sonde.ts) : l'un ne lit jamais le
 * résultat de l'autre pour se convaincre. Deux moteurs logiciels dans un même processus ne prouvent PAS une capacité doublée : seule la
 * mesure (mesures.ts) fait foi.
 */
import type { KindMoteur } from "./base/schema.js";
import type { CoteCoupure } from "./base/schema.js";

export interface SpecMoteurInterne {
  code: string;
  nom: string;
  kind: Extract<KindMoteur, "command" | "verification" | "transport" | "monitor">;
  fonction: string;
  entrees: string;
  sorties: string;
  arret: string;
  /** Pour les moteurs de coupure : le côté qu'ils desservent. */
  cote?: CoteCoupure;
}

const ARRET = "Arrêt par le PDG (confirmation) : le bus refuse ensuite tout message ; toute commande qui en dépend est bloquée et un incident est ouvert. Le redémarrage est une décision séparée.";

const cmdCoupure = (cote: CoteCoupure, lib: string): SpecMoteurInterne => ({
  code: `center:cmd.cut.${cote}`,
  nom: `Actionneur de coupure — ${lib}`,
  kind: "command",
  cote,
  fonction: `Prépare et exécute l'ouverture ou la fermeture du contact ${lib} (écrit la porte du transport). N'établit jamais lui-même le résultat observé.`,
  entrees: "commande.preparer / commande.appliquer {coupure, état voulu}",
  sorties: "plan, accusé d'application (porte écrite)",
  arret: ARRET,
});
const verCoupure = (cote: CoteCoupure, lib: string): SpecMoteurInterne => ({
  code: `center:ver.cut.${cote}`,
  nom: `Sonde de coupure — ${lib}`,
  kind: "verification",
  cote,
  fonction: `Contrôle les conditions d'une commande sur le contact ${lib}, puis SONDE la continuité réelle par le service de transport : c'est elle qui établit le résultat observé.`,
  entrees: "verification.conditions / verification.sonder {coupure}",
  sorties: "verdict des conditions, continuité mesurée (passe / ne passe pas) avec sa durée",
  arret: ARRET,
});

export const MOTEURS_INTERNES: readonly SpecMoteurInterne[] = [
  cmdCoupure("remote", "local distant (Boutique, Map…)"),
  cmdCoupure("center", "central"),
  cmdCoupure("main", "local de la plateforme principale"),
  verCoupure("remote", "local distant (Boutique, Map…)"),
  verCoupure("center", "central"),
  verCoupure("main", "local de la plateforme principale"),
  {
    code: "center:cmd.line", nom: "Chef de ligne", kind: "command",
    fonction: "Ordonne les trois coupures d'une ligne (côtés locaux puis centre à l'activation, centre puis côtés à la coupure) ; défait les coupures qu'il a lui-même établies si l'une échoue.",
    entrees: "commande.preparer / commande.cloturer {ligne, état voulu}", sorties: "plan ordonné des trois coupures, bilan de la ligne", arret: ARRET,
  },
  {
    code: "center:ver.line", nom: "Contrôle de bout en bout d'une ligne", kind: "verification",
    fonction: "Vérifie qu'une ligne peut être commandée, puis recompte indépendamment ses trois coupures et la décision de passage.",
    entrees: "verification.conditions / verification.agreger {ligne}", sorties: "verdict, état recompté des trois coupures", arret: ARRET,
  },
  {
    code: "center:cmd.group", nom: "Grand contact rouge du groupe", kind: "command",
    fonction: "Commande tous les contacts centraux des lignes admissibles d'un groupe (jamais les petits interrupteurs locaux).",
    entrees: "commande.preparer / commande.cloturer {groupe, état voulu}", sorties: "liste des contacts centraux visés, lignes écartées avec leur raison, bilan", arret: ARRET,
  },
  {
    code: "center:ver.group", nom: "Contrôle d'ensemble d'un groupe", kind: "verification",
    fonction: "Recompte les contacts centraux du groupe et confirme (ou non) l'état demandé ; signale toute défaillance partielle.",
    entrees: "verification.conditions / verification.agreger {groupe}", sorties: "verdict, comptage des contacts centraux", arret: ARRET,
  },
  {
    code: "center:cmd.general", nom: "Interrupteur général", kind: "command",
    fonction: "Demande l'activation de toutes les lignes admissibles (jamais une ligne verrouillée, en erreur, vide ou non validée) ou la coupure de toutes les lignes.",
    entrees: "commande.preparer / commande.cloturer {état voulu}", sorties: "liste des lignes visées et écartées avec leur raison, bilan par ligne", arret: ARRET,
  },
  {
    code: "center:ver.general", nom: "Contrôle général", kind: "verification",
    fonction: "Recompte toutes les lignes après une commande générale et rend le résultat de chacune ; une défaillance partielle est dite telle quelle.",
    entrees: "verification.conditions / verification.agreger {}", sorties: "verdict global et par ligne", arret: ARRET,
  },
  {
    code: "center:cmd.workshop", nom: "Commande de l'atelier", kind: "command",
    fonction: "Prépare et applique une réparation proposée (opérations sûres et réversibles, sur les données du centre seulement).",
    entrees: "commande.preparer / commande.appliquer {réparation}", sorties: "version avant, changement appliqué, point de retour arrière", arret: ARRET,
  },
  {
    code: "center:ver.workshop", nom: "Vérification de l'atelier", kind: "verification",
    fonction: "Rejoue la réparation dans une transaction annulée (environnement isolé) et contrôle les invariants avant et après toute application.",
    entrees: "verification.conditions / verification.sonder {réparation}", sorties: "résultat du test isolé, invariants contrôlés", arret: ARRET,
  },
  {
    code: "center:transport", nom: "Transport interne des échanges", kind: "transport",
    fonction: "Fait passer (ou refuse) chaque échange entre les deux plateformes : décision de passage à chaque envoi, chaque reprise, chaque voie secondaire ; applique la règle des échanges en vol.",
    entrees: "échange {ligne, sens, nature, référence}", sorties: "échange livré, refusé, annulé, suspendu ou suivi", arret: ARRET,
  },
  {
    code: "center:monitor", nom: "Moteur de mesures", kind: "monitor",
    fonction: "Mesure le débit, la latence, la mémoire, la charge, les erreurs et la reprise après panne ; ne produit jamais de valeur par défaut.",
    entrees: "événements du bus, état du processus", sorties: "mesures datées avec leur source", arret: ARRET,
  },
];

export const CODES_INTERNES = new Set(MOTEURS_INTERNES.map((m) => m.code));

/** Le couple (commande, vérification) qui dessert une cible, par type de cible. */
export const PAIRE_PAR_COTE = (cote: CoteCoupure) => ({ commande: `center:cmd.cut.${cote}`, verification: `center:ver.cut.${cote}` });
export const PAIRE_LIGNE = { commande: "center:cmd.line", verification: "center:ver.line" } as const;
export const PAIRE_GROUPE = { commande: "center:cmd.group", verification: "center:ver.group" } as const;
export const PAIRE_GENERAL = { commande: "center:cmd.general", verification: "center:ver.general" } as const;
export const PAIRE_ATELIER = { commande: "center:cmd.workshop", verification: "center:ver.workshop" } as const;
