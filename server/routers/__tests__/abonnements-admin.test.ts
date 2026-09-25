/**
 * AdminAbonnements.tsx affichait un tableau ABOS 100% fabriqué (342 actifs,
 * MRR 48 200 EUR inventés). Reconnecté à trois nouvelles procédures
 * adminList/adminStats/adminHistory (server/routers/abonnements.ts) qui lisent
 * la vraie table subscriptions (déjà alimentée par le webhook Stripe) et la
 * vraie table payments (jointe par subscriptionId). Aucune annulation ni
 * changement de plan n'est imité côté admin — cela reste au client via
 * openPortal, le vrai portail Stripe. Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/abonnements-admin.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, subscriptions, payments } from "../../schema.js";
import { abonnementsRouter } from "../abonnements.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT = 900999;
const PREFIX = "TEST-ABOADMIN-";
const callerAdmin = abonnementsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: 900998, role: "super_admin", email: "admin-aboadmin@mkapms.local" } });

async function nettoyer() {
  const subs = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.userId, CLIENT));
  if (subs.length) await db.delete(payments).where(inArray(payments.subscriptionId, subs.map((s) => s.id)));
  await db.delete(subscriptions).where(eq(subscriptions.userId, CLIENT));
  await db.delete(users).where(eq(users.id, CLIENT));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: CLIENT, email: `${PREFIX}client@mkapms.local`, name: "Client Abo Test" });
  const [actif] = await db.insert(subscriptions).values({ userId: CLIENT, planCode: "pro_start", category: "pro_subscription", status: "active", amount: "49.00", currency: "EUR" }).returning();
  await db.insert(subscriptions).values({ userId: CLIENT, planCode: "pro_start", category: "pro_subscription", status: "expired", amount: "49.00", currency: "EUR" });
  await db.insert(payments).values({ userId: CLIENT, type: "vehicle_boost", subscriptionId: actif.id, amount: "49.00", currency: "EUR", status: "paid" });

  const stats = await callerAdmin.adminStats();
  verif("1. au moins un abonnement actif compté", stats.actifs >= 1);
  verif("2. au moins un abonnement expiré compté", stats.expires >= 1);
  verif("3. MRR EUR reflète le montant réel de l'abonnement actif", stats.mrrParDevise.some((m) => m.currency === "EUR" && Number(m.total) >= 49));

  const liste = await callerAdmin.adminList({ status: "active" });
  verif("4. la liste filtrée par statut ne renvoie que des abonnements actifs", liste.every((a) => a.status === "active") && liste.some((a) => a.id === actif.id));
  verif("5. le nom du client est joint depuis la table users", liste.find((a) => a.id === actif.id)?.userName === "Client Abo Test");

  const historique = await callerAdmin.adminHistory({ subscriptionId: actif.id });
  verif("6. l'historique de facturation renvoie le vrai paiement lié", historique.length === 1 && historique[0].amount === "49.00");

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
