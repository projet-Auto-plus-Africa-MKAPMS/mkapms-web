/**
 * Points 102-103 — les 16 capacités attendues du Système Intelligent.
 *
 * Le cycle demandé, dans l'ordre :
 *
 *   observer → lire les moteurs → détecter les anomalies → créer des alertes
 *   → apprendre → mémoriser → proposer → recevoir la validation PDG
 *   → transformer la validation en tâche → exécuter → tester → corriger
 *   → générer du code → tester le code → déployer → rollback
 *
 * Chaque capacité est décrite avec :
 *   • le module qui la porte réellement dans le code ;
 *   • la ou les tables qui prouvent qu'elle a servi ;
 *   • ce qu'il manquerait pour qu'elle soit pleinement autonome.
 *
 * Une capacité n'est jamais déclarée active parce que du code existe : il faut
 * une trace d'usage réel. C'est la même règle que l'audit d'activation du
 * point 91 et le moniteur d'indexation des points 92-101.
 */

export const CAPACITE_ETATS = ["active", "partielle", "inactive", "non_disponible"] as const;
export type CapaciteEtat = (typeof CAPACITE_ETATS)[number];

export const ETAT_LABELS: Record<CapaciteEtat, string> = {
  active: "Active — usage réel constaté",
  partielle: "Partielle — branchée mais jamais utilisée",
  inactive: "Inactive — code présent, rien de branché",
  non_disponible: "Non disponible — capacité absente aujourd'hui",
};

export interface CapaciteSpec {
  code: string;
  ordre: number;
  label: string;
  /** Ce que la capacité doit réellement savoir faire. */
  attendu: string;
  /** Fichier qui porte la capacité (vérifié à l'exécution). */
  module: string;
  /** Tables prouvant l'usage — une ligne = une preuve. */
  tables: string[];
  /** Autonomie : la capacité peut-elle agir sans humain ? */
  autonomie: "observation" | "proposition" | "execution_validee" | "execution_autonome";
  /** Ce qui manque pour l'étage supérieur (jamais masqué). */
  limite: string;
}

