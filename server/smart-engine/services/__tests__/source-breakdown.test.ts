/**
 * D'où viennent les visiteurs (Google / réseaux sociaux / direct / autre) — même logique
 * que mkapms-shop (tests/audience-analytics.integration.mjs, PR #471) : une valeur hors
 * liste n'est jamais écrite telle quelle (trackPageVisit revalide même si le routeur tRPC
 * valide déjà l'enum), et les lignes sans catégorie (avant cette fonctionnalité, ou une
 * valeur rejetée) retombent sous 'unknown', jamais fondues dans 'other'.
 *
 * Nécessite une base de données accessible (voir DATABASE_URL) — non exécuté en
 * environnement sans accès réseau à Postgres. N'affirme rien sur les totaux globaux
 * (d'autres lignes réelles peuvent déjà exister) : compare un avant/après sur ses propres
 * insertions seulement.
 *
 * Lancement : npx tsx server/smart-engine/services/__tests__/source-breakdown.test.ts
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../../db.js";
import { smartActivityLog } from "../../schema.js";
import { trackPageVisit, getSourceBreakdown } from "../behavior-tracking.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

function bySource(rows: { source: string; visits: number }[]) {
  return Object.fromEntries(rows.map((r) => [r.source, r.visits]));
}

async function main() {
  const marker = `__test_source_breakdown__${Date.now()}`;

  const before = bySource(await getSourceBreakdown(30));

  await trackPageVisit({ page: marker, source: "google" });
  await trackPageVisit({ page: marker, source: "social" });
  await trackPageVisit({ page: marker, source: "direct" });
  await trackPageVisit({ page: marker, source: "other" });
  // Pas de source du tout (ex. ancienne visite avant cette fonctionnalité) → 'unknown'.
  await trackPageVisit({ page: marker });
  // Valeur hors liste — un appel direct contourne la validation Zod du routeur tRPC ;
  // trackPageVisit doit quand même la rejeter et écrire NULL (donc 'unknown' à la lecture).
  await trackPageVisit({ page: marker, source: "instagram-faux" as any });

  const after = bySource(await getSourceBreakdown(30));

  verif("google : +1 exactement", (after.google ?? 0) - (before.google ?? 0) === 1);
  verif("social : +1 exactement", (after.social ?? 0) - (before.social ?? 0) === 1);
  verif("direct : +1 exactement", (after.direct ?? 0) - (before.direct ?? 0) === 1);
  verif("other : +1 exactement", (after.other ?? 0) - (before.other ?? 0) === 1);
  // 2 lignes retombent sous 'unknown' : l'absence de source et la valeur hors liste rejetée.
  verif("unknown : +2 exactement (absente + valeur rejetée), jamais fondu dans 'other'", (after.unknown ?? 0) - (before.unknown ?? 0) === 2);

  const stored = await db
    .select({ data: smartActivityLog.data })
    .from(smartActivityLog)
    .where(eq(smartActivityLog.targetType, "page"));
  const mine = stored.filter((r: any) => r.data?.page === marker);
  verif("6 lignes réellement insérées pour ce marqueur", mine.length === 6);
  verif("la valeur hors liste n'est jamais écrite telle quelle (NULL, pas 'instagram-faux')", mine.every((r: any) => r.data?.source !== "instagram-faux"));

  // Nettoyage : ne retire que les lignes de ce test, jamais de vraie donnée de visite.
  const rows = await db.select({ id: smartActivityLog.id, data: smartActivityLog.data }).from(smartActivityLog).where(eq(smartActivityLog.targetType, "page"));
  const ids = rows.filter((r: any) => r.data?.page === marker).map((r) => r.id);
  if (ids.length) await db.delete(smartActivityLog).where(inArray(smartActivityLog.id, ids));

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
