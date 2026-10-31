/**
 * Campagnes e-mail (server/services/campaign-engine.ts) — demande Fondateur du 31
 * octobre 2026 : relier la base d'abonnés consentants (newsletterSubscribers) et
 * l'envoi transactionnel (server/services/email.ts), jamais en un seul geste.
 *
 * Nécessite une base de données accessible (DATABASE_URL) — non exécuté en
 * environnement sans accès réseau à Postgres. N'affirme rien sur l'état global
 * (d'autres abonnés réels peuvent exister) : insère ses propres abonnés marqués,
 * les nettoie à la fin, jamais de vraie donnée touchée.
 *
 * SMTP_USER/SMTP_PASS sont explicitement vidés avant tout appel : aucun e-mail réel
 * ne peut partir pendant ce test (server/services/email.ts no-op proprement quand
 * ils sont absents — même garantie que la validation manuelle du reste de ce lot).
 *
 * Lancement : npx tsx server/services/__tests__/campaign-engine.test.ts
 */
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";

import assert from "node:assert/strict";
import { eq, like } from "drizzle-orm";
import { db } from "../../db.js";
import { emailCampaigns, newsletterSubscribers } from "../../schema.js";
import { prepareCampaign, createCampaign, confirmSend, sendCampaignBatch, unsubscribeByToken } from "../campaign-engine.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  const marker = `__test_campaign__${Date.now()}`;
  const pays = "ZZ"; // code pays inutilisé en pratique, isole des vrais abonnés sans filtrer sur le marqueur
  const emails = [`${marker}-1@example.invalid`, `${marker}-2@example.invalid`, `${marker}-3@example.invalid`];

  await db.insert(newsletterSubscribers).values(emails.map((email) => ({ email, pays, active: true, source: "test" })));

  // 1. prepareCampaign compte l'audience réelle sans rien envoyer.
  const prepared = await prepareCampaign(pays);
  verif("prepareCampaign compte exactement les 3 abonnés insérés", prepared.recipients === 3);

  // 2. createCampaign enregistre un brouillon avec le bon total — rien n'est encore envoyé.
  const campaign = await createCampaign({ subject: "Test campagne", message: "Bonjour,\n\nCeci est un test.", pays, createdBy: undefined });
  verif("createCampaign fige totalRecipients=3", campaign.totalRecipients === 3);
  verif("createCampaign crée un brouillon (status=draft)", campaign.status === "draft");
  const [afterCreate] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, emails[0]));
  verif("aucun jeton de désabonnement généré avant un envoi réel", afterCreate?.unsubscribeToken == null);

  // 3. Désabonner un des trois avant l'envoi : il ne doit plus compter ni recevoir l'e-mail.
  await db.update(newsletterSubscribers).set({ active: false }).where(eq(newsletterSubscribers.email, emails[2]));
  const preparedAfterUnsub = await prepareCampaign(pays);
  verif("prepareCampaign exclut un abonné désinscrit", preparedAfterUnsub.recipients === 2);

  // 4. confirmSend démarre l'envoi une seule fois (transition atomique draft→sending).
  const firstConfirm = await confirmSend(campaign.id);
  verif("confirmSend démarre l'envoi la première fois", firstConfirm.started === true);
  const secondConfirm = await confirmSend(campaign.id);
  verif("un deuxième confirmSend sur la même campagne ne redémarre rien", secondConfirm.started === false);

  // 5. Exécute l'envoi réel du lot (SMTP non configuré ci-dessus : chaque envoi échoue
  // proprement, jamais une fausse réussite). sendCampaignBatch n'est normalement pas
  // attendu par confirmSend (tâche de fond) ; on l'attend ici pour vérifier son résultat.
  await sendCampaignBatch(campaign.id);
  const [sentCampaign] = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, campaign.id));
  verif("la campagne passe à 'sent' après l'envoi", sentCampaign?.status === "sent");
  verif("totalRecipients reflète les 2 abonnés réellement actifs à l'envoi", sentCampaign?.totalRecipients === 2);
  verif("totalSent est honnête : 0 envoi réussi sans SMTP configuré, jamais fabriqué", sentCampaign?.totalSent === 0);
  verif("totalFailed compte les 2 tentatives réelles, jamais silencieusement absorbées", sentCampaign?.totalFailed === 2);
  verif("l'abonné désinscrit n'a jamais reçu de jeton (jamais inclus dans l'envoi)", (await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, emails[2])))[0]?.unsubscribeToken == null);

  const [activeSubscriber] = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.email, emails[0]));
  verif("un jeton de désabonnement est généré pour chaque destinataire réel", !!activeSubscriber?.unsubscribeToken);

  // 6. Désabonnement par jeton — fonctionne une fois, jamais deux fois sur le même jeton.
  const unsub1 = await unsubscribeByToken(activeSubscriber!.unsubscribeToken!);
  verif("unsubscribeByToken désabonne avec un jeton valide", unsub1 === true);
  const unsub2 = await unsubscribeByToken(activeSubscriber!.unsubscribeToken!);
  verif("un deuxième désabonnement avec le même jeton échoue (déjà inactif)", unsub2 === false);
  const unsub3 = await unsubscribeByToken("jeton-qui-n-existe-pas");
  verif("un jeton inconnu ne désabonne personne", unsub3 === false);

  // Nettoyage : ne retire que les lignes de ce test, jamais de vraie donnée.
  await db.delete(emailCampaigns).where(eq(emailCampaigns.id, campaign.id));
  await db.delete(newsletterSubscribers).where(like(newsletterSubscribers.email, `${marker}%`));
  const leftover = await db.select().from(newsletterSubscribers).where(like(newsletterSubscribers.email, `${marker}%`));
  verif("nettoyage complet : aucune ligne de test ne subsiste", leftover.length === 0);

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
