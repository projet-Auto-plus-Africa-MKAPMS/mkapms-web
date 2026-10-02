import { test } from "node:test";
import assert from "node:assert/strict";
import { CONSIGNE_DIRECTION } from "../regles.js";

test("la consigne distingue le jeton de la boutique (données) du développement/déploiement (jamais de jeton réclamé)", () => {
  assert.match(CONSIGNE_DIRECTION, /Jeton de la boutique/);
  assert.match(CONSIGNE_DIRECTION, /Ne le demande jamais pour du développement/);
  assert.match(CONSIGNE_DIRECTION, /le PDG déploie à la main/);
  // Les limites d'autonomie ne sont pas affaiblies.
  assert.match(CONSIGNE_DIRECTION, /ne publie, n'approuve, ne paie, ne déploie pas/);
});
