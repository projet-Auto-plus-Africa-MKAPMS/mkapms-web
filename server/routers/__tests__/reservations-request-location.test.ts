/**
 * reservations.requestLocation stockait toujours serviceId=0, quel que soit
 * le véhicule réellement demandé — impossible pour un loueur d'agréger un
 * jour ses propres demandes (jointure sur annonces.ownerId). Corrigé : quand
 * vehiculeRef est un id réel (cas de ProduitLocation.tsx, VehiculesCertifies.tsx…),
 * il est stocké dans serviceId ; sinon (catalogue pas encore reconnecté,
 * ex. ListeAttente.tsx) serviceId reste 0, jamais une valeur devinée.
 * Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/reservations-request-location.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, annonces, serviceTracking } from "../../schema.js";
import { reservationsRouter } from "../reservations.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const UTILISATEUR = 900996;
const PREFIX = "TEST-REQLOC-";

const caller = reservationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: UTILISATEUR, role: "user", email: "reqloc@mkapms.local" } });

async function nettoyer() {
  await db.delete(serviceTracking).where(eq(serviceTracking.userId, UTILISATEUR));
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Vehicule`]));
  await db.delete(users).where(eq(users.id, UTILISATEUR));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: UTILISATEUR, email: "reqloc-test@mkapms.local", name: "Reqloc Test" });
  const [vehicule] = await db.insert(annonces).values({ ownerId: 1, titre: `${PREFIX}Vehicule`, marque: "Peugeot", modele: "308", type: "location", status: "publiee" }).returning();

  // 1. vehiculeRef réel (id d'annonce) → serviceId stocke ce même id.
  const r1 = await caller.requestLocation({ univers: "location", vehiculeRef: String(vehicule.id), vehiculeTitre: "Peugeot 308" });
  const [row1] = await db.select().from(serviceTracking).where(eq(serviceTracking.id, r1.id)).limit(1);
  verif("1. serviceId stocke l'id réel du véhicule", row1.serviceId === vehicule.id);

  // 2. vehiculeRef non numérique (catalogue pas encore reconnecté) → serviceId reste 0, jamais deviné.
  const r2 = await caller.requestLocation({ univers: "liste_attente", vehiculeRef: "inconnu", vehiculeTitre: "Véhicule fabriqué" });
  const [row2] = await db.select().from(serviceTracking).where(eq(serviceTracking.id, r2.id)).limit(1);
  verif("2. serviceId reste 0 pour une référence non numérique", row2.serviceId === 0);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
