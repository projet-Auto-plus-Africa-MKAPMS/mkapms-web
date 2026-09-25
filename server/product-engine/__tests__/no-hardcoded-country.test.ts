/**
 * Doctrine PDG v1.1 (mkapms-mos-architecture.md §12.1) : le Google Product
 * Engine forçait "pays: 'FR', langue: 'fr'" pour CHAQUE fiche produit
 * (boutique pièces pro ET inventaire simple), quel que soit le pays réel de
 * la boutique ou du propriétaire — un signalement Merchant Center pour un
 * vendeur allemand ou anglais aurait donc été envoyé comme si le produit
 * était français. Corrigé : le pays vient de parts_shops.country_code (ou
 * users.country pour l'inventaire simple), et la langue est dérivée du vrai
 * pays via le Country OS (déjà construit, jamais dupliqué).
 *
 * Ce test prouve, sur base de données réelle, que deux boutiques dans des
 * pays différents produisent des fiches avec un pays/langue/devise
 * différents — jamais deux fois "FR"/"fr" par accident.
 *
 * Lancement : `npx tsx server/product-engine/__tests__/no-hardcoded-country.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users, partsShops, partsCatalog, pieces } from "../../schema.js";
import { productFeedItems } from "../schema.js";
import { refreshFeed } from "../service.js";

const PREFIX = "TEST-NOFRDEFAULT-";
const OWNER_FR = 900930;
const OWNER_DE = 900931;
const OWNER_INVENTAIRE_GB = 900932;

async function nettoyer() {
  const shops = await db
    .select({ id: partsShops.id })
    .from(partsShops)
    .where(inArray(partsShops.ownerId, [OWNER_FR, OWNER_DE]));
  if (shops.length) {
    const catalog = await db
      .select({ id: partsCatalog.id })
      .from(partsCatalog)
      .where(inArray(partsCatalog.shopId, shops.map((s) => s.id)));
    if (catalog.length) {
      await db.delete(productFeedItems).where(inArray(productFeedItems.sourceId, catalog.map((c) => c.id)));
    }
    await db.delete(partsCatalog).where(inArray(partsCatalog.shopId, shops.map((s) => s.id)));
  }
  await db.delete(partsShops).where(inArray(partsShops.ownerId, [OWNER_FR, OWNER_DE]));
  const pieceRows = await db
    .select({ id: pieces.id })
    .from(pieces)
    .where(eq(pieces.ownerId, OWNER_INVENTAIRE_GB));
  if (pieceRows.length) {
    await db.delete(productFeedItems).where(inArray(productFeedItems.sourceId, pieceRows.map((p) => p.id)));
  }
  await db.delete(pieces).where(eq(pieces.ownerId, OWNER_INVENTAIRE_GB));
  await db.delete(users).where(inArray(users.id, [OWNER_FR, OWNER_DE, OWNER_INVENTAIRE_GB]));
}

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  await nettoyer();

  await db.insert(users).values([
    { id: OWNER_FR, email: `${PREFIX.toLowerCase()}fr@mkapms.local`, name: "Boutique FR" },
    { id: OWNER_DE, email: `${PREFIX.toLowerCase()}de@mkapms.local`, name: "Boutique DE" },
    { id: OWNER_INVENTAIRE_GB, email: `${PREFIX.toLowerCase()}gb@mkapms.local`, name: "Owner GB", country: "GB", currency: "GBP" },
  ]);

  const [shopFr] = await db.insert(partsShops).values({ ownerId: OWNER_FR, nom: `${PREFIX}BoutiqueFR`, countryCode: "FR" }).returning();
  const [shopDe] = await db.insert(partsShops).values({ ownerId: OWNER_DE, nom: `${PREFIX}BoutiqueDE`, countryCode: "DE" }).returning();

  await db.insert(partsCatalog).values([
    {
      shopId: shopFr.id, nom: `${PREFIX}PieceFR`, description: "Pièce vendue par une boutique française.",
      referenceInterne: `${PREFIX}REF-FR`, prixHt: "10.00", prixTtc: "12.00", currency: "EUR", active: true,
    },
    {
      shopId: shopDe.id, nom: `${PREFIX}PieceDE`, description: "Teil, verkauft von einem deutschen Shop.",
      referenceInterne: `${PREFIX}REF-DE`, prixHt: "10.00", prixTtc: "11.90", currency: "EUR", active: true,
    },
  ]);

  await db.insert(pieces).values({
    ownerId: OWNER_INVENTAIRE_GB, reference: `${PREFIX}REF-GB`, designation: `${PREFIX}PieceGB`,
    description: "Part sold from a UK inventory.", prixVente: "9.99", stock: 5,
  });

  const rapport = await refreshFeed({ trigger: "test", limit: 200 });
  verif("1. refreshFeed examine bien les trois fiches insérées", rapport.examines >= 3);

  const ficheFr = rapport.items.find((i) => i.titre === `${PREFIX}PieceFR`);
  const ficheDe = rapport.items.find((i) => i.titre === `${PREFIX}PieceDE`);
  const ficheGb = rapport.items.find((i) => i.titre === `${PREFIX}PieceGB`);

  const rowFr = ficheFr ? (await db.select().from(productFeedItems).where(eq(productFeedItems.offerId, ficheFr.offerId)))[0] : null;
  const rowDe = ficheDe ? (await db.select().from(productFeedItems).where(eq(productFeedItems.offerId, ficheDe.offerId)))[0] : null;
  const rowGb = ficheGb ? (await db.select().from(productFeedItems).where(eq(productFeedItems.offerId, ficheGb.offerId)))[0] : null;

  verif("2. la boutique FR est bien classée pays=FR / langue=fr", rowFr?.pays === "FR" && rowFr?.langue === "fr");
  verif(
    "3. la boutique DE n'est PAS forcée à FR/fr (avant correction : toujours 'FR'/'fr' quel que soit le pays réel)",
    rowDe?.pays === "DE" && rowDe?.langue === "de",
  );
  verif(
    "4. l'inventaire simple lit le vrai pays/devise du propriétaire (users.country/currency), pas un défaut EUR/FR en dur",
    rowGb?.pays === "GB" && rowGb?.langue === "en" && rowGb?.devise === "GBP",
  );

  await nettoyer();
  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
