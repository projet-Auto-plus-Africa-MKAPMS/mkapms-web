/**
 * MKA.P-MS — Générateur de pages programmatiques SEO OS.
 *
 * Produit des pages `seo_pages` indexables pour 100 % de la plateforme :
 * services, pièces, locations, marques, modèles, villes, pays, achat/vente.
 *
 * Principe SEO : on privilégie les pages qui ont du contenu réel (marques,
 * modèles et villes issus des annonces publiées) pour éviter les pages
 * « minces » que Google déclasse, tout en couvrant les pages catalogue
 * (services, pièces, locations, pays) définies ici.
 *
 * La génération est idempotente : ré-exécutable sans doublon (upsert par slug).
 */

import { and, eq, sql } from "drizzle-orm";
import { db } from "./db.js";
import { annonces, garagesPublics, seoPages } from "./schema.js";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}

interface SeoPageInput {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  content: string;
  keywords: string[];
  pageType: string;
  univers?: string;
  city?: string;
  country?: string;
  priority?: string;
}

// ─── Catalogues curés ───────────────────────────────────────────────────────

/** Services automobiles (page par service). */
export const SERVICES: { slug: string; name: string; desc: string }[] = [
  { slug: "controle-technique", name: "Contrôle technique", desc: "Prise de rendez-vous et centres de contrôle technique agréés." },
  { slug: "carte-grise", name: "Carte grise", desc: "Démarches d'immatriculation et changement de titulaire en ligne." },
  { slug: "carrosserie", name: "Carrosserie", desc: "Réparation de carrosserie, débosselage et remise en état." },
  { slug: "peinture", name: "Peinture automobile", desc: "Peinture complète ou partielle, raccords et lustrage." },
  { slug: "diagnostic", name: "Diagnostic automobile", desc: "Diagnostic électronique et recherche de pannes." },
  { slug: "revision", name: "Révision", desc: "Révision constructeur et entretien périodique." },
  { slug: "vidange", name: "Vidange", desc: "Vidange huile moteur et remplacement du filtre à huile." },
  { slug: "distribution", name: "Courroie de distribution", desc: "Remplacement de la courroie ou chaîne de distribution." },
  { slug: "embrayage", name: "Embrayage", desc: "Remplacement d'embrayage et volant moteur." },
  { slug: "freinage", name: "Freinage", desc: "Plaquettes, disques et purge du circuit de freinage." },
  { slug: "climatisation", name: "Climatisation", desc: "Recharge, entretien et réparation de la climatisation." },
  { slug: "geometrie", name: "Géométrie / parallélisme", desc: "Réglage du parallélisme et de la géométrie des trains." },
  { slug: "pneus", name: "Pneus", desc: "Montage, équilibrage et vente de pneus toutes marques." },
  { slug: "electricite", name: "Électricité automobile", desc: "Réparation électrique, faisceaux et équipements." },
  { slug: "batterie", name: "Batterie", desc: "Test, dépannage et remplacement de batterie." },
  { slug: "depannage", name: "Dépannage", desc: "Dépannage rapide sur route et à domicile." },
  { slug: "remorquage", name: "Remorquage", desc: "Remorquage et transport de véhicule en panne ou accidenté." },
  { slug: "lavage", name: "Lavage auto", desc: "Lavage intérieur, extérieur et nettoyage complet." },
  { slug: "estimation-vehicule", name: "Estimation véhicule", desc: "Estimation gratuite de la valeur de votre véhicule." },
  { slug: "expertise", name: "Expertise automobile", desc: "Expertise technique et contrôle avant achat." },
  { slug: "assurance", name: "Assurance automobile", desc: "Devis et souscription d'assurance auto." },
  { slug: "financement", name: "Financement", desc: "Crédit auto, leasing LOA et LLD." },
  { slug: "livraison", name: "Livraison de véhicule", desc: "Livraison et transport de véhicule porte-à-porte." },
];

