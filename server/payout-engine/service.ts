/**
 * Payout Engine — service (LOT 5 du Plan Maître Fournisseurs, §32).
 *
 * Ce moteur ne détient aucun solde : il lit/écrit le Ledger existant
 * (`wallets`/`payouts`, server/modules/wallet.ts) via les helpers ci-dessous,
 * et journalise chaque décision. Money never moves without a policy: sans
 * politique explicite, la politique honnête par défaut (100 % à la
 * livraison, validation humaine obligatoire) s'applique.
 */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../db.js";
import { wallets, walletTransactions, payouts as ledgerPayouts } from "../modules/wallet.js";
import { findOrCreateWallet as findOrCreateLedgerWallet, findOrCreatePlatformWallet } from "../modules/wallet-ledger.js";
import { emitSafe } from "../event-bus/service.js";
import type { ControlCenterFeed, EngineDashboard, MaturityLevel } from "../identity-os/contract.js";
import {
  payoutPolicies,
  payoutSchedules,
  payoutAuditLog,
  payoutHealthLog,
} from "./schema.js";
import {
  DEFAULT_PAYOUT_SPLIT_CODE,
  findSplitPreset,
  validateStages,
  PAYOUT_ENGINE_META,
  type PayoutTargetType,
  type PayoutTrigger,
  type PayoutSourceType,
  type PayoutStageState,
} from "./contract.js";

const MATURITY: MaturityLevel = "sprint_1_minimal";

// ── Ledger : helpers génériques par type de porteur ───────────────────────
// Le Payout Engine consomme le Ledger sans jamais dupliquer sa table de
// soldes : ces helpers ne font que trouver/créer le wallet du bon porteur.

export interface WalletOwnerRef {
  targetType: PayoutTargetType;
  supplierProfileId?: number | null;
  carrierCode?: string | null;
}

async function findOrCreateWallet(owner: WalletOwnerRef, currency = "EUR") {
  return findOrCreateLedgerWallet(
    { ownerType: owner.targetType, supplierProfileId: owner.supplierProfileId, carrierCode: owner.carrierCode },
    currency,
  );
}

export { findOrCreatePlatformWallet };

async function blockOnWallet(walletId: number, amount: number, opts: { reference: string; description: string; sourceType: string; sourceId: number }) {
  await db.insert(walletTransactions).values({
    walletId,
    type: "blocage",
    montant: String(amount),
    reference: opts.reference,
    description: opts.description,
    sourceType: opts.sourceType,
    sourceId: opts.sourceId,
  });
  await db
    .update(wallets)
    .set({ soldeBloque: sql`${wallets.soldeBloque} + ${amount}`, totalEncaisse: sql`${wallets.totalEncaisse} + ${amount}`, updatedAt: new Date() })
    .where(eq(wallets.id, walletId));
}

async function creditOnWallet(walletId: number, amount: number, opts: { reference: string; description: string; sourceType: string; sourceId: number }) {
  await db.insert(walletTransactions).values({
    walletId,
    type: "credit",
    montant: String(amount),
    reference: opts.reference,
    description: opts.description,
    sourceType: opts.sourceType,
    sourceId: opts.sourceId,
  });
  await db
    .update(wallets)
    .set({ soldeDisponible: sql`${wallets.soldeDisponible} + ${amount}`, totalEncaisse: sql`${wallets.totalEncaisse} + ${amount}`, updatedAt: new Date() })
    .where(eq(wallets.id, walletId));
}

