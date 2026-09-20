/**
 * Idempotence de la confirmation de paiement (demande explicite : Stripe
 * redélivre parfois le même événement checkout.session.completed — retry
 * réseau, rejeu manuel depuis le dashboard). Sans garde, une redélivrance
 * ajouterait une étape en double dans l'historique du dossier carte grise,
 * ou renotifierait le client sur une caution déjà payée. Ce test appelle
 * directement les fonctions de confirmation exportées par
 * server/stripeWebhook.ts (jamais une signature Stripe simulée — aucun test
 * de ce dépôt ne le fait, convention déjà en place) et prouve qu'un second
 * appel identique n'a plus aucun effet observable. Base de données réelle.
 *
 * Lancement : `npx tsx server/routers/__tests__/webhook-idempotence.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, rentalApplications } from "../../schema.js";
import { cgDossiers, cgEtapes } from "../../modules/cartegrise.js";
import { confirmerPaiementCarteGrise, confirmerCautionLocation } from "../../stripeWebhook.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CLIENT = 900993;
const PREFIX = "TEST-WEBHOOKIDEMP-";

async function nettoyer() {
  const dossiers = await db.select({ id: cgDossiers.id }).from(cgDossiers).where(eq(cgDossiers.clientId, CLIENT));
  const ids = dossiers.map((d) => d.id);
  if (ids.length) {
    await db.delete(cgEtapes).where(inArray(cgEtapes.dossierId, ids));
    await db.delete(cgDossiers).where(inArray(cgDossiers.id, ids));
  }
  await db.delete(rentalApplications).where(eq(rentalApplications.userId, CLIENT));
  await db.delete(users).where(eq(users.id, CLIENT));
}

async function main() {
  await nettoyer();
  await db.insert(users).values({ id: CLIENT, email: "client-test-webhookidemp@mkapms.local", name: "Client WebhookIdemp Test" });

  // ── 1. Carte grise : premier appel confirme réellement, second appel (redélivrance) ne fait plus rien ──
  const [dossier] = await db.insert(cgDossiers).values({ clientId: CLIENT, reference: `${PREFIX}CG1`, type: "autre", status: "accepte", montantTaxe: "0.00", montantPrestation: "19.90" }).returning();
  const premierAppel = await confirmerPaiementCarteGrise(dossier.id, CLIENT);
  verif("1. le premier appel confirme réellement le paiement (retour true)", premierAppel === true);
  const [apresPremier] = await db.select().from(cgDossiers).where(eq(cgDossiers.id, dossier.id)).limit(1);
  verif("1. le dossier passe bien à en_traitement", apresPremier.status === "en_traitement");
  const etapesApresPremier = await db.select().from(cgEtapes).where(eq(cgEtapes.dossierId, dossier.id));
  verif("1. exactement une étape de paiement est créée", etapesApresPremier.length === 1);

  const secondAppel = await confirmerPaiementCarteGrise(dossier.id, CLIENT);
  verif("2. une redélivrance Stripe du même événement ne confirme plus rien (retour false)", secondAppel === false);
  const etapesApresSecond = await db.select().from(cgEtapes).where(eq(cgEtapes.dossierId, dossier.id));
  verif("2. aucune étape en double n'a été créée par la redélivrance", etapesApresSecond.length === 1);

  // ── 3. Caution location : même garantie ──
  const [candidature] = await db.insert(rentalApplications).values({ token: `${PREFIX}tok1`, userId: CLIENT, applicantType: "individual", status: "approved", depositAmount: "500", depositCurrency: "EUR" }).returning();
  const premierAppelCaution = await confirmerCautionLocation(candidature.id, CLIENT);
  verif("3. le premier appel confirme réellement la caution (retour true)", premierAppelCaution === true);
  const [apresPremierCaution] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, candidature.id)).limit(1);
  verif("3. la candidature passe bien à paid avec depositPaid=true", apresPremierCaution.status === "paid" && apresPremierCaution.depositPaid === true);

  const secondAppelCaution = await confirmerCautionLocation(candidature.id, CLIENT);
  verif("4. une redélivrance Stripe du même événement ne confirme plus rien (retour false)", secondAppelCaution === false);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
