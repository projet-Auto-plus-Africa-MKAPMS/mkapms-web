/**
 * Feature 15 — Conversation & apprentissage privé PDG
 *
 * Espace confidentiel réservé au PDG (super_admin) : il DISCUTE avec le
 * Système Intelligent ET lui enseigne des choses. Le PDG s'est plaint que le
 * système « prend tout comme une note » sans jamais réfléchir ni répondre.
 *
 * Désormais on distingue l'INTENTION du message (salutation, question,
 * remerciement, identité, capacités, demande, ou véritable leçon) et on répond
 * de façon conversationnelle. Seules les vraies affirmations d'enseignement
 * sont MÉMORISÉES comme leçons ; les questions/salutations ne polluent plus la
 * base. La mémoire existante (leçons) est conservée et restituée.
 *
 * Pas d'appel à un service externe : tout est généré localement (analyse
 * d'intention + rappel des leçons + connaissance de la plateforme).
 */
import { db } from "../../db.js";
import { smartTeachings } from "../schema.js";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

type Intent =
  | "greeting"
  | "thanks"
  | "identity"
  | "capabilities"
  | "question"
  | "request"
  | "lesson";

const QUESTION_HINTS = [
  "?",
  "pourquoi",
  "comment",
  "qu'est-ce",
  "quest-ce",
  "quel",
  "quelle",
  "quels",
  "quelles",
  "combien",
  "est-ce que",
  "peux-tu",
  "peux tu",
  "sais-tu",
  "sais tu",
  "que sais",
  "explique",
  "dis-moi",
  "dis moi",
];

const RECALL_HINTS = ["rappelle", "montre", "liste", "récapitule", "recapitule", "que sais-tu", "que sais tu"];
const GREETING_HINTS = ["salam", "bonjour", "bonsoir", "salut", "coucou", "hello", "hey", "cc", "yo", "wa alaykoum", "walaykoum"];
const THANKS_HINTS = ["merci", "thanks", "chokran", "choukran", "barakallah"];
const IDENTITY_HINTS = ["qui es-tu", "qui es tu", "tu es qui", "ton nom", "comment tu t'appelles", "comment t'appelles", "présente-toi", "presente-toi", "tu t'appelles comment"];
const CAPABILITY_HINTS = ["que peux-tu", "que peux tu", "que sais-tu faire", "tes capacités", "tes capacites", "à quoi tu sers", "a quoi tu sers", "tes fonctions", "que fais-tu", "que fais tu"];
const REQUEST_HINTS = ["peux-tu", "peux tu", "pourrais-tu", "pourrais tu", "fais", "corrige", "résous", "resous", "vérifie", "verifie", "analyse", "propose", "aide-moi", "aide moi"];
const LESSON_PREFIXES = ["note", "retiens", "souviens", "apprends", "mémorise", "memorise", "règle", "regle", "important"];

/** True si une des amorces est présente dans le texte (minuscule). */
function has(text: string, hints: string[]): boolean {
  return hints.some((h) => text.includes(h));
}

function isQuestion(text: string): boolean {
  const t = text.toLowerCase();
  return QUESTION_HINTS.some((h) => t.includes(h));
}

/** Analyse l'intention du message pour répondre de façon appropriée. */
function detectIntent(raw: string): Intent {
  const t = raw.toLowerCase().trim();
  const firstWord = t.split(/\s+/)[0] ?? "";

  // Amorce explicite d'enseignement (« note : … », « retiens que … »).
  if (LESSON_PREFIXES.some((p) => firstWord.startsWith(p))) return "lesson";

  // Messages courts de politesse → conversation, jamais mémorisés.
  if (has(t, IDENTITY_HINTS)) return "identity";
  if (has(t, CAPABILITY_HINTS)) return "capabilities";
  if (has(t, GREETING_HINTS) && t.split(/\s+/).length <= 6) return "greeting";
  if (has(t, THANKS_HINTS) && t.split(/\s+/).length <= 6) return "thanks";

  if (isQuestion(t) || has(t, RECALL_HINTS)) return "question";
  if (has(t, REQUEST_HINTS)) return "request";

  return "lesson";
}

/** Mots vides ignorés pour la recherche dans les leçons. */
const STOPWORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "à", "a",
  "au", "aux", "en", "que", "qui", "quoi", "est", "ce", "cette", "ces", "il",
  "elle", "on", "nous", "vous", "je", "tu", "pour", "par", "sur", "dans",
  "avec", "sans", "pas", "plus", "comment", "pourquoi", "quel", "quelle",
  "combien", "sais", "sait", "rappelle", "montre", "peux", "tu", "moi",
]);

function keywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

async function totalLessons(): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(smartTeachings)
    .where(eq(smartTeachings.isLesson, true));
  return Number(row?.n ?? 0);
}

/** Cherche des leçons déjà enseignées correspondant aux mots-clés. */
async function recallLessons(text: string, limit = 3) {
  const kws = keywords(text);
  if (kws.length === 0) return [];
  const conditions = kws.slice(0, 6).map((k) => ilike(smartTeachings.message, `%${k}%`));
  return db
    .select()
    .from(smartTeachings)
    .where(and(eq(smartTeachings.isLesson, true), or(...conditions)))
    .orderBy(desc(smartTeachings.createdAt))
    .limit(limit);
}

