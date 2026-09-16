-- Architecture 3 — sélecteur de type de véhicule de la maquette homepage
-- Pièces. Additif : nouvelle colonne "type_vehicule" sur "parts_catalog",
-- valeur par défaut "voiture" pour tout le catalogue existant, implicitement
-- automobile jusqu'ici (compatibilité marque/modèle/moteur uniquement).
-- Aucune perte de capacité : toute pièce déjà déclarée reste trouvable sans
-- filtre, et devient filtrable une fois son type réel renseigné.
CREATE TYPE "parts_vehicle_type" AS ENUM ('voiture', 'utilitaire', 'moto', 'agricole', 'engin_chantier', 'bateau');

ALTER TABLE "parts_catalog" ADD COLUMN IF NOT EXISTS "type_vehicule" "parts_vehicle_type" DEFAULT 'voiture' NOT NULL;
