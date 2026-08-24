/**
 * MKA.P-MS Engine Registry — Diagnostic & remédiation des moteurs.
 *
 * Sur le Centre PDG, un moteur affiché « dégradé » ou « HS » ne dit pas
 * POURQUOI il l'est. Ce module produit, moteur par moteur, un diagnostic
 * ACTIONNABLE :
 *   - la sonde a-t-elle vraiment tourné ? Quelles tables manquent en base ?
 *   - le feed « OS » du moteur (controlCenterFeed) est-il joignable ?
 *   - ses dépendances sont-elles présentes et actives ?
 *   - dernier changement de santé + message associé.
 *
 * Il propose aussi une action de remédiation : relancer la sonde du moteur
 * (heartbeat frais) sans redémarrer la plateforme. C'est la seule action
 * qu'un diagnostic peut appliquer seul — toute autre correction (migrations,
 * activation d'une dépendance) reste une décision humaine.
 *
 * 100 % lecture sur les données métier — ne modifie que le journal santé.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { engineRegistry, engineHealthLog } from "./schema.js";
import { ENGINE_PROBES, runProbe, type EngineProbe } from "./probes.js";
import { ENGINE_CONTRACTS } from "./contracts.js";
import { heartbeat, getEngine, type EngineHealth } from "./service.js";

export interface EngineDiagnosis {
  name: string;
  label: string | null;
  state: string;
  health: EngineHealth;
  lastHeartbeat: Date | null;
  lastMessage: string | null;
  /** Origine de la santé : "sonde" | "feed_os" | "contrat" | "aucune". */
  supervisionSource: "sonde" | "feed_os" | "contrat" | "aucune";
  /** Détails de la sonde si applicable. */
  probe?: {
    tablesExpected: number;
    tablesReachable: number;
    missing: string[];
    failed: string[];
  };
  /** État des dépendances déclarées dans le catalogue. */
  dependencies: Array<{
    name: string;
    present: boolean;
    active: boolean;
    health: EngineHealth;
  }>;
  /** Recommandation d'action humaine, s'il y a lieu. */
  recommendation: string | null;
  /** Actions automatiques que le PDG peut déclencher depuis l'interface. */
  actionable: {
    canRetry: boolean;
    retryLabel?: string;
  };
}

/**
 * Cherche la sonde d'un moteur (peut ne pas exister : moteurs OS bridged).
 */
function findProbe(name: string): EngineProbe | undefined {
  return ENGINE_PROBES.find((p) => p.engine === name);
}

/** Vrai si le moteur a un contrat officiel (Core, Smart, Permission, Redirection). */
function hasContract(name: string): boolean {
  return ENGINE_CONTRACTS.some((c) => c.id === name);
}

/** Recommandation humaine à partir des symptômes du moteur. */
function buildRecommendation(d: Omit<EngineDiagnosis, "recommendation" | "actionable">): string | null {
  // Dépendances manquantes → à activer d'abord.
  const depsMissing = d.dependencies.filter((x) => !x.present);
  const depsInactive = d.dependencies.filter((x) => x.present && !x.active);
  if (depsMissing.length > 0) {
    return `Enregistrer d'abord les moteurs manquants : ${depsMissing.map((x) => x.name).join(", ")}.`;
  }
  if (depsInactive.length > 0) {
    return `Activer les moteurs dépendants (actuellement inactifs) : ${depsInactive.map((x) => x.name).join(", ")}.`;
  }
  // Tables manquantes → migration non appliquée.
  if (d.probe && d.probe.missing.length > 0) {
    return `Appliquer les migrations Drizzle : ${d.probe.missing.length} table(s) manquante(s) en base (${d.probe.missing.slice(0, 3).join(", ")}${d.probe.missing.length > 3 ? "…" : ""}). Redéployer ou lancer les migrations.`;
  }
  if (d.probe && d.probe.failed.length > 0) {
    return `Vérifier l'accès base de données : ${d.probe.failed.length} requête(s) en échec (${d.probe.failed.slice(0, 2).join(", ")}${d.probe.failed.length > 2 ? "…" : ""}).`;
  }
  // Feed OS injoignable.
  if (d.supervisionSource === "feed_os" && d.health !== "ok") {
    return `Le feed 'controlCenterFeed()' du moteur ne répond pas. Vérifier son module côté serveur.`;
  }
  // Aucun mécanisme de supervision.
  if (d.supervisionSource === "aucune") {
    return `Aucune sonde ni contrat pour ce moteur. Ajouter une entrée dans ENGINE_PROBES pour qu'il puisse remonter sa santé.`;
  }
  return null;
}

/**
 * Diagnostic complet de tous les moteurs enregistrés. La liste retournée est
 * la même que `listEngines()`, enrichie de la CAUSE de chaque anomalie.
 */
