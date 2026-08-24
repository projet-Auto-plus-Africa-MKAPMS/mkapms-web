/**
 * MKA.P-MS Intelligences — domaines d'assistance du côté public.
 *
 * L'assistant public ne se limite plus à l'automobile : il aide dans la vie
 * quotidienne et dans le travail, partout où la plateforme est ouverte. Chaque
 * domaine porte sa propre consigne, sa propre limite, et son propre interrupteur
 * gouverné par le PDG : un domaine construit n'est pas un domaine ouvert.
 *
 * Deux domaines sont volontairement plus stricts que les autres :
 *  - `religion` : aucune source inventée. Une réponse sans référence exacte
 *    (sourate et verset, recueil et numéro) doit être refusée, pas approchée.
 *  - `sante` : information générale et orientation vers un professionnel.
 *    Aucun diagnostic, aucune ordonnance, aucune posologie.
 */

export interface DomaineSpec {
  code: string;
  libelle: string;
  /** Ce que le domaine apporte réellement au visiteur. */
  effet: string;
  /** Ce qu'il ne fait pas, écrit au visiteur plutôt que découvert par lui. */
  limite: string;
  /** Consigne ajoutée à la consigne publique quand ce domaine est choisi. */
  consigne: string;
  /**
   * Ouvert par défaut. Les domaines sensibles restent fermés jusqu'à une
   * activation explicite du PDG, conformément à la règle : ce qui n'a pas été
   * demandé activé reste construit mais éteint.
   */
  actifParDefaut: boolean;
  /** Une réponse sans source vérifiable est refusée au lieu d'être rédigée. */
  sourceObligatoire: boolean;
}

export const DOMAINES: DomaineSpec[] = [
  {
    code: "automobile",
    libelle: "Automobile & plateforme",
    effet:
      "Véhicules, entretien, pannes courantes, pièces, location, VTC, dépannage, documents automobiles et usage du site.",
    limite: "Aucun diagnostic mécanique certain à distance, aucun prix ni délai engagé au nom de MKA.P-MS.",
    consigne:
      "Domaine : automobile et usage de la plateforme. Donne les causes probables et invite à faire contrôler par un garage. N'annonce aucun prix, délai ni garantie au nom de MKA.P-MS.",
    actifParDefaut: true,
    sourceObligatoire: false,
  },
  {
    code: "vie_quotidienne",
    libelle: "Vie quotidienne",
    effet:
      "Écrire un courrier, comprendre un document, organiser un déplacement, comparer des options, traduire, calculer, apprendre.",
    limite: "Aucun conseil juridique, médical ou financier personnalisé : orientation vers un professionnel.",
    consigne:
      "Domaine : aide à la vie quotidienne. Sois concret et utile : rédaction, explication, traduction, calcul, organisation, apprentissage. Pour le juridique, le médical et le financier personnel, explique le cadre général puis renvoie vers un professionnel.",
    actifParDefaut: true,
    sourceObligatoire: false,
  },
  {
    code: "professionnel",
    libelle: "Travail & activité professionnelle",
    effet:
      "Devis, factures, relances, annonces, fiches produit, organisation d'atelier, gestion de stock, recrutement, formation d'équipe.",
    limite:
      "Ne remplace ni comptable ni juriste, et n'utilise aucune donnée interne de la plateforme ni d'un autre compte.",
    consigne:
      "Domaine : travail et activité professionnelle. Produis des documents et des méthodes directement utilisables (devis, facture, relance, annonce, procédure d'atelier, suivi de stock). Rappelle qu'un comptable ou un juriste valide les engagements réglementaires.",
    actifParDefaut: true,
    sourceObligatoire: false,
  },
  {
    code: "religion",
    libelle: "Religion (islam) — sources exactes",
    effet:
      "Tawhid, Coran, hadith, conseils du Prophète ﷺ et des compagnons, avis de savants — chaque réponse avec sa référence.",
    limite:
      "Aucune source approximative : sans référence exacte, la réponse est refusée. Ne remplace pas un savant et ne tranche pas les divergences.",
    consigne: [
      "Domaine : religion musulmane, avec une obligation de source stricte.",
      "Règles absolues :",
      "- Cite chaque élément avec sa référence exacte : sourate et numéro de verset pour le Coran ; recueil, chapitre et numéro pour un hadith ; nom du savant et ouvrage pour un avis.",
      "- Si tu n'es pas certain de la référence exacte, dis-le clairement et ne rédige pas la citation : une source inventée en religion est une faute, pas une approximation.",
      "- N'attribue jamais au Prophète ﷺ ni à un compagnon une parole dont tu ne connais pas la référence.",
      "- Ne tranche pas une divergence entre écoles : expose les avis avec leurs sources et renvoie à un savant.",
      "- Garde un ton positif et pédagogique, sans jugement sur les personnes.",
    ].join("\n"),
    actifParDefaut: true,
    sourceObligatoire: true,
  },
  {
    code: "sante",
    libelle: "Santé — information et prudence",
    effet:
      "Information générale, hygiène de vie, signes qui doivent alerter, préparation d'une consultation, compréhension d'un terme médical.",
    limite:
      "Aucun diagnostic, aucune ordonnance, aucune posologie, aucun arrêt ou changement de traitement. Urgence : services d'urgence locaux.",
    consigne: [
      "Domaine : santé, en information seulement.",
      "Règles absolues :",
      "- Ne pose aucun diagnostic, ne prescris rien, ne donne aucune posologie et ne conseille jamais d'arrêter ou de modifier un traitement.",
      "- Donne une information générale, les signes qui doivent alerter, et invite à consulter un professionnel de santé.",
      "- Devant un signe grave (douleur thoracique, difficulté à respirer, perte de connaissance, saignement important, atteinte d'un enfant ou d'une femme enceinte), demande d'appeler immédiatement les services d'urgence du pays.",
      "- Quand un conseil traditionnel ou religieux est demandé, distingue clairement ce qui relève du confort et ce qui exige un médecin.",
    ].join("\n"),
    actifParDefaut: true,
    sourceObligatoire: false,
  },
  {
    code: "technique",
    libelle: "Technique, électronique & industrie",
    effet:
      "Comprendre un calculateur, un schéma électrique, une chaîne de production, une machine, un automate, un robot industriel.",
    limite:
      "Ne valide aucune conception : une pièce, un calculateur ou une ligne de production exige des essais et une homologation réels.",
    consigne:
      "Domaine : technique, électronique et industrie. Explique les principes, les architectures et les méthodes de mise au point. Rappelle qu'aucune conception n'est validée sans essais mesurés et homologation ; ne donne pas de valeur de réglage comme si elle était vérifiée.",
    actifParDefaut: false,
    sourceObligatoire: false,
  },
];

const PAR_CODE = new Map(DOMAINES.map((d) => [d.code, d]));

export function domaine(code: string): DomaineSpec | null {
  return PAR_CODE.get(code) ?? null;
}

export const DOMAINE_DEFAUT = "automobile";
