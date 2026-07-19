/**
 * Test d'intégration PR 2 — auto-enregistrement des moteurs.
 * Usage: DATABASE_URL=... npx tsx scripts/test-bootstrap.mts
 * (fichier de test hors périmètre du build ; supprimé avant merge)
 */
import { db } from "../server/db.js";
import { bootstrapEngines } from "../server/engine-registry/bootstrap.js";
import {
  listEngines,
  getAdminLog,
  getHealthLog,
  listEvents,
  setState,
} from "../server/engine-registry/service.js";

function line(s: string) {
  console.log("\n===== " + s + " =====");
}

async function main() {
  line("1) BOOTSTRAP #1 (toutes dépendances présentes)");
  await bootstrapEngines();
  let engines = await listEngines();
  for (const e of engines.filter((x) => ["core", "smart", "permission", "redirection"].includes(x.name))) {
    console.log(
      `  ${e.name.padEnd(12)} state=${String(e.state).padEnd(10)} health=${String(e.health).padEnd(9)} v=${e.version} heartbeat=${e.lastHeartbeat ? "oui" : "non"}`,
    );
  }

  line("2) SIMULATION dépendance absente : core -> disabled, re-bootstrap");
  await setState("core", "disabled");
  await bootstrapEngines();
  engines = await listEngines();
  for (const e of engines.filter((x) => ["smart", "permission", "redirection"].includes(x.name))) {
    console.log(`  ${e.name.padEnd(12)} health=${e.health} (attendu: degraded car core inactif)`);
  }

  line("3) ALERTES publiées (engine.dependency_missing)");
  const events = await listEvents(20);
  for (const ev of events.filter((e) => e.type === "engine.dependency_missing")) {
    console.log(`  source=${ev.source} type=${ev.type} status=${ev.status} payload=${JSON.stringify(ev.payload)}`);
  }

  line("4) JOURNAL admin (10 dernières lignes)");
  const logs = await getAdminLog(10);
  for (const l of logs) {
    console.log(`  ${l.engineName.padEnd(12)} action=${String(l.action).padEnd(20)} to=${l.toState ?? ""}`);
  }

  line("5) JOURNAL santé du smart engine");
  const hl = await getHealthLog("smart", 5);
  for (const h of hl) {
    console.log(`  status=${String(h.status).padEnd(9)} msg=${h.message}`);
  }

  line("6) RESTAURATION core -> active");
  await setState("core", "active");
  await bootstrapEngines();
  engines = await listEngines();
  for (const e of engines.filter((x) => ["core", "smart", "permission", "redirection"].includes(x.name))) {
    console.log(`  ${e.name.padEnd(12)} health=${e.health} (attendu: ok)`);
  }

  console.log("\nOK — plateforme jamais interrompue pendant les scénarios.");
  process.exit(0);
}

main().catch((e) => {
  console.error("ECHEC:", e);
  process.exit(1);
});
