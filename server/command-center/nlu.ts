/**
 * Point 71 — traduction d'une phrase en action structurée.
 *
 * Il n'y a AUCUN modèle externe derrière : l'interprétation est déterministe et
 * ne porte que sur ce que la plateforme sait réellement faire. C'est un choix
 * assumé — une phrase mal comprise qui déclenche une action serait bien plus
 * grave qu'une phrase refusée.
 *
 * Trois règles tenues :
 *  • une demande qui ne correspond à aucune capacité réelle est « hors
 *    périmètre », jamais rapprochée de force de l'intention la plus proche ;
 *  • deux intentions à égalité donnent « ambiguë » et n'exécutent rien ;
 *  • un pays cité est utilisé tel quel ; un pays non cité reste vide, il n'est
 *    jamais remplacé par un pays par défaut.
 */

export type Verdict = "comprise" | "ambigue" | "hors_perimetre";

export interface CommandIntent {
  code: string;
  label: string;
  /** Ce que la commande déclenchera réellement, en clair. */
  effect: string;
  /** Type d'action du Centre d'Actions, ou null si l'intention est une lecture. */
  actionType: string | null;
  riskLevel: 1 | 2 | 3;
  /** Mots qui doivent tous être présents (au moins un de chaque groupe). */
  required: string[][];
  /** Mots qui augmentent la certitude sans être obligatoires. */
  hints: string[];
}

/** Catalogue des intentions — strictement ce qui existe dans la plateforme. */
export const COMMAND_INTENTS: CommandIntent[] = [
  {
    code: "paiements_echoues",
    label: "Analyser les paiements échoués",
    effect: "Liste les paiements en échec sur la période demandée, avec leur motif.",
    actionType: null,
    riskLevel: 1,
    required: [["paiement", "paiements", "payment", "encaissement"], ["echoue", "echoues", "echec", "echecs", "rejete", "rejetes"]],
    hints: ["analyse", "analyser", "montre", "liste"],
  },
  {
    code: "moteurs_degrades",
    label: "Afficher les moteurs dégradés",
    effect: "Affiche les moteurs dont la sonde constate une dégradation, avec depuis quand.",
    actionType: null,
    riskLevel: 1,
    required: [["moteur", "moteurs"], ["degrade", "degrades", "panne", "hors service", "casse", "casses"]],
    hints: ["montre", "affiche", "liste", "quels"],
  },
  {
    code: "verifier_liens_univers",
    label: "Vérifier les liens et boutons d'un univers",
    effect: "Contrôle les destinations des liens de l'univers et signale celles qui n'existent pas.",
    actionType: "quality_audit",
    riskLevel: 1,
    required: [["bouton", "boutons", "lien", "liens", "page", "pages"], ["verifie", "verifier", "controle", "controler", "teste", "tester"]],
    hints: ["tous", "toutes"],
  },
  {
    code: "reparer_404",
    label: "Réparer les liens cassés connus",
    effect: "Rejoue les correctifs de redirection déjà appris puis vérifie que la règle est active.",
    actionType: "heal_404",
    riskLevel: 2,
    required: [["404", "lien casse", "liens casses", "redirection", "redirections"], ["repare", "reparer", "corrige", "corriger", "resous", "resoudre"]],
    hints: ["auto", "automatique"],
  },
  {
    code: "audit_qualite",
    label: "Lancer un audit qualité",
    effect: "Recalcule le score de qualité par domaine et global.",
    actionType: "quality_audit",
    riskLevel: 1,
    required: [["qualite", "audit"], ["lance", "lancer", "fais", "faire", "calcule", "calculer", "analyse", "analyser"]],
    hints: ["score", "domaine"],
  },
  {
    code: "scan_alertes",
    label: "Rechercher les anomalies",
    effect: "Relance la détection d'anomalies et met à jour les alertes.",
    actionType: "alert_scan",
    riskLevel: 1,
    required: [["anomalie", "anomalies", "alerte", "alertes"], ["cherche", "chercher", "scanne", "scanner", "detecte", "detecter", "analyse", "analyser", "relance", "relancer"]],
    hints: ["nouvelles"],
  },
  {
    code: "fermer_public",
    label: "Fermer la plateforme au public",
    effect: "Ferme les interfaces publiques en gardant l'administration, les journaux et les sauvegardes joignables.",
    actionType: "emergency_close",
    riskLevel: 3,
    required: [["ferme", "fermer", "coupe", "couper", "maintenance", "urgence"], ["plateforme", "public", "site", "visiteurs", "mkapms", "mka.p-ms"]],
    hints: ["tout", "immediatement", "monde"],
  },
  {
    code: "ouvrir_public",
    label: "Rouvrir la plateforme au public",
    effect: "Rétablit l'accès public de la portée demandée.",
    actionType: "emergency_open",
    riskLevel: 3,
    required: [["ouvre", "ouvrir", "rouvre", "rouvrir", "reouvre", "reouvrir", "retablis", "retablir"], ["plateforme", "public", "site", "visiteurs", "mkapms", "mka.p-ms"]],
    hints: [],
  },
  {
    code: "preparer_correction",
    label: "Préparer la correction d'un problème",
    effect: "Ouvre un dossier de développement : analyse, plan, puis passage obligatoire avant production.",
    actionType: null,
    riskLevel: 2,
    required: [["prepare", "preparer", "corrige", "corriger", "repare", "reparer", "developpe", "developper"], ["correction", "erreur", "bug", "probleme", "anomalie", "fonctionnalite", "module"]],
    hints: ["cette", "ce"],
  },
  {
    code: "rapport_quotidien",
    label: "Consulter le rapport du jour",
    effect: "Affiche le rapport quotidien consolidé : anomalies et propositions.",
    actionType: null,
    riskLevel: 1,
    required: [["rapport", "bilan", "resume"], ["jour", "journee", "quotidien", "aujourd hui", "aujourdhui", "hier"]],
    hints: ["montre", "donne"],
  },
];

