-- Add categorie column to annonce_photos for photo category filtering
ALTER TABLE "annonce_photos" ADD COLUMN IF NOT EXISTS "categorie" varchar(32);
