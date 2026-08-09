/**
 * Auction Engine (points 30-31) — enchères particuliers ET professionnels.
 *
 * L'univers Enchères existait côté écran mais sans moteur : aucune offre
 * n'était réellement enregistrée. Ces tables sont la source de vérité, et le
 * montant gagnant ne peut venir que d'ici — jamais du navigateur.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const auctions = pgTable(
  "auctions",
  {
    id: serial("id").primaryKey(),
    reference: varchar("reference", { length: 24 }).notNull().unique(),
    /** "particulier" | "professionnel" — deux entrées, règles distinctes. */
    audience: varchar("audience", { length: 16 }).notNull().default("professionnel"),
    sellerId: integer("seller_id").notNull(),
    /** Annonce rattachée si le véhicule est déjà déposé. */
    annonceId: integer("annonce_id"),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    countryCode: varchar("country_code", { length: 4 }).notNull().default("FR"),
    city: varchar("city", { length: 120 }),
    currency: varchar("currency", { length: 8 }).notNull().default("EUR"),
    startPrice: numeric("start_price", { precision: 14, scale: 2 }).notNull(),
    /** Prix de réserve : jamais exposé aux enchérisseurs. */
    reservePrice: numeric("reserve_price", { precision: 14, scale: 2 }),
    /** Pas minimal entre deux offres. */
    increment: numeric("increment", { precision: 12, scale: 2 }).notNull().default("100"),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
    /** "brouillon" | "programmee" | "en_cours" | "terminee" | "adjugee" | "sans_suite" | "annulee" */
    status: varchar("status", { length: 16 }).notNull().default("brouillon"),
    winnerId: integer("winner_id"),
    winningAmount: numeric("winning_amount", { precision: 14, scale: 2 }),
    /** Le paiement du gagnant relève du Payment Engine : ici on ne fait que le référencer. */
    paymentId: integer("payment_id"),
    /** Restrictions d'accès (profils autorisés côté professionnel). */
    allowedProfiles: jsonb("allowed_profiles").$type<string[]>().notNull().default([]),
    photos: jsonb("photos").$type<string[]>().notNull().default([]),
    bidCount: integer("bid_count").notNull().default(0),
    published: boolean("published").notNull().default(false),
    closedAt: timestamp("closed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => ({
    liveIdx: index("auctions_live_idx").on(t.status, t.endsAt),
    audienceIdx: index("auctions_audience_idx").on(t.audience, t.countryCode, t.published),
  }),
);

export const auctionBids = pgTable(
  "auction_bids",
  {
    id: serial("id").primaryKey(),
    auctionId: integer("auction_id").notNull(),
    bidderId: integer("bidder_id").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    /** "acceptee" | "rejetee" : une offre refusée reste tracée (historique complet). */
    status: varchar("status", { length: 12 }).notNull().default("acceptee"),
    rejectReason: varchar("reject_reason", { length: 160 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    auctionIdx: index("auction_bids_auction_idx").on(t.auctionId, t.createdAt),
  }),
);

export const auctionEvents = pgTable(
  "auction_events",
  {
    id: serial("id").primaryKey(),
    auctionId: integer("auction_id").notNull(),
    /** creation, publication, offre, offre_refusee, prolongation, cloture, adjudication, sans_suite, annulation, litige */
    event: varchar("event", { length: 32 }).notNull(),
    userId: integer("user_id"),
    detail: text("detail"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    auctionIdx: index("auction_events_auction_idx").on(t.auctionId, t.createdAt),
  }),
);
