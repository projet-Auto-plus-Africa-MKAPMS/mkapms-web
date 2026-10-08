/**
 * Centre Cyber-Électrique MKA.P-MS / Frontier OS — fondation, règles d'or inscrites en base, actions en simulation, miroirs, atelier,
 * routeur PDG. Base PostgreSQL jetable (core_ai_test), migrations 0031 (registre), 0156 (câble Boutique) et 0157 (centre) appliquées.
 */
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const PDG = 1;
type M = {
  pool: import("pg").Pool;
  service: typeof import("../service.js");
  index: typeof import("../index.js");
  rules: typeof import("../rules.js");
  inventory: typeof import("../shop-inventory.js");
};
let m: M;

const pdg = () => m.index.frontierOsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: PDG, role: "super_admin", email: "pdg@exemple.test" } });
const q = async <T = Record<string, unknown>>(texte: string, valeurs: unknown[] = []) => (await m.pool.query(texte, valeurs)).rows as T[];
const un = async (texte: string, valeurs: unknown[] = []) => (await q<{ n: number }>(texte, valeurs))[0].n;
const rejette = async (texte: string, valeurs: unknown[], motif: RegExp) => {
  await assert.rejects(m.pool.query(texte, valeurs), motif);
};

async function appliquer(fichier: string) {
  for (const instruction of readFileSync(fichier, "utf8").split("--> statement-breakpoint")) if (instruction.trim()) await m.pool.query(instruction);
}

const bouton = async (code: string) => (await q<{ id: number }>("SELECT id FROM fo_buttons WHERE code = $1", [code]))[0].id;
const ligne = async (contrat: string) => (await q<{ id: number }>("SELECT id FROM fo_connection_lines WHERE code = $1", [`line:boutique:${contrat}`]))[0].id;
const statutLigne = async (id: number) => (await q<{ status: string; current_status: string; is_active: boolean }>("SELECT status, current_status, is_active FROM fo_connection_lines WHERE id = $1", [id]))[0];

before(async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "base de test locale uniquement");
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: url.href });
  m = { pool } as M;
  await pool.query(`DROP TABLE IF EXISTS fo_audit_logs, fo_repair_workshop, fo_security_zones, fo_memory_blocks, fo_switches, fo_pointages, fo_connection_lines, fo_control_groups, fo_buttons, fo_engine_pairs, fo_engines, fo_platforms,
    shop_link_cables, shop_link_cles, shop_link_rejeu, shop_link_journal, shop_link_etat_boutique, shop_link_documents, shop_link_ia_boite, engine_registry, engine_events, engine_health_log, engine_admin_log CASCADE`);
  await appliquer("drizzle/0031_engine_registry.sql");
  await appliquer("drizzle/0156_shop_link.sql");
  await appliquer("drizzle/0157_frontier_os.sql");
  m.service = await import("../service.js");
  m.index = await import("../index.js");
  m.rules = await import("../rules.js");
  m.inventory = await import("../shop-inventory.js");
});

after(async () => {
  await m?.pool.end();
  const { pool } = await import("../../db.js");
  await pool.end();
});

// ── Fondation ─────────────────────────────────────────────────────────────────────────────────────────────────────────
test("fondation : plateformes, groupes, zones, boutons, moteurs et lignes créés — six lignes réelles et trente futures pour la Boutique", async () => {
  const r = await m.service.assurerFondation();
  assert.equal(r.cree, true);
  assert.equal(r.plateformes, 9);
  assert.equal(r.groupes, 8);
  assert.equal(r.zones, 10);
  assert.equal(r.boutons, 10);
  const boutique = (await q<{ line_count_real: number; line_count_future: number }>("SELECT line_count_real, line_count_future FROM fo_control_groups WHERE code = 'boutique'"))[0];
  assert.deepEqual(boutique, { line_count_real: 6, line_count_future: 30 });
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE is_future_placeholder = false"), 6);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE group_id = (SELECT id FROM fo_control_groups WHERE code='boutique')"), 36, "6 + 30 = 36 lignes prévues");
  // Chaque autre groupe garde sa réserve de départ de cinq lignes futures vides.
  const autres = await q<{ code: string; line_count_real: number; line_count_future: number }>("SELECT code, line_count_real, line_count_future FROM fo_control_groups WHERE code <> 'boutique' ORDER BY code");
  assert.equal(autres.length, 7);
  for (const g of autres) assert.deepEqual([g.line_count_real, g.line_count_future], [0, 5], g.code);
  assert.equal(r.lignesReelles, 6);
  assert.equal(r.lignesFutures, 30 + 7 * 5);
  // Les six lignes réelles viennent des six intermédiaires préparés côté Boutique, dans l'ordre de l'inventaire.
  const codes = (await q<{ code: string }>("SELECT code FROM fo_connection_lines WHERE is_future_placeholder = false ORDER BY position")).map((l) => l.code);
  assert.deepEqual(codes, m.inventory.INTERMEDIAIRES_BOUTIQUE.map((i) => `line:boutique:${i.id}`));
  // Chaque ligne a deux interrupteurs et un pointage rouge, chacun étant un moteur.
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_switches"), 2 * (6 + 65));
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_pointages WHERE is_master_pointage AND engine_id IS NOT NULL"), 6 + 65);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_pointages WHERE color_state = 'red' AND connection_line_id IN (SELECT id FROM fo_connection_lines WHERE is_future_placeholder = false)"), 6);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE engine_id IS NULL"), 0);
});

