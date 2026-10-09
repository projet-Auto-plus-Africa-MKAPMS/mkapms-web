/**
 * Gouvernance du câble RÉEL de la Boutique par le centre : facultative, armée par le PDG, jamais par défaut. Le centre ne peut que RESTREINDRE.
 * Les voies existantes (outils de l'IA, canaux de shop_link) consultent le même portier. Base jetable : tables du câble + base du centre.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { after, before, beforeEach, test } from "node:test";
import { eq } from "drizzle-orm";
import { configurerBase, dbFrontier } from "../base/connexion.js";
import { auditLog } from "../base/schema.js";
import { commanderCoupure, commanderLigne } from "../commandes.js";
import { armerGouvernance, brancherPortierCentre, desarmerGouvernance, gouvernanceArmee, portierCentre } from "../gouvernance.js";
import { brancherPortier } from "../../shop-link/portier.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero, urlDeTest } from "./utilitaires.js";
import { oublierEtatBasePourTests } from "../base/demarrage.js";
import { cuts } from "../base/schema.js";
import { and } from "drizzle-orm";

type Plateforme = { pool: import("pg").Pool; service: typeof import("../../shop-link/service.js"); boutique: typeof import("../../intelligences/boutique.js") };
let p: Plateforme;
const o = { acteur: PDG, confirme: true } as const;

async function appliquer(pool: import("pg").Pool, fichier: string, filtre?: (i: string) => boolean) {
  for (const i of readFileSync(fichier, "utf8").split("--> statement-breakpoint")) if (i.trim() && (!filtre || filtre(i))) await pool.query(i);
}

before(async () => {
  const url = new URL(urlDeTest());
  process.env.DATABASE_URL = url.href;
  process.env.COFFRE_CLE_MAITRE = randomBytes(32).toString("hex");
  const { pool } = await import("../../db.js");
  await pool.query("DROP TABLE IF EXISTS shop_link_cables, shop_link_cles, shop_link_rejeu, shop_link_journal, shop_link_etat_boutique, shop_link_documents, shop_link_ia_boite, in_coffre_acces, in_coffre_secrets CASCADE");
  await appliquer(pool, "drizzle/0150_coffre_secrets.sql");
  await appliquer(pool, "drizzle/0156_shop_link.sql");
  p = { pool, service: await import("../../shop-link/service.js"), boutique: await import("../../intelligences/boutique.js") };
  await baseNeuve();
  brancherPortierCentre();
});
after(async () => {
  brancherPortier(null);
  await fermer();
  await p?.pool.end();
});
beforeEach(async () => {
  await remiseAZero();
  await desarmerGouvernance(PDG, true);
  await p.pool.query("DELETE FROM shop_link_cables");
});

const brancherCable = (canal: string, etat: "connecte" | "coupe") =>
  p.pool.query("INSERT INTO shop_link_cables (canal, etat, motif) VALUES ($1, $2, 'essai') ON CONFLICT (canal) DO UPDATE SET etat = EXCLUDED.etat", [canal, etat]);
const acces = { origine: "https://boutique.exemple.com", jeton: `shopsvc_${"B".repeat(43)}` };

test("non armée (état par défaut) : aucun changement de comportement, le câble reste seul juge", async () => {
  assert.equal(await gouvernanceArmee(), false);
  assert.deepEqual(await p.service.etatEffectif("documents"), { passe: false, raison: "CANAL_COUPE" });
  await brancherCable("documents", "connecte");
  assert.deepEqual(await p.service.etatEffectif("documents"), { passe: true }, "ligne du centre coupée, mais gouvernance non armée : le câble passe");
  assert.deepEqual(await portierCentre("documents", "entrant"), { autorise: true, raison: "gouvernance non armée" });
});

test("armée : le câble ne passe que si la ligne correspondante est CONNECTÉE sur ses trois coupures dans le centre", async () => {
  await brancherCable("documents", "connecte");
  const sans = await armerGouvernance(PDG, false);
  assert.equal(sans.ok, false, "armer exige une confirmation");
  assert.equal(await gouvernanceArmee(), false);
  assert.equal((await armerGouvernance(PDG, true)).ok, true);
  assert.equal(await gouvernanceArmee(), true);
  assert.deepEqual(await p.service.etatEffectif("documents"), { passe: false, raison: "GOUVERNANCE_CENTRE" });
  assert.match(p.service.messageCoupure("GOUVERNANCE_CENTRE"), /Centre Cyber-Électrique/);

  const id = await ligneDe("shop-documents-only");
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  assert.deepEqual(await p.service.etatEffectif("documents"), { passe: true });
  assert.deepEqual(await p.service.etatEffectif("documents", "entrant"), { passe: true });
  // Une seule coupure ouverte dans le centre suffit à fermer la voie réelle.
  const [c] = await dbFrontier().select().from(cuts).where(and(eq(cuts.lineId, id), eq(cuts.side, "main")));
  assert.equal((await commanderCoupure(c!.id, "deactivate", { acteur: PDG })).ok, true);
  assert.deepEqual(await p.service.etatEffectif("documents"), { passe: false, raison: "GOUVERNANCE_CENTRE" });
  assert.deepEqual(await p.service.etatEffectif("documents", "entrant"), { passe: false, raison: "GOUVERNANCE_CENTRE" });
  assert.equal((await desarmerGouvernance(PDG, true)).ok, true);
  assert.deepEqual(await p.service.etatEffectif("documents"), { passe: true }, "désarmée : le câble reprend la main");
});

test("le centre ne peut JAMAIS ouvrir ce que le câble refuse", async () => {
  await armerGouvernance(PDG, true);
  assert.equal((await commanderLigne(await ligneDe("shop-documents-only"), "activate", o)).ok, true);
  await brancherCable("documents", "coupe");
  assert.deepEqual(await p.service.etatEffectif("documents"), { passe: false, raison: "CANAL_COUPE" }, "ligne connectée dans le centre, câble coupé : coupé");
  await p.pool.query("INSERT INTO shop_link_cables (canal, etat, motif) VALUES ('maitre', 'coupe', 'essai') ON CONFLICT (canal) DO UPDATE SET etat = 'coupe'");
  await brancherCable("documents", "connecte");
  assert.deepEqual(await p.service.etatEffectif("documents"), { passe: false, raison: "MAITRE_COUPE" });
});

test("canal sans ligne dans le centre : armée, la gouvernance le ferme (ia-mémoire), les canaux en attente externe restent fermés", async () => {
  await armerGouvernance(PDG, true);
  await brancherCable("ia-memoire", "connecte");
  assert.deepEqual(await p.service.etatEffectif("ia-memoire"), { passe: false, raison: "GOUVERNANCE_CENTRE" });
  const d = await portierCentre("ia-memoire", "entrant");
  assert.match(d.raison, /aucune ligne du centre/);
  assert.deepEqual(await p.service.etatEffectif("paiement"), { passe: false, raison: "ATTENTE_EXTERNE" }, "le câble garde la main sur l'attente externe");
});

test("voie directe des outils de l'IA : le portier est consulté à chaque appel (aucun appel réseau si la ligne est coupée)", async () => {
  let appels = 0;
  const fetchEspion = (async () => {
    appels += 1;
    return new Response(JSON.stringify({ capabilities: [] }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  // Non armée : l'appel part (comportement inchangé).
  assert.equal((await p.boutique.capacitesBoutique(acces, fetchEspion)).ok, true);
  assert.equal(appels, 1);
  // Armée, ligne « catalogue » (accès de service) coupée : aucun appel réseau, refus motivé.
  await armerGouvernance(PDG, true);
  const refus = await p.boutique.capacitesBoutique(acces, fetchEspion);
  assert.equal(refus.ok, false);
  assert.equal((refus as { code?: string }).code, "GOUVERNANCE_CENTRE");
  assert.match((refus as { detail: string }).detail, /Centre Cyber-Électrique/);
  assert.equal(appels, 1, "rien n'est parti vers la Boutique");
  // Ligne connectée : l'appel repart.
  assert.equal((await commanderLigne(await ligneDe("service-access"), "activate", o)).ok, true);
  assert.equal((await p.boutique.capacitesBoutique(acces, fetchEspion)).ok, true);
  assert.equal(appels, 2);
});

test("armée et centre indisponible : fermé par sécurité ; non armée : jamais bloquant", async () => {
  await armerGouvernance(PDG, true);
  assert.equal(await gouvernanceArmee(), true);
  await configurerBase("postgresql://postgres:x@127.0.0.1:1/inexistante_test");
  oublierEtatBasePourTests();
  const d = await portierCentre("documents", "sortant");
  assert.equal(d.autorise, false, "dernier état connu : armée → fermé");
  assert.match(d.raison, /fermé|ferm/);
  // Retour à la normale.
  await configurerBase(urlDeTest());
  oublierEtatBasePourTests();
  assert.equal(await gouvernanceArmee(), true);
  await desarmerGouvernance(PDG, true);
  assert.equal((await portierCentre("documents", "sortant")).autorise, true);
});

test("le journal garde la trace des refus du portier et de l'armement", async () => {
  await armerGouvernance(PDG, true);
  await portierCentre("documents", "sortant");
  await new Promise((r) => setTimeout(r, 2100));
  await portierCentre("documents", "sortant");
  const journal = await dbFrontier().select().from(auditLog);
  const actions = journal.map((a) => a.action);
  assert.ok(actions.includes("governance_arm"));
  assert.ok(actions.filter((a) => a === "governance_denied").length >= 1);
  assert.ok(actions.filter((a) => a === "governance_denied").length <= 3, "les refus répétés ne noient pas le journal");
});
