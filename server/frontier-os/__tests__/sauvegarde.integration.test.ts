/**
 * Séparation physique de la base du centre : niveau MESURÉ (jamais déclaré), sauvegarde, vérification d'intégrité, restauration tout ou rien,
 * comparaison avant bascule. Utilise des bases jetables locales : la base de test principale (source), une seconde base sur le MÊME serveur
 * (fo_cible_test) et, si un second serveur Postgres local répond, une base sur CE serveur (fo_distant_test) pour établir « serveur distinct ».
 */
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import { eq } from "drizzle-orm";
import pg from "pg";
import { creerPool, dbFrontier, poolFrontier } from "../base/connexion.js";
import { migrer } from "../base/migrateur.js";
import { commands, gates } from "../base/schema.js";
import { commanderLigne } from "../commandes.js";
import { diagnostiquerSeparation } from "../separation.js";
import { comparer, empreintes, restaurer, sauvegarder, verifierSauvegarde } from "../sauvegarde.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero, urlDeTest } from "./utilitaires.js";

const o = { acteur: PDG, confirme: true } as const;
const BASE_CIBLE = () => `${new URL(urlDeTest()).pathname.slice(1).replace(/_test$/, "")}_cible_test`;
const BASE_DISTANTE = "fo_distant_test";
/** Second serveur local : l'autre des deux ports habituels (5432 / 55432). */
const portAutreServeur = () => (new URL(urlDeTest()).port === "5432" ? 55432 : 5432);
const avecBase = (url: string, nom: string, port?: number) => {
  const u = new URL(url);
  u.pathname = `/${nom}`;
  if (port) u.port = String(port);
  return u.toString();
};
const PREFIXE = path.join(tmpdir(), "centre-sauv-");
const racines: string[] = [];
/** Un dossier de sauvegarde neuf dans un répertoire temporaire créé pour ce test (jamais ailleurs). */
const dossier = () => {
  const racine = mkdtempSync(PREFIXE);
  racines.push(racine);
  return path.join(racine, "s");
};
/** Nettoyage gardé : on ne supprime que les répertoires créés ci-dessus, identifiés par leur préfixe exact. */
const nettoyer = () => {
  for (const r of racines) if (r.startsWith(PREFIXE) && r.length > PREFIXE.length) rmSync(r, { recursive: true, force: true });
};
const pools: pg.Pool[] = [];
const pool = (url: string) => {
  const p = creerPool(url, 2);
  pools.push(p);
  return p;
};

/** Crée la base jetable demandée sur le serveur de l'adresse donnée si elle manque ; faux si le serveur ne répond pas ou refuse (le test est alors passé). */
async function assurerBase(url: string): Promise<boolean> {
  const u = new URL(url);
  const nom = u.pathname.slice(1);
  if (!/_test$/.test(nom)) throw new Error(`Base refusée : ${nom}`);
  const admin = new URL(url);
  admin.pathname = "/postgres";
  const p = creerPool(admin.toString(), 1);
  try {
    const existe = await p.query("SELECT 1 FROM pg_database WHERE datname = $1", [nom]);
    if (existe.rowCount === 0) await p.query(`CREATE DATABASE "${nom}"`);
    return true;
  } catch {
    return false;
  } finally {
    await p.end().catch(() => undefined);
  }
}

async function viderCible(p: pg.Pool) {
  await p.query("DROP SCHEMA IF EXISTS frontier CASCADE");
  await migrer(p);
}

let cibleDisponible = false;
before(async () => {
  cibleDisponible = await assurerBase(avecBase(urlDeTest(), BASE_CIBLE()));
  await assurerBase(avecBase(urlDeTest(), BASE_DISTANTE, portAutreServeur()));
  await baseNeuve();
  await remiseAZero();
  // De la matière réelle à sauvegarder : une ligne activée puis coupée (commandes, accusés, échanges, journal), puis une ligne laissée connectée.
  const a = await ligneDe("shop-documents-only");
  const b = await ligneDe("shop-intelligence-isolated");
  assert.equal((await commanderLigne(a, "activate", o)).ok, true);
  assert.equal((await commanderLigne(a, "deactivate", o)).ok, true);
  assert.equal((await commanderLigne(b, "activate", o)).ok, true);
});
after(async () => {
  await Promise.all(pools.map((p) => p.end().catch(() => undefined)));
  nettoyer();
  await fermer();
});

