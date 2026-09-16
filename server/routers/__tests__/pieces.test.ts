/**
 * Pièces — Architecture 3 : dimension type de véhicule (server/schema.ts::
 * partsVehicleTypeEnum, partsCatalog.typeVehicule) + état de compatibilité
 * explicite sur la fiche produit (shared/partsCategories.ts::
 * evaluerCompatibilite) + correctif du filtre catalog sur année (une
 * compatibilité sans borne d'année déclarée ne doit plus être exclue à
 * tort) + garde-fou anti-survente sur createOrder. Base de données réelle.
 *
 * Couvre : valeur par défaut "voiture" à la création (compatibilité
 * ascendante avec tout le catalogue existant), filtrage du catalogue par
 * type de véhicule (server/routers/pieces.ts::catalog), mise à jour du
 * type sur une pièce existante, alignement de la liste partagée
 * PARTS_VEHICLE_TYPES (shared/partsCategories.ts) avec l'enum serveur,
 * logique pure d'évaluation de compatibilité, et non-régression du filtre
 * catalog sur les compatibilités sans année déclarée.
 *
 * Lancement : `npx tsx server/routers/__tests__/pieces.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { partsShops, partsCatalog, partsCompatibility, partsOrders, partsOrderItems, partsOrderTracking, serviceTracking } from "../../schema.js";
import { piecesRouter } from "../pieces.js";
import { PARTS_VEHICLE_TYPES, evaluerCompatibilite } from "../../../shared/partsCategories.js";
import { recordTestEvidence } from "../../activation-audit/service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const OWNER_ID = 900101;
const BUYER_ID = 900102;
const REF_PREFIX = "TEST-TYPEVEHICULE-";

const caller = piecesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: OWNER_ID, role: "pro", email: "pro-test-pieces@mkapms.local" } });
const publicCaller = piecesRouter.createCaller({ req: {} as never, res: {} as never, user: null });
const buyerCaller = piecesRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: BUYER_ID, role: "user", email: "acheteur-test-pieces@mkapms.local" } });

async function nettoyer() {
  const shops = await db.select({ id: partsShops.id }).from(partsShops).where(eq(partsShops.ownerId, OWNER_ID));
  const shopIds = shops.map((s) => s.id);
  const orders = shopIds.length > 0 ? await db.select({ id: partsOrders.id }).from(partsOrders).where(inArray(partsOrders.shopId, shopIds)) : [];
  const orderIds = orders.map((o) => o.id);
  if (orderIds.length > 0) {
    await db.delete(partsOrderItems).where(inArray(partsOrderItems.orderId, orderIds));
    await db.delete(partsOrderTracking).where(inArray(partsOrderTracking.orderId, orderIds));
  }
  await db.delete(serviceTracking).where(eq(serviceTracking.userId, BUYER_ID));
  if (shopIds.length > 0) {
    await db.delete(partsOrders).where(inArray(partsOrders.shopId, shopIds));
    await db.delete(partsCatalog).where(inArray(partsCatalog.shopId, shopIds));
  }
  await db.delete(partsShops).where(eq(partsShops.ownerId, OWNER_ID));
}

async function main() {
  await nettoyer();

  // ── 0. La liste partagée frontend/backend couvre exactement l'enum serveur ──
  const codesPartages = PARTS_VEHICLE_TYPES.map((v) => v.code).sort();
  const codesEnum = ["voiture", "utilitaire", "moto", "agricole", "engin_chantier", "bateau"].sort();
  verif("PARTS_VEHICLE_TYPES couvre exactement les valeurs de partsVehicleTypeEnum", JSON.stringify(codesPartages) === JSON.stringify(codesEnum));

  const [shop] = await db.insert(partsShops).values({
    ownerId: OWNER_ID,
    nom: "Garage Test Architecture 3",
    type: "magasin_pieces",
  }).returning();

  // ── 1. Valeur par défaut "voiture" quand le type n'est pas précisé ──
  const piece1 = await caller.addPart({
    shopId: shop.id,
    nom: "Plaquette de frein test",
    referenceInterne: `${REF_PREFIX}1`,
    prixHt: 25,
  });
  verif("addPart sans typeVehicule retombe sur \"voiture\" (compat. ascendante)", piece1.typeVehicule === "voiture");

  // ── 2. Une pièce déclarée pour un autre type de véhicule est bien enregistrée ──
  const piece2 = await caller.addPart({
    shopId: shop.id,
    nom: "Chaîne de transmission moto test",
    referenceInterne: `${REF_PREFIX}2`,
    typeVehicule: "moto",
    prixHt: 40,
  });
  verif("addPart avec typeVehicule=\"moto\" est respecté", piece2.typeVehicule === "moto");

  const piece3 = await caller.addPart({
    shopId: shop.id,
    nom: "Filtre hydraulique tracteur test",
    referenceInterne: `${REF_PREFIX}3`,
    typeVehicule: "agricole",
    prixHt: 60,
  });

  // ── 3. Le catalogue filtre réellement par type de véhicule ──
  const catalogueMoto = await publicCaller.catalog({ shopId: shop.id, typeVehicule: "moto" });
  verif("catalog(typeVehicule=moto) ne retourne que la pièce moto", catalogueMoto.items.length === 1 && catalogueMoto.items[0].id === piece2.id);

  const catalogueVoiture = await publicCaller.catalog({ shopId: shop.id, typeVehicule: "voiture" });
  verif("catalog(typeVehicule=voiture) ne retourne que la pièce voiture", catalogueVoiture.items.length === 1 && catalogueVoiture.items[0].id === piece1.id);

  const catalogueTous = await publicCaller.catalog({ shopId: shop.id });
  verif("catalog() sans filtre retourne les 3 pièces, tous types confondus", catalogueTous.items.length === 3);

  const catalogueAgricole = await publicCaller.catalog({ shopId: shop.id, typeVehicule: "agricole" });
  verif("catalog(typeVehicule=agricole) isole bien la pièce agricole", catalogueAgricole.items.length === 1 && catalogueAgricole.items[0].id === piece3.id);

  // ── 4. updatePart permet de corriger le type d'une pièce déjà déclarée ──
  await caller.updatePart({ id: piece1.id, typeVehicule: "utilitaire" });
  const [relu] = await db.select().from(partsCatalog).where(eq(partsCatalog.id, piece1.id));
  verif("updatePart change réellement typeVehicule en base", relu.typeVehicule === "utilitaire");

  // ── 5. evaluerCompatibilite (logique pure, fiche produit) ──
  const compatDeclarees = [{ marque: "Renault", modele: "Clio", moteur: "1.5 dCi", anneeDebut: 2015, anneeFin: 2020 }];
  verif("evaluerCompatibilite : aucune recherche → \"non_recherchee\"", evaluerCompatibilite(compatDeclarees, {}) === "non_recherchee");
  verif("evaluerCompatibilite : aucune compatibilité déclarée → \"non_renseignee\"", evaluerCompatibilite([], { marque: "Renault" }) === "non_renseignee");
  verif("evaluerCompatibilite : marque/modèle/année dans la plage → \"compatible\"", evaluerCompatibilite(compatDeclarees, { marque: "renault", modele: "clio", annee: 2018 }) === "compatible");
  verif("evaluerCompatibilite : année hors plage → \"non_compatible\"", evaluerCompatibilite(compatDeclarees, { marque: "Renault", annee: 2023 }) === "non_compatible");
  verif("evaluerCompatibilite : marque différente → \"non_compatible\"", evaluerCompatibilite(compatDeclarees, { marque: "Peugeot" }) === "non_compatible");
  const compatSansAnnee = [{ marque: "Toyota", modele: null, moteur: null, anneeDebut: null, anneeFin: null }];
  verif("evaluerCompatibilite : compatibilité sans année déclarée n'exclut jamais → \"compatible\"", evaluerCompatibilite(compatSansAnnee, { marque: "Toyota", annee: 1999 }) === "compatible");

  // ── 6. Non-régression : le filtre catalog n'exclut plus une compatibilité sans année déclarée ──
  const piece4 = await caller.addPart({
    shopId: shop.id,
    nom: "Amortisseur universel test",
    referenceInterne: `${REF_PREFIX}4`,
    prixHt: 80,
  });
  await db.insert(partsCompatibility).values({ catalogId: piece4.id, marque: "Toyota" }); // anneeDebut/anneeFin volontairement absents
  const catalogueAnneeSeule = await publicCaller.catalog({ shopId: shop.id, marqueVehicule: "Toyota", anneeVehicule: 1999 });
  verif("catalog(anneeVehicule) n'exclut pas une compatibilité sans borne d'année déclarée", catalogueAnneeSeule.items.some((p) => p.id === piece4.id));

  // ── 7. createOrder refuse une quantité supérieure au stock réellement disponible ──
  const piece5 = await caller.addPart({
    shopId: shop.id,
    nom: "Filtre à huile test stock",
    referenceInterne: `${REF_PREFIX}5`,
    prixHt: 15,
    quantiteInitiale: 3,
  });
  let stockRefuse = false;
  try {
    await buyerCaller.createOrder({ shopId: shop.id, items: [{ catalogId: piece5.id, quantite: 4 }] });
  } catch (e) {
    stockRefuse = e instanceof Error && /[Ss]tock insuffisant/.test(e.message);
  }
  verif("createOrder refuse une quantité supérieure au stock disponible (correctif anti-survente)", stockRefuse);

  const commandeOk = await buyerCaller.createOrder({ shopId: shop.id, items: [{ catalogId: piece5.id, quantite: 2 }] });
  verif("createOrder accepte une quantité dans la limite du stock disponible", commandeOk.id > 0);

  const commandeRefuseApres = await (async () => {
    try {
      await buyerCaller.createOrder({ shopId: shop.id, items: [{ catalogId: piece5.id, quantite: 2 }] });
      return false;
    } catch (e) {
      return e instanceof Error && /[Ss]tock insuffisant/.test(e.message);
    }
  })();
  verif("createOrder tient compte de la réservation de la commande précédente (1 restant sur 3)", commandeRefuseApres);

  await nettoyer();

  console.log(`\n${ok}/${total} assertions réussies.`);
  await recordTestEvidence({
    domain: "pieces",
    kind: "unit",
    scenario: "Architecture 3 : dimension type de véhicule sur le catalogue Pièces (défaut, filtre, mise à jour)",
    passed: ok,
    total,
    source: "agent",
  });
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
