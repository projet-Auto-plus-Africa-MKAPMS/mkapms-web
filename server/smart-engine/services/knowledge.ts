/**
 * Feature 16 — Connaissances externes (veille / benchmark)
 *
 * Base de connaissance alimentée hors plateforme : bonnes pratiques
 * observées ailleurs (marketplaces auto, garages, concessionnaires…) avec un
 * conseil concret pour MKA.P-MS. Le PDG peut ajouter des entrées ; une graine
 * de bonnes pratiques du secteur est fournie pour démarrer.
 *
 * Aucune récupération automatique de sites tiers ici : ce module stocke et
 * restitue des connaissances. La collecte automatisée pourra être branchée
 * plus tard (respect des CGU / robots.txt des sites).
 */
import { db } from "../../db.js";
import { smartKnowledge } from "../schema.js";
import { desc, eq, sql } from "drizzle-orm";

export const KNOWLEDGE_CATEGORIES = [
  "marketplace",
  "garage",
  "concessionnaire",
  "location",
  "pieces",
  "general",
] as const;
export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

interface KnowledgeSeed {
  category: KnowledgeCategory;
  source: string;
  insight: string;
  recommendation: string;
}

/** Graine de bonnes pratiques génériques du secteur automobile. */
const SEED: KnowledgeSeed[] = [
  {
    category: "marketplace",
    source: "Marketplaces automobiles (pratique générale)",
    insight:
      "Les grandes places de marché affichent un historique véhicule vérifié (contrôle technique, entretien, kilométrage certifié) directement sur la fiche.",
    recommendation:
      "Mettre en avant un bloc « Historique vérifié » sur la page produit pour renforcer la confiance acheteur.",
  },
  {
    category: "marketplace",
    source: "Marketplaces automobiles (pratique générale)",
    insight:
      "Les alertes de recherche enregistrées (nouvelle annonce correspondant à mes critères) augmentent fortement le taux de retour des utilisateurs.",
    recommendation:
      "Pousser la fonction « Enregistrer ma recherche » et notifier dès qu'une annonce correspond (déjà amorcé côté Système Intelligent).",
  },
  {
    category: "concessionnaire",
    source: "Concessionnaires (pratique générale)",
    insight:
      "Les concessionnaires proposent une estimation de reprise instantanée pour capter le vendeur au bon moment.",
    recommendation:
      "Ajouter un simulateur d'estimation/reprise dans l'espace vendeur pour capter les intentions de vente.",
  },
  {
    category: "garage",
    source: "Réseaux de garages (pratique générale)",
    insight:
      "La prise de rendez-vous en ligne avec créneaux en temps réel et devis instantané réduit les frictions et les no-shows.",
    recommendation:
      "Renforcer le module Devis/RDV garage avec créneaux en temps réel et rappel automatique.",
  },
  {
    category: "location",
    source: "Plateformes de location (pratique générale)",
    insight:
      "L'affichage transparent du prix tout compris (assurance, km inclus, caution) évite l'abandon au paiement.",
    recommendation:
      "Sur les pages location, afficher un prix « tout compris » détaillé et pliable (déjà partiellement en place).",
  },
  {
    category: "pieces",
    source: "Vendeurs de pièces (pratique générale)",
    insight:
      "La compatibilité pièce ↔ véhicule (par plaque ou VIN) est un critère décisif pour l'achat de pièces.",
    recommendation:
      "Proposer une recherche de pièces par compatibilité véhicule (plaque/VIN) dans l'univers Pièces.",
  },
];

export async function seedKnowledge() {
  const [row] = await db.select({ n: sql<number>`count(*)` }).from(smartKnowledge);
  if (Number(row?.n ?? 0) > 0) return { seeded: 0 };
  await db.insert(smartKnowledge).values(
    SEED.map((s) => ({
      category: s.category,
      source: s.source,
      insight: s.insight,
      recommendation: s.recommendation,
      addedBy: null,
    })),
  );
  return { seeded: SEED.length };
}

interface AddKnowledgeInput {
  category: string;
  source?: string;
  insight: string;
  recommendation?: string;
  url?: string;
  addedBy: number;
}

export async function addKnowledge(input: AddKnowledgeInput) {
  const [row] = await db
    .insert(smartKnowledge)
    .values({
      category: input.category,
      source: input.source ?? null,
      insight: input.insight,
      recommendation: input.recommendation ?? null,
      url: input.url ?? null,
      addedBy: input.addedBy,
    })
    .returning();
  return row;
}

export async function listKnowledge(category?: string, limit = 200) {
  const q = db.select().from(smartKnowledge);
  const rows = category
    ? await q.where(eq(smartKnowledge.category, category)).orderBy(desc(smartKnowledge.createdAt)).limit(limit)
    : await q.orderBy(desc(smartKnowledge.createdAt)).limit(limit);
  return rows;
}

export async function markApplied(id: number, applied: boolean) {
  const [row] = await db
    .update(smartKnowledge)
    .set({ applied })
    .where(eq(smartKnowledge.id, id))
    .returning();
  return row;
}

export async function getKnowledgeStats() {
  const rows = await db
    .select({ category: smartKnowledge.category, n: sql<number>`count(*)` })
    .from(smartKnowledge)
    .groupBy(smartKnowledge.category);
  const [tot] = await db
    .select({
      total: sql<number>`count(*)`,
      applied: sql<number>`count(*) filter (where ${smartKnowledge.applied} = true)`,
    })
    .from(smartKnowledge);
  return {
    total: Number(tot?.total ?? 0),
    applied: Number(tot?.applied ?? 0),
    byCategory: rows.map((r) => ({ category: r.category, count: Number(r.n) })),
  };
}