export const CAPACITES: CapaciteSpec[] = [
  {
    code: "observer",
    ordre: 1,
    label: "Observer la plateforme",
    attendu:
      "Mesurer l'état réel : santé, temps de réponse base, visites, parcours, erreurs — à partir des données, pas d'estimations.",
    module: "server/smart-engine/services/platform-health.ts",
    tables: ["smart_health_checks", "smart_search_logs"],
    autonomie: "observation",
    limite: "",
  },
  {
    code: "lire_moteurs",
    ordre: 2,
    label: "Lire tous les moteurs",
    attendu:
      "Interroger le registre central, relever les battements de cœur, les dépendances et l'état de chaque moteur.",
    module: "server/engine-registry/service.ts",
    tables: ["engine_registry", "engine_health_log"],
    autonomie: "observation",
    limite: "",
  },
  {
    code: "detecter_anomalies",
    ordre: 3,
    label: "Détecter les anomalies",
    attendu:
      "Repérer boutons cassés, pages vides, 404, moteurs muets, recherches sans résultat, fraudes et doublons.",
    module: "server/smart-engine/services/alert-engine.ts",
    tables: ["smart_health_checks", "redir_logs"],
    autonomie: "observation",
    limite: "",
  },
  {
    code: "creer_alertes",
    ordre: 4,
    label: "Créer des alertes",
    attendu:
      "Lever une alerte de niveau adapté, sans la répéter indéfiniment, et la livrer à la direction.",
    module: "server/smart-engine/services/alert-engine.ts",
    tables: ["smart_alerts"],
    autonomie: "observation",
    limite: "",
  },
  {
    code: "apprendre",
    ordre: 5,
    label: "Apprendre",
    attendu:
      "Tirer des enseignements des saisies, des recherches, des corrections appliquées et des développements des autres agents.",
    module: "server/smart-engine/services/learning.ts",
    tables: ["smart_learned_data", "smart_dev_registry"],
    autonomie: "observation",
    limite: "",
  },
  {
    code: "memoriser",
    ordre: 6,
    label: "Mémoriser",
    attendu:
      "Conserver une base de connaissances sourcée, une mémoire par utilisateur et une mémoire des échecs, sauvegardable.",
    module: "server/smart-engine/services/knowledge-base.ts",
    tables: ["smart_knowledge", "smart_kb_entries", "smart_user_memory"],
    autonomie: "observation",
    limite: "",
  },
  {
    code: "proposer",
    ordre: 7,
    label: "Proposer",
    attendu:
      "Formuler des optimisations et des évolutions concrètes, chiffrées, rattachées à un domaine réel.",
    module: "server/smart-engine/services/auto-optimization.ts",
    tables: ["smart_optimizations", "smart_staging"],
    autonomie: "proposition",
    limite: "",
  },
  {
    code: "validation_pdg",
    ordre: 8,
    label: "Recevoir la validation PDG",
    attendu:
      "Attendre une décision humaine explicite pour toute action sensible, avec le niveau de risque affiché.",
    module: "server/smart-engine/services/action-tasks.ts",
    tables: ["smart_action_tasks"],
    autonomie: "proposition",
    limite: "",
  },
  {
    code: "transformer_en_tache",
    ordre: 9,
    label: "Transformer la validation en tâche",
    attendu:
      "Convertir une proposition validée en tâche exécutable, avec périmètre, risque et plan de retour arrière.",
    module: "server/smart-engine/services/action-tasks.ts",
    tables: ["smart_action_tasks"],
    autonomie: "execution_validee",
    limite: "",
  },
  {
    code: "executer",
    ordre: 10,
    label: "Exécuter",
    attendu: "Réaliser réellement l'action validée et en enregistrer le résultat, succès comme échec.",
    module: "server/smart-engine/services/action-tasks.ts",
    tables: ["smart_action_tasks", "smart_action_steps", "smart_activity_log"],
    autonomie: "execution_validee",
    limite: "",
  },
  {
    code: "tester",
    ordre: 11,
    label: "Tester",
    attendu: "Vérifier après action que le résultat attendu est réellement obtenu.",
    module: "server/resilience/service.ts",
    tables: ["rs_pipeline_runs"],
    autonomie: "execution_validee",
    limite:
      "Les campagnes de non-régression complètes relèvent du Continuous Test Engine (points 108-113), pas encore construit.",
  },
  {
    code: "corriger",
    ordre: 12,
    label: "Corriger seul",
    attendu:
      "Réparer ce qui peut l'être sans risque : redirections cassées, règles supprimées par erreur, 404 récents.",
    module: "server/smart-engine/services/auto-fix.ts",
    tables: ["smart_auto_fixes", "redir_rules"],
    autonomie: "execution_autonome",
    limite: "",
  },
  {
    code: "generer_code",
    ordre: 13,
    label: "Générer du code",
    attendu:
      "Produire un correctif à partir d'un besoin exprimé en langage naturel, dans un environnement isolé.",
    module: "server/command-center/service.ts",
    tables: ["cc_dev_requests"],
    autonomie: "proposition",
    limite:
      "Aucun fournisseur de modèle n'est branché : l'agent s'arrête au plan et le dit, au lieu de faire croire qu'il écrit du code.",
  },
  {
    code: "tester_code",
    ordre: 14,
    label: "Tester le code produit",
    attendu: "Exécuter les tests et la non-régression sur un correctif avant toute validation.",
    module: "server/resilience/service.ts",
    tables: ["rs_pipeline_runs"],
    autonomie: "execution_validee",
    limite: "Dépend de la génération de code, qui n'est pas encore branchée.",
  },
  {
    code: "deployer",
    ordre: 15,
    label: "Déployer selon autorisation",
    attendu:
      "Mettre en production uniquement après passage complet du pipeline et selon le niveau d'autorisation.",
    module: "server/resilience/service.ts",
    tables: ["rs_pipeline_runs"],
    autonomie: "execution_validee",
    limite:
      "La mise en production reste déclenchée par un humain : aucun accès de déploiement n'est confié au système.",
  },
  {
    code: "rollback",
    ordre: 16,
    label: "Revenir en arrière",
    attendu: "Annuler une action produite et restaurer l'état précédent, avec preuve du retour.",
    module: "server/resilience/service.ts",
    tables: ["smart_action_tasks", "rs_pipeline_runs"],
    autonomie: "execution_validee",
    limite: "",
  },
];
