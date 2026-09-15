/**
 * Auction Engine — tests réels, base de données réelle. Couvre la
 * reconnexion du catalogue (/acheter/encheres) : catégorie persistée et
 * filtrable, contenu descriptif riche (`lotDetails`) conservé intact, prix
 * courant et nombre d'enchérisseurs réellement calculés à partir des offres
 * (jamais une valeur fabriquée côté écran).
 *
 * Lancement : `npx tsx server/auction-engine/__tests__/auction-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { users } from "../../schema.js";
import { auctions, auctionBids, auctionEvents } from "../schema.js";
import * as auction from "../service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const SELLER_ID = 930001;
const BIDDER_A = 930002;
const BIDDER_B = 930003;

const ACHETEUR_EMAIL = "test-auction-engine-acheteur@mkapms.invalid";

let idsAuctions: number[] = [];
let idAcheteur: number | null = null;

async function nettoyer() {
  for (const id of idsAuctions) {
    await db.delete(auctionEvents).where(eq(auctionEvents.auctionId, id));
    await db.delete(auctionBids).where(eq(auctionBids.auctionId, id));
    await db.delete(auctions).where(eq(auctions.id, id));
  }
  idsAuctions = [];
  await db.delete(users).where(eq(users.email, ACHETEUR_EMAIL));
  idAcheteur = null;
}

async function main() {
  await nettoyer();

  const dans1h = new Date(Date.now() + 3600 * 1000);
  const dans2h = new Date(Date.now() + 2 * 3600 * 1000);
  const ilYA1h = new Date(Date.now() - 3600 * 1000);

  // ── 1. Création avec catégorie + contenu riche ─────────────────────────
  const lot = await auction.createAuction({
    sellerId: SELLER_ID,
    audience: "professionnel",
    title: "Lot 3 véhicules — Reprises garage",
    countryCode: "FR",
    startPrice: 8000,
    increment: 200,
    startsAt: ilYA1h,
    endsAt: dans1h,
    allowedProfiles: ["garage", "marchand"],
    category: "reprise",
    lotDetails: {
      nbVehicules: 3,
      vehicules: [
        { marque: "Renault", modele: "Clio", annee: 2015, km: 120000, etat: "moyen" },
        { marque: "Peugeot", modele: "208", annee: 2016, km: 95000, etat: "bon" },
      ],
      etatGeneral: "moyen",
      roulant: true,
      badges: ["LOT PRO"],
    },
  });
  idsAuctions.push(lot.id);
  verif("1. catégorie persistée", lot.category === "reprise");
  verif("1b. lotDetails persisté intact (nbVehicules)", (lot.lotDetails as any).nbVehicules === 3);
  verif("1c. lotDetails persisté intact (véhicules groupés)", (lot.lotDetails as any).vehicules.length === 2);
  verif("1d. restrictions acheteur réelles (allowedProfiles)", lot.allowedProfiles.includes("garage") && lot.allowedProfiles.includes("marchand"));

  await auction.publishAuction(lot.id, SELLER_ID);

  // ── 2. Filtrage par catégorie réel ──────────────────────────────────────
  const autreLot = await auction.createAuction({
    sellerId: SELLER_ID,
    audience: "professionnel",
    title: "Véhicule accidenté isolé",
    countryCode: "FR",
    startPrice: 1500,
    startsAt: ilYA1h,
    endsAt: dans2h,
    category: "accidente",
  });
  idsAuctions.push(autreLot.id);
  await auction.publishAuction(autreLot.id, SELLER_ID);

  const filtreReprise = await auction.listAuctions({ audience: "professionnel", category: "reprise" });
  verif("2. le filtre catégorie ne renvoie que la bonne catégorie", filtreReprise.some((a) => a.id === lot.id) && !filtreReprise.some((a) => a.id === autreLot.id));

  // ── 3. Prix courant / enchérisseurs réellement calculés ────────────────
  const sansOffre = await auction.listAuctions({ audience: "professionnel", category: "reprise" });
  const ligneSansOffre = sansOffre.find((a) => a.id === lot.id)!;
  verif("3. sans offre, le prix courant est le prix de départ", ligneSansOffre.currentPrice === 8000 && ligneSansOffre.bidderCount === 0);

  await auction.placeBid({ auctionId: lot.id, bidderId: BIDDER_A, amount: 8200 });
  await auction.placeBid({ auctionId: lot.id, bidderId: BIDDER_B, amount: 8500 });

  const avecOffres = await auction.listAuctions({ audience: "professionnel", category: "reprise" });
  const ligneAvecOffres = avecOffres.find((a) => a.id === lot.id)!;
  verif("3b. le prix courant reflète la meilleure offre réelle", ligneAvecOffres.currentPrice === 8500);
  verif("3c. le nombre d'enchérisseurs est réel (2 bidders distincts)", ligneAvecOffres.bidderCount === 2);

  // ── 4. Détail : lotDetails et offres réelles ────────────────────────────
  const detail = await auction.auctionDetail(lot.id);
  verif("4. le détail conserve lotDetails", (detail!.auction as any).lotDetails.nbVehicules === 3);
  verif("4b. le détail liste les offres réelles triées par montant", detail!.bids.length === 2 && Number(detail!.bids[0].amount) === 8500);
  verif("4c. le prix de réserve n'est jamais exposé", !("reservePrice" in detail!.auction));

  // ── 4d. Statistiques Direction (business stats) — jamais un chiffre inventé ──
  const [acheteur] = await db
    .insert(users)
    .values({ email: ACHETEUR_EMAIL, name: "Acheteur Test Auction Engine" })
    .returning({ id: users.id });
  idAcheteur = acheteur.id;

  const lotAAdjuger = await auction.createAuction({
    sellerId: SELLER_ID,
    audience: "professionnel",
    title: "Lot pour clôture réelle",
    countryCode: "FR",
    startPrice: 5000,
    startsAt: ilYA1h,
    endsAt: new Date(Date.now() - 1000),
    category: "stock",
  });
  idsAuctions.push(lotAAdjuger.id);
  await auction.publishAuction(lotAAdjuger.id, SELLER_ID);
  await db.update(auctions).set({ endsAt: new Date(Date.now() + 3600 * 1000) }).where(eq(auctions.id, lotAAdjuger.id));
  await auction.placeBid({ auctionId: lotAAdjuger.id, bidderId: idAcheteur, amount: 5500 });
  await db.update(auctions).set({ endsAt: new Date(Date.now() - 1000) }).where(eq(auctions.id, lotAAdjuger.id));
  const cloture = await auction.closeAuction(lotAAdjuger.id);
  verif("4d. le lot est bien adjugé au vrai acheteur de test", cloture?.status === "adjugee" && cloture.winnerId === idAcheteur);

  const stats = await auction.auctionBusinessStats();
  verif("4e. businessStats compte au moins le lot adjugé au test 4d", stats.vendus >= 1 && stats.revenus >= 5500);
  const ligneAcheteur = stats.meilleursAcheteurs.find((a) => a.acheteurId === idAcheteur);
  verif("4f. businessStats identifie l'acheteur par son vrai nom de compte (jamais un nom inventé)", ligneAcheteur?.nom === "Acheteur Test Auction Engine");
  verif("4g. businessStats totalise le vrai montant remporté par cet acheteur", ligneAcheteur?.montantTotal === 5500);

  // ── 5. Exposition du router ─────────────────────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const keys = Object.keys(procs);
  for (const sub of ["auctionEngine.list", "auctionEngine.create", "auctionEngine.bid", "auctionEngine.catalogCategories", "auctionEngine.buyerProfiles", "auctionEngine.businessStats"]) {
    verif(`Router : expose « ${sub} »`, keys.includes(sub));
  }

  await nettoyer();

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error(err);
    await nettoyer().catch(() => {});
    process.exit(1);
  });
