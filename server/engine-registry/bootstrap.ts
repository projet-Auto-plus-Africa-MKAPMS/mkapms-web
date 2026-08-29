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
import { notifyDirection } from "../notification-os/triggers.js";
import { ENGINE_CONTRACTS, type EngineContract } from "./contracts.js";
import { recordState, remember } from "./memory.js";
import { bridgeOsEngines } from "./os-bridge.js";
import { ENGINE_PROBES, runProbe } from "./probes.js";
import {
  registerEngine,
  getEngine,
  heartbeat,
  publishEvent,
  journalAdmin,
  ensureSeeded,
  setState,
  hasManualStateDecision,
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

export interface ReconciliationReport {
  /** Origine des preuves : un audit d'activation daté, ou aucun. */
  source: "audit" | "aucun_audit";
  auditDate: string | null;
  /** Moteurs passés à `active` parce que l'audit les a prouvés opérationnels. */
  promus: string[];
  /** Moteurs laissés en place, avec le manque exact qui l'empêche. */
  refuses: { moteur: string; etat: string; manque: string }[];
}

/**
 * Aligne l'état des moteurs sur la PREUVE, jamais sur une déclaration.
 *
 * Un moteur semé `disabled` ou `staging` ne devient `active` que si le dernier
 * audit d'activation l'a classé « opérationnelle » — c'est-à-dire : procédure
 * tRPC réellement montée, battement de cœur reçu, données réelles en base et
 * preuve de test enregistrée. Sans audit, rien ne bouge : un moteur n'est
 * jamais marqué actif parce que son code existe.
 *
 * Une décision d'état prise par le PDG n'est jamais écrasée.
 */
export async function reconcileEngineStatesFromEvidence(options?: {
  runAudit?: boolean;
}): Promise<ReconciliationReport> {
  const report: ReconciliationReport = {
    source: "aucun_audit",
    auditDate: null,
    promus: [],
    refuses: [],
  };

  const { latestActivationAudit, runActivationAudit } = await import(
    "../activation-audit/service.js"
  );
  const audit = options?.runAudit
    ? await runActivationAudit({ trigger: "reconciliation_moteurs" })
    : await latestActivationAudit();
  if (!audit) return report;

  report.source = "audit";
  report.auditDate = audit.checkedAt;

  for (const item of audit.items) {
    try {
      const engine = await getEngine(item.domain);
      if (!engine) continue;
      if (engine.state !== "disabled" && engine.state !== "staging") continue;

      if (item.etat !== "operationnelle") {
        report.refuses.push({
          moteur: item.domain,
          etat: engine.state,
          manque: item.manquant.length > 0 ? item.manquant.join(" ; ") : item.motif,
        });
        continue;
      }

      if (await hasManualStateDecision(item.domain)) continue;

      await setState(item.domain, "active");
      await journalAdmin(item.domain, "activation_prouvee", {
        fromState: engine.state,
        toState: "active",
      });
      report.promus.push(item.domain);
      console.log(
        `[MKA.P-MS] moteur ${item.domain}: activation prouvée par l'audit → active`,
      );
    } catch (err) {
      console.error(
        `[MKA.P-MS] réconciliation moteur ${item.domain} échouée:`,
        (err as Error).message,
      );
    }
  }

  return report;
}

/**
 * Fait battre le cœur des moteurs métier qui n'ont pas de surface MOS.
 * Sans cela ils restent en santé `unknown` à vie et paraissent hors service.
 * Chaque sonde est isolée : un domaine en panne n'empêche pas les autres de
 * se signaler.
 */
async function probeBusinessEngines(): Promise<void> {
  for (const probe of ENGINE_PROBES) {
    try {
      const result = await runProbe(probe);
      await heartbeat(probe.engine, result.health, {
        message: result.message,
        metrics: result.metrics,
      });
      // Mémoire du moteur (point 40) : l'état est conservé, et seul un vrai
      // changement d'état alerte la direction — sinon la même panne serait
      // renotifiée à chaque passage de sonde.
      const state = await recordState(probe.engine, result.health, result.message);
      if (state.changed && result.health === "down") {
        await remember({
          engineKey: probe.engine,
          scope: "anomalie",
          kind: "hors_service",
          refKey: result.message ?? "hors service",
          label: result.message ?? "Moteur hors service",
          value: { health: result.health, metrics: result.metrics ?? null },
        });
        await notifyDirection(
          "moteur_hors_service",
          { moteur: probe.engine, detail: result.message ?? "Sonde en échec." },
          "/admin/moteurs",
        );
      }

      // Une incapacité réelle est remontée au Core et au Système Intelligent
      // pour analyse ; la simple charge métier ne l'est pas.
      if (result.health !== "ok") {
        await publishEvent({
          source: probe.engine,
          type: "engine.probe_failed",
          payload: { engine: probe.engine, health: result.health, ...result.metrics },
          targets: ["smart", "core"],
        });
      }
    } catch (err) {
      console.error(
        `[MKA.P-MS] sonde moteur ${probe.engine} échouée:`,
        (err as Error).message,
      );
    }
  }
}

/**
 * Point d'entrée appelé au démarrage du serveur. Ne lève jamais d'exception :
 * toute erreur est journalisée mais n'interrompt pas le démarrage de la plateforme.
 */
export async function bootstrapEngines(): Promise<void> {
  // Le catalogue doit exister AVANT la vérification des dépendances : sinon un
  // moteur était déclaré dégradé simplement parce que sa dépendance n'avait pas
  // encore été semée.
  try {
    await ensureSeeded();
  } catch (err) {
    console.error(
      "[MKA.P-MS] seed du catalogue échoué:",
      (err as Error).message,
    );
  }

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

  // Connecte les moteurs « OS » (Identity / Country / Language) au registre
  // central via leur surface publique. Non bloquant.
  try {
    await bridgeOsEngines();
  } catch (err) {
    console.error(
      "[MKA.P-MS] connexion des moteurs OS échouée:",
      (err as Error).message,
    );
  }

  // Aligne les états sur les preuves du dernier audit d'activation (jamais sur
  // une simple déclaration). Aucun audit exécuté ici : le démarrage reste court.
  try {
    const r = await reconcileEngineStatesFromEvidence();
    if (r.promus.length > 0) {
      console.log(
        `[MKA.P-MS] ${r.promus.length} moteur(s) activé(s) sur preuve d'audit : ${r.promus.join(", ")}`,
      );
    }
  } catch (err) {
    console.error(
      "[MKA.P-MS] réconciliation des états moteurs échouée:",
      (err as Error).message,
    );
  }

  // Moteurs métier : sonde réelle de leur propre domaine.
  await probeBusinessEngines();

  // Journal des modifications d'agents : relève les migrations réellement
  // appliquées en base. Sans ce relevé, le journal reposerait sur de simples
  // déclarations sans preuve.
  try {
    const { syncAppliedMigrations } = await import("./agent-changes.js");
    const r = await syncAppliedMigrations();
    if (r.nouvelles > 0) {
      console.log(
        `[MKA.P-MS] journal des modifications : ${r.nouvelles} migration(s) relevée(s) sur ${r.releve}`,
      );
    }
  } catch (err) {
    console.error(
      "[MKA.P-MS] relevé des migrations échoué:",
      (err as Error).message,
    );
  }
}

/**
 * Supervision continue. Le registre ne se rafraîchissait qu'au démarrage du
 * serveur : un moteur rétabli restait affiché en panne jusqu'au redéploiement
 * suivant, et un moteur tombé après le démarrage n'était jamais signalé.
 * Cette passe périodique fait vivre les moteurs sans intervention humaine.
 */
export async function superviseEngines(): Promise<void> {
  try {
    await bridgeOsEngines();
  } catch (err) {
    console.error("[MKA.P-MS] supervision OS échouée:", (err as Error).message);
  }
  await probeBusinessEngines();
}
