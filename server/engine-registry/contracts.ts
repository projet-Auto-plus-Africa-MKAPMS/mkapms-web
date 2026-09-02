/**
 * MKA.P-MS Engine Registry — Contrats des moteurs (PR 2).
 *
 * Formalise le contrat officiel de chaque moteur DÉJÀ existant :
 *   - Core Engine
 *   - Smart Engine
 *   - Permission Engine
 *   - Redirection Engine
 *
 * Objectif : standardiser (documenter) les moteurs présents, SANS modifier leur
 * logique métier, leurs routes, leurs APIs, leurs permissions ni leurs tables.
 * Ces contrats servent :
 *   - à l'auto-enregistrement au démarrage (voir bootstrap.ts) ;
 *   - à la vérification des dépendances ;
 *   - à l'affichage temps réel dans le Centre de contrôle PDG.
 */

export type EngineRole =
  | "user"
  | "pro"
  | "garage"
  | "employee"
  | "society"
  | "admin"
  | "super_admin";

/** État de santé exposé par un moteur. */
export type EngineHealthState =
  | "actif" // opérationnel
  | "degrade" // fonctionne partiellement (ex: dépendance absente)
  | "maintenance" // arrêté volontairement
  | "erreur" // erreur critique
  | "indisponible"; // non joignable

/** Une permission requise par le moteur (déclarative, non appliquée ici). */
export interface PermissionSurface {
  key: string;
  kind: "page" | "endpoint" | "action" | "export";
  roles: EngineRole[];
  description?: string;
}

/** Procédures d'exploitation d'un moteur (documentées, exécutées par le PDG). */
export interface EngineProcedures {
  /** Arrêt propre (mise hors service). */
  stop: string;
  /** Reprise après arrêt. */
  resume: string;
  /** Mise à jour de version. */
  update: string;
  /** Retour arrière. */
  rollback: string;
}

/** Contrat officiel d'un moteur. */
export interface EngineContract {
  /** Identifiant unique (clé du registre). */
  id: string;
  /** Nom technique (interne). */
  technicalName: string;
  /** Nom public (affiché). */
  publicName: string;
  /** Version sémantique. */
  version: string;
  /** Catégorie dans l'écosystème, alignée sur le catalogue du registre. */
  category: "core" | "transversal" | "univers" | "service" | "sous_section";
  /** Description courte. */
  description: string;
  /** Responsabilités du moteur. */
  responsibilities: string[];
  /** Moteurs dont dépend ce moteur (par id). */
  dependencies: string[];
  /** Événements que le moteur publie. */
  eventsPublished: string[];
  /** Événements que le moteur consomme. */
  eventsConsumed: string[];
  /** Endpoints tRPC exposés (sous-router.procédure). */
  endpoints: string[];
  /** Tables utilisées (préfixées ou métier). */
  tables: string[];
  /** Permissions nécessaires. */
  permissions: PermissionSurface[];
  /** Centre de contrôle associé (route front PDG). */
  controlCenter: string;
  /** Endpoint/heartbeat de contrôle de santé. */
  healthCheck: string;
  /** État actuel déclaré (piloté ensuite par le PDG via le registre). */
  currentState: "active" | "read_only" | "maintenance" | "disabled" | "staging";
  /** Environnement cible. */
  environment: "development" | "staging" | "production";
  /** Procédures d'exploitation. */
  procedures: EngineProcedures;
}

// ── Contrats des 4 moteurs existants ────────────────────────────────────────

