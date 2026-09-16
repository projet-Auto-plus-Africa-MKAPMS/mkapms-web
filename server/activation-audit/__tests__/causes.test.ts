/**
 * Matrice de causes (server/activation-audit/causes.ts) — logique pure.
 *
 * Couvre : chacune des 9 phrases fixes que buildItem() peut produire est
 * classée dans le bon code, un domaine cumule plusieurs causes réelles, un
 * domaine sans manque n'apparaît pas dans la matrice, et une phrase
 * inconnue (garde-fou contre un futur ajout non classé) tombe dans OTHER
 * plutôt que d'être silencieusement ignorée.
 *
 * Lancement : `npx tsx server/activation-audit/__tests__/causes.test.ts`
 */
import assert from "node:assert/strict";
import { matriceCauses, type CauseCode } from "../causes.js";
import type { AuditItem } from "../service.js";
import { recordTestEvidence } from "../service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

function itemFactice(domain: string, manquant: string[]): AuditItem {
  return {
    domain, label: domain, category: "test",
    existe: true, connecte: true, active: true, accessible: true,
    teste: true, utilise: true, moteurConnecte: true, systemeIntelligentConnecte: true,
    etat: "partielle", motif: manquant.join(" ; "), preuves: {}, manquant,
  };
}

function causesDe(matrice: ReturnType<typeof matriceCauses>, domain: string): CauseCode[] {
  return matrice.lignes.find((l) => l.domain === domain)?.causes ?? [];
}

async function main() {
  const items: AuditItem[] = [
    itemFactice("sans_backend", ["aucune procédure tRPC exposée pour ce moteur"]),
    itemFactice("sans_dependance", ["dépendance absente du registre : identity"]),
    itemFactice("sans_table", ["table(s) absente(s) : parts_orders"]),
    itemFactice("sans_battement", ["aucun battement de cœur reçu"]),
    itemFactice("battement_perime", ["dernier battement périmé"]),
    itemFactice("sans_frontend", ["aucune route visiteur rattachée"]),
    itemFactice("sans_donnee", ["aucune donnée réelle dans le stockage du domaine"]),
    itemFactice("sans_test", ["aucune preuve de test enregistrée"]),
    itemFactice("degrade", ["le moteur signale un fonctionnement dégradé"]),
    itemFactice("cumul", ["aucune route visiteur rattachée", "aucune donnée réelle dans le stockage du domaine", "aucune preuve de test enregistrée"]),
    itemFactice("phrase_inconnue", ["une phrase que buildItem() ne produit pas encore"]),
    itemFactice("resolu", []),
  ];

  const matrice = matriceCauses(items);

  verif("procédure tRPC absente → NO_BACKEND_ROUTE", causesDe(matrice, "sans_backend").includes("NO_BACKEND_ROUTE"));
  verif("dépendance absente → MISSING_ENGINE", causesDe(matrice, "sans_dependance").includes("MISSING_ENGINE"));
  verif("table absente → MISSING_ENGINE", causesDe(matrice, "sans_table").includes("MISSING_ENGINE"));
  verif("aucun battement → NO_HEALTH_CHECK", causesDe(matrice, "sans_battement").includes("NO_HEALTH_CHECK"));
  verif("battement périmé → NO_HEALTH_CHECK", causesDe(matrice, "battement_perime").includes("NO_HEALTH_CHECK"));
  verif("aucune route visiteur → NO_FRONTEND_CONSUMER", causesDe(matrice, "sans_frontend").includes("NO_FRONTEND_CONSUMER"));
  verif("aucune donnée réelle → NO_REAL_DATA", causesDe(matrice, "sans_donnee").includes("NO_REAL_DATA"));
  verif("aucune preuve de test → NO_TEST_EVIDENCE", causesDe(matrice, "sans_test").includes("NO_TEST_EVIDENCE"));
  verif("fonctionnement dégradé → OTHER", causesDe(matrice, "degrade").includes("OTHER"));
  verif("un domaine cumule bien plusieurs causes réelles", causesDe(matrice, "cumul").length === 3);
  verif("une phrase non reconnue tombe dans OTHER (jamais ignorée)", causesDe(matrice, "phrase_inconnue").includes("OTHER"));
  verif("un domaine sans manque n'apparaît pas dans la matrice", !matrice.lignes.some((l) => l.domain === "resolu"));
  verif("parCause compte bien chaque occurrence (pas seulement chaque domaine)", matrice.parCause.NO_FRONTEND_CONSUMER >= 2 && matrice.parCause.NO_REAL_DATA >= 2 && matrice.parCause.NO_TEST_EVIDENCE >= 2);

  console.log(`\n${ok}/${total} assertions réussies.`);
  await recordTestEvidence({
    domain: "activation_audit",
    kind: "unit",
    scenario: "Matrice de causes : classification exhaustive des 9 phrases fixes de buildItem(), cumul, garde-fou OTHER",
    passed: ok,
    total,
    source: "agent",
  });
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
