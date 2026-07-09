-- Bouton « Acheter » (achat comptant) : ajout ADDITIF du type de paiement
-- "vehicle_purchase" à l'enum existant. Aucune valeur retirée. Non destructif.

ALTER TYPE "payment_type" ADD VALUE IF NOT EXISTS 'vehicle_purchase';