/** Débloque (soldeBloque → soldeDisponible) : c'est ici qu'un versement devient réellement retirable. */
async function releaseOnWallet(walletId: number, amount: number, opts: { reference: string; description: string; sourceType: string; sourceId: number }) {
  await db.insert(walletTransactions).values({
    walletId,
    type: "deblocage",
    montant: String(amount),
    reference: opts.reference,
    description: opts.description,
    sourceType: opts.sourceType,
    sourceId: opts.sourceId,
  });
  await db
    .update(wallets)
    .set({
      soldeBloque: sql`${wallets.soldeBloque} - ${amount}`,
      soldeDisponible: sql`${wallets.soldeDisponible} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.id, walletId));
}

// ── Politiques ──────────────────────────────────────────────────────────
export interface CreatePolicyInput {
  targetType: PayoutTargetType;
  supplierProfileId?: number | null;
  carrierCode?: string | null;
  contractRef?: string | null;
  splitCode: string;
  requiresHumanValidation?: boolean;
  createdBy?: number | null;
}

export async function createPolicy(input: CreatePolicyInput) {
  const preset = findSplitPreset(input.splitCode);
  if (!preset) throw new Error(`Préréglage de versement inconnu : ${input.splitCode}`);
  const err = validateStages(preset.stages);
  if (err) throw new Error(err);
  const [row] = await db
    .insert(payoutPolicies)
    .values({
      targetType: input.targetType,
      supplierProfileId: input.supplierProfileId ?? null,
      carrierCode: input.carrierCode ?? null,
      contractRef: input.contractRef ?? null,
      splitCode: input.splitCode,
      stages: preset.stages,
      requiresHumanValidation: input.requiresHumanValidation ?? true,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  return row;
}

/** Résout la politique la plus spécifique : contrat > partenaire > défaut honnête. */
export async function resolvePolicy(owner: WalletOwnerRef): Promise<{ policyId: number | null; splitCode: string; stages: { trigger: string; pct: number }[]; requiresHumanValidation: boolean }> {
  const conditions =
    owner.targetType === "supplier"
      ? and(eq(payoutPolicies.targetType, "supplier"), eq(payoutPolicies.supplierProfileId, owner.supplierProfileId!), eq(payoutPolicies.active, true))
      : and(eq(payoutPolicies.targetType, "carrier"), eq(payoutPolicies.carrierCode, owner.carrierCode!), eq(payoutPolicies.active, true));
  const rows = await db.select().from(payoutPolicies).where(conditions).orderBy(desc(payoutPolicies.createdAt));
  const specific = rows.find((r) => r.contractRef) ?? rows[0];
  if (specific) {
    return {
      policyId: specific.id,
      splitCode: specific.splitCode,
      stages: specific.stages,
      requiresHumanValidation: specific.requiresHumanValidation,
    };
  }
  const preset = findSplitPreset(DEFAULT_PAYOUT_SPLIT_CODE)!;
  return { policyId: null, splitCode: preset.code, stages: preset.stages, requiresHumanValidation: true };
}

export async function listPolicies(targetType?: PayoutTargetType) {
  if (targetType) return db.select().from(payoutPolicies).where(eq(payoutPolicies.targetType, targetType)).orderBy(desc(payoutPolicies.createdAt));
  return db.select().from(payoutPolicies).orderBy(desc(payoutPolicies.createdAt));
}

export async function setPolicyActive(id: number, active: boolean) {
  const [row] = await db.update(payoutPolicies).set({ active, updatedAt: new Date() }).where(eq(payoutPolicies.id, id)).returning();
  return row;
}

// ── Schedules ───────────────────────────────────────────────────────────
async function nextScheduleReference(): Promise<string> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(payoutSchedules);
  return `MKA-PAYOUT-${String((row?.count ?? 0) + 1).padStart(6, "0")}`;
}

export interface OpenScheduleInput {
  sourceType: PayoutSourceType;
  sourceId: number;
  targetType: PayoutTargetType;
  supplierProfileId?: number | null;
  carrierCode?: string | null;
  grossAmount: number;
  commissionRatePct?: number;
  currency: string;
}

async function audit(scheduleId: number | null, action: string, actorId: number | null, detail: Record<string, unknown>) {
  await db.insert(payoutAuditLog).values({ scheduleId, action, actorId, detail });
}

/**
 * Ouvre un versement planifié pour une vente/expédition. Bloque immédiatement
 * le montant net dû au fournisseur/transporteur (§29 "Montant bloqué"),
 * crédite la commission au wallet plateforme (revenu MKA.P-MS acquis dès la
 * vente, indépendamment du calendrier de versement au partenaire).
 */
export async function openPayoutSchedule(input: OpenScheduleInput) {
  const owner: WalletOwnerRef = {
    targetType: input.targetType,
    supplierProfileId: input.supplierProfileId ?? null,
    carrierCode: input.carrierCode ?? null,
  };
  const wallet = await findOrCreateWallet(owner, input.currency);
  const policy = await resolvePolicy(owner);

  const commissionRatePct = input.commissionRatePct ?? 0;
  const netAmount = Math.round((input.grossAmount / (1 + commissionRatePct / 100)) * 100) / 100;
  const commissionAmount = Math.round((input.grossAmount - netAmount) * 100) / 100;

  const stages: PayoutStageState[] = policy.stages.map((s) => ({
    trigger: s.trigger as PayoutTrigger,
    pct: s.pct,
    amount: Math.round(netAmount * (s.pct / 100) * 100) / 100,
    status: "pending",
  }));

  const reference = await nextScheduleReference();
  const [row] = await db
    .insert(payoutSchedules)
    .values({
      policyId: policy.policyId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
      targetType: input.targetType,
      supplierProfileId: owner.supplierProfileId,
      carrierCode: owner.carrierCode,
      targetWalletId: wallet.id,
      grossAmount: String(input.grossAmount),
      commissionRatePct: String(commissionRatePct),
      commissionAmount: String(commissionAmount),
      netAmount: String(netAmount),
      currency: input.currency.toUpperCase(),
      stages,
    })
    .returning();

  await blockOnWallet(wallet.id, netAmount, {
    reference,
    description: `Versement planifié #${row.id} (${input.sourceType} #${input.sourceId})`,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
  });

  if (commissionAmount > 0) {
    const platformWallet = await findOrCreatePlatformWallet(input.currency);
    await creditOnWallet(platformWallet.id, commissionAmount, {
      reference,
      description: `Commission MKA.P-MS — versement #${row.id}`,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    });
    await db.insert(walletTransactions).values({
      walletId: platformWallet.id,
      type: "commission",
      montant: "0",
      reference,
      description: `Commission enregistrée pour versement #${row.id}`,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    });
  }

  await audit(row.id, "schedule_opened", null, { sourceType: input.sourceType, sourceId: input.sourceId, netAmount, commissionAmount });
  return row;
}

