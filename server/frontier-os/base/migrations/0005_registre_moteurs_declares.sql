-- Registre étendu des moteurs déclarés du Centre (demande du PDG, 9 octobre 2026) : au moins 100 moteurs internes
-- propres au Centre, au moins 40 par ensemble de connecteur entre deux plateformes, des moteurs de réserve désactivés,
-- des emplacements vides pour les futures plateformes. Étend la table `engines` déjà existante (jamais une seconde
-- vérité) : nouvelle valeur de `kind` pour les moteurs génériques déclarés (hors chaîne de commande/vérification),
-- nouvelles valeurs d'état propres au Centre, et trois colonnes neuves (salle propriétaire, ensemble de connecteur,
-- présence d'un interrupteur manuel). Le journal des changements d'état réutilise `config_history` (déjà générique :
-- entity/entity_id/field/old_value/new_value/actor) — aucune nouvelle table de journal.

ALTER TABLE frontier.engines DROP CONSTRAINT engines_kind_check;
ALTER TABLE frontier.engines ADD CONSTRAINT engines_kind_check
  CHECK (kind IN ('real', 'intermediary', 'command', 'verification', 'transport', 'monitor', 'switch_element', 'contact_element', 'declared'));

ALTER TABLE frontier.engines DROP CONSTRAINT engines_inventory_state_check;
ALTER TABLE frontier.engines ADD CONSTRAINT engines_inventory_state_check
  CHECK (inventory_state IN ('incomplet', 'prepare', 'installe', 'teste', 'connecte', 'a_verifier', 'vide', 'actif', 'bloque', 'erreur'));

ALTER TABLE frontier.engines ADD COLUMN room_code text;
ALTER TABLE frontier.engines ADD COLUMN connector_set text;
ALTER TABLE frontier.engines ADD COLUMN manual_switch boolean NOT NULL DEFAULT false;

CREATE INDEX engines_room_idx ON frontier.engines (room_code) WHERE room_code IS NOT NULL;
CREATE INDEX engines_connector_set_idx ON frontier.engines (connector_set) WHERE connector_set IS NOT NULL;
