/**
 * Inventaire des moteurs de la plateforme principale (dépôt mkapms-web).
 *
 * Fichier GÉNÉRÉ par scripts/gen-frontier-inventaire.ts — ne pas éditer à la main.
 * Relevé en lecture seule, daté et lié à un commit exact (voir `source`).
 */
import type { InventairePlateforme } from "./types.js";

export const INVENTAIRE_PLATEFORME: InventairePlateforme = {
 "source": {
  "depot": "projet-Auto-plus-Africa-MKAPMS/mkapms-web",
  "commit": "03fffde3b76450ade43d25e4fa17451bbe6a7909",
  "dateCommit": "2026-10-09T00:13:38+00:00",
  "genereLe": "2026-10-09",
  "fichiersLus": [
   "server/data/moteurs.ts",
   "server/engine-registry/catalog.ts",
   "server/<dossier>/**/*.test.ts"
  ]
 },
 "moteurs": [
  {
   "id": "account_routing",
   "nom": "Account Routing Engine",
   "fonction": "Retour automatique de chaque compte dans son univers : particulier, vendeur, garage, location, VTC/Taxi, pièces, livraison, administration, direction, PDG.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/account-routing/",
    "server/router.ts (routeur « accountRouting »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "accountRouting"
   ],
   "entreesTrouvees": 4,
   "tables": [],
   "dependances": [
    "core",
    "identity",
    "permission"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "accounting_internal",
   "nom": "Internal Accounting Engine",
   "fonction": "Comptabilité interne MKA.P-MS : rapprochement paiement ↔ écriture, commissions, remboursements, abonnements, écarts.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/accounting-internal/",
    "server/router.ts (routeur « accountingInternal »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "accountingInternal"
   ],
   "entreesTrouvees": 4,
   "tables": [
    "compta_rapprochements"
   ],
   "dependances": [
    "comptabilite",
    "core",
    "payment",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "accounting_marketplace",
   "nom": "Accounting Marketplace Engine",
   "fonction": "Annuaire de comptables indépendants (« je cherche un comptable ») : pays, ville, spécialité, langue, disponibilité, note. Aucun accès aux comptes internes.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/accounting-marketplace/",
    "server/router.ts (routeur « accountingMarketplace »)",
    "server/router.ts (routeur « cabinets »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "accountingMarketplace",
    "cabinets"
   ],
   "entreesTrouvees": 7,
   "tables": [
    "accountant_profiles",
    "accountant_requests"
   ],
   "dependances": [
    "core",
    "country",
    "identity"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "achat",
   "nom": "Univers Achat Engine",
   "fonction": "Univers Achat : parcours acheteur, filtres, favoris, mise en relation.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/routers/annonces.ts/",
    "server/routers/favoris.ts/",
    "server/routers/reservations.ts/",
    "server/routers/devis.ts/",
    "server/router.ts (routeur « annonces »)",
    "server/router.ts (routeur « favoris »)",
    "server/router.ts (routeur « reservations »)",
    "server/router.ts (routeur « devis »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "annonces",
    "favoris",
    "reservations",
    "devis"
   ],
   "entreesTrouvees": 27,
   "tables": [],
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
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "achat_officiel",
   "nom": "Achat Officiel Engine",
   "fonction": "Sous-section Achat Officiel MKA.P-MS (stock officiel).",
   "domaine": "sous_section",
   "niveauDeclare": "staging",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
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
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "achat_particulier",
   "nom": "Achat Particulier Engine",
   "fonction": "Sous-section Achat Particulier — isolable (location/vente à un opérateur).",
   "domaine": "sous_section",
   "niveauDeclare": "staging",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
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
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "achat_pro",
   "nom": "Achat Professionnel Engine",
   "fonction": "Sous-section Achat Professionnel (vendeurs pros).",
   "domaine": "sous_section",
   "niveauDeclare": "staging",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
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
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "activation_audit",
   "nom": "Audit d'activation",
   "fonction": "Vérifie domaine par domaine ce qui est réellement connecté, activé, accessible, utilisé et prouvé par un test — le code existant ne suffit jamais à déclarer une fonction terminée.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/activation-audit/",
    "server/router.ts (routeur « activationAudit »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "activationAudit"
   ],
   "entreesTrouvees": 7,
   "tables": [
    "activation_audit_items",
    "activation_audit_runs",
    "activation_test_evidence"
   ],
   "dependances": [
    "core",
    "redirection",
    "smart"
   ],
   "tests": [
    "server/activation-audit/__tests__/activation-audit.test.ts",
    "server/activation-audit/__tests__/causes.test.ts",
    "server/activation-audit/__tests__/routeurs-partages.test.ts"
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
   "id": "ai_fabric",
   "nom": "Fabrique Intelligence",
   "fonction": "Couche entre MKA.P-MS et les fournisseurs externes : routage par capacité, confidentialité et coût, suivi des dépenses, sauvegarde de la mémoire intelligente et supervision de tous les moteurs.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/ai-fabric/",
    "server/router.ts (routeur « aiFabric »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "aiFabric"
   ],
   "entreesTrouvees": 15,
   "tables": [
    "af_cost_entries",
    "af_memory_backups",
    "af_providers",
    "af_routes"
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
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×6",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "ai_learning",
   "nom": "Apprentissage Intelligence",
   "fonction": "Supervision de l'apprentissage des Intelligences.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/ai-learning-os/",
    "server/router.ts (routeur « aiLearningOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "aiLearningOs"
   ],
   "entreesTrouvees": 6,
   "tables": [],
   "dependances": [
    "core",
    "identity",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "sans_ecran ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "analytics",
   "nom": "Analytics Engine",
   "fonction": "Analyse d'usage et comportement (recherches, activité, parcours).",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/modules/history.ts/",
    "server/routers/historique.ts/",
    "server/routers/statistiques.ts/",
    "server/router.ts (routeur « historique »)",
    "server/router.ts (routeur « statistiques »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "historique",
    "statistiques"
   ],
   "entreesTrouvees": 8,
   "tables": [
    "signalements",
    "suggestions",
    "vehicle_report_payments",
    "vehicle_reports",
    "vin_checks"
   ],
   "dependances": [
    "achat",
    "core",
    "monitoring",
    "redirection",
    "seo",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×3",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "assurance",
   "nom": "Assurance Engine",
   "fonction": "Devis assurance, contrats, sinistres, partenaires.",
   "domaine": "service",
   "niveauDeclare": "active",
   "code": [
    "server/insurance-engine/",
    "server/router.ts (routeur « insuranceEngine »)",
    "server/router.ts (routeur « insurance »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "insuranceEngine",
    "insurance"
   ],
   "entreesTrouvees": 9,
   "tables": [
    "insurance_partners",
    "insurance_quote_requests"
   ],
   "dependances": [
    "core",
    "identity",
    "notification"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "atelier",
   "nom": "Moteur d'Atelier",
   "fonction": "Capacités serveur de l'atelier : validation interne et contrôle qualité opposables, stock de pièces avec un mouvement par écriture, réapprovisionnement gouverné (seuil → proposition persistante → décision humaine → commande fournisseur sous plafond mensuel → réception en stock), report de rendez-vous tracé. Chaque écriture est publiée à l'Event Bus, supervisée par le Système Intelligent et mémorisée par MKA.P-MS AI.",
   "domaine": "service",
   "niveauDeclare": "active",
   "code": [
    "server/atelier-engine/",
    "server/router.ts (routeur « atelierEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "atelierEngine"
   ],
   "entreesTrouvees": 20,
   "tables": [
    "atelier_commandes_fournisseur",
    "atelier_rdv_reports",
    "atelier_reappro_propositions",
    "atelier_reappro_reglages",
    "atelier_stock",
    "atelier_stock_mouvements",
    "atelier_validations"
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
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "bouton_sans_action ×5",
    "ecran_sans_contenu ×2",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "auction_engine",
   "nom": "Auction Engine",
   "fonction": "Moteur d'enchères particuliers et professionnels : lots (catalogue et enchères en direct), offres validées côté serveur, prix de réserve, anti-sniping, adjudication, historique et notifications.",
   "domaine": "service",
   "niveauDeclare": "active",
   "code": [
    "server/auction-engine/",
    "server/router.ts (routeur « auctionEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "auctionEngine"
   ],
   "entreesTrouvees": 15,
   "tables": [
    "auction_bids",
    "auction_events",
    "auctions"
   ],
   "dependances": [
    "core",
    "country",
    "notification",
    "payment",
    "visibility"
   ],
   "tests": [
    "server/auction-engine/__tests__/auction-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "audit",
   "nom": "Audit OS",
   "fonction": "Journal d'audit centralisé, requêtes et statistiques.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/audit-os/",
    "server/audit.ts/",
    "server/router.ts (routeur « auditOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "auditOs"
   ],
   "entreesTrouvees": 6,
   "tables": [],
   "dependances": [
    "core",
    "identity"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "auto_branchement",
   "nom": "Module d'auto-branchement",
   "fonction": "Relit l'inventaire généré des éléments cliquables de tous les écrans, revérifie chaque destination auprès du Moteur de Redirection, et remet chaque défaut à l'Event Bus, au Système Intelligent et à MKA.P-MS AI. Il constate et propose : il ne modifie jamais le code de production.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/auto-branchement/",
    "server/data/cliquables.ts/",
    "server/router.ts (routeur « autoBranchement »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "autoBranchement"
   ],
   "entreesTrouvees": 7,
   "tables": [],
   "dependances": [
    "boutons",
    "core",
    "event_bus",
    "intelligences",
    "redirection",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "avis_reputation",
   "nom": "Reviews & Reputation Engine",
   "fonction": "Avis multi-univers par pays, expériences vérifiées après transaction réelle, réponses professionnelles et officielles, réputation consolidée.",
   "domaine": "service",
   "niveauDeclare": "active",
   "code": [
    "server/reputation-engine/",
    "server/modules/reviews.ts/",
    "server/routers/reviews.ts/",
    "server/routers/reviewsV2.ts/",
    "server/routers/app-feedback.ts/",
    "server/router.ts (routeur « reputationEngine »)",
    "server/router.ts (routeur « reviews »)",
    "server/router.ts (routeur « appFeedback »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "reputationEngine",
    "reviews",
    "appFeedback"
   ],
   "entreesTrouvees": 60,
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
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1",
    "dependance_sans_preuve ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "backup",
   "nom": "Backup & Recovery OS",
   "fonction": "Sauvegardes et restauration contrôlée.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/backup-os/",
    "server/router.ts (routeur « backupOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "backupOs"
   ],
   "entreesTrouvees": 10,
   "tables": [
    "backup_restore_requests",
    "backup_snapshots"
   ],
   "dependances": [
    "core",
    "identity"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "boutons",
   "nom": "Moteur de boutons",
   "fonction": "Chaque bouton déclare un code d'action ; le moteur donne l'action à exécuter, résoud la destination via le Moteur de Redirection, signale chaque clic et publie « bouton.sans_action » au Système Intelligent quand l'action mène au vide.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/button-engine/",
    "server/data/boutons-sans-action.ts/",
    "server/router.ts (routeur « buttonEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "buttonEngine"
   ],
   "entreesTrouvees": 3,
   "tables": [],
   "dependances": [
    "core",
    "event_bus",
    "redirection",
    "smart"
   ],
   "tests": [
    "server/button-engine/__tests__/button-engine.test.ts",
    "server/button-engine/__tests__/diagnostic.test.ts"
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
   "id": "cartegrise",
   "nom": "Carte Grise Engine",
   "fonction": "Démarches SIV, documents, statuts, suivi.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/cartegrise.ts/",
    "server/modules/cartegrise-catalogue.ts/",
    "server/routers/cartegrise.ts/",
    "server/router.ts (routeur « carteGrise »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "carteGrise"
   ],
   "entreesTrouvees": 22,
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
   "dependances": [
    "audit",
    "boutons",
    "core",
    "document",
    "identity",
    "notification",
    "payment"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×14",
    "bouton_declare_absent_ecran ×1",
    "dependance_non_declaree ×1",
    "dependance_sans_preuve ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "code_graph",
   "nom": "Mémoire technique du code (Code Knowledge Graph)",
   "fonction": "Relit le code réel et relie service → moteur → fichiers → API → tables → événements → permissions → tests → dépendances. Il observe les changements d'un relevé à l'autre et mémorise les corrections des autres agents par classe d'anomalie. Un relevé non généré est signalé, jamais remplacé par une supposition.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/code-graph/",
    "server/router.ts (routeur « codeGraph »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "codeGraph"
   ],
   "entreesTrouvees": 9,
   "tables": [
    "cg_edges",
    "cg_lessons",
    "cg_nodes",
    "cg_observations",
    "cg_snapshots"
   ],
   "dependances": [
    "continuous_test",
    "core",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "command_center",
   "nom": "Command & Development Center",
   "fonction": "Commandes écrites et vocales transformées en actions structurées et journalisées, dossiers de l'agent développeur passant obligatoirement par le pipeline avant production.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/command-center/",
    "server/router.ts (routeur « commandCenter »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "commandCenter"
   ],
   "entreesTrouvees": 14,
   "tables": [
    "cc_commands",
    "cc_dev_requests",
    "cc_voice_sessions"
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
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "completion_center",
   "nom": "Completion Center (ce qui reste à faire)",
   "fonction": "Applique la règle TERMINÉ (construit + connecté + activé + testé + observable + inscrit au registre + rapporté au Système Intelligent + non-régression vérifiée + preuve de résultat) domaine par domaine, et publie la liste exacte des tâches restantes. Un pourcentage est une part de maillons prouvés, jamais une estimation.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/completion/",
    "server/router.ts (routeur « completion »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "completion"
   ],
   "entreesTrouvees": 7,
   "tables": [
    "cp_domain_verdicts",
    "cp_snapshots",
    "cp_work_reports"
   ],
   "dependances": [
    "activation_audit",
    "continuous_test",
    "core",
    "resilience",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "comptabilite",
   "nom": "Comptabilité Engine",
   "fonction": "Factures, paiements, TVA, rapports. La vue PDG/comptabilité des contrats d'investissement (/comptabilite/investissement) lit directement l'Investment Engine, jamais une seconde source de vérité.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/comptabilite.ts/",
    "server/routers/comptabilite.ts/",
    "server/router.ts (routeur « comptabilite »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "comptabilite"
   ],
   "entreesTrouvees": 16,
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
   "dependances": [
    "auction_engine",
    "core",
    "identity",
    "investment",
    "payment",
    "redirection"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "bouton_sans_action ×2",
    "dependance_non_declaree ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "connaissance_auto",
   "nom": "Automotive Knowledge Engine",
   "fonction": "Mémoire automobile reliée, datée et sourcée : véhicules, motorisations, pièces, diagnostics, réglementation. Une connaissance n'est jamais publiée sans décision du PDG.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/knowledge-engine/",
    "server/router.ts (routeur « knowledgeEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "knowledgeEngine"
   ],
   "entreesTrouvees": 20,
   "tables": [
    "ake_discoveries",
    "ake_edges",
    "ake_nodes",
    "ake_provenance",
    "ake_sources",
    "ake_watch_runs"
   ],
   "dependances": [
    "core",
    "country",
    "smart"
   ],
   "tests": [
    "server/knowledge-engine/__tests__/referentiel-automobile.test.ts"
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
   "id": "connecteur_google_business",
   "nom": "Connecteur Google Business Profile",
   "fonction": "Rattachement des établissements physiques éligibles et relevé séparé de leur réputation Google. Avis internes et avis Google restent distincts.",
   "domaine": "service",
   "niveauDeclare": "staging",
   "code": [
    "server/connectors/google-business/",
    "server/router.ts (routeur « googleBusiness »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "googleBusiness"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "gbp_locations",
    "gbp_review_snapshots"
   ],
   "dependances": [
    "avis_reputation",
    "core"
   ],
   "tests": [
    "server/connectors/google-business/__tests__/google-business.test.ts"
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
   "id": "continuous_test",
   "nom": "Contrôle continu de la plateforme",
   "fonction": "Exécute réellement des contrôles sur la plateforme en service et dépose la preuve datée qui autorise un domaine à passer au vert. Un contrôle non exécutable est marqué ignoré, jamais réussi, et un contrôle qui passait puis échoue est signalé comme régression.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/continuous-test/",
    "server/router.ts (routeur « continuousTest »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "continuousTest"
   ],
   "entreesTrouvees": 9,
   "tables": [
    "ct_results",
    "ct_runs"
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
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "contract",
   "nom": "Contrat OS",
   "fonction": "Cycle de vie des contrats : brouillon, signature, échéances, résiliation.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/contract-os/",
    "server/routers/contracts.ts/",
    "server/modules/contracts.ts/",
    "server/router.ts (routeur « contractOs »)",
    "server/router.ts (routeur « contracts »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "contractOs",
    "contracts"
   ],
   "entreesTrouvees": 16,
   "tables": [
    "contract_terms",
    "document_signatures",
    "generated_documents"
   ],
   "dependances": [
    "core",
    "document",
    "identity",
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
    "ecran_sans_contenu ×2",
    "dependance_sans_preuve ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "controle_technique",
   "nom": "Contrôle Technique Engine",
   "fonction": "Aucun registre officiel de contrôle technique accessible aujourd'hui : le statut CT n'est jamais affiché comme connu. Prise de RDV réelle (devisRouter) et historique des demandes réellement envoyées ; centres agréés, résultats officiels et rappels d'échéance restent à construire (Phase 2, dépend d'un accès externe).",
   "domaine": "service",
   "niveauDeclare": "staging",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "achat",
    "core",
    "identity",
    "notification",
    "payment",
    "scheduler"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×4",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "core",
   "nom": "Core Engine",
   "fonction": "Orchestrateur central : registre, événements, coordination. Socle des autres moteurs : ce sont eux qui dépendent de lui, pas l'inverse.",
   "domaine": "core",
   "niveauDeclare": "active",
   "code": [
    "server/engine-registry/",
    "server/central-engines/",
    "server/db.ts/",
    "server/domain.ts/",
    "server/env.ts/",
    "server/index.ts/",
    "server/migrate.ts/",
    "server/reference.ts/",
    "server/router.ts/",
    "server/schema.ts/",
    "server/seed.ts/",
    "server/trpc.ts/",
    "server/types/",
    "server/data/moteurs.ts/",
    "server/modules/core.ts/",
    "server/modules/coreEngine.ts/",
    "server/routers/coreEngine.ts/",
    "server/routers/modules.ts/",
    "server/routers/admin.ts/",
    "server/routers/meta.ts/",
    "server/router.ts (routeur « coreEngine »)",
    "server/router.ts (routeur « engineRegistry »)",
    "server/router.ts (routeur « centralEngines »)",
    "server/router.ts (routeur « modules »)",
    "server/router.ts (routeur « admin »)",
    "server/router.ts (routeur « meta »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "coreEngine",
    "engineRegistry",
    "centralEngines",
    "modules",
    "admin",
    "meta"
   ],
   "entreesTrouvees": 109,
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
   "tests": [
    "server/engine-registry/__tests__/business-dashboard.test.ts",
    "server/engine-registry/__tests__/dependency-evidence.test.ts",
    "server/engine-registry/__tests__/dependency-persistence.test.ts",
    "server/engine-registry/__tests__/orphan-retirement.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "bouton_declare_absent_ecran ×2",
    "dependance_non_declaree ×5"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "country",
   "nom": "Country OS",
   "fonction": "Registre mondial des pays (langues, devises, TVA, univers actifs) — configuration pure.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/country-os/",
    "server/routers/currency.ts/",
    "server/data/world.ts/",
    "server/router.ts (routeur « country »)",
    "server/router.ts (routeur « countries »)",
    "server/router.ts (routeur « currency »)",
    "server/router.ts (routeur « platformMap »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "country",
    "countries",
    "currency",
    "platformMap"
   ],
   "entreesTrouvees": 11,
   "tables": [
    "country_countries",
    "country_currencies",
    "country_google_capabilities",
    "country_health_log"
   ],
   "dependances": [
    "boutons",
    "core",
    "identity"
   ],
   "tests": [
    "server/country-os/__tests__/acces-pdg.test.ts",
    "server/country-os/__tests__/country-language-app-router.test.ts",
    "server/country-os/__tests__/google-capabilities.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×21",
    "dependance_non_declaree ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "depannage",
   "nom": "Dépannage Engine",
   "fonction": "Demandes d'intervention, affectation, suivi.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/depannage.ts/",
    "server/routers/depannage.ts/",
    "server/router.ts (routeur « depannage »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "depannage"
   ],
   "entreesTrouvees": 9,
   "tables": [
    "breakdown_missions",
    "breakdown_providers",
    "breakdown_quotes",
    "breakdown_requests"
   ],
   "dependances": [
    "avis_reputation",
    "core",
    "identity",
    "notification",
    "payment"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "document",
   "nom": "Document OS",
   "fonction": "Registre unifié : factures, contrats, devis, bons de commande, attestations. Templates multi-langues par pays.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/document-os/",
    "server/router.ts (routeur « documentOs »)",
    "server/router.ts (routeur « documents »)",
    "server/router.ts (routeur « dossiers »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "documentOs",
    "documents",
    "dossiers"
   ],
   "entreesTrouvees": 16,
   "tables": [
    "doc_document_history",
    "doc_documents",
    "doc_health_log",
    "doc_legal_entities",
    "doc_templates",
    "doc_types"
   ],
   "dependances": [
    "boutons",
    "core",
    "country",
    "identity",
    "language"
   ],
   "tests": [
    "server/document-os/__tests__/legal-entities.test.ts",
    "server/document-os/__tests__/linked-entity.test.ts",
    "server/document-os/__tests__/templates.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "shop-documents-only",
   "connexionsExistantes": [
    "face à « Références de documents de la Boutique » : canal « documents » de shop_link (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×1",
    "dependance_non_declaree ×1"
   ],
   "doublons": [
    "même racine de nom que document_engine (à vérifier : deux moteurs pour une fonction ?)"
   ],
   "aVerifier": []
  },
  {
   "id": "document_engine",
   "nom": "Document Engine",
   "fonction": "LOT 6 du Plan Maître Fournisseurs (§33-35) : Supplier Document Engine (conventions/annexes/RGPD), Vehicle Document Engine (contrôle technique/COC/garantie/export/douane) et Document Custody Engine (original/copie, détenteur, remise tracée, blocage d'étape par document manquant). Consomme le Document OS existant comme registre unique — n'en recrée aucun.",
   "domaine": "transversal",
   "niveauDeclare": "staging",
   "code": [
    "server/document-engine/",
    "server/router.ts (routeur « documentEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "documentEngine"
   ],
   "entreesTrouvees": 18,
   "tables": [
    "custody_records",
    "custody_requirements",
    "document_engine_audit_log",
    "document_engine_health_log",
    "supplier_documents",
    "vehicle_documents"
   ],
   "dependances": [
    "audit",
    "core",
    "document",
    "event_bus",
    "identity",
    "payout_engine",
    "permission",
    "smart",
    "supplier_engine",
    "vehicle_engine"
   ],
   "tests": [
    "server/document-engine/__tests__/document-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×3",
    "dependance_sans_preuve ×2",
    "sans_ecran ×1"
   ],
   "doublons": [
    "même racine de nom que document (à vérifier : deux moteurs pour une fonction ?)"
   ],
   "aVerifier": []
  },
  {
   "id": "energie_recharge",
   "nom": "Energy Engine — Recharge",
   "fonction": "Annuaire des bornes de recharge : recherche filtrée, déclarations validées par un humain.",
   "domaine": "service",
   "niveauDeclare": "active",
   "code": [
    "server/charging-engine/",
    "server/router.ts (routeur « chargingEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "chargingEngine"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "charging_points"
   ],
   "dependances": [
    "core",
    "country",
    "notification"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "estimation",
   "nom": "Estimation Hub",
   "fonction": "Coût total d'acquisition assemblé à partir des moteurs existants.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/estimation-hub/",
    "server/router.ts (routeur « estimation »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "estimation"
   ],
   "entreesTrouvees": 2,
   "tables": [],
   "dependances": [
    "core",
    "event_bus",
    "livraison_vehicule",
    "pieces",
    "risque_import",
    "smart",
    "vo_engine"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "event_bus",
   "nom": "Bus d'événements central",
   "fonction": "Achemine réellement les événements entre moteurs : abonnés résolus, traitement exécuté, remise enregistrée avec sa durée et son erreur. Un événement que personne n'écoute est affiché comme orphelin au lieu de rester en attente pour toujours.",
   "domaine": "core",
   "niveauDeclare": "active",
   "code": [
    "server/event-bus/",
    "server/router.ts (routeur « eventBus »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "eventBus"
   ],
   "entreesTrouvees": 7,
   "tables": [
    "eb_deliveries",
    "eb_dispatch_runs",
    "eb_subscriptions"
   ],
   "dependances": [
    "audit",
    "core",
    "document_engine",
    "intelligences",
    "logistics_engine",
    "payout_engine",
    "product_engine",
    "seo",
    "smart",
    "vehicle_engine"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "emission_dynamique ×1",
    "dependance_non_declaree ×4",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "finance",
   "nom": "Financement Engine",
   "fonction": "LOA : éligibilité pays réelle avant tout contrat (Country Policy Engine, domaine réglementé « credit ») — aucun taux ni mensualité inventés, une simulation n'est créée que si une règle pays confirmée autorise le crédit. Paiement fractionné : moteur distinct et déjà réel (routers/installments.ts, payment), jamais dupliqué ici. Centres agréés, résultats officiels et dossier complet restent Phase 2.",
   "domaine": "service",
   "niveauDeclare": "staging",
   "code": [
    "server/modules/financeplus.ts/",
    "server/routers/financeplus.ts/",
    "server/router.ts (routeur « financeplus »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "financeplus"
   ],
   "entreesTrouvees": 5,
   "tables": [
    "finplus_action_logs",
    "finplus_contrats",
    "finplus_documents",
    "finplus_notifications",
    "finplus_paiements",
    "finplus_vehicules"
   ],
   "dependances": [
    "accounting_internal",
    "achat",
    "core",
    "document",
    "identity",
    "payment",
    "politique_pays"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×1",
    "bouton_sans_action ×1",
    "dependance_non_declaree ×1",
    "dependance_sans_preuve ×2",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "financial_intelligence",
   "nom": "Financial Intelligence Engine",
   "fonction": "Surveillance financière autonome : paiement échoué, double paiement, remboursement, facture manquante, abonnement expiré, commande sans paiement, montant ou devise incohérents.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/financial-intelligence/",
    "server/router.ts (routeur « financialIntelligence »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "financialIntelligence"
   ],
   "entreesTrouvees": 5,
   "tables": [
    "finance_anomalies"
   ],
   "dependances": [
    "comptabilite",
    "core",
    "notification",
    "payment"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×2",
    "sans_ecran ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "frontier_os",
   "nom": "Centre Cyber-Électrique MKA.P-MS / Frontier OS",
   "fonction": "Centre de contrôle, sécurité, réparation et pilotage entre plateformes : lignes, interrupteurs, pointages, paires de contrôle, atelier, mémoire, journal.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/frontier-os/",
    "server/router.ts (routeur « frontierOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "frontierOs"
   ],
   "entreesTrouvees": 48,
   "tables": [],
   "dependances": [
    "core",
    "document",
    "identity",
    "payment",
    "permission",
    "scheduler",
    "shop_link"
   ],
   "tests": [
    "server/frontier-os/__tests__/atelier.integration.test.ts",
    "server/frontier-os/__tests__/base.integration.test.ts",
    "server/frontier-os/__tests__/chaine.integration.test.ts",
    "server/frontier-os/__tests__/fondation.integration.test.ts",
    "server/frontier-os/__tests__/gouvernance.integration.test.ts",
    "server/frontier-os/__tests__/inventaire.test.ts",
    "server/frontier-os/__tests__/pannes.integration.test.ts",
    "server/frontier-os/__tests__/protocole.integration.test.ts",
    "server/frontier-os/__tests__/regles.test.ts",
    "server/frontier-os/__tests__/routeur.integration.test.ts",
    "server/frontier-os/__tests__/transport.integration.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [
    "lit le câble de shop_link et le registre central (lecture seule)"
   ],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×4"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "garage",
   "nom": "Garage Engine",
   "fonction": "Fiches garage, devis, réservations, interventions.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/routers/garages.ts/",
    "server/router.ts (routeur « garages »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "garages"
   ],
   "entreesTrouvees": 12,
   "tables": [],
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
    "scheduler",
    "support",
    "visibility"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "bouton_sans_action ×8",
    "ecran_sans_contenu ×4",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "identity",
   "nom": "Identity OS",
   "fonction": "Identités, sessions, MFA TOTP, vérifications, agents Intelligence, audit — 34 procédures.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/identity-os/",
    "server/auth.ts/",
    "server/routers/auth.ts/",
    "server/routers/kyc.ts/",
    "server/modules/kyc-decision.ts/",
    "server/account-deletion/",
    "server/user-preferences/",
    "server/router.ts (routeur « auth »)",
    "server/router.ts (routeur « identity »)",
    "server/router.ts (routeur « kyc »)",
    "server/router.ts (routeur « suppressionCompte »)",
    "server/router.ts (routeur « preferencesUtilisateur »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "auth",
    "identity",
    "kyc",
    "suppressionCompte",
    "preferencesUtilisateur"
   ],
   "entreesTrouvees": 42,
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
   "dependances": [
    "account_routing",
    "achat",
    "audit",
    "core",
    "country",
    "depannage",
    "garage",
    "intelligences",
    "language",
    "media_authenticity",
    "messaging",
    "notification",
    "payment",
    "pieces",
    "pro_portal",
    "search",
    "smart",
    "support"
   ],
   "tests": [
    "server/identity-os/__tests__/app-router.test.ts",
    "server/identity-os/__tests__/contract.test.ts",
    "server/identity-os/__tests__/crypto.test.ts",
    "server/identity-os/__tests__/router.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×6",
    "bouton_sans_action ×1",
    "dependance_non_declaree ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "importafrica",
   "nom": "Import Afrique Engine",
   "fonction": "Véhicules, pays, transport, douane, suivi.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/importafrica.ts/",
    "server/routers/importafrica.ts/",
    "server/router.ts (routeur « importAfrica »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "importAfrica"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "customs_steps",
    "import_documents",
    "import_quotes",
    "import_requests",
    "import_transport",
    "import_vehicles",
    "warehouses"
   ],
   "dependances": [
    "core",
    "country",
    "document",
    "identity",
    "payment"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×3",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "indexation",
   "nom": "Moniteur d'indexation",
   "fonction": "Contrôle URL par URL ce que le serveur répond réellement (statut, robots, canonical, sitemap, contenu, données structurées) et refuse de confondre une soumission avec une indexation Google.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/indexation/",
    "server/site-verification/",
    "server/router.ts (routeur « indexation »)",
    "server/router.ts (routeur « siteVerification »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "indexation",
    "siteVerification"
   ],
   "entreesTrouvees": 10,
   "tables": [
    "indexation_audits",
    "indexation_url_checks",
    "indexation_watch"
   ],
   "dependances": [
    "audit",
    "core",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "intelligences",
   "nom": "MKA.P-MS AI",
   "fonction": "Seule couche qui appelle réellement un fournisseur de modèle. Deux côtés séparés côté serveur : direction (PDG seul — contexte interne, commandes, écriture de code proposée) et public (assistant automobile encadré, sans accès interne). Chaque échange conserve fournisseur, modèle, jetons, durée et motif d'échec ; un appel impossible affiche sa cause au lieu d'une réponse fabriquée.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/intelligences/",
    "server/governance/",
    "server/estimate-gateway/",
    "server/market-price-intelligence/",
    "server/router.ts (routeur « intelligences »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "intelligences"
   ],
   "entreesTrouvees": 123,
   "tables": [
    "gv_audits",
    "gv_dependencies",
    "gv_settings_etat",
    "gv_versions",
    "in_actions",
    "in_appels",
    "in_autonomie",
    "in_autonomie_journal",
    "in_capacite_etat",
    "in_chantier_executions",
    "in_chantier_previews",
    "in_coffre_acces",
    "in_coffre_secrets",
    "in_connaissance",
    "in_conversation_resume",
    "in_deploiements",
    "in_deploy_approvers",
    "in_dev_appels",
    "in_dev_cles",
    "in_domaines",
    "in_empreintes",
    "in_experiences",
    "in_fichier_morceaux",
    "in_fichiers",
    "in_fonctions",
    "in_media_productions",
    "in_memoire",
    "in_memoire_projet",
    "in_memoire_utilisateur",
    "in_messages",
    "in_mission_etapes",
    "in_missions",
    "in_outils_journal",
    "in_permissions",
    "in_plan_autonomie",
    "in_projets",
    "in_retrieval_audit",
    "in_sessions",
    "in_shadow",
    "in_shadow_runs",
    "in_sondes_openai",
    "in_usage"
   ],
   "dependances": [
    "achat",
    "ai_fabric",
    "code_graph",
    "command_center",
    "completion_center",
    "connaissance_auto",
    "continuous_test",
    "core",
    "country",
    "document",
    "estimation",
    "event_bus",
    "identity",
    "livraison",
    "livraison_vehicule",
    "monitoring",
    "payment",
    "product_engine",
    "resilience",
    "risque_import",
    "shop_link",
    "smart",
    "support",
    "vo_engine"
   ],
   "tests": [
    "server/intelligences/__tests__/agent-autonome.test.ts",
    "server/intelligences/__tests__/apprentissage-travail.test.ts",
    "server/intelligences/__tests__/boutique.test.ts",
    "server/intelligences/__tests__/budget-relance.test.ts",
    "server/intelligences/__tests__/coffre-boutique.integration.test.ts",
    "server/intelligences/__tests__/coffre.test.ts",
    "server/intelligences/__tests__/connaissances-publication.test.ts",
    "server/intelligences/__tests__/connaissances-travaux.test.ts",
    "server/intelligences/__tests__/conversation-continue-travail.test.ts",
    "server/intelligences/__tests__/conversation-e2e.test.ts",
    "server/intelligences/__tests__/conversation-titre.test.ts",
    "server/intelligences/__tests__/dictee-vocabulaire.test.ts",
    "server/intelligences/__tests__/empreintes.integration.test.ts",
    "server/intelligences/__tests__/fondations.test.ts",
    "server/intelligences/__tests__/fuite-fournisseurs.test.ts",
    "server/intelligences/__tests__/generation-code.test.ts",
    "server/intelligences/__tests__/github.test.ts",
    "server/intelligences/__tests__/independance-openai.test.ts",
    "server/intelligences/__tests__/livraisons-historique.integration.test.ts",
    "server/intelligences/__tests__/livraisons-historique.test.ts",
    "server/intelligences/__tests__/media-productions.integration.test.ts",
    "server/intelligences/__tests__/media-productions.test.ts",
    "server/intelligences/__tests__/memoire-automobile.integration.test.ts",
    "server/intelligences/__tests__/memoire-fichiers-rag.test.ts",
    "server/intelligences/__tests__/memory-foundations.integration.test.ts",
    "server/intelligences/__tests__/mission-progression.test.ts",
    "server/intelligences/__tests__/moderation.test.ts",
    "server/intelligences/__tests__/orchestration-memoire.integration.test.ts",
    "server/intelligences/__tests__/orchestration-reglages.test.ts",
    "server/intelligences/__tests__/reasoning-effort-outils.test.ts",
    "server/intelligences/__tests__/recherche-memoire-entreprise.test.ts",
    "server/intelligences/__tests__/regles-jeton-developpement.test.ts",
    "server/intelligences/__tests__/shop-analysis.integration.test.ts",
    "server/intelligences/__tests__/shop-analysis.test.ts",
    "server/intelligences/__tests__/shop-knowledge.integration.test.ts",
    "server/intelligences/__tests__/shop-knowledge.test.ts",
    "server/intelligences/__tests__/sonde-openai.test.ts",
    "server/intelligences/__tests__/travail-chat.test.ts",
    "server/intelligences/__tests__/verifier-acces.test.ts",
    "server/intelligences/outils/__tests__/api-externes.test.ts",
    "server/intelligences/outils/__tests__/boucle.test.ts",
    "server/intelligences/outils/__tests__/observability.test.ts",
    "server/intelligences/outils/__tests__/registre-exploitation.test.ts",
    "server/intelligences/univers/__tests__/univers.test.ts",
    "server/estimate-gateway/__tests__/gateway.test.ts",
    "server/market-price-intelligence/__tests__/service.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "service-access",
   "connexionsExistantes": [
    "face à « Accès de service (jeton, portées, routes /api/service) » : canal « catalogue » de shop_link (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [],
   "manques": [
    "bouton_sans_action ×1",
    "dependance_non_declaree ×10",
    "dependance_sans_preuve ×2"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "investment",
   "nom": "Investment Engine",
   "fonction": "Droit économique temporaire univers+pays+durée : Contract Engine, Ownership Router, Revenue Engine, Ledger — distinct du tableau de bord croissance interne (investorRouter). La candidature publique « Devenir investisseur » réutilise le Partner Engine (candidater) et le catalogue pays du Pro Portal, jamais un second moteur de candidature.",
   "domaine": "univers",
   "niveauDeclare": "staging",
   "code": [
    "server/investment/",
    "server/router.ts (routeur « investment »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "investment"
   ],
   "entreesTrouvees": 22,
   "tables": [
    "investment_status_history",
    "investments",
    "investor_ledger",
    "investor_organizations",
    "investor_payout_history",
    "investor_payouts",
    "investors"
   ],
   "dependances": [
    "audit",
    "contract",
    "core",
    "country",
    "identity",
    "intelligences",
    "partner_engine",
    "pro_portal"
   ],
   "tests": [
    "server/investment/__tests__/investment-admin.test.ts",
    "server/investment/__tests__/investment.test.ts"
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
   "id": "journey",
   "nom": "Customer Journey OS",
   "fonction": "Entonnoir de parcours client : étapes, abandons, conversions.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/customer-journey-os/",
    "server/router.ts (routeur « customerJourneyOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "customerJourneyOs"
   ],
   "entreesTrouvees": 6,
   "tables": [],
   "dependances": [
    "core",
    "identity",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "knowledge",
   "nom": "Knowledge Engine",
   "fonction": "Mémoire centrale (base auto, pièces, pannes, marché).",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "core",
    "country",
    "seo",
    "smart"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×12",
    "dependance_sans_preuve ×3",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "language",
   "nom": "Language OS",
   "fonction": "9 langues, traductions namespace/clé, préférences utilisateur, détection auto.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/language-os/",
    "server/router.ts (routeur « language »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "language"
   ],
   "entreesTrouvees": 12,
   "tables": [
    "language_health_log",
    "language_languages",
    "language_translations",
    "language_user_preferences"
   ],
   "dependances": [
    "core",
    "country",
    "identity"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "livraison",
   "nom": "Livraison Engine",
   "fonction": "Livraison véhicules/pièces, transport, suivi.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/livraison.ts/",
    "server/routers/livraison.ts/",
    "server/router.ts (routeur « livraison »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "livraison"
   ],
   "entreesTrouvees": 8,
   "tables": [
    "delivery_missions",
    "delivery_pricing",
    "delivery_profiles",
    "delivery_routes",
    "delivery_tracking",
    "delivery_vehicles"
   ],
   "dependances": [
    "avis_reputation",
    "boutons",
    "core",
    "country",
    "identity",
    "notification",
    "payment"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "livraison_vehicule",
   "nom": "Vehicle Delivery Engine",
   "fonction": "Acheminement des véhicules : barèmes gouvernés, étapes, qualité de prix.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/vehicle-delivery/",
    "server/router.ts (routeur « livraisonVehicule »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "livraisonVehicule"
   ],
   "entreesTrouvees": 9,
   "tables": [
    "vd_devis",
    "vd_expeditions",
    "vd_options",
    "vd_suivi",
    "vd_tarifs"
   ],
   "dependances": [
    "boutons",
    "core",
    "country",
    "event_bus",
    "politique_pays",
    "smart"
   ],
   "tests": [
    "server/vehicle-delivery/__tests__/routing.test.ts"
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
   "id": "location",
   "nom": "Univers Location Engine",
   "fonction": "Univers Location : voitures, utilitaires, camions, LOA, réservations.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/routers/rentalApplications.ts/",
    "server/routers/rentalContracts.ts/",
    "server/routers/waitlist.ts/",
    "server/router.ts (routeur « lavage »)",
    "server/router.ts (routeur « karting »)",
    "server/router.ts (routeur « rentalApplications »)",
    "server/router.ts (routeur « rentalContracts »)",
    "server/router.ts (routeur « waitlist »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "lavage",
    "karting",
    "rentalApplications",
    "rentalContracts",
    "waitlist"
   ],
   "entreesTrouvees": 13,
   "tables": [],
   "dependances": [
    "achat",
    "core",
    "country",
    "payment",
    "permission",
    "redirection",
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
    "bouton_sans_action ×12",
    "bouton_declare_absent_ecran ×1",
    "dependance_non_declaree ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "location_particulier",
   "nom": "Location Particulier Engine",
   "fonction": "Sous-section Location Particulier.",
   "domaine": "sous_section",
   "niveauDeclare": "staging",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "achat",
    "core",
    "country",
    "location"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×1",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "location_pro",
   "nom": "Location Professionnelle Engine",
   "fonction": "Sous-section Location Professionnelle.",
   "domaine": "sous_section",
   "niveauDeclare": "staging",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "achat",
    "boutons",
    "core",
    "country",
    "location"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "bouton_sans_action ×5",
    "ecran_sans_contenu ×10",
    "dependance_non_declaree ×1",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "logistics_engine",
   "nom": "Logistics Engine",
   "fonction": "LOT 4 du Plan Maître Fournisseurs (transport/livraison) : Delivery/Logistics API Gateway, Carrier Connector Engine (catalogue de transporteurs, honnêtement NOT_CONNECTED sans clé réelle), Delivery Quote Engine (délègue au Vehicle Delivery Engine pour les véhicules, sinon NOT_CONNECTED), Delivery Routing Engine, Multi-Leg Engine (MASTER SHIPMENT + LEG 1-4), Tracking Engine (statuts normalisés, webhooks), API MKA.P-MS pour transporteurs (`/api/logistics/*`, clé API dédiée). Staging tant qu'aucun transporteur réel n'est connecté.",
   "domaine": "transversal",
   "niveauDeclare": "staging",
   "code": [
    "server/logistics-engine/",
    "server/router.ts (routeur « logisticsEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "logisticsEngine"
   ],
   "entreesTrouvees": 18,
   "tables": [
    "logistics_api_keys",
    "logistics_audit_log",
    "logistics_carrier_connections",
    "logistics_health_log",
    "logistics_legs",
    "logistics_quotes",
    "logistics_shipments",
    "logistics_tracking_events",
    "logistics_webhook_log"
   ],
   "dependances": [
    "core",
    "country",
    "event_bus",
    "identity",
    "livraison_vehicule",
    "supplier_engine",
    "vehicle_engine"
   ],
   "tests": [
    "server/logistics-engine/__tests__/logistics-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "emission_dynamique ×1",
    "dependance_non_declaree ×2",
    "dependance_sans_preuve ×1",
    "sans_ecran ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "marketing",
   "nom": "Publicité Engine",
   "fonction": "Emplacements, campagnes, budgets, ciblage.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/marketing.ts/",
    "server/routers/marketing.ts/",
    "server/router.ts (routeur « marketing »)",
    "server/router.ts (routeur « loyalty »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "marketing",
    "loyalty"
   ],
   "entreesTrouvees": 8,
   "tables": [
    "ads",
    "banners",
    "campaigns",
    "promo_codes",
    "pub_requests",
    "qr_codes",
    "referral_codes"
   ],
   "dependances": [
    "core",
    "country",
    "identity",
    "notification",
    "seo",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×7",
    "dependance_non_declaree ×1",
    "dependance_sans_preuve ×3",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "media",
   "nom": "Media OS",
   "fonction": "Optimisation, miniatures et dédoublonnage des médias.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/media-os/",
    "server/router.ts (routeur « mediaOs »)",
    "server/router.ts (routeur « media »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "mediaOs",
    "media"
   ],
   "entreesTrouvees": 6,
   "tables": [],
   "dependances": [
    "core",
    "identity",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "media_authenticity",
   "nom": "Media Authenticity Engine",
   "fonction": "Provenance des photos, vidéos et justificatifs : empreinte, métadonnées, réutilisation, signature C2PA. Constate, n'authentifie pas un document administratif — la décision reste humaine.",
   "domaine": "transversal",
   "niveauDeclare": "staging",
   "code": [
    "server/media-authenticity/",
    "server/router.ts (routeur « mediaAuthenticity »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "mediaAuthenticity"
   ],
   "entreesTrouvees": 7,
   "tables": [
    "ma_analyses",
    "ma_incidents",
    "ma_labels",
    "ma_medias"
   ],
   "dependances": [
    "ai_fabric",
    "core",
    "event_bus",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "sans_ecran ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "messaging",
   "nom": "Messagerie OS",
   "fonction": "Messagerie interne : conversations, modération, sécurité et supervision.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/messaging-os/",
    "server/routers/messages.ts/",
    "server/router.ts (routeur « messagingOs »)",
    "server/router.ts (routeur « messages »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "messagingOs",
    "messages"
   ],
   "entreesTrouvees": 17,
   "tables": [
    "message_reports"
   ],
   "dependances": [
    "audit",
    "core",
    "identity",
    "notification"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "monitoring",
   "nom": "Monitoring Engine",
   "fonction": "Surveillance santé/performances consolidée (Monitoring OS).",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/monitoring-os/",
    "server/router.ts (routeur « monitoringOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "monitoringOs"
   ],
   "entreesTrouvees": 9,
   "tables": [],
   "dependances": [
    "core",
    "event_bus",
    "identity",
    "notification",
    "scheduler",
    "smart",
    "visibility"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "notification",
   "nom": "Notification OS",
   "fonction": "Multi-canaux (email, SMS, push, in-app), templates multi-langues, préférences utilisateur, dispatch avec journal.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/notification-os/",
    "server/routers/notifications.ts/",
    "server/modules/search-alerts.ts/",
    "server/services/email.ts/",
    "server/router.ts (routeur « notifications »)",
    "server/router.ts (routeur « notificationOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "notifications",
    "notificationOs"
   ],
   "entreesTrouvees": 19,
   "tables": [
    "notif_dispatch_log",
    "notif_health_log",
    "notif_templates",
    "notif_user_preferences"
   ],
   "dependances": [
    "contract",
    "core",
    "identity",
    "language"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×19",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "partner_engine",
   "nom": "Partner Engine",
   "fonction": "Réseau partenaires (pays, métier, zone, contrat, leads, performance) et acquisition des professionnels là où la demande dépasse l'offre.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/partner-engine/",
    "server/router.ts (routeur « partnerEngine »)",
    "server/router.ts (routeur « partners »)",
    "server/router.ts (routeur « partnerApi »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "partnerEngine",
    "partners",
    "partnerApi"
   ],
   "entreesTrouvees": 14,
   "tables": [
    "partner_applications",
    "partner_contracts",
    "partner_coverage",
    "partner_leads",
    "partner_opportunities"
   ],
   "dependances": [
    "core",
    "country",
    "notification",
    "pro_portal",
    "smart",
    "visibility"
   ],
   "tests": [
    "server/partner-engine/__tests__/partner-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×8"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "parts_engine",
   "nom": "Parts Engine",
   "fonction": "LOT 3 du Plan Maître Fournisseurs (pièces automobiles uniquement) : ingestion d'une pièce fournisseur déjà active (Supplier Engine), mapping/normalisation, identité canonique multi-fournisseurs, OEM/Cross-Reference Engine, Parts Compatibility Engine, tarification, stock (ledger + réservations temporaires), territoires (Country OS + Country Policy Engine), contrôle qualité, publication vers la marketplace pièces existante (`parts_catalog`/`parts_stock`/`parts_compatibility`), synchronisation continue. Staging tant qu'aucune pièce fournisseur réelle n'a été publiée de bout en bout.",
   "domaine": "transversal",
   "niveauDeclare": "staging",
   "code": [
    "server/parts-engine/",
    "server/router.ts (routeur « partsEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "partsEngine"
   ],
   "entreesTrouvees": 31,
   "tables": [
    "parts_audit_log",
    "parts_canonical",
    "parts_compatibility_checks",
    "parts_health_log",
    "parts_oem_cross_references",
    "parts_pricing",
    "parts_publication_log",
    "parts_quality_checks",
    "parts_stock_ledger",
    "parts_stock_reservations",
    "parts_supplier_items",
    "parts_supplier_shop_links",
    "parts_territories"
   ],
   "dependances": [
    "core",
    "country",
    "event_bus",
    "identity",
    "pieces",
    "politique_pays",
    "supplier_engine"
   ],
   "tests": [
    "server/parts-engine/__tests__/parts-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×2",
    "dependance_sans_preuve ×1",
    "sans_ecran ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "payment",
   "nom": "Payment Engine",
   "fonction": "Moteur de paiement propriétaire (Stripe/virement) — en staging (Phase 2).",
   "domaine": "transversal",
   "niveauDeclare": "staging",
   "code": [
    "server/payment-engine/",
    "server/stripeWebhook.ts/",
    "server/lib/stripe.ts/",
    "server/lib/payment-errors.ts/",
    "server/modules/wallet.ts/",
    "server/modules/wallet-ledger.ts/",
    "server/routers/wallet.ts/",
    "server/modules/installments.ts/",
    "server/routers/installments.ts/",
    "server/routers/abonnements.ts/",
    "server/routers/badges.ts/",
    "server/router.ts (routeur « paymentEngine »)",
    "server/router.ts (routeur « wallet »)",
    "server/router.ts (routeur « installments »)",
    "server/router.ts (routeur « abonnements »)",
    "server/router.ts (routeur « badges »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "paymentEngine",
    "wallet",
    "installments",
    "abonnements",
    "badges"
   ],
   "entreesTrouvees": 56,
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
   "dependances": [
    "achat",
    "cartegrise",
    "core",
    "country",
    "event_bus",
    "livraison_vehicule",
    "payment_orchestrator",
    "permission",
    "smart",
    "workflow"
   ],
   "tests": [
    "server/payment-engine/__tests__/checkout.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "shared-stripe-account",
   "connexionsExistantes": [
    "face à « Compte de paiement commun (Stripe) » : canal « paiement » de shop_link (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [
    "accès externe requis (« Compte de paiement commun (Stripe) »)"
   ],
   "manques": [
    "destination_inconnue ×1",
    "ecran_sans_contenu ×1",
    "dependance_non_declaree ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "payment_orchestrator",
   "nom": "Payment Orchestrator",
   "fonction": "Sélection du prestataire de paiement selon pays, devise, service, disponibilité réelle du connecteur et préférence utilisateur. Ajouter un prestataire ne demande pas de reconstruire le checkout.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/payment-orchestrator/",
    "server/router.ts (routeur « paymentOrchestrator »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "paymentOrchestrator"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "payment_providers",
    "payment_routing_decisions"
   ],
   "dependances": [
    "core",
    "country",
    "payment"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "payout_engine",
   "nom": "Payout Engine",
   "fonction": "LOT 5 du Plan Maître Fournisseurs (§32) : politiques de versement fournisseur/transporteur (immédiat/enlèvement/livraison/documents/étape, 50/50, 30/70, 100 %), déclenchées par l'Event Bus (vente véhicule, leg logistique) — en staging tant qu'aucun versement réel n'a été validé par la Direction.",
   "domaine": "transversal",
   "niveauDeclare": "staging",
   "code": [
    "server/payout-engine/",
    "server/router.ts (routeur « payoutEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "payoutEngine"
   ],
   "entreesTrouvees": 13,
   "tables": [
    "payout_audit_log",
    "payout_health_log",
    "payout_policies",
    "payout_schedules"
   ],
   "dependances": [
    "audit",
    "core",
    "event_bus",
    "identity",
    "logistics_engine",
    "payment",
    "payment_orchestrator",
    "permission",
    "supplier_engine",
    "vehicle_engine"
   ],
   "tests": [
    "server/payout-engine/__tests__/payout-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×2",
    "dependance_sans_preuve ×2",
    "sans_ecran ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "permission",
   "nom": "Permission OS",
   "fonction": "2 niveaux : matrice de rôle + politiques contextuelles (pays × type × univers × abonnement × contrat × ancienneté × device × risk).",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/permission-engine/",
    "server/routers/rbac.ts/",
    "server/router.ts (routeur « permissionEngine »)",
    "server/router.ts (routeur « rbac »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "permissionEngine",
    "rbac"
   ],
   "entreesTrouvees": 29,
   "tables": [
    "perm_delegations",
    "perm_health_log",
    "perm_policies",
    "perm_resolution_log",
    "perm_security_log",
    "perm_temporary_grants"
   ],
   "dependances": [
    "core",
    "identity"
   ],
   "tests": [
    "server/permission-engine/__tests__/contract.test.ts",
    "server/permission-engine/__tests__/router.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "pieces",
   "nom": "Pièces Auto Engine",
   "fonction": "Boutiques, stocks, références, commandes.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/pieces.ts/",
    "server/routers/pieces.ts/",
    "server/router.ts (routeur « pieces »)",
    "server/router.ts (routeur « warehouses »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "pieces",
    "warehouses"
   ],
   "entreesTrouvees": 34,
   "tables": [
    "part_compatibilities",
    "part_references"
   ],
   "dependances": [
    "avis_reputation",
    "core",
    "event_bus",
    "identity",
    "notification",
    "payment",
    "payment_orchestrator",
    "product_engine",
    "redirection"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "bouton_sans_action ×5",
    "ecran_sans_contenu ×12",
    "dependance_non_declaree ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "politique_pays",
   "nom": "Country Policy Engine",
   "fonction": "Contrôle réglementaire par pays avant exécution : règles confirmées, validité, autorité. Sans règle confirmée, l'action repart en validation humaine.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/country-policy/",
    "server/router.ts (routeur « countryPolicy »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "countryPolicy"
   ],
   "entreesTrouvees": 10,
   "tables": [
    "cpe_evaluations",
    "cpe_rules"
   ],
   "dependances": [
    "core",
    "country"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×16",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "pro_account",
   "nom": "Pro Account Engine",
   "fonction": "Dossier professionnel légal par pays et par métier : exigences variables, vérification humaine, paiement séparé et activation contrôlée.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/pro-account/",
    "server/router.ts (routeur « proAccount »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "proAccount"
   ],
   "entreesTrouvees": 11,
   "tables": [
    "pro_account_applications",
    "pro_account_rules"
   ],
   "dependances": [
    "core",
    "country",
    "notification",
    "pro_portal"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "pro_portal",
   "nom": "Pro Portal Engine",
   "fonction": "Portail professionnel mondial (.pro) : métiers, catalogue de services à la carte, composition d'offre et parcours jusqu'à l'activation.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/pro-portal/",
    "server/modules/pro.ts/",
    "server/routers/pro.ts/",
    "server/routers/api.ts/",
    "server/services/apiIntegration.ts/",
    "server/router.ts (routeur « proPortal »)",
    "server/router.ts (routeur « pro »)",
    "server/router.ts (routeur « api »)",
    "server/router.ts (routeur « formation »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "proPortal",
    "pro",
    "api",
    "formation"
   ],
   "entreesTrouvees": 43,
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
    "vente_employes",
    "vente_fournisseurs",
    "vente_pro_vehicules",
    "vtc_chauffeurs",
    "vtc_demandes",
    "vtc_societes",
    "vtc_vehicules"
   ],
   "dependances": [
    "audit",
    "core",
    "country",
    "payment",
    "pro_account"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×5",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "product_engine",
   "nom": "Google Product Engine",
   "fonction": "Projette les pièces et produits réellement vendus vers les canaux Google (données structurées Product, flux Merchant Center lorsque éligible) et garde les véhicules hors du catalogue produit, où ils ne seraient que refusés.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/product-engine/",
    "server/router.ts (routeur « productEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "productEngine"
   ],
   "entreesTrouvees": 6,
   "tables": [
    "product_feed_items",
    "product_feed_runs",
    "product_sync_events"
   ],
   "dependances": [
    "core",
    "country",
    "event_bus",
    "smart"
   ],
   "tests": [
    "server/product-engine/__tests__/merchant-center.test.ts",
    "server/product-engine/__tests__/no-hardcoded-country.test.ts",
    "server/product-engine/__tests__/pipelines-snapshot.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "proximity_engine",
   "nom": "Proximity Engine",
   "fonction": "Recherche locale « près de moi » par service et matrice de complétude des univers en mini-plateformes.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/proximity-engine/",
    "server/router.ts (routeur « proximity »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "proximity"
   ],
   "entreesTrouvees": 4,
   "tables": [],
   "dependances": [
    "avis_reputation",
    "core",
    "country",
    "notification",
    "payment"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "rd_lab",
   "nom": "Automotive R&D Lab",
   "fonction": "Laboratoire R&D séparé des services vendus : projets industriels, chaîne besoin → tests, navigation et calculateurs, avec droits d'usage établis avant tout versement à la mémoire partagée.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/rd-lab/",
    "server/modules/future.ts/",
    "server/router.ts (routeur « rdLab »)",
    "server/router.ts (routeur « lab »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "rdLab",
    "lab"
   ],
   "entreesTrouvees": 14,
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
   "dependances": [
    "connaissance_auto",
    "core",
    "country",
    "energie_recharge",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×131",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "redirection",
   "nom": "Redirection Engine",
   "fonction": "Résolution centralisée des destinations (clés → cibles).",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/redirection-engine/",
    "server/data/client-routes.ts/",
    "server/router.ts (routeur « redirectionEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "redirectionEngine"
   ],
   "entreesTrouvees": 12,
   "tables": [
    "redir_logs",
    "redir_rules"
   ],
   "dependances": [
    "core",
    "identity",
    "permission",
    "smart"
   ],
   "tests": [
    "server/redirection-engine/__tests__/redirection-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "main-to-shop-entry",
   "connexionsExistantes": [
    "face à « Accès Boutique depuis la plateforme (entrée) » : aucun canal côté plateforme"
   ],
   "connexionsAConstruire": [
    "canal shop_link pour « Accès Boutique depuis la plateforme (entrée) »"
   ],
   "manques": [],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "resilience",
   "nom": "Resilience & Safety Engine",
   "fonction": "Fermeture au public sans destruction, actions critiques à confirmation renforcée, pipeline obligatoire avant production, auto-réparation vérifiée, mémoire des échecs.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/resilience/",
    "server/router.ts (routeur « resilience »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "resilience"
   ],
   "entreesTrouvees": 18,
   "tables": [
    "rs_critical_requests",
    "rs_emergency_events",
    "rs_emergency_scopes",
    "rs_failure_lessons",
    "rs_pipeline_runs"
   ],
   "dependances": [
    "core",
    "country",
    "identity",
    "redirection",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "risque_import",
   "nom": "Import Risk Engine",
   "fonction": "Diagnostic d'importation et d'homologation avant achat ou livraison.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/import-risk/",
    "server/router.ts (routeur « risqueImport »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "risqueImport"
   ],
   "entreesTrouvees": 2,
   "tables": [],
   "dependances": [
    "core",
    "country",
    "energie_recharge",
    "event_bus",
    "politique_pays",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "scheduler",
   "nom": "Scheduler OS",
   "fonction": "Tâches planifiées et automatisations avec journal d'exécution.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/scheduler-os/",
    "server/router.ts (routeur « schedulerOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "schedulerOs"
   ],
   "entreesTrouvees": 8,
   "tables": [
    "scheduler_tasks"
   ],
   "dependances": [
    "core",
    "identity",
    "notification"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "ecran_sans_contenu ×16",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "search",
   "nom": "Search Engine",
   "fonction": "Recherche universelle unifiée (Search OS).",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/search-os/",
    "server/router.ts (routeur « searchOs »)",
    "server/router.ts (routeur « searches »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "searchOs",
    "searches"
   ],
   "entreesTrouvees": 6,
   "tables": [],
   "dependances": [
    "achat",
    "avis_reputation",
    "core",
    "country",
    "identity",
    "permission"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×2",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "seo",
   "nom": "SEO Engine",
   "fonction": "SEO automatique et indexation.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/seo.ts/",
    "server/seo-analyze.ts/",
    "server/seo-dashboard.ts/",
    "server/seo-generator.ts/",
    "server/seo-geo.ts/",
    "server/seo-hooks.ts/",
    "server/seo-indexing.ts/",
    "server/seo-keywords-catalog.ts/",
    "server/seo-manager.ts/",
    "server/seo-static.ts/",
    "server/seo-verify.ts/",
    "server/routers/seo.ts/",
    "server/modules/seo.ts/",
    "server/router.ts (routeur « seo »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "seo"
   ],
   "entreesTrouvees": 28,
   "tables": [
    "seo_blog_articles",
    "seo_config",
    "seo_indexing_log",
    "seo_keywords",
    "seo_pages"
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
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": "shared-google-owner",
   "connexionsExistantes": [
    "face à « Propriétaire Google commun » : canal « google » de shop_link (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [
    "accès externe requis (« Propriétaire Google commun »)"
   ],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shop_link",
   "nom": "Moteur intermédiaire Boutique",
   "fonction": "Câble entre la plateforme et la Boutique : canaux coupables, contrats, clés signées, journal, boîte d'échange des IA.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/shop-link/",
    "server/router.ts (routeur « shopLink »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "shopLink"
   ],
   "entreesTrouvees": 16,
   "tables": [
    "shop_link_cables",
    "shop_link_cles",
    "shop_link_documents",
    "shop_link_etat_boutique",
    "shop_link_ia_boite",
    "shop_link_journal",
    "shop_link_rejeu"
   ],
   "dependances": [
    "core",
    "identity",
    "intelligences"
   ],
   "tests": [
    "server/shop-link/__tests__/contrats.test.ts",
    "server/shop-link/__tests__/shop-link.integration.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "shop_link",
   "connexionsExistantes": [
    "6 canaux : catalogue, état, documents, ia-mémoire (disponibles) ; paiement, google (en attente d'un accès externe)"
   ],
   "connexionsAConstruire": [],
   "manques": [],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "smart",
   "nom": "Smart Engine",
   "fonction": "Observation, analyse, alertes, apprentissage (sous validation humaine).",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/smart-engine/",
    "server/router.ts (routeur « smartEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "smartEngine"
   ],
   "entreesTrouvees": 95,
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
   "tests": [
    "server/smart-engine/services/__tests__/bouton-deplace.test.ts",
    "server/smart-engine/services/__tests__/boutons-sans-action-sync.test.ts",
    "server/smart-engine/services/__tests__/hardening.test.ts",
    "server/smart-engine/services/__tests__/perceptual.test.ts",
    "server/smart-engine/services/__tests__/staging-integre-guard.test.ts",
    "server/smart-engine/services/__tests__/valider-tout.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "shop-intelligence-isolated",
   "connexionsExistantes": [
    "face à « État technique agrégé du système intelligent de la Boutique » : canal « etat » de shop_link (câble coupé par défaut)"
   ],
   "connexionsAConstruire": [],
   "manques": [],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "smart_audit",
   "nom": "Audit & activation du Système Intelligent",
   "fonction": "Mesure ce que le Système Intelligent sait réellement faire (16 capacités, du simple fait d'observer jusqu'au retour arrière) sur preuve d'usage, et exécute le cycle complet sur les données réelles au lieu de le décrire.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/smart-audit/",
    "server/router.ts (routeur « smartAudit »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "smartAudit"
   ],
   "entreesTrouvees": 7,
   "tables": [
    "smart_audit_items",
    "smart_audit_runs",
    "smart_cycle_runs"
   ],
   "dependances": [
    "ai_fabric",
    "core",
    "smart"
   ],
   "tests": [
    "server/smart-audit/__tests__/health-observation.test.ts"
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
   "id": "supplier_engine",
   "nom": "Supplier Engine",
   "fonction": "LOT 1 du Plan Maître Fournisseurs : registre fournisseur (au-dessus d'un partenaire déjà existant), onboarding avec validation Direction obligatoire, Connector Engine et Universal Mapping Engine. LOT 7 (suite) : RBAC Fournisseur/Transporteur (supplier_carrier_accounts) — rôles isolés, jamais dans ADMIN_ROLES/DIRECTION_ROLES/PRO_ROLES, aucun compte réel ouvert sans octroi PDG explicite. Staging tant qu'aucun fournisseur réel n'a été activé de bout en bout.",
   "domaine": "transversal",
   "niveauDeclare": "staging",
   "code": [
    "server/supplier-engine/",
    "server/routers/supplier-portal.ts/",
    "server/router.ts (routeur « supplierEngine »)",
    "server/router.ts (routeur « supplierPortal »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "supplierEngine",
    "supplierPortal"
   ],
   "entreesTrouvees": 25,
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
   "dependances": [
    "core",
    "country",
    "identity",
    "partner_engine",
    "workflow"
   ],
   "tests": [
    "server/supplier-engine/__tests__/access.test.ts",
    "server/supplier-engine/__tests__/portal-selfservice.test.ts",
    "server/supplier-engine/__tests__/supplier-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1",
    "dependance_sans_preuve ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "support",
   "nom": "Support OS",
   "fonction": "Tickets, priorités, file et suivi centralisés ; litiges.",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/support-os/",
    "server/routers/support.ts/",
    "server/router.ts (routeur « supportOs »)",
    "server/router.ts (routeur « support »)",
    "server/router.ts (routeur « disputes »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "supportOs",
    "support",
    "disputes"
   ],
   "entreesTrouvees": 16,
   "tables": [],
   "dependances": [
    "audit",
    "core",
    "identity",
    "notification",
    "payment",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "transport",
   "nom": "VTC & Taxi Engine",
   "fonction": "Véhicules, chauffeurs, planning, missions.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/transport.ts/",
    "server/routers/transport.ts/",
    "server/router.ts (routeur « transport »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "transport"
   ],
   "entreesTrouvees": 7,
   "tables": [
    "driver_documents",
    "drivers",
    "transport_bookings",
    "transport_companies",
    "transport_vehicles"
   ],
   "dependances": [
    "core",
    "identity",
    "notification",
    "payment",
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
    "ecran_sans_contenu ×4",
    "dependance_sans_preuve ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "vehicle_engine",
   "nom": "Vehicle Engine",
   "fonction": "LOT 2 du Plan Maître Fournisseurs (véhicules uniquement) : ingestion d'un véhicule fournisseur déjà actif (Supplier Engine), mapping/normalisation, détection de doublons, analyse VIN/qualité, tarification, territoires (Country OS + Country Policy Engine), disponibilité, publication vers la marketplace existante (`annonces`), synchronisation continue. Staging tant qu'aucun véhicule fournisseur réel n'a été publié de bout en bout.",
   "domaine": "transversal",
   "niveauDeclare": "staging",
   "code": [
    "server/vehicle-engine/",
    "server/router.ts (routeur « vehicleEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "vehicleEngine"
   ],
   "entreesTrouvees": 27,
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
   "tests": [
    "server/vehicle-engine/__tests__/vehicle-engine.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×4",
    "sans_ecran ×1"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "vente",
   "nom": "Univers Vente Engine",
   "fonction": "Univers Vente : dépôt d'annonce, gestion, mise en avant, transactions.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
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
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "destination_inconnue ×1",
    "ecran_sans_contenu ×10",
    "bouton_sans_action ×10",
    "bouton_declare_absent_ecran ×2",
    "dependance_non_declaree ×3",
    "dependance_sans_preuve ×1",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "vente_officiel",
   "nom": "Vente Officielle Engine",
   "fonction": "Sous-section Vente Officielle MKA.P-MS.",
   "domaine": "sous_section",
   "niveauDeclare": "staging",
   "code": [
    "server/modules/depotvente.ts/",
    "server/routers/depotvente.ts/",
    "server/router.ts (routeur « depotVente »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "depotVente"
   ],
   "entreesTrouvees": 3,
   "tables": [
    "depot_vente"
   ],
   "dependances": [
    "core",
    "notification",
    "vente"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "vente_particulier",
   "nom": "Vente Particulier Engine",
   "fonction": "Sous-section Vente Particulier — isolable.",
   "domaine": "sous_section",
   "niveauDeclare": "staging",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "achat",
    "core",
    "smart",
    "vente"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_sans_preuve ×1",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "vente_pro",
   "nom": "Vente Professionnelle Engine",
   "fonction": "Sous-section Vente Professionnelle (vendeurs pros).",
   "domaine": "sous_section",
   "niveauDeclare": "staging",
   "code": [],
   "serviceExecution": "aucun service d'exécution relevé",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [],
   "dependances": [
    "boutons",
    "core",
    "country",
    "identity",
    "pro_portal",
    "vente",
    "vo_espaces"
   ],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×5",
    "dependance_sans_preuve ×1",
    "sans_logique_serveur ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "visibility",
   "nom": "Global Visibility Engine",
   "fonction": "Moteur central de visibilité mondiale : coordonne SEO, visibilité Intelligence/GEO, audience, canaux sociaux et publication organique (une info → tous les canaux).",
   "domaine": "transversal",
   "niveauDeclare": "active",
   "code": [
    "server/visibility-os/",
    "server/router.ts (routeur « visibilityOs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "visibilityOs"
   ],
   "entreesTrouvees": 21,
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
   "dependances": [
    "core",
    "identity",
    "smart"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "vo",
   "nom": "VO Engine",
   "fonction": "Cycle complet du véhicule d'occasion (16 étapes).",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/modules/vo.ts/",
    "server/routers/vo.ts/",
    "server/router.ts (routeur « vo »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "vo"
   ],
   "entreesTrouvees": 13,
   "tables": [
    "vo_diagnostics",
    "vo_documents",
    "vo_etapes",
    "vo_lavage",
    "vo_reparations",
    "vo_vehicules"
   ],
   "dependances": [
    "boutons",
    "core",
    "notification",
    "permission"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "dependance_non_declaree ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [
    "même racine de nom que vo_engine (à vérifier : deux moteurs pour une fonction ?)"
   ],
   "aVerifier": []
  },
  {
   "id": "vo_engine",
   "nom": "VO Engine — estimation & reprise",
   "fonction": "Amont client du VO : estimation en fourchette sur le marché local, demande de reprise et dossier VO de confiance.",
   "domaine": "univers",
   "niveauDeclare": "active",
   "code": [
    "server/vo-engine/",
    "server/router.ts (routeur « voEngine »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "voEngine"
   ],
   "entreesTrouvees": 13,
   "tables": [
    "vo_dossier_items",
    "vo_estimations",
    "vo_reprise_requests"
   ],
   "dependances": [
    "achat",
    "core",
    "country",
    "intelligences"
   ],
   "tests": [],
   "etat": "installe",
   "preuve": "liaison",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [],
   "manques": [
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [
    "même racine de nom que vo (à vérifier : deux moteurs pour une fonction ?)"
   ],
   "aVerifier": []
  },
  {
   "id": "vo_espaces",
   "nom": "VO Espaces — cloisonnement officiel / pro / particulier",
   "fonction": "Décide côté serveur quel espace VO est ouvert (officiel réservé à l'équipe, professionnel sur abonnement VO actif, particulier fermé) et limite chaque stock à son propriétaire.",
   "domaine": "univers",
   "niveauDeclare": "staging",
   "code": [
    "server/vo-espaces/",
    "server/router.ts (routeur « voEspaces »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "voEspaces"
   ],
   "entreesTrouvees": 8,
   "tables": [],
   "dependances": [
    "core",
    "country",
    "document",
    "identity",
    "payment",
    "pro_portal"
   ],
   "tests": [
    "server/vo-espaces/__tests__/vo-espaces.test.ts"
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
   "id": "workflow",
   "nom": "Workflow Engine",
   "fonction": "Automatisation des processus métier — à créer (Phase 2).",
   "domaine": "transversal",
   "niveauDeclare": "disabled",
   "code": [
    "server/modules/hr-direction.ts/",
    "server/modules/operations.ts/",
    "server/routers/operations.ts/",
    "server/routers/objectifs.ts/",
    "server/router.ts (routeur « governance »)",
    "server/router.ts (routeur « platform »)",
    "server/router.ts (routeur « quality »)",
    "server/router.ts (routeur « hr »)",
    "server/router.ts (routeur « procurement »)",
    "server/router.ts (routeur « investor »)",
    "server/router.ts (routeur « objectifs »)"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique (dist/server.js) · tRPC /api/trpc",
   "entrees": [
    "governance",
    "platform",
    "quality",
    "hr",
    "procurement",
    "investor",
    "objectifs"
   ],
   "entreesTrouvees": 76,
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
   "dependances": [
    "audit",
    "boutons",
    "core",
    "identity",
    "notification",
    "permission",
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
    "ecran_sans_contenu ×30",
    "dependance_non_declaree ×1",
    "dependance_sans_preuve ×1",
    "aucun fichier de test dans les dossiers du moteur"
   ],
   "doublons": [],
   "aVerifier": []
  }
 ],
 "intermediaires": [
  {
   "id": "shop_link:catalogue",
   "nom": "Catalogue — l'IA de la plateforme travaille dans la Boutique",
   "fonction": "La plateforme appelle les routes /api/service de la Boutique avec le jeton de service que le PDG a créé et déposé dans le Coffre. Lecture des fiches, préparation des photos, propositions de brouillon. Jamais de prix, de TVA, de stock, de livraison, d'approbation ni de publication.",
   "domaine": "intermédiaire",
   "niveauDeclare": "disponible",
   "code": [
    "server/shop-link/contrats.ts",
    "server/shop-link/entrant.ts",
    "server/shop-link/sortant.ts",
    "server/shop-link/service.ts"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique · /api/shop-link",
   "entrees": [
    "(sortant) routes /api/service de la Boutique, liste blanche ROUTES_CATALOGUE"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_link_cables"
   ],
   "dependances": [],
   "tests": [
    "server/shop-link/__tests__/contrats.test.ts",
    "server/shop-link/__tests__/shop-link.integration.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "service-access",
   "connexionsExistantes": [
    "face au contrat « service-access » de la Boutique (BUILT)"
   ],
   "connexionsAConstruire": [],
   "manques": [],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shop_link:etat",
   "nom": "État technique de la Boutique (agrégé)",
   "fonction": "La Boutique envoie un état technique agrégé de ses moteurs. Aucune mémoire, aucune conversation, aucune donnée client.",
   "domaine": "intermédiaire",
   "niveauDeclare": "disponible",
   "code": [
    "server/shop-link/contrats.ts",
    "server/shop-link/entrant.ts",
    "server/shop-link/sortant.ts",
    "server/shop-link/service.ts"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique · /api/shop-link",
   "entrees": [
    "/api/shop-link/v1/etat"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_link_cables"
   ],
   "dependances": [],
   "tests": [
    "server/shop-link/__tests__/contrats.test.ts",
    "server/shop-link/__tests__/shop-link.integration.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "shop-intelligence-isolated",
   "connexionsExistantes": [
    "face au contrat « shop-intelligence-isolated » de la Boutique (READY)"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique (à construire par les agents de la Boutique)"
   ],
   "manques": [],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shop_link:documents",
   "nom": "Références de documents de la Boutique",
   "fonction": "La Boutique transmet des RÉFÉRENCES de documents (numéro, statut, total, commande). Le document reste dans la Boutique.",
   "domaine": "intermédiaire",
   "niveauDeclare": "disponible",
   "code": [
    "server/shop-link/contrats.ts",
    "server/shop-link/entrant.ts",
    "server/shop-link/sortant.ts",
    "server/shop-link/service.ts"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique · /api/shop-link",
   "entrees": [
    "/api/shop-link/v1/documents"
   ],
   "entreesTrouvees": 1,
   "tables": [
    "shop_link_cables"
   ],
   "dependances": [],
   "tests": [
    "server/shop-link/__tests__/contrats.test.ts",
    "server/shop-link/__tests__/shop-link.integration.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": "shop-documents-only",
   "connexionsExistantes": [
    "face au contrat « shop-documents-only » de la Boutique (READY)"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique (à construire par les agents de la Boutique)"
   ],
   "manques": [],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shop_link:ia-memoire",
   "nom": "Échange de mémoire entre les deux IA (boîte de validation)",
   "fonction": "Les deux IA ne se parlent pas directement : chaque élément passe par la boîte d'échange du moteur intermédiaire et ne devient une connaissance qu'après validation du PDG. Entrant : la Boutique dépose une proposition (procédure, connaissance, erreur et solution). Sortant : le PDG approuve un élément, la Boutique vient le chercher.",
   "domaine": "intermédiaire",
   "niveauDeclare": "disponible",
   "code": [
    "server/shop-link/contrats.ts",
    "server/shop-link/entrant.ts",
    "server/shop-link/sortant.ts",
    "server/shop-link/service.ts"
   ],
   "serviceExecution": "plateforme principale · serveur Node unique · /api/shop-link",
   "entrees": [
    "/api/shop-link/v1/ia/boite",
    "/api/shop-link/v1/ia/sortants",
    "/api/shop-link/v1/ia/accuse"
   ],
   "entreesTrouvees": 3,
   "tables": [
    "shop_link_cables"
   ],
   "dependances": [],
   "tests": [
    "server/shop-link/__tests__/contrats.test.ts",
    "server/shop-link/__tests__/shop-link.integration.test.ts"
   ],
   "etat": "teste",
   "preuve": "tests",
   "declareSeulement": false,
   "intermediairePrevu": null,
   "connexionsExistantes": [],
   "connexionsAConstruire": [
    "intermédiaire côté Boutique"
   ],
   "manques": [
    "aucun intermédiaire correspondant préparé côté Boutique (ia-mémoire) : à convenir avec les agents de la Boutique"
   ],
   "doublons": [],
   "aVerifier": [
    "pas de contrat correspondant côté Boutique"
   ]
  },
  {
   "id": "shop_link:paiement",
   "nom": "Compte de paiement commun (Stripe)",
   "fonction": "Contrat déclaré côté Boutique (BLOCKED_EXTERNAL) : clé Stripe et webhook de la Boutique requis. Les moteurs de paiement restent séparés.",
   "domaine": "intermédiaire",
   "niveauDeclare": "attente_externe",
   "code": [
    "server/shop-link/contrats.ts",
    "server/shop-link/entrant.ts",
    "server/shop-link/sortant.ts",
    "server/shop-link/service.ts"
   ],
   "serviceExecution": "aucun (canal non branchable : attente externe)",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_link_cables"
   ],
   "dependances": [],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": "shared-stripe-account",
   "connexionsExistantes": [
    "face au contrat « shared-stripe-account » de la Boutique (BLOCKED_EXTERNAL)"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique (à construire par les agents de la Boutique)"
   ],
   "manques": [
    "attente externe : En attente de la clé Stripe et du webhook de la Boutique (activation externe, côté Boutique). Aucune connexion n'est possible avant."
   ],
   "doublons": [],
   "aVerifier": []
  },
  {
   "id": "shop_link:google",
   "nom": "Propriétaire Google commun",
   "fonction": "Contrat déclaré côté Boutique (BLOCKED_EXTERNAL) : propriétés Google de la Boutique séparées et accès du coffre de la Boutique requis.",
   "domaine": "intermédiaire",
   "niveauDeclare": "attente_externe",
   "code": [
    "server/shop-link/contrats.ts",
    "server/shop-link/entrant.ts",
    "server/shop-link/sortant.ts",
    "server/shop-link/service.ts"
   ],
   "serviceExecution": "aucun (canal non branchable : attente externe)",
   "entrees": [],
   "entreesTrouvees": 0,
   "tables": [
    "shop_link_cables"
   ],
   "dependances": [],
   "tests": [],
   "etat": "incomplet",
   "preuve": "declare",
   "declareSeulement": true,
   "intermediairePrevu": "shared-google-owner",
   "connexionsExistantes": [
    "face au contrat « shared-google-owner » de la Boutique (BLOCKED_EXTERNAL)"
   ],
   "connexionsAConstruire": [
    "émetteur côté Boutique (à construire par les agents de la Boutique)"
   ],
   "manques": [
    "attente externe : En attente des propriétés Google de la Boutique et de son propre compte Google (activation externe, côté Boutique). Aucune connexion n'est possible avant."
   ],
   "doublons": [],
   "aVerifier": []
  }
 ]
};