test("fondation : idempotente (aucun doublon au second passage) et sans violation des règles d'or", async () => {
  const avant = await q("SELECT (SELECT count(*) FROM fo_engines)::int AS e, (SELECT count(*) FROM fo_connection_lines)::int AS l, (SELECT count(*) FROM fo_switches)::int AS s, (SELECT count(*) FROM fo_engine_pairs)::int AS p, (SELECT count(*) FROM fo_buttons)::int AS b");
  const r = await m.service.assurerFondation();
  assert.equal(r.cree, false);
  const apres = await q("SELECT (SELECT count(*) FROM fo_engines)::int AS e, (SELECT count(*) FROM fo_connection_lines)::int AS l, (SELECT count(*) FROM fo_switches)::int AS s, (SELECT count(*) FROM fo_engine_pairs)::int AS p, (SELECT count(*) FROM fo_buttons)::int AS b");
  assert.deepEqual(apres, avant);
  assert.deepEqual(await m.service.verifierIntegrite(), []);
});

test("moteurs : plateforme principale (catalogue central), Boutique (83 + 2 nommés par contrat, état non observé), intermédiaires des deux côtés", async () => {
  const { ENGINE_CATALOG } = await import("../../engine-registry/catalog.js");
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_engines WHERE state_source = 'registry'"), ENGINE_CATALOG.length);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_engines e JOIN fo_platforms p ON p.id = e.platform_id WHERE p.code = 'shop' AND e.engine_type = 'real_platform_engine'"), 83 + 2);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_engines e JOIN fo_platforms p ON p.id = e.platform_id WHERE p.code = 'shop' AND e.is_intermediary"), 6);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_engines WHERE code LIKE 'main:shop-link:%' AND is_intermediary"), 6);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_engines e JOIN fo_platforms p ON p.id = e.platform_id WHERE p.code = 'shop' AND e.state_source <> 'inventory'"), 0, "aucun état de la Boutique n'est prétendu observé");
  const types = (await q<{ engine_type: string }>("SELECT DISTINCT engine_type FROM fo_engines ORDER BY 1")).map((t) => t.engine_type);
  for (const t of ["real_platform_engine", "intermediary_engine", "button_engine", "switch_engine", "connection_engine", "security_engine", "memory_engine", "repair_engine", "audit_engine", "pointage_engine"]) assert.ok(types.includes(t), t);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_engines WHERE is_future_placeholder AND (status <> 'future' OR is_real_engine)"), 0);
});

// ── Règles d'or inscrites en base ────────────────────────────────────────────────────────────────────────────────────
test("règles d'or en base : un bouton, un interrupteur réel et une paire ont toujours deux moteurs distincts ; un moteur externe n'a qu'une paire", async () => {
  const [a, b] = (await q<{ id: number }>("SELECT id FROM fo_engines WHERE code IN ('fo:security','fo:audit') ORDER BY code")).map((x) => x.id);
  await rejette("INSERT INTO fo_buttons(code,name,button_type,primary_engine_id,secondary_engine_id,danger_level,requires_confirmation) VALUES('x','x','all_on',$1,$1,1,false)", [a], /fo_buttons_deux_moteurs/);
  await rejette("INSERT INTO fo_buttons(code,name,button_type,primary_engine_id,secondary_engine_id,danger_level,requires_confirmation) VALUES('x','x','all_on',$1,$2,5,false)", [a, b], /fo_buttons_critique_confirme/);
  await rejette("INSERT INTO fo_buttons(code,name,button_type,primary_engine_id,secondary_engine_id) VALUES('x','x','all_on',$1,NULL)", [a], /null value/);
  const l = (await q<{ id: number }>("SELECT id FROM fo_connection_lines LIMIT 1"))[0].id;
  await rejette("INSERT INTO fo_switches(code,name,switch_type,connection_line_id,primary_engine_id,secondary_engine_id) VALUES('x','x','line_left',$1,$2,$2)", [l, a], /fo_switches_deux_moteurs/);
  await rejette("INSERT INTO fo_switches(code,name,switch_type,connection_line_id) VALUES('y','y','line_left',$1)", [l], /fo_switches_deux_moteurs/);
  await rejette("INSERT INTO fo_engine_pairs(external_engine_id,internal_engine_primary_id,internal_engine_secondary_id) VALUES($1,$2,$2)", [a, b], /fo_engine_pairs_deux_moteurs/);
  const externe = (await q<{ external_engine_id: number }>("SELECT external_engine_id FROM fo_engine_pairs LIMIT 1"))[0].external_engine_id;
  await rejette("INSERT INTO fo_engine_pairs(external_engine_id,internal_engine_primary_id,internal_engine_secondary_id) VALUES($1,$2,$3)", [externe, a, b], /fo_engine_pairs_external_idx/);
  await rejette("UPDATE fo_connection_lines SET is_active = true WHERE is_future_placeholder", [], /fo_lines_future_vide/);
  await rejette("UPDATE fo_engines SET status = 'en_feu' WHERE code = 'fo:audit'", [], /check/);
  await rejette("UPDATE fo_switches SET status = 'MAYBE' WHERE id = (SELECT min(id) FROM fo_switches)", [], /check/);
  await rejette("UPDATE fo_switches SET manual_enabled = true WHERE is_future_placeholder", [], /fo_switches_futur_eteint/);
});

