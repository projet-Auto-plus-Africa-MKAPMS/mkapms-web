/**
 * Points 104-107 — Event Bus central : catalogue des événements et des
 * abonnements.
 *
 * Un moteur ne lit ni n'écrit jamais dans les tables d'un autre : il publie un
 * événement, et le bus le remet aux moteurs abonnés. Ce fichier est le contrat :
 * ce qui peut être publié, et qui l'écoute. Un événement publié sans abonné
 * n'est pas une erreur silencieuse — il est affiché comme « orphelin ».
 */

/** Domaines d'événements — sert au regroupement à l'écran. */
export const DOMAINES = [
  "annonce",
  "produit",
  "paiement",
  "moteur",
  "utilisateur",
  "contenu",
] as const;

export type Domaine = (typeof DOMAINES)[number];

export interface EventTypeSpec {
  /** Clé stable. Ex : "annonce.publiee". */
  code: string;
  domaine: Domaine;
  label: string;
  /** Ce que l'événement signifie réellement, pas ce qu'on aimerait qu'il fasse. */
  description: string;
  /** Champs attendus dans la charge utile. Un champ manquant fait échouer la remise. */
  champs: string[];
  /** Moteurs qui publient légitimement cet événement. */
  emetteurs: string[];
}

export const EVENT_TYPES: EventTypeSpec[] = [
  {
    code: "annonce.publiee",
    domaine: "annonce",
    label: "Annonce publiée",
    description:
      "Une annonce véhicule vient d'être publiée ou remise en ligne. Déclenche la mise sous surveillance d'indexation et la soumission active.",
    champs: ["annonceId"],
    emetteurs: ["annonces"],
  },
  {
    code: "annonce.modifiee",
    domaine: "annonce",
    label: "Annonce modifiée",
    description:
      "Le contenu public d'une annonce a changé : la page doit être resoumise, sans quoi les moteurs gardent l'ancienne version.",
    champs: ["annonceId"],
    emetteurs: ["annonces"],
  },
  {
    code: "piece.modifiee",
    domaine: "produit",
    label: "Pièce déposée, modifiée ou vendue",
    description:
      "Le catalogue produit a bougé : la fiche Google, le flux et le stock doivent suivre. Ne concerne jamais les véhicules.",
    champs: ["source", "sourceId", "declencheur"],
    emetteurs: ["pieces", "product_engine"],
  },
  {
    code: "paiement.reussi",
    domaine: "paiement",
    label: "Paiement encaissé",
    description:
      "Le prestataire a confirmé l'encaissement. Seule cette confirmation fait foi — un retour de navigateur n'en est pas une.",
    champs: ["reference"],
    emetteurs: ["payment"],
  },
  {
    code: "paiement.echoue",
    domaine: "paiement",
    label: "Paiement refusé",
    description:
      "Un encaissement a échoué. Un échec répété est un signal de panne, pas une fatalité client.",
    champs: ["reference", "motif"],
    emetteurs: ["payment"],
  },
  {
    code: "moteur.degrade",
    domaine: "moteur",
    label: "Moteur dégradé ou hors service",
    description:
      "Une sonde a relevé un moteur hors de son état normal. Le Système Intelligent ouvre une alerte au lieu d'attendre qu'un client la découvre.",
    champs: ["moteur", "etat"],
    emetteurs: ["engine_registry", "monitoring"],
  },
  {
    code: "moteur.retabli",
    domaine: "moteur",
    label: "Moteur rétabli",
    description: "Un moteur précédemment dégradé est revenu à un état normal.",
    champs: ["moteur"],
    emetteurs: ["engine_registry", "monitoring"],
  },
  {
    code: "intelligences.echange",
    domaine: "contenu",
    label: "Échange MKA.P-MS Intelligences",
    description:
      "Une question a été posée à MKA.P-MS Intelligences (côté direction ou côté public) et une réponse a été tentée. L'événement porte le résultat réel : un appel refusé par le fournisseur est un signal, pas un silence.",
    champs: ["sessionId", "cote", "ok"],
    emetteurs: ["intelligences"],
  },
];

export interface SubscriptionSpec {
  /** Moteur abonné. */
  engine: string;
  /** Type d'événement écouté. */
  eventType: string;
  /** Traitement réellement exécuté à la remise (voir handlers.ts). */
  handler: string;
  /** Ce que l'abonné fait de l'événement. */
  effet: string;
}

export const SUBSCRIPTIONS: SubscriptionSpec[] = [
  {
    engine: "seo",
    eventType: "annonce.publiee",
    handler: "seo_annonce",
    effet:
      "Met la page sous surveillance d'indexation et soumet l'URL. La soumission n'est jamais comptée comme une indexation.",
  },
  {
    engine: "seo",
    eventType: "annonce.modifiee",
    handler: "seo_annonce",
    effet: "Resoumet la page modifiée et met à jour sa surveillance.",
  },
  {
    engine: "product_engine",
    eventType: "piece.modifiee",
    handler: "produit_sync",
    effet: "Recalcule l'éligibilité de la fiche, le flux produit et l'état des destinations.",
  },
  {
    engine: "smart",
    eventType: "moteur.degrade",
    handler: "smart_alerte",
    effet: "Ouvre une alerte de niveau élevé, dédupliquée par moteur.",
  },
  {
    engine: "smart",
    eventType: "paiement.echoue",
    handler: "smart_alerte_paiement",
    effet: "Ouvre une alerte critique : un encaissement refusé est une perte directe.",
  },
  {
    engine: "smart",
    eventType: "moteur.retabli",
    handler: "smart_retabli",
    effet:
      "Referme l'alerte ouverte pour ce moteur : une alerte qui reste ouverte après rétablissement fait perdre confiance à toutes les autres.",
  },
  {
    engine: "smart",
    eventType: "intelligences.echange",
    handler: "smart_intelligences",
    effet:
      "Ne fait rien tant que les appels aboutissent ; ouvre une alerte quand le fournisseur de modèle refuse les appels, car l'assistant public et la génération de code deviennent alors muets.",
  },
  {
    engine: "audit_os",
    eventType: "*",
    handler: "audit_trace",
    effet:
      "Trace chaque événement remis, quel que soit son type : sans journal, aucune remise n'est vérifiable.",
  },
];

export const EVENT_TYPE_CODES = EVENT_TYPES.map((e) => e.code);
