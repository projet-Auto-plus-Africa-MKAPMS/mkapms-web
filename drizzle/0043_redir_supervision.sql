-- Moteur de Redirection — supervision des parcours.
-- On enrichit le journal des résolutions pour suivre : la source du clic,
-- le résultat réel (résolu / navigué / introuvable / erreur), la durée et
-- l'erreur éventuelle. Permet de remonter automatiquement les redirections
-- cassées (404, clés sans règle, erreurs) dans le centre de contrôle PDG.
ALTER TABLE "redir_logs" ADD COLUMN IF NOT EXISTS "source" varchar(256);
ALTER TABLE "redir_logs" ADD COLUMN IF NOT EXISTS "outcome" varchar(24) DEFAULT 'resolved';
ALTER TABLE "redir_logs" ADD COLUMN IF NOT EXISTS "duration_ms" integer;
ALTER TABLE "redir_logs" ADD COLUMN IF NOT EXISTS "error" text;
