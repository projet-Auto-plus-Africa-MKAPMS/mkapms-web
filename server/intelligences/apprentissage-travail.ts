/**
 * Mémoire des travaux : ce que le PDG décide, demande ou fait réaliser avec AL-HUDHUD·M enrichit sa mémoire
 * d'entreprise, sans geste de sa part.
 *
 * Avant : seul le résumé d'une conversation longue (16 messages non couverts) alimentait la mémoire — une tâche
 * courte, un « fais ceci / c'est décidé » ne laissait aucune trace pour les conversations suivantes.
 *
 * Maintenant, après chaque échange substantiel du côté direction (PDG), un court extrait de FAITS DURABLES est
 * versé dans la mémoire d'entreprise (catégories decisions, projets, technique, entreprise, apprentissage) :
 *  - ce que le PDG a dit, décidé ou demandé, et ce qu'un outil a réellement exécuté — jamais une affirmation non
 *    vérifiée de l'assistant ;
 *  - même sujet = même clé : le souvenir précédent passe en historique, pas d'empilement de doublons ;
 *  - jamais un mot de passe, une clé, un jeton : l'échange est écarté en bloc s'il en contient un ;
 *  - allumé par défaut (le PDG est le seul utilisateur), éteignable dans Fonctionnalités → « Mémoire des travaux » ;
 *  - jamais bloquant : une extraction qui échoue ne fait pas échouer l'échange.
 * Le côté public n'écrit jamais ici : du contenu visiteur non consenti n'entre pas dans la mémoire du PDG.
 */
import { appeler } from "./provider.js";
import { activee } from "./fonctions.js";
import { ecrire } from "./memoire.js";

export const CATEGORIES_TRAVAIL = ["decisions", "projets", "technique", "entreprise", "apprentissage"] as const;
type CategorieTravail = (typeof CATEGORIES_TRAVAIL)[number];

const SYSTEME_TRAVAIL =
  "Tu tiens la mémoire de travail du PDG de MKA.P-MS. À partir de l'échange fourni, extrais AU PLUS 3 faits DURABLES utiles aux travaux futurs : " +
  "décisions du PDG, consignes et règles de travail, état d'une tâche (fait, à faire, bloqué), choix techniques, informations sur un projet. " +
  "Ne retiens que ce que le PDG a dit, demandé ou décidé, ou ce qu'un outil a réellement exécuté (lignes « Outil appelé »). " +
  "Ignore les affirmations non vérifiées de l'assistant, les politesses et les questions simples sans suite. " +
  "N'écris jamais de mot de passe, de clé, de jeton ni de donnée personnelle. N'invente rien. " +
  'Réponds en JSON strict : {"faits":[{"categorie":"decisions|projets|technique|entreprise|apprentissage","titre":"100 caractères maximum","contenu":"500 caractères maximum"}]}. ' +
  'S\'il n\'y a rien de durable : {"faits":[]}.';

const SECRET =
  /(?:\b(?:sk|pk|rk|ck|cs)[-_][A-Za-z0-9_-]{16,}|\bghp_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bAIza[0-9A-Za-z_-]{20,}|\bxox[abprs]-[A-Za-z0-9-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY|\bBearer\s+[A-Za-z0-9._~+/=-]{16,}|(?:password|mot de passe|passwd|secret|api[_ -]?key|token|jeton)\s*[:=]\s*\S{6,})/i;

/** Vrai si le texte ressemble à un identifiant secret : l'échange entier est alors écarté de la mémoire. */
export function contientSecret(texte: string): boolean {
  return SECRET.test(texte);
}

export interface FaitTravail {
  categorie: CategorieTravail;
  titre: string;
  contenu: string;
}

/** Valide la sortie du modèle : au plus 3 faits bien formés, jamais de secret, jamais une catégorie étrangère. */
export function faitsDepuisReponse(texte: string): FaitTravail[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(texte.trim().replace(/^```(?:json)?\s*|\s*```$/g, ""));
  } catch {
    return [];
  }
  const liste = (parsed as { faits?: unknown })?.faits;
  if (!Array.isArray(liste)) return [];
  const faits: FaitTravail[] = [];
  for (const brut of liste.slice(0, 3)) {
    const f = brut as Partial<FaitTravail>;
    if (typeof f.titre !== "string" || typeof f.contenu !== "string") continue;
    if (!(CATEGORIES_TRAVAIL as readonly string[]).includes(String(f.categorie))) continue;
    const titre = f.titre.replace(/\s+/g, " ").trim().slice(0, 100);
    const contenu = f.contenu.replace(/\s+/g, " ").trim().slice(0, 500);
    if (titre.length < 6 || contenu.length < 12) continue;
    if (contientSecret(`${titre} ${contenu}`)) continue;
    faits.push({ categorie: f.categorie as CategorieTravail, titre, contenu });
  }
  return faits;
}

/** Clé stable d'un sujet : le même sujet remplace le souvenir précédent (qui passe en historique). */
export function cleSujet(titre: string): string {
  const slug = titre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `travail:${slug}`;
}

/** Échange trop court ou trivial pour valoir un appel de modèle. */
export function echangeSubstantiel(question: string, reponse: string): boolean {
  const q = question.trim();
  if (q.length < 25) return false;
  return reponse.trim().length >= 40;
}

export interface EchangeTravail {
  sessionId: number;
  question: string;
  reponse: string;
  /** Lignes « Outil appelé : … » de l'échange : une tâche réellement exécutée est un fait durable. */
  outils?: string[];
  traceId: string;
}

export interface DependancesTravail {
  appeler?: typeof appeler;
  fonctionActive?: () => Promise<boolean>;
  ecrire?: typeof ecrire;
}

/** Verse les faits durables d'un échange dans la mémoire d'entreprise. Ne jette jamais. Renvoie le nombre de faits écrits. */
export async function memoriserTravail(echange: EchangeTravail, dependances: DependancesTravail = {}): Promise<number> {
  try {
    if (!echangeSubstantiel(echange.question, echange.reponse)) return 0;
    const outils = (echange.outils ?? []).filter((o) => typeof o === "string").slice(0, 8);
    const texte = [echange.question, echange.reponse, ...outils].join("\n");
    if (contientSecret(texte)) return 0;
    const active = dependances.fonctionActive ? await dependances.fonctionActive() : (await activee("memoire_travail")).ok;
    if (!active) return 0;

    const r = await (dependances.appeler ?? appeler)({
      capacite: "ia_texte",
      tache: "memoire_travail",
      moteur: "intelligences",
      systeme: SYSTEME_TRAVAIL,
      message: [
        `Demande du PDG : ${echange.question.slice(0, 1500)}`,
        ...outils.map((o) => o.slice(0, 300)),
        `Réponse de l'assistant (non vérifiée) : ${echange.reponse.slice(0, 1500)}`,
      ].join("\n"),
      confidentialite: "interne",
      maxTokens: 500,
    });
    if (!r.ok) return 0;

    let ecrits = 0;
    for (const fait of faitsDepuisReponse(r.texte)) {
      const res = await (dependances.ecrire ?? ecrire)({
        categorie: fait.categorie,
        cle: cleSujet(fait.titre),
        titre: fait.titre,
        contenu: `${fait.contenu}\n(Retenu d'un échange avec le PDG, conversation #${echange.sessionId}.)`,
        liens: { session: String(echange.sessionId), trace: echange.traceId },
        source: "conversation-travail",
      });
      if (res.ok) ecrits += 1;
    }
    return ecrits;
  } catch {
    return 0;
  }
}
