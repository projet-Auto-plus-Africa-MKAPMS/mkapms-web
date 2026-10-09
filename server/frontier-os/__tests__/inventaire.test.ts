/**
 * Inventaire du Centre Cyber-Électrique : invariants du relevé committé (sans réseau, sans base, sans dépôt de la Boutique).
 * Le relevé est une photo datée : ces tests vérifient qu'il reste cohérent avec ses propres définitions (un état ne s'affirme jamais
 * sans la preuve qui le fonde) et que les noms non établis n'ont pas été inventés.
 */
import assert from "node:assert/strict";
import test from "node:test";
import { INVENTAIRE_BOUTIQUE as B } from "../inventaire/boutique.generated.js";
import { INVENTAIRE_PLATEFORME as P } from "../inventaire/plateforme.generated.js";
import { ETATS_INVENTAIRE, type LigneInventaire } from "../inventaire/types.js";
import { INTERMEDIAIRES_BOUTIQUE } from "../shop-inventory.js";

const toutes = (): LigneInventaire[] => [...B.moteurs, ...B.intermediaires, ...B.stock.moteurs, ...B.stock.intermediaires, ...P.moteurs, ...P.intermediaires];

test("sources : commits exacts et dates", () => {
  for (const s of [B.source, P.source]) {
    assert.match(s.commit, /^[0-9a-f]{40}$/);
    assert.match(s.dateCommit, /^\d{4}-\d{2}-\d{2}T/);
    assert.match(s.genereLe, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(s.fichiersLus.length >= 3);
  }
  assert.equal(B.source.depot, "projet-Auto-plus-Africa-MKAPMS/mkapms-shop");
  assert.equal(P.source.depot, "projet-Auto-plus-Africa-MKAPMS/mkapms-web");
});

test("Boutique : 83 moteurs déclarés, identifiants uniques, chacun avec fonction et référence de code", () => {
  assert.equal(B.moteurs.length, 83);
  assert.equal(new Set(B.moteurs.map((m) => m.id)).size, 83);
  for (const m of B.moteurs) {
    assert.ok(m.fonction.length > 3, m.id);
    assert.ok(m.code.length >= 1 && m.code[0]!.startsWith("server/shop-intelligent-system.mjs:"), m.id);
    assert.match(m.code[0]!, /:\d+$/, `ligne de déclaration de ${m.id}`);
  }
});

test("aucun état ne s'affirme sans sa preuve", () => {
  for (const m of toutes()) {
    assert.ok(ETATS_INVENTAIRE.includes(m.etat), m.id);
    assert.notEqual(m.etat, "connecte", `${m.id} : aucune liaison n'a été observée par le centre`);
    if (m.etat === "teste") {
      assert.ok(m.tests.length > 0, `${m.id} : testé sans fichier de test`);
      assert.ok(m.entreesTrouvees > 0, `${m.id} : testé sans point d'entrée`);
      assert.equal(m.preuve, "tests");
      assert.equal(m.declareSeulement, false);
    }
    if (m.etat === "installe") {
      assert.ok(m.entreesTrouvees > 0, `${m.id} : installé sans point d'entrée`);
      assert.equal(m.tests.length, 0);
      assert.equal(m.preuve, "liaison");
      assert.equal(m.declareSeulement, false);
    }
    if (m.etat === "incomplet" || m.etat === "prepare") {
      assert.ok(m.manques.length > 0, `${m.id} : ${m.etat} doit dire ce qui manque`);
      if (m.etat === "prepare") assert.equal(m.declareSeulement, true);
    }
    for (const t of m.tests) assert.match(t, /\.(test|integration|spec)\./, t);
  }
});

test("six intermédiaires préparés par la Boutique, relus dans ses contrats", () => {
  assert.equal(B.intermediaires.length, 6);
  assert.deepEqual(B.intermediaires.map((i) => i.id), INTERMEDIAIRES_BOUTIQUE.map((i) => i.id));
  assert.equal(B.contrats.length, 5);
  assert.deepEqual(new Set(B.contrats.map((c) => c.statut)), new Set(["READY", "BLOCKED_EXTERNAL"]));
  const parId = new Map(B.intermediaires.map((i) => [i.id, i]));
  assert.equal(parId.get("service-access")!.etat, "teste");
  assert.equal(parId.get("shared-stripe-account")!.etat, "incomplet");
  assert.equal(parId.get("shared-google-owner")!.etat, "incomplet");
  for (const id of ["main-to-shop-entry", "shop-documents-only", "shop-intelligence-isolated"]) {
    assert.equal(parId.get(id)!.etat, "prepare", id);
    assert.equal(parId.get(id)!.declareSeulement, true, id);
  }
  // L'écart de nom est signalé, pas corrigé en silence.
  assert.ok(parId.get("main-to-shop-entry")!.aVerifier.some((x) => x.includes("access.entry")));
  assert.ok(parId.get("shared-google-owner")!.aVerifier.some((x) => x.includes("seo.campaign")));
});

test("audit propre de la Boutique : le plan d'ensemble n'est pas complet et le relevé ne dit pas le contraire", () => {
  assert.equal(B.auditExigences.total, 105);
  assert.equal(B.auditExigences.planCompletDansLeDepot, false);
  assert.equal(B.auditExigences.criteres["COMPLETE"] ?? 0, 0);
  assert.ok(B.exigencesSansMoteur.length > 0);
  assert.equal(B.exigences.length, 105);
});

test("plateforme : chaque moteur d'un intermédiaire existe dans le relevé, les canaux de shop_link sont six", () => {
  const ids = new Set(P.moteurs.map((m) => m.id));
  for (const i of INTERMEDIAIRES_BOUTIQUE) assert.ok(ids.has(i.moteurPlateforme), i.moteurPlateforme);
  assert.ok(ids.has("shop_link") && ids.has("frontier_os"));
  assert.equal(P.intermediaires.length, 6);
  assert.equal(new Set(P.moteurs.map((m) => m.id)).size, P.moteurs.length);
  const ia = P.intermediaires.find((i) => i.id === "shop_link:ia-memoire")!;
  assert.equal(ia.intermediairePrevu, null, "aucun contrat de la Boutique ne lui fait face : écart signalé");
  assert.ok(P.intermediaires.filter((i) => i.etat === "incomplet").map((i) => i.id).sort().join() === "shop_link:google,shop_link:paiement");
});

test("noms non établis : jamais inventés comme plateformes", () => {
  const texte = JSON.stringify([B.moteurs.map((m) => [m.id, m.nom]), P.moteurs.map((m) => [m.id, m.nom])]);
  for (const nom of ["MKH Shop", "MKPMS Shop", "boutique principale"]) assert.ok(!texte.includes(nom), `${nom} ne doit pas apparaître comme moteur ou plateforme`);
});

test("Boutique : le moteur de stock propre est une famille séparée, relevée une fois, sans doublon avec le registre ni les intermédiaires", () => {
  const registre = new Set([...B.moteurs, ...B.intermediaires].map((m) => m.id));
  const stock = [...B.stock.moteurs, ...B.stock.intermediaires];
  assert.deepEqual(stock.map((m) => m.id), ["stock.mka_own.inventory", "stock.mka_own.intermediary"]);
  for (const m of stock) assert.ok(!registre.has(m.id), `${m.id} ne doit pas figurer deux fois`);
  const tablesRegistre = new Set(B.moteurs.flatMap((m) => m.tables));
  for (const t of B.stock.moteurs[0]!.tables) assert.ok(!tablesRegistre.has(t), `table ${t} déjà portée par le registre`);
  assert.equal(new Set(toutes().map((m) => m.id + "@" + (m.domaine === "stock propre" ? "s" : m.domaine))).size, toutes().length);
  assert.equal(B.stock.modeles.length, 10);
  assert.equal(new Set(B.stock.modeles.map((m) => m.type)).size, 10);
  assert.equal(B.stock.canaux.length, 7);
  assert.equal(B.stock.comptePropre.type, "MKA_OWN");
  assert.equal(B.stock.desactiveParLaBase, true, "la migration impose enabled = false : le moteur n'est pas activable");
  const [moteur, pont] = [B.stock.moteurs[0]!, B.stock.intermediaires[0]!];
  assert.equal(moteur.intermediairePrevu, pont.id);
  assert.notEqual(moteur.id, pont.id);
  assert.ok(moteur.etat === "teste" || moteur.etat === "installe");
  assert.equal(pont.etat, "prepare", "le pont n'est pas installé : bridgeReadiness répond CONNECTION_NOT_INSTALLED");
  for (const m of stock) {
    assert.notEqual(m.etat, "connecte");
    assert.ok(m.manques.some((x) => /enabled = false/.test(x)), "le fait « désactivé par la base » est dit");
    assert.ok(m.code.every((c) => /^[\w./:-]+(:\d+)?$/.test(c)));
  }
  assert.ok(moteur.doublons.some((d) => /inventory/.test(d)), "le recouvrement de fonction avec « inventory » est signalé, sans fusion");
});
