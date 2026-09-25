-- Tâche #66 (doctrine PDG v1.1, §12.1) : product_feed_items.pays/langue/devise
-- ne doivent plus jamais retomber sur une valeur "France/EUR" par défaut au
-- niveau schéma. Le service (server/product-engine/service.ts) fournit
-- désormais toujours le pays réel de la boutique (parts_shops.country_code)
-- ou du propriétaire (users.country/currency) sur chaque insertion ; retirer
-- le défaut empêche qu'un futur insert silencieux ne réintroduise le bug.
-- Additif et sans risque : aucune ligne existante n'est modifiée, seul le
-- comportement par défaut d'un futur INSERT sans valeur explicite change.

ALTER TABLE "product_feed_items" ALTER COLUMN "pays" DROP DEFAULT;
ALTER TABLE "product_feed_items" ALTER COLUMN "langue" DROP DEFAULT;
ALTER TABLE "product_feed_items" ALTER COLUMN "devise" DROP DEFAULT;
