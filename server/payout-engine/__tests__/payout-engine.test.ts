/**
 * Payout Engine — LOT 5 du Plan Maître Fournisseurs (§32) : tests réels, base
 * de données réelle. Couvre les politiques (défaut honnête, préréglages
 * 50/50/30/70/100%), l'ouverture d'un versement (blocage Ledger + commission
 * plateforme), le déclenchement d'étape (auto-libération sans validation
 * requise, blocage en attente de validation humaine), l'idempotence, et le
 * branchement Event Bus réel (vente véhicule, leg logistique livré).
 *
 * Lancement : `npx tsx server/payout-engine/__tests__/payout-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { wallets, walletTransactions } from "../../modules/wallet.js";
import { vehicleItems, vehiclePricing } from "../../vehicle-engine/schema.js";
import { logisticsShipments, logisticsLegs } from "../../logistics-engine/schema.js";
import { payoutPolicies, payoutSchedules, payoutAuditLog } from "../schema.js";
import * as payout from "../service.js";
import { getHandler } from "../../event-bus/handlers.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const SUPPLIER_A = 900001;
const SUPPLIER_B = 900002;
const CARRIER_CODE = "dhl";

let idsSchedules: number[] = [];
let idsPolicies: number[] = [];
let idsVehicleItems: number[] = [];
let idsLegs: number[] = [];
let idsShipments: number[] = [];

async function nettoyerWallets(supplierProfileIds: number[], carrierCodes: string[]) {
  const rows = await db.select().from(wallets).where(inArray(wallets.supplierProfileId, supplierProfileIds));
  const carrierRows = await db.select().from(wallets).where(inArray(wallets.carrierCode, carrierCodes));
  const platformRows = await db.select().from(wallets).where(eq(wallets.ownerType, "platform"));
  for (const w of [...rows, ...carrierRows, ...platformRows]) {
    await db.delete(walletTransactions).where(eq(walletTransactions.walletId, w.id));
    await db.delete(wallets).where(eq(wallets.id, w.id));
  }
}

async function nettoyer() {
  for (const id of idsSchedules) {
    await db.delete(payoutAuditLog).where(eq(payoutAuditLog.scheduleId, id));
    await db.delete(payoutSchedules).where(eq(payoutSchedules.id, id));
  }
  idsSchedules = [];
  for (const id of idsPolicies) {
    await db.delete(payoutPolicies).where(eq(payoutPolicies.id, id));
  }
  idsPolicies = [];
  for (const id of idsLegs) {
    await db.delete(logisticsLegs).where(eq(logisticsLegs.id, id));
  }
  idsLegs = [];
  for (const id of idsShipments) {
    await db.delete(logisticsShipments).where(eq(logisticsShipments.id, id));
  }
  idsShipments = [];
  for (const id of idsVehicleItems) {
    await db.delete(vehiclePricing).where(eq(vehiclePricing.vehicleItemId, id));
    await db.delete(vehicleItems).where(eq(vehicleItems.id, id));
  }
  idsVehicleItems = [];
  await nettoyerWallets([SUPPLIER_A, SUPPLIER_B], [CARRIER_CODE]);
}

async function main() {
  await nettoyer();

  // ── 1. Politique par défaut honnête ────────────────────────────────────
  const defaut = await payout.resolvePolicy({ targetType: "supplier", supplierProfileId: SUPPLIER_A });
  verif("1. sans politique configurée, défaut = 100% à la livraison", defaut.splitCode === "100_livraison" && defaut.stages.length === 1 && defaut.stages[0].trigger === "livraison" && defaut.stages[0].pct === 100);
  verif("1b. la politique par défaut exige toujours une validation humaine", defaut.requiresHumanValidation === true);

  // ── 2. Création de politique 50/50, sans validation requise ────────────
  const politique5050 = await payout.createPolicy({
    targetType: "supplier",
    supplierProfileId: SUPPLIER_A,
    splitCode: "50_50_enlevement_livraison",
    requiresHumanValidation: false,
  });
  idsPolicies.push(politique5050.id);
  verif("2. politique 50/50 créée avec 2 étapes", (politique5050.stages as any[]).length === 2);
  await assert.rejects(() => payout.createPolicy({ targetType: "supplier", supplierProfileId: SUPPLIER_A, splitCode: "code_inconnu" }), /inconnu/i);

  // ── 3. Ouverture d'un versement (véhicule vendu, commission 10%) ───────
  const schedule = await payout.openPayoutSchedule({
    sourceType: "vehicle_sale",
    sourceId: 777001,
    targetType: "supplier",
    supplierProfileId: SUPPLIER_A,
    grossAmount: 1100,
    commissionRatePct: 10,
    currency: "EUR",
  });
  idsSchedules.push(schedule.id);
  verif("3. montant net correct (1100 / 1.10 = 1000)", Math.abs(Number(schedule.netAmount) - 1000) < 0.01);
  verif("3b. commission correcte (100)", Math.abs(Number(schedule.commissionAmount) - 100) < 0.01);
  verif("3c. répartition 50/50 = 500/500", (schedule.stages as any[])[0].amount === 500 && (schedule.stages as any[])[1].amount === 500);
  verif("3d. statut initial pending", schedule.status === "pending");

  const walletSupplierA = await db.select().from(wallets).where(eq(wallets.supplierProfileId, SUPPLIER_A)).limit(1);
  verif("3e. wallet fournisseur créé avec le montant net bloqué", walletSupplierA.length === 1 && Math.abs(Number(walletSupplierA[0].soldeBloque) - 1000) < 0.01);

  const walletPlatform = await db.select().from(wallets).where(eq(wallets.ownerType, "platform")).limit(1);
  verif("3f. wallet plateforme crédité de la commission", walletPlatform.length === 1 && Math.abs(Number(walletPlatform[0].soldeDisponible) - 100) < 0.01);

  // ── 4. Déclenchement sans validation requise → libération immédiate ────
  await payout.triggerStage(schedule.id, "enlevement");
  const apres1 = await payout.getSchedule(schedule.id);
  verif("4. étape enlèvement libérée automatiquement (pas de validation requise)", (apres1!.stages as any[]).find((s: any) => s.trigger === "enlevement").status === "released");
  verif("4b. statut global partiel (une étape sur deux)", apres1!.status === "partial");

  const walletApres1 = await db.select().from(wallets).where(eq(wallets.id, walletSupplierA[0].id)).limit(1);
  verif("4c. 500 disponibles / 500 encore bloqués", Math.abs(Number(walletApres1[0].soldeDisponible) - 500) < 0.01 && Math.abs(Number(walletApres1[0].soldeBloque) - 500) < 0.01);

  // Idempotence : redéclencher la même étape ne fait rien de plus.
  await payout.triggerStage(schedule.id, "enlevement");
  const walletApresRepeat = await db.select().from(wallets).where(eq(wallets.id, walletSupplierA[0].id)).limit(1);
  verif("4d. redéclencher une étape déjà libérée est sans effet (idempotent)", Math.abs(Number(walletApresRepeat[0].soldeDisponible) - 500) < 0.01);

  await payout.triggerStage(schedule.id, "livraison");
  const complet = await payout.getSchedule(schedule.id);
  verif("4e. versement complété une fois toutes les étapes libérées", complet!.status === "completed");

  // ── 5. Politique avec validation humaine requise (transporteur) ────────
  const politiqueCarrier = await payout.createPolicy({
    targetType: "carrier",
    carrierCode: CARRIER_CODE,
    splitCode: "100_livraison",
    requiresHumanValidation: true,
  });
  idsPolicies.push(politiqueCarrier.id);
  const scheduleCarrier = await payout.openPayoutSchedule({
    sourceType: "logistics_leg",
    sourceId: 888001,
    targetType: "carrier",
    carrierCode: CARRIER_CODE,
    grossAmount: 300,
    commissionRatePct: 0,
    currency: "EUR",
  });
  idsSchedules.push(scheduleCarrier.id);
  await payout.triggerStage(scheduleCarrier.id, "livraison");
  const eligible = await payout.getSchedule(scheduleCarrier.id);
  verif("5. étape reste 'eligible' tant que la validation humaine n'a pas eu lieu", (eligible!.stages as any[])[0].status === "eligible");
  const walletCarrierAvant = await db.select().from(wallets).where(eq(wallets.carrierCode, CARRIER_CODE)).limit(1);
  verif("5b. aucun fonds libéré avant validation", Number(walletCarrierAvant[0].soldeDisponible) === 0);

  await assert.rejects(() => payout.validateStage(scheduleCarrier.id, "enlevement", 4), /absente/i);

  await payout.validateStage(scheduleCarrier.id, "livraison", 4);
  const valide = await payout.getSchedule(scheduleCarrier.id);
  verif("5c. validation humaine libère les fonds", (valide!.stages as any[])[0].status === "released" && valide!.status === "completed");
  const walletCarrierApres = await db.select().from(wallets).where(eq(wallets.carrierCode, CARRIER_CODE)).limit(1);
  verif("5d. wallet transporteur crédité après validation", Math.abs(Number(walletCarrierApres[0].soldeDisponible) - 300) < 0.01);

  // ── 6. Journal d'audit complet ──────────────────────────────────────────
  const journal = await payout.auditLog(schedule.id);
  const actions = journal.map((j) => j.action);
  verif("6. journal d'audit couvre ouverture + déclenchement + libération", actions.includes("schedule_opened") && actions.filter((a) => a === "stage_released").length === 2);

  // ── 7. Branchement Event Bus — vente véhicule réelle ───────────────────
  const [item] = await db
    .insert(vehicleItems)
    .values({ reference: "MKA-PAYOUT-TEST-V1", supplierProfileId: SUPPLIER_B, supplierVehicleId: "SUP-PAYOUT-1", ingestMethod: "manuel", status: "SOLD" })
    .returning();
  idsVehicleItems.push(item.id);
  await db.insert(vehiclePricing).values({
    vehicleItemId: item.id,
    supplierPrice: "9000",
    supplierCurrency: "EUR",
    commissionRatePct: "5",
    publicPrice: "9450",
    publicCurrency: "EUR",
  });
  const handlerVendu = getHandler("payout_vehicule_vendu")!;
  verif("7. le traitement 'payout_vehicule_vendu' est branché", handlerVendu !== null);
  await handlerVendu({ vehicleItemId: item.id }, { type: "vehicule.vendu", source: "vehicle_engine" });
  const scheduleVehicule = await payout.findScheduleBySource("vehicle_sale", item.id);
  idsSchedules.push(scheduleVehicule!.id);
  verif("7b. un versement fournisseur a bien été planifié à la vente", scheduleVehicule !== null && scheduleVehicule!.targetType === "supplier" && scheduleVehicule!.supplierProfileId === SUPPLIER_B);
  verif("7c. montant net dérivé du prix public et de la commission (9450/1.05 = 9000)", Math.abs(Number(scheduleVehicule!.netAmount) - 9000) < 0.01);

  // Idempotence de la remise (rejouer l'événement ne double pas le versement).
  await handlerVendu({ vehicleItemId: item.id }, { type: "vehicule.vendu", source: "vehicle_engine" });
  const doublons = await db.select().from(payoutSchedules).where(eq(payoutSchedules.sourceId, item.id));
  verif("7d. rejouer l'événement de vente ne crée pas un second versement", doublons.filter((s) => s.sourceType === "vehicle_sale").length === 1);

  // ── 8. Branchement Event Bus — leg logistique livré ────────────────────
  const [shipment] = await db
    .insert(logisticsShipments)
    .values({ reference: "MKA-PAYOUT-SHIP-1", categorie: "colis", status: "CREATED" })
    .returning();
  idsShipments.push(shipment.id);
  const [leg] = await db
    .insert(logisticsLegs)
    .values({ shipmentId: shipment.id, legIndex: 1, carrierCode: CARRIER_CODE, mode: "route", tarif: "150", devise: "EUR", status: "CREATED" })
    .returning();
  idsLegs.push(leg.id);
  const handlerLeg = getHandler("payout_logistics_leg_stage")!;
  verif("8. le traitement 'payout_logistics_leg_stage' est branché", handlerLeg !== null);
  await handlerLeg({ shipmentId: shipment.id, legId: leg.id }, { type: "delivery.completed", source: "logistics_engine" });
  const scheduleLeg = await payout.findScheduleBySource("logistics_leg", leg.id);
  idsSchedules.push(scheduleLeg!.id);
  verif("8b. un versement transporteur a bien été planifié à la livraison du leg", scheduleLeg !== null && scheduleLeg!.targetType === "carrier" && scheduleLeg!.carrierCode === CARRIER_CODE);

  // Leg interne (convoyage MKA.P-MS) : jamais de versement transporteur.
  const [legInterne] = await db
    .insert(logisticsLegs)
    .values({ shipmentId: shipment.id, legIndex: 2, carrierCode: "interne", mode: "route", tarif: "0", devise: "EUR", status: "CREATED" })
    .returning();
  idsLegs.push(legInterne.id);
  await handlerLeg({ shipmentId: shipment.id, legId: legInterne.id }, { type: "delivery.completed", source: "logistics_engine" });
  const scheduleInterne = await payout.findScheduleBySource("logistics_leg", legInterne.id);
  verif("8c. aucun versement planifié pour un leg interne", scheduleInterne === null);

  // ── 8d. Tableau de bord (MOS trio) ────────────────────────────────────
  const board = await payout.dashboard();
  verif("dashboard() rapporte le health/statut MOS standard", board.engine === "payout_engine" && ["ok", "degraded", "down"].includes(board.health));
  verif("dashboard() rapporte des métriques métier réelles (jamais vides)", Object.keys(board.businessMetrics).length > 0);
  verif(
    "dashboard() compte au moins le versement transporteur créé au test 8b",
    Number(board.businessMetrics[`versements_${scheduleLeg!.status}`] ?? 0) >= 1,
  );

  // ── 9. Exposition du router ──────────────────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const payoutKeys = Object.keys(procs).filter((k) => k.startsWith("payoutEngine."));
  for (const sub of [
    "payoutEngine.meta",
    "payoutEngine.createPolicy",
    "payoutEngine.listPolicies",
    "payoutEngine.listSchedules",
    "payoutEngine.triggerStage",
    "payoutEngine.validateStage",
  ]) {
    verif(`Router : expose « ${sub} »`, payoutKeys.includes(sub));
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
