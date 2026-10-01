/**
 * Nom d'une conversation d'après son sujet (liste « Récents » du menu de gauche).
 *
 * Avant : le titre était la première question copiée telle quelle (jusqu'à 180
 * caractères), donc « Bonjour, peux-tu me dire comment on fait pour… ».
 *
 * Maintenant, en deux temps, sans jamais bloquer la réponse :
 *  1. au moment de créer la conversation, un titre provisoire court et propre
 *     tiré de la question (`titreProvisoire`, déterministe, sans appel externe) ;
 *  2. après le PREMIER échange réussi, un titre de quelques mots demandé au
 *     moteur (`nommerSiPremierEchange`). Si le moteur est indisponible, le titre
 *     provisoire reste — jamais un titre inventé, jamais d'échec visible.
 *
 * Un titre renommé à la main par le PDG n'est jamais écrasé : on ne remplace que
 * un titre encore égal au titre provisoire de la première question.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../db.js";
import { inSessions } from "./schema.js";
import { appeler as appelerReel } from "./provider.js";

const LONGUEUR_MAX_PROVISOIRE = 60;
const LONGUEUR_MAX_TITRE = 60;

const POLITESSES = /^(?:bonjour|bonsoir|salut|salam|hello|coucou|hey)[\s,!.:;-]*(?:(?:al-?hudhud(?:·|\.)?m?|à tous|tout le monde)[\s,!.:;-]*)?/i;
const DEMANDES = /^(?:s'?il (?:te|vous) pla[iî]t[\s,]*|peux-?tu(?: me)?\s+|pourrais-?tu(?: me)?\s+|je voudrais\s+|je veux\s+|j'aimerais\s+|dis-?moi\s+)/i;

function majuscule(t: string): string {
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

/** Titre court et propre tiré de la question — déterministe, sans appel externe. */
export function titreProvisoire(question: string): string {
  let t = question.replace(/\s+/g, " ").trim();
  t = t.replace(POLITESSES, "").replace(DEMANDES, "").trim();
  const phrase = t.split(/(?<=[.!?])\s+/)[0] ?? t;
  t = phrase.replace(/[\s.!?:;,-]+$/u, "").trim();
  if (!t) t = question.replace(/\s+/g, " ").trim();
  if (t.length > LONGUEUR_MAX_PROVISOIRE) {
    const coupe = t.slice(0, LONGUEUR_MAX_PROVISOIRE);
    const dernierEspace = coupe.lastIndexOf(" ");
    t = (dernierEspace > 25 ? coupe.slice(0, dernierEspace) : coupe).replace(/[\s.,;:-]+$/u, "") + "…";
  }
  return majuscule(t) || "Nouvelle conversation";
}

/** Nettoie la réponse du moteur : une seule ligne courte, sans guillemets ni ponctuation finale. */
export function nettoyerTitre(brut: string): string | null {
  const ligne = brut.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0) ?? "";
  const propre = ligne
    .replace(/[*`_]{1,3}/g, "")
    .replace(/^(?:titre|title)\s*:\s*/i, "")
    .replace(/^[#>*\-\s"«“'`]+/u, "")
    .replace(/[\s"»”'`*.!?:;,-]+$/u, "")
    .trim();
  if (propre.length < 3 || propre.length > LONGUEUR_MAX_TITRE) return null;
  return majuscule(propre);
}

const SYSTEME_TITRE =
  "Tu donnes un titre à une conversation d'après son sujet. " +
  "Réponds UNIQUEMENT par le titre : 3 à 6 mots, dans la langue de l'utilisateur, " +
  "sans guillemets, sans point final, sans nom de fournisseur ni de modèle. " +
  "N'invente rien qui ne soit pas dans l'échange.";

export interface DependancesTitre {
  appeler?: typeof appelerReel;
}

/**
 * Après le premier échange : remplace le titre provisoire par un titre de sujet.
 * Ne jette jamais : toute erreur laisse le titre provisoire en place.
 * Renvoie le titre appliqué, ou null si rien n'a changé.
 */
export async function nommerSiPremierEchange(
  sessionId: number,
  question: string,
  reponse: string,
  dependances: DependancesTitre = {},
): Promise<string | null> {
  try {
    if (!reponse.trim()) return null;
    const [session] = await db
      .select({ titre: inSessions.titre, messages: inSessions.messages })
      .from(inSessions)
      .where(eq(inSessions.id, sessionId))
      .limit(1);
    if (!session) return null;
    const provisoire = titreProvisoire(question);
    // Une conversation déjà nommée à la main (ou déjà nommée par sujet) n'est jamais retouchée.
    if (session.titre !== provisoire && session.titre !== question.slice(0, 180)) return null;
    if (session.messages > 2) return null;

    const appeler = dependances.appeler ?? appelerReel;
    const r = await appeler({
      capacite: "ia_texte",
      tache: "titre_conversation",
      moteur: "intelligences",
      systeme: SYSTEME_TITRE,
      message: `Question : ${question.slice(0, 600)}\n\nRéponse : ${reponse.slice(0, 600)}`,
      confidentialite: "interne",
      maxTokens: 24,
    });
    if (!r.ok) return null;
    const titre = nettoyerTitre(r.texte);
    if (!titre) return null;

    // Condition sur le titre actuel : si le PDG a renommé entre-temps, on ne touche à rien.
    const maj = await db
      .update(inSessions)
      .set({ titre })
      .where(and(eq(inSessions.id, sessionId), eq(inSessions.titre, session.titre)))
      .returning({ id: inSessions.id });
    return maj.length ? titre : null;
  } catch {
    return null;
  }
}