/** Pièces automobiles (page par pièce). */
export const PIECES: { slug: string; name: string }[] = [
  { slug: "injecteur", name: "Injecteur" },
  { slug: "turbo", name: "Turbo" },
  { slug: "alternateur", name: "Alternateur" },
  { slug: "demarreur", name: "Démarreur" },
  { slug: "filtre", name: "Filtre" },
  { slug: "disque-de-frein", name: "Disque de frein" },
  { slug: "plaquette-de-frein", name: "Plaquette de frein" },
  { slug: "amortisseur", name: "Amortisseur" },
  { slug: "triangle-de-suspension", name: "Triangle de suspension" },
  { slug: "cardan", name: "Cardan" },
  { slug: "embrayage", name: "Kit d'embrayage" },
  { slug: "courroie-de-distribution", name: "Courroie de distribution" },
  { slug: "batterie", name: "Batterie" },
  { slug: "radiateur", name: "Radiateur" },
  { slug: "pare-brise", name: "Pare-brise" },
];

/** Catégories de location. */
export const LOCATIONS: { slug: string; name: string }[] = [
  { slug: "courte-duree", name: "Location courte durée" },
  { slug: "longue-duree", name: "Location longue durée" },
  { slug: "utilitaire", name: "Location utilitaire" },
  { slug: "van", name: "Location van" },
  { slug: "suv", name: "Location SUV" },
  { slug: "citadine", name: "Location citadine" },
  { slug: "vehicule-de-luxe", name: "Location véhicule de luxe" },
  { slug: "vehicule-professionnel", name: "Location véhicule professionnel" },
];

/** Pays internationaux préparés. */
export const PAYS: { slug: string; name: string }[] = [
  { slug: "france", name: "France" },
  { slug: "belgique", name: "Belgique" },
  { slug: "suisse", name: "Suisse" },
  { slug: "guinee", name: "Guinée" },
  { slug: "cote-d-ivoire", name: "Côte d'Ivoire" },
  { slug: "senegal", name: "Sénégal" },
  { slug: "maroc", name: "Maroc" },
  { slug: "espagne", name: "Espagne" },
  { slug: "allemagne", name: "Allemagne" },
];

/** Villes prioritaires pour les combinaisons service × ville. */
export const TOP_CITIES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier",
  "Strasbourg", "Bordeaux", "Lille", "Rennes", "Argenteuil", "Cergy", "Créteil",
];

/**
 * Réparations courantes (Phase 18). Chaque réparation devient une page, et
 * se combine avec les modèles réels des annonces pour des pages très ciblées
 * (ex. « Remplacement embrayage Clio 4 »).
 */
export const REPARATIONS: { slug: string; name: string }[] = [
  { slug: "remplacement-embrayage", name: "Remplacement d'embrayage" },
  { slug: "remplacement-alternateur", name: "Remplacement d'alternateur" },
  { slug: "remplacement-demarreur", name: "Remplacement du démarreur" },
  { slug: "vidange", name: "Vidange" },
  { slug: "courroie-de-distribution", name: "Remplacement courroie de distribution" },
  { slug: "remplacement-plaquettes-de-frein", name: "Remplacement des plaquettes de frein" },
  { slug: "remplacement-disques-de-frein", name: "Remplacement des disques de frein" },
  { slug: "remplacement-batterie", name: "Remplacement de batterie" },
  { slug: "remplacement-amortisseurs", name: "Remplacement des amortisseurs" },
  { slug: "remplacement-roulement", name: "Remplacement de roulement de roue" },
  { slug: "diagnostic-moteur", name: "Diagnostic moteur" },
  { slug: "remplacement-turbo", name: "Remplacement du turbo" },
  { slug: "remplacement-injecteur", name: "Remplacement d'injecteur" },
  { slug: "remplacement-pare-brise", name: "Remplacement du pare-brise" },
  { slug: "recharge-climatisation", name: "Recharge de climatisation" },
];

