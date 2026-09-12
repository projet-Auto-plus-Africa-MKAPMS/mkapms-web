/**
 * LOT IA01/IA02A/IA02B — rapport « Intelligence Coverage ».
 *
 * Rapport informationnel pour la cartographie des univers (jamais un gate de
 * build : la plupart des univers sont honnêtement encore déconnectés, ce
 * n'est pas une régression). Les compteurs de fuite fournisseur du LOT IA02A
 * et le gate conversation du LOT IA02B, eux, DOIVENT rester à leur cible —
 * vérifiés par de vraies commandes (scripts/check-providers.mjs,
 * scripts/check-public-provider-leaks.mjs, scripts/check-intelligence-chat.mjs,
 * les tests d'indépendance et E2E dédiés) plutôt que réimplémentés ici, à
 * l'exception de `cross_user_conversation_access` : lui seul exige une vraie
 * connexion base, déjà ouverte par ce script (rapportCouverture), donc mesuré
 * ici plutôt que dans un script Node statique séparé.
 */
import { execFileSync } from "node:child_process";
import { rapportCouverture } from "../server/intelligences/univers/couverture.js";
import { demander, supprimerConversation, verifierProprieteConversation } from "../server/intelligences/service.js";
import { couverture as couvertureDependances, alertesMigration, registre as registreDependances } from "../server/governance/dependencies.js";

