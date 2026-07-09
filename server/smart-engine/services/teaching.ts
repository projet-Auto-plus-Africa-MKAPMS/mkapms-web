/**
 * Feature 15 — Apprentissage privé PDG
 *
 * Espace confidentiel réservé au PDG (super_admin) : il discute avec le
 * Système Intelligent et lui enseigne des choses. Chaque tour de
 * conversation est enregistré ; les leçons du PDG sont mémorisées et
 * peuvent être restituées plus tard.
 *
 * Pas d'appel à un service externe : la réponse est générée localement
 * (règles + rappel des leçons déjà mémorisées).
 */
import { db } from "../../db.js";
import { smartTeachings } from "../schema.js";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

const QUESTION_HINTS = [
  "?",
  "pourquoi",
  "comment",
  "qu'est-ce",
  "quest-ce",
  "quel",
  "quelle",
  "combien",
  "est-ce que",
  "peux-tu",
  "sais-tu",
  "que sais",
  "rappelle",
  "montre",
];

function isQuestion(text: string): boolean {
  const t = text.toLowerCase();
  return QUESTION_HINTS.some((h) => t.includes(h));
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
 * Génère la réponse du système à partir du message du PDG.
 * - Si c'est une question : tente de répondre depuis les leçons mémorisées.
 * - Sinon : confirme la mémorisation de la leçon.
 */
async function buildResponse(message: string): Promise<string> {
  const asked = isQuestion(message);

  if (asked) {
    const recalled = await recallLessons(message);
    if (recalled.length > 0) {
      const bullets = recalled.map((r) => `• ${r.message}`).join("\n");
      return `Voici ce que tu m'as appris à ce sujet :\n${bullets}`;
    }
    const total = await totalLessons();
    return total > 0
      ? `Je n'ai pas encore de leçon précise sur ce point. J'ai ${total} leçon(s) mémorisée(s) pour l'instant — apprends-moi la réponse et je la retiendrai.`
      : `Je n'ai encore rien appris sur ce sujet. Explique-moi et je le mémoriserai définitivement.`;
  }

  const total = await totalLessons();
  const related = await recallLessons(message, 1);
  const relatedNote =
    related.length > 0
      ? ` Cela complète ce que tu m'avais déjà appris : « ${related[0].message.slice(0, 120)} ».`
      : "";
  return `C'est noté et mémorisé.${relatedNote} J'ai maintenant ${total + 1} leçon(s) enregistrée(s). Continue à m'apprendre — chaque leçon me rend plus intelligent.`;
}

export interface TeachInput {
  authorId: number;
  message: string;
  topic?: string;
}

/** Enregistre le tour PDG, génère et enregistre la réponse, renvoie les deux. */
export async function teach(input: TeachInput) {
  const trimmed = input.message.trim();
  const lesson = !isQuestion(trimmed); // les affirmations sont des leçons

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

  const responseText = await buildResponse(trimmed);

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
