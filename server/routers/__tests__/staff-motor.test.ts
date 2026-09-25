import assert from "node:assert/strict";
import { adminRouter } from "../admin.js";
import { db, pool } from "../../db.js";
import { users } from "../../schema.js";
import { eq } from "drizzle-orm";
import { comparePassword } from "../../auth.js";
import type { Context } from "../../trpc.js";

const caller = (role: string) => adminRouter.createCaller({ user: { uid: 1, role, email: "direction@example.test" } } as Context);
async function main() {
  assert.match(process.env.DATABASE_URL ?? "", /(?:localhost|127\.0\.0\.1):55432\//);
  const input = { name: "Compte test", email: "Staff@example.test", password: "test-password-local", role: "employee" as const, staffPosition: "agent" as const };
  await assert.rejects(caller("employee").createStaff(input), /direction/);
  await assert.rejects(caller("user").staffList(), /back-office/);
  await assert.rejects(caller("super_admin").createStaff({ ...input, name: " " }));
  const created = await caller("super_admin").createStaff(input);
  assert.equal(created.email, "staff@example.test");
  const [saved] = await db.select().from(users).where(eq(users.id, created.id));
  assert.equal(saved.name, input.name);
  assert.equal(saved.role, "employee");
  assert.notEqual(saved.passwordHash, input.password);
  assert.ok(await comparePassword(input.password, saved.passwordHash!));
  assert.ok((await caller("employee").staffList()).some((u) => u.id === created.id));
  await assert.rejects(caller("super_admin").createStaff(input), /existe déjà/);
  console.log("Employés : permission, validation, persistance, mot de passe haché, liste réelle, doublon : OK");
}
main().finally(() => pool.end()).catch(e => {console.error(e);process.exitCode=1;});
