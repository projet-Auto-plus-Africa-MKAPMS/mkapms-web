/**
 * Auction Engine (points 30-31).
 *
 * Cycle complet : véhicule → vendeur → pays → prix de départ → réserve →
 * début → fin → enchérisseurs → montant → historique → gagnant → notifications
 * → clôture (adjugée, sans suite, annulée).
 *
 * Trois règles tenues :
 *  - le montant gagnant est calculé côté serveur, jamais reçu du navigateur ;
 *  - le prix de réserve n'est jamais exposé aux enchérisseurs ;
 *  - une enchère close sous la réserve est « sans suite », pas « adjugée ».
 */
import { and, desc, eq, gte, inArray, lte, sql, type SQL } from "drizzle-orm";
import { db } from "../db.js";
import { requireOpenCountry } from "../country-os/index.js";
import { notifyEvent } from "../notification-os/triggers.js";
import { users } from "../schema.js";
import { auctionBids, auctionEvents, auctions } from "./schema.js";
import type { CatalogCategory, LotDetails } from "./contract.js";

/** Prolongation anti-sniping : une offre de dernière minute repousse la fin. */
const ANTI_SNIPING_WINDOW_MS = 2 * 60 * 1000;

export type AuctionAudience = "particulier" | "professionnel";

async function logEvent(auctionId: number, event: string, userId: number | null, detail?: string) {
  await db.insert(auctionEvents).values({ auctionId, event, userId, detail: detail ?? null });
}

/** Vue publique : le prix de réserve et l'identité du gagnant restent internes. */
function toPublic(row: typeof auctions.$inferSelect) {
  const { reservePrice, winnerId, ...rest } = row;
  return {
    ...rest,
    /** On dit qu'une réserve existe sans jamais dire son montant. */
    hasReserve: reservePrice !== null,
  };
}

export interface CreateAuctionInput {
  sellerId: number;
  audience: AuctionAudience;
  title: string;
  description?: string | null;
  annonceId?: number | null;
  countryCode: string;
  city?: string | null;
  currency?: string;
  startPrice: number;
  reservePrice?: number | null;
  increment?: number;
  startsAt: Date;
  endsAt: Date;
  allowedProfiles?: string[];
  photos?: string[];
  category?: CatalogCategory;
  lotDetails?: LotDetails;
}

export async function createAuction(input: CreateAuctionInput) {
  if (input.endsAt <= input.startsAt) {
    throw new Error("La fin de l'enchère doit être postérieure à son début.");
  }
  if (input.startPrice <= 0) {
    throw new Error("Le prix de départ doit être supérieur à zéro.");
  }
  const pays = await requireOpenCountry(input.countryCode);
  const reference = `ENC-${Date.now().toString(36).toUpperCase()}`;
  const [row] = await db
    .insert(auctions)
    .values({
      reference,
      audience: input.audience,
      sellerId: input.sellerId,
      annonceId: input.annonceId ?? null,
      title: input.title.slice(0, 200),
      description: input.description ?? null,
      countryCode: input.countryCode.toUpperCase(),
      city: input.city ?? null,
      currency: input.currency ?? pays.defaultCurrency,
      startPrice: String(input.startPrice),
      reservePrice: input.reservePrice === null || input.reservePrice === undefined ? null : String(input.reservePrice),
      increment: String(input.increment ?? 100),
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      allowedProfiles: input.allowedProfiles ?? [],
      photos: input.photos ?? [],
      category: input.category ?? null,
      lotDetails: (input.lotDetails ?? {}) as Record<string, unknown>,
      status: "brouillon",
    })
    .returning();
  await logEvent(row.id, "creation", input.sellerId, `Enchère ${reference} créée.`);
  return row;
}

/**
 * Publication : rend l'enchère visible et alimente les canaux de visibilité.
 * L'injection visibilité est best-effort, elle ne bloque jamais la publication.
 */
