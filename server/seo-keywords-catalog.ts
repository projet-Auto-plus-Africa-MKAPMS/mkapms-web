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

import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "./db.js";
import { seoKeywords } from "./schema.js";
import { countryCountries } from "./country-os/index.js";
import { smartSearchLogs } from "./smart-engine/schema.js";

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

/**
 * Phase 2 — Association intelligente : chaque univers pointe vers sa page
 * canonique RÉELLEMENT rendue côté visiteur (route statique de `App.tsx` ou
 * page programmatique SSR `/service/:slug`, `/pays/:slug`…). Aucune cible ne
 * mène vers une route inexistante (pas de lien mort).
 */
export const UNIVERS_TARGET: Record<string, string> = {
  vente: "/acheter",
  location: "/louer",
  garage: "/garages",
  carrosserie: "/service/carrosserie",
  "controle-technique": "/service/controle-technique",
  administratif: "/demarches",
  pieces: "/pieces",
  professionnels: "/espace-pro",
  marketplace: "/acheter",
  international: "/acheter",
};

export interface AssociateKeywordsReport {
  updated: number;
  alreadySet: number;
  total: number;
  byUnivers: { univers: string; target: string; count: number }[];
}

/**
 * Associe chaque mot-clé enregistré à la page cible de son univers.
 * Idempotent : ne réécrit que les lignes dont `target_path` diffère de la
 * cible attendue (les lignes déjà correctes sont ignorées).
 */
export async function associateKeywords(): Promise<AssociateKeywordsReport> {
  const byUnivers: { univers: string; target: string; count: number }[] = [];
  let updated = 0;
  let alreadySet = 0;
  let total = 0;

  const counts = await keywordsByUnivers();
  const countMap = new Map(counts.map((c) => [c.univers, Number(c.count)]));

  for (const [univers, target] of Object.entries(UNIVERS_TARGET)) {
    const count = countMap.get(univers) ?? 0;
    total += count;
    byUnivers.push({ univers, target, count });

    // Ne touche que les lignes non encore alignées sur la bonne cible.
    const res = await db
      .update(seoKeywords)
      .set({ targetPath: target })
      .where(
        sql`${seoKeywords.univers} = ${univers} AND (${seoKeywords.targetPath} IS DISTINCT FROM ${target})`,
      )
      .returning({ id: seoKeywords.id });
    updated += res.length;
    alreadySet += Math.max(0, count - res.length);
  }

  return { updated, alreadySet, total, byUnivers };
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

// ═══════════════════════════════════════════════════════════════════════
// P4 — Moteur de mots-clés PAR PAYS
// ═══════════════════════════════════════════════════════════════════════

export interface SeedCountriesReport {
  countries: number;
  perCountry: { country: string; language: string; inserted: number; total: number }[];
  totalInserted: number;
}

/**
 * Alimente la base de mots-clés pour TOUS les pays actifs déclarés dans le
 * Country OS, chacun avec sa langue par défaut. Aucune donnée inventée : la
 * liste des pays et leurs langues proviennent de `country_countries`.
 * Idempotent (upsert sur univers + mot-clé + langue + pays).
 */
export async function seedKeywordsForActiveCountries(): Promise<SeedCountriesReport> {
  const countries = await db
    .select({ code: countryCountries.code, lang: countryCountries.defaultLanguage })
    .from(countryCountries)
    .where(eq(countryCountries.active, true));

  const perCountry: SeedCountriesReport["perCountry"] = [];
  let totalInserted = 0;

  for (const c of countries) {
    const report = await seedKeywords({
      language: (c.lang ?? "fr").slice(0, 4),
      country: c.code,
    });
    perCountry.push({
      country: c.code,
      language: (c.lang ?? "fr").slice(0, 4),
      inserted: report.inserted,
      total: report.total,
    });
    totalInserted += report.inserted;
  }

  return { countries: countries.length, perCountry, totalInserted };
}

/**
 * Infère l'univers d'une requête libre en la comparant au catalogue curé.
 * Renvoie l'univers du premier groupe dont un mot-clé partage un token avec
 * la requête, sinon `recherche` (bucket des intentions apprises).
 */
function inferUnivers(query: string): string {
  const tokens = new Set(
    query
      .toLowerCase()
      .split(/[^a-zà-ÿ0-9]+/)
      .filter((t) => t.length >= 3),
  );
  if (tokens.size === 0) return "recherche";
  for (const group of SEO_KEYWORD_CATALOG) {
    for (const kw of group.keywords) {
      const kwTokens = kw.toLowerCase().split(/[^a-zà-ÿ0-9]+/);
      if (kwTokens.some((t) => t.length >= 3 && tokens.has(t))) {
        return group.univers;
      }
    }
  }
  return "recherche";
}

/** Normalise un pays de log (« FR », « France »…) vers un code ISO à 2 lettres. */
function normalizeCountry(raw: string | null, nameToCode: Map<string, string>): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) return trimmed.toUpperCase();
  return nameToCode.get(trimmed.toLowerCase()) ?? null;
}

