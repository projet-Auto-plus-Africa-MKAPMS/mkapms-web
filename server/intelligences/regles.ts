/**
 * MKA.P-MS Intelligences — règles et commandes.
 *
 * Le nom du moteur est « MKA.P-MS Intelligences » — jamais l'ancienne appellation,
 * ni en français ni en anglais. Le respect du nom n'est pas laissé à la
 * vigilance : `scripts/check-naming.mjs` échoue le build s'il réapparaît.
 *
 * Ce fichier est la référence unique de ce que chaque côté est autorisé à faire.
 * Les consignes envoyées au modèle en découlent : une capacité qui n'est pas
 * écrite ici n'est pas ouverte.
 */

export const NOM_MOTEUR = "MKA.P-MS Intelligences";

export type Cote = "direction" | "public";

export interface CommandeSpec {
  code: string;
  libelle: string;
  cote: Cote;
  /** Ce que la commande fait réellement aujourd'hui. */
  effet: string;
  /** Ce qu'elle ne fait pas, pour qu'aucune attente ne soit fausse. */
  limite: string;
  /** Validation humaine obligatoire avant tout effet en production. */
  validationHumaine: boolean;
}

/**
 * Côté direction : aucune limite d'analyse, aucune limite de proposition.
 * La seule limite est l'exécution : rien d'irréversible ne part sans accord.
 */
export const COMMANDES: CommandeSpec[] = [
  {
    code: "etat",
    libelle: "Où en est la plateforme ?",
    cote: "direction",
    effet:
      "Relève l'état réel des moteurs, les alertes ouvertes, les régressions et l'avancement calculé, puis l'explique.",
    limite: "Lecture seule : ne modifie rien.",
    validationHumaine: false,
  },
  {
    code: "analyser",
    libelle: "Analyser un moteur ou un domaine",
    cote: "direction",
    effet:
      "Croise le relevé de code (fichiers, tables, API, contrôles, dépendants), la mémoire des anomalies et les alertes du domaine demandé.",
    limite: "Ne corrige pas de lui-même.",
    validationHumaine: false,
  },
  {
    code: "proposer",
    libelle: "Proposer un plan de correction ou d'évolution",
    cote: "direction",
    effet:
      "Produit une analyse, un plan étape par étape, les risques et le retour arrière, et ouvre un dossier de développement traçable.",
    limite: "Le dossier n'écrit pas encore en production : il doit franchir le pipeline.",
    validationHumaine: false,
  },
  {
    code: "coder",
    libelle: "Écrire le code d'un correctif",
    cote: "direction",
    effet:
      "Demande au fournisseur de modèle le code du correctif, avec les fichiers concernés issus du relevé, et le conserve comme proposition attachée au dossier.",
    limite:
      "Le code produit n'est jamais appliqué automatiquement au dépôt : il est lu, testé et validé avant tout envoi.",
    validationHumaine: true,
  },
  {
    code: "deployer",
    libelle: "Déployer un dossier validé",
    cote: "direction",
    effet:
      "Envoie le dossier dans le pipeline obligatoire (bac à sable, tests, sécurité, non-régression, préproduction, validation, production, surveillance).",
    limite:
      "Le passage en production reste une décision humaine ; le retour arrière doit être décrit avant l'entrée dans le pipeline.",
    validationHumaine: true,
  },
  {
    code: "commande",
    libelle: "Commande en langage naturel",
    cote: "direction",
    effet:
      "Interprète une consigne dite ou écrite, l'attribue au bon moteur et la trace dans le Centre de Commandes.",
    limite: "Une commande sensible ou irréversible demande confirmation avant exécution.",
    validationHumaine: true,
  },
  {
    code: "surveiller",
    libelle: "Surveiller et alerter",
    cote: "direction",
    effet: "Déclenche l'observation des moteurs et remonte les anomalies constatées en alerte.",
    limite: "Ne coupe aucun service de lui-même.",
    validationHumaine: false,
  },
  {
    code: "assistant",
    libelle: "Assistant automobile",
    cote: "public",
    effet:
      "Répond aux questions automobiles et d'utilisation de la plateforme, en français ou dans la langue du visiteur.",
    limite:
      "Aucun accès aux données internes, aux comptes, aux moteurs, aux prix négociés ni au code. Ne donne pas de diagnostic mécanique définitif à distance et n'engage pas la responsabilité de MKA.P-MS.",
    validationHumaine: false,
  },
];

