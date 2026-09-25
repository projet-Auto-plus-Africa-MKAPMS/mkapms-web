/** Test pur du contrat Button Engine → MKA PMS IA, sans PostgreSQL. */
import assert from "node:assert/strict";
import { actionParCode } from "../catalogue.js";
import { construireDiagnosticBouton } from "../diagnostic.js";

const destination = construireDiagnosticBouton({
  code: "garage_reception_devis",
  source: "/garage/reception-vehicule",
  outcome: "not_found",
  resolvedTo: "/route-absente-test",
  action: actionParCode("garage_reception_devis"),
});
assert.equal(destination.moteur, "boutons");
assert.equal(destination.typeErreur, "destination_introuvable");
assert.equal(destination.dependance, "redirection");
assert.equal(destination.route, "/garage/reception-vehicule");
assert.ok(destination.actionPossible.includes("Redirection"));

const inconnue = construireDiagnosticBouton({
  code: "test_action_absente",
  source: "/test",
  outcome: "not_found",
});
assert.equal(inconnue.typeErreur, "action_non_declaree");
assert.equal(inconnue.dependance, "catalogue_boutons");
assert.equal(inconnue.gravite, "important");

const nonBranchee = construireDiagnosticBouton({
  code: "garage_depannage_appel",
  outcome: "not_found",
  action: actionParCode("garage_depannage_appel"),
});
assert.equal(nonBranchee.typeErreur, "action_non_branchee");
assert.equal(nonBranchee.dependance, "service_proprietaire");
assert.ok(nonBranchee.contexte.includes("téléphone"));

console.log("9/9 assertions diagnostic bouton réussies.");