export async function publishAuction(id: number, userId: number) {
  const [row] = await db.select().from(auctions).where(eq(auctions.id, id)).limit(1);
  if (!row) throw new Error("Enchère introuvable.");
  if (row.published) return row;

  const now = new Date();
  const status = row.startsAt <= now ? "en_cours" : "programmee";
  const [updated] = await db
    .update(auctions)
    .set({ published: true, status, updatedAt: now })
    .where(eq(auctions.id, id))
    .returning();
  await logEvent(id, "publication", userId, `Publiée (${status}).`);

  try {
    const { ingest } = await import("../visibility-os/index.js");
    await ingest({
      sourceType: "enchere",
      sourceId: String(id),
      title: updated.title,
      body: `Enchère ${updated.reference} — départ ${updated.startPrice} ${updated.currency}, clôture le ${updated.endsAt.toLocaleDateString("fr-FR")}.`,
      country: updated.countryCode,
      link: `/acheter/encheres?ref=${updated.reference}`,
    });
  } catch {
    // La visibilité est un service annexe : son indisponibilité ne doit pas
    // empêcher une enchère d'exister.
  }

  return updated;
}

export interface BidResult {
  accepted: boolean;
  reason?: string;
  amount?: number;
  endsAt?: Date;
}

/**
 * Dépôt d'une offre. Toutes les vérifications sont faites en base : montant
 * minimal, période, statut, vendeur, et surenchère sur l'offre courante.
 */
export async function placeBid(input: {
  auctionId: number;
  bidderId: number;
  amount: number;
}): Promise<BidResult> {
  const [auction] = await db.select().from(auctions).where(eq(auctions.id, input.auctionId)).limit(1);
  if (!auction) return { accepted: false, reason: "Enchère introuvable." };

  const now = new Date();
  const reject = async (reason: string): Promise<BidResult> => {
    await db.insert(auctionBids).values({
      auctionId: input.auctionId,
      bidderId: input.bidderId,
      amount: String(input.amount),
      status: "rejetee",
      rejectReason: reason.slice(0, 160),
    });
    await logEvent(input.auctionId, "offre_refusee", input.bidderId, reason);
    return { accepted: false, reason };
  };

  if (!auction.published) return reject("Enchère non publiée.");
  if (auction.sellerId === input.bidderId) return reject("Le vendeur ne peut pas enchérir sur son propre lot.");
  if (now < auction.startsAt) return reject("L'enchère n'a pas encore commencé.");
  if (now >= auction.endsAt || ["terminee", "adjugee", "sans_suite", "annulee"].includes(auction.status)) {
    return reject("L'enchère est terminée.");
  }

  const [best] = await db
    .select({ amount: auctionBids.amount })
    .from(auctionBids)
    .where(and(eq(auctionBids.auctionId, input.auctionId), eq(auctionBids.status, "acceptee")))
    .orderBy(desc(sql`${auctionBids.amount}::numeric`))
    .limit(1);

  const increment = Number(auction.increment);
  const minimum = best ? Number(best.amount) + increment : Number(auction.startPrice);
  if (!Number.isFinite(input.amount) || input.amount < minimum) {
    return reject(`Offre inférieure au minimum requis (${minimum} ${auction.currency}).`);
  }

  await db.insert(auctionBids).values({
    auctionId: input.auctionId,
    bidderId: input.bidderId,
    amount: String(input.amount),
    status: "acceptee",
  });

  // Anti-sniping : une offre déposée juste avant la fin repousse la clôture,
  // sinon la dernière seconde décide de tout.
  const remaining = auction.endsAt.getTime() - now.getTime();
  const endsAt =
    remaining < ANTI_SNIPING_WINDOW_MS
      ? new Date(now.getTime() + ANTI_SNIPING_WINDOW_MS)
      : auction.endsAt;

  await db
    .update(auctions)
    .set({ bidCount: auction.bidCount + 1, endsAt, status: "en_cours", updatedAt: now })
    .where(eq(auctions.id, input.auctionId));

  await logEvent(input.auctionId, "offre", input.bidderId, `${input.amount} ${auction.currency}`);
  if (endsAt.getTime() !== auction.endsAt.getTime()) {
    await logEvent(input.auctionId, "prolongation", null, "Offre de dernière minute : clôture repoussée.");
  }

  try {
    await notifyEvent({
      userId: auction.sellerId,
      event: "enchere_nouvelle",
      vars: { lot: auction.title },
      url: `/acheter/encheres?ref=${auction.reference}`,
    });
  } catch { /* notification best-effort */ }

  return { accepted: true, amount: input.amount, endsAt };
}

