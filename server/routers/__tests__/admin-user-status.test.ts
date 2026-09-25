/**
 * AdminUtilisateurs.tsx affichait un bouton "Suspendre le compte" qui ne
 * faisait que muter un tableau React local — aucune suspension réelle
 * n'existait (userStatusEnum était déclaré mais jamais posé sur une
 * colonne). Ajout de users.status + suspendUser/reactivateUser
 * (server/routers/admin.ts), et surtout d'un contrôle revérifié à CHAQUE
 * requête authentifiée (server/trpc.ts createContext), pas seulement à la
 * connexion : un jeton JWT dure 30 jours, donc sans ce contrôle un compte
 * suspendu garderait un accès complet jusqu'à l'expiration de son jeton.
 * Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/admin-user-status.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { users, notifications } from "../../schema.js";
import { adminRouter } from "../admin.js";
import { authRouter } from "../auth.js";
import { notificationsRouter } from "../notifications.js";
import { createContext } from "../../trpc.js";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";

function fakeReqRes(authorization?: string): CreateExpressContextOptions {
  return { req: { headers: authorization ? { authorization } : {}, cookies: {} }, res: {} } as unknown as CreateExpressContextOptions;
}
import { signToken, hashPassword } from "../../auth.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const PARTICULIER = 900970;
const PRO = 900971;
const EMPLOYEE_ACTOR = 900972;
const PDG_ACTOR = 900973;
const PREFIX = "TEST-USERSTATUS-";

const callerPdg = adminRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: PDG_ACTOR, role: "super_admin", email: "pdg-userstatus@mkapms.local" } });
const callerEmploye = adminRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: EMPLOYEE_ACTOR, role: "admin", email: "employe-userstatus@mkapms.local" } });

async function nettoyer() {
  await db.delete(notifications).where(eq(notifications.userId, PARTICULIER));
  await db.delete(users).where(eq(users.id, PARTICULIER));
  await db.delete(users).where(eq(users.id, PRO));
  await db.delete(users).where(eq(users.id, EMPLOYEE_ACTOR));
  await db.delete(users).where(eq(users.id, PDG_ACTOR));
}

async function main() {
  await nettoyer();
  const motDePasse = await hashPassword("mot-de-passe-test-123");
  const emailParticulier = `${PREFIX}particulier@mkapms.local`.toLowerCase();
  await db.insert(users).values({ id: PARTICULIER, email: emailParticulier, name: "Particulier Test", passwordHash: motDePasse, role: "user", accountType: "particulier" });
  await db.insert(users).values({ id: PRO, email: `${PREFIX}pro@mkapms.local`.toLowerCase(), name: "Pro Test", role: "pro", accountType: "professionnel" });
  await db.insert(users).values({ id: EMPLOYEE_ACTOR, email: `${PREFIX}employe@mkapms.local`.toLowerCase(), name: "Employé Test", role: "admin" });
  await db.insert(users).values({ id: PDG_ACTOR, email: `${PREFIX}pdg@mkapms.local`.toLowerCase(), name: "PDG Test", role: "super_admin" });

  // 1. Suspension par un employé sur un particulier — autorisé
  await callerEmploye.suspendUser({ userId: PARTICULIER, reason: "Test" });
  const [apresSuspension] = await db.select({ status: users.status }).from(users).where(eq(users.id, PARTICULIER));
  verif("1. suspendUser passe le compte à 'suspended' en base", apresSuspension.status === "suspended");

  // 2. Login bloqué immédiatement pour un compte suspendu
  await assert.rejects(
    () => authRouter.createCaller({ req: { headers: {} } as never, res: {} as never, user: null }).login({ email: emailParticulier, password: "mot-de-passe-test-123" }),
    /suspendu/i,
  );
  verif("2. login rejette un compte suspendu avec un message clair", true);

  // 3. Révocation immédiate d'un jeton déjà émis (pas seulement à la prochaine connexion)
  const jetonEmisAvantSuspension = signToken({ uid: PARTICULIER, role: "user", email: `${PREFIX}particulier@mkapms.local` });
  const ctxAvecJetonSuspendu = await createContext(fakeReqRes(`Bearer ${jetonEmisAvantSuspension}`));
  verif("3. un jeton valide émis avant la suspension perd l'accès dès la requête suivante (pas seulement à la prochaine connexion)", ctxAvecJetonSuspendu.user === null);

  // 4. Réactivation
  await callerEmploye.reactivateUser({ userId: PARTICULIER });
  const [apresReactivation] = await db.select({ status: users.status }).from(users).where(eq(users.id, PARTICULIER));
  verif("4. reactivateUser repasse le compte à 'active'", apresReactivation.status === "active");
  const ctxApresReactivation = await createContext(fakeReqRes(`Bearer ${jetonEmisAvantSuspension}`));
  verif("5. le même jeton redevient valide après réactivation", ctxApresReactivation.user?.uid === PARTICULIER);

  // 6. Hiérarchie : un employé (admin) ne peut pas suspendre un compte professionnel
  await assert.rejects(() => callerEmploye.suspendUser({ userId: PRO }), /PDG/i);
  verif("6. un employé ne peut pas suspendre un compte professionnel", true);

  // 7. Le PDG peut suspendre un compte professionnel
  await callerPdg.suspendUser({ userId: PRO });
  const [proSuspendu] = await db.select({ status: users.status }).from(users).where(eq(users.id, PRO));
  verif("7. le PDG peut suspendre un compte professionnel", proSuspendu.status === "suspended");
  await callerPdg.reactivateUser({ userId: PRO });

  // 8. Impossible de se suspendre soi-même
  await assert.rejects(() => callerPdg.suspendUser({ userId: PDG_ACTOR }), /propre compte/i);
  verif("8. impossible de suspendre son propre compte", true);

  // 9. Suspendre un compte déjà suspendu échoue proprement
  await callerEmploye.suspendUser({ userId: PARTICULIER });
  await assert.rejects(() => callerEmploye.suspendUser({ userId: PARTICULIER }), /déjà suspendu/i);
  verif("9. suspendre un compte déjà suspendu est rejeté", true);
  await callerEmploye.reactivateUser({ userId: PARTICULIER });

  // 10. contactUser crée une vraie notification (jamais un envoi simulé)
  await callerEmploye.contactUser({ userId: PARTICULIER, message: `${PREFIX}message de test` });
  const notifs = await notificationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: PARTICULIER, role: "user", email: "x" } }).list();
  verif("10. contactUser insère une vraie notification visible par l'utilisateur", notifs.some((n) => n.body === `${PREFIX}message de test`));

  // 11. updateUserProfile persiste les champs réels
  await callerEmploye.updateUserProfile({ userId: PARTICULIER, phone: "0600000000", city: "Conakry" });
  const [apresEdit] = await db.select({ phone: users.phone, city: users.city }).from(users).where(eq(users.id, PARTICULIER));
  verif("11. updateUserProfile persiste téléphone et ville", apresEdit.phone === "0600000000" && apresEdit.city === "Conakry");

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
