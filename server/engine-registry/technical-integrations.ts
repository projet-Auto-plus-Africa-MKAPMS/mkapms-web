/**
 * MKA.P-MS Engine Registry — Intégrations techniques transversales.
 *
 * Un moteur qui vérifie une session (Identity), écrit un journal d'audit
 * (Audit) ou lit/écrit de la télémétrie (Monitoring/Visibility) ne « dépend »
 * pas de ces moteurs au sens métier : il utilise un service d'infrastructure
 * partagé par toute la plateforme, au même titre qu'une base de données ou un
 * bus d'événements. Compter cette utilisation comme une dépendance de premier
 * rang dans le graphe métier crée des cycles artificiels dès qu'un moteur
 * transversal (Identity, Audit, Smart, Visibility…) a lui-même besoin du
 * socle — ce qui est presque toujours le cas.
 *
 * Ce registre distingue donc :
 *   - dépendance MÉTIER : le moteur a besoin de la logique ou des données
 *     d'un autre domaine pour remplir son propre rôle (ex. Comptabilité a
 *     besoin de Paiement pour rapprocher les écritures) ;
 *   - intégration TECHNIQUE : le moteur traverse une porte d'infrastructure
 *     partagée (vérification de session, journal d'audit, télémétrie,
 *     sécurité) sans que cela ne crée de couplage fonctionnel réel.
 *
 * Conceptuellement, chaque entrée ci-dessous correspond à un port neutre :
 *   core → IdentityGateway → identity   (vérification de session/rôle)
 *   core → AuditSink → audit            (écriture du journal d'audit)
 *   core → TelemetryPort → smart/visibility/ai_learning (santé, lecture
 *                                          d'un résumé, ingestion télémétrie)
 *
 * Cette liste est un CONSTAT VÉRIFIÉ À LA MAIN, pas une heuristique générale :
 * chaque entrée doit être justifiée par une lecture du code source réel avant
 * d'être ajoutée ici (voir la preuve citée en commentaire). Ne jamais y
 * ajouter une dépendance pour faire disparaître une alerte sans avoir vérifié
 * que l'usage est purement technique — dans le doute, c'est une dépendance
 * métier et elle reste dans le graphe de cycles.
 */

/**
 * Pour chaque moteur, les dépendances qu'il déclare mais qui ne comptent que
 * comme intégrations techniques (exclues du graphe de cycles métier, mais
 * toujours visibles pour l'impact en cascade — la coupure réelle existe
 * toujours en cas de panne).
 */
export const TECHNICAL_INTEGRATIONS: Readonly<Record<string, readonly string[]>> = {
  // core (l'orchestrateur central) ne consomme aucune logique métier
  // d'identity/audit/smart/ai_learning/visibility : son surface d'admin
  // (server/central-engines/, server/routers/admin.ts) vérifie une session
  // PDG/direction (pdgProcedure/directionProcedure → IdentityGateway),
  // écrit/lit le journal d'audit (logAction, auditLogs → AuditSink), et lit
  // des résumés en lecture seule pour son tableau de bord (getPlatformHealth,
  // alertLevelStats, aiLearning.summary(), ingestVisibility →
  // TelemetryPort). Vérifié ligne à ligne le 2026-09-11 :
  //   - central-engines/router.ts : pdgProcedure/directionProcedure (session)
  //   - central-engines/index.ts : smart-engine/services/{connectors,
  //     platform-health,alert-engine,auto-optimization}.ts (lecture santé),
  //     ai-learning-os/index.ts → aiLearning.summary() (lecture résumé)
  //   - routers/admin.ts : auth.ts → hashPassword (utilitaire sécurité),
  //     audit.ts → logAction (écriture), auditLogs (lecture pour affichage),
  //     visibility-os/index.ts → ingestVisibility (écriture télémétrie)
  core: ["identity", "audit", "smart", "ai_learning", "visibility"],
};

/** Vrai si la dépendance déclarée `from -> to` est une intégration technique connue. */
export function isTechnicalIntegration(from: string, to: string): boolean {
  return (TECHNICAL_INTEGRATIONS[from] ?? []).includes(to);
}