export async function getSchedule(id: number) {
  const [row] = await db.select().from(payoutSchedules).where(eq(payoutSchedules.id, id)).limit(1);
  return row ?? null;
}

/** Idempotence pour les abonnés Event Bus : une remise rejouée ne doit jamais ouvrir un second versement pour la même source. */
export async function findScheduleBySource(sourceType: PayoutSourceType, sourceId: number) {
  const [row] = await db
    .select()
    .from(payoutSchedules)
    .where(and(eq(payoutSchedules.sourceType, sourceType), eq(payoutSchedules.sourceId, sourceId)))
    .limit(1);
  return row ?? null;
}

export async function listSchedules(opts?: { targetType?: PayoutTargetType; status?: string; limit?: number }) {
  const limit = opts?.limit ?? 200;
  const conditions = [
    opts?.targetType ? eq(payoutSchedules.targetType, opts.targetType) : undefined,
    opts?.status ? eq(payoutSchedules.status, opts.status) : undefined,
  ].filter(Boolean) as any[];
  const query = db.select().from(payoutSchedules).orderBy(desc(payoutSchedules.createdAt)).limit(limit);
  if (conditions.length > 0) return query.where(and(...conditions));
  return query;
}

function recomputeOverallStatus(stages: PayoutStageState[]): "pending" | "partial" | "completed" {
  if (stages.every((s) => s.status === "released")) return "completed";
  if (stages.some((s) => s.status === "released" || s.status === "validated" || s.status === "eligible")) return "partial";
  return "pending";
}

