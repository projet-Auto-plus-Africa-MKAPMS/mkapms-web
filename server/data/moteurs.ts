Warning: truncated output (original token count: 158250)
Total output lines: 24904

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

export const MOTEURS_TOTAL = 94;
export const MANQUES_TOTAL = 521;
export const MANQUES_PAR_GENRE: Readonly<Record<string, number>> = {
  "dependance_non_declaree": 62,
  "sans_logique_serveur": 10,
  "ecran_sans_contenu": 340,
  "sans_ecran": 8,
  "dependance_sans_preuve": 41,
  "bouton_sans_action": 50,
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
        "cliquables": 26,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 198,
        "mots": 714
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
    "textes": 1428,
    "mots": 4867,
    "battement": "sonde",
    "manques": [
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
      "atelie…128250 tokens truncated…nonce.tsx",
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
        "cliquables": 4,
        "parMoteur": 2,
        "sansAction": 0,
        "textes": 7,
        "mots": 39
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
          "/vente/essai/:id"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 13
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
        "sansAction": 0,
        "textes": 6,
        "mots": 23
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
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 6
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
          "/vente/negociation/:id"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
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
          "/vente/photos/:id"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 14,
        "mots": 40
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
          "/vente/retour-client/:id"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 29
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
          "/vente/visite/:id"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 6,
        "mots": 12
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
          "/vente/droits/:id"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/vente/GestionEmployes.tsx",
        "routes": [
          "/vente/employes"
        ],
        "cliquables": 11,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 53
      },
      {
        "fichier": "client/src/pages/vente/GestionStockVO.tsx",
        "routes": [
          "/vente/stock"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 21,
        "mots": 51
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
        "sansAction": 0,
        "textes": 8,
        "mots": 34
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
    "textes": 979,
    "mots": 3541,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/contact?sujet=Conseil%20abonnement client/src/pages/Abonnements.tsx:476"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/depot-annonce/ConseilsIA.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/depot-annonce/ExpirationAnnonce.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/depot-annonce/IdentificationVehicule.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/depot-annonce/ObjectifDepotAnnonce.tsx (3 texte(s))"
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
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/CentreArchives.tsx (4 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Nouvelle campagne » client/src/pages/vente/CentreCampagnes.tsx:16"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/vente/CentreControleQualite.tsx:20"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Voir » client/src/pages/vente/CentreDetectionFraude.tsx:17"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« (sans texte) » client/src/pages/vente/CentreExport.tsx:17"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/CentreFournisseurs.tsx (4 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/CentreGarantieOccasion.tsx (2 texte(s))"
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
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/vente/DroitsAcces.tsx (2 texte(s))"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Ajouter un site » client/src/pages/vente/MultiSites.tsx:17"
      },
      {
        "genre": "bouton_declare_absent_ecran",
        "detail": "vente_pro_factures déclaré pour /vente mais aucun écran ne l'utilise"
      },
      {
        "genre": "bouton_declare_absent_ecran",
        "detail": "vente_pro_resume_vendeur déclaré pour /vente mais aucun écran ne l'utilise"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "identity — client/src/pages/vente/CentreEssaiRoutier.tsx appelle trpc.kyc"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "pro_portal — client/src/pages/vente/CentreFournisseurs.tsx appelle trpc.pro"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "search — client/src/pages/vente/CentreAlertesRecherche.tsx appelle trpc.searches"
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
        "mots": 640
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
        "textes": 36,
        "mots": 126
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 154,
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
    "dependancesDetectees": [
      "boutons",
      "country",
      "identity",
      "pro_portal",
      "vo_espaces"
    ],
    "dependances": [
      "boutons",
      "core",
      "country",
      "identity",
      "pro_portal",
      "vente",
      "vo_espaces"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "boutons": [
        "client/src/pages/vente/TableauBordVendeur.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/vente/TableauBordVendeur.tsx utilise BoutonMoteur"
      ],
      "country": [
        "client/src/pages/EspaceProVente.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "identity": [
        "client/src/pages/InscriptionProVente.tsx appelle trpc.kyc"
      ],
      "pro_portal": [
        "client/src/pages/InscriptionProVente.tsx appelle trpc.pro"
      ],
      "vo_espaces": [
        "client/src/pages/vente/TableauBordVendeur.tsx appelle trpc.voEspaces"
      ]
    },
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "vente_resume_factures",
        "libelle": "Factures",
        "genre": "navigation",
        "ecran": "/vente/resume-vendeur",
        "fichier": "client/src/pages/vente/TableauBordVendeur.tsx",
        "ligne": 75
      },
      {
        "code": "vente_resume_retour_tableau",
        "libelle": "Retour au tableau de bord",
        "genre": "navigation",
        "ecran": "/vente/resume-vendeur",
        "fichier": "client/src/pages/vente/TableauBordVendeur.tsx",
        "ligne": 32
      }
    ],
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
        "sansAction": 0,
        "textes": 15,
        "mots": 32
      },
      {
        "fichier": "client/src/pages/InscriptionProVente.tsx",
        "routes": [
          "/acheter/inscription-pro"
        ],
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 38,
        "mots": 187
      },
      {
        "fichier": "client/src/pages/vente/TableauBordVendeur.tsx",
        "routes": [
          "/vente/resume-vendeur"
        ],
        "cliquables": 2,
        "parMoteur": 2,
        "sansAction": 0,
        "textes": 10,
        "mots": 17
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 63,
    "mots": 236,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/vente/TableauBordVendeur.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "country — client/src/pages/EspaceProVente.tsx embarque lib/currency.tsx (trpc.currency)"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "identity — client/src/pages/InscriptionProVente.tsx appelle trpc.kyc"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "pro_portal — client/src/pages/InscriptionProVente.tsx appelle trpc.pro"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "vo_espaces — client/src/pages/vente/TableauBordVendeur.tsx appelle trpc.voEspaces"
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
      "boutons",
      "core",
      "notification",
      "permission"
    ],
    "dependances": [
      "boutons",
      "core",
      "notification",
      "permission"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "boutons": [
        "client/src/pages/VOInterne.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/VOInterne.tsx utilise BoutonMoteur"
      ],
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
    "dependants": [],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "vo_interne_carte_compteur",
        "libelle": "Carte du tableau de bord VO → liste filtrée",
        "genre": "formulaire",
        "ecran": "/vo",
        "fichier": "client/src/pages/VOInterne.tsx",
        "ligne": 1201
      }
    ],
    "routes": [
      "/vo"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/VOInterne.tsx",
        "routes": [
          "/vo"
        ],
        "cliquables": 21,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 196,
        "mots": 721
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
    "textes": 196,
    "mots": 721,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/VOInterne.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      }
    ]
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
      "intelligences"
    ],
    "dependancesDetectees": [
      "achat",
      "core",
      "country",
      "intelligences"
    ],
    "dependances": [
      "achat",
      "core",
      "country",
      "intelligences"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/VehiculesCertifies.tsx appelle trpc.annonces",
        "client/src/pages/VehiculesCertifies.tsx embarque components/ReserverLocationButton.tsx (trpc.reservations)"
      ],
      "core": [
        "vo-engine/index.ts importe trpc.ts",
        "vo-engine/service.ts importe db.ts",
        "vo-engine/service.ts importe schema.ts"
      ],
      "country": [
        "vo-engine/service.ts importe country-os/index.ts",
        "client/src/pages/EstimationAuto.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "intelligences": [
        "vo-engine/index.ts importe market-price-intelligence/service.ts"
      ]
    },
    "dependants": [
      "estimation",
      "intelligences"
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
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 45,
        "mots": 228
      },
      {
        "fichier": "client/src/pages/RepriseVehicule.tsx",
        "routes": [
          "/acheter/reprise"
        ],
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 15,
        "mots": 45
      },
      {
        "fichier": "client/src/pages/VehiculesCertifies.tsx",
        "routes": [
          "/louer/certifies"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 16,
        "mots": 55
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "accepterOffre",
      "addDossierItem",
      "comparaisonExterne",
      "dossier",
      "estimate",
      "health",
      "myEstimations",
      "myRepriseRequests",
      "negocierOffre",
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
    "textes": 76,
    "mots": 328,
    "battement": "sonde",
    "manques": []
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
      "pro_portal"
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
      "pro_portal"
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
      "vente",
      "vente_pro"
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
      },
      {
        "fichier": "client/src/pages/vente/TableauBordVendeur.tsx",
        "route": "/vente/resume-vendeur",
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
    "manques": []
  },
  {
    "moteur": "workflow",
    "label": "Workflow Engine",
    "categorie": "transversal",
    "etatDeclare": "disabled",
    "dossiers": [
      "modules/hr-direction.ts",
      "modules/operations.ts",
      "routers/operations.ts",
      "routers/objectifs.ts"
    ],
    "routeurs": [
      "governance",
      "platform",
      "quality",
      "hr",
      "procurement",
      "investor",
      "objectifs"
    ],
    "fichiersServeur": 4,
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
      "boutons",
      "core",
      "identity",
      "notification",
      "permission"
    ],
    "dependances": [
      "audit",
      "boutons",
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
      "boutons": [
        "client/src/pages/superadmin/AdminEmployes.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/superadmin/AdminEmployes.tsx utilise BoutonMoteur",
        "client/src/pages/superadmin/GestionEmployesMKAPMS.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      ],
      "core": [
        "routers/objectifs.ts importe trpc.ts",
        "routers/objectifs.ts importe db.ts",
        "routers/objectifs.ts importe schema.ts"
      ],
      "identity": [
        "routers/objectifs.ts exige une session Identity (procédure protégée)",
        "routers/operations.ts exige une session Identity (procédure protégée)"
      ],
      "notification": [
        "routers/operations.ts importe notification-os/triggers.ts",
        "routers/operations.ts déclenche notifyEvent"
      ],
      "permission": [
        "routers/objectifs.ts filtre par rôle (procédure pro/admin/direction/PDG)",
        "routers/operations.ts filtre par rôle (procédure pro/admin/direction/PDG)"
      ]
    },
    "dependants": [
      "avis_reputation",
      "payment",
      "supplier_engine"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "admin_employe_ajouter",
        "libelle": "Ajouter un employé",
        "genre": "formulaire",
        "ecran": "/superadmin/gestion-employes-m-k-a-p-m-s",
        "fichier": "client/src/pages/superadmin/GestionEmployesMKAPMS.tsx",
        "ligne": 30
      },
      {
        "code": "admin_employe_enregistrer",
        "libelle": "Créer le compte",
        "genre": "formulaire",
        "ecran": "/superadmin/gestion-employes-m-k-a-p-m-s",
        "fichier": "client/src/pages/superadmin/GestionEmployesMKAPMS.tsx",
        "ligne": 42
      },
      {
        "code": "admin_employes_ajouter_mission",
        "libelle": "Ajouter une mission RH",
        "genre": "formulaire",
        "ecran": "/superadmin/admin-employes",
        "fichier": "client/src/pages/superadmin/AdminEmployes.tsx",
        "ligne": 257
      },
      {
        "code": "admin_employes_enregistrer",
        "libelle": "Enregistrer le profil RH",
        "genre": "formulaire",
        "ecran": "/superadmin/admin-employes",
        "fichier": "client/src/pages/superadmin/AdminEmployes.tsx",
        "ligne": 157
      },
      {
        "code": "admin_employes_filtrer",
        "libelle": "Filtrer les employés",
        "genre": "formulaire",
        "ecran": "/superadmin/admin-employes",
        "fichier": "client/src/pages/superadmin/AdminEmployes.tsx",
        "ligne": 57
      },
      {
        "code": "admin_employes_retirer_mission",
        "libelle": "Retirer une mission du planning",
        "genre": "formulaire",
        "ecran": "/superadmin/admin-employes",
        "fichier": "client/src/pages/superadmin/AdminEmployes.tsx",
        "ligne": 280
      }
    ],
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
        "parMoteur": 4,
        "sansAction": 0,
        "textes": 46,
        "mots": 92
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
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 4,
        "mots": 34
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
        "cliquables": 4,
        "parMoteur": 2,
        "sansAction": 0,
        "textes": 17,
        "mots": 76
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
      "activity",
      "add",
      "addEvent",
      "addEvidence",
      "addKart",
      "addMovement",
      "addStaffTask",
      "award",
      "backups",
      "bookings",
      "campaigns",
      "cancelStaffTask",
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
      "saveStaffProfile",
      "setActive",
      "setCenterActive",
      "setCible",
      "setFranchiseStatus",
      "setKartStatus",
      "setMaintenance",
      "setOrderStatus",
      "setStationActive",
      "setStatus",
      "setSubsidiaryActive",
      "staffDirectory",
      "staffPlanning",
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
      "hr_weekly_tasks",
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
    "textes": 248,
    "mots": 793,
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
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/superadmin/AdminObjectif.tsx (4 texte(s))"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/superadmin/AdminEmployes.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
