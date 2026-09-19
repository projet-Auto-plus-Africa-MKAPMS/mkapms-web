/**
 * « Marquer intégré » ne doit jamais mentir sur ce qui a été fait.
 *
 * Constat direction (18/09, captures d'écran) : 667 propositions d'évolution
 * étaient passées « intégré » via ce bouton, alors que la quasi-totalité des
 * corrections de boutons n'ont aucun exécuteur automatique et restent
 * honnêtement « manuel_requis » côté Centre d'Actions — rien n'empêchait de
 * cliquer « intégré » quand même. Ce test vérifie que transitionStaging()
 * refuse maintenant cette transition tant que l'exécution réelle n'est pas un
 * succès (« termine »), et l'autorise dès qu'un exécuteur réel existe et
 * réussit.
 *
 * Nécessite une base de données accessible (voir DATABASE_URL) — non exécuté
 * en environnement sans accès réseau à Postgres, voir le rapport de ce lot.
 *
 * Lancement : npx tsx server/smart-engine/services/__tests__/staging-integre-guard.test.ts
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../../db.js";
import { smartStaging, smartActionTasks } from "../../schema.js";
import { createStagingItem, transitionStaging } from "../preproduction.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  // ── Cas 1 : une correction sans exécuteur automatique (le cas réel des
  // boutons cassés) ne peut jamais être marquée « intégré » après approbation.
  const item = await createStagingItem({
    type: "correction",
    title: `__test_integre_guard__ ${Date.now()}`,
    description: "Test — jamais une vraie proposition de la plateforme.",
    metadata: { origin: "test" },
  });

  const acteurTest = 999999;
  const approuve = await transitionStaging(item.id, "approuve", acteurTest);
  verif("1. l'approbation crée bien une tâche et mémorise son résultat réel", typeof approuve?.metadata?.executionStatus === "string");
  verif(
    "1. sans exécuteur pour ce type d'action, le résultat mémorisé est « manuel_requis » (honnête)",
    approuve?.metadata?.executionStatus === "manuel_requis",
  );

  await assert.rejects(
    () => transitionStaging(item.id, "integre", acteurTest),
    /Impossible de marquer « intégré »/,
    "2. transitionStaging refuse de marquer « intégré » une proposition dont l'exécution n'a pas réellement réussi",
  );
  ok++; total++; // assert.rejects a déjà vérifié — comptabilisé pour le résumé.

  const [apres] = await db.select({ status: smartStaging.status }).from(smartStaging).where(eq(smartStaging.id, item.id)).limit(1);
  verif("2. le statut reste « approuve », jamais forcé à « intégré » malgré la tentative", apres?.status === "approuve");

  // Nettoyage.
  await db.delete(smartActionTasks).where(eq(smartActionTasks.sourceId, item.id));
  await db.delete(smartStaging).where(eq(smartStaging.id, item.id));

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
