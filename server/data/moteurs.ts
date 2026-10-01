Warning: truncated output (original token count: 157715)
Total output lines: 24834

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
export const MANQUES_TOTAL = 518;
export const MANQUES_PAR_GENRE: Readonly<Record<string, number>> = {
  "dependance_non_declaree": 59,
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
      …107715 tokens truncated…ivraison_vehicule.validation_requise",
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
        "textes": 42,
        "mots": 240
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
        "textes": 45,
        "mots": 224
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
    "textes": 968,
    "mots": 3453,
    "battement": "sonde",
    "manques": [
      {
        "genre": "destination_inconnue",
        "detail": "/contact?sujet=Conseil%20abonnement client/src/pages/Abonnements.tsx:512"
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
        "textes": 23,
        "mots": 93
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
    "textes": 54,
    "mots": 193,
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
        "ligne": 28
      },
      {
        "code": "admin_employe_enregistrer",
        "libelle": "Créer le compte",
        "genre": "formulaire",
        "ecran": "/superadmin/gestion-employes-m-k-a-p-m-s",
        "fichier": "client/src/pages/superadmin/GestionEmployesMKAPMS.tsx",
        "ligne": 38
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
        "textes": 15,
        "mots": 51
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
    "textes": 246,
    "mots": 768,
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
