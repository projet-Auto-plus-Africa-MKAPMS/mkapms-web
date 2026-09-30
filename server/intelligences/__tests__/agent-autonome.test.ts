import test from "node:test";
import assert from "node:assert/strict";
import { PROFIL_AGENT_AUTONOME } from "../autonomie.js";

test("le profil autonome ne donne jamais les privilèges paiement ou infrastructure niveau 7", () => {
  assert.equal(PROFIL_AGENT_AUTONOME.paiement, 1);
  assert.ok(PROFIL_AGENT_AUTONOME.infrastructure < 7);
  assert.ok(PROFIL_AGENT_AUTONOME.code >= 5);
  assert.ok(PROFIL_AGENT_AUTONOME.contenu >= 5);
  assert.ok(PROFIL_AGENT_AUTONOME.support >= 5);
});