/**
 * Fait avancer une étape d'un versement quand son déclencheur métier survient
 * réellement (enlèvement effectué, livraison terminée…). Sans validation
 * humaine requise, l'étape se libère immédiatement ; sinon elle reste
 * "eligible" jusqu'à `validateStage`.
 */
export async function triggerStage(scheduleId: number, trigger: PayoutTrigger, opts?: { actorId?: number | null }) {
  const schedule = await getSchedule(scheduleId);
  if (!schedule) throw new Error(`Versement planifié inconnu : ${scheduleId}`);
  const stages = schedule.stages as PayoutStageState[];
  const stage = stages.find((s) => s.trigger === trigger && s.status === "pending");
  if (!stage) return schedule; // déjà déclenché, ou étape absente de cette politique — idempotent.

  const [policyRow] = schedule.policyId
    ? await db.select().from(payoutPolicies).where(eq(payoutPolicies.id, schedule.policyId)).limit(1)
    : [null];
  const requiresValidation = policyRow ? policyRow.requiresHumanValidation : true;

  const now = new Date().toISOString();
  if (requiresValidation) {
    stage.status = "eligible";
    stage.eligibleAt = now;
  } else {
    stage.status = "validated";
    stage.validatedAt = now;
  }

  const [updated] = await db
    .update(payoutSchedules)
    .set({ stages, status: recomputeOverallStatus(stages), updatedAt: new Date() })
    .where(eq(payoutSchedules.id, scheduleId))
    .returning();

  await audit(scheduleId, requiresValidation ? "stage_eligible" : "stage_auto_validated", opts?.actorId ?? null, { trigger, amount: stage.amount });
  await emitSafe({
    source: "payout_engine",
    type: "payout.eligible",
    payload: { scheduleId, targetType: schedule.targetType, trigger, amount: stage.amount, currency: schedule.currency },
  });

  if (!requiresValidation) {
    return releaseStage(scheduleId, trigger, opts);
  }
  return updated;
}

/** Décision humaine explicite (§32 "Validation humaine possible") : libère les fonds bloqués vers le disponible. */
export async function validateStage(scheduleId: number, trigger: PayoutTrigger, actorId: number) {
  const schedule = await getSchedule(scheduleId);
  if (!schedule) throw new Error(`Versement planifié inconnu : ${scheduleId}`);
  const stages = schedule.stages as PayoutStageState[];
  const stage = stages.find((s) => s.trigger === trigger);
  if (!stage) throw new Error(`Étape "${trigger}" absente de ce versement.`);
  if (stage.status !== "eligible") throw new Error(`Étape "${trigger}" au statut "${stage.status}" : rien à valider.`);
  stage.status = "validated";
  stage.validatedAt = new Date().toISOString();
  stage.validatedBy = actorId;
  await db.update(payoutSchedules).set({ stages, updatedAt: new Date() }).where(eq(payoutSchedules.id, scheduleId));
  await audit(scheduleId, "stage_validated", actorId, { trigger, amount: stage.amount });
  return releaseStage(scheduleId, trigger, { actorId });
}

