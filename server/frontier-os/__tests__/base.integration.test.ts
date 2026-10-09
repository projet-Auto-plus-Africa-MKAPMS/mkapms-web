/**
 * Base indépendante du centre : migrations propres, journal, dérive, et règles d'or inscrites en base (contraintes).
 * Base jetable uniquement (garde ci-dessous) : le schéma « frontier » y est supprimé puis recréé.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import pg from "pg";
import { configurerBase, fermerBase, poolFrontier } from "../base/connexion.js";
import { assurerBase, oublierEtatBasePourTests } from "../base/demarrage.js";
import { migrer } from "../base/migrateur.js";
import { urlDeTest } from "./utilitaires.js";

const url = urlDeTest();
let p: pg.Pool;

before(async () => {
  await configurerBase(url);
  p = poolFrontier();
  await p.query("DROP SCHEMA IF EXISTS frontier CASCADE");
  oublierEtatBasePourTests();
});
after(async () => {
  await fermerBase();
});

const refuse = async (sql: string, params: unknown[] = [], motif?: RegExp) => {
  await assert.rejects(p.query(sql, params), (e: Error) => {
    if (motif) assert.match(e.message, motif);
    return true;
  });
};

test("migrations propres : appliquées une fois, journalisées, idempotentes", async () => {
  const r1 = await migrer(p);
  assert.deepEqual(r1.appliquees, ["0001_identite_et_registre.sql", "0002_chaine_commandes_et_exploitation.sql", "0003_liaisons_reelles.sql", "0004_lacunes_developpement.sql"]);
  const r2 = await migrer(p);
  assert.deepEqual(r2.appliquees, []);
  assert.equal(r2.dejaAppliquees.length, 4);
  const j = (await p.query("SELECT name, length(checksum) l FROM frontier.migrations ORDER BY name")).rows;
  assert.equal(j.length, 4);
  assert.ok(j.every((x) => x.l === 64));
  const tables = (await p.query("SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = 'frontier' AND table_type = 'BASE TABLE'")).rows[0].n;
  assert.ok(tables >= 28, `tables du centre : ${tables}`);
});

test("démarrage : assurerBase est idempotent et ne plante jamais", async () => {
  oublierEtatBasePourTests();
  const e = await assurerBase();
  assert.equal(e.prete, true);
  assert.equal(e.erreur, null);
  assert.ok(e.migrations);
});

test("dérive : un fichier appliqué dont le contenu change bloque le migrateur", async () => {
  await p.query("UPDATE frontier.migrations SET checksum = repeat('0', 64) WHERE name = '0001_identite_et_registre.sql'");
  await assert.rejects(migrer(p), /Dérive détectée/);
  const bon = (await import("node:crypto")).createHash("sha256").update((await import("node:fs")).readFileSync(new URL("../base/migrations/0001_identite_et_registre.sql", import.meta.url), "utf8")).digest("hex");
  await p.query("UPDATE frontier.migrations SET checksum = $1 WHERE name = '0001_identite_et_registre.sql'", [bon]);
  await migrer(p);
});

async function socle() {
  await p.query("TRUNCATE frontier.companies, frontier.audit_log RESTART IDENTITY CASCADE");
  await p.query("INSERT INTO frontier.companies (code, name, role) VALUES ('mkapms', 'MKA.P-MS', 'center_owner')");
  await p.query("INSERT INTO frontier.platforms (code, company_code, name, kind, identity_status, status) VALUES ('main', 'mkapms', 'Plateforme principale', 'main', 'verified', 'active'), ('shop', 'mkapms', 'Boutique', 'shop', 'verified', 'active')");
  const moteur = (code: string, kind: string, plateforme = "main") =>
    p.query("INSERT INTO frontier.engines (code, platform_code, owner_kind, owner_code, name, kind, origin) VALUES ($1, $2, 'platform', $2, $1, $3, 'center')", [code, plateforme, kind]);
  await moteur("cmd.a", "command");
  await moteur("cmd.b", "command");
  await moteur("ver.a", "verification");
  await moteur("real.1", "real", "shop");
  await moteur("sw.1", "switch_element");
  await moteur("ct.1", "contact_element");
  await moteur("sw.2", "switch_element");
  await p.query("INSERT INTO frontier.groups (code, name, platform_code, owner_kind, owner_code) VALUES ('gr', 'Groupe', 'shop', 'platform', 'shop')");
}

test("règle d'or : une cible commandable a deux moteurs internes DISTINCTS, l'un de commande, l'autre de vérification", async () => {
  await socle();
  await p.query("INSERT INTO frontier.engine_bindings (target_kind, target_code, command_engine, verification_engine) VALUES ('button', 'ok', 'cmd.a', 'ver.a')");
  await refuse("INSERT INTO frontier.engine_bindings (target_kind, target_code, command_engine, verification_engine) VALUES ('button', 'meme', 'cmd.a', 'cmd.a')");
  await refuse("INSERT INTO frontier.engine_bindings (target_kind, target_code, command_engine, verification_engine) VALUES ('button', 'deux-commandes', 'cmd.a', 'cmd.b')", [], /vérification/);
  await refuse("INSERT INTO frontier.engine_bindings (target_kind, target_code, command_engine, verification_engine) VALUES ('button', 'inverse', 'ver.a', 'cmd.a')", [], /commande/);
  await refuse("INSERT INTO frontier.engine_bindings (target_kind, target_code, command_engine, verification_engine) VALUES ('button', 'ok', 'cmd.b', 'ver.a')"); // une seule paire par cible
  await refuse("INSERT INTO frontier.commands (kind, target_kind, target_id, requested, actor_type, command_engine, verification_engine) VALUES ('cut', 'cut', '1', 'activate', 'pdg', 'cmd.a', 'cmd.a')");
});

test("réserves : « À venir », vides, désactivées, sans moteur ni coupure ; une réelle a ses trois éléments de coupure", async () => {
  await socle();
  const reserve = "INSERT INTO frontier.lines (group_code, position, kind, label, owner_kind, owner_code) VALUES ('gr', $1, 'reserve', $2, 'platform', 'shop')";
  await p.query(reserve, [1, "À venir"]);
  await refuse(reserve, [2, "Autre nom"]);
  await refuse("INSERT INTO frontier.lines (group_code, position, kind, label, enabled, owner_kind, owner_code) VALUES ('gr', 3, 'reserve', 'À venir', true, 'platform', 'shop')");
  await refuse("INSERT INTO frontier.lines (group_code, position, kind, label, remote_real_engine, owner_kind, owner_code) VALUES ('gr', 4, 'reserve', 'À venir', 'real.1', 'platform', 'shop')");
  await refuse("INSERT INTO frontier.lines (group_code, position, kind, label, channel, owner_kind, owner_code) VALUES ('gr', 5, 'reserve', 'À venir', 'catalogue', 'platform', 'shop')");
  // Une réelle sans contact central est refusée ; avec ses trois éléments, elle est acceptée mais non valide tant que les sept n'existent pas.
  await refuse("INSERT INTO frontier.lines (group_code, position, kind, label, remote_switch, owner_kind, owner_code) VALUES ('gr', 6, 'real', 'R', 'sw.1', 'platform', 'shop')");
  const id = (await p.query("INSERT INTO frontier.lines (group_code, position, kind, label, remote_switch, center_contact, main_switch, owner_kind, owner_code) VALUES ('gr', 7, 'real', 'R', 'sw.1', 'ct.1', 'sw.2', 'platform', 'shop') RETURNING id")).rows[0].id;
  await refuse("UPDATE frontier.lines SET validity = 'valid' WHERE id = $1", [id]); // il manque quatre éléments
  // Les coupures n'existent que sur les lignes réelles.
  const idReserve = (await p.query("SELECT id FROM frontier.lines WHERE kind = 'reserve' LIMIT 1")).rows[0].id;
  await refuse("INSERT INTO frontier.cuts (line_id, side, element_code, owner_kind, owner_code) VALUES ($1, 'center', 'ct.1', 'platform', 'shop')", [idReserve], /ligne réelle/);
  await p.query("INSERT INTO frontier.cuts (line_id, side, element_code, owner_kind, owner_code) VALUES ($1, 'center', 'ct.1', 'platform', 'shop')", [id]);
  await refuse("INSERT INTO frontier.cuts (line_id, side, element_code, owner_kind, owner_code) VALUES ($1, 'center', 'ct.1', 'platform', 'shop')", [id]); // une coupure par côté
  await refuse("INSERT INTO frontier.cuts (line_id, side, element_code, owner_kind, owner_code) VALUES ($1, 'milieu', 'ct.1', 'platform', 'shop')", [id]);
});

test("propriété explicite : chaque donnée appartient au centre, à une entreprise ou à une plateforme", async () => {
  await socle();
  await refuse("INSERT INTO frontier.memory_blocks (key, kind, owner_kind, owner_code) VALUES ('k', 'note', 'inconnu', 'x')");
  await refuse("INSERT INTO frontier.memory_blocks (key, kind, owner_kind, owner_code) VALUES ('k', 'note', 'center', 'une-plateforme')");
  await p.query("INSERT INTO frontier.memory_blocks (key, kind, content, owner_kind, owner_code) VALUES ('k', 'note', '{\"a\":1}', 'company', 'mkapms')");
  const colonnes = (await p.query(`SELECT table_name FROM information_schema.columns WHERE table_schema = 'frontier' AND column_name = 'owner_kind'`)).rows.map((r) => r.table_name);
  for (const t of ["engines", "lines", "cuts", "commands", "command_receipts", "exchanges", "incidents", "repairs", "memory_blocks", "audit_log", "test_sessions", "config_history", "secret_refs", "groups", "buttons", "rooms", "access_grants", "engine_bindings"]) {
    assert.ok(colonnes.includes(t), `${t} porte owner_kind`);
  }
});

test("secrets : seule une référence (nom de variable ou chemin de coffre) est acceptée, jamais une valeur", async () => {
  await socle();
  await p.query("INSERT INTO frontier.secret_refs (name, store, ref, purpose) VALUES ('stripe-boutique', 'railway_env', 'SHOP_STRIPE_SECRET_KEY', 'paiement')");
  await p.query("INSERT INTO frontier.secret_refs (name, store, ref) VALUES ('jeton-service', 'platform_vault', 'vault:shop/service-token')");
  await refuse("INSERT INTO frontier.secret_refs (name, store, ref) VALUES ('v1', 'railway_env', 'sk_live_51Habcdef0123456789')");
  await refuse("INSERT INTO frontier.secret_refs (name, store, ref) VALUES ('v2', 'platform_vault', 'eyJhbGciOiJIUzI1NiJ9.eyJ4Ijoi')");
  await refuse("INSERT INTO frontier.secret_refs (name, store, ref) VALUES ('v3', 'none', 'une valeur')");
});

test("API et abonnements : préparés, jamais actifs", async () => {
  await socle();
  await p.query("INSERT INTO frontier.api_slots (code, name, company_code) VALUES ('api-clients', 'API clients', 'mkapms')");
  await refuse("INSERT INTO frontier.api_slots (code, name, status) VALUES ('api-active', 'x', 'active')");
  await p.query("INSERT INTO frontier.subscriptions (company_code, plan) VALUES ('mkapms', 'futur')");
  await refuse("INSERT INTO frontier.subscriptions (company_code, plan, status) VALUES ('mkapms', 'p2', 'active')");
});

test("moteur « connecté » : seulement avec une mesure ; boutons critiques : confirmation obligatoire", async () => {
  await socle();
  await refuse("INSERT INTO frontier.engines (code, platform_code, owner_kind, owner_code, name, kind, origin, inventory_state, evidence_level) VALUES ('x.1', 'shop', 'platform', 'shop', 'x', 'real', 'inventory', 'connecte', 'tests')");
  await p.query("INSERT INTO frontier.engines (code, platform_code, owner_kind, owner_code, name, kind, origin, inventory_state, evidence_level) VALUES ('x.2', 'shop', 'platform', 'shop', 'x', 'real', 'inventory', 'connecte', 'mesure')");
  await p.query("INSERT INTO frontier.buttons (code, name, target_kind, danger_level, requires_confirmation) VALUES ('b1', 'Test', 'line', 4, true)");
  await refuse("INSERT INTO frontier.buttons (code, name, target_kind, danger_level, requires_confirmation) VALUES ('b2', 'Test', 'line', 4, false)");
});

test("journal d'audit en ajout seul", async () => {
  await socle();
  const id = (await p.query("INSERT INTO frontier.audit_log (actor_type, action, result) VALUES ('system', 'essai', 'ok') RETURNING id")).rows[0].id;
  await refuse("UPDATE frontier.audit_log SET result = 'error' WHERE id = $1", [id], /ajout seul/);
  await refuse("DELETE FROM frontier.audit_log WHERE id = $1", [id], /ajout seul/);
  assert.equal((await p.query("SELECT count(*)::int n FROM frontier.audit_log")).rows[0].n, 1);
});