/**
 * Génère la réponse du système selon l'INTENTION du message :
 * salutation, remerciement, identité, capacités, question, demande ou leçon.
 * Une vraie discussion — pas seulement « c'est noté ».
 */
async function buildResponse(message: string, intent: Intent): Promise<string> {
  switch (intent) {
    case "greeting": {
      const total = await totalLessons();
      return `Bonjour PDG. Je suis là et à l'écoute. ${
        total > 0
          ? `Je garde en mémoire ${total} leçon(s) que tu m'as apprises.`
          : `Tu peux discuter avec moi ou m'apprendre une règle — je la retiendrai.`
      } De quoi veux-tu parler ?`;
    }

    case "thanks":
      return `Avec plaisir. Je suis là pour t'aider — pose-moi une question, demande-moi une vérification, ou apprends-moi une nouvelle règle.`;

    case "identity":
      return `Je suis le Système Intelligent MKA.P-MS — ta mémoire et ton copilote de la plateforme. Je surveille les moteurs, les boutons, les redirections et les alertes, je corrige seul ce qui est sûr, et je retiens tout ce que tu m'apprends.`;

    case "capabilities": {
      const total = await totalLessons();
      return [
        `Voici ce que je sais faire :`,
        `• Discuter avec toi et réfléchir à tes questions (pas seulement prendre des notes).`,
        `• Mémoriser définitivement les règles que tu m'apprends (${total} leçon(s) actuellement) et te les restituer.`,
        `• Surveiller boutons, pages, redirections, paiements et lever des alertes.`,
        `• Réparer SEUL les défauts sûrs (ex: créer une règle de redirection manquante) et apprendre la correction pour la rejouer automatiquement.`,
        `Dis-moi ce dont tu as besoin.`,
      ].join("\n");
    }

    case "question": {
      const recalled = await recallLessons(message);
      if (recalled.length > 0) {
        const bullets = recalled.map((r) => `• ${r.message}`).join("\n");
        return `D'après ce que tu m'as appris :\n${bullets}\n\nSi ce n'est pas exactement ta réponse, précise-moi et j'affine ma mémoire.`;
      }
      const total = await totalLessons();
      return total > 0
        ? `Je n'ai pas encore de leçon précise là-dessus (j'ai ${total} leçon(s) sur d'autres sujets). Explique-moi la réponse et je la retiendrai pour la prochaine fois.`
        : `Bonne question — je n'ai encore rien appris sur ce point. Explique-moi et je le mémoriserai définitivement.`;
    }

    case "request": {
      const recalled = await recallLessons(message, 2);
      const context =
        recalled.length > 0
          ? ` En lien avec ce que tu m'as appris : « ${recalled[0].message.slice(0, 120)} ».`
          : "";
      return `J'ai bien compris ta demande.${context} Les actions sensibles restent soumises à ta validation ; pour les corrections sûres (redirections, contrôles de santé), utilise le bouton « Résolu » de l'alerte concernée — je corrige la cause réelle et je retiens la recette pour la rejouer seul ensuite. Dis-moi si tu veux que je note une règle à ce sujet.`;
    }

    case "lesson":
    default: {
      const total = await totalLessons();
      const related = await recallLessons(message, 1);
      const relatedNote =
        related.length > 0
          ? ` Cela complète ce que tu m'avais déjà appris : « ${related[0].message.slice(0, 120)} ».`
          : "";
      return `C'est noté et mémorisé.${relatedNote} J'ai maintenant ${total + 1} leçon(s) enregistrée(s). Tu peux aussi me poser des questions — je te répondrai à partir de ces leçons.`;
    }
  }
}

export interface TeachInput {
  authorId: number;
  message: string;
  topic?: string;
}

/** Enregistre le tour PDG, génère et enregistre la réponse, renvoie les deux. */
export async function teach(input: TeachInput) {
  const trimmed = input.message.trim();
  const intent = detectIntent(trimmed);
  // Seules les vraies affirmations d'enseignement sont mémorisées comme leçons.
  const lesson = intent === "lesson";

  const [pdgTurn] = await db
    .insert(smartTeachings)
    .values({
      authorId: input.authorId,
      role: "pdg",
      topic: input.topic ?? null,
      message: trimmed,
      isLesson: lesson,
    })
    .returning();

  const responseText = await buildResponse(trimmed, intent);

  const [systemTurn] = await db
    .insert(smartTeachings)
    .values({
      authorId: null,
      role: "system",
      topic: input.topic ?? null,
      message: responseText,
      isLesson: false,
    })
    .returning();

  return { pdgTurn, systemTurn };
}

/** Historique de la conversation (ordre chronologique). */
export async function getConversation(limit = 100) {
  const rows = await db
    .select()
    .from(smartTeachings)
    .orderBy(desc(smartTeachings.createdAt))
    .limit(limit);
  return rows.reverse();
}

/** Statistiques de l'apprentissage privé. */
export async function getTeachingStats() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)`,
      lessons: sql<number>`count(*) filter (where ${smartTeachings.isLesson} = true)`,
    })
    .from(smartTeachings);
  return {
    totalMessages: Number(row?.total ?? 0),
    lessons: Number(row?.lessons ?? 0),
  };
}
