/**
 * MKA.P-MS Intelligences — lecture d'une recherche véhicule dictée ou écrite
 * en langage naturel.
 *
 * Règle tenue ici : on n'extrait **que** des critères que la base sait
 * réellement filtrer. Tout terme non reconnu est rendu dans `nonCompris` au
 * lieu d'être deviné — un critère inventé renverrait un stock faux à
 * l'acheteur, ce qui est pire qu'un critère manquant.
 */
import { and, eq, gte, ilike, isNotNull, isNull, lte, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { annonces } from "../schema.js";

export interface CriteresVehicule {
  type?: "vente" | "location";
  marque?: string;
  modele?: string;
  categorie?: string;
  anneeMin?: number;
  anneeMax?: number;
  kmMax?: number;
  prixMin?: number;
  prixMax?: number;
  carburant?: string;
  boite?: string;
  etat?: string;
  couleur?: string;
  places?: number;
  portes?: number;
  puissanceMin?: number;
  vendeur?: "particulier" | "professionnelle" | "officielle";
  ville?: string;
  pays?: string;
  proximite?: boolean;
}

export interface LectureRecherche {
  criteres: CriteresVehicule;
  compris: string[];
  nonCompris: string[];
}

const CATEGORIES = [
  "citadine", "berline", "break", "suv", "coupe", "cabriolet", "monospace",
  "utilitaire", "camion", "moto", "scooter", "quad", "luxe", "autre",
] as const;

const SYNONYMES_CATEGORIE: Record<string, string> = {
  "4x4": "suv", suv: "suv", tout: "suv",
  citadine: "citadine", berline: "berline", break: "break",
  coupé: "coupe", coupe: "coupe", cabriolet: "cabriolet", décapotable: "cabriolet",
  monospace: "monospace", utilitaire: "utilitaire", fourgon: "utilitaire",
  camion: "camion", poids: "camion",
  moto: "moto", scooter: "scooter", quad: "quad", luxe: "luxe",
};

const CARBURANTS: Record<string, string> = {
  essence: "essence", diesel: "diesel", gazole: "diesel", gasoil: "diesel",
  hybride: "hybride", électrique: "electrique", electrique: "electrique",
  gpl: "gpl", ethanol: "ethanol", éthanol: "ethanol",
};

const BOITES: Record<string, string> = {
  manuelle: "manuelle", manuel: "manuelle",
  automatique: "automatique", auto: "automatique", bva: "automatique",
};

const ETATS: Record<string, string> = {
  neuf: "neuf", neuve: "neuf",
  occasion: "occasion", "0km": "neuf",
};

const COULEURS = [
  "noir", "blanc", "gris", "rouge", "bleu", "vert", "jaune", "orange",
  "marron", "beige", "argent", "violet", "rose",
];

const VENDEURS: Record<string, "particulier" | "professionnelle" | "officielle"> = {
  particulier: "particulier", particuliers: "particulier",
  professionnel: "professionnelle", pro: "professionnelle",
  concession: "professionnelle", garage: "professionnelle",
  officiel: "officielle", officielle: "officielle", mkapms: "officielle",
};

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Marques et modèles réellement présents dans le stock publié. */
async function stockConnu(): Promise<{ marques: string[]; modeles: Map<string, string[]> }> {
  const rows = await db
    .selectDistinct({ marque: annonces.marque, modele: annonces.modele })
    .from(annonces)
    .where(eq(annonces.status, "publiee"))
    .limit(5000);
  const marques = new Set<string>();
  const modeles = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.marque) continue;
    const marque = r.marque.trim();
    if (!marque) continue;
    marques.add(marque);
    if (r.modele && r.modele.trim()) {
      const liste = modeles.get(marque.toLowerCase()) ?? [];
      liste.push(r.modele.trim());
      modeles.set(marque.toLowerCase(), liste);
    }
  }
  return { marques: [...marques], modeles };
}

/** Villes réellement renseignées, pour ne jamais filtrer sur une ville absente. */
async function villesConnues(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ ville: annonces.ville })
    .from(annonces)
    .where(and(eq(annonces.status, "publiee"), isNotNull(annonces.ville)))
    .limit(3000);
  return rows
    .map((r) => (r.ville ?? "").trim())
    .filter((v) => v.length > 1);
}

