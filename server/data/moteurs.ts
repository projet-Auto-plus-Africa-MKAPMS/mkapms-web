Warning: truncated output (original token count: 160278)
Total output lines: 25242

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
export const ROUTES_SANS_MOTEUR: readonly string[] = [
  "/b2b"
];

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
        "textes": 350,
        "mots": 1450
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
        "fichier": "client/src/pages/HomePro.tsx",
        "route": "/b2b",
        "composants": [
          "trpc.annonces"
        ]
      },
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
    "textes": 1580,
    "mots": 5603,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« VALIDER » client/src/pages/Devis.tsx:548"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Lire mes dimensions de pneus » client/src/pages/Devis.tsx:568"
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
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 302
      },
      {
        "code": "atelier_ouvrir_reappro",
        "libelle": "Réapprovisionnement",
        "genre": "navigation",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 356
      },
      {
        "code": "atelier_ouvrir_reappro",
        "libelle": "Réapprovisionnement",
        "genre": "navigation",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 393
      },
      {
        "code": "atelier_ouvrir_reappro",
        "libelle": "Réapprovisionnement",
        "genre": "navigation",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 467
      },
      {
        "code": "atelier_ouvrir_stock",
        "libelle": "Gérer le stock de pièces",
        "genre": "navigation",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 355
      },
      {
        "code": "atelier_stock_mouvement",
        "libelle": "Entrée / sortie de stock",
        "genre": "formulaire",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 387
      },
      {
        "code": "atelier_stock_mouvement",
        "libelle": "Entrée / sortie de stock",
        "genre": "formulaire",
        "ecran": "/atelier-pro",
        "fichier": "client/src/pages/AtelierPro.tsx",
        "ligne": 390
      },
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
        "cliquables": 29,
        "parMoteur": 20,
        "sansAction": 0,
        "textes": 59,
        "mots": 185
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
    "textes": 254,
    "mots": 831,
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
    "fichiersServeur": 4,
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
        "auction-engine/service.ts importe db.ts",
        "auction-engine/service.ts importe schema.ts"
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
      "comptabilite"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/acheter/encheres",
      "/encheres",
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
      },
      {
        "fichier": "client/src/pages/VenteEncheres.tsx",
        "routes": [
          "/acheter/encheres"
        ],
        "cliquables": 38,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 205,
        "mots": 646
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/comptabilite/CentrePilotage.tsx",
        "route": "/comptabilite/centre-pilotage",
        "composants": [
          "trpc.auctionEngine"
        ]
      }
    ],
    "procedures": [
      "bid",
      "businessStats",
      "buyerProfiles",
      "cancel",
      "catalogCategories",
      "close",
      "closeExpired",
      "create",
      "detail",
      "health",
      "list",
      "myAuctions",
      "myBids",
      "myWonAuctions",
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
      "direction",
      "public"
    ],
    "textes": 216,
    "mots": 697,
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
      "document_engine",
      "event_bus",
      "identity",
      "indexation",
      "investment",
      "messaging",
      "payout_engine",
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
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 22,
        "mots": 106
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
    "textes": 26,
    "mots": 114,
    "battement": "pont_os",
    "manques": [
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
        "mots": 130
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
    "mots": 130,
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
      "depannage",
      "identity",
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
      "intelligences",
      "livraison",
      "notification",
      "smart",
      "workflow"
    ],
    "dependances": [
      "connecteur_google_business",
      "core",
      "depannage",
      "identity",
      "intelligences",
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
        "reputation-engine/index.ts exige une session Identity (procédure protégée)",
        "routers/app-feedback.ts exige une session Identity (procédure protégée)",
        "routers/reviews.ts importe identity-os/identite-officielle.ts"
      ],
      "intelligences": [
        "reputation-engine/fraud.ts importe intelligences/fonctions.ts",
        "reputation-engine/fraud.ts importe intelligences/provider.ts"
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
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 7,
        "mots": 40
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
    "textes": 98,
    "mots": 637,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "intelligences — reputation-engine/fraud.ts importe intelligences/fonctions.ts"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "pieces"
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
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 39
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
    "textes": 10,
    "mots": 39,
    "battement": "pont_os",
    "manques": []
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
    "fichiersServeur": 6,
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
      "achat",
      "achat_officiel",
      "achat_particulier",
      "achat_pro",
      "atelier",
      "auto_branchement",
      "cartegrise",
      "continuous_test",
      "country",
      "document",
      "garage",
      "livraison",
      "livraison_vehicule",
      "location_pro",
      "smart",
      "vente",
      "vente_pro",
      "vo",
      "workflow"
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
    "routes": [
      "/superadmin/moteur-boutons"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/superadmin/MoteurBoutons.tsx",
        "routes": [
          "/superadmin/moteur-boutons"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 12,
        "mots": 82
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/LocationPro.tsx",
        "route": "/louer/pro",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
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
        "fichier": "client/src/pages/TableauBordProVente.tsx",
        "route": "/vente",
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
        "fichier": "client/src/pages/vente/TableauBordVendeur.tsx",
        "route": "/vente/resume-vendeur",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/vente/CentreAlertesRecherche.tsx",
        "route": "/vente/alertes-recherche",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/particulier/vehicule/:id",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/professionnel/vehicule/:id",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/acheter/mkapms-officiel/vehicule/:id",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/Vehicule.tsx",
        "route": "/vehicule/:id",
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
        "fichier": "client/src/pages/VOInterne.tsx",
        "route": "/vo",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/AtelierPro.tsx",
        "route": "/atelier-pro",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/CatalogueTechnique.tsx",
        "route": "/catalogue-technique",
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
      },
      {
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "route": "/demarches/carte-grise-demarche",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/demarches/EspaceProDemarches.tsx",
        "route": "/demarches/espace-pro-demarches",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/demarches/SuiviDossier.tsx",
        "route": "/demarches/suivi-dossier",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminCarteMoniale.tsx",
        "route": "/superadmin/admin-carte-moniale",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminEmployes.tsx",
        "route": "/superadmin/admin-employes",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminValidationDocs.tsx",
        "route": "/superadmin/admin-validation-docs",
        "composants": [
          "lib/boutonMoteur.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/GestionEmployesMKAPMS.tsx",
        "route": "/superadmin/gestion-employes-m-k-a-p-m-s",
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
    "textes": 12,
    "mots": 82,
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
      "modules/cartegrise-catalogue.ts",
      "routers/cartegrise.ts"
    ],
    "routeurs": [
      "carteGrise"
    ],
    "fichiersServeur": 3,
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
      "boutons",
      "core",
      "identity",
      "notification",
      "payment"
    ],
    "dependances": [
      "audit",
      "boutons",
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
      "boutons": [
        "client/src/pages/demarches/CarteGriseDemarche.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/demarches/CarteGriseDemarche.tsx utilise BoutonMoteur",
        "client/src/pages/demarches/EspaceProDemarches.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
    "dependants": [
      "payment"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "demarches_connexion",
        "libelle": "Se connecter pour déposer",
        "genre": "navigation",
        "ecran": "/demarches/espace-pro-demarches",
        "fichier": "client/src/pages/demarches/EspaceProDemarches.tsx",
        "ligne": 26
      },
      {
        "code": "demarches_connexion",
        "libelle": "Se connecter pour déposer",
        "genre": "navigation",
        "ecran": "/demarches/suivi-dossier",
        "fichier": "client/src/pages/demarches/SuiviDossier.tsx",
        "ligne": 37
      },
      {
        "code": "demarches_deposer",
        "libelle": "Déposer la démarche",
        "genre": "formulaire",
        "ecran": "/demarches/*",
        "fichier": "",
        "ligne": 0
      },
      {
        "code": "demarches_nouveau_dossier",
        "libelle": "Nouveau dossier",
        "genre": "navigation",
        "ecran": "/demarches/espace-pro-demarches",
        "fichier": "client/src/pages/demarches/EspaceProDemarches.tsx",
        "ligne": 42
      },
      {
        "code": "demarches_ouvrir_changement_adresse",
        "libelle": "Changement d'adresse",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 14
      },
      {
        "code": "demarches_ouvrir_changement_titulaire",
        "libelle": "Changement de titulaire",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 16
      },
      {
        "code": "demarches_ouvrir_declaration_cession",
        "libelle": "Déclaration de cession",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 18
      },
      {
        "code": "demarches_ouvrir_duplicata_demarche",
        "libelle": "Duplicata de carte grise",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 20
      },
      {
        "code": "demarches_ouvrir_immatriculation_provisoire",
        "libelle": "Immatriculation provisoire (WW)",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 22
      },
      {
        "code": "demarches_ouvrir_importation_vehicule",
        "libelle": "Importation de véhicule",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 24
      },
      {
        "code": "demarches_ouvrir_plaques_immatriculation",
        "libelle": "Plaques d'immatriculation",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 30
      },
      {
        "code": "demarches_ouvrir_succession_vehicule",
        "libelle": "Succession",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 26
      },
      {
        "code": "demarches_ouvrir_ww_garage",
        "libelle": "W garage",
        "genre": "navigation",
        "ecran": "/demarches/carte-grise-demarche",
        "fichier": "client/src/pages/demarches/CarteGriseDemarche.tsx",
        "ligne": 28
      },
      {
        "code": "demarches_suivre_dossier",
        "libelle": "Suivre ce dossier",
        "genre": "navigation",
        "ecran": "/demarches/espace-pro-demarches",
        "fichier": "client/src/pages/demarches/EspaceProDemarches.tsx",
        "ligne": 33
      },
      {
        "code": "demarches_suivre_dossier",
        "libelle": "Suivre ce dossier",
        "genre": "navigation",
        "ecran": "/demarches/suivi-dossier",
        "fichier": "client/src/pages/demarches/SuiviDossier.tsx",
        "ligne": 85
      }
    ],
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
      "/demarches/messagerie-demarches/:id",
      "/demarches/objectif-demarches",
      "/demarches/paiement-demarches/:id",
      "/demarches/plaques-immatriculation",
      "/demarches/signatures-electroniques/:id",
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
        "textes": 65,
        "mots": 310
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
        "cliquables": 10,
        "parMoteur": 9,
        "sansAction": 0,
        "textes": 11,
        "mots": 37
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
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/demarches/ChangementTitulaire.tsx",
        "routes": [
          "/demarches/changement-titulaire"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/demarches/DeclarationCession.tsx",
        "routes": [
          "/demarches/declaration-cession"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
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
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 2
      },
      {
        "fichier": "client/src/pages/demarches/EspaceProDemarches.tsx",
        "routes": [
          "/demarches/espace-pro-demarches"
        ],
        "cliquables": 4,
        "parMoteur": 3,
        "sansAction": 0,
        "textes": 6,
        "mots": 14
      },
      {
        "fichier": "client/src/pages/demarches/ImmatriculationProvisoire.tsx",
        "routes": [
          "/demarches/immatriculation-provisoire"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/demarches/ImportationVehicule.tsx",
        "routes": [
          "/demarches/importation-vehicule"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/demarches/MessagerieDemarches.tsx",
        "routes": [
          "/demarches/messagerie-demarches/:id"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 23
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
          "/demarches/paiement-demarches/:id"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 38
      },
      {
        "fichier": "client/src/pages/demarches/PlaquesImmatriculation.tsx",
        "routes": [
          "/demarches/plaques-immatriculation"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/demarches/SignaturesElectroniques.tsx",
        "routes": [
          "/demarches/signatures-electroniques/:id"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 17
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
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 2,
        "mots": 3
      },
      {
        "fichier": "client/src/pages/demarches/SuiviDossier.tsx",
        "routes": [
          "/demarches/suivi-dossier"
        ],
        "cliquables": 3,
        "parMoteur": 2,
        "sansAction": 0,
        "textes": 3,
        "mots": 7
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
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
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
      "catalogue",
      "createAgence",
      "createDossier",
      "deposerDemarche",
      "detail",
      "dossiersPourAgence",
      "mesDossiers",
      "monAgence",
      "packs",
      "payerDossier",
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
      "connecte",
      "public"
    ],
    "textes": 182,
    "mots": 626,
    "battement": "sonde",
    "manques": [
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/AlertesDemarches.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/ChangementAdresse.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/ChangementTitulaire.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/DeclarationCession.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/DuplicataDemarche.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/ImmatriculationProvisoire.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/ImportationVehicule.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/MessagerieDemarches.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/PlaquesImmatriculation.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/SignaturesElectroniques.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/SuccessionVehicule.tsx (2 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/SuiviDossier.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/VerificationIA.tsx (3 texte(s))"
      },
      {
        "genre": "ecran_sans_contenu",
        "detail": "client/src/pages/demarches/WWGarage.tsx (3 texte(s))"
      },
      {
        "genre": "bouton_declare_absent_ecran",
        "detail": "demarches_deposer déclaré pour /demarches/* mais aucun écran ne l'utilise"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/demarches/CarteGriseDemarche.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
      "audit",
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
      "identity",
      "investment",
      "payment",
      "redirection"
    ],
    "dependancesDetectees": [
      "auction_engine",
      "core",
      "identity",
      "investment",
      "payment",
      "redirection"
    ],
    "dependances": [
      "auction_engine",
      "core",
      "identity",
      "investment",
      "payment",
      "redirection"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "auction_engine": [
        "client/src/pages/comptabilite/CentrePilotage.tsx appelle trpc.auctionEngine"
      ],
      "core": [
        "routers/comptabilite.ts importe trpc.ts",
        "routers/comptabilite.ts importe db.ts",
        "routers/comptabilite.ts importe schema.ts"
      ],
      "identity": [
        "routers/comptabilite.ts exige une session Identity (procédure protégée)"
      ],
      "investment": [
        "client/src/pages/comptabilite/InvestissementAdmin.tsx appelle trpc.investment"
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
      "/comptabilite/investissement",
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
        "textes": 655,
        "mots": 1512
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
        "fichier": "client/src/pages/comptabilite/InvestissementAdmin.tsx",
        "routes": [
          "/comptabilite/investissement"
        ],
        "cliquables": 11,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 53,
        "mots": 140
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
    "textes": 1267,
    "mots": 2965,
    "battement": "sonde",
    "manques": [
      {
        "genre": "bouton_sans_action",
        "detail": "« Consommation energetique 12 450 kWh » client/src/pages/comptabilite/CentrePilotage.tsx:1010"
      },
      {
        "genre": "bouton_sans_action",
        "detail": "« Prochaines echeances 12 dossiers » client/src/pages/comptabilite/CentrePilotage.tsx:1027"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "auction_engine — client/src/pages/comptabilite/CentrePilotage.tsx appelle trpc.auctionEngine"
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
    "fichiersServeur": 10,
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
      "avis_reputation",
      "continuous_test"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/superadmin/admin-google-business"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/superadmin/AdminGoogleBusiness.tsx",
        "routes": [
          "/superadmin/admin-google-business"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 17,
        "mots": 34
      }
    ],
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
    "textes": 17,
    "mots": 34,
    "battement": "sonde",
    "manques": []
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
    "fichiersServeur": 10,
    "dependancesDeclarees": [
      "activation_audit",
      "auto_branchement",
      "boutons",
      "code_graph",
      "completion_center",
      "connecteur_google_business",
      "core",
      "estimation",
      "event_bus",
      "intelligences",
      "media_authenticity",
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
      "connecteur_google_business",
      "core",
      "estimation",
      "event_bus",
      "intelligences",
      "media_authenticity",
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
      "connecteur_google_business",
      "core",
      "estimation",
      "event_bus",
      "intelligences",
      "media_authenticity",
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
        "continuous-test/scenarios-parcours.ts importe data/boutons-sans-action.ts",
        "continuous-test/scenarios-univers.ts charge button-engine/catalogue.ts"
      ],
      "code_graph": [
        "continuous-test/impact.ts importe code-graph/service.ts",
        "continuous-test/scenarios-moteurs-centraux.ts charge code-graph/service.ts"
      ],
      "completion_center": [
        "continuous-test/scenarios-moteurs-centraux.ts charge completion/service.ts"
      ],
      "connecteur_google_business": [
        "continuous-test/scenarios-univers.ts charge connectors/google-business/service.ts"
      ],
      "core": [
        "continuous-test/helpers.ts importe db.ts",
        "continuous-test/helpers.ts importe env.ts",
        "continuous-test/index.ts importe trpc.ts"
      ],
      "estimation": [
        "continuous-test/scenarios-univers.ts charge estimation-hub/service.ts"
      ],
      "event_bus": [
        "continuous-test/catalog.ts charge event-bus/service.ts",
        "continuous-test/catalog.ts publie des événements"
      ],
      "intelligences": [
        "continuous-test/scenarios-intelligences.ts charge intelligences/provider.ts"
      ],
      "media_authenticity": [
        "continuous-test/scenarios-univers.ts charge media-authenticity/service.ts"
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
      "core",
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
        "route": "/admin/intelligences/direction",
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
    "dependants": [
      "investment",
      "notification"
    ],
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
    "ecransHotes": [
      {
        "fichier": "client/src/pages/notifications/SignaturesGlobales.tsx",
        "route": "/notifications/signatures-globales",
        "composants": [
          "trpc.contracts"
        ]
      }
    ],
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
    "etatDeclare": "staging",
    "dossiers": [],
    "routeurs": [],
    "fichiersServeur": 0,
    "dependancesDeclarees": [
      "achat",
      "core",
      "identity",
      "notification",
      "payment",
      "scheduler"
    ],
    "dependancesDetectees": [
      "achat"
    ],
    "dependances": [
      "achat",
      "core",
      "identity",
      "notification",
      "payment",
      "scheduler"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/EtatVehicule.tsx appelle trpc.reservations",
        "client/src/pages/InspectionNumerique.tsx appelle trpc.reservations",
        "client/src/pages/garage/ControleTechnique.tsx appelle trpc.devis"
      ]
    },
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
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 11,
        "mots": 57
      },
      {
        "fichier": "client/src/pages/InspectionNumerique.tsx",
        "routes": [
          "/louer/inspection"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 9,
        "mots": 39
      },
      {
        "fichier": "client/src/pages/garage/ControleTechnique.tsx",
        "routes": [
          "/garage/controle-technique"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 10,
        "mots": 63
      }
    ],
    "ecransHotes": [],
    "procedures": [],
    "tables": [],
    "acces": [],
    "textes": 30,
    "mots": 159,
    "battement": "sonde",
    "manques": [
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
    "fichiersServeur": 38,
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
      "continuous_test",
      "identity",
      "intelligences",
      "monitoring",
      "notification",
      "smart",
      "support",
      "visibility"
    ],
    "dependances": [
      "ai_learning",
      "audit",
      "continuous_test",
      "identity",
      "intelligences",
      "monitoring",
      "notification",
      "smart",
      "support",
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
      "continuous_test": [
        "client/src/pages/CentreIntelligences.tsx appelle trpc.continuousTest"
      ],
      "identity": [
        "central-engines/router.ts exige une session Identity (procédure protégée)",
        "routers/admin.ts importe modules/kyc-decision.ts",
        "routers/admin.ts importe auth.ts"
      ],
      "intelligences": [
        "client/src/pages/CentreIntelligences.tsx appelle trpc.intelligences"
      ],
      "monitoring": [
        "client/src/pages/CentreIntelligences.tsx appelle trpc.monitoringOs"
      ],
      "notification": [
        "routers/admin.ts importe modules/search-alerts.ts"
      ],
      "smart": [
        "central-engines/index.ts importe smart-engine/services/connectors.ts",
        "central-engines/index.ts importe smart-engine/services/platform-health.ts",
        "central-engines/index.ts importe smart-engine/services/alert-engine.ts"
      ],
      "support": [
        "client/src/pages/CentreIntelligences.tsx appelle trpc.supportOs"
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
      "document_engine",
      "energie_recharge",
      "estimation",
      "event_bus",
      "finance",
      "financial_intelligence",
      "frontier_os",
      "garage",
      "identity",
      "importafrica",
      "indexation",
      "intelligences",
      "investment",
      "journey",
      "knowledge",
      "language",
      "livraison",
      "livraison_vehicule",
      "location",
      "location_particulier",
      "location_pro",
      "logistics_engine",
      "marketing",
      "media",
      "media_authenticity",
      "messaging",
      "monitoring",
      "notification",
      "partner_engine",
      "parts_engine",
      "payment",
      "payment_orchestrator",
      "payout_engine",
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
      "shop_link",
      "smart",
      "smart_audit",
      "supplier_engine",
      "support",
      "transport",
      "vehicle_engine",
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
        "libelle": "Ouvrir MKA.P-MS AI (à côté du micro)",
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
      "/admin/intelligences/direction",
      "/admin/moteurs",
      "/mk-global-engine",
      "/superadmin",
      "/superadmin/core-engine-beta",
      "/superadmin/plan-maitre-fournisseurs"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/CentreIntelligences.tsx",
        "routes": [
          "/admin/intelligences/direction"
        ],
        "cliquables": 21,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 198,
        "mots": 1362
      },
      {
        "fichier": "client/src/pages/EngineRegistry/ControlCenter.tsx",
        "routes": [
          "/admin/moteurs"
        ],
        "cliquables": 12,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 78,
        "mots": 588
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
        "fichier": "client/src/pages/superadmin/PlanMaitreFournisseurs.tsx",
        "routes": [
          "/superadmin/plan-maitre-fournisseurs"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 13,
        "mots": 70
      },
      {
        "fichier": "client/src/pages/superadmin/SuperAdminDashboard.tsx",
        "routes": [
          "/superadmin"
        ],
        "cliquables": 0,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 25,
        "mots": 53
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/HomePro.tsx",
        "route": "/b2b",
        "composants": [
          "components/FooterPro.tsx"
        ]
      },
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
        "fichier": "client/src/pages/PubliciteDetail.tsx",
        "route": "/publicite/:id",
        "composants": [
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/ComptaDirigeant.tsx",
        "route": "/compta-dirigeant",
        "composants": [
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/JournalActivite.tsx",
        "route": "/journal-activite",
        "composants": [
          "trpc.admin"
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
        "fichier": "client/src/pages/superadmin/AdminModerationAnnonces.tsx",
        "route": "/superadmin/admin-moderation-annonces",
        "composants": [
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminPaiements.tsx",
        "route": "/superadmin/admin-paiements",
        "composants": [
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminSecurite.tsx",
        "route": "/superadmin/admin-securite",
        "composants": [
          "trpc.admin"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminUtilisateurs.tsx",
        "route": "/superadmin/admin-utilisateurs",
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
        "fichier": "client/src/pages/superadmin/GestionEmployesMKAPMS.tsx",
        "route": "/superadmin/gestion-employes-m-k-a-p-m-s",
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
      "assignStaffPosition",
      "auditLog",
      "certifyVehicle",
      "communications",
      "contactUser",
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
      "paymentsStats",
      "promoList",
      "pubRequestDetail",
      "pubRequestsList",
      "reactivateUser",
      "relancerPaiement",
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
      "suspendUser",
      "ticketsList",
      "update",
      "updateCountry",
      "updateHealth",
      "updateProgress",
      "updatePromo",
      "updateRule",
      "updateShipmentStatus",
      "updateSupplier",
      "updateUserProfile",
      "upload",
      "usersList",
      "usersStats",
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
      "badge_attributions",
      "badges",
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
      "objectifs_plateforme",
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
      "rental_contracts",
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
      "vehicules",
      "waitlist_entries"
    ],
    "acces": [
      "admin",
      "connecte",
      "direction",
      "pdg",
      "public"
    ],
    "textes": 571,
    "mots": 2938,
    "battement": "contrat",
    "manques": [
      {
        "genre": "bouton_declare_absent_ecran",
        "detail": "accueil_intelligences_ouvrir déclaré pour / mais aucun écran ne l'utilise"
      },
      {
        "genre": "bouton_declare_absent_ecran",
        "detail": "accueil_livraison_vehicule déclaré pour / mais aucun écran ne l'utilise"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "continuous_test — client/src/pages/CentreIntelligences.tsx appelle trpc.continuousTest"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "intelligences — client/src/pages/CentreIntelligences.tsx appelle trpc.intelligences"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "monitoring — client/src/pages/CentreIntelligences.tsx appelle trpc.monitoringOs"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "notification — routers/admin.ts importe modules/search-alerts.ts"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "support — client/src/pages/CentreIntelligences.tsx appelle trpc.supportOs"
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
      "boutons",
      "core",
      "identity"
    ],
    "dependances": [
      "boutons",
      "core",
      "identity"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "boutons": [
        "client/src/pages/superadmin/AdminCarteMoniale.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/superadmin/AdminCarteMoniale.tsx utilise BoutonMoteur"
      ],
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
      "command_center",
      "connaissance_auto",
      "document",
      "energie_recharge",
      "garage",
      "identity",
      "importafrica",
      "intelligences",
      "investment",
      "knowledge",
      "language",
      "livraison",
      "livraison_vehicule",
      "location",
      "location_particulier",
      "location_pro",
      "logistics_engine",
      "marketing",
      "partner_engine",
      "parts_engine",
      "payment",
      "payment_orchestrator",
      "politique_pays",
      "pro_account",
      "pro_portal",
      "product_engine",
      "proximity_engine",
      "rd_lab",
      "resilience",
      "risque_import",
      "search",
      "seo",
      "smart",
      "supplier_engine",
      "vehicle_engine",
      "vente",
      "vente_pro",
      "vo_engine",
      "vo_espaces"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "admin_pays_activite",
        "libelle": "Utilisateurs et annonces du pays",
        "genre": "formulaire",
        "ecran": "/superadmin/admin-carte-moniale",
        "fichier": "client/src/pages/superadmin/AdminCarteMoniale.tsx",
        "ligne": 26
      }
    ],
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
        "cliquables": 7,
        "parMoteur": 1,
        "sansAction": 0,
        "textes": 15,
        "mots": 71
      }
    ],
    "ecransHotes": [
      {
        "fichier": "client/src/pages/HomePro.tsx",
        "route": "/b2b",
        "composants": [
          "lib/currency.tsx"
        ]
      },
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
        "fichier": "client/src/pages/EstimationAuto.tsx",
        "route": "/acheter/estimation",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/EspaceProVente.tsx",
        "route": "/acheter/espace-pro",
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
        "fichier": "client/src/pages/Livraison.tsx",
        "route": "/livraison",
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
        "fichier": "client/src/pages/DemandePublicite.tsx",
        "route": "/demande-publicite",
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
      },
      {
        "fichier": "client/src/pages/RechercheGeolocalisee.tsx",
        "route": "/recherche",
        "composants": [
          "lib/currency.tsx"
        ]
      },
      {
        "fichier": "client/src/pages/garage/PriseRendezVous.tsx",
        "route": "/garage/prise-rendez-vous",
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
      "isEligible",
      "list",
      "meta",
      "rates",
      "upsert"
    ],
    "tables": [
      "country_countries",
      "country_currencies",
      "country_google_capabilities",
      "country_health_log"
    ],
    "acces": [
      "admin",
      "pdg",
      "public"
    ],
    "textes": 98,
    "mots": 339,
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
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "boutons — client/src/pages/superadmin/AdminCarteMoniale.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
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
      "payment"
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
      "payment"
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
      "garage",
      "identity"
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
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 22,
        "mots": 85
      },
      {
        "fichier": "client/src/pages/Depannage.tsx",
        "routes": [
          "/depannage"
        ],
        "cliquables": 12,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 71,
        "mots": 354
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
      },
      {
        "fichier": "client/src/pages/utilisateurs/HistoriqueDepannages.tsx",
        "route": "/utilisateurs/historique-depannages",
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
    "textes": 103,
    "mots": 462,
    "battement": "sonde",
    "manques": []
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
      "boutons",
      "core",
      "country",
      "identity",
      "language"
    ],
    "dependances": [
      "boutons",
      "core",
      "country",
      "identity",
      "language"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "boutons": [
        "client/src/pages/CatalogueTechnique.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/CatalogueTechnique.tsx utilise BoutonMoteur",
        "client/src/pages/superadmin/AdminValidationDocs.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      ],
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
      "cartegrise",
      "contract",
      "document_engine",
      "finance",
      "frontier_os",
      "importafrica",
      "intelligences",
      "vo_espaces"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [
      {
        "code": "admin_kyc_refuser",
        "libelle": "Refuser",
        "genre": "formulaire",
        "ecran": "/superadmin/admin-validation-docs",
        "fichier": "client/src/pages/superadmin/AdminValidationDocs.tsx",
        "ligne": 155
      },
      {
        "code": "admin_kyc_valider",
        "libelle": "Valider",
        "genre": "formulaire",
        "ecran": "/superadmin/admin-validation-docs",
        "fichier": "client/src/pages/superadmin/AdminValidationDocs.tsx",
        "ligne": 148
      },
      {
        "code": "catalogue_technique_commander_piece",
        "libelle": "Commander la pièce dans l'univers Pièces",
        "genre": "navigation",
        "ecran": "/catalogue-technique",
        "fichier": "client/src/pages/CatalogueTechnique.tsx",
        "ligne": 1646
      },
      {
        "code": "catalogue_technique_commander_piece",
        "libelle": "Commander la pièce dans l'univers Pièces",
        "genre": "navigation",
        "ecran": "/catalogue-technique",
        "fichier": "client/src/pages/CatalogueTechnique.tsx",
        "ligne": 1843
      },
      {
        "code": "catalogue_technique_imprimer_couples",
        "libelle": "Imprimer les couples de serrage",
        "genre": "document",
        "ecran": "/catalogue-technique",
        "fichier": "client/src/pages/CatalogueTechnique.tsx",
        "ligne": 1445
      },
      {
        "code": "catalogue_technique_imprimer_couples",
        "libelle": "Imprimer les couples de serrage",
        "genre": "document",
        "ecran": "/catalogue-technique",
        "fichier": "client/src/pages/CatalogueTechnique.tsx",
        "ligne": 1764
      },
      {
        "code": "catalogue_technique_rechercher",
        "libelle": "Identifier le véhicule (plaque / VIN)",
        "genre": "formulaire",
        "ecran": "/catalogue-technique",
        "fichier": "client/src/pages/CatalogueTechnique.tsx",
        "ligne": 1354
      }
    ],
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
        "fichier": "client/src/pages/Cata…60278 tokens truncated…  ],
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
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "country — product-engine/service.ts importe country-os/index.ts"
      }
    ]
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
    "dependants": [],
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
        "cliquables": 5,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 31,
        "mots": 202
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
    "textes": 38,
    "mots": 244,
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
        "redirection-engine/service.ts importe smart-engine/services/activity-log.ts",
        "redirection-engine/service.ts charge smart-engine/services/auto-fix.ts"
      ]
    },
    "dependants": [
      "achat",
      "activation_audit",
      "analytics",
      "auto_branchement",
      "boutons",
      "comptabilite",
      "continuous_test",
      "location",
      "pieces",
      "resilience",
      "seo",
      "smart"
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
        "fichier": "client/src/pages/PiecesProduit.tsx",
        "route": "/pieces/produit/:id",
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
      "estimation",
      "intelligences"
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
      "frontier_os",
      "garage",
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
      "achat",
      "avis_reputation",
      "core",
      "country",
      "identity",
      "permission"
    ],
    "dependances": [
      "achat",
      "avis_reputation",
      "core",
      "country",
      "identity",
      "permission"
    ],
    "integrationsTechniques": [
      "identity",
      "permission"
    ],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/RechercheGeolocalisee.tsx appelle trpc.annonces"
      ],
      "avis_reputation": [
        "search-os/index.ts importe reputation-engine/ranking.ts"
      ],
      "core": [
        "search-os/index.ts importe db.ts",
        "search-os/index.ts importe schema.ts",
        "search-os/index.ts importe trpc.ts"
      ],
      "country": [
        "client/src/pages/RechercheGeolocalisee.tsx embarque lib/currency.tsx (trpc.currency)"
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
      "achat",
      "identity",
      "vente"
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
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 27,
        "mots": 151
      },
      {
        "fichier": "client/src/pages/RechercheUniverselle.tsx",
        "routes": [
          "/recherche-universelle"
        ],
        "cliquables": 11,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 119,
        "mots": 504
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
        "fichier": "client/src/pages/vente/CentreAlertesRecherche.tsx",
        "route": "/vente/alertes-recherche",
        "composants": [
          "trpc.searches"
        ]
      },
      {
        "fichier": "client/src/pages/Compte.tsx",
        "route": "/compte/*",
        "composants": [
          "trpc.searches"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/CentreAlertesUtilisateur.tsx",
        "route": "/utilisateurs/centre-alertes-utilisateur",
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
    "textes": 199,
    "mots": 944,
    "battement": "pont_os",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "achat — client/src/pages/RechercheGeolocalisee.tsx appelle trpc.annonces"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "country — client/src/pages/RechercheGeolocalisee.tsx embarque lib/currency.tsx (trpc.currency)"
      }
    ]
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
    "manques": []
  },
  {
    "moteur": "shop_link",
    "label": "Moteur intermédiaire Boutique",
    "categorie": "transversal",
    "etatDeclare": "active",
    "dossiers": [
      "shop-link"
    ],
    "routeurs": [
      "shopLink"
    ],
    "fichiersServeur": 9,
    "dependancesDeclarees": [
      "core",
      "identity",
      "intelligences"
    ],
    "dependancesDetectees": [
      "core",
      "identity",
      "intelligences"
    ],
    "dependances": [
      "core",
      "identity",
      "intelligences"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "shop-link/boite.ts importe db.ts",
        "shop-link/entrant.ts importe db.ts",
        "shop-link/index.ts importe db.ts"
      ],
      "identity": [
        "shop-link/index.ts importe identity-os/contract.ts",
        "shop-link/index.ts exige une session Identity (procédure protégée)"
      ],
      "intelligences": [
        "shop-link/boite.ts importe intelligences/connaissance.ts",
        "shop-link/boite.ts importe intelligences/schema.ts",
        "shop-link/index.ts importe intelligences/boutique.ts"
      ]
    },
    "dependants": [
      "frontier_os",
      "intelligences"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/admin/boutique-cable"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/intelligence/modules/CableBoutique.tsx",
        "routes": [
          "/admin/boutique-cable"
        ],
        "cliquables": 11,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 40,
        "mots": 238
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "boite",
      "cles",
      "controlCenterFeed",
      "creerSortant",
      "creerSortantDepuisConnaissance",
      "dashboard",
      "decider",
      "enregistrerCle",
      "etat",
      "healthStatus",
      "journal",
      "meta",
      "regler",
      "revoquerCle",
      "tester",
      "toutCouper"
    ],
    "tables": [
      "shop_link_cables",
      "shop_link_cles",
      "shop_link_documents",
      "shop_link_etat_boutique",
      "shop_link_ia_boite",
      "shop_link_journal",
      "shop_link_rejeu"
    ],
    "acces": [
      "pdg",
      "public"
    ],
    "textes": 40,
    "mots": 238,
    "battement": "pont_os",
    "manques": []
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
      "boutons",
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
    "dependancesDetectees": [
      "avis_reputation",
      "boutons",
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
      "boutons",
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
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "avis_reputation": [
        "smart-engine/services/alert-engine.ts importe reputation-engine/trends.ts",
        "smart-engine/services/review-analysis.ts importe modules/reviews.ts",
        "smart-engine/services/review-analysis.ts importe reputation-engine/trends.ts"
      ],
      "boutons": [
        "smart-engine/services/health-monitor.ts importe data/boutons-sans-action.ts",
        "consomme bouton.sans_action émis par boutons"
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
      "accounting_internal",
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
      "document_engine",
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
      "product_engine",
      "rd_lab",
      "redirection",
      "resilience",
      "risque_import",
      "seo",
      "smart_audit",
      "support",
      "vehicle_engine",
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
      "document.requirement.blocked",
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
      },
      {
        "eventType": "document.requirement.blocked",
        "handler": "smart_document_requirement_blocked"
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
        "cliquables": 60,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 277,
        "mots": 1448
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
      },
      {
        "fichier": "client/src/pages/HistoriqueConsultations.tsx",
        "route": "/historique-consultations",
        "composants": [
          "trpc.smartEngine"
        ]
      },
      {
        "fichier": "client/src/pages/ComptaDirigeant.tsx",
        "route": "/compta-dirigeant",
        "composants": [
          "trpc.smartEngine"
        ]
      },
      {
        "fichier": "client/src/pages/superadmin/AdminFraude.tsx",
        "route": "/superadmin/admin-fraude",
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
      "validateAllActivityDecisions",
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
    "textes": 338,
    "mots": 1723,
    "battement": "contrat",
    "manques": []
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
      "command_center"
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
    "moteur": "supplier_engine",
    "label": "Supplier Engine",
    "categorie": "transversal",
    "etatDeclare": "staging",
    "dossiers": [
      "supplier-engine",
      "routers/supplier-portal.ts"
    ],
    "routeurs": [
      "supplierEngine",
      "supplierPortal"
    ],
    "fichiersServeur": 6,
    "dependancesDeclarees": [
      "core",
      "country",
      "identity",
      "partner_engine"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "identity",
      "workflow"
    ],
    "dependances": [
      "core",
      "country",
      "identity",
      "partner_engine",
      "workflow"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "routers/supplier-portal.ts importe trpc.ts",
        "routers/supplier-portal.ts importe db.ts",
        "supplier-engine/access.ts importe db.ts"
      ],
      "country": [
        "supplier-engine/service.ts importe country-os/index.ts",
        "supplier-engine/service.ts lit la règle pays"
      ],
      "identity": [
        "routers/supplier-portal.ts exige une session Identity (procédure protégée)",
        "supplier-engine/index.ts exige une session Identity (procédure protégée)",
        "supplier-engine/service.ts importe identity-os/contract.ts"
      ],
      "workflow": [
        "routers/supplier-portal.ts importe modules/operations.ts",
        "supplier-engine/access.ts importe modules/operations.ts",
        "supplier-engine/service.ts importe modules/operations.ts"
      ]
    },
    "dependants": [
      "document_engine",
      "logistics_engine",
      "parts_engine",
      "payout_engine",
      "vehicle_engine"
    ],
    "evenementsPublies": [],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [],
    "boutons": [],
    "routes": [
      "/espace-fournisseur",
      "/espace-transporteur"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/EspaceFournisseur.tsx",
        "routes": [
          "/espace-fournisseur"
        ],
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 14,
        "mots": 39
      },
      {
        "fichier": "client/src/pages/EspaceTransporteur.tsx",
        "routes": [
          "/espace-transporteur"
        ],
        "cliquables": 1,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 5,
        "mots": 47
      }
    ],
    "ecransHotes": [],
    "procedures": [
      "activer",
      "ajouterContact",
      "auditLog",
      "avancerEtape",
      "connectionMethods",
      "controlCenterFeed",
      "creer",
      "dashboard",
      "definirMapping",
      "definirTerritoires",
      "desactiver",
      "detail",
      "enregistrerConnexion",
      "enregistrerContratSigne",
      "grantCarrier",
      "grantSupplier",
      "healthStatus",
      "liste",
      "meta",
      "reactiver",
      "revoquer",
      "suspendre",
      "testerConnexion",
      "validerParDirection",
      "verifierEntreprise"
    ],
    "tables": [
      "supplier_audit_log",
      "supplier_carrier_accounts",
      "supplier_connections",
      "supplier_contacts",
      "supplier_health_log",
      "supplier_mappings",
      "supplier_onboarding_steps",
      "supplier_profiles"
    ],
    "acces": [
      "admin",
      "direction",
      "pdg",
      "public"
    ],
    "textes": 19,
    "mots": 86,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "workflow — routers/supplier-portal.ts importe modules/operations.ts"
      },
      {
        "genre": "dependance_sans_preuve",
        "detail": "partner_engine"
      }
    ]
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
      "core",
      "garage",
      "identity",
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
        "cliquables": 3,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 34
      },
      {
        "fichier": "client/src/pages/superadmin/AdminSupport.tsx",
        "routes": [
          "/superadmin/admin-support"
        ],
        "cliquables": 4,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 8,
        "mots": 24
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
        "route": "/admin/intelligences/direction",
        "composants": [
          "trpc.supportOs"
        ]
      },
      {
        "fichier": "client/src/pages/utilisateurs/CentreSupportUtilisateur.tsx",
        "route": "/utilisateurs/centre-support-utilisateur",
        "composants": [
          "trpc.support"
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
    "textes": 41,
    "mots": 201,
    "battement": "pont_os",
    "manques": []
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
    "moteur": "vehicle_engine",
    "label": "Vehicle Engine",
    "categorie": "transversal",
    "etatDeclare": "staging",
    "dossiers": [
      "vehicle-engine"
    ],
    "routeurs": [
      "vehicleEngine"
    ],
    "fichiersServeur": 4,
    "dependancesDeclarees": [
      "core",
      "country",
      "event_bus",
      "supplier_engine"
    ],
    "dependancesDetectees": [
      "core",
      "country",
      "event_bus",
      "identity",
      "payout_engine",
      "politique_pays",
      "smart",
      "supplier_engine"
    ],
    "dependances": [
      "core",
      "country",
      "event_bus",
      "identity",
      "payout_engine",
      "politique_pays",
      "smart",
      "supplier_engine"
    ],
    "integrationsTechniques": [
      "identity"
    ],
    "preuvesDependances": {
      "core": [
        "vehicle-engine/index.ts importe trpc.ts",
        "vehicle-engine/service.ts importe db.ts",
        "vehicle-engine/service.ts importe schema.ts"
      ],
      "country": [
        "vehicle-engine/service.ts importe country-os/index.ts",
        "vehicle-engine/service.ts lit la règle pays"
      ],
      "event_bus": [
        "vehicle-engine/service.ts importe event-bus/service.ts",
        "vehicle-engine/service.ts publie des événements"
      ],
      "identity": [
        "vehicle-engine/service.ts importe identity-os/contract.ts"
      ],
      "payout_engine": [
        "publie vehicule.vendu, consommé par payout_engine"
      ],
      "politique_pays": [
        "vehicle-engine/service.ts importe country-policy/service.ts"
      ],
      "smart": [
        "vehicle-engine/service.ts importe smart-engine/services/duplicate-detection.ts"
      ],
      "supplier_engine": [
        "vehicle-engine/contract.ts importe supplier-engine/contract.ts",
        "vehicle-engine/service.ts importe supplier-engine/service.ts"
      ]
    },
    "dependants": [
      "document_engine",
      "event_bus",
      "logistics_engine",
      "payout_engine"
    ],
    "evenementsPublies": [
      "vehicule.controle_qualite",
      "vehicule.doublon_detecte",
      "vehicule.erreur_sync",
      "vehicule.importe",
      "vehicule.indisponible",
      "vehicule.mappe",
      "vehicule.pret_a_publier",
      "vehicule.prix_calcule",
      "vehicule.publie",
      "vehicule.reserve",
      "vehicule.retire",
      "vehicule.territoires_definis",
      "vehicule.vendu"
    ],
    "evenementsConsommes": [],
    "abonnements": [],
    "sourcesEmission": [
      "vehicle_engine"
    ],
    "boutons": [],
    "routes": [],
    "ecrans": [],
    "ecransHotes": [],
    "procedures": [
      "ajouterRapportEtat",
      "analyserDonnees",
      "analyserIA",
      "assurerDisponibilite",
      "auditLog",
      "calculerPrix",
      "controlCenterFeed",
      "controlerQualite",
      "dashboard",
      "deciderDoublon",
      "definirTerritoires",
      "detail",
      "detecterDoublons",
      "healthStatus",
      "ingerer",
      "libererReservation",
      "liste",
      "mapperEtNormaliser",
      "marquerVendu",
      "meta",
      "preparerPourPublication",
      "reserver",
      "retirer",
      "signalerErreurSync",
      "signalerIndisponibilite",
      "synchroniser",
      "validerEtPublier"
    ],
    "tables": [
      "vehicle_audit_log",
      "vehicle_availability",
      "vehicle_condition_reports",
      "vehicle_duplicates",
      "vehicle_health_log",
      "vehicle_items",
      "vehicle_pricing",
      "vehicle_publication_log",
      "vehicle_quality_checks",
      "vehicle_territories"
    ],
    "acces": [
      "admin",
      "direction",
      "public"
    ],
    "textes": 0,
    "mots": 0,
    "battement": "sonde",
    "manques": [
      {
        "genre": "dependance_non_declaree",
        "detail": "identity — vehicle-engine/service.ts importe identity-os/contract.ts"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "payout_engine — publie vehicule.vendu, consommé par payout_engine"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "politique_pays — vehicle-engine/service.ts importe country-policy/service.ts"
      },
      {
        "genre": "dependance_non_declaree",
        "detail": "smart — vehicle-engine/service.ts importe smart-engine/services/duplicate-detection.ts"
      },
      {
        "genre": "sans_ecran",
        "detail": "aucune route client ne mène à ce moteur"
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
      "boutons",
      "core",
      "country",
      "garage",
      "livraison_vehicule",
      "messaging",
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
      "garage",
      "identity",
      "livraison_vehicule",
      "messaging",
      "notification",
      "payment",
      "pro_portal",
      "search",
      "smart",
      "vo_espaces"
    ],
    "dependances": [
      "achat",
      "boutons",
      "core",
      "country",
      "garage",
      "identity",
      "livraison_vehicule",
      "messaging",
      "notification",
      "payment",
      "permission",
      "pro_portal",
      "search",
      "smart",
      "vo_espaces"
    ],
    "integrationsTechniques": [],
    "preuvesDependances": {
      "achat": [
        "client/src/pages/DossierClient.tsx appelle trpc.reservations",
        "client/src/pages/DossierClient.tsx appelle trpc.annonces",
        "client/src/pages/DossierClient.tsx appelle trpc.devis"
      ],
      "boutons": [
        "client/src/pages/LivraisonVehicule.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)",
        "client/src/pages/LivraisonVehicule.tsx utilise BoutonMoteur",
        "client/src/pages/TableauBordProVente.tsx embarque lib/boutonMoteur.tsx (trpc.buttonEngine)"
      ],
      "core": [
        "client/src/pages/superadmin/AdminVente.tsx appelle trpc.admin"
      ],
      "country": [
        "client/src/pages/Abonnements.tsx embarque lib/currency.tsx (trpc.currency)",
        "client/src/pages/Vendre.tsx embarque lib/currency.tsx (trpc.currency)"
      ],
      "garage": [
        "client/src/pages/DossierClient.tsx appelle trpc.garages"
      ],
      "identity": [
        "client/src/pages/vente/CentreEssaiRoutier.tsx appelle trpc.kyc"
      ],
      "livraison_vehicule": [
        "client/src/pages/LivraisonVehicule.tsx appelle trpc.livraisonVehicule"
      ],
      "messaging": [
        "client/src/pages/DossierClient.tsx appelle trpc.messages",
        "client/src/pages/vente/CentreNegociation.tsx appelle trpc.messages"
      ],
      "notification": [
        "client/src/pages/TableauBordProVente.tsx appelle trpc.notifications"
      ],
      "payment": [
        "client/src/pages/Abonnements.tsx appelle trpc.abonnements"
      ],
      "pro_portal": [
        "client/src/pages/vente/CentreFournisseurs.tsx appelle trpc.pro",
        "client/src/pages/vente/DroitsAcces.tsx appelle trpc.pro",
        "client/src/pages/vente/GestionEmployes.tsx appelle trpc.pro"
      ],
      "search": [
        "client/src/pages/vente/CentreAlertesRecherche.tsx appelle trpc.searches"
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
        "ligne": 313
      },
      {
        "code": "livraison_vehicule_choisir_mode",
        "libelle": "Choisir un mode d'acheminement",
        "genre": "formulaire",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 195
      },
      {
        "code": "livraison_vehicule_connexion",
        "libelle": "Se connecter pour commander ou suivre",
        "genre": "navigation",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 309
      },
      {
        "code": "livraison_vehicule_connexion",
        "libelle": "Se connecter pour commander ou suivre",
        "genre": "navigation",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 354
      },
      {
        "code": "livraison_vehicule_onglet_devis",
        "libelle": "Onglet Devis",
        "genre": "formulaire",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 130
      },
      {
        "code": "livraison_vehicule_onglet_suivi",
        "libelle": "Onglet Suivi",
        "genre": "formulaire",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 131
      },
      {
        "code": "livraison_vehicule_retour",
        "libelle": "Retour à l'accueil",
        "genre": "navigation",
        "ecran": "/vente/livraison",
        "fichier": "client/src/pages/LivraisonVehicule.tsx",
        "ligne": 112
      },
      {
        "code": "vente_alerte_activer",
        "libelle": "Activer / désactiver",
        "genre": "formulaire",
        "ecran": "/vente/alertes-recherche",
        "fichier": "client/src/pages/vente/CentreAlertesRecherche.tsx",
        "ligne": 32
      },
      {
        "code": "vente_alerte_creer",
        "libelle": "Créer l’alerte",
        "genre": "formulaire",
        "ecran": "/vente/alertes-recherche",
        "fichier": "client/src/pages/vente/CentreAlertesRecherche.tsx",
        "ligne": 38
      },
      {
        "code": "vente_pro_factures",
        "libelle": "Factures",
        "genre": "navigation",
        "ecran": "/vente",
        "fichier": "",
        "ligne": 0
      },
      {
        "code": "vente_pro_profil",
        "libelle": "Mon profil professionnel",
        "genre": "navigation",
        "ecran": "/vente",
        "fichier": "client/src/pages/TableauBordProVente.tsx",
        "ligne": 107
      },
      {
        "code": "vente_pro_resume_vendeur",
        "libelle": "Résumé vendeur",
        "genre": "navigation",
        "ecran": "/vente",
        "fichier": "",
        "ligne": 0
      }
    ],
    "routes": [
      "/depot-annonce",
      "/depot-annonce/analyse-i-a",
      "/depot-annonce/conseils-i-a",
      "/depot-annonce/description-annonce",
      "/depot-annonce/documents-annonce",
      "/depot-annonce/expiration-annonce/:id",
      "/depot-annonce/identification-vehicule",
      "/depot-annonce/informations-principales",
      "/depot-annonce/modification-annonce/:id",
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
      "/vente/droits/:id",
      "/vente/employes",
      "/vente/essai/:id",
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
      "/vente/negociation/:id",
      "/vente/objectifs",
      "/vente/performances",
      "/vente/photos/:id",
      "/vente/publicites",
      "/vente/qualite",
      "/vente/rapports",
      "/vente/recommandations",
      "/vente/reparations",
      "/vente/reservation-achat",
      "/vente/reservations",
      "/vente/retour-client/:id",
      "/vente/securite",
      "/vente/statistiques",
      "/vente/stock",
      "/vente/visite/:id",
      "/vente/workflow/:id?"
    ],
    "ecrans": [
      {
        "fichier": "client/src/pages/Abonnements.tsx",
        "routes": [
          "/vente/abonnements"
        ],
        "cliquables": 7,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 41,
        "mots": 238
      },
      {
        "fichier": "client/src/pages/DossierClient.tsx",
        "routes": [
          "/dossier-client"
        ],
        "cliquables": 18,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 67,
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
        "textes": 58,
        "mots": 317
      },
      {
        "fichier": "client/src/pages/TableauBordProVente.tsx",
        "routes": [
          "/vente"
        ],
        "cliquables": 7,
        "parMoteur": 2,
        "sansAction": 0,
        "textes": 21,
        "mots": 70
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
        "mots": 982
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
        "mots": 15
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
        "mots": 47
      },
      {
        "fichier": "client/src/pages/depot-annonce/ExpirationAnnonce.tsx",
        "routes": [
          "/depot-annonce/expiration-annonce/:id"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 3,
        "mots": 6
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
          "/depot-annonce/modification-annonce/:id"
        ],
        "cliquables": 2,
        "parMoteur": 0,
        "sansAction": 0,
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
    "textes": 980,
    "mots": 3544,
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
        "cliquables": 8,
        "parMoteur": 0,
        "sansAction": 0,
        "textes": 46,
        "mots": 233
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
    "textes": 77,
    "mots": 333,
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
