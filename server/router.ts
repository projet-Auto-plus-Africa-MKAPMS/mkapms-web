import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { annoncesRouter } from "./routers/annonces.js";
import { garagesRouter } from "./routers/garages.js";
import { devisRouter } from "./routers/devis.js";
import { favorisRouter } from "./routers/favoris.js";
import { abonnementsRouter } from "./routers/abonnements.js";
import { reservationsRouter } from "./routers/reservations.js";
import { metaRouter } from "./routers/meta.js";
import { adminRouter } from "./routers/admin.js";
import { supportRouter } from "./routers/support.js";
// Modules fédérés (Plan A→Z) — chaque univers indépendant.
import { modulesRouter } from "./routers/modules.js";
import { rbacRouter } from "./routers/rbac.js";
import { piecesRouter } from "./routers/pieces.js";
import { livraisonRouter } from "./routers/livraison.js";
import { depannageRouter } from "./routers/depannage.js";
import { transportRouter } from "./routers/transport.js";
import { importafricaRouter } from "./routers/importafrica.js";
import { walletRouter } from "./routers/wallet.js";
import { contractsRouter } from "./routers/contracts.js";
import { installmentsRouter } from "./routers/installments.js";
import { marketingRouter } from "./routers/marketing.js";
import { historiqueRouter } from "./routers/historique.js";
import { kycRouter } from "./routers/kyc.js";
import { currencyRouter } from "./routers/currency.js";
import { notificationsRouter, searchesRouter } from "./routers/notifications.js";
import { reviewsRouter } from "./routers/reviews.js";
import { disputesRouter, partnersRouter, warehousesRouter, countriesRouter, loyaltyRouter, documentsRouter, dossiersRouter, governanceRouter, platformRouter, insuranceRouter, labRouter, procurementRouter, hrRouter, qualityRouter, investorRouter, mediaRouter, partnerApiRouter, lavageRouter, kartingRouter, formationRouter, platformMapRouter } from "./routers/operations.js";
import { depotVenteRouter } from "./routers/depotvente.js";
import { voRouter } from "./routers/vo.js";
import { comptabiliteRouter, cabinetsRouter } from "./routers/comptabilite.js";
import { carteGriseRouter } from "./routers/cartegrise.js";
import { proRouter } from "./routers/pro.js";
import { apiRouter } from "./routers/api.js";

export const appRouter = router({
  auth: authRouter,
  annonces: annoncesRouter,
  garages: garagesRouter,
  devis: devisRouter,
  favoris: favorisRouter,
  abonnements: abonnementsRouter,
  reservations: reservationsRouter,
  meta: metaRouter,
  admin: adminRouter,
  support: supportRouter,
  // Univers / modules
  modules: modulesRouter,
  rbac: rbacRouter,
  pieces: piecesRouter,
  livraison: livraisonRouter,
  depannage: depannageRouter,
  transport: transportRouter,
  importAfrica: importafricaRouter,
  wallet: walletRouter,
  contracts: contractsRouter,
  installments: installmentsRouter,
  marketing: marketingRouter,
  historique: historiqueRouter,
  kyc: kycRouter,
  currency: currencyRouter,
  notifications: notificationsRouter,
  searches: searchesRouter,
  reviews: reviewsRouter,
  // Parties 7-15 (litiges, partenaires, entrepôts, pays)
  disputes: disputesRouter,
  partners: partnersRouter,
  warehouses: warehousesRouter,
  countries: countriesRouter,
  // Parties 16-18 (fidélité, coffre-fort, dossier véhicule)
  loyalty: loyaltyRouter,
  documents: documentsRouter,
  dossiers: dossiersRouter,
  // Parties 19-20 (gouvernance/filiales/franchises, continuité/sécurité)
  governance: governanceRouter,
  platform: platformRouter,
  // Parties 21 & 23 (assurances, MKA.P-MS Lab)
  insurance: insuranceRouter,
  lab: labRouter,
  // Parties 24-29 (achat, RH, qualité, investisseurs, médias, API partenaires)
  procurement: procurementRouter,
  hr: hrRouter,
  quality: qualityRouter,
  investor: investorRouter,
  media: mediaRouter,
  partnerApi: partnerApiRouter,
  // Univers Lavage / Karting / Formation (complets, masqués au public) + carte plateforme
  lavage: lavageRouter,
  karting: kartingRouter,
  formation: formationRouter,
  platformMap: platformMapRouter,
  depotVente: depotVenteRouter,
  vo: voRouter,
  comptabilite: comptabiliteRouter,
  cabinets: cabinetsRouter,
  carteGrise: carteGriseRouter,
  pro: proRouter,
  api: apiRouter,
});

export type AppRouter = typeof appRouter;
