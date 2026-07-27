/**
 * MKA.P-MS Payment Engine — Registre central des produits & tarifs (Phase 24).
 *
 * Source unique de vérité des prix. Le serveur résout TOUJOURS le montant depuis
 * ce registre — le prix n'est jamais recopié en dur dans plusieurs fichiers ni
 * accepté depuis le navigateur.
 */
import { asc, eq } from "drizzle-orm";
import { db } from "../db.js";
import { paymentProducts } from "./schema.js";

export interface ProductSeed {
  code: string;
  name: string;
  univers: string;
  paymentCase: string;
  price: number;
  currency?: string;
  vatRate?: number;
  countryCode?: string;
  paymentType?: "unique" | "recurring";
  periodicity?: "monthly" | "quarterly" | "yearly";
  beneficiary?: "mkapms" | "pro" | "partner";
  commissionRate?: number;
  validityDays?: number;
  refundPolicy?: string;
}

/**
 * Catalogue curé de départ. Les prix ici étaient auparavant dispersés en dur
 * (écrans abonnements, boost, packs photos…) ; ils sont désormais centralisés.
 */
export const PRODUCT_CATALOG: ProductSeed[] = [
  // ── Boost / mise en avant d'annonce ──────────────────────────────────────
  { code: "annonce_boost_7j", name: "Boost annonce 7 jours", univers: "vente", paymentCase: "boost_annonce", price: 6.9, validityDays: 7, refundPolicy: "Non remboursable une fois activé." },
  { code: "annonce_boost_30j", name: "Boost annonce 30 jours", univers: "vente", paymentCase: "boost_annonce", price: 24.9, validityDays: 30, refundPolicy: "Non remboursable une fois activé." },
  // ── Options / packs ──────────────────────────────────────────────────────
  { code: "pack_photos_5", name: "Pack 5 photos supplémentaires", univers: "vente", paymentCase: "photos_supplementaires", price: 5.9, validityDays: 0, refundPolicy: "Non remboursable une fois les photos ajoutées." },
  { code: "option_premium_annonce", name: "Option annonce premium", univers: "vente", paymentCase: "options_premium", price: 9.9, validityDays: 30 },
  // ── Dépôt d'annonce payant ───────────────────────────────────────────────
  { code: "depot_annonce_particulier", name: "Dépôt d'annonce particulier", univers: "vente", paymentCase: "depot_annonce", price: 0, validityDays: 30, refundPolicy: "Offert." },
  { code: "depotvente_frais", name: "Frais de dépôt-vente", univers: "vente", paymentCase: "depot_annonce", price: 49, validityDays: 90 },
  // ── Services ─────────────────────────────────────────────────────────────
  { code: "garage_prestation", name: "Prestation garage (acompte en ligne)", univers: "garage", paymentCase: "garage", price: 0, beneficiary: "pro", commissionRate: 10, refundPolicy: "Remboursable jusqu'à 24h avant le rendez-vous." },
  { code: "kyc_verification", name: "Vérification KYC", univers: "professionnels", paymentCase: "options_premium", price: 4.9, validityDays: 0 },
  { code: "carte_grise_service", name: "Service carte grise", univers: "administratif", paymentCase: "options_premium", price: 29, validityDays: 0 },
  { code: "controle_technique_rdv", name: "Contrôle technique (réservation)", univers: "controle_technique", paymentCase: "reservation_vehicule", price: 0, beneficiary: "pro", commissionRate: 8 },
  // ── Abonnements récurrents (Particuliers / Pro) ──────────────────────────
  { code: "abo_essentiel_mensuel", name: "Abonnement Essentiel", univers: "abonnements", paymentCase: "abonnement", price: 0, paymentType: "recurring", periodicity: "monthly", validityDays: 30, refundPolicy: "Résiliable à tout moment, sans remboursement du mois entamé." },
  { code: "abo_pro_premium_mensuel", name: "Abonnement Pro Premium", univers: "abonnements", paymentCase: "abonnement", price: 89, paymentType: "recurring", periodicity: "monthly", validityDays: 30, refundPolicy: "Résiliable à tout moment, sans remboursement du mois entamé." },
  { code: "abo_elite_mensuel", name: "Abonnement Élite", univers: "abonnements", paymentCase: "abonnement", price: 49, paymentType: "recurring", periodicity: "monthly", validityDays: 30, refundPolicy: "Résiliable à tout moment, sans remboursement du mois entamé." },
  { code: "abo_garage_elite_mensuel", name: "Abonnement Garage Élite", univers: "abonnements", paymentCase: "abonnement", price: 99, paymentType: "recurring", periodicity: "monthly", validityDays: 30, refundPolicy: "Résiliable à tout moment, sans remboursement du mois entamé." },
  { code: "abo_vtc_max_mensuel", name: "Abonnement VTC Max", univers: "abonnements", paymentCase: "abonnement", price: 249.99, paymentType: "recurring", periodicity: "monthly", validityDays: 30, refundPolicy: "Résiliable à tout moment, sans remboursement du mois entamé." },
];

export interface ResolvedProduct {
  id: number;
  code: string;
  name: string;
  univers: string;
  paymentCase: string;
  price: number;
  currency: string;
  vatRate: number;
  countryCode: string;
  paymentType: string;
  periodicity: string | null;
  beneficiary: string;
  commissionRate: number;
  validityDays: number;
  refundPolicy: string | null;
  active: boolean;
}