/** Univers reconnus, tels qu'ils existent dans la plateforme. */
const UNIVERS: Record<string, string> = {
  location: "location",
  louer: "location",
  achat: "achat",
  acheter: "achat",
  vente: "vente",
  vendre: "vente",
  garage: "garage",
  pieces: "pieces",
  piece: "pieces",
  depannage: "depannage",
  livraison: "livraison",
  vtc: "vtc_taxi",
  taxi: "vtc_taxi",
  encheres: "encheres",
  vo: "vo",
  assurance: "assurance",
  comptabilite: "comptabilite",
};

/** Périodes reconnues, sans jamais inventer une plage. */
const PERIODES: Record<string, string> = {
  "aujourd hui": "jour",
  aujourdhui: "jour",
  "ce jour": "jour",
  hier: "hier",
  semaine: "semaine",
  mois: "mois",
};

export interface Interpretation {
  verdict: Verdict;
  intent: CommandIntent | null;
  /** Intentions à égalité, quand la demande est ambiguë. */
  candidates: string[];
  entities: Record<string, string>;
  countryCode: string | null;
  reason: string;
}

/** Minuscules, sans accents, ponctuation réduite — pour comparer des mots. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9.\- ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function contains(haystack: string, needle: string): boolean {
  if (needle.includes(" ")) return haystack.includes(needle);
  return new RegExp(`(^| )${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}( |$)`).test(haystack);
}

function score(text: string, intent: CommandIntent): number {
  for (const group of intent.required) {
    if (!group.some((w) => contains(text, w))) return 0;
  }
  const bonus = intent.hints.filter((h) => contains(text, h)).length;
  return intent.required.length * 10 + bonus;
}

/**
 * Extrait les précisions réellement présentes. Rien n'est complété : un pays
 * absent reste absent, il n'est pas remplacé par un pays « par défaut ».
 */
function extractEntities(
  text: string,
  countries: { code: string; name: string }[],
): { entities: Record<string, string>; countryCode: string | null } {
  const entities: Record<string, string> = {};

  for (const [mot, code] of Object.entries(UNIVERS)) {
    if (contains(text, mot)) {
      entities.univers = code;
      break;
    }
  }
  for (const [mot, code] of Object.entries(PERIODES)) {
    if (contains(text, mot)) {
      entities.periode = code;
      break;
    }
  }

  let countryCode: string | null = null;
  for (const c of countries) {
    const nom = normalize(c.name);
    if (nom.length >= 3 && contains(text, nom)) {
      countryCode = c.code;
      break;
    }
  }
  if (countryCode) entities.pays = countryCode;

  return { entities, countryCode };
}

/**
 * Interprète une demande. `countries` doit contenir les pays réellement
 * activés : un pays cité mais non activé ne devient pas une portée valide.
 */
export function interpret(
  rawText: string,
  countries: { code: string; name: string }[],
): Interpretation {
  const text = normalize(rawText);
  if (text.length < 3) {
    return {
      verdict: "hors_perimetre",
      intent: null,
      candidates: [],
      entities: {},
      countryCode: null,
      reason: "Demande trop courte pour être interprétée.",
    };
  }

  const scored = COMMAND_INTENTS.map((i) => ({ intent: i, s: score(text, i) })).filter((x) => x.s > 0);
  if (scored.length === 0) {
    return {
      verdict: "hors_perimetre",
      intent: null,
      candidates: [],
      entities: {},
      countryCode: null,
      reason:
        "Demande non comprise : elle ne correspond à aucune capacité réelle de la plateforme. Rien n'a été exécuté, et la formulation est conservée pour être ajoutée plus tard.",
    };
  }

  scored.sort((a, b) => b.s - a.s);
  const meilleur = scored[0];
  const exAequo = scored.filter((x) => x.s === meilleur.s);
  const { entities, countryCode } = extractEntities(text, countries);

  if (exAequo.length > 1) {
    return {
      verdict: "ambigue",
      intent: null,
      candidates: exAequo.map((x) => x.intent.label),
      entities,
      countryCode,
      reason: `Demande ambiguë : elle peut désigner ${exAequo
        .map((x) => `« ${x.intent.label} »`)
        .join(" ou ")}. Rien n'est exécuté sans précision.`,
    };
  }

  return {
    verdict: "comprise",
    intent: meilleur.intent,
    candidates: [],
    entities,
    countryCode,
    reason: meilleur.intent.effect,
  };
}