async function releaseStage(scheduleId: number, trigger: PayoutTrigger, opts?: { actorId?: number | null }) {
  const schedule = await getSchedule(scheduleId);
  if (!schedule) throw new Error(`Versement planifié inconnu : ${scheduleId}`);
  const stages = schedule.stages as PayoutStageState[];
  const stage = stages.find((s) => s.trigger === trigger);
  if (!stage || stage.status !== "validated") throw new Error(`Étape "${trigger}" non prête à être libérée.`);

  await releaseOnWallet(schedule.targetWalletId, Number(stage.amount), {
    reference: `MKA-PAYOUT-${scheduleId}-${trigger}`,
    description: `Libération versement #${scheduleId} — étape ${trigger}`,
    sourceType: schedule.sourceType,
    sourceId: schedule.sourceId,
  });

  stage.status = "released";
  stage.releasedAt = new Date().toISOString();
  const [updated] = await db
    .update(payoutSchedules)
    .set({ stages, status: recomputeOverallStatus(stages), updatedAt: new Date() })
    .where(eq(payoutSchedules.id, scheduleId))
    .returning();

  await audit(scheduleId, "stage_released", opts?.actorId ?? null, { trigger, amount: stage.amount });
  await emitSafe({
    source: "payout_engine",
    type: "payout.released",
    payload: { scheduleId, targetType: schedule.targetType, trigger, amount: Number(stage.amount), currency: schedule.currency },
  });
  return updated;
}

export async function auditLog(scheduleId?: number, limit = 200) {
  if (scheduleId) return db.select().from(payoutAuditLog).where(eq(payoutAuditLog.scheduleId, scheduleId)).orderBy(desc(payoutAuditLog.createdAt)).limit(limit);
  return db.select().from(payoutAuditLog).orderBy(desc(payoutAuditLog.createdAt)).limit(limit);
}

// ── MOS trio ────────────────────────────────────────────────────────────
export async function healthStatus() {
  const start = Date.now();
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      pending: sql<number>`count(*) filter (where ${payoutSchedules.status} = 'pending')::int`,
      partial: sql<number>`count(*) filter (where ${payoutSchedules.status} = 'partial')::int`,
      completed: sql<number>`count(*) filter (where ${payoutSchedules.status} = 'completed')::int`,
    })
    .from(payoutSchedules);
  const report = {
    engine: PAYOUT_ENGINE_META.name,
    version: PAYOUT_ENGINE_META.version,
    status: "ok" as const,
    checkedAt: new Date().toISOString(),
    message: null,
    metrics: { ...totals, responseMs: Date.now() - start },
  };
  await db.insert(payoutHealthLog).values({ status: report.status, message: report.message, metrics: report.metrics });
  return report;
}

export async function controlCenterFeed(): Promise<ControlCenterFeed> {
  const startedAt = Date.now();
  const h = await healthStatus();
  return {
    engine: PAYOUT_ENGINE_META.name,
    label: PAYOUT_ENGINE_META.label,
    version: PAYOUT_ENGINE_META.version,
    maturityLevel: MATURITY,
    health: h.status,
    load: { events5m: 0, events24h: 0 },
    performance: { lastResponseMs: Date.now() - startedAt },
    errors: { last24h: 0 },
    lastSyncAt: new Date().toISOString(),
    status: "staging",
  };
}

export async function dashboard(): Promise<EngineDashboard> {
  const feed = await controlCenterFeed();
  const [byTarget] = await db
    .select({
      totalNet: sql<string>`coalesce(sum(${payoutSchedules.netAmount}), 0)`,
      totalCommission: sql<string>`coalesce(sum(${payoutSchedules.commissionAmount}), 0)`,
    })
    .from(payoutSchedules);
  const policies = await db.select({ count: sql<number>`count(*)::int` }).from(payoutPolicies);
  const parStatut = await db
    .select({ status: payoutSchedules.status, n: sql<number>`count(*)::int` })
    .from(payoutSchedules)
    .groupBy(payoutSchedules.status);
  const businessMetrics: Record<string, number | string | null> = {
    montant_net_total: byTarget?.totalNet ?? "0",
    montant_commission_total: byTarget?.totalCommission ?? "0",
    politiques_configurees: policies[0]?.count ?? 0,
  };
  for (const r of parStatut) businessMetrics[`versements_${r.status}`] = Number(r.n);
  return { ...feed, businessMetrics, recentEvents: [], recentErrors: [] };
}