/** Régions françaises (Phase 16 — maillage géographique national). */
export const REGIONS: { slug: string; name: string }[] = [
  { slug: "ile-de-france", name: "Île-de-France" },
  { slug: "auvergne-rhone-alpes", name: "Auvergne-Rhône-Alpes" },
  { slug: "provence-alpes-cote-d-azur", name: "Provence-Alpes-Côte d'Azur" },
  { slug: "occitanie", name: "Occitanie" },
  { slug: "nouvelle-aquitaine", name: "Nouvelle-Aquitaine" },
  { slug: "hauts-de-france", name: "Hauts-de-France" },
  { slug: "grand-est", name: "Grand Est" },
  { slug: "pays-de-la-loire", name: "Pays de la Loire" },
  { slug: "bretagne", name: "Bretagne" },
  { slug: "normandie", name: "Normandie" },
  { slug: "bourgogne-franche-comte", name: "Bourgogne-Franche-Comté" },
  { slug: "centre-val-de-loire", name: "Centre-Val de Loire" },
  { slug: "corse", name: "Corse" },
];

/**
 * Villes par pays (Phase 16 — référencement mondial). Génère des pages
 * `pays/:pays/:ville` réellement rendues, sans lien mort.
 */
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  guinee: ["Conakry", "Kankan", "Labé", "Kindia", "Boké", "Nzérékoré", "Mamou", "Faranah", "Siguiri"],
  senegal: ["Dakar", "Thiès", "Touba", "Rufisque", "Saint-Louis", "Ziguinchor", "Kaolack", "Mbour"],
  "cote-d-ivoire": ["Abidjan", "Bouaké", "Daloa", "Yamoussoukro", "San-Pédro", "Korhogo", "Man"],
  mali: ["Bamako", "Sikasso", "Ségou", "Mopti", "Kayes", "Koutiala"],
  belgique: ["Bruxelles", "Anvers", "Gand", "Liège", "Charleroi", "Namur"],
  suisse: ["Genève", "Lausanne", "Zurich", "Berne", "Bâle"],
  maroc: ["Casablanca", "Rabat", "Marrakech", "Fès", "Tanger", "Agadir"],
};

/** Grandes villes françaises (préfectures) toujours générées en page ville. */
export const FR_CITIES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier",
  "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre",
  "Saint-Étienne", "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes",
  "Clermont-Ferrand", "Argenteuil", "Cergy", "Créteil", "Versailles",
  "Bezons", "Herblay", "Amiens", "Metz", "Tours", "Limoges", "Perpignan",
];

// ─── Fabrication du contenu ────────────────────────────────────────────────

function servicePage(s: { slug: string; name: string; desc: string }): SeoPageInput {
  return {
    slug: `service/${s.slug}`,
    title: `${s.name} — MKA.P-MS`,
    metaDescription: `${s.desc} Comparez les professionnels, tarifs et avis, et prenez rendez-vous sur MKA.P-MS.`,
    h1: s.name,
    content:
      `${s.desc} Sur MKA.P-MS, trouvez des professionnels vérifiés pour « ${s.name.toLowerCase()} », comparez les devis, ` +
      `consultez les avis clients et réservez en ligne. Service disponible partout en France et à l'international.`,
    keywords: [s.name.toLowerCase(), `${s.name.toLowerCase()} pas cher`, `${s.name.toLowerCase()} près de chez moi`, `devis ${s.name.toLowerCase()}`],
    pageType: "service",
    univers: "services",
    priority: "0.7",
  };
}

function serviceCityPage(s: { slug: string; name: string }, city: string): SeoPageInput {
  return {
    slug: `service/${s.slug}/${slugify(city)}`,
    title: `${s.name} à ${city} — MKA.P-MS`,
    metaDescription: `${s.name} à ${city} : professionnels vérifiés, tarifs et avis. Prenez rendez-vous en ligne sur MKA.P-MS.`,
    h1: `${s.name} à ${city}`,
    content:
      `Besoin de « ${s.name.toLowerCase()} » à ${city} ? MKA.P-MS référence les professionnels de ${city} et alentours : ` +
      `comparez les devis, consultez les avis et réservez votre intervention près de chez vous.`,
    keywords: [`${s.name.toLowerCase()} ${city.toLowerCase()}`, `${s.name.toLowerCase()} à ${city.toLowerCase()}`, `garage ${city.toLowerCase()}`],
    pageType: "geo_service",
    univers: "services",
    city,
    country: "FR",
    priority: "0.6",
  };
}

