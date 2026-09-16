/**
 * Activation Audit — régression du bug de circularité staging/non_configuree
 * (point 91 ter). Base de données réelle, aucun mock.
 *
 * `readiness.ts` classe tout moteur `staging` en `non_configure` dès qu'il a
 * un battement de cœur, quelles que soient ses preuves réelles.
 * `reconcileEngineStatesFromEvidence()` ne promeut `staging` → `active` QUE
 * si l'audit rapporte `operationnelle` : un moteur `staging` ne pouvait donc
 * JAMAIS être promu sur preuve. Ce test vérifie sur un vrai moteur du
 * registre (`media_authenticity`, déjà pleinement prouvé : connecté, testé,
 * utilisé, vivant) que son état administratif n'influence plus le calcul de
 * `operationnelle`.
 *
 * Lancement : `npx tsx server/activation-audit/__tests__/activation-audit.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { engineRegistry } from "../../engine-registry/schema.js";
import { runActivationAudit } from "../service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ENGINE = "media_authenticity";

async function main() {
  const [before] = await db.select().from(engineRegistry).where(eq(engineRegistry.name, ENGINE)).limit(1);
  if (!before) {
    console.log(`${ENGINE} absent du registre sur cet environnement — test ignoré (rien à prouver).`);
    process.exit(0);
  }
  const etatInitial = before.state;

  try {
    // ── 1. État administratif "active" : référence ──────────────────────
    await db.update(engineRegistry).set({ state: "active" }).where(eq(engineRegistry.name, ENGINE));
    const auditActif = await runActivationAudit({ trigger: "manuel" });
    const itemActif = auditActif.items.find((i) => i.domain === ENGINE);
    verif(`1. ${ENGINE} pleinement prouvé (connecté/utilisé/testé/vivant) en état 'active'`, itemActif?.connecte === true && itemActif?.utilise === true && itemActif?.teste === true);
    verif(`1b. ${ENGINE} est 'operationnelle' en état 'active'`, itemActif?.etat === "operationnelle");

    // ── 2. Même preuve, mais étiquette administrative 'staging' ─────────
    // Avant le correctif, ceci retombait systématiquement à 'non_configuree'
    // ("En préproduction") sans même regarder connecte/utilise/teste.
    await db.update(engineRegistry).set({ state: "staging" }).where(eq(engineRegistry.name, ENGINE));
    const auditStaging = await runActivationAudit({ trigger: "manuel" });
    const itemStaging = auditStaging.items.find((i) => i.domain === ENGINE);
    verif(
      `2. ${ENGINE} reste 'operationnelle' en état 'staging' — l'étiquette administrative ne doit jamais masquer une preuve réelle`,
      itemStaging?.etat === "operationnelle",
    );
    verif("2b. les preuves elles-mêmes sont inchangées par l'étiquette administrative", itemStaging?.connecte === true && itemStaging?.utilise === true && itemStaging?.teste === true);

    // ── 3. Un vrai échec (santé en panne) reste bien 'hors_service', staging ou non ──
    await db.update(engineRegistry).set({ state: "staging", health: "down" }).where(eq(engineRegistry.name, ENGINE));
    const auditPanne = await runActivationAudit({ trigger: "manuel" });
    const itemPanne = auditPanne.items.find((i) => i.domain === ENGINE);
    verif("3. une vraie panne (health='down') est toujours rapportée 'hors_service', jamais masquée", itemPanne?.etat === "hors_service");
  } finally {
    // Restauration systématique : ce test agit sur un moteur réel du registre.
    await db.update(engineRegistry).set({ state: etatInitial, health: before.health }).where(eq(engineRegistry.name, ENGINE));
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
