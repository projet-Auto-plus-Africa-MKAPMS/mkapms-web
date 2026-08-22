/**
 * Fonctionnalités natives du fournisseur connecté — construites au maximum,
 * allumées une par une par le propriétaire.
 *
 * La demande est explicite : « l'API a dix fonctionnalités, ajoute les dix ».
 * Ce fichier les déclare toutes, dit à quel moteur MKA.P-MS chacune sert et ce
 * qu'elle exige réellement pour fonctionner. Deux règles tenues :
 *
 *  - **rien ne s'allume tout seul** : une fonctionnalité non demandée reste
 *    construite mais éteinte, avec son bouton. Une capacité activée sans avoir
 *    été essayée, c'est une facture qui monte et un comportement que personne
 *    n'a vu tourner ;
 *  - **rien n'est dupliqué** : chaque fonctionnalité s'appuie sur la couche
 *    d'appel unique (`provider.ts`) et sur un moteur existant. Aucune ne
 *    crée un second chemin vers le fournisseur.
 */
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { providerStates } from "../ai-fabric/service.js";
import { PERMISSIONS, type CodeCapacite, type Permission } from "./capacites.js";
import { inFonctions } from "./schema.js";

export type CodeFonction =
  | "texte"
  | "sortie_structuree"
  | "appel_outils"
  | "vision"
  | "documents"
  | "raisonnement_long"
  | "flux_progressif"
  | "lot_differe"
  | "empreintes_semantiques"
  | "moderation"
  | "transcription"
  | "synthese_vocale"
  | "conversation_temps_reel"
  | "generation_image"
  | "edition_image"
  | "recherche_web"
  | "traduction"
  | "distillation";

export interface SpecFonction {
  code: CodeFonction;
  libelle: string;
  /** Ce que la fonctionnalité apporte réellement à la plateforme. */
  apport: string;
  /** Capacité du registre par laquelle elle passe — aucun chemin parallèle. */
  capacite: CodeCapacite;
  /** Capacité Fabrique nécessaire côté fournisseur. */
  capaciteFabrique: "ia_texte" | "ia_vision" | null;
  permission: Permission;
  /** Moteurs MKA.P-MS qui en bénéficient immédiatement. */
  beneficiaires: string[];
  /** Ce qu'il faut réellement en plus de la clé, quand il y a quelque chose. */
  exigence: string;
  /** Ce que son activation coûte ou risque — dit avant, pas après. */
  precaution: string;
  /**
   * Vrai seulement pour ce qui a été explicitement demandé et déjà en service.
   * Tout le reste attend une décision du propriétaire.
   */
  activeParDefaut: boolean;
  /** Étape du plan d'autonomie qu'elle sert (point 150). */
  autonomie: string;
}

