-- Préférences utilisateur réellement persistées (confidentialité, coaching, cookies).
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id integer NOT NULL,
  namespace varchar(32) NOT NULL,
  valeurs jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_preferences_unique UNIQUE (user_id, namespace)
);

CREATE INDEX IF NOT EXISTS user_preferences_user_idx ON user_preferences (user_id);
