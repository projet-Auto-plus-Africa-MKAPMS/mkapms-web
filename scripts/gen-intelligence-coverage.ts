/**
 * LOT IA01/IA02A — rapport « Intelligence Coverage ».
 *
 * Rapport informationnel pour la cartographie des univers (jamais un gate de
 * build : la plupart des univers sont honnêtement encore déconnectés, ce
 * n'est pas une régression). Les cinq compteurs de fuite fournisseur du LOT
 * IA02A, eux, DOIVENT rester à 0 — ils sont vérifiés par de vraies commandes
 * (scripts/check-providers.mjs, scripts/check-public-provider-leaks.mjs, le
 * test d'indépendance dédié) plutôt que réimplémentés ici.
 */
import { execFileSync } from "node:child_process";
import { rapportCouverture } from "../server/intelligences/univers/couverture.js";

function executer(commande: string, args: string[]): { ok: boolean; sortie: string } {
  try {
    const sortie = execFileSync(commande, args, { encoding: "utf8" });
    return { ok: true, sortie: sortie.trim() };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, sortie: (err.stderr ?? err.stdout ?? "").trim() };
  }
}

function compte(sortie: string, cle: string): number {
  const m = sortie.match(new RegExp(`${cle}=(\\d+)`));
  return m ? Number(m[1]) : NaN;
}

async function main() {
  const rapport = await rapportCouverture();
  const providersDirects = executer("node", ["scripts/check-providers.mjs"]);
  const fuitesPubliques = executer("node", ["scripts/check-public-provider-leaks.mjs"]);
  const testIndependance = executer("npx", ["tsx", "server/intelligences/__tests__/fuite-fournisseurs.test.ts"]);

  const gate = {
    public_provider_names_visible: compte(fuitesPubliques.sortie, "public_provider_names_visible"),
    public_provider_raw_errors: testIndependance.ok ? 0 : 1,
    public_provider_env_names: compte(fuitesPubliques.sortie, "public_provider_env_names"),
    public_provider_urls: compte(fuitesPubliques.sortie, "public_provider_urls"),
    routable_unconnected_provider: rapport.fournisseurs.routableNonConnecte,
  };

  console.log("=== MKA.P-MS Intelligences — Intelligence Coverage ===\n");
  console.log(`univers : ${rapport.univers.total}`);
  for (const [statut, n] of Object.entries(rapport.univers.parStatut)) {
    console.log(`  ${statut} : ${n}`);
  }
  console.log(`  conversationnels : ${rapport.univers.conversationnels} / non conversationnels : ${rapport.univers.nonConversationnels}`);
  console.log(`moteurs : ${rapport.moteurs.couvertsParUnUnivers}/${rapport.moteurs.total}`);
  console.log(`routes : ${rapport.routes.couvertesParUnUnivers}/${rapport.routes.total}`);
  console.log(`outils Tool Registry : ${rapport.outils.actifs} actifs / ${rapport.outils.enregistresNonImplementes} enregistrés non implémentés / ${rapport.outils.total} au total`);
  console.log("");

  console.log("Détail par univers :");
  for (const u of rapport.detail) {
    console.log(`  [${u.statut}] ${u.universeId} — ${u.nom} (${u.engineIds.length} moteur(s), ${u.routes.length} route(s), ${u.outilsActifs.length} outil(s) actif(s))`);
    if (u.motifStatut) console.log(`      motif : ${u.motifStatut}`);
  }

  console.log("\n=== LOT IA02A — gate fuites fournisseurs (doit rester à 0 partout) ===");
  for (const [cle, valeur] of Object.entries(gate)) {
    console.log(`${cle}=${valeur}`);
  }
  if (rapport.fournisseurs.detailRoutableNonConnecte.length > 0) {
    console.log("  détail routable_unconnected_provider :");
    for (const d of rapport.fournisseurs.detailRoutableNonConnecte) console.log(`    - ${d}`);
  }
  console.log(`\nappels providers directs (scripts/check-providers.mjs) : ${providersDirects.ok ? "0" : "voir détail ci-dessous"}`);
  if (!providersDirects.ok) console.log(providersDirects.sortie);
  console.log(`test d'indépendance fournisseurs : ${testIndependance.ok ? "réussi" : "ÉCHOUÉ — voir détail ci-dessous"}`);
  if (!testIndependance.ok) console.log(testIndependance.sortie);

  const gateEnEchec = Object.values(gate).some((v) => Number.isNaN(v) || v > 0);
  console.log(
    gateEnEchec
      ? "\n[intelligence-coverage] ÉCHEC : au moins un compteur de fuite fournisseur est au-dessus de 0."
      : "\n[intelligence-coverage] Gate fuites fournisseurs au vert.",
  );
  console.log("Cartographie des univers : rapport informationnel, jamais un gate de build (voir en-tête du fichier).");

  if (gateEnEchec) process.exitCode = 1;
}

main();
