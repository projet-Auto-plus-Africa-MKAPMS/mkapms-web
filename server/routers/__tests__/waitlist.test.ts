/**
 * ListeAttente.tsx affichait 3 entrées 100% fabriquées, dont une avec un
 * faux statut "disponible" prêt à réserver alors qu'aucune annonce n'est
 * jamais réellement marquée indisponible/disponible par le code existant.
 * waitlist.join/list/cancel sont réels : la position est toujours recalculée
 * en direct depuis les inscriptions réellement enregistrées. Base de données
 * réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/waitlist.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, annonces, waitlistEntries } from "../../schema.js";
import { waitlistRouter } from "../waitlist.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const OWNER = 900940;
const CLIENT_A = 900941;
const CLIENT_B = 900942;
const PREFIX = "TEST-WAITLIST-";

const callerA = waitlistRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CLIENT_A, role: "user", email: "a" } });
const callerB = waitlistRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CLIENT_B, role: "user", email: "b" } });
const callerOwner = waitlistRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: OWNER, role: "user", email: "o" } });

async function nettoyer() {
  await db.delete(waitlistEntries).where(inArray(waitlistEntries.userId, [CLIENT_A, CLIENT_B, OWNER]));
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Annonce`]));
  await db.delete(users).where(inArray(users.id, [OWNER, CLIENT_A, CLIENT_B]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: OWNER, email: `${PREFIX.toLowerCase()}owner@mkapms.local`, name: "Loueur Test" },
    { id: CLIENT_A, email: `${PREFIX.toLowerCase()}a@mkapms.local`, name: "Client A" },
    { id: CLIENT_B, email: `${PREFIX.toLowerCase()}b@mkapms.local`, name: "Client B" },
  ]);
  const [annonceVente] = await db.insert(annonces).values({ ownerId: OWNER, titre: `${PREFIX}AnnonceVente`, marque: "Renault", modele: "Clio", type: "vente", status: "publiee" }).returning();
  const [annonceLocation] = await db.insert(annonces).values({ ownerId: OWNER, titre: `${PREFIX}Annonce`, marque: "Renault", modele: "Clio", type: "location", status: "publiee", prixJour: "45.00" }).returning();

  await assert.rejects(() => callerA.join({ annonceId: annonceVente.id }), /location/i);
  verif("1. join refuse une annonce de vente (liste d'attente réservée à la location)", true);

  await assert.rejects(() => callerOwner.join({ annonceId: annonceLocation.id }), /propre annonce/i);
  verif("2. le propriétaire ne peut pas s'inscrire sur sa propre annonce", true);

  const entreeA = await callerA.join({ annonceId: annonceLocation.id });
  await new Promise((r) => setTimeout(r, 10));
  const entreeB = await callerB.join({ annonceId: annonceLocation.id });

  await assert.rejects(() => callerA.join({ annonceId: annonceLocation.id }), /Déjà inscrit/i);
  verif("3. une double inscription active est refusée", true);

  const listeA = await callerA.list();
  const listeB = await callerB.list();
  const ligneA = listeA.find((e) => e.id === entreeA.id);
  const ligneB = listeB.find((e) => e.id === entreeB.id);
  verif("4. la première inscription réelle est en position 1", ligneA?.position === 1);
  verif("5. la seconde inscription réelle est en position 2 (rang réel, pas devinée)", ligneB?.position === 2);
  verif("6. list joint les vraies infos de l'annonce (titre)", ligneA?.annonce?.titre === `${PREFIX}Annonce`);

  await callerA.cancel({ id: entreeA.id });
  const listeBApres = await callerB.list();
  const ligneBApres = listeBApres.find((e) => e.id === entreeB.id);
  verif("7. après annulation de la première inscription, la seconde passe réellement en position 1", ligneBApres?.position === 1);

  const listeAApres = await callerA.list();
  verif("8. l'inscription annulée apparaît avec le statut réel 'annule'", listeAApres.find((e) => e.id === entreeA.id)?.status === "annule");

  await assert.rejects(() => callerA.cancel({ id: entreeA.id }), /introuvable/i);
  verif("9. annuler une inscription déjà annulée échoue proprement", true);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
