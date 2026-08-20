/**
 * MKA.P-MS — Coordination des deux grands moteurs centraux (Phase 55).
 *
 * À ce stade, deux moteurs centraux deviennent les « chefs d'orchestre ».
 * Ce module NE CRÉE AUCUN nouveau moteur : c'est une couche de coordination
 * STRICTEMENT EN LECTURE qui agrège les surfaces publiques déjà existantes
 * (registre central des moteurs, Smart Engine, Apprentissage Intelligence, alertes,
 * santé plateforme). Aucune écriture, aucune décision autonome.
 *
 *  ┌──────────────────────────────────────────────────────────────────────┐
 *  │ Moteur 1 — Intelligence & Décision (PDG uniquement)                    │
 *  │   dialogue avec le PDG · analyse · prépare des recommandations ·       │
 *  │   explique ses propositions · ATTEND la validation avant toute action  │
 *  │   sensible.  → readOnly, humanValidationRequired.                      │
 *  ├──────────────────────────────────────────────────────────────────────┤
 *  │ Moteur 2 — Supervision & Opérations (PDG + Directeur)                  │
 *  │   surveille tous les moteurs · contrôle leur santé · détecte les       │
 *  │   anomalies · lance les vérifications · centralise les rapports.       │
 *  └──────────────────────────────────────────────────────────────────────┘
 *
 * Chaque moteur spécialisé remonte ses informations à ces deux moteurs via le
 * registre central (voir `engine-registry/os-bridge.ts`, Phase 55).
 */
import { getEnginesOverview } from "../smart-engine/services/connectors.js";
import { getPlatformHealth } from "../smart-engine/services/platform-health.js";
import { getStats } from "../engine-registry/service.js";
import { alertLevelStats } from "../smart-engine/services/alert-engine.js";
import * as aiLearning from "../ai-learning-os/index.js";
import { listOptimizations } from "../smart-engine/services/auto-optimization.js";

export const CENTRAL_ENGINES_META = {
  version: "1.0.0" as const,
  intelligence: {
    key: "intelligence_decision" as const,
    label: "Intelligence & Décision" as const,
    access: "pdg" as const,
    readOnly: true as const,
    humanValidationRequired: true as const,
  },
  supervision: {
    key: "supervision_operations" as const,
    label: "Supervision & Opérations" as const,
    access: "direction" as const, // PDG + Directeur
    readOnly: true as const,
  },
};

// ── Moteur 2 — Supervision & Opérations (PDG + Directeur) ─────────────────

export interface SupervisionReport {
  generatedAt: string;
  /** Synthèse registre : total/actifs/dégradés/en panne + événements. */
  registry: Awaited<ReturnType<typeof getStats>>;
  /** État de santé consolidé de la plateforme (temps réel). */
  platformHealth: Awaited<ReturnType<typeof getPlatformHealth>>;
  /** Chaque moteur installé + sa santé/état/version/dernier signal. */
  engines: Array<{
    key: string;
    name: string;
    category: string;
    state: string;
    health: string;
    version: string;
    lastHeartbeat: string | null;
  }>;
  /** Anomalies détectées automatiquement (moteurs non-OK ou sans signal). */
  anomalies: Array<{
    engine: string;
    label: string;
    kind: "health" | "no_heartbeat" | "state";
    detail: string;
  }>;
  /** Répartition des alertes ouvertes par niveau. */
  alerts: Awaited<ReturnType<typeof alertLevelStats>>;
}

const STALE_HEARTBEAT_MS = 15 * 60 * 1000; // 15 min sans signal ⇒ anomalie

/**
 * Rapport centralisé de supervision : agrège l'état de TOUS les moteurs, la
 * santé plateforme et les alertes, et détecte les anomalies. Lecture seule.
 */
export async function supervisionReport(): Promise<SupervisionReport> {
  const [registry, platformHealth, overview, alerts] = await Promise.all([
    getStats(),
    getPlatformHealth(),
    getEnginesOverview(),
    alertLevelStats(),
  ]);

  const now = Date.now();
  const anomalies: SupervisionReport["anomalies"] = [];
  const engines = overview.map((e) => {
    // Anomalie 1 : santé dégradée / en panne.
    if (e.health === "degraded" || e.health === "down") {
      anomalies.push({
        engine: e.key,
        label: e.name,
        kind: "health",
        detail: `Santé « ${e.health} ».`,
      });
    }
    // Anomalie 2 : moteur en service mais sans signal récent.
    const live = e.status === "actif";
    if (live) {
      const hb = e.lastHeartbeat ? new Date(e.lastHeartbeat).getTime() : 0;
      if (!hb || now - hb > STALE_HEARTBEAT_MS) {
        anomalies.push({
          engine: e.key,
          label: e.name,
          kind: "no_heartbeat",
          detail: e.lastHeartbeat
            ? `Dernier signal ${new Date(e.lastHeartbeat).toISOString()}.`
            : "Aucun signal reçu.",
        });
      }
    }
    return {
      key: e.key,
      name: e.name,
      category: e.category,
      state: e.state,
      health: e.health,
      version: e.version,
      lastHeartbeat: e.lastHeartbeat,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    registry,
    platformHealth,
    engines,
    anomalies,
    alerts,
  };
}

// ── Moteur 1 — Intelligence & Décision (PDG uniquement) ───────────────────

export interface IntelligenceReport {
  generatedAt: string;
  readOnly: true;
  humanValidationRequired: true;
  /** Ce que la plateforme a appris et retenu (Apprentissage Intelligence). */
  learning: Awaited<ReturnType<typeof aiLearning.summary>>;
  /**
   * Recommandations / améliorations préparées, EN ATTENTE de validation
   * humaine (PDG). Le moteur explique chaque proposition ; il n'exécute rien.
   */
  recommendations: Array<{
    id: number;
    category: string;
    title: string;
    impact: string | null;
    explanation: string;
    createdAt: string | null;
  }>;
  /** Compteur global d'actions en attente de décision du PDG. */
  pendingDecisions: number;
}

/**
 * Rapport d'intelligence : prépare des recommandations à partir des données
 * réelles (apprentissage + optimisations proposées) et les explique, en
 * attendant la validation du PDG. Lecture seule, aucune action sensible.
 */
export async function intelligenceReport(): Promise<IntelligenceReport> {
  const [learning, proposed] = await Promise.all([
    aiLearning.summary(),
    listOptimizations(undefined, "proposed", 50),
  ]);

  const recommendations = proposed.map((o) => ({
    id: o.id,
    category: o.category,
    title: o.title,
    impact: o.impact ?? null,
    explanation:
      `Proposition « ${o.title} » (catégorie ${o.category}). ` +
      `Impact estimé : ${o.impact ?? "non chiffré"}. ` +
      `Cette proposition reste en attente de votre validation avant toute application.`,
    createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
  }));

  return {
    generatedAt: new Date().toISOString(),
    readOnly: true,
    humanValidationRequired: true,
    learning,
    recommendations,
    pendingDecisions: recommendations.length,
  };
}
