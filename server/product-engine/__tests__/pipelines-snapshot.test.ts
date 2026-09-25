/**
 * CentreProduitsGoogle.tsx affichait "Véhicules : 0 annonce(s) publiée(s)"
 * en permanence, quel que soit le nombre réel d'annonces publiées : la
 * requête interrogeait la colonne "statut" — inexistante, la vraie colonne
 * s'appelle "status" — et l'erreur SQL était silencieusement absorbée par
 * un bloc catch, donc le compteur retombait toujours à 0 sans jamais
 * signaler d'erreur. Signalé par le PDG (capture d'écran) : "là où il y a
 * 0 0, je veux que ce soit vraiment rempli".
 *
 * Ce test prouve que pipelinesSnapshot() compte désormais les vraies
 * annonces publiées, et que le tuyau produit (parts_catalog → syncProduit
 * → productFeedItems) reste correctement câblé de bout en bout. Base de
 * données réelle.
 *
 * Lancement : `npx tsx server/product-engine/__tests__/pipelines-snapshot.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, annonces, partsShops, partsCatalog } from "../../schema.js";
import { productFeedItems, productFeedRuns, productSyncEvents } from "../schema.js";
import { pipelinesSnapshot, refreshFeed } from "../service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const OWNER = 900920;
const PREFIX = "TEST-PRODUCTENGINE-";

async function nettoyer() {
  await db.delete(productSyncEvents).where(eq(productSyncEvents.source, "parts_catalog"));
  const shops = await db.select({ id: partsShops.id }).from(partsShops).where(eq(partsShops.ownerId, OWNER));
  if (shops.length) {
    const catalog = await db.select({ id: partsCatalog.id }).from(partsCatalog).where(inArray(partsCatalog.shopId, shops.map((s) => s.id)));
    if (catalog.length) await db.delete(productFeedItems).where(inArray(productFeedItems.sourceId, catalog.map((c) => c.id)));
    await db.delete(partsCatalog).where(inArray(partsCatalog.shopId, shops.map((s) => s.id)));
  }
  await db.delete(partsShops).where(eq(partsShops.ownerId, OWNER));
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Annonce`]));
  await db.delete(users).where(eq(users.id, OWNER));
}

async function main() {
  await nettoyer();

  const avant = await pipelinesSnapshot();

  await db.insert(users).values({ id: OWNER, email: `${PREFIX.toLowerCase()}owner@mkapms.local`, name: "Owner Test" });
  await db.insert(annonces).values({ ownerId: OWNER, titre: `${PREFIX}Annonce`, marque: "Renault", modele: "Clio", type: "vente", status: "publiee" });

  const apres = await pipelinesSnapshot();
  verif("1. le compteur véhicules compte la vraie annonce publiée insérée (avant : requête cassée, toujours 0)", apres.vehicule.fiches === avant.vehicule.fiches + 1);
  verif("2. le tuyau véhicule documente bien pourquoi il reste exclu de Merchant Center", typeof apres.vehicule.exclusion === "string" && apres.vehicule.exclusion.length > 0);

  // Annonce non publiée : ne doit jamais être comptée
  await db.insert(annonces).values({ ownerId: OWNER, titre: `${PREFIX}Annonce`, marque: "Renault", modele: "Clio", type: "vente", status: "brouillon" });
  const apresBrouillon = await pipelinesSnapshot();
  verif("3. une annonce en brouillon n'est jamais comptée comme publiée", apresBrouillon.vehicule.fiches === apres.vehicule.fiches);
  await db.delete(annonces).where(inArray(annonces.titre, [`${PREFIX}Annonce`]));
  await db.insert(annonces).values({ ownerId: OWNER, titre: `${PREFIX}Annonce`, marque: "Renault", modele: "Clio", type: "vente", status: "publiee" });

  // Tuyau produit : une vraie pièce active avec stock doit être exploitable après une relecture réelle
  const [shop] = await db.insert(partsShops).values({ ownerId: OWNER, nom: `${PREFIX}Boutique` }).returning();
  await db.insert(partsCatalog).values({
    shopId: shop.id,
    nom: `${PREFIX}Plaquette de frein`,
    description: "Plaquette de frein avant, compatible Clio IV.",
    referenceInterne: `${PREFIX}REF-001`,
    prixHt: "24.90",
    prixTtc: "29.88",
    currency: "EUR",
    active: true,
  });

  const rapport = await refreshFeed({ trigger: "test", limit: 50 });
  verif("4. refreshFeed examine au moins la vraie pièce insérée", rapport.examines >= 1);

  const fiche = rapport.items.find((i) => i.source === "parts_catalog");
  verif("5. la vraie pièce insérée apparaît dans le flux produit avec son vrai nom", fiche?.titre === `${PREFIX}Plaquette de frein`);

  const snapshotFinal = await pipelinesSnapshot();
  verif("6. pipelinesSnapshot reflète bien la fiche produit réellement synchronisée", snapshotFinal.produit.fiches >= 1);

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
