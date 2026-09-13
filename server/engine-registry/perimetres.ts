/**
 * MKA.P-MS Engine Registry — Périmètre déclaré de chaque moteur.
 *
 * Pour qu'un moteur puisse dire « ce bouton est à moi » ou « il manque une
 * phrase sur mon écran », il faut d'abord savoir ce qui est à lui. Ce fichier
 * est la SEULE déclaration manuelle : pour chaque moteur, les dossiers serveur
 * qu'il possède, les routeurs tRPC qu'il expose et les routes client qu'il
 * sert. Tout le reste (dépendances réelles, dépendants, événements publiés et
 * consommés, boutons et leur emplacement, écrans, textes, rôles, tables,
 * procédures) est CALCULÉ par `scripts/gen-moteurs.mjs` à partir du code, et
 * écrit dans `server/data/moteurs.ts`.
 *
 * Règles :
 *  - un dossier ou une route ne peut appartenir qu'à un seul moteur ; le
 *    générateur échoue sur un doublon ;
 *  - une route se termine par `/*` pour couvrir toutes ses sous-routes ;
 *  - un moteur sans dossier serveur est un moteur « d'écran » : il n'existe
 *    que par ses routes et sera signalé comme tel (aucune logique serveur à
 *    lui, donc aucune preuve d'usage possible).
 */
export interface PerimetreDeclare {
  moteur: string;
  /** Dossiers ou fichiers serveur possédés (relatifs à `server/`). */
  dossiers: string[];
  /** Clés de sous-routeurs tRPC dans `server/router.ts`. */
  routeurs: string[];
  /** Routes client servies (exactes, ou préfixe avec `/*`). */
  routes: string[];
  /** Noms sous lesquels le moteur publie au bus quand ils diffèrent du sien. */
  sourcesBus?: string[];
}

