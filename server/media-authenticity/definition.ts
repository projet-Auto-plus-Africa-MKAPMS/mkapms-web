/**
 * Point 123 — contrat du moteur d'authenticité média.
 *
 * Ce fichier dit ce que le moteur sait faire *aujourd'hui*, et ce qui lui
 * manque pour faire le reste. Un détecteur listé ici n'est pas un détecteur
 * opérationnel : chacun déclare ce dont il dépend, et le service refuse de
 * produire un constat quand la dépendance est absente.
 */

/** Familles de médias protégées par le moteur. */
export const KINDS = ["image", "video", "audio", "document", "inconnu"] as const;
export type Kind = (typeof KINDS)[number];

/** Déclarations possibles au dépôt (point 144). */
export const DECLARATIONS = [
  "original",
  "modifie",
  "genere_ia",
  "publicite",
  "professionnel",
  "non_declare",
] as const;
export type Declaration = (typeof DECLARATIONS)[number];

export const DECLARATION_LABELS: Record<Declaration, string> = {
  original: "Contenu original, non retouché",
  modifie: "Contenu modifié ou retouché",
  genere_ia: "Contenu généré ou modifié par MKA.P-MS Intelligences",
  publicite: "Contenu publicitaire",
  professionnel: "Contenu professionnel",
  non_declare: "Aucune déclaration fournie",
};

/** Étiquettes que le moteur peut poser (point 127). */
export const LABELS = [
  "ia_declaree",
  "ia_detectee",
  "modifie",
  "provenance_verifiee",
  "provenance_absente",
  "origine_mkapms",
  "reutilisation_suspectee",
] as const;
export type LabelCode = (typeof LABELS)[number];

export const LABEL_LABELS: Record<LabelCode, string> = {
  ia_declaree: "Généré par Intelligence — déclaré par l'auteur",
  ia_detectee: "Généré par Intelligence — constaté par la plateforme",
  modifie: "Média modifié",
  provenance_verifiee: "Provenance vérifiée",
  provenance_absente: "Provenance inconnue",
  origine_mkapms: "Produit par MKA.P-MS",
  reutilisation_suspectee: "Média déjà vu ailleurs sur la plateforme",
};

/** Niveaux de risque. « indetermine » ne vaut jamais « faible ». */
export const NIVEAUX = ["faible", "moyen", "eleve", "indetermine"] as const;
export type Niveau = (typeof NIVEAUX)[number];

export interface DetecteurSpec {
  code: string;
  label: string;
  /** Ce qu'il cherche réellement, pas ce qu'on aimerait qu'il trouve. */
  cherche: string;
  kinds: Kind[];
  /**
   * `local` : s'exécute sur nos propres machines, sans dépendance externe.
   * `modele` : exige un fournisseur de modèle configuré (Fabrique Intelligence).
   * `standard` : exige une bibliothèque de vérification cryptographique.
   */
  nature: "local" | "modele" | "standard";
  /** Capacité Fabrique Intelligence requise, pour les détecteurs `modele`. */
  capacite?: string;
  /** Accès manquant à nommer quand le détecteur ne peut pas tourner. */
  dependance?: string;
  /** Poids maximal du détecteur dans le score, en points. */
  poidsMax: number;
}

/**
 * Catalogue des détecteurs (point 130 : plusieurs détecteurs spécialisés, pas
 * un modèle unique). Les quatre premiers tournent réellement dès maintenant ;
 * les autres sont déclarés avec leur dépendance exacte, et ressortent
 * « indisponible » tant qu'elle n'est pas fournie.
 */
