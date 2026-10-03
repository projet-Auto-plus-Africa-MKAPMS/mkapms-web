/**
 * Connexion Google des applications Android : ticket à usage unique et
 * identifiants d'application acceptés (server/auth-google.ts).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { APPLICATION_ID, consommerTicketApplication, creerTicketApplication, retourSite, retourSiteDeclare } from "../auth-google.js";

test("le ticket rend le compte une seule fois", () => {
  const ticket = creerTicketApplication(42);
  assert.equal(consommerTicketApplication(ticket), 42);
  assert.equal(consommerTicketApplication(ticket), null);
});

test("un jeton de session ou un ticket expiré ne vaut pas ticket", () => {
  const session = jwt.sign({ uid: 7, role: "user", email: "fictif@example.invalid" }, env.JWT_SECRET);
  assert.equal(consommerTicketApplication(session), null);
  const expire = jwt.sign({ uid: 7, t: "google-app", jti: "fictif" }, env.JWT_SECRET, { expiresIn: -10 });
  assert.equal(consommerTicketApplication(expire), null);
  const autreCle = jwt.sign({ uid: 7, t: "google-app", jti: "fictif-2" }, "cle-fictive-differente");
  assert.equal(consommerTicketApplication(autreCle), null);
});

test("seules les applications MKA.P-MS peuvent recevoir le retour", () => {
  for (const id of ["com.mkapms.app", "com.mkapms.pro", "com.mkapms.command", "com.mkapms.intelligence", "com.mkapms.investor"]) {
    assert.ok(APPLICATION_ID.test(id), id);
  }
  for (const id of ["https", "javascript", "com.autre.app", "com.mkapms.app://x", ""]) {
    assert.ok(!APPLICATION_ID.test(id), id);
  }
});

test("le retour Google du site n'est accepté que sur les domaines déclarés", () => {
  assert.ok(retourSiteDeclare("www.mkapms.fr"));
  assert.ok(retourSiteDeclare("WWW.MKAPMS.FR:443"));
  for (const hote of ["mkapms.site", "www.mkapms.fr.exemple.invalid", "", undefined]) {
    assert.ok(!retourSiteDeclare(hote), String(hote));
  }
});

test("le site reçoit le ticket sur sa propre page de connexion, jamais sur un autre domaine", () => {
  assert.equal(retourSite({ ticket: "abc" }), "/connexion?google_ticket=abc");
  assert.equal(retourSite({ erreur: "Connexion Google annulée." }), "/connexion?google_erreur=Connexion+Google+annul%C3%A9e.");
});
