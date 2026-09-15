/**
 * Document Engine — LOT 6 du Plan Maître Fournisseurs (§33-35) : tests
 * réels, base de données réelle. Couvre le seed des types de documents
 * (Document OS), le Supplier Document Engine (écart vs baseline), le
 * Vehicle Document Engine, le Document Custody Engine (réception, remise
 * tracée, exigence par étape, blocage réel — jamais inventé sans exigence
 * déclarée), et le branchement réel du déclencheur "documents" du Payout
 * Engine (LOT 5) sur une réception de document.
 *
 * Lancement : `npx tsx server/document-engine/__tests__/document-engine.test.ts`
 */
import assert from "node:assert/strict";
import { eq, inArray } from "drizzle-orm";
import { db } from "../../db.js";
import { docDocuments, docTypes } from "../../document-os/index.js";
import { wallets, walletTransactions } from "../../modules/wallet.js";
import { payoutPolicies, payoutSchedules, payoutAuditLog } from "../../payout-engine/schema.js";
import * as payout from "../../payout-engine/service.js";
import {
  supplierDocuments,
  vehicleDocuments,
  custodyRecords,
  custodyRequirements,
  documentEngineAuditLog,
} from "../schema.js";
import * as docEngine from "../service.js";
import { SUPPLIER_DOCUMENT_TYPES, VEHICLE_DOCUMENT_TYPES } from "../contract.js";
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

const ACTOR_ID = 4;
const SUPPLIER_ID = 910001;
const VEHICLE_ID = 910002;
const CARRIER_CODE = "dhl";

let idsSupplierDocs: number[] = [];
let idsVehicleDocs: number[] = [];
let idsDocDocuments: number[] = [];
let idsCustody: number[] = [];
let idsRequirements: number[] = [];
let idsSchedules: number[] = [];
let idsPolicies: number[] = [];

async function nettoyer() {
  for (const id of idsSupplierDocs) await db.delete(supplierDocuments).where(eq(supplierDocuments.id, id));
  idsSupplierDocs = [];
  for (const id of idsVehicleDocs) await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, id));
  idsVehicleDocs = [];
  for (const id of idsCustody) {
    const [rec] = await db.select().from(custodyRecords).where(eq(custodyRecords.id, id)).limit(1);
    if (rec) await db.delete(documentEngineAuditLog).where(eq(documentEngineAuditLog.entityType, rec.entityType));
    await db.delete(custodyRecords).where(eq(custodyRecords.id, id));
  }
  idsCustody = [];
  for (const id of idsRequirements) await db.delete(custodyRequirements).where(eq(custodyRequirements.id, id));
  idsRequirements = [];
  if (idsDocDocuments.length > 0) {
    await db.delete(docDocuments).where(inArray(docDocuments.id, idsDocDocuments));
    idsDocDocuments = [];
  }
  await db.delete(documentEngineAuditLog).where(eq(documentEngineAuditLog.entityId, SUPPLIER_ID));
  await db.delete(documentEngineAuditLog).where(eq(documentEngineAuditLog.entityId, VEHICLE_ID));
  for (const id of idsSchedules) {
    await db.delete(payoutAuditLog).where(eq(payoutAuditLog.scheduleId, id));
    const [sch] = await db.select().from(payoutSchedules).where(eq(payoutSchedules.id, id)).limit(1);
    if (sch) {
      await db.delete(walletTransactions).where(eq(walletTransactions.walletId, sch.targetWalletId));
      await db.delete(wallets).where(eq(wallets.id, sch.targetWalletId));
    }
    await db.delete(documentEngineAuditLog).where(eq(documentEngineAuditLog.entityId, id));
    await db.delete(custodyRecords).where(eq(custodyRecords.entityId, id));
    await db.delete(payoutSchedules).where(eq(payoutSchedules.id, id));
  }
  idsSchedules = [];
  for (const id of idsPolicies) await db.delete(payoutPolicies).where(eq(payoutPolicies.id, id));
  idsPolicies = [];
  const [platform] = await db.select().from(wallets).where(eq(wallets.ownerType, "platform")).limit(1);
  if (platform) {
    await db.delete(walletTransactions).where(eq(walletTransactions.walletId, platform.id));
    await db.delete(wallets).where(eq(wallets.id, platform.id));
  }
}

