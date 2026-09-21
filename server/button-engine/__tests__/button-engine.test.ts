/**
 * Button Engine (Architecture 3 — moteur des boutons). Base de données
 * réelle. Aucun test n'existait avant ce lot pour ce moteur pourtant réel
 * et actif au registre (server/engine-registry/catalog.ts::"boutons").
 *
 * Couvre : résolution d'une action déclarée (formulaire, non_branchee,
 * inconnue), signalement d'un clic (heartbeat réel du moteur), et
 * l'inventaire de direction (répartition par genre, actions non branchées,
 * comptage des boutons muets issu de l'inventaire généré).
 *
 * Lancement : `npx tsx server/button-engine/__tests__/button-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { engineRegistry } from "../../schema.js";
import { resoudreAction, signalerClic, inventaire } from "../service.js";
import { ACTIONS_BOUTONS } from "../catalogue.js";
import { BOUTONS_SANS_ACTION } from "../../data/boutons-sans-action.js";
import { recordTestEvidence } from "../../activation-audit/service.js";
import { construireDiagnosticBouton } from "../diagnostic.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  // ── 1. Action connue, sans destination (formulaire) ──
  const formulaire = await resoudreAction("garage_validation_interne");
  verif("resoudreAction reconnaît une action déclarée (formulaire)", formulaire.connue === true && formulaire.genre === "formulaire");
  verif("une action formulaire n'a pas de cible", formulaire.cible === null);

  // ── 2. Action déclarée mais non branchée : la dette est nommée, jamais masquée ──
  const nonBranchee = await resoudreAction("garage_depannage_appel");
  verif("resoudreAction rend \"non_branchee\" explicite", nonBranchee.connue === true && nonBranchee.genre === "non_branchee");
  verif("le manque réel est renvoyé tel que déclaré au catalogue", typeof nonBranchee.manque === "string" && nonBranchee.manque.length > 0);

  // ── 3. Action inconnue du catalogue ──
  const inconnue = await resoudreAction("code_totalement_absent_du_catalogue_test");
  verif("resoudreAction rend une action inconnue explicitement", inconnue.connue === false && typeof inconnue.manque === "string");

  // ── 4. signalerClic journalise et fait battre le cœur du moteur ──
  const [avant] = await db.select({ lastHeartbeat: engineRegistry.lastHeartbeat }).from(engineRegistry).where(eq(engineRegistry.name, "boutons"));
  await new Promise((r) => setTimeout(r, 5));
  const resultat = await signalerClic({ code: "garage_validation_interne", outcome: "navigated" });
  verif("signalerClic confirme l'enregistrement", resultat.recorded === true);
  const [apres] = await db.select({ lastHeartbeat: engineRegistry.lastHeartbeat }).from(engineRegistry).where(eq(engineRegistry.name, "boutons"));
  verif("signalerClic fait battre le cœur réel du moteur « boutons »", !!apres?.lastHeartbeat && (!avant?.lastHeartbeat || apres.lastHeartbeat > avant.lastHeartbeat));

  // ── 5. Inventaire de direction : cohérent avec le catalogue réel ──
  const inv = inventaire();
  const totalParGenre = Object.values(inv.parGenre).reduce((s, n) => s + n, 0);
  verif("inventaire() répartit exactement toutes les actions du catalogue", totalParGenre === ACTIONS_BOUTONS.length);
  verif("inventaire() retrouve l'action non branchée du catalogue", inv.nonBranchees.some((b) => b.code === "garage_depannage_appel"));
  verif("inventaire() reflète le compte réel de boutons muets (audit généré)", inv.boutonsMuets === BOUTONS_SANS_ACTION.length);

  // ── 6. Diagnostic structuré remis à MKA PMS IA ─────────────────────────
  const diagnostic = construireDiagnosticBouton({
    code: "garage_reception_devis",
    source: "/garage/reception-vehicule",
    outcome: "not_found",
    resolvedTo: "/route-absente-test",
    action: ACTIONS_BOUTONS.find((a) => a.code === "garage_reception_devis"),
  });
  verif("diagnostic : identifie le moteur et le composant", diagnostic.moteur === "boutons" && diagnostic.composant === "garage_reception_devis");
  verif("diagnostic : relie route, événement et dépendance", diagnostic.route === "/garage/reception-vehicule" && diagnostic.evenement === "bouton.sans_action" && diagnostic.dependance === "redirection");
  verif("diagnostic : porte gravité, éléments techniques et action possible", diagnostic.gravite === "warning" && diagnostic.elementsTechniques.length >= 3 && diagnostic.actionPossible.length > 0);

  console.log(`\n${ok}/${total} assertions réussies.`);
  await recordTestEvidence({
    domain: "boutons",
    kind: "unit",
    scenario: "Moteur de boutons : résolution d'action, signalement de clic (heartbeat), inventaire de direction",
    passed: ok,
    total,
    source: "agent",
  });
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
