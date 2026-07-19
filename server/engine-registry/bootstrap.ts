/**
 * MKA.P-MS Engine Registry — Auto-enregistrement des moteurs au démarrage (PR 2).
 *
 * Au démarrage de l'application, chaque moteur existant (Core, Smart, Permission,
 * Redirection) :
 *   - vérifie son contrat ;
 *   - s'enregistre automatiquement dans engine_registry (aucun enregistrement manuel) ;
 *   - déclare sa version ;
 *   - vérifie ses dépendances ;
 *   - signale son état de santé (heartbeat).
 *
 * Si une dépendance est absente / inactive : la plateforme NE plante PAS ; le
 * moteur concerné passe en état de santé "dégradé", une alerte est publiée et
 * l'événement est journalisé.
 *
 * 100 % additif — n'écrit que dans les tables engine_* du registre.
 */
import { ENGINE_CONTRACTS, type EngineContract } from "./contracts.js";
import {
  registerEngine,
  getEngine,
  heartbeat,
  publishEvent,
  journalAdmin,
  type EngineHealth,
} from "./service.js";

interface DependencyCheck {
  ok: boolean;
  missing: string[]; // dépendances absentes du registre
  inactive: string[]; // dépendances présentes mais non actives
}

/** Un moteur est considéré "disponible" comme dépendance s'il est actif/staging/read_only. */
function isAvailableState(state: string | undefined): boolean {
  return state === "active" || state === "staging" || state === "read_only";
}

async function checkDependencies(contract: EngineContract): Promise<DependencyCheck> {
  const missing: string[] = [];
  const inactive: string[] = [];
  for (const depId of contract.dependencies) {
    const dep = await getEngine(depId);
    if (!dep) {
      missing.push(depId);
    } else if (!isAvailableState(dep.state)) {
      inactive.push(depId);
    }
  }
  return { ok: missing.length === 0 && inactive.length === 0, missing, inactive };
}

/** Enregistre un moteur et signale sa santé selon l'état de ses dépendances. */
async function bootEngine(contract: EngineContract): Promise<void> {
  // 1. Auto-enregistrement (idempotent : met à jour métadonnées + version,
  //    ne force pas l'état piloté par le PDG).
  const previous = await getEngine(contract.id);
  await registerEngine({
    name: contract.id,
    label: contract.publicName,
    category: contract.category,
    version: contract.version,
    state: contract.currentState,
    description: contract.description,
    dependencies: contract.dependencies,
  });

  // 2. Journaliser démarrage + éventuel changement de version.
  await journalAdmin(contract.id, previous ? "boot" : "register");
  if (previous && previous.version !== contract.version) {
    await journalAdmin(contract.id, "version_changed", {
      fromState: previous.version,
      toState: contract.version,
    });
  }

  // 3. Vérifier les dépendances.
  const deps = await checkDependencies(contract);
  if (deps.ok) {
    await heartbeat(contract.id, "ok", {
      message: "Démarrage OK, dépendances satisfaites.",
      version: contract.version,
    });
    return;
  }

  // 4. Dépendance absente/inactive → état dégradé + alerte + journal (sans planter).
  const details = [
    deps.missing.length ? `absentes: ${deps.missing.join(", ")}` : "",
    deps.inactive.length ? `inactives: ${deps.inactive.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" ; ");

  const health: EngineHealth = "degraded";
  await heartbeat(contract.id, health, {
    message: `Dépendances manquantes (${details}).`,
    version: contract.version,
  });
  await publishEvent({
    source: contract.id,
    type: "engine.dependency_missing",
    payload: { engine: contract.id, missing: deps.missing, inactive: deps.inactive },
    targets: ["smart", "core"],
  });
  await journalAdmin(contract.id, "dependency_missing", { toState: details });
}

/**
 * Point d'entrée appelé au démarrage du serveur. Ne lève jamais d'exception :
 * toute erreur est journalisée mais n'interrompt pas le démarrage de la plateforme.
 */
export async function bootstrapEngines(): Promise<void> {
  for (const contract of ENGINE_CONTRACTS) {
    try {
      await bootEngine(contract);
    } catch (err) {
      // Erreur critique sur UN moteur : on continue, plateforme non bloquée.
      try {
        await heartbeat(contract.id, "down", {
          message: `Erreur critique au démarrage: ${(err as Error).message}`,
        });
        await journalAdmin(contract.id, "critical_error", {
          toState: (err as Error).message.slice(0, 16),
        });
      } catch {
        // On ne bloque jamais le démarrage à cause du registre.
      }
      console.error(
        `[MKA.P-MS] bootstrap moteur ${contract.id} échoué:`,
        (err as Error).message,
      );
    }
  }
}
