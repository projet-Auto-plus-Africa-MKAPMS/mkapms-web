/**
 * MKA.P-MS Engine Registry — Pont des moteurs « OS » (connexion au moteur principal).
 *
 * Les moteurs au standard MOS exposent tous la même surface publique
 * `controlCenterFeed()` (règle MOS #13). Ce pont lit UNIQUEMENT cette surface
 * (aucun accès à leur logique interne ni à leurs tables) et remonte leur santé
 * réelle au registre central via `registerEngine(...)` + `heartbeat(...)`.
 *
 * Objectif Phase 55 : garantir que CHAQUE moteur spécialisé (Notification,
 * Document, Messagerie, Support, Audit, Monitoring, Search, Scheduler, Media,
 * Backup, Contrat, Customer Journey, Apprentissage Intelligence, Identity/Country/Language)
 * remonte son état aux deux moteurs centraux (Intelligence & Décision +
 * Supervision & Opérations) — via le registre central, sans doublon de moteur.
 *
 * 100 % additif et non bloquant : toute erreur sur un moteur est journalisée
 * mais n'interrompt jamais le démarrage de la plateforme.
 */
import { ensureSeeded, heartbeat, registerEngine } from "./service.js";
import type { EngineHealth } from "./service.js";

interface OsFeed {
  version: string;
  health: EngineHealth;
}

interface OsEngineBinding {
  /** Nom canonique dans le catalogue central. */
  name: string;
  label: string;
  category: "core" | "transversal" | "univers";
  dependencies: string[];
  loadFeed: () => Promise<OsFeed>;
}

/**
 * Moteurs OS à connecter (santé remontée au registre central).
 *
 * `loadFeed` importe dynamiquement la surface publique du moteur : on ne
 * dépend jamais de son implémentation interne, seulement de son feed MOS.
 */