function piecePage(p: { slug: string; name: string }): SeoPageInput {
  return {
    slug: `piece/${p.slug}`,
    title: `${p.name} — pièces auto neuves et d'occasion — MKA.P-MS`,
    metaDescription: `Achetez votre ${p.name.toLowerCase()} au meilleur prix : pièces neuves et d'occasion pour toutes marques sur MKA.P-MS.`,
    h1: `${p.name} — pièces automobiles`,
    content:
      `Trouvez la pièce « ${p.name.toLowerCase()} » adaptée à votre véhicule sur MKA.P-MS : pièces neuves et d'occasion, ` +
      `toutes marques, avec garantie et livraison. Comparez les offres des vendeurs professionnels et particuliers.`,
    keywords: [p.name.toLowerCase(), `${p.name.toLowerCase()} pas cher`, `${p.name.toLowerCase()} occasion`, `acheter ${p.name.toLowerCase()}`],
    pageType: "piece",
    univers: "pieces",
    priority: "0.6",
  };
}

function locationPage(l: { slug: string; name: string }): SeoPageInput {
  return {
    slug: `location/${l.slug}`,
    title: `${l.name} — MKA.P-MS`,
    metaDescription: `${l.name} au meilleur prix : réservez en ligne, retrait rapide et véhicules vérifiés sur MKA.P-MS.`,
    h1: l.name,
    content:
      `Réservez votre ${l.name.toLowerCase()} sur MKA.P-MS : large choix de véhicules vérifiés, tarifs transparents ` +
      `et réservation en ligne. Loueurs professionnels et particuliers partout en France.`,
    keywords: [l.name.toLowerCase(), `${l.name.toLowerCase()} pas cher`, "louer voiture", "location auto"],
    pageType: "location",
    univers: "location",
    priority: "0.7",
  };
}

function paysPage(p: { slug: string; name: string }): SeoPageInput {
  return {
    slug: `pays/${p.slug}`,
    title: `Automobile en ${p.name} — achat, vente, location — MKA.P-MS`,
    metaDescription: `Achat, vente, location et entretien de véhicules en ${p.name} sur MKA.P-MS : annonces, garages et services locaux.`,
    h1: `Automobile en ${p.name}`,
    content:
      `MKA.P-MS accompagne l'automobile en ${p.name} : achetez, vendez ou louez un véhicule, trouvez un garage ` +
      `ou un service automobile local, avec la langue, la devise et les règles adaptées à ${p.name}.`,
    keywords: [`voiture ${p.name.toLowerCase()}`, `annonce auto ${p.name.toLowerCase()}`, `garage ${p.name.toLowerCase()}`],
    pageType: "geo_country",
    univers: "international",
    country: p.slug.slice(0, 4),
    priority: "0.6",
  };
}

function marquePage(marque: string, count: number): SeoPageInput {
  return {
    slug: `marque/${slugify(marque)}`,
    title: `${marque} occasion et neuve — annonces — MKA.P-MS`,
    metaDescription: `Toutes les annonces ${marque} sur MKA.P-MS : voitures d'occasion et neuves, ${count} véhicules à comparer au meilleur prix.`,
    h1: `${marque} — voitures d'occasion et neuves`,
    content:
      `Découvrez ${count} annonce(s) ${marque} sur MKA.P-MS. Comparez les modèles, les prix et les équipements, ` +
      `puis contactez directement les vendeurs particuliers et professionnels.`,
    keywords: [`${marque.toLowerCase()} occasion`, `acheter ${marque.toLowerCase()}`, `${marque.toLowerCase()} neuve`, `annonce ${marque.toLowerCase()}`],
    pageType: "marque",
    univers: "achat",
    priority: "0.7",
  };
}

