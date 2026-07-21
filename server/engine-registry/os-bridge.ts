/**
 * MKA.P-MS Engine Registry — Pont des moteurs « OS » (connexion au moteur principal).
 *
 * Les moteurs fondateurs au standard MOS (Identity OS, Country OS, Language OS)
 * sont déclarés dans le catalogue central (`identity`, `country`, `language`) et
 * donc seedés dans `engine_registry`. Mais ils n'émettent pas eux-mêmes de
 * heartbeat : sans ce pont, leur santé resterait « inconnue ».
 *
 * Ce pont lit UNIQUEMENT leur surface publique `controlCenterFeed()` (règle MOS
 * #11 — aucun accès à leur logique interne ni à leurs tables) et remonte leur
 * santé réelle au registre central via `heartbeat(...)`. Il ne modifie jamais
 * les métadonnées déclarées de ces moteurs (label, dépendances, catégorie).
 *
 * 100 % additif et non bloquant : toute erreur sur un moteur est journalisée
 * mais n'interrompt jamais le démarrage de la plateforme.
 */
import { ensureSeeded, heartbeat } from "./service.js";
import type { EngineHealth } from "./service.js";

interface OsFeed {
  version: string;
  health: EngineHealth;
}

interface OsEngineBinding {
  /** Nom canonique dans le catalogue central. */
  name: string;
  loadFeed: () => Promise<OsFeed>;
}

/** Moteurs OS à connecter (santé remontée au registre central). */
const OS_ENGINES: OsEngineBinding[] = [
  {
    name: "country",
    loadFeed: async () => (await import("../country-os/index.js")).controlCenterFeed(),
  },
  {
    name: "language",
    loadFeed: async () => (await import("../language-os/index.js")).controlCenterFeed(),
  },
  {
    name: "identity",
    loadFeed: async () => (await import("../identity-os/index.js")).controlCenterFeed(),
  },
];

async function bridgeOne(binding: OsEngineBinding): Promise<void> {
  try {
    const feed = await binding.loadFeed();
    await heartbeat(binding.name, feed.health ?? "unknown", {
      version: feed.version,
      message: "Connecté au registre central (pont MOS).",
    });
  } catch (err) {
    // Feed indisponible : la ligne existe déjà (seed catalogue) — on signale
    // simplement une santé dégradée, sans bloquer.
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
  // Garantit que les moteurs du catalogue (dont identity/country/language)
  // existent avant de leur envoyer un heartbeat. Idempotent.
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