export interface CloseResult {
  auctionId: number;
  status: "adjugee" | "sans_suite";
  winnerId: number | null;
  amount: number | null;
  reason: string;
}

/** Clôture d'une enchère échue. Le paiement du gagnant reste à faire : le moteur ne l'invente pas. */
export async function closeAuction(id: number): Promise<CloseResult | null> {
  const [auction] = await db.select().from(auctions).where(eq(auctions.id, id)).limit(1);
  if (!auction) return null;
  if (["adjugee", "sans_suite", "annulee"].includes(auction.status)) return null;

  const [best] = await db
    .select({ bidderId: auctionBids.bidderId, amount: auctionBids.amount })
    .from(auctionBids)
    .where(and(eq(auctionBids.auctionId, id), eq(auctionBids.status, "acceptee")))
    .orderBy(desc(sql`${auctionBids.amount}::numeric`))
    .limit(1);

  const now = new Date();
  const reserve = auction.reservePrice === null ? null : Number(auction.reservePrice);

  if (!best) {
    await db
      .update(auctions)
      .set({ status: "sans_suite", closedAt: now, updatedAt: now })
      .where(eq(auctions.id, id));
    await logEvent(id, "sans_suite", null, "Aucune offre reçue.");
    return { auctionId: id, status: "sans_suite", winnerId: null, amount: null, reason: "Aucune offre reçue." };
  }

  const amount = Number(best.amount);
  if (reserve !== null && amount < reserve) {
    await db
      .update(auctions)
      .set({ status: "sans_suite", closedAt: now, updatedAt: now })
      .where(eq(auctions.id, id));
    await logEvent(id, "sans_suite", null, "Meilleure offre inférieure au prix de réserve.");
    return {
      auctionId: id,
      status: "sans_suite",
      winnerId: null,
      amount,
      reason: "Prix de réserve non atteint.",
    };
  }

  await db
    .update(auctions)
    .set({
      status: "adjugee",
      winnerId: best.bidderId,
      winningAmount: String(amount),
      closedAt: now,
      updatedAt: now,
    })
    .where(eq(auctions.id, id));
  await logEvent(id, "adjudication", best.bidderId, `${amount} ${auction.currency}`);

  try {
    await notifyEvent({
      userId: best.bidderId,
      event: "enchere_gagnee",
      vars: { lot: auction.title },
      url: `/acheter/encheres?ref=${auction.reference}`,
    });
  } catch { /* notification best-effort */ }

  return {
    auctionId: id,
    status: "adjugee",
    winnerId: best.bidderId,
    amount,
    reason: "Adjugée — paiement du gagnant à réaliser.",
  };
}

/** Clôture automatique des enchères échues (appelée périodiquement). */
export async function closeExpiredAuctions(): Promise<CloseResult[]> {
  const due = await db
    .select({ id: auctions.id })
    .from(auctions)
    .where(
      and(
        sql`${auctions.status} IN ('en_cours','programmee')`,
        lte(auctions.endsAt, new Date()),
        eq(auctions.published, true),
      ),
    )
    .limit(200);

  const results: CloseResult[] = [];
  for (const a of due) {
    const r = await closeAuction(a.id);
    if (r) results.push(r);
  }
  return results;
}

export async function cancelAuction(id: number, userId: number, reason: string) {
  const [row] = await db
    .update(auctions)
    .set({ status: "annulee", closedAt: new Date(), updatedAt: new Date() })
    .where(eq(auctions.id, id))
    .returning();
  if (row) await logEvent(id, "annulation", userId, reason);
  return row ?? null;
}

