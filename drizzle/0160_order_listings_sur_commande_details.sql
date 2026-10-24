ALTER TABLE "order_listings" ADD COLUMN IF NOT EXISTS "vehicle_location" varchar(200);
ALTER TABLE "order_listings" ADD COLUMN IF NOT EXISTS "delivery_prep_details" text;
ALTER TABLE "order_listings" ADD COLUMN IF NOT EXISTS "return_to_stock_if_unsold" boolean DEFAULT false NOT NULL;
ALTER TABLE "order_listings" ADD COLUMN IF NOT EXISTS "installment_payment_allowed" boolean DEFAULT false NOT NULL;
ALTER TABLE "order_listings" ADD COLUMN IF NOT EXISTS "supplier_purchase_price_estimated" numeric(12, 2);
ALTER TABLE "order_listings" ADD COLUMN IF NOT EXISTS "transport_cost_estimated" numeric(12, 2);
ALTER TABLE "order_listings" ADD COLUMN IF NOT EXISTS "target_margin_percent" numeric(5, 2);
