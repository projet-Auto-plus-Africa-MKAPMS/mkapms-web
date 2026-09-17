/**
 * Paiement fractionné — échéancier et alertes client (server/routers/installments.ts).
 * Base de données réelle.
 *
 * Couvre `mesEcheances` et `mesAlertes`, ajoutées pour reconnecter
 * CentreEcheancier.tsx et AlertesPaiements.tsx (chantier finance) : ces
 * écrans affichaient un tableau hardcodé avant ce chantier. Aucune donnée
 * n'est inventée ici : les échéances viennent du flux réel
 * request → validate (génère installment_payments), et les alertes d'une
 * ligne réellement insérée dans installment_alerts.
 *
 * Lancement : `npx tsx server/routers/__tests__/installments-echeancier.test.ts`
 */
import assert from "node:assert/strict";
import { inArray, eq } from "drizzle-orm";
import { db } from "../../db.js";
import { installmentRequests, installmentContracts, installmentPayments, installmentAlerts } from "../../schema.js";
import { installmentsRouter } from "../installments.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT_A = 900601;
const CLIENT_B = 900602;
const ADMIN = 900603;

const callerA = installmentsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CLIENT_A, role: "user", email: "install-test-a@mkapms.local" } });
const callerB = installmentsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CLIENT_B, role: "user", email: "install-test-b@mkapms.local" } });
const adminCaller = installmentsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ADMIN, role: "super_admin", email: "install-test-admin@mkapms.local" } });

async function nettoyer() {
  const requetes = await db.select().from(installmentRequests).where(inArray(installmentRequests.clientId, [CLIENT_A, CLIENT_B]));
  const requeteIds = requetes.map((r) => r.id);
  if (requeteIds.length) {
    const contrats = await db.select().from(installmentContracts).where(inArray(installmentContracts.requestId, requeteIds));
    const contratIds = contrats.map((c) => c.id);
    if (contratIds.length) {
      await db.delete(installmentAlerts).where(inArray(installmentAlerts.contractId, contratIds));
      await db.delete(installmentPayments).where(inArray(installmentPayments.contractId, contratIds));
      await db.delete(installmentContracts).where(inArray(installmentContracts.requestId, requeteIds));
    }
  }
  await db.delete(installmentRequests).where(inArray(installmentRequests.clientId, [CLIENT_A, CLIENT_B]));
}

async function main() {
  await nettoyer();

  // ── 1. Sans demande validée, l'échéancier et les alertes du client sont honnêtement vides ──
  const echeancesVides = await callerA.mesEcheances();
  const alertesVides = await callerA.mesAlertes();
  verif("mesEcheances() est vide tant qu'aucune demande n'est validée (jamais une échéance inventée)", echeancesVides.length === 0);
  verif("mesAlertes() est vide tant qu'aucune alerte réelle n'existe", alertesVides.length === 0);

  // ── 2. Flux réel demande → validation admin → génération de l'échéancier ──
  const demande = await callerA.request({ montantTotal: 3000, nbEcheances: 3, isPro: false });
  await adminCaller.validate({ requestId: demande.id, approve: true });

  const echeancesA = await callerA.mesEcheances();
  verif("mesEcheances() renvoie les 3 échéances réellement générées par validate()", echeancesA.length === 3);
  verif("chaque échéance vaut 1000 € (3000 / 3, jamais un montant inventé)", echeancesA.every((e) => Number(e.montant) === 1000));
  verif("les échéances sont triées par date d'échéance", new Date(echeancesA[0].dueDate).getTime() <= new Date(echeancesA[2].dueDate).getTime());

  // ── 3. Isolation stricte par client ──
  const echeancesB = await callerB.mesEcheances();
  verif("le client B ne voit jamais les échéances du client A", echeancesB.length === 0);

  // ── 4. Une alerte réellement insérée apparaît, jamais une alerte fabriquée côté client ──
  const [contrat] = await db.select().from(installmentContracts).where(eq(installmentContracts.requestId, demande.id));
  await db.insert(installmentAlerts).values({ contractId: contrat.id, level: "j3", note: "Test échéance à venir" });

  const alertesA = await callerA.mesAlertes();
  verif("mesAlertes() renvoie l'alerte réellement insérée pour ce client", alertesA.length === 1 && alertesA[0].level === "j3");

  const alertesB = await callerB.mesAlertes();
  verif("le client B ne voit jamais l'alerte du client A", alertesB.length === 0);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
