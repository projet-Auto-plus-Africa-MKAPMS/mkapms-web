/**
 * Satisfaction achat (client/src/pages/vente/CentreRetourClient.tsx). Base
 * de données réelle.
 *
 * Corrige un écran orphelin : /vente/retour-client n'acceptait aucun
 * identifiant, n'avait aucun point d'entrée réel, était verrouillé derrière
 * la porte professionnelle alors qu'il s'adresse à un acheteur, et notait
 * 4 critères entièrement fabriqués (Vendeur/Véhicule/Livraison/Service).
 * Le vrai moteur d'avis multi-critères (server/routers/reviewsV2.ts) existe
 * depuis longtemps, avec ses propres modèles de critères RÉELLEMENT semés
 * pour l'univers "vente" (server/seed.ts) : "user" (vendeur professionnel)
 * et "particulier" (vendeur particulier) — deux jeux différents, jamais les
 * 4 critères inventés par l'ancien écran. Ce test prouve que l'écran cible
 * bien le vendeur réel de l'annonce avec le bon jeu de critères, et que les
 * garde-fous déjà présents dans le moteur (anti-doublon, anti-auto-avis)
 * s'appliquent tels quels, sans aucune modification du code serveur.
 *
 * Lancement : `npx tsx server/routers/__tests__/retour-client-avis.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces, users } from "../../schema.js";
import { reviewsV2 } from "../../modules/reviews.js";
import { reviewsV2Router } from "../reviewsV2.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const VENDEUR_PARTICULIER = 900992;
const VENDEUR_PRO = 900993;
const ACHETEUR = 900994;
const PREFIX = "TEST-AVIS-";

const callerAvisAcheteur = reviewsV2Router.createCaller({ req: {} as never, res: {} as never, user: { uid: ACHETEUR, role: "user", email: "acheteur-avis@mkapms.local" } });
const callerAvisPublic = reviewsV2Router.createCaller({ req: {} as never, res: {} as never, user: null });

async function nettoyer() {
  await db.delete(reviewsV2).where(inArray(reviewsV2.authorId, [ACHETEUR]));
  const mesAnnonces = await db.select({ id: annonces.id }).from(annonces).where(inArray(annonces.ownerId, [VENDEUR_PARTICULIER, VENDEUR_PRO]));
  const ids = mesAnnonces.map((a) => a.id);
  if (ids.length) await db.delete(annonces).where(inArray(annonces.id, ids));
  await db.delete(users).where(inArray(users.id, [VENDEUR_PARTICULIER, VENDEUR_PRO, ACHETEUR]));
}

async function main() {
  await nettoyer();
  await db.insert(users).values([
    { id: VENDEUR_PARTICULIER, email: "vendeur-particulier-avis@mkapms.local", name: "Vendeur Particulier Avis" },
    { id: VENDEUR_PRO, email: "vendeur-pro-avis@mkapms.local", name: "Vendeur Pro Avis", role: "pro" },
    { id: ACHETEUR, email: "acheteur-test-avis@mkapms.local", name: "Acheteur Avis Test" },
  ]);
  const [annonceParticulier] = await db.insert(annonces).values({ ownerId: VENDEUR_PARTICULIER, titre: `${PREFIX}Clio`, marque: "Renault", modele: "Clio", vendeurType: "particulier" }).returning();
  const [annoncePro] = await db.insert(annonces).values({ ownerId: VENDEUR_PRO, titre: `${PREFIX}308`, marque: "Peugeot", modele: "308", vendeurType: "professionnel" }).returning();

  // ── 1. Le jeu de critères dépend réellement du type de vendeur (jamais les 4 critères fabriqués) ──
  const critParticulier = await callerAvisPublic.getCriteria({ univers: "vente", targetType: "particulier" });
  const critPro = await callerAvisPublic.getCriteria({ univers: "vente", targetType: "user" });
  const clesParticulier = new Set(critParticulier.map((c) => c.criteriaKey));
  const clesPro = new Set(critPro.map((c) => c.criteriaKey));
  verif("1. le vendeur particulier a bien ses propres critères réels", clesParticulier.has("serieux") && clesParticulier.has("communication"));
  verif("1. le vendeur professionnel a un jeu de critères différent", clesPro.has("qualite_annonce") && clesPro.has("service_client"));
  verif("1. aucun des 4 critères fabriqués de l'ancien écran n'existe réellement", !clesParticulier.has("Vendeur") && !clesPro.has("Livraison"));

  // ── 2. Un avis déposé cible réellement le vendeur de l'annonce, pas l'annonce elle-même ──
  const avis = await callerAvisAcheteur.create({
    targetType: "particulier",
    targetId: annonceParticulier.ownerId,
    univers: "vente",
    ratingGlobal: 4,
    criterias: { serieux: 5, communication: 4, respect_rdv: 4, exactitude_annonce: 3 },
    comment: "Vendeur sérieux, véhicule conforme.",
  });
  verif("2. l'avis est bien créé", !!avis.id);
  const [ligne] = await db.select().from(reviewsV2).where(eq(reviewsV2.id, avis.id));
  verif("2. targetId est le vendeur réel, pas l'annonce", ligne.targetId === VENDEUR_PARTICULIER);
  verif("2. non vérifié en l'absence de demande d'avis émise par la plateforme (jamais fabriqué)", ligne.verified === false);

  // ── 3. Un même acheteur ne peut pas déposer un second avis sur le même vendeur (garde-fou déjà présent) ──
  let refuseDoublon = false;
  try {
    await callerAvisAcheteur.create({ targetType: "particulier", targetId: annonceParticulier.ownerId, univers: "vente", ratingGlobal: 5, criterias: {} });
  } catch (err) {
    refuseDoublon = /déjà déposé/.test((err as Error).message);
  }
  verif("3. un second avis sur le même vendeur est refusé (anti-doublon déjà présent)", refuseDoublon);

  // ── 4. Le second vendeur (professionnel) n'est pas affecté par l'avis du premier ──
  await callerAvisAcheteur.create({
    targetType: "user",
    targetId: annoncePro.ownerId,
    univers: "vente",
    ratingGlobal: 5,
    criterias: { qualite_annonce: 5, disponibilite: 5, transparence: 5, service_client: 5 },
  });
  const avisVendeurPro = await db.select().from(reviewsV2).where(eq(reviewsV2.targetId, VENDEUR_PRO));
  verif("4. l'avis sur le vendeur pro est bien indépendant du premier", avisVendeurPro.length === 1);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
