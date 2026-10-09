/**
 * Inventaire des moteurs de la Boutique (dépôt mkapms-shop).
 *
 * Fichier GÉNÉRÉ par scripts/gen-frontier-inventaire.ts — ne pas éditer à la main.
 * Relevé en lecture seule, daté et lié à un commit exact (voir `source`).
 */
import type { InventaireBoutique } from "./types.js";

export const INVENTAIRE_BOUTIQUE: InventaireBoutique = {
 "source": {
  "depot": "projet-Auto-plus-Africa-MKAPMS/mkapms-shop",
  "commit": "c82fc74a30fa95d89c27115fc788c1fa09dbab6c",
  "dateCommit": "2026-10-09T07:56:10+02:00",
  "genereLe": "2026-10-09",
  "fichiersLus": [
   "server/shop-intelligent-system.mjs",
   "server/engine-runtime.mjs",
   "server/gap-inventory.json",
   "migrations/0057_shop_preparation_readiness.sql",
   "server/service-access.mjs",
   "migrations/0077_stock_engine_preparation.sql",
   "server/stock-engine-policy.mjs",
   "server/stock-engines.mjs",
   "server/*.mjs (86 fichiers, routes)",
   "tests/ (98 fichiers)",
   "migrations/ (77 fichiers)"
  ]
 },
 "stock": {
  "migration": "migrations/0077_stock_engine_preparation.sql:2",
  "modeles": [
   {
    "type": "MKA_OWN",
    "libelle": "Stock propre MKA.P-MS",
    "role": "internal"
   },
   {
    "type": "PRO",
    "libelle": "Professionnels",
    "role": "seller"
   },
   {
    "type": "MANUFACTURER",
    "libelle": "Fabricants",
    "role": "manufacturer"
   },
   {
    "type": "INDIVIDUAL",
    "libelle": "Particuliers",
    "role": "seller"
   },
   {
    "type": "WHOLESALER",
    "libelle": "Grossistes",
    "role": "seller"
   },
   {
    "type": "DISTRIBUTOR",
    "libelle": "Distributeurs",
    "role": "seller"
   },
   {
    "type": "SUPPLIER",
    "libelle": "Fournisseurs",
    "role": "supplier"
   },
   {
    "type": "DROPSHIPPER",
    "libelle": "Fournisseurs dropshipping",
    "role": "supplier"
   },
   {
    "type": "FULFILLMENT",
    "libelle": "Entrepôts et opérateurs logistiques",
    "role": "operator"
   },
   {
    "type": "OTHER",
    "libelle": "Autres types de comptes",
    "role": "custom"
   }
  ],
  "canaux": [
   {
    "id": "INTERNAL",
    "libelle": "MKA.P-MS",
    "statut": "PREPARED",
    "apiValidee": null
   },
   {
    "id": "AMAZON_SELLER",
    "libelle": "Amazon · stock vendeur",
    "statut": "PREPARED",
    "apiValidee": null
   },
   {
    "id": "AMAZON_FBA",
    "libelle": "Amazon · stock logistique FBA",
    "statut": "PREPARED",
    "apiValidee": null
   },
   {
    "id": "ALIBABA",
    "libelle": "Alibaba · fournisseur B2B",
    "statut": "PREPARED",
    "apiValidee": false
   },
   {
    "id": "SHOPIFY",
    "libelle": "Shopify · article et emplacement",
    "statut": "PREPARED",
    "apiValidee": null
   },
   {
    "id": "SUPPLIER_FEED",
    "libelle": "Flux fournisseur existant",
    "statut": "PREPARED",
    "apiValidee": null
   },
   {
    "id": "OTHER",
    "libelle": "Autre canal à préciser",
    "statut": "PREPARED",
    "apiValidee": null
   }
  ],
  "comptePropre": {
   "type": "MKA_OWN",
   "reference": "mkapms-shop-own",
   "nom": "Stock propre MKA.P-MS SHOP",
   "canal": "INTERNAL"
  },
  "desactiveParLaBase": true,
  "moteurs": [
   {
    "niveauDeclare": "PREPARED (désactivé)",
    "domaine": "stock propre",
    "tables": [
     "shop_inventory.owners",
     "shop_inventory.engines",
     "shop_inventory.locations",
     "shop_inventory.items",
     "shop_inventory.levels",
     "shop_inventory.connection_slots",
     "shop_inventory.engine_blueprints"
    ],
    "tests": [
     "tests/stock-engines.integration.mjs",
     "tests/stock-engines.test.mjs",
     "tests/browser/stock-engines.spec.mjs"
    ],
    "entrees": [
     "/api/stock-engines",
     "/api/stock-engines/accounts",
     "/api/stock-engines/accounts/x",
     "/api/stock-engines/accounts/x/observations/prepare"
    ],
    "entreesTrouvees": 4,
    "serviceExecution": "mkapms-shop · serveur Express (server/app.mjs) · routes /api/stock-engines/* (page privée Fondateur #/stocks)",
    "id": "stock.mka_own.inventory",
    "nom": "Moteur de stock propre MKA.P-MS SHOP",
    "fonction": "Stock propre de la Boutique (compte « Stock propre MKA.P-MS SHOP », canal INTERNAL) : prépare des observations de quantités sourcées (en stock, engagé, réservé, endommagé, quarantaine, sécurité, contrôle qualité, entrant) et calcule le disponible projeté — deux modules distincts : commande (prépare une observation sourcée) et vérification (contrôle indépendant du propriétaire, du moteur et de la cohérence des quantités). Il ne remplace ni ne modifie le moteur « inventory » du registre.",
    "code": [
     "migrations/0077_stock_engine_preparation.sql:68",
     "server/stock-engines.mjs:15",
     "server/stock-engine-policy.mjs:29",
     "server/app.mjs:213",
     "server/stock-engine-policy.mjs:36",
     "docs/SHOP-STOCK-ENGINES-2026-10-09.md"
    ],
    "dependances": [
     "stock.mka_own.intermediary"
    ],
    "etat": "teste",
    "preuve": "tests",
    "declareSeulement": false,
    "intermediairePrevu": "stock.mka_own.intermediary",
    "connexionsExistantes": [
     "compte « stock propre » posé par la migration 0077 ; tableau de bord réservé au Fondateur (#/stocks)"
    ],
    "connexionsAConstruire": [
     "aucune ligne vers la plateforme principale n'est prévue par la Boutique pour ce moteur : à décider avec le PDG avant toute connexion",
     "quantités réelles à raccorder (étape ultérieure annoncée par la Boutique)"
    ],
    "manques": [
     "désactivé par la base elle-même : `enabled = false` imposé par contrainte CHECK dans la migration 0077 ; aucune quantité réelle ni source externe connectée (quantités inconnues = null, « non connectées »)",
     "aucune observation n'est appliquée au stock réel dans ce lot (applied:false) ; le raccordement aux comptes existants est une étape ultérieure annoncée par la Boutique",
     "les identifiants des deux modules sont générés à l'exécution dans la base de la Boutique (gen_random_uuid) : non relevables dans le code, à vérifier en production",
     "migration 0077 non vérifiée comme appliquée dans la base déployée de la Boutique"
    ],
    "doublons": [
     "recouvrement de fonction possible avec « inventory » et « warehouse » (aire « stock » du registre) : tables différentes (shop_inventory.* contre shop_commerce.offer_stock_events, shop_commerce.warehouses) ; la Boutique déclare ne migrer ni modifier ses stocks fournisseurs existants — aucune fusion, à confirmer avec le PDG"
    ],
    "aVerifier": [
     "identifiants des modules commande / vérification (propres à la base déployée de la Boutique)",
     "état réel de la migration 0077 en production"
    ]
   }
  ],
  "intermediaires": [
   {
    "niveauDeclare": "PREPARED (désactivé)",
    "domaine": "stock propre",
    "tables": [
     "shop_inventory.owners",
     "shop_inventory.engines",
     "shop_inventory.locations",
     "shop_inventory.items",
     "shop_inventory.levels",
     "shop_inventory.connection_slots",
     "shop_inventory.engine_blueprints"
    ],
    "tests": [
     "tests/stock-engines.integration.mjs",
     "tests/stock-engines.test.mjs",
     "tests/browser/stock-engines.spec.mjs"
    ],
    "entrees": [],
    "entreesTrouvees": 0,
    "serviceExecution": "mkapms-shop · serveur Express (server/app.mjs) · routes /api/stock-engines/* (page privée Fondateur #/stocks)",
    "id": "stock.mka_own.intermediary",
    "nom": "Moteur intermédiaire de stock MKA.P-MS SHOP",
    "fonction": "Pont entre le moteur de stock propre et son canal (interne SHOP aujourd'hui ; Amazon vendeur, Amazon FBA, Alibaba B2B, Shopify, flux fournisseur et autre sont préparés) — deux modules distincts : commande (prépare la passerelle) et vérification (contrôle indépendant du propriétaire, du moteur et de la cohérence des quantités). Tous les canaux sont désactivés, sans identifiant d'accès ni appel externe.",
    "code": [
     "migrations/0077_stock_engine_preparation.sql:43",
     "server/stock-engine-policy.mjs:41",
     "server/app.mjs:213",
     "docs/SHOP-STOCK-ENGINES-2026-10-09.md"
    ],
    "dependances": [
     "stock.mka_own.inventory"
    ],
    "etat": "prepare",
    "preuve": "declare",
    "declareSeulement": true,
    "intermediairePrevu": null,
    "connexionsExistantes": [
     "emplacement de connexion du canal « INTERNAL » posé par la migration 0077 (désactivé)"
    ],
    "connexionsAConstruire": [
     "ne pas confondre avec les six intermédiaires Boutique ↔ plateforme : celui-ci relie le stock à ses canaux de stock, pas à la plateforme principale",
     "canaux externes : accès et validation d'API à obtenir (Alibaba : apiValidated:false explicite)"
    ],
    "manques": [
     "désactivé par la base elle-même : `enabled = false` imposé par contrainte CHECK dans la migration 0077 ; aucune quantité réelle ni source externe connectée (quantités inconnues = null, « non connectées »)",
     "aucune observation n'est appliquée au stock réel dans ce lot (applied:false) ; le raccordement aux comptes existants est une étape ultérieure annoncée par la Boutique",
     "les identifiants des deux modules sont générés à l'exécution dans la base de la Boutique (gen_random_uuid) : non relevables dans le code, à vérifier en production",
     "migration 0077 non vérifiée comme appliquée dans la base déployée de la Boutique",
     "aucun pont réel : bridgeReadiness répond toujours « CONNECTION_NOT_INSTALLED » et les tests de la Boutique ne vérifient que cette réponse"
    ],
    "doublons": [
     "distinct des intermédiaires de la migration 0057 (contrats Boutique ↔ plateforme) : aucun identifiant ni table en commun"
    ],
    "aVerifier": [
     "identifiants des modules du pont (propres à la base déployée de la Boutique)"
    ]
   }
  ],
  "controlesDoublons": [
   "tables : 7 tables shop_inventory.*, aucune n'est portée par le registre des 83 moteurs",
   "identifiants : « stock.* » absent du registre (aucun doublon)",
   "10 modèles de comptes = 10 types déclarés dans le code (concordance vérifiée), un seul compte réel : « mkapms-shop-own »",
   "intermédiaire de stock ≠ intermédiaires de la migration 0057 : aucun identifiant commun"
  ]
 },
 "auditExigences": {
  "commitAudite": "449e4f7a76449999d724277a02c8845e3749b4ea",
  "total": 105,
  "criteres": {
   "PARTIAL": 285,
   "MISSING": 870
  },
  "planCompletDansLeDepot": false
 },
 "moteurs": [
  {
   "id": "shop.engine",
   "nom": "Shop Engine",
   "fonction": "Pilote le noyau SHOP, les migrations et la santé générale de la boutique.",
   "domaine": "core",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:6",
    "src/capabilities.ts",
    "src/smart-system.ts",
    "src/gap-audit.ts",
    "server/shop-engine.mjs",
    "public/shop-engine.js",
    "server/shop-intelligent-system.mjs",
    "server/engine-runtime.mjs"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_private_access.migrations"
   ],
   "dependances": [],
   "tests": [
    "tests/engine-runtime.test.mjs",
    "tests/gap-audit.test.ts",
    "tests/smart-system.test.ts"
   ],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "audit de la Boutique : critères manquants — schema, events"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "commerce.kernel",
   "nom": "Commerce Kernel",
   "fonction": "Relie produits, offres, catégories et paramètres commerciaux.",
   "domaine": "commerce",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:7",
    "src/order-engine.ts",
    "server/sandbox.mjs",
    "migrations/0004_sandbox_commerce.sql"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.products",
    "shop_commerce.offers",
    "shop_commerce.categories",
    "shop_commerce.settings"
   ],
   "dependances": [
    "shop.engine"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/order-engine.test.ts"
   ],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "product",
   "nom": "Product Engine",
   "fonction": "Gère la fiche produit maître indépendante des vendeurs.",
   "domaine": "catalogue",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:8",
    "server/engine-runtime.mjs:6",
    "server/app.mjs",
    "migrations/0002_private_application.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/(products|product-preview)(\\/|$)"
   ],
   "entreesTrouvees": 26,
   "tables": [
    "shop_commerce.products"
   ],
   "dependances": [
    "commerce.kernel"
   ],
   "tests": [
    "tests/application.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "catalogue",
   "nom": "Catalogue Engine",
   "fonction": "Classe les produits dans les univers, catégories et collections SHOP.",
   "domaine": "catalogue",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:9",
    "server/engine-runtime.mjs:7",
    "server/app.mjs",
    "migrations/0002_private_application.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/public\\/showcase$"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_commerce.categories"
   ],
   "dependances": [
    "product"
   ],
   "tests": [
    "tests/application.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "service-access",
   "connexionsExistantes": [
    "contrat « service-access » (BUILT) déclaré côté Boutique — server/service-access.mjs, docs/SHOP-SERVICE-ACCESS-2026-10-02.md",
    "canal « catalogue » du moteur intermédiaire shop_link côté plateforme (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "offer",
   "nom": "Offer Engine",
   "fonction": "Gère les offres vendables reliées à un produit.",
   "domaine": "catalogue",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:10",
    "server/engine-runtime.mjs:8",
    "server/app.mjs",
    "migrations/0002_private_application.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/offers(\\/|$)"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_commerce.offers"
   ],
   "dependances": [
    "product"
   ],
   "tests": [
    "tests/application.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [
    "mêmes tables que promotion (Promotion Engine)",
    "mêmes tables que pricing (Pricing Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "attribute",
   "nom": "Attribute Engine",
   "fonction": "Structure les caractéristiques produit exploitables par filtres et recherche.",
   "domaine": "catalogue",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:11"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.product_attribute_values"
   ],
   "dependances": [
    "product"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "variant",
   "nom": "Variant Engine",
   "fonction": "Gère les variantes produit, options et correspondance stock.",
   "domaine": "catalogue",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:12"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.product_variants"
   ],
   "dependances": [
    "attribute",
    "inventory"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "manufacturer",
   "nom": "Manufacturer Engine",
   "fonction": "Gère fabricants, marques et provenance commerciale.",
   "domaine": "catalogue",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:13"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.manufacturers"
   ],
   "dependances": [
    "product"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "search.index",
   "nom": "Search Index Engine",
   "fonction": "Construit l’index de recherche boutique.",
   "domaine": "discovery",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:14",
    "server/engine-runtime.mjs:16",
    "server/search-index.mjs",
    "server/engine-runtime.mjs",
    "migrations/0060_engine_observations.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/public\\/(search|search-signals)$"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_commerce.search_index",
    "shop_routing.keyword_demands"
   ],
   "dependances": [
    "catalogue",
    "publisher"
   ],
   "tests": [
    "tests/customer-commerce.integration.mjs",
    "tests/engine-runtime.test.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — contract, schema, permissions, audit, events"
   ],
   "doublons": [
    "mêmes tables que keyword (Keyword Demand Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "keyword",
   "nom": "Keyword Demand Engine",
   "fonction": "Centralise les mots-clés boutique pour tous les pays, produits, univers et recherches sans résultat.",
   "domaine": "discovery",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:15",
    "server/engine-runtime.mjs:17"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/public\\/(search|search-signals)$"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_routing.keyword_demands",
    "shop_commerce.search_index"
   ],
   "dependances": [
    "search.index",
    "catalogue",
    "seo"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "mêmes tables que search.index (Search Index Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "filter",
   "nom": "Filter Engine",
   "fonction": "Transforme attributs et catégories en filtres utilisateur.",
   "domaine": "discovery",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:16"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.search_filters"
   ],
   "dependances": [
    "search.index",
    "attribute"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "recommendation",
   "nom": "Recommendation Engine",
   "fonction": "Prépare recommandations et produits associés sans IA centrale partagée.",
   "domaine": "discovery",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:17"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.recommendations"
   ],
   "dependances": [
    "catalogue",
    "analytics"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "publisher",
   "nom": "Publisher Engine",
   "fonction": "Contrôle publication produit avant visibilité publique.",
   "domaine": "publication",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:18",
    "server/engine-runtime.mjs:11"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/publication(\\/|$)"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "shop_commerce.product_reviews",
    "shop_commerce.publication_checks",
    "shop_commerce.publications"
   ],
   "dependances": [
    "catalogue",
    "media"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "seller.publication",
   "nom": "Seller Publication Engine",
   "fonction": "Transforme chaque dépôt vendeur en file de validation fermée : produit, photo, vidéo ou publicité.",
   "domaine": "publication",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:19",
    "server/engine-runtime.mjs:14"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/seller-engines\\/(dashboard|sellers|publications)(\\/|$)"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "shop_customer.seller_publication_requests",
    "shop_security.moderation_queue"
   ],
   "dependances": [
    "seller",
    "subscription",
    "publisher",
    "media"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "feed",
   "nom": "Feed Engine",
   "fonction": "Prépare les flux sortants boutique pour moteurs externes.",
   "domaine": "publication",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:20"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.publication_feed_exports"
   ],
   "dependances": [
    "publisher",
    "seo"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "seo",
   "nom": "SEO Engine",
   "fonction": "Gère indexation, pages SEO et métadonnées boutique.",
   "domaine": "visibility",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:21",
    "server/engine-runtime.mjs:18"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/public\\/(showcase|search|search-signals)$"
   ],
   "entreesTrouvees": 3,
   "tables": [
    "shop_commerce.seo_pages"
   ],
   "dependances": [
    "publisher"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "seo.indexing",
   "nom": "Google Indexing Readiness Engine",
   "fonction": "Prépare la boutique à être indexable par Google après ouverture publique et configuration externe.",
   "domaine": "visibility",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:22",
    "server/engine-runtime.mjs:19"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/public\\/(showcase|search|search-signals)$"
   ],
   "entreesTrouvees": 3,
   "tables": [
    "shop_commerce.seo_pages",
    "shop_commerce.publication_feed_exports",
    "shop_routing.keyword_demands"
   ],
   "dependances": [
    "seo",
    "feed",
    "keyword"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "accès externe requis : Domain, sitemap submission and Google Search Console/API access required before live indexing can be verified.",
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "mêmes tables que ai.discovery (AI Discovery Readiness Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "ai.discovery",
   "nom": "AI Discovery Readiness Engine",
   "fonction": "Prépare la découverte par IA et moteurs conversationnels via contenu public structuré.",
   "domaine": "visibility",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:23",
    "server/engine-runtime.mjs:20"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/public\\/(showcase|search|search-signals)$"
   ],
   "entreesTrouvees": 3,
   "tables": [
    "shop_commerce.seo_pages",
    "shop_commerce.publication_feed_exports",
    "shop_routing.keyword_demands"
   ],
   "dependances": [
    "seo",
    "feed",
    "keyword",
    "product.policy"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "accès externe requis : AI crawler discovery cannot be forced; SHOP prepares structured public content, feeds, keywords and crawler policy only.",
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "mêmes tables que seo.indexing (Google Indexing Readiness Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "campaign",
   "nom": "Campaign Engine",
   "fonction": "Prépare campagnes boutique indépendantes.",
   "domaine": "visibility",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:24",
    "server/engine-runtime.mjs:50"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [
    "^\\/api\\/(public|team|customer)\\/broadcast\\/advertising(\\/|$)"
   ],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.campaigns",
    "shop_commerce.advertising_broadcast_assets",
    "shop_commerce.advertising_broadcast_placements"
   ],
   "dependances": [
    "publisher",
    "analytics"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "liaison déclarée mais aucune route correspondante retrouvée dans le code",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [
    "mêmes tables que booster (Boost Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "booster",
   "nom": "Boost Engine",
   "fonction": "Booste les produits, offres et campagnes SHOP selon règles internes, pays, mots-clés et audience.",
   "domaine": "visibility",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:25",
    "server/engine-runtime.mjs:51"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/(public|team|customer)\\/broadcast\\/advertising(\\/|$)",
    "^\\/api\\/public\\/(showcase|search|search-signals)$"
   ],
   "entreesTrouvees": 3,
   "tables": [
    "shop_commerce.campaigns",
    "shop_commerce.advertising_broadcast_assets",
    "shop_commerce.advertising_broadcast_placements"
   ],
   "dependances": [
    "campaign",
    "seo",
    "keyword",
    "analytics"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "mêmes tables que campaign (Campaign Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "audience",
   "nom": "Audience Engine",
   "fonction": "Construit les audiences boutique sans dépendre de la plateforme principale.",
   "domaine": "visibility",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:26",
    "server/engine-runtime.mjs:52"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/(public|team|customer)\\/broadcast\\/advertising(\\/|$)",
    "^\\/api\\/public\\/(search|search-signals)$",
    "^\\/api\\/intelligence\\/dashboard$"
   ],
   "entreesTrouvees": 3,
   "tables": [
    "shop_intelligent.engine_events",
    "shop_commerce.campaigns",
    "shop_routing.keyword_demands"
   ],
   "dependances": [
    "analytics",
    "keyword",
    "campaign"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "event.marketing",
   "nom": "Event Marketing Engine",
   "fonction": "Pilote les opérations événementielles boutique : lancements, saisons, salons, promos et campagnes datées.",
   "domaine": "visibility",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:27",
    "server/engine-runtime.mjs:53"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/(public|team|customer)\\/broadcast\\/advertising(\\/|$)",
    "^\\/api\\/intelligence\\/dashboard$"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_commerce.campaigns",
    "shop_commerce.advertising_broadcast_assets",
    "shop_intelligent.scheduled_jobs"
   ],
   "dependances": [
    "campaign",
    "booster",
    "audience",
    "scheduler"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "promotion",
   "nom": "Promotion Engine",
   "fonction": "Gère promotions, réductions et offres temporaires.",
   "domaine": "pricing",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:28",
    "server/engine-runtime.mjs:10"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/selling-prices\\/promotions(\\/|$)"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_commerce.offers"
   ],
   "dependances": [
    "offer"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [
    "mêmes tables que offer (Offer Engine)",
    "mêmes tables que pricing (Pricing Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "coupon",
   "nom": "Coupon Engine",
   "fonction": "Gère codes promo et conditions d’utilisation.",
   "domaine": "pricing",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:29"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.coupons"
   ],
   "dependances": [
    "promotion",
    "cart"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "pricing",
   "nom": "Pricing Engine",
   "fonction": "Calcule prix boutique, marges et prix affichés.",
   "domaine": "pricing",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:30",
    "server/engine-runtime.mjs:9",
    "server/app.mjs",
    "migrations/0002_private_application.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/selling-prices(\\/|$)"
   ],
   "entreesTrouvees": 5,
   "tables": [
    "shop_commerce.offers"
   ],
   "dependances": [
    "offer"
   ],
   "tests": [
    "tests/application.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [
    "mêmes tables que offer (Offer Engine)",
    "mêmes tables que promotion (Promotion Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "cart",
   "nom": "Cart Engine",
   "fonction": "Gère panier client et réservations locales.",
   "domaine": "checkout",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:31",
    "server/engine-runtime.mjs:22",
    "server/app.mjs",
    "migrations/0002_private_application.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/(cart|customer\\/cart)(\\/|$)"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_customer.carts",
    "shop_customer.cart_items"
   ],
   "dependances": [
    "offer",
    "inventory",
    "pricing"
   ],
   "tests": [
    "tests/application.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — audit, events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "checkout",
   "nom": "Checkout Engine",
   "fonction": "Orchestre commande avant paiement réel.",
   "domaine": "checkout",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:32",
    "server/engine-runtime.mjs:23",
    "src/order-engine.ts",
    "server/sandbox.mjs",
    "migrations/0004_sandbox_commerce.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/customer\\/commerce\\/orders$"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_customer.checkouts"
   ],
   "dependances": [
    "cart",
    "shipping",
    "payment.gateway"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/order-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "order",
   "nom": "Order Engine",
   "fonction": "Gère commandes confirmées et lignes de commande.",
   "domaine": "checkout",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:33",
    "server/engine-runtime.mjs:24",
    "src/order-engine.ts",
    "server/sandbox.mjs",
    "migrations/0004_sandbox_commerce.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/customer\\/commerce\\/orders(\\/|$)",
    "^\\/api\\/customer-orders(\\/|$)"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "shop_customer.orders",
    "shop_customer.order_lines"
   ],
   "dependances": [
    "checkout",
    "documents",
    "inventory"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/order-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "order.communication",
   "nom": "Order Communication Engine",
   "fonction": "Relie la commande à sa chronologie et aux échanges client/vendeur/équipe.",
   "domaine": "checkout",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:34",
    "server/engine-runtime.mjs:25"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/customer\\/commerce\\/orders(\\/|$)",
    "^\\/api\\/customer\\/commerce\\/support(\\/|$)",
    "^\\/api\\/seller-engines\\/communications(\\/|$)"
   ],
   "entreesTrouvees": 7,
   "tables": [
    "shop_customer.order_timeline",
    "shop_customer.communication_threads",
    "shop_customer.communication_messages"
   ],
   "dependances": [
    "order",
    "communication"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "payment.gateway",
   "nom": "Payment Gateway Engine",
   "fonction": "Raccorde un seul prestataire Stripe/PSP au centre paiement SHOP sans dupliquer Stripe partout.",
   "domaine": "finance",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:35",
    "server/engine-runtime.mjs:31",
    "src/contracts.ts",
    "src/integrations.ts"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/payment-engines\\/(dashboard|counters|routes)(\\/|$)",
    "^\\/api\\/accounting\\/overview$"
   ],
   "entreesTrouvees": 5,
   "tables": [
    "shop_customer.payments",
    "shop_finance.payment_routes"
   ],
   "dependances": [
    "vault"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "accès externe requis : One Stripe/PSP connector required; routes stay separated by SHOP engine.",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [
    "mêmes tables que payment (Legacy Payment View)"
   ],
   "aVerifier": []
  },
  {
   "id": "payment.individual",
   "nom": "Individual Payment Engine",
   "fonction": "Gère les paiements particuliers, séparés des pros dans les compteurs PDG.",
   "domaine": "finance",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:36",
    "server/engine-runtime.mjs:32"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/customer\\/commerce\\/orders(\\/|$)",
    "^\\/api\\/accounting\\/overview$"
   ],
   "entreesTrouvees": 4,
   "tables": [
    "shop_customer.payment_attempts",
    "shop_customer.orders",
    "shop_finance.payment_counters"
   ],
   "dependances": [
    "payment.gateway",
    "checkout"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "mêmes tables que payment.pro (Professional Payment Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "payment.pro",
   "nom": "Professional Payment Engine",
   "fonction": "Gère les paiements professionnels hors abonnement, avec compteur PDG distinct.",
   "domaine": "finance",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:37",
    "server/engine-runtime.mjs:33"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/customer\\/commerce\\/orders(\\/|$)",
    "^\\/api\\/accounting\\/overview$"
   ],
   "entreesTrouvees": 4,
   "tables": [
    "shop_customer.payment_attempts",
    "shop_customer.orders",
    "shop_finance.payment_counters"
   ],
   "dependances": [
    "payment.gateway",
    "seller"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "mêmes tables que payment.individual (Individual Payment Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "payment.subscription",
   "nom": "Pro Subscription Payment Engine",
   "fonction": "Gère uniquement le paiement d’abonnement pro/vendeur avant droit de dépôt.",
   "domaine": "finance",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:38",
    "server/engine-runtime.mjs:34"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/seller-engines\\/(dashboard|sellers|subscriptions)(\\/|$)",
    "^\\/api\\/payment-engines\\/dashboard$",
    "^\\/api\\/accounting\\/overview$"
   ],
   "entreesTrouvees": 8,
   "tables": [
    "shop_customer.seller_subscriptions",
    "shop_finance.payment_counters"
   ],
   "dependances": [
    "payment.gateway",
    "subscription"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "payment.country",
   "nom": "Country Payment Routing Engine",
   "fonction": "Sépare les règles paiement par pays et devise pour préparer une boutique mondiale.",
   "domaine": "finance",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:39",
    "server/engine-runtime.mjs:35"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/payment-engines\\/(dashboard|counters|routes)(\\/|$)",
    "^\\/api\\/accounting\\/overview$"
   ],
   "entreesTrouvees": 5,
   "tables": [
    "shop_finance.payment_country_rules",
    "shop_finance.payment_country_counters"
   ],
   "dependances": [
    "payment.gateway",
    "payment.individual",
    "payment.pro",
    "payment.subscription"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "payment.internal",
   "nom": "Internal Treasury Payment Engine",
   "fonction": "Gère les flux internes MKA.P-MS SHOP : argent boutique, fournisseurs, transporteurs, commissions, remboursements.",
   "domaine": "finance",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:40",
    "server/engine-runtime.mjs:36"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/accounting\\/overview$"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_customer.ledger_entries",
    "shop_customer.payouts",
    "shop_finance.payment_counters"
   ],
   "dependances": [
    "ledger",
    "audit"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "payment",
   "nom": "Legacy Payment View",
   "fonction": "Vue de compatibilité qui agrège les routes paiement SHOP sans porter le métier lui-même.",
   "domaine": "finance",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:41",
    "server/engine-runtime.mjs:30"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/accounting\\/overview$"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_customer.payments",
    "shop_finance.payment_routes"
   ],
   "dependances": [
    "payment.gateway",
    "payment.individual",
    "payment.pro",
    "payment.subscription",
    "payment.country",
    "payment.internal"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": "shared-stripe-account",
   "connexionsExistantes": [
    "contrat « shared-stripe-account » (BLOCKED_EXTERNAL) déclaré côté Boutique — migrations/0057 : contrat shared-stripe-account",
    "canal « paiement » du moteur intermédiaire shop_link côté plateforme (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique : la Boutique n'appelle jamais la plateforme (AGENTS.md) — à construire par les agents de la Boutique, aucune décision ici",
    "accès externe requis avant toute activation"
   ],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "vue héritée : recouvre les moteurs payment.* (à retirer quand ils sont complets)",
    "mêmes tables que payment.gateway (Payment Gateway Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "ledger",
   "nom": "Internal Ledger Engine",
   "fonction": "Sépare argent boutique, fournisseurs, transporteurs, commissions et remboursements.",
   "domaine": "finance",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:42",
    "server/engine-runtime.mjs:37",
    "src/order-engine.ts",
    "server/sandbox.mjs",
    "migrations/0004_sandbox_commerce.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/accounting\\/overview$"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_customer.ledger_entries"
   ],
   "dependances": [
    "payment.gateway",
    "order"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/order-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "payout",
   "nom": "Payout Engine",
   "fonction": "Prépare sorties fournisseur/transporteur selon ledger.",
   "domaine": "finance",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:43"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.payouts"
   ],
   "dependances": [
    "ledger"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "accès externe requis : Stripe payout access required.",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "documents",
   "nom": "Document Engine",
   "fonction": "Produit documents boutique : facture, contrat, preuve, dossier.",
   "domaine": "documents",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:44",
    "server/engine-runtime.mjs:47",
    "src/contracts.ts",
    "src/integrations.ts"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/supplier-documents(\\/|$)"
   ],
   "entreesTrouvees": 59,
   "tables": [
    "shop_customer.documents"
   ],
   "dependances": [
    "order",
    "customer"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": "shop-documents-only",
   "connexionsExistantes": [
    "contrat « shop-documents-only » (READY) déclaré côté Boutique — migrations/0057 : contrat shop-documents-only",
    "canal « documents » du moteur intermédiaire shop_link côté plateforme (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique : la Boutique n'appelle jamais la plateforme (AGENTS.md) — à construire par les agents de la Boutique, aucune décision ici"
   ],
   "manques": [
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "invoice",
   "nom": "Invoice Engine",
   "fonction": "Génère factures client MKA.P-MS SHOP.",
   "domaine": "documents",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:45",
    "src/order-engine.ts",
    "server/sandbox.mjs",
    "migrations/0004_sandbox_commerce.sql"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.invoices"
   ],
   "dependances": [
    "documents",
    "ledger"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/order-engine.test.ts"
   ],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "inventory",
   "nom": "Inventory Engine",
   "fonction": "Suit stock vendable et événements stock.",
   "domaine": "stock",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:46",
    "server/engine-runtime.mjs:42",
    "src/supplier-stock.ts",
    "server/suppliers.mjs",
    "migrations/0003_supplier_delivery.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/supplier-stock(\\/|$)"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_commerce.offer_stock_events"
   ],
   "dependances": [
    "offer"
   ],
   "tests": [
    "tests/application.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "warehouse",
   "nom": "Warehouse Engine",
   "fonction": "Gère entrepôts, lieux de préparation et règles stock.",
   "domaine": "stock",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:47"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_commerce.warehouses"
   ],
   "dependances": [
    "inventory"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "supplier",
   "nom": "Supplier Engine",
   "fonction": "Gère fournisseurs et catalogues fournisseurs.",
   "domaine": "supplier",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:48",
    "server/engine-runtime.mjs:39",
    "server/suppliers.mjs",
    "migrations/0003_supplier_delivery.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/suppliers(\\/|$)"
   ],
   "entreesTrouvees": 5,
   "tables": [
    "shop_commerce.suppliers",
    "shop_commerce.supplier_catalog"
   ],
   "dependances": [
    "catalogue",
    "inventory"
   ],
   "tests": [
    "tests/application.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "supplier.connector",
   "nom": "Supplier Connector Engine",
   "fonction": "Branche fichiers, APIs et identifiants fournisseurs via coffre SHOP.",
   "domaine": "supplier",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:49",
    "server/engine-runtime.mjs:40",
    "src/integrations.ts",
    "src/contracts.ts"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/vault(\\/|$)",
    "^\\/api\\/supplier-workflow\\/api-(test|import)$"
   ],
   "entreesTrouvees": 123,
   "tables": [
    "shop_vault.integrations"
   ],
   "dependances": [
    "supplier",
    "vault"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "accès externe requis : Credentials per supplier required; local vault only.",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [
    "mêmes tables que vault (Integration Vault Engine)",
    "mêmes tables que shopify.adapter (Shopify Adapter)"
   ],
   "aVerifier": []
  },
  {
   "id": "supplier.adapter.template",
   "nom": "Supplier Adapter Template",
   "fonction": "Modèle adaptateur fournisseur réutilisable pour tout fournisseur CSV/API.",
   "domaine": "supplier",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:50",
    "server/engine-runtime.mjs:41"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/supplier-workflow\\/api-(test|import)$"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_commerce.supplier_catalog"
   ],
   "dependances": [
    "supplier.connector"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "accès externe requis : Supplier contract/API/feed required.",
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shipping",
   "nom": "Shipping Engine",
   "fonction": "Calcule livraison au panier selon destination.",
   "domaine": "logistics",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:51",
    "server/engine-runtime.mjs:43",
    "src/shipping.ts",
    "server/suppliers.mjs"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/shipping(\\/|$)"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_customer.shipping_quotes"
   ],
   "dependances": [
    "cart",
    "warehouse"
   ],
   "tests": [
    "tests/shipping.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "quote",
   "nom": "Quote Engine",
   "fonction": "Calcule les devis boutique avant commande : panier, poids, pays, devise, livraison et disponibilité.",
   "domaine": "logistics",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:52",
    "server/engine-runtime.mjs:44"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/shipping(\\/|$)",
    "^\\/api\\/customer\\/commerce\\/orders$"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_customer.shipping_quotes",
    "shop_customer.checkouts"
   ],
   "dependances": [
    "cart",
    "shipping",
    "pricing"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "customs",
   "nom": "Customs Engine",
   "fonction": "Prépare les règles douane internationales internes avant expédition réelle.",
   "domaine": "logistics",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:53",
    "server/engine-runtime.mjs:45"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/shipping(\\/|$)",
    "^\\/api\\/customer\\/commerce\\/orders$"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_customer.shipping_quotes",
    "shop_customer.fulfillment_routes"
   ],
   "dependances": [
    "quote",
    "shipping",
    "routing",
    "payment.country"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "carrier",
   "nom": "Carrier Adapter Engine",
   "fonction": "Connecte transporteurs et missions de livraison.",
   "domaine": "logistics",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:54",
    "src/integrations.ts",
    "src/contracts.ts"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.shipments"
   ],
   "dependances": [
    "shipping",
    "supplier.connector"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "accès externe requis : Carrier contract/API required.",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "routing",
   "nom": "Routing Engine",
   "fonction": "Décide itinéraire fulfillment fournisseur/entrepôt/client.",
   "domaine": "logistics",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:55"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.fulfillment_routes"
   ],
   "dependances": [
    "order",
    "shipping",
    "supplier"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "return",
   "nom": "Return Engine",
   "fonction": "Gère retours client et état retour.",
   "domaine": "after_sales",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:56",
    "src/order-engine.ts",
    "server/sandbox.mjs",
    "migrations/0004_sandbox_commerce.sql"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.returns"
   ],
   "dependances": [
    "order",
    "documents"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/order-engine.test.ts"
   ],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "refund",
   "nom": "Refund Engine",
   "fonction": "Gère remboursements selon paiement, retour et ledger.",
   "domaine": "after_sales",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:57",
    "src/order-engine.ts",
    "server/sandbox.mjs",
    "migrations/0004_sandbox_commerce.sql"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.refunds"
   ],
   "dependances": [
    "payment",
    "return"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/order-engine.test.ts"
   ],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "after_sales",
   "nom": "After-sales Engine",
   "fonction": "Gère support après-vente et dossiers client.",
   "domaine": "after_sales",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:58",
    "server/engine-runtime.mjs:38",
    "src/order-engine.ts",
    "server/sandbox.mjs",
    "migrations/0004_sandbox_commerce.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/customer\\/commerce\\/support(\\/|$)"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_customer.support_cases"
   ],
   "dependances": [
    "customer",
    "order"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/order-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "customer",
   "nom": "Customer Engine",
   "fonction": "Gère comptes clients SHOP et sessions.",
   "domaine": "account",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:59",
    "server/engine-runtime.mjs:21",
    "src/customer-account.ts",
    "server/customer-accounts.mjs",
    "migrations/0005_customer_accounts.sql",
    "public/customer.js"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/customer\\/(profile|addresses|preferences)(\\/|$)"
   ],
   "entreesTrouvees": 3,
   "tables": [
    "shop_customer.accounts",
    "shop_customer.sessions"
   ],
   "dependances": [
    "shop.engine"
   ],
   "tests": [
    "tests/customer-account.test.ts",
    "tests/customer.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "seller",
   "nom": "Seller/Pro Engine",
   "fonction": "Gère les vendeurs/pros de la boutique comme un moteur propre, pas comme une simple section.",
   "domaine": "account",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:60",
    "server/engine-runtime.mjs:12"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/seller-engines\\/(dashboard|sellers)(\\/|$)"
   ],
   "entreesTrouvees": 4,
   "tables": [
    "shop_customer.seller_profiles"
   ],
   "dependances": [
    "customer",
    "audit"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "subscription",
   "nom": "Subscription Engine",
   "fonction": "Gère l’abonnement vendeur requis avant dépôt produit, photo, vidéo ou campagne.",
   "domaine": "account",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:61",
    "server/engine-runtime.mjs:13"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/seller-engines\\/(dashboard|sellers|subscriptions)(\\/|$)"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "shop_customer.seller_subscriptions"
   ],
   "dependances": [
    "seller",
    "payment.subscription",
    "ledger"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "review",
   "nom": "Review Engine",
   "fonction": "Gère avis clients vérifiés.",
   "domaine": "trust",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:62"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.reviews"
   ],
   "dependances": [
    "customer",
    "order",
    "moderation"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "rating",
   "nom": "Rating Engine",
   "fonction": "Calcule notes produits/vendeurs.",
   "domaine": "trust",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:63"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.ratings"
   ],
   "dependances": [
    "review"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "qa",
   "nom": "Question/Answer Engine",
   "fonction": "Gère questions/réponses produit.",
   "domaine": "trust",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:64"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.product_questions"
   ],
   "dependances": [
    "customer",
    "product",
    "moderation"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "trust",
   "nom": "Trust Engine",
   "fonction": "Centralise confiance, conformité et signaux sûreté.",
   "domaine": "trust",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:65"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_security.trust_events"
   ],
   "dependances": [
    "audit",
    "moderation"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "fraud",
   "nom": "Fraud Engine",
   "fonction": "Détecte signaux fraude côté boutique.",
   "domaine": "trust",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:66"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_security.fraud_signals"
   ],
   "dependances": [
    "payment.gateway",
    "trust"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "moderation",
   "nom": "Moderation Engine",
   "fonction": "Modère avis, questions, contenus produit et médias.",
   "domaine": "trust",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:67"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_security.moderation_queue"
   ],
   "dependances": [
    "customer",
    "trust"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "product.policy",
   "nom": "Forbidden Product Control Engine",
   "fonction": "Bloque les produits interdits avant publication, dont contenu sexuel/adulte et croix tant que la règle Direction reste active.",
   "domaine": "trust",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:68",
    "server/engine-runtime.mjs:15",
    "src/contracts.ts"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/publication(\\/|$)",
    "^\\/api\\/seller-engines\\/(dashboard|sellers|publications)(\\/|$)"
   ],
   "entreesTrouvees": 12,
   "tables": [
    "shop_security.moderation_queue",
    "shop_commerce.publication_checks"
   ],
   "dependances": [
    "moderation",
    "publisher",
    "catalogue"
   ],
   "tests": [
    "tests/contracts.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "media",
   "nom": "Media Engine",
   "fonction": "Gère photos, vidéos et droits média produit.",
   "domaine": "media",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:69",
    "server/engine-runtime.mjs:46",
    "server/app.mjs",
    "migrations/0002_private_application.sql"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/(product-media|product-videos|product-zones)(\\/|$)",
    "^\\/api\\/(public|team|customer)\\/broadcast\\/media(\\/|$)"
   ],
   "entreesTrouvees": 240,
   "tables": [
    "shop_commerce.product_media",
    "shop_commerce.product_videos",
    "shop_commerce.media_broadcast_assets",
    "shop_commerce.media_broadcast_placements"
   ],
   "dependances": [
    "product",
    "publisher"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, service, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "image.processing",
   "nom": "Image Processing Engine",
   "fonction": "Prépare images produit, contrôles qualité et formats.",
   "domaine": "media",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:70",
    "server/engine-runtime.mjs:48"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/product-media(\\/|$)",
    "^\\/api\\/product-zones\\/photo$"
   ],
   "entreesTrouvees": 65,
   "tables": [
    "shop_commerce.media_jobs"
   ],
   "dependances": [
    "media"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "video.publisher",
   "nom": "YouTube/Video Publisher Adapter",
   "fonction": "Prépare publication vidéo/YouTube boutique.",
   "domaine": "media",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:71",
    "server/engine-runtime.mjs:49"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/product-videos(\\/|$)",
    "^\\/api\\/product-zones\\/video$"
   ],
   "entreesTrouvees": 62,
   "tables": [
    "shop_commerce.product_videos"
   ],
   "dependances": [
    "media",
    "publisher"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "accès externe requis : YouTube account/API required; no direct plugin installed.",
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "analytics",
   "nom": "Analytics Engine",
   "fonction": "Collecte événements moteur et activité boutique.",
   "domaine": "intelligence",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:72"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_intelligent.engine_events"
   ],
   "dependances": [
    "shop.engine"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [
    "mêmes tables que developer.agent (Developer Agent Engine)",
    "mêmes tables que queue (Queue/Job Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "business_intelligence",
   "nom": "Business Intelligence Engine",
   "fonction": "Transforme événements SHOP en indicateurs décisionnels.",
   "domaine": "intelligence",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:73"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_intelligent.engine_state"
   ],
   "dependances": [
    "analytics"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "smart.system",
   "nom": "Système intelligent boutique",
   "fonction": "Système intelligent boutique, indépendant de la plateforme principale.",
   "domaine": "intelligence",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:74"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_intelligent.engine_state",
    "shop_intelligent.engine_events"
   ],
   "dependances": [
    "business_intelligence",
    "audit"
   ],
   "tests": [],
   "etat": "prepare",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": "shop-intelligence-isolated",
   "connexionsExistantes": [
    "contrat « shop-intelligence-isolated » (READY) déclaré côté Boutique — migrations/0057 : contrat shop-intelligence-isolated",
    "canal « etat » du moteur intermédiaire shop_link côté plateforme (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique : la Boutique n'appelle jamais la plateforme (AGENTS.md) — à construire par les agents de la Boutique, aucune décision ici"
   ],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "developer.agent",
   "nom": "Developer Agent Engine",
   "fonction": "Prépare assistant technique interne SHOP, sans accès plateforme principale.",
   "domaine": "intelligence",
   "niveauDeclare": "internal",
   "code": [
    "server/shop-intelligent-system.mjs:75",
    "src/developer-agent.ts"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_intelligent.engine_events"
   ],
   "dependances": [
    "smart.system"
   ],
   "tests": [
    "tests/developer-agent.test.ts"
   ],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, integration"
   ],
   "doublons": [
    "mêmes tables que analytics (Analytics Engine)",
    "mêmes tables que queue (Queue/Job Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "vault",
   "nom": "Integration Vault Engine",
   "fonction": "Protège clés, URLs, fichiers et contrats d’intégration SHOP.",
   "domaine": "security",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:76",
    "server/engine-runtime.mjs:55"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/vault(\\/|$)"
   ],
   "entreesTrouvees": 121,
   "tables": [
    "shop_vault.integrations"
   ],
   "dependances": [
    "shop.engine"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "mêmes tables que supplier.connector (Supplier Connector Engine)",
    "mêmes tables que shopify.adapter (Shopify Adapter)"
   ],
   "aVerifier": []
  },
  {
   "id": "audit",
   "nom": "Audit Engine",
   "fonction": "Journalise actions sensibles et changements boutique.",
   "domaine": "security",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:77",
    "server/app.mjs",
    "server/security.mjs",
    "server/database.mjs"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_private_access.access_audit"
   ],
   "dependances": [
    "shop.engine"
   ],
   "tests": [
    "tests/application.integration.mjs",
    "tests/security.test.mjs"
   ],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "audit de la Boutique : critères manquants — events, health, dashboard, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "privacy",
   "nom": "Privacy/Consent Engine",
   "fonction": "Gère consentements et règles données personnelles SHOP.",
   "domaine": "security",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:78",
    "server/engine-runtime.mjs:54"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/customer\\/commerce\\/privacy(\\/|$)"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_customer.consents"
   ],
   "dependances": [
    "customer",
    "audit"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "legal.content",
   "nom": "Legal Content Engine",
   "fonction": "Gère mentions légales, conditions, confidentialité, retours, garanties et contenus obligatoires SHOP.",
   "domaine": "compliance",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:79",
    "server/engine-runtime.mjs:27"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/shop\\/preparation$",
    "^\\/api\\/public\\/showcase$"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_commerce.seo_pages",
    "shop_customer.consents"
   ],
   "dependances": [
    "seo",
    "privacy",
    "audit"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "faq",
   "nom": "FAQ Engine",
   "fonction": "Gère FAQ publique boutique, aide achat, paiement, livraison, retour, vendeur et marketplace.",
   "domaine": "support",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:80",
    "server/engine-runtime.mjs:28"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/shop\\/preparation$",
    "^\\/api\\/customer\\/commerce\\/support(\\/|$)"
   ],
   "entreesTrouvees": 2,
   "tables": [
    "shop_commerce.seo_pages",
    "shop_customer.support_cases"
   ],
   "dependances": [
    "seo",
    "after_sales",
    "communication"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "contact",
   "nom": "Contact Engine",
   "fonction": "Centralise les contacts boutique : email, formulaires, demandes entrantes et preuve de réponse.",
   "domaine": "communication",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:81",
    "server/engine-runtime.mjs:29"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/shop\\/preparation$",
    "^\\/api\\/customer\\/commerce\\/support(\\/|$)",
    "^\\/api\\/seller-engines\\/communications(\\/|$)"
   ],
   "entreesTrouvees": 5,
   "tables": [
    "shop_commerce.seo_pages",
    "shop_customer.communication_threads",
    "shop_customer.communication_messages"
   ],
   "dependances": [
    "communication",
    "notification",
    "audit"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "communication",
   "nom": "Communication Engine",
   "fonction": "Centralise les communications SHOP entre client, vendeur, équipe et système.",
   "domaine": "communication",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:82",
    "server/engine-runtime.mjs:26"
   ],
   "serviceExecution": "mkapms-shop · serveur Express (server/start.mjs → server/app.mjs) · porte HTTP engine-runtime",
   "entrees": [
    "^\\/api\\/seller-engines\\/(dashboard|communications)(\\/|$)",
    "^\\/api\\/customer\\/commerce\\/support(\\/|$)"
   ],
   "entreesTrouvees": 5,
   "tables": [
    "shop_customer.communication_threads",
    "shop_customer.communication_messages",
    "shop_customer.notifications"
   ],
   "dependances": [
    "customer",
    "seller",
    "order",
    "audit"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "notification",
   "nom": "Notification Engine",
   "fonction": "Envoie notifications client/fournisseur/équipe.",
   "domaine": "communication",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:83",
    "src/contracts.ts",
    "src/integrations.ts"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_customer.notifications"
   ],
   "dependances": [
    "communication"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "accès externe requis : Email/SMS provider required.",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "webhook",
   "nom": "Webhook Engine",
   "fonction": "Diffuse événements internes vers jobs et connecteurs.",
   "domaine": "technical",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:84"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_events.outbox"
   ],
   "dependances": [
    "shop.engine"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "queue",
   "nom": "Queue/Job Engine",
   "fonction": "Exécute jobs asynchrones boutique.",
   "domaine": "technical",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:85"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_intelligent.engine_events"
   ],
   "dependances": [
    "webhook"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [
    "mêmes tables que analytics (Analytics Engine)",
    "mêmes tables que developer.agent (Developer Agent Engine)"
   ],
   "aVerifier": []
  },
  {
   "id": "scheduler",
   "nom": "Scheduler Engine",
   "fonction": "Planifie tâches régulières SHOP.",
   "domaine": "technical",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:86"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_intelligent.scheduled_jobs"
   ],
   "dependances": [
    "queue"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "cache",
   "nom": "Cache Engine",
   "fonction": "Accélère lectures vitrine, recherche et catalogue.",
   "domaine": "technical",
   "niveauDeclare": "required",
   "code": [
    "server/shop-intelligent-system.mjs:87"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_intelligent.cache_entries"
   ],
   "dependances": [
    "shop.engine"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "aucun fichier de test existant relevé pour ce moteur",
    "audit de la Boutique : critères manquants — contract, schema, service, api, permissions, audit, events, health, dashboard, tests, integration"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shopify.adapter",
   "nom": "Shopify Adapter",
   "fonction": "Adaptateur Shopify optionnel sans dépendance obligatoire.",
   "domaine": "external",
   "niveauDeclare": "external",
   "code": [
    "server/shop-intelligent-system.mjs:88"
   ],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_vault.integrations"
   ],
   "dependances": [
    "catalogue",
    "inventory",
    "order",
    "vault"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucune liaison d'exécution dans server/engine-runtime.mjs (« une table n'est pas un moteur », selon l'audit de la Boutique)",
    "accès externe requis : Shopify plugin/account/API required before live sync.",
    "aucune exigence du plan d'ensemble de la Boutique n'est rattachée à ce moteur (correspondance non établie, donc aucun test relevé)"
   ],
   "doublons": [
    "mêmes tables que supplier.connector (Supplier Connector Engine)",
    "mêmes tables que vault (Integration Vault Engine)"
   ],
   "aVerifier": []
  }
 ],
 "intermediaires": [
  {
   "id": "main-to-shop-entry",
   "nom": "Accès Boutique depuis la plateforme (entrée)",
   "fonction": "Bouton Accès Boutique depuis la plateforme principale vers la boutique.",
   "domaine": "intermédiaire",
   "niveauDeclare": "READY",
   "code": [
    "migrations/0057_shop_preparation_readiness.sql:43"
   ],
   "serviceExecution": "aucun (contrat déclaré dans shop_strategy.connection_contracts)",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "access.entry"
   ],
   "tests": [],
   "etat": "prepare",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": "main-to-shop-entry",
   "connexionsExistantes": [],
   "connexionsAConstruire": [
    "canal du moteur intermédiaire côté plateforme"
   ],
   "manques": [
    "contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte",
    "le moteur « access.entry » nommé par le contrat n'existe pas dans le registre des moteurs de la Boutique"
   ],
   "doublons": [],
   "aVerifier": [
    "moteur « access.entry » absent du registre de la Boutique"
   ]
  },
  {
   "id": "shared-stripe-account",
   "nom": "Compte de paiement commun (Stripe)",
   "fonction": "Utiliser un compte Stripe propriétaire commun sans fusionner les moteurs paiement.",
   "domaine": "intermédiaire",
   "niveauDeclare": "BLOCKED_EXTERNAL",
   "code": [
    "migrations/0057_shop_preparation_readiness.sql:44"
   ],
   "serviceExecution": "aucun (contrat déclaré dans shop_strategy.connection_contracts)",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "payment"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": "shared-stripe-account",
   "connexionsExistantes": [
    "canal « paiement » de shop_link côté plateforme"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique (à construire par les agents de la Boutique)"
   ],
   "manques": [
    "contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte",
    "accès externe requis avant toute activation (statut BLOCKED_EXTERNAL)",
    "aucun émetteur vers la plateforme dans la Boutique (sa règle AGENTS.md : la Boutique n'appelle jamais la plateforme)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shared-google-owner",
   "nom": "Propriétaire Google commun",
   "fonction": "Même propriétaire Google possible, moteurs SEO/campagnes séparés.",
   "domaine": "intermédiaire",
   "niveauDeclare": "BLOCKED_EXTERNAL",
   "code": [
    "migrations/0057_shop_preparation_readiness.sql:45"
   ],
   "serviceExecution": "aucun (contrat déclaré dans shop_strategy.connection_contracts)",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "seo.campaign"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": "shared-google-owner",
   "connexionsExistantes": [
    "canal « google » de shop_link côté plateforme"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique (à construire par les agents de la Boutique)"
   ],
   "manques": [
    "contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte",
    "accès externe requis avant toute activation (statut BLOCKED_EXTERNAL)",
    "le moteur « seo.campaign » nommé par le contrat n'existe pas dans le registre des moteurs de la Boutique",
    "aucun émetteur vers la plateforme dans la Boutique (sa règle AGENTS.md : la Boutique n'appelle jamais la plateforme)"
   ],
   "doublons": [],
   "aVerifier": [
    "moteur « seo.campaign » absent du registre de la Boutique"
   ]
  },
  {
   "id": "shop-documents-only",
   "nom": "Références de documents de la Boutique",
   "fonction": "Documents boutique visibles uniquement par rôles autorisés, sans moteur documentaire plateforme.",
   "domaine": "intermédiaire",
   "niveauDeclare": "READY",
   "code": [
    "migrations/0057_shop_preparation_readiness.sql:46"
   ],
   "serviceExecution": "aucun (contrat déclaré dans shop_strategy.connection_contracts)",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "documents"
   ],
   "tests": [],
   "etat": "prepare",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": "shop-documents-only",
   "connexionsExistantes": [
    "canal « documents » de shop_link côté plateforme"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique (à construire par les agents de la Boutique)"
   ],
   "manques": [
    "contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte",
    "aucun émetteur vers la plateforme dans la Boutique (sa règle AGENTS.md : la Boutique n'appelle jamais la plateforme)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shop-intelligence-isolated",
   "nom": "État technique agrégé du système intelligent de la Boutique",
   "fonction": "Tableau d’état agrégé possible sans partage de mémoire ou connaissance.",
   "domaine": "intermédiaire",
   "niveauDeclare": "READY",
   "code": [
    "migrations/0057_shop_preparation_readiness.sql:47"
   ],
   "serviceExecution": "aucun (contrat déclaré dans shop_strategy.connection_contracts)",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "smart.system"
   ],
   "tests": [],
   "etat": "prepare",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": "shop-intelligence-isolated",
   "connexionsExistantes": [
    "canal « etat » de shop_link côté plateforme"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique (à construire par les agents de la Boutique)"
   ],
   "manques": [
    "contrat déclaré dans la base de la Boutique : aucun code d'exécution ne le porte",
    "aucun émetteur vers la plateforme dans la Boutique (sa règle AGENTS.md : la Boutique n'appelle jamais la plateforme)"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "service-access",
   "nom": "Accès de service (jeton, portées, routes /api/service)",
   "fonction": "Accès de service (jeton, portées, routes /api/service)",
   "domaine": "intermédiaire",
   "niveauDeclare": "BUILT",
   "code": [
    "server/service-access.mjs",
    "docs/SHOP-SERVICE-ACCESS-2026-10-02.md"
   ],
   "serviceExecution": "mkapms-shop · serveur Express · routes /api/service/* (jeton de service)",
   "entrees": [
    "/api/service",
    "/api/service-tokens",
    "/api/service-tokens/x/revoke",
    "/api/service-tokens/x/scopes",
    "/api/service/addresses",
    "/api/service/addresses/x",
    "/api/service/audit",
    "/api/service/capabilities",
    "/api/service/commerce/favorites",
    "/api/service/commerce/favorites/x",
    "/api/service/commerce/orders",
    "/api/service/commerce/orders/x",
    "/api/service/commerce/orders/x/cancel",
    "/api/service/commerce/privacy/export",
    "/api/service/commerce/privacy/requests",
    "/api/service/commerce/rfqs",
    "/api/service/commerce/summary",
    "/api/service/commerce/support",
    "/api/service/commerce/team",
    "/api/service/commerce/team/x",
    "/api/service/health",
    "/api/service/login",
    "/api/service/logout",
    "/api/service/password",
    "/api/service/products",
    "/api/service/products/x",
    "/api/service/products/x/apply-parcels",
    "/api/service/products/x/draft",
    "/api/service/products/x/fill-from-supplier",
    "/api/service/products/x/full",
    "/api/service/products/x/media/retire-supplier-versions",
    "/api/service/products/x/media/x/",
    "/api/service/products/x/media/x/brand-analysis",
    "/api/service/products/x/media/x/check-preview",
    "/api/service/products/x/media/x/choose-main",
    "/api/service/products/x/media/x/recheck-brand",
    "/api/service/products/x/media/x/select",
    "/api/service/products/x/parcels",
    "/api/service/products/x/photos",
    "/api/service/products/x/photos/from-url",
    "/api/service/products/x/photos/upload",
    "/api/service/products/x/preview",
    "/api/service/products/x/ready-for-review",
    "/api/service/products/x/shipping-grid",
    "/api/service/products/x/stock-sync",
    "/api/service/products/x/videos",
    "/api/service/products/x/videos/from-url",
    "/api/service/products/x/videos/x/select",
    "/api/service/profile",
    "/api/service/publication/publish",
    "/api/service/recover",
    "/api/service/register",
    "/api/service/selling-prices",
    "/api/service/selling-prices/preview",
    "/api/service/selling-prices/promotions",
    "/api/service/selling-prices/promotions/preview",
    "/api/service/selling-prices/validate",
    "/api/service/session",
    "/api/service/sessions",
    "/api/service/{*path}"
   ],
   "entreesTrouvees": 60,
   "tables": [],
   "dependances": [
    "catalogue"
   ],
   "tests": [
    "tests/service-access.integration.mjs"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "service-access",
   "connexionsExistantes": [
    "canal « catalogue » de shop_link côté plateforme"
   ],
   "connexionsAConstruire": [],
   "manques": [],
   "doublons": [],
   "aVerifier": []
  }
 ],
 "exigences": [
  {
   "nom": "Shop Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "PARTIAL",
    "dashboard": "PARTIAL",
    "tests": "PARTIAL",
    "integration": "PARTIAL"
   },
   "moteurRegistre": "shop.engine",
   "observe": "Supervision des 60 moteurs avec mesures SQL réelles, erreurs explicites, page individuelle, commandes exécutables selon le module et conservation de la lecture lors des actualisations. Orchestration métier complète encore à terminer."
  },
  {
   "nom": "Commerce Kernel",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "commerce.kernel",
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Product Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "product",
   "observe": "CRUD privé Product distinct Offer. Modèle incomplet, pas de publication publique, variantes, fiscalité ou workflow de conformité."
  },
  {
   "nom": "Catalog Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "catalogue",
   "observe": "CRUD privé Product distinct Offer. Modèle incomplet, pas de publication publique, variantes, fiscalité ou workflow de conformité."
  },
  {
   "nom": "Category Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "PARTIAL",
    "service": "MISSING",
    "api": "PARTIAL",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Catégories en DB lues par API, mais pas de CRUD, hiérarchie, attributs/filtres ni taxonomie administrable. Cartes découverte frontend codées autour de deux catégories."
  },
  {
   "nom": "Attribute Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "attribute",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Variant Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "variant",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Brand Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "PARTIAL",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Marque en champ texte produit. Aucun référentiel administrable."
  },
  {
   "nom": "Manufacturer Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "manufacturer",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Offer Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "offer",
   "observe": "CRUD privé Product distinct Offer. Modèle incomplet, pas de publication publique, variantes, fiscalité ou workflow de conformité."
  },
  {
   "nom": "Pricing Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "pricing",
   "observe": "CRUD privé Product distinct Offer. Modèle incomplet, pas de publication publique, variantes, fiscalité ou workflow de conformité."
  },
  {
   "nom": "Inventory Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "inventory",
   "observe": "Observations fournisseur idempotentes et datées. Pas de ledger de stock physique/réservé/entrant/endommagé/retourné par variante/entrepôt."
  },
  {
   "nom": "Warehouse Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "warehouse",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Stock Reservation Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Seller Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "seller",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Supplier Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "supplier",
   "observe": "Registre, liens SKU/offre et observations. Pas de cycle complet fournisseurs, commandes ou orchestration connecteurs."
  },
  {
   "nom": "Supplier Connector Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "supplier.connector",
   "observe": "Déclarations et noms de variables seulement. Aucun adaptateur fournisseur/transporteur réel prêt, ni suite de conformité complète."
  },
  {
   "nom": "Mapping Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aperçu CSV TEST : mapping explicite, GTIN, doublons SKU et erreurs. Aucune application transactionnelle, rapprochement canonique ni autres formats."
  },
  {
   "nom": "Cars4Kids Adapter",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Déclarations et noms de variables seulement. Aucun adaptateur fournisseur/transporteur réel prêt, ni suite de conformité complète."
  },
  {
   "nom": "Cart Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "cart",
   "observe": "Tables singleton Fondateur, pas de propriétaire client. Ne pas ouvrir ces routes aux clients."
  },
  {
   "nom": "Checkout Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "checkout",
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Order Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "order",
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Order Routing Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Dropshipping Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Invoice Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "invoice",
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Document Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "documents",
   "observe": "Ports futurs uniquement. La simulation TEST ne vaut pas moteur intégré au commerce client."
  },
  {
   "nom": "Refund Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "refund",
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Return Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "return",
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Warranty Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "After-Sales Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "after_sales",
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Spare-Part Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Homepage Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Vitrine responsive et navigation initiale. Plusieurs sections uniquement contractuelles, pas de merchandising complet ni destinations commerciales publiées."
  },
  {
   "nom": "Navigation Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Vitrine responsive et navigation initiale. Plusieurs sections uniquement contractuelles, pas de merchandising complet ni destinations commerciales publiées."
  },
  {
   "nom": "Button Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Vitrine responsive et navigation initiale. Plusieurs sections uniquement contractuelles, pas de merchandising complet ni destinations commerciales publiées."
  },
  {
   "nom": "Search Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Contrat multi-modalités ; recherche privée ILIKE titre/marque/SKU limitée à 100. Pas de filtres dynamiques ni d’index dédié."
  },
  {
   "nom": "Search Index Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "PARTIAL",
    "dashboard": "PARTIAL",
    "tests": "PARTIAL",
    "integration": "PARTIAL"
   },
   "moteurRegistre": "search.index",
   "observe": "Index dérivé des publications publiques, reconstruction transactionnelle, recherche plein texte et contrôle de visibilité à chaque résultat. Pilotage réel des requêtes et tâche locale toutes les 60 secondes. Complétude métier globale non certifiée."
  },
  {
   "nom": "Filter Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "filter",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Recommendation Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "recommendation",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Feed Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "feed",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Discovery Video Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Promotion Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "promotion",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Flash Sale Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Coupon Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "coupon",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Favorites Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Tables singleton Fondateur, pas de propriétaire client. Ne pas ouvrir ces routes aux clients."
  },
  {
   "nom": "Customer Accounts",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "PARTIAL",
    "health": "PARTIAL",
    "dashboard": "PARTIAL",
    "tests": "PARTIAL",
    "integration": "PARTIAL"
   },
   "moteurRegistre": "customer",
   "observe": "Inscription, connexion, profil/préférences, adresses, sessions, récupération par code et mot de passe implémentés dans SHOP. Vérification e-mail, favoris/panier/commandes/SAV clients et export/suppression restent manquants. Aucun achat réel."
  },
  {
   "nom": "Shipping Calculation Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "shipping",
   "observe": "Calcul privé par article/colis avec preuves, devis requis et refus. Pas de poids/dimensions/palette, total client ou transporteur."
  },
  {
   "nom": "Logistics Gateway",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Contrats devis et placeholders seulement. Aucun ETA inventé."
  },
  {
   "nom": "Carrier Adapter Registry",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "carrier",
   "observe": "Déclarations et noms de variables seulement. Aucun adaptateur fournisseur/transporteur réel prêt, ni suite de conformité complète."
  },
  {
   "nom": "Tracking Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Delivery Promise Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Contrats devis et placeholders seulement. Aucun ETA inventé."
  },
  {
   "nom": "Multi-Package Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Calcul privé par article/colis avec preuves, devis requis et refus. Pas de poids/dimensions/palette, total client ou transporteur."
  },
  {
   "nom": "Multi-Leg Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Proof-of-Delivery Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Payment Gateway",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "payment.gateway",
   "observe": "Ports futurs uniquement. La simulation TEST ne vaut pas moteur intégré au commerce client."
  },
  {
   "nom": "Card Adapter",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Bank Transfer Adapter",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Instant Transfer Adapter",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Internal Ledger",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "ledger",
   "observe": "Cycle Fondateur TEST uniquement, offres fixes et données shop_sandbox. Aucun parcours client ni raccord au catalogue canonique. Expiration au prochain accès, pas de scheduler."
  },
  {
   "nom": "Payout Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "payout",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Country Engine SHOP",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Ports futurs uniquement. La simulation TEST ne vaut pas moteur intégré au commerce client."
  },
  {
   "nom": "Currency Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Ports futurs uniquement. La simulation TEST ne vaut pas moteur intégré au commerce client."
  },
  {
   "nom": "Tax Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Ports futurs uniquement. La simulation TEST ne vaut pas moteur intégré au commerce client."
  },
  {
   "nom": "Customs Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "customs",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Translation Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Internationalization Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Halal Policy Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Décision globale et refus par défaut testés ; aucun référentiel versionné, revue humaine, preuves par produit/pays ou pipeline de publication."
  },
  {
   "nom": "Legal Product Policy Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Décision globale et refus par défaut testés ; aucun référentiel versionné, revue humaine, preuves par produit/pays ou pipeline de publication."
  },
  {
   "nom": "Product Compliance Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Décision globale et refus par défaut testés ; aucun référentiel versionné, revue humaine, preuves par produit/pays ou pipeline de publication."
  },
  {
   "nom": "Safety/Recall Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Product Rights Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "PARTIAL",
    "service": "MISSING",
    "api": "PARTIAL",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Une URL image et référence de droits ; pas de galerie, vidéos, origine/durée/territoires ou traitement médias."
  },
  {
   "nom": "Product Media Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "PARTIAL",
    "service": "MISSING",
    "api": "PARTIAL",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "media",
   "observe": "Une URL image et référence de droits ; pas de galerie, vidéos, origine/durée/territoires ou traitement médias."
  },
  {
   "nom": "Product Document Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Review Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "review",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Rating Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "rating",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Question/Answer Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "qa",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Notification Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "notification",
   "observe": "Ports futurs uniquement. La simulation TEST ne vaut pas moteur intégré au commerce client."
  },
  {
   "nom": "AI Gateway",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Ancienne connexion centrale fermée par politique, indépendamment des variables historiques. Fournisseur IA propre à SHOP non configuré ; registre modèles, quotas, metering et studio à construire."
  },
  {
   "nom": "Engineering Knowledge",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "MISSING",
    "permissions": "PARTIAL",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "PARTIAL"
   },
   "moteurRegistre": null,
   "observe": "Manifeste Git et snapshot technique privés SHOP. Aucun nouvel envoi central. Copie historique centrale recensée, non supprimée ; mémoire/RAG runtime SHOP non implémentés."
  },
  {
   "nom": "IA Developer Agent",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "developer.agent",
   "observe": "Contrat tâche et éligibilité release seulement. Aucun worker, exécution isolée, correcteur, outillage Git/PR autonome."
  },
  {
   "nom": "Product AI Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Image Processing Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "image.processing",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Omnichannel Commerce Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Enveloppes contractuelles, pas de transport durable/dispatcher ou connecteur de canal."
  },
  {
   "nom": "API Gateway",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Session Fondateur, CSRF, scrypt, headers et audit. Isolation multi-clients absente, events/monitoring par domaine incomplets."
  },
  {
   "nom": "Webhook Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "webhook",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Event Bus",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "PARTIAL"
   },
   "moteurRegistre": null,
   "observe": "Enveloppes et outbox durable locale pour actions clients. Aucun dispatcher, retry worker, livraison externe ni raccord des anciens événements Fondateur."
  },
  {
   "nom": "Queue/Job Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "queue",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Scheduler Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "scheduler",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Cache Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "cache",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Audit Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "audit",
   "observe": "Session Fondateur, CSRF, scrypt, headers et audit. Isolation multi-clients absente, events/monitoring par domaine incomplets."
  },
  {
   "nom": "Security Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "PARTIAL",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Sessions distinctes Fondateur/clients, CSRF, scrypt, headers et audit. Coffre SHOP AES-GCM, réauthentification, rotation/révocation. MFA TOTP Fondateur avec secours à usage unique, anti-rejeu, révocation des anciennes sessions et étape MFA sur mutations du coffre. Activation propriétaire, vérification réseau, audit sécurité complet et restauration restent à valider."
  },
  {
   "nom": "Privacy/Consent Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "privacy",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Analytics Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "analytics",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Business Intelligence Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "business_intelligence",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "SEO Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "seo",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Fraud Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "fraud",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Trust Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "trust",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Moderation Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "moderation",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Data Quality Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aperçu CSV TEST : mapping explicite, GTIN, doublons SKU et erreurs. Aucune application transactionnelle, rapprochement canonique ni autres formats."
  },
  {
   "nom": "Duplicate Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aperçu CSV TEST : mapping explicite, GTIN, doublons SKU et erreurs. Aucune application transactionnelle, rapprochement canonique ni autres formats."
  },
  {
   "nom": "Import Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aperçu CSV TEST : mapping explicite, GTIN, doublons SKU et erreurs. Aucune application transactionnelle, rapprochement canonique ni autres formats."
  },
  {
   "nom": "Export Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "PARTIAL",
    "api": "PARTIAL",
    "permissions": "PARTIAL",
    "audit": "PARTIAL",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Export technique privé ; aucun export commercial ou portabilité client."
  },
  {
   "nom": "Campaign Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": "campaign",
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Loyalty Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Dispute Engine",
   "critere": {
    "contract": "MISSING",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "MISSING",
    "integration": "MISSING"
   },
   "moteurRegistre": null,
   "observe": "Aucune implémentation SHOP identifiée dans les sources auditées."
  },
  {
   "nom": "Product Policy Engine",
   "critere": {
    "contract": "PARTIAL",
    "schema": "MISSING",
    "service": "MISSING",
    "api": "MISSING",
    "permissions": "MISSING",
    "audit": "MISSING",
    "events": "MISSING",
    "health": "MISSING",
    "dashboard": "MISSING",
    "tests": "PARTIAL",
    "integration": "MISSING"
   },
   "moteurRegistre": "product.policy",
   "observe": "Décision globale et refus par défaut testés ; aucun référentiel versionné, revue humaine, preuves par produit/pays ou pipeline de publication."
  }
 ],
 "exigencesSansMoteur": [
  "Category Engine",
  "Brand Engine",
  "Stock Reservation Engine",
  "Mapping Engine",
  "Cars4Kids Adapter",
  "Order Routing Engine",
  "Dropshipping Engine",
  "Warranty Engine",
  "Spare-Part Engine",
  "Homepage Engine",
  "Navigation Engine",
  "Button Engine",
  "Search Engine",
  "Discovery Video Engine",
  "Flash Sale Engine",
  "Favorites Engine",
  "Logistics Gateway",
  "Tracking Engine",
  "Delivery Promise Engine",
  "Multi-Package Engine",
  "Multi-Leg Engine",
  "Proof-of-Delivery Engine",
  "Card Adapter",
  "Bank Transfer Adapter",
  "Instant Transfer Adapter",
  "Country Engine SHOP",
  "Currency Engine",
  "Tax Engine",
  "Translation Engine",
  "Internationalization Engine",
  "Halal Policy Engine",
  "Legal Product Policy Engine",
  "Product Compliance Engine",
  "Safety/Recall Engine",
  "Product Rights Engine",
  "Product Document Engine",
  "AI Gateway",
  "Engineering Knowledge",
  "Product AI Engine",
  "Omnichannel Commerce Engine",
  "API Gateway",
  "Event Bus",
  "Security Engine",
  "Data Quality Engine",
  "Duplicate Engine",
  "Import Engine",
  "Export Engine",
  "Loyalty Engine",
  "Dispute Engine"
 ],
 "moteursSansExigence": [
  "keyword",
  "publisher",
  "seller.publication",
  "seo.indexing",
  "ai.discovery",
  "booster",
  "audience",
  "event.marketing",
  "order.communication",
  "payment.individual",
  "payment.pro",
  "payment.subscription",
  "payment.country",
  "payment.internal",
  "payment",
  "supplier.adapter.template",
  "quote",
  "routing",
  "subscription",
  "video.publisher",
  "smart.system",
  "vault",
  "legal.content",
  "faq",
  "contact",
  "communication",
  "shopify.adapter"
 ],
 "contrats": [
  {
   "id": "main-to-shop-entry",
   "moteur": "access.entry",
   "statut": "READY",
   "source": "MKA.P-MS Platform",
   "cible": "MKA.P-MS SHOP"
  },
  {
   "id": "shared-stripe-account",
   "moteur": "payment",
   "statut": "BLOCKED_EXTERNAL",
   "source": "MKA.P-MS Group Stripe",
   "cible": "MKA.P-MS SHOP"
  },
  {
   "id": "shared-google-owner",
   "moteur": "seo.campaign",
   "statut": "BLOCKED_EXTERNAL",
   "source": "MKA.P-MS Google Owner",
   "cible": "MKA.P-MS SHOP"
  },
  {
   "id": "shop-documents-only",
   "moteur": "documents",
   "statut": "READY",
   "source": "MKA.P-MS SHOP",
   "cible": "MKA.P-MS Platform"
  },
  {
   "id": "shop-intelligence-isolated",
   "moteur": "smart.system",
   "statut": "READY",
   "source": "MKA.P-MS SHOP",
   "cible": "MKA.P-MS Platform"
  }
 ]
};