test("paires : tout moteur externe est surveillé par deux moteurs internes ; celles qui dépendent d'un canal en attente externe sont invalides", async () => {
  await m.service.rafraichirMiroirs();
  const sansPaire = await un("SELECT count(*)::int AS n FROM fo_engines e JOIN fo_platforms p ON p.id = e.platform_id LEFT JOIN fo_engine_pairs x ON x.external_engine_id = e.id WHERE p.code <> 'main' AND NOT e.is_future_placeholder AND x.id IS NULL");
  assert.equal(sansPaire, 0);
  const total = await un("SELECT count(*)::int AS n FROM fo_engine_pairs");
  assert.equal(total, 83 + 2 + 6);
  const invalides = (await q<{ code: string }>("SELECT e.code FROM fo_engine_pairs x JOIN fo_engines e ON e.id = x.external_engine_id WHERE x.status = 'invalid' ORDER BY e.code")).map((r) => r.code);
  assert.deepEqual(invalides, ["shop:intermediary:shared-google-owner", "shop:intermediary:shared-stripe-account", "shop:payment", "shop:seo.campaign"]);
  // Les deux moteurs d'une paire sont toujours distincts et internes.
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_engine_pairs x JOIN fo_engines a ON a.id = x.internal_engine_primary_id JOIN fo_engines b ON b.id = x.internal_engine_secondary_id JOIN fo_platforms pa ON pa.id = a.platform_id JOIN fo_platforms pb ON pb.id = b.platform_id WHERE pa.code <> 'main' OR pb.code <> 'main' OR a.id = b.id"), 0);
});

test("boutons : dix boutons, chacun avec deux moteurs distincts, confirmation obligatoire dès que l'action est critique", async () => {
  const b = await q<{ code: string; danger_level: number; requires_confirmation: boolean; primary_engine_id: number; secondary_engine_id: number; engine_id: number }>("SELECT * FROM fo_buttons ORDER BY id");
  assert.deepEqual(b.map((x) => x.code), ["all_on", "all_off", "line_on", "line_off", "test_current", "lock", "unlock", "diagnostic", "repair", "pointage_toggle"]);
  for (const x of b) {
    assert.notEqual(x.primary_engine_id, x.secondary_engine_id, x.code);
    assert.ok(x.engine_id, `${x.code} est lui-même un moteur`);
    assert.equal(x.requires_confirmation, x.danger_level >= 3, x.code);
  }
});

// ── Lignes et validité ───────────────────────────────────────────────────────────────────────────────────────────────
test("lignes : trois sont valides (documents, état, catalogue) ; entrée (pas d'intermédiaire plateforme), paiement et Google (attente externe) ne le sont pas", async () => {
  const vue = await m.service.lignesVue((await q<{ id: number }>("SELECT id FROM fo_control_groups WHERE code='boutique'"))[0].id);
  const reelles = vue.filter((l) => !l.estFuture);
  const par = Object.fromEntries(reelles.map((l) => [l.contrat, l]));
  assert.deepEqual(reelles.filter((l) => l.valide).map((l) => l.contrat).sort(), ["service-access", "shop-documents-only", "shop-intelligence-isolated"]);
  assert.match(par["main-to-shop-entry"].raisons.join(" "), /Moteur intermédiaire de droite : absent/);
  assert.match(par["shared-stripe-account"].raisons.join(" "), /verrouillé ou en attente/);
  assert.match(par["shared-google-owner"].raisons.join(" "), /verrouillé ou en attente/);
  assert.equal(par["shared-stripe-account"].etatReel, "attente_externe");
  assert.equal(par["main-to-shop-entry"].etatReel, "sans_canal");
  assert.equal(par["shop-documents-only"].etatReel, "coupe", "le câble réel est coupé par défaut");
  for (const l of reelles) {
    assert.equal(l.status, "off");
    assert.equal(l.maillons.length, 4);
    assert.equal(l.interrupteurs.length, 2);
    assert.equal(l.pointage?.couleur, "red");
  }
  const futures = vue.filter((l) => l.estFuture);
  assert.equal(futures.length, 30);
  for (const l of futures) {
    assert.deepEqual([l.status, l.valide, l.maillons.every((x) => x.moteur === null), l.interrupteurs.every((s) => s.statut === "OFF" && !s.manuel)], ["future", false, true, true], l.code);
  }
});

// ── Actions en simulation ────────────────────────────────────────────────────────────────────────────────────────────
test("boutons critiques : « Activer tout » sans confirmation est refusé et journalisé ; rien ne bouge", async () => {
  const avant = await un("SELECT count(*)::int AS n FROM fo_audit_logs WHERE result = 'refused'");
  const r = await pdg().appuyer({ boutonId: await bouton("all_on"), confirme: false });
  assert.equal(r.ok, false);
  assert.equal(r.code, "CONFIRMATION_REQUISE");
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_audit_logs WHERE result = 'refused'"), avant + 1);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE status = 'on'"), 0);
});

