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
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../db.js";
import { smartAlerts, smartHealthChecks } from "../../schema.js";
import { BOUTONS_SANS_ACTION } from "../../../data/boutons-sans-action.js";
import { syncBoutonsSansAction } from "../health-monitor.js";
import { runAlertScan, resolveAlertWithLearning } from "../alert-engine.js";

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

  // ── 3. Un bouton « corrigé » (disparu de l'inventaire) est archivé ──
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
  verif("3. bouton disparu de l'inventaire : obsoletes >= 1", third.obsoletes >= 1);
  const [apresResolution] = await db
    .select({ status: smartHealthChecks.status })
    .from(smartHealthChecks)
    .where(and(eq(smartHealthChecks.page, pageTest), eq(smartHealthChecks.element, elementTest)))
    .limit(1);
  verif("3. la ligne de test est archivée sans faux succès", apresResolution?.status === "archived");
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

  // ── 6. « Résolu » sur un bouton toujours mort dans le code : jamais de faux
  // « ok », jamais de réouverture au scan suivant (bug direction : « je clique
  // Résolu, je rafraîchis, ça revient direct ») ──────────────────────────────
  const resolution = await resolveAlertWithLearning({ id: alertePremier!.id, status: "resolved" });
  verif("6. la résolution d'un bouton toujours mort renvoie un motif honnête", typeof resolution.motifNonCorrige === "string" && resolution.motifNonCorrige.length > 0);
  verif("6. la résolution d'un bouton toujours mort ne prétend pas avoir corrigé la cause", resolution.causeFixed === false);
  const [checkApresResolution] = await db
    .select({ status: smartHealthChecks.status })
    .from(smartHealthChecks)
    .where(and(eq(smartHealthChecks.page, premier.fichier), eq(smartHealthChecks.element, `static_L${premier.ligne}`)))
    .limit(1);
  verif("6. le contrôle de santé reste « broken » (aucun mensonge d'état)", checkApresResolution?.status === "broken");
  const [alerteApresResolution] = await db
    .select({ status: smartAlerts.status })
    .from(smartAlerts)
    .where(eq(smartAlerts.id, alertePremier!.id))
    .limit(1);
  verif(
    "6. l'alerte n'est jamais marquée « resolved » pour une cause qui persiste (rétrogradée en « acknowledged »)",
    alerteApresResolution?.status === "acknowledged",
  );

  // Un nouveau scan ne doit PAS rouvrir l'alerte (lastCheckedAt inchangé, donc
  // pas de nouvelle occurrence prouvée après la résolution) — c'est exactement
  // le bug signalé : avant ce correctif, syncBoutonsSansAction() aurait vu le
  // contrôle de santé passer de « ok » (faussement) à « broken » avec un
  // nouveau lastCheckedAt, ce qui rouvrait l'alerte immédiatement.
  await runAlertScan();
  const [alerteApresScan] = await db
    .select({ id: smartAlerts.id, status: smartAlerts.status })
    .from(smartAlerts)
    .where(sql`${smartAlerts.metadata}->>'signature' = ${signaturePremier}`)
    .orderBy(desc(smartAlerts.id))
    .limit(1);
  verif(
    "6. un scan après résolution ne rouvre pas l'alerte (plus de boucle Résolu → revient direct)",
    alerteApresScan?.status === "acknowledged",
  );

  // Nettoyage : ne pas laisser une alerte « acknowledged » de ce test bloquer
  // la ré-ouverture réelle (étape 4) lors d'une prochaine exécution.
  await db.delete(smartAlerts).where(sql`${smartAlerts.metadata}->>'signature' = ${signaturePremier}`);

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
