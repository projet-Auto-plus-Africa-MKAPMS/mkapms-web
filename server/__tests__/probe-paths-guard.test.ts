/**
 * server/probe-paths-guard.ts — chemins rejetés en 404 avant le catch-all SPA,
 * et routes client légitimes qui ne doivent jamais être touchées.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikeProbePath } from "../probe-paths-guard.js";

test("rejette les fichiers sensibles et sondes d'attaque connues", () => {
  for (const p of [
    "/.env",
    "/.git/HEAD",
    "/.git/config",
    "/.aws/credentials",
    "/.ssh/id_rsa",
    "/wp-admin",
    "/wp-login.php",
    "/xmlrpc.php",
    "/phpmyadmin",
    "/config.php",
    "/database.sql",
    "/backup.zip",
    "/dump.sql",
    "/vendor/autoload.php",
  ]) {
    assert.equal(looksLikeProbePath(p), true, p);
  }
});

test("laisse passer les routes client légitimes du SPA", () => {
  for (const p of [
    "/",
    "/admin",
    "/admin/moteurs",
    "/vehicule/39",
    "/marque/Alfa%20Romeo",
    "/acheter/mkapms-officiel/vehicule/12",
    "/carte-grise",
    "/louer/mkapms/vehicule/7",
  ]) {
    assert.equal(looksLikeProbePath(p), false, p);
  }
});

test("laisse .well-known/ intact (déjà traité au cas par cas dans index.ts)", () => {
  assert.equal(looksLikeProbePath("/.well-known/assetlinks.json"), false);
  assert.equal(looksLikeProbePath("/.well-known/apple-app-site-association"), false);
});