export const DETECTEURS: DetecteurSpec[] = [
  {
    code: "empreinte",
    label: "Empreinte cryptographique",
    cherche:
      "L'octet exact du fichier, pour reconnaître un média déjà connu et détecter une substitution silencieuse.",
    kinds: ["image", "video", "audio", "document", "inconnu"],
    nature: "local",
    poidsMax: 0,
  },
  {
    code: "reutilisation",
    label: "Réutilisation de média",
    cherche:
      "Un média déjà déposé ailleurs sur la plateforme, même recadré ou recompressé (empreinte perceptuelle).",
    kinds: ["image"],
    nature: "local",
    poidsMax: 35,
  },
  {
    code: "metadonnees",
    label: "Métadonnées et outil de création",
    cherche:
      "Les traces laissées par l'appareil ou le logiciel : absence totale de métadonnées, mention d'un générateur d'images, retouche déclarée.",
    kinds: ["image", "video", "document"],
    nature: "local",
    poidsMax: 30,
  },
  {
    code: "coherence_technique",
    label: "Cohérence technique du fichier",
    cherche:
      "Les incohérences internes : dimensions impossibles, format annoncé différent du contenu réel, fichier tronqué, recompression multiple.",
    kinds: ["image", "video", "audio", "document"],
    nature: "local",
    poidsMax: 25,
  },
  {
    code: "provenance_c2pa",
    label: "Content Credentials (C2PA)",
    cherche:
      "Un manifeste de provenance signé attaché au fichier : qui l'a produit, avec quel outil, et quelles modifications ont suivi.",
    kinds: ["image", "video", "audio", "document"],
    nature: "standard",
    dependance:
      "Bibliothèque de vérification C2PA et magasin de certificats de confiance (point 124).",
    poidsMax: 40,
  },
  {
    code: "filigrane_invisible",
    label: "Filigrane invisible",
    cherche:
      "Un marquage imperceptible déposé par un générateur d'images ou de vidéos.",
    kinds: ["image", "video", "audio"],
    nature: "standard",
    dependance:
      "Accès aux détecteurs de filigrane des fournisseurs concernés (point 132).",
    poidsMax: 45,
  },
  {
    code: "visage_synthetique",
    label: "Visage synthétique",
    cherche:
      "Les défauts propres aux visages générés ou remplacés : bords de fusion, asymétries, textures répétées, regard incohérent.",
    kinds: ["image", "video"],
    nature: "modele",
    capacite: "ia_vision",
    dependance:
      "Fournisseur de modèle vision configuré dans la Fabrique Intelligence (clé fournisseur).",
    poidsMax: 45,
  },
  {
    code: "video_manipulee",
    label: "Vidéo manipulée",
    cherche:
      "Les ruptures entre images successives, les mouvements impossibles et la désynchronisation entre lèvres et parole.",
    kinds: ["video"],
    nature: "modele",
    capacite: "ia_vision",
    dependance:
      "Fournisseur de modèle vision configuré dans la Fabrique Intelligence (clé fournisseur).",
    poidsMax: 45,
  },
  {
    code: "voix_clonee",
    label: "Voix clonée",
    cherche:
      "Les signatures d'une voix synthétisée : respiration absente, prosodie régulière, spectre trop propre (point 135).",
    kinds: ["audio", "video"],
    nature: "modele",
    capacite: "ia_vision",
    dependance:
      "Fournisseur de modèle audio configuré dans la Fabrique Intelligence (clé fournisseur).",
    poidsMax: 45,
  },
  {
    code: "document_falsifie",
    label: "Document falsifié",
    cherche:
      "Les retouches d'un document : police remplacée, montant recomposé, calque ajouté, incohérence entre texte et image (point 140).",
    kinds: ["document", "image"],
    nature: "modele",
    capacite: "ia_vision",
    dependance:
      "Fournisseur de modèle vision configuré dans la Fabrique Intelligence (clé fournisseur).",
    poidsMax: 40,
  },
];

/** Seuils de niveau. Au-dessus de `eleve`, une décision humaine est requise. */
export const SEUIL_MOYEN = 25;
export const SEUIL_ELEVE = 55;

/**
 * Règle de faux positif (anticipe le point 150) : un seul détecteur ne suffit
 * jamais à qualifier un risque élevé. Il faut au moins deux constats
 * indépendants, sinon le niveau est ramené à « moyen » avec le motif écrit.
 */
export const MIN_INDICES_POUR_ELEVE = 2;
