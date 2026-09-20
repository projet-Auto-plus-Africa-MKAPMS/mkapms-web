/**
 * JournalActivite.tsx affichait 23 entrées entièrement fabriquées réparties
 * sur 3 catégories inventées (Utilisateurs/Garages/Admin). Réutilise le vrai
 * moteur d'audit déjà en place pour la traçabilité radar Direction
 * (server/audit.ts : logAction(), table audit_logs, déjà exposée par
 * trpc.admin.auditLog) — aucun second moteur créé. Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/journal-activite.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, auditLogs } from "../../schema.js";
import { logAction } from "../../audit.js";
import { adminRouter } from "../admin.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const DIRECTION = 900991;
const EMPLOYEE = 900992;

const callerDirection = adminRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: DIRECTION, role: "super_admin", email: "direction-journal@mkapms.local" } });
const callerEmployee = adminRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: EMPLOYEE, role: "employee", email: "employe-journal@mkapms.local" } });
const callerAnon = adminRouter.createCaller({ req: {} as never, res: {} as never, user: null });

async function nettoyer() {
  await db.delete(auditLogs).where(inArray(auditLogs.actorId, [DIRECTION]));
  await db.delete(users).where(inArray(users.id, [DIRECTION, EMPLOYEE]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: DIRECTION, email: "direction-test-journal@mkapms.local", name: "Direction Journal Test" },
    { id: EMPLOYEE, email: "employe-test-journal@mkapms.local", name: "Employé Journal Test" },
  ]);

  // ── 1. Une vraie action journalisée par logAction() est bien relisible via admin.auditLog ──
  await logAction(DIRECTION, "annonce.approve", "annonce", 424242, { motif: "test" }, { ipAddress: "203.0.113.9", userAgent: "TEST-UA" });
  const journal = await callerDirection.auditLog({ limit: 200 });
  const entree = journal.find((e) => e.entityId === 424242 && e.action === "annonce.approve");
  verif("1. l'action journalisée réelle apparaît dans le journal", !!entree);
  verif("1. l'email de l'auteur réel est bien joint (jamais un nom inventé)", entree?.actorEmail === "direction-test-journal@mkapms.local");
  verif("1. l'adresse IP réelle est bien conservée", entree?.ipAddress === "203.0.113.9");
  verif("1. entityType reflète bien le vrai type d'entité, pas une catégorie inventée", entree?.entityType === "annonce");

  // ── 2. Un employé (accès back-office mais pas Direction) n'a pas accès au journal — directionProcedure ──
  let refuseEmployee = false;
  try {
    await callerEmployee.auditLog({ limit: 10 });
  } catch (err) {
    refuseEmployee = (err as any).code === "FORBIDDEN";
  }
  verif("2. un employé (rôle non-direction) n'a pas accès au journal", refuseEmployee);

  // ── 3. Un anonyme n'a évidemment pas accès ──
  let refuseAnon = false;
  try {
    await callerAnon.auditLog({ limit: 10 });
  } catch (err) {
    refuseAnon = (err as any).code === "FORBIDDEN";
  }
  verif("3. un visiteur anonyme n'a pas accès au journal", refuseAnon);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
