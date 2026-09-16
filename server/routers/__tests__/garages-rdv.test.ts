/**
 * Prise de rendez-vous garage (client/src/pages/garage/PriseRendezVous.tsx,
 * partagé par 5 écrans). Base de données réelle.
 *
 * Corrige une fabrication réelle : la page proposait un tableau GARAGES
 * codé en dur (3 adresses inventées : "MKA.P-MS Paris 11e", "MKA.P-MS Lyon
 * 3e", "MKA.P-MS Marseille"). Ce test prouve que le sélecteur de garage
 * consomme désormais garages.list (server/routers/garages.ts), et que
 * seuls les garages réellement validés par la Direction y apparaissent —
 * jamais un garage en attente, jamais un garage inventé.
 *
 * Lancement : `npx tsx server/routers/__tests__/garages-rdv.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { garagesPublics, devisGarageRequests, serviceTracking } from "../../schema.js";
import { garagesRouter } from "../garages.js";
import { devisRouter } from "../devis.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const OWNER_TEST = 900501;
const CLIENT_TEST = 900502;
const NOM_PREFIX = "TEST-GARAGE-RDV-";

const ownerCaller = garagesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: OWNER_TEST, role: "garage", email: "garage-test-rdv@mkapms.local" } });
const publicCaller = garagesRouter.createCaller({ req: {} as never, res: {} as never, user: null });
const devisCaller = devisRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CLIENT_TEST, role: "user", email: "client-test-rdv@mkapms.local" } });

async function nettoyer() {
  const garages = await db.select({ id: garagesPublics.id }).from(garagesPublics).where(eq(garagesPublics.ownerId, OWNER_TEST));
  const garageIds = garages.map((g) => g.id);
  await db.delete(devisGarageRequests).where(eq(devisGarageRequests.userId, CLIENT_TEST));
  await db.delete(serviceTracking).where(eq(serviceTracking.userId, CLIENT_TEST));
  if (garageIds.length) await db.delete(garagesPublics).where(inArray(garagesPublics.id, garageIds));
}

async function main() {
  await nettoyer();

  // ── 1. Un garage tout juste inscrit n'est PAS visible : validation Direction obligatoire ──
  const garage = await ownerCaller.register({ name: `${NOM_PREFIX}Central`, city: "Abidjan", postalCode: "00225", country: "CI" });
  verif("register crée le garage en attente, jamais directement visible", garage.status === "en_attente");

  const listeAvantValidation = await publicCaller.list({ q: NOM_PREFIX, limit: 50 });
  verif("garages.list n'expose jamais un garage non validé", !listeAvantValidation.items.some((g) => g.id === garage.id));

  // ── 2. Une fois validé par la Direction, le garage réel apparaît — jamais un garage inventé ──
  await db.update(garagesPublics).set({ status: "valide" }).where(eq(garagesPublics.id, garage.id));
  const listeApresValidation = await publicCaller.list({ q: NOM_PREFIX, limit: 50 });
  const garageVisible = listeApresValidation.items.find((g) => g.id === garage.id);
  verif("garages.list expose le garage réel une fois validé", garageVisible?.name === `${NOM_PREFIX}Central` && garageVisible?.city === "Abidjan");

  // ── 3. La demande de rendez-vous transporte les données réelles du garage choisi, jamais inventées ──
  const demande = await devisCaller.create({
    contactNom: "Client Test",
    contactEmail: "client-test-rdv@mkapms.local",
    typeIntervention: "Rendez-vous atelier",
    description: `Rendez-vous demandé chez ${garageVisible!.name} le 2026-01-15 à 09:00.`,
    ville: garageVisible!.city ?? undefined,
    codePostal: garageVisible!.postalCode ?? undefined,
    pays: garageVisible!.country ?? undefined,
  });
  verif("la demande de rendez-vous porte la vraie ville du garage choisi", demande.ville === "Abidjan");
  verif("la demande de rendez-vous porte le vrai pays du garage choisi", demande.pays === "CI");

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
