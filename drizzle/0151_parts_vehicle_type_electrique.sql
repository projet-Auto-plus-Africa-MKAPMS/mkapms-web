-- Les pièces de véhicules électriques constituent un univers transversal :
-- voiture, utilitaire, camion, moto, scooter et bateau électrique. Le type
-- dédié permet de les rechercher sans les confondre avec une pièce thermique.
ALTER TYPE "parts_vehicle_type" ADD VALUE IF NOT EXISTS 'electrique';