export async function listAuctions(input: {
  audience?: AuctionAudience;
  countryCode?: string;
  status?: string;
  category?: string;
  limit?: number;
}) {
  const conditions: SQL[] = [eq(auctions.published, true)];
  if (input.audience) conditions.push(eq(auctions.audience, input.audience));
  if (input.countryCode) conditions.push(eq(auctions.countryCode, input.countryCode.toUpperCase()));
  if (input.status) conditions.push(eq(auctions.status, input.status));
  if (input.category) conditions.push(eq(auctions.category, input.category));

  const rows = await db
    .select()
    .from(auctions)
    .where(and(...conditions))
    .orderBy(desc(auctions.endsAt))
    .limit(input.limit ?? 50);
  if (rows.length === 0) return [];

  // Prix courant et nombre d'enchérisseurs réels — jamais recalculés côté
  // navigateur, une seule requête groupée pour tout le lot de résultats.
  const ids = rows.map((r) => r.id);
  const agg = await db
    .select({
      auctionId: auctionBids.auctionId,
      meilleureOffre: sql<string>`max(${auctionBids.amount}::numeric)`,
      encherisseurs: sql<number>`count(distinct ${auctionBids.bidderId})::int`,
    })
    .from(auctionBids)
    .where(and(inArray(auctionBids.auctionId, ids), eq(auctionBids.status, "acceptee")))
    .groupBy(auctionBids.auctionId);
  const parAuction = new Map(agg.map((a) => [a.auctionId, a]));

  return rows.map((row) => {
    const stats = parAuction.get(row.id);
    return {
      ...toPublic(row),
      currentPrice: stats ? Number(stats.meilleureOffre) : Number(row.startPrice),
      bidderCount: stats?.encherisseurs ?? 0,
    };
  });
}

export async function auctionDetail(id: number) {
  const [row] = await db.select().from(auctions).where(eq(auctions.id, id)).limit(1);
  if (!row) return null;
  const bids = await db
    .select({
      id: auctionBids.id,
      bidderId: auctionBids.bidderId,
      amount: auctionBids.amount,
      status: auctionBids.status,
      createdAt: auctionBids.createdAt,
    })
    .from(auctionBids)
    .where(and(eq(auctionBids.auctionId, id), eq(auctionBids.status, "acceptee")))
    .orderBy(desc(sql`${auctionBids.amount}::numeric`))
    .limit(50);
  const history = await db
    .select()
    .from(auctionEvents)
    .where(eq(auctionEvents.auctionId, id))
    .orderBy(desc(auctionEvents.createdAt))
    .limit(100);
  return { auction: toPublic(row), bids, history };
}

export async function myAuctions(sellerId: number) {
  return db
    .select()
    .from(auctions)
    .where(eq(auctions.sellerId, sellerId))
    .orderBy(desc(auctions.createdAt))
    .limit(100);
}

/**
 * Enchères remportées par l'appelant — scopé côté serveur (`winnerId =
 * bidderId`), jamais reconstruit côté écran à partir de données publiques :
 * `winnerId` reste absent de `list`/`detail` (§ toPublic) pour ne jamais
 * révéler l'identité du gagnant à un autre enchérisseur. Ici, l'appelant
 * demande seulement ses propres victoires : aucune fuite possible.
 */
export async function myWonAuctions(bidderId: number) {
  const rows = await db
    .select()
    .from(auctions)
    .where(and(eq(auctions.status, "adjugee"), eq(auctions.winnerId, bidderId)))
    .orderBy(desc(auctions.closedAt));
  return rows.map(({ reservePrice, ...rest }) => ({ ...rest, hasReserve: reservePrice !== null }));
}

export async function myBids(bidderId: number) {
  return db
    .select()
    .from(auctionBids)
    .where(eq(auctionBids.bidderId, bidderId))
    .orderBy(desc(auctionBids.createdAt))
    .limit(100);
}