function modelePage(marque: string, modele: string, count: number): SeoPageInput {
  return {
    slug: `marque/${slugify(marque)}/${slugify(modele)}`,
    title: `${marque} ${modele} occasion et neuve — MKA.P-MS`,
    metaDescription: `Annonces ${marque} ${modele} sur MKA.P-MS : ${count} véhicule(s), prix, années et kilométrages comparés.`,
    h1: `${marque} ${modele}`,
    content:
      `Retrouvez ${count} annonce(s) ${marque} ${modele} sur MKA.P-MS. Comparez les finitions, les années, ` +
      `les kilométrages et les prix pour acheter au juste prix.`,
    keywords: [`${marque.toLowerCase()} ${modele.toLowerCase()}`, `${marque.toLowerCase()} ${modele.toLowerCase()} occasion`, `prix ${marque.toLowerCase()} ${modele.toLowerCase()}`],
    pageType: "modele",
    univers: "achat",
    priority: "0.7",
  };
}

function villePage(city: string, count: number): SeoPageInput {
  return {
    slug: `ville/${slugify(city)}`,
    title: `Voitures à vendre à ${city} — MKA.P-MS`,
    metaDescription: `Annonces automobiles à ${city} : ${count} véhicule(s) d'occasion et neufs, garages et services locaux sur MKA.P-MS.`,
    h1: `Automobile à ${city}`,
    content:
      `Trouvez une voiture à ${city} sur MKA.P-MS : ${count} annonce(s) locales, garages, pièces et services automobiles ` +
      `à ${city} et dans ses environs. Achetez, vendez et entretenez votre véhicule près de chez vous.`,
    keywords: [`voiture ${city.toLowerCase()}`, `voiture occasion ${city.toLowerCase()}`, `garage ${city.toLowerCase()}`, `annonce auto ${city.toLowerCase()}`],
    pageType: "geo_ville",
    univers: "achat",
    city,
    country: "FR",
    priority: "0.6",
  };
}

function reparationPage(r: { slug: string; name: string }): SeoPageInput {
  return {
    slug: `reparation/${r.slug}`,
    title: `${r.name} — prix, garages et rendez-vous — MKA.P-MS`,
    metaDescription: `${r.name} : trouvez un garage vérifié, comparez les devis et prenez rendez-vous en ligne sur MKA.P-MS.`,
    h1: r.name,
    content:
      `Besoin d'une intervention « ${r.name.toLowerCase()} » ? MKA.P-MS vous met en relation avec des garages ` +
      `vérifiés : comparez les devis, consultez les avis clients et réservez votre rendez-vous en ligne, ` +
      `partout en France et à l'international.`,
    keywords: [r.name.toLowerCase(), `prix ${r.name.toLowerCase()}`, `${r.name.toLowerCase()} garage`, `devis ${r.name.toLowerCase()}`],
    pageType: "reparation",
    univers: "garage",
    priority: "0.6",
  };
}

function reparationModelePage(r: { slug: string; name: string }, marque: string, modele: string): SeoPageInput {
  const vehicule = `${marque} ${modele}`;
  return {
    slug: `reparation/${r.slug}/${slugify(vehicule)}`,
    title: `${r.name} ${vehicule} — prix et garages — MKA.P-MS`,
    metaDescription: `${r.name} sur ${vehicule} : tarif indicatif, garages spécialisés et prise de rendez-vous en ligne sur MKA.P-MS.`,
    h1: `${r.name} — ${vehicule}`,
    content:
      `Vous recherchez « ${r.name.toLowerCase()} » pour votre ${vehicule} ? MKA.P-MS référence les garages ` +
      `capables d'intervenir sur ${vehicule} : comparez les devis, vérifiez les avis et réservez près de chez vous.`,
    keywords: [`${r.name.toLowerCase()} ${vehicule.toLowerCase()}`, `prix ${r.name.toLowerCase()} ${modele.toLowerCase()}`, `garage ${modele.toLowerCase()}`],
    pageType: "reparation_modele",
    univers: "garage",
    priority: "0.5",
  };
}

