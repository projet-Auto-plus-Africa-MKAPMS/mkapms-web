/**
 * AdminPaiements.tsx affichait une liste de 6 paiements 100% fabriqués (avec
 * des références "PAY-20250609-001" inventées), des stats CA jour/mois
 * fictives, et un bouton "Relancer" sans aucune action. L'audit externe du
 * 24 septembre a signalé un risque précis : ne jamais réutiliser les
 * identifiants de paiement de démonstration affichés pour une vraie relance.
 * admin.paymentsList/paymentsStats lisent la vraie table payments (jointe à
 * users pour le nom réel du client) ; admin.relancerPaiement envoie une
 * vraie notification in-app au client — jamais une nouvelle session Stripe
 * recréée à partir d'un identifiant deviné. Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/admin-payments.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { users, payments, notifications } from "../../schema.js";
import { adminRouter } from "../admin.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT = 900990;
const PREFIX = "TEST-PAIEMENTS-";
const caller = adminRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: 900991, role: "super_admin", email: "admin-paiements@mkapms.local" } });

async function nettoyer() {
  await db.delete(notifications).where(eq(notifications.userId, CLIENT));
  await db.delete(payments).where(eq(payments.userId, CLIENT));
  await db.delete(users).where(eq(users.id, CLIENT));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: CLIENT, email: `${PREFIX.toLowerCase()}client@mkapms.local`, name: "Client Paiements Test" });
  const [paiementReussi] = await db.insert(payments).values({ userId: CLIENT, type: "vehicle_boost", amount: "42.50", currency: "EUR", status: "paid" }).returning();
  const [paiementEchoue] = await db.insert(payments).values({ userId: CLIENT, type: "vehicle_boost", amount: "6.90", currency: "EUR", status: "failed" }).returning();

  const liste = await caller.paymentsList({ limit: 50 });
  const ligneReussie = liste.find((p) => p.id === paiementReussi.id);
  verif("1. paymentsList joint le vrai nom du client", ligneReussie?.clientName === "Client Paiements Test");
  verif("2. paymentsList renvoie le vrai montant et statut", ligneReussie?.amount === "42.50" && ligneReussie?.status === "paid");

  const listeEchoues = await caller.paymentsList({ limit: 50, status: "failed" });
  verif("3. le filtre par statut n'inclut jamais un autre statut", listeEchoues.every((p) => p.status === "failed") && listeEchoues.some((p) => p.id === paiementEchoue.id));

  const stats = await caller.paymentsStats();
  verif("4. paymentsStats.caMoisEur reflète le paiement payé réel du mois", Number(stats.caMoisEur) >= 42.5);
  verif("5. paymentsStats.echoues compte le paiement échoué réel", stats.echoues >= 1);

  await caller.relancerPaiement({ paymentId: paiementEchoue.id });
  const notifs = await db.select().from(notifications).where(eq(notifications.userId, CLIENT));
  verif("6. relancerPaiement insère une vraie notification pour le client", notifs.some((n) => n.title === "Paiement à renouveler"));

  await assert.rejects(() => caller.relancerPaiement({ paymentId: paiementReussi.id }), /échoué/i);
  verif("7. relancerPaiement refuse de relancer un paiement déjà réussi", true);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