export interface AuctionHealth {
  health: "ok" | "degraded" | "down";
  enCours: number;
  echuesNonCloturees: number;
  adjugeesSansPaiement: number;
  offres24h: number;
  details: string[];
}

export async function auctionHealth(): Promise<AuctionHealth> {
  const [live] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(auctions)
    .where(eq(auctions.status, "en_cours"));

  const [overdue] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(auctions)
    .where(sql`${auctions.status} IN ('en_cours','programmee') AND ${auctions.endsAt} < now()`);

  const [unpaid] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(auctions)
    .where(sql`${auctions.status} = 'adjugee' AND ${auctions.paymentId} IS NULL`);

  const [recent] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(auctionBids)
    .where(gte(auctionBids.createdAt, new Date(Date.now() - 24 * 3600 * 1000)));

  const echues = Number(overdue?.n ?? 0);
  const details = [
    `${Number(live?.n ?? 0)} enchère(s) en cours, ${Number(recent?.n ?? 0)} offre(s) sur 24 h.`,
    `${Number(unpaid?.n ?? 0)} enchère(s) adjugée(s) en attente de paiement.`,
  ];
  if (echues > 0) {
    details.push(`${echues} enchère(s) échue(s) non clôturée(s) : la clôture automatique ne suit pas.`);
  }

  return {
    // Des lots adjugés en attente de paiement sont du métier normal ; seule
    // une clôture qui ne se fait pas est une vraie défaillance du moteur.
    health: echues === 0 ? "ok" : "degraded",
    enCours: Number(live?.n ?? 0),
    echuesNonCloturees: echues,
    adjugeesSansPaiement: Number(unpaid?.n ?? 0),
    offres24h: Number(recent?.n ?? 0),
    details,
  };
}

export interface AuctionBusinessStats {
  enCours: number;
  vendus: number;
  prixMoyen: number;
  revenus: number;
  meilleursAcheteurs: Array<{ acheteurId: number; nom: string; lots: number; montantTotal: number }>;
}

/**
 * Statistiques métier réelles pour le tableau de bord Direction — jamais un
 * nom ou un montant inventé. `meilleursAcheteurs` identifie le gagnant par
 * son propre nom de compte (`users.name`), réservé à la Direction : c'est
 * une vue interne d'analyse commerciale, pas une donnée publique (§ toPublic
 * ne l'expose jamais aux autres enchérisseurs).
 */
export async function auctionBusinessStats(): Promise<AuctionBusinessStats> {
  const [enCoursRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(auctions)
    .where(eq(auctions.status, "en_cours"));

  const [vendusRow] = await db
    .select({
      n: sql<number>`count(*)::int`,
      prixMoyen: sql<string>`coalesce(avg(${auctions.winningAmount}::numeric), 0)`,
      revenus: sql<string>`coalesce(sum(${auctions.winningAmount}::numeric), 0)`,
    })
    .from(auctions)
    .where(eq(auctions.status, "adjugee"));

  const topRows = await db
    .select({
      acheteurId: auctions.winnerId,
      nom: users.name,
      lots: sql<number>`count(*)::int`,
      montantTotal: sql<string>`coalesce(sum(${auctions.winningAmount}::numeric), 0)`,
    })
    .from(auctions)
    .innerJoin(users, eq(users.id, auctions.winnerId))
    .where(eq(auctions.status, "adjugee"))
    .groupBy(auctions.winnerId, users.name)
    .orderBy(desc(sql`sum(${auctions.winningAmount}::numeric)`))
    .limit(5);

  return {
    enCours: Number(enCoursRow?.n ?? 0),
    vendus: Number(vendusRow?.n ?? 0),
    prixMoyen: Number(vendusRow?.prixMoyen ?? 0),
    revenus: Number(vendusRow?.revenus ?? 0),
    meilleursAcheteurs: topRows.map((r) => ({
      acheteurId: r.acheteurId as number,
      nom: r.nom,
      lots: Number(r.lots),
      montantTotal: Number(r.montantTotal),
    })),
  };
}