export interface LearnKeywordsReport {
  scannedSearches: number;
  learned: number;
  reinforced: number;
  skipped: number;
  days: number;
}

/**
 * Boucle d'apprentissage automatique : lit les recherches réelles récentes
 * (Smart Engine) et enrichit la base de mots-clés PAR PAYS. Chaque requête
 * distincte devient (ou renforce) un mot-clé du pays où elle a été faite ;
 * `volume` accumule le nombre d'occurrences observées.
 * Lecture des recherches uniquement — aucune action sensible.
 */
export async function learnKeywordsFromSearches(
  opts: { days?: number; minOccurrences?: number } = {},
): Promise<LearnKeywordsReport> {
  const days = opts.days ?? 30;
  const minOccurrences = opts.minOccurrences ?? 2;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const countries = await db
    .select({ code: countryCountries.code, nameFr: countryCountries.nameFr, nameEn: countryCountries.nameEn })
    .from(countryCountries);
  const nameToCode = new Map<string, string>();
  for (const c of countries) {
    nameToCode.set(c.code.toLowerCase(), c.code);
    if (c.nameFr) nameToCode.set(c.nameFr.toLowerCase(), c.code);
    if (c.nameEn) nameToCode.set(c.nameEn.toLowerCase(), c.code);
  }

  const rows = await db
    .select({
      query: smartSearchLogs.query,
      pays: smartSearchLogs.pays,
      occurrences: sql<number>`count(*)::int`,
    })
    .from(smartSearchLogs)
    .where(and(gte(smartSearchLogs.createdAt, since), sql`${smartSearchLogs.query} IS NOT NULL AND length(trim(${smartSearchLogs.query})) >= 3`))
    .groupBy(smartSearchLogs.query, smartSearchLogs.pays);

  let learned = 0;
  let reinforced = 0;
  let skipped = 0;

  for (const row of rows) {
    const query = (row.query ?? "").trim();
    const occ = Number(row.occurrences);
    const country = normalizeCountry(row.pays, nameToCode);
    if (!query || occ < minOccurrences || !country) {
      skipped++;
      continue;
    }
    const univers = inferUnivers(query);
    const res = await db
      .insert(seoKeywords)
      .values({
        univers,
        keyword: query.slice(0, 128),
        language: "fr",
        country,
        volume: occ,
        active: true,
      })
      .onConflictDoUpdate({
        target: [seoKeywords.univers, seoKeywords.keyword, seoKeywords.language, seoKeywords.country],
        set: { volume: sql`GREATEST(COALESCE(${seoKeywords.volume}, 0), ${occ})` },
      })
      .returning({ id: seoKeywords.id, volume: seoKeywords.volume });

    if (res.length > 0 && (res[0].volume ?? 0) === occ) {
      learned++;
    } else {
      reinforced++;
    }
  }

  return { scannedSearches: rows.length, learned, reinforced, skipped, days };
}