const OS_ENGINES: OsEngineBinding[] = [
  // ── Fondateurs (déjà présents dans le catalogue) ──────────────────────
  {
    name: "country",
    label: "Country OS",
    category: "transversal",
    dependencies: ["core"],
    loadFeed: async () => (await import("../country-os/index.js")).controlCenterFeed(),
  },
  {
    name: "language",
    label: "Language OS",
    category: "transversal",
    dependencies: ["core", "country"],
    loadFeed: async () => (await import("../language-os/index.js")).controlCenterFeed(),
  },
  {
    name: "identity",
    label: "Identity OS",
    category: "transversal",
    dependencies: ["core"],
    loadFeed: async () => (await import("../identity-os/index.js")).controlCenterFeed(),
  },
  // ── Moteurs OS transversaux (Phases 42-54) ────────────────────────────
  {
    name: "notification",
    label: "Notification OS",
    category: "transversal",
    dependencies: ["core", "identity", "language"],
    loadFeed: async () => (await import("../notification-os/index.js")).controlCenterFeed(),
  },
  {
    name: "document",
    label: "Document OS",
    category: "transversal",
    dependencies: ["core", "language", "country"],
    loadFeed: async () => (await import("../document-os/index.js")).controlCenterFeed(),
  },
  {
    name: "messaging",
    label: "Messagerie OS",
    category: "transversal",
    dependencies: ["core", "identity", "notification"],
    loadFeed: async () => (await import("../messaging-os/index.js")).controlCenterFeed(),
  },
  {
    name: "support",
    label: "Support OS",
    category: "transversal",
    dependencies: ["core", "identity", "notification"],
    loadFeed: async () => (await import("../support-os/index.js")).controlCenterFeed(),
  },
  {
    name: "contract",
    label: "Contrat OS",
    category: "transversal",
    dependencies: ["core", "document", "scheduler"],
    loadFeed: async () => (await import("../contract-os/index.js")).controlCenterFeed(),
  },
  {
    name: "journey",
    label: "Customer Journey OS",
    category: "transversal",
    dependencies: ["core", "smart"],
    loadFeed: async () => (await import("../customer-journey-os/index.js")).controlCenterFeed(),
  },
  {
    name: "search",
    label: "Search OS",
    category: "transversal",
    dependencies: ["core", "permission"],
    loadFeed: async () => (await import("../search-os/index.js")).controlCenterFeed(),
  },
  {
    name: "scheduler",
    label: "Scheduler OS",
    category: "transversal",
    dependencies: ["core", "notification"],
    loadFeed: async () => (await import("../scheduler-os/index.js")).controlCenterFeed(),
  },
  {
    name: "media",
    label: "Media OS",
    category: "transversal",
    dependencies: ["core"],
    loadFeed: async () => (await import("../media-os/index.js")).controlCenterFeed(),
  },
  {
    name: "monitoring",
    label: "Monitoring OS",
    category: "transversal",
    dependencies: ["core"],
    loadFeed: async () => (await import("../monitoring-os/index.js")).controlCenterFeed(),
  },
  {
    name: "audit",
    label: "Audit OS",
    category: "transversal",
    dependencies: ["core", "identity"],
    loadFeed: async () => (await import("../audit-os/index.js")).controlCenterFeed(),
  },
  {
    name: "backup",
    label: "Backup & Recovery OS",
    category: "transversal",
    dependencies: ["core"],
    loadFeed: async () => (await import("../backup-os/index.js")).controlCenterFeed(),
  },
  {
    name: "ai_learning",
    label: "Apprentissage Intelligence",
    category: "transversal",
    dependencies: ["core", "smart"],
    loadFeed: async () => (await import("../ai-learning-os/index.js")).controlCenterFeed(),
  },
  {
    name: "risque_import",
    label: "Import Risk Engine",
    category: "transversal",
    dependencies: ["politique_pays", "core", "smart"],
    loadFeed: async () => (await import("../import-risk/index.js")).controlCenterFeed(),
  },
  {
    name: "livraison_vehicule",
    label: "Vehicle Delivery Engine",
    category: "univers",
    dependencies: ["core", "smart", "politique_pays"],
    loadFeed: async () =>
      (await import("../vehicle-delivery/index.js")).controlCenterFeed(),
  },
  {
    name: "visibility",
    label: "Global Visibility Engine",
    category: "transversal",
    dependencies: ["core", "seo", "smart"],
    loadFeed: async () => (await import("../visibility-os/index.js")).controlCenterFeed(),
  },
];

async function bridgeOne(binding: OsEngineBinding): Promise<void> {
  // 1. Auto-enregistrement idempotent : garantit que la ligne existe avec ses
  //    métadonnées à jour (ne force pas l'état piloté par le PDG).
  try {
    await registerEngine({
      name: binding.name,
      label: binding.label,
      category: binding.category,
      dependencies: binding.dependencies,
    });
  } catch {
    /* le seed catalogue a peut-être déjà créé la ligne — non bloquant */
  }

  // 2. Lecture de la surface MOS + heartbeat.
  try {
    const feed = await binding.loadFeed();
    await heartbeat(binding.name, feed.health ?? "unknown", {
      version: feed.version,
      message: "Connecté au registre central (pont MOS).",
    });
  } catch (err) {
    // Feed indisponible : la ligne existe déjà — on signale une santé dégradée.
    await heartbeat(binding.name, "degraded", {
      message: `Feed OS indisponible: ${(err as Error).message}`,
    });
  }
}

/**
 * Connecte tous les moteurs OS au registre central. Ne lève jamais : chaque
 * moteur est traité indépendamment et une erreur ne bloque pas les autres ni
 * le démarrage de la plateforme.
 */
export async function bridgeOsEngines(): Promise<void> {
  // Garantit que les moteurs du catalogue existent avant heartbeat. Idempotent.
  try {
    await ensureSeeded();
  } catch (err) {
    console.error(
      "[MKA.P-MS] seed catalogue avant pont OS échoué:",
      (err as Error).message,
    );
  }
  for (const binding of OS_ENGINES) {
    try {
      await bridgeOne(binding);
    } catch (err) {
      console.error(
        `[MKA.P-MS] connexion moteur OS ${binding.name} échouée:`,
        (err as Error).message,
      );
    }
  }
}
