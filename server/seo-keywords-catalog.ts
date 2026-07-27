/**
 * MKA.P-MS — SEO OS : base de mots-clés (Phase 1).
 *
 * Catalogue curé des mots-clés couvrant TOUS les univers de la plateforme.
 * Cette base est la fondation du référencement : chaque univers y déclare ses
 * intentions de recherche. Elle alimente ensuite l'association (Phase 2) et la
 * génération des pages (Phase 3).
 *
 * Le seed est idempotent : ré-exécutable sans doublon (upsert sur la clé
 * unique univers + mot-clé + langue + pays, migration 0046).
 *
 * Aucune donnée inventée : les univers et les intitulés reprennent la réalité
 * de la plateforme (services, pièces, marketplace, international).
 */

import { sql } from "drizzle-orm";
import { db } from "./db.js";
import { seoKeywords } from "./schema.js";

export interface KeywordGroup {
  univers: string;
  label: string;
  keywords: string[];
}

/**
 * Catalogue par univers. Les intitulés d'univers sont alignés sur ceux
 * utilisés par le générateur de pages (`seo-generator.ts`) pour permettre
 * l'association ultérieure.
 */
export const SEO_KEYWORD_CATALOG: KeywordGroup[] = [
  {
    univers: "vente",
    label: "Vente & Achat",
    keywords: [
      "achat de véhicule",
      "vente de véhicule",
      "voiture occasion",
      "voiture neuve",
      "dépôt d'annonce auto",
      "vendre sa voiture",
      "acheter une voiture",
      "véhicules particuliers",
      "véhicules professionnels",
      "véhicules utilitaires",
      "camions occasion",
      "motos occasion",
      "scooter occasion",
      "véhicules électriques",
      "véhicules hybrides",
      "voiture sans permis",
      "4x4 et SUV occasion",
      "estimation voiture gratuite",
    ],
  },
  {
    univers: "location",
    label: "Location",
    keywords: [
      "location de voiture",
      "location courte durée",
      "location longue durée",
      "location utilitaire",
      "location voiture particulier",
      "location voiture professionnel",
      "location VTC",
      "location taxi",
      "location voiture entreprise",
      "location camion déménagement",
      "location véhicule sans conducteur",
      "louer une voiture pas cher",
    ],
  },
  {
    univers: "garage",
    label: "Garage & Mécanique",
    keywords: [
      "garage automobile",
      "mécanique auto",
      "diagnostic automobile",
      "entretien voiture",
      "révision voiture",
      "vidange",
      "freinage",
      "courroie de distribution",
      "embrayage",
      "suspension",
      "climatisation auto",
      "batterie voiture",
      "alternateur",
      "démarreur",
      "pneus",
      "géométrie parallélisme",
      "échappement",
      "réparation moteur",
      "garage près de chez moi",
      "devis garage en ligne",
    ],
  },
  {
    univers: "carrosserie",
    label: "Carrosserie",
    keywords: [
      "carrosserie automobile",
      "peinture voiture",
      "débosselage",
      "réparation pare-brise",
      "remplacement pare-brise",
      "rénovation carrosserie",
      "lustrage voiture",
      "réparation rayure voiture",
      "carrosserie sans peinture",
    ],
  },
  {
    univers: "controle-technique",
    label: "Contrôle technique",
    keywords: [
      "contrôle technique",
      "pré-contrôle technique",
      "contre-visite",
      "centre contrôle technique agréé",
      "prix contrôle technique",
      "rendez-vous contrôle technique",
    ],
  },
  {
    univers: "administratif",
    label: "Administratif",
    keywords: [
      "carte grise",
      "certificat d'immatriculation",
      "WW garage",
      "immatriculation véhicule",
      "changement de titulaire",
      "importation véhicule",
      "exportation véhicule",
      "quitus fiscal",
      "carte grise en ligne",
    ],
  },
  {
    univers: "pieces",
    label: "Pièces détachées",
    keywords: [
      "pièces auto",
      "pièces auto neuves",
      "pièces auto d'occasion",
      "accessoires auto",
      "pièces détachées toutes marques",
      "pièces moteur",
      "pièces carrosserie",
      "acheter pièces auto en ligne",
    ],
  },
  {
    univers: "professionnels",
    label: "Professionnels",
    keywords: [
      "garage partenaire",
      "devenir vendeur auto",
      "devenir loueur",
      "gestion de flotte automobile",
      "VTC professionnel",
      "taxi professionnel",
      "concessionnaire automobile",
      "importateur automobile",
      "marketplace B2B automobile",
      "compte professionnel auto",
    ],
  },
  {
    univers: "marketplace",
    label: "Marketplace",
    keywords: [
      "marketplace automobile",
      "enchères automobiles",
      "vente directe véhicule",
      "réservation véhicule en ligne",
      "paiement sécurisé automobile",
      "livraison de véhicule",
      "transport de véhicule",
      "dépannage et remorquage",
    ],
  },
  {
    univers: "international",
    label: "Afrique & International",
    keywords: [
      "voiture Guinée",
      "voiture Sénégal",
      "voiture Côte d'Ivoire",
      "voiture Mali",
      "voiture Burkina Faso",
      "importation voiture Afrique",
      "vente voiture Afrique de l'Ouest",
      "achat voiture depuis l'Europe",
      "expédition véhicule Afrique",
    ],
  },
];

/** Nombre total de mots-clés du catalogue. */
export function catalogSize(): number {
  return SEO_KEYWORD_CATALOG.reduce((n, g) => n + g.keywords.length, 0);
}

export interface SeedKeywordsReport {
  inserted: number;
  skipped: number;
  total: number;
  universes: number;
}

/**
 * Insère (ou complète) la base de mots-clés dans `seo_keywords`.
 * Idempotent : ON CONFLICT DO NOTHING sur (univers, mot-clé, langue, pays).
 */
export async function seedKeywords(
  opts: { language?: string; country?: string } = {},
): Promise<SeedKeywordsReport> {
  const language = opts.language ?? "fr";
  const country = opts.country ?? "FR";

  const rows = SEO_KEYWORD_CATALOG.flatMap((g) =>
    g.keywords.map((keyword) => ({
      univers: g.univers,
      keyword: keyword.slice(0, 128),
      language,
      country,
      active: true,
    })),
  );

  let inserted = 0;
  for (const value of rows) {
    const res = await db
      .insert(seoKeywords)
      .values(value)
      .onConflictDoNothing({
        target: [
          seoKeywords.univers,
          seoKeywords.keyword,
          seoKeywords.language,
          seoKeywords.country,
        ],
      })
      .returning({ id: seoKeywords.id });
    if (res.length > 0) inserted++;
  }

  return {
    inserted,
    skipped: rows.length - inserted,
    total: rows.length,
    universes: SEO_KEYWORD_CATALOG.length,
  };
}

/** Répartition des mots-clés enregistrés par univers. */
export async function keywordsByUnivers(): Promise<{ univers: string; count: number }[]> {
  try {
    return await db
      .select({ univers: seoKeywords.univers, count: sql<number>`count(*)::int` })
      .from(seoKeywords)
      .groupBy(seoKeywords.univers)
      .orderBy(sql`count(*) desc`);
  } catch {
    return [];
  }
}
