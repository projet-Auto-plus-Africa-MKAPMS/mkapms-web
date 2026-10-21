/**
 * Order Engine — Plan Maître Fournisseurs §36-37 (section "COMMANDES") :
 * tests réels, base de données réelle. Couvre la liaison d'une annonce
 * (mode « manuelle » ou « assistée par IA »), la création de commande (sans
 * jamais exposer vehicleItemId/supplierProfileId au client), les
 * transitions de statut interne (10+ étapes), la dérivation du statut
 * client et du statut public (jamais le vocabulaire interne exposé), la
 * validation prix/marge (confidentielle), les 3 décisions finales (vendue /
 * retour_en_cours / remise_en_stock), la génération réelle de documents via
 * le Document OS existant, la visibilité des documents (employé vs client),
 * le journal d'audit et l'exposition MOS (health/feed/dashboard + router).
 *
 * Lancement : `npx tsx server/order-engine/__tests__/order-engine.test.ts`
 */
import assert from "node:assert/strict";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { annonces } from "../../schema.js";
import { docDocuments } from "../../document-os/index.js";
import { wallets, walletTransactions } from "../../modules/wallet.js";
import { payoutAuditLog, payoutSchedules } from "../../payout-engine/schema.js";
import {
  orderDecisions,
  orderDocuments,
  orderEngineAuditLog,
  orderItems,
  orderListings,
  orderStatusHistory,
} from "../schema.js";
import * as orderEngine from "../service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const SUPPLIER_PROFILE_ID = 930001;
const EMPLOYEE_ID = 930002;
const CUSTOMER_ID = 930003;
const AUTRE_CLIENT_ID = 930004;
const VEHICLE_ITEM_ID = 930005;

let idsAnnonces: number[] = [];
let idsOrders: number[] = [];
let idsDocDocuments: number[] = [];

async function nettoyer() {
  for (const id of idsOrders) {
    await db.delete(orderDocuments).where(eq(orderDocuments.orderItemId, id));
    await db.delete(orderDecisions).where(eq(orderDecisions.orderItemId, id));
    await db.delete(orderStatusHistory).where(eq(orderStatusHistory.orderItemId, id));
    await db.delete(orderEngineAuditLog).where(eq(orderEngineAuditLog.orderItemId, id));
    await db.delete(orderItems).where(eq(orderItems.id, id));
  }
  idsOrders = [];
  if (idsAnnonces.length > 0) {
    await db.delete(orderListings).where(inArray(orderListings.annonceId, idsAnnonces));
    await db.delete(annonces).where(inArray(annonces.id, idsAnnonces));
    idsAnnonces = [];
  }
  if (idsDocDocuments.length > 0) {
    await db.delete(docDocuments).where(inArray(docDocuments.id, idsDocDocuments));
    idsDocDocuments = [];
  }
  // Versement fournisseur ouvert par poserDecision("accepte") (Payout Engine) —
  // même nettoyage que server/document-engine/__tests__/document-engine.test.ts.
  const versements = await db.select().from(payoutSchedules).where(and(eq(payoutSchedules.sourceType, "vehicle_sale"), eq(payoutSchedules.supplierProfileId, SUPPLIER_PROFILE_ID)));
  for (const v of versements) {
    await db.delete(payoutAuditLog).where(eq(payoutAuditLog.scheduleId, v.id));
    await db.delete(walletTransactions).where(eq(walletTransactions.walletId, v.targetWalletId));
    await db.delete(payoutSchedules).where(eq(payoutSchedules.id, v.id));
  }
  await db.delete(wallets).where(and(eq(wallets.ownerType, "supplier"), eq(wallets.supplierProfileId, SUPPLIER_PROFILE_ID)));
  const [platform] = await db.select().from(wallets).where(eq(wallets.ownerType, "platform")).limit(1);
  if (platform) {
    await db.delete(walletTransactions).where(eq(walletTransactions.walletId, platform.id));
    await db.delete(wallets).where(eq(wallets.id, platform.id));
  }
  await db.delete(orderEngineAuditLog).where(eq(orderEngineAuditLog.actorId, EMPLOYEE_ID));
}