export const ENGINE_CONTRACTS: EngineContract[] = [
  {
    id: "core",
    technicalName: "MKA.P-MS Core Engine",
    publicName: "Moteur Central MKA.P-MS",
    version: "1.0.0",
    category: "core",
    description:
      "Orchestrateur central : registre des moteurs, événements inter-moteurs, coordination.",
    responsibilities: [
      "Coordonner les moteurs sans écrire dans leurs tables.",
      "Router les événements inter-moteurs.",
      "Exposer l'état global aux administrateurs.",
    ],
    dependencies: [],
    eventsPublished: ["core.engine.registered", "core.engine.state_changed"],
    eventsConsumed: ["*"],
    endpoints: ["coreEngine.*", "engineRegistry.*"],
    tables: [
      "ce_*",
      "engine_registry",
      "engine_events",
      "engine_health_log",
      "engine_admin_log",
    ],
    permissions: [
      {
        key: "core.control.view",
        kind: "page",
        roles: ["super_admin"],
        description: "Centre de contrôle Core Engine (PDG).",
      },
    ],
    controlCenter: "/admin/core-engine",
    healthCheck: "engineRegistry.heartbeat(core)",
    currentState: "active",
    environment: "production",
    procedures: {
      stop: "engineRegistry.setState(core, maintenance) — arrêt logique ; le noyau reste requis.",
      resume: "engineRegistry.setState(core, active).",
      update: "Déployer la nouvelle version puis heartbeat(core, version).",
      rollback: "Redéployer la version précédente ; aucune donnée à défaire.",
    },
  },
  {
    id: "smart",
    technicalName: "MKA.P-MS Smart Engine",
    publicName: "Système Intelligent MKA.P-MS",
    version: "1.0.0",
    category: "transversal",
    description:
      "Observation, analyse, alertes et apprentissage — toujours sous validation humaine.",
    responsibilities: [
      "Observer et analyser l'activité de la plateforme.",
      "Détecter anomalies, doublons, fraudes potentielles.",
      "Proposer des améliorations sans jamais décider seul.",
    ],
    dependencies: ["core", "identity", "permission", "notification", "monitoring"],
    eventsPublished: ["smart.alert.raised", "smart.suggestion.created"],
    eventsConsumed: ["*.suspect", "payment.suspect"],
    endpoints: ["smartEngine.*"],
    tables: ["smart_*"],
    permissions: [
      {
        key: "smart.control.view",
        kind: "page",
        roles: ["super_admin"],
        description: "Centre de contrôle Smart Engine (PDG).",
      },
    ],
    controlCenter: "/admin/smart-engine",
    healthCheck: "engineRegistry.heartbeat(smart)",
    currentState: "active",
    environment: "production",
    procedures: {
      stop: "engineRegistry.setState(smart, maintenance) — arrête les analyses.",
      resume: "engineRegistry.setState(smart, active).",
      update: "Déployer puis heartbeat(smart, version) ; migrations smart_* additives.",
      rollback: "setState(smart, disabled) puis redéployer la version précédente.",
    },
  },
  {
    id: "permission",
    technicalName: "MKA.P-MS Permission Engine",
    publicName: "Moteur de Permissions MKA.P-MS",
    version: "1.0.0",
    category: "transversal",
    description:
      "Contrôle centralisé des accès : pages, boutons, endpoints, rôles.",
    responsibilities: [
      "Résoudre les autorisations par rôle et par clé.",
      "Centraliser la matrice des permissions.",
      "Journaliser les décisions d'accès sensibles.",
    ],
    dependencies: ["core", "identity"],
    eventsPublished: ["permission.denied"],
    eventsConsumed: [],
    endpoints: ["permissionEngine.*"],
    tables: ["permission_*"],
    permissions: [
      {
        key: "permission.control.view",
        kind: "page",
        roles: ["super_admin"],
        description: "Centre de contrôle Permission Engine (PDG).",
      },
    ],
    controlCenter: "/admin/permission-engine",
    healthCheck: "engineRegistry.heartbeat(permission)",
    currentState: "active",
    environment: "production",
    procedures: {
      stop: "engineRegistry.setState(permission, maintenance) — refus par défaut sécurisé.",
      resume: "engineRegistry.setState(permission, active).",
      update: "Déployer puis heartbeat(permission, version).",
      rollback: "Redéployer la version précédente ; migrations permission_* additives.",
    },
  },
  {
    id: "redirection",
    technicalName: "MKA.P-MS Redirection Engine",
    publicName: "Moteur de Redirection MKA.P-MS",
    version: "1.0.0",
    category: "transversal",
    description:
      "Résolution centralisée des redirections par clé (boutons, parcours, domaines).",
    responsibilities: [
      "Résoudre une clé de redirection vers sa cible.",
      "Centraliser les règles de redirection.",
      "Journaliser les résolutions.",
    ],
    dependencies: ["core", "identity", "permission", "smart"],
    eventsPublished: ["redirection.resolved"],
    eventsConsumed: [],
    endpoints: ["redirectionEngine.*"],
    tables: ["redirection_*"],
    permissions: [
      {
        key: "redirection.control.view",
        kind: "page",
        roles: ["super_admin"],
        description: "Centre de contrôle Redirection Engine (PDG).",
      },
    ],
    controlCenter: "/admin/redirection-engine",
    healthCheck: "engineRegistry.heartbeat(redirection)",
    currentState: "active",
    environment: "production",
    procedures: {
      stop: "engineRegistry.setState(redirection, maintenance) — cibles par défaut utilisées.",
      resume: "engineRegistry.setState(redirection, active).",
      update: "Déployer puis heartbeat(redirection, version).",
      rollback: "Redéployer la version précédente ; migrations redirection_* additives.",
    },
  },
  {
    id: "boutons",
    technicalName: "MKA.P-MS Button Engine",
    publicName: "Moteur de boutons MKA.P-MS",
    version: "1.0.0",
    category: "transversal",
    description:
      "Chaque bouton déclare un code d'action au lieu de câbler son comportement dans l'écran.",
    responsibilities: [
      "Donner l'action d'un bouton (navigation, contact, document, formulaire).",
      "Résoudre la destination d'un bouton via le Moteur de Redirection.",
      "Nommer les actions déclarées que rien n'exécute encore côté serveur.",
      "Signaler chaque clic pour rendre visible un bouton qui mène au vide.",
    ],
    dependencies: ["core", "redirection", "event_bus"],
    eventsPublished: ["bouton.sans_action"],
    eventsConsumed: [],
    endpoints: ["buttonEngine.*"],
    tables: [],
    permissions: [
      {
        key: "boutons.inventaire.view",
        kind: "page",
        roles: ["super_admin"],
        description: "Inventaire des boutons de la plateforme (PDG).",
      },
    ],
    controlCenter: "/admin/redirection-engine",
    healthCheck: "engineRegistry.heartbeat(boutons)",
    currentState: "active",
    environment: "production",
    procedures: {
      stop: "engineRegistry.setState(boutons, maintenance) — les écrans utilisent la cible catalogue.",
      resume: "engineRegistry.setState(boutons, active).",
      update: "Déployer puis heartbeat(boutons, version).",
      rollback: "Redéployer la version précédente ; aucune table propre au moteur.",
    },
  },
  {
    id: "auto_branchement",
    technicalName: "MKA.P-MS Auto-Branchement Engine",
    publicName: "Module d'auto-branchement MKA.P-MS",
    version: "1.0.0",
    category: "transversal",
    description:
      "Rend chaque élément cliquable de chaque écran à son moteur, au lieu de reprendre 700 écrans à la main.",
    responsibilities: [
      "Relever chaque élément cliquable et dire lequel est piloté par le Moteur de boutons.",
      "Revérifier à l'exécution que chaque destination existe, ou qu'une règle du Moteur de Redirection la rattrape.",
      "Publier chaque défaut à l'Event Bus pour alerte du Système Intelligent et dossier des Intelligences.",
      "Conserver l'état des cliquables en mémoire technique, daté et comparable.",
      "Proposer le traitement de chaque défaut sans jamais modifier le code de production.",
    ],
    dependencies: ["core", "boutons", "redirection", "event_bus", "smart", "intelligences"],
    eventsPublished: [
      "cliquables.audit_termine",
      "cliquable.destination_morte",
      "ecrans.vides_recenses",
    ],
    eventsConsumed: [],
    endpoints: ["autoBranchement.*"],
    tables: [],
    permissions: [
      {
        key: "auto_branchement.centre.view",
        kind: "page",
        roles: ["super_admin"],
        description: "Centre d'auto-branchement : cliquables, destinations mortes, propositions (PDG).",
      },
    ],
    controlCenter: "/admin/auto-branchement",
    healthCheck: "autoBranchement.synthese",
    currentState: "active",
    environment: "production",
    procedures: {
      stop: "engineRegistry.setState(auto_branchement, maintenance) — la passe périodique cesse, aucun écran n'est affecté.",
      resume: "engineRegistry.setState(auto_branchement, active).",
      update: "npm run gen:cliquables puis déploiement : l'inventaire fait partie du build.",
      rollback: "Redéployer la version précédente ; aucune table propre au module.",
    },
  },
  {
    id: "atelier",
    technicalName: "MKA.P-MS Atelier Engine",
    publicName: "Moteur d'Atelier MKA.P-MS",
    version: "1.0.0",
    category: "service",
    description:
      "Capacités serveur de l'atelier : validation interne, contrôle qualité, stock de pièces du garage, report de rendez-vous.",
    responsibilities: [
      "Enregistrer une validation d'atelier opposable (qui, quoi, quand, points contrôlés).",
      "Calculer la conformité à partir des points réellement cochés, jamais la déclarer.",
      "Tenir le stock de pièces d'un garage avec un mouvement par écriture.",
      "Tracer le report d'un rendez-vous atelier avec son motif.",
    ],
    dependencies: ["core", "event_bus", "smart"],
    eventsPublished: [
      "atelier.validation_enregistree",
      "atelier.controle_non_conforme",
      "atelier.stock_bas",
      "atelier.rdv_reporte",
    ],
    eventsConsumed: [],
    endpoints: ["atelierEngine.*"],
    tables: ["atelier_*"],
    permissions: [
      {
        key: "atelier.validation.write",
        kind: "endpoint",
        roles: ["pro", "super_admin"],
        description: "Enregistrer une validation d'atelier sur un garage possédé.",
      },
      {
        key: "atelier.stock.write",
        kind: "endpoint",
        roles: ["pro", "super_admin"],
        description: "Tenir le stock de pièces d'un garage possédé.",
      },
    ],
    controlCenter: "/admin/engines",
    healthCheck: "atelierEngine.etat",
    currentState: "active",
    environment: "production",
    procedures: {
      stop: "engineRegistry.setState(atelier, maintenance) — les écrans annoncent l'indisponibilité au lieu d'un faux succès.",
      resume: "engineRegistry.setState(atelier, active).",
      update: "Déployer puis heartbeat(atelier, version).",
      rollback: "Redéployer la version précédente ; migrations atelier_* additives.",
    },
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

export function getContract(id: string): EngineContract | undefined {
  return ENGINE_CONTRACTS.find((c) => c.id === id);
}

export function hasPermissionMatrix(id: string): boolean {
  const c = getContract(id);
  return !!c && c.permissions.length > 0;
}

/** Résumé léger (sans les détails lourds) pour le Centre PDG. */
export function contractSummary() {
  return ENGINE_CONTRACTS.map((c) => ({
    id: c.id,
    publicName: c.publicName,
    version: c.version,
    category: c.category,
    dependencies: c.dependencies,
    currentState: c.currentState,
    controlCenter: c.controlCenter,
  }));
}
