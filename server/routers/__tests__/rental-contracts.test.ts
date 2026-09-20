/**
 * server/routers/rentalContracts.ts (tâche #56, item 2) — la pièce
 * manquante entre une candidature payée (rentalApplications) et un contrat
 * de location réellement actif (véhicule + dates). Un contrat n'est créé
 * que pour une candidature dont l'acompte est payé, jamais pour une
 * candidature encore en attente ou refusée ; le véhicule référencé doit
 * réellement exister. Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/rental-contracts.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, annonces, rentalApplications, rentalContracts } from "../../schema.js";
import { rentalContractsRouter } from "../rentalContracts.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const LOCATAIRE = 900993;
const ADMIN = 900994;
const PREFIX = "TEST-RENTALCONTRACT-";

const callerAdmin = rentalContractsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ADMIN, role: "super_admin", email: "admin-rentalcontract@mkapms.local" } });
const callerLocataire = rentalContractsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: LOCATAIRE, role: "user", email: "locataire-rentalcontract@mkapms.local" } });

async function nettoyer() {
  const apps = await db.select({ id: rentalApplications.id }).from(rentalApplications).where(eq(rentalApplications.userId, LOCATAIRE));
  if (apps.length) await db.delete(rentalContracts).where(inArray(rentalContracts.applicationId, apps.map((a) => a.id)));
  await db.delete(rentalApplications).where(eq(rentalApplications.userId, LOCATAIRE));
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Vehicule`]));
  await db.delete(users).where(inArray(users.id, [LOCATAIRE, ADMIN]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: LOCATAIRE, email: "locataire-test-rentalcontract@mkapms.local", name: "Locataire Test" },
    { id: ADMIN, email: "admin-test-rentalcontract@mkapms.local", name: "Admin Test" },
  ]);
  const [vehicule] = await db.insert(annonces).values({ ownerId: ADMIN, titre: `${PREFIX}Vehicule`, marque: "Renault", modele: "Trafic", type: "location", status: "publiee" }).returning();

  const [candidatureSoumise] = await db.insert(rentalApplications).values({ userId: LOCATAIRE, applicantType: "society", status: "submitted", token: "tok-1" }).returning();
  const [candidaturePayee] = await db.insert(rentalApplications).values({ userId: LOCATAIRE, applicantType: "society", status: "paid", depositAmount: "250.00", depositCurrency: "EUR", token: "tok-2" }).returning();

  // 1. Impossible de créer un contrat pour une candidature pas encore payée.
  await assert.rejects(
    () => callerAdmin.createContract({ applicationId: candidatureSoumise.id, vehicleId: vehicule.id, startDate: new Date().toISOString() }),
    "1. contrat refusé pour une candidature non payée",
  );
  ok++; total++;

  // 2. Impossible de créer un contrat pour un véhicule inexistant.
  await assert.rejects(
    () => callerAdmin.createContract({ applicationId: candidaturePayee.id, vehicleId: 999999999, startDate: new Date().toISOString() }),
    "2. contrat refusé pour un véhicule inexistant",
  );
  ok++; total++;

  // 3. Création réelle pour une candidature payée et un véhicule réel.
  const contrat = await callerAdmin.createContract({ applicationId: candidaturePayee.id, vehicleId: vehicule.id, startDate: "2025-01-01T00:00:00.000Z", endDate: "2025-12-31T00:00:00.000Z" });
  verif("3. le contrat est créé avec le bon locataire", contrat.userId === LOCATAIRE);

  // 4. La candidature passe à "completed" une fois le contrat créé.
  const [appMaj] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, candidaturePayee.id)).limit(1);
  verif("4. la candidature passe à completed", appMaj.status === "completed");

  // 5. Le locataire voit son contrat avec le véhicule attaché.
  const mesContrats = await callerLocataire.myContracts();
  verif("5. le locataire voit son contrat avec le véhicule attaché", mesContrats.some((c) => c.id === contrat.id && c.vehicule?.marque === "Renault"));

  // 6. Un autre utilisateur ne voit jamais ce contrat.
  const callerAutre = rentalContractsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: 900995, role: "user", email: "tiers-rentalcontract@mkapms.local" } });
  const contratsAutre = await callerAutre.myContracts();
  verif("6. un tiers ne voit jamais le contrat d'un autre", !contratsAutre.some((c) => c.id === contrat.id));

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
