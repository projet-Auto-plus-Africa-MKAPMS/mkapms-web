/**
 * retireOrphanEngines() — un moteur fusionné/retiré du catalogue (ex.
 * l'ancien "encheres", fusionné dans "auction_engine" lors de la
 * reconnexion de /acheter/encheres) ne doit jamais rester en base pour
 * toujours : ensureSeeded() n'ajoute et ne réaligne que ce qui existe
 * encore au catalogue, jamais ne retire. Ce test vérifie le nettoyage réel,
 * base de données réelle, sans mock.
 *
 * Lancement : `npx tsx server/engine-registry/__tests__/orphan-retirement.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { engineRegistry, engineAdminLog } from "../schema.js";
import { ENGINE_CATALOG } from "../catalog.js";
import { ensureSeeded, retireOrphanEngines } from "../service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const FAUX_MOTEUR = "test_orphelin_retire_zz";

async function nettoyer() {
  await db.delete(engineAdminLog).where(eq(engineAdminLog.engineName, FAUX_MOTEUR));
  await db.delete(engineRegistry).where(eq(engineRegistry.name, FAUX_MOTEUR));
}

async function main() {
  await nettoyer();

  verif(
    "le faux moteur n'existe pas dans le catalogue de référence",
    !ENGINE_CATALOG.some((e) => e.name === FAUX_MOTEUR),
  );

  // Simule une ligne seedée avant que son moteur ne soit fusionné/retiré du
  // catalogue — exactement le cas réel de "encheres" avant ce correctif.
  await db.insert(engineRegistry).values({
    name: FAUX_MOTEUR,
    label: "Faux moteur orphelin (test)",
    category: "univers",
    state: "staging",
    dependencies: [],
  });

  const [avant] = await db.select().from(engineRegistry).where(eq(engineRegistry.name, FAUX_MOTEUR)).limit(1);
  verif("la ligne orpheline est bien présente avant le nettoyage", !!avant);

  const orphelins = await retireOrphanEngines();
  verif("retireOrphanEngines() rapporte le faux moteur", orphelins.includes(FAUX_MOTEUR));

  const [apres] = await db.select().from(engineRegistry).where(eq(engineRegistry.name, FAUX_MOTEUR)).limit(1);
  verif("la ligne orpheline a été supprimée du registre", !apres);

  const [logRow] = await db
    .select()
    .from(engineAdminLog)
    .where(eq(engineAdminLog.engineName, FAUX_MOTEUR))
    .limit(1);
  verif("le retrait est journalisé (historique préservé)", logRow?.action === "retired_orphan");

  // Un second appel ne doit rien casser (idempotent) : plus rien à retirer.
  const orphelins2 = await retireOrphanEngines();
  verif("un second appel n'y retrouve plus le faux moteur (idempotent)", !orphelins2.includes(FAUX_MOTEUR));

  // Aucun moteur réel du catalogue n'est jamais candidat au retrait.
  await ensureSeeded();
  const orphelinsReels = await retireOrphanEngines();
  const reels = new Set(ENGINE_CATALOG.map((e) => e.name));
  verif(
    "aucun moteur réel du catalogue n'est jamais retiré",
    orphelinsReels.every((name) => !reels.has(name)),
  );

  await nettoyer();
  console.log(`\n${ok}/${total} vérifications réussies.`);
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await nettoyer().catch(() => {});
    process.exit(1);
  });
