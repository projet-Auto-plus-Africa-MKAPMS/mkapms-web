/**
 * Postes d'équipe (directeur, sous-directeur, comptable, chef d'équipe,
 * investisseur, partenaire) : qui peut les attribuer.
 * Sans base : on ne vérifie que les REFUS et les règles pures.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { adminRouter } from "../admin.js";
import { POSITIONS_ATTRIBUABLES, STAFF_LABELS, isPositionExterne, isAdmin } from "../../../shared/roles.js";
import { resolveUniverse } from "../../../shared/account-routing.js";

const ctx = (user: { uid: number; role: string; email: string } | null) => ({ req: {} as never, res: {} as never, user });
const refuse = (e: { code?: string }) => e.code === "FORBIDDEN" || e.code === "UNAUTHORIZED";
const compte = { name: "Compte test", email: "x@example.test", password: "test-password-local" };

test("tous les postes demandés par le PDG existent, avec libellé", () => {
  for (const p of ["directeur", "sous_directeur", "comptable", "investisseur", "partenaire", "chef_equipe", "agent"] as const) {
    assert.ok(POSITIONS_ATTRIBUABLES.includes(p), p);
    assert.ok(STAFF_LABELS[p], p);
  }
  assert.ok(!(POSITIONS_ATTRIBUABLES as readonly string[]).includes("pdg"), "le PDG n'est jamais attribuable");
});

test("investisseur et partenaire sont externes : jamais de rôle back-office", () => {
  assert.equal(isPositionExterne("investisseur"), true);
  assert.equal(isPositionExterne("partenaire"), true);
  assert.equal(isPositionExterne("comptable"), false);
  assert.equal(isAdmin("user"), false);
});

test("un compte Administration ne peut pas créer un autre compte Administration", async () => {
  await assert.rejects(() => adminRouter.createCaller(ctx({ uid: 4, role: "admin", email: "a@x.test" })).createStaff({ ...compte, role: "admin", staffPosition: "directeur" }), /PDG/);
});

test("attribuer un poste ou changer un rôle : refusé à tout compte sauf le PDG (y compris Administration)", async () => {
  for (const user of [null, { uid: 1, role: "user", email: "u@x.test" }, { uid: 3, role: "employee", email: "e@x.test" }, { uid: 4, role: "admin", email: "a@x.test" }]) {
    const c = adminRouter.createCaller(ctx(user));
    await assert.rejects(() => c.assignStaffPosition({ userId: 9, staffPosition: "comptable" }), refuse, `assign ${user?.role ?? "visiteur"}`);
    await assert.rejects(() => c.setUserRole({ userId: 9, role: "super_admin" }), refuse, `setUserRole ${user?.role ?? "visiteur"}`);
  }
});

test("le PDG ne peut pas modifier son propre poste", async () => {
  await assert.rejects(() => adminRouter.createCaller(ctx({ uid: 1, role: "super_admin", email: "p@x.test" })).assignStaffPosition({ userId: 1, staffPosition: "agent" }), /propre poste/);
});

test("le poste « pdg » n'est pas attribuable par la procédure d'attribution", async () => {
  await assert.rejects(() => adminRouter.createCaller(ctx({ uid: 1, role: "super_admin", email: "p@x.test" })).assignStaffPosition({ userId: 2, staffPosition: "pdg" as never }));
});

test("routage : sous-directeur → direction ; comptable admin → comptabilité ; investisseur → jamais interne", () => {
  assert.equal(resolveUniverse({ role: "employee", staffPosition: "sous_directeur" }), "direction");
  assert.equal(resolveUniverse({ role: "admin", staffPosition: "comptable" }), "comptabilite");
  assert.equal(resolveUniverse({ role: "employee", staffPosition: "chef_equipe" }), "administration");
  assert.equal(resolveUniverse({ role: "user", staffPosition: "investisseur" }), "particulier");
  assert.equal(resolveUniverse({ role: "user", staffPosition: "partenaire" }), "particulier");
});
