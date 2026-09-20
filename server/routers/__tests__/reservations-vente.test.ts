/**
 * Réservations Vente (client/src/pages/vente/ReservationsVente.tsx). Base de
 * données réelle.
 *
 * Corrige une fabrication réelle : l'écran affichait 3 réservations codées
 * en dur (client "Marie L.", "Jean D.", "SAS Auto+" inventés). Le moteur de
 * réservation avec acompte existait déjà côté acheteur
 * (reservations.create, table bookings) mais n'avait jamais de pendant
 * vendeur. Ce test prouve que mesReservationsRecues ne montre que les
 * réservations reçues sur les VRAIES annonces du vendeur connecté (jamais
 * celles d'un autre vendeur), et que repondreReservationRecue refuse
 * catégoriquement d'agir sur une réservation qui ne lui appartient pas.
 *
 * Lancement : `npx tsx server/routers/__tests__/reservations-vente.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, bookings, users, notifications } from "../../schema.js";
import { reservationsRouter } from "../reservations.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR_A = 900601;
const VENDEUR_B = 900602;
const ACHETEUR = 900603;
const PREFIX = "TEST-RES-VENTE-";

const callerVendeurA = reservationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR_A, role: "pro", email: "vendeur-a@mkapms.local" } });
const callerVendeurB = reservationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR_B, role: "pro", email: "vendeur-b@mkapms.local" } });

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(inArray(annonces.ownerId, [VENDEUR_A, VENDEUR_B]));
  const ids = mesAnnonces.map((a) => a.id);
  if (ids.length) {
    await db.delete(bookings).where(inArray(bookings.vehicleId, ids));
    await db.delete(annonces).where(inArray(annonces.id, ids));
  }
  await db.delete(notifications).where(eq(notifications.userId, ACHETEUR));
  await db.delete(users).where(eq(users.id, ACHETEUR));
}

async function main() {
  await nettoyer();

  await db.insert(users).values({ id: ACHETEUR, email: "acheteur-test-res-vente@mkapms.local", name: "Acheteur Test" });

  const [annonceA] = await db.insert(annonces).values({ ownerId: VENDEUR_A, titre: `${PREFIX}Peugeot 3008`, marque: "Peugeot", modele: "3008" }).returning();
  const [annonceB] = await db.insert(annonces).values({ ownerId: VENDEUR_B, titre: `${PREFIX}BMW 320d`, marque: "BMW", modele: "320d" }).returning();

  const now = new Date();
  const [bookingA] = await db.insert(bookings).values({ vehicleId: annonceA.id, userId: ACHETEUR, type: "purchase_visit", startDate: now, cautionAmount: "1000", cautionCurrency: "EUR" }).returning();
  const [bookingB] = await db.insert(bookings).values({ vehicleId: annonceB.id, userId: ACHETEUR, type: "purchase_visit", startDate: now, cautionAmount: "1500", cautionCurrency: "EUR" }).returning();

  // ── 1. Chaque vendeur ne voit QUE les réservations reçues sur ses propres annonces ──
  const recuesA = await callerVendeurA.mesReservationsRecues();
  verif("le vendeur A voit sa réservation reçue", recuesA.some((r) => r.id === bookingA.id));
  verif("le vendeur A ne voit jamais la réservation du vendeur B", !recuesA.some((r) => r.id === bookingB.id));
  const ligneA = recuesA.find((r) => r.id === bookingA.id)!;
  verif("les données affichées sont les vraies données (client, véhicule, acompte)", ligneA.client === "Acheteur Test" && ligneA.vehicule === `${PREFIX}Peugeot 3008` && ligneA.acompte === 1000);

  // ── 2. Un vendeur ne peut jamais répondre à la réservation d'un AUTRE vendeur ──
  await assert.rejects(
    () => callerVendeurA.repondreReservationRecue({ bookingId: bookingB.id, accepter: true }),
    /ne concerne pas une de vos annonces/,
    "2. répondre à la réservation d'un autre vendeur est catégoriquement refusé",
  );
  ok++; total++;
  const [bookingBApres] = await db.select().from(bookings).where(eq(bookings.id, bookingB.id));
  verif("2. la réservation du vendeur B reste intacte (pending) malgré la tentative du vendeur A", bookingBApres.status === "pending");

  // ── 3. Le vendeur propriétaire peut valider sa propre réservation ──
  const validee = await callerVendeurA.repondreReservationRecue({ bookingId: bookingA.id, accepter: true });
  verif("3. la réservation passe réellement à 'accepted'", validee.status === "accepted");

  // ── 4. Une réservation déjà tranchée ne peut pas être re-répondue ──
  await assert.rejects(
    () => callerVendeurA.repondreReservationRecue({ bookingId: bookingA.id, accepter: false }),
    /a déjà reçu une réponse/,
    "4. une réservation déjà tranchée refuse une seconde décision",
  );
  ok++; total++;

  // ── 5. L'acheteur est notifié de la vraie décision ──
  const notifs = await db.select().from(notifications).where(eq(notifications.userId, ACHETEUR));
  verif("5. l'acheteur reçoit une notification réelle mentionnant sa vraie annonce", notifs.some((n) => n.body?.includes(`${PREFIX}Peugeot 3008`) && n.title === "Réservation acceptée"));

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
