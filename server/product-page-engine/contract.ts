/**
 * Product Page Engine — moteur de configuration de la fiche produit
 * officielle MKA.P-MS (Vehicule.tsx).
 *
 * Demande Direction (26/10) : « une structure commune, capable de s'adapter
 * automatiquement à chaque type de véhicule et à chaque type de vente, comme
 * une fiche produit Amazon qui adapte son contenu selon le produit ». Ce
 * moteur ne remplace ni le parcours de dépôt (Vendre.tsx, inchangé jusqu'à
 * l'estimation) ni la fiche produit elle-même (Vehicule.tsx, un seul
 * fichier, jamais un second portail) : il calcule UNE configuration — quels
 * blocs, informations, livraison, financement, garanties afficher — à
 * partir du type de véhicule, du type de vente et du statut de l'annonce.
 *
 * Trois types reconnus aujourd'hui, l'union est volontairement extensible
 * (règle Direction : « prévoir une architecture extensible pour ajouter plus
 * tard d'autres types de véhicules et de ventes ») :
 *  - "vente_normale" : annonce ordinaire (particulier/pro/officielle déjà
 *    en stock) — comportement strictement inchangé, aucun bloc « sur
 *    commande » ni fournisseur.
 *  - "sur_commande" : annonce liée à l'Order Engine (`order_listings`,
 *    `ownership = "partenaire"`) — réutilise les projections déjà
 *    existantes et strictement non confidentielles d'Order Engine
 *    (`obtenirLabelPublicParAnnonce`, `obtenirDetailsPublicSurCommande`),
 *    jamais une nouvelle lecture de `supplier_profiles` ni du prix
 *    fournisseur : la confidentialité stricte déjà en place n'est pas
 *    réouverte ici.
 *  - "constructeur_mkapms" : préparation pour les futurs véhicules
 *    fabriqués directement par MKA.P-MS (`ownership = "plateforme"` +
 *    `estConstructeurMkapms = true`, les deux nouveaux côté schéma,
 *    toujours faux par défaut — aucune annonce existante n'est concernée).
 *    Aucune fonction de fabrication n'est construite ici, seulement les
 *    champs d'affichage (fiche constructeur, garanties, disponibilité,
 *    entretien/services) pour que l'activation future ne demande qu'un
 *    réglage de données, jamais une réécriture du moteur.
 *
 * Le type « location » (annonce.type === "location") n'est volontairement
 * pas différencié ici (demande Direction : « Si on choisit véhicule,
 * location, ça part dans location, ok. Après on verra ça plus tard. ») :
 * le champ `venteOuLocation` est renvoyé pour que l'appelant sache, mais
 * aucun bloc spécifique à la location n'est ajouté par ce lot.
 */
export const PRODUCT_PAGE_TYPES = ["vente_normale", "sur_commande", "constructeur_mkapms"] as const;
export type ProductPageType = (typeof PRODUCT_PAGE_TYPES)[number];

export interface ProductPageBlockSurCommande {
  /** "disponible_sur_commande" | "disponible_sur_visite" (Order Engine, jamais un 3e statut à synchroniser). */
  label: string;
  /** Localisation générale (ville/pays), jamais l'adresse exacte de remise. */
  localisation: string | null;
  preparationDetails: string | null;
  delaiPreparationJours: number | null;
  delaiLivraisonJours: number | null;
  delaiRetraitJours: number | null;
  fraisPreparation: string | null;
  fraisLivraison: string | null;
  fraisRetrait: string | null;
  /** true dès qu'un des trois frais ci-dessus est renseigné, pour afficher "sur devis" seulement quand c'est honnête. */
  fraisSurDevis: boolean;
  zonesLivraison: string | null;
  conditionsRemise: string | null;
  documentsRequis: string | null;
  acompte: string | null;
  conditionsRemboursement: string | null;
  conditionsAnnulation: string | null;
}

export interface ProductPageBlockConstructeur {
  marque: "MKA.P-MS";
  ficheConstructeur: string | null;
  garanties: string[];
  disponibilite: string | null;
  entretienServices: string | null;
}

export interface ProductPageConfig {
  annonceId: number;
  type: ProductPageType;
  venteOuLocation: "vente" | "location";
  /** Toujours dérivé, jamais une opinion séparée : true ssi type === "sur_commande". */
  afficherBlocSurCommande: boolean;
  /** Toujours dérivé : true ssi type === "constructeur_mkapms". */
  afficherBlocConstructeur: boolean;
  /**
   * Financement / paiement en plusieurs fois : jamais affiché pour un
   * véhicule sur commande tant qu'un employé ne l'a pas explicitement
   * activé (`order_listings.installment_payment_allowed`) — toujours vrai
   * pour vente_normale et constructeur_mkapms (stock déjà possédé).
   */
  afficherFinancement: boolean;
  afficherInformationsFournisseur: boolean;
  surCommande: ProductPageBlockSurCommande | null;
  constructeur: ProductPageBlockConstructeur | null;
}

export const PRODUCT_PAGE_ENGINE_META = {
  name: "product-page-engine" as const,
  label: "Product Page Engine" as const,
  contract: "server/product-page-engine/index.ts",
  planReference: "Demande Direction 26/10 — fiche produit adaptative MKA.P-MS",
};
