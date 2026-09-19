/**
 * Visite véhicule (client/src/pages/vente/CentreVisiteVehicule.tsx). Base
 * de données réelle.
 *
 * Corrige un écran orphelin : /vente/visite n'acceptait aucun identifiant
 * de véhicule, n'était référencé nulle part dans l'application (aucun
 * bouton n'y menait), et était verrouillé derrière la porte d'accès
 * professionnelle alors qu'il s'adresse à un acheteur. Le type de
 * réservation "test_drive" existait dans bookingTypeEnum depuis toujours
 * sans jamais être utilisé. Ce test prouve que demanderVisite crée une
 * vraie réservation, que le vendeur la voit dans sa liste unifiée
 * (mesReservationsRecues, partagée avec les réservations à acompte), et
 * que la réponse suit exactement les mêmes règles d'isolation.
 *
 * Lancement : `npx tsx server/routers/__tests__/reservations-visite.test.ts`
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

const VENDEUR = 900901;
const ACHETEUR = 900902;
const PREFIX = "TEST-VISITE-";

const callerVendeur = reservationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR, role: "pro", email: "vendeur-visite@mkapms.local" } });
const callerAcheteur = reservationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ACHETEUR, role: "user", email: "acheteur-visite@mkapms.local" } });

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.ownerId, VENDEUR));
  const ids = mesAnnonces.map((a) => a.id);
  if (ids.length) {
    await db.delete(bookings).where(inArray(bookings.vehicleId, ids));
    await db.delete(annonces).where(inArray(annonces.id, ids));
  }
  await db.delete(notifications).where(inArray(notifications.userId, [VENDEUR, ACHETEUR]));
  await db.delete(users).where(eq(users.id, ACHETEUR));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: ACHETEUR, email: "acheteur-test-visite@mkapms.local", name: "Acheteur Visite Test" });
  const [annonce] = await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Renault Clio`, marque: "Renault", modele: "Clio" }).returning();

  // ── 1. Une vraie demande de visite crée une vraie réservation type test_drive ──
  const visite = await callerAcheteur.demanderVisite({ annonceId: annonce.id, mode: "visio", date: "2026-06-01", creneau: "14:00" });
  verif("1. la réservation créée porte le vrai type test_drive", visite.type === "test_drive");
  verif("1. le message décrit le vrai mode et le vrai créneau choisis", visite.message === "Visio — créneau souhaité : 14:00");
  verif("1. le statut initial est en attente", visite.status === "pending");

  // ── 2. Le vendeur la voit dans SA liste unifiée (même liste que les réservations à acompte) ──
  const recues = await callerVendeur.mesReservationsRecues();
  const ligne = recues.find((r) => r.id === visite.id);
  verif("2. le vendeur voit la visite dans sa liste de réservations reçues", !!ligne);
  verif("2. le type est bien distingué (test_drive, pas purchase_visit)", ligne?.type === "test_drive");
  verif("2. le vrai nom du véhicule est affiché", ligne?.vehicule === `${PREFIX}Renault Clio`);

  // ── 3. Le vendeur peut confirmer la visite via la même mutation que les réservations ──
  const confirmee = await callerVendeur.repondreReservationRecue({ bookingId: visite.id, accepter: true });
  verif("3. la visite passe réellement à accepted", confirmee.status === "accepted");

  // ── 4. L'acheteur reçoit une vraie notification de confirmation de VISITE (pas "réservation") ──
  const notifs = await db.select().from(notifications).where(eq(notifications.userId, ACHETEUR));
  verif("4. la notification mentionne bien une visite confirmée, pas une réservation générique", notifs.some((n) => n.title === "Visite confirmée" && n.body?.includes(`${PREFIX}Renault Clio`)));

  // ── 5. Une visite déjà tranchée ne peut pas recevoir une seconde décision ──
  await assert.rejects(
    () => callerVendeur.repondreReservationRecue({ bookingId: visite.id, accepter: false }),
    /a déjà reçu une réponse/,
    "5. une visite déjà tranchée refuse une seconde décision",
  );
  ok++; total++;

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
