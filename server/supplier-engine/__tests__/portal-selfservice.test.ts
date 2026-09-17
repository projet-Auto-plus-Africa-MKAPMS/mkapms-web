/**
 * LOT 7 (suite) — Parcours réel du portail Fournisseur au-delà de la lecture
 * seule (monDetail, configurerMaConnexion, testerMaConnexion,
 * ajouterMonContact, definirMonMapping). Base de données réelle.
 *
 * Couvre ce qui compte le plus ici : un fournisseur ne peut jamais agir sur
 * la fiche d'un autre (même en fournissant un connectionId qui ne lui
 * appartient pas), et un transporteur n'a jamais accès à ces procédures
 * réservées aux fournisseurs. Réutilise le vrai moteur (supplier-engine/
 * service.ts), jamais une réimplémentation.
 *
 * Lancement : `npx tsx server/supplier-engine/__tests__/portal-selfservice.test.ts`
 */
import assert from "node:assert/strict";
import { inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { supplierProfiles, supplierCarrierAccounts, supplierConnections, supplierContacts, supplierMappings } from "../schema.js";
import { partners } from "../../modules/operations.js";
import { grantSupplierAccess, grantCarrierAccess } from "../access.js";
import { supplierPortalRouter } from "../../routers/supplier-portal.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const PDG_TEST = 900801;
const EMAIL_PREFIX = "test-supplier-selfservice-";

async function nettoyer(userIds: number[], partnerIds: number[], supplierIds: number[]) {
  if (supplierIds.length) {
    await db.delete(supplierConnections).where(inArray(supplierConnections.supplierProfileId, supplierIds));
    await db.delete(supplierContacts).where(inArray(supplierContacts.supplierProfileId, supplierIds));
    await db.delete(supplierMappings).where(inArray(supplierMappings.supplierProfileId, supplierIds));
  }
  await db.delete(supplierCarrierAccounts).where(inArray(supplierCarrierAccounts.userId, userIds));
  if (supplierIds.length) await db.delete(supplierProfiles).where(inArray(supplierProfiles.id, supplierIds));
  if (partnerIds.length) await db.delete(partners).where(inArray(partners.id, partnerIds));
  await db.delete(users).where(inArray(users.id, userIds));
}

async function main() {
  const [userA] = await db.insert(users).values({ email: `${EMAIL_PREFIX}a@mkapms.local`, name: "Fournisseur A (test)" }).returning();
  const [userB] = await db.insert(users).values({ email: `${EMAIL_PREFIX}b@mkapms.local`, name: "Fournisseur B (test)" }).returning();
  const [userTransporteur] = await db.insert(users).values({ email: `${EMAIL_PREFIX}t@mkapms.local`, name: "Transporteur (test)" }).returning();

  const [partnerFournisseur] = await db.insert(partners).values({ name: "Fournisseur Test SelfService", type: "fournisseur_pieces", country: "FR" }).returning();
  const [partnerTransporteur] = await db.insert(partners).values({ name: "Transporteur Test SelfService", type: "transporteur", country: "FR" }).returning();

  const [profilA] = await db.insert(supplierProfiles).values({ reference: "TEST-SUP-SS-A", partnerId: partnerFournisseur.id, supplierType: "pieces", companyLegalName: "Fournisseur SelfService A SARL", countryCode: "FR" }).returning();
  const [profilB] = await db.insert(supplierProfiles).values({ reference: "TEST-SUP-SS-B", partnerId: partnerFournisseur.id, supplierType: "pieces", companyLegalName: "Fournisseur SelfService B SARL", countryCode: "FR" }).returning();

  const userIds = [userA.id, userB.id, userTransporteur.id];
  const partnerIds = [partnerFournisseur.id, partnerTransporteur.id];
  const supplierIds = [profilA.id, profilB.id];

  try {
    await grantSupplierAccess({ userId: userA.id, supplierProfileId: profilA.id, grantedBy: PDG_TEST });
    await grantSupplierAccess({ userId: userB.id, supplierProfileId: profilB.id, grantedBy: PDG_TEST });
    await grantCarrierAccess({ userId: userTransporteur.id, partnerId: partnerTransporteur.id, grantedBy: PDG_TEST });

    const callerA = supplierPortalRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: userA.id, role: "supplier", email: userA.email } });
    const callerB = supplierPortalRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: userB.id, role: "supplier", email: userB.email } });
    const callerTransporteur = supplierPortalRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: userTransporteur.id, role: "carrier", email: userTransporteur.email } });

    // ── 1. monDetail() réel, scopé à sa propre fiche ──
    const detailA = await callerA.monDetail();
    verif("monDetail() renvoie le profil réel de l'appelant", detailA.profil.id === profilA.id);
    verif("monDetail() commence sans contact ni connexion (jamais un exemple fabriqué)", detailA.contacts.length === 0 && detailA.connexions.length === 0);

    // ── 2. Un transporteur n'a jamais accès aux procédures fournisseur ──
    let refuseTransporteur = false;
    try {
      await callerTransporteur.monDetail();
    } catch (e) {
      refuseTransporteur = e instanceof Error && /FORBIDDEN|aucun accès fournisseur/i.test(e.message);
    }
    verif("monDetail() refuse un compte transporteur", refuseTransporteur);

    // ── 3. Le fournisseur configure lui-même sa connexion (saisie manuelle, sans secret) ──
    const connexion = await callerA.configurerMaConnexion({ method: "manuel" });
    verif("configurerMaConnexion crée réellement la connexion, statut configured", connexion.status === "configured");
    verif("configurerMaConnexion rattache la connexion à SA fiche, jamais une autre", connexion.supplierProfileId === profilA.id);

    // ── 4. Le fournisseur teste lui-même sa connexion — jamais un succès fabriqué ──
    const testOk = await callerA.testerMaConnexion({ connectionId: connexion.id });
    verif("testerMaConnexion (saisie manuelle) réussit réellement, sans dépendance externe", testOk.ok === true);

    // ── 5. Isolation stricte : B ne peut jamais tester la connexion de A ──
    let refuseConnexionAutrui = false;
    try {
      await callerB.testerMaConnexion({ connectionId: connexion.id });
    } catch (e) {
      refuseConnexionAutrui = e instanceof Error && /introuvable/i.test(e.message);
    }
    verif("testerMaConnexion refuse une connexion qui appartient à un autre fournisseur", refuseConnexionAutrui);

    // ── 6. Ajout d'un contact réel ──
    const contact = await callerA.ajouterMonContact({ kind: "commercial", name: "Test Contact", email: "contact-test@mkapms.local" });
    verif("ajouterMonContact enregistre réellement le contact sur sa propre fiche", contact.supplierProfileId === profilA.id);
    const detailApresContact = await callerA.monDetail();
    verif("le contact ajouté apparaît dans monDetail()", detailApresContact.contacts.some((c) => c.id === contact.id));
    verif("le contact du fournisseur A n'apparaît jamais chez B", (await callerB.monDetail()).contacts.every((c) => c.id !== contact.id));

    // ── 7. Mapping : champ canonique valide accepté, invalide refusé (validation réelle du moteur) ──
    const mapping = await callerA.definirMonMapping({
      entityType: "piece",
      regles: [{ canonicalField: "referenceFournisseur", supplierField: "ref_sup" }],
    });
    verif("definirMonMapping enregistre réellement le mapping", mapping.regles === 1);

    let refuseChampInvalide = false;
    try {
      await callerA.definirMonMapping({ entityType: "piece", regles: [{ canonicalField: "champ_qui_nexiste_pas", supplierField: "x" }] });
    } catch (e) {
      refuseChampInvalide = e instanceof Error && /inconnu/i.test(e.message);
    }
    verif("definirMonMapping refuse un champ canonique inconnu (validation du moteur, jamais contournée)", refuseChampInvalide);
  } finally {
    await nettoyer(userIds, partnerIds, supplierIds);
  }

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