/** Point 15 (LOT IA02B) — un autre compte ne doit jamais accéder à une conversation qu'il n'a pas créée. */
async function verifierIsolationConversation(): Promise<number> {
  try {
    const r = await demander({
      question: "Vérification gate isolation conversation — LOT IA02B.",
      cote: "direction",
      sessionId: null,
      userId: 4,
      role: "super_admin",
    });
    const acces = await verifierProprieteConversation(r.sessionId, 999999);
    await supprimerConversation(r.sessionId);
    return acces.ok ? 1 : 0;
  } catch {
    // Ne peut pas prouver 0 sans preuve réelle : ne jamais déclarer un gate vert par défaut.
    return 1;
  }
}

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
  const chatStatique = executer("node", ["scripts/check-intelligence-chat.mjs"]);
  const testE2eConversation = executer("npx", ["tsx", "server/intelligences/__tests__/conversation-e2e.test.ts"]);
  const testBoucleOutils = executer("npx", ["tsx", "server/intelligences/outils/__tests__/boucle.test.ts"]);
  const testGenerationCode = executer("npx", ["tsx", "server/intelligences/__tests__/generation-code.test.ts"]);
  const testIndependanceOpenai = executer("npx", ["tsx", "server/intelligences/__tests__/independance-openai.test.ts"]);

  const gate = {
    public_provider_names_visible: compte(fuitesPubliques.sortie, "public_provider_names_visible"),
    public_provider_raw_errors: testIndependance.ok ? 0 : 1,
    public_provider_env_names: compte(fuitesPubliques.sortie, "public_provider_env_names"),
    public_provider_urls: compte(fuitesPubliques.sortie, "public_provider_urls"),
    routable_unconnected_provider: rapport.fournisseurs.routableNonConnecte,
  };

  const gateConversation = {
    intelligence_chat_input_real: compte(chatStatique.sortie, "intelligence_chat_input_real"),
    intelligence_chat_backend_connected: compte(chatStatique.sortie, "intelligence_chat_backend_connected"),
    conversation_persistence: compte(chatStatique.sortie, "conversation_persistence"),
    conversation_context_restored: compte(chatStatique.sortie, "conversation_context_restored"),
    fake_chat_controls: compte(chatStatique.sortie, "fake_chat_controls"),
    cross_user_conversation_access: await verifierIsolationConversation(),
    conversation_e2e: testE2eConversation.ok ? 0 : 1,
    boucle_outils: testBoucleOutils.ok ? 0 : 1,
    // Règle permanente n°6 (clôture LOT IA02B) : test de génération de code
    // dans les contrôles périodiques Intelligence.
    generation_code: testGenerationCode.ok ? 0 : 1,
  };
  const cibleConversation: Record<string, number> = {
    intelligence_chat_input_real: 1,
    intelligence_chat_backend_connected: 1,
    conversation_persistence: 1,
    conversation_context_restored: 1,
    fake_chat_controls: 0,
    cross_user_conversation_access: 0,
    conversation_e2e: 0,
    boucle_outils: 0,
    generation_code: 0,
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

  console.log("\n=== LOT IA02B — gate conversation réelle /intelligence ===");
  for (const [cle, valeur] of Object.entries(gateConversation)) console.log(`${cle}=${valeur}`);
  console.log(`test E2E conversation : ${testE2eConversation.ok ? "réussi" : "ÉCHOUÉ — voir détail ci-dessous"}`);
  if (!testE2eConversation.ok) console.log(testE2eConversation.sortie);
  console.log(`test boucle d'outils : ${testBoucleOutils.ok ? "réussi" : "ÉCHOUÉ — voir détail ci-dessous"}`);
  if (!testBoucleOutils.ok) console.log(testBoucleOutils.sortie);
  console.log(`test de génération de code (règle permanente n°6) : ${testGenerationCode.ok ? "réussi" : "ÉCHOUÉ — voir détail ci-dessous"}`);
  if (!testGenerationCode.ok) console.log(testGenerationCode.sortie);
  console.log(`test d'indépendance OpenAI (LOT IA02D, point 19) : ${testIndependanceOpenai.ok ? "réussi" : "ÉCHOUÉ — voir détail ci-dessous"}`);
  if (testIndependanceOpenai.sortie) console.log(testIndependanceOpenai.sortie);

  const couvertureDep = await couvertureDependances();
  const registreDep = await registreDependances();
  const alertes = await alertesMigration();
  console.log("\n=== LOT IA02D — Provider Registry / indépendance API (échéance 27 mars 2027) ===");
  console.log(`external_dependencies_inventoried_pct=${couvertureDep.external_dependencies_inventoried_pct}`);
  console.log(`dependencies_without_adapter=${couvertureDep.dependencies_without_adapter}`);
  console.log(`critical_dependency_without_fallback=${couvertureDep.critical_dependency_without_fallback}`);
  console.log(`dependency_without_exit_plan=${couvertureDep.dependency_without_exit_plan}`);
  console.log(`dependency_without_target_date=${couvertureDep.dependency_without_target_date}`);
  console.log(`independence_test_stale=${couvertureDep.independence_test_stale}`);
  console.log(`dependency_past_target_date=${couvertureDep.dependency_past_target_date}`);
  console.log(`direct_provider_calls=${providersDirects.ok ? 0 : 1}`);
  console.log(`public_provider_leakage=${compte(fuitesPubliques.sortie, "public_provider_names_visible")}`);
  if (couvertureDep.detail.length > 0) {
    console.log("  anomalies (affichées, jamais masquées) :");
    for (const d of couvertureDep.detail) console.log(`    - ${d}`);
  }
  console.log("\nDétail par dépendance :");
  for (const l of registreDep) {
    console.log(
      `  ${l.providerId} — ${l.internalName} — statut migration ${l.statutMigration} — readiness ${l.readiness.pourcentage} % — échéance ${l.targetDisconnectDate ? l.targetDisconnectDate.toLocaleDateString("fr-FR") : "aucune"}`,
    );
    for (const b of l.readiness.bloquants) console.log(`      bloquant : ${b}`);
  }
  if (alertes.length > 0) {
    console.log("\nAlertes migration (point 15) :");
    for (const a of alertes) console.log(`  - ${a}`);
  }

  const gateEnEchecDep =
    couvertureDep.critical_dependency_without_fallback > 0 ||
    couvertureDep.dependency_without_target_date > 0 ||
    couvertureDep.dependency_past_target_date > 0 ||
    !providersDirects.ok;
  console.log(
    gateEnEchecDep
      ? "\n[intelligence-coverage] ÉCHEC : au moins un compteur critique du Provider Registry n'est pas à zéro."
      : "\n[intelligence-coverage] Gate Provider Registry (indicateurs critiques) au vert. dependencies_without_adapter et independence_test_stale restent informationnels : voir détail ci-dessus.",
  );

  const { resume: resumeReglages } = await import("../server/governance/settings-registry.js");
  const { prochaineEcheance } = await import("../server/governance/audit-semestriel.js");
  const reglages = resumeReglages();
  const echeance = await prochaineEcheance();
  console.log("\n=== Gouvernance permanente (clôture LOT IA02B) — informationnel ===");
  console.log(`Settings Registry : ${reglages.total} réglage(s) catalogués.`);
  for (const [etat, n] of Object.entries(reglages.parEtat)) if (n > 0) console.log(`  ${etat} : ${n}`);
  console.log(
    echeance.date
      ? `Prochain audit semestriel : ${echeance.date.toLocaleDateString("fr-FR")}${echeance.enRetard ? " — EN RETARD" : ""} (${echeance.motif})`
      : `Prochain audit semestriel : ${echeance.motif}`,
  );

  const gateConversationEnEchec = Object.entries(gateConversation).some(
    ([cle, valeur]) => Number.isNaN(valeur) || valeur !== cibleConversation[cle],
  );
  console.log(
    gateConversationEnEchec
      ? "\n[intelligence-coverage] ÉCHEC : le gate conversation IA02B n'est pas à sa cible."
      : "\n[intelligence-coverage] Gate conversation IA02B au vert.",
  );

  console.log("Cartographie des univers : rapport informationnel, jamais un gate de build (voir en-tête du fichier).");

  if (gateEnEchec || gateConversationEnEchec || gateEnEchecDep) process.exitCode = 1;
}

main();
