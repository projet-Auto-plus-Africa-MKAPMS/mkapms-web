-- Activate the public worldwide supplier universe.
-- The public page is informational and routes applications through the
-- existing partner intake; supplier account activation remains protected.
UPDATE "modules"
SET
  "status" = 'active',
  "visible_public" = true,
  "description" = 'Réseau mondial de fournisseurs, véhicules, pièces, catalogues et solutions d’import/export.',
  "updated_at" = now()
WHERE "code" = 'fournisseurs';
