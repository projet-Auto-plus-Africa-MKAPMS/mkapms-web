/**
 * Product Page Engine — tests réels, base de données réelle. Demande
 * Direction (26/10) : « au minimum un véhicule normal, un véhicule sur
 * commande comme la Ford Mustang ou la Peugeot, un futur véhicule
 * constructeur MKA.P-MS ». Vérifie aussi que le comportement des annonces
 * déjà existantes (type "vente_normale") reste inchangé par ce lot.
 *
 * Lancement : `npx tsx server/product-page-engine/__tests__/product-page-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces } from "../../schema.js";
import { orderListings } from "../../order-engine/schema.js";
import * as orderEngine from "../../order-engine/service.js";
import * as productPageEngine from "../service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const EMPLOYEE_ID = 930101;
const SUPPLIER_PROFILE_ID = 930102;

let idsAnnonces: number[] = [];

async function nettoyer() {
  if (idsAnnonces.length > 0) {
    await db.delete(orderListings).where(inArray(orderListings.annonceId, idsAnnonces));
    await db.delete(annonces).where(inArray(annonces.id, idsAnnonces));
    idsAnnonces = [];
  }
}

async function creerAnnonce(values: Partial<typeof annonces.$inferInsert>): Promise<number> {
  const [row] = await db
    .insert(annonces)
    .values({
      ownerId: EMPLOYEE_ID,
      titre: "Fixture Product Page Engine",
      marque: "Peugeot",
      modele: "308",
      prix: "15000",
      categorieAnnonce: "professionnelle",
      status: "publiee",
      ownership: "client",
      ...values,
    })
    .returning({ id: annonces.id });
  idsAnnonces.push(row.id);
  return row.id;
}

const caller = appRouter.createCaller({ req: {} as never, res: {} as never, user: null });

async function main() {
  await nettoyer();

  // ── 1. Véhicule normal (comportement déjà en place, inchangé) ──────────
  const annonceNormale = await creerAnnonce({ ownership: "client", marque: "Renault", modele: "Clio" });
  const configNormale = await productPageEngine.obtenirConfigurationPageProduit(annonceNormale);
  verif("1. type = vente_normale pour une annonce client ordinaire", configNormale.type === "vente_normale");
  verif("1b. aucun bloc sur-commande ni constructeur affiché", !configNormale.afficherBlocSurCommande && !configNormale.afficherBlocConstructeur);
  verif("1c. financement visible (stock déjà possédé, pas de restriction)", configNormale.afficherFinancement === true);
  verif("1d. aucune information fournisseur exposée (rien à exposer, aucune commande liée)", configNormale.afficherInformationsFournisseur === false);

  // Annonce officielle déjà en stock MKA.P-MS (ownership="plateforme") sans
  // le nouveau drapeau constructeur : doit elle aussi rester vente_normale —
  // preuve que l'ajout du type constructeur ne change rien au comportement
  // déjà en place pour le stock officiel existant.
  const annonceOfficielleExistante = await creerAnnonce({ ownership: "plateforme", categorieAnnonce: "officielle" });
  const configOfficielleExistante = await productPageEngine.obtenirConfigurationPageProduit(annonceOfficielleExistante);
  verif("1e. une annonce officielle déjà en stock (sans drapeau constructeur) reste vente_normale", configOfficielleExistante.type === "vente_normale");

  // ── 2. Véhicule sur commande (Ford Mustang, comme demandé) ──────────────
  const annonceMustang = await creerAnnonce({ ownership: "partenaire", marque: "Ford", modele: "Mustang", categorieAnnonce: "professionnelle" });
  await orderEngine.enregistrerAnnonceSurCommande({
    annonceId: annonceMustang,
    supplierProfileId: SUPPLIER_PROFILE_ID,
    creationMode: "manuelle",
    employeeId: EMPLOYEE_ID,
    vehicleLocation: "Allemagne",
    deliveryPrepDetails: "Contrôle complet avant livraison",
    prepDelayDays: 5,
    deliveryDelayDays: 10,
    deliveryZones: "France métropolitaine",
    handoverConditions: "Remise en concession partenaire",
    requiredDocuments: "Pièce d'identité, justificatif de domicile",
    depositAmount: 2000,
    refundConditions: "Remboursable sous 14 jours",
    cancellationConditions: "Annulable avant préparation",
    // Pas de deliveryFee renseigné volontairement : doit se traduire par
    // `fraisSurDevis = true` (demande Direction : « sur devis » quand le
    // frais réel n'est pas encore connu).
  });
  const configMustang = await productPageEngine.obtenirConfigurationPageProduit(annonceMustang);
  verif("2. type = sur_commande pour une annonce ownership=partenaire", configMustang.type === "sur_commande");
  verif("2b. bloc sur-commande affiché, bloc constructeur absent", configMustang.afficherBlocSurCommande && !configMustang.afficherBlocConstructeur);
  verif("2c. mention claire du statut (jamais un 3e vocabulaire) : disponible_sur_commande", configMustang.surCommande?.label === "disponible_sur_commande");
  verif("2d. origine/localisation générale exposée, jamais une adresse exacte", configMustang.surCommande?.localisation === "Allemagne");
  verif("2e. délais de livraison exposés", configMustang.surCommande?.delaiLivraisonJours === 10 && configMustang.surCommande?.delaiPreparationJours === 5);
  verif("2f. frais de livraison non renseigné → sur devis", configMustang.surCommande?.fraisLivraison === null && configMustang.surCommande?.fraisSurDevis === true);
  verif("2g. conditions de réservation (acompte, remboursement, annulation) exposées", configMustang.surCommande?.acompte === "2000" && !!configMustang.surCommande?.conditionsRemboursement && !!configMustang.surCommande?.conditionsAnnulation);
  verif("2h. documents requis exposés", configMustang.surCommande?.documentsRequis === "Pièce d'identité, justificatif de domicile");
  // Financement : jamais activé par défaut pour un véhicule sur commande
  // tant qu'un employé ne l'a pas explicitement autorisé (règle PDG).
  verif("2i. financement/paiement en plusieurs fois NON affiché (jamais activé par défaut)", configMustang.afficherFinancement === false);
  verif("2j. informations fournisseur marquées utiles côté config, jamais le nom du fournisseur lui-même (non lu par ce moteur)", configMustang.afficherInformationsFournisseur === true && !("supplierName" in (configMustang.surCommande ?? {})));

  // Véhicule sur commande "Peugeot" (second exemple demandé par la
  // Direction), financement explicitement autorisé par un employé cette
  // fois — doit apparaître.
  const annoncePeugeot = await creerAnnonce({ ownership: "partenaire", marque: "Peugeot", modele: "3008", categorieAnnonce: "professionnelle" });
  await orderEngine.enregistrerAnnonceSurCommande({
    annonceId: annoncePeugeot,
    supplierProfileId: SUPPLIER_PROFILE_ID,
    creationMode: "manuelle",
    employeeId: EMPLOYEE_ID,
    installmentPaymentAllowed: true,
    deliveryFee: 350,
  });
  const configPeugeot = await productPageEngine.obtenirConfigurationPageProduit(annoncePeugeot);
  verif("2k. financement affiché quand explicitement autorisé par un employé", configPeugeot.afficherFinancement === true);
  verif("2l. frais de livraison renseigné → jamais 'sur devis'", configPeugeot.surCommande?.fraisLivraison === "350" && configPeugeot.surCommande?.fraisSurDevis === false);

  // ── 3. Futur véhicule constructeur MKA.P-MS (préparation, aucune annonce
  //       existante n'est concernée) ──────────────────────────────────────
  const annonceConstructeur = await creerAnnonce({
    ownership: "plateforme",
    categorieAnnonce: "officielle",
    marque: "MKA.P-MS",
    modele: "Modèle 1",
    estConstructeurMkapms: true,
    constructeurFicheTechnique: "Châssis monocoque, 4 roues motrices, moteur électrique double.",
    constructeurDisponibilite: "Précommande ouverte — livraison T2 2027",
    constructeurEntretienServices: "Révision incluse 3 ans, assistance 24/7, pièces garanties constructeur.",
    garanties: ["Garantie constructeur 5 ans", "Garantie batterie 8 ans"],
  });
  const configConstructeur = await productPageEngine.obtenirConfigurationPageProduit(annonceConstructeur);
  verif("3. type = constructeur_mkapms quand le drapeau est explicitement activé", configConstructeur.type === "constructeur_mkapms");
  verif("3b. bloc constructeur affiché, bloc sur-commande absent", configConstructeur.afficherBlocConstructeur && !configConstructeur.afficherBlocSurCommande);
  verif("3c. marque constructeur = MKA.P-MS", configConstructeur.constructeur?.marque === "MKA.P-MS");
  verif("3d. fiche constructeur exposée", configConstructeur.constructeur?.ficheConstructeur?.includes("monocoque") === true);
  verif("3e. disponibilité exposée", configConstructeur.constructeur?.disponibilite === "Précommande ouverte — livraison T2 2027");
  verif("3f. garanties exposées (champ déjà existant `annonces.garanties`, réutilisé sans duplication)", configConstructeur.constructeur?.garanties.length === 2);
  verif("3g. entretien et services associés exposés", configConstructeur.constructeur?.entretienServices?.includes("assistance 24/7") === true);
  verif("3h. financement visible (stock déjà possédé)", configConstructeur.afficherFinancement === true);

  // ── 4. Exposition MOS (health/feed/dashboard + router) ──────────────────
  const health = await productPageEngine.healthStatus();
  verif("4. healthStatus répond 'ok' avec des métriques réelles", health.status === "ok" && health.metrics.annoncesTotal >= 4);
  const feed = await productPageEngine.controlCenterFeed();
  verif("4b. controlCenterFeed déclare le moteur 'active' (jamais un moteur en place mais non connecté)", feed.status === "active" && feed.engine === "product-page-engine");
  const dash = await productPageEngine.dashboard();
  verif("4c. dashboard expose des métriques métier réelles par ownership", typeof dash.businessMetrics.annonces_ownership_partenaire === "number");

  // Router tRPC réellement appelé (comme depuis Vehicule.tsx) — jamais un
  // appel direct au service qui contournerait la validation d'entrée.
  const viaRouter = await caller.productPageEngine.config({ annonceId: annonceMustang });
  verif("4d. le routeur tRPC productPageEngine.config répond la même configuration que le service", viaRouter.type === "sur_commande" && viaRouter.surCommande?.localisation === "Allemagne");

  await nettoyer();

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch(async (e) => {
  console.error(e);
  await nettoyer();
  process.exitCode = 1;
});
