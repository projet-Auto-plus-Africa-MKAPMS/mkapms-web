/**
 * Missions de l'agent développeur — vocabulaire des statuts, compteur d'exécution et lecture d'une demande courte.
 *
 * Règles tenues (réglages d'orchestration, 2 octobre 2026) :
 *  - une étape n'est « faite » que si son résultat attendu a réellement été obtenu, avec une preuve adaptée ; un texte
 *    explicatif ne valide jamais une étape technique ;
 *  - cinq catégories distinctes (+ l'échec) : exécutée, partielle, bloquée, non exécutée, non applicable ;
 *  - le compteur n'additionne que ce qui a vraiment été fait : « 5/8 » ne se calcule plus sur des étapes annoncées ;
 *  - « inconnu » est un état de classification non résolu, jamais le nom d'un composant à chercher dans le code.
 */

export type StatutEtape =
  | "fait"
  | "partielle"
  | "refuse"
  | "en_attente_autorisation"
  | "echec"
  | "non_execute"
  | "non_applicable";

export type CategorieEtape = "executee" | "partielle" | "bloquee" | "echouee" | "non_executee" | "non_applicable";

/** Statut stocké (valeurs historiques comprises) → catégorie lisible. Un statut inconnu n'est jamais compté comme fait. */
export function categorie(statut: string): CategorieEtape {
  switch (statut) {
    case "fait": return "executee";
    case "partielle": return "partielle";
    case "refuse":
    case "en_attente_autorisation": return "bloquee";
    case "echec": return "echouee";
    case "non_applicable": return "non_applicable";
    default: return "non_executee";
  }
}

export interface Compteur {
  executees: number;
  partielles: number;
  bloquees: number;
  echouees: number;
  nonExecutees: number;
  nonApplicables: number;
  /** Nombre total d'étapes du plan. */
  total: number;
  /** Étapes qui s'appliquaient à cette mission (total moins les non applicables). */
  applicables: number;
}

export function compter(etapes: { statut: string }[]): Compteur {
  const c: Compteur = { executees: 0, partielles: 0, bloquees: 0, echouees: 0, nonExecutees: 0, nonApplicables: 0, total: etapes.length, applicables: 0 };
  for (const e of etapes) {
    switch (categorie(e.statut)) {
      case "executee": c.executees++; break;
      case "partielle": c.partielles++; break;
      case "bloquee": c.bloquees++; break;
      case "echouee": c.echouees++; break;
      case "non_applicable": c.nonApplicables++; break;
      default: c.nonExecutees++;
    }
  }
  c.applicables = c.total - c.nonApplicables;
  return c;
}

/** Phrase du compteur : seules les catégories présentes sont écrites, et « exécutée » ne veut dire que « résultat obtenu ». */
export function phraseCompteur(c: Compteur): string {
  const morceaux = [
    `${c.executees}/${c.applicables} étape(s) exécutée(s) avec résultat obtenu`,
    c.partielles ? `${c.partielles} partielle(s)` : "",
    c.bloquees ? `${c.bloquees} bloquée(s)` : "",
    c.echouees ? `${c.echouees} en échec` : "",
    c.nonExecutees ? `${c.nonExecutees} non exécutée(s)` : "",
    c.nonApplicables ? `${c.nonApplicables} non applicable(s)` : "",
  ].filter(Boolean);
  return morceaux.join(" · ");
}

/** Nature d'un arrêt, pour la mémoire : mission floue, autorisation, panne technique ou correction vérifiée. */
export type NatureResultat = "mission_insuffisante" | "blocage_autorisation" | "echec_technique" | "correction_verifiee" | "accomplie_non_verifiee" | "partielle";

/* ------------------------------------------------------------------ */
/* Demande courte                                                      */
/* ------------------------------------------------------------------ */

const MOTS_DE_LIAISON = new Set([
  "tu", "peux", "peut", "pouvez", "vas", "va", "y", "le", "la", "les", "l", "un", "une", "des", "du", "de", "d", "s", "il", "te", "plait", "plaît",
  "svp", "stp", "merci", "maintenant", "alors", "ok", "bon", "donc", "et", "puis", "encore", "toi", "moi", "on", "nous", "je", "veux", "voudrais", "ca", "ça", "cela",
  "aussi", "bien", "tout", "toujours", "sur", "ce", "cette", "que", "qui", "en", "au", "aux", "mon", "ma", "mes", "ton", "ta", "tes",
]);

/** Verbes et mots d'élan qui ne désignent aucune tâche à eux seuls. */
const MOTS_GENERIQUES = new Set([
  "travailler", "travaille", "travail", "continue", "continuer", "continues", "reprends", "reprendre", "reprise", "poursuis", "poursuivre", "avance", "avancer",
  "fais", "fait", "faire", "go", "commence", "commencer", "lance", "lancer", "demarre", "démarre", "demarrer", "démarrer", "agis", "agir", "execute", "exécute",
  "executer", "exécuter", "oui", "vas-y", "allez", "allons", "action", "mission", "tache", "tâche", "reste", "suite", "next", "ensuite",
]);

export function motsSignificatifs(texte: string): string[] {
  return texte
    .toLowerCase()
    .normalize("NFC")
    .split(/[^a-zà-öø-ÿ0-9'-]+/i)
    .flatMap((m) => m.split(/['’]/))
    .map((m) => m.replace(/^-+|-+$/g, ""))
    .filter((m) => m.length > 0 && !MOTS_DE_LIAISON.has(m));
}

/**
 * Demande trop courte pour désigner une tâche : « Tu peux travailler », « continue », « vas-y »… Aucun mot ne nomme un objet
 * (page, moteur, paiement, bouton…). Une phrase plus longue ou qui nomme un objet n'est jamais « courte ».
 */
export function demandeCourte(texte: string): boolean {
  const mots = motsSignificatifs(texte);
  if (mots.length === 0) return true;
  if (mots.length > 4) return false;
  return mots.every((m) => MOTS_GENERIQUES.has(m));
}

/** Clé de comparaison de deux objectifs (casse, accents, ponctuation et mots de liaison ignorés). */
export function objectifNormalise(texte: string): string {
  return motsSignificatifs(texte)
    .map((m) => m.normalize("NFD").replace(/[̀-ͯ]/g, ""))
    .join(" ");
}

/** La question unique posée quand aucune mission n'est identifiable. */
export const QUESTION_MISSION = "Quelle tâche souhaites-tu que je réalise ?";

/** « inconnu » est l'état d'une classification non résolue, pas un nom de composant. */
export function domaineResolu(domaine: string | null | undefined): boolean {
  return !!domaine && !["inconnu", "non_classe", ""].includes(domaine);
}
