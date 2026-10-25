ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_allowed" boolean NOT NULL DEFAULT false;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_premium_enabled" boolean NOT NULL DEFAULT false;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_delay_hours" integer;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_eligibility_conditions" text;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_fee" numeric(10, 2);
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_required_vehicle_condition" text;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_required_documents" text;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_refund_policy" text;
ALTER TABLE "supplier_profiles" ADD COLUMN IF NOT EXISTS "return_transport_responsibility" varchar(24);
