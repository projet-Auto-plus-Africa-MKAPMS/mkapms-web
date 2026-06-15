-- Boutique Pièces Auto: enrichissement du schéma (Mini-ERP complet)

-- parts_catalog: colonnes manquantes
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "reference_interne" varchar(64);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "reference_oem" varchar(64);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "reference_equipementier" varchar(64);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "code_barre" varchar(64);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "sous_categorie" varchar(128);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "marque_piece" varchar(128);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "etat" varchar(16);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "fournisseur_id" integer;
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "tva_rate" numeric(5,2) NOT NULL DEFAULT '20';
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "poids_kg" numeric(8,3);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "longueur_cm" numeric(8,2);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "largeur_cm" numeric(8,2);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "hauteur_cm" numeric(8,2);
ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "photos" text;

-- parts_orders: colonnes manquantes (référence, buyer, totaux, etc.)
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "reference" varchar(32);
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "buyer_id" integer;
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "total_ht" numeric(12,2);
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "total_ttc" numeric(12,2);
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "devis_id" integer;
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "notes" text;

-- parts_order_items: colonne total manquante
ALTER TABLE "parts_order_items" ADD COLUMN IF NOT EXISTS "total_ht" numeric(12,2);

-- partsShops: enrichir si colonnes manquantes
ALTER TABLE "parts_shops" ADD COLUMN IF NOT EXISTS "code_postal" varchar(16);
ALTER TABLE "parts_shops" ADD COLUMN IF NOT EXISTS "country_code" varchar(4) DEFAULT 'FR';
ALTER TABLE "parts_shops" ADD COLUMN IF NOT EXISTS "telephone" varchar(32);
ALTER TABLE "parts_shops" ADD COLUMN IF NOT EXISTS "email" varchar(255);
ALTER TABLE "parts_shops" ADD COLUMN IF NOT EXISTS "siret" varchar(32);
ALTER TABLE "parts_shops" ADD COLUMN IF NOT EXISTS "logo_url" text;

-- Tables nouvelles si manquantes

-- parts_sites (multi-sites)
CREATE TABLE IF NOT EXISTS "parts_sites" (
  "id" serial PRIMARY KEY NOT NULL,
  "shop_id" integer NOT NULL,
  "nom" varchar(255) NOT NULL,
  "type" varchar(32) NOT NULL DEFAULT 'magasin',
  "adresse" text,
  "ville" varchar(128),
  "code_postal" varchar(16),
  "country_code" varchar(4) DEFAULT 'FR',
  "lat" numeric(10,7),
  "lng" numeric(10,7),
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- parts_compatibility
CREATE TABLE IF NOT EXISTS "parts_compatibility" (
  "id" serial PRIMARY KEY NOT NULL,
  "catalog_id" integer NOT NULL,
  "marque" varchar(64) NOT NULL,
  "modele" varchar(64),
  "moteur" varchar(64),
  "annee_debut" integer,
  "annee_fin" integer
);

-- parts_stock
CREATE TABLE IF NOT EXISTS "parts_stock" (
  "id" serial PRIMARY KEY NOT NULL,
  "catalog_id" integer NOT NULL,
  "site_id" integer,
  "quantite" integer NOT NULL DEFAULT 0,
  "quantite_reservee" integer NOT NULL DEFAULT 0,
  "seuil_min" integer NOT NULL DEFAULT 5,
  "entrepot" varchar(64),
  "rayon" varchar(64),
  "etagere" varchar(64),
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- parts_invoices
CREATE TABLE IF NOT EXISTS "parts_invoices" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer,
  "shop_id" integer NOT NULL,
  "buyer_id" integer,
  "type" varchar(16) NOT NULL DEFAULT 'facture',
  "reference" varchar(64),
  "status" varchar(16) NOT NULL DEFAULT 'brouillon',
  "total_ht" numeric(12,2),
  "total_tva" numeric(12,2),
  "total_ttc" numeric(12,2),
  "pdf_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- devis_items: colonnes type + catalog_id pour liaison pièces
ALTER TABLE "devis_items" ADD COLUMN IF NOT EXISTS "type" varchar(16) NOT NULL DEFAULT 'main_oeuvre';
ALTER TABLE "devis_items" ADD COLUMN IF NOT EXISTS "catalog_id" integer;

-- Boutique: mode retrait + suivi colis sur parts_orders
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "mode_retrait" varchar(16) NOT NULL DEFAULT 'livraison';
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "numero_colis" varchar(64);
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "tracking_url" text;
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "estimated_delivery" timestamp;
ALTER TABLE "parts_orders" ADD COLUMN IF NOT EXISTS "delivered_at" timestamp;

-- Suivi de commande (étapes détaillées)
CREATE TABLE IF NOT EXISTS "parts_order_tracking" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "status" varchar(32) NOT NULL,
  "label" varchar(255) NOT NULL,
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Suivi universel des services
CREATE TABLE IF NOT EXISTS "service_tracking" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "service_type" varchar(32) NOT NULL,
  "service_id" integer NOT NULL,
  "reference" varchar(64),
  "titre" varchar(255) NOT NULL,
  "status" varchar(32) NOT NULL,
  "status_label" varchar(128) NOT NULL,
  "detail" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Tarifs livraison personnalisables
CREATE TABLE IF NOT EXISTS "delivery_pricing" (
  "id" serial PRIMARY KEY NOT NULL,
  "vehicle_type" varchar(32) NOT NULL,
  "label" varchar(64) NOT NULL,
  "poids_max_kg" numeric(8,2) NOT NULL,
  "dimension_max_cm" numeric(8,2) NOT NULL,
  "prix_base" numeric(10,2) NOT NULL,
  "prix_par_km" numeric(6,2) NOT NULL DEFAULT '0.50',
  "active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp DEFAULT now() NOT NULL
);
