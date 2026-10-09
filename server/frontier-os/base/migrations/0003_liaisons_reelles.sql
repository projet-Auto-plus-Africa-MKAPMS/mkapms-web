-- Centre Cyber-Électrique — liaisons réelles : ordres donnés à l'interrupteur local de la Boutique et rapports signés qu'elle renvoie.
-- Additif seulement : aucune table existante n'est modifiée. Chaque ligne a un propriétaire explicite (règle d'or du centre).

CREATE TABLE frontier.remote_orders (
  id               bigserial PRIMARY KEY,
  line_id          integer NOT NULL REFERENCES frontier.lines (id),
  cut_id           integer NOT NULL REFERENCES frontier.cuts (id),
  wanted           text NOT NULL CHECK (wanted IN ('activate', 'deactivate')),
  command_id       bigint REFERENCES frontier.commands (id),
  status           text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'acked', 'expired', 'cancelled')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  delivered_at     timestamptz,
  acked_at         timestamptz,
  ack_state        text CHECK (ack_state IN ('connected', 'disconnected')),
  ack_observed_at  timestamptz,
  ack_key_id       integer,
  owner_kind       text NOT NULL DEFAULT 'platform' CHECK (owner_kind IN ('center', 'company', 'platform')),
  owner_code       text NOT NULL DEFAULT 'shop',
  CHECK (owner_kind <> 'center' OR owner_code = 'center'),
  CHECK (status <> 'acked' OR (ack_state IS NOT NULL AND acked_at IS NOT NULL))
);
CREATE INDEX remote_orders_open_idx ON frontier.remote_orders (line_id, status, created_at DESC);

-- Le DERNIER état observé par la Boutique elle-même pour l'interrupteur local d'une ligne (une seule ligne par ligne du centre).
CREATE TABLE frontier.remote_reports (
  line_id        integer PRIMARY KEY REFERENCES frontier.lines (id),
  state          text NOT NULL CHECK (state IN ('connected', 'disconnected')),
  observed_at    timestamptz NOT NULL,
  received_at    timestamptz NOT NULL DEFAULT now(),
  key_id         integer,
  order_id       bigint REFERENCES frontier.remote_orders (id),
  owner_kind     text NOT NULL DEFAULT 'platform' CHECK (owner_kind IN ('center', 'company', 'platform')),
  owner_code     text NOT NULL DEFAULT 'shop',
  CHECK (owner_kind <> 'center' OR owner_code = 'center')
);
