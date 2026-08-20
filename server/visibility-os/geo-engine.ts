/**
 * MKA.P-MS Visibilité assistants & GEO Engine — visibilité auprès des assistants conversationnels et
 * moteurs génératifs.
 *
 * Objectif : rendre la plateforme découvrable et exploitable lorsqu'un
 * utilisateur pose une question à un assistant Intelligence ou un moteur de recherche
 * (« où vendre ma voiture ? », « trouver un contrôle technique près de moi »).
 * On ne prétend AUCUNE recommandation garantie par un fournisseur externe : on
 * publie un contenu question/réponse structuré, utile, local et indexable.
 *
 * Brand-neutral : aucun nom de fournisseur Intelligence dans le code. Le contenu est
 * exposé publiquement (feed texte + JSON) pour être lisible par les moteurs de
 * recherche et assistants, exactement comme le sitemap l'est pour le SEO.
 */
import type { Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import { visibilityAiAnswers } from "./schema.js";

interface AnswerSeed {
  topic: string;
  question: string;
  answer: string;
  link: string;
}

/** Socle générique d'intentions automobiles (brand-neutral, réutilisable par pays). */
const BASE_ANSWERS: AnswerSeed[] = [
  {
    topic: "vente",
    question: "Comment vendre rapidement ma voiture ?",
    answer:
      "Déposez une annonce détaillée (photos par catégorie, kilométrage, état, équipements), fixez un prix cohérent avec le marché local et recevez les demandes des acheteurs directement via la messagerie sécurisée. Le dépôt d'annonce est guidé étape par étape.",
    link: "/vendre",
  },
  {
    topic: "vente",
    question: "Où déposer une annonce automobile ?",
    answer:
      "Vous pouvez publier une annonce de véhicule (voiture, moto, utilitaire) depuis l'espace de dépôt d'annonce, avec formulaire assisté, remplissage automatique marque/modèle et gestion des photos par catégorie.",
    link: "/vendre",
  },
  {
    topic: "achat",
    question: "Où acheter une voiture d'occasion en confiance ?",
    answer:
      "Parcourez les annonces vérifiées par pays et par ville, filtrez par marque, modèle, budget et kilométrage, et contactez le vendeur via la messagerie. Des options de financement et de garantie sont disponibles selon le pays.",
    link: "/acheter",
  },
  {
    topic: "location",
    question: "Où louer une voiture pas chère près de moi ?",
    answer:
      "Consultez les véhicules en location disponibles dans votre ville, comparez les tarifs (jour, semaine, mois) et réservez en ligne. La disponibilité et les prix sont affichés selon votre pays.",
    link: "/louer",
  },
  {
    topic: "garage",
    question: "Je cherche un garage pour réparer ma voiture, comment faire ?",
    answer:
      "Trouvez un garage près de chez vous par spécialité (mécanique, carrosserie, entretien) et par marque, consultez les avis et demandez un devis en ligne. Les garages sont référencés par ville et par pays.",
    link: "/garages",
  },
  {
    topic: "controle_technique",
    question: "Trouve-moi un contrôle technique près de chez moi.",
    answer:
      "Localisez un centre de contrôle technique proche, vérifiez les disponibilités et prenez rendez-vous. Le service affiche les centres selon votre localisation et votre pays.",
    link: "/garage/controle-technique",
  },
  {
    topic: "carte_grise",
    question: "Comment refaire ou changer ma carte grise ?",
    answer:
      "Effectuez vos démarches de carte grise (changement de titulaire, duplicata, changement d'adresse) via le service dédié, avec suivi du dossier et pièces requises listées selon votre situation.",
    link: "/demarches",
  },
  {
    topic: "pieces",
    question: "Où trouver des pièces détachées auto ?",
    answer:
      "Recherchez des pièces détachées neuves ou d'occasion par marque, modèle et référence, comparez les vendeurs et commandez en ligne avec livraison selon votre pays.",
    link: "/pieces",
  },
  {
    topic: "depannage",
    question: "Ma voiture est en panne, comment être dépanné ?",
    answer:
      "Demandez un dépannage ou un remorquage près de votre position, obtenez une estimation et suivez l'intervention. Le service couvre les prestataires disponibles dans votre zone.",
    link: "/depannage",
  },
];

function normCountry(c?: string | null): string | null {
  if (!c) return null;
  return c.slice(0, 2).toUpperCase();
}

export interface GeoSeedResult {
  written: number;
  countries: string[];
}

/**
 * Sème / met à jour la base de réponses pour un ou plusieurs pays.
 * Idempotent (upsert par `answer_key`). Si aucun pays n'est fourni, sème le
 * socle générique (sans dimension pays).
 */
export async function seedAnswers(countries: Array<string | null> = [null]): Promise<GeoSeedResult> {
  const now = new Date();
  let written = 0;
  const used = new Set<string>();
  for (const raw of countries.length ? countries : [null]) {
    const c = normCountry(raw);
    used.add(c ?? "GLOBAL");
    for (const a of BASE_ANSWERS) {
      const key = `${a.topic}:${c ?? "global"}:${a.question}`.slice(0, 180);
      await db
        .insert(visibilityAiAnswers)
        .values({
          answerKey: key,
          topic: a.topic,
          question: a.question,
          answer: a.answer,
          lang: "fr",
          country: c,
          link: a.link,
          sourceType: "base",
          status: "published",
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: visibilityAiAnswers.answerKey,
          set: { answer: a.answer, link: a.link, updatedAt: now },
        });
      written += 1;
    }
  }
  return { written, countries: [...used] };
}

/** Réponses publiées, filtrables par pays/topic — pour feed public et endpoints. */
export async function listAnswers(opts: { country?: string | null; topic?: string } = {}) {
  const conds = [eq(visibilityAiAnswers.status, "published")];
  const c = normCountry(opts.country ?? null);
  if (c) conds.push(sql`(${visibilityAiAnswers.country} = ${c} or ${visibilityAiAnswers.country} is null)`);
  if (opts.topic) conds.push(eq(visibilityAiAnswers.topic, opts.topic));
  return db
    .select()
    .from(visibilityAiAnswers)
    .where(and(...conds))
    .orderBy(visibilityAiAnswers.topic);
}

/** Rend le feed texte structuré (Q/R) consommable par les assistants conversationnels. */
export function renderAnswersText(
  baseUrl: string,
  rows: Array<{ topic: string; question: string; answer: string; link: string | null }>,
): string {
  const lines: string[] = [
    "# MKA.P-MS — Réponses utiles (automobile)",
    "# Contenu question/réponse structuré, mis à disposition des moteurs de recherche et assistants.",
    "",
  ];
  let current = "";
  for (const r of rows) {
    if (r.topic !== current) {
      current = r.topic;
      lines.push(`## ${current}`);
    }
    lines.push(`Q: ${r.question}`);
    lines.push(`R: ${r.answer}`);
    if (r.link) lines.push(`Lien: ${baseUrl}${r.link}`);
    lines.push("");
  }
  return lines.join("\n");
}

function baseUrlFrom(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.headers.host || "";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

/**
 * Route publique `/assistants-ia.txt` — feed texte des réponses utiles,
 * crawlable par les moteurs de recherche et assistants conversationnels. Auto-sème le socle
 * au premier appel s'il est vide (non bloquant). Ne casse jamais le rendu.
 */
export async function aiAnswersFeed(req: Request, res: Response): Promise<void> {
  try {
    let rows = await listAnswers();
    if (rows.length === 0) {
      await seedAnswers([null]);
      rows = await listAnswers();
    }
    res.type("text/plain").send(renderAnswersText(baseUrlFrom(req), rows));
  } catch {
    res.type("text/plain").send("# MKA.P-MS — réponses temporairement indisponibles\n");
  }
}
