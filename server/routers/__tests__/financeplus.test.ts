/**
 * Finance+ (server/routers/financeplus.ts). Base de données réelle.
 *
 * Couvre le point central du chantier : aucun contrat LOA ne peut être
 * créé sans une règle pays "credit" réellement confirmée (Country Policy
 * Engine) — jamais une autorisation par défaut, jamais un taux ou une
 * mensualité inventés. Vérifie aussi que le type "fractionne" est refusé
 * ici (moteur distinct, routers/installments.ts), et l'isolation par
 * client des lectures.
 *
 * Lancement : `npx tsx server/routers/__tests__/financeplus.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray, like } from "drizzle-orm";
import { db } from "../../db.js";
import { finplusContrats } from "../../modules/financeplus.js";
import { cpeRules, cpeEvaluations } from "../../country-policy/schema.js";
import { financeplusRouter } from "../financeplus.js";
import { declareRule, confirmRule } from "../../country-policy/service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT_A = 900301;
const CLIENT_B = 900302;
const TOPIC_TEST = "financeplus_test_loa";
const PAYS_TEST = "FR";

const callerA = financeplusRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CLIENT_A, role: "user", email: "finance-test-a@mkapms.local" } });
const callerB = financeplusRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CLIENT_B, role: "user", email: "finance-test-b@mkapms.local" } });
const publicCaller = financeplusRouter.createCaller({ req: {} as never, res: {} as never, user: null });

async function nettoyer() {
  await db.delete(finplusContrats).where(inArray(finplusContrats.clientId, [CLIENT_A, CLIENT_B]));
  await db.delete(cpeEvaluations).where(inArray(cpeEvaluations.actorId, [CLIENT_A, CLIENT_B]));
  await db.delete(cpeRules).where(like(cpeRules.topic, `${TOPIC_TEST}%`));
}

async function main() {
  await nettoyer();

  // ── 1. Sans règle pays confirmée : validation_requise, jamais une autorisation par défaut ──
  const eligibiliteSansRegle = await publicCaller.eligibilite({ countryCode: PAYS_TEST });
  verif("eligibilite() sans règle confirmée répond validation_requise", eligibiliteSansRegle.verdict === "validation_requise");
  verif("le motif nomme explicitement l'absence de règle", eligibiliteSansRegle.reason.includes("RÈGLE PAYS NON CONFIRMÉE"));

  // ── 2. creerSimulation refuse tant qu'aucune règle n'est confirmée ──
  let refuseSansRegle = false;
  try {
    await callerA.creerSimulation({ type: "loa", countryCode: PAYS_TEST, prixVehicule: 20000, dureeMois: 36 });
  } catch (e) {
    refuseSansRegle = e instanceof Error && /validation requise|RÈGLE PAYS/i.test(e.message);
  }
  verif("creerSimulation refuse la création sans règle pays confirmée", refuseSansRegle);

  const contratsAvant = await db.select().from(finplusContrats).where(eq(finplusContrats.clientId, CLIENT_A));
  verif("aucun contrat n'est créé quand la règle est refusée", contratsAvant.length === 0);

  // ── 3. Une règle déclarée mais non confirmée n'autorise toujours rien ──
  const regle = await declareRule({
    countryCode: PAYS_TEST,
    domain: "credit",
    topic: TOPIC_TEST,
    rule: "Test : LOA autorisée sous conditions du Code de la consommation.",
    effect: "autorise",
    authority: "Fixture de test",
    declaredBy: CLIENT_A,
  });
  const eligibiliteNonConfirmee = await publicCaller.eligibilite({ countryCode: PAYS_TEST });
  verif("une règle déclarée mais non confirmée n'autorise pas (déclarer n'est pas confirmer)", eligibiliteNonConfirmee.verdict === "validation_requise");

  // ── 4. Une fois confirmée par un humain, l'éligibilité passe réellement à "autorise" ──
  await confirmRule(regle.id, CLIENT_A);
  const eligibiliteConfirmee = await publicCaller.eligibilite({ countryCode: PAYS_TEST });
  verif("eligibilite() reflète la confirmation réelle de la règle", eligibiliteConfirmee.verdict === "autorise");

  // ── 5. creerSimulation crée réellement un contrat, sans jamais calculer de mensualité ──
  const contrat = await callerA.creerSimulation({ type: "loa", countryCode: PAYS_TEST, prixVehicule: 20000, apportInitial: 2000, dureeMois: 36 });
  verif("creerSimulation crée le contrat une fois la règle confirmée", contrat.status === "simulation" && Number(contrat.prixVehicule) === 20000);
  verif("aucune mensualité n'est inventée par le serveur", contrat.mensualite === null);
  verif("aucun taux ni total de financement inventé", contrat.totalFinancement === null);

  // ── 6. Isolation stricte par client ──
  const mesContratsA = await callerA.mesContrats();
  const mesContratsB = await callerB.mesContrats();
  verif("le client A voit son contrat", mesContratsA.some((c) => c.id === contrat.id));
  verif("le client B ne voit jamais le contrat du client A", !mesContratsB.some((c) => c.id === contrat.id));

  const detailAutrui = await callerB.contrat({ id: contrat.id });
  verif("un client ne peut pas lire le détail du contrat d'un autre client", detailAutrui === null);

  // ── 7. Le type "fractionne" est refusé ici (moteur distinct, jamais dupliqué) ──
  let fractionneRefuse = false;
  try {
    // @ts-expect-error — "fractionne" n'est volontairement plus un type accepté par ce routeur.
    await callerA.creerSimulation({ type: "fractionne", countryCode: PAYS_TEST, prixVehicule: 5000, dureeMois: 5 });
  } catch {
    fractionneRefuse = true;
  }
  verif("le type \"fractionne\" est rejeté (déjà couvert par routers/installments.ts)", fractionneRefuse);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
