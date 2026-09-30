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
export const MANQUES_TOTAL = 515;
export const MANQUES_PAR_GENRE: Readonly<Record<string, number>> = {
  "ecran_sans_contenu": 341,
  "dependance_non_declaree": 57,
  "sans_logique_serveur": 10,
  "sans_ecran": 8,
  "dependance_sans_preuve": 41,
  "bouton_sans_action": 50,
  "bouton_declare_absent_ecran": 6,
  "emission_dynamique": 2
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
        "ecran":