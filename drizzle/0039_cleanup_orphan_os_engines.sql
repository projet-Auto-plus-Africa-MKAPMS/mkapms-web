-- MKA.P-MS Engine Registry — nettoyage des lignes moteurs en double (orphelines).
--
-- La PR #101 avait enregistré les moteurs OS sous les noms `identity-os`,
-- `country-os` et `language-os`. La PR #102 a retenu les noms canoniques
-- `identity`, `country` et `language` (ceux de l'autre agent) et a retiré les
-- doublons du catalogue + du pont. Mais les lignes déjà seedées en base
-- subsistaient, sans heartbeat → affichées « Dégradé » dans le centre de
-- contrôle. On supprime ici ces 3 doublons orphelins.
--
-- Idempotent : ne supprime que ces 3 noms précis ; ne touche pas aux moteurs
-- canoniques. Les journaux liés (santé, actions, événements) sont aussi purgés
-- pour ces noms afin de ne rien laisser d'orphelin.

DELETE FROM "engine_health_log" WHERE "engine_name" IN ('identity-os', 'country-os', 'language-os');
--> statement-breakpoint
DELETE FROM "engine_admin_log" WHERE "engine_name" IN ('identity-os', 'country-os', 'language-os');
--> statement-breakpoint
DELETE FROM "engine_events" WHERE "source" IN ('identity-os', 'country-os', 'language-os');
--> statement-breakpoint
DELETE FROM "engine_registry" WHERE "name" IN ('identity-os', 'country-os', 'language-os');
