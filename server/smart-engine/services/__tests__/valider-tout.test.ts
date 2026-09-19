/**
 * « Valider tout » (Actions à valider) doit valider RÉELLEMENT toutes les
 * actions en attente de décision humaine — pas seulement celles visibles sur
 * l'écran (limite à 100 lignes) — et ne jamais toucher les actions déjà
 * décidées ou celles qui n'attendent aucune décision (proposedDecision null).
 *
 * Demande directe de la direction (18/09, capture d'écran « Actions à
 * valider ») : de nombreuses actions à valider une par une prennent du temps
 * — un seul bouton doit purger tout le reliquat réel côté serveur.
 *
 * Nécessite une base de données accessible (voir DATABASE_URL).
 * Lancement : npx tsx server/smart-engine/services/__tests__/valider-tout.test.ts
 */
import assert from "node:assert/strict";
import { and, eq, inArray, isNull, isNotNull } from "drizzle-orm";
import { db } from "../../../db.js";
import { smartActivityLog } from "../../schema.js";
import { logActivity, validateAllPending } from "../activity-log.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function pendingCount(): Promise<number> {
  const rows = await db
    .select({ id: smartActivityLog.id })
    .from(smartActivityLog)
    .where(and(isNull(smartActivityLog.humanValidation), isNotNull(smartActivityLog.proposedDecision)));
  return rows.length;
}

async function main() {
  const marqueur = `__test_valider_tout__ ${Date.now()}`;
  const acteurTest = 999999;

  // Base de données partagée par la session : d'autres actions en attente
  // peuvent déjà exister avant ce test — le total réel sert de référence,
  // jamais une hypothèse de table vide.
  const avant = await pendingCount();

  // Trois cas réels mélangés, comme en production :
  // 1) en attente (proposedDecision renseigné, humanValidation null) — doit être validée.
  const enAttente1 = await logActivity({ action: marqueur, proposedDecision: "corriger X" });
  const enAttente2 = await logActivity({ action: marqueur, proposedDecision: "corriger Y" });
  // 2) déjà décidée — ne doit pas être re-validée par un autre acteur.
  const dejaDecidee = await logActivity({ action: marqueur, proposedDecision: "corriger Z" });
  await db.update(smartActivityLog).set({ humanValidation: false, validatedBy: 42 }).where(eq(smartActivityLog.id, dejaDecidee.id));
  // 3) sans décision proposée du tout (simple log) — ne doit jamais être touchée.
  const sansDecision = await logActivity({ action: marqueur });

  const res = await validateAllPending(true, acteurTest);
  verif("1. le nombre validé inclut exactement les 2 nouvelles actions en attente (plus tout reliquat réel préexistant)", res.count === avant + 2);

  const rows = await db
    .select()
    .from(smartActivityLog)
    .where(inArray(smartActivityLog.id, [enAttente1.id, enAttente2.id, dejaDecidee.id, sansDecision.id]));
  const byId = new Map(rows.map((r) => [r.id, r]));

  verif("2. la première action en attente est maintenant validée par l'acteur réel", byId.get(enAttente1.id)?.humanValidation === true && byId.get(enAttente1.id)?.validatedBy === acteurTest);
  verif("2. la seconde action en attente est maintenant validée par l'acteur réel", byId.get(enAttente2.id)?.humanValidation === true && byId.get(enAttente2.id)?.validatedBy === acteurTest);
  verif("3. l'action déjà refusée par un autre acteur n'a pas été réécrasée", byId.get(dejaDecidee.id)?.humanValidation === false && byId.get(dejaDecidee.id)?.validatedBy === 42);
  verif("4. l'action sans décision proposée reste intacte (jamais touchée)", byId.get(sansDecision.id)?.humanValidation === null && byId.get(sansDecision.id)?.validatedBy === null);

  // Rejouer sur un reliquat déjà vide : ne doit rien valider de nouveau (idempotent).
  const res2 = await validateAllPending(true, acteurTest);
  verif("5. rejouer sur un reliquat vide ne valide rien (idempotent, pas de faux positif)", res2.count === 0);

  // Nettoyage.
  await db.delete(smartActivityLog).where(inArray(smartActivityLog.id, [enAttente1.id, enAttente2.id, dejaDecidee.id, sansDecision.id]));

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
