/**
 * MKA.P-MS Engine Registry — Pont des moteurs « OS » (connexion au moteur principal).
 *
 * Les moteurs fondateurs au standard MOS (Identity OS, Country OS, Language OS)
 * ont été développés séparément avec leur propre contrat et leur propre
 * tableau de bord. Ce pont les CONNECTE au registre central / Core Engine :
 *
 *   - enregistrement idempotent dans engine_registry (nom, label, version,
 *     catégorie, dépendances) ;
 *   - remontée de leur santé via un heartbeat, en lisant UNIQUEMENT leur
 *     surface publique `controlCenterFeed()` (règle MOS #11 — aucun accès à
 *     leur logique interne ni à leurs tables).
 *
 * 100 % additif et non bloquant : toute erreur sur un moteur est journalisée
 * mais n'interrompt jamais le démarrage de la plateforme. Ce pont ne modifie
 * pas les moteurs OS ; il ne fait que les brancher sur le registre central.
 */
import { registerEngine, heartbeat, journalAdmin } from "./service.js";
import type { EngineHealth } from "./service.js";

interface OsFeed {
  engine: string;
  label: string;
  version: string;
  health: "ok" | "degraded" | "down" | "unknown";
  status: "active" | "read_only" | "maintenance" | "disabled" | "staging";
}

interface OsEngineBinding {
  name: string;
  category: "transversal";
  dependencies: string[];
  fallbackLabel: string;
  description: string;
  loadFeed: () => Promise<OsFeed>;
}

/** Liste des moteurs OS à connecter, avec leur feed public standardisé. */
const OS_ENGINES: OsEngineBinding[] = [
  {
    name: "country-os",
    category: "transversal",
    dependencies: ["core"],
    fallbackLabel: "Country Operating System",
    description: "Registre mondial des pays et devises.",
    loadFeed: async () => (await import("../country-os/index.js")).controlCenterFeed(),
  },
  {
    name: "language-os",
    category: "transversal",
    dependencies: ["core"],
    fallbackLabel: "Language Operating System",
    description: "Langues, traductions, préférences i18n.",
    loadFeed: async () => (await import("../language-os/index.js")).controlCenterFeed(),
  },
  {
    name: "identity-os",
    category: "transversal",
    dependencies: ["core", "country-os", "language-os"],
    fallbackLabel: "Identity Operating System",
    description: "Identités, rôles, sessions, sécurité (namespace identity.*).",
    loadFeed: async () => (await import("../identity-os/index.js")).controlCenterFeed(),
  },
];

async function bridgeOne(binding: OsEngineBinding): Promise<void> {
  let feed: OsFeed | null = null;
  try {
    feed = await binding.loadFeed();
  } catch (err) {
    // Feed indisponible : on enregistre quand même le moteur (connexion) en
    // état de santé "dégradé", sans bloquer.
    await registerEngine({
      name: binding.name,
      label: binding.fallbackLabel,
      category: binding.category,
      dependencies: binding.dependencies,
      description: binding.description,
      state: "active",
    });
    await heartbeat(binding.name, "degraded", {
      message: `Feed OS indisponible: ${(err as Error).message}`,
    });
    await journalAdmin(binding.name, "register");
    return;
  }

  await registerEngine({
    name: binding.name,
    label: feed.label || binding.fallbackLabel,
    category: binding.category,
    version: feed.version,
    dependencies: binding.dependencies,
    description: binding.description,
    state: feed.status,
  });
  await journalAdmin(binding.name, "register");

  const health: EngineHealth = feed.health ?? "unknown";
  await heartbeat(binding.name, health, {
    message: "Connecté au registre central (pont MOS).",
    version: feed.version,
  });
}

/**
 * Connecte tous les moteurs OS au registre central. Ne lève jamais : chaque
 * moteur est traité indépendamment et une erreur ne bloque pas les autres ni
 * le démarrage de la plateforme.
 */
export async function bridgeOsEngines(): Promise<void> {
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
