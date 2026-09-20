DO $$ BEGIN
  CREATE TYPE "rental_contract_status" AS ENUM ('actif', 'termine', 'remplace', 'renouvele', 'annule');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "rental_contracts" (
  "id" bigserial PRIMARY KEY,
  "application_id" bigint NOT NULL,
  "vehicle_id" bigint,
  "user_id" bigint NOT NULL,
  "start_date" timestamp with time zone NOT NULL,
  "end_date" timestamp with time zone,
  "status" "rental_contract_status" NOT NULL DEFAULT 'actif',
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
