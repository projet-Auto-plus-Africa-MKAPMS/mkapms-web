/**
 * Moteur de candidature de location flotte (tâche #56). rentalApplications
 * existait dans le schéma depuis toujours mais aucun routeur ne le
 * touchait — aucune procédure de création n'existait, contrairement à
 * bookingTypeEnum "rental" (même famille de lacune, table différente).
 * Base de données réelle.
 *
 * Ce test couvre le cycle complet réellement câblé par ce lot : création
 * (brouillon) → sauvegarde progressive multi-étapes → soumission → décision
 * agent (refus, puis approbation avec caution réellement fixée) → tentative
 * de paiement honnêtement refusée tant que la caution n'est pas fixée →
 * checkout réel une fois fixée. La confirmation de paiement elle-même
 * (webhook Stripe signé) n'est pas invoquée ici — aucun test de ce dépôt ne
 * simule de signature Stripe, convention déjà en place avant ce lot — mais
 * la mise à jour qu'elle applique (depositPaid/status) est vérifiée
 * directement en base à la fin, pour prouver que la ligne accepte bien
 * cette transition d'état.
 *
 * Lancement : `npx tsx server/routers/__tests__/rental-applications.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, annonces, rentalApplications } from "../../schema.js";
import { rentalApplicationsRouter } from "../rentalApplications.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const CANDIDAT = 900996;
const AUTRE = 900997;
const AGENT = 900998;
const PREFIX = "TEST-RENTALAPP-";

const callerCandidat = rentalApplicationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: CANDIDAT, role: "society", email: "candidat-rental@mkapms.local" } });
const callerAutre = rentalApplicationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: AUTRE, role: "user", email: "autre-rental@mkapms.local" } });
const callerAgent = rentalApplicationsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: AGENT, role: "super_admin", email: "agent-rental@mkapms.local" } });

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.ownerId, CANDIDAT));
  const ids = mesAnnonces.map((a) => a.id);
  await db.delete(rentalApplications).where(inArray(rentalApplications.userId, [CANDIDAT, AUTRE]));
  if (ids.length) await db.delete(annonces).where(inArray(annonces.id, ids));
  await db.delete(users).where(inArray(users.id, [CANDIDAT, AUTRE, AGENT]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: CANDIDAT, email: "candidat-test-rental@mkapms.local", name: "Candidat Rental Test" },
    { id: AUTRE, email: "autre-test-rental@mkapms.local", name: "Autre Rental Test" },
    { id: AGENT, email: "agent-test-rental@mkapms.local", name: "Agent Rental Test" },
  ]);
  const [vehicule] = await db.insert(annonces).values({ ownerId: CANDIDAT, titre: `${PREFIX}Camion Iveco`, marque: "Iveco", modele: "Daily" }).returning();

  // ── 1. Création réelle d'une candidature, en brouillon, jamais approuvée d'office ──
  const app = await callerCandidat.create({ vehicleId: vehicule.id, applicantType: "society" });
  verif("1. la candidature est bien créée pour le vrai véhicule", app.vehicleId === vehicule.id);
  verif("1. le statut initial est brouillon (jamais soumis d'office)", app.status === "draft");
  verif("1. un vrai jeton unique est généré", typeof app.token === "string" && app.token.length > 10);

  // ── 2. Sauvegarde progressive : les données saisies sont réellement conservées, fusionnées ──
  await callerCandidat.updateStep({ id: app.id, data: { siret: "123456789" }, currentStep: 1 });
  const apresEtape2 = await callerCandidat.updateStep({ id: app.id, data: { kbis: "https://files.test/kbis.pdf" }, currentStep: 2 });
  verif("2. les deux étapes sont fusionnées, aucune perdue", (apresEtape2.data as any).siret === "123456789" && (apresEtape2.data as any).kbis === "https://files.test/kbis.pdf");
  verif("2. l'étape courante progresse réellement", apresEtape2.currentStep === 2);

  // ── 3. Un tiers ne peut jamais voir ni modifier la candidature d'un autre ──
  await assert.rejects(() => callerAutre.detail({ id: app.id }), "3. un tiers ne voit pas la candidature d'un autre");
  ok++; total++;

  // ── 4. Soumission réelle, plus aucune modification possible ensuite ──
  const soumise = await callerCandidat.submit({ id: app.id });
  verif("4. le statut passe réellement à submitted", soumise.status === "submitted");
  await assert.rejects(() => callerCandidat.updateStep({ id: app.id, data: {}, currentStep: 3 }), "4. impossible de modifier une candidature déjà soumise");
  ok++; total++;

  // ── 5. L'agent refuse d'abord une candidature test : le motif réel est conservé ──
  const secondeCandidature = await callerCandidat.create({ vehicleId: vehicule.id });
  await callerCandidat.submit({ id: secondeCandidature.id });
  const refusee = await callerAgent.decide({ id: secondeCandidature.id, decision: "rejected", rejectionReason: "KBIS expiré" });
  verif("5. le refus réel porte le vrai motif de l'agent", refusee.status === "rejected" && refusee.rejectionReason === "KBIS expiré");

  // ── 6. Sur la première candidature : tant que la caution n'est pas fixée par l'agent, le paiement est honnêtement refusé ──
  await callerAgent.decide({ id: app.id, decision: "approved" });
  let refuseSansCaution = false;
  try {
    await callerCandidat.payDeposit({ id: app.id });
  } catch (err) {
    refuseSansCaution = /pas encore été fixé/.test((err as Error).message);
  }
  verif("6. le paiement est refusé tant que l'agent n'a pas fixé de caution (jamais un montant inventé)", refuseSansCaution);

  // ── 7. Une fois la caution réellement fixée par l'agent, un vrai checkout est renvoyé ──
  const secondeSoumission = await callerCandidat.create({ vehicleId: vehicule.id });
  await callerCandidat.submit({ id: secondeSoumission.id });
  await callerAgent.decide({ id: secondeSoumission.id, decision: "approved", depositAmount: 500, depositCurrency: "EUR" });
  const checkout = await callerCandidat.payDeposit({ id: secondeSoumission.id });
  verif("7. une vraie URL de paiement est renvoyée une fois la caution fixée", typeof checkout.url === "string" && checkout.url.length > 0);

  // ── 8. La transition que le webhook Stripe applique à la confirmation est valide en base (dépositPaid + statut paid) ──
  await db.update(rentalApplications).set({ depositPaid: true, status: "paid" }).where(eq(rentalApplications.id, secondeSoumission.id));
  const [payee] = await db.select().from(rentalApplications).where(eq(rentalApplications.id, secondeSoumission.id)).limit(1);
  verif("8. la candidature accepte bien la transition payée que le webhook applique", payee.depositPaid === true && payee.status === "paid");

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