test("« Activer tout » confirmé : seules les lignes valides s'allument, EN SIMULATION ; le câble réel n'est pas touché", async () => {
  const r = await pdg().appuyer({ boutonId: await bouton("all_on"), confirme: true });
  assert.equal(r.ok, true, r.detail);
  assert.equal((r.details as { allumees: string[] }).allumees.length, 3);
  assert.equal((r.details as { ignorees: unknown[] }).ignorees.length, 3);
  const on = (await q<{ contract_ref: string; current_status: string }>("SELECT contract_ref, current_status FROM fo_connection_lines WHERE status = 'on' ORDER BY contract_ref")).map((l) => [l.contract_ref, l.current_status]);
  assert.deepEqual(on, [["service-access", "simulated_on"], ["shop-documents-only", "simulated_on"], ["shop-intelligence-isolated", "simulated_on"]]);
  assert.equal(await un("SELECT count(*)::int AS n FROM shop_link_cables"), 0, "aucune ligne du câble réel n'a été créée ni modifiée");
  assert.equal(await un("SELECT count(*)::int AS n FROM shop_link_journal"), 0, "aucun passage réel");
  const l = await ligne("shop-documents-only");
  const detail = (await q<{ status: string }>("SELECT status FROM fo_switches WHERE connection_line_id = $1 ORDER BY switch_type", [l])).map((s) => s.status);
  assert.deepEqual(detail, ["ON", "ON"]);
  assert.equal((await q<{ status: string }>("SELECT status FROM fo_pointages WHERE connection_line_id = $1", [l]))[0].status, "connected");
  assert.equal((await m.service.accueil()).comptes.lignesAllumees, 3);
});

test("ligne non valide ou future : « Activer ligne » refusé avec la raison, journalisé", async () => {
  const entree = await pdg().appuyer({ boutonId: await bouton("line_on"), ligneId: await ligne("main-to-shop-entry"), confirme: true });
  assert.equal(entree.ok, false);
  assert.equal(entree.code, "LIGNE_INVALIDE");
  assert.match(entree.detail, /absent/);
  const stripe = await pdg().appuyer({ boutonId: await bouton("line_on"), ligneId: await ligne("shared-stripe-account"), confirme: true });
  assert.equal(stripe.code, "LIGNE_INVALIDE");
  const future = (await q<{ id: number }>("SELECT id FROM fo_connection_lines WHERE is_future_placeholder LIMIT 1"))[0].id;
  assert.equal((await pdg().appuyer({ boutonId: await bouton("line_on"), ligneId: future, confirme: true })).code, "LIGNE_FUTURE");
  assert.equal((await pdg().appuyer({ boutonId: await bouton("line_on"), confirme: true })).code, "LIGNE_INCONNUE", "une ligne doit être choisie");
  assert.equal((await q<{ status: string }>("SELECT status FROM fo_connection_lines WHERE id = $1", [future]))[0].status, "future");
  assert.ok(await un("SELECT count(*)::int AS n FROM fo_audit_logs WHERE action = 'line_on' AND result = 'refused'") >= 3);
});

test("interrupteurs et pointage : la ligne n'est allumée que si les deux interrupteurs sont ON ET le pointage connecté ; ON exige une confirmation", async () => {
  const id = await ligne("shop-documents-only");
  const [gauche, droite] = (await q<{ id: number }>("SELECT id FROM fo_switches WHERE connection_line_id = $1 ORDER BY switch_type", [id])).map((s) => s.id);
  assert.equal((await pdg().interrupteur({ id: gauche, etat: "OFF", confirme: false })).ok, true, "éteindre ne demande pas de confirmation");
  assert.equal((await statutLigne(id)).status, "off");
  const sansConfirmation = await pdg().interrupteur({ id: gauche, etat: "ON", confirme: false });
  assert.equal(sansConfirmation.code, "CONFIRMATION_REQUISE");
  assert.equal((await pdg().interrupteur({ id: gauche, etat: "ON", confirme: true })).ok, true);
  assert.equal((await statutLigne(id)).status, "on");
  // Grande coupure : le pointage séparé éteint la ligne même si les interrupteurs restent ON.
  const toggle = await bouton("pointage_toggle");
  assert.equal((await pdg().appuyer({ boutonId: toggle, ligneId: id, confirme: false })).code, "CONFIRMATION_REQUISE");
  assert.equal((await pdg().appuyer({ boutonId: toggle, ligneId: id, confirme: true })).ok, true);
  assert.deepEqual(await statutLigne(id), { status: "off", current_status: "off", is_active: false });
  assert.equal((await q<{ status: string; last_separation_at: Date | null }>("SELECT status, last_separation_at FROM fo_pointages WHERE connection_line_id = $1", [id]))[0].status, "separated");
  assert.equal((await pdg().appuyer({ boutonId: toggle, ligneId: id, confirme: true })).ok, true, "contact rétabli");
  assert.equal((await statutLigne(id)).status, "on");
  // Un interrupteur d'une ligne non valide ne passe pas sur ON.
  const entree = await ligne("main-to-shop-entry");
  const sw = (await q<{ id: number }>("SELECT id FROM fo_switches WHERE connection_line_id = $1 LIMIT 1", [entree]))[0].id;
  assert.equal((await pdg().interrupteur({ id: sw, etat: "ON", confirme: true })).code, "LIGNE_INVALIDE");
  // Interrupteur d'une ligne future : désactivé.
  const swFutur = (await q<{ id: number }>("SELECT id FROM fo_switches WHERE is_future_placeholder LIMIT 1"))[0].id;
  assert.equal((await pdg().interrupteur({ id: swFutur, etat: "ON", confirme: true })).code, "LIGNE_FUTURE");
});

