/**
 * EtatVehicule.tsx / InspectionNumerique.tsx. Base de données réelle.
 *
 * Ces deux écrans affichaient des réservations de location entièrement
 * fabriquées (LOC-2025-0042, cautions, contrats signés, checklists jamais
 * enregistrées nulle part). Découverte en vérifiant controle_technique :
 * bookingTypeEnum déclare "rental" depuis toujours, mais AUCUNE procédure
 * ne crée jamais de booking de ce type — aucun flux de réservation de
 * location individuelle n'existe sur la plateforme (tâche de fond #56,
 * distincte). Reconstruire l'état des lieux/la checklist "pour de vrai"
 * nécessiterait donc d'abord ce moteur, qui n'existe pas : plutôt que
 * d'attendre, la fabrication a été retirée immédiatement — les deux écrans
 * lisent maintenant trpc.reservations.mine (déjà réel) filtré sur
 * type="rental", honnêtement vide aujourd'hui pour tout le monde, sans
 * jamais afficher un état des lieux ou une caution qui n'existe pas.
 *
 * Ce test le prouve sur base réelle : un booking purchase_visit/test_drive
 * n'apparaît jamais dans le filtre "rental" (jamais un faux positif), et un
 * vrai booking rental (créé directement en base pour la démonstration —
 * aucune procédure ne le crée encore côté produit) apparaît bien avec ses
 * vrais champs de caution, sans aucune donnée inventée autour.
 *
 * Lancement : `npx tsx server/routers/__tests__/etat-vehicule-honnete.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, bookings, users } from "../../schema.js";
import { reservationsRouter } from "../reservations.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ACHETEUR = 900996;
const VENDEUR = 900997;
const PREFIX = "TEST-ETATVEHICULE-";

const callerAcheteur = reservationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ACHETEUR, role: "user", email: "acheteur-etatvehicule@mkapms.local" } });

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.ownerId, VENDEUR));
  const ids = mesAnnonces.map((a) => a.id);
  if (ids.length) {
    await db.delete(bookings).where(inArray(bookings.vehicleId, ids));
    await db.delete(annonces).where(inArray(annonces.id, ids));
  }
  await db.delete(users).where(inArray(users.id, [VENDEUR]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: VENDEUR, email: "vendeur-test-etatvehicule@mkapms.local", name: "Vendeur EtatVehicule Test" });
  const [annonce] = await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Golf`, marque: "Volkswagen", modele: "Golf" }).returning();

  // ── 1. Sans aucun booking "rental", la liste filtrée est réellement vide ──
  const visite = await callerAcheteur.demanderVisite({ annonceId: annonce.id, mode: "visio", date: "2026-06-01", creneau: "10:00" });
  const avantRental = (await callerAcheteur.mine()).filter((b) => b.type === "rental");
  verif("1. un booking test_drive n'apparaît jamais dans le filtre rental (jamais un faux positif)", !avantRental.some((b) => b.id === visite.id));

  // ── 2. Un vrai booking rental (créé directement en base — aucune procédure
  //      produit ne le fait encore, cf. tâche #56) apparaît avec ses vrais
  //      champs de caution, sans aucune donnée inventée autour ──
  const [rental] = await db.insert(bookings).values({
    vehicleId: annonce.id,
    userId: ACHETEUR,
    type: "rental",
    startDate: new Date("2026-07-01T00:00:00"),
    cautionAmount: "500.00",
    cautionCurrency: "EUR",
    cautionStatus: "pending",
  }).returning();

  const apresRental = (await callerAcheteur.mine()).filter((b) => b.type === "rental");
  const ligne = apresRental.find((b) => b.id === rental.id);
  verif("2. le booking rental réel apparaît bien dans la liste filtrée", !!ligne);
  verif("2. la caution affichée est la vraie valeur en base, jamais inventée", ligne?.cautionAmount === "500.00" && ligne?.cautionCurrency === "EUR" && ligne?.cautionStatus === "pending");

  await db.delete(bookings).where(eq(bookings.id, rental.id));
  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
