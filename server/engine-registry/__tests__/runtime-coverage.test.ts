import assert from "node:assert/strict";
import test from "node:test";
import { MOTEURS } from "../../data/moteurs.js";
import { ENGINE_CONTRACTS } from "../contracts.js";
import { ENGINE_PROBES } from "../probes.js";
import { OS_ENGINE_NAMES } from "../os-bridge.js";

const declared = MOTEURS.map((engine) => engine.moteur);
const contracts = ENGINE_CONTRACTS.map((engine) => engine.id);
const probes = ENGINE_PROBES.map((engine) => engine.engine);
const osBridges = [...OS_ENGINE_NAMES];
const allBindings = [...contracts, ...probes, ...osBridges];

test("les 96 moteurs déclarés ont une surface runtime", () => {
  assert.equal(declared.length, 96, "Le registre principal doit déclarer 96 moteurs.");
  assert.equal(new Set(declared).size, declared.length, "Les identifiants moteurs doivent être uniques.");

  const missing = declared.filter((id) => !allBindings.includes(id));
  assert.deepEqual(missing, [], "Chaque moteur doit avoir un contrat, une sonde ou un pont OS.");
});

test("chaque moteur n'a qu'une seule source de liaison runtime", () => {
  assert.equal(new Set(contracts).size, contracts.length, "Les contrats doivent être uniques.");
  assert.equal(new Set(probes).size, probes.length, "Les sondes doivent être uniques.");
  assert.equal(new Set(osBridges).size, osBridges.length, "Les ponts OS doivent être uniques.");
  assert.deepEqual(
    contracts.filter((id) => probes.includes(id)),
    ["atelier"],
    "Seul Atelier peut avoir à la fois un contrat central et une sonde métier dédiée.",
  );
  assert.deepEqual(
    [...new Set([...contracts, ...probes])].filter((id) => osBridges.includes(id)),
    [],
    "Un moteur OS ne doit pas être déclaré avec un second pont de liaison.",
  );
});

test("chaque sonde déclare au moins une table ou dépendance observable", () => {
  const invalid = ENGINE_PROBES
    .filter((probe) => !Array.isArray(probe.tables) || probe.tables.length === 0)
    .map((probe) => probe.engine);
  assert.deepEqual(invalid, [], "Une sonde sans surface observable ne prouve pas une santé réelle.");
});

test("les identifiants des contrats, sondes et ponts OS sont canoniques", () => {
  const unknown = allBindings.filter((id) => !declared.includes(id));
  assert.deepEqual(unknown, [], "Aucune liaison ne doit viser un moteur absent du registre.");
});
