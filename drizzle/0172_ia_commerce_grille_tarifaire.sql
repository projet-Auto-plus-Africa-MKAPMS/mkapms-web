-- AL-HOUDOUD·M — Commerce IA. Les offres (prix/quotas/fonctionnalités) vivent dans le
-- registre existant payment_products (univers="ia", voir server/ia-commerce/catalog.ts) :
-- aucune table de plans créée ici. Seul ce qui n'a pas d'équivalent réutilisable est ajouté :
-- le portefeuille de crédits prépayés (le `wallets` existant représente l'inverse — de l'argent
-- dû à un pro, pas un solde prépayé consommé par un client) et deux catégories d'abonnement IA
-- additives sur la table `subscriptions` déjà générique.
ALTER TYPE "subscription_category" ADD VALUE IF NOT EXISTS 'ia_decouverte';
--> statement-breakpoint
ALTER TYPE "subscription_category" ADD VALUE IF NOT EXISTS 'ia_abonnement';
--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "quota_unites_ia" integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ia_credit_wallets (
	id bigserial PRIMARY KEY,
	user_id integer NOT NULL UNIQUE,
	balance_unites numeric(14, 2) NOT NULL DEFAULT '0',
	updated_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ia_credit_ledger (
	id bigserial PRIMARY KEY,
	user_id integer NOT NULL,
	type varchar(24) NOT NULL,
	unites numeric(14, 2) NOT NULL,
	solde_apres numeric(14, 2) NOT NULL,
	payment_id integer,
	af_cost_entry_id integer,
	note text,
	metadata jsonb,
	created_at timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS ia_credit_ledger_user_idx ON ia_credit_ledger (user_id, created_at);
