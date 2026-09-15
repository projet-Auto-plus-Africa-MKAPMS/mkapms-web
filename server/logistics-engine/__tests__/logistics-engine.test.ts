/**
 * Logistics Engine — LOT 4 du Plan Maître Fournisseurs (transport/livraison)
 * : tests réels, base de données réelle. Couvre le Carrier Connector Engine
 * (honnêteté sans clé réelle), le Delivery Quote Engine (véhicules réel via
 * Vehicle Delivery Engine, colis honnêtement non connecté), le Delivery
 * Routing Engine, le Multi-Leg Engine, le Tracking Engine (agrégation
 * multi-legs, statut urgent), le webhook transporteur (signature réelle) et
 * l'API de clés pour transporteurs.
 *
 * Lancement : `npx tsx server/logistics-engine/__tests__/logistics-engine.test.ts`
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import {
  logisticsApiKeys,
  logisticsAuditLog,
  logisticsCarrierConnections,
  logisticsLegs,
  logisticsQuotes,
  logisticsShipments,
  logisticsTrackingEvents,
  logisticsWebhookLog,
} from "../schema.js";
import { wallets, walletTransactions } from "../../modules/wallet.js";
import { payoutSchedules, payoutAuditLog } from "../../payout-engine/schema.js";
import * as logistics from "../service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ACTOR_ID = 4;
const TEST_SECRET_ENV = "LOGISTICS_TEST_WEBHOOK_SECRET";
process.env[TEST_SECRET_ENV] = "secret-de-test-jamais-reel";

let idsExpeditionsTest: number[] = [];
let idsConnexionsTest: number[] = [];
let idsClesTest: number[] = [];
let idsDevisTest: number[] = [];

async function nettoyer() {
  for (const id of idsExpeditionsTest) {
    // LOT 5 : mettreAJourStatutLeg émet désormais pickup.completed/
    // delivery.completed, que le Payout Engine écoute réellement — un leg de
    // test livré/enlevé ouvre un vrai versement transporteur (Ledger
    // compris). Sans ce nettoyage, chaque exécution laisserait un versement
    // et un wallet transporteur de test résiduels.
    const legs = await db.select({ id: logisticsLegs.id }).from(logisticsLegs).where(eq(logisticsLegs.shipmentId, id));
    for (const leg of legs) {
      const versements = await db.select().from(payoutSchedules).where(and(eq(payoutSchedules.sourceType, "logistics_leg"), eq(payoutSchedules.sourceId, leg.id)));
      for (const v of versements) {
        await db.delete(payoutAuditLog).where(eq(payoutAuditLog.scheduleId, v.id));
        await db.delete(walletTransactions).where(eq(walletTransactions.walletId, v.targetWalletId));
        await db.delete(wallets).where(eq(wallets.id, v.targetWalletId));
        await db.delete(payoutSchedules).where(eq(payoutSchedules.id, v.id));
      }
    }
    await db.delete(logisticsTrackingEvents).where(eq(logisticsTrackingEvents.shipmentId, id));
    await db.delete(logisticsAuditLog).where(eq(logisticsAuditLog.shipmentId, id));
    await db.delete(logisticsLegs).where(eq(logisticsLegs.shipmentId, id));
    await db.delete(logisticsQuotes).where(eq(logisticsQuotes.shipmentId, id));
    await db.delete(logisticsShipments).where(eq(logisticsShipments.id, id));
  }
  idsExpeditionsTest = [];
  if (idsDevisTest.length > 0) {
    await db.delete(logisticsQuotes).where(inArray(logisticsQuotes.id, idsDevisTest));
    idsDevisTest = [];
  }
  for (const id of idsConnexionsTest) {
    await db.delete(logisticsCarrierConnections).where(eq(logisticsCarrierConnections.id, id));
  }
  idsConnexionsTest = [];
  for (const id of idsClesTest) {
    await db.delete(logisticsApiKeys).where(eq(logisticsApiKeys.id, id));
  }
  idsClesTest = [];
  await db.delete(logisticsWebhookLog).where(inArray(logisticsWebhookLog.carrierCode, ["dpd", "chronopost"]));
}

async function main() {
  await nettoyer();

  // ── Carrier Connector Engine (§67-68) ──────────────────────────────────
  await assert.rejects(
    () => logistics.enregistrerConnexionTransporteur({ carrierCode: "transporteur_inexistant", method: "manuel", actorId: ACTOR_ID }),
    /Transporteur inconnu/i,
  );
  verif("1. transporteur hors catalogue refusé", true);

  const connexionApi = await logistics.enregistrerConnexionTransporteur({ carrierCode: "dpd", method: "api_rest", actorId: ACTOR_ID });
  idsConnexionsTest.push(connexionApi.id);
  verif("1. connecteur à secret manquant reste honnêtement not_connected", connexionApi.status === "not_connected");
  const testApi = await logistics.testerConnexionTransporteur(connexionApi.id, ACTOR_ID);
  verif("1. test honnête : jamais un succès fabriqué sans secret réel", testApi.ok === false && /NOT_CONNECTED/.test(testApi.motif));

  const connexionManuelle = await logistics.enregistrerConnexionTransporteur({ carrierCode: "dpd", method: "manuel", actorId: ACTOR_ID });
  idsConnexionsTest.push(connexionManuelle.id);
  verif("1. connecteur manuel configuré sans secret", connexionManuelle.status === "configured");
  const testManuel = await logistics.testerConnexionTransporteur(connexionManuelle.id, ACTOR_ID);
  verif("1. connecteur manuel réellement testable sans clé externe", testManuel.ok === true);

  // ── Delivery Quote Engine (§69) : véhicules (réel) ─────────────────────
  const devisVehicule = await logistics.genererDevis({ categorie: "vehicules", originePays: "FR", destinationPays: "FR", actorId: ACTOR_ID });
  idsDevisTest.push(devisVehicule.quoteId);
  verif("2. devis véhicules toujours en 3 tiers (ÉCONOMIQUE/RECOMMANDÉ/EXPRESS)", devisVehicule.options.length === 3 && devisVehicule.options.some((o) => o.tier === "RECOMMANDE"));
  const tierRecommande = devisVehicule.options.find((o) => o.tier === "RECOMMANDE")!;
  verif("2. tier RECOMMANDÉ délègue réellement au Vehicle Delivery Engine", tierRecommande.carrierCode === "vehicle_delivery_engine");
  verif("2. disponibilité cohérente avec le prix (jamais prix null + disponible)", !(tierRecommande.disponible && tierRecommande.prix === null));

  // ── Delivery Quote Engine : colis (honnêtement non connecté) ───────────
  const devisColis = await logistics.genererDevis({ categorie: "colis", originePays: "FR", destinationPays: "BE", actorId: ACTOR_ID });
  idsDevisTest.push(devisColis.quoteId);
  verif("3. devis colis toujours en 3 tiers", devisColis.options.length === 3);
  verif("3. aucun transporteur colis connecté aujourd'hui : chaque tier honnêtement indisponible", devisColis.options.every((o) => o.disponible === false && /NOT_CONNECTED/.test(o.motif)));
  verif("3. jamais un prix inventé pour un tier non disponible", devisColis.options.every((o) => o.prix === null));

  // ── Delivery Routing Engine (§70) ────────────────────────────────────
  const meilleure = logistics.choisirMeilleureOption([
    { tier: "ECONOMIQUE", carrierCode: "a", carrierLabel: "A", prix: 50, devise: "EUR", delaiJoursMin: 3, delaiJoursMax: 5, disponible: true, motif: "" },
    { tier: "RECOMMANDE", carrierCode: "b", carrierLabel: "B", prix: 40, devise: "EUR", delaiJoursMin: 2, delaiJoursMax: 4, disponible: true, motif: "" },
    { tier: "EXPRESS", carrierCode: "c", carrierLabel: "C", prix: 90, devise: "EUR", delaiJoursMin: 1, delaiJoursMax: 1, disponible: false, motif: "indisponible" },
  ]);
  verif("4. routage multi-facteurs : choisit le prix le plus bas parmi les options réellement disponibles", meilleure?.carrierCode === "b");
  const aucuneDisponible = logistics.choisirMeilleureOption([{ tier: "ECONOMIQUE", carrierCode: "a", carrierLabel: "A", prix: null, devise: "EUR", delaiJoursMin: null, delaiJoursMax: null, disponible: false, motif: "x" }]);
  verif("4. aucune option disponible → aucun choix (jamais un choix par défaut)", aucuneDisponible === null);

  await assert.rejects(() => logistics.choisirOptionDevis({ quoteId: devisColis.quoteId, tier: "ECONOMIQUE", actorId: ACTOR_ID }), /non disponible/i);
  verif("4. impossible de réserver un transporteur non connecté depuis un devis réel", true);

  // ── Multi-Leg Engine (§71) ────────────────────────────────────────────
  await assert.rejects(
    () =>
      logistics.creerExpedition({
        categorie: "colis",
        originePays: "FR",
        destinationPays: "DE",
        legs: [{ carrierCode: "transporteur_inconnu", mode: "route" }],
        actorId: ACTOR_ID,
      }),
    /Transporteur inconnu/i,
  );
  verif("5. leg avec transporteur hors catalogue refusé", true);

  const cinqLegs = Array.from({ length: 5 }, () => ({ carrierCode: "interne", mode: "route" }));
  await assert.rejects(() => logistics.creerExpedition({ categorie: "colis", originePays: "FR", destinationPays: "DE", legs: cinqLegs, actorId: ACTOR_ID }), /Maximum 4 legs/i);
  verif("5. plus de 4 legs refusé (MASTER SHIPMENT + LEG 1-4 au maximum)", true);

  const { shipment, legs } = await logistics.creerExpedition({
    categorie: "colis",
    originePays: "FR",
    origineVille: "Lyon",
    destinationPays: "DE",
    destinationVille: "Berlin",
    legs: [
      { carrierCode: "dpd", mode: "route", tarif: 30, responsabilite: "DPD jusqu'au hub", conditionPaiement: "port dû" },
      { carrierCode: "interne", mode: "route", tarif: 20, responsabilite: "MKA.P-MS dernier kilomètre", conditionPaiement: "prépayé" },
    ],
    actorId: ACTOR_ID,
  });
  idsExpeditionsTest.push(shipment.id);
  verif("5. MASTER SHIPMENT + 2 LEG créés réellement", legs.length === 2 && legs[0].legIndex === 1 && legs[1].legIndex === 2);
  verif("5. prix total = somme réelle des legs (30+20=50)", Number(shipment.totalPrice) === 50);
  verif("5. chaque leg garde sa propre responsabilité — jamais fusionnée", legs[0].responsabilite !== legs[1].responsabilite);
  verif("5. statut initial CREATED", shipment.status === "CREATED");

  const reserve = await logistics.reserverExpedition({ shipmentId: shipment.id, actorId: ACTOR_ID });
  verif("5. réservation réelle : premier leg BOOKED", reserve.status === "BOOKED");
  await assert.rejects(() => logistics.reserverExpedition({ shipmentId: shipment.id, actorId: ACTOR_ID }), /impossible/i);
  verif("5. double réservation refusée", true);

  // ── Tracking Engine (§72-73) : agrégation multi-legs ───────────────────
  await logistics.mettreAJourStatutLeg({ legId: legs[0].id, status: "PICKED_UP", source: "manuel", actorId: ACTOR_ID });
  let suivi = await logistics.obtenirSuiviExpedition(shipment.id);
  verif("6. statut agrégé = leg le MOINS avancé (leg2 encore CREATED)", suivi.expedition.status === "CREATED");

  await logistics.mettreAJourStatutLeg({ legId: legs[1].id, status: "IN_TRANSIT", source: "manuel", actorId: ACTOR_ID });
  suivi = await logistics.obtenirSuiviExpedition(shipment.id);
  verif("6. statut agrégé avance avec le leg le moins avancé (leg1=PICKED_UP < leg2=IN_TRANSIT)", suivi.expedition.status === "PICKED_UP");

  await logistics.mettreAJourStatutLeg({ legId: legs[1].id, status: "FAILED", source: "carrier_webhook", rawCarrierStatus: "colis perdu", actorId: null });
  suivi = await logistics.obtenirSuiviExpedition(shipment.id);
  verif("6. un statut urgent (FAILED) remonte immédiatement au niveau de l'expédition, jamais masqué", suivi.expedition.status === "FAILED");
  verif("6. historique de suivi réellement conservé (jamais écrasé)", suivi.evenements.length >= 3);

  // ── Preuves ────────────────────────────────────────────────────────────
  const avecPreuve = await logistics.ajouterPreuveLeg({ legId: legs[0].id, type: "signature", url: "https://exemple.test/signature.png" });
  verif("7. preuve ajoutée, jamais écrasée", avecPreuve.preuves.length === 1 && avecPreuve.preuves[0].type === "signature");

  // ── Webhook transporteur (§66) : signature réelle ──────────────────────
  const connexionWebhook = await logistics.enregistrerConnexionTransporteur({ carrierCode: "dpd", method: "webhook", secretRef: TEST_SECRET_ENV, actorId: ACTOR_ID });
  idsConnexionsTest.push(connexionWebhook.id);

  const sansSecret = await logistics.traiterWebhookTransporteur({ carrierCode: "chronopost", payload: { legId: legs[0].id, status: "DELIVERED" }, signatureHeader: "peu-importe" });
  verif("8. webhook pour un transporteur sans connexion configurée : honnêtement refusé", sansSecret.ok === false);

  const payload = { legId: legs[0].id, status: "DELIVERED" };
  const signatureCorrecte = createHash("sha256").update(process.env[TEST_SECRET_ENV]! + JSON.stringify(payload)).digest("hex");
  const webhookInvalide = await logistics.traiterWebhookTransporteur({ carrierCode: "dpd", payload, signatureHeader: "signature-fausse" });
  verif("8. signature invalide réellement rejetée", webhookInvalide.ok === false && /[Ss]ignature/.test(webhookInvalide.motif));

  const webhookValide = await logistics.traiterWebhookTransporteur({ carrierCode: "dpd", payload, signatureHeader: signatureCorrecte });
  verif("8. signature réelle acceptée et statut appliqué", webhookValide.ok === true);
  const legApresWebhook = await logistics.obtenirSuiviExpedition(shipment.id);
  verif("8. le leg concerné reflète bien le statut reçu par webhook", legApresWebhook.legs.find((l) => l.id === legs[0].id)?.status === "DELIVERED");

  const webhookStatutInconnu = await logistics.traiterWebhookTransporteur({
    carrierCode: "dpd",
    payload: { legId: legs[0].id, status: "STATUT_INVENTE" },
    signatureHeader: createHash("sha256").update(process.env[TEST_SECRET_ENV]! + JSON.stringify({ legId: legs[0].id, status: "STATUT_INVENTE" })).digest("hex"),
  });
  verif("8. statut transporteur non reconnu : rien appliqué sans donnée fiable", webhookStatutInconnu.ok === false);

  // ── API MKA.P-MS pour transporteurs (§74) : clés ───────────────────────
  const cle = await logistics.creerCleApiTransporteur({ carrierCode: "dpd", name: "Test DPD", actorId: ACTOR_ID });
  idsClesTest.push(cle.id);
  verif("9. clé API réelle générée, visible une seule fois", cle.apiKey.startsWith("mkalog_"));
  const verifOk = await logistics.verifierCleApiTransporteur(cle.apiKey);
  verif("9. vérification réelle de la clé : trouvée et carrierCode correct", verifOk?.carrierCode === "dpd");
  const verifKo = await logistics.verifierCleApiTransporteur("mkalog_fausse.cle");
  verif("9. clé invalide réellement rejetée", verifKo === null);
  const liste = await logistics.listerClesApiTransporteur();
  verif("9. le hash de la clé n'est jamais renvoyé", !("keyHash" in (liste.find((k) => k.id === cle.id) ?? {})));

  // ── Audit ──────────────────────────────────────────────────────────────
  const journal = await logistics.journalAudit(shipment.id);
  const actionsAttendues = ["logistics.shipment_created", "logistics.shipment_booked", "logistics.tracking_updated", "logistics.proof_added"];
  const actionsJournalisees = new Set(journal.map((j) => j.action));
  verif("10. chaque étape du pipeline est journalisée", actionsAttendues.every((a) => actionsJournalisees.has(a)));

  // ── MOS : health / feed / dashboard ─────────────────────────────────────
  const health = await logistics.healthStatus();
  verif("11. healthStatus répond avec au moins cette expédition de test", health.metrics.total >= 1);
  const feed = await logistics.controlCenterFeed();
  verif("11. controlCenterFeed déclare staging (aucun transporteur réel connecté)", feed.status === "staging");
  const dash = await logistics.dashboard();
  verif("11. dashboard expose des métriques business réelles", typeof dash.businessMetrics === "object");

  // ── Router : branché dans l'appRouter ────────────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const logisticsKeys = Object.keys(procs).filter((k) => k.startsWith("logisticsEngine."));
  for (const sub of [
    "logisticsEngine.meta",
    "logisticsEngine.enregistrerConnexion",
    "logisticsEngine.genererDevis",
    "logisticsEngine.choisirOption",
    "logisticsEngine.creerExpedition",
    "logisticsEngine.reserverExpedition",
    "logisticsEngine.mettreAJourStatut",
    "logisticsEngine.creerCleApi",
  ]) {
    verif(`Router : expose « ${sub} »`, logisticsKeys.includes(sub));
  }

  await nettoyer();

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exit(1);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
