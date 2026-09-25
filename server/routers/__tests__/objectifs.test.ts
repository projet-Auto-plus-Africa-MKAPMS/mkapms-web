/**
 * AdminObjectif.tsx affichait 6 indicateurs 100% fabriqués (actuel + cible).
 * objectifs.list recalcule l'actuel en direct depuis payments/users/annonces/
 * support_tickets ; la cible est une décision de la Direction persistée via
 * objectifs.setCible, jamais devinée. taux_retention et nps n'ont aucune
 * méthode de calcul réelle : ils restent "nonMesure", jamais approximés.
 * Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/objectifs.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, payments, annonces, supportTickets, objectifsPlateforme } from "../../schema.js";
import { objectifsRouter } from "../objectifs.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT = 900950;
const PREFIX = "TEST-OBJECTIFS-";
const callerAdmin = objectifsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: 900951, role: "super_admin", email: "admin-objectifs@mkapms.local" } });

async function nettoyer() {
  await db.delete(payments).where(eq(payments.userId, CLIENT));
  await db.delete(supportTickets).where(eq(supportTickets.contactEmail, `${PREFIX}client@mkapms.local`));
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Annonce`]));
  await db.delete(users).where(eq(users.id, CLIENT));
  await db.delete(objectifsPlateforme).where(eq(objectifsPlateforme.cle, "ca_mensuel"));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: CLIENT, email: `${PREFIX}client@mkapms.local`, name: "Client Objectifs Test" });
  await db.insert(payments).values({ userId: CLIENT, type: "vehicle_boost", amount: "100.00", currency: "EUR", status: "paid" });
  await db.insert(annonces).values({ ownerId: CLIENT, titre: `${PREFIX}Annonce`, marque: "Renault", modele: "Clio", status: "publiee" });
  const debut = new Date();
  const fin = new Date(debut.getTime() + 2 * 60 * 60 * 1000);
  await db.insert(supportTickets).values({ contactNom: "Client Objectifs Test", contactEmail: `${PREFIX}client@mkapms.local`, sujet: "Test", message: "Test", createdAt: debut, respondedAt: fin });

  const avant = await callerAdmin.list();
  const caAvant = avant.find((o) => o.cle === "ca_mensuel");
  verif("1. ca_mensuel reflète le paiement réel du mois en cours", !!caAvant?.actuel?.includes("EUR"));

  const annoncesInd = avant.find((o) => o.cle === "annonces_actives");
  verif("2. annonces_actives compte au moins l'annonce publiée insérée", Number(annoncesInd?.actuel) >= 1);

  const support = avant.find((o) => o.cle === "temps_reponse_support");
  verif("3. temps_reponse_support calcule un vrai écart en heures (~2h)", support?.actuel != null && support.actuel.includes("h"));

  const retention = avant.find((o) => o.cle === "taux_retention");
  const nps = avant.find((o) => o.cle === "nps");
  verif("4. taux_retention reste explicitement non mesuré (jamais approximé)", retention?.nonMesure === true && retention?.actuel === null);
  verif("5. nps reste explicitement non mesuré (jamais approximé)", nps?.nonMesure === true && nps?.actuel === null);

  await callerAdmin.setCible({ cle: "ca_mensuel", cible: 5000 });
  const apres = await callerAdmin.list();
  const caApres = apres.find((o) => o.cle === "ca_mensuel");
  verif("6. la cible fixée par l'admin est bien persistée et relue", caApres?.cible === "5000.00");

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
