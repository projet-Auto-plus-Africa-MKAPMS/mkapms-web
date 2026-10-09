-- Centre Cyber-Électrique — lacunes de développement : le centre dit « je ne peux pas faire ça, il me faut tel développement »
-- au lieu de silencieusement échouer ou de prétendre réussir. Une lacune est déclarée par un moteur du centre (jamais par un
-- appel à une IA externe : voir server/frontier-os/__tests__/autonomie.test.ts), lue par le PDG, et close seulement quand le
-- développement correspondant existe réellement (par le PDG, ou automatiquement si le centre observe la preuve).

CREATE TABLE frontier.capability_gaps (
  id                  bigserial PRIMARY KEY,
  code                text NOT NULL CHECK (code ~ '^[a-z0-9][a-z0-9_.-]{1,80}$'),
  title               text NOT NULL CHECK (length(title) BETWEEN 3 AND 200),
  detail              text NOT NULL CHECK (length(detail) BETWEEN 3 AND 2000),
  development_needed  text NOT NULL CHECK (length(development_needed) BETWEEN 3 AND 2000),
  engine_code         text,
  status              text NOT NULL DEFAULT 'declared' CHECK (status IN ('declared', 'resolved')),
  raised_by           text NOT NULL DEFAULT 'center',
  owner_kind          text NOT NULL DEFAULT 'center' CHECK (owner_kind IN ('center', 'company', 'platform')),
  owner_code          text NOT NULL DEFAULT 'center',
  declared_at         timestamptz NOT NULL DEFAULT now(),
  resolved_at         timestamptz,
  resolved_by         text,
  resolved_note       text,
  CHECK (owner_kind <> 'center' OR owner_code = 'center'),
  CHECK (status <> 'resolved' OR (resolved_at IS NOT NULL AND resolved_note IS NOT NULL)),
  UNIQUE (code)
);
CREATE INDEX capability_gaps_status_idx ON frontier.capability_gaps (status, declared_at DESC);
