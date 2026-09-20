-- DemandePublicite.tsx soumettait un formulaire réel (upload de fichier réel
-- vers /api/upload) mais ne persistait jamais rien : aucune colonne
-- n'existait pour le contenu créatif réel (photo/vidéo/lien) ni pour le pays
-- du demandeur. Additif pur sur pub_requests (table déjà réelle, déjà
-- utilisée par le moteur de revue admin.pubRequestsList/decidePubRequest).
ALTER TABLE "pub_requests" ADD COLUMN IF NOT EXISTS "budget_amount_eur" numeric(10, 2);
ALTER TABLE "pub_requests" ADD COLUMN IF NOT EXISTS "pays" varchar(2);
ALTER TABLE "pub_requests" ADD COLUMN IF NOT EXISTS "content_type" varchar(16) NOT NULL DEFAULT 'lien';
ALTER TABLE "pub_requests" ADD COLUMN IF NOT EXISTS "media_url" text;
ALTER TABLE "pub_requests" ADD COLUMN IF NOT EXISTS "link_url" text;