function toResolved(row: typeof paymentProducts.$inferSelect): ResolvedProduct {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    univers: row.univers,
    paymentCase: row.paymentCase,
    price: Number(row.price),
    currency: row.currency,
    vatRate: Number(row.vatRate),
    countryCode: row.countryCode,
    paymentType: row.paymentType,
    periodicity: row.periodicity,
    beneficiary: row.beneficiary,
    commissionRate: Number(row.commissionRate),
    validityDays: row.validityDays,
    refundPolicy: row.refundPolicy,
    active: row.active,
  };
}

/** Liste tous les produits (option : seulement les actifs). */
export async function listProducts(onlyActive = false): Promise<ResolvedProduct[]> {
  const rows = onlyActive
    ? await db.select().from(paymentProducts).where(eq(paymentProducts.active, true)).orderBy(asc(paymentProducts.univers), asc(paymentProducts.code))
    : await db.select().from(paymentProducts).orderBy(asc(paymentProducts.univers), asc(paymentProducts.code));
  return rows.map(toResolved);
}

/**
 * Résout un produit par son code. Lève si introuvable ou inactif : le prix
 * n'est jamais deviné ni pris du navigateur.
 */
export async function resolveProduct(code: string): Promise<ResolvedProduct> {
  const [row] = await db.select().from(paymentProducts).where(eq(paymentProducts.code, code));
  if (!row) throw new Error(`Produit inconnu : ${code}`);
  if (!row.active) throw new Error(`Produit désactivé : ${code}`);
  return toResolved(row);
}

/** Détail TVA calculé côté serveur à partir du produit résolu. */
export function computePrice(product: ResolvedProduct, quantity = 1): {
  currency: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  vatRate: number;
  vatAmount: number;
  total: number;
} {
  const qty = Math.max(1, Math.floor(quantity));
  const subtotal = Math.round(product.price * qty * 100) / 100;
  const vatAmount = Math.round(subtotal * (product.vatRate / 100) * 100) / 100;
  // Prix TTC = le prix catalogue est déjà TTC (convention MKA.P-MS grand public).
  return {
    currency: product.currency,
    unitPrice: product.price,
    quantity: qty,
    subtotal,
    vatRate: product.vatRate,
    vatAmount,
    total: subtotal,
  };
}

/**
 * Alimente / complète le registre depuis le catalogue curé.
 * Idempotent : n'écrase pas un produit déjà présent (le PDG reste maître des
 * prix modifiés à la main). Retourne le nombre de produits insérés.
 */
export async function seedProducts(): Promise<{ inserted: number; total: number }> {
  let inserted = 0;
  for (const p of PRODUCT_CATALOG) {
    const [existing] = await db.select({ id: paymentProducts.id }).from(paymentProducts).where(eq(paymentProducts.code, p.code));
    if (existing) continue;
    await db.insert(paymentProducts).values({
      code: p.code,
      name: p.name,
      univers: p.univers,
      paymentCase: p.paymentCase,
      price: String(p.price),
      currency: p.currency ?? "EUR",
      vatRate: String(p.vatRate ?? 20),
      countryCode: p.countryCode ?? "FR",
      paymentType: p.paymentType ?? "unique",
      periodicity: p.periodicity ?? null,
      beneficiary: p.beneficiary ?? "mkapms",
      commissionRate: String(p.commissionRate ?? 0),
      validityDays: p.validityDays ?? 0,
      refundPolicy: p.refundPolicy ?? null,
    });
    inserted += 1;
  }
  const all = await db.select({ id: paymentProducts.id }).from(paymentProducts);
  return { inserted, total: all.length };
}

export interface UpsertProductInput {
  code: string;
  name: string;
  univers: string;
  paymentCase: string;
  price: number;
  currency?: string;
  vatRate?: number;
  countryCode?: string;
  paymentType?: "unique" | "recurring";
  periodicity?: "monthly" | "quarterly" | "yearly" | null;
  beneficiary?: "mkapms" | "pro" | "partner";
  commissionRate?: number;
  validityDays?: number;
  refundPolicy?: string | null;
  active?: boolean;
}

/** Crée ou met à jour un produit (réservé PDG). */
export async function upsertProduct(input: UpsertProductInput): Promise<ResolvedProduct> {
  const values = {
    name: input.name,
    univers: input.univers,
    paymentCase: input.paymentCase,
    price: String(input.price),
    currency: input.currency ?? "EUR",
    vatRate: String(input.vatRate ?? 20),
    countryCode: input.countryCode ?? "FR",
    paymentType: input.paymentType ?? "unique",
    periodicity: input.periodicity ?? null,
    beneficiary: input.beneficiary ?? "mkapms",
    commissionRate: String(input.commissionRate ?? 0),
    validityDays: input.validityDays ?? 0,
    refundPolicy: input.refundPolicy ?? null,
    active: input.active ?? true,
    updatedAt: new Date(),
  };
  const [existing] = await db.select().from(paymentProducts).where(eq(paymentProducts.code, input.code));
  if (existing) {
    const [row] = await db.update(paymentProducts).set(values).where(eq(paymentProducts.code, input.code)).returning();
    return toResolved(row);
  }
  const [row] = await db.insert(paymentProducts).values({ code: input.code, ...values }).returning();
  return toResolved(row);
}