export const FONCTIONS: SpecFonction[] = [
  {
    code: "texte",
    libelle: "Analyse et rédaction",
    apport:
      "Comprendre une demande, comparer des options, rédiger une réponse ou un rapport.",
    capacite: "raisonnement",
    capaciteFabrique: "ia_texte",
    permission: "ANALYZE",
    beneficiaires: ["intelligences", "smart_engine", "support_os", "knowledge_engine"],
    exigence: "Clé du fournisseur de texte.",
    precaution: "Facturé aux jetons : le plafond de consommation reste la seule limite réelle.",
    activeParDefaut: true,
    autonomie: "Socle : c'est cette fonctionnalité que le moteur MKA.P-MS devra reprendre en premier.",
  },
  {
    code: "sortie_structuree",
    libelle: "Réponse structurée garantie",
    apport:
      "Obtenir des champs exploitables (marque, modèle, année, budget, ville) au lieu d'une phrase à deviner.",
    capacite: "raisonnement",
    capaciteFabrique: "ia_texte",
    permission: "ANALYZE",
    beneficiaires: ["search_os", "annonces", "vo_engine", "intelligences"],
    exigence: "Aucune : même clé que l'analyse.",
    precaution:
      "Sans elle, la recherche vocale doit deviner les critères dans une phrase libre — source d'erreurs silencieuses.",
    activeParDefaut: true,
    autonomie: "Indispensable pour entraîner plus tard le moteur interne sur des exemples propres.",
  },
  {
    code: "appel_outils",
    libelle: "Appel d'outils de la plateforme",
    apport:
      "Laisser le modèle interroger nos moteurs (stock, prix, disponibilité, pays) au lieu de répondre de mémoire.",
    capacite: "outils",
    capaciteFabrique: "ia_texte",
    permission: "ANALYZE",
    beneficiaires: ["engine_registry", "event_bus", "command_center", "search_os"],
    exigence: "Aucune : les outils exposés restent ceux du registre.",
    precaution:
      "Un outil exposé est un pouvoir donné : chaque outil reste soumis à la permission du rôle et du moteur appelant.",
    activeParDefaut: false,
    autonomie: "Réutilisable tel quel par le moteur interne : les outils sont à nous.",
  },
  {
    code: "vision",
    libelle: "Lecture d'image",
    apport: "Comprendre une photo de véhicule, une capture d'écran, un dégât signalé.",
    capacite: "vision",
    capaciteFabrique: "ia_vision",
    permission: "ANALYZE",
    beneficiaires: ["media_os", "media_authenticity", "vo_engine"],
    exigence: "Clé d'un fournisseur vision.",
    precaution: "Facturé à l'image : à brancher sur les quotas avant d'ouvrir au public.",
    activeParDefaut: true,
    autonomie: "Remplacement par un modèle vision auto-hébergé.",
  },
  {
    code: "documents",
    libelle: "Lecture de document",
    apport: "Lire une carte grise, une facture, un devis, un contrat photographié.",
    capacite: "documents",
    capaciteFabrique: "ia_vision",
    permission: "ANALYZE",
    beneficiaires: ["document_os", "contrat_os", "comptabilite"],
    exigence: "Clé d'un fournisseur vision.",
    precaution:
      "Donnée personnelle : ne doit sortir que vers un fournisseur dont la confidentialité maximale le permet.",
    activeParDefaut: false,
    autonomie: "Lecture documentaire interne : forte valeur, car ces documents ne devraient pas sortir.",
  },
  {
    code: "raisonnement_long",
    libelle: "Raisonnement approfondi",
    apport:
      "Traiter un dossier complexe (litige, audit, régression) avec un raisonnement plus long avant de répondre.",
    capacite: "raisonnement",
    capaciteFabrique: "ia_texte",
    permission: "ANALYZE",
    beneficiaires: ["smart_audit", "resilience", "code_graph"],
    exigence: "Modèle de raisonnement disponible chez le fournisseur.",
    precaution: "Nettement plus coûteux et plus lent : à réserver aux dossiers qui le méritent.",
    activeParDefaut: false,
    autonomie: "Étape la plus difficile à internaliser : à garder externe le plus longtemps.",
  },
  {
    code: "flux_progressif",
    libelle: "Réponse au fil de l'eau",
    apport: "Afficher la réponse pendant qu'elle s'écrit, au lieu d'un écran figé.",
    capacite: "raisonnement",
    capaciteFabrique: "ia_texte",
    permission: "READ",
    beneficiaires: ["intelligences", "support_os"],
    exigence: "Aucune.",
    precaution:
      "Confort réel, mais un flux interrompu doit être signalé : une réponse coupée ne doit pas passer pour complète.",
    activeParDefaut: false,
    autonomie: "Sans effet sur l'indépendance.",
  },
  {
    code: "lot_differe",
    libelle: "Traitement par lots",
    apport:
      "Traiter en différé des milliers d'annonces ou de pages (traduction, résumé, contrôle qualité) à coût réduit.",
    capacite: "automatisation",
    capaciteFabrique: "ia_texte",
    permission: "TEST",
    beneficiaires: ["seo_os", "annonces", "language_os"],
    exigence: "Aucune.",
    precaution:
      "Un lot lancé sans plafond est le moyen le plus rapide de faire exploser une facture : quota obligatoire.",
    activeParDefaut: false,
    autonomie: "Sert directement à constituer le jeu d'exemples du moteur interne.",
  },
  {
    code: "empreintes_semantiques",
    libelle: "Recherche par le sens",
    apport:
      "Retrouver « citadine pas chère fiable » sans que ces mots figurent dans l'annonce.",
    capacite: "recherche",
    capaciteFabrique: "ia_texte",
    permission: "READ",
    beneficiaires: ["search_os", "seo_os", "knowledge_engine"],
    exigence: "Espace de stockage des empreintes, à prévoir avant l'ouverture au public.",
    precaution:
      "Les empreintes doivent être recalculées à chaque modification d'annonce, sinon la recherche mentira.",
    activeParDefaut: false,
    autonomie: "Internalisable rapidement : les empreintes peuvent être produites localement.",
  },
  {
    code: "moderation",
    libelle: "Filtrage des contenus",
    apport: "Repérer un texte ou une image interdits avant publication.",
    capacite: "vision",
    capaciteFabrique: "ia_vision",
    permission: "ANALYZE",
    beneficiaires: ["messaging_os", "annonces", "media_authenticity"],
    exigence: "Aucune.",
    precaution:
      "Un filtre imparfait bloque aussi des clients honnêtes : à croiser avec une seconde preuve avant tout blocage.",
    activeParDefaut: false,
    autonomie: "À doubler d'un filtre interne : dépendre d'un tiers pour publier est un risque.",
  },
  {
    code: "transcription",
    libelle: "Transcription de la voix",
    apport:
      "Transformer un vocal en texte : commande du propriétaire, recherche parlée d'un client, message vocal.",
    capacite: "transcription",
    capaciteFabrique: "ia_texte",
    permission: "READ",
    beneficiaires: ["command_center", "support_os", "search_os"],
    exigence: "Fournisseur de transcription. Sans lui, la dictée du navigateur sert de repli.",
    precaution: "Donnée personnelle : la voix d'un client ne part qu'avec son geste explicite.",
    activeParDefaut: false,
    autonomie: "Transcription auto-hébergée : réaliste, et elle évite d'envoyer des voix dehors.",
  },
  {
    code: "synthese_vocale",
    libelle: "Lecture à voix haute",
    apport: "Répondre en voix : accessibilité, conduite, illettrisme, appel sortant.",
    capacite: "voix",
    capaciteFabrique: "ia_texte",
    permission: "READ",
    beneficiaires: ["intelligences", "support_os"],
    exigence: "Fournisseur de synthèse. Repli : la voix du navigateur, gratuite.",
    precaution: "Une voix de synthèse doit rester annoncée comme telle.",
    activeParDefaut: false,
    autonomie: "Repli navigateur déjà suffisant : faible urgence.",
  },
  {
    code: "conversation_temps_reel",
    libelle: "Conversation vocale continue",
    apport: "Tenir un échange parlé avec un client sans passer par des allers-retours écrits.",
    capacite: "temps_reel",
    capaciteFabrique: "ia_texte",
    permission: "READ",
    beneficiaires: ["support_os", "messaging_os"],
    exigence: "Canal temps réel côté fournisseur et côté serveur.",
    precaution:
      "Le plus sensible : conversation enregistrée, donnée personnelle, coût à la minute. À n'ouvrir qu'encadré.",
    activeParDefaut: false,
    autonomie: "Dernière étape : à garder externe jusqu'à ce que le reste tienne seul.",
  },
  {
    code: "generation_image",
    libelle: "Création d'image",
    apport: "Produire un visuel de publicité, une illustration de page, une bannière pays.",
    capacite: "image",
    capaciteFabrique: "ia_vision",
    permission: "PROPOSE",
    beneficiaires: ["visibility_os", "media_os", "seo_os"],
    exigence: "Fournisseur d'images.",
    precaution:
      "Toute image produite doit être marquée comme générée : c'est ce que le bloc média impose, et la loi aussi.",
    activeParDefaut: false,
    autonomie: "Non prioritaire pour l'indépendance.",
  },
  {
    code: "edition_image",
    libelle: "Retouche d'image",
    apport: "Nettoyer un fond, effacer une plaque, recadrer proprement une photo d'annonce.",
    capacite: "image",
    capaciteFabrique: "ia_vision",
    permission: "PROPOSE",
    beneficiaires: ["media_os", "annonces"],
    exigence: "Fournisseur d'images.",
    precaution:
      "Retoucher la photo d'un véhicule vendu peut tromper l'acheteur : à réserver au fond et à la plaque.",
    activeParDefaut: false,
    autonomie: "Media OS couvre déjà le recadrage sans fournisseur.",
  },
  {
    code: "recherche_web",
    libelle: "Recherche sur le web",
    apport:
      "Vérifier une information hors plateforme : rappel constructeur, règle d'import, prix marché.",
    capacite: "recherche",
    capaciteFabrique: "ia_texte",
    permission: "ANALYZE",
    beneficiaires: ["knowledge_engine", "country_policy", "visibility_os"],
    exigence: "Outil de recherche activé côté fournisseur.",
    precaution:
      "Une source web n'est pas une vérité : toute information doit rester sourcée et datée, comme la veille existante.",
    activeParDefaut: false,
    autonomie: "À garder externe : personne n'internalise un index du web.",
  },
  {
    code: "traduction",
    libelle: "Traduction de contenu",
    apport: "Servir chaque pays dans sa langue, y compris les annonces et les documents.",
    capacite: "traduction",
    capaciteFabrique: "ia_texte",
    permission: "READ",
    beneficiaires: ["language_os", "seo_os", "annonces"],
    exigence: "Aucune.",
    precaution: "Une traduction automatique d'engagement contractuel doit être relue avant publication.",
    activeParDefaut: false,
    autonomie: "Internalisable : forte valeur, volume élevé et donc coût élevé.",
  },
  {
    code: "distillation",
    libelle: "Apprentissage du moteur MKA.P-MS",
    apport:
      "Réutiliser nos propres échanges réussis pour entraîner le moteur interne destiné à remplacer le fournisseur.",
    capacite: "automatisation",
    capaciteFabrique: "ia_texte",
    permission: "ADMINISTRATION",
    beneficiaires: ["intelligences", "ai_learning_os"],
    exigence:
      "Modèle auto-hébergé joignable (LOCAL_LLM_URL) et jeu d'exemples issu des appels déjà mesurés.",
    precaution:
      "Les conditions d'utilisation du fournisseur encadrent l'entraînement d'un modèle concurrent : à vérifier avant de lancer.",
    activeParDefaut: false,
    autonomie: "C'est l'étape qui rend le détachement possible.",
  },
];

