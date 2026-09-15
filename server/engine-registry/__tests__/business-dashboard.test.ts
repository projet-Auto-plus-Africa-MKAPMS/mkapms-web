/**
 * Direction Business Dashboard + Ledger fournisseur/transporteur (LOT 7, §40)
 * — tests réels, base de données réelle. Couvre l'agrégation business
 * (chaque moteur isolé, un échec n'empêche jamais les autres), le Ledger
 * partagé (recherche/création par porteur, jamais deux wallets pour le même
 * fournisseur/transporteur), et le branchement réel avec le Payout Engine.
 *
 * Lancement : `npx tsx server/engine-registry/__tests__/business-dashboard.test.ts`
 */
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db } from "../../db.js";
import { wallets, walletTransactions } from "../../modules/wallet.js";
import { findOrCreateWallet, findOrCreatePlatformWallet, findWallet } from "../../modules/wallet-ledger.js";
import { businessDashboard } from "../business-dashboard.js";
import { payoutPolicies, payoutSchedules, payoutAuditLog } from "../../payout-engine/schema.js";
import * as payout from "../../payout-engine/service.js";
import { appRouter } from "../../router.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const SUPPLIER_ID = 920001;
const CARRIER_CODE = "chronopost";

let idsSchedules: number[] = [];
let idsPolicies: number[] = [];

async function nettoyer() {
  for (const id of idsSchedules) {
    await db.delete(payoutAuditLog).where(eq(payoutAuditLog.scheduleId, id));
    await db.delete(payoutSchedules).where(eq(payoutSchedules.id, id));
  }
  idsSchedules = [];
  for (const id of idsPolicies) await db.delete(payoutPolicies).where(eq(payoutPolicies.id, id));
  idsPolicies = [];
  const supplierWallet = await findWallet({ ownerType: "supplier", supplierProfileId: SUPPLIER_ID });
  if (supplierWallet) {
    await db.delete(walletTransactions).where(eq(walletTransactions.walletId, supplierWallet.id));
    await db.delete(wallets).where(eq(wallets.id, supplierWallet.id));
  }
  const carrierWallet = await findWallet({ ownerType: "carrier", carrierCode: CARRIER_CODE });
  if (carrierWallet) {
    await db.delete(walletTransactions).where(eq(walletTransactions.walletId, carrierWallet.id));
    await db.delete(wallets).where(eq(wallets.id, carrierWallet.id));
  }
  const [platform] = await db.select().from(wallets).where(eq(wallets.ownerType, "platform")).limit(1);
  if (platform) {
    await db.delete(walletTransactions).where(eq(walletTransactions.walletId, platform.id));
    await db.delete(wallets).where(eq(wallets.id, platform.id));
  }
}

async function main() {
  await nettoyer();

  // ── 1. Business Dashboard (§40) — agrégation réelle, isolée par moteur ──
  const report = await businessDashboard();
  verif("1. le rapport couvre les 6 moteurs LOT1-6 + paiement/comptabilité", report.sections.length === 9);
  verif("1b. chaque section réussit (base saine)", report.sections.every((s) => s.ok === true));
  const noms = report.sections.map((s) => s.engine);
  for (const attendu of ["supplier_engine", "vehicle_engine", "parts_engine", "logistics_engine", "payout_engine", "document_engine", "payment", "accounting_internal", "financial_intelligence"]) {
    verif(`1c. section "${attendu}" présente`, noms.includes(attendu));
  }

  // ── 2. Ledger partagé — jamais deux wallets pour le même porteur ───────
  const avant = await findWallet({ ownerType: "supplier", supplierProfileId: SUPPLIER_ID });
  verif("2. aucun wallet fournisseur avant création", avant === null);

  const w1 = await findOrCreateWallet({ ownerType: "supplier", supplierProfileId: SUPPLIER_ID }, "EUR");
  const w2 = await findOrCreateWallet({ ownerType: "supplier", supplierProfileId: SUPPLIER_ID }, "EUR");
  verif("2b. deux appels successifs renvoient le même wallet", w1.id === w2.id);

  const platform1 = await findOrCreatePlatformWallet();
  const platform2 = await findOrCreatePlatformWallet();
  verif("2c. le wallet plateforme est un singleton", platform1.id === platform2.id);

  // ── 3. Branchement réel avec le Payout Engine (LOT 5) ──────────────────
  const politique = await payout.createPolicy({ targetType: "carrier", carrierCode: CARRIER_CODE, splitCode: "100_livraison", requiresHumanValidation: false });
  idsPolicies.push(politique.id);
  const schedule = await payout.openPayoutSchedule({ sourceType: "logistics_leg", sourceId: 998877, targetType: "carrier", carrierCode: CARRIER_CODE, grossAmount: 200, commissionRatePct: 0, currency: "EUR" });
  idsSchedules.push(schedule.id);
  const walletCarrier = await findWallet({ ownerType: "carrier", carrierCode: CARRIER_CODE });
  verif("3. le versement a bien utilisé le Ledger partagé (wallet transporteur trouvable)", walletCarrier !== null && Number(walletCarrier!.soldeBloque) === 200);

  // ── 4. Exposition du router ─────────────────────────────────────────────
  const procs = (appRouter as unknown as { _def?: { procedures?: Record<string, unknown> } })._def?.procedures ?? {};
  const keys = Object.keys(procs);
  for (const sub of ["engineRegistry.businessDashboard", "wallet.walletForSupplier", "wallet.walletForCarrier", "wallet.transactionsFor", "wallet.payoutsFor"]) {
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
