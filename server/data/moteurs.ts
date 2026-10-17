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

export const MOTEURS_TOTAL = 96;
export const MANQUES_TOTAL = 528;
export const MANQUES_PAR_GENRE: Readonly<Record<string, number>> = {
  "bouton_sans_action": 52,
  "dependance_non_declaree": 67,
  "sans_logique_serveur": 10,
  "ecran_sans_contenu": 340,
  "sans_ecran": 8,
  "dependance_sans_preuve": 41,
  "bouton_declare_absent_ecran": 6,
  "emission_dynamique": 2,
  "destination_inconnue": 2
};

/** Routes client qu'aucun moteur ne revendique. */
export const ROUTES_SANS_MOTEUR: readonly string[] = [];

/** Routeurs tRPC montés qu'aucun moteur ne revendique. */
export const ROUTEURS_SANS_MOTEUR: readonly string[] = [];

/** Fichiers serveur qu'aucun moteur ne possède (hors racine technique). */
export const FICHIERS_SANS_MOTEUR: readonly string[] = [
  "auth-google.ts"
];

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
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 91
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
    "textes": 35,
    "mots": 146,
    "battement": "sonde",
    "manques": []
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
      "payment",
      "smart"
    ],
    "dependancesDetectees": [
      "comptabilite",
      "core",
      "payment",
      "smart"
    ],
    "dependances": [
      "comptabilite",
      "core",
      "payment",
      "smart"
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
      ],
      "smart": [
        "client/src/pages/ComptaDirigeant.tsx appelle trpc.smartEngine"
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
        "cliquables": 22,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 81,
        "mots": 226
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
    "textes": 81,
    "mots": 226,
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
        "cliquables": 9,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 61,
        "mots": 234
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
    "textes": 61,
    "mots": 234,
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
      "analytics",
      "audit",
      "avis_reputation",
      "core",
      "country",
      "estimation",
      "event_bus",
      "garage",
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
    "dependancesDetectees": [
      "analytics",
      "audit",
      "avis_reputation",
      "boutons",
      "core",
      "country",
      "estimation",
      "event_bus",
      "garage",
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
      "analytics",
      "audit",
      "avis_reputation",
      "boutons",
      "core",
      "country",
      "estimation",
      "event_bus",
      "garage",
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
      "analytics": [
        "client/src/pages/HistoriqueVehiculeVente.tsx appelle trpc.historique"
      ],
      "audit": [
        "routers/annonces.ts importe audit.ts"
      ],
      "avis_reputation": [
        "client/src/pages/Vehicule.tsx appelle trpc.reviews"
      ],
      "boutons": [
        "client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/Vehicule.tsx utilise BoutonMoteur"
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
      "garage": [
        "client/src/pages/Devis.tsx appelle trpc.garages"
      ],
      "identity": [
        "routers/annonces.ts importe identity-os/identite-officielle.ts",
        "routers/annonces.ts exige une session Identity (procédure protégée)",
        "routers/devis.ts exige une session Identity (procédure protégée)"
      ],
      "livraison_vehicule": [
        "routers/reservations.ts importe vehicle-delivery/service.ts"
      ],
      "messaging": [
        "client/src/pages/Vehicule.tsx appelle trpc.messages"
      ],
      "notification": [
        "routers/annonces.ts importe modules/search-alerts.ts",
        "routers/annonces.ts importe services/email.ts",
        "routers/annonces.ts envoie un email"
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
      "analytics",
      "atelier",
      "controle_technique",
      "finance",
      "garage",
      "identity",
      "intelligences",
      "location",
      "location_particulier",
      "location_pro",
      "payment",
      "search",
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
    "boutons": [
      {
        "code": "vehicule_recommandation_favori",
        "libelle": "Ajouter / retirer des favoris",
        "genre": "formulaire",
        "ecran": "/vehicule/:id",
        "fichier": "client/src/pages/Vehicule.tsx",
        "ligne": 3150
      }
    ],
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
      "/services",
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
        "cliquables": 46,
        "parMoteur": 0,
        "sansAction": 2,
        "textes": 336,
        "mots": 1363
      },
      {
        "fichier": "client/src/pages/Favoris.tsx",
        "routes": [
          "/favoris"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 25
      },
      {
        "fichier": "client/src/pages/HistoriqueVehiculeVente.tsx",
        "routes": [
          "/acheter/historique-vehicule"
        ],
        "cliquables": 6,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 20,
        "mots": 87
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
        "fichier": "client/src/pages/Services.tsx",
        "routes": [
          "/services"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 32
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "routes": [
          "/vehicule/:id"
        ],
        "cliquables": 149,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 620,
        "mots": 2512
      },
      {
        "fichier": "client/src/pages/VenteCamions.tsx",
        "routes": [
          "/acheter/camions"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
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
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 50,
        "mots": 116
      },
      {
        "fichier": "client/src/pages/VenteVTC.tsx",
        "routes": [
          "/acheter/vtc-taxi"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
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
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 33
      },
      {
        "fichier": "client/src/pages/superadmin/AdminModerationAnnonces.tsx",
        "routes": [
          "/superadmin/admin-moderation-annonces"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 37
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
        "fichier": "client/src/pages/LocationUtilitaires.tsx",
        "route": "/louer/utilitaires",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/LocationCamions.tsx",
        "route": "/louer/camions",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/LocationMinibus.tsx",
        "route": "/louer/minibus",
        "composants": [
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
        "fichier": "client/src/pages/EtatVehicule.tsx",
        "route": "/louer/etats-vehicule",
        "composants": [
          "trpc.reservations"
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
        "fichier": "client/src/pages/InspectionNumerique.tsx",
        "route": "/louer/inspection",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/CentrePenalites.tsx",
        "route": "/louer/penalites",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/VehiculesCertifies.tsx",
        "route": "/louer/certifies",
        "composants": [
          "components/ReserverLocationButton.tsx",
          "trpc.annonces"
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
        "fichier": "client/src/pages/vente/CentrePhotosMedias.tsx",
        "route": "/vente/photos/:id",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/vente/ReservationsVente.tsx",
        "route": "/vente/reservations",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/vente/CentreNegociation.tsx",
        "route": "/vente/negociation/:id",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/vente/CentreVisiteVehicule.tsx",
        "route": "/vente/visite/:id",
        "composants": [
          "trpc.annonces",
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/vente/CentreEssaiRoutier.tsx",
        "route": "/vente/essai/:id",
        "composants": [
          "trpc.annonces",
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/vente/CentreFavorisVente.tsx",
        "route": "/vente/favoris",
        "composants": [
          "trpc.favoris"
        ]
      },
      {
        "fichier": "client/src/pages/vente/CentreRetourClient.tsx",
        "route": "/vente/retour-client/:id",
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
        "fichier": "client/src/pages/Historique.tsx",
        "route": "/historique",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/HistoriqueConsultations.tsx",
        "route": "/historique-consultations",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/DossierClient.tsx",
        "route": "/dossier-client",
        "composants": [
          "trpc.annonces",
          "trpc.favoris",
          "trpc.reservations",
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
        "fichier": "client/src/pages/RechercheGeolocalisee.tsx",
        "route": "/recherche",
        "composants": [
          "trpc.annonces"
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
        "fichier": "client/src/pages/garage/ControleTechnique.tsx",
        "route": "/garage/controle-technique",
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
      },
      {
        "fichier": "client/src/pages/finance/AcompteFinance.tsx",
        "route": "/finance/acompte-finance",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/finance/CentreFactures.tsx",
        "route": "/finance/centre-factures",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/finance/DepotGarantieFinance.tsx",
        "route": "/finance/depot-garantie-finance",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/finance/ObjectifFinance.tsx",
        "route": "/finance/objectif-finance",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/finance/PaiementComptant.tsx",
        "route": "/finance/paiement-comptant",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/finance/RemboursementsFinance.tsx",
        "route": "/finance/remboursements-finance",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/finance/TableauBordFinance.tsx",
        "route": "/finance/tableau-bord-finance",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/CentreFavorisUtilisateur.tsx",
        "route": "/utilisateurs/centre-favoris-utilisateur",
        "composants": [
          "trpc.favoris"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/FacturesUtilisateur.tsx",
        "route": "/utilisateurs/factures-utilisateur",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/HistoriqueAchats.tsx",
        "route": "/utilisateurs/historique-achats",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/HistoriqueLocations.tsx",
        "route": "/utilisateurs/historique-locations",
        "composants": [
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/MesVehicules.tsx",
        "route": "/utilisateurs/mes-vehicules",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/ObjectifUtilisateur.tsx",
        "route": "/utilisateurs/objectif-utilisateur",
        "composants": [
          "trpc.annonces",
          "trpc.favoris"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/TableauBordPerso.tsx",
        "route": "/utilisateurs/tableau-bord-perso",
        "composants": [
          "trpc.annonces",
          "trpc.favoris",
          "trpc.reservations"
        ]
      },
      {
        "fichier": "client/src/pages/depot-annonce/ExpirationAnnonce.tsx",
        "route": "/depot-annonce/expiration-annonce/:id",
        "composants": [
          "trpc.annonces"
        ]
      },
      {
        "fichier": "client/src/pages/depot-annonce/ModificationAnnonce.tsx",
        "route": "/depot-annonce/modification-annonce/:id",
        "composants": [
          "trpc.annonces"
        ]
      }
    ],
    "procedures": [
      "boostAnnonce",
      "buyNow",
      "create",
      "demanderVisite",
      "detail",
      "estimate",
      "facettes",
      "get",
      "incrementView",
      "list",
      "lookupPlate",
      "mesPaiements",
      "mesReservationsRecues",
      "mine",
      "montantAPayer",
      "myList",
      "payCaution",
      "payerDevis",
      "prolong",
      "quotaStatus",
      "remove",
      "repondreReservationRecue",
      "requestLocation",
      "set",
      "toggle",
      "update",
      "updateStatus"
    ],
    "tables": [],
    "acces": [
      "connecte",
      "public"
    ],
    "textes": 1566,
    "mots": 5516,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« VALIDER » client/src/pages/Devis.tsx:531"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Lire mes dimensions de pneus » client/src/pages/Devis.tsx:551"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
      "boutons",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependances": [
      "achat",
      "avis_reputation",
      "boutons",
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
      "boutons": [
        "client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/Vehicule.tsx utilise BoutonMoteur"
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
    "boutons": [
      {
        "code": "vehicule_recommandation_favori",
        "libelle": "Ajouter / retirer des favoris",
        "genre": "formulaire",
        "ecran": "/acheter/mkapms-officiel/vehicule/:id",
        "fichier": "client/src/pages/Vehicule.tsx",
        "ligne": 3150
      }
    ],
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
        "cliquables": 149,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 620,
        "mots": 2512
      },
      {
        "fichier": "client/src/pages/VenteMKAPMS.tsx",
        "routes": [
          "/acheter/mkapms-officiel"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 52,
        "mots": 123
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 672,
    "mots": 2635,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
      "boutons",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependances": [
      "achat",
      "avis_reputation",
      "boutons",
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
      "boutons": [
        "client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/Vehicule.tsx utilise BoutonMoteur"
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
    "boutons": [
      {
        "code": "vehicule_recommandation_favori",
        "libelle": "Ajouter / retirer des favoris",
        "genre": "formulaire",
        "ecran": "/acheter/particulier/vehicule/:id",
        "fichier": "client/src/pages/Vehicule.tsx",
        "ligne": 3150
      }
    ],
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
        "cliquables": 149,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 620,
        "mots": 2512
      },
      {
        "fichier": "client/src/pages/VenteParticulier.tsx",
        "routes": [
          "/acheter/particulier"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 60,
        "mots": 126
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 680,
    "mots": 2638,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
      "boutons",
      "core",
      "country",
      "estimation",
      "messaging",
      "risque_import"
    ],
    "dependances": [
      "achat",
      "avis_reputation",
      "boutons",
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
      "boutons": [
        "client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/Vehicule.tsx utilise BoutonMoteur"
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
    "boutons": [
      {
        "code": "vehicule_recommandation_favori",
        "libelle": "Ajouter / retirer des favoris",
        "genre": "formulaire",
        "ecran": "/acheter/professionnel/vehicule/:id",
        "fichier": "client/src/pages/Vehicule.tsx",
        "ligne": 3150
      }
    ],
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
        "cliquables": 149,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 620,
        "mots": 2512
      },
      {
        "fichier": "client/src/pages/VentePro.tsx",
        "routes": [
          "/acheter/professionnel"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 54,
        "mots": 111
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 674,
    "mots": 2623,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/Vehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
    "fichiersServeur": 5,
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
        "textes": 24,
        "mots": 129
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "domain",
      "history",
      "latest",
      "matriceCauses",
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
    "textes": 24,
    "mots": 129,
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
      "routers/historique.ts",
      "routers/statistiques.ts"
    ],
    "routeurs": [
      "historique",
      "statistiques"
    ],
    "fichiersServeur": 3,
    "dependancesDeclarees": [
      "achat",
      "core",
      "monitoring",
      "redirection",
      "seo",
      "smart"
    ],
    "dependancesDetectees": [
      "achat",
      "core",
      "smart"
    ],
    "dependances": [
      "achat",
      "core",
      "monitoring",
      "redirection",
      "seo",
      "smart"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/Historique.tsx appelle trpc.annonces",
        "client/src/pages/HistoriqueConsultations.tsx appelle trpc.annonces"
      ],
      "core": [
        "routers/historique.ts importe trpc.ts",
        "routers/historique.ts importe db.ts",
        "routers/historique.ts importe schema.ts"
      ],
      "smart": [
        "routers/historique.ts importe smart-engine/services/alert-engine.ts",
        "routers/historique.ts ouvre une alerte du Système Intelligent",
        "client/src/pages/HistoriqueConsultations.tsx appelle trpc.smartEngine"
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
      "/historique",
      "/historique-consultations",
      "/superadmin/admin-statistiques"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Historique.tsx",
        "routes": [
          "/historique"
        ],
        "cliquables": 12,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 49,
        "mots": 222
      },
      {
        "fichier": "client/src/pages/HistoriqueConsultations.tsx",
        "routes": [
          "/historique-consultations"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 18
      },
      {
        "fichier": "client/src/pages/superadmin/AdminStatistiques.tsx",
        "routes": [
          "/superadmin/admin-statistiques"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 28
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/HistoriqueVehiculeVente.tsx",
        "route": "/acheter/historique-vehicule",
        "composants": [
          "trpc.historique"
        ]
      },
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.historique"
        ]
      }
    ],
    "procedures": [
      "globales",
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
    "textes": 65,
    "mots": 268,
    "battement": "sonde",
    "manques": [
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
    "manques": []
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
    "fichiersServeur": 5,
    "dependancesDeclarees": [
      "achat",
      "boutons",
      "core",
      "event_bus",
      "garage",
      "notification",
      "permission",
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
      "notification",
      "permission",
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
        "client/src/pages/AtelierPro.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/AtelierPro.tsx utilise BoutonMoteur",
        "client/src/pages/garage/CommandesAutomatiques.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
        "client/src/pages/AtelierPro.tsx appelle trpc.garages",
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
        "code": "atelier_client_appeler",
        "libelle": "Appeler le client",
        "genre": "appel",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 280
      },
      {
        "code": "atelier_client_appeler",
        "libelle": "Appeler le client",
        "genre": "appel",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 419
      },
      {
        "code": "atelier_client_ecrire",
        "libelle": "Écrire au client",
        "genre": "email",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 285
      },
      {
        "code": "atelier_client_ecrire",
        "libelle": "Écrire au client",
        "genre": "email",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 420
      },
      {
        "code": "atelier_devis_garage",
        "libelle": "Devis émis par l'atelier",
        "genre": "non_branchee",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 343
      },
      {
        "code": "atelier_employes",
        "libelle": "Équipe de l'atelier",
        "genre": "non_branchee",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 342
      },
      {
        "code": "atelier_factures",
        "libelle": "Factures de l'atelier",
        "genre": "non_branchee",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 344
      },
      {
        "code": "atelier_intervention_etape",
        "libelle": "Changer l'étape de l'intervention",
        "genre": "formulaire",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 267
      },
      {
        "code": "atelier_intervention_etape",
        "libelle": "Changer l'étape de l'intervention",
        "genre": "formulaire",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 317
      },
      {
        "code": "atelier_intervention_etape",
        "libelle": "Changer l'étape de l'intervention",
        "genre": "formulaire",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 325
      },
      {
        "code": "atelier_ordres_reparation",
        "libelle": "Ordres de réparation",
        "genre": "non_branchee",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 341
      },
      {
        "code": "atelier_ouvrir_catalogue",
        "libelle": "Catalogue technique",
        "genre": "navigation",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 457
      },
      {
        "code": "atelier_ouvrir_pieces",
        "libelle": "Rechercher une pièce",
        "genre": "navigation",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 466
      },
      {
        "code": "atelier_ouvrir_planning",
        "libelle": "Ouvrir le planning atelier",
        "genre": "navigation",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 289
      },
      {
        "code": "atelier_ouvrir_planning",
        "libelle": "Ouvrir le planning atelier",
        "genre": "navigation",
        "ecran": "/atelier-pro",
