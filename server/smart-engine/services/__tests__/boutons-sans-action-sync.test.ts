/**
 * Connexion de l'inventaire statique des boutons sans action au moteur
 * d'alerte en direct — tests réels, base de données réelle.
 *
 * Avant ce lot, un bouton mort (server/data/boutons-sans-action.ts, généré
 * par gen-boutons-sans-action.mjs) n'était visible qu'en CI (`check:boutons`) :
 * jamais alerté côté direction, jamais rejoué par le Smart Engine. Ce test
 * vérifie que syncBoutonsSansAction() connecte réellement les deux, de façon
 * idempotente, et que runAlertScan() lève une vraie alerte pour un bouton
 * mort réel de la plateforme.
 *
 * Lancement : `npx tsx server/smart-engine/services/__tests__/boutons-sans-action-sync.test.ts`
 */
import assert from "node:assert/strict";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../db.js";
import { smartAlerts, smartHealthChecks } from "../../schema.js";
import { BOUTONS_SANS_ACTION } from "../../../data/boutons-sans-action.js";
import { syncBoutonsSansAction } from "../health-monitor.js";
import { runAlertScan } from "../alert-engine.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  verif("0. l'inventaire statique n'est pas vide (sinon ce test ne prouve rien)", BOUTONS_SANS_ACTION.length > 0);

  // ── 1. Premier passage : chaque bouton mort réel devient une ligne "broken" ──
  await syncBoutonsSansAction();
  const brokenRows = await db
    .select({ id: smartHealthChecks.id })
    .from(smartHealthChecks)
    .where(and(sql`${smartHealthChecks.element} LIKE 'static_L%'`, eq(smartHealthChecks.status, "broken")));
  verif(
    "1. exactement un smart_health_checks « broken » par bouton mort réel",
    brokenRows.length === BOUTONS_SANS_ACTION.length,
  );

  // ── 2. Idempotence : un second passage sans changement ne réécrit rien ──
  const second = await syncBoutonsSansAction();
  verif("2. second passage sans changement : synced=0", second.synced === 0);
  verif("2. second passage sans changement : resolved=0", second.resolved === 0);

  // ── 3. Un bouton « corrigé » (disparu de l'inventaire) repasse à "ok" ──
  const pageTest = "client/src/pages/__test_fictif_sync_boutons__.tsx";
  const elementTest = "static_L999999";
  await db.insert(smartHealthChecks).values({
    page: pageTest,
    element: elementTest,
    elementType: "button",
    status: "broken",
    errorDetails: "Ligne de test — jamais dans l'inventaire réel.",
  });
  const third = await syncBoutonsSansAction();
  verif("3. bouton disparu de l'inventaire : resolved >= 1", third.resolved >= 1);
  const [apresResolution] = await db
    .select({ status: smartHealthChecks.status })
    .from(smartHealthChecks)
    .where(and(eq(smartHealthChecks.page, pageTest), eq(smartHealthChecks.element, elementTest)))
    .limit(1);
  verif("3. la ligne de test repasse bien à « ok »", apresResolution?.status === "ok");
  // Nettoyage : cette ligne est un artefact de test, jamais un vrai bouton de la plateforme.
  await db.delete(smartHealthChecks).where(and(eq(smartHealthChecks.page, pageTest), eq(smartHealthChecks.element, elementTest)));

  // ── 4. runAlertScan() lève une vraie alerte pour un bouton mort réel ──────
  const premier = BOUTONS_SANS_ACTION[0];
  const signaturePremier = `health:${premier.fichier}:static_L${premier.ligne}:broken`;
  await runAlertScan();
  const [alertePremier] = await db
    .select({ id: smartAlerts.id, category: smartAlerts.category, severity: smartAlerts.severity })
    .from(smartAlerts)
    .where(and(eq(smartAlerts.status, "open"), sql`${smartAlerts.metadata}->>'signature' = ${signaturePremier}`))
    .limit(1);
  verif("4. le premier bouton mort réel de l'inventaire a une alerte ouverte réelle", Boolean(alertePremier));
  verif("4. l'alerte est catégorisée « bouton »", alertePremier?.category === "bouton");
  verif("4. l'alerte est critique (bouton visible, réellement mort)", alertePremier?.severity === "critical");

  // ── 5. Un second scan ne duplique pas l'alerte déjà ouverte (dédup réelle) ──
  const avant = await db.select({ n: sql<number>`count(*)::int` }).from(smartAlerts).where(sql`${smartAlerts.metadata}->>'signature' = ${signaturePremier}`);
  await runAlertScan();
  const apres = await db.select({ n: sql<number>`count(*)::int` }).from(smartAlerts).where(sql`${smartAlerts.metadata}->>'signature' = ${signaturePremier}`);
  verif("5. un second scan ne recrée pas la même alerte (déduplication réelle)", avant[0].n === apres[0].n);

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
