/**
 * Centre Cyber-Électrique — forme de l'inventaire des moteurs (Boutique et plateforme principale).
 *
 * Les fichiers `boutique.generated.ts` et `plateforme.generated.ts` sont GÉNÉRÉS par `scripts/gen-frontier-inventaire.ts` à partir du code
 * des deux dépôts (lecture seule). Ils ne sont jamais édités à la main : une mesure qui ne vient pas du code relevé n'a pas sa place ici.
 */

/**
 * Plus haut stade PROUVÉ par le code relevé (jamais déclaré seulement) :
 * - incomplet  : déclaré mais sans liaison d'exécution (une table ou une fiche n'est pas un moteur) ou bloqué par un accès externe ;
 * - prepare    : préparé pour la connexion (contrat ou structure prête) mais sans exécution raccordée ;
 * - installe   : une liaison d'exécution relevée dans le code (route, procédure) ;
 * - teste      : installé ET au moins un fichier de test existant relevé ;
 * - connecte   : une liaison vérifiée avec une autre plateforme. Aucun moteur n'est « connecté » tant que le centre n'a pas observé la liaison ;
 * - a_verifier : source inaccessible ou identité non établie.
 */
export type EtatInventaire = "incomplet" | "prepare" | "installe" | "teste" | "connecte" | "a_verifier";

/** Ce qui prouve l'existence du moteur : `declare` = la fiche seule ; `liaison` = code d'exécution ; `tests` = tests relevés ; `mesure` = mesuré en direct. */
export type NiveauPreuve = "declare" | "liaison" | "tests" | "mesure";

export interface LigneInventaire {
  /** Identifiant du moteur dans son registre d'origine. */
  readonly id: string;
  readonly nom: string;
  readonly fonction: string;
  readonly domaine: string;
  /** Niveau annoncé par le registre d'origine (required / external / internal pour la Boutique ; catégorie pour la plateforme). */
  readonly niveauDeclare: string;
  /** Références fichier (chemin[:ligne]) de l'emplacement du code et de la déclaration. */
  readonly code: readonly string[];
  /** Service qui exécute le moteur. */
  readonly serviceExecution: string;
  /** Points d'entrée relevés (routes HTTP pour la Boutique, routeurs tRPC pour la plateforme). */
  readonly entrees: readonly string[];
  /** Nombre de points d'entrée réellement trouvés dans le code pour les motifs de liaison. */
  readonly entreesTrouvees: number;
  readonly tables: readonly string[];
  readonly dependances: readonly string[];
  /** Fichiers de test existants relevés. */
  readonly tests: readonly string[];
  readonly etat: EtatInventaire;
  readonly preuve: NiveauPreuve;
  /** Vrai tant que rien dans le code ne prouve que le moteur fonctionne. */
  readonly declareSeulement: boolean;
  /** Moteur intermédiaire prévu pour ce moteur (id de l'intermédiaire), ou null si aucun n'est prévu. */
  readonly intermediairePrevu: string | null;
  readonly connexionsExistantes: readonly string[];
  readonly connexionsAConstruire: readonly string[];
  readonly manques: readonly string[];
  /** Doublons ou recouvrements relevés (jamais fusionnés ici). */
  readonly doublons: readonly string[];
  /** Points à vérifier (identité, source inaccessible, incohérence). */
  readonly aVerifier: readonly string[];
}

export interface SourceInventaire {
  readonly depot: string;
  readonly commit: string;
  readonly dateCommit: string;
  readonly genereLe: string;
  readonly fichiersLus: readonly string[];
}

/** Exigence du plan d'ensemble de la Boutique (gap-inventory.json) : le niveau demandé, pas le niveau livré. */
export interface ExigenceBoutique {
  readonly nom: string;
  readonly critere: Readonly<Record<string, "PARTIAL" | "MISSING" | "COMPLETE">>;
  readonly moteurRegistre: string | null;
  readonly observe: string;
}

export interface InventaireBoutique {
  readonly source: SourceInventaire;
  readonly auditExigences: { readonly commitAudite: string; readonly total: number; readonly criteres: Readonly<Record<string, number>>; readonly planCompletDansLeDepot: boolean };
  readonly moteurs: readonly LigneInventaire[];
  /** Les moteurs intermédiaires déjà préparés par la Boutique (contrats de la migration 0057 + accès de service). */
  readonly intermediaires: readonly LigneInventaire[];
  readonly exigences: readonly ExigenceBoutique[];
  /** Exigences de la Boutique qu'aucun moteur du registre ne porte. */
  readonly exigencesSansMoteur: readonly string[];
  /** Moteurs du registre qu'aucune exigence ne mentionne. */
  readonly moteursSansExigence: readonly string[];
  readonly contrats: readonly { readonly id: string; readonly moteur: string; readonly statut: string; readonly source: string; readonly cible: string }[];
}

export interface InventairePlateforme {
  readonly source: SourceInventaire;
  readonly moteurs: readonly LigneInventaire[];
  /** Les canaux du moteur intermédiaire shop_link (côté plateforme), un par canal. */
  readonly intermediaires: readonly LigneInventaire[];
}

export const ETATS_INVENTAIRE: readonly EtatInventaire[] = ["incomplet", "prepare", "installe", "teste", "connecte", "a_verifier"];

export const LIBELLE_ETAT: Readonly<Record<EtatInventaire, string>> = {
  incomplet: "Incomplet",
  prepare: "Préparé",
  installe: "Installé",
  teste: "Testé",
  connecte: "Connecté",
  a_verifier: "À vérifier",
};

export const DEFINITION_ETAT: Readonly<Record<EtatInventaire, string>> = {
  incomplet: "Déclaré, mais sans liaison d'exécution relevée dans le code, ou bloqué par un accès externe.",
  prepare: "Préparé pour la connexion (contrat ou structure prêts) sans exécution raccordée.",
  installe: "Une liaison d'exécution (route, procédure) existe dans le code relevé.",
  teste: "Installé, et au moins un fichier de test existe dans le dépôt (non exécuté ici).",
  connecte: "Liaison avec une autre plateforme observée et vérifiée par le centre. Aucune à ce jour.",
  a_verifier: "Source inaccessible ou identité non établie : rien n'est affirmé.",
};
