/** Gate structurel pur : aucune connexion PostgreSQL ni fournisseur. */
import assert from "node:assert/strict";
import { MOTEURS } from "../../data/moteurs.js";
import { construireMatriceEngineGateway } from "../moteurs.js";

const matrice = construireMatriceEngineGateway();
assert.equal(matrice.length, MOTEURS.length, "chaque moteur généré doit être découvrable");
assert.equal(new Set(matrice.map((m) => m.engineId)).size, matrice.length, "engineId uniques");

for (const moteur of matrice) {
  assert.ok(moteur.canonicalOwner);
  assert.ok(moteur.intelligenceConnection);
  assert.ok(Array.isArray(moteur.actions));
  assert.ok(Array.isArray(moteur.tests));
  assert.ok(moteur.diagnostics.includes("contrat:DiagnosticMoteur"));
  if (moteur.actionableByIntelligence) assert.ok(moteur.actions.length > 0);
  if (moteur.intelligenceConnection === "FULLY_CONNECTED") {
    assert.ok(moteur.actionableByIntelligence);
    assert.ok(moteur.eventConnected);
    assert.ok(moteur.contextConnected);
    assert.ok(moteur.monitoringConnected);
    assert.ok(moteur.tests.length > 0);
  }
}

console.log(`${matrice.length} moteurs couverts par la matrice Engine Gateway.`);
