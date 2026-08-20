/**
 * Point 94 — distinguer « produits » et « véhicules ».
 *
 * Deux tuyaux, jamais un seul :
 *
 *   PRODUITS / PIÈCES → Search + données structurées Product + Merchant Center
 *                       lorsque réellement éligible + Images/Lens.
 *   VÉHICULES         → SEO d'annonces + pages indexables + données structurées
 *                       adaptées + images + contenu local + GEO/Intelligence.
 *
 * Les véhicules motorisés sont exclus des fiches gratuites Merchant Center :
 * ce module refuse donc de les y pousser, et l'écrit noir sur blanc au lieu de
 * laisser croire à une visibilité qui n'existe pas.
 */

export type Pipeline = "produit" | "vehicule";

/** Catégories dont Google exclut les fiches gratuites Merchant Center. */
export const CATEGORIES_EXCLUES_MERCHANT = [
  "vehicule",
  "voiture",
  "moto",
  "scooter",
  "utilitaire",
  "camion",
  "quad",
  "jetski",
  "bateau",
] as const;

/** Attributs exigés pour une fiche produit exploitable (point 95). */
export const ATTRIBUTS_REQUIS = [
  "titre",
  "description",
  "url",
  "image",
  "prix",
  "devise",
  "disponibilite",
  "etat",
] as const;

/** Attributs fortement recommandés : leur absence n'exclut pas, elle est signalée. */
export const ATTRIBUTS_RECOMMANDES = ["marque", "gtin_ou_mpn", "categorie"] as const;

export interface ProduitCandidat {
  source: string;
  sourceId: number;
  titre: string;
  description: string;
  url: string;
  imageUrl: string | null;
  prix: string | null;
  devise: string;
  disponibilite: "en_stock" | "sur_commande" | "indisponible";
  etat: string;
  marque: string | null;
  gtin: string | null;
  mpn: string | null;
  pays: string;
  langue: string;
  categorie: string | null;
}

export interface Verdict {
  eligible: boolean;
  motif: string;
  manquants: string[];
  recommandesManquants: string[];
}

/**
 * `pipelineDe` répond à une seule question : cette chose se vend-elle comme un
 * produit de catalogue, ou s'annonce-t-elle comme un véhicule ?
 */
export function pipelineDe(source: string, categorie?: string | null): Pipeline {
  if (source === "annonce" || source === "vehicule" || source === "location") return "vehicule";
  const c = (categorie ?? "").toLowerCase();
  if (CATEGORIES_EXCLUES_MERCHANT.some((mot) => c.includes(mot))) return "vehicule";
  return "produit";
}

/**
 * Éligibilité aux fiches gratuites. Un produit n'est jamais déclaré éligible
 * « par défaut » : chaque attribut manquant est nommé.
 */
export function evaluerEligibilite(p: ProduitCandidat): Verdict {
  const manquants: string[] = [];
  if (!p.titre.trim()) manquants.push("titre");
  if (!p.description.trim() || p.description.trim().length < 30)
    manquants.push("description (30 caractères minimum)");
  if (!p.url.trim()) manquants.push("url publique");
  if (!p.imageUrl) manquants.push("image");
  if (!p.prix || Number(p.prix) <= 0) manquants.push("prix");
  if (!p.devise.trim()) manquants.push("devise");
  if (p.disponibilite === "indisponible") manquants.push("disponibilité (aucun stock)");
  if (!p.etat.trim()) manquants.push("état");

  const recommandesManquants: string[] = [];
  if (!p.marque) recommandesManquants.push("marque");
  if (!p.gtin && !p.mpn) recommandesManquants.push("GTIN ou MPN");
  if (!p.categorie) recommandesManquants.push("catégorie");

  if (pipelineDe(p.source, p.categorie) === "vehicule") {
    return {
      eligible: false,
      motif:
        "Véhicule motorisé : exclu des fiches gratuites Merchant Center. Sa visibilité passe par le tuyau annonces (page indexable, données structurées de véhicule, images, contenu local, GEO/Intelligence) — pas par un catalogue de produits.",
      manquants,
      recommandesManquants,
    };
  }

  if (manquants.length > 0) {
    return {
      eligible: false,
      motif: `Fiche incomplète : ${manquants.join(", ")}. Google n'accepte pas un produit sans ces attributs.`,
      manquants,
      recommandesManquants,
    };
  }

  return {
    eligible: true,
    motif:
      recommandesManquants.length > 0
        ? `Attributs obligatoires présents. À renforcer : ${recommandesManquants.join(", ")}.`
        : "Attributs obligatoires et recommandés présents.",
    manquants,
    recommandesManquants,
  };
}

/** Empreinte des champs commerciaux : sert à ne resynchroniser que le réel changement. */
export function empreinte(p: ProduitCandidat): string {
  const brut = [
    p.titre,
    p.description,
    p.url,
    p.imageUrl ?? "",
    p.prix ?? "",
    p.devise,
    p.disponibilite,
    p.etat,
    p.marque ?? "",
    p.gtin ?? "",
    p.mpn ?? "",
  ].join("|");
  let h = 0;
  for (let i = 0; i < brut.length; i += 1) {
    h = (h * 31 + brut.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}
