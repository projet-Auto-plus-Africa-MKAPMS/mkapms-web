-- Points 30-31 : Auction Engine (enchères particuliers et professionnels).
CREATE TABLE IF NOT EXISTS "auctions" (
  "id" serial PRIMARY KEY NOT NULL,
  "reference" varchar(24) NOT NULL,
  "audience" varchar(16) DEFAULT 'professionnel' NOT NULL,
  "seller_id" integer NOT NULL,
  "annonce_id" integer,
  "title" varchar(200) NOT NULL,
  "description" text,
  "country_code" varchar(4) DEFAULT 'FR' NOT NULL,
  "city" varchar(120),
  "currency" varchar(8) DEFAULT 'EUR' NOT NULL,
  "start_price" numeric(14, 2) NOT NULL,
  "reserve_price" numeric(14, 2),
  "increment" numeric(12, 2) DEFAULT '100' NOT NULL,
  "starts_at" timestamp NOT NULL,
  "ends_at" timestamp NOT NULL,
  "status" varchar(16) DEFAULT 'brouillon' NOT NULL,
  "winner_id" integer,
  "winning_amount" numeric(14, 2),
  "payment_id" integer,
  "allowed_profiles" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "bid_count" integer DEFAULT 0 NOT NULL,
  "published" boolean DEFAULT false NOT NULL,
  "closed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "auctions_reference_unique" UNIQUE("reference")
);
CREATE INDEX IF NOT EXISTS "auctions_live_idx" ON "auctions" ("status","ends_at");
CREATE INDEX IF NOT EXISTS "auctions_audience_idx" ON "auctions" ("audience","country_code","published");

CREATE TABLE IF NOT EXISTS "auction_bids" (
  "id" serial PRIMARY KEY NOT NULL,
  "auction_id" integer NOT NULL,
  "bidder_id" integer NOT NULL,
  "amount" numeric(14, 2) NOT NULL,
  "status" varchar(12) DEFAULT 'acceptee' NOT NULL,
  "reject_reason" varchar(160),
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "auction_bids_auction_idx" ON "auction_bids" ("auction_id","created_at");

CREATE TABLE IF NOT EXISTS "auction_events" (
  "id" serial PRIMARY KEY NOT NULL,
  "auction_id" integer NOT NULL,
  "event" varchar(32) NOT NULL,
  "user_id" integer,
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "auction_events_auction_idx" ON "auction_events" ("auction_id","created_at");