test("niveau de séparation MESURÉ : variable absente = schéma partagé ; variable vers la même base = aucune séparation ; autre base = même serveur ; inatteignable = non établi", async () => {
  const source = urlDeTest();
  const plateforme = pool(source);
  const centre = poolFrontier();
  const sans = await diagnostiquerSeparation(centre, plateforme, false);
  assert.equal(sans.niveau, "schema_partage");
  assert.equal(sans.separeeMateriellement, false);
  assert.ok(sans.etapes.length >= 6, "la marche à suivre est donnée");

  const identique = await diagnostiquerSeparation(pool(source), plateforme, true);
  assert.equal(identique.niveau, "identique", "variable posée vers la base de la plateforme elle-même : aucune séparation");
  assert.equal(identique.separeeMateriellement, false);

  const distincte = cibleDisponible ? await diagnostiquerSeparation(pool(avecBase(source, BASE_CIBLE())), plateforme, true) : null;
  if (distincte) {
    assert.equal(distincte.niveau, "base_distincte", distincte.detail);
    assert.equal(distincte.memeServeur, true);
    assert.equal(distincte.separeeMateriellement, false, "même serveur : pas une séparation physique");
  }

  const mort = pool(avecBase(source, BASE_CIBLE(), 1));
  const inconnu = await diagnostiquerSeparation(mort, plateforme, true);
  assert.equal(inconnu.niveau, "inconnu");
  assert.equal(inconnu.separeeMateriellement, false);
  assert.doesNotMatch(JSON.stringify(sans), /postgres(ql)?:\/\//i, "aucune adresse n'est renvoyée");
  assert.doesNotMatch(JSON.stringify([sans, distincte]), /localtest|password/i);
});

test("serveur distinct : établi seulement par deux mesures différentes (autre instance), jamais par l'adresse", async (t) => {
  const source = urlDeTest();
  const distant = avecBase(source, BASE_DISTANTE, portAutreServeur());
  const p = pool(distant);
  try {
    await p.query("SELECT 1");
  } catch {
    t.skip("aucun second serveur Postgres local sur le port 5432 : cas non exécuté ici");
    return;
  }
  const d = await diagnostiquerSeparation(p, pool(source), true);
  assert.equal(d.niveau, "serveur_distinct", d.detail);
  assert.equal(d.memeServeur, false);
  assert.equal(d.separeeMateriellement, true);
});

test("sauvegarde : dossier + manifeste + une empreinte par table, relecture conforme, aucun secret ; refus d'écraser", async () => {
  const d = dossier();
  const m = await sauvegarder(poolFrontier(), d);
  assert.equal(m.format, "frontier-sauvegarde/1");
  assert.equal(m.tables.length, 31, "toutes les tables du centre sauf le journal des migrations");
  assert.ok(m.tables.every((t) => /^[0-9a-f]{64}$/.test(t.sha256)));
  assert.ok(m.tables.find((t) => t.nom === "commands")!.lignes > 0 && m.tables.find((t) => t.nom === "audit_log")!.lignes > 0);
  assert.equal(m.migrations.length, 3);
  const v = verifierSauvegarde(d);
  assert.equal(v.ok, true, v.erreurs.join(" ; "));
  const tout = m.tables.map((t) => readFileSync(path.join(d, t.fichier), "utf8")).join("\n");
  assert.doesNotMatch(tout, /localtest|postgres(ql)?:\/\/[^"]*@/i, "aucune adresse de base ni mot de passe dans la sauvegarde");
  await assert.rejects(() => sauvegarder(poolFrontier(), d), /refus d'écraser/);
});

test("une sauvegarde altérée est reconnue : ligne modifiée, fichier tronqué, manifeste modifié", async () => {
  const d = dossier();
  const m = await sauvegarder(poolFrontier(), d);
  const f = path.join(d, "commands.ndjson");
  const original = readFileSync(f, "utf8");
  writeFileSync(f, original.replace("deactivate", "activate"));
  assert.match(verifierSauvegarde(d).erreurs.join(" "), /commands : empreinte différente/);
  writeFileSync(f, original.split("\n").slice(0, 2).join("\n") + "\n");
  assert.match(verifierSauvegarde(d).erreurs.join(" "), /commands : \d+ lignes au lieu de/);
  writeFileSync(f, original);
  assert.equal(verifierSauvegarde(d).ok, true);
  appendFileSync(path.join(d, "stray.ndjson"), "{}\n");
  assert.match(verifierSauvegarde(d).erreurs.join(" "), /hors manifeste/);
  rmSync(path.join(d, "stray.ndjson"));
  const mf = path.join(d, "manifeste.json");
  const manifeste = JSON.parse(readFileSync(mf, "utf8"));
  manifeste.tables[0].lignes += 1;
  writeFileSync(mf, JSON.stringify(manifeste));
  assert.equal(verifierSauvegarde(d).ok, false);
  assert.ok(m.sha256.length === 64);
});

test("restauration dans une base vide : tout revient à l'identique (empreinte par table), les portes restent telles quelles, rien n'est rebranché", async (t) => {
  if (!cibleDisponible) return void t.skip("création d'une seconde base impossible sur ce serveur de test");
  const d = dossier();
  await sauvegarder(poolFrontier(), d);
  const cible = pool(avecBase(urlDeTest(), BASE_CIBLE()));
  await viderCible(cible);
  const r = await restaurer(cible, d);
  assert.equal(r.ok, true, r.erreurs.join(" ; "));
  assert.equal(r.tablesIdentiques, r.tables);
  assert.equal(r.tables, 31);
  const cmp = await comparer(poolFrontier(), cible);
  assert.equal(cmp.identiques, true, cmp.ecarts.join(" ; "));
  // Les portes de passage sont revenues EXACTEMENT comme dans la source (une ligne connectée l'est restée, les autres sont coupées) : rien n'est rebranché.
  const portes = async (p: pg.Pool) => (await p.query("SELECT cut_id, open FROM frontier.gates ORDER BY cut_id")).rows;
  assert.deepEqual(await portes(cible), await portes(poolFrontier()));
  assert.ok((await portes(cible)).some((g) => g.open === true) && (await portes(cible)).some((g) => g.open === false));
  // Les séquences continuent après le plus grand identifiant (aucune collision à la prochaine écriture).
  const max = Number((await cible.query("SELECT max(id) AS m FROM frontier.commands")).rows[0].m);
  const ins = await cible.query("INSERT INTO frontier.commands (kind, target_kind, target_code, status, requested_by, owner_kind, owner_code) VALUES ('cut', 'switch', 'x', 'pending', 'test', 'center', 'center') RETURNING id").catch(() => null);
  if (ins) assert.ok(Number(ins.rows[0].id) > max);
});

test("restauration refusée : cible non vide, migrations différentes, sauvegarde altérée — et rien n'est écrit", async (t) => {
  if (!cibleDisponible) return void t.skip("création d'une seconde base impossible sur ce serveur de test");
  const d = dossier();
  await sauvegarder(poolFrontier(), d);
  const cible = pool(avecBase(urlDeTest(), BASE_CIBLE()));
  await viderCible(cible);
  assert.equal((await restaurer(cible, d)).ok, true);
  const dejaPleine = await restaurer(cible, d);
  assert.equal(dejaPleine.ok, false);
  assert.match(dejaPleine.erreurs.join(" "), /n'est pas vide/);

  await viderCible(cible);
  await cible.query("UPDATE frontier.migrations SET checksum = 'x' WHERE name = (SELECT min(name) FROM frontier.migrations)");
  const migrations = await restaurer(cible, d);
  assert.equal(migrations.ok, false);
  assert.match(migrations.erreurs.join(" "), /migrations de la cible/);

  await viderCible(cible);
  writeFileSync(path.join(d, "engines.ndjson"), readFileSync(path.join(d, "engines.ndjson"), "utf8").replace("Interrupteur", "Interrupteur!"));
  const alteree = await restaurer(cible, d);
  assert.equal(alteree.ok, false);
  assert.match(alteree.erreurs.join(" "), /sauvegarde invalide/);
  const n = Number((await cible.query("SELECT count(*)::int AS n FROM frontier.engines")).rows[0].n);
  assert.equal(n, 0, "une restauration refusée n'écrit rien");
});

test("comparaison avant bascule : identiques après restauration, différences nommées dès qu'une ligne change", async (t) => {
  if (!cibleDisponible) return void t.skip("création d'une seconde base impossible sur ce serveur de test");
  const d = dossier();
  await sauvegarder(poolFrontier(), d);
  const cible = pool(avecBase(urlDeTest(), BASE_CIBLE()));
  await viderCible(cible);
  assert.equal((await restaurer(cible, d)).ok, true);
  assert.equal((await comparer(poolFrontier(), cible)).identiques, true);
  await cible.query("UPDATE frontier.config SET value = value WHERE key = (SELECT min(key) FROM frontier.config)");
  const memes = await comparer(poolFrontier(), cible);
  assert.equal(memes.identiques, true, "une mise à jour sans changement de valeur ne crée pas d'écart");
  await dbFrontier().update(gates).set({ open: false }).where(eq(gates.cutId, (await dbFrontier().select().from(gates).limit(1))[0]!.cutId));
  await cible.query("DELETE FROM frontier.measurements");
  await dbFrontier().insert(commands).values({ kind: "cut", targetKind: "switch", targetCode: "ecart", status: "confirmed", requestedBy: "test", ownerKind: "center", ownerCode: "center" } as never).catch(() => undefined);
  const diff = await comparer(poolFrontier(), cible);
  assert.equal(diff.identiques, false);
  assert.ok(diff.ecarts.length >= 1);
});

test("restauration vers un serveur distinct (si disponible) : même contenu, comparaison identique", async (t) => {
  const distant = avecBase(urlDeTest(), BASE_DISTANTE, portAutreServeur());
  const cible = pool(distant);
  try {
    await cible.query("SELECT 1");
  } catch {
    t.skip("aucun second serveur Postgres local : cas non exécuté ici");
    return;
  }
  const d = dossier();
  await sauvegarder(poolFrontier(), d);
  await viderCible(cible);
  const r = await restaurer(cible, d);
  assert.equal(r.ok, true, r.erreurs.join(" ; "));
  const e = await empreintes(cible);
  assert.equal(e.length, 31);
  assert.equal((await comparer(poolFrontier(), cible)).identiques, true);
  const diag = await diagnostiquerSeparation(cible, pool(urlDeTest()), true);
  assert.equal(diag.niveau, "serveur_distinct");
});
