/**
 * TableauBordLoueur.tsx affichait un tableau de bord 100% fabriqué (stats,
 * réservations récentes, score qualité, taux d'occupation inventés).
 * rentalContracts.myLoueurStats agrège les vraies annonces de location du
 * compte connecté et ses vraies demandes de réservation (serviceTracking,
 * via le serviceId réel désormais stocké par reservations.requestLocation).
 * Aucun CA ni taux d'occupation n'est renvoyé : ces données n'existent pas
 * encore réellement. Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/rental-contracts-loueur-stats.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, annonces, serviceTracking } from "../../schema.js";
import { rentalContractsRouter } from "../rentalContracts.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const LOUEUR = 900997;
const AUTRE_LOUEUR = 900998;
const PREFIX = "TEST-LOUEURSTATS-";

const caller = rentalContractsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: LOUEUR, role: "user", email: "loueur-stats@mkapms.local" } });

async function nettoyer() {
  const mine = await db.select({ id: annonces.id }).from(annonces).where(inArray(annonces.titre, [`${PREFIX}Actif`, `${PREFIX}Loue`, `${PREFIX}AutreLoueur`]));
  if (mine.length) await db.delete(serviceTracking).where(inArray(serviceTracking.serviceId, mine.map((m) => m.id)));
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Actif`, `${PREFIX}Loue`, `${PREFIX}AutreLoueur`]));
  await db.delete(users).where(inArray(users.id, [LOUEUR, AUTRE_LOUEUR]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: LOUEUR, email: "loueur-stats-test@mkapms.local", name: "Loueur Test" },
    { id: AUTRE_LOUEUR, email: "autre-loueur-stats-test@mkapms.local", name: "Autre Loueur" },
  ]);
  const [actif] = await db.insert(annonces).values({ ownerId: LOUEUR, titre: `${PREFIX}Actif`, marque: "Renault", modele: "Kangoo", type: "location", status: "publiee" }).returning();
  const [loue] = await db.insert(annonces).values({ ownerId: LOUEUR, titre: `${PREFIX}Loue`, marque: "Peugeot", modele: "Partner", type: "location", status: "louee" }).returning();
  // Une annonce de location d'un AUTRE loueur ne doit jamais compter dans mes stats.
  await db.insert(annonces).values({ ownerId: AUTRE_LOUEUR, titre: `${PREFIX}AutreLoueur`, marque: "Fiat", modele: "Ducato", type: "location", status: "publiee" }).returning();

  await db.insert(serviceTracking).values({ userId: 1, serviceType: "location", serviceId: actif.id, titre: "Réservation Kangoo", status: "nouveau", statusLabel: "Demande envoyée", reference: "LOC-TEST-1" });

  const stats = await caller.myLoueurStats();

  verif("1. compte 2 véhicules actifs (publiee + louee)", stats.actifs === 2);
  verif("2. compte 1 véhicule loué", stats.loues === 1);
  verif("3. compte 1 véhicule disponible", stats.disponibles === 1);
  verif("4. la réservation réelle apparaît avec le bon titre de véhicule", stats.reservations.some((r) => r.vehiculeTitre === `${PREFIX}Actif`));
  verif("5. aucun avis → reviewCount à 0", stats.reviewCount === 0);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
