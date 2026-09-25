/**
 * AdminStatistiques.tsx affichait 6 indicateurs 100% fabriqués (CA, nouveaux
 * inscrits, annonces, conversion, panier moyen, désabonnement), chacun avec
 * une variation et un détail inventés. statistiques.globales recalcule
 * chaque indicateur en direct (payments/users/annonces/subscriptions) avec
 * une vraie variation mois en cours vs mois précédent. tauxConversion reste
 * "nonMesure" (aucun suivi de visite n'existe). Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/statistiques.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, payments, annonces, subscriptions } from "../../schema.js";
import { statistiquesRouter } from "../statistiques.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT = 900980;
const PREFIX = "TEST-STATS-";
const caller = statistiquesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: 900981, role: "super_admin", email: "admin-stats@mkapms.local" } });

async function nettoyer() {
  await db.delete(payments).where(eq(payments.userId, CLIENT));
  await db.delete(subscriptions).where(eq(subscriptions.userId, CLIENT));
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Annonce`]));
  await db.delete(users).where(eq(users.id, CLIENT));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: CLIENT, email: `${PREFIX.toLowerCase()}client@mkapms.local`, name: "Client Stats Test", accountType: "particulier" });
  await db.insert(payments).values({ userId: CLIENT, type: "vehicle_boost", amount: "150.00", currency: "EUR", status: "paid" });
  await db.insert(annonces).values({ ownerId: CLIENT, titre: `${PREFIX}Annonce`, marque: "Renault", modele: "Clio", type: "vente", status: "publiee" });
  await db.insert(subscriptions).values({ userId: CLIENT, planCode: "test", category: "particulier_boost", status: "active", amount: "10.00", currency: "EUR" });

  const r = await caller.globales();

  verif("1. ca.actuel reflète le paiement réel du mois en cours (EUR)", Number(r.ca.actuel) >= 150);
  verif("2. nouveauxInscrits.actuel compte au moins le compte réel inséré", r.nouveauxInscrits.actuel >= 1);
  verif("3. nouveauxInscrits.particuliers compte le bon type de compte", r.nouveauxInscrits.particuliers >= 1);
  verif("4. annoncesPubliees.actuel compte l'annonce publiée insérée", r.annoncesPubliees.actuel >= 1);
  verif("5. annoncesPubliees.vente compte la bonne catégorie", r.annoncesPubliees.vente >= 1);
  verif("6. panierMoyen.actuel reflète un vrai montant moyen (pas 0)", Number(r.panierMoyen.actuel) > 0);
  verif("7. tauxConversion reste explicitement non mesuré (aucun suivi de visite n'existe)", r.tauxConversion.nonMesure === true);
  verif("8. tauxDesabonnement compte le vrai abonnement actif inséré", r.tauxDesabonnement.actifsActuels >= 1);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