test("verrouiller / déverrouiller : une ligne verrouillée ne s'allume ni ne s'éteint ; « Activer tout » l'ignore", async () => {
  const id = await ligne("service-access");
  const lock = await bouton("lock");
  assert.equal((await pdg().appuyer({ boutonId: lock, ligneId: id, confirme: false })).code, "CONFIRMATION_REQUISE");
  assert.equal((await pdg().appuyer({ boutonId: lock, ligneId: id, confirme: true })).ok, true);
  assert.deepEqual(await statutLigne(id), { status: "locked", current_status: "locked", is_active: false });
  assert.equal((await pdg().appuyer({ boutonId: await bouton("line_on"), ligneId: id, confirme: true })).code, "LIGNE_VERROUILLEE");
  assert.equal((await pdg().appuyer({ boutonId: await bouton("line_off"), ligneId: id })).code, "LIGNE_VERROUILLEE");
  const tout = await pdg().appuyer({ boutonId: await bouton("all_on"), confirme: true });
  assert.ok((tout.details as { ignorees: { ligne: string; raisons: string[] }[] }).ignorees.some((i) => i.raisons[0] === "Ligne verrouillée."));
  assert.equal((await statutLigne(id)).status, "locked");
  const unlock = await bouton("unlock");
  assert.equal((await pdg().appuyer({ boutonId: unlock, ligneId: await ligne("shop-documents-only"), confirme: true })).code, "ETAT_INCOMPATIBLE", "elle n'est pas verrouillée");
  assert.equal((await pdg().appuyer({ boutonId: unlock, ligneId: id, confirme: true })).ok, true);
  assert.equal((await statutLigne(id)).status, "off");
});

test("« Désactiver tout » éteint toutes les lignes ; « Tester courant » lit l'état réel sans rien commander et écrit dans la mémoire", async () => {
  assert.equal((await pdg().appuyer({ boutonId: await bouton("all_off"), confirme: false })).code, "CONFIRMATION_REQUISE");
  assert.equal((await pdg().appuyer({ boutonId: await bouton("all_off"), confirme: true })).ok, true);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE status = 'on'"), 0);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_switches WHERE status = 'ON'"), 0);
  const test = await bouton("test_current");
  const ok = await pdg().appuyer({ boutonId: test, ligneId: await ligne("shop-documents-only") });
  assert.equal(ok.ok, true);
  assert.equal((ok.details as { test: string; etatReel: string }).test, "passed");
  assert.equal((ok.details as { etatReel: string }).etatReel, "coupe");
  const ko = await pdg().appuyer({ boutonId: test, ligneId: await ligne("main-to-shop-entry") });
  assert.equal((ko.details as { test: string }).test, "failed");
  assert.deepEqual((await q<{ contract_ref: string; test_status: string }>("SELECT contract_ref, test_status FROM fo_connection_lines WHERE test_status <> 'untested' ORDER BY contract_ref")).map((l) => [l.contract_ref, l.test_status]), [["main-to-shop-entry", "failed"], ["shop-documents-only", "passed"]]);
  assert.ok(await un("SELECT count(*)::int AS n FROM fo_memory_blocks WHERE memory_type = 'test'") >= 2);
});

test("un bouton dont un moteur de contrôle est inutilisable est refusé : jamais un bouton critique avec un seul moteur valide", async () => {
  await m.pool.query("UPDATE fo_engines SET status = 'error' WHERE code = 'fo:switch-controller'");
  try {
    const r = await pdg().appuyer({ boutonId: await bouton("all_off"), confirme: true });
    assert.equal(r.ok, false);
    assert.equal(r.code, "MOTEURS_DE_CONTROLE");
    const sw = (await q<{ id: number }>("SELECT id FROM fo_switches WHERE NOT is_future_placeholder LIMIT 1"))[0].id;
    assert.equal((await pdg().interrupteur({ id: sw, etat: "OFF" })).code, "MOTEURS_DE_CONTROLE");
  } finally {
    await m.pool.query("UPDATE fo_engines SET status = 'active' WHERE code = 'fo:switch-controller'");
  }
  await m.pool.query("UPDATE fo_buttons SET status = 'locked' WHERE code = 'diagnostic'");
  assert.equal((await pdg().appuyer({ boutonId: await bouton("diagnostic"), confirme: true })).code, "BOUTON_INDISPONIBLE");
  await m.pool.query("UPDATE fo_buttons SET status = 'active' WHERE code = 'diagnostic'");
  assert.equal((await pdg().appuyer({ boutonId: 999999, confirme: true })).code, "BOUTON_INCONNU");
});