function regionPage(r: { slug: string; name: string }): SeoPageInput {
  return {
    slug: `region/${r.slug}`,
    title: `Automobile en ${r.name} — achat, vente, location, garages — MKA.P-MS`,
    metaDescription: `Voitures d'occasion, location, garages et services automobiles en ${r.name} sur MKA.P-MS.`,
    h1: `Automobile en ${r.name}`,
    content:
      `MKA.P-MS couvre toute la région ${r.name} : annonces de véhicules, location, garages, pièces et démarches ` +
      `administratives. Trouvez les meilleures offres et professionnels près de chez vous en ${r.name}.`,
    keywords: [`voiture ${r.name.toLowerCase()}`, `garage ${r.name.toLowerCase()}`, `location voiture ${r.name.toLowerCase()}`],
    pageType: "geo_region",
    univers: "achat",
    country: "FR",
    priority: "0.6",
  };
}

function paysVillePage(paysSlug: string, paysName: string, city: string): SeoPageInput {
  return {
    slug: `pays/${paysSlug}/${slugify(city)}`,
    title: `Automobile à ${city} (${paysName}) — MKA.P-MS`,
    metaDescription: `Achat, vente, location et entretien de véhicules à ${city}, ${paysName}, sur MKA.P-MS : annonces et services locaux.`,
    h1: `Automobile à ${city}, ${paysName}`,
    content:
      `MKA.P-MS à ${city} (${paysName}) : achetez, vendez ou louez un véhicule, trouvez un garage ou un service ` +
      `automobile local. Importation depuis l'Europe, annonces et professionnels adaptés à ${city}.`,
    keywords: [`voiture ${city.toLowerCase()}`, `voiture ${paysName.toLowerCase()}`, `importation voiture ${city.toLowerCase()}`],
    pageType: "geo_city_intl",
    univers: "international",
    city,
    country: paysSlug.slice(0, 4),
    priority: "0.5",
  };
}

// ─── Génération ────────────────────────────────────────────────────────────

async function upsertPages(pages: SeoPageInput[]): Promise<number> {
  let n = 0;
  for (const p of pages) {
    if (!p.slug) continue;
    const canonical = `/${p.slug}`;
    const values = {
      slug: p.slug,
      title: p.title.slice(0, 160),
      metaDescription: p.metaDescription.slice(0, 320),
      h1: p.h1.slice(0, 200),
      content: p.content,
      keywords: p.keywords,
      pageType: p.pageType,
      univers: p.univers,
      city: p.city,
      country: p.country,
      canonicalUrl: canonical,
      indexed: true,
      priority: p.priority ?? "0.7",
      changeFreq: "weekly",
      updatedAt: new Date(),
    };
    await db
      .insert(seoPages)
      .values(values)
      .onConflictDoUpdate({ target: seoPages.slug, set: { ...values } });
    n++;
  }
  return n;
}

/** Distinct marques (+count) des annonces publiées. */
async function marquesFromAnnonces(): Promise<{ marque: string; n: number }[]> {
  try {
    const rows = await db
      .select({ marque: annonces.marque, n: sql<number>`count(*)` })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .groupBy(annonces.marque);
    return rows.filter((r) => r.marque).map((r) => ({ marque: r.marque, n: Number(r.n) }));
  } catch {
    return [];
  }
}

async function modelesFromAnnonces(): Promise<{ marque: string; modele: string; n: number }[]> {
  try {
    const rows = await db
      .select({ marque: annonces.marque, modele: annonces.modele, n: sql<number>`count(*)` })
      .from(annonces)
      .where(eq(annonces.status, "publiee"))
      .groupBy(annonces.marque, annonces.modele);
    return rows.filter((r) => r.marque && r.modele).map((r) => ({ marque: r.marque, modele: r.modele, n: Number(r.n) }));
  } catch {
    return [];
  }
}

