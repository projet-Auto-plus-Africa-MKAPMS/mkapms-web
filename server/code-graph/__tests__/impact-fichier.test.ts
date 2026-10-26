/**
 * Régression — Mission #36 (26/10) : l'agent de mission relevait
 * « 0 fichier(s) » pour un périmètre pointant directement sur un fichier
 * existant (`client/src/pages/ListeAttente.tsx`), alors que le relevé de
 * code le connaissait bien (`trouve: true`).
 *
 * Cause : `impact()` ne dérive `fichiers` que depuis les arêtes sortantes
 * « porte » des modules portés par le nœud recherché. Un nœud de type
 * `fichier` visé directement n'a pas d'arête « porte » (elle n'existe
 * qu'entre un moteur et ses modules) et n'est pas lui-même un module : il
 * ne se signale jamais, même quand il est exactement ce qu'on cherche.
 *
 * Test réel contre Postgres (pas de simulation) : nécessite DATABASE_URL
 * pointant une base avec le schéma `cg_*` (drizzle/0090_code_graph.sql).
 */
import assert from "node:assert/strict";
import { db } from "../../db.js";
import { cgSnapshots, cgNodes } from "../schema.js";
import { impact } from "../service.js";

async function main() {
  const [snap] = await db
    .insert(cgSnapshots)
    .values({ generatedAt: new Date() })
    .returning();

  await db.insert(cgNodes).values({
    snapshotId: snap.id,
    type: "fichier",
    key: "fichier:client/src/pages/ListeAttente.tsx",
    label: "client/src/pages/ListeAttente.tsx",
  });

  const res = await impact("fichier:client/src/pages/ListeAttente.tsx");

  assert.equal(res.trouve, true, "le nœud existe dans le relevé : il doit être trouvé");
  assert.equal(res.type, "fichier");
  assert.deepEqual(
    res.fichiers,
    ["client/src/pages/ListeAttente.tsx"],
    "un fichier visé directement doit se citer lui-même, pas rester à 0 fichier(s) malgré « trouvé »",
  );

  console.log("✅ impact() sur un nœud « fichier » direct — se cite lui-même (régression Mission #36 corrigée)");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