export async function diagnoseAllEngines(): Promise<EngineDiagnosis[]> {
  const engines = await db
    .select()
    .from(engineRegistry)
    .orderBy(engineRegistry.name);

  const byName = new Map(engines.map((e) => [e.name, e]));

  const result: EngineDiagnosis[] = [];
  for (const e of engines) {
    const probe = findProbe(e.name);
    const contract = hasContract(e.name);

    // Origine de la santé
    let source: EngineDiagnosis["supervisionSource"] = "aucune";
    if (contract) source = "contrat";
    else if (probe) source = "sonde";
    else source = "feed_os"; // moteurs OS bridged (identity/country/etc.)

    // Sonde froide (si moteur en dégradé/down, on donne les tables manquantes)
    let probeDetail: EngineDiagnosis["probe"] | undefined;
    if (probe && (e.health === "degraded" || e.health === "down" || e.health === "unknown")) {
      try {
        const p = await runProbe(probe);
        const m = p.metrics as {
          tables: number;
          reachable: number;
          missingTables: string[];
          failedTables: string[];
        };
        probeDetail = {
          tablesExpected: m.tables,
          tablesReachable: m.reachable,
          missing: m.missingTables,
          failed: m.failedTables,
        };
      } catch {
        // Ne bloque pas le diagnostic global.
      }
    }

    // Dépendances déclarées
    const deps = ((e.dependencies as string[] | null) ?? []).map((depName) => {
      const dep = byName.get(depName);
      return {
        name: depName,
        present: !!dep,
        active: dep?.state === "active" || dep?.state === "staging" || dep?.state === "read_only",
        health: (dep?.health ?? "unknown") as EngineHealth,
      };
    });

    // Dernier message de santé
    let lastMessage: string | null = null;
    try {
      const [logRow] = await db
        .select({ message: engineHealthLog.message })
        .from(engineHealthLog)
        .where(eq(engineHealthLog.engineName, e.name))
        .orderBy(desc(engineHealthLog.createdAt))
        .limit(1);
      lastMessage = logRow?.message ?? null;
    } catch {
      lastMessage = null;
    }

    const base: Omit<EngineDiagnosis, "recommendation" | "actionable"> = {
      name: e.name,
      label: e.label,
      state: e.state,
      health: (e.health ?? "unknown") as EngineHealth,
      lastHeartbeat: e.lastHeartbeat ?? null,
      lastMessage,
      supervisionSource: source,
      probe: probeDetail,
      dependencies: deps,
    };

    result.push({
      ...base,
      recommendation: buildRecommendation(base),
      actionable: {
        canRetry: source === "sonde" || source === "feed_os",
        retryLabel: source === "sonde" ? "Relancer la sonde" : "Rafraîchir le feed",
      },
    });
  }
  return result;
}

/**
 * Diagnostic d'un seul moteur (par nom) — mêmes règles que la vue globale.
 */
export async function diagnoseEngine(name: string): Promise<EngineDiagnosis | null> {
  const all = await diagnoseAllEngines();
  return all.find((d) => d.name === name) ?? null;
}

/**
 * Remédiation : relance immédiatement la sonde ou le feed OS d'un moteur, puis
 * renvoie le nouveau diagnostic. Utile pour rétablir sans redéployer un moteur
 * momentanément dégradé (base de données lente, moteur qui vient de terminer
 * sa migration…). Ne touche jamais l'état du moteur, uniquement sa santé.
 */
export async function retryEngineSupervision(name: string): Promise<EngineDiagnosis> {
  const engine = await getEngine(name);
  if (!engine) throw new Error(`Moteur inconnu: ${name}`);

  const probe = findProbe(name);
  if (probe) {
    // Sonde métier : on relance immédiatement, on remonte la santé fraîche.
    const p = await runProbe(probe);
    await heartbeat(name, p.health, { message: p.message, metrics: p.metrics });
  } else if (!hasContract(name)) {
    // Moteur OS (bridged) : on tente à nouveau son feed.
    try {
      const { bridgeOsEngines } = await import("./os-bridge.js");
      await bridgeOsEngines(); // idempotent — refait tous les feeds, y compris celui-ci.
    } catch (err) {
      await heartbeat(name, "degraded", {
        message: `Rafraîchissement feed OS échoué : ${(err as Error).message}`,
      });
    }
  } else {
    // Moteur à contrat officiel : on ne relance pas seul (dépendances à vérifier).
    // On journalise seulement que la demande a eu lieu.
    await heartbeat(name, engine.health as EngineHealth, {
      message: "Relance manuelle demandée par la Direction (aucun changement d'état).",
    });
  }

  const fresh = await diagnoseEngine(name);
  if (!fresh) throw new Error(`Diagnostic post-remédiation introuvable: ${name}`);
  return fresh;
}
