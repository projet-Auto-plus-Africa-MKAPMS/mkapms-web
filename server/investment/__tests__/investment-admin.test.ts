/**
 * Investment Engine — surface admin/PDG (server/investment/router.ts).
 * Base de données réelle.
 *
 * Le moteur (contrat.ts, ownership.ts, payout.ts, revenu.ts) était déjà
 * couvert par investment.test.ts en logique pure, mais aucun écran
 * n'existait pour la direction : ce test couvre les procédures ajoutées
 * pour InvestissementAdmin.tsx (investisseurs, investissements,
 * versementsDe) et le parcours réel création → conflit → transition.
 *
 * Lancement : `npx tsx server/investment/__tests__/investment-admin.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { investments, investors } from "../schema.js";
import { investmentRouter } from "../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT_UID = 900701;
const ADMIN_UID = 900702;
const EMAIL_PREFIX = "test-investment-admin";

const clientCaller = investmentRouter.createCaller({ req: { headers: {} } as never, res: {} as never, user: { uid: CLIENT_UID, role: "user", email: `${EMAIL_PREFIX}-client@mkapms.local` } });
const adminCaller = investmentRouter.createCaller({ req: { headers: {} } as never, res: {} as never, user: { uid: ADMIN_UID, role: "super_admin", email: `${EMAIL_PREFIX}-admin@mkapms.local` } });

async function nettoyer() {
  const mesInvestisseurs = await db.select().from(investors).where(eq(investors.userId, CLIENT_UID));
  const investorIds = mesInvestisseurs.map((i) => i.id);
  if (investorIds.length) {
    await db.delete(investments).where(inArray(investments.investorId, investorIds));
  }
  await db.delete(investors).where(eq(investors.userId, CLIENT_UID));
  await db.delete(users).where(inArray(users.id, [CLIENT_UID, ADMIN_UID]));
}

async function main() {
  await nettoyer();
  // Comptes réels nécessaires (investors.userId référence users.id).
  await db.insert(users).values([
    { id: CLIENT_UID, email: `${EMAIL_PREFIX}-client@mkapms.local`, name: "Test Investment Client", role: "user" },
    { id: ADMIN_UID, email: `${EMAIL_PREFIX}-admin@mkapms.local`, name: "Test Investment Admin", role: "super_admin" },
  ]);

  // ── 1. Onboarding en libre-service (déjà réel, non modifié) ──
  const investisseur = await clientCaller.devenirInvestisseur({ investorType: "PASSIVE_INVESTOR" });
  verif("devenirInvestisseur crée réellement une ligne investors", investisseur.userId === CLIENT_UID);

  // ── 2. investisseurs() — nouvelle vue admin, jamais construite avant ──
  const listeInvestisseurs = await adminCaller.investisseurs();
  const monInvestisseur = listeInvestisseurs.find((i) => i.id === investisseur.id);
  verif("investisseurs() liste l'investisseur réellement créé", !!monInvestisseur);
  verif("investisseurs() joint le vrai compte (nom/email), jamais un placeholder", monInvestisseur?.utilisateur?.email === `${EMAIL_PREFIX}-client@mkapms.local`);

  // ── 3. Conflit : aucun contrat concurrent au départ ──
  const conflitInitial = await adminCaller.verifierConflit({
    countryCode: "FR", universeId: "location_pro", startAt: new Date("2027-01-01"), endAt: new Date("2027-12-31"),
  });
  verif("verifierConflit() ne signale aucun conflit sur un périmètre libre", conflitInitial.conflit === false);

  // ── 4. Création réelle d'un brouillon ──
  const brouillon = await adminCaller.creerBrouillon({
    investorId: investisseur.id,
    universeId: "location_pro",
    countryCode: "FR",
    startAt: new Date("2027-01-01"),
    endAt: new Date("2027-12-31"),
    pricingModel: "fixed_price",
    fixedPrice: 5000,
    currency: "EUR",
    payoutSchedule: "mensuel",
  });
  verif("creerBrouillon crée le contrat en statut DRAFT", brouillon.status === "DRAFT");
  verif("aucun taux ni mensualité inventés au-delà de ce qui a été saisi", Number(brouillon.fixedPrice) === 5000);

  // ── 5. investissements() — vue admin, filtrable par investisseur ──
  const tousLesContrats = await adminCaller.investissements();
  verif("investissements() sans filtre renvoie le contrat créé", tousLesContrats.some((i) => i.id === brouillon.id));
  const contratsDeCetInvestisseur = await adminCaller.investissements({ investorId: investisseur.id });
  verif("investissements({investorId}) filtre réellement côté serveur", contratsDeCetInvestisseur.every((i) => i.investorId === investisseur.id));

  // ── 6. Un second contrat qui chevauche le même périmètre est bloqué ──
  const conflitApres = await adminCaller.verifierConflit({
    countryCode: "FR", universeId: "location_pro", startAt: new Date("2027-06-01"), endAt: new Date("2027-06-30"),
  });
  verif("verifierConflit() détecte le chevauchement avec le contrat déjà créé", conflitApres.conflit === true);

  // ── 7. Transition réelle DRAFT → UNDER_REVIEW, jamais une transition hors graphe ──
  const transition = await adminCaller.transitionner({ investmentId: brouillon.id, vers: "UNDER_REVIEW", motif: "Test admin." });
  verif("transitionner() effectue la transition autorisée", transition.ok && transition.investissement?.status === "UNDER_REVIEW");

  const historique = await adminCaller.historiqueStatuts({ investmentId: brouillon.id });
  verif("historiqueStatuts() trace réellement la transition (jamais un avenant qui l'efface)", historique.some((h) => h.toStatus === "UNDER_REVIEW"));

  // ── 8. versementsDe() : honnêtement vide tant qu'aucun revenu n'a été attribué ──
  const versements = await adminCaller.versementsDe({ investmentId: brouillon.id });
  verif("versementsDe() est vide tant qu'aucun versement réel n'existe (jamais un montant inventé)", versements.length === 0);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
