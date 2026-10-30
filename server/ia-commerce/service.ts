import { desc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { iaCreditWallets, iaCreditLedger } from "./schema.js";
import { listProducts, resolveProduct, upsertProduct, type ResolvedProduct } from "../payment-engine/products.js";
import { seedProducts } from "../payment-engine/products.js";
import { IA_PRODUCT_CATALOG, UNITE_COUT_REEL_EUR, type IaPlanMeta } from "./catalog.js";

export interface IaProduct extends ResolvedProduct {
  meta: IaPlanMeta | null;
}

function withParsedMeta(p: ResolvedProduct): IaProduct {
  return { ...p, meta: (p.metadata as unknown as IaPlanMeta) ?? null };
}

/** Catalogue IA (univers="ia" du registre central). onlyActive=true pour les pages publiques. */
export async function listIaCatalog(onlyActive: boolean): Promise<IaProduct[]> {
  const all = await listProducts(onlyActive);
  return all.filter((p) => p.univers === "ia").map(withParsedMeta);
}

/** Amorce le catalogue recommandé. Idempotent : n'écrase jamais une ligne déjà éditée par le PDG. */
export async function seedIaCatalog(): Promise<{ inserted: number; total: number }> {
  return seedProducts(IA_PRODUCT_CATALOG);
}

/**
 * Bascule la visibilité commerciale d'une offre (active=true/false). Seul geste qui rend
 * un produit réellement achetable publiquement : rien n'est vendable tant que le PDG ne
 * l'a pas explicitement activé ici.
 */
export async function setIaProductActive(code: string, active: boolean): Promise<ResolvedProduct> {
  const existing = await resolveProductEvenInactive(code);
  return upsertProduct({
    code: existing.code,
    name: existing.name,
    univers: existing.univers,
    paymentCase: existing.paymentCase,
    price: existing.price,
    currency: existing.currency,
    vatRate: existing.vatRate,
    countryCode: existing.countryCode,
    paymentType: existing.paymentType === "recurring" ? "recurring" : "unique",
    periodicity: existing.periodicity as "monthly" | "quarterly" | "yearly" | null,
    beneficiary: "mkapms",
    validityDays: existing.validityDays,
    refundPolicy: existing.refundPolicy,
    metadata: existing.metadata,
    active,
  });
}

async function resolveProductEvenInactive(code: string): Promise<ResolvedProduct> {
  const all = await listProducts(false);
  const row = all.find((p) => p.code === code);
  if (!row) throw new Error(`Produit IA inconnu : ${code}`);
  return row;
}

/** Marge réelle estimée d'une offre : prix de vente vs coût réel des unités incluses (profil moyen mesuré). */
export function planMargin(p: IaProduct): { prixEur: number; creditsInclus: number; coutReelEstimeEur: number; margeEur: number; margePct: number | null } {
  const creditsInclus = p.meta?.creditsInclus ?? 0;
  const coutReelEstimeEur = Math.round(creditsInclus * UNITE_COUT_REEL_EUR * 100) / 100;
  const margeEur = Math.round((p.price - coutReelEstimeEur) * 100) / 100;
  const margePct = p.price > 0 ? Math.round((margeEur / p.price) * 1000) / 10 : null;
  return { prixEur: p.price, creditsInclus, coutReelEstimeEur, margeEur, margePct };
}

/** Estimation préalable du coût réel d'une consommation en unités (avant facturation d'un dépassement). */
export function estimateUnitsCost(unites: number): { unites: number; coutReelEstimeEur: number } {
  return { unites, coutReelEstimeEur: Math.round(unites * UNITE_COUT_REEL_EUR * 100) / 100 };
}

async function getOrCreateWallet(userId: number) {
  const [existing] = await db.select().from(iaCreditWallets).where(eq(iaCreditWallets.userId, userId));
  if (existing) return existing;
  const [created] = await db.insert(iaCreditWallets).values({ userId, balanceUnites: "0" }).returning();
  return created;
}

export async function walletBalance(userId: number): Promise<number> {
  const w = await getOrCreateWallet(userId);
  return Number(w.balanceUnites);
}

export async function walletLedger(userId: number, limit = 50) {
  return db
    .select()
    .from(iaCreditLedger)
    .where(eq(iaCreditLedger.userId, userId))
    .orderBy(desc(iaCreditLedger.createdAt))
    .limit(limit);
}

interface MovementInput {
  userId: number;
  unites: number; // signé : positif = crédit, négatif = consommation
  type: "achat" | "abonnement" | "bonus_essai" | "consommation" | "ajustement_pdg";
  paymentId?: number | null;
  afCostEntryId?: number | null;
  note?: string;
}

/** Mouvement atomique du portefeuille (crédit ou débit) + écriture au grand livre. */
async function moveWallet(input: MovementInput) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(iaCreditWallets).where(eq(iaCreditWallets.userId, input.userId));
    const wallet = existing ?? (await tx.insert(iaCreditWallets).values({ userId: input.userId, balanceUnites: "0" }).returning())[0];
    const soldeApres = Math.round((Number(wallet.balanceUnites) + input.unites) * 100) / 100;
    await tx.update(iaCreditWallets).set({ balanceUnites: String(soldeApres), updatedAt: new Date() }).where(eq(iaCreditWallets.userId, input.userId));
    await tx.insert(iaCreditLedger).values({
      userId: input.userId,
      type: input.type,
      unites: String(input.unites),
      soldeApres: String(soldeApres),
      paymentId: input.paymentId ?? null,
      afCostEntryId: input.afCostEntryId ?? null,
      note: input.note ?? null,
    });
    return soldeApres;
  });
}

export async function creditWallet(userId: number, unites: number, opts: { type: "achat" | "abonnement" | "bonus_essai" | "ajustement_pdg"; paymentId?: number | null; note?: string }) {
  if (unites <= 0) throw new Error("Un crédit doit être positif");
  return moveWallet({ userId, unites, type: opts.type, paymentId: opts.paymentId, note: opts.note });
}

/**
 * Consommation réelle. Jamais bloquée en dessous de zéro par la perte de données déjà produites
 * (le travail de l'utilisateur n'est jamais supprimé) — seules de NOUVELLES actions IA doivent
 * être mises en pause par l'appelant quand le solde atteint zéro, jusqu'à recharge. Ce service
 * ne fait que tenir le grand livre ; le point d'intégration dans le routage IA réel (routeur.ts)
 * reste à brancher dans une étape suivante, documentée comme telle, jamais présentée comme faite.
 */
export async function debitWallet(userId: number, unites: number, opts: { afCostEntryId?: number | null; note?: string }) {
  if (unites <= 0) throw new Error("Un débit doit être positif");
  return moveWallet({ userId, unites: -unites, type: "consommation", afCostEntryId: opts.afCostEntryId, note: opts.note });
}