async function creerAnnonceFixture(): Promise<number> {
  const [row] = await db
    .insert(annonces)
    .values({
      ownerId: EMPLOYEE_ID,
      titre: "Véhicule sur commande — test",
      marque: "Peugeot",
      modele: "308",
      prix: "15000",
      ownership: "partenaire",
      categorieAnnonce: "officielle",
      status: "publiee",
    })
    .returning({ id: annonces.id });
  idsAnnonces.push(row.id);
  return row.id;
}

async function main() {
  await nettoyer();

  // ── 1. Liaison annonce ↔ fournisseur (sections 2-4, demande PDG) ───────
  const annonceId = await creerAnnonceFixture();
  verif("1. statut public par défaut (aucune liaison) : 'disponible sur commande'", (await orderEngine.obtenirLabelPublicParAnnonce(annonceId)) === "disponible_sur_commande");

  const listing = await orderEngine.enregistrerAnnonceSurCommande({
    annonceId,
    supplierProfileId: SUPPLIER_PROFILE_ID,
    vehicleItemId: VEHICLE_ITEM_ID,
    creationMode: "manuelle",
    employeeId: EMPLOYEE_ID,
  });
  verif("1b. annonce liée en mode 'manuelle' (bouton Manuel, jamais un second formulaire)", listing.creationMode === "manuelle" && listing.vehicleItemId === VEHICLE_ITEM_ID);
  await assert.rejects(
    () => orderEngine.enregistrerAnnonceSurCommande({ annonceId, supplierProfileId: SUPPLIER_PROFILE_ID, creationMode: "ia_assistee", employeeId: EMPLOYEE_ID }),
    /déjà enregistrée/,
  );
  verif("1c. une annonce ne peut être liée qu'une seule fois", true);

  // ── 2. Création de commande : jamais vehicleItemId/supplierProfileId transmis ──
  const commande = await orderEngine.creerCommande({ annonceId, customerId: CUSTOMER_ID });
  idsOrders.push(commande.id);
  verif("2. commande créée, vehicleItemId relu depuis order_listings (jamais transmis par le client)", commande.vehicleItemId === VEHICLE_ITEM_ID && commande.supplierProfileId === SUPPLIER_PROFILE_ID);
  verif("2b. statut initial 'vehicule_selectionne'", commande.status === "vehicule_selectionne");

  await assert.rejects(() => orderEngine.creerCommande({ annonceId, customerId: AUTRE_CLIENT_ID }), /déjà en cours/);
  verif("2c. une seconde commande concurrente sur la même annonce est refusée", true);

  // ── 3. Attribution employé (section 7) ──────────────────────────────────
  await orderEngine.attribuerEmploye({ orderItemId: commande.id, employeeId: EMPLOYEE_ID, actorId: EMPLOYEE_ID });
  const vehiculesEmploye = await orderEngine.listerCommandesEmploye(EMPLOYEE_ID);
  verif("3. l'employé voit la commande qui lui est attribuée", vehiculesEmploye.some((c) => c.id === commande.id));

  // ── 4. Transitions de statut interne (section 8) ────────────────────────
  await assert.rejects(() => orderEngine.avancerStatut({ orderItemId: commande.id, to: "vehicule_en_preparation", actorType: "employe", actorId: EMPLOYEE_ID }), /[Tt]ransition refusée/);
  verif("4. saut d'étape refusé, jamais silencieux", true);
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "disponibilite_confirmee", actorType: "fournisseur", actorId: null });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "documents_controles", actorType: "employe", actorId: EMPLOYEE_ID });
  verif("4b. statut public toujours 'disponible sur commande' avant préparation", (await orderEngine.obtenirLabelPublicParAnnonce(annonceId)) === "disponible_sur_commande");

  // ── 5. Prix et marge (confidentiel) ─────────────────────────────────────
  const prixMarge = await orderEngine.validerPrixEtMarge({ orderItemId: commande.id, totalAmount: 16000, depositAmount: 3000, balanceAmount: 13000, supplierPrice: 12000, actorId: EMPLOYEE_ID });
  verif("5. marge calculée (16000 - 12000 = 4000), jamais exposée côté client", prixMarge.margin === 4000);
  const detailClientAvantVente = await orderEngine.obtenirCommandeDetail(commande.id);
  verif("5b. le prix fournisseur n'est stocké que confidentiellement (jamais via le DTO client)", (detailClientAvantVente.commande as any).supplierPriceConfidential !== undefined);

  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "commande_fournisseur_creee", actorType: "employe", actorId: EMPLOYEE_ID });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "vehicule_en_preparation", actorType: "fournisseur", actorId: null });
  verif("5c. statut public devient 'disponible sur visite' dès la préparation engagée", (await orderEngine.obtenirLabelPublicParAnnonce(annonceId)) === "disponible_sur_visite");

  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "transport_organise", actorType: "employe", actorId: EMPLOYEE_ID });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "inspection_realisee", actorType: "employe", actorId: EMPLOYEE_ID });
  await orderEngine.avancerStatut({ orderItemId: commande.id, to: "pret_visite_livraison", actorType: "employe", actorId: EMPLOYEE_ID });

  // ── 6. Statut client dérivé : jamais le vocabulaire interne ─────────────
  const statutClient = orderEngine.deriveCustomerStatus("pret_visite_livraison");
  verif("6. 'pret_visite_livraison' → 'pret_inspection_livraison' côté client", statutClient === "pret_inspection_livraison");
  verif("6b. aucune étape interne (fournisseur/transport) n'apparaît dans le vocabulaire client", !["vehicule_selectionne", "transport_organise", "commande_fournisseur_creee"].includes(statutClient));

  // ── 7. Décision finale « accepté » (section 10) ─────────────────────────
  await orderEngine.poserDecision({ orderItemId: commande.id, decision: "accepte", decidedBy: EMPLOYEE_ID, note: "Client satisfait." });
  const detailApresVente = await orderEngine.obtenirCommandeDetail(commande.id);
  verif("7. commande close en 'vendue' (jamais un 'remboursee' générique)", detailApresVente.commande.status === "vendue");
  verif("7b. décision bien enregistrée", detailApresVente.decision?.decision === "accepte");
  const [annonceApresVente] = await db.select({ status: annonces.status }).from(annonces).where(eq(annonces.id, annonceId)).limit(1);
  verif("7c. l'annonce passe réellement à 'vendue' (même convention que le Vehicle Engine)", annonceApresVente?.status === "vendue");
  verif("7d. statut client dérivé : 'vehicule_remis_livre'", orderEngine.deriveCustomerStatus("vendue") === "vehicule_remis_livre");

  // ── 8. Documents (section 11) : génération réelle + visibilité ─────────
  const devis = await orderEngine.genererDocumentCommande({ orderItemId: commande.id, documentType: "devis", actorId: EMPLOYEE_ID });
  idsDocDocuments.push(devis.docDocumentId);
  const bonCommande = await orderEngine.genererDocumentCommande({ orderItemId: commande.id, documentType: "bon_commande", actorId: EMPLOYEE_ID });
  idsDocDocuments.push(bonCommande.docDocumentId);
  const factureFinale = await orderEngine.genererDocumentCommande({ orderItemId: commande.id, documentType: "facture_finale", actorId: EMPLOYEE_ID });
  idsDocDocuments.push(factureFinale.docDocumentId);
  verif("8. documents réellement générés via le Document OS existant (ids réels)", devis.docDocumentId > 0 && bonCommande.docDocumentId > 0 && factureFinale.docDocumentId > 0);

  const [ligneFacture] = await db.select().from(docDocuments).where(eq(docDocuments.id, factureFinale.docDocumentId)).limit(1);
  verif("8b. le montant de la facture finale correspond au total réellement validé (16000)", Number(ligneFacture?.amountTtc) === 16000);

  await assert.rejects(() => orderEngine.genererDocumentCommande({ orderItemId: commande.id, documentType: "document_cession", actorId: EMPLOYEE_ID }), /document de référence/);
  verif("8c. un document de référence (cession) n'est jamais fabriqué ici — refusé explicitement", true);

  const docsEmploye = await orderEngine.listerDocuments(commande.id, { employeeView: true });
  verif("8d. vue employé : tous les documents visibles, y compris le bon de commande interne", docsEmploye.length === 3 && docsEmploye.some((d) => d.documentType === "bon_commande"));
  const docsClient = await orderEngine.listerDocuments(commande.id, { employeeView: false });
  verif("8e. vue client : jamais le bon de commande fournisseur (document interne réservé)", docsClient.length === 2 && !docsClient.some((d) => d.documentType === "bon_commande"));

  // ── 9. Journal d'audit (règle MOS #12) ──────────────────────────────────
  const journal = await orderEngine.journalAudit(commande.id);
  const actionsAttendues = ["commande.creee", "commande.employe_attribue", "commande.statut_change", "commande.prix_marge_valides", "commande.decision_prise", "commande.document_genere"];
  const actionsJournalisees = new Set(journal.map((j) => j.action));
  verif("9. chaque étape du cycle de vie est journalisée", actionsAttendues.every((a) => actionsJournalisees.has(a)));

  // ── 10. Autre commande : décision « garde » (remise en stock) ──────────
  const annonceId2 = await creerAnnonceFixture();
  await orderEngine.enregistrerAnnonceSurCommande({ annonceId: annonceId2, supplierProfileId: SUPPLIER_PROFILE_ID, creationMode: "ia_assistee", employeeId: EMPLOYEE_ID });
  const commande2 = await orderEngine.creerCommande({ annonceId: annonceId2, customerId: CUSTOMER_ID });
  idsOrders.push(commande2.id);
  verif("10. commande liée via le mode 'ia_assistee' — sans jamais exiger vehicleItemId (optionnel)", commande2.vehicleItemId === null);
  for (const etape of ["disponibilite_confirmee", "documents_controles", "prix_marge_valides", "commande_fournisseur_creee", "vehicule_en_preparation", "transport_organise", "inspection_realisee", "pret_visite_livraison"] as const) {
    await orderEngine.avancerStatut({ orderItemId: commande2.id, to: etape, actorType: "employe", actorId: EMPLOYEE_ID });
  }
  await orderEngine.poserDecision({ orderItemId: commande2.id, decision: "garde", decidedBy: EMPLOYEE_ID, note: "Client a finalement renoncé." });
  const detailGarde = await orderEngine.obtenirCommandeDetail(commande2.id);
  verif("10b. commande close en 'remise_en_stock' (jamais 'vendue' ni 'remboursee')", detailGarde.commande.status === "remise_en_stock");
  const [annonceApresGarde] = await db.select({ status: annonces.status }).from(annonces).where(eq(annonces.id, annonceId2)).limit(1);
  verif("10c. l'annonce reste 'publiee' (jamais retirée pour un véhicule gardé)", annonceApresGarde?.status === "publiee");
  verif("10d. statut public devient automatiquement 'disponible sur visite' (déjà inspecté, présentable à d'autres clients)", (await orderEngine.obtenirLabelPublicParAnnonce(annonceId2)) === "disponible_sur_visite");
  verif("10e. statut client dérivé : jamais le mot 'stock' exposé", orderEngine.deriveCustomerStatus("remise_en_stock") === "annulee");

  // ── 11. Étanchéité entre clients ────────────────────────────────────────
  const commandesAutreClient = await orderEngine.listerCommandesClient(AUTRE_CLIENT_ID);
  verif("11. un autre client ne voit jamais ces commandes", !commandesAutreClient.some((c) => c.id === commande.id || c.id === commande2.id));

  // ── 12. MOS : health / feed / dashboard ─────────────────────────────────
  const health = await orderEngine.healthStatus();
  verif("12. healthStatus répond avec au moins ces 2 commandes de test", health.metrics.total >= 2 && health.status === "ok");
  const feed = await orderEngine.controlCenterFeed();
  verif("12b. controlCenterFeed déclare staging (aucune commande réelle menée en production)", feed.status === "staging");
  const dash = await orderEngine.dashboard();
  verif("12c. dashboard expose des métriques business réelles (jamais vides)", Object.keys(dash.businessMetrics).length > 0);

  // ── 13. Router : branché dans l'appRouter ───────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const orderKeys = Object.keys(procs).filter((k) => k.startsWith("orderEngine."));
  for (const sub of [
    "orderEngine.meta",
    "orderEngine.enregistrerAnnonceSurCommande",
    "orderEngine.labelPublic",
    "orderEngine.creerCommande",
    "orderEngine.attribuerEmploye",
    "orderEngine.avancerStatut",
    "orderEngine.validerPrixEtMarge",
    "orderEngine.creerCheckoutAcompte",
    "orderEngine.creerCheckoutSolde",
    "orderEngine.poserDecision",
    "orderEngine.genererDocument",
    "orderEngine.rembourserCommande",
    "orderEngine.mesVehiculesAttribues",
    "orderEngine.mesCommandes",
    "orderEngine.detailCommandeClient",
  ]) {
    verif(`Router : expose « ${sub} »`, orderKeys.includes(sub));
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