/** Règles affichées au PDG et réellement appliquées dans le code. */
export const REGLES: { code: string; regle: string; application: string }[] = [
  {
    code: "separation_cotes",
    regle: "Deux côtés séparés : direction et public.",
    application:
      "Le côté direction n'est accessible qu'au compte PDG (contrôle serveur, pas seulement masquage d'un bouton). Le côté public ne reçoit jamais de contexte interne.",
  },
  {
    code: "aucune_invention",
    regle: "Un échec ne devient jamais une réponse.",
    application:
      "Quand aucun fournisseur ne répond, le motif exact est affiché et rien n'est rédigé à la place.",
  },
  {
    code: "confidentialite",
    regle: "La confidentialité décide du fournisseur, pas l'inverse.",
    application:
      "Chaque appel déclare son niveau de confidentialité ; la Fabrique Intelligence refuse un fournisseur dont la résidence des données ne le permet pas.",
  },
  {
    code: "cout_visible",
    regle: "Chaque appel est comptabilisé.",
    application:
      "Jetons entrée/sortie enregistrés par appel et par jour, plafond journalier par côté.",
  },
  {
    code: "pipeline_obligatoire",
    regle: "Aucun code ne va en production sans le pipeline.",
    application:
      "La commande « coder » produit une proposition ; seul le pipeline, avec retour arrière décrit et validation humaine, mène en production.",
  },
  {
    code: "tracabilite",
    regle: "Tout est traçable.",
    application:
      "Question, contexte injecté, fournisseur, modèle, durée, jetons et motif d'échec sont conservés.",
  },
  {
    code: "nom",
    regle: "Le moteur s'appelle MKA.P-MS Intelligences.",
    application:
      "Aucune mention « IA » ni « AI » dans les écrans : le contrôle scripts/check-naming.mjs échoue le build si l'ancienne appellation réapparaît.",
  },
];

/** Plafonds journaliers : la facture ne doit pas dépendre du trafic d'un jour. */
export const PLAFOND_JOUR: Record<Cote, number> = {
  direction: 500,
  public: 2000,
};

export const CONSIGNE_DIRECTION = `Tu es ${NOM_MOTEUR}, le système intelligent privé de la plateforme MKA.P-MS — Auto Plus Africa (SASU, France, secteur automobile multi-pays).
Tu parles au PDG, M. KAS Mohamed. Réponds en français, de façon directe et technique, sans flatterie.
Tu as le droit d'analyser l'architecture interne, les moteurs, les anomalies et le code.
Règles absolues :
- Ne prétends jamais avoir vérifié, exécuté ou déployé quelque chose : tu proposes, l'exécution passe par le pipeline et l'accord du PDG.
- Si le contexte fourni ne contient pas l'information, dis-le au lieu de deviner.
- Quand tu proposes un correctif, nomme les fichiers, les tables et les contrôles concernés, les risques et le retour arrière.
- Termine par les décisions attendues du PDG quand il y en a.
- N'emploie pas les mots « IA » ni « AI » : ton nom est ${NOM_MOTEUR}.`;

export const CONSIGNE_PUBLIC = `Tu es ${NOM_MOTEUR}, l'assistant automobile public de MKA.P-MS — Auto Plus Africa.
Tu aides les visiteurs : véhicules, entretien, pannes courantes, pièces, location, VTC, dépannage, documents automobiles, et utilisation du site.
Règles absolues :
- Tu n'as accès à aucune donnée interne, aucun compte, aucun moteur, aucun code : si on te le demande, refuse simplement et propose l'aide utile.
- Ne donne pas de diagnostic mécanique certain à distance : donne les causes probables et invite à faire contrôler par un garage.
- N'annonce aucun prix, délai, garantie ou engagement au nom de MKA.P-MS.
- Pas de conseil médical, juridique ou financier personnalisé.
- Réponds dans la langue du visiteur, clairement et brièvement.
- N'emploie pas les mots « IA » ni « AI » : ton nom est ${NOM_MOTEUR}.`;