// ── Miroirs : la réalité est lue, jamais commandée ──────────────────────────────────────────────────────────────────
test("miroir du câble : un canal réellement branché apparaît « connecté » ; la jauge des connexions le compte", async () => {
  await m.pool.query("INSERT INTO shop_link_cables(canal, etat, motif) VALUES ('etat','connecte','essai du miroir')");
  const a = await m.service.accueil();
  assert.equal(a.comptes.canaux.connectes, 1);
  assert.equal((await q<{ status: string }>("SELECT status FROM fo_engines WHERE code = 'main:shop-link:etat'"))[0].status, "active");
  const vue = (await m.service.lignesVue()).find((l) => l.contrat === "shop-intelligence-isolated")!;
  assert.equal(vue.etatReel, "connecte");
  assert.equal(a.jauges.find((j) => j.cle === "connexions")!.valeur, 17);
  assert.equal(await un("SELECT count(*)::int AS n FROM shop_link_cables"), 1, "le centre n'écrit jamais dans le câble");
  // Le commutateur général coupé ramène le miroir à « coupé ».
  await m.pool.query("INSERT INTO shop_link_cables(canal, etat, motif) VALUES ('maitre','coupe','coupure générale')");
  assert.equal((await m.service.accueil()).comptes.canaux.connectes, 0);
  await m.pool.query("DELETE FROM shop_link_cables");
});

test("miroir du registre central : un moteur en panne passe en erreur, remonte à la température et dans le diagnostic", async () => {
  await m.pool.query("INSERT INTO engine_registry(name,label,category,state,health) VALUES ('payment','Payment','transversal','active','down'), ('seo','SEO','transversal','active','ok'), ('smart','Smart','core','maintenance','ok')");
  const a = await m.service.accueil();
  assert.equal((await q<{ status: string }>("SELECT status FROM fo_engines WHERE code = 'main:payment'"))[0].status, "error");
  assert.equal((await q<{ status: string }>("SELECT status FROM fo_engines WHERE code = 'main:seo'"))[0].status, "active");
  assert.equal((await q<{ status: string }>("SELECT status FROM fo_engines WHERE code = 'main:smart'"))[0].status, "maintenance");
  assert.equal(a.comptes.moteurs.erreur, 1);
  assert.ok(a.jauges.find((j) => j.cle === "temperature")!.valeur! > 0);
  const anomalies = await m.service.detecterAnomalies();
  assert.ok(anomalies.some((x) => x.type === "engine_error" && !x.reparableAuto), "panne signalée, non réparable automatiquement");
  // La ligne « paiement » dépend du moteur réel de la plateforme : en erreur, elle est signalée dans ses raisons.
  const stripe = (await m.service.lignesVue()).find((l) => l.contrat === "shared-stripe-account")!;
  assert.match(stripe.raisons.join(" "), /Moteur réel de droite : en erreur/);
  await m.pool.query("DELETE FROM engine_registry");
  await m.service.rafraichirMiroirs();
});

// ── Diagnostic, atelier de réparation, rollback ─────────────────────────────────────────────────────────────────────
test("atelier : une paire disparue est détectée, réparée (paire de secours) puis annulable ; tout est journalisé", async () => {
  const cible = (await q<{ id: number }>("SELECT id FROM fo_engines WHERE code = 'shop:documents'"))[0].id;
  const avant = (await q<{ internal_engine_primary_id: number; internal_engine_secondary_id: number }>("SELECT * FROM fo_engine_pairs WHERE external_engine_id = $1", [cible]))[0];
  await m.pool.query("DELETE FROM fo_engine_pairs WHERE external_engine_id = $1", [cible]);
  assert.match((await m.service.verifierIntegrite()).join(" "), /shop:documents : aucune paire de contrôle/);
  const diag = await pdg().appuyer({ boutonId: await bouton("diagnostic") });
  assert.equal(diag.ok, true);
  const item = (await q<{ id: number; issue_type: string; repair_status: string; resolved_at: Date | null }>("SELECT * FROM fo_repair_workshop WHERE target_id = $1 AND issue_type = 'missing_pair'", [cible]))[0];
  assert.equal(item.repair_status, "proposed");
  assert.equal(item.resolved_at, null);
  // Relancer le diagnostic ne duplique pas l'anomalie ouverte.
  await pdg().appuyer({ boutonId: await bouton("diagnostic") });
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_repair_workshop WHERE target_id = $1 AND issue_type = 'missing_pair'", [cible]), 1);
  const repair = await bouton("repair");
  assert.equal((await pdg().appuyer({ boutonId: repair, reparationId: Number(item.id), confirme: false })).code, "CONFIRMATION_REQUISE");
  const r = await pdg().appuyer({ boutonId: repair, reparationId: Number(item.id), confirme: true });
  assert.equal(r.ok, true, r.detail);
  assert.deepEqual(await m.service.verifierIntegrite(), []);
  const [rep] = await q<{ repair_status: string; rollback_available: boolean; applied_fix: string }>("SELECT * FROM fo_repair_workshop WHERE id = $1", [item.id]);
  assert.deepEqual([rep.repair_status, rep.rollback_available], ["applied", true]);
  // Retour arrière : l'état d'avant est rétabli (ici : pas de paire), puis une nouvelle réparation reste possible après un nouveau diagnostic.
  assert.equal((await pdg().annulerReparation({ id: Number(item.id), confirme: false })).code, "CONFIRMATION_REQUISE");
  assert.equal((await pdg().annulerReparation({ id: Number(item.id), confirme: true })).ok, true);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_engine_pairs WHERE external_engine_id = $1", [cible]), 0);
  assert.equal((await q<{ repair_status: string }>("SELECT repair_status FROM fo_repair_workshop WHERE id = $1", [item.id]))[0].repair_status, "rolled_back");
  assert.equal((await pdg().annulerReparation({ id: Number(item.id), confirme: true })).code, "ETAT_INCOMPATIBLE", "on n'annule pas deux fois");
  // On rétablit la paire d'origine pour la suite.
  await m.pool.query("INSERT INTO fo_engine_pairs(external_engine_id,internal_engine_primary_id,internal_engine_secondary_id) VALUES($1,$2,$3)", [cible, avant.internal_engine_primary_id, avant.internal_engine_secondary_id]);
  assert.ok(await un("SELECT count(*)::int AS n FROM fo_audit_logs WHERE action IN ('repair','rollback','diagnostic') AND result = 'ok'") >= 4);
});

