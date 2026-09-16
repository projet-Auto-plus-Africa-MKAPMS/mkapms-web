/**
 * LOT 7 (suite) — RBAC Fournisseur/Transporteur. Base de données réelle.
 *
 * Couvre le seul point qui compte pour ce lot : l'isolement. Un fournisseur
 * ne voit jamais la fiche d'un autre fournisseur, un transporteur ne peut
 * jamais atteindre une procédure back-office/direction, et aucun octroi ne
 * réussit sans une fiche réelle du bon type. Aucun compte réel de
 * production n'est touché : tout est créé, testé puis supprimé ici.
 *
 * Lancement : `npx tsx server/supplier-engine/__tests__/access.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { supplierProfiles, supplierCarrierAccounts } from "../schema.js";
import { partners } from "../../modules/operations.js";
import { grantSupplierAccess, grantCarrierAccess, activateAccess, revokeAccess, resolveAccess } from "../access.js";
import { supplierPortalRouter } from "../../routers/supplier-portal.js";
import { activationAuditRouter } from "../../activation-audit/index.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const PDG_TEST = 900401;
const EMAIL_PREFIX = "test-supplier-carrier-";

async function nettoyer(userIds: number[], partnerIds: number[], supplierIds: number[]) {
  await db.delete(supplierCarrierAccounts).where(inArray(supplierCarrierAccounts.userId, userIds));
  if (supplierIds.length) await db.delete(supplierProfiles).where(inArray(supplierProfiles.id, supplierIds));
  if (partnerIds.length) await db.delete(partners).where(inArray(partners.id, partnerIds));
  await db.delete(users).where(inArray(users.id, userIds));
}

async function main() {
  // ── Fixtures : deux comptes fournisseur candidats, un compte transporteur, un compte "user" ordinaire ──
  const [userA] = await db.insert(users).values({ email: `${EMAIL_PREFIX}a@mkapms.local`, name: "Fournisseur A (test)" }).returning();
  const [userB] = await db.insert(users).values({ email: `${EMAIL_PREFIX}b@mkapms.local`, name: "Fournisseur B (test)" }).returning();
  const [userC] = await db.insert(users).values({ email: `${EMAIL_PREFIX}c@mkapms.local`, name: "Transporteur C (test)" }).returning();
  const [userOrdinaire] = await db.insert(users).values({ email: `${EMAIL_PREFIX}user@mkapms.local`, name: "Particulier (test)" }).returning();

  const [partnerFournisseur] = await db.insert(partners).values({ name: "Fournisseur Pièces Test", type: "fournisseur_pieces", country: "FR" }).returning();
  const [partnerTransporteur] = await db.insert(partners).values({ name: "Transporteur Test", type: "transporteur", country: "FR" }).returning();
  const [partnerGarage] = await db.insert(partners).values({ name: "Garage Test (mauvais type)", type: "garage", country: "FR" }).returning();

  const [profilA] = await db.insert(supplierProfiles).values({ reference: "TEST-SUP-A", partnerId: partnerFournisseur.id, supplierType: "pieces", companyLegalName: "Fournisseur A SARL", countryCode: "FR" }).returning();
  const [profilB] = await db.insert(supplierProfiles).values({ reference: "TEST-SUP-B", partnerId: partnerFournisseur.id, supplierType: "pieces", companyLegalName: "Fournisseur B SARL", countryCode: "FR" }).returning();

  const userIds = [userA.id, userB.id, userC.id, userOrdinaire.id];
  const partnerIds = [partnerFournisseur.id, partnerTransporteur.id, partnerGarage.id];
  const supplierIds = [profilA.id, profilB.id];

  try {
    // ── 1. Octroi refusé sur une fiche fournisseur inexistante ──
    let refuseFicheInexistante = false;
    try {
      await grantSupplierAccess({ userId: userA.id, supplierProfileId: 999999999, grantedBy: PDG_TEST });
    } catch (e) {
      refuseFicheInexistante = e instanceof Error && /introuvable/.test(e.message);
    }
    verif("grantSupplierAccess refuse une fiche fournisseur inexistante", refuseFicheInexistante);

    // ── 2. Octroi transporteur refusé si le partenaire n'est pas de type "transporteur" ──
    let refuseMauvaisType = false;
    try {
      await grantCarrierAccess({ userId: userC.id, partnerId: partnerGarage.id, grantedBy: PDG_TEST });
    } catch (e) {
      refuseMauvaisType = e instanceof Error && /pas "transporteur"/.test(e.message);
    }
    verif("grantCarrierAccess refuse un partenaire qui n'est pas de type transporteur", refuseMauvaisType);

    // ── 3. Octrois réels ──
    const accesA = await grantSupplierAccess({ userId: userA.id, supplierProfileId: profilA.id, grantedBy: PDG_TEST });
    verif("grantSupplierAccess crée réellement le lien, statut ready_for_onboarding", accesA.status === "ready_for_onboarding");
    const accesB = await grantSupplierAccess({ userId: userB.id, supplierProfileId: profilB.id, grantedBy: PDG_TEST });
    const accesC = await grantCarrierAccess({ userId: userC.id, partnerId: partnerTransporteur.id, grantedBy: PDG_TEST });
    verif("grantCarrierAccess crée réellement le lien transporteur", accesC.accountType === "carrier" && accesC.partnerId === partnerTransporteur.id);

    const [userARelu] = await db.select({ role: users.role }).from(users).where(eq(users.id, userA.id));
    verif("grantSupplierAccess fait réellement passer le rôle du compte à \"supplier\"", userARelu.role === "supplier");

    // ── 4. Un second octroi sur un compte déjà lié est refusé ──
    let refuseDejaLie = false;
    try {
      await grantSupplierAccess({ userId: userA.id, supplierProfileId: profilB.id, grantedBy: PDG_TEST });
    } catch (e) {
      refuseDejaLie = e instanceof Error && /déjà lié/.test(e.message);
    }
    verif("un compte déjà lié ne peut pas recevoir un second octroi", refuseDejaLie);

    // ── 5. Isolation stricte : resolveAccess ne renvoie jamais la fiche d'un autre ──
    const resoluA = await resolveAccess(userA.id);
    const resoluB = await resolveAccess(userB.id);
    verif("resolveAccess(A) renvoie la fiche A, jamais B", resoluA?.supplierProfileId === profilA.id);
    verif("resolveAccess(B) renvoie la fiche B, jamais A", resoluB?.supplierProfileId === profilB.id);
    verif("A et B n'ont jamais la même fiche résolue", resoluA?.supplierProfileId !== resoluB?.supplierProfileId);

    // ── 6. Isolation via le routeur réel : le portail ne renvoie que la fiche de l'appelant ──
    const callerA = supplierPortalRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: userA.id, role: "supplier", email: userA.email } });
    const callerB = supplierPortalRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: userB.id, role: "supplier", email: userB.email } });
    const monAccesA = await callerA.monAcces();
    verif("monAcces() du fournisseur A renvoie sa propre fiche", monAccesA?.fiche?.id === profilA.id);
    verif("monAcces() du fournisseur A ne mentionne jamais la fiche de B", monAccesA?.fiche?.id !== profilB.id);
    const monAccesB = await callerB.monAcces();
    verif("monAcces() du fournisseur B renvoie sa propre fiche, jamais celle de A", monAccesB?.fiche?.id === profilB.id);

    // ── 7. Un compte "user" ordinaire n'a jamais accès au portail fournisseur/transporteur ──
    const callerOrdinaire = supplierPortalRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: userOrdinaire.id, role: "user", email: userOrdinaire.email } });
    let refuseUserOrdinaire = false;
    try {
      await callerOrdinaire.monAcces();
    } catch (e) {
      refuseUserOrdinaire = e instanceof Error && /FORBIDDEN|requis/i.test(e.message);
    }
    verif("un compte \"user\" ordinaire est refusé sur le portail fournisseur/transporteur", refuseUserOrdinaire);

    // ── 8. Un fournisseur/transporteur n'atteint jamais une procédure back-office/direction ──
    const auditCallerSupplier = activationAuditRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: userA.id, role: "supplier", email: userA.email } });
    let refuseAccesDirection = false;
    try {
      await auditCallerSupplier.latest();
    } catch (e) {
      refuseAccesDirection = e instanceof Error && /FORBIDDEN|requis/i.test(e.message);
    }
    verif("un compte \"supplier\" ne peut jamais atteindre une procédure réservée à la direction", refuseAccesDirection);

    // ── 9. Activation puis révocation réelles ──
    await activateAccess(userA.id);
    const apresActivation = await resolveAccess(userA.id);
    verif("activateAccess fait réellement passer le statut à \"active\"", apresActivation?.status === "active");

    await revokeAccess(userA.id, PDG_TEST);
    const apresRevocation = await resolveAccess(userA.id);
    verif("revokeAccess fait réellement passer le statut à \"revoked\"", apresRevocation?.status === "revoked");
    const [userAApresRevocation] = await db.select({ role: users.role }).from(users).where(eq(users.id, userA.id));
    verif("revokeAccess fait retomber le compte au rôle \"user\" — jamais un accès fournisseur orphelin", userAApresRevocation.role === "user");
  } finally {
    await nettoyer(userIds, partnerIds, supplierIds);
  }

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