export type EtatFonction = "active" | "eteinte" | "impossible";

export interface FonctionConstatee extends SpecFonction {
  etat: EtatFonction;
  /** Motif exact : pourquoi elle est active, éteinte, ou pas exécutable. */
  motif: string;
  /** Vrai quand elle pourrait être allumée dès maintenant. */
  activable: boolean;
  /** Vrai quand la décision vient du propriétaire et non du défaut. */
  decidee: boolean;
}

/**
 * État réel de chaque fonctionnalité : le fournisseur nécessaire est vérifié,
 * la décision du propriétaire l'emporte sur le défaut, et une fonctionnalité
 * sans fournisseur joignable est déclarée impossible plutôt que « prête ».
 */
export async function etat(): Promise<FonctionConstatee[]> {
  const [fournisseurs, decisions] = await Promise.all([
    providerStates(),
    db.select().from(inFonctions),
  ]);
  const parDecision = new Map(decisions.map((d) => [d.fonction, d]));

  const capaciteServie = (capacite: "ia_texte" | "ia_vision" | null): boolean => {
    if (capacite === null) return true;
    return fournisseurs.some(
      (f) => f.capability === capacite && (f.status === "actif" || f.status === "configure"),
    );
  };

  return FONCTIONS.map((spec) => {
    const decision = parDecision.get(spec.code);
    const voulue = decision ? decision.active : spec.activeParDefaut;
    const servie = capaciteServie(spec.capaciteFabrique);

    let etatFonction: EtatFonction;
    let motif: string;
    if (!servie) {
      etatFonction = "impossible";
      motif = `Aucun fournisseur joignable pour ${spec.capaciteFabrique} : ${spec.exigence}`;
    } else if (voulue) {
      etatFonction = "active";
      motif = decision?.motif?.trim()
        ? decision.motif
        : "Activée : fonctionnalité demandée et en service.";
    } else {
      etatFonction = "eteinte";
      motif = decision?.motif?.trim()
        ? decision.motif
        : "Construite et prête, éteinte tant que le propriétaire ne l'a pas allumée.";
    }

    return {
      ...spec,
      etat: etatFonction,
      motif,
      activable: servie,
      decidee: decision !== undefined,
    };
  });
}