async function main() {
  await nettoyer();

  // ── 1. Seed des types de documents (Document OS) ───────────────────────
  // `doc_types` est un registre permanent (même patron que
  // `payment_providers`) : ce test peut s'exécuter sur une base déjà
  // ensemencée par un run précédent — on vérifie l'invariant réel (tous les
  // types attendus existent), pas le nombre de lignes insérées CE run-ci.
  await docEngine.seedDocumentTypes();
  const seed2 = await docEngine.seedDocumentTypes();
  verif("1. second seed idempotent (rien inséré une fois le registre complet)", seed2.inserted === 0);
  const typesEnBase = await db.select({ code: docTypes.code }).from(docTypes);
  const codesConnus = new Set(typesEnBase.map((t) => t.code));
  const tousPresents = [...SUPPLIER_DOCUMENT_TYPES, ...VEHICLE_DOCUMENT_TYPES].every((c) => codesConnus.has(c));
  verif("1b. tous les types fournisseur/véhicule attendus sont enregistrés dans Document OS", tousPresents);

  // ── 2. Supplier Document Engine (§33) ───────────────────────────────────
  const gapsAvant = await docEngine.supplierDocumentGaps(SUPPLIER_ID);
  verif("2. sans document enregistré, toute la baseline manque", gapsAvant.missing.length === gapsAvant.required.length && gapsAvant.missing.length > 0);

  const supDoc = await docEngine.registerSupplierDocument({ supplierProfileId: SUPPLIER_ID, docType: "convention_cadre", actorId: ACTOR_ID });
  idsSupplierDocs.push(supDoc.id);
  idsDocDocuments.push(supDoc.docDocumentId!);
  verif("2b. document fournisseur créé avec une ligne Document OS réelle", supDoc.docDocumentId !== null);

  const [docRow] = await db.select().from(docDocuments).where(eq(docDocuments.id, supDoc.docDocumentId!)).limit(1);
  verif("2c. la ligne Document OS est bien liée au fournisseur (linkedEntityType/Id)", docRow?.linkedEntityType === "supplier_profile" && docRow?.linkedEntityId === SUPPLIER_ID);

  const gapsApres = await docEngine.supplierDocumentGaps(SUPPLIER_ID);
  verif("2d. la convention cadre n'est plus dans les manques", !gapsApres.missing.includes("convention_cadre") && gapsApres.missing.length === gapsAvant.missing.length - 1);

  // ── 3. Vehicle Document Engine (§34) ────────────────────────────────────
  const vehDoc = await docEngine.registerVehicleDocument({ vehicleItemId: VEHICLE_ID, docType: "coc", actorId: ACTOR_ID });
  idsVehicleDocs.push(vehDoc.id);
  idsDocDocuments.push(vehDoc.docDocumentId!);
  const listeVeh = await docEngine.listVehicleDocuments(VEHICLE_ID);
  verif("3. document véhicule listé", listeVeh.some((d) => d.id === vehDoc.id && d.docType === "coc"));

  const readinessAvant = await docEngine.computeVehicleExportReadiness(VEHICLE_ID);
  verif("3b. sans exigence déclarée pour 'export', jamais de blocage inventé", readinessAvant.blocked === false && readinessAvant.missing.length === 0);

  // ── 4. Document Custody Engine (§35) — exigence et blocage réel ────────
  const req1 = await docEngine.defineCustodyRequirement({ entityType: "vehicle_item", step: "export", docType: "carte_grise", mandatory: true, actorId: ACTOR_ID });
  idsRequirements.push(req1.id);
  const req2 = await docEngine.defineCustodyRequirement({ entityType: "vehicle_item", step: "export", docType: "douane", mandatory: true, actorId: ACTOR_ID });
  idsRequirements.push(req2.id);

  const blocageAvant = await docEngine.checkStepBlocking({ entityType: "vehicle_item", entityId: VEHICLE_ID, step: "export" });
  verif("4. avec 2 exigences déclarées et 0 document en possession, l'étape est bloquée", blocageAvant.blocked === true && blocageAvant.missing.length === 2);

  const custody1 = await docEngine.receiveCustody({ entityType: "vehicle_item", entityId: VEHICLE_ID, docType: "carte_grise", currentHolder: "MKA.P-MS — coffre Paris", actorId: ACTOR_ID });
  idsCustody.push(custody1!.id);
  verif("4b. document reçu passe au statut 'en_possession'", custody1!.status === "en_possession" && custody1!.receivedAt !== null);

  const blocageIntermediaire = await docEngine.checkStepBlocking({ entityType: "vehicle_item", entityId: VEHICLE_ID, step: "export" });
  verif("4c. un seul document reçu sur deux exigés : toujours bloqué, un seul manquant", blocageIntermediaire.blocked === true && blocageIntermediaire.missing.length === 1 && blocageIntermediaire.missing[0] === "douane");

  const custody2 = await docEngine.receiveCustody({ entityType: "vehicle_item", entityId: VEHICLE_ID, docType: "douane", currentHolder: "MKA.P-MS — coffre Paris", actorId: ACTOR_ID });
  idsCustody.push(custody2!.id);
  const blocageApres = await docEngine.checkStepBlocking({ entityType: "vehicle_item", entityId: VEHICLE_ID, step: "export" });
  verif("4d. les deux documents reçus : plus aucun blocage", blocageApres.blocked === false);

  // ── 5. Remise tracée (jamais silencieuse) ───────────────────────────────
  const remis = await docEngine.handOverCustody({ custodyId: custody1!.id, recipient: "Client final", proofOfHandover: "signature://abc123", actorId: ACTOR_ID });
  verif("5. remise correctement tracée (destinataire + preuve)", remis!.status === "remis" && remis!.recipient === "Client final" && remis!.proofOfHandover === "signature://abc123");
  await assert.rejects(() => docEngine.handOverCustody({ custodyId: custody1!.id, recipient: "Autre", proofOfHandover: "x", actorId: ACTOR_ID }), /seul un document en possession/i);
  verif("5b. impossible de remettre deux fois le même document", true);

  // ── 6. Branchement réel avec le Payout Engine (LOT 5) ───────────────────
  const politiqueDocuments = await payout.createPolicy({ targetType: "carrier", carrierCode: CARRIER_CODE, splitCode: "100_documents", requiresHumanValidation: false });
  idsPolicies.push(politiqueDocuments.id);
  const schedule = await payout.openPayoutSchedule({ sourceType: "logistics_leg", sourceId: 999999, targetType: "carrier", carrierCode: CARRIER_CODE, grossAmount: 500, commissionRatePct: 0, currency: "EUR" });
  idsSchedules.push(schedule.id);
  verif("6. versement ouvert avec une politique '100% à réception des documents'", (schedule.stages as any[])[0].trigger === "documents");

  const reqVersement = await docEngine.defineCustodyRequirement({ entityType: "payout_schedule", step: "versement", docType: "facture_fournisseur", mandatory: true, actorId: ACTOR_ID });
  idsRequirements.push(reqVersement.id);

  const handlerTrigger = getHandler("payout_document_trigger")!;
  verif("6b. le traitement 'payout_document_trigger' est branché", handlerTrigger !== null);

  // Réception d'un document SANS lien avec un versement : aucun effet.
  const custodyHorsVersement = await docEngine.receiveCustody({ entityType: "vehicle_item", entityId: VEHICLE_ID, docType: "entretien", currentHolder: "Garage X", actorId: ACTOR_ID });
  idsCustody.push(custodyHorsVersement!.id);
  await handlerTrigger({ entityType: "vehicle_item", entityId: VEHICLE_ID, docType: "entretien" }, { type: "document.custody.received", source: "document_engine" });
  const scheduleInchangee = await payout.getSchedule(schedule.id);
  verif("6c. une réception hors versement n'affecte jamais un versement en cours", (scheduleInchangee!.stages as any[])[0].status === "pending");

  // Réception RÉELLE de la pièce exigée pour CE versement précis.
  const custodyVersement = await docEngine.receiveCustody({ entityType: "payout_schedule", entityId: schedule.id, docType: "facture_fournisseur", currentHolder: "MKA.P-MS", actorId: ACTOR_ID });
  idsCustody.push(custodyVersement!.id);
  await handlerTrigger({ entityType: "payout_schedule", entityId: schedule.id, docType: "facture_fournisseur" }, { type: "document.custody.received", source: "document_engine" });
  const scheduleDeclenchee = await payout.getSchedule(schedule.id);
  verif("6d. la réception réelle de la pièce déclenche l'étape 'documents' du versement (libération immédiate, sans validation humaine)", (scheduleDeclenchee!.stages as any[])[0].status === "released" && scheduleDeclenchee!.status === "completed");

  // ── 7. Journal d'audit ───────────────────────────────────────────────
  const journal = await docEngine.auditLog("supplier_profile", SUPPLIER_ID);
  verif("7. journal d'audit fournisseur non vide", journal.some((j) => j.action === "supplier_document_registered"));

  // ── 8. Exposition du router ──────────────────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const docKeys = Object.keys(procs).filter((k) => k.startsWith("documentEngine."));
  for (const sub of [
    "documentEngine.meta",
    "documentEngine.registerSupplierDocument",
    "documentEngine.registerVehicleDocument",
    "documentEngine.receiveCustody",
    "documentEngine.handOverCustody",
    "documentEngine.defineCustodyRequirement",
    "documentEngine.checkStepBlocking",
  ]) {
    verif(`Router : expose « ${sub} »`, docKeys.includes(sub));
  }

  // ── 9. Santé du moteur ────────────────────────────────────────────────
  const health = await docEngine.healthStatus();
  verif("9. healthStatus renvoie un statut ok", health.status === "ok");

  // ── 10. Tableau de bord (MOS trio) ─────────────────────────────────────
  const board = await docEngine.dashboard();
  verif("10a. dashboard() rapporte le health/statut MOS standard", board.engine === "document_engine" && ["ok", "degraded", "down"].includes(board.health));
  verif("10b. dashboard() rapporte des métriques métier réelles (jamais vides)", Object.keys(board.businessMetrics).length > 0);
  verif(
    "10c. dashboard() compte les réceptions réelles encore en possession de ce test (custody1 a été remis au 156, donc 3 sur 4)",
    Number(board.businessMetrics.possession_en_possession ?? 0) >= 3,
  );

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
