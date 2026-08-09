/**
 * Proximity Engine — Déclaration des services locaux (points 34 & 35).
 *
 * « Contrôle technique près de moi », « garage près de moi »… Chaque service
 * local déclare ici OÙ vivent ses prestataires et QUELLES colonnes portent la
 * ville, le pays et les coordonnées. Ajouter un service local ne demande donc
 * pas de réécrire la recherche.
 *
 * Règle : un service dont aucune table ne porte de prestataire est déclaré
 * `source: null`. Il ressort « Non configuré » — jamais « aucun résultat »,
 * qui laisserait croire que la zone est vide alors que rien n'est branché.
 */

export interface LocalSource {
  /** Table des prestataires. */
  table: string;
  /** Colonne du nom affiché. */
  nameColumn: string;
  cityColumn: string;
  countryColumn: string;
  /** Coordonnées ; null = distance non calculable, filtrage par ville. */
  latColumn: string | null;
  lngColumn: string | null;
  /** Condition SQL de visibilité (prestataire réellement publiable). */
  visibleWhere: string;
  ratingColumn?: string;
  ratingCountColumn?: string;
  phoneColumn?: string;
  addressColumn?: string;
}

export interface LocalService {
  /** Clé stable, utilisée par l'URL et le client. */
  code: string;
  label: string;
  /** Univers de rattachement — sert aussi à la matrice mini-plateforme. */
  univers: string;
  /** Page de l'univers, pour renvoyer le visiteur au bon endroit. */
  path: string;
  source: LocalSource | null;
  /** Pourquoi ce service n'a pas encore de source, quand c'est le cas. */
  missingReason?: string;
}

export const LOCAL_SERVICES: LocalService[] = [
  {
    code: "garage",
    label: "Garage",
    univers: "garage",
    path: "/garages",
    source: {
      table: "garages_publics",
      nameColumn: "name",
      cityColumn: "city",
      countryColumn: "country",
      latColumn: "latitude",
      lngColumn: "longitude",
      visibleWhere: "status = 'valide'",
      ratingColumn: "rating",
      ratingCountColumn: "review_count",
      phoneColumn: "phone",
      addressColumn: "address_line",
    },
  },
  {
    code: "comptable",
    label: "Comptable",
    univers: "comptabilite",
    path: "/comptables",
    source: {
      table: "accountant_profiles",
      nameColumn: "display_name",
      cityColumn: "city",
      countryColumn: "country_code",
      latColumn: "latitude",
      lngColumn: "longitude",
      visibleWhere: "verified = true AND published = true",
      ratingColumn: "rating_avg",
      ratingCountColumn: "rating_count",
    },
  },
  {
    code: "pieces",
    label: "Pièces automobiles",
    univers: "pieces",
    path: "/pieces",
    source: {
      table: "parts_shops",
      nameColumn: "nom",
      cityColumn: "ville",
      countryColumn: "country_code",
      // Les magasins de pièces n'ont pas de coordonnées en base : la recherche
      // reste possible par ville, mais aucune distance n'est affichée.
      latColumn: null,
      lngColumn: null,
      visibleWhere: "active = true",
      phoneColumn: "telephone",
      addressColumn: "adresse",
    },
  },
  {
    code: "controle_technique",
    label: "Contrôle technique",
    univers: "controle_technique",
    path: "/services/controle-technique",
    source: null,
    missingReason:
      "Aucun annuaire de centres de contrôle technique n'existe en base : le service est vendable mais pas encore localisable.",
  },
  {
    code: "depannage",
    label: "Dépannage",
    univers: "depannage",
    path: "/depannage",
    source: null,
    missingReason:
      "Les dépannages sont suivis par mission (`service_tracking`) ; aucun annuaire de dépanneurs localisés n'existe encore.",
  },
  {
    code: "livraison",
    label: "Livraison",
    univers: "livraison",
    path: "/livraison",
    source: null,
    missingReason:
      "La livraison est tarifée par zone (`delivery_pricing`) ; aucun transporteur localisé n'est référencé.",
  },
  {
    code: "vtc_taxi",
    label: "VTC / Taxi",
    univers: "vtc_taxi",
    path: "/vtc-taxi",
    source: null,
    missingReason: "Aucun annuaire de chauffeurs VTC/Taxi localisés n'existe en base.",
  },
  {
    code: "location",
    label: "Location de véhicule",
    univers: "location",
    path: "/louer",
    source: null,
    missingReason:
      "Les véhicules de location vivent dans `annonces` (ville de l'annonce) ; aucune agence localisée n'est référencée.",
  },
];

export function findService(code: string): LocalService | undefined {
  return LOCAL_SERVICES.find((s) => s.code === code);
}