test("atelier : une réserve de lignes futures entamée est détectée et recréée, puis annulable ; une anomalie humaine n'est pas réparée seule", async () => {
  const groupe = (await q<{ id: number }>("SELECT id FROM fo_control_groups WHERE code = 'boutique'"))[0].id;
  const trois = await q<{ id: number; engine_id: number }>("SELECT id, engine_id FROM fo_connection_lines WHERE group_id = $1 AND is_future_placeholder ORDER BY position DESC LIMIT 3", [groupe]);
  for (const l of trois) {
    await m.pool.query("UPDATE fo_connection_lines SET central_pointage_id = NULL WHERE id = $1", [l.id]);
    await m.pool.query("DELETE FROM fo_switches WHERE connection_line_id = $1", [l.id]);
    await m.pool.query("DELETE FROM fo_pointages WHERE connection_line_id = $1", [l.id]);
    await m.pool.query("DELETE FROM fo_connection_lines WHERE id = $1", [l.id]);
  }
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE group_id = $1 AND is_future_placeholder", [groupe]), 27);
  await pdg().appuyer({ boutonId: await bouton("diagnostic") });
  const item = (await q<{ id: number; proposed_fix: string }>("SELECT * FROM fo_repair_workshop WHERE target_id = $1 AND issue_type = 'missing_reserve' AND resolved_at IS NULL", [groupe]))[0];
  assert.match(item.proposed_fix, /3 ligne\(s\) future\(s\)/);
  const r = await pdg().appuyer({ boutonId: await bouton("repair"), reparationId: Number(item.id), confirme: true });
  assert.equal(r.ok, true, r.detail);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE group_id = $1 AND is_future_placeholder", [groupe]), 30);
  assert.equal((await q<{ line_count_future: number }>("SELECT line_count_future FROM fo_control_groups WHERE id = $1", [groupe]))[0].line_count_future, 30);
  assert.deepEqual(await m.service.verifierIntegrite(), []);
  // Retour arrière : les trois lignes recréées disparaissent avec leurs moteurs, comme avant la réparation.
  assert.equal((await pdg().annulerReparation({ id: Number(item.id), confirme: true })).ok, true);
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE group_id = $1 AND is_future_placeholder", [groupe]), 27);
  // Un nouveau passage de la fondation rétablit la réserve (idempotent, sans doublon de code).
  await m.service.assurerFondation();
  assert.equal(await un("SELECT count(*)::int AS n FROM fo_connection_lines WHERE group_id = $1 AND is_future_placeholder", [groupe]), 30);
  assert.deepEqual(await m.service.verifierIntegrite(), []);
  // Anomalie humaine : refusée, marquée, jamais « réparée » en silence.
  await m.pool.query("INSERT INTO fo_repair_workshop(target_type,target_id,issue_type,diagnostic_status,repair_status,proposed_fix,fix_payload) VALUES('engine',1,'engine_error','confirmed','proposed','Intervention humaine requise.','{\"reparableAuto\":false}')");
  const humain = (await q<{ id: number }>("SELECT id FROM fo_repair_workshop WHERE issue_type = 'engine_error' AND repair_status = 'proposed' ORDER BY id DESC LIMIT 1"))[0].id;
  assert.equal((await pdg().appuyer({ boutonId: await bouton("repair"), reparationId: Number(humain), confirme: true })).code, "NON_REPARABLE");
  assert.equal((await pdg().appuyer({ boutonId: await bouton("repair"), reparationId: 999999, confirme: true })).code, "REPARATION_INCONNUE");
});

// ── Mémoire et journal ───────────────────────────────────────────────────────────────────────────────────────────────
test("mémoire : tout peut y écrire, aucun secret n'y entre ; le journal garde avant/après sans secret", async () => {
  assert.equal(await m.service.ecrireMemoire({ proprietaire: "platform", proprietaireId: 1, type: "note", resume: "La Boutique est connectée en simulation seulement." }), true);
  assert.equal(await m.service.ecrireMemoire({ proprietaire: "engine", proprietaireId: 1, type: "note", resume: `clé sk-${"a".repeat(30)}` }), false, "valeur secrète refusée");
  assert.equal(await m.service.ecrireMemoire({ proprietaire: "switch", type: "erreur", resume: "Interrupteur sans propriétaire numérique accepté.", importance: 9, securite: 9 }), true);
  const bornes = await q<{ importance_level: number; security_level: number }>("SELECT importance_level, security_level FROM fo_memory_blocks WHERE memory_type = 'erreur'");
  assert.deepEqual(bornes[0], { importance_level: 5, security_level: 5 }, "niveaux bornés");
  const texte = JSON.stringify(await q("SELECT * FROM fo_audit_logs"));
  assert.ok(!texte.includes("sk-aaaa"));
  const refus = await q<{ result: string; error_message: string }>("SELECT result, error_message FROM fo_audit_logs WHERE result = 'refused' LIMIT 1");
  assert.ok(refus[0].error_message.length > 3);
});

