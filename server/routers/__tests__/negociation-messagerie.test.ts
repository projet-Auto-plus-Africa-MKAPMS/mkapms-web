/**
 * Négociation (client/src/pages/vente/CentreNegociation.tsx + Messagerie.tsx).
 * Base de données réelle.
 *
 * Corrige un écran orphelin : /vente/negociation n'acceptait aucun
 * identifiant de véhicule, n'était référencé nulle part (le bouton "Faire
 * une offre au vendeur" de la fiche véhicule redirigeait vers /finance, une
 * page sans rapport), et était verrouillé derrière la porte d'accès
 * professionnelle alors qu'il s'adresse à un acheteur. Aucun nouveau moteur
 * de conversation n'a été écrit : une négociation EST une conversation liée
 * à l'annonce, et le moteur de messagerie (server/routers/messages.ts)
 * couvrait déjà exactement ce besoin (utilisé par "Contacter le vendeur").
 *
 * Évolution (30/10) : l'offre elle-même est passée d'un texte libre
 * ("💰 Nouvelle offre : X EUR" à interpréter) à un état structuré
 * (messageOffers via proposerOffre/repondreOffre), pour qu'Accepter/
 * Refuser/Contre-offrir soient de vraies actions avec un vrai statut — pas
 * une réponse texte qu'il faut relire pour deviner ce qui a été décidé. La
 * conversation reste une conversation : chaque offre est toujours portée
 * par un message normal (offerId), et le chat libre marche toujours
 * exactement comme avant (sections 3-5 ci-dessous, inchangées).
 *
 * Lancement : `npx tsx server/routers/__tests__/negociation-messagerie.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, messageOffers, messageThreads, messages, users } from "../../schema.js";
import { messagesRouter } from "../messages.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR = 900960;
const ACHETEUR = 900961;
const TIERS = 900962;
const PREFIX = "TEST-NEGO-";

const callerAcheteur = messagesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: ACHETEUR, role: "user", email: "acheteur-nego@mkapms.local" } });
const callerVendeur = messagesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: VENDEUR, role: "pro", email: "vendeur-nego@mkapms.local" } });
const callerTiers = messagesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: TIERS, role: "user", email: "tiers-nego@mkapms.local" } });

async function nettoyer() {
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(eq(annonces.ownerId, VENDEUR));
  const ids = mesAnnonces.map((a) => a.id);
  if (ids.length) {
    const threads = await db.select({ id: messageThreads.id }).from(messageThreads).where(inArray(messageThreads.annonceId, ids));
    const threadIds = threads.map((t) => t.id);
    if (threadIds.length) {
      await db.delete(messages).where(inArray(messages.threadId, threadIds));
      await db.delete(messageOffers).where(inArray(messageOffers.threadId, threadIds));
    }
    await db.delete(messageThreads).where(inArray(messageThreads.annonceId, ids));
    await db.delete(annonces).where(inArray(annonces.id, ids));
  }
  await db.delete(users).where(inArray(users.id, [ACHETEUR, TIERS]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: ACHETEUR, email: "acheteur-test-nego@mkapms.local", name: "Acheteur Nego Test" },
    { id: TIERS, email: "tiers-test-nego@mkapms.local", name: "Tiers Nego Test" },
  ]);
  const [annonce] = await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}Audi A4`, marque: "Audi", modele: "A4", negociable: true }).returning();

  // ── 1. Ouvrir le fil lié à l'annonce crée une vraie conversation ──
  const t1 = await callerAcheteur.openThread({ annonceId: annonce.id });
  verif("1. un fil est créé", !!t1.threadId);

  // ── 2. Ré-ouvrir le même fil est idempotent (jamais de doublon) ──
  const t2 = await callerAcheteur.openThread({ annonceId: annonce.id });
  verif("2. le même fil est réutilisé, jamais dupliqué", t2.threadId === t1.threadId);

  // ── 3. Envoyer une offre formatée comme un simple message ──
  await callerAcheteur.send({ threadId: t1.threadId, content: "💰 Nouvelle offre : 22 000 EUR" });
  const fil = await callerAcheteur.getThread({ id: t1.threadId });
  verif("3. l'offre apparaît dans l'historique du fil", fil.messages.some((m) => m.content.includes("22 000 EUR")));
  verif("3. le fil est bien rattaché à la bonne annonce", fil.annonceId === annonce.id);

  // ── 4. Le vendeur voit la même conversation et peut répondre ──
  const filVendeur = await callerVendeur.getThread({ id: t1.threadId });
  verif("4. le vendeur voit l'offre de l'acheteur", filVendeur.messages.some((m) => m.content.includes("22 000 EUR")));
  await callerVendeur.send({ threadId: t1.threadId, content: "Merci, mon prix minimum est 24 000 EUR" });
  const filApresReponse = await callerAcheteur.getThread({ id: t1.threadId });
  verif("4. la contre-offre du vendeur est bien reçue par l'acheteur", filApresReponse.messages.some((m) => m.content.includes("24 000 EUR")));

  // ── 5. Un tiers étranger à la négociation ne peut jamais lire ce fil ──
  let refuse = false;
  try {
    await callerTiers.getThread({ id: t1.threadId });
  } catch (err) {
    refuse = (err as { code?: string }).code === "FORBIDDEN";
  }
  verif("5. un tiers ne peut pas lire un fil qui ne le concerne pas", refuse);

  // ── 6. Offre structurée : proposer, voir le statut, refuser l'offre ──
  const o1 = await callerAcheteur.proposerOffre({ threadId: t1.threadId, montant: 22000 });
  verif("6. une offre structurée est créée", !!o1.offerId);
  const filOffre = await callerVendeur.getThread({ id: t1.threadId });
  const msgOffre = filOffre.messages.find((m) => m.offer?.id === o1.offerId);
  verif("6. le vendeur voit l'offre avec son statut en_attente", msgOffre?.offer?.status === "en_attente");
  verif("6. le montant de l'offre est correct", Number(msgOffre?.offer?.montant) === 22000);

  let doublon = false;
  try {
    await callerAcheteur.proposerOffre({ threadId: t1.threadId, montant: 23000 });
  } catch (err) {
    doublon = (err as { code?: string }).code === "BAD_REQUEST";
  }
  verif("6. impossible de proposer une 2e offre tant que la 1re est en attente", doublon);

  let proprePas = false;
  try {
    await callerAcheteur.repondreOffre({ offerId: o1.offerId, decision: "acceptee" });
  } catch (err) {
    proprePas = (err as { code?: string }).code === "BAD_REQUEST";
  }
  verif("6. l'auteur de l'offre ne peut pas répondre à sa propre offre", proprePas);

  await callerVendeur.repondreOffre({ offerId: o1.offerId, decision: "refusee" });
  const filRefus = await callerAcheteur.getThread({ id: t1.threadId });
  const offreRefusee = filRefus.messages.find((m) => m.offer?.id === o1.offerId);
  verif("6. l'offre refusée passe au statut refusee", offreRefusee?.offer?.status === "refusee");

  // ── 7. Contre-offre : chaîne offre → contre-offre → acceptation ──
  const o2 = await callerAcheteur.proposerOffre({ threadId: t1.threadId, montant: 21000 });
  const contre = await callerVendeur.repondreOffre({ offerId: o2.offerId, decision: "contre_offre", contreMontant: 23500 });
  verif("7. la contre-offre crée une nouvelle offre", contre.status === "contre_offre" && !!contre.offerId);
  const filContre = await callerAcheteur.getThread({ id: t1.threadId });
  const offreInitiale = filContre.messages.find((m) => m.offer?.id === o2.offerId);
  const nouvelleOffre = filContre.messages.find((m) => m.offer?.id === contre.offerId);
  verif("7. l'offre initiale passe au statut contre_offre (remplacée)", offreInitiale?.offer?.status === "contre_offre");
  verif("7. la nouvelle offre (du vendeur) est en_attente, montant correct", nouvelleOffre?.offer?.status === "en_attente" && Number(nouvelleOffre?.offer?.montant) === 23500);

  await callerAcheteur.repondreOffre({ offerId: contre.offerId!, decision: "acceptee" });
  const filAcceptee = await callerVendeur.getThread({ id: t1.threadId });
  const offreFinale = filAcceptee.messages.find((m) => m.offer?.id === contre.offerId);
  verif("7. l'offre finale est acceptée", offreFinale?.offer?.status === "acceptee");

  // ── 8. Une annonce non négociable refuse toute offre structurée ──
  const [annonceFixe] = await db.insert(annonces).values({ ownerId: VENDEUR, titre: `${PREFIX}BMW Série 1`, marque: "BMW", modele: "Série 1", negociable: false }).returning();
  const tFixe = await callerAcheteur.openThread({ annonceId: annonceFixe.id });
  let refusNegociable = false;
  try {
    await callerAcheteur.proposerOffre({ threadId: tFixe.threadId, montant: 15000 });
  } catch (err) {
    refusNegociable = (err as { code?: string }).code === "BAD_REQUEST";
  }
  verif("8. une annonce non négociable refuse une offre structurée", refusNegociable);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
