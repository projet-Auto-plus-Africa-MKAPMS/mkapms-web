ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "status" "user_status" NOT NULL DEFAULT 'active';
