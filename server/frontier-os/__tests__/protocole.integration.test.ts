/**
 * Protocoles de test d'une ligne, joués trois fois de suite sur chaque ligne validée : les neuf étapes de coupure dans l'ordre exigé,
 * puis les essais de panne. Chaque session est conservée avec ses étapes ; l'état initial de la ligne est restauré.
 */
import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { and, count, eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { cuts, gates, incidents, testSessions, testSteps } from "../base/schema.js";
import { chargerLigne, coupuresLite } from "../chaine.js";
import { commanderLigne } from "../commandes.js";
import { lancerProtocoleCoupures, lancerProtocolePannes } from "../protocole.js";
import { etatLigne } from "../regles.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero } from "./utilitaires.js";

before(baseNeuve);
after(fermer);
beforeEach(remiseAZero);

const VALIDES = ["shop-documents-only", "shop-intelligence-isolated", "service-access"] as const;
const etat = async (id: number) => etatLigne(coupuresLite((await chargerLigne(id))!.coupures));

test("protocole des trois coupures : neuf étapes dans l'ordre exigé, jouées 3 fois sur chaque ligne validée, état restauré", async () => {
  const noms = [
    "1. Lien local distant avec coupure centrale", "2. Lien local de la plateforme principale avec coupure centrale", "3. Coupure des deux liens locaux",
    "4. Lien entre les deux moteurs intermédiaires (environnement isolé)", "5. Recoupure du centre", "6. Réactivation des deux côtés locaux validés",
    "7. Chaîne complète (environnement isolé)", "8. Commande centrale individuelle", "9. Activation et coupure générales (limitées à cette ligne)",
  ];
  for (const cle of VALIDES) {
    const id = await ligneDe(cle);
    for (let passe = 1; passe <= 3; passe++) {
      const r = await lancerProtocoleCoupures(id, PDG);
      const echecs = r.etapes.filter((e) => !e.ok).map((e) => `${e.nom} → ${e.observe}`);
      assert.deepEqual(echecs, [], `${cle}, passe ${passe}`);
      assert.equal(r.ok, true);
      const ordre = r.etapes.map((e) => e.nom).filter((n) => /^\d\./.test(n));
      assert.deepEqual(ordre, noms, "l'ordre exigé est respecté");
      assert.equal(await etat(id), "disconnected", "ligne trouvée coupée : laissée coupée");
    }
  }
  const [n] = await dbFrontier().select({ n: count() }).from(testSessions).where(and(eq(testSessions.protocol, "coupures-9-etapes"), eq(testSessions.status, "passed")));
  assert.equal(Number(n!.n), 9);
  const [e] = await dbFrontier().select({ n: count() }).from(testSteps).where(eq(testSteps.passed, true));
  assert.ok(Number(e!.n) >= 9 * 11);
});

test("le protocole restaure aussi une ligne trouvée CONNECTÉE", async () => {
  const id = await ligneDe("service-access");
  assert.equal((await commanderLigne(id, "activate", { acteur: PDG, confirme: true })).ok, true);
  const r = await lancerProtocoleCoupures(id, PDG);
  assert.equal(r.ok, true, JSON.stringify(r.etapes.filter((x) => !x.ok)));
  assert.equal(await etat(id), "connected");
});

test("une ligne non validée est refusée par le protocole, sans rien changer", async () => {
  const id = await ligneDe("shared-stripe-account");
  const r = await lancerProtocoleCoupures(id, PDG);
  assert.equal(r.ok, false);
  assert.equal(r.etapes.length, 1);
  assert.match(r.etapes[0]!.observe, /non validée/);
  assert.equal(Number((await dbFrontier().select({ n: count() }).from(gates).where(eq(gates.open, true)))[0]!.n), 0);
});

test("essais de panne : panne, muet, désaccord, réparation par l'atelier, commande répétée, redémarrage — 3 fois, sans incident résiduel", async () => {
  for (const cle of VALIDES) {
    const id = await ligneDe(cle);
    for (let passe = 1; passe <= 3; passe++) {
      const r = await lancerProtocolePannes(id, PDG);
      const echecs = r.etapes.filter((e) => !e.ok).map((e) => `${e.nom} → ${e.observe}`);
      assert.deepEqual(echecs, [], `${cle}, passe ${passe}`);
      assert.equal(r.ok, true);
      assert.deepEqual(r.etapes.map((e) => e.nom), ["Panne d'un moteur interne", "Moteur qui ne répond pas", "Désaccord entre les deux moteurs", "Réparation de la coupure en erreur (atelier)", "Commande répétée", "Redémarrage", "Restauration de l'état initial"]);
      assert.equal(await etat(id), "disconnected");
      const restants = await dbFrontier().select().from(incidents).where(and(eq(incidents.lineId, id), eq(incidents.status, "open")));
      assert.deepEqual(restants.map((x) => x.kind), [], "les incidents créés par l'essai sont clos");
      const portes = await dbFrontier().select({ ouverte: gates.open }).from(gates).innerJoin(cuts, eq(cuts.id, gates.cutId)).where(eq(cuts.lineId, id));
      assert.ok(portes.every((p) => !p.ouverte), "aucune porte ouverte après l'essai");
    }
  }
});
