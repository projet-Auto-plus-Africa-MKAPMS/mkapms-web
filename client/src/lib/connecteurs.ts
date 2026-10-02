/**
 * Catalogue « Connecter les outils » du Coffre secret.
 *
 * Pour chaque outil que le PDG veut brancher (Google Play Console, Apple,
 * GitHub, Railway, boîte mail…), la liste des secrets réellement nécessaires,
 * avec le nom, le service et le mode PRÉ-REMPLIS dans le formulaire du Coffre :
 * un clic, on colle la valeur, c'est déposé. Une coche s'affiche quand un
 * secret de ce nom est déjà dans le coffre.
 *
 * Deux règles de franchise :
 *  - `usage` dit ce que le moteur fait RÉELLEMENT de ces secrets aujourd'hui
 *    (souvent : rien encore — déposer un secret n'est pas le brancher à un
 *    outil). Rien n'est affiché comme « connecté » parce qu'un secret existe.
 *  - Aucun logo de marque n'est reproduit ici (le dépôt n'utilise jamais
 *    d'illustration de substitution) : seulement une initiale neutre.
 */

export type TypeSecretConnecteur = "identifiants" | "cle_api" | "fichier";

export interface ElementConnecteur {
  /** Nom exact sous lequel le secret est déposé dans le coffre (sert à détecter la coche). */
  nom: string;
  type: TypeSecretConnecteur;
  /** Ce que c'est et où le trouver, en une phrase. */
  aide: string;
  facultatif?: boolean;
}

export interface Connecteur {
  id: string;
  libelle: string;
  /** Texte du service visé, pré-rempli dans le formulaire. */
  service: string;
  initiale: string;
  groupe: "Applications mobiles" | "Code et déploiement" | "Boutiques" | "Comptes";
  elements: ElementConnecteur[];
  /** Ce que le moteur fait réellement de ces secrets aujourd'hui. */
  usage: string;
  avertissement?: string;
}

