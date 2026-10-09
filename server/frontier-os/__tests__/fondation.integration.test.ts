/**
 * Fondation de la base indépendante : plateformes, noms exacts, lignes à sept éléments, réserves, paires distinctes, idempotence.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { and, count, eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { cuts, engineBindings, engines, gates, groups, lines, platformAliases, platforms, rooms } from "../base/schema.js";
import { assurerFondation, importerInventaire } from "../fondation.js";
import { baseNeuve, fermer } from "./utilitaires.js";

before(baseNeuve);
after(fermer);

const n = async (q: Promise<{ n: unknown }[]>) => Number((await q)[0]?.n ?? 0);

test("fondation : entreprise, plateformes, noms exacts, dix salles", async () => {
  const db = dbFrontier();
  assert.equal(await n(db.select({ n: count() }).from(platforms)), 7);
  assert.equal(await n(db.select({ n: count() }).from(rooms)), 10);
  const alias = new Map((await db.select().from(platformAliases)).map((a) => [a.name, a]));
  for (const nom of ["MKH Shop", "MKPMS Shop", "boutique principale"]) {
    assert.equal(alias.get(nom)?.status, "not_found", nom);
    assert.equal(alias.get(nom)?.platformCode, null, `${nom} n'est rattaché à aucune plateforme`);
  }
  for (const nom of ["MKA.P-MS SHOP", "MKA.P-MS Shop", "MKAPMS Shop"]) assert.equal(alias.get(nom)?.platformCode, "shop", nom);
  const map = (await db.select().from(platforms).where(eq(platforms.code, "map")))[0]!;
  assert.equal(map.identityStatus, "to_verify");
  assert.equal(map.status, "to_verify");
});

test("lignes : 6 réelles + 30 réserves pour la Boutique, 5 réserves pour chacun des quatre autres groupes", async () => {
  const db = dbFrontier();
  const par = async (g: string, k: "real" | "reserve") => n(db.select({ n: count() }).from(lines).where(and(eq(lines.groupCode, g), eq(lines.kind, k))));
  assert.equal(await par("boutique", "real"), 6);
  assert.equal(await par("boutique", "reserve"), 30);
  for (const g of ["map", "ia-alhoudoud", "bijoux", "futures"]) {
    assert.equal(await par(g, "real"), 0, g);
    assert.equal(await par(g, "reserve"), 5, g);
  }
  assert.equal(await n(db.select({ n: count() }).from(groups)), 5);
  // Les réserves : « À venir », vides, désactivées, sans moteur — et sans coupure.
  const reserves = await db.select().from(lines).where(eq(lines.kind, "reserve"));
  assert.equal(reserves.length, 50);
  for (const r of reserves) {
    assert.equal(r.label, "À venir");
    assert.equal(r.enabled, false);
    assert.equal(r.validity, "invalid");
    assert.equal([r.remoteRealEngine, r.remoteSwitch, r.remoteIntermediary, r.centerContact, r.mainIntermediary, r.mainSwitch, r.mainRealEngine].filter(Boolean).length, 0);
  }
  assert.equal(await n(db.select({ n: count() }).from(cuts)), 18, "trois coupures par ligne réelle, aucune pour une réserve");
  assert.equal(await n(db.select({ n: count() }).from(gates).where(eq(gates.open, true))), 0, "toutes les portes sont fermées à la fondation");
  // Les réserves ne comptent pas parmi les moteurs installés.
  assert.equal(await n(db.select({ n: count() }).from(engines).where(eq(engines.kind, "real"))) > 0, true);
});

test("chaque ligne réelle a ses sept éléments ordonnés ; trois sont validées au départ, trois non, avec leurs raisons", async () => {
  const db = dbFrontier();
  const reelles = await db.select().from(lines).where(eq(lines.kind, "real"));
  const valides = reelles.filter((l) => l.validity === "valid").map((l) => l.intermediaryRef).sort();
  assert.deepEqual(valides, ["service-access", "shop-documents-only", "shop-intelligence-isolated"]);
  const entree = reelles.find((l) => l.intermediaryRef === "main-to-shop-entry")!;
  assert.ok(entree.invalidReasons.some((r) => r.includes("Élément 1 absent")), "access.entry n'est pas au registre de la Boutique");
  assert.ok(entree.invalidReasons.some((r) => r.includes("Élément 5 absent")), "aucun intermédiaire côté plateforme pour l'entrée");
  const stripe = reelles.find((l) => l.intermediaryRef === "shared-stripe-account")!;
  assert.ok(stripe.invalidReasons.some((r) => r.includes("incomplet")), "le contrat Stripe est bloqué en attente externe");
  for (const l of reelles.filter((x) => x.validity === "valid")) {
    for (const code of [l.remoteRealEngine, l.remoteSwitch, l.remoteIntermediary, l.centerContact, l.mainIntermediary, l.mainSwitch, l.mainRealEngine]) assert.ok(code, `${l.label} : élément manquant`);
    const c = await db.select().from(cuts).where(eq(cuts.lineId, l.id));
    assert.deepEqual(c.map((x) => x.side).sort(), ["center", "main", "remote"]);
    assert.ok(c.every((x) => x.requested === "none" && x.observed === "unknown" && x.progress === "idle" && x.mode === "simulation"));
  }
});

test("paires : chaque cible commandable a deux moteurs internes distincts, de rôles différents", async () => {
  const db = dbFrontier();
  const tous = await db.select().from(engineBindings);
  assert.ok(tous.length > 60);
  const kinds = new Map((await db.select({ code: engines.code, kind: engines.kind }).from(engines)).map((e) => [e.code, e.kind]));
  for (const b of tous) {
    assert.notEqual(b.commandEngine, b.verificationEngine, b.targetCode);
    assert.equal(kinds.get(b.commandEngine), "command");
    assert.equal(kinds.get(b.verificationEngine), "verification");
  }
  const parTypes = new Set(tous.map((b) => b.targetKind));
  for (const t of ["button", "switch", "external_engine", "line", "group", "general"]) assert.ok(parTypes.has(t as never), t);
  // Les trois coupures d'une ligne utilisent des paires différentes.
  const sw = tous.filter((b) => b.targetKind === "switch");
  assert.equal(new Set(sw.map((b) => b.commandEngine)).size, 3);
  assert.equal(new Set(sw.map((b) => b.verificationEngine)).size, 3);
});

test("inventaire importé avec versions ; un moteur « déclaré seulement » reste distingué d'un moteur qui fonctionne", async () => {
  const db = dbFrontier();
  const boutique = await db.select().from(engines).where(and(eq(engines.platformCode, "shop"), eq(engines.kind, "real")));
  const stock = boutique.filter((e) => (e.details as { domaine?: string }).domaine === "stock propre");
  assert.equal(boutique.length - stock.length, 83, "le registre de la Boutique compte 83 moteurs, la famille « stock propre » est comptée à part");
  assert.deepEqual(stock.map((e) => e.code), ["shop:stock.mka_own.inventory"]);
  assert.ok(boutique.some((e) => e.declaredOnly) && boutique.some((e) => !e.declaredOnly));
  assert.ok(boutique.every((e) => e.inventoryState !== "connecte"));
  const principal = await db.select().from(engines).where(and(eq(engines.platformCode, "main"), eq(engines.kind, "real")));
  assert.ok(principal.length >= 90);
  const v = (await db.execute(`SELECT count(*)::int AS n FROM frontier.engine_versions`)).rows[0] as { n: number };
  assert.ok(v.n >= 180);
});

test("idempotence : relancer la fondation ne change rien et ne branche rien", async () => {
  const db = dbFrontier();
  const avant = { lignes: await n(db.select({ n: count() }).from(lines)), moteurs: await n(db.select({ n: count() }).from(engines)), liaisons: await n(db.select({ n: count() }).from(engineBindings)) };
  const r = await assurerFondation();
  assert.equal(r.cree, false);
  assert.equal(r.reservesAjoutees, 0);
  const imp = await importerInventaire();
  assert.equal(imp.nouveaux, 0);
  assert.equal(imp.mis_a_jour, 0);
  assert.deepEqual(avant, { lignes: await n(db.select({ n: count() }).from(lines)), moteurs: await n(db.select({ n: count() }).from(engines)), liaisons: await n(db.select({ n: count() }).from(engineBindings)) });
  assert.equal(await n(db.select({ n: count() }).from(gates).where(eq(gates.open, true))), 0);
});

test("réserve entamée : la fondation la complète à cinq par ligne réelle", async () => {
  const db = dbFrontier();
  await db.delete(lines).where(and(eq(lines.groupCode, "boutique"), eq(lines.kind, "reserve"), eq(lines.position, 10)));
  await db.delete(lines).where(and(eq(lines.groupCode, "boutique"), eq(lines.kind, "reserve"), eq(lines.position, 11)));
  const r = await assurerFondation();
  assert.equal(r.reservesAjoutees, 2);
  assert.equal(await n(db.select({ n: count() }).from(lines).where(and(eq(lines.groupCode, "boutique"), eq(lines.kind, "reserve")))), 30);
});
