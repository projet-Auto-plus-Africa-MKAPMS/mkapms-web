/**
 * MKA.P-MS Payment Engine — Service (logique métier).
 *
 * Le Payment Engine détient les règles MKA.P-MS : génération de la référence
 * interne, gestion des statuts (journalisée), virements attendus, remboursements,
 * RIB professionnels, règles par pays. Stripe reste un simple connecteur.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../db.js";
import {
  paymentTransactions,
  paymentEvents,
  paymentBankTransfers,
  paymentRefunds,
  paymentProRib,
  paymentCountryRules,
} from "./schema.js";
import {
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
} from "./constants.js";

// ── Référence interne ──────────────────────────────────────────────────────
// Format : MKA-PAY-{PAYS}-{ANNEE}-{SEQ6}. Ex: MKA-PAY-FR-2026-000001
async function nextReference(countryCode: string): Promise<string> {
  const cc = (countryCode || "FR").toUpperCase().slice(0, 3);
  const year = new Date().getFullYear();
  const prefix = `MKA-PAY-${cc}-${year}-`;
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(paymentTransactions)
    .where(sql`${paymentTransactions.reference} LIKE ${prefix + "%"}`);
  const seq = (row?.count ?? 0) + 1;
  return prefix + String(seq).padStart(6, "0");
}

export interface CreateTransactionInput {
  userId?: number;
  entityType?: string;
  entityId?: string;
  univers?: string;
  service?: string;
  amount: number;
  currency?: string;
  method?: PaymentMethod;
  countryCode?: string;
  metadata?: unknown;
  legacyPaymentId?: number;
}

/**
 * Crée une transaction interne avec référence unique. Nouvelle tentative en cas
 * de collision de référence (course entre deux créations simultanées).
 */
export async function createTransaction(input: CreateTransactionInput) {
  const country = input.countryCode ?? "FR";
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = await nextReference(country);
    try {
      const [row] = await db
        .insert(paymentTransactions)
        .values({
          reference,
          userId: input.userId ?? null,
          entityType: input.entityType ?? "other",
          entityId: input.entityId ?? null,
          univers: input.univers ?? null,
          service: input.service ?? null,
          amount: String(input.amount),
          currency: input.currency ?? "EUR",
          method: input.method ?? "card",
          status: "cree",
          countryCode: country.toUpperCase().slice(0, 3),
          legacyPaymentId: input.legacyPaymentId ?? null,
          metadata: (input.metadata as object) ?? null,
        })
        .returning();
      await db.insert(paymentEvents).values({
        transactionId: row.id,
        type: "created",
        toStatus: "cree",
        data: { method: row.method, amount: row.amount },
      });
      return row;
    } catch (err) {
      // Collision de référence unique → nouvel essai.
      if (attempt === 4) throw err;
    }
  }
  throw new Error("Impossible de générer une référence de paiement unique");
}

export async function getTransaction(id: number) {
  const [row] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.id, id))
    .limit(1);
  return row ?? null;
}

export async function getByReference(reference: string) {
  const [row] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.reference, reference))
    .limit(1);
  return row ?? null;
}

export async function listByUser(userId: number, limit = 100) {
  return db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.userId, userId))
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(limit);
}

/** Change le statut d'une transaction (journalisé). */
export async function setStatus(
  id: number,
  status: PaymentStatus,
  opts?: { data?: unknown; type?: string },
) {
  if (!PAYMENT_STATUSES.includes(status)) {
    throw new Error(`Statut inconnu: ${status}`);
  }
  const current = await getTransaction(id);
  if (!current) throw new Error(`Transaction inconnue: ${id}`);
  const [row] = await db
    .update(paymentTransactions)
    .set({ status, updatedAt: new Date() })
    .where(eq(paymentTransactions.id, id))
    .returning();
  await db.insert(paymentEvents).values({
    transactionId: id,
    type: opts?.type ?? "status_changed",
    fromStatus: current.status,
    toStatus: status,
    data: (opts?.data as object) ?? null,
  });
  return row;
}

export async function getEvents(transactionId: number) {
  return db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.transactionId, transactionId))
    .orderBy(desc(paymentEvents.createdAt));
}

// ── Virements bancaires ────────────────────────────────────────────────────
export interface BankTransferInput {
  transactionId: number;
  beneficiary: string;
  iban: string;
  bic?: string;
  expectedAmount: number;
  currency?: string;
  dueInDays?: number;
}

export async function createBankTransfer(input: BankTransferInput) {
  const tx = await getTransaction(input.transactionId);
  if (!tx) throw new Error("Transaction inconnue");
  const dueDate = input.dueInDays
    ? new Date(Date.now() + input.dueInDays * 24 * 60 * 60 * 1000)
    : null;
  const [row] = await db
    .insert(paymentBankTransfers)
    .values({
      transactionId: input.transactionId,
      beneficiary: input.beneficiary,
      iban: input.iban,
      bic: input.bic ?? null,
      expectedAmount: String(input.expectedAmount),
      currency: input.currency ?? tx.currency,
      reference: tx.reference,
      dueDate,
    })
    .returning();
  await setStatus(input.transactionId, "en_attente_virement", {
    type: "bank_transfer_created",
  });
  return row;
}

/** Marque un virement comme reçu et rapproché (action back-office). */
export async function reconcileBankTransfer(id: number, userId?: number) {
  const [bt] = await db
    .select()
    .from(paymentBankTransfers)
    .where(eq(paymentBankTransfers.id, id))
    .limit(1);
  if (!bt) throw new Error("Virement inconnu");
  const [row] = await db
    .update(paymentBankTransfers)
    .set({ reconciled: true, reconciledAt: new Date(), reconciledBy: userId ?? null })
    .where(eq(paymentBankTransfers.id, id))
    .returning();
  await setStatus(bt.transactionId, "recu", { type: "bank_transfer_reconciled" });
  return row;
}

