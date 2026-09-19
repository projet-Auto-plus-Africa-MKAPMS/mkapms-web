/**
 * Négociation (client/src/pages/vente/CentreNegociation.tsx). Base de
 * données réelle.
 *
 * Corrige un écran orphelin : /vente/negociation n'acceptait aucun
 * identifiant de véhicule, n'était référencé nulle part (le bouton "Faire
 * une offre au vendeur" de la fiche véhicule redirigeait vers /finance, une
 * page sans rapport), et était verrouillé derrière la porte d'accès
 * professionnelle alors qu'il s'adresse à un acheteur. Aucun nouveau moteur
 * n'a été écrit : une négociation EST une conversation liée à l'annonce, et
 * le moteur de messagerie (server/routers/messages.ts) couvrait déjà
 * exactement ce besoin (utilisé par "Contacter le vendeur"). Ce test
 * confirme que ce moteur, réutilisé tel quel, se comporte comme l'écran
 * l'exige : ouverture idempotente du fil, isolement des tiers, envoi
 * d'une offre comme simple message.
 *
 * Lancement : `npx tsx server/routers/__tests__/negociation-messagerie.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, messageThreads, messages, users } from "../../schema.js";
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
    if (threadIds.length) await db.delete(messages).where(inArray(messages.threadId, threadIds));
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

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