/** Vrai seulement si la fonctionnalité est réellement allumée et exécutable. */
export async function activee(code: CodeFonction): Promise<{ ok: boolean; motif: string }> {
  const liste = await etat();
  const f = liste.find((x) => x.code === code);
  if (!f) return { ok: false, motif: `Fonctionnalité inconnue : ${code}.` };
  return { ok: f.etat === "active", motif: f.motif };
}

/** Décision du propriétaire, conservée avec son motif. */
export async function regler(input: {
  fonction: string;
  active: boolean;
  motif: string;
  actorId?: number;
}): Promise<{ ok: boolean; detail: string }> {
  const spec = FONCTIONS.find((f) => f.code === input.fonction);
  if (!spec) {
    return { ok: false, detail: `Fonctionnalité inconnue : ${input.fonction}.` };
  }
  const motif = input.motif.trim();
  if (input.active && motif.length < 3) {
    return {
      ok: false,
      detail:
        "Allumer une fonctionnalité engage un coût et un comportement : écrivez la raison, elle reste au journal.",
    };
  }

  const liste = await etat();
  const constatee = liste.find((f) => f.code === input.fonction);
  if (input.active && constatee && !constatee.activable) {
    return { ok: false, detail: constatee.motif };
  }

  const [existante] = await db
    .select()
    .from(inFonctions)
    .where(eq(inFonctions.fonction, input.fonction))
    .limit(1);

  if (existante) {
    await db
      .update(inFonctions)
      .set({ active: input.active, motif, actorId: input.actorId ?? null, updatedAt: new Date() })
      .where(eq(inFonctions.id, existante.id));
  } else {
    await db.insert(inFonctions).values({
      fonction: input.fonction,
      active: input.active,
      motif,
      actorId: input.actorId ?? null,
    });
  }

  return {
    ok: true,
    detail: input.active
      ? `${spec.libelle} activée. ${spec.precaution}`
      : `${spec.libelle} éteinte. Le repli reprend la main.`,
  };
}

/** Vue d'ensemble : ce qui tourne, ce qui attend une décision, ce qui manque. */
export async function resume(): Promise<{
  total: number;
  actives: number;
  eteintes: number;
  impossibles: number;
  permissions: readonly Permission[];
  bloquantes: { fonction: string; motif: string }[];
}> {
  const liste = await etat();
  return {
    total: liste.length,
    actives: liste.filter((f) => f.etat === "active").length,
    eteintes: liste.filter((f) => f.etat === "eteinte").length,
    impossibles: liste.filter((f) => f.etat === "impossible").length,
    permissions: PERMISSIONS,
    bloquantes: liste
      .filter((f) => f.etat === "impossible")
      .map((f) => ({ fonction: f.libelle, motif: f.motif })),
  };
}
