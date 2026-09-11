/**
 * Périmètre réel de chaque moteur.
 *
 * Fichier GÉNÉRÉ par scripts/gen-moteurs.mjs depuis le code du dépôt.
 * Ne pas éditer à la main : `npm run gen:moteurs` le régénère, et la
 * construction échoue s'il est périmé.
 *
 * Chaque moteur y trouve tout ce qui est à lui — dépendances prouvées,
 * dépendants, événements publiés et consommés, boutons et leur emplacement,
 * écrans, textes, procédures, tables, accès — et la liste nominative de ce
 * qui lui manque. Le registre central lit ce fichier : on interroge le moteur,
 * pas l'écran.
 */

export type GenreManque =
  | "bouton_sans_action"
  | "bouton_non_declare"
  | "bouton_declare_absent_ecran"
  | "destination_inconnue"
  | "ecran_sans_contenu"
  | "evenement_hors_catalogue"
  | "evenement_sans_abonne"
  | "source_emission_non_reconnue"
  | "emission_dynamique"
  | "dependance_non_declaree"
  | "dependance_sans_preuve"
  | "dependance_inconnue"
  | "sans_logique_serveur"
  | "sans_battement"
  | "sans_ecran"
  | "route_sans_ecran";

export interface ManqueMoteur {
  readonly genre: GenreManque;
  readonly detail: string;
}

export interface BoutonDuMoteur {
  readonly code: string;
  readonly libelle: string;
  readonly genre: string;
  /** Route de l'écran où vit le bouton. */
  readonly ecran: string;
  /** Fichier et ligne exacts ; vides si le bouton est déclaré mais absent. */
  readonly fichier: string;
  readonly ligne: number;
}

export interface EcranDuMoteur {
  readonly fichier: string;
  readonly routes: readonly string[];
  readonly cliquables: number;
  /** Cliquables passés par le Moteur de boutons. */
  readonly parMoteur: number;
  readonly sansAction: number;
  readonly textes: number;
  readonly mots: number;
}

export interface PerimetreMoteur {
  readonly moteur: string;
  readonly label: string;
  readonly categorie: string;
  readonly etatDeclare: string;
  readonly dossiers: readonly string[];
  readonly routeurs: readonly string[];
  readonly fichiersServeur: number;
  readonly dependancesDeclarees: readonly string[];
  readonly dependancesDetectees: readonly string[];
  /** Déclarées ∪ détectées : c'est cette liste que le registre applique. */
  readonly dependances: readonly string[];
  /**
   * Sous-ensemble de dependances dont TOUTES les preuves détectées ne sont
   * qu'une intégration technique transversale (session/rôle, audit, contrat
   * public d'un OS) — jamais une dépendance métier. Exclu du graphe de
   * cycles métier par server/engine-registry/dependencies.ts, mais toujours
   * un couplage réel pour l'impact en cascade. Preuves plafonnées à 3 par
   * dépendance (voir preuve() plus haut) : une 4e preuve métier non
   * capturée resterait invisible ici, comme pour dependance_sans_preuve.
   */
  readonly integrationsTechniques: readonly string[];
  readonly preuvesDependances: Readonly<Record<string, readonly string[]>>;
  readonly dependants: readonly string[];
  readonly evenementsPublies: readonly string[];
  readonly evenementsConsommes: readonly string[];
  readonly abonnements: readonly { readonly eventType: string; readonly handler: string }[];
  readonly sourcesEmission: readonly string[];
  readonly boutons: readonly BoutonDuMoteur[];
  readonly routes: readonly string[];
  readonly ecrans: readonly EcranDuMoteur[];
  /** Écrans d'autres moteurs où ce moteur est réellement utilisé via un composant partagé. */
  readonly ecransHotes: readonly { readonly fichier: string; readonly route: string; readonly composants: readonly string[] }[];
  readonly procedures: readonly string[];
  readonly tables: readonly string[];
  readonly acces: readonly string[];
  readonly textes: number;
  readonly mots: number;
  readonly battement: "code" | "pont_os" | "contrat" | "sonde" | "aucun";
  readonly manques: readonly ManqueMoteur[];
}

export const MOTEURS_TOTAL = 88;
export const MANQUES_TOTAL = 692;
export const MANQUES_PAR_GENRE: Readonly<Record<string, number>> = {
  "destination_inconnue": 56,
  "ecran_sans_contenu": 355,
  "bouton_sans_action": 198,
  "dependance_non_declaree": 6,
  "sans_logique_serveur": 12,
  "sans_ecran": 4,
  "dependance_sans_preuve": 57,
  "bouton_declare_absent_ecran": 3,
  "emission_dynamique": 1
};

/** Routes client qu'aucun moteur ne revendique. */
export const ROUTES_SANS_MOTEUR: readonly string[] = [
  "/livraison-vehicule"
];

/** Routeurs tRPC montés qu'aucun moteur ne revendique. */
export const ROUTEURS_SANS_MOTEUR: readonly string[] = [];

/** Fichiers serveur qu'aucun moteur ne possède (hors racine technique). */
export const FICHIERS_SANS_MOTEUR: readonly string[] = [];

export const MOTEURS: readonly PerimetreMoteur[] = [
  {
    "moteur": "account_routing",
    "label": "Account Routing Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "account-routing"
    ],
    "routeurs": [
      "accountRouting"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "core",
      "identity",
      "permission"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "permission"
    ],
    "dependances": [
      "core",
      "identity",
      "permission"
    ],
    "integrationsTechniques": [
      "identity",
      "permission"
    ],
    "preuvesDependances": {
      "core": [
        "account-routing/index.ts importe db.ts",
        "account-routing/index.ts importe schema.ts",
        "account-routing/index.ts importe trpc.ts"
      ],
      "identity": [
        "account-routing/index.ts exige une session Identity (procédure protégée)"
      ],
      "permission": [
        "account-routing/index.ts filtre par rôle (procédure pro/admin/direction/PDG)"
      ]
    },
    "dependants": [
      "identity"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/tableau-de-bord",
      "/univers"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/TableauBordParticulier.tsx",
        "routes": [
          "/tableau-de-bord"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 20,
        "mots": 55
      },
      {
        "fichier": "client/src/pages/Univers.tsx",
        "routes": [
          "/univers"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 32
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/MonEspace.tsx",
        "route": "/mon-espace",
        "composants": [
          "trpc.accountRouting"
        ]
      }
    ],
    "procedures": [
      "forUser",
      "health",
      "mine",
      "universes"
    ],
    "tables": [],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 24,
    "mots": 87,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/profil client/src/pages/TableauBordParticulier.tsx:36"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/Univers.tsx (4 texte(s))"
      }
    ]
  },
  {
    "moteur": "accounting_internal",
    "label": "Internal Accounting Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "accounting-internal"
    ],
    "routeurs": [
      "accountingInternal"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "comptabilite",
      "core",
      "payment"
    ],
    "dependancesDetectees": [
      "comptabilite",
      "core",
      "payment"
    ],
    "dependances": [
      "comptabilite",
      "core",
      "payment"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "comptabilite": [
        "accounting-internal/service.ts importe modules/comptabilite.ts"
      ],
      "core": [
        "accounting-internal/index.ts importe trpc.ts",
        "accounting-internal/service.ts importe db.ts",
        "accounting-internal/service.ts importe schema.ts"
      ],
      "payment": [
        "accounting-internal/service.ts importe payment-engine/schema.ts"
      ]
    },
    "dependants": [
      "finance"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/compta-dirigeant"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/ComptaDirigeant.tsx",
        "routes": [
          "/compta-dirigeant"
        ],
        "cliquables": 24,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 145,
        "mots": 318
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "health",
      "rapprochements",
      "reconcile",
      "unreconciled"
    ],
    "tables": [
      "compta_rapprochements"
    ],
    "acces": [
      "admin"
    ],
    "textes": 145,
    "mots": 318,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "accounting_marketplace",
    "label": "Accounting Marketplace Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "accounting-marketplace"
    ],
    "routeurs": [
      "accountingMarketplace",
      "cabinets"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "country",
      "identity"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "identity"
    ],
    "dependances": [
      "core",
      "country",
      "identity"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "accounting-marketplace/index.ts importe trpc.ts",
        "accounting-marketplace/service.ts importe db.ts"
      ],
      "country": [
        "accounting-marketplace/service.ts importe country-os/index.ts"
      ],
      "identity": [
        "accounting-marketplace/index.ts exige une session Identity (procédure protégée)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/comptables"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Comptables.tsx",
        "routes": [
          "/comptables"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 21,
        "mots": 53
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "health",
      "myProfile",
      "myRequests",
      "requestAccountant",
      "review",
      "saveProfile",
      "search"
    ],
    "tables": [
      "accountant_profiles",
      "accountant_requests"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 21,
    "mots": 53,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "achat",
    "label": "Univers Achat Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "routers/annonces.ts",
      "routers/favoris.ts",
      "routers/reservations.ts",
      "routers/devis.ts"
    ],
    "routeurs": [
      "annonces",
      "favoris",
      "reservations",
      "devis"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "audit",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "event_bus",
      "livraison_vehicule",
      "messaging",
      "notification",
      "payment",
      "permission",
      "redirection",
      "risque_import",
      "search",
      "seo",
      "smart",
      "visibility"
    ],
    "dependancesDetectees": [
      "audit",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "event_bus",
      "identity",
      "livraison_vehicule",
      "messaging",
      "notification",
      "payment",
      "permission",
      "redirection",
      "risque_import",
      "search",
      "seo",
      "smart",
      "visibility"
    ],
    "dependances": [
      "audit",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "event_bus",
      "identity",
      "livraison_vehicule",
      "messaging",
      "notification",
      "payment",
      "permission",
      "redirection",
      "risque_import",
      "search",
      "seo",
      "smart",
      "visibility"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "audit": [
        "routers/annonces.ts importe audit.ts"
      ],
      "avis_reputation": [
        "client/src/pages/Vehicule.tsx appelle trpc.reviews"
      ],
      "core": [
        "routers/annonces.ts importe trpc.ts",
        "routers/annonces.ts importe db.ts",
        "routers/annonces.ts importe schema.ts"
      ],
      "country": [
        "routers/devis.ts importe country-os/index.ts",
        "routers/devis.ts lit la règle pays",
        "client/src/pages/Vehicule.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "estimation": [
        "client/src/pages/Vehicule.tsx embarque components/CoutTotalEstime.tsx (trpc.estimation)"
      ],
      "event_bus": [
        "routers/annonces.ts importe event-bus/service.ts",
        "routers/annonces.ts publie des événements"
      ],
      "identity": [
        "routers/annonces.ts importe identity-os/identite-officielle.ts"
      ],
      "livraison_vehicule": [
        "routers/reservations.ts importe vehicle-delivery/service.ts"
      ],
      "messaging": [
        "client/src/pages/Vehicule.tsx appelle trpc.messages"
      ],
      "notification": [
        "routers/annonces.ts importe services/email.ts",
        "routers/annonces.ts envoie un email",
        "routers/devis.ts importe notification-os/triggers.ts"
      ],
      "payment": [
        "routers/annonces.ts importe payment-engine/checkout.ts",
        "routers/devis.ts importe payment-engine/checkout.ts",
        "routers/reservations.ts importe lib/stripe.ts"
      ],
      "permission": [
        "routers/annonces.ts importe permission-engine/intelligence.ts"
      ],
      "redirection": [
        "client/src/pages/VoitureOccasion.tsx embarque lib/redirect.tsx (trpc.redirectionEngine)"
      ],
      "risque_import": [
        "routers/reservations.ts importe import-risk/service.ts",
        "client/src/pages/Vehicule.tsx embarque components/AlerteRisqueImport.tsx (trpc.risqueImport)"
      ],
      "search": [
        "routers/annonces.ts importe search-os/index.ts"
      ],
      "seo": [
        "publie annonce.publiee, consommé par seo",
        "publie annonce.modifiee, consommé par seo"
      ],
      "smart": [
        "routers/annonces.ts importe smart-engine/services/search-analytics.ts",
        "routers/annonces.ts importe smart-engine/services/user-memory.ts",
        "routers/annonces.ts importe smart-engine/services/learning.ts"
      ],
      "visibility": [
        "routers/annonces.ts importe visibility-os/index.ts"
      ]
    },
    "dependants": [
      "achat_officiel",
      "achat_particulier",
      "achat_pro",
      "atelier",
      "garage",
      "location",
      "location_particulier",
      "location_pro",
      "payment",
      "vente",
      "vente_particulier",
      "vo_engine"
    ],
    "evenementsPublies": [
      "annonce.modifiee",
      "annonce.publiee"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "annonces"
    ],
    "boutons": [],
    "routes": [
      "/acheter",
      "/acheter/camions",
      "/acheter/camions-engins",
      "/acheter/historique-vehicule",
      "/acheter/minibus",
      "/acheter/moto",
      "/acheter/promotions",
      "/acheter/utilitaires",
      "/acheter/vtc-taxi",
      "/comparateur",
      "/devis",
      "/favoris",
      "/moto-occasion",
      "/superadmin/admin-fraude",
      "/superadmin/admin-moderation-annonces",
      "/vehicule/:id",
      "/voiture-occasion"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Comparateur.tsx",
        "routes": [
          "/comparateur"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 34,
        "mots": 89
      },
      {
        "fichier": "client/src/pages/Devis.tsx",
        "routes": [
          "/devis"
        ],
        "cliquables": 27,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 203,
        "mots": 706
      },
      {
        "fichier": "client/src/pages/Favoris.tsx",
        "routes": [
          "/favoris"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 26,
        "mots": 77
      },
      {
        "fichier": "client/src/pages/HistoriqueVehiculeVente.tsx",
        "routes": [
          "/acheter/historique-vehicule"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 16,
        "mots": 43
      },
      {
        "fichier": "client/src/pages/MotoOccasion.tsx",
        "routes": [
          "/moto-occasion"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 37,
        "mots": 79
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "routes": [
          "/vehicule/:id"
        ],
        "cliquables": 146,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 608,
        "mots": 2455
      },
      {
        "fichier": "client/src/pages/VenteCamions.tsx",
        "routes": [
          "/acheter/camions"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 75,
        "mots": 145
      },
      {
        "fichier": "client/src/pages/VenteCamionsEngins.tsx",
        "routes": [
          "/acheter/camions-engins"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 79,
        "mots": 197
      },
      {
        "fichier": "client/src/pages/VenteGenerale.tsx",
        "routes": [
          "/acheter"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 80,
        "mots": 287
      },
      {
        "fichier": "client/src/pages/VenteMinibus.tsx",
        "routes": [
          "/acheter/minibus"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 41,
        "mots": 101
      },
      {
        "fichier": "client/src/pages/VenteMoto.tsx",
        "routes": [
          "/acheter/moto"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 59,
        "mots": 138
      },
      {
        "fichier": "client/src/pages/VentePromotions.tsx",
        "routes": [
          "/acheter/promotions"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 33,
        "mots": 88
      },
      {
        "fichier": "client/src/pages/VenteUtilitaires.tsx",
        "routes": [
          "/acheter/utilitaires"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 50,
        "mots": 116
      },
      {
        "fichier": "client/src/pages/VenteVTC.tsx",
        "routes": [
          "/acheter/vtc-taxi"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 48,
        "mots": 111
      },
      {
        "fichier": "client/src/pages/VoitureOccasion.tsx",
        "routes": [
          "/voiture-occasion"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 21,
        "mots": 76
      },
      {
        "fichier": "client/src/pages/superadmin/AdminFraude.tsx",
        "routes": [
          "/superadmin/admin-fraude"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 5,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/superadmin/AdminModerationAnnonces.tsx",
        "routes": [
          "/superadmin/admin-moderation-annonces"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 4,
        "textes": 9,
        "mots": 32
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/LocationParticulier.tsx",
        "route": "/louer/particulier",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/LocationPro.tsx",
        "route": "/louer/pro",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/ProduitVtcTaxi.tsx",
        "route": "/louer/vtc-taxi/vehicule/:id",
        "composants": [
          "components/ReserverLocationButton.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/ProduitParticulier.tsx",
        "route": "/louer/particulier/vehicule/:id",
        "composants": [
          "components/ReserverLocationButton.tsx",
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/ProduitLocation.tsx",
        "route": "/louer/pro/vehicule/:id",
        "composants": [
          "components/ReserverLocationButton.tsx",
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/ProduitLocation.tsx",
        "route": "/louer/utilitaires/vehicule/:id",
        "composants": [
          "components/ReserverLocationButton.tsx",
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/ProduitLocation.tsx",
        "route": "/louer/camions/vehicule/:id",
        "composants": [
          "components/ReserverLocationButton.tsx",
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/ProduitLocation.tsx",
        "route": "/louer/minibus/vehicule/:id",
        "composants": [
          "components/ReserverLocationButton.tsx",
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/LocationMKAPMS.tsx",
        "route": "/louer/mkapms",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/ProduitLocation.tsx",
        "route": "/louer/mkapms/vehicule/:id",
        "composants": [
          "components/ReserverLocationButton.tsx",
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/ListeAttente.tsx",
        "route": "/louer/liste-attente",
        "composants": [
          "components/ReserverLocationButton.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/PaiementVehicule.tsx",
        "route": "/paiement-vehicule/:id",
        "composants": [
          "trpc.annonces",
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/VehiculesCertifies.tsx",
        "route": "/louer/certifies",
        "composants": [
          "components/ReserverLocationButton.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/VenteParticulier.tsx",
        "route": "/acheter/particulier",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/VentePro.tsx",
        "route": "/acheter/professionnel",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/VenteMKAPMS.tsx",
        "route": "/acheter/mkapms-officiel",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/DepotAnnonce.tsx",
        "route": "/acheter/depot-annonce",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/MesAnnonces.tsx",
        "route": "/acheter/mes-annonces",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/MesAnnonces.tsx",
        "route": "/vente/mes-annonces",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/Vendre.tsx",
        "route": "/vendre",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/Garages.tsx",
        "route": "/garages",
        "composants": [
          "trpc.devis"
        ]
      },
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.annonces",
          "trpc.favoris",
          "trpc.reservations",
          "trpc.devis"
        ]
      },
      {
        "fichier": "client/src/pages/RechercheLocale.tsx",
        "route": "/:pays/:ville/:modele?",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/garage/CarrosserieGarage.tsx",
        "route": "/garage/carrosserie-garage",
        "composants": [
          "trpc.devis"
        ]
      },
      {
        "fichier": "client/src/pages/garage/DemandeDevis.tsx",
        "route": "/garage/demande-devis",
        "composants": [
          "trpc.devis"
        ]
      },
      {
        "fichier": "client/src/pages/garage/PanierPieces.tsx",
        "route": "/garage/panier-pieces",
        "composants": [
          "trpc.devis"
        ]
      },
      {
        "fichier": "client/src/pages/garage/PriseRendezVous.tsx",
        "route": "/garage/prise-rendez-vous",
        "composants": [
          "trpc.devis"
        ]
      },
      {
        "fichier": "client/src/pages/garage/ReservationAtelier.tsx",
        "route": "/garage/reservation-atelier",
        "composants": [
          "trpc.devis"
        ]
      },
      {
        "fichier": "client/src/pages/garage/ValidationClient.tsx",
        "route": "/garage/validation-client",
        "composants": [
          "trpc.devis"
        ]
      }
    ],
    "procedures": [
      "boostAnnonce",
      "buyNow",
      "create",
      "detail",
      "estimate",
      "facettes",
      "get",
      "incrementView",
      "list",
      "lookupPlate",
      "mine",
      "montantAPayer",
      "myList",
      "payCaution",
      "payerDevis",
      "prolong",
      "quotaStatus",
      "remove",
      "requestLocation",
      "toggle",
      "update",
      "updateStatus"
    ],
    "tables": [],
    "acces": [
      "connecte",
      "public"
    ],
    "textes": 1424,
    "mots": 4748,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Filtrer » client/src/pages/Devis.tsx:938"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir plus de garages » client/src/pages/Devis.tsx:986"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Télécharger le rapport PDF » client/src/pages/HistoriqueVehiculeVente.tsx:54"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente-moto client/src/pages/MotoOccasion.tsx:107"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente-moto client/src/pages/MotoOccasion.tsx:115"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/services client/src/pages/Vehicule.tsx:924"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/Vehicule.tsx:1819"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/VenteCamions.tsx:206"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/messages client/src/pages/VenteGenerale.tsx:449"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/VenteUtilitaires.tsx:181"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/VenteVTC.tsx:186"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminFraude.tsx:26"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Inspecter » client/src/pages/superadmin/AdminFraude.tsx:46"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Bloquer » client/src/pages/superadmin/AdminFraude.tsx:47"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminModerationAnnonces.tsx:27"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Approuver » client/src/pages/superadmin/AdminModerationAnnonces.tsx:52"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir » client/src/pages/superadmin/AdminModerationAnnonces.tsx:53"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Refuser » client/src/pages/superadmin/AdminModerationAnnonces.tsx:54"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "identity — routers/annonces.ts importe identity-os/identite-officielle.ts"
      }
    ]
  },
  {
    "moteur": "achat_officiel",
    "label": "Achat Officiel Engine",
    "categorie": "sous_section",
    "etatDeclare": "staging",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependancesDetectees": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependances": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/Vehicule.tsx appelle trpc.annonces",
        "client/src/pages/Vehicule.tsx appelle trpc.favoris",
        "client/src/pages/Vehicule.tsx appelle trpc.reservations"
      ],
      "avis_reputation": [
        "client/src/pages/Vehicule.tsx appelle trpc.reviews"
      ],
      "core": [
        "client/src/pages/Vehicule.tsx appelle trpc.meta"
      ],
      "country": [
        "client/src/pages/Vehicule.tsx embarque lib/currency.tsx (trpc.currency)",
        "client/src/pages/VenteMKAPMS.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "estimation": [
        "client/src/pages/Vehicule.tsx embarque components/CoutTotalEstime.tsx (trpc.estimation)"
      ],
      "messaging": [
        "client/src/pages/Vehicule.tsx appelle trpc.messages"
      ],
      "risque_import": [
        "client/src/pages/Vehicule.tsx embarque components/AlerteRisqueImport.tsx (trpc.risqueImport)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/acheter/mkapms-officiel",
      "/acheter/mkapms-officiel/vehicule/:id"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "routes": [
          "/acheter/mkapms-officiel/vehicule/:id"
        ],
        "cliquables": 146,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 608,
        "mots": 2455
      },
      {
        "fichier": "client/src/pages/VenteMKAPMS.tsx",
        "routes": [
          "/acheter/mkapms-officiel"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 52,
        "mots": 123
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 660,
    "mots": 2578,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/services client/src/pages/Vehicule.tsx:924"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/Vehicule.tsx:1819"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/VenteMKAPMS.tsx:209"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "achat_particulier",
    "label": "Achat Particulier Engine",
    "categorie": "sous_section",
    "etatDeclare": "staging",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependancesDetectees": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependances": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/Vehicule.tsx appelle trpc.annonces",
        "client/src/pages/Vehicule.tsx appelle trpc.favoris",
        "client/src/pages/Vehicule.tsx appelle trpc.reservations"
      ],
      "avis_reputation": [
        "client/src/pages/Vehicule.tsx appelle trpc.reviews"
      ],
      "core": [
        "client/src/pages/Vehicule.tsx appelle trpc.meta"
      ],
      "country": [
        "client/src/pages/Vehicule.tsx embarque lib/currency.tsx (trpc.currency)",
        "client/src/pages/VenteParticulier.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "estimation": [
        "client/src/pages/Vehicule.tsx embarque components/CoutTotalEstime.tsx (trpc.estimation)"
      ],
      "messaging": [
        "client/src/pages/Vehicule.tsx appelle trpc.messages"
      ],
      "risque_import": [
        "client/src/pages/Vehicule.tsx embarque components/AlerteRisqueImport.tsx (trpc.risqueImport)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/acheter/particulier",
      "/acheter/particulier/vehicule/:id"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "routes": [
          "/acheter/particulier/vehicule/:id"
        ],
        "cliquables": 146,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 608,
        "mots": 2455
      },
      {
        "fichier": "client/src/pages/VenteParticulier.tsx",
        "routes": [
          "/acheter/particulier"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 60,
        "mots": 126
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 668,
    "mots": 2581,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/services client/src/pages/Vehicule.tsx:924"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/Vehicule.tsx:1819"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/VenteParticulier.tsx:225"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "achat_pro",
    "label": "Achat Professionnel Engine",
    "categorie": "sous_section",
    "etatDeclare": "staging",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependancesDetectees": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependances": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/Vehicule.tsx appelle trpc.annonces",
        "client/src/pages/Vehicule.tsx appelle trpc.favoris",
        "client/src/pages/Vehicule.tsx appelle trpc.reservations"
      ],
      "avis_reputation": [
        "client/src/pages/Vehicule.tsx appelle trpc.reviews"
      ],
      "core": [
        "client/src/pages/Vehicule.tsx appelle trpc.meta"
      ],
      "country": [
        "client/src/pages/Vehicule.tsx embarque lib/currency.tsx (trpc.currency)",
        "client/src/pages/VentePro.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "estimation": [
        "client/src/pages/Vehicule.tsx embarque components/CoutTotalEstime.tsx (trpc.estimation)"
      ],
      "messaging": [
        "client/src/pages/Vehicule.tsx appelle trpc.messages"
      ],
      "risque_import": [
        "client/src/pages/Vehicule.tsx embarque components/AlerteRisqueImport.tsx (trpc.risqueImport)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/acheter/professionnel",
      "/acheter/professionnel/vehicule/:id"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "routes": [
          "/acheter/professionnel/vehicule/:id"
        ],
        "cliquables": 146,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 608,
        "mots": 2455
      },
      {
        "fichier": "client/src/pages/VentePro.tsx",
        "routes": [
          "/acheter/professionnel"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 54,
        "mots": 111
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 662,
    "mots": 2566,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/services client/src/pages/Vehicule.tsx:924"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/Vehicule.tsx:1819"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/VentePro.tsx:212"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "activation_audit",
    "label": "Audit d'activation",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "activation-audit"
    ],
    "routeurs": [
      "activationAudit"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "core",
      "redirection",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "redirection",
      "smart"
    ],
    "dependances": [
      "core",
      "redirection",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "activation-audit/index.ts importe trpc.ts",
        "activation-audit/inventory.ts importe db.ts",
        "activation-audit/inventory.ts importe engine-registry/probes.ts"
      ],
      "redirection": [
        "activation-audit/inventory.ts importe data/client-routes.ts"
      ],
      "smart": [
        "activation-audit/service.ts importe smart-engine/services/alert-engine.ts",
        "activation-audit/service.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [
      "completion_center",
      "continuous_test"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/audit-activation"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/AuditActivation.tsx",
        "routes": [
          "/admin/audit-activation"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 22,
        "mots": 95
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "domain",
      "history",
      "latest",
      "recordTest",
      "run",
      "states"
    ],
    "tables": [
      "activation_audit_items",
      "activation_audit_runs",
      "activation_test_evidence"
    ],
    "acces": [
      "admin"
    ],
    "textes": 22,
    "mots": 95,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "ai_fabric",
    "label": "Fabrique Intelligence",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "ai-fabric"
    ],
    "routeurs": [
      "aiFabric"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "backup",
      "connaissance_auto",
      "core",
      "intelligences",
      "monitoring",
      "resilience",
      "smart"
    ],
    "dependancesDetectees": [
      "backup",
      "connaissance_auto",
      "core",
      "intelligences",
      "monitoring",
      "resilience",
      "smart"
    ],
    "dependances": [
      "backup",
      "connaissance_auto",
      "core",
      "intelligences",
      "monitoring",
      "resilience",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "backup": [
        "ai-fabric/service.ts importe backup-os/index.ts"
      ],
      "connaissance_auto": [
        "ai-fabric/service.ts importe knowledge-engine/schema.ts"
      ],
      "core": [
        "ai-fabric/index.ts importe trpc.ts",
        "ai-fabric/service.ts importe db.ts",
        "ai-fabric/service.ts importe engine-registry/dependencies.ts"
      ],
      "intelligences": [
        "client/src/pages/CentreIA.tsx embarque components/IaConfigWarning.tsx (trpc.intelligences)"
      ],
      "monitoring": [
        "ai-fabric/service.ts importe monitoring-os/index.ts"
      ],
      "resilience": [
        "ai-fabric/service.ts importe resilience/schema.ts"
      ],
      "smart": [
        "ai-fabric/service.ts importe smart-engine/schema.ts",
        "ai-fabric/service.ts importe smart-engine/services/activity-log.ts"
      ]
    },
    "dependants": [
      "intelligences",
      "media_authenticity",
      "smart_audit"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/ia-couts",
      "/ia",
      "/ia/i-a-aide-devis",
      "/ia/i-a-analyse-marche",
      "/ia/i-a-assistant-client",
      "/ia/i-a-detection-fraude",
      "/ia/i-a-estimation"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreIA.tsx",
        "routes": [
          "/admin/ia-couts"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 39,
        "mots": 305
      },
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/ia"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/ia/IAAideDevis.tsx",
        "routes": [
          "/ia/i-a-aide-devis"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/ia/IAAnalyseMarche.tsx",
        "routes": [
          "/ia/i-a-analyse-marche"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/ia/IAAssistantClient.tsx",
        "routes": [
          "/ia/i-a-assistant-client"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/ia/IADetectionFraude.tsx",
        "routes": [
          "/ia/i-a-detection-fraude"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/ia/IAEstimation.tsx",
        "routes": [
          "/ia/i-a-estimation"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "couts",
      "demanderRestauration",
      "dependance",
      "fournisseurs",
      "health",
      "referentiels",
      "regleFinale",
      "routages",
      "sauvegarderMemoire",
      "sauvegardesMemoire",
      "simulerRoutage",
      "stats",
      "supervision",
      "suspendreFournisseur",
      "verifierMemoire"
    ],
    "tables": [
      "af_cost_entries",
      "af_memory_backups",
      "af_providers",
      "af_routes"
    ],
    "acces": [
      "direction",
      "pdg"
    ],
    "textes": 53,
    "mots": 353,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/ia/IAAideDevis.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/ia/IAAnalyseMarche.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/ia/IAAssistantClient.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/ia/IADetectionFraude.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/ia/IAEstimation.tsx (2 texte(s))"
      }
    ]
  },
  {
    "moteur": "ai_learning",
    "label": "Apprentissage Intelligence",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "ai-learning-os"
    ],
    "routeurs": [
      "aiLearningOs"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "core",
      "identity",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "smart"
    ],
    "dependances": [
      "core",
      "identity",
      "smart"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "ai-learning-os/index.ts importe db.ts",
        "ai-learning-os/index.ts importe trpc.ts"
      ],
      "identity": [
        "ai-learning-os/index.ts importe identity-os/contract.ts",
        "ai-learning-os/index.ts exige une session Identity (procédure protégée)"
      ],
      "smart": [
        "ai-learning-os/index.ts importe smart-engine/schema.ts"
      ]
    },
    "dependants": [
      "core"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [],
    "procedures": [
      "controlCenterFeed",
      "dashboard",
      "healthStatus",
      "meta",
      "pendingImprovements",
      "summary"
    ],
    "tables": [],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "sans_ecran",
        "detail": "aucune route client ne mène à ce moteur"
      }
    ]
  },
  {
    "moteur": "analytics",
    "label": "Analytics Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "modules/history.ts",
      "routers/historique.ts"
    ],
    "routeurs": [
      "historique"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "monitoring",
      "redirection",
      "seo",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "smart"
    ],
    "dependances": [
      "core",
      "monitoring",
      "redirection",
      "seo",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "routers/historique.ts importe trpc.ts",
        "routers/historique.ts importe db.ts",
        "routers/historique.ts importe schema.ts"
      ],
      "smart": [
        "routers/historique.ts importe smart-engine/services/alert-engine.ts",
        "routers/historique.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/historique",
      "/historique-consultations"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Historique.tsx",
        "routes": [
          "/historique"
        ],
        "cliquables": 48,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 257,
        "mots": 838
      },
      {
        "fichier": "client/src/pages/HistoriqueConsultations.tsx",
        "routes": [
          "/historique-consultations"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 25,
        "mots": 80
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "listSignalements",
      "listSuggestions",
      "myReports",
      "report",
      "report_signal",
      "requestReport",
      "suggest"
    ],
    "tables": [
      "signalements",
      "suggestions",
      "vehicle_report_payments",
      "vehicle_reports",
      "vin_checks"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 282,
    "mots": 918,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/auth?redirect=/historique client/src/pages/Historique.tsx:511"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/auth?mode=register&redirect=/historique client/src/pages/Historique.tsx:514"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Confirmer l'ajout » client/src/pages/Historique.tsx:291"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Acheter » client/src/pages/Historique.tsx:885"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "seo"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "redirection"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "monitoring"
      }
    ]
  },
  {
    "moteur": "assurance",
    "label": "Assurance Engine",
    "categorie": "service",
    "etatDeclare": "active",
    "dossiers": [
      "insurance-engine"
    ],
    "routeurs": [
      "insuranceEngine",
      "insurance"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "document",
      "identity",
      "notification",
      "partner_engine"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "notification"
    ],
    "dependances": [
      "core",
      "document",
      "identity",
      "notification",
      "partner_engine"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "insurance-engine/index.ts importe trpc.ts",
        "insurance-engine/service.ts importe db.ts"
      ],
      "identity": [
        "insurance-engine/index.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "insurance-engine/service.ts importe notification-os/triggers.ts",
        "insurance-engine/service.ts déclenche notifyEvent"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/operations/m-k-a-p-m-s-assurance"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/operations/MKAPMSAssurance.tsx",
        "routes": [
          "/operations/m-k-a-p-m-s-assurance"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 29,
        "mots": 124
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.insurance"
        ]
      }
    ],
    "procedures": [
      "catalog",
      "changerStatutDemande",
      "demanderDevis",
      "demandes",
      "enregistrerAssureur",
      "enregistrerOffre",
      "health",
      "mesDemandes",
      "partners"
    ],
    "tables": [
      "insurance_partners",
      "insurance_quote_requests"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "public"
    ],
    "textes": 29,
    "mots": 124,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "partner_engine"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "document"
      }
    ]
  },
  {
    "moteur": "atelier",
    "label": "Moteur d'Atelier",
    "categorie": "service",
    "etatDeclare": "active",
    "dossiers": [
      "atelier-engine"
    ],
    "routeurs": [
      "atelierEngine"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "achat",
      "boutons",
      "core",
      "event_bus",
      "garage",
      "intelligences",
      "notification",
      "permission",
      "redirection",
      "smart"
    ],
    "dependancesDetectees": [
      "achat",
      "boutons",
      "core",
      "event_bus",
      "garage",
      "notification",
      "permission",
      "smart"
    ],
    "dependances": [
      "achat",
      "boutons",
      "core",
      "event_bus",
      "garage",
      "intelligences",
      "notification",
      "permission",
      "redirection",
      "smart"
    ],
    "integrationsTechniques": [
      "permission"
    ],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/garage/ValidationClient.tsx appelle trpc.devis"
      ],
      "boutons": [
        "client/src/pages/garage/CommandesAutomatiques.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/garage/CommandesAutomatiques.tsx utilise BoutonMoteur",
        "client/src/pages/garage/ControleQualitePremium.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      ],
      "core": [
        "atelier-engine/index.ts importe db.ts",
        "atelier-engine/index.ts importe schema.ts",
        "atelier-engine/index.ts importe trpc.ts"
      ],
      "event_bus": [
        "atelier-engine/reappro.ts importe event-bus/service.ts",
        "atelier-engine/reappro.ts publie des événements",
        "atelier-engine/service.ts importe event-bus/service.ts"
      ],
      "garage": [
        "client/src/pages/garage/PlanningAtelier.tsx appelle trpc.garages"
      ],
      "notification": [
        "atelier-engine/reappro.ts importe services/email.ts",
        "atelier-engine/reappro.ts envoie un email"
      ],
      "permission": [
        "atelier-engine/index.ts filtre par rôle (procédure pro/admin/direction/PDG)"
      ],
      "smart": [
        "publie atelier.reappro_proposee, consommé par smart",
        "publie atelier.reappro_decidee, consommé par smart",
        "publie atelier.reappro_plafond_depasse, consommé par smart"
      ]
    },
    "dependants": [
      "garage"
    ],
    "evenementsPublies": [
      "atelier.commande_fournisseur_annulee",
      "atelier.commande_fournisseur_passee",
      "atelier.commande_fournisseur_receptionnee",
      "atelier.controle_non_conforme",
      "atelier.rdv_reporte",
      "atelier.reappro_decidee",
      "atelier.reappro_plafond_depasse",
      "atelier.reappro_plafond_proche",
      "atelier.reappro_proposee",
      "atelier.reappro_reglages_modifies",
      "atelier.stock_bas",
      "atelier.validation_enregistree"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "atelier"
    ],
    "boutons": [
      {
        "code": "garage_cq_validation",
        "libelle": "Valider (contrôle qualité premium)",
        "genre": "formulaire",
        "ecran": "/garage/controle-qualite-premium",
        "fichier": "client/src/pages/garage/ControleQualitePremium.tsx",
        "ligne": 160
      },
      {
        "code": "garage_devis_accepter",
        "libelle": "Accepter le devis",
        "genre": "formulaire",
        "ecran": "/garage/validation-client",
        "fichier": "client/src/pages/garage/ValidationClient.tsx",
        "ligne": 163
      },
      {
        "code": "garage_devis_modifier",
        "libelle": "Demander une modification du devis",
        "genre": "navigation",
        "ecran": "/garage/validation-client",
        "fichier": "client/src/pages/garage/ValidationClient.tsx",
        "ligne": 170
      },
      {
        "code": "garage_devis_refuser",
        "libelle": "Refuser le devis",
        "genre": "formulaire",
        "ecran": "/garage/validation-client",
        "fichier": "client/src/pages/garage/ValidationClient.tsx",
        "ligne": 177
      },
      {
        "code": "garage_planning_commencer",
        "libelle": "Commencer l'intervention",
        "genre": "formulaire",
        "ecran": "/garage/planning-atelier",
        "fichier": "client/src/pages/garage/PlanningAtelier.tsx",
        "ligne": 214
      },
      {
        "code": "garage_planning_pret",
        "libelle": "Véhicule prêt",
        "genre": "formulaire",
        "ecran": "/garage/planning-atelier",
        "fichier": "client/src/pages/garage/PlanningAtelier.tsx",
        "ligne": 221
      },
      {
        "code": "garage_planning_reporter",
        "libelle": "Reporter le rendez-vous",
        "genre": "formulaire",
        "ecran": "/garage/planning-atelier",
        "fichier": "client/src/pages/garage/PlanningAtelier.tsx",
        "ligne": 245
      },
      {
        "code": "garage_reappro_annuler",
        "libelle": "Annuler la commande",
        "genre": "formulaire",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 424
      },
      {
        "code": "garage_reappro_auto",
        "libelle": "Activer le réapprovisionnement automatique",
        "genre": "formulaire",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 180
      },
      {
        "code": "garage_reappro_auto",
        "libelle": "Activer le réapprovisionnement automatique",
        "genre": "formulaire",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 237
      },
      {
        "code": "garage_reappro_commander",
        "libelle": "Passer la commande fournisseur",
        "genre": "formulaire",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 362
      },
      {
        "code": "garage_reappro_proposer_ruptures",
        "libelle": "Proposer toutes les ruptures",
        "genre": "formulaire",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 259
      },
      {
        "code": "garage_reappro_receptionner",
        "libelle": "Réceptionner la commande",
        "genre": "formulaire",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 415
      },
      {
        "code": "garage_reappro_refuser",
        "libelle": "Refuser la proposition",
        "genre": "formulaire",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 325
      },
      {
        "code": "garage_reappro_valider",
        "libelle": "Valider la proposition",
        "genre": "formulaire",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 310
      },
      {
        "code": "garage_reappro_voir_stock",
        "libelle": "Voir le stock",
        "genre": "navigation",
        "ecran": "/garage/commandes-automatiques",
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "ligne": 266
      },
      {
        "code": "garage_reception_devis",
        "libelle": "Ouvrir une demande de devis",
        "genre": "navigation",
        "ecran": "/garage/reception-vehicule",
        "fichier": "client/src/pages/garage/ReceptionVehicule.tsx",
        "ligne": 92
      },
      {
        "code": "garage_reception_fiche",
        "libelle": "Éditer la fiche de réception",
        "genre": "document",
        "ecran": "/garage/reception-vehicule",
        "fichier": "client/src/pages/garage/ReceptionVehicule.tsx",
        "ligne": 85
      },
      {
        "code": "garage_restitution_bon",
        "libelle": "Éditer le bon de restitution",
        "genre": "document",
        "ecran": "/garage/restitution-client",
        "fichier": "client/src/pages/garage/RestitutionClient.tsx",
        "ligne": 62
      },
      {
        "code": "garage_restitution_facture",
        "libelle": "Facturation du dossier",
        "genre": "navigation",
        "ecran": "/garage/restitution-client",
        "fichier": "client/src/pages/garage/RestitutionClient.tsx",
        "ligne": 69
      },
      {
        "code": "garage_stock_ajuster",
        "libelle": "Enregistrer le stock",
        "genre": "formulaire",
        "ecran": "/garage/stock-pieces",
        "fichier": "client/src/pages/garage/StockPieces.tsx",
        "ligne": 241
      },
      {
        "code": "garage_stock_commander",
        "libelle": "Commander la pièce",
        "genre": "navigation",
        "ecran": "/garage/stock-pieces",
        "fichier": "client/src/pages/garage/StockPieces.tsx",
        "ligne": 321
      },
      {
        "code": "garage_validation_interne",
        "libelle": "Valider (validation interne)",
        "genre": "formulaire",
        "ecran": "/garage/validation-interne",
        "fichier": "client/src/pages/garage/ValidationInterne.tsx",
        "ligne": 129
      }
    ],
    "routes": [
      "/atelier-pro",
      "/garage/commandes-automatiques",
      "/garage/controle-qualite-garage",
      "/garage/controle-qualite-premium",
      "/garage/fiches-techniciens",
      "/garage/file-attente-atelier",
      "/garage/gestion-mecaniciens",
      "/garage/gestion-outillage",
      "/garage/gestion-ponts",
      "/garage/ordre-reparation",
      "/garage/planning-atelier",
      "/garage/reception-vehicule",
      "/garage/rentabilite-atelier",
      "/garage/restitution-client",
      "/garage/stock-pieces",
      "/garage/tableau-bord-chef-atelier",
      "/garage/temps-intervention",
      "/garage/validation-client",
      "/garage/validation-interne"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/AtelierPro.tsx",
        "routes": [
          "/atelier-pro"
        ],
        "cliquables": 46,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 206,
        "mots": 540
      },
      {
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "routes": [
          "/garage/commandes-automatiques"
        ],
        "cliquables": 10,
        "parMoteur": 9,
        "sansAction": 0,
        "textes": 26,
        "mots": 145
      },
      {
        "fichier": "client/src/pages/garage/ControleQualiteGarage.tsx",
        "routes": [
          "/garage/controle-qualite-garage"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 12,
        "mots": 25
      },
      {
        "fichier": "client/src/pages/garage/ControleQualitePremium.tsx",
        "routes": [
          "/garage/controle-qualite-premium"
        ],
        "cliquables": 2,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 10,
        "mots": 63
      },
      {
        "fichier": "client/src/pages/garage/FichesTechniciens.tsx",
        "routes": [
          "/garage/fiches-techniciens"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/garage/FileAttenteAtelier.tsx",
        "routes": [
          "/garage/file-attente-atelier"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/garage/GestionMecaniciens.tsx",
        "routes": [
          "/garage/gestion-mecaniciens"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/garage/GestionOutillage.tsx",
        "routes": [
          "/garage/gestion-outillage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 19
      },
      {
        "fichier": "client/src/pages/garage/GestionPonts.tsx",
        "routes": [
          "/garage/gestion-ponts"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/garage/OrdreReparation.tsx",
        "routes": [
          "/garage/ordre-reparation"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 17,
        "mots": 33
      },
      {
        "fichier": "client/src/pages/garage/PlanningAtelier.tsx",
        "routes": [
          "/garage/planning-atelier"
        ],
        "cliquables": 4,
        "parMoteur": 3,
        "sansAction": 0,
        "textes": 10,
        "mots": 19
      },
      {
        "fichier": "client/src/pages/garage/ReceptionVehicule.tsx",
        "routes": [
          "/garage/reception-vehicule"
        ],
        "cliquables": 3,
        "parMoteur": 2,
        "sansAction": 0,
        "textes": 15,
        "mots": 67
      },
      {
        "fichier": "client/src/pages/garage/RentabiliteAtelier.tsx",
        "routes": [
          "/garage/rentabilite-atelier"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/garage/RestitutionClient.tsx",
        "routes": [
          "/garage/restitution-client"
        ],
        "cliquables": 3,
        "parMoteur": 2,
        "sansAction": 0,
        "textes": 12,
        "mots": 55
      },
      {
        "fichier": "client/src/pages/garage/StockPieces.tsx",
        "routes": [
          "/garage/stock-pieces"
        ],
        "cliquables": 5,
        "parMoteur": 2,
        "sansAction": 0,
        "textes": 15,
        "mots": 51
      },
      {
        "fichier": "client/src/pages/garage/TableauBordChefAtelier.tsx",
        "routes": [
          "/garage/tableau-bord-chef-atelier"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 15
      },
      {
        "fichier": "client/src/pages/garage/TempsIntervention.tsx",
        "routes": [
          "/garage/temps-intervention"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 10,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/garage/ValidationClient.tsx",
        "routes": [
          "/garage/validation-client"
        ],
        "cliquables": 4,
        "parMoteur": 3,
        "sansAction": 0,
        "textes": 13,
        "mots": 47
      },
      {
        "fichier": "client/src/pages/garage/ValidationInterne.tsx",
        "routes": [
          "/garage/validation-interne"
        ],
        "cliquables": 2,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 7,
        "mots": 50
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "alertesStock",
      "annulerCommande",
      "commanderFournisseur",
      "commandesFournisseur",
      "deciderProposition",
      "enregistrerReapproReglages",
      "enregistrerStock",
      "enregistrerValidation",
      "etat",
      "mesGarages",
      "mesValidations",
      "mouvementsStock",
      "proposerReappro",
      "proposerToutesRuptures",
      "propositions",
      "reapproReglages",
      "receptionnerCommande",
      "reportsRdv",
      "stock",
      "validationsDossier"
    ],
    "tables": [
      "atelier_commandes_fournisseur",
      "atelier_rdv_reports",
      "atelier_reappro_propositions",
      "atelier_reappro_reglages",
      "atelier_stock",
      "atelier_stock_mouvements",
      "atelier_validations"
    ],
    "acces": [
      "pdg",
      "professionnel"
    ],
    "textes": 401,
    "mots": 1186,
    "battement": "code",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Validation atelier ✓ » client/src/pages/garage/ControleQualiteGarage.tsx:16"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Validation responsable » client/src/pages/garage/ControleQualiteGarage.tsx:16"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/mecaniciens client/src/pages/garage/FichesTechniciens.tsx:7"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/garage/FileAttenteAtelier.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/garage/GestionPonts.tsx (2 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir details » client/src/pages/garage/OrdreReparation.tsx:59"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Pause » client/src/pages/garage/TempsIntervention.tsx:15"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Fin » client/src/pages/garage/TempsIntervention.tsx:15"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "redirection"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "intelligences"
      }
    ]
  },
  {
    "moteur": "auction_engine",
    "label": "Auction Engine",
    "categorie": "service",
    "etatDeclare": "active",
    "dossiers": [
      "auction-engine"
    ],
    "routeurs": [
      "auctionEngine"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "country",
      "notification",
      "payment",
      "visibility"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "notification",
      "visibility"
    ],
    "dependances": [
      "core",
      "country",
      "notification",
      "payment",
      "visibility"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "auction-engine/index.ts importe trpc.ts",
        "auction-engine/service.ts importe db.ts"
      ],
      "country": [
        "auction-engine/service.ts importe country-os/index.ts"
      ],
      "notification": [
        "auction-engine/service.ts importe notification-os/triggers.ts",
        "auction-engine/service.ts déclenche notifyEvent"
      ],
      "visibility": [
        "auction-engine/service.ts charge visibility-os/index.ts"
      ]
    },
    "dependants": [
      "encheres"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/encheres/live"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Encheres.tsx",
        "routes": [
          "/encheres/live"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 51
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "bid",
      "cancel",
      "close",
      "closeExpired",
      "create",
      "detail",
      "health",
      "list",
      "myAuctions",
      "myBids",
      "publish"
    ],
    "tables": [
      "auction_bids",
      "auction_events",
      "auctions"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 11,
    "mots": 51,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      }
    ]
  },
  {
    "moteur": "audit",
    "label": "Audit OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "audit-os",
      "audit.ts"
    ],
    "routeurs": [
      "auditOs"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "identity"
    ],
    "dependancesDetectees": [
      "core",
      "identity"
    ],
    "dependances": [
      "core",
      "identity"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "audit-os/index.ts importe db.ts",
        "audit-os/index.ts importe schema.ts",
        "audit-os/index.ts importe trpc.ts"
      ],
      "identity": [
        "audit-os/index.ts importe identity-os/contract.ts",
        "audit-os/index.ts exige une session Identity (procédure protégée)"
      ]
    },
    "dependants": [
      "achat",
      "cartegrise",
      "core",
      "event_bus",
      "identity",
      "indexation",
      "media_authenticity",
      "messaging",
      "monitoring",
      "pro_portal",
      "support",
      "workflow"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/journal-activite",
      "/superadmin/admin-journal"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/JournalActivite.tsx",
        "routes": [
          "/journal-activite"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 31,
        "mots": 130
      },
      {
        "fichier": "client/src/pages/superadmin/AdminJournal.tsx",
        "routes": [
          "/superadmin/admin-journal"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "controlCenterFeed",
      "dashboard",
      "healthStatus",
      "meta",
      "query",
      "stats"
    ],
    "tables": [],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 35,
    "mots": 138,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Imprimer » client/src/pages/JournalActivite.tsx:212"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« PDF » client/src/pages/JournalActivite.tsx:215"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/superadmin/AdminJournal.tsx (4 texte(s))"
      }
    ]
  },
  {
    "moteur": "auto_branchement",
    "label": "Module d'auto-branchement",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "auto-branchement",
      "data/cliquables.ts"
    ],
    "routeurs": [
      "autoBranchement"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "boutons",
      "core",
      "event_bus",
      "intelligences",
      "redirection",
      "smart"
    ],
    "dependancesDetectees": [
      "boutons",
      "core",
      "event_bus",
      "intelligences",
      "redirection",
      "smart"
    ],
    "dependances": [
      "boutons",
      "core",
      "event_bus",
      "intelligences",
      "redirection",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "boutons": [
        "auto-branchement/service.ts importe button-engine/catalogue.ts"
      ],
      "core": [
        "auto-branchement/router.ts importe trpc.ts",
        "auto-branchement/service.ts importe engine-registry/service.ts",
        "auto-branchement/service.ts bat au registre central"
      ],
      "event_bus": [
        "auto-branchement/service.ts importe event-bus/service.ts",
        "auto-branchement/service.ts publie des événements"
      ],
      "intelligences": [
        "auto-branchement/service.ts charge intelligences/memoire.ts"
      ],
      "redirection": [
        "auto-branchement/service.ts importe data/client-routes.ts",
        "auto-branchement/service.ts importe redirection-engine/service.ts"
      ],
      "smart": [
        "publie cliquables.audit_termine, consommé par smart",
        "publie cliquable.destination_morte, consommé par smart",
        "publie ecrans.vides_recenses, consommé par smart"
      ]
    },
    "dependants": [
      "continuous_test"
    ],
    "evenementsPublies": [
      "cliquable.destination_morte",
      "cliquables.audit_termine",
      "ecrans.vides_recenses"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "auto_branchement"
    ],
    "boutons": [],
    "routes": [
      "/admin/auto-branchement"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreAutoBranchement.tsx",
        "routes": [
          "/admin/auto-branchement"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 13,
        "mots": 131
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "analyser",
      "codesNonDeclares",
      "destinations",
      "ecrans",
      "propositions",
      "sectionsVides",
      "synthese"
    ],
    "tables": [],
    "acces": [
      "pdg"
    ],
    "textes": 13,
    "mots": 131,
    "battement": "code",
    "manques": []
  },
  {
    "moteur": "avis_reputation",
    "label": "Reviews & Reputation Engine",
    "categorie": "service",
    "etatDeclare": "active",
    "dossiers": [
      "reputation-engine",
      "modules/reviews.ts",
      "routers/reviews.ts",
      "routers/reviewsV2.ts",
      "routers/app-feedback.ts"
    ],
    "routeurs": [
      "reputationEngine",
      "reviews",
      "appFeedback"
    ],
    "fichiersServeur": 15,
    "dependancesDeclarees": [
      "connecteur_google_business",
      "core",
      "country",
      "depannage",
      "livraison",
      "notification",
      "pieces",
      "smart",
      "workflow"
    ],
    "dependancesDetectees": [
      "connecteur_google_business",
      "core",
      "depannage",
      "identity",
      "livraison",
      "notification",
      "pieces",
      "smart",
      "workflow"
    ],
    "dependances": [
      "connecteur_google_business",
      "core",
      "country",
      "depannage",
      "identity",
      "livraison",
      "notification",
      "pieces",
      "smart",
      "workflow"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "connecteur_google_business": [
        "reputation-engine/center.ts importe connectors/google-business/schema.ts",
        "reputation-engine/center.ts importe connectors/google-business/service.ts"
      ],
      "core": [
        "reputation-engine/audience.ts importe db.ts",
        "reputation-engine/audience.ts importe schema.ts",
        "reputation-engine/center.ts importe db.ts"
      ],
      "depannage": [
        "reputation-engine/ownership.ts importe modules/depannage.ts",
        "reputation-engine/responses.ts importe modules/depannage.ts"
      ],
      "identity": [
        "routers/reviews.ts importe identity-os/identite-officielle.ts",
        "routers/reviewsV2.ts importe identity-os/identite-officielle.ts"
      ],
      "livraison": [
        "reputation-engine/ownership.ts importe modules/livraison.ts",
        "reputation-engine/responses.ts importe modules/livraison.ts"
      ],
      "notification": [
        "reputation-engine/service.ts importe notification-os/triggers.ts",
        "reputation-engine/service.ts déclenche notifyEvent",
        "routers/reviewsV2.ts importe notification-os/triggers.ts"
      ],
      "pieces": [
        "reputation-engine/ownership.ts importe modules/pieces.ts",
        "reputation-engine/responses.ts importe modules/pieces.ts"
      ],
      "smart": [
        "reputation-engine/audience.ts importe smart-engine/schema.ts",
        "reputation-engine/center.ts importe smart-engine/schema.ts",
        "reputation-engine/center.ts ouvre une alerte du Système Intelligent"
      ],
      "workflow": [
        "routers/reviewsV2.ts importe routers/operations.ts"
      ]
    },
    "dependants": [
      "achat",
      "achat_officiel",
      "achat_particulier",
      "achat_pro",
      "connecteur_google_business",
      "depannage",
      "garage",
      "livraison",
      "pieces",
      "proximity_engine",
      "search",
      "seo",
      "smart"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/reputation",
      "/avis/:univers",
      "/compte/avis",
      "/confiance",
      "/pro/avis",
      "/superadmin/admin-moderation-avis",
      "/vente/avis"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/AvisUnivers.tsx",
        "routes": [
          "/avis/:univers"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 88
      },
      {
        "fichier": "client/src/pages/CentreReputation.tsx",
        "routes": [
          "/admin/reputation"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 37,
        "mots": 207
      },
      {
        "fichier": "client/src/pages/Confiance.tsx",
        "routes": [
          "/confiance"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 21,
        "mots": 202
      },
      {
        "fichier": "client/src/pages/compte/MesAvis.tsx",
        "routes": [
          "/compte/avis"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 27
      },
      {
        "fichier": "client/src/pages/pro/AvisPro.tsx",
        "routes": [
          "/pro/avis"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 49
      },
      {
        "fichier": "client/src/pages/superadmin/AdminModerationAvis.tsx",
        "routes": [
          "/superadmin/admin-moderation-avis"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 5,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/vente/AvisVendeurs.tsx",
        "routes": [
          "/vente/avis"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 24
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/particulier/vehicule/:id",
        "composants": [
          "trpc.reviews"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/professionnel/vehicule/:id",
        "composants": [
          "trpc.reviews"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/mkapms-officiel/vehicule/:id",
        "composants": [
          "trpc.reviews"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/vehicule/:id",
        "composants": [
          "trpc.reviews"
        ]
      },
      {
        "fichier": "client/src/pages/garage/GaragePublicFiche.tsx",
        "route": "/garages/:slug",
        "composants": [
          "components/avis/BlocAvis.tsx",
          "trpc.reputationEngine"
        ]
      },
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.reputationEngine",
          "trpc.appFeedback"
        ]
      }
    ],
    "procedures": [
      "adminDashboard",
      "avisDeMesCibles",
      "centre",
      "clientReply",
      "comptesLies",
      "conseilsAudience",
      "contest",
      "create",
      "createPlatformReview",
      "createWebhook",
      "delete",
      "deleteWebhook",
      "dismissRequest",
      "geoAnalysis",
      "getBadges",
      "getConfig",
      "getCriteria",
      "getLeaderboard",
      "getMonthlyTrend",
      "getMyObjectives",
      "getPlatformReviews",
      "getStats",
      "getTrustScore",
      "getUniversList",
      "health",
      "list",
      "listEmployees",
      "listForUser",
      "listProFeedback",
      "listRequests",
      "listWebhooks",
      "manageBadges",
      "manageCriteria",
      "manageEmployees",
      "manageObjective",
      "manageUnivers",
      "markHelpful",
      "mesDemandes",
      "mine",
      "moderate",
      "officialResponse",
      "pagePublique",
      "proFeedback",
      "qualityCenter",
      "report",
      "reputation",
      "resolveContestation",
      "respond",
      "scoreClassement",
      "signaux",
      "stats",
      "submitExitSurvey",
      "submitFeatureSatisfaction",
      "suggestionReponse",
      "tendances",
      "traiterSignal",
      "univers",
      "universAvecAvis",
      "update",
      "updateConfig"
    ],
    "tables": [
      "review_aggregates",
      "review_badge_definitions",
      "review_badges_awarded",
      "review_config",
      "review_contestations",
      "review_criteria_templates",
      "review_employees",
      "review_exit_surveys",
      "review_feature_satisfaction",
      "review_fraud_signals",
      "review_helpful",
      "review_history",
      "review_monthly_stats",
      "review_objectives",
      "review_reports",
      "review_requests",
      "review_trust_scores",
      "review_univers_registry",
      "review_webhook_logs",
      "review_webhooks",
      "reviews_v2"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "professionnel",
      "public"
    ],
    "textes": 96,
    "mots": 606,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminModerationAvis.tsx:26"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Publier » client/src/pages/superadmin/AdminModerationAvis.tsx:49"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Supprimer » client/src/pages/superadmin/AdminModerationAvis.tsx:50"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/AvisVendeurs.tsx:12"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "identity — routers/reviews.ts importe identity-os/identite-officielle.ts"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "country"
      }
    ]
  },
  {
    "moteur": "backup",
    "label": "Backup & Recovery OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "backup-os"
    ],
    "routeurs": [
      "backupOs"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "core",
      "identity"
    ],
    "dependancesDetectees": [
      "core",
      "identity"
    ],
    "dependances": [
      "core",
      "identity"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "backup-os/index.ts importe db.ts",
        "backup-os/index.ts importe trpc.ts"
      ],
      "identity": [
        "backup-os/index.ts importe identity-os/contract.ts",
        "backup-os/index.ts exige une session Identity (procédure protégée)"
      ]
    },
    "dependants": [
      "ai_fabric"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/superadmin/admin-sauvegardes"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/superadmin/AdminSauvegardes.tsx",
        "routes": [
          "/superadmin/admin-sauvegardes"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 5,
        "textes": 9,
        "mots": 17
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "controlCenterFeed",
      "createSnapshot",
      "dashboard",
      "decideRestore",
      "healthStatus",
      "meta",
      "requestRestore",
      "restoreRequests",
      "snapshots",
      "tables"
    ],
    "tables": [
      "backup_restore_requests",
      "backup_snapshots"
    ],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 9,
    "mots": 17,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« 5 Sauvegardes recentes » client/src/pages/superadmin/AdminSauvegardes.tsx:22"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« 11.4 GB Espace total » client/src/pages/superadmin/AdminSauvegardes.tsx:23"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Sauvegarde manuelle maintenant » client/src/pages/superadmin/AdminSauvegardes.tsx:25"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Telecharger » client/src/pages/superadmin/AdminSauvegardes.tsx:38"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Restaurer » client/src/pages/superadmin/AdminSauvegardes.tsx:39"
      }
    ]
  },
  {
    "moteur": "boutons",
    "label": "Moteur de boutons",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "button-engine",
      "data/boutons-sans-action.ts"
    ],
    "routeurs": [
      "buttonEngine"
    ],
    "fichiersServeur": 5,
    "dependancesDeclarees": [
      "core",
      "event_bus",
      "redirection",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "event_bus",
      "redirection",
      "smart"
    ],
    "dependances": [
      "core",
      "event_bus",
      "redirection",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "button-engine/router.ts importe trpc.ts",
        "button-engine/service.ts importe engine-registry/service.ts",
        "button-engine/service.ts bat au registre central"
      ],
      "event_bus": [
        "button-engine/service.ts importe event-bus/service.ts",
        "button-engine/service.ts publie des événements"
      ],
      "redirection": [
        "button-engine/service.ts importe redirection-engine/service.ts",
        "button-engine/service.ts importe data/client-routes.ts"
      ],
      "smart": [
        "publie bouton.sans_action, consommé par smart"
      ]
    },
    "dependants": [
      "atelier",
      "auto_branchement",
      "continuous_test",
      "garage",
      "livraison",
      "livraison_vehicule",
      "vente"
    ],
    "evenementsPublies": [
      "bouton.sans_action"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "boutons"
    ],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "route": "/livraison-vehicule",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "route": "/louer/livraison",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "route": "/vente/livraison",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Livraison.tsx",
        "route": "/livraison",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/CommandesAutomatiques.tsx",
        "route": "/garage/commandes-automatiques",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/ContratsFlottes.tsx",
        "route": "/garage/contrats-flottes",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/ControleQualitePremium.tsx",
        "route": "/garage/controle-qualite-premium",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/DepannageGarage.tsx",
        "route": "/garage/depannage-garage",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/HistoriqueGarage.tsx",
        "route": "/garage/historique-garage",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/PlanningAtelier.tsx",
        "route": "/garage/planning-atelier",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/ReceptionVehicule.tsx",
        "route": "/garage/reception-vehicule",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/RestitutionClient.tsx",
        "route": "/garage/restitution-client",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/StockPieces.tsx",
        "route": "/garage/stock-pieces",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/ValidationClient.tsx",
        "route": "/garage/validation-client",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/ValidationInterne.tsx",
        "route": "/garage/validation-interne",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      }
    ],
    "procedures": [
      "inventaire",
      "resoudre",
      "signaler"
    ],
    "tables": [],
    "acces": [
      "pdg",
      "public"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "code",
    "manques": []
  },
  {
    "moteur": "cartegrise",
    "label": "Carte Grise Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/cartegrise.ts",
      "routers/cartegrise.ts"
    ],
    "routeurs": [
      "carteGrise"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "audit",
      "core",
      "document",
      "identity",
      "notification",
      "payment"
    ],
    "dependancesDetectees": [
      "audit",
      "core",
      "identity",
      "notification",
      "payment"
    ],
    "dependances": [
      "audit",
      "core",
      "document",
      "identity",
      "notification",
      "payment"
    ],
    "integrationsTechniques": [
      "audit",
      "identity"
    ],
    "preuvesDependances": {
      "audit": [
        "routers/cartegrise.ts écrit au journal d'audit"
      ],
      "core": [
        "routers/cartegrise.ts importe trpc.ts",
        "routers/cartegrise.ts importe db.ts",
        "routers/cartegrise.ts importe schema.ts"
      ],
      "identity": [
        "routers/cartegrise.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/cartegrise.ts importe notification-os/triggers.ts",
        "routers/cartegrise.ts déclenche notifyEvent"
      ],
      "payment": [
        "routers/cartegrise.ts importe payment-engine/checkout.ts"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/carte-grise",
      "/demarches",
      "/demarches/alertes-demarches",
      "/demarches/archives-administratives",
      "/demarches/carte-grise-demarche",
      "/demarches/centre-documents-demarches",
      "/demarches/changement-adresse",
      "/demarches/changement-titulaire",
      "/demarches/declaration-cession",
      "/demarches/duplicata-demarche",
      "/demarches/espace-pro-demarches",
      "/demarches/immatriculation-provisoire",
      "/demarches/importation-vehicule",
      "/demarches/messagerie-demarches",
      "/demarches/objectif-demarches",
      "/demarches/paiement-demarches",
      "/demarches/plaques-immatriculation",
      "/demarches/signatures-electroniques",
      "/demarches/statistiques-demarches",
      "/demarches/succession-vehicule",
      "/demarches/suivi-dossier",
      "/demarches/verification-i-a",
      "/demarches/w-w-garage",
      "/superadmin/admin-demarches"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CarteGrise.tsx",
        "routes": [
          "/carte-grise"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 62,
        "mots": 307
      },
      {
        "fichier": "client/src/pages/demarches/AlertesDemarches.tsx",
        "routes": [
          "/demarches/alertes-demarches"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/demarches/ArchivesAdministratives.tsx",
        "routes": [
          "/demarches/archives-administratives"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "routes": [
          "/demarches/carte-grise-demarche"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/demarches/CentreDocumentsDemarches.tsx",
        "routes": [
          "/demarches/centre-documents-demarches"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 28
      },
      {
        "fichier": "client/src/pages/demarches/ChangementAdresse.tsx",
        "routes": [
          "/demarches/changement-adresse"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 8,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/demarches/ChangementTitulaire.tsx",
        "routes": [
          "/demarches/changement-titulaire"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 7,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/demarches/DeclarationCession.tsx",
        "routes": [
          "/demarches/declaration-cession"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 8,
        "mots": 20
      },
      {
        "fichier": "client/src/pages/demarches/DemarchesGenerale.tsx",
        "routes": [
          "/demarches"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 16,
        "mots": 54
      },
      {
        "fichier": "client/src/pages/demarches/DuplicataDemarche.tsx",
        "routes": [
          "/demarches/duplicata-demarche"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 6,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/demarches/EspaceProDemarches.tsx",
        "routes": [
          "/demarches/espace-pro-demarches"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 4,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/demarches/ImmatriculationProvisoire.tsx",
        "routes": [
          "/demarches/immatriculation-provisoire"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 4,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/demarches/ImportationVehicule.tsx",
        "routes": [
          "/demarches/importation-vehicule"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 8,
        "mots": 20
      },
      {
        "fichier": "client/src/pages/demarches/MessagerieDemarches.tsx",
        "routes": [
          "/demarches/messagerie-demarches"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/demarches/ObjectifDemarches.tsx",
        "routes": [
          "/demarches/objectif-demarches"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/demarches/PaiementDemarches.tsx",
        "routes": [
          "/demarches/paiement-demarches"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 7,
        "mots": 22
      },
      {
        "fichier": "client/src/pages/demarches/PlaquesImmatriculation.tsx",
        "routes": [
          "/demarches/plaques-immatriculation"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 8,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/demarches/SignaturesElectroniques.tsx",
        "routes": [
          "/demarches/signatures-electroniques"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 5,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/demarches/StatistiquesDemarches.tsx",
        "routes": [
          "/demarches/statistiques-demarches"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/demarches/SuccessionVehicule.tsx",
        "routes": [
          "/demarches/succession-vehicule"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/demarches/SuiviDossier.tsx",
        "routes": [
          "/demarches/suivi-dossier"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/demarches/VerificationIA.tsx",
        "routes": [
          "/demarches/verification-i-a"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/demarches/WWGarage.tsx",
        "routes": [
          "/demarches/w-w-garage"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 5,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/superadmin/AdminDemarches.tsx",
        "routes": [
          "/superadmin/admin-demarches"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 22
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "abonnements",
      "acheterPack",
      "addDocument",
      "affecterAgence",
      "agences",
      "allDossiers",
      "auditLog",
      "createAgence",
      "createDossier",
      "detail",
      "dossiersPourAgence",
      "mesDossiers",
      "monAgence",
      "packs",
      "souscrireAbonnement",
      "stats",
      "updateStatus",
      "validerAgence",
      "verifyDocument"
    ],
    "tables": [
      "cg_abonnements",
      "cg_agence_membres",
      "cg_agences",
      "cg_audit_log",
      "cg_credits",
      "cg_documents",
      "cg_dossiers",
      "cg_etapes",
      "cg_packs"
    ],
    "acces": [
      "connecte"
    ],
    "textes": 214,
    "mots": 640,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/AlertesDemarches.tsx (2 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Télécharger » client/src/pages/demarches/ChangementAdresse.tsx:11"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Valider le changement » client/src/pages/demarches/ChangementAdresse.tsx:12"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Soumettre le dossier » client/src/pages/demarches/ChangementTitulaire.tsx:15"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Valider la cession » client/src/pages/demarches/DeclarationCession.tsx:11"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Télécharger » client/src/pages/demarches/DuplicataDemarche.tsx:13"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Demander le duplicata » client/src/pages/demarches/DuplicataDemarche.tsx:14"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Nouveau dossier » client/src/pages/demarches/EspaceProDemarches.tsx:14"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/EspaceProDemarches.tsx (4 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Télécharger » client/src/pages/demarches/ImmatriculationProvisoire.tsx:9"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Demander WW provisoire » client/src/pages/demarches/ImmatriculationProvisoire.tsx:10"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/ImmatriculationProvisoire.tsx (4 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Soumettre le dossier import » client/src/pages/demarches/ImportationVehicule.tsx:10"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/demarches/MessagerieDemarches.tsx:17"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/MessagerieDemarches.tsx (2 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Payer par carte » client/src/pages/demarches/PaiementDemarches.tsx:11"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Commander mes plaques » client/src/pages/demarches/PlaquesImmatriculation.tsx:13"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Signer » client/src/pages/demarches/SignaturesElectroniques.tsx:16"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Soumettre le dossier succession » client/src/pages/demarches/SuccessionVehicule.tsx:10"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/SuccessionVehicule.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/VerificationIA.tsx (3 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Renouveler » client/src/pages/demarches/WWGarage.tsx:15"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Nouvelle demande WW » client/src/pages/demarches/WWGarage.tsx:17"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "document"
      }
    ]
  },
  {
    "moteur": "code_graph",
    "label": "Mémoire technique du code (Code Knowledge Graph)",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "code-graph"
    ],
    "routeurs": [
      "codeGraph"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "continuous_test",
      "core",
      "smart"
    ],
    "dependancesDetectees": [
      "continuous_test",
      "core",
      "smart"
    ],
    "dependances": [
      "continuous_test",
      "core",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "continuous_test": [
        "code-graph/service.ts importe continuous-test/schema.ts"
      ],
      "core": [
        "code-graph/index.ts importe trpc.ts",
        "code-graph/service.ts importe db.ts"
      ],
      "smart": [
        "code-graph/service.ts importe smart-engine/schema.ts",
        "code-graph/service.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [
      "command_center",
      "continuous_test",
      "intelligences"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/memoire-technique"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/MemoireTechnique.tsx",
        "routes": [
          "/admin/memoire-technique"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 33,
        "mots": 197
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "apprendre",
      "classes",
      "etat",
      "impact",
      "lecons",
      "observer",
      "recherche",
      "reconnaitre"
    ],
    "tables": [
      "cg_edges",
      "cg_lessons",
      "cg_nodes",
      "cg_observations",
      "cg_snapshots"
    ],
    "acces": [
      "admin"
    ],
    "textes": 33,
    "mots": 197,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "command_center",
    "label": "Command & Development Center",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "command-center"
    ],
    "routeurs": [
      "commandCenter"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "code_graph",
      "core",
      "country",
      "identity",
      "intelligences",
      "resilience",
      "smart",
      "smart_audit"
    ],
    "dependancesDetectees": [
      "code_graph",
      "core",
      "country",
      "identity",
      "intelligences",
      "resilience",
      "smart",
      "smart_audit"
    ],
    "dependances": [
      "code_graph",
      "core",
      "country",
      "identity",
      "intelligences",
      "resilience",
      "smart",
      "smart_audit"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "code_graph": [
        "command-center/service.ts charge code-graph/service.ts"
      ],
      "core": [
        "command-center/index.ts importe trpc.ts",
        "command-center/service.ts importe db.ts",
        "command-center/service.ts importe schema.ts"
      ],
      "country": [
        "command-center/service.ts importe country-os/index.ts"
      ],
      "identity": [
        "command-center/index.ts exige une session Identity (procédure protégée)",
        "command-center/service.ts importe auth.ts"
      ],
      "intelligences": [
        "client/src/pages/CentreCommandes.tsx embarque components/IaConfigWarning.tsx (trpc.intelligences)"
      ],
      "resilience": [
        "command-center/service.ts importe resilience/service.ts"
      ],
      "smart": [
        "command-center/service.ts importe smart-engine/services/action-tasks.ts",
        "command-center/service.ts importe smart-engine/services/activity-log.ts"
      ],
      "smart_audit": [
        "command-center/service.ts charge smart-audit/service.ts"
      ]
    },
    "dependants": [
      "intelligences"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/commandes"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreCommandes.tsx",
        "routes": [
          "/admin/commandes"
        ],
        "cliquables": 11,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 56,
        "mots": 386
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "capacites",
      "completerDossier",
      "dossiers",
      "envoyer",
      "envoyerAuPipeline",
      "envoyerVocal",
      "fermerSessionVocale",
      "health",
      "journal",
      "nonComprises",
      "ouvrirDossier",
      "ouvrirSessionVocale",
      "sessionsVocales",
      "stats"
    ],
    "tables": [
      "cc_commands",
      "cc_dev_requests",
      "cc_voice_sessions"
    ],
    "acces": [
      "direction",
      "pdg"
    ],
    "textes": 56,
    "mots": 386,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "completion_center",
    "label": "Completion Center (ce qui reste à faire)",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "completion"
    ],
    "routeurs": [
      "completion"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "activation_audit",
      "continuous_test",
      "core",
      "resilience",
      "smart"
    ],
    "dependancesDetectees": [
      "activation_audit",
      "continuous_test",
      "core",
      "resilience",
      "smart"
    ],
    "dependances": [
      "activation_audit",
      "continuous_test",
      "core",
      "resilience",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "activation_audit": [
        "completion/service.ts importe activation-audit/schema.ts",
        "completion/service.ts importe activation-audit/service.ts"
      ],
      "continuous_test": [
        "completion/service.ts importe continuous-test/schema.ts"
      ],
      "core": [
        "completion/index.ts importe trpc.ts",
        "completion/service.ts importe db.ts",
        "completion/service.ts importe engine-registry/schema.ts"
      ],
      "resilience": [
        "completion/service.ts importe resilience/schema.ts"
      ],
      "smart": [
        "completion/service.ts importe smart-engine/services/alert-engine.ts",
        "completion/service.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [
      "continuous_test",
      "intelligences"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/completion"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CompletionCenter.tsx",
        "routes": [
          "/admin/completion"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 22,
        "mots": 150
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "definition",
      "deposerRapport",
      "dernier",
      "domaines",
      "evaluer",
      "ordre",
      "rapports"
    ],
    "tables": [
      "cp_domain_verdicts",
      "cp_snapshots",
      "cp_work_reports"
    ],
    "acces": [
      "admin"
    ],
    "textes": 22,
    "mots": 150,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "comptabilite",
    "label": "Comptabilité Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/comptabilite.ts",
      "routers/comptabilite.ts"
    ],
    "routeurs": [
      "comptabilite"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "document",
      "identity",
      "payment",
      "redirection"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "payment",
      "redirection"
    ],
    "dependances": [
      "core",
      "document",
      "identity",
      "payment",
      "redirection"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "routers/comptabilite.ts importe trpc.ts",
        "routers/comptabilite.ts importe db.ts",
        "routers/comptabilite.ts importe schema.ts"
      ],
      "identity": [
        "routers/comptabilite.ts exige une session Identity (procédure protégée)"
      ],
      "payment": [
        "client/src/pages/comptabilite/WalletAdmin.tsx appelle trpc.wallet"
      ],
      "redirection": [
        "client/src/pages/Comptabilite.tsx embarque lib/redirect.tsx (trpc.redirectionEngine)"
      ]
    },
    "dependants": [
      "accounting_internal",
      "financial_intelligence"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/comptabilite",
      "/comptabilite/abonnements",
      "/comptabilite/alertes",
      "/comptabilite/analytique",
      "/comptabilite/centre-pilotage",
      "/comptabilite/facturation",
      "/comptabilite/paiements",
      "/comptabilite/publicites",
      "/comptabilite/rapports",
      "/comptabilite/tva",
      "/comptabilite/wallets",
      "/superadmin/comptabilite-complete"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Comptabilite.tsx",
        "routes": [
          "/comptabilite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 30,
        "mots": 80
      },
      {
        "fichier": "client/src/pages/comptabilite/AbonnementsCompta.tsx",
        "routes": [
          "/comptabilite/abonnements"
        ],
        "cliquables": 15,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 34,
        "mots": 75
      },
      {
        "fichier": "client/src/pages/comptabilite/Alertes.tsx",
        "routes": [
          "/comptabilite/alertes"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 24,
        "mots": 97
      },
      {
        "fichier": "client/src/pages/comptabilite/CentrePilotage.tsx",
        "routes": [
          "/comptabilite/centre-pilotage"
        ],
        "cliquables": 28,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 656,
        "mots": 1516
      },
      {
        "fichier": "client/src/pages/comptabilite/ComptaAnalytique.tsx",
        "routes": [
          "/comptabilite/analytique"
        ],
        "cliquables": 10,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 81,
        "mots": 177
      },
      {
        "fichier": "client/src/pages/comptabilite/FacturationAvancee.tsx",
        "routes": [
          "/comptabilite/facturation"
        ],
        "cliquables": 16,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 68,
        "mots": 129
      },
      {
        "fichier": "client/src/pages/comptabilite/Paiements.tsx",
        "routes": [
          "/comptabilite/paiements"
        ],
        "cliquables": 13,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 48,
        "mots": 97
      },
      {
        "fichier": "client/src/pages/comptabilite/PublicitesRevenu.tsx",
        "routes": [
          "/comptabilite/publicites"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 58,
        "mots": 108
      },
      {
        "fichier": "client/src/pages/comptabilite/Rapports.tsx",
        "routes": [
          "/comptabilite/rapports"
        ],
        "cliquables": 13,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 61,
        "mots": 145
      },
      {
        "fichier": "client/src/pages/comptabilite/TVA.tsx",
        "routes": [
          "/comptabilite/tva"
        ],
        "cliquables": 12,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 74,
        "mots": 171
      },
      {
        "fichier": "client/src/pages/comptabilite/WalletAdmin.tsx",
        "routes": [
          "/comptabilite/wallets"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 35,
        "mots": 105
      },
      {
        "fichier": "client/src/pages/superadmin/ComptabiliteComplete.tsx",
        "routes": [
          "/superadmin/comptabilite-complete"
        ],
        "cliquables": 14,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 46,
        "mots": 129
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "addClient",
      "addDocument",
      "addDocumentDossier",
      "addDossier",
      "addMembre",
      "clients",
      "create",
      "createEcriture",
      "documents",
      "dossiers",
      "ecritures",
      "genererRapport",
      "mine",
      "rapports",
      "stats",
      "validerEcriture"
    ],
    "tables": [
      "cabinet_clients",
      "cabinet_documents",
      "cabinet_dossiers",
      "cabinet_membres",
      "cabinets_comptables",
      "compta_documents",
      "compta_ecritures",
      "compta_rapports"
    ],
    "acces": [
      "connecte"
    ],
    "textes": 1215,
    "mots": 2829,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Consommation energetique 12 450 kWh » client/src/pages/comptabilite/CentrePilotage.tsx:1002"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Prochaines echeances 12 dossiers » client/src/pages/comptabilite/CentrePilotage.tsx:1019"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "document"
      }
    ]
  },
  {
    "moteur": "connaissance_auto",
    "label": "Automotive Knowledge Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "knowledge-engine"
    ],
    "routeurs": [
      "knowledgeEngine"
    ],
    "fichiersServeur": 7,
    "dependancesDeclarees": [
      "core",
      "country",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "smart"
    ],
    "dependances": [
      "core",
      "country",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "knowledge-engine/discoveries.ts importe db.ts",
        "knowledge-engine/index.ts importe trpc.ts",
        "knowledge-engine/learning.ts importe db.ts"
      ],
      "country": [
        "knowledge-engine/watch.ts importe country-os/index.ts"
      ],
      "smart": [
        "knowledge-engine/discoveries.ts importe smart-engine/services/action-tasks.ts",
        "knowledge-engine/learning.ts importe smart-engine/schema.ts",
        "knowledge-engine/watch.ts importe smart-engine/schema.ts"
      ]
    },
    "dependants": [
      "ai_fabric",
      "intelligences",
      "rd_lab"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/connaissance"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreConnaissance.tsx",
        "routes": [
          "/admin/connaissance"
        ],
        "cliquables": 10,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 68,
        "mots": 393
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "apprendreInterne",
      "connaissancesAVerifier",
      "couvertureManquante",
      "deciderDecouverte",
      "declarerSource",
      "decouvertes",
      "decouvertesStats",
      "enregistrerConnaissance",
      "enregistrerDecouverte",
      "enregistrerSynchronisation",
      "health",
      "initialiserSources",
      "lancerVeille",
      "memoire",
      "rechercher",
      "referentiels",
      "relier",
      "sources",
      "stats",
      "veilleCouverture"
    ],
    "tables": [
      "ake_discoveries",
      "ake_edges",
      "ake_nodes",
      "ake_provenance",
      "ake_sources",
      "ake_watch_runs"
    ],
    "acces": [
      "direction"
    ],
    "textes": 68,
    "mots": 393,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "connecteur_google_business",
    "label": "Connecteur Google Business Profile",
    "categorie": "service",
    "etatDeclare": "staging",
    "dossiers": [
      "connectors/google-business"
    ],
    "routeurs": [
      "googleBusiness"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "avis_reputation",
      "core"
    ],
    "dependancesDetectees": [
      "avis_reputation",
      "core"
    ],
    "dependances": [
      "avis_reputation",
      "core"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "avis_reputation": [
        "connectors/google-business/service.ts importe reputation-engine/service.ts"
      ],
      "core": [
        "connectors/google-business/index.ts importe trpc.ts",
        "connectors/google-business/service.ts importe db.ts"
      ]
    },
    "dependants": [
      "avis_reputation"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [],
    "procedures": [
      "comparer",
      "declarer",
      "etablissements",
      "etat",
      "releveManuel",
      "verifier"
    ],
    "tables": [
      "gbp_locations",
      "gbp_review_snapshots"
    ],
    "acces": [
      "direction"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "sonde",
    "manques": [
      {
        "genre": "sans_ecran",
        "detail": "aucune route client ne mène à ce moteur"
      }
    ]
  },
  {
    "moteur": "continuous_test",
    "label": "Contrôle continu de la plateforme",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "continuous-test"
    ],
    "routeurs": [
      "continuousTest"
    ],
    "fichiersServeur": 9,
    "dependancesDeclarees": [
      "activation_audit",
      "auto_branchement",
      "boutons",
      "code_graph",
      "completion_center",
      "core",
      "event_bus",
      "intelligences",
      "payment",
      "redirection",
      "smart"
    ],
    "dependancesDetectees": [
      "activation_audit",
      "auto_branchement",
      "boutons",
      "code_graph",
      "completion_center",
      "core",
      "event_bus",
      "intelligences",
      "payment",
      "redirection",
      "smart"
    ],
    "dependances": [
      "activation_audit",
      "auto_branchement",
      "boutons",
      "code_graph",
      "completion_center",
      "core",
      "event_bus",
      "intelligences",
      "payment",
      "redirection",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "activation_audit": [
        "continuous-test/service.ts importe activation-audit/service.ts"
      ],
      "auto_branchement": [
        "continuous-test/scenarios-parcours.ts charge auto-branchement/service.ts"
      ],
      "boutons": [
        "continuous-test/scenarios-parcours.ts importe data/boutons-sans-action.ts"
      ],
      "code_graph": [
        "continuous-test/impact.ts importe code-graph/service.ts",
        "continuous-test/scenarios-moteurs-centraux.ts charge code-graph/service.ts"
      ],
      "completion_center": [
        "continuous-test/scenarios-moteurs-centraux.ts charge completion/service.ts"
      ],
      "core": [
        "continuous-test/helpers.ts importe db.ts",
        "continuous-test/helpers.ts importe env.ts",
        "continuous-test/index.ts importe trpc.ts"
      ],
      "event_bus": [
        "continuous-test/catalog.ts charge event-bus/service.ts",
        "continuous-test/catalog.ts publie des événements"
      ],
      "intelligences": [
        "continuous-test/scenarios-intelligences.ts charge intelligences/provider.ts"
      ],
      "payment": [
        "continuous-test/catalog.ts charge lib/stripe.ts",
        "continuous-test/catalog.ts déclenche un paiement"
      ],
      "redirection": [
        "continuous-test/scenarios-parcours.ts importe data/client-routes.ts"
      ],
      "smart": [
        "continuous-test/catalog.ts charge smart-engine/services/alert-engine.ts",
        "continuous-test/catalog.ts ouvre une alerte du Système Intelligent",
        "continuous-test/service.ts charge smart-engine/services/alert-engine.ts"
      ]
    },
    "dependants": [
      "code_graph",
      "completion_center",
      "intelligences"
    ],
    "evenementsPublies": [
      "moteur.retabli"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "continuous_test"
    ],
    "boutons": [],
    "routes": [
      "/admin/controle-continu"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreControleContinu.tsx",
        "routes": [
          "/admin/controle-continu"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 25,
        "mots": 174
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/CentreIntelligences.tsx",
        "route": "/admin/intelligences",
        "composants": [
          "trpc.continuousTest"
        ]
      }
    ],
    "procedures": [
      "campagnes",
      "catalogue",
      "comparaison",
      "etat",
      "executer",
      "executerImpact",
      "historiqueScenario",
      "impact",
      "verrouDeploiement"
    ],
    "tables": [
      "ct_results",
      "ct_runs"
    ],
    "acces": [
      "admin"
    ],
    "textes": 25,
    "mots": 174,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "contract",
    "label": "Contrat OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "contract-os",
      "routers/contracts.ts",
      "modules/contracts.ts"
    ],
    "routeurs": [
      "contractOs",
      "contracts"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "document",
      "identity",
      "scheduler"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "scheduler"
    ],
    "dependances": [
      "core",
      "document",
      "identity",
      "scheduler"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "contract-os/index.ts importe db.ts",
        "contract-os/index.ts importe trpc.ts",
        "routers/contracts.ts importe trpc.ts"
      ],
      "identity": [
        "contract-os/index.ts importe identity-os/contract.ts",
        "contract-os/index.ts exige une session Identity (procédure protégée)",
        "routers/contracts.ts exige une session Identity (procédure protégée)"
      ],
      "scheduler": [
        "contract-os/index.ts importe scheduler-os/index.ts"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/conformite/contrats-adaptes",
      "/entreprises/contrats-entreprises"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/conformite/ContratsAdaptes.tsx",
        "routes": [
          "/conformite/contrats-adaptes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/entreprises/ContratsEntreprises.tsx",
        "routes": [
          "/entreprises/contrats-entreprises"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "all",
      "controlCenterFeed",
      "dashboard",
      "expiring",
      "generate",
      "get",
      "healthStatus",
      "history",
      "meta",
      "mine",
      "parties",
      "register",
      "renew",
      "sign",
      "stats",
      "terminate"
    ],
    "tables": [
      "contract_terms",
      "document_signatures",
      "generated_documents"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 6,
    "mots": 12,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/ContratsAdaptes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/ContratsEntreprises.tsx (3 texte(s))"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "document"
      }
    ]
  },
  {
    "moteur": "controle_technique",
    "label": "Contrôle Technique Engine",
    "categorie": "service",
    "etatDeclare": "active",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "core",
      "identity",
      "notification",
      "payment",
      "scheduler"
    ],
    "dependancesDetectees": [],
    "dependances": [
      "core",
      "identity",
      "notification",
      "payment",
      "scheduler"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {},
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/garage/controle-technique",
      "/louer/etats-vehicule",
      "/louer/inspection"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/EtatVehicule.tsx",
        "routes": [
          "/louer/etats-vehicule"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 4,
        "textes": 35,
        "mots": 93
      },
      {
        "fichier": "client/src/pages/InspectionNumerique.tsx",
        "routes": [
          "/louer/inspection"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 4,
        "textes": 16,
        "mots": 48
      },
      {
        "fichier": "client/src/pages/garage/ControleTechnique.tsx",
        "routes": [
          "/garage/controle-technique"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 11
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 57,
    "mots": 152,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir les photos » client/src/pages/EtatVehicule.tsx:91"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Signer le contrat » client/src/pages/EtatVehicule.tsx:155"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/EtatVehicule.tsx:200"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Valider l'état des lieux » client/src/pages/EtatVehicule.tsx:206"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/InspectionNumerique.tsx:75"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Valider l'inspection » client/src/pages/InspectionNumerique.tsx:83"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir les photos » client/src/pages/InspectionNumerique.tsx:92"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rapport » client/src/pages/InspectionNumerique.tsx:93"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "identity"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "scheduler"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "notification"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "core",
    "label": "Core Engine",
    "categorie": "core",
    "etatDeclare": "active",
    "dossiers": [
      "engine-registry",
      "central-engines",
      "db.ts",
      "domain.ts",
      "env.ts",
      "index.ts",
      "migrate.ts",
      "reference.ts",
      "router.ts",
      "schema.ts",
      "seed.ts",
      "trpc.ts",
      "types",
      "data/moteurs.ts",
      "modules/core.ts",
      "modules/coreEngine.ts",
      "routers/coreEngine.ts",
      "routers/modules.ts",
      "routers/admin.ts",
      "routers/meta.ts"
    ],
    "routeurs": [
      "coreEngine",
      "engineRegistry",
      "centralEngines",
      "modules",
      "admin",
      "meta"
    ],
    "fichiersServeur": 37,
    "dependancesDeclarees": [
      "ai_learning",
      "audit",
      "identity",
      "smart",
      "visibility"
    ],
    "dependancesDetectees": [
      "ai_learning",
      "audit",
      "identity",
      "smart",
      "visibility"
    ],
    "dependances": [
      "ai_learning",
      "audit",
      "identity",
      "smart",
      "visibility"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "ai_learning": [
        "central-engines/index.ts importe ai-learning-os/index.ts"
      ],
      "audit": [
        "routers/admin.ts importe audit.ts"
      ],
      "identity": [
        "central-engines/router.ts exige une session Identity (procédure protégée)",
        "routers/admin.ts importe auth.ts",
        "routers/admin.ts exige une session Identity (procédure protégée)"
      ],
      "smart": [
        "central-engines/index.ts importe smart-engine/services/connectors.ts",
        "central-engines/index.ts importe smart-engine/services/platform-health.ts",
        "central-engines/index.ts importe smart-engine/services/alert-engine.ts"
      ],
      "visibility": [
        "routers/admin.ts importe visibility-os/index.ts"
      ]
    },
    "dependants": [
      "account_routing",
      "accounting_internal",
      "accounting_marketplace",
      "achat",
      "achat_officiel",
      "achat_particulier",
      "achat_pro",
      "activation_audit",
      "ai_fabric",
      "ai_learning",
      "analytics",
      "assurance",
      "atelier",
      "auction_engine",
      "audit",
      "auto_branchement",
      "avis_reputation",
      "backup",
      "boutons",
      "cartegrise",
      "code_graph",
      "command_center",
      "completion_center",
      "comptabilite",
      "connaissance_auto",
      "connecteur_google_business",
      "continuous_test",
      "contract",
      "controle_technique",
      "country",
      "depannage",
      "document",
      "encheres",
      "energie_recharge",
      "estimation",
      "event_bus",
      "finance",
      "financial_intelligence",
      "garage",
      "identity",
      "importafrica",
      "indexation",
      "intelligences",
      "journey",
      "knowledge",
      "language",
      "livraison",
      "livraison_vehicule",
      "location",
      "location_particulier",
      "location_pro",
      "marketing",
      "media",
      "media_authenticity",
      "messaging",
      "monitoring",
      "notification",
      "partner_engine",
      "payment",
      "payment_orchestrator",
      "permission",
      "pieces",
      "politique_pays",
      "pro_account",
      "pro_portal",
      "product_engine",
      "proximity_engine",
      "rd_lab",
      "redirection",
      "resilience",
      "risque_import",
      "scheduler",
      "search",
      "seo",
      "smart",
      "smart_audit",
      "support",
      "transport",
      "vente",
      "vente_officiel",
      "vente_particulier",
      "vente_pro",
      "visibility",
      "vo",
      "vo_engine",
      "vo_espaces",
      "workflow"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "accueil_intelligences_ouvrir",
        "libelle": "Ouvrir MKA.P-MS Intelligences (à côté du micro)",
        "genre": "formulaire",
        "ecran": "/",
        "fichier": "",
        "ligne": 0
      },
      {
        "code": "accueil_livraison_vehicule",
        "libelle": "Faire livrer un véhicule ou un camion (accueil)",
        "genre": "navigation",
        "ecran": "/",
        "fichier": "",
        "ligne": 0
      }
    ],
    "routes": [
      "/",
      "/admin",
      "/admin/moteurs",
      "/mk-global-engine",
      "/superadmin",
      "/superadmin/core-engine-beta"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/EngineRegistry/ControlCenter.tsx",
        "routes": [
          "/admin/moteurs"
        ],
        "cliquables": 12,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 78,
        "mots": 561
      },
      {
        "fichier": "client/src/pages/GlobalCountryEngine.tsx",
        "routes": [
          "/mk-global-engine"
        ],
        "cliquables": 19,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 209,
        "mots": 685
      },
      {
        "fichier": "client/src/pages/superadmin/CoreEngineBeta.tsx",
        "routes": [
          "/superadmin/core-engine-beta"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 48,
        "mots": 180
      },
      {
        "fichier": "client/src/pages/superadmin/SuperAdminDashboard.tsx",
        "routes": [
          "/superadmin"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 22,
        "mots": 44
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/particulier/vehicule/:id",
        "composants": [
          "trpc.meta"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/professionnel/vehicule/:id",
        "composants": [
          "trpc.meta"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/mkapms-officiel/vehicule/:id",
        "composants": [
          "trpc.meta"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/vehicule/:id",
        "composants": [
          "trpc.meta"
        ]
      },
      {
        "fichier": "client/src/pages/Univers.tsx",
        "route": "/univers",
        "composants": [
          "trpc.modules"
        ]
      },
      {
        "fichier": "client/src/pages/Aide.tsx",
        "route": "/aide",
        "composants": [
          "trpc.meta"
        ]
      },
      {
        "fichier": "client/src/pages/Confidentialite.tsx",
        "route": "/confidentialite",
        "composants": [
          "trpc.meta"
        ]
      },
      {
        "fichier": "client/src/pages/SuppressionCompte.tsx",
        "route": "/suppression-compte",
        "composants": [
          "trpc.meta"
        ]
      },
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.modules",
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminLocation.tsx",
        "route": "/superadmin/admin-location",
        "composants": [
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminVente.tsx",
        "route": "/superadmin/admin-vente",
        "composants": [
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminValidationDocs.tsx",
        "route": "/superadmin/admin-validation-docs",
        "composants": [
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/SmartEngine/ControlCenter.tsx",
        "route": "/superadmin/smart-engine",
        "composants": [
          "trpc.engineRegistry"
        ]
      },
      {
        "fichier": "client/src/pages/SuppressionCompte.tsx",
        "route": "/utilisateurs/suppression-compte",
        "composants": [
          "trpc.meta"
        ]
      }
    ],
    "procedures": [
      "addCountry",
      "adminList",
      "adminStats",
      "annoncesAll",
      "annoncesPending",
      "auditLog",
      "certifyVehicle",
      "communications",
      "create",
      "createCourse",
      "createDepot",
      "createKey",
      "createLink",
      "createListing",
      "createOrder",
      "createPromo",
      "createRule",
      "createShipment",
      "createStaff",
      "createSupplier",
      "currency",
      "dashboard",
      "decideDeletion",
      "decidePubRequest",
      "delete",
      "deleteAnnonce",
      "deletePromo",
      "deletePubRequest",
      "deleteUser",
      "deletionRequests",
      "emitEvent",
      "enroll",
      "garagesPending",
      "getCatalogue",
      "getCourse",
      "getExecutions",
      "getMyRecommendations",
      "getOrchestrationDashboard",
      "getOrchestrationLog",
      "getPredictions",
      "getRecommendationsForEvent",
      "getReports",
      "getRules",
      "getUsage",
      "health",
      "homeStats",
      "indexEntity",
      "intelligence",
      "kpis",
      "kycDocuments",
      "kycPending",
      "legal",
      "list",
      "listCountries",
      "listCourses",
      "listDepots",
      "listEvents",
      "listKeys",
      "listLinks",
      "listListings",
      "listShipments",
      "logBehavior",
      "logs",
      "markClicked",
      "markSeen",
      "meta",
      "moderateAnnonce",
      "myEnrollments",
      "myOrders",
      "mySales",
      "overview",
      "paymentsList",
      "promoList",
      "pubRequestDetail",
      "pubRequestsList",
      "removeEntity",
      "requestUserDeletion",
      "reservationsList",
      "revokeKey",
      "search",
      "setStatus",
      "setUserRole",
      "staffList",
      "stats",
      "status",
      "submitExam",
      "supervision",
      "ticketsList",
      "update",
      "updateCountry",
      "updateHealth",
      "updateProgress",
      "updatePromo",
      "updateRule",
      "updateShipmentStatus",
      "updateSupplier",
      "upload",
      "usersList",
      "validateGarage",
      "validateKyc",
      "writeLog"
    ],
    "tables": [
      "account_deletion_requests",
      "admin_logs",
      "alerts",
      "annonce_options",
      "annonce_photos",
      "annonces",
      "app_feedback",
      "audit_logs",
      "bookings",
      "ce_ai_predictions",
      "ce_ai_reports",
      "ce_api_keys",
      "ce_api_usage_logs",
      "ce_automation_actions",
      "ce_automation_events",
      "ce_b2b_listings",
      "ce_b2b_orders",
      "ce_distribution_depots",
      "ce_distribution_shipments",
      "ce_document_vault",
      "ce_ecosystem_links",
      "ce_engine_health",
      "ce_engine_logs",
      "ce_expansion_countries",
      "ce_formation_courses",
      "ce_formation_enrollments",
      "ce_formation_exams",
      "ce_formation_modules",
      "ce_orchestration_log",
      "ce_recommendations",
      "ce_search_index",
      "ce_service_rules",
      "ce_strategic_partners",
      "ce_supplier_catalogue",
      "ce_suppliers",
      "ce_user_behavior",
      "ce_workflow_executions",
      "ce_workflows",
      "change_requests",
      "cities",
      "clients",
      "conversations",
      "countries",
      "country_rules",
      "currencies",
      "delivery_pricing",
      "devis",
      "devis_garage_requests",
      "devis_items",
      "document_types",
      "document_verifications",
      "factures",
      "favoris",
      "finance_documents",
      "finance_transactions",
      "garages",
      "garages_publics",
      "invoices",
      "kyc_documents",
      "kyc_profiles",
      "languages",
      "location_calendar",
      "locations",
      "message_threads",
      "messages",
      "modules",
      "newsletter_subscribers",
      "notifications",
      "parts_catalog",
      "parts_compatibility",
      "parts_invoices",
      "parts_order_items",
      "parts_order_tracking",
      "parts_orders",
      "parts_shops",
      "parts_sites",
      "parts_stock",
      "payments",
      "permissions",
      "pieces",
      "plate_lookups",
      "platform_settings",
      "quotes",
      "rdv_fidelite",
      "rdv_garage",
      "rental_applications",
      "reports",
      "reviews",
      "role_permissions",
      "roles",
      "saved_searches",
      "service_tracking",
      "sessions",
      "settings",
      "staff_profiles",
      "subscription_reminders",
      "subscriptions",
      "support_tickets",
      "uploads",
      "user_assurances",
      "user_blocks",
      "user_documents",
      "users",
      "vehicle_availability_subscriptions",
      "vehicule_dossiers",
      "vehicule_historique",
      "vehicules"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "pdg",
      "public"
    ],
    "textes": 357,
    "mots": 1470,
    "battement": "contrat",
    "manques": [
      {
        "genre": "bouton_declare_absent_ecran",
        "detail": "accueil_intelligences_ouvrir déclaré pour / mais aucun écran ne l'utilise"
      },
      {
        "genre": "bouton_declare_absent_ecran",
        "detail": "accueil_livraison_vehicule déclaré pour / mais aucun écran ne l'utilise"
      }
    ]
  },
  {
    "moteur": "country",
    "label": "Country OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "country-os",
      "routers/currency.ts",
      "data/world.ts"
    ],
    "routeurs": [
      "country",
      "countries",
      "currency",
      "platformMap"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "identity"
    ],
    "dependancesDetectees": [
      "core",
      "identity"
    ],
    "dependances": [
      "core",
      "identity"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "country-os/index.ts importe db.ts",
        "country-os/index.ts importe trpc.ts",
        "routers/currency.ts importe trpc.ts"
      ],
      "identity": [
        "country-os/index.ts importe identity-os/contract.ts",
        "country-os/index.ts exige une session Identity (procédure protégée)"
      ]
    },
    "dependants": [
      "accounting_marketplace",
      "achat",
      "achat_officiel",
      "achat_particulier",
      "achat_pro",
      "auction_engine",
      "avis_reputation",
      "command_center",
      "connaissance_auto",
      "document",
      "energie_recharge",
      "garage",
      "identity",
      "importafrica",
      "knowledge",
      "language",
      "livraison_vehicule",
      "location",
      "location_particulier",
      "location_pro",
      "partner_engine",
      "payment",
      "payment_orchestrator",
      "politique_pays",
      "pro_account",
      "pro_portal",
      "proximity_engine",
      "rd_lab",
      "resilience",
      "risque_import",
      "seo",
      "smart",
      "vente",
      "vo_engine",
      "vo_espaces"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/carte",
      "/expansion",
      "/expansion/centre-international",
      "/expansion/multi-devises-global",
      "/expansion/multi-langues-global",
      "/expansion/phase-afrique-centrale",
      "/expansion/phase-afrique-est",
      "/expansion/phase-afrique-nord",
      "/expansion/phase-afrique-ouest",
      "/expansion/phase-amerique-latine",
      "/expansion/phase-amerique-nord",
      "/expansion/phase-asie",
      "/expansion/phase-europe",
      "/expansion/phase-europe-franco",
      "/expansion/phase-france",
      "/expansion/phase-moyen-orient",
      "/expansion/phase-oceanie",
      "/expansion/tableau-bord-mondial",
      "/expansion/vision-finale",
      "/international",
      "/international/multi-devises",
      "/international/multi-langues",
      "/international/multi-pays",
      "/superadmin/admin-carte-moniale",
      "/superadmin/country-os"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CarteMondiale.tsx",
        "routes": [
          "/carte"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 31
      },
      {
        "fichier": "client/src/pages/MosControlCenter/EngineControlCenter.tsx",
        "routes": [
          "/superadmin/country-os"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 35
      },
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/expansion",
          "/international"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/expansion/CentreInternational.tsx",
        "routes": [
          "/expansion/centre-international"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/expansion/MultiDevisesGlobal.tsx",
        "routes": [
          "/expansion/multi-devises-global"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/expansion/MultiLanguesGlobal.tsx",
        "routes": [
          "/expansion/multi-langues-global"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/expansion/PhaseAfriqueCentrale.tsx",
        "routes": [
          "/expansion/phase-afrique-centrale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/expansion/PhaseAfriqueEst.tsx",
        "routes": [
          "/expansion/phase-afrique-est"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/expansion/PhaseAfriqueNord.tsx",
        "routes": [
          "/expansion/phase-afrique-nord"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/expansion/PhaseAfriqueOuest.tsx",
        "routes": [
          "/expansion/phase-afrique-ouest"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/expansion/PhaseAmeriqueLatine.tsx",
        "routes": [
          "/expansion/phase-amerique-latine"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/expansion/PhaseAmeriqueNord.tsx",
        "routes": [
          "/expansion/phase-amerique-nord"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/expansion/PhaseAsie.tsx",
        "routes": [
          "/expansion/phase-asie"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/expansion/PhaseEurope.tsx",
        "routes": [
          "/expansion/phase-europe"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/expansion/PhaseEuropeFranco.tsx",
        "routes": [
          "/expansion/phase-europe-franco"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/expansion/PhaseFrance.tsx",
        "routes": [
          "/expansion/phase-france"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/expansion/PhaseMoyenOrient.tsx",
        "routes": [
          "/expansion/phase-moyen-orient"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/expansion/PhaseOceanie.tsx",
        "routes": [
          "/expansion/phase-oceanie"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/expansion/TableauBordMondial.tsx",
        "routes": [
          "/expansion/tableau-bord-mondial"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/expansion/VisionFinale.tsx",
        "routes": [
          "/expansion/vision-finale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/international/MultiDevises.tsx",
        "routes": [
          "/international/multi-devises"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/international/MultiLangues.tsx",
        "routes": [
          "/international/multi-langues"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/international/MultiPays.tsx",
        "routes": [
          "/international/multi-pays"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/superadmin/AdminCarteMoniale.tsx",
        "routes": [
          "/superadmin/admin-carte-moniale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 21
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/LocationParticulier.tsx",
        "route": "/louer/particulier",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/LocationPro.tsx",
        "route": "/louer/pro",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/LocationMKAPMS.tsx",
        "route": "/louer/mkapms",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/PaiementVehicule.tsx",
        "route": "/paiement-vehicule/:id",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/VenteParticulier.tsx",
        "route": "/acheter/particulier",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/VentePro.tsx",
        "route": "/acheter/professionnel",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/VenteMKAPMS.tsx",
        "route": "/acheter/mkapms-officiel",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Abonnements.tsx",
        "route": "/vente/abonnements",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/particulier/vehicule/:id",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/professionnel/vehicule/:id",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/mkapms-officiel/vehicule/:id",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/vehicule/:id",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vendre.tsx",
        "route": "/vendre",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Garages.tsx",
        "route": "/garages",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Abonnements.tsx",
        "route": "/abonnements",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Confidentialite.tsx",
        "route": "/confidentialite",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/InscriptionProVO.tsx",
        "route": "/inscription-pro-vo",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.countries",
          "trpc.platformMap"
        ]
      },
      {
        "fichier": "client/src/pages/VoitureOccasion.tsx",
        "route": "/voiture-occasion",
        "composants": [
          "lib/currency.tsx"
        ]
      }
    ],
    "procedures": [
      "controlCenterFeed",
      "currencies",
      "dashboard",
      "disable",
      "get",
      "healthStatus",
      "list",
      "meta",
      "rates",
      "upsert"
    ],
    "tables": [
      "country_countries",
      "country_currencies",
      "country_health_log"
    ],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 93,
    "mots": 289,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/CentreInternational.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/MultiDevisesGlobal.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/MultiLanguesGlobal.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseAfriqueCentrale.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseAfriqueEst.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseAfriqueNord.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseAfriqueOuest.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseAmeriqueLatine.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseAmeriqueNord.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseAsie.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseEurope.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseEuropeFranco.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseFrance.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseMoyenOrient.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/PhaseOceanie.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/TableauBordMondial.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/expansion/VisionFinale.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/international/MultiDevises.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/international/MultiLangues.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/international/MultiPays.tsx (2 texte(s))"
      }
    ]
  },
  {
    "moteur": "depannage",
    "label": "Dépannage Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/depannage.ts",
      "routers/depannage.ts"
    ],
    "routeurs": [
      "depannage"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "avis_reputation",
      "core",
      "identity",
      "notification",
      "payment",
      "proximity_engine",
      "scheduler"
    ],
    "dependancesDetectees": [
      "avis_reputation",
      "core",
      "identity",
      "notification",
      "payment"
    ],
    "dependances": [
      "avis_reputation",
      "core",
      "identity",
      "notification",
      "payment",
      "proximity_engine",
      "scheduler"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "avis_reputation": [
        "routers/depannage.ts importe reputation-engine/service.ts"
      ],
      "core": [
        "routers/depannage.ts importe trpc.ts",
        "routers/depannage.ts importe db.ts",
        "routers/depannage.ts importe schema.ts"
      ],
      "identity": [
        "routers/depannage.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/depannage.ts importe notification-os/triggers.ts",
        "routers/depannage.ts déclenche notifyEvent"
      ],
      "payment": [
        "routers/depannage.ts importe payment-engine/checkout.ts"
      ]
    },
    "dependants": [
      "avis_reputation",
      "garage"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/depannage",
      "/louer/assistance",
      "/superadmin/admin-depannage"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/AssistanceSinistre.tsx",
        "routes": [
          "/louer/assistance"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 4,
        "textes": 22,
        "mots": 59
      },
      {
        "fichier": "client/src/pages/Depannage.tsx",
        "routes": [
          "/depannage"
        ],
        "cliquables": 14,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 79,
        "mots": 343
      },
      {
        "fichier": "client/src/pages/superadmin/AdminDepannage.tsx",
        "routes": [
          "/superadmin/admin-depannage"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 23
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/garage/DepannageGarage.tsx",
        "route": "/garage/depannage-garage",
        "composants": [
          "trpc.depannage"
        ]
      }
    ],
    "procedures": [
      "completeMission",
      "createRequest",
      "myRequests",
      "payQuote",
      "providers",
      "quotes",
      "registerProvider",
      "sendQuote",
      "startMission"
    ],
    "tables": [
      "breakdown_missions",
      "breakdown_providers",
      "breakdown_quotes",
      "breakdown_requests"
    ],
    "acces": [
      "connecte",
      "public"
    ],
    "textes": 111,
    "mots": 425,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Appeler » client/src/pages/AssistanceSinistre.tsx:47"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Modifier » client/src/pages/AssistanceSinistre.tsx:77"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Photo » client/src/pages/AssistanceSinistre.tsx:90"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Envoyer la demande d'assistance » client/src/pages/AssistanceSinistre.tsx:98"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "scheduler"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "proximity_engine"
      }
    ]
  },
  {
    "moteur": "document",
    "label": "Document OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "document-os"
    ],
    "routeurs": [
      "documentOs",
      "documents",
      "dossiers"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "country",
      "identity",
      "language"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "identity",
      "language"
    ],
    "dependances": [
      "core",
      "country",
      "identity",
      "language"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "document-os/index.ts importe db.ts",
        "document-os/index.ts importe trpc.ts",
        "client/src/pages/superadmin/AdminValidationDocs.tsx appelle trpc.admin"
      ],
      "country": [
        "document-os/index.ts importe country-os/index.ts",
        "document-os/index.ts lit la règle pays"
      ],
      "identity": [
        "document-os/index.ts importe identity-os/contract.ts",
        "document-os/index.ts exige une session Identity (procédure protégée)",
        "client/src/pages/CentreDocuments.tsx appelle trpc.kyc"
      ],
      "language": [
        "document-os/index.ts importe language-os/index.ts"
      ]
    },
    "dependants": [
      "assurance",
      "cartegrise",
      "comptabilite",
      "contract",
      "finance",
      "importafrica",
      "media_authenticity",
      "vo_espaces"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/catalogue-technique",
      "/documents",
      "/dossier-vehicule-numerique",
      "/louer/controle-documents",
      "/superadmin/admin-validation-docs",
      "/superadmin/document-os",
      "/superadmin/validation-documents-complete",
      "/vente/documents-societe"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CatalogueTechnique.tsx",
        "routes": [
          "/catalogue-technique"
        ],
        "cliquables": 14,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 233,
        "mots": 646
      },
      {
        "fichier": "client/src/pages/CentreDocuments.tsx",
        "routes": [
          "/documents",
          "/vente/documents-societe"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 27,
        "mots": 82
      },
      {
        "fichier": "client/src/pages/ControleDocuments.tsx",
        "routes": [
          "/louer/controle-documents"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 16,
        "mots": 61
      },
      {
        "fichier": "client/src/pages/DossierVehiculeNumerique.tsx",
        "routes": [
          "/dossier-vehicule-numerique"
        ],
        "cliquables": 10,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 41,
        "mots": 140
      },
      {
        "fichier": "client/src/pages/MosControlCenter/EngineControlCenter.tsx",
        "routes": [
          "/superadmin/document-os"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 35
      },
      {
        "fichier": "client/src/pages/superadmin/AdminValidationDocs.tsx",
        "routes": [
          "/superadmin/admin-validation-docs"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 14,
        "mots": 80
      },
      {
        "fichier": "client/src/pages/superadmin/ValidationDocumentsComplete.tsx",
        "routes": [
          "/superadmin/validation-documents-complete"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 12,
        "mots": 34
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.documents",
          "trpc.dossiers"
        ]
      }
    ],
    "procedures": [
      "controlCenterFeed",
      "create",
      "dashboard",
      "get",
      "healthStatus",
      "history",
      "meta",
      "mine",
      "record",
      "render",
      "sign",
      "types",
      "updateStatus",
      "upsert",
      "verify"
    ],
    "tables": [
      "doc_document_history",
      "doc_documents",
      "doc_health_log",
      "doc_templates",
      "doc_types"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 358,
    "mots": 1078,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Ajouter » client/src/pages/ControleDocuments.tsx:82"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Corriger » client/src/pages/ControleDocuments.tsx:85"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/ControleDocuments.tsx:94"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Valider » client/src/pages/superadmin/ValidationDocumentsComplete.tsx:38"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Refuser » client/src/pages/superadmin/ValidationDocumentsComplete.tsx:38"
      }
    ]
  },
  {
    "moteur": "encheres",
    "label": "Enchères Engine",
    "categorie": "service",
    "etatDeclare": "active",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "auction_engine",
      "core",
      "payment"
    ],
    "dependancesDetectees": [],
    "dependances": [
      "auction_engine",
      "core",
      "payment"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {},
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/acheter/encheres",
      "/encheres"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/VenteEncheres.tsx",
        "routes": [
          "/acheter/encheres"
        ],
        "cliquables": 38,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 221,
        "mots": 682
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 221,
    "mots": 682,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "auction_engine"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "energie_recharge",
    "label": "Energy Engine — Recharge",
    "categorie": "service",
    "etatDeclare": "active",
    "dossiers": [
      "charging-engine"
    ],
    "routeurs": [
      "chargingEngine"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "country",
      "notification"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "notification"
    ],
    "dependances": [
      "core",
      "country",
      "notification"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "charging-engine/index.ts importe trpc.ts",
        "charging-engine/service.ts importe db.ts"
      ],
      "country": [
        "charging-engine/service.ts importe country-os/index.ts"
      ],
      "notification": [
        "charging-engine/service.ts importe notification-os/triggers.ts"
      ]
    },
    "dependants": [
      "rd_lab",
      "risque_import"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/labs/energy-recharge"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/labs/EnergyRecharge.tsx",
        "routes": [
          "/labs/energy-recharge"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 33,
        "mots": 162
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "bornes",
      "catalog",
      "declarer",
      "examiner",
      "health",
      "rechercher"
    ],
    "tables": [
      "charging_points"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "public"
    ],
    "textes": 33,
    "mots": 162,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "estimation",
    "label": "Estimation Hub",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "estimation-hub"
    ],
    "routeurs": [
      "estimation"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "event_bus",
      "livraison_vehicule",
      "pieces",
      "risque_import",
      "smart",
      "vo",
      "vo_engine"
    ],
    "dependancesDetectees": [
      "core",
      "event_bus",
      "livraison_vehicule",
      "pieces",
      "risque_import",
      "smart",
      "vo_engine"
    ],
    "dependances": [
      "core",
      "event_bus",
      "livraison_vehicule",
      "pieces",
      "risque_import",
      "smart",
      "vo",
      "vo_engine"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "estimation-hub/index.ts importe trpc.ts",
        "estimation-hub/service.ts importe db.ts",
        "estimation-hub/service.ts importe schema.ts"
      ],
      "event_bus": [
        "estimation-hub/service.ts importe event-bus/service.ts",
        "estimation-hub/service.ts publie des événements"
      ],
      "livraison_vehicule": [
        "estimation-hub/service.ts importe vehicle-delivery/service.ts"
      ],
      "pieces": [
        "estimation-hub/service.ts importe modules/pieces.ts"
      ],
      "risque_import": [
        "estimation-hub/service.ts importe import-risk/service.ts"
      ],
      "smart": [
        "publie estimation.incomplete, consommé par smart"
      ],
      "vo_engine": [
        "estimation-hub/service.ts importe vo-engine/service.ts"
      ]
    },
    "dependants": [
      "achat",
      "achat_officiel",
      "achat_particulier",
      "achat_pro"
    ],
    "evenementsPublies": [
      "estimation.incomplete"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "estimation"
    ],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/particulier/vehicule/:id",
        "composants": [
          "components/CoutTotalEstime.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/professionnel/vehicule/:id",
        "composants": [
          "components/CoutTotalEstime.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/mkapms-officiel/vehicule/:id",
        "composants": [
          "components/CoutTotalEstime.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/vehicule/:id",
        "composants": [
          "components/CoutTotalEstime.tsx"
        ]
      }
    ],
    "procedures": [
      "complete",
      "etatMoteur"
    ],
    "tables": [],
    "acces": [
      "public"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "vo"
      }
    ]
  },
  {
    "moteur": "event_bus",
    "label": "Bus d'événements central",
    "categorie": "core",
    "etatDeclare": "active",
    "dossiers": [
      "event-bus"
    ],
    "routeurs": [
      "eventBus"
    ],
    "fichiersServeur": 5,
    "dependancesDeclarees": [
      "audit",
      "core",
      "intelligences",
      "product_engine",
      "seo",
      "smart"
    ],
    "dependancesDetectees": [
      "audit",
      "core",
      "intelligences",
      "product_engine",
      "seo",
      "smart"
    ],
    "dependances": [
      "audit",
      "core",
      "intelligences",
      "product_engine",
      "seo",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "audit": [
        "event-bus/handlers.ts importe audit-os/index.ts"
      ],
      "core": [
        "event-bus/handlers.ts importe db.ts",
        "event-bus/index.ts importe trpc.ts",
        "event-bus/service.ts importe db.ts"
      ],
      "intelligences": [
        "event-bus/handlers.ts importe intelligences/memoire.ts",
        "event-bus/handlers.ts charge intelligences/service.ts"
      ],
      "product_engine": [
        "event-bus/handlers.ts importe product-engine/service.ts"
      ],
      "seo": [
        "event-bus/handlers.ts importe seo-hooks.ts"
      ],
      "smart": [
        "event-bus/handlers.ts importe smart-engine/schema.ts",
        "event-bus/handlers.ts importe smart-engine/services/alert-engine.ts",
        "event-bus/handlers.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [
      "achat",
      "atelier",
      "auto_branchement",
      "boutons",
      "continuous_test",
      "estimation",
      "intelligences",
      "livraison_vehicule",
      "media_authenticity",
      "monitoring",
      "payment",
      "pieces",
      "product_engine",
      "risque_import",
      "seo",
      "smart"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "pdg"
    ],
    "boutons": [],
    "routes": [
      "/admin/bus-evenements"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreBusEvenements.tsx",
        "routes": [
          "/admin/bus-evenements"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 20,
        "mots": 127
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "basculerAbonnement",
      "catalogue",
      "distribuer",
      "observabilite",
      "passes",
      "publier",
      "remises"
    ],
    "tables": [
      "eb_deliveries",
      "eb_dispatch_runs",
      "eb_subscriptions"
    ],
    "acces": [
      "admin"
    ],
    "textes": 20,
    "mots": 127,
    "battement": "sonde",
    "manques": [
      {
        "genre": "emission_dynamique",
        "detail": "1 émission(s) au type calculé, non vérifiable statiquement"
      }
    ]
  },
  {
    "moteur": "finance",
    "label": "Financement Engine",
    "categorie": "service",
    "etatDeclare": "active",
    "dossiers": [
      "modules/financeplus.ts"
    ],
    "routeurs": [],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "accounting_internal",
      "core",
      "document",
      "identity",
      "payment"
    ],
    "dependancesDetectees": [],
    "dependances": [
      "accounting_internal",
      "core",
      "document",
      "identity",
      "payment"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {},
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/finance",
      "/finance/acompte-finance",
      "/finance/alertes-paiements",
      "/finance/centre-echeancier",
      "/finance/centre-factures",
      "/finance/contrats-financiers",
      "/finance/depot-garantie-finance",
      "/finance/garantie-securite",
      "/finance/l-o-a-finance",
      "/finance/objectif-finance",
      "/finance/paiement-comptant",
      "/finance/paiement-fractionne",
      "/finance/paiements-professionnels",
      "/finance/remboursements-finance",
      "/finance/tableau-bord-finance"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/finance/AcompteFinance.tsx",
        "routes": [
          "/finance/acompte-finance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/finance/AlertesPaiements.tsx",
        "routes": [
          "/finance/alertes-paiements"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/finance/CentreEcheancier.tsx",
        "routes": [
          "/finance/centre-echeancier"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/finance/CentreFactures.tsx",
        "routes": [
          "/finance/centre-factures"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/finance/ContratsFinanciers.tsx",
        "routes": [
          "/finance/contrats-financiers"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/finance/DepotGarantieFinance.tsx",
        "routes": [
          "/finance/depot-garantie-finance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/finance/FinanceGenerale.tsx",
        "routes": [
          "/finance"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 22
      },
      {
        "fichier": "client/src/pages/finance/GarantieSecurite.tsx",
        "routes": [
          "/finance/garantie-securite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/finance/LOAFinance.tsx",
        "routes": [
          "/finance/l-o-a-finance"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 4,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/finance/ObjectifFinance.tsx",
        "routes": [
          "/finance/objectif-finance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/finance/PaiementComptant.tsx",
        "routes": [
          "/finance/paiement-comptant"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 6,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/finance/PaiementFractionne.tsx",
        "routes": [
          "/finance/paiement-fractionne"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 6,
        "mots": 18
      },
      {
        "fichier": "client/src/pages/finance/PaiementsProfessionnels.tsx",
        "routes": [
          "/finance/paiements-professionnels"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/finance/RemboursementsFinance.tsx",
        "routes": [
          "/finance/remboursements-finance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/finance/TableauBordFinance.tsx",
        "routes": [
          "/finance/tableau-bord-finance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 12
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [
      "finplus_action_logs",
      "finplus_contrats",
      "finplus_documents",
      "finplus_notifications",
      "finplus_paiements",
      "finplus_vehicules"
    ],
    "acces": [],
    "textes": 55,
    "mots": 148,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/AcompteFinance.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/AlertesPaiements.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/CentreEcheancier.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/CentreFactures.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/ContratsFinanciers.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/DepotGarantieFinance.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/GarantieSecurite.tsx (3 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Simuler ma LOA » client/src/pages/finance/LOAFinance.tsx:9"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/LOAFinance.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/ObjectifFinance.tsx (3 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Payer par carte » client/src/pages/finance/PaiementComptant.tsx:9"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Payer par virement » client/src/pages/finance/PaiementComptant.tsx:10"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Valider le paiement » client/src/pages/finance/PaiementFractionne.tsx:17"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/PaiementsProfessionnels.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/RemboursementsFinance.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/finance/TableauBordFinance.tsx (3 texte(s))"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "identity"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "document"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "accounting_internal"
      }
    ]
  },
  {
    "moteur": "financial_intelligence",
    "label": "Financial Intelligence Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "financial-intelligence"
    ],
    "routeurs": [
      "financialIntelligence"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "comptabilite",
      "core",
      "notification",
      "payment"
    ],
    "dependancesDetectees": [
      "core",
      "notification"
    ],
    "dependances": [
      "comptabilite",
      "core",
      "notification",
      "payment"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "financial-intelligence/detectors.ts importe db.ts",
        "financial-intelligence/index.ts importe trpc.ts",
        "financial-intelligence/service.ts importe db.ts"
      ],
      "notification": [
        "financial-intelligence/service.ts importe notification-os/triggers.ts"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [],
    "procedures": [
      "analyze",
      "detectors",
      "health",
      "list",
      "resolve"
    ],
    "tables": [
      "finance_anomalies"
    ],
    "acces": [
      "admin"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "comptabilite"
      },
      {
        "genre": "sans_ecran",
        "detail": "aucune route client ne mène à ce moteur"
      }
    ]
  },
  {
    "moteur": "garage",
    "label": "Garage Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "routers/garages.ts"
    ],
    "routeurs": [
      "garages"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "achat",
      "atelier",
      "avis_reputation",
      "boutons",
      "core",
      "country",
      "depannage",
      "identity",
      "notification",
      "payment",
      "scheduler",
      "support",
      "visibility"
    ],
    "dependancesDetectees": [
      "achat",
      "atelier",
      "avis_reputation",
      "boutons",
      "core",
      "country",
      "depannage",
      "identity",
      "notification",
      "scheduler",
      "support",
      "visibility"
    ],
    "dependances": [
      "achat",
      "atelier",
      "avis_reputation",
      "boutons",
      "core",
      "country",
      "depannage",
      "identity",
      "notification",
      "payment",
      "scheduler",
      "support",
      "visibility"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/Garages.tsx appelle trpc.devis",
        "client/src/pages/garage/CarrosserieGarage.tsx appelle trpc.devis",
        "client/src/pages/garage/DemandeDevis.tsx appelle trpc.devis"
      ],
      "atelier": [
        "routers/garages.ts importe atelier-engine/service.ts"
      ],
      "avis_reputation": [
        "routers/garages.ts importe reputation-engine/service.ts"
      ],
      "boutons": [
        "client/src/pages/garage/ContratsFlottes.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/garage/ContratsFlottes.tsx utilise BoutonMoteur",
        "client/src/pages/garage/DepannageGarage.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      ],
      "core": [
        "routers/garages.ts importe trpc.ts",
        "routers/garages.ts importe db.ts",
        "routers/garages.ts importe schema.ts"
      ],
      "country": [
        "client/src/pages/Garages.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "depannage": [
        "client/src/pages/garage/DepannageGarage.tsx appelle trpc.depannage"
      ],
      "identity": [
        "routers/garages.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/garages.ts importe notification-os/triggers.ts",
        "routers/garages.ts déclenche notifyEvent"
      ],
      "scheduler": [
        "routers/garages.ts importe scheduler-os/index.ts"
      ],
      "support": [
        "client/src/pages/garage/CentreReclamations.tsx appelle trpc.support"
      ],
      "visibility": [
        "routers/garages.ts importe visibility-os/index.ts"
      ]
    },
    "dependants": [
      "atelier",
      "seo"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "garage_contrat_flotte_souscrire",
        "libelle": "Souscrire un contrat de flotte",
        "genre": "navigation",
        "ecran": "/garage/contrats-flottes",
        "fichier": "client/src/pages/garage/ContratsFlottes.tsx",
        "ligne": 26
      },
      {
        "code": "garage_depannage_appel",
        "libelle": "Appel d'urgence dépannage",
        "genre": "non_branchee",
        "ecran": "/garage/depannage-garage",
        "fichier": "client/src/pages/garage/DepannageGarage.tsx",
        "ligne": 51
      },
      {
        "code": "garage_depannage_demande",
        "libelle": "Demander un dépanneur",
        "genre": "formulaire",
        "ecran": "/garage/depannage-garage",
        "fichier": "client/src/pages/garage/DepannageGarage.tsx",
        "ligne": 107
      },
      {
        "code": "garage_depannage_photo",
        "libelle": "Joindre une photo à la demande de dépannage",
        "genre": "non_branchee",
        "ecran": "/garage/depannage-garage",
        "fichier": "client/src/pages/garage/DepannageGarage.tsx",
        "ligne": 99
      },
      {
        "code": "garage_historique_devis",
        "libelle": "Demander un devis pour ce véhicule",
        "genre": "navigation",
        "ecran": "/garage/historique-garage",
        "fichier": "client/src/pages/garage/HistoriqueGarage.tsx",
        "ligne": 85
      },
      {
        "code": "garage_historique_facture",
        "libelle": "Facture de l'intervention",
        "genre": "non_branchee",
        "ecran": "/garage/historique-garage",
        "fichier": "client/src/pages/garage/HistoriqueGarage.tsx",
        "ligne": 91
      },
      {
        "code": "garage_historique_suivi",
        "libelle": "Suivre l'intervention",
        "genre": "navigation",
        "ecran": "/garage/historique-garage",
        "fichier": "client/src/pages/garage/HistoriqueGarage.tsx",
        "ligne": 79
      }
    ],
    "routes": [
      "/garage",
      "/garage-auto",
      "/garage-plus",
      "/garage/assistance-routiere",
      "/garage/boutique-pieces",
      "/garage/carrosserie-garage",
      "/garage/centre-lavage",
      "/garage/centre-reclamations",
      "/garage/commande-pieces",
      "/garage/contrats-flottes",
      "/garage/demande-devis",
      "/garage/depannage-avance",
      "/garage/depannage-garage",
      "/garage/diagnostic-avance",
      "/garage/diagnostic-garage",
      "/garage/dossiers-flottes",
      "/garage/entretiens-preventifs",
      "/garage/esthetique-auto",
      "/garage/flottes-entreprises",
      "/garage/fournisseurs-garage",
      "/garage/garage-particulier",
      "/garage/garage-professionnel",
      "/garage/garantie-travaux",
      "/garage/historique-garage",
      "/garage/lavage-preparation",
      "/garage/multi-garages",
      "/garage/objectif-final-garage",
      "/garage/objectif-garage",
      "/garage/panier-pieces",
      "/garage/photos-intervention",
      "/garage/photos-techniques",
      "/garage/pneumatiques",
      "/garage/pneumatiques-avance",
      "/garage/preparation-vente-v-o",
      "/garage/prise-rendez-vous",
      "/garage/recherche-pieces",
      "/garage/relance-client",
      "/garage/reseau-partenaires",
      "/garage/reservation-atelier",
      "/garage/statistiques-garage",
      "/garage/suivi-temps-reel",
      "/garage/transfert-dossiers",
      "/garage/vehicules-attente",
      "/garages",
      "/reparer",
      "/superadmin/admin-garage"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/GarageAuto.tsx",
        "routes": [
          "/garage-auto"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 19
      },
      {
        "fichier": "client/src/pages/GaragePlus.tsx",
        "routes": [
          "/garage-plus"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 52
      },
      {
        "fichier": "client/src/pages/Garages.tsx",
        "routes": [
          "/garages"
        ],
        "cliquables": 18,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 152,
        "mots": 527
      },
      {
        "fichier": "client/src/pages/garage/AssistanceRoutiere.tsx",
        "routes": [
          "/garage/assistance-routiere"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 19
      },
      {
        "fichier": "client/src/pages/garage/BoutiquePieces.tsx",
        "routes": [
          "/garage/boutique-pieces"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 34
      },
      {
        "fichier": "client/src/pages/garage/CarrosserieGarage.tsx",
        "routes": [
          "/garage/carrosserie-garage"
        ],
        "cliquables": 28,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 134,
        "mots": 470
      },
      {
        "fichier": "client/src/pages/garage/CentreLavage.tsx",
        "routes": [
          "/garage/centre-lavage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/garage/CentreReclamations.tsx",
        "routes": [
          "/garage/centre-reclamations"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/garage/CommandePieces.tsx",
        "routes": [
          "/garage/commande-pieces"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 24
      },
      {
        "fichier": "client/src/pages/garage/ContratsFlottes.tsx",
        "routes": [
          "/garage/contrats-flottes"
        ],
        "cliquables": 2,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 6,
        "mots": 49
      },
      {
        "fichier": "client/src/pages/garage/DemandeDevis.tsx",
        "routes": [
          "/garage/demande-devis"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 81
      },
      {
        "fichier": "client/src/pages/garage/DepannageAvance.tsx",
        "routes": [
          "/garage/depannage-avance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 21
      },
      {
        "fichier": "client/src/pages/garage/DepannageGarage.tsx",
        "routes": [
          "/garage/depannage-garage"
        ],
        "cliquables": 5,
        "parMoteur": 3,
        "sansAction": 0,
        "textes": 11,
        "mots": 47
      },
      {
        "fichier": "client/src/pages/garage/DiagnosticAvance.tsx",
        "routes": [
          "/garage/diagnostic-avance"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 4,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/garage/DiagnosticGarage.tsx",
        "routes": [
          "/garage/diagnostic-garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 28
      },
      {
        "fichier": "client/src/pages/garage/DossiersFlottes.tsx",
        "routes": [
          "/garage/dossiers-flottes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/garage/EntretiensPreventifs.tsx",
        "routes": [
          "/garage/entretiens-preventifs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/garage/EsthetiqueAuto.tsx",
        "routes": [
          "/garage/esthetique-auto"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/garage/FlottesEntreprises.tsx",
        "routes": [
          "/garage/flottes-entreprises"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 5,
        "mots": 15
      },
      {
        "fichier": "client/src/pages/garage/FournisseursGarage.tsx",
        "routes": [
          "/garage/fournisseurs-garage"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 7,
        "mots": 15
      },
      {
        "fichier": "client/src/pages/garage/GarageGenerale.tsx",
        "routes": [
          "/garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 19,
        "mots": 63
      },
      {
        "fichier": "client/src/pages/garage/GarageParticulier.tsx",
        "routes": [
          "/garage/garage-particulier"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 13,
        "mots": 28
      },
      {
        "fichier": "client/src/pages/garage/GarageProfessionnel.tsx",
        "routes": [
          "/garage/garage-professionnel"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 26
      },
      {
        "fichier": "client/src/pages/garage/GarantieTravaux.tsx",
        "routes": [
          "/garage/garantie-travaux"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/garage/HistoriqueGarage.tsx",
        "routes": [
          "/garage/historique-garage"
        ],
        "cliquables": 4,
        "parMoteur": 3,
        "sansAction": 0,
        "textes": 9,
        "mots": 19
      },
      {
        "fichier": "client/src/pages/garage/LavagePreparation.tsx",
        "routes": [
          "/garage/lavage-preparation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/garage/MultiGarages.tsx",
        "routes": [
          "/garage/multi-garages"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/garage/ObjectifFinalGarage.tsx",
        "routes": [
          "/garage/objectif-final-garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 23
      },
      {
        "fichier": "client/src/pages/garage/ObjectifGarage.tsx",
        "routes": [
          "/garage/objectif-garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 13,
        "mots": 23
      },
      {
        "fichier": "client/src/pages/garage/PanierPieces.tsx",
        "routes": [
          "/garage/panier-pieces"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 50
      },
      {
        "fichier": "client/src/pages/garage/PhotosIntervention.tsx",
        "routes": [
          "/garage/photos-intervention"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 6,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/garage/PhotosTechniques.tsx",
        "routes": [
          "/garage/photos-techniques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/garage/Pneumatiques.tsx",
        "routes": [
          "/garage/pneumatiques"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 6,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/garage/PneumatiquesAvance.tsx",
        "routes": [
          "/garage/pneumatiques-avance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/garage/PreparationVenteVO.tsx",
        "routes": [
          "/garage/preparation-vente-v-o"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 8,
        "mots": 19
      },
      {
        "fichier": "client/src/pages/garage/PriseRendezVous.tsx",
        "routes": [
          "/garage/prise-rendez-vous"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 13,
        "mots": 40
      },
      {
        "fichier": "client/src/pages/garage/RecherchePieces.tsx",
        "routes": [
          "/garage/recherche-pieces"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 4,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/garage/RelanceClient.tsx",
        "routes": [
          "/garage/relance-client"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/garage/ReseauPartenaires.tsx",
        "routes": [
          "/garage/reseau-partenaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/garage/ReservationAtelier.tsx",
        "routes": [
          "/garage/reservation-atelier"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 49
      },
      {
        "fichier": "client/src/pages/garage/StatistiquesGarage.tsx",
        "routes": [
          "/garage/statistiques-garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 15
      },
      {
        "fichier": "client/src/pages/garage/SuiviTempsReel.tsx",
        "routes": [
          "/garage/suivi-temps-reel"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 18
      },
      {
        "fichier": "client/src/pages/garage/TransfertDossiers.tsx",
        "routes": [
          "/garage/transfert-dossiers"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/garage/VehiculesAttente.tsx",
        "routes": [
          "/garage/vehicules-attente"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 23
      },
      {
        "fichier": "client/src/pages/superadmin/AdminGarage.tsx",
        "routes": [
          "/superadmin/admin-garage"
        ],
        "cliquables": 9,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 15,
        "mots": 31
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/garage/GaragePublicFiche.tsx",
        "route": "/garages/:slug",
        "composants": [
          "trpc.garages"
        ]
      },
      {
        "fichier": "client/src/pages/garage/PlanningAtelier.tsx",
        "route": "/garage/planning-atelier",
        "composants": [
          "trpc.garages"
        ]
      }
    ],
    "procedures": [
      "get",
      "getBySlug",
      "list",
      "myInterventions",
      "planningAtelier",
      "register",
      "reporterRdv",
      "updateIntervention"
    ],
    "tables": [],
    "acces": [
      "connecte",
      "professionnel",
      "public"
    ],
    "textes": 643,
    "mots": 2000,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Rechercher » client/src/pages/garage/CarrosserieGarage.tsx:663"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/professionnel client/src/pages/garage/ContratsFlottes.tsx:15"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Capture écran » client/src/pages/garage/DiagnosticAvance.tsx:17"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Exporter PDF » client/src/pages/garage/DiagnosticAvance.tsx:17"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/garage/DiagnosticAvance.tsx (4 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/flottes client/src/pages/garage/DossiersFlottes.tsx:12"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/professionnel client/src/pages/garage/FlottesEntreprises.tsx:11"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Ajouter un véhicule » client/src/pages/garage/FlottesEntreprises.tsx:17"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Ajouter fournisseur » client/src/pages/garage/FournisseursGarage.tsx:14"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/devis client/src/pages/garage/GarageGenerale.tsx:56"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/devis client/src/pages/garage/GarageParticulier.tsx:25"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/rendez-vous client/src/pages/garage/GarageParticulier.tsx:34"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/devis client/src/pages/garage/GarageProfessionnel.tsx:27"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« {i : } » client/src/pages/garage/PhotosIntervention.tsx:16"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/garage/PhotosTechniques.tsx (2 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Montage + équilibrage » client/src/pages/garage/Pneumatiques.tsx:19"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Pneu seul » client/src/pages/garage/Pneumatiques.tsx:19"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/garage/PreparationVenteVO.tsx:16"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rechercher » client/src/pages/garage/RecherchePieces.tsx:12"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/garage/RecherchePieces.tsx (4 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Envoyer relance » client/src/pages/garage/RelanceClient.tsx:17"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/garage/RelanceClient.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/garage/TransfertDossiers.tsx (2 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Details » client/src/pages/superadmin/AdminGarage.tsx:75"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      }
    ]
  },
  {
    "moteur": "identity",
    "label": "Identity OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "identity-os",
      "auth.ts",
      "routers/auth.ts",
      "routers/kyc.ts",
      "account-deletion",
      "user-preferences"
    ],
    "routeurs": [
      "auth",
      "identity",
      "kyc",
      "suppressionCompte",
      "preferencesUtilisateur"
    ],
    "fichiersServeur": 15,
    "dependancesDeclarees": [
      "account_routing",
      "audit",
      "core",
      "country",
      "language",
      "media_authenticity",
      "notification",
      "smart"
    ],
    "dependancesDetectees": [
      "account_routing",
      "audit",
      "core",
      "country",
      "language",
      "media_authenticity",
      "notification",
      "smart"
    ],
    "dependances": [
      "account_routing",
      "audit",
      "core",
      "country",
      "language",
      "media_authenticity",
      "notification",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "account_routing": [
        "client/src/pages/MonEspace.tsx appelle trpc.accountRouting"
      ],
      "audit": [
        "account-deletion/service.ts importe audit.ts",
        "identity-os/router.ts importe audit.ts",
        "routers/auth.ts importe audit.ts"
      ],
      "core": [
        "account-deletion/index.ts importe trpc.ts",
        "account-deletion/index.ts importe db.ts",
        "account-deletion/index.ts importe schema.ts"
      ],
      "country": [
        "client/src/pages/Confidentialite.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "language": [
        "identity-os/router.ts importe language-os/index.ts"
      ],
      "media_authenticity": [
        "routers/kyc.ts importe media-authenticity/service.ts"
      ],
      "notification": [
        "identity-os/complete.ts importe services/email.ts",
        "identity-os/complete.ts envoie un email",
        "client/src/pages/Parametres.tsx appelle trpc.notificationOs"
      ],
      "smart": [
        "routers/auth.ts importe smart-engine/services/activity-log.ts"
      ]
    },
    "dependants": [
      "account_routing",
      "accounting_marketplace",
      "achat",
      "ai_learning",
      "assurance",
      "audit",
      "avis_reputation",
      "backup",
      "cartegrise",
      "command_center",
      "comptabilite",
      "contract",
      "controle_technique",
      "core",
      "country",
      "depannage",
      "document",
      "finance",
      "garage",
      "importafrica",
      "intelligences",
      "journey",
      "language",
      "livraison",
      "marketing",
      "media",
      "messaging",
      "monitoring",
      "notification",
      "permission",
      "pieces",
      "redirection",
      "resilience",
      "scheduler",
      "search",
      "smart",
      "support",
      "transport",
      "visibility",
      "vo_espaces",
      "workflow"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/demandes-suppression",
      "/compte",
      "/compte/validation",
      "/confidentialite",
      "/connexion",
      "/inscription",
      "/mon-espace",
      "/parametres",
      "/superadmin/admin-securite",
      "/superadmin/admin-utilisateurs",
      "/superadmin/identity-os",
      "/suppression-compte",
      "/utilisateurs",
      "/utilisateurs/abonnements-utilisateur",
      "/utilisateurs/centre-alertes-utilisateur",
      "/utilisateurs/centre-favoris-utilisateur",
      "/utilisateurs/centre-support-utilisateur",
      "/utilisateurs/compte-pro-utilisateur",
      "/utilisateurs/documents-personnels",
      "/utilisateurs/employes-utilisateur",
      "/utilisateurs/factures-utilisateur",
      "/utilisateurs/historique-achats",
      "/utilisateurs/historique-demarches",
      "/utilisateurs/historique-depannages",
      "/utilisateurs/historique-entretiens",
      "/utilisateurs/historique-locations",
      "/utilisateurs/mes-vehicules",
      "/utilisateurs/messagerie-globale",
      "/utilisateurs/objectif-utilisateur",
      "/utilisateurs/securite-utilisateur",
      "/utilisateurs/suppression-compte",
      "/utilisateurs/tableau-bord-perso",
      "/verify-email"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Confidentialite.tsx",
        "routes": [
          "/confidentialite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 54,
        "mots": 414
      },
      {
        "fichier": "client/src/pages/Connexion.tsx",
        "routes": [
          "/connexion"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 14,
        "mots": 56
      },
      {
        "fichier": "client/src/pages/DemandesSuppression.tsx",
        "routes": [
          "/admin/demandes-suppression"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 70
      },
      {
        "fichier": "client/src/pages/InscriptionParticulier.tsx",
        "routes": [
          "/inscription"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 28,
        "mots": 62
      },
      {
        "fichier": "client/src/pages/MonEspace.tsx",
        "routes": [
          "/mon-espace"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 1,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/MosControlCenter/EngineControlCenter.tsx",
        "routes": [
          "/superadmin/identity-os"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 35
      },
      {
        "fichier": "client/src/pages/Parametres.tsx",
        "routes": [
          "/parametres"
        ],
        "cliquables": 22,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 93,
        "mots": 546
      },
      {
        "fichier": "client/src/pages/SuppressionCompte.tsx",
        "routes": [
          "/suppression-compte",
          "/utilisateurs/suppression-compte"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 125
      },
      {
        "fichier": "client/src/pages/Validation.tsx",
        "routes": [
          "/compte/validation"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 12,
        "mots": 73
      },
      {
        "fichier": "client/src/pages/VerifyEmail.tsx",
        "routes": [
          "/verify-email"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 50
      },
      {
        "fichier": "client/src/pages/superadmin/AdminSecurite.tsx",
        "routes": [
          "/superadmin/admin-securite"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 6,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/superadmin/AdminUtilisateurs.tsx",
        "routes": [
          "/superadmin/admin-utilisateurs"
        ],
        "cliquables": 27,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 70,
        "mots": 164
      },
      {
        "fichier": "client/src/pages/utilisateurs/AbonnementsUtilisateur.tsx",
        "routes": [
          "/utilisateurs/abonnements-utilisateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/utilisateurs/CentreAlertesUtilisateur.tsx",
        "routes": [
          "/utilisateurs/centre-alertes-utilisateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/CentreFavorisUtilisateur.tsx",
        "routes": [
          "/utilisateurs/centre-favoris-utilisateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/CentreSupportUtilisateur.tsx",
        "routes": [
          "/utilisateurs/centre-support-utilisateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/utilisateurs/CompteParticulier.tsx",
        "routes": [
          "/utilisateurs"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 26
      },
      {
        "fichier": "client/src/pages/utilisateurs/CompteProUtilisateur.tsx",
        "routes": [
          "/utilisateurs/compte-pro-utilisateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/DocumentsPersonnels.tsx",
        "routes": [
          "/utilisateurs/documents-personnels"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/EmployesUtilisateur.tsx",
        "routes": [
          "/utilisateurs/employes-utilisateur"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 18,
        "mots": 61
      },
      {
        "fichier": "client/src/pages/utilisateurs/FacturesUtilisateur.tsx",
        "routes": [
          "/utilisateurs/factures-utilisateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/utilisateurs/HistoriqueAchats.tsx",
        "routes": [
          "/utilisateurs/historique-achats"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/HistoriqueDemarches.tsx",
        "routes": [
          "/utilisateurs/historique-demarches"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/HistoriqueDepannages.tsx",
        "routes": [
          "/utilisateurs/historique-depannages"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/HistoriqueEntretiens.tsx",
        "routes": [
          "/utilisateurs/historique-entretiens"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/HistoriqueLocations.tsx",
        "routes": [
          "/utilisateurs/historique-locations"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/MesVehicules.tsx",
        "routes": [
          "/utilisateurs/mes-vehicules"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/MessagerieGlobale.tsx",
        "routes": [
          "/utilisateurs/messagerie-globale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/utilisateurs/ObjectifUtilisateur.tsx",
        "routes": [
          "/utilisateurs/objectif-utilisateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/utilisateurs/SecuriteUtilisateur.tsx",
        "routes": [
          "/utilisateurs/securite-utilisateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/utilisateurs/TableauBordPerso.tsx",
        "routes": [
          "/utilisateurs/tableau-bord-perso"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/CentreDocuments.tsx",
        "route": "/documents",
        "composants": [
          "trpc.kyc"
        ]
      },
      {
        "fichier": "client/src/pages/CentreDocuments.tsx",
        "route": "/vente/documents-societe",
        "composants": [
          "trpc.kyc"
        ]
      },
      {
        "fichier": "client/src/pages/InscriptionProVO.tsx",
        "route": "/inscription-pro-vo",
        "composants": [
          "trpc.kyc"
        ]
      },
      {
        "fichier": "client/src/pages/AccesPDG.tsx",
        "route": "/mk-direction",
        "composants": [
          "trpc.auth"
        ]
      },
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.auth"
        ]
      }
    ],
    "procedures": [
      "all",
      "archive",
      "changePassword",
      "conditions",
      "controlCenterFeed",
      "create",
      "dashboard",
      "demanderPublique",
      "demandes",
      "disable",
      "enable",
      "espaces",
      "forgot",
      "get",
      "googleLogin",
      "healthStatus",
      "list",
      "login",
      "logout",
      "me",
      "meta",
      "myProfile",
      "oauthGoogle",
      "recent",
      "refreshToken",
      "register",
      "reportEvent",
      "reset",
      "revoke",
      "sendVerification",
      "set",
      "setup",
      "status",
      "submitDocuments",
      "supprimerMonCompte",
      "touch",
      "traiter",
      "types",
      "updateProfile",
      "verify"
    ],
    "tables": [
      "ad_requests",
      "identity_ai_agents",
      "identity_audit_log",
      "identity_email_verifications",
      "identity_health_log",
      "identity_identities",
      "identity_login_attempts",
      "identity_mfa_secrets",
      "identity_password_resets",
      "identity_phone_verifications",
      "identity_sessions",
      "user_preferences"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "public"
    ],
    "textes": 408,
    "mots": 1809,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/MonEspace.tsx (1 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« 0} onClick= > » client/src/pages/Validation.tsx:177"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminSecurite.tsx:27"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Investiguer » client/src/pages/superadmin/AdminSecurite.tsx:49"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Bloquer » client/src/pages/superadmin/AdminSecurite.tsx:50"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminUtilisateurs.tsx:90"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/AbonnementsUtilisateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/CentreAlertesUtilisateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/CentreFavorisUtilisateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/CentreSupportUtilisateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/CompteProUtilisateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/DocumentsPersonnels.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/FacturesUtilisateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/HistoriqueAchats.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/HistoriqueDemarches.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/HistoriqueDepannages.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/HistoriqueEntretiens.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/HistoriqueLocations.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/MesVehicules.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/MessagerieGlobale.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/ObjectifUtilisateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/SecuriteUtilisateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/utilisateurs/TableauBordPerso.tsx (3 texte(s))"
      }
    ]
  },
  {
    "moteur": "importafrica",
    "label": "Import Afrique Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/importafrica.ts",
      "routers/importafrica.ts"
    ],
    "routeurs": [
      "importAfrica"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "country",
      "document",
      "identity",
      "payment"
    ],
    "dependancesDetectees": [
      "core",
      "identity"
    ],
    "dependances": [
      "core",
      "country",
      "document",
      "identity",
      "payment"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "routers/importafrica.ts importe trpc.ts",
        "routers/importafrica.ts importe db.ts",
        "routers/importafrica.ts importe schema.ts"
      ],
      "identity": [
        "routers/importafrica.ts exige une session Identity (procédure protégée)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/import-africa"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/ImportAfrica.tsx",
        "routes": [
          "/import-africa"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 58
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "advance",
      "createRequest",
      "estimate",
      "myRequests",
      "request",
      "warehouses"
    ],
    "tables": [
      "customs_steps",
      "import_documents",
      "import_quotes",
      "import_requests",
      "import_transport",
      "import_vehicles",
      "warehouses"
    ],
    "acces": [
      "connecte",
      "public"
    ],
    "textes": 9,
    "mots": 58,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "country"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "document"
      }
    ]
  },
  {
    "moteur": "indexation",
    "label": "Moniteur d'indexation",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "indexation",
      "site-verification"
    ],
    "routeurs": [
      "indexation",
      "siteVerification"
    ],
    "fichiersServeur": 7,
    "dependancesDeclarees": [
      "audit",
      "core",
      "smart"
    ],
    "dependancesDetectees": [
      "audit",
      "core",
      "smart"
    ],
    "dependances": [
      "audit",
      "core",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "audit": [
        "site-verification/router.ts importe audit.ts"
      ],
      "core": [
        "indexation/index.ts importe trpc.ts",
        "indexation/inventory.ts importe db.ts",
        "indexation/service.ts importe db.ts"
      ],
      "smart": [
        "indexation/service.ts importe smart-engine/services/alert-engine.ts",
        "indexation/service.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [
      "seo"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/indexation"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreIndexation.tsx",
        "routes": [
          "/admin/indexation"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 40,
        "mots": 172
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "definir",
      "etat",
      "history",
      "labels",
      "latest",
      "monitor",
      "run",
      "searchConsole",
      "verifierRendu",
      "watchRecent"
    ],
    "tables": [
      "indexation_audits",
      "indexation_url_checks",
      "indexation_watch"
    ],
    "acces": [
      "admin",
      "pdg"
    ],
    "textes": 40,
    "mots": 172,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "intelligences",
    "label": "MKA.P-MS Intelligences",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "intelligences"
    ],
    "routeurs": [
      "intelligences"
    ],
    "fichiersServeur": 24,
    "dependancesDeclarees": [
      "ai_fabric",
      "code_graph",
      "command_center",
      "completion_center",
      "connaissance_auto",
      "continuous_test",
      "core",
      "event_bus",
      "identity",
      "monitoring",
      "resilience",
      "smart",
      "support"
    ],
    "dependancesDetectees": [
      "ai_fabric",
      "code_graph",
      "command_center",
      "completion_center",
      "connaissance_auto",
      "continuous_test",
      "core",
      "event_bus",
      "identity",
      "monitoring",
      "resilience",
      "smart",
      "support"
    ],
    "dependances": [
      "ai_fabric",
      "code_graph",
      "command_center",
      "completion_center",
      "connaissance_auto",
      "continuous_test",
      "core",
      "event_bus",
      "identity",
      "monitoring",
      "resilience",
      "smart",
      "support"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "ai_fabric": [
        "intelligences/actions.ts importe ai-fabric/service.ts",
        "intelligences/capacites.ts importe ai-fabric/schema.ts",
        "intelligences/capacites.ts importe ai-fabric/service.ts"
      ],
      "code_graph": [
        "intelligences/memoire.ts charge code-graph/service.ts",
        "intelligences/moteurs.ts charge code-graph/service.ts",
        "intelligences/orchestrateur.ts charge code-graph/service.ts"
      ],
      "command_center": [
        "intelligences/actions.ts importe command-center/service.ts",
        "intelligences/orchestrateur.ts charge command-center/service.ts",
        "intelligences/service.ts charge command-center/service.ts"
      ],
      "completion_center": [
        "intelligences/service.ts charge completion/service.ts"
      ],
      "connaissance_auto": [
        "intelligences/memoire.ts charge knowledge-engine/service.ts"
      ],
      "continuous_test": [
        "intelligences/orchestrateur.ts charge continuous-test/service.ts",
        "client/src/pages/CentreIntelligences.tsx appelle trpc.continuousTest"
      ],
      "core": [
        "intelligences/actions.ts importe db.ts",
        "intelligences/actions.ts importe engine-registry/service.ts",
        "intelligences/autonomie.ts importe db.ts"
      ],
      "event_bus": [
        "intelligences/moteurs.ts importe event-bus/catalog.ts",
        "intelligences/service.ts importe event-bus/service.ts",
        "intelligences/service.ts publie des événements"
      ],
      "identity": [
        "intelligences/api-v1.ts importe auth.ts",
        "intelligences/index.ts exige une session Identity (procédure protégée)"
      ],
      "monitoring": [
        "client/src/pages/CentreIntelligences.tsx appelle trpc.monitoringOs"
      ],
      "resilience": [
        "intelligences/actions.ts importe resilience/service.ts",
        "intelligences/memoire.ts charge resilience/service.ts"
      ],
      "smart": [
        "intelligences/livraisons.ts ouvre une alerte du Système Intelligent",
        "intelligences/service.ts importe smart-engine/schema.ts",
        "intelligences/service.ts ouvre une alerte du Système Intelligent"
      ],
      "support": [
        "client/src/pages/CentreIntelligences.tsx appelle trpc.supportOs"
      ]
    },
    "dependants": [
      "ai_fabric",
      "atelier",
      "auto_branchement",
      "command_center",
      "continuous_test",
      "event_bus"
    ],
    "evenementsPublies": [
      "intelligences.domaine",
      "intelligences.echange"
    ],
    "evenementsConsommes": [
      "*"
    ],
    "abonnements": [
      {
        "eventType": "*",
        "handler": "intelligences_memoire"
      }
    ],
    "sourcesEmission": [
      "intelligences"
    ],
    "boutons": [],
    "routes": [
      "/admin/intelligences",
      "/intelligences"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/AssistantIntelligences.tsx",
        "routes": [
          "/intelligences"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 89
      },
      {
        "fichier": "client/src/pages/CentreIntelligences.tsx",
        "routes": [
          "/admin/intelligences"
        ],
        "cliquables": 12,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 176,
        "mots": 1066
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/CentreCommandes.tsx",
        "route": "/admin/commandes",
        "composants": [
          "components/IaConfigWarning.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/CentreIA.tsx",
        "route": "/admin/ia-couts",
        "composants": [
          "components/IaConfigWarning.tsx"
        ]
      }
    ],
    "procedures": [
      "actions",
      "appels",
      "appelsMoteurs",
      "assistant",
      "attribuerPermissions",
      "auditMoteurs",
      "autonomie",
      "capacites",
      "coder",
      "comparaisonsShadow",
      "configStatus",
      "conversations",
      "creerCleDeveloppeur",
      "demander",
      "detachementFournisseur",
      "developpeur",
      "domaines",
      "domainesPublics",
      "etat",
      "evaluation",
      "executerAction",
      "executerCapacite",
      "experiences",
      "fil",
      "filPublic",
      "fonctions",
      "interpreterRecherche",
      "journalActions",
      "journalPermissions",
      "lancerMission",
      "marquerEtape",
      "memoire",
      "memoireArchiver",
      "memoireEcrire",
      "memoireLister",
      "memoireRechercher",
      "mission",
      "missions",
      "moteur",
      "noterAppel",
      "permissions",
      "pilotage",
      "planAutonomie",
      "presentation",
      "proposer",
      "reglerAutonomie",
      "reglerCleDeveloppeur",
      "reglerDomaine",
      "reglerFonction",
      "reglerShadow",
      "regles",
      "revoquerCleDeveloppeur",
      "shadow"
    ],
    "tables": [
      "in_actions",
      "in_appels",
      "in_autonomie",
      "in_autonomie_journal",
      "in_capacite_etat",
      "in_dev_appels",
      "in_dev_cles",
      "in_domaines",
      "in_experiences",
      "in_fonctions",
      "in_memoire",
      "in_messages",
      "in_mission_etapes",
      "in_missions",
      "in_permissions",
      "in_plan_autonomie",
      "in_sessions",
      "in_shadow",
      "in_shadow_runs",
      "in_usage"
    ],
    "acces": [
      "pdg",
      "public"
    ],
    "textes": 185,
    "mots": 1155,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "journey",
    "label": "Customer Journey OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "customer-journey-os"
    ],
    "routeurs": [
      "customerJourneyOs"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "core",
      "identity",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "smart"
    ],
    "dependances": [
      "core",
      "identity",
      "smart"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "customer-journey-os/index.ts importe db.ts",
        "customer-journey-os/index.ts importe trpc.ts"
      ],
      "identity": [
        "customer-journey-os/index.ts importe identity-os/contract.ts",
        "customer-journey-os/index.ts exige une session Identity (procédure protégée)"
      ],
      "smart": [
        "customer-journey-os/index.ts importe smart-engine/schema.ts"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/vente/parcours-acheteur"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/vente/WorkflowCompletAcheteur.tsx",
        "routes": [
          "/vente/parcours-acheteur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 19
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "controlCenterFeed",
      "dashboard",
      "funnel",
      "healthStatus",
      "meta",
      "track"
    ],
    "tables": [],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 12,
    "mots": 19,
    "battement": "pont_os",
    "manques": []
  },
  {
    "moteur": "knowledge",
    "label": "Knowledge Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "core",
      "country",
      "seo",
      "smart"
    ],
    "dependancesDetectees": [],
    "dependances": [
      "core",
      "country",
      "seo",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {},
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/communaute",
      "/communaute/avis-conseils",
      "/communaute/guides-achat",
      "/communaute/guides-garage",
      "/communaute/guides-location",
      "/communaute/guides-vente",
      "/communaute/questions-reponses",
      "/formations",
      "/formations/certificats",
      "/formations/formation-garage",
      "/formations/formation-taxi",
      "/formations/formation-v-t-c",
      "/formations/formation-vente"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/communaute",
          "/formations"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/communaute/AvisConseils.tsx",
        "routes": [
          "/communaute/avis-conseils"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/communaute/GuidesAchat.tsx",
        "routes": [
          "/communaute/guides-achat"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/communaute/GuidesGarage.tsx",
        "routes": [
          "/communaute/guides-garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/communaute/GuidesLocation.tsx",
        "routes": [
          "/communaute/guides-location"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/communaute/GuidesVente.tsx",
        "routes": [
          "/communaute/guides-vente"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/communaute/QuestionsReponses.tsx",
        "routes": [
          "/communaute/questions-reponses"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/formations/Certificats.tsx",
        "routes": [
          "/formations/certificats"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/formations/FormationGarage.tsx",
        "routes": [
          "/formations/formation-garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/formations/FormationTaxi.tsx",
        "routes": [
          "/formations/formation-taxi"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/formations/FormationVTC.tsx",
        "routes": [
          "/formations/formation-v-t-c"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/formations/FormationVente.tsx",
        "routes": [
          "/formations/formation-vente"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 37,
    "mots": 78,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/communaute/AvisConseils.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/communaute/GuidesAchat.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/communaute/GuidesGarage.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/communaute/GuidesLocation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/communaute/GuidesVente.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/communaute/QuestionsReponses.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/formations/Certificats.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/formations/FormationGarage.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/formations/FormationTaxi.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/formations/FormationVTC.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/formations/FormationVente.tsx (3 texte(s))"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "smart"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "seo"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "country"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "language",
    "label": "Language OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "language-os"
    ],
    "routeurs": [
      "language"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "core",
      "country",
      "identity"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "identity"
    ],
    "dependances": [
      "core",
      "country",
      "identity"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "language-os/index.ts importe db.ts",
        "language-os/index.ts importe trpc.ts"
      ],
      "country": [
        "language-os/index.ts importe country-os/index.ts",
        "language-os/index.ts lit la règle pays"
      ],
      "identity": [
        "language-os/index.ts importe identity-os/contract.ts",
        "language-os/index.ts exige une session Identity (procédure protégée)"
      ]
    },
    "dependants": [
      "document",
      "identity",
      "notification",
      "seo"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/superadmin/language-os"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/MosControlCenter/EngineControlCenter.tsx",
        "routes": [
          "/superadmin/language-os"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 35
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "bulkUpsert",
      "bundle",
      "controlCenterFeed",
      "dashboard",
      "detect",
      "healthStatus",
      "list",
      "me",
      "meta",
      "t",
      "update",
      "upsert"
    ],
    "tables": [
      "language_health_log",
      "language_languages",
      "language_translations",
      "language_user_preferences"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 15,
    "mots": 35,
    "battement": "pont_os",
    "manques": []
  },
  {
    "moteur": "livraison",
    "label": "Livraison Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/livraison.ts",
      "routers/livraison.ts"
    ],
    "routeurs": [
      "livraison"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "avis_reputation",
      "core",
      "identity",
      "notification",
      "payment",
      "proximity_engine",
      "scheduler"
    ],
    "dependancesDetectees": [
      "avis_reputation",
      "boutons",
      "core",
      "identity",
      "notification",
      "payment"
    ],
    "dependances": [
      "avis_reputation",
      "boutons",
      "core",
      "identity",
      "notification",
      "payment",
      "proximity_engine",
      "scheduler"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "avis_reputation": [
        "routers/livraison.ts importe reputation-engine/service.ts"
      ],
      "boutons": [
        "client/src/pages/Livraison.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/Livraison.tsx utilise BoutonMoteur"
      ],
      "core": [
        "routers/livraison.ts importe trpc.ts",
        "routers/livraison.ts importe db.ts",
        "routers/livraison.ts importe schema.ts"
      ],
      "identity": [
        "routers/livraison.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/livraison.ts importe notification-os/triggers.ts",
        "routers/livraison.ts déclenche notifyEvent"
      ],
      "payment": [
        "routers/livraison.ts importe payment-engine/checkout.ts"
      ]
    },
    "dependants": [
      "avis_reputation"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "livraison_colis_vers_vehicule",
        "libelle": "Faire livrer un véhicule ou un camion (depuis Livraison)",
        "genre": "navigation",
        "ecran": "/livraison",
        "fichier": "client/src/pages/Livraison.tsx",
        "ligne": 51
      }
    ],
    "routes": [
      "/livraison"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Livraison.tsx",
        "routes": [
          "/livraison"
        ],
        "cliquables": 2,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 25,
        "mots": 108
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "createMission",
      "myMissions",
      "payMission",
      "providers",
      "quote",
      "registerProvider",
      "track",
      "updateMissionStatus"
    ],
    "tables": [
      "delivery_missions",
      "delivery_pricing",
      "delivery_profiles",
      "delivery_routes",
      "delivery_tracking",
      "delivery_vehicles"
    ],
    "acces": [
      "connecte",
      "public"
    ],
    "textes": 25,
    "mots": 108,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/Livraison.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "scheduler"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "proximity_engine"
      }
    ]
  },
  {
    "moteur": "livraison_vehicule",
    "label": "Vehicle Delivery Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "vehicle-delivery"
    ],
    "routeurs": [
      "livraisonVehicule"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "country",
      "event_bus",
      "politique_pays",
      "smart"
    ],
    "dependancesDetectees": [
      "boutons",
      "core",
      "country",
      "event_bus",
      "politique_pays",
      "smart"
    ],
    "dependances": [
      "boutons",
      "core",
      "country",
      "event_bus",
      "politique_pays",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "boutons": [
        "client/src/pages/LivraisonVehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/LivraisonVehicule.tsx utilise BoutonMoteur"
      ],
      "core": [
        "vehicle-delivery/index.ts importe trpc.ts",
        "vehicle-delivery/service.ts importe db.ts",
        "vehicle-delivery/service.ts importe schema.ts"
      ],
      "country": [
        "vehicle-delivery/service.ts importe country-os/index.ts"
      ],
      "event_bus": [
        "vehicle-delivery/service.ts importe event-bus/service.ts",
        "vehicle-delivery/service.ts publie des événements"
      ],
      "politique_pays": [
        "vehicle-delivery/service.ts importe country-policy/service.ts"
      ],
      "smart": [
        "publie livraison_vehicule.prix_indisponible, consommé par smart",
        "publie livraison_vehicule.validation_requise, consommé par smart",
        "publie livraison_vehicule.etape_bloquee, consommé par smart"
      ]
    },
    "dependants": [
      "achat",
      "estimation",
      "payment",
      "vente"
    ],
    "evenementsPublies": [
      "livraison_vehicule.acceptee",
      "livraison_vehicule.baremes_initialises",
      "livraison_vehicule.etape_bloquee",
      "livraison_vehicule.prix_indisponible",
      "livraison_vehicule.validation_requise"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "livraison_vehicule"
    ],
    "boutons": [
      {
        "code": "livraison_vehicule_accepter",
        "libelle": "Accepter le devis et créer l'expédition",
        "genre": "formulaire",
        "ecran": "/louer/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 281
      },
      {
        "code": "livraison_vehicule_choisir_mode",
        "libelle": "Choisir un mode d'acheminement",
        "genre": "formulaire",
        "ecran": "/louer/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 169
      },
      {
        "code": "livraison_vehicule_connexion",
        "libelle": "Se connecter pour commander ou suivre",
        "genre": "navigation",
        "ecran": "/louer/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 277
      },
      {
        "code": "livraison_vehicule_connexion",
        "libelle": "Se connecter pour commander ou suivre",
        "genre": "navigation",
        "ecran": "/louer/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 322
      },
      {
        "code": "livraison_vehicule_onglet_devis",
        "libelle": "Onglet Devis",
        "genre": "formulaire",
        "ecran": "/louer/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 116
      },
      {
        "code": "livraison_vehicule_onglet_suivi",
        "libelle": "Onglet Suivi",
        "genre": "formulaire",
        "ecran": "/louer/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 117
      },
      {
        "code": "livraison_vehicule_retour",
        "libelle": "Retour à l'accueil",
        "genre": "navigation",
        "ecran": "/louer/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 110
      }
    ],
    "routes": [
      "/louer/livraison",
      "/suivi-vehicule"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "routes": [
          "/louer/livraison"
        ],
        "cliquables": 7,
        "parMoteur": 7,
        "sansAction": 0,
        "textes": 45,
        "mots": 224
      },
      {
        "fichier": "client/src/pages/SuiviVehicule.tsx",
        "routes": [
          "/suivi-vehicule"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 25,
        "mots": 55
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/PaiementVehicule.tsx",
        "route": "/paiement-vehicule/:id",
        "composants": [
          "trpc.livraisonVehicule"
        ]
      }
    ],
    "procedures": [
      "accepter",
      "baremes",
      "catalogue",
      "devis",
      "enregistrerOption",
      "enregistrerTarif",
      "etatMoteur",
      "marquerEtape",
      "mesExpeditions"
    ],
    "tables": [
      "vd_devis",
      "vd_expeditions",
      "vd_options",
      "vd_suivi",
      "vd_tarifs"
    ],
    "acces": [
      "connecte",
      "direction",
      "pdg",
      "public"
    ],
    "textes": 70,
    "mots": 279,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/LivraisonVehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      }
    ]
  },
  {
    "moteur": "location",
    "label": "Univers Location Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [],
    "routeurs": [
      "lavage",
      "karting"
    ],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "core",
      "country",
      "permission",
      "redirection",
      "seo"
    ],
    "dependancesDetectees": [
      "achat",
      "core",
      "country",
      "redirection",
      "seo"
    ],
    "dependances": [
      "achat",
      "core",
      "country",
      "permission",
      "redirection",
      "seo"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/ListeAttente.tsx embarque components/ReserverLocationButton.tsx (trpc.reservations)",
        "client/src/pages/LocationMKAPMS.tsx appelle trpc.annonces",
        "client/src/pages/ProduitLocation.tsx appelle trpc.annonces"
      ],
      "core": [
        "client/src/pages/superadmin/AdminLocation.tsx appelle trpc.admin"
      ],
      "country": [
        "client/src/pages/LocationMKAPMS.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "redirection": [
        "client/src/pages/SeoLandingPage.tsx embarque lib/redirect.tsx (trpc.redirectionEngine)"
      ],
      "seo": [
        "client/src/pages/SeoLandingPage.tsx appelle trpc.seo"
      ]
    },
    "dependants": [
      "location_particulier",
      "location_pro"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "louer_livraison_vehicule",
        "libelle": "Faire livrer un véhicule ou un camion (depuis Location)",
        "genre": "navigation",
        "ecran": "/louer",
        "fichier": "",
        "ligne": 0
      }
    ],
    "routes": [
      "/location-voiture",
      "/location/:slug",
      "/louer",
      "/louer/calendrier",
      "/louer/camions",
      "/louer/camions/vehicule/:id",
      "/louer/comparateur",
      "/louer/favoris",
      "/louer/historique",
      "/louer/liste-attente",
      "/louer/loa",
      "/louer/minibus",
      "/louer/minibus/vehicule/:id",
      "/louer/mkapms",
      "/louer/mkapms/vehicule/:id",
      "/louer/multi-vehicules",
      "/louer/penalites",
      "/louer/programme-vtc",
      "/louer/remplacement",
      "/louer/renouvellement",
      "/louer/reservations-recurrentes",
      "/louer/score-confiance",
      "/louer/utilitaires",
      "/louer/utilitaires/vehicule/:id",
      "/louer/vtc-taxi",
      "/louer/vtc-taxi/vehicule/:id",
      "/superadmin/admin-location",
      "/vtc-taxi"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CalendrierDispo.tsx",
        "routes": [
          "/louer/calendrier"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 13,
        "mots": 31
      },
      {
        "fichier": "client/src/pages/CentrePenalites.tsx",
        "routes": [
          "/louer/penalites"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 11,
        "mots": 27
      },
      {
        "fichier": "client/src/pages/Comparateur.tsx",
        "routes": [
          "/louer/comparateur"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 34,
        "mots": 89
      },
      {
        "fichier": "client/src/pages/Favoris.tsx",
        "routes": [
          "/louer/favoris"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 26,
        "mots": 77
      },
      {
        "fichier": "client/src/pages/HistoriqueLocation.tsx",
        "routes": [
          "/louer/historique"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 17,
        "mots": 42
      },
      {
        "fichier": "client/src/pages/ListeAttente.tsx",
        "routes": [
          "/louer/liste-attente"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 17,
        "mots": 86
      },
      {
        "fichier": "client/src/pages/LocationCamions.tsx",
        "routes": [
          "/louer/camions"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 60,
        "mots": 169
      },
      {
        "fichier": "client/src/pages/LocationLOA.tsx",
        "routes": [
          "/louer/loa"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 26,
        "mots": 72
      },
      {
        "fichier": "client/src/pages/LocationMKAPMS.tsx",
        "routes": [
          "/louer/mkapms"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 50,
        "mots": 134
      },
      {
        "fichier": "client/src/pages/LocationMinibus.tsx",
        "routes": [
          "/louer/minibus"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 56,
        "mots": 159
      },
      {
        "fichier": "client/src/pages/LocationUtilitaires.tsx",
        "routes": [
          "/louer/utilitaires"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 66,
        "mots": 191
      },
      {
        "fichier": "client/src/pages/LocationVoiture.tsx",
        "routes": [
          "/location-voiture"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/Louer.tsx",
        "routes": [
          "/louer"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 69,
        "mots": 258
      },
      {
        "fichier": "client/src/pages/ProduitLocation.tsx",
        "routes": [
          "/louer/camions/vehicule/:id",
          "/louer/minibus/vehicule/:id",
          "/louer/mkapms/vehicule/:id",
          "/louer/utilitaires/vehicule/:id"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 109,
        "mots": 462
      },
      {
        "fichier": "client/src/pages/ProduitVtcTaxi.tsx",
        "routes": [
          "/louer/vtc-taxi/vehicule/:id"
        ],
        "cliquables": 25,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 125,
        "mots": 384
      },
      {
        "fichier": "client/src/pages/ProgrammeVTC.tsx",
        "routes": [
          "/louer/programme-vtc"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 23,
        "mots": 84
      },
      {
        "fichier": "client/src/pages/RemplacementVehicule.tsx",
        "routes": [
          "/louer/remplacement"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 18,
        "mots": 47
      },
      {
        "fichier": "client/src/pages/RenouvellementLocation.tsx",
        "routes": [
          "/louer/renouvellement"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 30,
        "mots": 118
      },
      {
        "fichier": "client/src/pages/ReservationMulti.tsx",
        "routes": [
          "/louer/multi-vehicules"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 23,
        "mots": 60
      },
      {
        "fichier": "client/src/pages/ReservationRecurrente.tsx",
        "routes": [
          "/louer/reservations-recurrentes"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 17,
        "mots": 53
      },
      {
        "fichier": "client/src/pages/ScoreConfiance.tsx",
        "routes": [
          "/louer/score-confiance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 21,
        "mots": 67
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "routes": [
          "/location/:slug"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 46
      },
      {
        "fichier": "client/src/pages/VtcTaxi.tsx",
        "routes": [
          "/louer/vtc-taxi",
          "/vtc-taxi"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 61,
        "mots": 200
      },
      {
        "fichier": "client/src/pages/superadmin/AdminLocation.tsx",
        "routes": [
          "/superadmin/admin-location"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 17,
        "mots": 61
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.lavage",
          "trpc.karting"
        ]
      }
    ],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 905,
    "mots": 2934,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Réserver les dates disponibles » client/src/pages/CalendrierDispo.tsx:119"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Payer » client/src/pages/CentrePenalites.tsx:99"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Contester » client/src/pages/CentrePenalites.tsx:100"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/CentrePenalites.tsx:101"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rechercher un camion / engin » client/src/pages/LocationCamions.tsx:126"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Simuler ma LOA » client/src/pages/LocationLOA.tsx:93"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rechercher un véhicule MKA.P-MS » client/src/pages/LocationMKAPMS.tsx:232"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Réserver ce véhicule » client/src/pages/LocationMKAPMS.tsx:335"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rechercher un minibus » client/src/pages/LocationMinibus.tsx:124"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rechercher un utilitaire » client/src/pages/LocationUtilitaires.tsx:139"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/messages client/src/pages/Louer.tsx:585"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir sur la carte » client/src/pages/Louer.tsx:492"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Véhicules disponibles » client/src/pages/Louer.tsx:495"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« = 4 ? \"bg-[#D4AF37]/10 border border-[#D4AF37]/30\" : \"bg-[#F » client/src/pages/ProduitVtcTaxi.tsx:305"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Télécharger » client/src/pages/ProduitVtcTaxi.tsx:486"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir le véhicule » client/src/pages/ProgrammeVTC.tsx:85"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rejoindre le programme VTC & Taxi » client/src/pages/ProgrammeVTC.tsx:111"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« + Ajouter des photos » client/src/pages/RemplacementVehicule.tsx:65"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Envoyer la demande » client/src/pages/RemplacementVehicule.tsx:68"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Accepter » client/src/pages/RemplacementVehicule.tsx:106"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Prolonger ma location » client/src/pages/RenouvellementLocation.tsx:126"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Confirmer le retrait / retour » client/src/pages/RenouvellementLocation.tsx:171"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Réserver véhicules » client/src/pages/ReservationMulti.tsx:97"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Prolonger » client/src/pages/ReservationRecurrente.tsx:75"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Modifier » client/src/pages/ReservationRecurrente.tsx:76"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Choisir un véhicule → » client/src/pages/ReservationRecurrente.tsx:106"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/inscription-pro client/src/pages/VtcTaxi.tsx:390"
      },
      {
        "genre": "bouton_declare_absent_ecran",
        "detail": "louer_livraison_vehicule déclaré pour /louer mais aucun écran ne l'utilise"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "permission"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "location_particulier",
    "label": "Location Particulier Engine",
    "categorie": "sous_section",
    "etatDeclare": "staging",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "core",
      "country",
      "location"
    ],
    "dependancesDetectees": [
      "achat",
      "country"
    ],
    "dependances": [
      "achat",
      "core",
      "country",
      "location"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/LocationParticulier.tsx appelle trpc.annonces",
        "client/src/pages/ProduitParticulier.tsx appelle trpc.annonces",
        "client/src/pages/ProduitParticulier.tsx embarque components/ReserverLocationButton.tsx (trpc.reservations)"
      ],
      "country": [
        "client/src/pages/LocationParticulier.tsx embarque lib/currency.tsx (trpc.currency)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/louer/particulier",
      "/louer/particulier/vehicule/:id"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/LocationParticulier.tsx",
        "routes": [
          "/louer/particulier"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 102,
        "mots": 327
      },
      {
        "fichier": "client/src/pages/ProduitParticulier.tsx",
        "routes": [
          "/louer/particulier/vehicule/:id"
        ],
        "cliquables": 13,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 96,
        "mots": 345
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 198,
    "mots": 672,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Appliquer les filtres » client/src/pages/LocationParticulier.tsx:334"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/LocationParticulier.tsx:534"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir les véhicules proches » client/src/pages/LocationParticulier.tsx:561"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« = 4 ? \"bg-[#D4AF37]/10 border border-[#D4AF37]/30\" : \"bg-[#F » client/src/pages/ProduitParticulier.tsx:302"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "location"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "location_pro",
    "label": "Location Professionnelle Engine",
    "categorie": "sous_section",
    "etatDeclare": "staging",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "core",
      "country",
      "location"
    ],
    "dependancesDetectees": [
      "achat",
      "country"
    ],
    "dependances": [
      "achat",
      "core",
      "country",
      "location"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/LocationPro.tsx appelle trpc.annonces",
        "client/src/pages/ProduitLocation.tsx appelle trpc.annonces",
        "client/src/pages/ProduitLocation.tsx embarque components/ReserverLocationButton.tsx (trpc.reservations)"
      ],
      "country": [
        "client/src/pages/LocationPro.tsx embarque lib/currency.tsx (trpc.currency)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/entreprises",
      "/entreprises/centre-carburant",
      "/entreprises/centre-geolocalisation",
      "/entreprises/centre-immobilisation",
      "/entreprises/compte-flotte",
      "/entreprises/gestion-conducteurs",
      "/entreprises/gestion-parc",
      "/entreprises/historique-flotte",
      "/entreprises/objectif-flottes",
      "/entreprises/rapports-entreprises",
      "/louer/conducteurs",
      "/louer/franchises",
      "/louer/pro",
      "/louer/pro/vehicule/:id",
      "/louer/renouvellement-flotte",
      "/louer/score-loueur",
      "/louer/tableau-bord-loueur"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/GestionConducteurs.tsx",
        "routes": [
          "/louer/conducteurs"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 4,
        "textes": 24,
        "mots": 46
      },
      {
        "fichier": "client/src/pages/GestionFranchises.tsx",
        "routes": [
          "/louer/franchises"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 10,
        "mots": 47
      },
      {
        "fichier": "client/src/pages/LocationPro.tsx",
        "routes": [
          "/louer/pro"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 4,
        "textes": 89,
        "mots": 278
      },
      {
        "fichier": "client/src/pages/ProduitLocation.tsx",
        "routes": [
          "/louer/pro/vehicule/:id"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 109,
        "mots": 462
      },
      {
        "fichier": "client/src/pages/RenouvellementFlotte.tsx",
        "routes": [
          "/louer/renouvellement-flotte"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 15,
        "mots": 56
      },
      {
        "fichier": "client/src/pages/ScoreQualiteLoueur.tsx",
        "routes": [
          "/louer/score-loueur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 23,
        "mots": 80
      },
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/entreprises"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/TableauBordLoueur.tsx",
        "routes": [
          "/louer/tableau-bord-loueur"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 15,
        "mots": 45
      },
      {
        "fichier": "client/src/pages/entreprises/CentreCarburant.tsx",
        "routes": [
          "/entreprises/centre-carburant"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/entreprises/CentreGeolocalisation.tsx",
        "routes": [
          "/entreprises/centre-geolocalisation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/entreprises/CentreImmobilisation.tsx",
        "routes": [
          "/entreprises/centre-immobilisation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/entreprises/CompteFlotte.tsx",
        "routes": [
          "/entreprises/compte-flotte"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/entreprises/GestionConducteurs.tsx",
        "routes": [
          "/entreprises/gestion-conducteurs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/entreprises/GestionParc.tsx",
        "routes": [
          "/entreprises/gestion-parc"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/entreprises/HistoriqueFlotte.tsx",
        "routes": [
          "/entreprises/historique-flotte"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/entreprises/ObjectifFlottes.tsx",
        "routes": [
          "/entreprises/objectif-flottes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/entreprises/RapportsEntreprises.tsx",
        "routes": [
          "/entreprises/rapports-entreprises"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 316,
    "mots": 1080,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Permis » client/src/pages/GestionConducteurs.tsx:63"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Pièce d'identité » client/src/pages/GestionConducteurs.tsx:64"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Ajouter le conducteur » client/src/pages/GestionConducteurs.tsx:66"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/GestionConducteurs.tsx:85"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Appliquer la franchise » client/src/pages/GestionFranchises.tsx:89"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rechercher » client/src/pages/LocationPro.tsx:235"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Appliquer les filtres » client/src/pages/LocationPro.tsx:299"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir les véhicules proches » client/src/pages/LocationPro.tsx:496"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Demander un devis flotte » client/src/pages/LocationPro.tsx:520"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Renouveler avec ce véhicule » client/src/pages/RenouvellementFlotte.tsx:82"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir » client/src/pages/RenouvellementFlotte.tsx:83"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Renouveler toute ma flotte » client/src/pages/RenouvellementFlotte.tsx:92"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Vérifier » client/src/pages/TableauBordLoueur.tsx:81"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/CentreCarburant.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/CentreGeolocalisation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/CentreImmobilisation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/CompteFlotte.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/GestionConducteurs.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/GestionParc.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/HistoriqueFlotte.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/ObjectifFlottes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/entreprises/RapportsEntreprises.tsx (3 texte(s))"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "location"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "marketing",
    "label": "Publicité Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/marketing.ts",
      "routers/marketing.ts"
    ],
    "routeurs": [
      "marketing",
      "loyalty"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "identity",
      "notification",
      "seo",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "identity"
    ],
    "dependances": [
      "core",
      "identity",
      "notification",
      "seo",
      "smart"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "routers/marketing.ts importe trpc.ts",
        "routers/marketing.ts importe db.ts",
        "routers/marketing.ts importe schema.ts"
      ],
      "identity": [
        "routers/marketing.ts exige une session Identity (procédure protégée)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/demande-publicite",
      "/marketing",
      "/marketing/campagnes-automatiques",
      "/marketing/codes-promotionnels",
      "/marketing/espaces-publicitaires",
      "/marketing/programme-fidelite",
      "/marketing/programme-parrainage",
      "/marketing/publicites-pro",
      "/publicite-interne",
      "/publicite/:id",
      "/rewards"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/DemandePublicite.tsx",
        "routes": [
          "/demande-publicite"
        ],
        "cliquables": 13,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 82,
        "mots": 320
      },
      {
        "fichier": "client/src/pages/PubliciteDetail.tsx",
        "routes": [
          "/publicite/:id"
        ],
        "cliquables": 9,
        "parMoteur": 0,
        "sansAction": 5,
        "textes": 28,
        "mots": 75
      },
      {
        "fichier": "client/src/pages/PubliciteInterne.tsx",
        "routes": [
          "/publicite-interne"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 28
      },
      {
        "fichier": "client/src/pages/Rewards.tsx",
        "routes": [
          "/rewards"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 57,
        "mots": 203
      },
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/marketing"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/marketing/CampagnesAutomatiques.tsx",
        "routes": [
          "/marketing/campagnes-automatiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/marketing/CodesPromotionnels.tsx",
        "routes": [
          "/marketing/codes-promotionnels"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/marketing/EspacesPublicitaires.tsx",
        "routes": [
          "/marketing/espaces-publicitaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/marketing/ProgrammeFidelite.tsx",
        "routes": [
          "/marketing/programme-fidelite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/marketing/ProgrammeParrainage.tsx",
        "routes": [
          "/marketing/programme-parrainage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/marketing/PublicitesPro.tsx",
        "routes": [
          "/marketing/publicites-pro"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.loyalty"
        ]
      }
    ],
    "procedures": [
      "banners",
      "createBanner",
      "createQr",
      "createReferral",
      "qrList",
      "scan",
      "subscribeNewsletter"
    ],
    "tables": [
      "ads",
      "banners",
      "campaigns",
      "promo_codes",
      "pub_requests",
      "qr_codes",
      "referral_codes"
    ],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 195,
    "mots": 670,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Approuver » client/src/pages/PubliciteDetail.tsx:41"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Refuser » client/src/pages/PubliciteDetail.tsx:44"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Mettre en pause » client/src/pages/PubliciteDetail.tsx:50"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Remettre en ligne » client/src/pages/PubliciteDetail.tsx:54"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Supprimer » client/src/pages/PubliciteDetail.tsx:57"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/marketing/CampagnesAutomatiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/marketing/CodesPromotionnels.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/marketing/EspacesPublicitaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/marketing/ProgrammeFidelite.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/marketing/ProgrammeParrainage.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/marketing/PublicitesPro.tsx (3 texte(s))"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "seo"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "smart"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "notification"
      }
    ]
  },
  {
    "moteur": "media",
    "label": "Media OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "media-os"
    ],
    "routeurs": [
      "mediaOs",
      "media"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "core",
      "identity",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "smart"
    ],
    "dependances": [
      "core",
      "identity",
      "smart"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "media-os/index.ts importe trpc.ts"
      ],
      "identity": [
        "media-os/index.ts importe identity-os/contract.ts",
        "media-os/index.ts exige une session Identity (procédure protégée)"
      ],
      "smart": [
        "media-os/index.ts importe smart-engine/services/photo-perceptual.ts"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.media"
        ]
      }
    ],
    "procedures": [
      "analyze",
      "controlCenterFeed",
      "dashboard",
      "healthStatus",
      "meta",
      "optimize"
    ],
    "tables": [],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "pont_os",
    "manques": []
  },
  {
    "moteur": "media_authenticity",
    "label": "Media Authenticity Engine",
    "categorie": "transversal",
    "etatDeclare": "staging",
    "dossiers": [
      "media-authenticity"
    ],
    "routeurs": [
      "mediaAuthenticity"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "ai_fabric",
      "audit",
      "core",
      "document",
      "event_bus",
      "smart"
    ],
    "dependancesDetectees": [
      "ai_fabric",
      "core",
      "event_bus",
      "smart"
    ],
    "dependances": [
      "ai_fabric",
      "audit",
      "core",
      "document",
      "event_bus",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "ai_fabric": [
        "media-authenticity/service.ts importe ai-fabric/service.ts"
      ],
      "core": [
        "media-authenticity/index.ts importe trpc.ts",
        "media-authenticity/service.ts importe db.ts"
      ],
      "event_bus": [
        "media-authenticity/service.ts importe event-bus/service.ts",
        "media-authenticity/service.ts publie des événements"
      ],
      "smart": [
        "media-authenticity/service.ts importe smart-engine/services/photo-perceptual.ts",
        "media-authenticity/service.ts importe smart-engine/services/alert-engine.ts",
        "media-authenticity/service.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [
      "identity"
    ],
    "evenementsPublies": [
      "media.analyse",
      "media.decision"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "media_authenticity"
    ],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [],
    "procedures": [
      "declarations",
      "detecteurs",
      "etat",
      "etiquettes",
      "incidents",
      "media",
      "trancher"
    ],
    "tables": [
      "ma_analyses",
      "ma_incidents",
      "ma_labels",
      "ma_medias"
    ],
    "acces": [
      "pdg",
      "public"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "document"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "audit"
      },
      {
        "genre": "sans_ecran",
        "detail": "aucune route client ne mène à ce moteur"
      }
    ]
  },
  {
    "moteur": "messaging",
    "label": "Messagerie OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "messaging-os",
      "routers/messages.ts"
    ],
    "routeurs": [
      "messagingOs",
      "messages"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "audit",
      "core",
      "identity",
      "notification"
    ],
    "dependancesDetectees": [
      "audit",
      "core",
      "identity",
      "notification"
    ],
    "dependances": [
      "audit",
      "core",
      "identity",
      "notification"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "audit": [
        "messaging-os/index.ts importe audit.ts"
      ],
      "core": [
        "messaging-os/index.ts importe db.ts",
        "messaging-os/index.ts importe schema.ts",
        "messaging-os/index.ts importe trpc.ts"
      ],
      "identity": [
        "messaging-os/index.ts importe identity-os/contract.ts",
        "messaging-os/index.ts exige une session Identity (procédure protégée)",
        "routers/messages.ts importe identity-os/identite-officielle.ts"
      ],
      "notification": [
        "routers/messages.ts importe notification-os/triggers.ts",
        "routers/messages.ts déclenche notifyEvent"
      ]
    },
    "dependants": [
      "achat",
      "achat_officiel",
      "achat_particulier",
      "achat_pro"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/messagerie"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Messagerie.tsx",
        "routes": [
          "/messagerie"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 41
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/particulier/vehicule/:id",
        "composants": [
          "trpc.messages"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/professionnel/vehicule/:id",
        "composants": [
          "trpc.messages"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/mkapms-officiel/vehicule/:id",
        "composants": [
          "trpc.messages"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/vehicule/:id",
        "composants": [
          "trpc.messages"
        ]
      }
    ],
    "procedures": [
      "block",
      "controlCenterFeed",
      "dashboard",
      "getThread",
      "healthStatus",
      "listThreads",
      "markRead",
      "meta",
      "openReports",
      "openThread",
      "reasons",
      "report",
      "resolveReport",
      "send",
      "stats",
      "unblock",
      "unreadCount"
    ],
    "tables": [
      "message_reports"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 7,
    "mots": 41,
    "battement": "pont_os",
    "manques": []
  },
  {
    "moteur": "monitoring",
    "label": "Monitoring Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "monitoring-os"
    ],
    "routeurs": [
      "monitoringOs"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "audit",
      "core",
      "event_bus",
      "identity",
      "notification",
      "scheduler",
      "smart",
      "visibility"
    ],
    "dependancesDetectees": [
      "core",
      "event_bus",
      "identity",
      "notification",
      "scheduler",
      "smart",
      "visibility"
    ],
    "dependances": [
      "audit",
      "core",
      "event_bus",
      "identity",
      "notification",
      "scheduler",
      "smart",
      "visibility"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "monitoring-os/domaines.ts importe db.ts",
        "monitoring-os/domaines.ts importe schema.ts",
        "monitoring-os/domaines.ts importe engine-registry/service.ts"
      ],
      "event_bus": [
        "monitoring-os/domaines.ts importe event-bus/service.ts",
        "monitoring-os/domaines.ts publie des événements"
      ],
      "identity": [
        "monitoring-os/index.ts importe identity-os/contract.ts",
        "monitoring-os/index.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "monitoring-os/domaines.ts importe notification-os/index.ts"
      ],
      "scheduler": [
        "monitoring-os/domaines.ts importe scheduler-os/index.ts"
      ],
      "smart": [
        "monitoring-os/domaines.ts importe smart-engine/schema.ts",
        "monitoring-os/domaines.ts importe smart-engine/services/platform-health.ts",
        "monitoring-os/domaines.ts ouvre une alerte du Système Intelligent"
      ],
      "visibility": [
        "monitoring-os/domaines.ts importe visibility-os/index.ts"
      ]
    },
    "dependants": [
      "ai_fabric",
      "analytics",
      "intelligences",
      "smart"
    ],
    "evenementsPublies": [
      "moteur.degrade"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "monitoring"
    ],
    "boutons": [],
    "routes": [
      "/superadmin/admin-statistiques"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/superadmin/AdminStatistiques.tsx",
        "routes": [
          "/superadmin/admin-statistiques"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 10,
        "mots": 21
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/CentreIntelligences.tsx",
        "route": "/admin/intelligences",
        "composants": [
          "trpc.monitoringOs"
        ]
      }
    ],
    "procedures": [
      "controlCenterFeed",
      "dashboard",
      "detectionTardive",
      "domaines",
      "healthStatus",
      "meta",
      "nonMesures",
      "overview",
      "scan"
    ],
    "tables": [],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 10,
    "mots": 21,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir rapport complet » client/src/pages/superadmin/AdminStatistiques.tsx:40"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "audit"
      }
    ]
  },
  {
    "moteur": "notification",
    "label": "Notification OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "notification-os",
      "routers/notifications.ts",
      "services/email.ts"
    ],
    "routeurs": [
      "notifications",
      "notificationOs"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "core",
      "identity",
      "language"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "language"
    ],
    "dependances": [
      "core",
      "identity",
      "language"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "notification-os/index.ts importe db.ts",
        "notification-os/index.ts importe trpc.ts",
        "notification-os/triggers.ts importe db.ts"
      ],
      "identity": [
        "notification-os/index.ts importe identity-os/contract.ts",
        "notification-os/index.ts exige une session Identity (procédure protégée)",
        "routers/notifications.ts exige une session Identity (procédure protégée)"
      ],
      "language": [
        "notification-os/triggers.ts importe language-os/index.ts"
      ]
    },
    "dependants": [
      "achat",
      "assurance",
      "atelier",
      "auction_engine",
      "avis_reputation",
      "cartegrise",
      "controle_technique",
      "depannage",
      "energie_recharge",
      "financial_intelligence",
      "garage",
      "identity",
      "livraison",
      "marketing",
      "messaging",
      "monitoring",
      "partner_engine",
      "pieces",
      "pro_account",
      "proximity_engine",
      "scheduler",
      "smart",
      "support",
      "transport",
      "vente",
      "vente_officiel",
      "vo",
      "vo_engine",
      "workflow"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/notifications",
      "/notifications/alertes-urgentes",
      "/notifications/annonces-importantes",
      "/notifications/canaux-communication",
      "/notifications/coffre-fort-numerique",
      "/notifications/documents-entreprises",
      "/notifications/documents-personnels-global",
      "/notifications/documents-vehicules",
      "/notifications/historique-notifications",
      "/notifications/notifications-demarches",
      "/notifications/notifications-depannage",
      "/notifications/notifications-garage",
      "/notifications/notifications-location",
      "/notifications/notifications-messages",
      "/notifications/notifications-paiements",
      "/notifications/notifications-vente",
      "/notifications/objectif-notifications",
      "/notifications/parametres-notifications",
      "/notifications/rappels-automatiques",
      "/notifications/signatures-globales",
      "/superadmin/notification-os"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/MosControlCenter/EngineControlCenter.tsx",
        "routes": [
          "/superadmin/notification-os"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 35
      },
      {
        "fichier": "client/src/pages/notifications/AlertesUrgentes.tsx",
        "routes": [
          "/notifications/alertes-urgentes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/AnnoncesImportantes.tsx",
        "routes": [
          "/notifications/annonces-importantes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/CanauxCommunication.tsx",
        "routes": [
          "/notifications/canaux-communication"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/notifications/CoffreFortNumerique.tsx",
        "routes": [
          "/notifications/coffre-fort-numerique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/DocumentsEntreprises.tsx",
        "routes": [
          "/notifications/documents-entreprises"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/DocumentsPersonnelsGlobal.tsx",
        "routes": [
          "/notifications/documents-personnels-global"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/DocumentsVehicules.tsx",
        "routes": [
          "/notifications/documents-vehicules"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/HistoriqueNotifications.tsx",
        "routes": [
          "/notifications/historique-notifications"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/NotificationsDemarches.tsx",
        "routes": [
          "/notifications/notifications-demarches"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/NotificationsDepannage.tsx",
        "routes": [
          "/notifications/notifications-depannage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/NotificationsGarage.tsx",
        "routes": [
          "/notifications/notifications-garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/NotificationsGenerale.tsx",
        "routes": [
          "/notifications"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 0,
        "mots": 0
      },
      {
        "fichier": "client/src/pages/notifications/NotificationsLocation.tsx",
        "routes": [
          "/notifications/notifications-location"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/NotificationsMessages.tsx",
        "routes": [
          "/notifications/notifications-messages"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/NotificationsPaiements.tsx",
        "routes": [
          "/notifications/notifications-paiements"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/NotificationsVente.tsx",
        "routes": [
          "/notifications/notifications-vente"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/ObjectifNotifications.tsx",
        "routes": [
          "/notifications/objectif-notifications"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/ParametresNotifications.tsx",
        "routes": [
          "/notifications/parametres-notifications"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/notifications/RappelsAutomatiques.tsx",
        "routes": [
          "/notifications/rappels-automatiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/notifications/SignaturesGlobales.tsx",
        "routes": [
          "/notifications/signatures-globales"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/TableauBordProVente.tsx",
        "route": "/vente",
        "composants": [
          "trpc.notifications"
        ]
      },
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.notificationOs"
        ]
      },
      {
        "fichier": "client/src/pages/Parametres.tsx",
        "route": "/parametres",
        "composants": [
          "trpc.notificationOs"
        ]
      }
    ],
    "procedures": [
      "controlCenterFeed",
      "create",
      "dashboard",
      "dispatch",
      "healthStatus",
      "list",
      "log",
      "markAllRead",
      "markRead",
      "me",
      "meta",
      "notifyEvent",
      "remove",
      "setAlert",
      "triggerCoverage",
      "triggers",
      "unreadCount",
      "update",
      "upsert"
    ],
    "tables": [
      "notif_dispatch_log",
      "notif_health_log",
      "notif_templates",
      "notif_user_preferences"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 72,
    "mots": 149,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/AlertesUrgentes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/AnnoncesImportantes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/CanauxCommunication.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/CoffreFortNumerique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/DocumentsEntreprises.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/DocumentsPersonnelsGlobal.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/DocumentsVehicules.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/HistoriqueNotifications.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/NotificationsDemarches.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/NotificationsDepannage.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/NotificationsGarage.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/NotificationsGenerale.tsx (0 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/NotificationsLocation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/NotificationsMessages.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/NotificationsPaiements.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/NotificationsVente.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/ObjectifNotifications.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/ParametresNotifications.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/RappelsAutomatiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/notifications/SignaturesGlobales.tsx (3 texte(s))"
      }
    ]
  },
  {
    "moteur": "partner_engine",
    "label": "Partner Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "partner-engine"
    ],
    "routeurs": [
      "partnerEngine",
      "partners",
      "partnerApi"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "core",
      "country",
      "notification",
      "pro_portal",
      "smart",
      "visibility"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "notification",
      "pro_portal",
      "smart",
      "visibility"
    ],
    "dependances": [
      "core",
      "country",
      "notification",
      "pro_portal",
      "smart",
      "visibility"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "partner-engine/index.ts importe trpc.ts",
        "partner-engine/service.ts importe db.ts",
        "partner-engine/service.ts importe schema.ts"
      ],
      "country": [
        "partner-engine/service.ts importe country-os/index.ts"
      ],
      "notification": [
        "partner-engine/service.ts importe notification-os/triggers.ts",
        "partner-engine/service.ts déclenche notifyEvent"
      ],
      "pro_portal": [
        "client/src/pages/partenaires/InscriptionPartenaire.tsx appelle trpc.proPortal"
      ],
      "smart": [
        "partner-engine/service.ts importe smart-engine/schema.ts"
      ],
      "visibility": [
        "partner-engine/service.ts importe visibility-os/index.ts"
      ]
    },
    "dependants": [
      "assurance"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/partenaires",
      "/partenaires/attribution-demandes",
      "/partenaires/carte-partenaires",
      "/partenaires/evaluation-partenaires",
      "/partenaires/fiche-partenaire",
      "/partenaires/inscription-partenaire",
      "/partenaires/niveaux-partenaires",
      "/partenaires/objectif-partenaires",
      "/partenaires/statistiques-partenaires",
      "/partenaires/suspension-partenaires",
      "/superadmin/partenaires"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/PartenairesPilotage.tsx",
        "routes": [
          "/superadmin/partenaires"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 38
      },
      {
        "fichier": "client/src/pages/partenaires/AttributionDemandes.tsx",
        "routes": [
          "/partenaires/attribution-demandes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/partenaires/CartePartenaires.tsx",
        "routes": [
          "/partenaires/carte-partenaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/partenaires/EvaluationPartenaires.tsx",
        "routes": [
          "/partenaires/evaluation-partenaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/partenaires/FichePartenaire.tsx",
        "routes": [
          "/partenaires/fiche-partenaire"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/partenaires/InscriptionPartenaire.tsx",
        "routes": [
          "/partenaires/inscription-partenaire"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 18,
        "mots": 79
      },
      {
        "fichier": "client/src/pages/partenaires/NiveauxPartenaires.tsx",
        "routes": [
          "/partenaires/niveaux-partenaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/partenaires/ObjectifPartenaires.tsx",
        "routes": [
          "/partenaires/objectif-partenaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/partenaires/PartenairesGenerale.tsx",
        "routes": [
          "/partenaires"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 18
      },
      {
        "fichier": "client/src/pages/partenaires/StatistiquesPartenaires.tsx",
        "routes": [
          "/partenaires/statistiques-partenaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/partenaires/SuspensionPartenaires.tsx",
        "routes": [
          "/partenaires/suspension-partenaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.partners",
          "trpc.partnerApi"
        ]
      }
    ],
    "procedures": [
      "applications",
      "candidater",
      "createContract",
      "detect",
      "health",
      "network",
      "opportunities",
      "prepareActions",
      "registerLead",
      "review",
      "services",
      "setContractStatus",
      "setOpportunityStatus",
      "updateLeadStatus"
    ],
    "tables": [
      "partner_applications",
      "partner_contracts",
      "partner_coverage",
      "partner_leads",
      "partner_opportunities"
    ],
    "acces": [
      "admin",
      "direction",
      "public"
    ],
    "textes": 62,
    "mots": 183,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/partenaires/AttributionDemandes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/partenaires/CartePartenaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/partenaires/EvaluationPartenaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/partenaires/FichePartenaire.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/partenaires/NiveauxPartenaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/partenaires/ObjectifPartenaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/partenaires/StatistiquesPartenaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/partenaires/SuspensionPartenaires.tsx (3 texte(s))"
      }
    ]
  },
  {
    "moteur": "payment",
    "label": "Payment Engine",
    "categorie": "transversal",
    "etatDeclare": "staging",
    "dossiers": [
      "payment-engine",
      "stripeWebhook.ts",
      "lib/stripe.ts",
      "lib/payment-errors.ts",
      "modules/wallet.ts",
      "routers/wallet.ts",
      "modules/installments.ts",
      "routers/installments.ts",
      "routers/abonnements.ts"
    ],
    "routeurs": [
      "paymentEngine",
      "wallet",
      "installments",
      "abonnements"
    ],
    "fichiersServeur": 17,
    "dependancesDeclarees": [
      "achat",
      "core",
      "country",
      "event_bus",
      "livraison_vehicule",
      "payment_orchestrator",
      "permission",
      "smart",
      "workflow"
    ],
    "dependancesDetectees": [
      "achat",
      "core",
      "country",
      "event_bus",
      "livraison_vehicule",
      "payment_orchestrator",
      "permission",
      "smart",
      "workflow"
    ],
    "dependances": [
      "achat",
      "core",
      "country",
      "event_bus",
      "livraison_vehicule",
      "payment_orchestrator",
      "permission",
      "smart",
      "workflow"
    ],
    "integrationsTechniques": [
      "permission"
    ],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/PaiementVehicule.tsx appelle trpc.annonces",
        "client/src/pages/PaiementVehicule.tsx appelle trpc.reservations"
      ],
      "core": [
        "lib/stripe.ts importe env.ts",
        "payment-engine/audit.ts importe db.ts",
        "payment-engine/chain-audit.ts importe db.ts"
      ],
      "country": [
        "payment-engine/router.ts lit la règle pays",
        "payment-engine/service.ts lit la règle pays",
        "client/src/pages/Abonnements.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "event_bus": [
        "stripeWebhook.ts importe event-bus/service.ts",
        "stripeWebhook.ts publie des événements"
      ],
      "livraison_vehicule": [
        "client/src/pages/PaiementVehicule.tsx appelle trpc.livraisonVehicule"
      ],
      "payment_orchestrator": [
        "payment-engine/checkout.ts importe payment-orchestrator/service.ts",
        "client/src/pages/PaiementVehicule.tsx embarque components/MoyensPaiement.tsx (trpc.paymentOrchestrator)"
      ],
      "permission": [
        "payment-engine/router.ts filtre par rôle (procédure pro/admin/direction/PDG)",
        "routers/installments.ts filtre par rôle (procédure pro/admin/direction/PDG)",
        "routers/wallet.ts filtre par rôle (procédure pro/admin/direction/PDG)"
      ],
      "smart": [
        "lib/payment-errors.ts importe smart-engine/services/alert-engine.ts",
        "lib/payment-errors.ts ouvre une alerte du Système Intelligent",
        "stripeWebhook.ts importe smart-engine/services/activity-log.ts"
      ],
      "workflow": [
        "stripeWebhook.ts importe routers/operations.ts"
      ]
    },
    "dependants": [
      "accounting_internal",
      "achat",
      "auction_engine",
      "cartegrise",
      "comptabilite",
      "continuous_test",
      "controle_technique",
      "depannage",
      "encheres",
      "finance",
      "financial_intelligence",
      "garage",
      "importafrica",
      "livraison",
      "payment_orchestrator",
      "pieces",
      "pro_account",
      "pro_portal",
      "proximity_engine",
      "support",
      "transport",
      "vente",
      "vo_espaces"
    ],
    "evenementsPublies": [
      "paiement.echoue",
      "paiement.reussi"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "payment"
    ],
    "boutons": [],
    "routes": [
      "/abonnements",
      "/abonnements-definitifs",
      "/badges-definitifs",
      "/paiement-vehicule/:id",
      "/paiement/simulation",
      "/superadmin/admin-abonnements",
      "/superadmin/admin-badges",
      "/superadmin/admin-commissions",
      "/superadmin/admin-paiements",
      "/wallet"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Abonnements.tsx",
        "routes": [
          "/abonnements"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 25,
        "mots": 125
      },
      {
        "fichier": "client/src/pages/AbonnementsDefinitifs.tsx",
        "routes": [
          "/abonnements-definitifs"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 66,
        "mots": 146
      },
      {
        "fichier": "client/src/pages/BadgesDefinitifs.tsx",
        "routes": [
          "/badges-definitifs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 27
      },
      {
        "fichier": "client/src/pages/PaiementSimulation.tsx",
        "routes": [
          "/paiement/simulation"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/PaiementVehicule.tsx",
        "routes": [
          "/paiement-vehicule/:id"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 21,
        "mots": 99
      },
      {
        "fichier": "client/src/pages/Wallet.tsx",
        "routes": [
          "/wallet"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/superadmin/AdminAbonnements.tsx",
        "routes": [
          "/superadmin/admin-abonnements"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 9,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/superadmin/AdminBadges.tsx",
        "routes": [
          "/superadmin/admin-badges"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 15,
        "mots": 48
      },
      {
        "fichier": "client/src/pages/superadmin/AdminCommissions.tsx",
        "routes": [
          "/superadmin/admin-commissions"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 18
      },
      {
        "fichier": "client/src/pages/superadmin/AdminPaiements.tsx",
        "routes": [
          "/superadmin/admin-paiements"
        ],
        "cliquables": 20,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 38,
        "mots": 145
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/InscriptionProVO.tsx",
        "route": "/inscription-pro-vo",
        "composants": [
          "trpc.abonnements"
        ]
      },
      {
        "fichier": "client/src/pages/comptabilite/WalletAdmin.tsx",
        "route": "/comptabilite/wallets",
        "composants": [
          "trpc.wallet"
        ]
      },
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.wallet",
          "trpc.abonnements"
        ]
      }
    ],
    "procedures": [
      "addBankAccount",
      "addRib",
      "adminAllPayouts",
      "adminAllWallets",
      "adminCreditWallet",
      "adminUpdatePayoutStatus",
      "audit",
      "bankAccounts",
      "byReference",
      "chainAudit",
      "countryRule",
      "countryRules",
      "create",
      "createBankTransfer",
      "createCheckout",
      "createRefund",
      "deleteBankAccount",
      "listPlans",
      "me",
      "mine",
      "myRibs",
      "openPortal",
      "payouts",
      "pending",
      "pendingBankTransfers",
      "productPrice",
      "products",
      "productsAll",
      "reconcileBankTransfer",
      "request",
      "requestPayout",
      "schedule",
      "seedProducts",
      "setDefaultBankAccount",
      "setPayoutFrequency",
      "setStatus",
      "startProductCheckout",
      "stats",
      "transaction",
      "transactions",
      "upsertCountryRule",
      "upsertProduct",
      "validate",
      "verifyRib"
    ],
    "tables": [
      "bank_accounts",
      "installment_alerts",
      "installment_contracts",
      "installment_payments",
      "installment_requests",
      "payment_bank_transfers",
      "payment_country_rules",
      "payment_events",
      "payment_pro_rib",
      "payment_products",
      "payment_refunds",
      "payment_transactions",
      "payouts",
      "wallet_transactions",
      "wallets"
    ],
    "acces": [
      "admin",
      "connecte",
      "pdg",
      "professionnel",
      "public"
    ],
    "textes": 205,
    "mots": 645,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/PaiementSimulation.tsx (3 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminAbonnements.tsx:31"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Gerer » client/src/pages/superadmin/AdminAbonnements.tsx:62"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Historique » client/src/pages/superadmin/AdminAbonnements.tsx:63"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Gerer criteres » client/src/pages/superadmin/AdminBadges.tsx:36"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Relancer » client/src/pages/superadmin/AdminPaiements.tsx:216"
      }
    ]
  },
  {
    "moteur": "payment_orchestrator",
    "label": "Payment Orchestrator",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "payment-orchestrator"
    ],
    "routeurs": [
      "paymentOrchestrator"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "country",
      "payment"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "payment"
    ],
    "dependances": [
      "core",
      "country",
      "payment"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "payment-orchestrator/index.ts importe trpc.ts",
        "payment-orchestrator/service.ts importe db.ts",
        "payment-orchestrator/service.ts importe env.ts"
      ],
      "country": [
        "payment-orchestrator/service.ts importe country-os/index.ts",
        "payment-orchestrator/service.ts lit la règle pays"
      ],
      "payment": [
        "payment-orchestrator/index.ts importe lib/stripe.ts",
        "payment-orchestrator/index.ts déclenche un paiement"
      ]
    },
    "dependants": [
      "payment",
      "pieces"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/PaiementVehicule.tsx",
        "route": "/paiement-vehicule/:id",
        "composants": [
          "components/MoyensPaiement.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/PiecesCommande.tsx",
        "route": "/pieces/commande/:id",
        "composants": [
          "components/MoyensPaiement.tsx"
        ]
      }
    ],
    "procedures": [
      "credentials",
      "health",
      "providers",
      "resolve",
      "seed",
      "setActive"
    ],
    "tables": [
      "payment_providers",
      "payment_routing_decisions"
    ],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "permission",
    "label": "Permission OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "permission-engine",
      "routers/rbac.ts"
    ],
    "routeurs": [
      "permissionEngine",
      "rbac"
    ],
    "fichiersServeur": 8,
    "dependancesDeclarees": [
      "core",
      "identity"
    ],
    "dependancesDetectees": [
      "core",
      "identity"
    ],
    "dependances": [
      "core",
      "identity"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "permission-engine/intelligence.ts importe db.ts",
        "permission-engine/journal.ts importe db.ts",
        "permission-engine/router.ts importe trpc.ts"
      ],
      "identity": [
        "permission-engine/contract.ts importe identity-os/contract.ts",
        "permission-engine/router.ts exige une session Identity (procédure protégée)",
        "permission-engine/service.ts importe identity-os/contract.ts"
      ]
    },
    "dependants": [
      "account_routing",
      "achat",
      "atelier",
      "location",
      "payment",
      "redirection",
      "search",
      "smart",
      "vente",
      "vo",
      "vo_espaces",
      "workflow"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/mk-direction",
      "/superadmin/permission-engine",
      "/superadmin/permission-os"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/AccesPDG.tsx",
        "routes": [
          "/mk-direction"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 1,
        "mots": 1
      },
      {
        "fichier": "client/src/pages/MosControlCenter/EngineControlCenter.tsx",
        "routes": [
          "/superadmin/permission-os"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 35
      },
      {
        "fichier": "client/src/pages/PermissionEngine/ControlCenter.tsx",
        "routes": [
          "/superadmin/permission-engine"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 27,
        "mots": 90
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/VOInterne.tsx",
        "route": "/vo",
        "composants": [
          "components/AccessDenied.tsx"
        ]
      }
    ],
    "procedures": [
      "check",
      "controlCenterFeed",
      "counters",
      "create",
      "createRole",
      "dashboard",
      "disable",
      "explain",
      "grant",
      "grants",
      "healthStatus",
      "journal",
      "list",
      "logDenied",
      "meta",
      "myAccess",
      "permissions",
      "recent",
      "resolve",
      "revoke",
      "revokeGrant",
      "rolePermissions",
      "roles",
      "setRolePermission",
      "simulate",
      "staff",
      "stats",
      "update",
      "upsertStaff"
    ],
    "tables": [
      "perm_delegations",
      "perm_health_log",
      "perm_policies",
      "perm_resolution_log",
      "perm_security_log",
      "perm_temporary_grants"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "pdg",
      "public"
    ],
    "textes": 43,
    "mots": 126,
    "battement": "contrat",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/AccesPDG.tsx (1 texte(s))"
      }
    ]
  },
  {
    "moteur": "pieces",
    "label": "Pièces Auto Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/pieces.ts",
      "routers/pieces.ts"
    ],
    "routeurs": [
      "pieces",
      "warehouses"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "avis_reputation",
      "core",
      "event_bus",
      "identity",
      "notification",
      "payment",
      "payment_orchestrator",
      "product_engine"
    ],
    "dependancesDetectees": [
      "avis_reputation",
      "core",
      "event_bus",
      "identity",
      "notification",
      "payment",
      "payment_orchestrator",
      "product_engine"
    ],
    "dependances": [
      "avis_reputation",
      "core",
      "event_bus",
      "identity",
      "notification",
      "payment",
      "payment_orchestrator",
      "product_engine"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "avis_reputation": [
        "routers/pieces.ts importe reputation-engine/service.ts"
      ],
      "core": [
        "routers/pieces.ts importe trpc.ts",
        "routers/pieces.ts importe db.ts",
        "routers/pieces.ts importe schema.ts"
      ],
      "event_bus": [
        "routers/pieces.ts importe event-bus/service.ts",
        "routers/pieces.ts publie des événements"
      ],
      "identity": [
        "routers/pieces.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/pieces.ts importe notification-os/triggers.ts",
        "routers/pieces.ts déclenche notifyEvent"
      ],
      "payment": [
        "routers/pieces.ts importe payment-engine/checkout.ts"
      ],
      "payment_orchestrator": [
        "client/src/pages/PiecesCommande.tsx embarque components/MoyensPaiement.tsx (trpc.paymentOrchestrator)"
      ],
      "product_engine": [
        "publie piece.modifiee, consommé par product_engine"
      ]
    },
    "dependants": [
      "avis_reputation",
      "estimation"
    ],
    "evenementsPublies": [
      "piece.modifiee"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "pieces"
    ],
    "boutons": [],
    "routes": [
      "/pieces",
      "/pieces/abonnements-pro-pieces",
      "/pieces/avis-produits-pieces",
      "/pieces/commande/:id",
      "/pieces/fournisseurs-pieces",
      "/pieces/logistique-pieces",
      "/pieces/montage-garage",
      "/pieces/objectif-pieces",
      "/pieces/panier-pieces-detachees",
      "/pieces/pieces-accessoires",
      "/pieces/pieces-batteries",
      "/pieces/pieces-carrosserie",
      "/pieces/pieces-eclairage",
      "/pieces/pieces-freinage",
      "/pieces/pieces-huiles",
      "/pieces/pieces-moteur",
      "/pieces/pieces-pneumatiques",
      "/pieces/pieces-suspension",
      "/pieces/recherche-intelligente-pieces",
      "/pieces/retours-pieces",
      "/pieces/statistiques-pieces",
      "/pieces/vendeurs-pieces",
      "/pieces/verification-compatibilite",
      "/superadmin/admin-pieces"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/PiecesCommande.tsx",
        "routes": [
          "/pieces/commande/:id"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 82
      },
      {
        "fichier": "client/src/pages/pieces/AbonnementsProPieces.tsx",
        "routes": [
          "/pieces/abonnements-pro-pieces"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 7,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/pieces/AvisProduitsPieces.tsx",
        "routes": [
          "/pieces/avis-produits-pieces"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/pieces/FournisseursPieces.tsx",
        "routes": [
          "/pieces/fournisseurs-pieces"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/pieces/LogistiquePieces.tsx",
        "routes": [
          "/pieces/logistique-pieces"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/pieces/MontageGarage.tsx",
        "routes": [
          "/pieces/montage-garage"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 6,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/pieces/ObjectifPieces.tsx",
        "routes": [
          "/pieces/objectif-pieces"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/pieces/PanierPiecesDetachees.tsx",
        "routes": [
          "/pieces/panier-pieces-detachees"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 9,
        "mots": 31
      },
      {
        "fichier": "client/src/pages/pieces/PiecesAccessoires.tsx",
        "routes": [
          "/pieces/pieces-accessoires"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/PiecesBatteries.tsx",
        "routes": [
          "/pieces/pieces-batteries"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/PiecesCarrosserie.tsx",
        "routes": [
          "/pieces/pieces-carrosserie"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/PiecesEclairage.tsx",
        "routes": [
          "/pieces/pieces-eclairage"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/PiecesFreinage.tsx",
        "routes": [
          "/pieces/pieces-freinage"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/PiecesGenerale.tsx",
        "routes": [
          "/pieces"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 14,
        "mots": 27
      },
      {
        "fichier": "client/src/pages/pieces/PiecesHuiles.tsx",
        "routes": [
          "/pieces/pieces-huiles"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/pieces/PiecesMoteur.tsx",
        "routes": [
          "/pieces/pieces-moteur"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/PiecesPneumatiques.tsx",
        "routes": [
          "/pieces/pieces-pneumatiques"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/PiecesSuspension.tsx",
        "routes": [
          "/pieces/pieces-suspension"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/RechercheIntelligentePieces.tsx",
        "routes": [
          "/pieces/recherche-intelligente-pieces"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 4,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/pieces/RetoursPieces.tsx",
        "routes": [
          "/pieces/retours-pieces"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/pieces/StatistiquesPieces.tsx",
        "routes": [
          "/pieces/statistiques-pieces"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/pieces/VendeursPieces.tsx",
        "routes": [
          "/pieces/vendeurs-pieces"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/pieces/VerificationCompatibilite.tsx",
        "routes": [
          "/pieces/verification-compatibilite"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/superadmin/AdminPieces.tsx",
        "routes": [
          "/superadmin/admin-pieces"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 23,
        "mots": 49
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.warehouses"
        ]
      }
    ],
    "procedures": [
      "addCompatibility",
      "addPart",
      "addPartToDevis",
      "adminStats",
      "catalog",
      "compatibilities",
      "confirmOrder",
      "createInvoice",
      "createOrder",
      "createShop",
      "createSite",
      "dashboard",
      "estimateLivraison",
      "invoices",
      "myOrders",
      "myServiceTracking",
      "order",
      "orderItems",
      "orderTracking",
      "part",
      "payOrder",
      "removeCompatibility",
      "shop",
      "shopOrders",
      "shops",
      "sites",
      "stockAlerts",
      "stockByCatalog",
      "updateInvoiceStatus",
      "updateOrderStatus",
      "updatePart",
      "updateShop",
      "updateStock"
    ],
    "tables": [
      "part_compatibilities",
      "part_references",
      "parts_catalog",
      "parts_order_items",
      "parts_orders",
      "parts_shops",
      "parts_stock"
    ],
    "acces": [
      "admin",
      "connecte",
      "professionnel",
      "public"
    ],
    "textes": 137,
    "mots": 319,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Choisir » client/src/pages/pieces/AbonnementsProPieces.tsx:17"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/LogistiquePieces.tsx (3 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/pieces/MontageGarage.tsx:10"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Réserver le montage » client/src/pages/pieces/MontageGarage.tsx:13"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Commander » client/src/pages/pieces/PanierPiecesDetachees.tsx:16"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesAccessoires.tsx:14"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesAccessoires.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesBatteries.tsx:13"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesBatteries.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesCarrosserie.tsx:14"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesCarrosserie.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesEclairage.tsx:14"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesEclairage.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesFreinage.tsx:13"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesFreinage.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesHuiles.tsx:8"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesHuiles.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesMoteur.tsx:16"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesMoteur.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesPneumatiques.tsx:14"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesPneumatiques.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/pieces/recherche client/src/pages/pieces/PiecesSuspension.tsx:14"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/PiecesSuspension.tsx (2 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Rechercher » client/src/pages/pieces/RechercheIntelligentePieces.tsx:10"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/RechercheIntelligentePieces.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/pieces/RetoursPieces.tsx (2 texte(s))"
      }
    ]
  },
  {
    "moteur": "politique_pays",
    "label": "Country Policy Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "country-policy"
    ],
    "routeurs": [
      "countryPolicy"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "country",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "country"
    ],
    "dependances": [
      "core",
      "country",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "country-policy/index.ts importe trpc.ts",
        "country-policy/service.ts importe db.ts"
      ],
      "country": [
        "country-policy/service.ts importe country-os/index.ts"
      ]
    },
    "dependants": [
      "livraison_vehicule",
      "risque_import",
      "smart"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/regles-pays",
      "/conformite",
      "/conformite/assurances-pays",
      "/conformite/centre-pays",
      "/conformite/devises-automatiques",
      "/conformite/documents-obligatoires-pays",
      "/conformite/garage-pays",
      "/conformite/i-a-juridique",
      "/conformite/immatriculations-pays",
      "/conformite/location-pays",
      "/conformite/mises-a-jour-reglementaires",
      "/conformite/moteur-regles-pays",
      "/conformite/moyens-paiement-locaux",
      "/conformite/objectif-conformite",
      "/conformite/tableau-bord-international",
      "/conformite/taxes-automatiques",
      "/conformite/vente-pays"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreReglesPays.tsx",
        "routes": [
          "/admin/regles-pays"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 38,
        "mots": 252
      },
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/conformite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/conformite/AssurancesPays.tsx",
        "routes": [
          "/conformite/assurances-pays"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/conformite/CentrePays.tsx",
        "routes": [
          "/conformite/centre-pays"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/conformite/DevisesAutomatiques.tsx",
        "routes": [
          "/conformite/devises-automatiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/conformite/DocumentsObligatoiresPays.tsx",
        "routes": [
          "/conformite/documents-obligatoires-pays"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/conformite/GaragePays.tsx",
        "routes": [
          "/conformite/garage-pays"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/conformite/IAJuridique.tsx",
        "routes": [
          "/conformite/i-a-juridique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/conformite/ImmatriculationsPays.tsx",
        "routes": [
          "/conformite/immatriculations-pays"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/conformite/LocationPays.tsx",
        "routes": [
          "/conformite/location-pays"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/conformite/MisesAJourReglementaires.tsx",
        "routes": [
          "/conformite/mises-a-jour-reglementaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/conformite/MoteurReglesPays.tsx",
        "routes": [
          "/conformite/moteur-regles-pays"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/conformite/MoyensPaiementLocaux.tsx",
        "routes": [
          "/conformite/moyens-paiement-locaux"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/conformite/ObjectifConformite.tsx",
        "routes": [
          "/conformite/objectif-conformite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/conformite/TableauBordInternational.tsx",
        "routes": [
          "/conformite/tableau-bord-international"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/conformite/TaxesAutomatiques.tsx",
        "routes": [
          "/conformite/taxes-automatiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/conformite/VentePays.tsx",
        "routes": [
          "/conformite/vente-pays"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "confirmerRegle",
      "couverture",
      "declarerRegle",
      "evaluations",
      "evaluer",
      "health",
      "referentiels",
      "regles",
      "retirerRegle",
      "stats"
    ],
    "tables": [
      "cpe_evaluations",
      "cpe_rules"
    ],
    "acces": [
      "direction",
      "pdg"
    ],
    "textes": 87,
    "mots": 378,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/AssurancesPays.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/CentrePays.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/DevisesAutomatiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/DocumentsObligatoiresPays.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/GaragePays.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/IAJuridique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/ImmatriculationsPays.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/LocationPays.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/MisesAJourReglementaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/MoteurReglesPays.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/MoyensPaiementLocaux.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/ObjectifConformite.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/TableauBordInternational.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/TaxesAutomatiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/conformite/VentePays.tsx (3 texte(s))"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "smart"
      }
    ]
  },
  {
    "moteur": "pro_account",
    "label": "Pro Account Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "pro-account"
    ],
    "routeurs": [
      "proAccount"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "core",
      "country",
      "notification",
      "payment",
      "pro_portal"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "notification",
      "pro_portal"
    ],
    "dependances": [
      "core",
      "country",
      "notification",
      "payment",
      "pro_portal"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "pro-account/index.ts importe trpc.ts",
        "pro-account/service.ts importe db.ts"
      ],
      "country": [
        "pro-account/service.ts importe country-os/index.ts",
        "pro-account/service.ts lit la règle pays"
      ],
      "notification": [
        "pro-account/service.ts importe notification-os/index.ts",
        "pro-account/service.ts déclenche notifyEvent"
      ],
      "pro_portal": [
        "pro-account/service.ts importe pro-portal/contract.ts"
      ]
    },
    "dependants": [
      "pro_portal"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/superadmin/admin-comptes-pro"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/superadmin/AdminComptesPro.tsx",
        "routes": [
          "/superadmin/admin-comptes-pro"
        ],
        "cliquables": 23,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 47,
        "mots": 104
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/pro/DossierPro.tsx",
        "route": "/pro/dossier",
        "composants": [
          "trpc.proAccount"
        ]
      }
    ],
    "procedures": [
      "activate",
      "check",
      "health",
      "list",
      "mine",
      "requirements",
      "review",
      "save",
      "seed",
      "setPaymentStatus",
      "submit"
    ],
    "tables": [
      "pro_account_applications",
      "pro_account_rules"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 47,
    "mots": 104,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      }
    ]
  },
  {
    "moteur": "pro_portal",
    "label": "Pro Portal Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "pro-portal",
      "modules/pro.ts",
      "routers/pro.ts",
      "routers/api.ts",
      "services/apiIntegration.ts"
    ],
    "routeurs": [
      "proPortal",
      "pro",
      "api",
      "formation"
    ],
    "fichiersServeur": 9,
    "dependancesDeclarees": [
      "audit",
      "core",
      "country",
      "payment",
      "pro_account"
    ],
    "dependancesDetectees": [
      "audit",
      "core",
      "country",
      "payment",
      "pro_account"
    ],
    "dependances": [
      "audit",
      "core",
      "country",
      "payment",
      "pro_account"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "audit": [
        "routers/pro.ts importe audit.ts"
      ],
      "core": [
        "pro-portal/index.ts importe trpc.ts",
        "pro-portal/service.ts importe db.ts",
        "routers/api.ts importe trpc.ts"
      ],
      "country": [
        "pro-portal/service.ts importe country-os/index.ts",
        "pro-portal/service.ts lit la règle pays"
      ],
      "payment": [
        "pro-portal/service.ts importe payment-engine/products.ts"
      ],
      "pro_account": [
        "client/src/pages/pro/DossierPro.tsx appelle trpc.proAccount"
      ]
    },
    "dependants": [
      "partner_engine",
      "pro_account",
      "vo_espaces"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/espace-pro",
      "/mobile",
      "/mobile/app-android",
      "/mobile/app-i-o-s",
      "/mobile/mode-hors-ligne",
      "/mobile/notifications-push",
      "/pro",
      "/pro/demarrer",
      "/pro/dossier"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/EspacePro.tsx",
        "routes": [
          "/espace-pro"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 27,
        "mots": 118
      },
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/mobile",
          "/pro"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/mobile/AppAndroid.tsx",
        "routes": [
          "/mobile/app-android"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/mobile/AppIOS.tsx",
        "routes": [
          "/mobile/app-i-o-s"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/mobile/ModeHorsLigne.tsx",
        "routes": [
          "/mobile/mode-hors-ligne"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/mobile/NotificationsPush.tsx",
        "routes": [
          "/mobile/notifications-push"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/pro/DossierPro.tsx",
        "routes": [
          "/pro/dossier"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 25,
        "mots": 184
      },
      {
        "fichier": "client/src/pages/pro/PortailPro.tsx",
        "routes": [
          "/pro/demarrer"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 26,
        "mots": 102
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/InscriptionProVO.tsx",
        "route": "/inscription-pro-vo",
        "composants": [
          "trpc.pro"
        ]
      },
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.formation"
        ]
      },
      {
        "fichier": "client/src/pages/partenaires/InscriptionPartenaire.tsx",
        "route": "/partenaires/inscription-partenaire",
        "composants": [
          "trpc.proPortal"
        ]
      }
    ],
    "procedures": [
      "checkPieceCompatibility",
      "countries",
      "createProfile",
      "dashboard",
      "documentAlerts",
      "draft",
      "estimate",
      "geocode",
      "getProfile",
      "health",
      "listDocuments",
      "listPiecesInterdites",
      "locationAddVehicule",
      "locationCreateContrat",
      "locationGetCalendrier",
      "locationListContrats",
      "locationListFlotte",
      "locationUpdateStatus",
      "lookupVehicle",
      "modules",
      "professions",
      "quote",
      "requirements",
      "saveDraft",
      "seed",
      "uploadDocument",
      "verifyDocument",
      "vtcAddChauffeur",
      "vtcAddVehicule",
      "vtcAssignChauffeur",
      "vtcCreateSociete",
      "vtcGetSociete",
      "vtcListChauffeurs",
      "vtcListVehicules",
      "vtcUpdateChauffeurStatus"
    ],
    "tables": [
      "gps_devices",
      "gps_historique",
      "livraison_pieces_interdites",
      "livraison_pieces_rules",
      "location_calendrier",
      "location_contrats",
      "location_flotte",
      "pro_dashboard_stats",
      "pro_documents",
      "pro_portal_drafts",
      "pro_portal_modules",
      "pro_portal_professions",
      "pro_profiles",
      "vente_pro_vehicules",
      "vtc_chauffeurs",
      "vtc_demandes",
      "vtc_societes",
      "vtc_vehicules"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 90,
    "mots": 438,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/mobile/AppAndroid.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/mobile/AppIOS.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/mobile/ModeHorsLigne.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/mobile/NotificationsPush.tsx (2 texte(s))"
      }
    ]
  },
  {
    "moteur": "product_engine",
    "label": "Google Product Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "product-engine"
    ],
    "routeurs": [
      "productEngine"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "core",
      "event_bus",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "event_bus",
      "smart"
    ],
    "dependances": [
      "core",
      "event_bus",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "product-engine/index.ts importe trpc.ts",
        "product-engine/service.ts importe db.ts",
        "product-engine/service.ts importe env.ts"
      ],
      "event_bus": [
        "abonné au bus"
      ],
      "smart": [
        "product-engine/service.ts importe smart-engine/services/alert-engine.ts",
        "product-engine/service.ts importe smart-engine/services/activity-log.ts",
        "product-engine/service.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [
      "event_bus",
      "pieces"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [
      "piece.modifiee"
    ],
    "abonnements": [
      {
        "eventType": "piece.modifiee",
        "handler": "produit_sync"
      }
    ],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/produits-google"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreProduitsGoogle.tsx",
        "routes": [
          "/admin/produits-google"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 18,
        "mots": 97
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "chaine",
      "labels",
      "latest",
      "merchant",
      "pipelines",
      "refresh"
    ],
    "tables": [
      "product_feed_items",
      "product_feed_runs",
      "product_sync_events"
    ],
    "acces": [
      "admin"
    ],
    "textes": 18,
    "mots": 97,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "proximity_engine",
    "label": "Proximity Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "proximity-engine"
    ],
    "routeurs": [
      "proximity"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "avis_reputation",
      "core",
      "country",
      "notification",
      "payment"
    ],
    "dependancesDetectees": [
      "avis_reputation",
      "core",
      "country",
      "notification",
      "payment"
    ],
    "dependances": [
      "avis_reputation",
      "core",
      "country",
      "notification",
      "payment"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "avis_reputation": [
        "proximity-engine/service.ts importe reputation-engine/ranking.ts"
      ],
      "core": [
        "proximity-engine/index.ts importe trpc.ts",
        "proximity-engine/service.ts importe db.ts"
      ],
      "country": [
        "proximity-engine/service.ts importe country-os/index.ts",
        "proximity-engine/service.ts lit la règle pays"
      ],
      "notification": [
        "proximity-engine/service.ts importe notification-os/triggers.ts"
      ],
      "payment": [
        "proximity-engine/service.ts importe payment-engine/products.ts"
      ]
    },
    "dependants": [
      "depannage",
      "livraison"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/pres-de-moi",
      "/superadmin/mini-plateformes"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/MiniPlateformes.tsx",
        "routes": [
          "/superadmin/mini-plateformes"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 42
      },
      {
        "fichier": "client/src/pages/PresDeMoi.tsx",
        "routes": [
          "/pres-de-moi"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 52
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "health",
      "nearby",
      "services",
      "universes"
    ],
    "tables": [],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 15,
    "mots": 94,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "rd_lab",
    "label": "Automotive R&D Lab",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "rd-lab",
      "modules/future.ts"
    ],
    "routeurs": [
      "rdLab",
      "lab"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "connaissance_auto",
      "core",
      "country",
      "energie_recharge",
      "smart"
    ],
    "dependancesDetectees": [
      "connaissance_auto",
      "core",
      "country",
      "energie_recharge",
      "smart"
    ],
    "dependances": [
      "connaissance_auto",
      "core",
      "country",
      "energie_recharge",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "connaissance_auto": [
        "rd-lab/service.ts importe knowledge-engine/service.ts"
      ],
      "core": [
        "rd-lab/index.ts importe trpc.ts",
        "rd-lab/service.ts importe db.ts",
        "rd-lab/service.ts importe schema.ts"
      ],
      "country": [
        "rd-lab/service.ts importe country-os/index.ts"
      ],
      "energie_recharge": [
        "rd-lab/service.ts importe charging-engine/schema.ts"
      ],
      "smart": [
        "rd-lab/service.ts importe smart-engine/services/activity-log.ts"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/labo-rd",
      "/labs",
      "/labs/academie-m-k-a-p-m-s",
      "/labs/analyse-marche-mondiale",
      "/labs/analyse-trafic",
      "/labs/archives-historiques",
      "/labs/assistant-fondateur",
      "/labs/audit-qualite",
      "/labs/automatisation-complete",
      "/labs/benchmark-flottes",
      "/labs/bibliotheque-automobile",
      "/labs/bibliotheque-reparations",
      "/labs/brevets",
      "/labs/campus-automobile",
      "/labs/carnet-entretien-auto",
      "/labs/cartographie-mondiale",
      "/labs/centre-acquisitions-labs",
      "/labs/centre-appels-offres",
      "/labs/centre-coordination-mondial",
      "/labs/centre-decisions-strategiques",
      "/labs/centre-documentation",
      "/labs/centre-donnees-mondiales",
      "/labs/centre-expansion-auto",
      "/labs/centre-expansion-automatique2",
      "/labs/centre-export-auto",
      "/labs/centre-formation-afrique",
      "/labs/centre-innovation",
      "/labs/centre-intelligence-marche",
      "/labs/centre-investissements-labs",
      "/labs/centre-opportunites-mondiales",
      "/labs/centre-recherche-auto",
      "/labs/centre-recherche-m-k-a-p-m-s",
      "/labs/centre-strategie-groupe",
      "/labs/centre-traduction",
      "/labs/centres-mobilite-urbaine",
      "/labs/centres-reconditionnement",
      "/labs/centres-reconditionnement2",
      "/labs/centres-techniques",
      "/labs/certification-occasion",
      "/labs/certification-vehicule",
      "/labs/coffrefort-international",
      "/labs/conferences-internationales",
      "/labs/controle-distance-flottes",
      "/labs/controle-production",
      "/labs/corridors-logistiques",
      "/labs/data-cloud-auto",
      "/labs/encyclopedie-automobile",
      "/labs/energy-afrique",
      "/labs/energy-batteries",
      "/labs/expansion-mondiale",
      "/labs/filiales",
      "/labs/fleet-network-mondial",
      "/labs/fondation-formation",
      "/labs/fondation-mobilite",
      "/labs/fonds-developpement",
      "/labs/fonds-developpement2",
      "/labs/fonds-expansion-afrique",
      "/labs/fonds-innovation",
      "/labs/formations-certifiantes",
      "/labs/franchise-m-k-a-p-m-s",
      "/labs/franchises-global",
      "/labs/future2050",
      "/labs/gestion-entrepots",
      "/labs/gestion-flotte-intelligente",
      "/labs/gestion-flottes-connectees",
      "/labs/gestion-groupe",
      "/labs/gestion-marques",
      "/labs/gestion-mobilite-entreprises",
      "/labs/global-standards",
      "/labs/hub-afrique",
      "/labs/hubs-regionaux",
      "/labs/i-a-automobile",
      "/labs/i-a-avancee",
      "/labs/i-a-conseiller-achat",
      "/labs/i-a-conseiller-garage",
      "/labs/i-a-conseiller-vente",
      "/labs/i-a-operationnelle-mondiale",
      "/labs/identite-numerique-entreprise",
      "/labs/identite-numerique-vehicule",
      "/labs/identite-numerique-vehicule2",
      "/labs/inspection-distance",
      "/labs/institut-formation",
      "/labs/jumeau-numerique",
      "/labs/jumeau-numerique-mondial",
      "/labs/jumeaux-numeriques",
      "/labs/label-certifie",
      "/labs/label-mondial",
      "/labs/laboratoires-futurs",
      "/labs/licences-m-k-a-p-m-s",
      "/labs/logistiques-centres",
      "/labs/m-k-a-p-m-s-world",
      "/labs/maintenance-predictive",
      "/labs/mobilite-complete",
      "/labs/musee-numerique",
      "/labs/norme-m-k-a-p-m-s",
      "/labs/objectif-ultime",
      "/labs/observatoire-automobile",
      "/labs/observatoire-mondial",
      "/labs/parc-industriel",
      "/labs/passeport-numerique-vehicule",
      "/labs/place-marche-b2-b",
      "/labs/programme-innovation",
      "/labs/programme-jeunes-entrepreneurs",
      "/labs/programmes-strategiques",
      "/labs/reseau-alliances",
      "/labs/reseau-assistance247",
      "/labs/reseau-centres-formation",
      "/labs/reseau-convoyeurs",
      "/labs/reseau-depannage-afrique",
      "/labs/reseau-depanneurs",
      "/labs/reseau-distribution",
      "/labs/reseau-experts",
      "/labs/reseau-experts-global",
      "/labs/reseau-fournisseurs-global",
      "/labs/reseau-garages-afrique",
      "/labs/reseau-industriel",
      "/labs/reseau-mobilite-mondiale",
      "/labs/reseau-mondial-complet",
      "/labs/reseau-mondial-partenaires",
      "/labs/reseau-mondial-services",
      "/labs/reseau-pieces-afrique",
      "/labs/reseau-usines",
      "/labs/signature-universelle",
      "/labs/smart-vehicles",
      "/labs/stationnement-intelligent",
      "/labs/systemes-proprietaires",
      "/labs/telematique",
      "/labs/tests-pilotes",
      "/labs/vehicules-connectes",
      "/labs/vision-finale-m-k-a-p-m-s",
      "/labs/world-vision",
      "/labs/zones-techniques"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/LaboRD.tsx",
        "routes": [
          "/admin/labo-rd"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 62,
        "mots": 382
      },
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/labs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/AcademieMKAPMS.tsx",
        "routes": [
          "/labs/academie-m-k-a-p-m-s"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/AnalyseMarcheMondiale.tsx",
        "routes": [
          "/labs/analyse-marche-mondiale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/AnalyseTrafic.tsx",
        "routes": [
          "/labs/analyse-trafic"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/ArchivesHistoriques.tsx",
        "routes": [
          "/labs/archives-historiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/AssistantFondateur.tsx",
        "routes": [
          "/labs/assistant-fondateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/AuditQualite.tsx",
        "routes": [
          "/labs/audit-qualite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/AutomatisationComplete.tsx",
        "routes": [
          "/labs/automatisation-complete"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/BenchmarkFlottes.tsx",
        "routes": [
          "/labs/benchmark-flottes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/BibliothequeAutomobile.tsx",
        "routes": [
          "/labs/bibliotheque-automobile"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/BibliothequeReparations.tsx",
        "routes": [
          "/labs/bibliotheque-reparations"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/Brevets.tsx",
        "routes": [
          "/labs/brevets"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CampusAutomobile.tsx",
        "routes": [
          "/labs/campus-automobile"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/CarnetEntretienAuto.tsx",
        "routes": [
          "/labs/carnet-entretien-auto"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/CartographieMondiale.tsx",
        "routes": [
          "/labs/cartographie-mondiale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/CentreAcquisitionsLabs.tsx",
        "routes": [
          "/labs/centre-acquisitions-labs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/CentreAppelsOffres.tsx",
        "routes": [
          "/labs/centre-appels-offres"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/CentreCoordinationMondial.tsx",
        "routes": [
          "/labs/centre-coordination-mondial"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CentreDecisionsStrategiques.tsx",
        "routes": [
          "/labs/centre-decisions-strategiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/CentreDocumentation.tsx",
        "routes": [
          "/labs/centre-documentation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/CentreDonneesMondiales.tsx",
        "routes": [
          "/labs/centre-donnees-mondiales"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/CentreExpansionAuto.tsx",
        "routes": [
          "/labs/centre-expansion-auto"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/CentreExpansionAutomatique2.tsx",
        "routes": [
          "/labs/centre-expansion-automatique2"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CentreExportAuto.tsx",
        "routes": [
          "/labs/centre-export-auto"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/CentreFormationAfrique.tsx",
        "routes": [
          "/labs/centre-formation-afrique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CentreInnovation.tsx",
        "routes": [
          "/labs/centre-innovation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/CentreIntelligenceMarche.tsx",
        "routes": [
          "/labs/centre-intelligence-marche"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CentreInvestissementsLabs.tsx",
        "routes": [
          "/labs/centre-investissements-labs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/CentreOpportunitesMondiales.tsx",
        "routes": [
          "/labs/centre-opportunites-mondiales"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CentreRechercheAuto.tsx",
        "routes": [
          "/labs/centre-recherche-auto"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CentreRechercheMKAPMS.tsx",
        "routes": [
          "/labs/centre-recherche-m-k-a-p-m-s"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/CentreStrategieGroupe.tsx",
        "routes": [
          "/labs/centre-strategie-groupe"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/CentreTraduction.tsx",
        "routes": [
          "/labs/centre-traduction"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/CentresMobiliteUrbaine.tsx",
        "routes": [
          "/labs/centres-mobilite-urbaine"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CentresReconditionnement.tsx",
        "routes": [
          "/labs/centres-reconditionnement"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/CentresReconditionnement2.tsx",
        "routes": [
          "/labs/centres-reconditionnement2"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/CentresTechniques.tsx",
        "routes": [
          "/labs/centres-techniques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/CertificationOccasion.tsx",
        "routes": [
          "/labs/certification-occasion"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/CertificationVehicule.tsx",
        "routes": [
          "/labs/certification-vehicule"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/CoffrefortInternational.tsx",
        "routes": [
          "/labs/coffrefort-international"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/ConferencesInternationales.tsx",
        "routes": [
          "/labs/conferences-internationales"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/ControleDistanceFlottes.tsx",
        "routes": [
          "/labs/controle-distance-flottes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/labs/ControleProduction.tsx",
        "routes": [
          "/labs/controle-production"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/CorridorsLogistiques.tsx",
        "routes": [
          "/labs/corridors-logistiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/DataCloudAuto.tsx",
        "routes": [
          "/labs/data-cloud-auto"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/EncyclopedieAutomobile.tsx",
        "routes": [
          "/labs/encyclopedie-automobile"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/EnergyAfrique.tsx",
        "routes": [
          "/labs/energy-afrique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/EnergyBatteries.tsx",
        "routes": [
          "/labs/energy-batteries"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/ExpansionMondiale.tsx",
        "routes": [
          "/labs/expansion-mondiale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/Filiales.tsx",
        "routes": [
          "/labs/filiales"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/labs/FleetNetworkMondial.tsx",
        "routes": [
          "/labs/fleet-network-mondial"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/FondationFormation.tsx",
        "routes": [
          "/labs/fondation-formation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/FondationMobilite.tsx",
        "routes": [
          "/labs/fondation-mobilite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/FondsDeveloppement.tsx",
        "routes": [
          "/labs/fonds-developpement"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/FondsDeveloppement2.tsx",
        "routes": [
          "/labs/fonds-developpement2"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/FondsExpansionAfrique.tsx",
        "routes": [
          "/labs/fonds-expansion-afrique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/FondsInnovation.tsx",
        "routes": [
          "/labs/fonds-innovation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/FormationsCertifiantes.tsx",
        "routes": [
          "/labs/formations-certifiantes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/FranchiseMKAPMS.tsx",
        "routes": [
          "/labs/franchise-m-k-a-p-m-s"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/FranchisesGlobal.tsx",
        "routes": [
          "/labs/franchises-global"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/labs/Future2050.tsx",
        "routes": [
          "/labs/future2050"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/GestionEntrepots.tsx",
        "routes": [
          "/labs/gestion-entrepots"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/GestionFlotteIntelligente.tsx",
        "routes": [
          "/labs/gestion-flotte-intelligente"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/GestionFlottesConnectees.tsx",
        "routes": [
          "/labs/gestion-flottes-connectees"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/GestionGroupe.tsx",
        "routes": [
          "/labs/gestion-groupe"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/GestionMarques.tsx",
        "routes": [
          "/labs/gestion-marques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/GestionMobiliteEntreprises.tsx",
        "routes": [
          "/labs/gestion-mobilite-entreprises"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/GlobalStandards.tsx",
        "routes": [
          "/labs/global-standards"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/HubAfrique.tsx",
        "routes": [
          "/labs/hub-afrique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/HubsRegionaux.tsx",
        "routes": [
          "/labs/hubs-regionaux"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/IAAutomobile.tsx",
        "routes": [
          "/labs/i-a-automobile"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/IAAvancee.tsx",
        "routes": [
          "/labs/i-a-avancee"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/IAConseillerAchat.tsx",
        "routes": [
          "/labs/i-a-conseiller-achat"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/IAConseillerGarage.tsx",
        "routes": [
          "/labs/i-a-conseiller-garage"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/IAConseillerVente.tsx",
        "routes": [
          "/labs/i-a-conseiller-vente"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/IAOperationnelleMondiale.tsx",
        "routes": [
          "/labs/i-a-operationnelle-mondiale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/IdentiteNumeriqueEntreprise.tsx",
        "routes": [
          "/labs/identite-numerique-entreprise"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/IdentiteNumeriqueVehicule.tsx",
        "routes": [
          "/labs/identite-numerique-vehicule"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/IdentiteNumeriqueVehicule2.tsx",
        "routes": [
          "/labs/identite-numerique-vehicule2"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/labs/InspectionDistance.tsx",
        "routes": [
          "/labs/inspection-distance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/InstitutFormation.tsx",
        "routes": [
          "/labs/institut-formation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/labs/JumeauNumerique.tsx",
        "routes": [
          "/labs/jumeau-numerique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/JumeauNumeriqueMondial.tsx",
        "routes": [
          "/labs/jumeau-numerique-mondial"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/JumeauxNumeriques.tsx",
        "routes": [
          "/labs/jumeaux-numeriques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/LabelCertifie.tsx",
        "routes": [
          "/labs/label-certifie"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/LabelMondial.tsx",
        "routes": [
          "/labs/label-mondial"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/LaboratoiresFuturs.tsx",
        "routes": [
          "/labs/laboratoires-futurs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/LicencesMKAPMS.tsx",
        "routes": [
          "/labs/licences-m-k-a-p-m-s"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/LogistiquesCentres.tsx",
        "routes": [
          "/labs/logistiques-centres"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/MKAPMSWorld.tsx",
        "routes": [
          "/labs/m-k-a-p-m-s-world"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/MaintenancePredictive.tsx",
        "routes": [
          "/labs/maintenance-predictive"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/MobiliteComplete.tsx",
        "routes": [
          "/labs/mobilite-complete"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/MuseeNumerique.tsx",
        "routes": [
          "/labs/musee-numerique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/NormeMKAPMS.tsx",
        "routes": [
          "/labs/norme-m-k-a-p-m-s"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ObjectifUltime.tsx",
        "routes": [
          "/labs/objectif-ultime"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ObservatoireAutomobile.tsx",
        "routes": [
          "/labs/observatoire-automobile"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/ObservatoireMondial.tsx",
        "routes": [
          "/labs/observatoire-mondial"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/ParcIndustriel.tsx",
        "routes": [
          "/labs/parc-industriel"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/PasseportNumeriqueVehicule.tsx",
        "routes": [
          "/labs/passeport-numerique-vehicule"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/PlaceMarcheB2B.tsx",
        "routes": [
          "/labs/place-marche-b2-b"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/labs/ProgrammeInnovation.tsx",
        "routes": [
          "/labs/programme-innovation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/ProgrammeJeunesEntrepreneurs.tsx",
        "routes": [
          "/labs/programme-jeunes-entrepreneurs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ProgrammesStrategiques.tsx",
        "routes": [
          "/labs/programmes-strategiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/ReseauAlliances.tsx",
        "routes": [
          "/labs/reseau-alliances"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ReseauAssistance247.tsx",
        "routes": [
          "/labs/reseau-assistance247"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ReseauCentresFormation.tsx",
        "routes": [
          "/labs/reseau-centres-formation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/labs/ReseauConvoyeurs.tsx",
        "routes": [
          "/labs/reseau-convoyeurs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/ReseauDepannageAfrique.tsx",
        "routes": [
          "/labs/reseau-depannage-afrique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/ReseauDepanneurs.tsx",
        "routes": [
          "/labs/reseau-depanneurs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/ReseauDistribution.tsx",
        "routes": [
          "/labs/reseau-distribution"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/ReseauExperts.tsx",
        "routes": [
          "/labs/reseau-experts"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/ReseauExpertsGlobal.tsx",
        "routes": [
          "/labs/reseau-experts-global"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ReseauFournisseursGlobal.tsx",
        "routes": [
          "/labs/reseau-fournisseurs-global"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/ReseauGaragesAfrique.tsx",
        "routes": [
          "/labs/reseau-garages-afrique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/ReseauIndustriel.tsx",
        "routes": [
          "/labs/reseau-industriel"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/ReseauMobiliteMondiale.tsx",
        "routes": [
          "/labs/reseau-mobilite-mondiale"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ReseauMondialComplet.tsx",
        "routes": [
          "/labs/reseau-mondial-complet"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ReseauMondialPartenaires.tsx",
        "routes": [
          "/labs/reseau-mondial-partenaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/ReseauMondialServices.tsx",
        "routes": [
          "/labs/reseau-mondial-services"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/ReseauPiecesAfrique.tsx",
        "routes": [
          "/labs/reseau-pieces-afrique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/ReseauUsines.tsx",
        "routes": [
          "/labs/reseau-usines"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/SignatureUniverselle.tsx",
        "routes": [
          "/labs/signature-universelle"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/SmartVehicles.tsx",
        "routes": [
          "/labs/smart-vehicles"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/StationnementIntelligent.tsx",
        "routes": [
          "/labs/stationnement-intelligent"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/SystemesProprietaires.tsx",
        "routes": [
          "/labs/systemes-proprietaires"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/Telematique.tsx",
        "routes": [
          "/labs/telematique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 5
      },
      {
        "fichier": "client/src/pages/labs/TestsPilotes.tsx",
        "routes": [
          "/labs/tests-pilotes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/labs/VehiculesConnectes.tsx",
        "routes": [
          "/labs/vehicules-connectes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/VisionFinaleMKAPMS.tsx",
        "routes": [
          "/labs/vision-finale-m-k-a-p-m-s"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/labs/WorldVision.tsx",
        "routes": [
          "/labs/world-vision"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ZonesTechniques.tsx",
        "routes": [
          "/labs/zones-techniques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.lab"
        ]
      }
    ],
    "procedures": [
      "actifs",
      "chaine",
      "creerProjet",
      "declarerActif",
      "ecosysteme",
      "health",
      "majProjet",
      "projets",
      "referentiels",
      "releverEcosysteme",
      "relevesEcosysteme",
      "renseignerMaillon",
      "stats",
      "verserAuGraphe"
    ],
    "tables": [
      "controle_technique_centers",
      "controle_technique_rdv",
      "financement_requests",
      "formation_enrollments",
      "formations",
      "karting_centers",
      "karting_events",
      "karting_fleet",
      "karting_registrations",
      "lavage_bookings",
      "lavage_stations",
      "rd_assets",
      "rd_chain_links",
      "rd_ecosystem_snapshots",
      "rd_projects",
      "suppliers"
    ],
    "acces": [
      "direction",
      "pdg"
    ],
    "textes": 456,
    "mots": 1363,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/AcademieMKAPMS.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/AnalyseMarcheMondiale.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/AnalyseTrafic.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ArchivesHistoriques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/AssistantFondateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/AuditQualite.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/AutomatisationComplete.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/BenchmarkFlottes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/BibliothequeAutomobile.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/BibliothequeReparations.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/Brevets.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CampusAutomobile.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CarnetEntretienAuto.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CartographieMondiale.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreAcquisitionsLabs.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreAppelsOffres.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreCoordinationMondial.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreDecisionsStrategiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreDocumentation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreDonneesMondiales.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreExpansionAuto.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreExpansionAutomatique2.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreExportAuto.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreFormationAfrique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreInnovation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreIntelligenceMarche.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreInvestissementsLabs.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreOpportunitesMondiales.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreRechercheAuto.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreRechercheMKAPMS.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreStrategieGroupe.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentreTraduction.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentresMobiliteUrbaine.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentresReconditionnement.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentresReconditionnement2.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CentresTechniques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CertificationOccasion.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CertificationVehicule.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CoffrefortInternational.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ConferencesInternationales.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ControleDistanceFlottes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ControleProduction.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/CorridorsLogistiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/DataCloudAuto.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/EncyclopedieAutomobile.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/EnergyAfrique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/EnergyBatteries.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ExpansionMondiale.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/Filiales.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FleetNetworkMondial.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FondationFormation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FondationMobilite.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FondsDeveloppement.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FondsDeveloppement2.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FondsExpansionAfrique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FondsInnovation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FormationsCertifiantes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FranchiseMKAPMS.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/FranchisesGlobal.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/Future2050.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/GestionEntrepots.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/GestionFlotteIntelligente.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/GestionFlottesConnectees.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/GestionGroupe.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/GestionMarques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/GestionMobiliteEntreprises.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/GlobalStandards.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/HubAfrique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/HubsRegionaux.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IAAutomobile.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IAAvancee.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IAConseillerAchat.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IAConseillerGarage.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IAConseillerVente.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IAOperationnelleMondiale.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IdentiteNumeriqueEntreprise.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IdentiteNumeriqueVehicule.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/IdentiteNumeriqueVehicule2.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/InspectionDistance.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/InstitutFormation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/JumeauNumerique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/JumeauNumeriqueMondial.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/JumeauxNumeriques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/LabelCertifie.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/LabelMondial.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/LaboratoiresFuturs.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/LicencesMKAPMS.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/LogistiquesCentres.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/MKAPMSWorld.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/MaintenancePredictive.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/MobiliteComplete.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/MuseeNumerique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/NormeMKAPMS.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ObjectifUltime.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ObservatoireAutomobile.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ObservatoireMondial.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ParcIndustriel.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/PasseportNumeriqueVehicule.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/PlaceMarcheB2B.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ProgrammeInnovation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ProgrammeJeunesEntrepreneurs.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ProgrammesStrategiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauAlliances.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauAssistance247.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauCentresFormation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauConvoyeurs.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauDepannageAfrique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauDepanneurs.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauDistribution.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauExperts.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauExpertsGlobal.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauFournisseursGlobal.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauGaragesAfrique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauIndustriel.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauMobiliteMondiale.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauMondialComplet.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauMondialPartenaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauMondialServices.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauPiecesAfrique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauUsines.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/SignatureUniverselle.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/SmartVehicles.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/StationnementIntelligent.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/SystemesProprietaires.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/Telematique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/TestsPilotes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/VehiculesConnectes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/VisionFinaleMKAPMS.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/WorldVision.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ZonesTechniques.tsx (3 texte(s))"
      }
    ]
  },
  {
    "moteur": "redirection",
    "label": "Redirection Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "redirection-engine",
      "data/client-routes.ts"
    ],
    "routeurs": [
      "redirectionEngine"
    ],
    "fichiersServeur": 7,
    "dependancesDeclarees": [
      "core",
      "identity",
      "permission",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "permission",
      "smart"
    ],
    "dependances": [
      "core",
      "identity",
      "permission",
      "smart"
    ],
    "integrationsTechniques": [
      "identity",
      "permission"
    ],
    "preuvesDependances": {
      "core": [
        "redirection-engine/couverture.ts importe db.ts",
        "redirection-engine/router.ts importe trpc.ts",
        "redirection-engine/service.ts importe db.ts"
      ],
      "identity": [
        "redirection-engine/router.ts exige une session Identity (procédure protégée)"
      ],
      "permission": [
        "redirection-engine/router.ts filtre par rôle (procédure pro/admin/direction/PDG)"
      ],
      "smart": [
        "redirection-engine/service.ts importe smart-engine/services/activity-log.ts"
      ]
    },
    "dependants": [
      "achat",
      "activation_audit",
      "analytics",
      "atelier",
      "auto_branchement",
      "boutons",
      "comptabilite",
      "continuous_test",
      "location",
      "resilience",
      "seo",
      "smart",
      "vo_espaces"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/superadmin/redirection-engine"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/RedirectionEngine/ControlCenter.tsx",
        "routes": [
          "/superadmin/redirection-engine"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 60,
        "mots": 336
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Comptabilite.tsx",
        "route": "/comptabilite",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/VoitureOccasion.tsx",
        "route": "/voiture-occasion",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/service/:slug",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/service/:slug/:ville",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/piece/:slug",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/location/:slug",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/marque/:marque",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/marque/:marque/:modele",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/ville/:slug",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/pays/:slug",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/pays/:slug/:ville",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/reparation/:slug",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/reparation/:slug/:vehicule",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "route": "/region/:slug",
        "composants": [
          "lib/redirect.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/NotFound.tsx",
        "route": "*",
        "composants": [
          "trpc.redirectionEngine"
        ]
      }
    ],
    "procedures": [
      "broken",
      "couverture",
      "createRule",
      "deleteRule",
      "logs",
      "peek",
      "reportOutcome",
      "resolve",
      "resolvePath",
      "rules",
      "stats",
      "updateRule"
    ],
    "tables": [
      "redir_logs",
      "redir_rules"
    ],
    "acces": [
      "pdg",
      "public"
    ],
    "textes": 60,
    "mots": 336,
    "battement": "contrat",
    "manques": []
  },
  {
    "moteur": "resilience",
    "label": "Resilience & Safety Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "resilience"
    ],
    "routeurs": [
      "resilience"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "core",
      "country",
      "identity",
      "redirection",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "identity",
      "redirection",
      "smart"
    ],
    "dependances": [
      "core",
      "country",
      "identity",
      "redirection",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "resilience/index.ts importe trpc.ts",
        "resilience/service.ts importe db.ts"
      ],
      "country": [
        "resilience/service.ts importe country-os/index.ts"
      ],
      "identity": [
        "resilience/gate.ts importe auth.ts",
        "resilience/index.ts exige une session Identity (procédure protégée)"
      ],
      "redirection": [
        "resilience/service.ts importe redirection-engine/schema.ts"
      ],
      "smart": [
        "resilience/service.ts importe smart-engine/services/auto-fix.ts"
      ]
    },
    "dependants": [
      "ai_fabric",
      "command_center",
      "completion_center",
      "intelligences",
      "smart"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/resilience"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreResilience.tsx",
        "routes": [
          "/admin/resilience"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 55,
        "mots": 285
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "acces",
      "autoReparer",
      "basculer",
      "completerLecon",
      "confirmerCritique",
      "demanderConfirmation",
      "demandesCritiques",
      "enregistrerEtape",
      "health",
      "journalPortees",
      "lecons",
      "ouvrirPassage",
      "passages",
      "portees",
      "referentiels",
      "refuserCritique",
      "stats",
      "validerLecon"
    ],
    "tables": [
      "rs_critical_requests",
      "rs_emergency_events",
      "rs_emergency_scopes",
      "rs_failure_lessons",
      "rs_pipeline_runs"
    ],
    "acces": [
      "direction",
      "pdg",
      "public"
    ],
    "textes": 55,
    "mots": 285,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "risque_import",
    "label": "Import Risk Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "import-risk"
    ],
    "routeurs": [
      "risqueImport"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "country",
      "energie_recharge",
      "event_bus",
      "politique_pays",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "energie_recharge",
      "event_bus",
      "politique_pays",
      "smart"
    ],
    "dependances": [
      "core",
      "country",
      "energie_recharge",
      "event_bus",
      "politique_pays",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "import-risk/index.ts importe trpc.ts",
        "import-risk/service.ts importe db.ts",
        "import-risk/service.ts importe schema.ts"
      ],
      "country": [
        "import-risk/service.ts importe country-os/index.ts"
      ],
      "energie_recharge": [
        "import-risk/service.ts importe charging-engine/schema.ts"
      ],
      "event_bus": [
        "import-risk/service.ts importe event-bus/service.ts",
        "import-risk/service.ts publie des événements"
      ],
      "politique_pays": [
        "import-risk/service.ts importe country-policy/service.ts"
      ],
      "smart": [
        "publie vehicule.risque_import, consommé par smart"
      ]
    },
    "dependants": [
      "achat",
      "achat_officiel",
      "achat_particulier",
      "achat_pro",
      "estimation"
    ],
    "evenementsPublies": [
      "vehicule.risque_import"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "import_risk"
    ],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/particulier/vehicule/:id",
        "composants": [
          "components/AlerteRisqueImport.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/professionnel/vehicule/:id",
        "composants": [
          "components/AlerteRisqueImport.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/mkapms-officiel/vehicule/:id",
        "composants": [
          "components/AlerteRisqueImport.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/vehicule/:id",
        "composants": [
          "components/AlerteRisqueImport.tsx"
        ]
      }
    ],
    "procedures": [
      "diagnostic",
      "niveaux"
    ],
    "tables": [],
    "acces": [
      "public"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "pont_os",
    "manques": []
  },
  {
    "moteur": "scheduler",
    "label": "Scheduler OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "scheduler-os"
    ],
    "routeurs": [
      "schedulerOs"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "core",
      "identity",
      "notification"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "notification"
    ],
    "dependances": [
      "core",
      "identity",
      "notification"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "scheduler-os/index.ts importe db.ts",
        "scheduler-os/index.ts importe trpc.ts"
      ],
      "identity": [
        "scheduler-os/index.ts importe identity-os/contract.ts",
        "scheduler-os/index.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "scheduler-os/index.ts importe notification-os/index.ts",
        "scheduler-os/index.ts déclenche notifyEvent"
      ]
    },
    "dependants": [
      "contract",
      "controle_technique",
      "depannage",
      "garage",
      "livraison",
      "monitoring",
      "transport",
      "workflow"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/automatisations",
      "/automatisations/centre-alertes-strategiques",
      "/automatisations/centre-auto-marketing",
      "/automatisations/centre-croissance",
      "/automatisations/centre-k-p-i",
      "/automatisations/centre-objectifs-entreprise",
      "/automatisations/centre-performance-i-a",
      "/automatisations/escalades-automatiques",
      "/automatisations/files-attente",
      "/automatisations/i-a-affectation",
      "/automatisations/i-a-controle",
      "/automatisations/i-a-priorisation",
      "/automatisations/moteur-taches",
      "/automatisations/moteur-workflow",
      "/automatisations/objectif-automatisations",
      "/automatisations/workflows-personnalises"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/automatisations"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/automatisations/CentreAlertesStrategiques.tsx",
        "routes": [
          "/automatisations/centre-alertes-strategiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/CentreAutoMarketing.tsx",
        "routes": [
          "/automatisations/centre-auto-marketing"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/CentreCroissance.tsx",
        "routes": [
          "/automatisations/centre-croissance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/CentreKPI.tsx",
        "routes": [
          "/automatisations/centre-k-p-i"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/CentreObjectifsEntreprise.tsx",
        "routes": [
          "/automatisations/centre-objectifs-entreprise"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/CentrePerformanceIA.tsx",
        "routes": [
          "/automatisations/centre-performance-i-a"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/EscaladesAutomatiques.tsx",
        "routes": [
          "/automatisations/escalades-automatiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/FilesAttente.tsx",
        "routes": [
          "/automatisations/files-attente"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/IAAffectation.tsx",
        "routes": [
          "/automatisations/i-a-affectation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/IAControle.tsx",
        "routes": [
          "/automatisations/i-a-controle"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/automatisations/IAPriorisation.tsx",
        "routes": [
          "/automatisations/i-a-priorisation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/automatisations/MoteurTaches.tsx",
        "routes": [
          "/automatisations/moteur-taches"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/automatisations/MoteurWorkflow.tsx",
        "routes": [
          "/automatisations/moteur-workflow"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/automatisations/ObjectifAutomatisations.tsx",
        "routes": [
          "/automatisations/objectif-automatisations"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/automatisations/WorkflowsPersonnalises.tsx",
        "routes": [
          "/automatisations/workflows-personnalises"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "cancel",
      "controlCenterFeed",
      "dashboard",
      "healthStatus",
      "list",
      "meta",
      "runNow",
      "schedule"
    ],
    "tables": [
      "scheduler_tasks"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 49,
    "mots": 106,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/CentreAlertesStrategiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/CentreAutoMarketing.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/CentreCroissance.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/CentreKPI.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/CentreObjectifsEntreprise.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/CentrePerformanceIA.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/EscaladesAutomatiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/FilesAttente.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/IAAffectation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/IAControle.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/IAPriorisation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/MoteurTaches.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/MoteurWorkflow.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/ObjectifAutomatisations.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/automatisations/WorkflowsPersonnalises.tsx (3 texte(s))"
      }
    ]
  },
  {
    "moteur": "search",
    "label": "Search Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "search-os"
    ],
    "routeurs": [
      "searchOs",
      "searches"
    ],
    "fichiersServeur": 1,
    "dependancesDeclarees": [
      "avis_reputation",
      "core",
      "identity",
      "permission"
    ],
    "dependancesDetectees": [
      "avis_reputation",
      "core",
      "identity",
      "permission"
    ],
    "dependances": [
      "avis_reputation",
      "core",
      "identity",
      "permission"
    ],
    "integrationsTechniques": [
      "identity",
      "permission"
    ],
    "preuvesDependances": {
      "avis_reputation": [
        "search-os/index.ts importe reputation-engine/ranking.ts"
      ],
      "core": [
        "search-os/index.ts importe db.ts",
        "search-os/index.ts importe schema.ts",
        "search-os/index.ts importe trpc.ts"
      ],
      "identity": [
        "search-os/index.ts importe identity-os/contract.ts",
        "search-os/index.ts exige une session Identity (procédure protégée)"
      ],
      "permission": [
        "search-os/index.ts filtre par rôle (procédure pro/admin/direction/PDG)"
      ]
    },
    "dependants": [
      "achat"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/recherche",
      "/recherche-universelle",
      "/rechercher"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/RechercheGeolocalisee.tsx",
        "routes": [
          "/recherche"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 23,
        "mots": 84
      },
      {
        "fichier": "client/src/pages/RechercheUniverselle.tsx",
        "routes": [
          "/recherche-universelle"
        ],
        "cliquables": 11,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 117,
        "mots": 491
      },
      {
        "fichier": "client/src/pages/Rechercher.tsx",
        "routes": [
          "/rechercher"
        ],
        "cliquables": 18,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 53,
        "mots": 289
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.searches"
        ]
      }
    ],
    "procedures": [
      "controlCenterFeed",
      "dashboard",
      "healthStatus",
      "meta",
      "query",
      "suggest"
    ],
    "tables": [],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 193,
    "mots": 864,
    "battement": "pont_os",
    "manques": []
  },
  {
    "moteur": "seo",
    "label": "SEO Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "seo.ts",
      "seo-analyze.ts",
      "seo-dashboard.ts",
      "seo-generator.ts",
      "seo-geo.ts",
      "seo-hooks.ts",
      "seo-indexing.ts",
      "seo-keywords-catalog.ts",
      "seo-manager.ts",
      "seo-static.ts",
      "seo-verify.ts",
      "routers/seo.ts",
      "modules/seo.ts"
    ],
    "routeurs": [
      "seo"
    ],
    "fichiersServeur": 13,
    "dependancesDeclarees": [
      "avis_reputation",
      "core",
      "country",
      "event_bus",
      "garage",
      "indexation",
      "language",
      "redirection",
      "smart"
    ],
    "dependancesDetectees": [
      "avis_reputation",
      "core",
      "country",
      "event_bus",
      "garage",
      "indexation",
      "language",
      "redirection",
      "smart"
    ],
    "dependances": [
      "avis_reputation",
      "core",
      "country",
      "event_bus",
      "garage",
      "indexation",
      "language",
      "redirection",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "avis_reputation": [
        "routers/seo.ts importe reputation-engine/seo.ts",
        "seo.ts importe reputation-engine/seo.ts",
        "seo.ts importe reputation-engine/public-pages.ts"
      ],
      "core": [
        "routers/seo.ts importe trpc.ts",
        "routers/seo.ts importe env.ts",
        "routers/seo.ts importe db.ts"
      ],
      "country": [
        "seo-keywords-catalog.ts importe country-os/index.ts"
      ],
      "event_bus": [
        "abonné au bus"
      ],
      "garage": [
        "client/src/pages/garage/GaragePublicFiche.tsx appelle trpc.garages"
      ],
      "indexation": [
        "seo-hooks.ts importe indexation/service.ts",
        "seo.ts importe site-verification/index.ts"
      ],
      "language": [
        "seo.ts importe language-os/index.ts"
      ],
      "redirection": [
        "seo-dashboard.ts importe redirection-engine/schema.ts",
        "client/src/pages/SeoLandingPage.tsx embarque lib/redirect.tsx (trpc.redirectionEngine)"
      ],
      "smart": [
        "routers/seo.ts importe smart-engine/services/activity-log.ts",
        "seo-hooks.ts importe smart-engine/services/activity-log.ts",
        "seo-keywords-catalog.ts importe smart-engine/schema.ts"
      ]
    },
    "dependants": [
      "achat",
      "analytics",
      "event_bus",
      "knowledge",
      "location",
      "marketing",
      "smart"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [
      "annonce.modifiee",
      "annonce.publiee"
    ],
    "abonnements": [
      {
        "eventType": "annonce.publiee",
        "handler": "seo_annonce"
      },
      {
        "eventType": "annonce.modifiee",
        "handler": "seo_annonce"
      }
    ],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/garages/:slug",
      "/marque/:marque",
      "/marque/:marque/:modele",
      "/pays/:slug",
      "/pays/:slug/:ville",
      "/piece/:slug",
      "/region/:slug",
      "/reparation/:slug",
      "/reparation/:slug/:vehicule",
      "/seo-abonnements",
      "/service/:slug",
      "/service/:slug/:ville",
      "/superadmin/admin-s-e-o",
      "/ville/:slug"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/SEOAbonnements.tsx",
        "routes": [
          "/seo-abonnements"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 43
      },
      {
        "fichier": "client/src/pages/SeoLandingPage.tsx",
        "routes": [
          "/marque/:marque",
          "/marque/:marque/:modele",
          "/pays/:slug",
          "/pays/:slug/:ville",
          "/piece/:slug",
          "/region/:slug",
          "/reparation/:slug",
          "/reparation/:slug/:vehicule",
          "/service/:slug",
          "/service/:slug/:ville",
          "/ville/:slug"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 46
      },
      {
        "fichier": "client/src/pages/garage/GaragePublicFiche.tsx",
        "routes": [
          "/garages/:slug"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 26
      },
      {
        "fichier": "client/src/pages/superadmin/AdminSEO.tsx",
        "routes": [
          "/superadmin/admin-s-e-o"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 49,
        "mots": 312
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "adminDashboard",
      "analyze",
      "annoncesNearLocation",
      "associateKeywords",
      "dashboard",
      "generateAnnonceSeo",
      "generateProgrammaticPages",
      "getArticle",
      "getGarageSchema",
      "getPageMeta",
      "getSitemap",
      "getVehicleSchema",
      "indexNowConfigured",
      "keywordAssociations",
      "keywordCatalog",
      "keywordStats",
      "learnKeywords",
      "listArticles",
      "listKeywords",
      "pagesByType",
      "pingSitemaps",
      "recommendations",
      "seedKeywords",
      "seedKeywordsAllCountries",
      "submitToIndexNow",
      "upsertArticle",
      "upsertPage",
      "verify"
    ],
    "tables": [
      "seo_blog_articles",
      "seo_config",
      "seo_indexing_log",
      "seo_keywords",
      "seo_pages"
    ],
    "acces": [
      "admin",
      "public"
    ],
    "textes": 79,
    "mots": 427,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/garage/rendez-vous client/src/pages/garage/GaragePublicFiche.tsx:167"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/garage/devis client/src/pages/garage/GaragePublicFiche.tsx:173"
      }
    ]
  },
  {
    "moteur": "smart",
    "label": "Smart Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "smart-engine"
    ],
    "routeurs": [
      "smartEngine"
    ],
    "fichiersServeur": 36,
    "dependancesDeclarees": [
      "avis_reputation",
      "core",
      "country",
      "event_bus",
      "identity",
      "monitoring",
      "notification",
      "permission",
      "politique_pays",
      "redirection",
      "resilience",
      "seo",
      "smart_audit"
    ],
    "dependancesDetectees": [
      "avis_reputation",
      "core",
      "country",
      "event_bus",
      "identity",
      "monitoring",
      "notification",
      "permission",
      "politique_pays",
      "redirection",
      "resilience",
      "seo"
    ],
    "dependances": [
      "avis_reputation",
      "core",
      "country",
      "event_bus",
      "identity",
      "monitoring",
      "notification",
      "permission",
      "politique_pays",
      "redirection",
      "resilience",
      "seo",
      "smart_audit"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "avis_reputation": [
        "smart-engine/services/alert-engine.ts importe reputation-engine/trends.ts",
        "smart-engine/services/review-analysis.ts importe modules/reviews.ts",
        "smart-engine/services/review-analysis.ts importe reputation-engine/trends.ts"
      ],
      "core": [
        "smart-engine/router.ts importe trpc.ts",
        "smart-engine/router.ts importe db.ts",
        "smart-engine/services/action-tasks.ts importe db.ts"
      ],
      "country": [
        "smart-engine/services/action-tasks.ts importe country-os/index.ts"
      ],
      "event_bus": [
        "abonné au bus"
      ],
      "identity": [
        "smart-engine/router.ts exige une session Identity (procédure protégée)",
        "smart-engine/services/rate-limiter.ts exige une session Identity (procédure protégée)"
      ],
      "monitoring": [
        "consomme moteur.degrade émis par monitoring",
        "consomme moteur.retabli émis par monitoring"
      ],
      "notification": [
        "smart-engine/services/daily-report-delivery.ts importe notification-os/triggers.ts"
      ],
      "permission": [
        "smart-engine/router.ts filtre par rôle (procédure pro/admin/direction/PDG)",
        "smart-engine/services/connectors.ts importe permission-engine/schema.ts",
        "smart-engine/services/dev-learning.ts interroge le Permission Engine"
      ],
      "politique_pays": [
        "smart-engine/services/action-tasks.ts importe country-policy/service.ts"
      ],
      "redirection": [
        "smart-engine/services/alert-engine.ts importe redirection-engine/schema.ts",
        "smart-engine/services/auto-fix.ts importe redirection-engine/schema.ts",
        "smart-engine/services/auto-fix.ts importe redirection-engine/service.ts"
      ],
      "resilience": [
        "smart-engine/services/action-tasks.ts importe resilience/service.ts",
        "smart-engine/services/action-tasks.ts importe resilience/schema.ts"
      ],
      "seo": [
        "smart-engine/services/action-tasks.ts importe modules/seo.ts",
        "smart-engine/services/platform-health.ts importe modules/seo.ts"
      ]
    },
    "dependants": [
      "achat",
      "activation_audit",
      "ai_fabric",
      "ai_learning",
      "analytics",
      "atelier",
      "auto_branchement",
      "avis_reputation",
      "boutons",
      "code_graph",
      "command_center",
      "completion_center",
      "connaissance_auto",
      "continuous_test",
      "core",
      "estimation",
      "event_bus",
      "identity",
      "indexation",
      "intelligences",
      "journey",
      "knowledge",
      "livraison_vehicule",
      "marketing",
      "media",
      "media_authenticity",
      "monitoring",
      "partner_engine",
      "payment",
      "politique_pays",
      "product_engine",
      "rd_lab",
      "redirection",
      "resilience",
      "risque_import",
      "seo",
      "smart_audit",
      "support",
      "vente",
      "vente_particulier",
      "visibility"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [
      "atelier.commande_fournisseur_passee",
      "atelier.commande_fournisseur_receptionnee",
      "atelier.controle_non_conforme",
      "atelier.reappro_decidee",
      "atelier.reappro_plafond_depasse",
      "atelier.reappro_plafond_proche",
      "atelier.reappro_proposee",
      "atelier.stock_bas",
      "bouton.sans_action",
      "cliquable.destination_morte",
      "cliquables.audit_termine",
      "ecrans.vides_recenses",
      "estimation.incomplete",
      "intelligences.echange",
      "livraison_vehicule.etape_bloquee",
      "livraison_vehicule.prix_indisponible",
      "livraison_vehicule.validation_requise",
      "moteur.degrade",
      "moteur.migration_echouee",
      "moteur.retabli",
      "paiement.echoue",
      "vehicule.risque_import"
    ],
    "abonnements": [
      {
        "eventType": "moteur.degrade",
        "handler": "smart_alerte"
      },
      {
        "eventType": "moteur.migration_echouee",
        "handler": "smart_alerte"
      },
      {
        "eventType": "paiement.echoue",
        "handler": "smart_alerte_paiement"
      },
      {
        "eventType": "moteur.retabli",
        "handler": "smart_retabli"
      },
      {
        "eventType": "intelligences.echange",
        "handler": "smart_intelligences"
      },
      {
        "eventType": "vehicule.risque_import",
        "handler": "smart_risque_import"
      },
      {
        "eventType": "livraison_vehicule.etape_bloquee",
        "handler": "smart_livraison_vehicule_bloquee"
      },
      {
        "eventType": "livraison_vehicule.validation_requise",
        "handler": "smart_livraison_vehicule_validation"
      },
      {
        "eventType": "livraison_vehicule.prix_indisponible",
        "handler": "smart_livraison_vehicule_sans_prix"
      },
      {
        "eventType": "estimation.incomplete",
        "handler": "smart_estimation_incomplete"
      },
      {
        "eventType": "bouton.sans_action",
        "handler": "smart_bouton_sans_action"
      },
      {
        "eventType": "cliquables.audit_termine",
        "handler": "smart_cliquables_audit"
      },
      {
        "eventType": "cliquable.destination_morte",
        "handler": "smart_cliquable_destination_morte"
      },
      {
        "eventType": "ecrans.vides_recenses",
        "handler": "smart_ecrans_vides"
      },
      {
        "eventType": "atelier.controle_non_conforme",
        "handler": "smart_atelier_non_conforme"
      },
      {
        "eventType": "atelier.stock_bas",
        "handler": "smart_atelier_stock_bas"
      },
      {
        "eventType": "atelier.reappro_proposee",
        "handler": "smart_atelier_reappro_proposee"
      },
      {
        "eventType": "atelier.reappro_decidee",
        "handler": "smart_atelier_reappro_decidee"
      },
      {
        "eventType": "atelier.commande_fournisseur_passee",
        "handler": "smart_atelier_commande_passee"
      },
      {
        "eventType": "atelier.commande_fournisseur_receptionnee",
        "handler": "smart_atelier_commande_receptionnee"
      },
      {
        "eventType": "atelier.reappro_plafond_depasse",
        "handler": "smart_atelier_plafond"
      },
      {
        "eventType": "atelier.reappro_plafond_proche",
        "handler": "smart_atelier_plafond"
      }
    ],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/actions",
      "/superadmin/smart-engine"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreActions.tsx",
        "routes": [
          "/admin/actions"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 61,
        "mots": 275
      },
      {
        "fichier": "client/src/pages/SmartEngine/ControlCenter.tsx",
        "routes": [
          "/superadmin/smart-engine"
        ],
        "cliquables": 54,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 269,
        "mots": 1390
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/DepotAnnonce.tsx",
        "route": "/acheter/depot-annonce",
        "composants": [
          "lib/learnedValues.ts"
        ]
      },
      {
        "fichier": "client/src/pages/Abonnements.tsx",
        "route": "/vente/abonnements",
        "composants": [
          "trpc.smartEngine"
        ]
      },
      {
        "fichier": "client/src/pages/Vendre.tsx",
        "route": "/vendre",
        "composants": [
          "lib/learnedValues.ts"
        ]
      },
      {
        "fichier": "client/src/pages/Abonnements.tsx",
        "route": "/abonnements",
        "composants": [
          "trpc.smartEngine"
        ]
      }
    ],
    "procedures": [
      "actionExecutors",
      "actionTaskClose",
      "actionTaskCreate",
      "actionTaskDetail",
      "actionTaskRetry",
      "actionTaskStats",
      "actionTaskValidate",
      "actionTasks",
      "activeUsers",
      "activityLog",
      "activityStats",
      "addKnowledge",
      "alertLevelStats",
      "alertScan",
      "alertStats",
      "alerts",
      "analyzeReviews",
      "badgeAlerts",
      "brokenElements",
      "checkDuplicates",
      "checkFraud",
      "checkPhotoDuplicates",
      "confirmedValues",
      "dailyReport",
      "dailyReportArchive",
      "dailyReportArchives",
      "dailyReportDelivery",
      "dailyVisits",
      "dashboard",
      "devLearningList",
      "devLearningReview",
      "devLearningReviewAll",
      "devLearningScan",
      "devLearningStats",
      "enginesOverview",
      "evolutionProposals",
      "evolutionStats",
      "failedSearches",
      "generateEvolution",
      "generateRecommendations",
      "healthStatus",
      "indexPhotos",
      "kbList",
      "kbObserve",
      "kbStats",
      "kbValidate",
      "knowledgeList",
      "knowledgeStats",
      "learn",
      "logSearch",
      "markKnowledgeApplied",
      "markRecoClicked",
      "markRecoSeen",
      "misplacedAnnonces",
      "myMemory",
      "myRecommendations",
      "optimizationReview",
      "optimizationStats",
      "optimizationsGenerate",
      "optimizationsList",
      "pageStats",
      "pendingValidations",
      "platformHealth",
      "platformPulse",
      "qualityAuditRun",
      "qualityList",
      "qualityOverview",
      "recordView",
      "registerCriticalElements",
      "reportHealth",
      "resolveAlert",
      "resolveDuplicate",
      "resolveSuspect",
      "retentionCounters",
      "retentionRun",
      "reusableValues",
      "reviewAlerts",
      "reviewEvolution",
      "searchStats",
      "seedKnowledge",
      "sendDailyReport",
      "teach",
      "teachingConversation",
      "teachingStats",
      "topSearches",
      "trackAction",
      "trackPage",
      "unresolvedDuplicates",
      "unresolvedSuspects",
      "userBehavior",
      "validateActivityDecision",
      "validateBadges",
      "validateLearned",
      "validateUnivers"
    ],
    "tables": [
      "smart_action_steps",
      "smart_action_tasks",
      "smart_activity_log",
      "smart_alerts",
      "smart_auto_fixes",
      "smart_daily_reports",
      "smart_dev_registry",
      "smart_duplicates",
      "smart_health_checks",
      "smart_kb_entries",
      "smart_knowledge",
      "smart_learned_data",
      "smart_optimizations",
      "smart_photo_fingerprints",
      "smart_quality_audits",
      "smart_recommendations",
      "smart_search_logs",
      "smart_staging",
      "smart_suspect_accounts",
      "smart_teachings",
      "smart_user_memory"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "pdg",
      "public"
    ],
    "textes": 330,
    "mots": 1665,
    "battement": "contrat",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "smart_audit"
      }
    ]
  },
  {
    "moteur": "smart_audit",
    "label": "Audit & activation du Système Intelligent",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "smart-audit"
    ],
    "routeurs": [
      "smartAudit"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "ai_fabric",
      "core",
      "smart"
    ],
    "dependancesDetectees": [
      "ai_fabric",
      "core",
      "smart"
    ],
    "dependances": [
      "ai_fabric",
      "core",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "ai_fabric": [
        "smart-audit/service.ts importe ai-fabric/service.ts"
      ],
      "core": [
        "smart-audit/index.ts importe trpc.ts",
        "smart-audit/service.ts importe db.ts",
        "smart-audit/service.ts importe engine-registry/service.ts"
      ],
      "smart": [
        "smart-audit/service.ts importe smart-engine/services/alert-engine.ts",
        "smart-audit/service.ts importe smart-engine/services/platform-health.ts",
        "smart-audit/service.ts importe smart-engine/services/auto-optimization.ts"
      ]
    },
    "dependants": [
      "command_center",
      "smart"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/systeme-intelligent"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreSystemeIntelligent.tsx",
        "routes": [
          "/admin/systeme-intelligent"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 18,
        "mots": 122
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "auditer",
      "cycles",
      "executerCycle",
      "generationCode",
      "historique",
      "latest",
      "referentiel"
    ],
    "tables": [
      "smart_audit_items",
      "smart_audit_runs",
      "smart_cycle_runs"
    ],
    "acces": [
      "admin"
    ],
    "textes": 18,
    "mots": 122,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "support",
    "label": "Support OS",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "support-os",
      "routers/support.ts"
    ],
    "routeurs": [
      "supportOs",
      "support",
      "disputes"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "audit",
      "core",
      "identity",
      "notification",
      "payment",
      "smart"
    ],
    "dependancesDetectees": [
      "audit",
      "core",
      "identity",
      "notification",
      "payment",
      "smart"
    ],
    "dependances": [
      "audit",
      "core",
      "identity",
      "notification",
      "payment",
      "smart"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "audit": [
        "routers/support.ts importe audit.ts",
        "support-os/index.ts importe audit.ts"
      ],
      "core": [
        "routers/support.ts importe trpc.ts",
        "routers/support.ts importe db.ts",
        "routers/support.ts importe schema.ts"
      ],
      "identity": [
        "routers/support.ts exige une session Identity (procédure protégée)",
        "support-os/index.ts importe identity-os/contract.ts",
        "support-os/index.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/support.ts importe notification-os/triggers.ts",
        "routers/support.ts déclenche notifyEvent"
      ],
      "payment": [
        "support-os/diagnostic.ts importe payment-engine/schema.ts",
        "support-os/diagnostic.ts importe payment-engine/chain-audit.ts"
      ],
      "smart": [
        "support-os/diagnostic.ts importe smart-engine/schema.ts",
        "support-os/diagnostic.ts ouvre une alerte du Système Intelligent"
      ]
    },
    "dependants": [
      "garage",
      "intelligences"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/aide",
      "/superadmin/admin-litiges",
      "/superadmin/admin-support",
      "/superadmin/centre-tickets"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Aide.tsx",
        "routes": [
          "/aide"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 18,
        "mots": 125
      },
      {
        "fichier": "client/src/pages/superadmin/AdminLitiges.tsx",
        "routes": [
          "/superadmin/admin-litiges"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 8,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/superadmin/AdminSupport.tsx",
        "routes": [
          "/superadmin/admin-support"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 4,
        "textes": 9,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/superadmin/CentreTickets.tsx",
        "routes": [
          "/superadmin/centre-tickets"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 18
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.disputes"
        ]
      },
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.support",
          "trpc.disputes"
        ]
      },
      {
        "fichier": "client/src/pages/garage/CentreReclamations.tsx",
        "route": "/garage/centre-reclamations",
        "composants": [
          "trpc.support"
        ]
      },
      {
        "fichier": "client/src/pages/CentreIntelligences.tsx",
        "route": "/admin/intelligences",
        "composants": [
          "trpc.supportOs"
        ]
      }
    ],
    "procedures": [
      "controlCenterFeed",
      "dashboard",
      "dossier",
      "dossierMessage",
      "faq",
      "fileDiagnostiquee",
      "healthStatus",
      "meta",
      "myTickets",
      "priorities",
      "queue",
      "respond",
      "setPriority",
      "setStatus",
      "stats",
      "submit"
    ],
    "tables": [],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 42,
    "mots": 171,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminLitiges.tsx:25"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Mediation » client/src/pages/superadmin/AdminLitiges.tsx:51"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Resoudre » client/src/pages/superadmin/AdminLitiges.tsx:52"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminSupport.tsx:30"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Repondre » client/src/pages/superadmin/AdminSupport.tsx:64"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Resoudre » client/src/pages/superadmin/AdminSupport.tsx:65"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Escalader » client/src/pages/superadmin/AdminSupport.tsx:66"
      }
    ]
  },
  {
    "moteur": "transport",
    "label": "VTC & Taxi Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/transport.ts",
      "routers/transport.ts"
    ],
    "routeurs": [
      "transport"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "identity",
      "notification",
      "payment",
      "scheduler"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "notification",
      "scheduler"
    ],
    "dependances": [
      "core",
      "identity",
      "notification",
      "payment",
      "scheduler"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "routers/transport.ts importe trpc.ts",
        "routers/transport.ts importe db.ts",
        "routers/transport.ts importe schema.ts"
      ],
      "identity": [
        "routers/transport.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/transport.ts importe notification-os/triggers.ts",
        "routers/transport.ts déclenche notifyEvent"
      ],
      "scheduler": [
        "routers/transport.ts importe scheduler-os/index.ts"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/labs/reseau-transport",
      "/labs/reseau-transport-marchandises",
      "/labs/reseau-transport-personnes",
      "/operations/m-k-a-p-m-s-transport",
      "/vente/transport"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/labs/ReseauTransport.tsx",
        "routes": [
          "/labs/reseau-transport"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/labs/ReseauTransportMarchandises.tsx",
        "routes": [
          "/labs/reseau-transport-marchandises"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/labs/ReseauTransportPersonnes.tsx",
        "routes": [
          "/labs/reseau-transport-personnes"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/operations/MKAPMSTransport.tsx",
        "routes": [
          "/operations/m-k-a-p-m-s-transport"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/vente/CentreTransport.tsx",
        "routes": [
          "/vente/transport"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 13
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "addDriver",
      "addVehicle",
      "book",
      "companies",
      "company",
      "createCompany",
      "myBookings"
    ],
    "tables": [
      "driver_documents",
      "drivers",
      "transport_bookings",
      "transport_companies",
      "transport_vehicles"
    ],
    "acces": [
      "connecte",
      "professionnel",
      "public"
    ],
    "textes": 22,
    "mots": 42,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauTransport.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauTransportMarchandises.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/labs/ReseauTransportPersonnes.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/MKAPMSTransport.tsx (3 texte(s))"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "payment"
      }
    ]
  },
  {
    "moteur": "vente",
    "label": "Univers Vente Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "core",
      "country",
      "notification",
      "payment",
      "permission",
      "smart",
      "vo_espaces"
    ],
    "dependancesDetectees": [
      "achat",
      "boutons",
      "core",
      "country",
      "livraison_vehicule",
      "notification",
      "payment",
      "smart",
      "vo_espaces"
    ],
    "dependances": [
      "achat",
      "boutons",
      "core",
      "country",
      "livraison_vehicule",
      "notification",
      "payment",
      "permission",
      "smart",
      "vo_espaces"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/Vendre.tsx appelle trpc.annonces"
      ],
      "boutons": [
        "client/src/pages/LivraisonVehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/LivraisonVehicule.tsx utilise BoutonMoteur"
      ],
      "core": [
        "client/src/pages/superadmin/AdminVente.tsx appelle trpc.admin"
      ],
      "country": [
        "client/src/pages/Abonnements.tsx embarque lib/currency.tsx (trpc.currency)",
        "client/src/pages/Vendre.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "livraison_vehicule": [
        "client/src/pages/LivraisonVehicule.tsx appelle trpc.livraisonVehicule"
      ],
      "notification": [
        "client/src/pages/TableauBordProVente.tsx appelle trpc.notifications"
      ],
      "payment": [
        "client/src/pages/Abonnements.tsx appelle trpc.abonnements"
      ],
      "smart": [
        "client/src/pages/Abonnements.tsx appelle trpc.smartEngine",
        "client/src/pages/Vendre.tsx embarque lib/learnedValues.ts (trpc.smartEngine)"
      ],
      "vo_espaces": [
        "client/src/pages/TableauBordProVente.tsx appelle trpc.voEspaces",
        "client/src/pages/vente/AttestationVente.tsx appelle trpc.voEspaces",
        "client/src/pages/vente/GestionStockVO.tsx appelle trpc.voEspaces"
      ]
    },
    "dependants": [
      "vente_officiel",
      "vente_particulier",
      "vente_pro"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "livraison_vehicule_accepter",
        "libelle": "Accepter le devis et créer l'expédition",
        "genre": "formulaire",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 281
      },
      {
        "code": "livraison_vehicule_choisir_mode",
        "libelle": "Choisir un mode d'acheminement",
        "genre": "formulaire",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 169
      },
      {
        "code": "livraison_vehicule_connexion",
        "libelle": "Se connecter pour commander ou suivre",
        "genre": "navigation",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 277
      },
      {
        "code": "livraison_vehicule_connexion",
        "libelle": "Se connecter pour commander ou suivre",
        "genre": "navigation",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 322
      },
      {
        "code": "livraison_vehicule_onglet_devis",
        "libelle": "Onglet Devis",
        "genre": "formulaire",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 116
      },
      {
        "code": "livraison_vehicule_onglet_suivi",
        "libelle": "Onglet Suivi",
        "genre": "formulaire",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 117
      },
      {
        "code": "livraison_vehicule_retour",
        "libelle": "Retour à l'accueil",
        "genre": "navigation",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 110
      }
    ],
    "routes": [
      "/depot-annonce",
      "/depot-annonce/analyse-i-a",
      "/depot-annonce/conseils-i-a",
      "/depot-annonce/description-annonce",
      "/depot-annonce/documents-annonce",
      "/depot-annonce/expiration-annonce",
      "/depot-annonce/identification-vehicule",
      "/depot-annonce/informations-principales",
      "/depot-annonce/modification-annonce",
      "/depot-annonce/objectif-depot-annonce",
      "/depot-annonce/options-annonce",
      "/depot-annonce/photos-vehicule",
      "/depot-annonce/publication-annonce",
      "/depot-annonce/score-qualite-annonce",
      "/depot-annonce/tableau-bord-annonceur",
      "/depot-annonce/videos-annonce",
      "/dossier-client",
      "/superadmin/admin-vente",
      "/vendre",
      "/vente",
      "/vente/abonnements",
      "/vente/achat-distance",
      "/vente/achat-express",
      "/vente/alertes",
      "/vente/alertes-recherche",
      "/vente/archives",
      "/vente/attestation/:id?",
      "/vente/badges",
      "/vente/campagnes",
      "/vente/certifies",
      "/vente/clients",
      "/vente/comparaison",
      "/vente/confiance",
      "/vente/controle-qualite",
      "/vente/diagnostic",
      "/vente/dossier-acheteur",
      "/vente/dossier-client",
      "/vente/dossier-vehicule/:id?",
      "/vente/droits",
      "/vente/employes",
      "/vente/essai",
      "/vente/export",
      "/vente/favoris",
      "/vente/financement",
      "/vente/fournisseurs",
      "/vente/fraude",
      "/vente/garantie",
      "/vente/historique-consultations",
      "/vente/livraison",
      "/vente/livraison-acheteur",
      "/vente/marges",
      "/vente/multi-sites",
      "/vente/negociation",
      "/vente/objectifs",
      "/vente/performances",
      "/vente/photos",
      "/vente/publicites",
      "/vente/qualite",
      "/vente/rapports",
      "/vente/recommandations",
      "/vente/reparations",
      "/vente/reservation-achat",
      "/vente/reservations",
      "/vente/retour-client",
      "/vente/securite",
      "/vente/statistiques",
      "/vente/stock",
      "/vente/visite",
      "/vente/workflow/:id?"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Abonnements.tsx",
        "routes": [
          "/vente/abonnements"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 25,
        "mots": 125
      },
      {
        "fichier": "client/src/pages/DossierClient.tsx",
        "routes": [
          "/dossier-client"
        ],
        "cliquables": 21,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 91,
        "mots": 207
      },
      {
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "routes": [
          "/vente/livraison"
        ],
        "cliquables": 7,
        "parMoteur": 7,
        "sansAction": 0,
        "textes": 45,
        "mots": 224
      },
      {
        "fichier": "client/src/pages/TableauBordProVente.tsx",
        "routes": [
          "/vente"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 23,
        "mots": 86
      },
      {
        "fichier": "client/src/pages/Vendre.tsx",
        "routes": [
          "/vendre"
        ],
        "cliquables": 39,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 220,
        "mots": 983
      },
      {
        "fichier": "client/src/pages/depot-annonce/AnalyseIA.tsx",
        "routes": [
          "/depot-annonce/analyse-i-a"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 16,
        "mots": 52
      },
      {
        "fichier": "client/src/pages/depot-annonce/ConseilsIA.tsx",
        "routes": [
          "/depot-annonce/conseils-i-a"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/depot-annonce/DepotAnnoncePortail.tsx",
        "routes": [
          "/depot-annonce"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 14,
        "mots": 54
      },
      {
        "fichier": "client/src/pages/depot-annonce/DescriptionAnnonce.tsx",
        "routes": [
          "/depot-annonce/description-annonce"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/depot-annonce/DocumentsAnnonce.tsx",
        "routes": [
          "/depot-annonce/documents-annonce"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 48
      },
      {
        "fichier": "client/src/pages/depot-annonce/ExpirationAnnonce.tsx",
        "routes": [
          "/depot-annonce/expiration-annonce"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 4,
        "mots": 7
      },
      {
        "fichier": "client/src/pages/depot-annonce/IdentificationVehicule.tsx",
        "routes": [
          "/depot-annonce/identification-vehicule"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/depot-annonce/InformationsPrincipales.tsx",
        "routes": [
          "/depot-annonce/informations-principales"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 19,
        "mots": 50
      },
      {
        "fichier": "client/src/pages/depot-annonce/ModificationAnnonce.tsx",
        "routes": [
          "/depot-annonce/modification-annonce"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 6,
        "mots": 12
      },
      {
        "fichier": "client/src/pages/depot-annonce/ObjectifDepotAnnonce.tsx",
        "routes": [
          "/depot-annonce/objectif-depot-annonce"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/depot-annonce/OptionsAnnonce.tsx",
        "routes": [
          "/depot-annonce/options-annonce"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 24
      },
      {
        "fichier": "client/src/pages/depot-annonce/PhotosVehicule.tsx",
        "routes": [
          "/depot-annonce/photos-vehicule"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 28,
        "mots": 114
      },
      {
        "fichier": "client/src/pages/depot-annonce/PublicationAnnonce.tsx",
        "routes": [
          "/depot-annonce/publication-annonce"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 43
      },
      {
        "fichier": "client/src/pages/depot-annonce/ScoreQualiteAnnonce.tsx",
        "routes": [
          "/depot-annonce/score-qualite-annonce"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 22
      },
      {
        "fichier": "client/src/pages/depot-annonce/TableauBordAnnonceur.tsx",
        "routes": [
          "/depot-annonce/tableau-bord-annonceur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 28
      },
      {
        "fichier": "client/src/pages/depot-annonce/VideosAnnonce.tsx",
        "routes": [
          "/depot-annonce/videos-annonce"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 28
      },
      {
        "fichier": "client/src/pages/superadmin/AdminVente.tsx",
        "routes": [
          "/superadmin/admin-vente"
        ],
        "cliquables": 9,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 18,
        "mots": 97
      },
      {
        "fichier": "client/src/pages/vente/AchatExpress.tsx",
        "routes": [
          "/vente/achat-express"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 4,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/vente/AlertesAuto.tsx",
        "routes": [
          "/vente/alertes"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 4,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/vente/AttestationVente.tsx",
        "routes": [
          "/vente/attestation/:id?"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 22,
        "mots": 158
      },
      {
        "fichier": "client/src/pages/vente/CentreAchatDistance.tsx",
        "routes": [
          "/vente/achat-distance"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 8,
        "mots": 22
      },
      {
        "fichier": "client/src/pages/vente/CentreAlertesRecherche.tsx",
        "routes": [
          "/vente/alertes-recherche"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 5,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/vente/CentreArchives.tsx",
        "routes": [
          "/vente/archives"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/vente/CentreBadgesVendeurs.tsx",
        "routes": [
          "/vente/badges"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 15
      },
      {
        "fichier": "client/src/pages/vente/CentreCampagnes.tsx",
        "routes": [
          "/vente/campagnes"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 8,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/vente/CentreClientsVente.tsx",
        "routes": [
          "/vente/clients"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/vente/CentreComparaison.tsx",
        "routes": [
          "/vente/comparaison"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/vente/CentreConfianceAcheteur.tsx",
        "routes": [
          "/vente/confiance"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 20
      },
      {
        "fichier": "client/src/pages/vente/CentreControleQualite.tsx",
        "routes": [
          "/vente/controle-qualite"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 11,
        "mots": 28
      },
      {
        "fichier": "client/src/pages/vente/CentreDetectionFraude.tsx",
        "routes": [
          "/vente/fraude"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 7,
        "mots": 13
      },
      {
        "fichier": "client/src/pages/vente/CentreDiagnostic.tsx",
        "routes": [
          "/vente/diagnostic"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 28
      },
      {
        "fichier": "client/src/pages/vente/CentreDossiersAcheteurs.tsx",
        "routes": [
          "/vente/dossier-acheteur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 18
      },
      {
        "fichier": "client/src/pages/vente/CentreEssaiRoutier.tsx",
        "routes": [
          "/vente/essai"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 8,
        "mots": 15
      },
      {
        "fichier": "client/src/pages/vente/CentreExport.tsx",
        "routes": [
          "/vente/export"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 7,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/vente/CentreFavorisVente.tsx",
        "routes": [
          "/vente/favoris"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 6,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/vente/CentreFinancement.tsx",
        "routes": [
          "/vente/financement"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/vente/CentreFournisseurs.tsx",
        "routes": [
          "/vente/fournisseurs"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 8,
        "mots": 16
      },
      {
        "fichier": "client/src/pages/vente/CentreGarantieOccasion.tsx",
        "routes": [
          "/vente/garantie"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/vente/CentreHistoriqueConsultations.tsx",
        "routes": [
          "/vente/historique-consultations"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 20
      },
      {
        "fichier": "client/src/pages/vente/CentreLivraisonAcheteur.tsx",
        "routes": [
          "/vente/livraison-acheteur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/vente/CentreMarges.tsx",
        "routes": [
          "/vente/marges"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 45
      },
      {
        "fichier": "client/src/pages/vente/CentreNegociation.tsx",
        "routes": [
          "/vente/negociation"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 5,
        "mots": 15
      },
      {
        "fichier": "client/src/pages/vente/CentreObjectifs.tsx",
        "routes": [
          "/vente/objectifs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 9
      },
      {
        "fichier": "client/src/pages/vente/CentrePerformances.tsx",
        "routes": [
          "/vente/performances",
          "/vente/statistiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 14,
        "mots": 23
      },
      {
        "fichier": "client/src/pages/vente/CentrePhotosMedias.tsx",
        "routes": [
          "/vente/photos"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 6,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/vente/CentrePublicites.tsx",
        "routes": [
          "/vente/publicites"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/vente/CentreRapportsVehicule.tsx",
        "routes": [
          "/vente/rapports"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 10,
        "mots": 23
      },
      {
        "fichier": "client/src/pages/vente/CentreRecommandations.tsx",
        "routes": [
          "/vente/recommandations"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 25
      },
      {
        "fichier": "client/src/pages/vente/CentreReparations.tsx",
        "routes": [
          "/vente/reparations"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/vente/CentreReservationAchat.tsx",
        "routes": [
          "/vente/reservation-achat"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 7,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/vente/CentreRetourClient.tsx",
        "routes": [
          "/vente/retour-client"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 4,
        "mots": 11
      },
      {
        "fichier": "client/src/pages/vente/CentreSecurite.tsx",
        "routes": [
          "/vente/securite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/vente/CentreVehiculesCertifiesVente.tsx",
        "routes": [
          "/vente/certifies"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/vente/CentreVisiteVehicule.tsx",
        "routes": [
          "/vente/visite"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 7,
        "mots": 15
      },
      {
        "fichier": "client/src/pages/vente/DossierClient.tsx",
        "routes": [
          "/vente/dossier-client"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 23
      },
      {
        "fichier": "client/src/pages/vente/DossierVehicule.tsx",
        "routes": [
          "/vente/dossier-vehicule/:id?"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 14,
        "mots": 42
      },
      {
        "fichier": "client/src/pages/vente/DroitsAcces.tsx",
        "routes": [
          "/vente/droits"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 5,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/vente/GestionEmployes.tsx",
        "routes": [
          "/vente/employes"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 15,
        "mots": 40
      },
      {
        "fichier": "client/src/pages/vente/GestionStockVO.tsx",
        "routes": [
          "/vente/stock"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 20,
        "mots": 50
      },
      {
        "fichier": "client/src/pages/vente/MultiSites.tsx",
        "routes": [
          "/vente/multi-sites"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 9,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/vente/QualiteVendeur.tsx",
        "routes": [
          "/vente/qualite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 13,
        "mots": 26
      },
      {
        "fichier": "client/src/pages/vente/ReservationsVente.tsx",
        "routes": [
          "/vente/reservations"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 5,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/vente/WorkflowAchatVO.tsx",
        "routes": [
          "/vente/workflow/:id?"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 27,
        "mots": 83
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 976,
    "mots": 3266,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/profil client/src/pages/TableauBordProVente.tsx:102"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/depot-annonce/ConseilsIA.tsx (3 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Renouveler automatiquement » client/src/pages/depot-annonce/ExpirationAnnonce.tsx:23"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/depot-annonce/ExpirationAnnonce.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/depot-annonce/IdentificationVehicule.tsx (4 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/depot-annonce/ModificationAnnonce.tsx:18"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/depot-annonce/ObjectifDepotAnnonce.tsx (3 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/depot-annonce/analyse-ia client/src/pages/depot-annonce/OptionsAnnonce.tsx:26"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/AchatExpress.tsx:7"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Commencer un achat express » client/src/pages/vente/AchatExpress.tsx:9"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/AchatExpress.tsx (4 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/AlertesAuto.tsx:13"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Traiter » client/src/pages/vente/AlertesAuto.tsx:17"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/AlertesAuto.tsx (4 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Continuer mon achat » client/src/pages/vente/CentreAchatDistance.tsx:10"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Créer l'alerte » client/src/pages/vente/CentreAlertesRecherche.tsx:21"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreArchives.tsx:11"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/CentreArchives.tsx (4 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreBadgesVendeurs.tsx:15"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreCampagnes.tsx:10"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Nouvelle campagne » client/src/pages/vente/CentreCampagnes.tsx:16"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreClientsVente.tsx:12"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreControleQualite.tsx:13"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/vente/CentreControleQualite.tsx:20"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreDetectionFraude.tsx:12"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir » client/src/pages/vente/CentreDetectionFraude.tsx:17"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Réserver l'essai » client/src/pages/vente/CentreEssaiRoutier.tsx:11"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreExport.tsx:13"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/vente/CentreExport.tsx:17"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/vente/CentreFavorisVente.tsx:16"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/vente/CentreFavorisVente.tsx:16"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreFinancement.tsx:12"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreFournisseurs.tsx:12"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Ajouter fournisseur » client/src/pages/vente/CentreFournisseurs.tsx:18"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/CentreGarantieOccasion.tsx (2 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreMarges.tsx:17"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/vente/CentreNegociation.tsx:20"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreObjectifs.tsx:11"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentrePerformances.tsx:12"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« {i : } » client/src/pages/vente/CentrePhotosMedias.tsx:9"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Valider les photos » client/src/pages/vente/CentrePhotosMedias.tsx:15"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentrePublicites.tsx:11"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Télécharger le rapport PDF » client/src/pages/vente/CentreRapportsVehicule.tsx:19"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Réserver ce véhicule » client/src/pages/vente/CentreReservationAchat.tsx:15"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Envoyer mon avis » client/src/pages/vente/CentreRetourClient.tsx:14"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/CentreRetourClient.tsx (4 texte(s))"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/CentreSecurite.tsx:13"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/vente/CentreVisiteVehicule.tsx:15"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Confirmer la visite » client/src/pages/vente/CentreVisiteVehicule.tsx:16"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/DossierClient.tsx:11"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Enregistrer les droits » client/src/pages/vente/DroitsAcces.tsx:15"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/GestionEmployes.tsx:29"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Recruter un collaborateur » client/src/pages/vente/GestionEmployes.tsx:80"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Désactiver » client/src/pages/vente/GestionEmployes.tsx:128"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Enregistrer » client/src/pages/vente/GestionEmployes.tsx:129"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/MultiSites.tsx:11"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Ajouter un site » client/src/pages/vente/MultiSites.tsx:17"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/QualiteVendeur.tsx:9"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/ReservationsVente.tsx:14"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Valider » client/src/pages/vente/ReservationsVente.tsx:30"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Refuser » client/src/pages/vente/ReservationsVente.tsx:30"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/LivraisonVehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "livraison_vehicule — client/src/pages/LivraisonVehicule.tsx appelle trpc.livraisonVehicule"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "permission"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "vente_officiel",
    "label": "Vente Officielle Engine",
    "categorie": "sous_section",
    "etatDeclare": "staging",
    "dossiers": [
      "modules/depotvente.ts",
      "routers/depotvente.ts"
    ],
    "routeurs": [
      "depotVente"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "notification",
      "vente"
    ],
    "dependancesDetectees": [
      "core",
      "notification"
    ],
    "dependances": [
      "core",
      "notification",
      "vente"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "routers/depotvente.ts importe trpc.ts",
        "routers/depotvente.ts importe db.ts",
        "routers/depotvente.ts importe schema.ts"
      ],
      "notification": [
        "routers/depotvente.ts importe notification-os/triggers.ts",
        "routers/depotvente.ts déclenche notifyEvent"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/depot-vente"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/DepotVente.tsx",
        "routes": [
          "/depot-vente"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 72,
        "mots": 200
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "create",
      "mine",
      "updateStatus"
    ],
    "tables": [
      "depot_vente"
    ],
    "acces": [
      "connecte"
    ],
    "textes": 72,
    "mots": 200,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "vente"
      }
    ]
  },
  {
    "moteur": "vente_particulier",
    "label": "Vente Particulier Engine",
    "categorie": "sous_section",
    "etatDeclare": "staging",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "core",
      "smart",
      "vente"
    ],
    "dependancesDetectees": [
      "achat",
      "smart"
    ],
    "dependances": [
      "achat",
      "core",
      "smart",
      "vente"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/DepotAnnonce.tsx appelle trpc.annonces",
        "client/src/pages/MesAnnonces.tsx appelle trpc.annonces"
      ],
      "smart": [
        "client/src/pages/DepotAnnonce.tsx embarque lib/learnedValues.ts (trpc.smartEngine)"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/acheter/depot-annonce",
      "/acheter/mes-annonces",
      "/vente/mes-annonces"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/DepotAnnonce.tsx",
        "routes": [
          "/acheter/depot-annonce"
        ],
        "cliquables": 22,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 118,
        "mots": 641
      },
      {
        "fichier": "client/src/pages/MesAnnonces.tsx",
        "routes": [
          "/acheter/mes-annonces",
          "/vente/mes-annonces"
        ],
        "cliquables": 16,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 35,
        "mots": 125
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 153,
    "mots": 766,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "vente"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "vente_pro",
    "label": "Vente Professionnelle Engine",
    "categorie": "sous_section",
    "etatDeclare": "staging",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "core",
      "vente"
    ],
    "dependancesDetectees": [],
    "dependances": [
      "core",
      "vente"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {},
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/acheter/espace-pro",
      "/acheter/inscription-pro",
      "/vente/resume-vendeur"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/EspaceProVente.tsx",
        "routes": [
          "/acheter/espace-pro"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 19,
        "mots": 40
      },
      {
        "fichier": "client/src/pages/InscriptionProVente.tsx",
        "routes": [
          "/acheter/inscription-pro"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 22,
        "mots": 58
      },
      {
        "fichier": "client/src/pages/vente/TableauBordVendeur.tsx",
        "routes": [
          "/vente/resume-vendeur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 15
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 53,
    "mots": 113,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Choisir » client/src/pages/EspaceProVente.tsx:50"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Télécharger » client/src/pages/InscriptionProVente.tsx:61"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/InscriptionProVente.tsx:81"
      },
      {
        "genre": "destination_inconnue",
        "detail": "/vente/tableau-de-bord-pro client/src/pages/vente/TableauBordVendeur.tsx:8"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "vente"
      },
      {
        "genre": "sans_logique_serveur",
        "detail": "aucun dossier serveur : moteur d'écran seulement"
      }
    ]
  },
  {
    "moteur": "visibility",
    "label": "Global Visibility Engine",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "visibility-os"
    ],
    "routeurs": [
      "visibilityOs"
    ],
    "fichiersServeur": 6,
    "dependancesDeclarees": [
      "core",
      "identity",
      "smart"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "smart"
    ],
    "dependances": [
      "core",
      "identity",
      "smart"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "visibility-os/audience-engine.ts importe db.ts",
        "visibility-os/audience-engine.ts importe schema.ts",
        "visibility-os/audience-engine.ts importe modules/core.ts"
      ],
      "identity": [
        "visibility-os/index.ts importe identity-os/contract.ts",
        "visibility-os/index.ts exige une session Identity (procédure protégée)"
      ],
      "smart": [
        "visibility-os/index.ts importe smart-engine/services/activity-log.ts"
      ]
    },
    "dependants": [
      "achat",
      "auction_engine",
      "core",
      "garage",
      "monitoring",
      "partner_engine"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/superadmin/visibilite-croissance"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/VisibilityEngine/ControlCenter.tsx",
        "routes": [
          "/superadmin/visibilite-croissance"
        ],
        "cliquables": 10,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 31,
        "mots": 145
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "aiAnswers",
      "audiences",
      "channels",
      "content",
      "controlCenterFeed",
      "dashboard",
      "healthStatus",
      "ingest",
      "intents",
      "meta",
      "overview",
      "publications",
      "rebuildAudiences",
      "refreshTrends",
      "reseauxPublics",
      "seedAiAnswers",
      "seedIntents",
      "setChannel",
      "setChannelProfile",
      "validatePublication",
      "variantsFor"
    ],
    "tables": [
      "visibility_ai_answers",
      "visibility_audiences",
      "visibility_channels",
      "visibility_content",
      "visibility_events",
      "visibility_intents",
      "visibility_publications",
      "visibility_variants"
    ],
    "acces": [
      "admin",
      "pdg",
      "public"
    ],
    "textes": 31,
    "mots": 145,
    "battement": "pont_os",
    "manques": []
  },
  {
    "moteur": "vo",
    "label": "VO Engine",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "modules/vo.ts",
      "routers/vo.ts"
    ],
    "routeurs": [
      "vo"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "core",
      "notification",
      "permission"
    ],
    "dependancesDetectees": [
      "core",
      "notification",
      "permission"
    ],
    "dependances": [
      "core",
      "notification",
      "permission"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "routers/vo.ts importe trpc.ts",
        "routers/vo.ts importe db.ts",
        "routers/vo.ts importe schema.ts"
      ],
      "notification": [
        "routers/vo.ts importe notification-os/triggers.ts",
        "routers/vo.ts déclenche notifyEvent"
      ],
      "permission": [
        "routers/vo.ts filtre par rôle (procédure pro/admin/direction/PDG)",
        "client/src/pages/VOInterne.tsx embarque components/AccessDenied.tsx (trpc.permissionEngine)"
      ]
    },
    "dependants": [
      "estimation"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/vo"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/VOInterne.tsx",
        "routes": [
          "/vo"
        ],
        "cliquables": 19,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 198,
        "mots": 703
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "addDiagnostic",
      "addDocument",
      "addLavage",
      "addReparation",
      "create",
      "detail",
      "enregistrerVente",
      "list",
      "setDestination",
      "stats",
      "updateReception",
      "updateStatus",
      "updateTransport"
    ],
    "tables": [
      "vo_diagnostics",
      "vo_documents",
      "vo_etapes",
      "vo_lavage",
      "vo_reparations",
      "vo_vehicules"
    ],
    "acces": [
      "admin"
    ],
    "textes": 198,
    "mots": 703,
    "battement": "sonde",
    "manques": []
  },
  {
    "moteur": "vo_engine",
    "label": "VO Engine — estimation & reprise",
    "categorie": "univers",
    "etatDeclare": "active",
    "dossiers": [
      "vo-engine"
    ],
    "routeurs": [
      "voEngine"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "achat",
      "core",
      "country",
      "notification"
    ],
    "dependancesDetectees": [
      "achat",
      "core",
      "country"
    ],
    "dependances": [
      "achat",
      "core",
      "country",
      "notification"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/VehiculesCertifies.tsx embarque components/ReserverLocationButton.tsx (trpc.reservations)"
      ],
      "core": [
        "vo-engine/index.ts importe trpc.ts",
        "vo-engine/service.ts importe db.ts",
        "vo-engine/service.ts importe schema.ts"
      ],
      "country": [
        "vo-engine/service.ts importe country-os/index.ts"
      ]
    },
    "dependants": [
      "estimation"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/acheter/estimation",
      "/acheter/reprise",
      "/louer/certifies"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/EstimationAuto.tsx",
        "routes": [
          "/acheter/estimation"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 21,
        "mots": 79
      },
      {
        "fichier": "client/src/pages/RepriseVehicule.tsx",
        "routes": [
          "/acheter/reprise"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 3,
        "textes": 10,
        "mots": 33
      },
      {
        "fichier": "client/src/pages/VehiculesCertifies.tsx",
        "routes": [
          "/louer/certifies"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 19,
        "mots": 65
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "addDossierItem",
      "dossier",
      "estimate",
      "health",
      "myEstimations",
      "myRepriseRequests",
      "offerReprise",
      "repriseQueue",
      "requestReprise",
      "setRepriseStatus"
    ],
    "tables": [
      "vo_dossier_items",
      "vo_estimations",
      "vo_reprise_requests"
    ],
    "acces": [
      "admin",
      "connecte",
      "public"
    ],
    "textes": 50,
    "mots": 177,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/RepriseVehicule.tsx:29"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Accepter » client/src/pages/RepriseVehicule.tsx:51"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Négocier » client/src/pages/RepriseVehicule.tsx:52"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "notification"
      }
    ]
  },
  {
    "moteur": "vo_espaces",
    "label": "VO Espaces — cloisonnement officiel / pro / particulier",
    "categorie": "univers",
    "etatDeclare": "staging",
    "dossiers": [
      "vo-espaces"
    ],
    "routeurs": [
      "voEspaces"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "core",
      "country",
      "document",
      "identity",
      "payment",
      "permission",
      "pro_portal",
      "redirection"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "document",
      "identity",
      "payment",
      "pro_portal"
    ],
    "dependances": [
      "core",
      "country",
      "document",
      "identity",
      "payment",
      "permission",
      "pro_portal",
      "redirection"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "core": [
        "vo-espaces/attestations.ts importe db.ts",
        "vo-espaces/attestations.ts importe schema.ts",
        "vo-espaces/index.ts importe trpc.ts"
      ],
      "country": [
        "client/src/pages/InscriptionProVO.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "document": [
        "vo-espaces/attestations.ts importe document-os/index.ts",
        "vo-espaces/attestations.ts produit un document via Document OS"
      ],
      "identity": [
        "vo-espaces/index.ts exige une session Identity (procédure protégée)",
        "client/src/pages/InscriptionProVO.tsx appelle trpc.kyc"
      ],
      "payment": [
        "client/src/pages/InscriptionProVO.tsx appelle trpc.abonnements"
      ],
      "pro_portal": [
        "client/src/pages/InscriptionProVO.tsx appelle trpc.pro"
      ]
    },
    "dependants": [
      "vente"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/inscription-pro-vo"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/InscriptionProVO.tsx",
        "routes": [
          "/inscription-pro-vo"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 76,
        "mots": 312
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/TableauBordProVente.tsx",
        "route": "/vente",
        "composants": [
          "trpc.voEspaces"
        ]
      },
      {
        "fichier": "client/src/pages/vente/GestionStockVO.tsx",
        "route": "/vente/stock",
        "composants": [
          "trpc.voEspaces"
        ]
      },
      {
        "fichier": "client/src/pages/vente/AttestationVente.tsx",
        "route": "/vente/attestation/:id?",
        "composants": [
          "trpc.voEspaces"
        ]
      }
    ],
    "procedures": [
      "acces",
      "appartient",
      "compteurs",
      "generer",
      "liste",
      "signer",
      "statuts",
      "stock"
    ],
    "tables": [],
    "acces": [
      "connecte"
    ],
    "textes": 76,
    "mots": 312,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_sans_preuve",
        "detail": "permission"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "redirection"
      }
    ]
  },
  {
    "moteur": "workflow",
    "label": "Workflow Engine",
    "categorie": "transversal",
    "etatDeclare": "disabled",
    "dossiers": [
      "modules/operations.ts",
      "routers/operations.ts"
    ],
    "routeurs": [
      "governance",
      "platform",
      "quality",
      "hr",
      "procurement",
      "investor"
    ],
    "fichiersServeur": 2,
    "dependancesDeclarees": [
      "audit",
      "core",
      "identity",
      "notification",
      "permission",
      "scheduler"
    ],
    "dependancesDetectees": [
      "audit",
      "core",
      "identity",
      "notification",
      "permission"
    ],
    "dependances": [
      "audit",
      "core",
      "identity",
      "notification",
      "permission",
      "scheduler"
    ],
    "integrationsTechniques": [
      "identity",
      "permission"
    ],
    "preuvesDependances": {
      "audit": [
        "routers/operations.ts importe audit.ts"
      ],
      "core": [
        "routers/operations.ts importe trpc.ts",
        "routers/operations.ts importe db.ts",
        "routers/operations.ts importe schema.ts"
      ],
      "identity": [
        "routers/operations.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/operations.ts importe notification-os/triggers.ts",
        "routers/operations.ts déclenche notifyEvent"
      ],
      "permission": [
        "routers/operations.ts filtre par rôle (procédure pro/admin/direction/PDG)"
      ]
    },
    "dependants": [
      "avis_reputation",
      "payment"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/corporate",
      "/corporate/a-propos",
      "/corporate/contact-entreprise",
      "/corporate/nos-partenaires",
      "/corporate/nos-services",
      "/corporate/presse-actualites",
      "/corporate/vision-m-k-a-p-m-s",
      "/investisseurs/espace-investisseurs",
      "/investisseurs/objectif-global",
      "/mission",
      "/operations",
      "/operations/ambassadeurs",
      "/operations/centre-acquisition",
      "/operations/centre-audit",
      "/operations/centre-conformite",
      "/operations/centre-donnees-marche",
      "/operations/centre-expansion",
      "/operations/centre-opportunites",
      "/operations/centre-previsions",
      "/operations/centre-risques",
      "/operations/centre-validation",
      "/operations/controle-qualite-global",
      "/operations/m-k-a-p-m-s-afrique",
      "/operations/m-k-a-p-m-s-banque",
      "/operations/m-k-a-p-m-s-mobility",
      "/operations/objectif-final-plateforme",
      "/operations/programme-entreprises-strategiques",
      "/operations/programme-premium",
      "/operations/tableau-bord-fondateur",
      "/recrutement",
      "/recrutement/depot-c-v",
      "/recrutement/offres-emploi",
      "/recrutement/recherche-talents",
      "/superadmin/admin-employes",
      "/superadmin/admin-general",
      "/superadmin/admin-objectif",
      "/superadmin/centre-r-h",
      "/superadmin/gestion-employes-m-k-a-p-m-s"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Mission.tsx",
        "routes": [
          "/mission"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 30,
        "mots": 223
      },
      {
        "fichier": "client/src/pages/SectionAccueil.tsx",
        "routes": [
          "/corporate",
          "/operations",
          "/recrutement"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/corporate/APropos.tsx",
        "routes": [
          "/corporate/a-propos"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/corporate/ContactEntreprise.tsx",
        "routes": [
          "/corporate/contact-entreprise"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/corporate/NosPartenaires.tsx",
        "routes": [
          "/corporate/nos-partenaires"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/corporate/NosServices.tsx",
        "routes": [
          "/corporate/nos-services"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/corporate/PresseActualites.tsx",
        "routes": [
          "/corporate/presse-actualites"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/corporate/VisionMKAPMS.tsx",
        "routes": [
          "/corporate/vision-m-k-a-p-m-s"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/investisseurs/EspaceInvestisseurs.tsx",
        "routes": [
          "/investisseurs/espace-investisseurs"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/investisseurs/ObjectifGlobal.tsx",
        "routes": [
          "/investisseurs/objectif-global"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/operations/Ambassadeurs.tsx",
        "routes": [
          "/operations/ambassadeurs"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 4
      },
      {
        "fichier": "client/src/pages/operations/CentreAcquisition.tsx",
        "routes": [
          "/operations/centre-acquisition"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/CentreAudit.tsx",
        "routes": [
          "/operations/centre-audit"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/CentreConformite.tsx",
        "routes": [
          "/operations/centre-conformite"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/CentreDonneesMarche.tsx",
        "routes": [
          "/operations/centre-donnees-marche"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/operations/CentreExpansion.tsx",
        "routes": [
          "/operations/centre-expansion"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/CentreOpportunites.tsx",
        "routes": [
          "/operations/centre-opportunites"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/CentrePrevisions.tsx",
        "routes": [
          "/operations/centre-previsions"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/CentreRisques.tsx",
        "routes": [
          "/operations/centre-risques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/CentreValidation.tsx",
        "routes": [
          "/operations/centre-validation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/ControleQualiteGlobal.tsx",
        "routes": [
          "/operations/controle-qualite-global"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/operations/MKAPMSAfrique.tsx",
        "routes": [
          "/operations/m-k-a-p-m-s-afrique"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/MKAPMSBanque.tsx",
        "routes": [
          "/operations/m-k-a-p-m-s-banque"
        ],
        "cliquables": 12,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 53,
        "mots": 131
      },
      {
        "fichier": "client/src/pages/operations/MKAPMSMobility.tsx",
        "routes": [
          "/operations/m-k-a-p-m-s-mobility"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/ObjectifFinalPlateforme.tsx",
        "routes": [
          "/operations/objectif-final-plateforme"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/operations/ProgrammeEntreprisesStrategiques.tsx",
        "routes": [
          "/operations/programme-entreprises-strategiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 8
      },
      {
        "fichier": "client/src/pages/operations/ProgrammePremium.tsx",
        "routes": [
          "/operations/programme-premium"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/operations/TableauBordFondateur.tsx",
        "routes": [
          "/operations/tableau-bord-fondateur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 10
      },
      {
        "fichier": "client/src/pages/recrutement/DepotCV.tsx",
        "routes": [
          "/recrutement/depot-c-v"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/recrutement/OffresEmploi.tsx",
        "routes": [
          "/recrutement/offres-emploi"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/recrutement/RechercheTalents.tsx",
        "routes": [
          "/recrutement/recherche-talents"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
      },
      {
        "fichier": "client/src/pages/superadmin/AdminEmployes.tsx",
        "routes": [
          "/superadmin/admin-employes"
        ],
        "cliquables": 16,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 49,
        "mots": 101
      },
      {
        "fichier": "client/src/pages/superadmin/AdminGeneral.tsx",
        "routes": [
          "/superadmin/admin-general"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 17
      },
      {
        "fichier": "client/src/pages/superadmin/AdminObjectif.tsx",
        "routes": [
          "/superadmin/admin-objectif"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 10,
        "mots": 21
      },
      {
        "fichier": "client/src/pages/superadmin/CentreRH.tsx",
        "routes": [
          "/superadmin/centre-r-h"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 13,
        "mots": 30
      },
      {
        "fichier": "client/src/pages/superadmin/GestionEmployesMKAPMS.tsx",
        "routes": [
          "/superadmin/gestion-employes-m-k-a-p-m-s"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 1,
        "textes": 12,
        "mots": 28
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/Admin.tsx",
        "route": "/admin/*",
        "composants": [
          "trpc.governance",
          "trpc.platform",
          "trpc.quality",
          "trpc.hr",
          "trpc.procurement",
          "trpc.investor"
        ]
      }
    ],
    "procedures": [
      "activeFlags",
      "add",
      "addEvent",
      "addEvidence",
      "addKart",
      "addMovement",
      "award",
      "backups",
      "bookings",
      "campaigns",
      "create",
      "createCenter",
      "createEvaluation",
      "createEvent",
      "createFranchise",
      "createLeave",
      "createOrder",
      "createSite",
      "createStation",
      "createSubsidiary",
      "decide",
      "decideLeave",
      "enrollments",
      "evaluations",
      "events",
      "evidence",
      "full",
      "leaves",
      "list",
      "listActive",
      "listAll",
      "listCenters",
      "listEvents",
      "listFleet",
      "listFranchises",
      "listOrders",
      "listSites",
      "listStations",
      "listSubsidiaries",
      "listSuppliers",
      "logBackup",
      "mapData",
      "me",
      "mine",
      "monitoring",
      "movements",
      "open",
      "overview",
      "publicMap",
      "rate",
      "receipts",
      "receive",
      "records",
      "registrations",
      "remove",
      "resolveEvent",
      "setActive",
      "setCenterActive",
      "setFranchiseStatus",
      "setKartStatus",
      "setMaintenance",
      "setOrderStatus",
      "setStationActive",
      "setStatus",
      "setSubsidiaryActive",
      "stats",
      "status",
      "upsert",
      "upsertRecord"
    ],
    "tables": [
      "backup_logs",
      "country_configs",
      "dispute_evidence",
      "disputes",
      "franchises",
      "goods_receipts",
      "hr_evaluations",
      "hr_leaves",
      "hr_records",
      "insurance_policies",
      "lab_experiments",
      "loyalty_accounts",
      "loyalty_transactions",
      "media_assets",
      "monitoring_events",
      "partner_api_keys",
      "partners",
      "platform_settings",
      "purchase_order_items",
      "purchase_orders",
      "quality_ratings",
      "sites",
      "subsidiaries",
      "vehicle_dossier_events",
      "vehicle_dossiers",
      "warehouse_movements"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "public"
    ],
    "textes": 252,
    "mots": 741,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/SectionAccueil.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/corporate/APropos.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/corporate/ContactEntreprise.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/corporate/NosPartenaires.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/corporate/NosServices.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/corporate/PresseActualites.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/corporate/VisionMKAPMS.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/investisseurs/EspaceInvestisseurs.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/investisseurs/ObjectifGlobal.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/Ambassadeurs.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentreAcquisition.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentreAudit.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentreConformite.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentreDonneesMarche.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentreExpansion.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentreOpportunites.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentrePrevisions.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentreRisques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/CentreValidation.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/ControleQualiteGlobal.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/MKAPMSAfrique.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/MKAPMSMobility.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/ObjectifFinalPlateforme.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/ProgrammeEntreprisesStrategiques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/ProgrammePremium.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/operations/TableauBordFondateur.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/recrutement/DepotCV.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/recrutement/OffresEmploi.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/recrutement/RechercheTalents.tsx (3 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminEmployes.tsx:52"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/superadmin/AdminEmployes.tsx:275"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Modifier objectif » client/src/pages/superadmin/AdminObjectif.tsx:35"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Ajouter un employé » client/src/pages/superadmin/GestionEmployesMKAPMS.tsx:41"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "scheduler"
      }
    ]
  }
];

export function perimetreDe(moteur: string): PerimetreMoteur | undefined {
  return MOTEURS.find((m) => m.moteur === moteur);
}
