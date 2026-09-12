/**
 * LOT IA01 — rapport « Intelligence Coverage ».
 *
 * Rapport informationnel, jamais un gate de build : à ce stade, la plupart
 * des univers sont honnêtement REGISTERED_NOT_CONNECTED ou
 * NO_INTELLIGENCE_INTEGRATION (attendu — ce lot construit la cartographie et
 * le Context Engine, pas les connexions métier). Faire échouer le build sur
 * ce nombre serait faux : ce n'est pas une régression, c'est l'état réel
 * avant les lots suivants.
 *
 * Réutilise scripts/check-providers.mjs en sous-processus (point 129) plutôt
 * que de réimplémenter sa détection d'appel direct à un fournisseur —
 * ce script ne fait que rapporter son résultat.
 */
import { execFileSync } from "node:child_process";
import { rapportCouverture } from "../server/intelligences/univers/couverture.js";

function appelsProvidersDirects(): { trouves: number; detail: string } {
  try {
    const sortie = execFileSync("node", ["scripts/check-providers.mjs"], { encoding: "utf8" });
    return { trouves: 0, detail: sortie.trim() };
  } catch (e) {
    const sortie = (e as { stdout?: string; stderr?: string }).stderr ?? (e as { stdout?: string }).stdout ?? "";
    const lignes = sortie.split("\n").filter((l) => l.includes(" — "));
    return { trouves: lignes.length, detail: sortie.trim() };
  }
}

function main() {
  const rapport = rapportCouverture();
  const providers = appelsProvidersDirects();

  console.log("=== MKA.P-MS Intelligences — Intelligence Coverage (LOT IA01) ===\n");
  console.log(`univers : ${rapport.univers.total}`);
  for (const [statut, n] of Object.entries(rapport.univers.parStatut)) {
    console.log(`  ${statut} : ${n}`);
  }
  console.log(`  conversationnels : ${rapport.univers.conversationnels} / non conversationnels : ${rapport.univers.nonConversationnels}`);
  console.log(`moteurs : ${rapport.moteurs.couvertsParUnUnivers}/${rapport.moteurs.total}`);
  console.log(`routes : ${rapport.routes.couvertesParUnUnivers}/${rapport.routes.total}`);
  console.log(`outils Tool Registry : ${rapport.outils.actifs} actifs / ${rapport.outils.enregistresNonImplementes} enregistrés non implémentés / ${rapport.outils.total} au total`);
  console.log(`appels providers directs détectés : ${providers.trouves}`);
  console.log("");

  console.log("Détail par univers :");
  for (const u of rapport.detail) {
    console.log(`  [${u.statut}] ${u.universeId} — ${u.nom} (${u.engineIds.length} moteur(s), ${u.routes.length} route(s), ${u.outilsActifs.length} outil(s) actif(s))`);
    if (u.motifStatut) console.log(`      motif : ${u.motifStatut}`);
  }

  console.log(`\n${providers.detail}\n`);
  console.log("Rapport informationnel — jamais un gate de build (voir en-tête du fichier).");
}

main();