export const PERIMETRES: PerimetreDeclare[] = [
  // ── Core & registre ────────────────────────────────────────────────────
  {
    moteur: "core",
    dossiers: ["engine-registry", "central-engines", "db.ts", "domain.ts", "env.ts", "index.ts", "migrate.ts", "reference.ts", "router.ts", "schema.ts", "seed.ts", "trpc.ts", "types", "data/moteurs.ts", "modules/core.ts", "modules/coreEngine.ts", "routers/coreEngine.ts", "routers/modules.ts", "routers/admin.ts", "routers/meta.ts"],
    routeurs: ["coreEngine", "engineRegistry", "centralEngines", "modules", "admin", "meta"],
    routes: ["/", "/admin", "/admin/*", "/superadmin", "/superadmin/core-engine-beta", "/admin/moteurs", "/mk-global-engine"],
    sourcesBus: ["engine_registry"],
  },
  {
    moteur: "event_bus",
    dossiers: ["event-bus"],
    routeurs: ["eventBus"],
    routes: ["/admin/bus-evenements"],
    sourcesBus: ["pdg"],
  },
  // ── Transversaux fondateurs ────────────────────────────────────────────
  {
    moteur: "identity",
    dossiers: ["identity-os", "auth.ts", "routers/auth.ts", "routers/kyc.ts", "account-deletion", "user-preferences"],
    routeurs: ["auth", "identity", "kyc", "suppressionCompte", "preferencesUtilisateur"],
    routes: ["/superadmin/identity-os", "/connexion", "/inscription", "/verify-email", "/suppression-compte", "/utilisateurs/*", "/compte", "/compte/*", "/parametres", "/parametres/*", "/mon-espace", "/superadmin/admin-utilisateurs", "/superadmin/admin-securite", "/admin/demandes-suppression", "/confidentialite"],
  },
  {
    moteur: "country",
    dossiers: ["country-os", "routers/currency.ts", "data/world.ts"],
    // platformMap (routers/operations.ts) : carte des sites géolocalisés
    // (lavage, karting, sites) consommée par CarteMondiale.tsx, l'écran de
    // ce moteur (/carte). Rattaché ici, pas à workflow où il ne vivait que
    // par accident de fichier (même fichier que governance/HR/procurement) :
    // aucun rapport fonctionnel avec workflow, et c'était l'arête qui
    // refermait le cycle country -> workflow -> notification -> language ->
    // country (workflow n'a plus aucune raison de dépendre de country).
    routeurs: ["country", "countries", "currency", "platformMap"],
    routes: ["/superadmin/country-os", "/carte", "/international", "/international/*", "/expansion", "/expansion/*", "/superadmin/admin-carte-moniale"],
  },
  {
    moteur: "language",
    dossiers: ["language-os"],
    routeurs: ["language"],
    routes: ["/superadmin/language-os"],
  },
  {
    moteur: "notification",
    dossiers: ["notification-os", "routers/notifications.ts", "services/email.ts"],
    routeurs: ["notifications", "notificationOs"],
    routes: ["/superadmin/notification-os", "/notifications", "/notifications/*"],
  },
  {
    moteur: "document",
    dossiers: ["document-os"],
    routeurs: ["documentOs", "documents", "dossiers"],
    routes: ["/superadmin/document-os", "/superadmin/validation-documents-complete", "/superadmin/admin-validation-docs", "/documents", "/catalogue-technique", "/dossier-vehicule-numerique", "/louer/controle-documents", "/vente/documents-societe"],
  },
  {
    moteur: "media_authenticity",
    dossiers: ["media-authenticity"],
    routeurs: ["mediaAuthenticity"],
    routes: [],
  },
  {
    moteur: "smart",
    dossiers: ["smart-engine"],
    routeurs: ["smartEngine"],
    routes: ["/superadmin/smart-engine", "/admin/actions"],
  },
  {
    moteur: "permission",
    dossiers: ["permission-engine", "routers/rbac.ts"],
    routeurs: ["permissionEngine", "rbac"],
    routes: ["/superadmin/permission-engine", "/superadmin/permission-os", "/mk-direction"],
  },
  {
    moteur: "redirection",
    dossiers: ["redirection-engine", "data/client-routes.ts"],
    routeurs: ["redirectionEngine"],
    routes: ["/superadmin/redirection-engine"],
  },
  {
    moteur: "boutons",
    dossiers: ["button-engine", "data/boutons-sans-action.ts"],
    routeurs: ["buttonEngine"],
    routes: [],
  },
  {
    moteur: "auto_branchement",
    dossiers: ["auto-branchement", "data/cliquables.ts"],
    routeurs: ["autoBranchement"],
    routes: ["/admin/auto-branchement"],
  },
  {
    moteur: "account_routing",
    dossiers: ["account-routing"],
    routeurs: ["accountRouting"],
    routes: ["/univers", "/tableau-de-bord"],
  },
  // ── OS transversaux (pont MOS) ─────────────────────────────────────────
  {
    moteur: "messaging",
    dossiers: ["messaging-os", "routers/messages.ts"],
    routeurs: ["messagingOs", "messages"],
    routes: ["/messagerie"],
  },
  {
    moteur: "support",
    dossiers: ["support-os", "routers/support.ts"],
    routeurs: ["supportOs", "support", "disputes"],
    routes: ["/aide", "/superadmin/admin-support", "/superadmin/centre-tickets", "/superadmin/admin-litiges"],
  },
  {
    moteur: "contract",
    dossiers: ["contract-os", "routers/contracts.ts", "modules/contracts.ts"],
    routeurs: ["contractOs", "contracts"],
    routes: ["/conformite/contrats-adaptes", "/entreprises/contrats-entreprises"],
  },
  // Droit économique temporaire univers+pays+durée (application Investisseur,
  // priorité de la direction) — jamais à confondre avec le moteur "workflow"
  // (routeur investorRouter, /investisseurs/*) qui reste un tableau de bord
  // interne de croissance pour investisseurs en capital, sans rapport.
  {
    moteur: "investment",
    dossiers: ["investment"],
    routeurs: ["investment"],
    routes: ["/investissement"],
  },
  {
    moteur: "journey",
    dossiers: ["customer-journey-os"],
    routeurs: ["customerJourneyOs"],
    routes: ["/vente/parcours-acheteur"],
  },
  {
    moteur: "search",
    dossiers: ["search-os"],
    routeurs: ["searchOs", "searches"],
    routes: ["/rechercher", "/recherche", "/recherche-universelle"],
  },
  {
    moteur: "scheduler",
    dossiers: ["scheduler-os"],
    routeurs: ["schedulerOs"],
    routes: ["/automatisations", "/automatisations/*"],
  },
  {
    moteur: "media",
    dossiers: ["media-os"],
    routeurs: ["mediaOs", "media"],
    routes: [],
  },
  {
    moteur: "monitoring",
    dossiers: ["monitoring-os"],
    routeurs: ["monitoringOs"],
    routes: ["/superadmin/admin-statistiques"],
  },
  {
    moteur: "audit",
    dossiers: ["audit-os", "audit.ts"],
    routeurs: ["auditOs"],
    routes: ["/superadmin/admin-journal", "/journal-activite"],
  },
  {
    moteur: "backup",
    dossiers: ["backup-os"],
    routeurs: ["backupOs"],
    routes: ["/superadmin/admin-sauvegardes"],
  },
  {
    moteur: "ai_learning",
    dossiers: ["ai-learning-os"],
    routeurs: ["aiLearningOs"],
    routes: [],
  },
  // ── Métier transversal ─────────────────────────────────────────────────
  {
    moteur: "seo",
    dossiers: ["seo.ts", "seo-analyze.ts", "seo-dashboard.ts", "seo-generator.ts", "seo-geo.ts", "seo-hooks.ts", "seo-indexing.ts", "seo-keywords-catalog.ts", "seo-manager.ts", "seo-static.ts", "seo-verify.ts", "routers/seo.ts", "modules/seo.ts"],
    routeurs: ["seo"],
    routes: ["/superadmin/admin-s-e-o", "/seo-abonnements", "/garages/:slug", "/marque/:marque", "/marque/:marque/:modele", "/pays/:slug", "/pays/:slug/:ville", "/piece/:slug", "/region/:slug", "/reparation/:slug", "/reparation/:slug/:vehicule", "/service/:slug", "/service/:slug/:ville", "/ville/:slug"],
  },
  {
    moteur: "indexation",
    dossiers: ["indexation", "site-verification"],
    routeurs: ["indexation", "siteVerification"],
    routes: ["/admin/indexation"],
  },
  {
    moteur: "visibility",
    dossiers: ["visibility-os"],
    routeurs: ["visibilityOs"],
    routes: ["/superadmin/visibilite-croissance"],
  },
  {
    moteur: "product_engine",
    dossiers: ["product-engine"],
    routeurs: ["productEngine"],
    routes: ["/admin/produits-google"],
  },
  {
    moteur: "knowledge",
    dossiers: [],
    routeurs: [],
    routes: ["/communaute", "/communaute/*", "/formations", "/formations/*"],
  },
  {
    moteur: "connaissance_auto",
    dossiers: ["knowledge-engine"],
    routeurs: ["knowledgeEngine"],
    routes: ["/admin/connaissance"],
  },
  {
    moteur: "politique_pays",
    dossiers: ["country-policy"],
    routeurs: ["countryPolicy"],
    routes: ["/admin/regles-pays", "/conformite", "/conformite/*"],
  },
  {
    moteur: "resilience",
    dossiers: ["resilience"],
    routeurs: ["resilience"],
    routes: ["/admin/resilience"],
  },
  {
    moteur: "command_center",
    dossiers: ["command-center"],
    routeurs: ["commandCenter"],
    routes: ["/admin/commandes"],
  },
  {
    moteur: "rd_lab",
    dossiers: ["rd-lab", "modules/future.ts"],
    routeurs: ["rdLab", "lab"],
    routes: ["/admin/labo-rd", "/labs", "/labs/*"],
  },
  {
    moteur: "ai_fabric",
    dossiers: ["ai-fabric"],
    routeurs: ["aiFabric"],
    routes: ["/admin/ia-couts", "/ia", "/ia/*"],
  },
  {
    moteur: "intelligences",
    dossiers: ["intelligences", "governance", "estimate-gateway"],
    routeurs: ["intelligences"],
    routes: ["/admin/intelligences", "/intelligences", "/intelligence"],
  },
  {
    moteur: "smart_audit",
    dossiers: ["smart-audit"],
    routeurs: ["smartAudit"],
    routes: ["/admin/systeme-intelligent"],
  },
  {
    moteur: "activation_audit",
    dossiers: ["activation-audit"],
    routeurs: ["activationAudit"],
    routes: ["/admin/audit-activation"],
  },
  {
    moteur: "continuous_test",
    dossiers: ["continuous-test"],
    routeurs: ["continuousTest"],
    routes: ["/admin/controle-continu"],
  },
  {
    moteur: "code_graph",
    dossiers: ["code-graph"],
    routeurs: ["codeGraph"],
    routes: ["/admin/memoire-technique"],
  },
  {
    moteur: "completion_center",
    dossiers: ["completion"],
    routeurs: ["completion"],
    routes: ["/admin/completion"],
  },
  {
    moteur: "workflow",
    dossiers: ["modules/operations.ts", "routers/operations.ts"],
    routeurs: ["governance", "platform", "quality", "hr", "procurement", "investor"],
    routes: ["/operations", "/operations/*", "/superadmin/admin-general", "/superadmin/admin-objectif", "/superadmin/centre-r-h", "/superadmin/admin-employes", "/superadmin/gestion-employes-m-k-a-p-m-s", "/investisseurs/*", "/recrutement", "/recrutement/*", "/corporate", "/corporate/*", "/mission"],
  },
  {
    moteur: "analytics",
    dossiers: ["modules/history.ts", "routers/historique.ts"],
    routeurs: ["historique"],
    routes: ["/historique", "/historique-consultations"],
  },
  // ── Paiement & finance ─────────────────────────────────────────────────
  {
    moteur: "payment",
    dossiers: ["payment-engine", "stripeWebhook.ts", "lib/stripe.ts", "lib/payment-errors.ts", "modules/wallet.ts", "routers/wallet.ts", "modules/installments.ts", "routers/installments.ts", "routers/abonnements.ts"],
    routeurs: ["paymentEngine", "wallet", "installments", "abonnements"],
    routes: ["/wallet", "/abonnements", "/abonnements-definitifs", "/paiement/*", "/paiement-vehicule/:id", "/superadmin/admin-paiements", "/superadmin/admin-abonnements", "/superadmin/admin-commissions", "/badges-definitifs", "/superadmin/admin-badges"],
  },
  {
    moteur: "payment_orchestrator",
    dossiers: ["payment-orchestrator"],
    routeurs: ["paymentOrchestrator"],
    routes: [],
  },
  {
    moteur: "financial_intelligence",
    dossiers: ["financial-intelligence"],
    routeurs: ["financialIntelligence"],
    routes: [],
  },
  {
    moteur: "accounting_internal",
    dossiers: ["accounting-internal"],
    routeurs: ["accountingInternal"],
    routes: ["/compta-dirigeant"],
  },
  {
    moteur: "accounting_marketplace",
    dossiers: ["accounting-marketplace"],
    routeurs: ["accountingMarketplace", "cabinets"],
    routes: ["/comptables"],
  },
  {
    moteur: "comptabilite",
    dossiers: ["modules/comptabilite.ts", "routers/comptabilite.ts"],
    routeurs: ["comptabilite"],
    routes: ["/comptabilite", "/comptabilite/*", "/superadmin/comptabilite-complete"],
  },
  {
    moteur: "finance",
    dossiers: ["modules/financeplus.ts"],
    routeurs: [],
    routes: ["/finance", "/finance/*"],
  },
  // ── Univers ────────────────────────────────────────────────────────────
  {
    moteur: "achat",
    dossiers: ["routers/annonces.ts", "routers/favoris.ts", "routers/reservations.ts", "routers/devis.ts"],
    routeurs: ["annonces", "favoris", "reservations", "devis"],
    routes: ["/acheter", "/acheter/camions", "/acheter/camions-engins", "/acheter/minibus", "/acheter/moto", "/acheter/utilitaires", "/acheter/vtc-taxi", "/acheter/promotions", "/acheter/historique-vehicule", "/vehicule/:id", "/voiture-occasion", "/moto-occasion", "/favoris", "/comparateur", "/devis", "/services", "/superadmin/admin-moderation-annonces", "/superadmin/admin-fraude"],
    sourcesBus: ["annonces"],
  },
  {
    moteur: "achat_officiel",
    dossiers: [],
    routeurs: [],
    routes: ["/acheter/mkapms-officiel", "/acheter/mkapms-officiel/*"],
  },
  {
    moteur: "achat_pro",
    dossiers: [],
    routeurs: [],
    routes: ["/acheter/professionnel", "/acheter/professionnel/*"],
  },
  {
    moteur: "achat_particulier",
    dossiers: [],
    routeurs: [],
    routes: ["/acheter/particulier", "/acheter/particulier/*"],
  },
  {
    moteur: "vente",
    dossiers: [],
    routeurs: [],
    routes: ["/vendre", "/vente", "/vente/*", "/depot-annonce", "/depot-annonce/*", "/dossier-client", "/superadmin/admin-vente"],
  },
  {
    moteur: "vente_officiel",
    dossiers: ["modules/depotvente.ts", "routers/depotvente.ts"],
    routeurs: ["depotVente"],
    routes: ["/depot-vente"],
  },
  {
    moteur: "vente_pro",
    dossiers: [],
    routeurs: [],
    routes: ["/acheter/espace-pro", "/acheter/inscription-pro", "/vente/resume-vendeur"],
  },
  {
    moteur: "vente_particulier",
    dossiers: [],
    routeurs: [],
    routes: ["/acheter/depot-annonce", "/acheter/mes-annonces", "/vente/mes-annonces"],
  },
  {
    moteur: "location",
    dossiers: [],
    routeurs: ["lavage", "karting"],
    routes: ["/location/:slug", "/louer", "/louer/vtc-taxi", "/louer/vtc-taxi/*", "/louer/camions", "/louer/camions/*", "/louer/minibus", "/louer/minibus/*", "/louer/utilitaires", "/louer/utilitaires/*", "/louer/mkapms", "/louer/mkapms/*", "/louer/loa", "/louer/comparateur", "/louer/favoris", "/louer/historique", "/louer/calendrier", "/louer/liste-attente", "/louer/penalites", "/louer/remplacement", "/louer/renouvellement", "/louer/multi-vehicules", "/louer/reservations-recurrentes", "/louer/score-confiance", "/louer/programme-vtc", "/superadmin/admin-location", "/vtc-taxi", "/location-*"],
  },
  {
    moteur: "location_pro",
    dossiers: [],
    routeurs: [],
    routes: ["/louer/pro", "/louer/pro/*", "/louer/conducteurs", "/louer/franchises", "/louer/renouvellement-flotte", "/louer/tableau-bord-loueur", "/louer/score-loueur", "/entreprises", "/entreprises/*"],
  },
  {
    moteur: "location_particulier",
    dossiers: [],
    routeurs: [],
    routes: ["/louer/particulier", "/louer/particulier/*"],
  },
  {
    moteur: "vo",
    dossiers: ["modules/vo.ts", "routers/vo.ts"],
    routeurs: ["vo"],
    routes: ["/vo", "/vo/*"],
  },
  {
    moteur: "vo_engine",
    dossiers: ["vo-engine"],
    routeurs: ["voEngine"],
    routes: ["/acheter/estimation", "/acheter/reprise", "/louer/certifies"],
  },
  {
    moteur: "vo_espaces",
    dossiers: ["vo-espaces"],
    routeurs: ["voEspaces"],
    routes: ["/inscription-pro-vo"],
  },
  {
    moteur: "garage",
    dossiers: ["routers/garages.ts"],
    routeurs: ["garages"],
    routes: ["/garages", "/reparer", "/garage", "/garage-auto", "/garage-plus", "/superadmin/admin-garage", "/garage/assistance-routiere", "/garage/boutique-pieces", "/garage/carrosserie-garage", "/garage/centre-lavage", "/garage/centre-reclamations", "/garage/commande-pieces", "/garage/contrats-flottes", "/garage/demande-devis", "/garage/depannage-avance", "/garage/depannage-garage", "/garage/diagnostic-avance", "/garage/diagnostic-garage", "/garage/dossiers-flottes", "/garage/entretiens-preventifs", "/garage/esthetique-auto", "/garage/flottes-entreprises", "/garage/fournisseurs-garage", "/garage/garage-particulier", "/garage/garage-professionnel", "/garage/garantie-travaux", "/garage/lavage-preparation", "/garage/multi-garages", "/garage/objectif-final-garage", "/garage/objectif-garage", "/garage/panier-pieces", "/garage/pneumatiques", "/garage/pneumatiques-avance", "/garage/preparation-vente-v-o", "/garage/prise-rendez-vous", "/garage/recherche-pieces", "/garage/relance-client", "/garage/reseau-partenaires", "/garage/reservation-atelier", "/garage/statistiques-garage", "/garage/transfert-dossiers", "/garage/vehicules-attente", "/garage/historique-garage", "/garage/photos-intervention", "/garage/photos-techniques", "/garage/suivi-temps-reel"],
  },
  {
    moteur: "atelier",
    dossiers: ["atelier-engine"],
    routeurs: ["atelierEngine"],
    routes: ["/atelier-pro", "/garage/validation-interne", "/garage/controle-qualite-garage", "/garage/controle-qualite-premium", "/garage/stock-pieces", "/garage/commandes-automatiques", "/garage/reception-vehicule", "/garage/restitution-client", "/garage/planning-atelier", "/garage/validation-client", "/garage/ordre-reparation", "/garage/file-attente-atelier", "/garage/fiches-techniciens", "/garage/gestion-mecaniciens", "/garage/gestion-outillage", "/garage/gestion-ponts", "/garage/rentabilite-atelier", "/garage/tableau-bord-chef-atelier", "/garage/temps-intervention"],
  },
  {
    moteur: "pieces",
    dossiers: ["modules/pieces.ts", "routers/pieces.ts"],
    routeurs: ["pieces", "warehouses"],
    routes: ["/pieces", "/pieces/*", "/superadmin/admin-pieces"],
  },
  {
    moteur: "depannage",
    dossiers: ["modules/depannage.ts", "routers/depannage.ts"],
    routeurs: ["depannage"],
    routes: ["/depannage", "/depannage/*", "/superadmin/admin-depannage", "/louer/assistance"],
  },
  {
    moteur: "livraison",
    dossiers: ["modules/livraison.ts", "routers/livraison.ts"],
    routeurs: ["livraison"],
    routes: ["/livraison", "/livraison/*"],
  },
  {
    moteur: "livraison_vehicule",
    dossiers: ["vehicle-delivery"],
    routeurs: ["livraisonVehicule"],
    routes: ["/louer/livraison", "/livraison-vehicule", "/suivi-vehicule", "/suivi-vehicule/*"],
  },
  {
    moteur: "transport",
    dossiers: ["modules/transport.ts", "routers/transport.ts"],
    routeurs: ["transport"],
    routes: ["/labs/reseau-transport", "/labs/reseau-transport-marchandises", "/labs/reseau-transport-personnes", "/operations/m-k-a-p-m-s-transport", "/vente/transport"],
  },
  {
    moteur: "importafrica",
    dossiers: ["modules/importafrica.ts", "routers/importafrica.ts"],
    routeurs: ["importAfrica"],
    routes: ["/import-africa", "/import-africa/*"],
  },
  {
    moteur: "risque_import",
    dossiers: ["import-risk"],
    routeurs: ["risqueImport"],
    routes: [],
    sourcesBus: ["import_risk"],
  },
  {
    moteur: "estimation",
    dossiers: ["estimation-hub"],
    routeurs: ["estimation"],
    routes: [],
  },
  {
    moteur: "marketing",
    dossiers: ["modules/marketing.ts", "routers/marketing.ts"],
    routeurs: ["marketing", "loyalty"],
    routes: ["/marketing", "/marketing/*", "/demande-publicite", "/publicite/:id", "/publicite-interne", "/rewards"],
  },
  {
    moteur: "cartegrise",
    dossiers: ["modules/cartegrise.ts", "routers/cartegrise.ts"],
    routeurs: ["carteGrise"],
    routes: ["/carte-grise", "/carte-grise/*", "/demarches", "/demarches/*", "/superadmin/admin-demarches"],
  },
  {
    moteur: "controle_technique",
    dossiers: [],
    routeurs: [],
    routes: ["/garage/controle-technique", "/louer/inspection", "/louer/etats-vehicule"],
  },
  {
    moteur: "assurance",
    dossiers: ["insurance-engine"],
    routeurs: ["insuranceEngine", "insurance"],
    routes: ["/operations/m-k-a-p-m-s-assurance"],
  },
  {
    moteur: "energie_recharge",
    dossiers: ["charging-engine"],
    routeurs: ["chargingEngine"],
    routes: ["/labs/energy-recharge"],
  },
  {
    moteur: "avis_reputation",
    dossiers: ["reputation-engine", "modules/reviews.ts", "routers/reviews.ts", "routers/reviewsV2.ts", "routers/app-feedback.ts"],
    routeurs: ["reputationEngine", "reviews", "appFeedback"],
    routes: ["/admin/reputation", "/avis/:univers", "/compte/avis", "/pro/avis", "/vente/avis", "/superadmin/admin-moderation-avis", "/confiance"],
  },
  {
    moteur: "connecteur_google_business",
    dossiers: ["connectors/google-business"],
    routeurs: ["googleBusiness"],
    routes: [],
  },
  {
    moteur: "proximity_engine",
    dossiers: ["proximity-engine"],
    routeurs: ["proximity"],
    routes: ["/pres-de-moi", "/superadmin/mini-plateformes"],
  },
  {
    moteur: "partner_engine",
    dossiers: ["partner-engine"],
    routeurs: ["partnerEngine", "partners", "partnerApi"],
    routes: ["/partenaires", "/partenaires/*", "/superadmin/partenaires"],
  },
  {
    moteur: "pro_portal",
    dossiers: ["pro-portal", "modules/pro.ts", "routers/pro.ts", "routers/api.ts", "services/apiIntegration.ts"],
    routeurs: ["proPortal", "pro", "api", "formation"],
    routes: ["/pro", "/pro/*", "/espace-pro", "/mobile", "/mobile/*"],
  },
  {
    moteur: "pro_account",
    dossiers: ["pro-account"],
    routeurs: ["proAccount"],
    routes: ["/superadmin/admin-comptes-pro"],
  },
  {
    moteur: "encheres",
    dossiers: [],
    routeurs: [],
    routes: ["/encheres", "/encheres/*", "/acheter/encheres"],
  },
  {
    moteur: "auction_engine",
    dossiers: ["auction-engine"],
    routeurs: ["auctionEngine"],
    routes: ["/encheres/live"],
  },
];