async function villesFromData(): Promise<{ ville: string; n: number }[]> {
  const map = new Map<string, number>();
  try {
    const rows = await db
      .select({ ville: annonces.ville, n: sql<number>`count(*)` })
      .from(annonces)
      .where(and(eq(annonces.status, "publiee")))
      .groupBy(annonces.ville);
    for (const r of rows) if (r.ville) map.set(r.ville, (map.get(r.ville) ?? 0) + Number(r.n));
  } catch {
    /* ignore */
  }
  try {
    const rows = await db
      .select({ ville: garagesPublics.city, n: sql<number>`count(*)` })
      .from(garagesPublics)
      .where(eq(garagesPublics.status, "valide"))
      .groupBy(garagesPublics.city);
    for (const r of rows) if (r.ville) map.set(r.ville, (map.get(r.ville) ?? 0) + Number(r.n));
  } catch {
    /* ignore */
  }
  // Toujours garantir les grandes villes françaises (préfectures)
  for (const c of FR_CITIES) if (!map.has(c)) map.set(c, 0);
  return [...map.entries()].map(([ville, n]) => ({ ville, n }));
}

export interface GenerationReport {
  services: number;
  serviceCities: number;
  pieces: number;
  locations: number;
  pays: number;
  marques: number;
  modeles: number;
  villes: number;
  reparations: number;
  reparationModeles: number;
  regions: number;
  paysVilles: number;
  total: number;
}

/**
 * Génère (ou met à jour) l'ensemble des pages programmatiques SEO.
 * Idempotent : upsert par slug.
 */
export async function generateProgrammaticPages(): Promise<GenerationReport> {
  const report: GenerationReport = {
    services: 0, serviceCities: 0, pieces: 0, locations: 0, pays: 0,
    marques: 0, modeles: 0, villes: 0,
    reparations: 0, reparationModeles: 0, regions: 0, paysVilles: 0, total: 0,
  };

  // Catalogues curés
  report.services = await upsertPages(SERVICES.map(servicePage));
  report.pieces = await upsertPages(PIECES.map(piecePage));
  report.locations = await upsertPages(LOCATIONS.map(locationPage));
  report.pays = await upsertPages(PAYS.map(paysPage));
  report.reparations = await upsertPages(REPARATIONS.map(reparationPage));
  report.regions = await upsertPages(REGIONS.map(regionPage));

  // Combinaisons service × ville prioritaire
  const serviceCity: SeoPageInput[] = [];
  for (const s of SERVICES) for (const c of TOP_CITIES) serviceCity.push(serviceCityPage(s, c));
  report.serviceCities = await upsertPages(serviceCity);

  // Pays × villes (référencement mondial)
  const paysName = new Map(PAYS.map((p) => [p.slug, p.name]));
  const paysVilles: SeoPageInput[] = [];
  for (const [paysSlug, cities] of Object.entries(CITIES_BY_COUNTRY)) {
    const name = paysName.get(paysSlug) ?? paysSlug;
    for (const c of cities) paysVilles.push(paysVillePage(paysSlug, name, c));
  }
  report.paysVilles = await upsertPages(paysVilles);

  // Données réelles
  const marques = await marquesFromAnnonces();
  report.marques = await upsertPages(marques.map((m) => marquePage(m.marque, m.n)));

  const modeles = await modelesFromAnnonces();
  report.modeles = await upsertPages(modeles.map((m) => modelePage(m.marque, m.modele, m.n)));

  const villes = await villesFromData();
  report.villes = await upsertPages(villes.map((v) => villePage(v.ville, v.n)));

  // Réparation × modèle réel (bornée aux modèles les plus présents)
  const topModeles = [...modeles].sort((a, b) => b.n - a.n).slice(0, 40);
  const repMod: SeoPageInput[] = [];
  for (const r of REPARATIONS) for (const m of topModeles) repMod.push(reparationModelePage(r, m.marque, m.modele));
  report.reparationModeles = await upsertPages(repMod);

  report.total =
    report.services + report.serviceCities + report.pieces + report.locations +
    report.pays + report.marques + report.modeles + report.villes +
    report.reparations + report.reparationModeles + report.regions + report.paysVilles;
  return report;
}