export async function interpreter(entree: {
  texte: string;
  pays: string | null;
  langue: string;
}): Promise<LectureRecherche> {
  const texte = normaliser(entree.texte);
  const criteres: CriteresVehicule = {};
  const compris: string[] = [];
  const consommes: string[] = [];

  if (entree.pays) criteres.pays = entree.pays;

  /* Type d'annonce — vente ou location. */
  if (/\blou(er|ation)\b|\ba louer\b/.test(texte)) {
    criteres.type = "location";
    compris.push("location");
  } else if (/\bachet|\bvente\b|\bacheter\b/.test(texte)) {
    criteres.type = "vente";
    compris.push("achat");
  }

  /* Marque et modèle — uniquement ceux présents dans le stock. */
  const { marques, modeles } = await stockConnu();
  const marque = marques
    .filter((m) => texte.includes(m.toLowerCase()))
    .sort((a, b) => b.length - a.length)[0];
  if (marque) {
    criteres.marque = marque;
    compris.push(`marque ${marque}`);
    consommes.push(marque.toLowerCase());
    const modele = (modeles.get(marque.toLowerCase()) ?? [])
      .filter((mo) => texte.includes(mo.toLowerCase()))
      .sort((a, b) => b.length - a.length)[0];
    if (modele) {
      criteres.modele = modele;
      compris.push(`modèle ${modele}`);
      consommes.push(modele.toLowerCase());
    }
  }

  /* Catégorie. */
  for (const [mot, cat] of Object.entries(SYNONYMES_CATEGORIE)) {
    if (new RegExp(`\\b${mot}\\b`).test(texte) && CATEGORIES.includes(cat as typeof CATEGORIES[number])) {
      criteres.categorie = cat;
      compris.push(`catégorie ${cat}`);
      consommes.push(mot);
      break;
    }
  }

  /* Carburant, boîte, état, couleur, vendeur. */
  for (const [mot, valeur] of Object.entries(CARBURANTS)) {
    if (new RegExp(`\\b${mot}\\b`).test(texte)) {
      criteres.carburant = valeur;
      compris.push(`carburant ${valeur}`);
      consommes.push(mot);
      break;
    }
  }
  for (const [mot, valeur] of Object.entries(BOITES)) {
    if (new RegExp(`\\b${mot}\\b`).test(texte)) {
      criteres.boite = valeur;
      compris.push(`boîte ${valeur}`);
      consommes.push(mot);
      break;
    }
  }
  for (const [mot, valeur] of Object.entries(ETATS)) {
    if (new RegExp(`\\b${mot}\\b`).test(texte)) {
      criteres.etat = valeur;
      compris.push(`état ${valeur}`);
      consommes.push(mot);
      break;
    }
  }
  for (const couleur of COULEURS) {
    if (new RegExp(`\\b${couleur}e?s?\\b`).test(texte)) {
      criteres.couleur = couleur;
      compris.push(`couleur ${couleur}`);
      consommes.push(couleur);
      break;
    }
  }
  for (const [mot, valeur] of Object.entries(VENDEURS)) {
    if (new RegExp(`\\b${mot}\\b`).test(texte)) {
      criteres.vendeur = valeur;
      compris.push(`vendeur ${valeur}`);
      consommes.push(mot);
      break;
    }
  }

  /* Année — un nombre à 4 chiffres plausible. */
  const anneeCourante = new Date().getFullYear();
  const annee = texte.match(/\b(19[89]\d|20[0-4]\d)\b/);
  if (annee) {
    const valeur = Number(annee[1]);
    if (valeur <= anneeCourante + 2) {
      if (/\b(apr[eè]s|depuis|à partir de|mini|minimum)\b/.test(texte)) criteres.anneeMin = valeur;
      else if (/\b(avant|jusqu)\b/.test(texte)) criteres.anneeMax = valeur;
      else criteres.anneeMin = valeur;
      compris.push(`année ${valeur}`);
      consommes.push(annee[1]);
    }
  }

  /* Kilométrage — nombre associé à « km » / « kilomètre ». */
  const km = texte.match(/(\d[\d\s.,]*)\s*(k|000)?\s*(km|kilom[eè]tre?s?)/);
  if (km) {
    const chiffres = km[1].replace(/[\s.,]/g, "");
    let valeur = Number(chiffres);
    if (km[2] && km[2].toLowerCase() === "k") valeur *= 1000;
    if (Number.isFinite(valeur) && valeur > 0) {
      criteres.kmMax = valeur;
      compris.push(`${valeur.toLocaleString("fr-FR")} km maximum`);
      consommes.push(km[0]);
    }
  }

  /* Budget — nombre associé à une monnaie ou au mot budget/prix. */
  const budget = texte.match(
    /(?:budget|prix|maxi?mum|moins de|jusqu[' ]?[àa])\s*(?:de\s*)?(\d[\d\s.,]*)\s*(k)?|(\d[\d\s.,]*)\s*(k)?\s*(€|eur|euros?|fcfa|xof|xaf|usd|\$|dirhams?|dh)/,
  );
  if (budget) {
    const chiffres = (budget[1] ?? budget[3] ?? "").replace(/[\s.,]/g, "");
    const suffixe = budget[2] ?? budget[4];
    let valeur = Number(chiffres);
    if (suffixe && suffixe.toLowerCase() === "k") valeur *= 1000;
    if (Number.isFinite(valeur) && valeur > 0) {
      criteres.prixMax = valeur;
      compris.push(`budget maximum ${valeur.toLocaleString("fr-FR")}`);
      consommes.push(budget[0]);
    }
  }

  /* Puissance. */
  const puissance = texte.match(/(\d{2,4})\s*(cv|chevaux|ch)\b/);
  if (puissance) {
    criteres.puissanceMin = Number(puissance[1]);
    compris.push(`${puissance[1]} cv minimum`);
    consommes.push(puissance[0]);
  }

  /* Places et portes. */
  const places = texte.match(/(\d)\s*places?\b/);
  if (places) {
    criteres.places = Number(places[1]);
    compris.push(`${places[1]} places`);
    consommes.push(places[0]);
  }
  const portes = texte.match(/(\d)\s*portes?\b/);
  if (portes) {
    criteres.portes = Number(portes[1]);
    compris.push(`${portes[1]} portes`);
    consommes.push(portes[0]);
  }

  /* Ville — uniquement une ville réellement présente dans le stock. */
  const villes = await villesConnues();
  const ville = villes
    .filter((v) => texte.includes(v.toLowerCase()))
    .sort((a, b) => b.length - a.length)[0];
  if (ville) {
    criteres.ville = ville;
    compris.push(`ville ${ville}`);
    consommes.push(ville.toLowerCase());
  }

  /* Proximité — demandée explicitement. */
  if (/\b(pr[oè]s de (moi|chez moi)|proximit[eé]|autour de moi|à c[oô]t[eé])\b/.test(texte)) {
    criteres.proximite = true;
    compris.push("à proximité");
  }

  /* Reste non compris : les mots utiles qu'aucun critère n'a absorbés. */
  const ignores = new Set([
    "je", "cherche", "recherche", "une", "un", "des", "de", "du", "la", "le", "les",
    "voiture", "vehicule", "véhicule", "auto", "automobile", "trouve", "moi", "avec",
    "pour", "et", "ou", "a", "à", "en", "dans", "au", "aux", "mon", "ma", "je", "veux",
    "habite", "suis", "budget", "prix", "annee", "année", "km", "kilometre", "kilomètres",
    "maximum", "mini", "minimum", "moins", "plus", "environ", "svp", "s", "il", "te", "plait",
  ]);
  const resteTexte = consommes.reduce((acc, c) => acc.split(c).join(" "), texte);
  const nonCompris = resteTexte
    .split(/[^\p{L}\p{N}]+/u)
    .map((m) => m.trim())
    .filter((m) => m.length > 2 && !ignores.has(m) && !/^\d+$/.test(m))
    .filter((m, i, a) => a.indexOf(m) === i)
    .slice(0, 12);

  return { criteres, compris, nonCompris };
}

/** Nombre d'annonces publiées correspondant réellement aux critères lus. */
export async function compter(criteres: CriteresVehicule): Promise<number> {
  const conds = [eq(annonces.status, "publiee")];
  if (criteres.type) conds.push(eq(annonces.type, criteres.type));
  if (criteres.marque) conds.push(ilike(annonces.marque, `%${criteres.marque}%`));
  if (criteres.modele) conds.push(ilike(annonces.modele, `%${criteres.modele}%`));
  if (criteres.categorie) {
    conds.push(sql`${annonces.categorie}::text = ${criteres.categorie}`);
  }
  if (criteres.carburant) conds.push(sql`${annonces.carburant}::text = ${criteres.carburant}`);
  if (criteres.boite) conds.push(sql`${annonces.boite}::text = ${criteres.boite}`);
  if (criteres.etat) conds.push(sql`${annonces.etat}::text = ${criteres.etat}`);
  if (criteres.vendeur) conds.push(sql`${annonces.categorieAnnonce}::text = ${criteres.vendeur}`);
  if (criteres.couleur) conds.push(ilike(annonces.couleur, `%${criteres.couleur}%`));
  if (criteres.anneeMin !== undefined) conds.push(gte(annonces.annee, criteres.anneeMin));
  if (criteres.anneeMax !== undefined) conds.push(lte(annonces.annee, criteres.anneeMax));
  if (criteres.kmMax !== undefined) conds.push(lte(annonces.kilometrage, criteres.kmMax));
  if (criteres.prixMin !== undefined) conds.push(gte(annonces.prix, String(criteres.prixMin)));
  if (criteres.prixMax !== undefined) conds.push(lte(annonces.prix, String(criteres.prixMax)));
  if (criteres.puissanceMin !== undefined) conds.push(gte(annonces.puissanceCv, criteres.puissanceMin));
  if (criteres.places !== undefined) conds.push(eq(annonces.places, criteres.places));
  if (criteres.portes !== undefined) conds.push(eq(annonces.portes, criteres.portes));
  if (criteres.ville) conds.push(ilike(annonces.ville, `%${criteres.ville}%`));
  if (criteres.pays) conds.push(or(eq(annonces.pays, criteres.pays), isNull(annonces.pays))!);
  const [ligne] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(annonces)
    .where(and(...conds));
  return ligne?.n ?? 0;
}