export async function listPendingBankTransfers() {
  return db
    .select()
    .from(paymentBankTransfers)
    .where(eq(paymentBankTransfers.reconciled, false))
    .orderBy(desc(paymentBankTransfers.createdAt));
}

// ── Remboursements ─────────────────────────────────────────────────────────
export async function createRefund(input: {
  transactionId: number;
  amount: number;
  reason?: string;
  createdBy?: number;
}) {
  const [row] = await db
    .insert(paymentRefunds)
    .values({
      transactionId: input.transactionId,
      amount: String(input.amount),
      reason: input.reason ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  await setStatus(input.transactionId, "rembourse", { type: "refund_created" });
  return row;
}

// ── RIB professionnels ─────────────────────────────────────────────────────
// Validation de format IBAN (structure + longueur), PAS une preuve de propriété.
export function isIbanFormatValid(iban: string): boolean {
  const s = iban.replace(/\s+/g, "").toUpperCase();
  if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(s)) return false;
  // Contrôle mod-97 (ISO 13616).
  const rearranged = s.slice(4) + s.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (c) => String(c.charCodeAt(0) - 55));
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + Number(numeric[i])) % 97;
  }
  return remainder === 1;
}

export async function addProRib(input: {
  userId: number;
  holder: string;
  iban: string;
  bic?: string;
  countryCode?: string;
  bankName?: string;
}) {
  const formatValid = isIbanFormatValid(input.iban);
  const [row] = await db
    .insert(paymentProRib)
    .values({
      userId: input.userId,
      holder: input.holder,
      iban: input.iban.replace(/\s+/g, "").toUpperCase(),
      bic: input.bic ?? null,
      countryCode: (input.countryCode ?? "FR").toUpperCase().slice(0, 3),
      bankName: input.bankName ?? null,
      formatValid,
    })
    .returning();
  return row;
}

export async function listProRib(userId: number) {
  return db
    .select()
    .from(paymentProRib)
    .where(eq(paymentProRib.userId, userId))
    .orderBy(desc(paymentProRib.createdAt));
}

/** Vérification renforcée (back-office) d'un RIB. */
export async function verifyProRib(id: number) {
  const [row] = await db
    .update(paymentProRib)
    .set({ verified: true, verifiedAt: new Date() })
    .where(eq(paymentProRib.id, id))
    .returning();
  return row;
}

// ── Règles par pays ────────────────────────────────────────────────────────
export async function getCountryRule(countryCode: string) {
  const cc = (countryCode || "FR").toUpperCase().slice(0, 3);
  const [row] = await db
    .select()
    .from(paymentCountryRules)
    .where(eq(paymentCountryRules.countryCode, cc))
    .limit(1);
  return row ?? null;
}

export async function upsertCountryRule(input: {
  countryCode: string;
  currency: string;
  methods: string[];
  active?: boolean;
  notes?: string;
}) {
  const cc = input.countryCode.toUpperCase().slice(0, 3);
  const existing = await getCountryRule(cc);
  if (existing) {
    const [row] = await db
      .update(paymentCountryRules)
      .set({
        currency: input.currency,
        methods: input.methods,
        active: input.active ?? existing.active,
        notes: input.notes ?? existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(paymentCountryRules.id, existing.id))
      .returning();
    return row;
  }
  const [row] = await db
    .insert(paymentCountryRules)
    .values({
      countryCode: cc,
      currency: input.currency,
      methods: input.methods,
      active: input.active ?? true,
      notes: input.notes ?? null,
    })
    .returning();
  return row;
}

export async function listCountryRules() {
  return db.select().from(paymentCountryRules).orderBy(paymentCountryRules.countryCode);
}

// ── Centre de contrôle PDG ─────────────────────────────────────────────────
export async function getStats() {
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      valides: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'valide')::int`,
      recus: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'recu')::int`,
      enAttente: sql<number>`count(*) filter (where ${paymentTransactions.status} in ('cree','en_attente','en_attente_virement','autorise'))::int`,
      aVerifier: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'a_verifier')::int`,
      refuses: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'refuse')::int`,
      rembourses: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'rembourse')::int`,
      contestes: sql<number>`count(*) filter (where ${paymentTransactions.status} = 'conteste')::int`,
    })
    .from(paymentTransactions);

  const [bankTotals] = await db
    .select({
      pending: sql<number>`count(*) filter (where ${paymentBankTransfers.reconciled} = false)::int`,
    })
    .from(paymentBankTransfers);

  // Revenus (validés/reçus) par univers.
  const revenueByUnivers = await db
    .select({
      univers: paymentTransactions.univers,
      total: sql<string>`coalesce(sum(${paymentTransactions.amount}), 0)`,
    })
    .from(paymentTransactions)
    .where(sql`${paymentTransactions.status} in ('valide','recu')`)
    .groupBy(paymentTransactions.univers);

  return {
    ...totals,
    pendingBankTransfers: bankTotals?.pending ?? 0,
    revenueByUnivers,
  };
}

export async function listTransactions(opts?: { status?: string; limit?: number }) {
  const limit = opts?.limit ?? 200;
  if (opts?.status) {
    return db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.status, opts.status))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(limit);
  }
  return db
    .select()
    .from(paymentTransactions)
    .orderBy(desc(paymentTransactions.createdAt))
    .limit(limit);
}
