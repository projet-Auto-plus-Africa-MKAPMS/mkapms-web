/**
 * Global Country Engine : module interne, réservé au PDG.
 * Sans base : on ne vérifie que les REFUS (le garde s'exécute avant tout accès aux données).
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { countryOsRouter } from "../index.js";
import { canAccessModule } from "../../../shared/permissions.js";

const ctx = (user: { uid: number; role: string; email: string } | null) => ({ req: {} as never, res: {} as never, user });
const pays = { code: "ZZ", nameFr: "Pays test", defaultCurrency: "EUR" };

test("écrire sur les pays (ouvrir, fermer) : refusé au visiteur, à tous les rôles sauf le PDG", async () => {
  for (const user of [null, { uid: 1, role: "user", email: "u@x.test" }, { uid: 2, role: "pro", email: "p@x.test" }, { uid: 3, role: "employee", email: "e@x.test" }, { uid: 4, role: "admin", email: "a@x.test" }]) {
    const c = countryOsRouter.createCaller(ctx(user));
    await assert.rejects(() => c.upsert(pays), (e: { code?: string }) => e.code === "FORBIDDEN" || e.code === "UNAUTHORIZED", `upsert ${user?.role ?? "visiteur"}`);
    await assert.rejects(() => c.disable({ code: "ZZ" }), (e: { code?: string }) => e.code === "FORBIDDEN" || e.code === "UNAUTHORIZED", `disable ${user?.role ?? "visiteur"}`);
  }
});

test("état interne du moteur (santé, flux du centre de contrôle, tableau de bord) : refusé au visiteur et aux comptes ordinaires", async () => {
  for (const user of [null, { uid: 1, role: "user", email: "u@x.test" }, { uid: 2, role: "pro", email: "p@x.test" }]) {
    const c = countryOsRouter.createCaller(ctx(user));
    await assert.rejects(() => c.healthStatus(), (e: { code?: string }) => e.code === "FORBIDDEN" || e.code === "UNAUTHORIZED");
    await assert.rejects(() => c.controlCenterFeed(), (e: { code?: string }) => e.code === "FORBIDDEN" || e.code === "UNAUTHORIZED");
    await assert.rejects(() => c.dashboard(), (e: { code?: string }) => e.code === "FORBIDDEN" || e.code === "UNAUTHORIZED");
  }
});

test("module « centre_pdg » : seul le rôle PDG (super_admin) y accède", () => {
  for (const role of ["user", "pro", "garage", "society", "employee", "admin", "supplier", "carrier", undefined, null, "inconnu"]) {
    assert.equal(canAccessModule(role as string | undefined, "centre_pdg"), false, String(role));
  }
  assert.equal(canAccessModule("super_admin", "centre_pdg"), true);
});

test("aucune page publique ne renvoie vers l'écran interne", () => {
  const accueil = readFileSync(new URL("../../../client/src/pages/HomeSite.tsx", import.meta.url), "utf8");
  assert.equal(accueil.includes("/mk-global-engine"), false);
});

test("la route de l'écran est enveloppée par le verrou PDG (pas l'enveloppe publique)", () => {
  const app = readFileSync(new URL("../../../client/src/App.tsx", import.meta.url), "utf8");
  const ligne = app.split("\n").find((l) => l.includes('path="/mk-global-engine"'));
  assert.ok(ligne, "route présente");
  assert.match(ligne!, /<P module="centre_pdg"/);
  assert.equal(/<U name="Global Country Engine">/.test(ligne!), false);
});