export const CONNECTEURS: Connecteur[] = [
  {
    id: "google-play",
    libelle: "Google Play Console (Android)",
    service: "Google Play Console",
    initiale: "G",
    groupe: "Applications mobiles",
    elements: [
      { nom: "Google Play — compte de service", type: "fichier", aide: "Fichier JSON d'un compte de service ayant accès à l'API Play Developer (Google Cloud → IAM, puis Play Console → Utilisateurs et autorisations)." },
      { nom: "Android — trousseau d'upload", type: "fichier", aide: "Fichier .jks / .keystore de la clé d'UPLOAD. Ne jamais en créer un nouveau si celui de production existe (Play App Signing d'abord)." },
      { nom: "Android — alias et mot de passe du trousseau", type: "identifiants", aide: "Identifiant = alias de la clé ; mot de passe = mot de passe du trousseau." },
      { nom: "Android — mot de passe de la clé", type: "cle_api", aide: "Seulement s'il diffère du mot de passe du trousseau.", facultatif: true },
    ],
    usage:
      "Aucun outil du moteur ne signe encore ni ne dépose sur Google Play : les secrets sont gardés, chiffrés, pour les outils à venir. La construction et la signature se font aujourd'hui dans le workflow GitHub « Android — App Bundles ».",
  },
  {
    id: "apple",
    libelle: "Apple — App Store Connect (iPhone)",
    service: "Apple App Store Connect",
    initiale: "A",
    groupe: "Applications mobiles",
    elements: [
      { nom: "Apple — clé API App Store Connect (.p8)", type: "fichier", aide: "Fichier .p8 créé dans App Store Connect → Utilisateurs et accès → Clés." },
      { nom: "Apple — Key ID", type: "cle_api", aide: "Identifiant de la clé API (10 caractères)." },
      { nom: "Apple — Issuer ID", type: "cle_api", aide: "Identifiant de l'émetteur, affiché en haut de la page des clés." },
      { nom: "Apple — Team ID", type: "cle_api", aide: "Identifiant d'équipe du compte Apple Developer." },
      { nom: "Apple — certificat de distribution (.p12)", type: "fichier", aide: "Certificat exporté du trousseau d'accès.", facultatif: true },
      { nom: "Apple — mot de passe du certificat (.p12)", type: "cle_api", aide: "Mot de passe choisi à l'export du .p12.", facultatif: true },
      { nom: "Apple — profil de provisionnement", type: "fichier", aide: "Fichier .mobileprovision de l'application.", facultatif: true },
    ],
    usage: "Aucun outil. Le dépôt n'a pas encore de projet iOS : déposer ces éléments prépare le terrain, rien de plus.",
    avertissement: "Un identifiant Apple protégé par la double authentification ne s'ouvre pas avec un simple mot de passe : utilisez la clé API.",
  },
  {
    id: "github",
    libelle: "GitHub",
    service: "GitHub",
    initiale: "H",
    groupe: "Code et déploiement",
    elements: [
      { nom: "GitHub — jeton mkapms-web", type: "cle_api", aide: "Jeton à portée fine limité au dépôt mkapms-web : Contents et Pull requests en lecture/écriture, Actions en lecture (écriture seulement si vous voulez que le moteur lance le workflow Android)." },
    ],
    usage:
      "Deux outils en lecture seule : vérifier la connexion au dépôt et consulter les exécutions du workflow Android (nom attendu : « GitHub — jeton mkapms-web »). Le moteur ne pousse, ne fusionne ni ne lance rien avec ce jeton : le code est poussé par la session de développement, et vous déployez à la main.",
  },
  {
    id: "railway",
    libelle: "Railway",
    service: "Railway",
    initiale: "R",
    groupe: "Code et déploiement",
    elements: [
      { nom: "Railway — jeton de projet", type: "cle_api", aide: "Jeton de projet Railway (Project → Settings → Tokens)." },
      { nom: "Railway — identifiant du projet", type: "cle_api", aide: "Project ID.", facultatif: true },
      { nom: "Railway — identifiant du service", type: "cle_api", aide: "Service ID.", facultatif: true },
      { nom: "Railway — identifiant de l'environnement", type: "cle_api", aide: "Environment ID.", facultatif: true },
    ],
    usage:
      "L'outil de lecture d'état des déploiements lit aujourd'hui les variables du serveur Railway (RAILWAY_TOKEN, RAILWAY_PROJECT_ID, RAILWAY_SERVICE_ID, RAILWAY_ENVIRONMENT_ID), pas le coffre. Le moteur ne déclenche jamais de déploiement : vous déployez à la main.",
  },
  {
    id: "boutique-shop",
    libelle: "Boutique MKA.P-MS (SHOP)",
    service: "Boutique MKA.P-MS (SHOP)",
    initiale: "B",
    groupe: "Boutiques",
    elements: [
      { nom: "Boutique — adresse", type: "cle_api", aide: "Adresse du site de la boutique, sans chemin (exemple : https://boutique.exemple.com). Nom de domaine public en https seulement." },
      { nom: "Boutique — jeton de service", type: "cle_api", aide: "Jeton créé dans la boutique : réglages de l'assistant SHOP → « Accès de l'IA de la plateforme principale » (mot de passe Fondateur + code de sécurité). Il n'est affiché qu'une fois, expire (90 jours maximum) et se révoque à tout moment." },
    ],
    usage:
      "Cinq outils : lire la liste et la fiche des produits, lancer la préparation des photos, proposer le brouillon d'une fiche, dire les portées du jeton. Les fiches restent « à relire » : seul le PDG approuve et publie, dans la boutique. Jamais de prix, de TVA, de stock ni de livraison avec ce jeton. Les droits d'image du fournisseur doivent être enregistrés dans la boutique avant tout travail sur les photos.",
    avertissement: "Ne collez jamais ce jeton dans une conversation : déposez-le ici seulement. Si vous le croyez exposé, révoquez-le dans la boutique.",
  },
  {
    id: "boite-mail",
    libelle: "Boîte mail / compte Google",
    service: "Boîte mail",
    initiale: "@",
    groupe: "Comptes",
    elements: [
      { nom: "Boîte mail — adresse et mot de passe", type: "identifiants", aide: "Adresse e-mail et mot de passe du compte." },
    ],
    usage: "Aucun outil du moteur ne se connecte à une boîte mail.",
    avertissement: "Un compte protégé par la double authentification ne peut pas être ouvert automatiquement avec un mot de passe.",
  },
];

export type EtatElement = "depose" | "a_deposer";

export interface ResumeConnecteur {
  id: string;
  /** Éléments obligatoires déjà dans le coffre / total des obligatoires. */
  obligatoiresDeposes: number;
  obligatoiresTotal: number;
  /** Vrai quand tous les éléments obligatoires sont déposés. */
  complet: boolean;
  etats: { nom: string; etat: EtatElement }[];
}

/** Compare le catalogue aux noms des secrets réellement présents (jamais à leur valeur). */
export function resumerConnecteur(connecteur: Connecteur, nomsPresents: readonly string[]): ResumeConnecteur {
  const presents = new Set(nomsPresents.map((n) => n.trim().toLowerCase()));
  const etats = connecteur.elements.map((e) => ({
    nom: e.nom,
    etat: (presents.has(e.nom.trim().toLowerCase()) ? "depose" : "a_deposer") as EtatElement,
  }));
  const obligatoires = connecteur.elements.map((e, i) => ({ e, i })).filter(({ e }) => !e.facultatif);
  const obligatoiresDeposes = obligatoires.filter(({ i }) => etats[i]!.etat === "depose").length;
  return {
    id: connecteur.id,
    obligatoiresDeposes,
    obligatoiresTotal: obligatoires.length,
    complet: obligatoires.length > 0 && obligatoiresDeposes === obligatoires.length,
    etats,
  };
}
