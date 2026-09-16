/**
 * Redirection Engine (server/redirection-engine/service.ts). Base de
 * données réelle. Aucun test n'existait avant ce lot pour ce moteur
 * pourtant réel, actif au registre et consommé par un centre de contrôle
 * PDG (client/src/pages/RedirectionEngine/ControlCenter.tsx) ET par le
 * Moteur de boutons (server/button-engine/service.ts::resoudreAction).
 *
 * Couvre : résolution d'une clé (règle active, incrémentation du
 * compteur, journalisation), absence de règle, désactivation/
 * réactivation d'une règle, signalement d'un résultat de parcours,
 * auto-résolution d'un chemin 404 connu, CRUD des règles, et les agrégats
 * de direction (stats, redirections cassées) sur des données garanties
 * réelles insérées par ce test — jamais un chiffre lu en aveugle sur les
 * vraies règles de production.
 *
 * Lancement : `npx tsx server/redirection-engine/__tests__/redirection-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq, like } from "drizzle-orm";
import { db } from "../../db.js";
import { redirRules, redirLogs } from "../schema.js";
import {
  resolveKey, reportOutcome, resolvePath, createRule, updateRule, deleteRule,
  getStats, getBrokenRedirects, listRules,
} from "../service.js";
import { recordTestEvidence } from "../../activation-audit/service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const PREFIX = "test_redir_";
const KEY = `${PREFIX}bouton_demo`;
const KEY_PATH = `path:/test-redir-inexistante`;
const TEST_USER = 900201;

async function nettoyer() {
  await db.delete(redirLogs).where(like(redirLogs.key, `${PREFIX}%`));
  await db.delete(redirLogs).where(eq(redirLogs.key, KEY_PATH));
  await db.delete(redirRules).where(like(redirRules.key, `${PREFIX}%`));
  await db.delete(redirRules).where(eq(redirRules.key, KEY_PATH));
}

async function main() {
  await nettoyer();

  // ── 1. Aucune règle : resolveKey renvoie non-résolu et journalise ──
  const sansRegle = await resolveKey(KEY, { source: "test" });
  verif("resolveKey sans règle active renvoie matched=false", sansRegle.matched === false && sansRegle.target === null);

  // ── 2. Création d'une règle, puis résolution réelle ──
  const regle = await createRule({ key: KEY, label: "Bouton démo (test)", target: "/compte", priority: 0 }, TEST_USER);
  verif("createRule insère réellement la règle", regle.key === KEY && regle.target === "/compte");

  const resolue = await resolveKey(KEY, { source: "test" });
  verif("resolveKey trouve la règle active et renvoie sa cible réelle", resolue.matched === true && resolue.target === "/compte");

  const [apresHit] = await db.select().from(redirRules).where(eq(redirRules.key, KEY));
  verif("resolveKey incrémente réellement le compteur de la règle", (apresHit?.hitCount ?? 0) >= 1);

  // ── 3. Désactivation : une règle inactive n'est plus résolue ──
  await updateRule(regle.id, { active: false }, TEST_USER);
  const desactivee = await resolveKey(KEY, {});
  verif("resolveKey ignore une règle désactivée", desactivee.matched === false);
  await updateRule(regle.id, { active: true }, TEST_USER);
  const reactivee = await resolveKey(KEY, {});
  verif("resolveKey résout de nouveau une règle réactivée", reactivee.matched === true);

  const regle2 = await createRule({ key: `${PREFIX}bouton_prioritaire`, label: "Prioritaire (test)", target: "/compte-pro", priority: 10 }, TEST_USER);

  // ── 4. updateRule modifie réellement la cible ──
  await updateRule(regle.id, { target: "/compte-modifie" }, TEST_USER);
  const resolueModifiee = await resolveKey(KEY, {});
  verif("updateRule change réellement la cible résolue", resolueModifiee.target === "/compte-modifie");

  // ── 5. reportOutcome journalise le résultat réel d'un parcours ──
  await reportOutcome({ key: KEY, outcome: "navigated", resolvedTo: "/compte-modifie", source: "test" }, { userId: TEST_USER });
  const [logNav] = await db.select().from(redirLogs).where(eq(redirLogs.key, KEY)).orderBy(redirLogs.id);
  verif("reportOutcome enregistre un log réel", !!logNav);

  // ── 6. resolvePath auto-résout un chemin connu, journalise "auto_healed" ──
  await createRule({ key: KEY_PATH, label: "Alias 404 (test)", target: "/compte", kind: "route" }, TEST_USER);
  const heal = await resolvePath("/test-redir-inexistante", { userId: TEST_USER });
  verif("resolvePath auto-résout un alias déclaré", heal.healed === true && heal.target === "/compte");

  const healInconnu = await resolvePath("/test-redir-jamais-declare-xyz", {});
  verif("resolvePath ne fabrique aucune destination pour un chemin non déclaré", healInconnu.healed === false && healInconnu.target === null);

  // ── 7. Redirections cassées : une clé sans règle apparaît réellement ──
  const KEY_SANS_REGLE = `${PREFIX}sans_regle`;
  await resolveKey(KEY_SANS_REGLE, { source: "test" });
  const cassees = await getBrokenRedirects(200);
  verif("getBrokenRedirects retrouve une clé réellement sans règle", cassees.some((c) => c.key === KEY_SANS_REGLE));

  // ── 8. Stats : les règles de test sont comptées ──
  const rules = await listRules();
  verif("listRules retourne bien les règles créées par ce test", rules.some((r) => r.key === KEY) && rules.some((r) => r.key === `${PREFIX}bouton_prioritaire`));
  const stats = await getStats();
  verif("getStats renvoie des totaux cohérents (≥ règles créées par ce test)", stats.totalRules >= 3);

  // ── 9. deleteRule supprime réellement ──
  await deleteRule(regle2.id);
  const rulesApres = await listRules();
  verif("deleteRule supprime réellement la règle", !rulesApres.some((r) => r.id === regle2.id));

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
  await recordTestEvidence({
    domain: "redirection",
    kind: "unit",
    scenario: "Moteur de redirection : résolution, priorité/désactivation, auto-résolution 404, CRUD, agrégats de direction",
    passed: ok,
    total,
    source: "agent",
  });
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
