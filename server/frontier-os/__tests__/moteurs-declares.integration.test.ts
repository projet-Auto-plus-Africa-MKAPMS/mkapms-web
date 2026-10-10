/**
 * Moteurs déclarés du Centre (migration 0005) : au moins 100 moteurs internes, 40 par ensemble de connecteur
 * (Connecteur A, Connecteur B), 30 pour les connecteurs MKAPMS Shop — tous déclarés, jamais actifs par défaut.
 */
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { count, eq } from "drizzle-orm";
import { dbFrontier, poolFrontier } from "../base/connexion.js";
import { engines, rooms } from "../base/schema.js";
import {
  CONNECTEUR_A,
  CONNECTEUR_B,
  DECLARATIONS_CONNECTEUR_A,
  DECLARATIONS_INTERNES,
  DECLARATIONS_SHOP,
  ENSEMBLES_CONNECTEURS,
  NOUVELLES_SALLES,
  SHOP_AUTRES,
  SHOP_IA_BOUTIQUE,
  SHOP_PAIEMENT,
  SHOP_TRANSPORTEURS,
  SHOP_WOOCOMMERCE,
  TOUTES_DECLARATIONS,
  seedMoteursDeclares,
} from "../moteurs-declares.js";
import { baseNeuve, fermer } from "./utilitaires.js";

before(baseNeuve);
after(fermer);

const n = async (q: Promise<{ n: unknown }[]>) => Number((await q)[0]?.n ?? 0);

test("constantes : comptes minimums exigés par le PDG", () => {
  assert.equal(DECLARATIONS_INTERNES.length, 100);
  assert.equal(DECLARATIONS_CONNECTEUR_A.length, 40);
  assert.equal(DECLARATIONS_SHOP.length, 30);
  assert.equal(TOUTES_DECLARATIONS.length, 210);
  assert.equal(NOUVELLES_SALLES.length, 7);
  assert.equal(ENSEMBLES_CONNECTEURS.length, 7);
});

test("codes : tous les moteurs déclarés ont un code unique", () => {
  const codes = new Set(TOUTES_DECLARATIONS.map((d) => d.code));
  assert.equal(codes.size, TOUTES_DECLARATIONS.length, "aucun doublon de code");
});

test("seed : insertion complète, rien d'actif, interrupteurs seulement là où prévu", async () => {
  const db = dbFrontier();
  const r = await seedMoteursDeclares(db);
  assert.equal(r.total, 210);
  assert.equal(r.nouveaux, 210);

  const total = await n(db.select({ n: count() }).from(engines).where(eq(engines.kind, "declared")));
  assert.equal(total, 210);

  const nbSalles = await n(db.select({ n: count() }).from(rooms));
  assert.equal(nbSalles, 17, "dix salles déjà posées par fondation.ts + sept nouvelles");

  const running = (await poolFrontier().query("SELECT count(*)::int AS n FROM frontier.engines WHERE kind='declared' AND running = true")).rows[0] as { n: number };
  assert.equal(running.n, 0, "aucun moteur déclaré n'est en marche par défaut");

  // Connecteur A : exactement 40, dont un seul interrupteur principal (manualSwitch=true).
  const connecteurA = await db.select().from(engines).where(eq(engines.connectorSet, CONNECTEUR_A));
  assert.equal(connecteurA.length, 40);
  assert.equal(connecteurA.filter((e) => e.manualSwitch).length, 1);
  assert.ok(connecteurA.every((e) => !e.running && e.declaredOnly));
  // Rôles préparés (demande du PDG, 10 octobre 2026) : seules les 3 réserves restent « vide ».
  const connecteurAVides = connecteurA.filter((e) => e.inventoryState === "vide");
  assert.equal(connecteurAVides.length, 3, "Connecteur A : seules les réserves restent vides");
  assert.ok(connecteurAVides.every((e) => e.code.startsWith("centre:declare.reserve.")));
  assert.ok(connecteurA.filter((e) => !connecteurAVides.includes(e)).every((e) => e.inventoryState === "prepare"));

  // Connecteur B : exactement 40, un seul interrupteur.
  const connecteurB = await db.select().from(engines).where(eq(engines.connectorSet, CONNECTEUR_B));
  assert.equal(connecteurB.length, 40);
  assert.equal(connecteurB.filter((e) => e.manualSwitch).length, 1);
  // Interrupteur préparé (demande du PDG, 10 octobre 2026) : seules les 13 réserves restent « vide ».
  const interrupteurB = connecteurB.find((e) => e.code === "centre:declare.connecteur-b.interrupteur");
  assert.equal(interrupteurB?.inventoryState, "prepare", "interrupteur du Connecteur B préparé");
  const connecteurBVides = connecteurB.filter((e) => e.inventoryState === "vide");
  assert.equal(connecteurBVides.length, 13, "Connecteur B : seules les réserves restent vides");
  assert.ok(connecteurBVides.every((e) => e.code.startsWith("centre:declare.reserve.")));

  // Boutique MKAPMS Shop : 5 ensembles × 6 moteurs, chacun avec deux interrupteurs (local + central).
  // Moteurs/interrupteurs/accusés préparés mais arrêtés (demande du PDG, 10 octobre 2026) : les 6 moteurs d'un
  // ensemble sont tous "prepare" (aucun "vide" restant côté MKAPMS Shop — pas de réserve dans cette structure).
  for (const set of [SHOP_WOOCOMMERCE, SHOP_TRANSPORTEURS, SHOP_PAIEMENT, SHOP_IA_BOUTIQUE, SHOP_AUTRES]) {
    const m = await db.select().from(engines).where(eq(engines.connectorSet, set));
    assert.equal(m.length, 6, set);
    assert.equal(m.filter((e) => e.manualSwitch).length, 2, `${set} : interrupteur local + central`);
    assert.ok(m.every((e) => !e.running), set);
    assert.ok(m.every((e) => e.inventoryState === "prepare"), `${set} : préparé mais arrêté, plus aucun "vide"`);
  }

  // Cyberdéfense / Cyberattaques : aucun interrupteur manuel du tout (pas de mécanisme), état vide.
  const cyber = await db.select().from(engines).where(eq(engines.kind, "declared"));
  const cyberdef = cyber.filter((e) => e.code.startsWith("centre:declare.cyberdefense.") || e.code.startsWith("centre:declare.cyberattaques."));
  assert.equal(cyberdef.length, 16);
  assert.ok(cyberdef.every((e) => e.manualSwitch === false && e.inventoryState === "vide" && !e.running));
});

test("idempotence : relancer le seed n'ajoute rien de nouveau", async () => {
  const db = dbFrontier();
  const r = await seedMoteursDeclares(db);
  assert.equal(r.nouveaux, 0);
  const total = await n(db.select({ n: count() }).from(engines).where(eq(engines.kind, "declared")));
  assert.equal(total, 210);
});

test("backfill : une ligne déjà posée sur l'ancien état « vide » est corrigée en « préparé » au prochain démarrage", async () => {
  const db = dbFrontier();
  const code = "centre:declare.connecteur-b.interrupteur";
  await db.update(engines).set({ inventoryState: "vide" }).where(eq(engines.code, code));
  const [avant] = await db.select().from(engines).where(eq(engines.code, code));
  assert.equal(avant?.inventoryState, "vide", "préparation du scénario : simule une ligne posée avant le changement du PDG");

  await seedMoteursDeclares(db);

  const [apres] = await db.select().from(engines).where(eq(engines.code, code));
  assert.equal(apres?.inventoryState, "prepare", "un redémarrage corrige l'état d'inventaire, même sans supprimer la base");
});