// ── Routeur PDG ──────────────────────────────────────────────────────────────────────────────────────────────────────
test("routeur : réservé au PDG ; accueil à neuf jauges, groupes, moteurs filtrables, détail d'un moteur externe avec sa paire, comptage de la Boutique", async () => {
  const admin = m.index.frontierOsRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: 2, role: "admin", email: "admin@exemple.test" } });
  const anonyme = m.index.frontierOsRouter.createCaller({ req: {} as never, res: {} as never, user: null });
  for (const c of [admin, anonyme]) {
    await assert.rejects(c.accueil(), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(c.appuyer({ boutonId: 1, confirme: true }), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(c.interrupteur({ id: 1, etat: "ON", confirme: true }), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(c.journal(), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(c.moteurs(), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(c.comptage(), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(c.fondation(), /Accès PDG requis|FORBIDDEN/);
  }
  assert.equal((await admin.meta()).actionReelle, false);

  const a = await pdg().accueil();
  assert.equal(a.mode, "simulation");
  assert.equal(a.actionReelle, false);
  assert.equal(a.jauges.length, 9);
  assert.equal(a.resume.groupes, 8);
  assert.equal(a.resume.lignesReelles, 6);
  assert.equal(a.resume.lignesFutures, 65);

  const groupes = await pdg().groupes();
  const boutique = groupes.find((g) => g.code === "boutique")!;
  assert.deepEqual([boutique.lignesReelles, boutique.lignesFutures, boutique.lignesValides], [6, 30, 3]);

  const boutiqueMoteurs = await pdg().moteurs({ plateforme: "shop", type: "intermediary_engine" });
  assert.equal(boutiqueMoteurs.length, 6);
  assert.ok(boutiqueMoteurs.every((e) => e.externe && e.source === "inventory" && e.estIntermediaire));
  const recherche = await pdg().moteurs({ q: "payment" });
  assert.ok(recherche.length >= 3);

  const detail = await pdg().moteur({ id: boutiqueMoteurs.find((e) => e.code === "shop:intermediary:shop-documents-only")!.id });
  assert.ok(detail);
  assert.equal(detail.moteur.externe, true);
  assert.equal(detail.paire?.valide, true);
  assert.equal(detail.paire?.primaire?.nom, "Intermédiaire plateforme — Références de documents de la Boutique");
  assert.equal(detail.lignes.length, 1);
  const securite = (await pdg().moteurs({ q: "sécurité cyber" }))[0];
  const detailSecurite = await pdg().moteur({ id: securite.id });
  assert.ok(detailSecurite!.controle.length > 50, "le moteur de sécurité contrôle de nombreux moteurs externes");
  assert.equal(await pdg().moteur({ id: 99999999 }), null);

  const c = await pdg().comptage();
  assert.deepEqual([c.moteursBoutique, c.intermediairesPrepares, c.lignesReellesPrevues, c.lignesFuturesPrevues, c.totalLignesPrevues], [83, 6, 6, 30, 36]);
  assert.deepEqual(c.ecarts.canauxPlateformeSansIntermediaireBoutique, ["ia-memoire"]);
  assert.deepEqual(c.ecarts.intermediairesBoutiqueSansCanalPlateforme, ["main-to-shop-entry"]);
  assert.equal(c.ecarts.moteursNommesParContratAbsentsDuRegistre.length, 2);

  assert.equal((await pdg().salles()).length, 10);
  assert.equal((await pdg().boutons()).length, 10);
  assert.ok((await pdg().journal({ limite: 20, resultat: "refused" })).every((l) => l.result === "refused"));
  assert.ok((await pdg().memoire()).length > 5);
  assert.ok((await pdg().atelier()).length >= 2);
  assert.deepEqual((await pdg().integrite()).violations, []);
});

test("flux du centre de contrôle : santé « ok », charge et erreurs lisibles, sans poser la fondation", async () => {
  const feed = await m.index.controlCenterFeed();
  assert.equal(feed.engine, "frontier_os");
  assert.equal(feed.health, "ok");
  assert.equal(feed.status, "active");
  assert.ok(feed.load.events24h >= 10);
  assert.equal((await m.index.healthStatus()).metrics.mode, "simulation");
});

test("sécurité finale : aucun accès réel n'a été modifié pendant tout le scénario", async () => {
  assert.equal(await un("SELECT count(*)::int AS n FROM shop_link_cables"), 0);
  assert.equal(await un("SELECT count(*)::int AS n FROM shop_link_cles"), 0);
  assert.equal(await un("SELECT count(*)::int AS n FROM shop_link_journal"), 0);
  assert.equal(m.rules.ACTION_REELLE_ACTIVEE, false);
});
