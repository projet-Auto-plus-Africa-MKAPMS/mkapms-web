/**
 * Liaisons RÉELLES du centre : deux clés (environnement + armement du PDG), ligne par ligne ; l'interrupteur principal commande le vrai câble de shop_link et son état est
 * RELU ; l'interrupteur de la Boutique reçoit un ordre qu'elle vient chercher et accuse (signé) avec l'état qu'elle observe ; le contact central est la porte lue par le portier.
 * La Boutique est jouée par l'ÉMETTEUR DE RÉFÉRENCE (scripts/boutique-emetteur-reference.mjs) contre le vrai serveur de shop_link sur un port local.
 * Base jetable : tables du câble + base du centre. Toutes les valeurs sont des fixtures fictives.
 */
import assert from "node:assert/strict";
import { generateKeyPairSync, randomBytes, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, afterEach, before, beforeEach, test } from "node:test";
import { and, eq } from "drizzle-orm";
import { dbFrontier } from "../base/connexion.js";
import { cuts, gates, incidents, remoteOrders, remoteReports } from "../base/schema.js";
import { chargerLigne } from "../chaine.js";
import { commanderCoupure, commanderLigne, reprendreApresRedemarrage } from "../commandes.js";
import { armerGouvernance, brancherPortierCentre, desarmerGouvernance, portierCentre } from "../gouvernance.js";
import { brancherCommutationCentre } from "../liaisons-reelles.js";
import { PHRASE_ARMEMENT, armerReel, definirModeLigne, desarmerReel, reconcilierLiaisonsReelles, reelVue } from "../reel.js";
import { reelAutorise } from "../reel-etat.js";
import { brancherPortier } from "../../shop-link/portier.js";
import { brancherCommutation } from "../../shop-link/commutation.js";
import { PDG, baseNeuve, fermer, ligneDe, remiseAZero, urlDeTest } from "./utilitaires.js";

type Plateforme = { pool: import("pg").Pool; service: typeof import("../../shop-link/service.js") };
type Emetteur = { cycle: (o: Record<string, unknown>) => Promise<{ ok: boolean; accuses?: number }>; entetesSignes: (o: Record<string, unknown>) => Record<string, string> };
let p: Plateforme;
let emetteur: Emetteur;
let serveur: Server;
let base = "";
let clePrivee: KeyObject;
const o = { acteur: PDG, confirme: true } as const;

async function appliquer(pool: import("pg").Pool, fichier: string, filtre?: (i: string) => boolean) {
  for (const i of readFileSync(fichier, "utf8").split("--> statement-breakpoint")) if (i.trim() && (!filtre || filtre(i))) await pool.query(i);
}

before(async () => {
  process.env.DATABASE_URL = new URL(urlDeTest()).href;
  process.env.COFFRE_CLE_MAITRE = randomBytes(32).toString("hex");
  process.env.FRONTIER_ATTENTE_ACCUSE_MS = "2500";
  const { pool } = await import("../../db.js");
  await pool.query("DROP TABLE IF EXISTS shop_link_cables, shop_link_cles, shop_link_rejeu, shop_link_journal, shop_link_etat_boutique, shop_link_documents, shop_link_ia_boite, in_coffre_acces, in_coffre_secrets CASCADE");
  await appliquer(pool, "drizzle/0150_coffre_secrets.sql");
  await appliquer(pool, "drizzle/0156_shop_link.sql");
  p = { pool, service: await import("../../shop-link/service.js") };
  await baseNeuve();
  brancherPortierCentre();
  brancherCommutationCentre();
  const { default: express } = await import("express");
  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/shop-link", (await import("../../shop-link/entrant.js")).shopLinkApi);
  serveur = app.listen(0, "127.0.0.1");
  await new Promise((r) => serveur.once("listening", r));
  base = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  const chemin = "../../../scripts/boutique-emetteur-reference.mjs";
  emetteur = (await import(chemin)) as Emetteur;
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  clePrivee = privateKey;
  const enr = await p.service.enregistrerCle({ libelle: "Boutique — essai", clePublique: publicKey.export({ type: "spki", format: "der" }).toString("base64url"), acteur: 1 });
  assert.equal(enr.ok, true, enr.detail);
});
after(async () => {
  serveur?.close();
  brancherPortier(null);
  brancherCommutation(null);
  delete process.env.FRONTIER_MODE_REEL;
  await fermer();
  await p?.pool.end();
});
beforeEach(async () => {
  await remiseAZero();
  await desarmerGouvernance(PDG, true);
  await p.pool.query("DELETE FROM shop_link_cables");
  await p.pool.query("DELETE FROM shop_link_documents");
  await p.pool.query("DELETE FROM shop_link_rejeu");
  delete process.env.FRONTIER_MODE_REEL;
});
let boutique: { arreter: () => void; etat: Map<string, "connected" | "disconnected"> } | null = null;
afterEach(() => {
  boutique?.arreter();
  boutique = null;
});

/** La Boutique de référence : vient chercher les ordres toutes les 700 ms et accuse avec l'état de SON interrupteur local. */
function demarrerBoutique(options: { accepte?: () => boolean; ligne?: string } = {}) {
  const etat = new Map<string, "connected" | "disconnected">([[options.ligne ?? "shop-documents-only", "disconnected"]]);
  const interrupteurs = { lecture: (l: string) => etat.get(l) ?? null, ecriture: (l: string, e: "connected" | "disconnected") => void etat.set(l, e) };
  let encours = false;
  const minuterie = setInterval(() => {
    if (encours) return;
    encours = true;
    emetteur.cycle({ base, clePrivee, interrupteurs, accepte: options.accepte ?? (() => true) }).catch(() => undefined).finally(() => (encours = false));
  }, 700);
  boutique = { arreter: () => clearInterval(minuterie), etat };
  return boutique;
}

const armerTout = async () => {
  process.env.FRONTIER_MODE_REEL = "oui";
  const r = await armerReel(PDG, PHRASE_ARMEMENT);
  assert.equal(r.ok, true, r.detail);
};
const coupureDe = async (ligneId: number, side: "remote" | "center" | "main") => (await dbFrontier().select().from(cuts).where(and(eq(cuts.lineId, ligneId), eq(cuts.side, side))).limit(1))[0]!;
const cableDe = async (canal: string) => (await p.service.lireCables()).canaux[canal as "documents"].etat;
const document = (ref: string) => ({ version: 1, documents: [{ reference: ref, statut: "emis", totalMinor: 1000, devise: "GNF", referenceCommande: null, emisLe: null }] });
async function poster(corps: unknown, chemin = "/api/shop-link/v1/documents") {
  const r = await fetch(`${base}${chemin}`, { method: "POST", headers: emetteur.entetesSignes({ methode: "POST", chemin, corps, clePrivee }), body: JSON.stringify(corps) });
  return { statut: r.status, json: (await r.json()) as Record<string, unknown> };
}

test("deux clés : sans la variable d'environnement OU sans l'armement du PDG (et sa phrase), rien n'est permis ; tout est tracé", async () => {
  assert.equal(await reelAutorise(), false);
  const sansEnv = await armerReel(PDG, PHRASE_ARMEMENT);
  assert.equal(sansEnv.ok, false);
  assert.equal(sansEnv.code, "ENVIRONNEMENT_ABSENT");
  process.env.FRONTIER_MODE_REEL = "oui";
  const mauvaise = await armerReel(PDG, "armer");
  assert.equal(mauvaise.code, "PHRASE_INCORRECTE");
  assert.equal(await reelAutorise(), false, "la variable seule ne suffit pas");
  assert.equal((await armerReel(PDG, PHRASE_ARMEMENT)).ok, true);
  assert.equal(await reelAutorise(), true);
  delete process.env.FRONTIER_MODE_REEL;
  assert.equal(await reelAutorise(), false, "l'armement seul ne suffit pas non plus : retirer la variable ferme tout");
  const vue = await reelVue(1);
  assert.equal(vue.arme, true);
  assert.equal(vue.autorise, false);
});

test("passer une ligne en réel : refusé tant que le mode réel n'est pas permis ; refusé sans liaison réelle (paiement, google, entrée sans canal) ; états remis à zéro", async () => {
  const documents = await ligneDe("shop-documents-only");
  const refus = await definirModeLigne(documents, "real", PDG);
  assert.equal(refus.ok, false);
  assert.equal(refus.code, "MODE_REEL_NON_ACTIVE");
  await armerTout();
  for (const cle of ["shared-stripe-account", "shared-google-owner", "main-to-shop-entry"]) {
    const r = await definirModeLigne(await ligneDe(cle), "real", PDG);
    assert.equal(r.ok, false, cle);
    assert.ok(["NON_VALIDEE", "LIAISON_ABSENTE"].includes(r.code!), `${cle} : ${r.code}`);
  }
  const ok = await definirModeLigne(documents, "real", PDG);
  assert.equal(ok.ok, true, ok.detail);
  const c = await chargerLigne(documents);
  assert.ok(c!.coupures.every((x) => x.mode === "real" && x.requested === "none" && x.observed === "unknown" && !x.porteOuverte), "trois coupures réelles, coupées, jamais commandées");
  const vue = await reelVue(1);
  const l = vue.lignes.find((x) => x.id === documents)!;
  assert.equal(l.regime, "reel");
  assert.deepEqual(l.natures.map((n) => `${n.side}:${n.liaison}`).sort(), ["center:porte_du_centre", "main:cable_shop_link", "remote:commutation_boutique"]);
  // Les autres lignes restent simulées : on ne mélange pas.
  assert.equal(vue.lignes.find((x) => x.intermediaire === "shop-intelligence-isolated")!.regime, "simulation");
});

test("ligne réelle : l'activation commande le VRAI câble, l'ordre part à la Boutique qui accuse, l'état est relu — puis chaque coupure, seule, referme la voie réelle", async () => {
  await armerTout();
  await armerGouvernance(PDG, true);
  const id = await ligneDe("shop-documents-only");
  assert.equal((await definirModeLigne(id, "real", PDG)).ok, true);
  const b = demarrerBoutique();

  const r = await commanderLigne(id, "activate", o);
  assert.equal(r.ok, true, `${r.detail} ${JSON.stringify(r.enfants?.map((e) => e.detail))}`);
  assert.equal(await cableDe("documents"), "connecte", "le câble réel de shop_link est fermé");
  assert.equal(b.etat.get("shop-documents-only"), "connected", "la Boutique a fermé son interrupteur local");
  const [rapport] = await dbFrontier().select().from(remoteReports);
  assert.equal(rapport!.state, "connected");
  const c = await chargerLigne(id);
  assert.ok(c!.coupures.every((x) => x.observed === "connected" && x.progress === "confirmed" && x.mode === "real"));
  assert.match(c!.coupures.find((x) => x.side === "main")!.lastProof ?? "", /commande:/);

  // Un échange RÉEL traverse : signé par la Boutique, câble fermé, ligne connectée dans le centre (gouvernance armée).
  const ok = await poster(document("DOC-1"));
  assert.equal(ok.statut, 200, JSON.stringify(ok.json));
  assert.equal((await p.pool.query("SELECT count(*)::int AS n FROM shop_link_documents")).rows[0].n, 1);

  // CHAQUE coupure, seule, referme la voie réelle (aucune ne dépend d'une autre).
  for (const side of ["center", "main", "remote"] as const) {
    assert.equal((await commanderLigne(id, "deactivate", o)).ok, true);
    assert.equal((await commanderLigne(id, "activate", o)).ok, true, `réactivation avant l'essai ${side}`);
    assert.equal((await poster(document(`DOC-${side}-avant`))).statut, 200);
    const cut = await coupureDe(id, side);
    const rc = await commanderCoupure(cut.id, "deactivate", { acteur: PDG });
    assert.equal(rc.ok, true, `${side} : ${rc.detail}`);
    const apres = await poster(document(`DOC-${side}-apres`));
    assert.notEqual(apres.statut, 200, `la coupure « ${side} » ouverte seule doit refermer la voie réelle`);
    assert.ok([503].includes(apres.statut), `${side} : ${apres.statut}`);
  }
  assert.equal((await p.pool.query("SELECT count(*)::int AS n FROM shop_link_documents WHERE reference LIKE '%-apres'")).rows[0].n, 0, "aucun document n'a traversé une coupure ouverte");
});

test("coupure de la ligne : câble coupé, Boutique accuse « ouvert », plus rien ne passe ; une réactivation exige de nouveau la confirmation", async () => {
  await armerTout();
  await armerGouvernance(PDG, true);
  const id = await ligneDe("shop-documents-only");
  await definirModeLigne(id, "real", PDG);
  const b = demarrerBoutique();
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  const coupe = await commanderLigne(id, "deactivate", o);
  assert.equal(coupe.ok, true, coupe.detail);
  assert.equal(await cableDe("documents"), "coupe");
  assert.equal(b.etat.get("shop-documents-only"), "disconnected");
  const refus = await poster(document("DOC-X"));
  assert.equal(refus.statut, 503);
  assert.equal(refus.json.status, "CABLE_COUPE");
  const sans = await commanderLigne(id, "activate", { acteur: PDG });
  assert.equal(sans.ok, false, "pas de réactivation sans confirmation");
});

test("Boutique SILENCIEUSE : aucun accusé signé → l'activation échoue FERMÉE (rien n'est ouvert), l'ordre expire, un incident est ouvert", async () => {
  await armerTout();
  const id = await ligneDe("shop-documents-only");
  await definirModeLigne(id, "real", PDG);
  // Aucune Boutique ne répond.
  const r = await commanderLigne(id, "activate", o);
  assert.equal(r.ok, false);
  assert.equal(await cableDe("documents"), "coupe", "le câble n'a pas été touché : l'interrupteur distant est la première coupure");
  const c = await chargerLigne(id);
  assert.ok(c!.coupures.every((x) => !x.porteOuverte && x.observed !== "connected"));
  const ordres = await dbFrontier().select().from(remoteOrders);
  assert.ok(ordres.length >= 1 && ordres.every((x) => x.status === "expired" || x.status === "cancelled"));
  assert.ok((await dbFrontier().select().from(incidents)).some((i) => /execution_impossible|verification_impossible|activation_non_confirmee/.test(i.kind)));
  const passage = await poster(document("DOC-Y"));
  assert.equal(passage.statut, 503);
});

test("la Boutique peut REFUSER un ordre (elle reste maîtresse chez elle) : l'activation n'est pas confirmée et rien n'est ouvert côté plateforme", async () => {
  await armerTout();
  const id = await ligneDe("shop-documents-only");
  await definirModeLigne(id, "real", PDG);
  const b = demarrerBoutique({ accepte: () => false });
  const r = await commanderLigne(id, "activate", o);
  assert.equal(r.ok, false);
  assert.match(JSON.stringify(r), /Boutique/);
  assert.equal(b.etat.get("shop-documents-only"), "disconnected");
  assert.equal(await cableDe("documents"), "coupe");
});

test("câble réel sans effet (commutateur général coupé) : la sonde relit le câble, ne confirme pas, et le contact est refermé — jamais à moitié branché", async () => {
  await armerTout();
  const id = await ligneDe("shop-documents-only");
  await definirModeLigne(id, "real", PDG);
  await p.service.regler("maitre", "coupe", { motif: "essai de panne", acteur: 1 });
  const main = await coupureDe(id, "main");
  const r = await commanderCoupure(main.id, "activate", o);
  assert.equal(r.ok, false);
  assert.ok(["CONTRADICTION", "ECHEC_EXECUTION", "ECHEC_VERIFICATION"].includes(r.code!), String(r.code));
  assert.equal(await cableDe("documents"), "coupe", "ce qui a été établi est défait");
  const [g] = await dbFrontier().select().from(gates).where(eq(gates.cutId, main.id));
  assert.equal(g!.open, false);
  await p.service.regler("maitre", "connecte", { motif: "fin de l'essai", acteur: 1 });
});

test("mode réel retiré (variable ou armement) : une ligne réelle ne laisse plus rien passer et ne s'active plus ; une COUPURE reste toujours possible", async () => {
  await armerTout();
  await armerGouvernance(PDG, true);
  const id = await ligneDe("shop-documents-only");
  await definirModeLigne(id, "real", PDG);
  demarrerBoutique();
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  assert.equal((await poster(document("DOC-A"))).statut, 200);
  delete process.env.FRONTIER_MODE_REEL;
  assert.equal((await portierCentre("documents", "entrant")).autorise, false, "fermé par sécurité");
  assert.equal((await poster(document("DOC-B"))).statut, 503);
  const refus = await commanderLigne(id, "activate", o);
  assert.equal(refus.ok, false);
  const coupe = await commanderLigne(id, "deactivate", o);
  assert.equal(coupe.ok, true, "couper est toujours permis");
  assert.equal(await cableDe("documents"), "coupe");
});

test("réconciliation : un câble ouvert HORS du centre, sur une ligne réelle, est coupé et signalé ; jamais rouvert", async () => {
  await armerTout();
  const id = await ligneDe("shop-documents-only");
  await definirModeLigne(id, "real", PDG);
  await p.service.regler("documents", "connecte", { motif: "ouvert à la main (essai)", acteur: 1 }).catch(() => undefined);
  await p.pool.query("INSERT INTO shop_link_cables (canal, etat, motif) VALUES ('documents', 'connecte', 'ouvert à la main (essai)') ON CONFLICT (canal) DO UPDATE SET etat = 'connecte'");
  assert.equal(await cableDe("documents"), "connecte");
  const bilan = await reconcilierLiaisonsReelles();
  assert.ok(bilan.coupuresCoupees >= 1, JSON.stringify(bilan));
  assert.equal(await cableDe("documents"), "coupe");
  assert.ok((await dbFrontier().select().from(incidents)).some((i) => i.kind === "liaison_ouverte_hors_centre"));
  const encore = await reconcilierLiaisonsReelles();
  assert.equal(encore.coupuresCoupees, 0, "rien à couper la seconde fois");
  assert.equal(await cableDe("documents"), "coupe");
});

test("redémarrage : une activation interrompue ne se termine JAMAIS toute seule, une ligne connectée le reste telle quelle, le câble d'une ligne non confirmée est coupé", async () => {
  await armerTout();
  const id = await ligneDe("shop-documents-only");
  await definirModeLigne(id, "real", PDG);
  demarrerBoutique();
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  // Redémarrage « propre » : l'état connecté et confirmé reste identique, le câble aussi.
  await reprendreApresRedemarrage();
  const bilan = await reconcilierLiaisonsReelles();
  assert.equal(bilan.coupuresCoupees, 0, JSON.stringify(bilan));
  assert.equal(await cableDe("documents"), "connecte");
  const c = await chargerLigne(id);
  assert.ok(c!.coupures.every((x) => x.observed === "connected" && x.progress === "confirmed"));
  // Crash en pleine activation : câble ouvert, coupure principale « en cours », porte fermée.
  const main = await coupureDe(id, "main");
  await dbFrontier().update(cuts).set({ requested: "activate", progress: "in_progress", observed: "unknown" }).where(eq(cuts.id, main.id));
  await dbFrontier().update(gates).set({ open: false }).where(eq(gates.cutId, main.id));
  await reprendreApresRedemarrage();
  await reconcilierLiaisonsReelles();
  assert.equal(await cableDe("documents"), "coupe", "le câble ouvert d'une activation non confirmée est coupé, pas rebranché");
  const apres = await coupureDe(id, "main");
  assert.notEqual(apres.progress, "confirmed");
});

test("désarmer : la clé est retirée D'ABORD, la ligne réelle est coupée et confirmée, puis revient en simulation ; la voie réelle est refermée", async () => {
  await armerTout();
  await armerGouvernance(PDG, true);
  const id = await ligneDe("shop-documents-only");
  await definirModeLigne(id, "real", PDG);
  demarrerBoutique();
  assert.equal((await commanderLigne(id, "activate", o)).ok, true);
  assert.equal((await poster(document("DOC-D1"))).statut, 200);
  const bilan = await desarmerReel(PDG);
  assert.equal(bilan.ok, true, bilan.detail + JSON.stringify(bilan.lignes));
  assert.equal(await cableDe("documents"), "coupe");
  assert.equal((await poster(document("DOC-D2"))).statut, 503);
  const c = await chargerLigne(id);
  assert.ok(c!.coupures.every((x) => x.mode === "simulation" && x.observed === "unknown" && !x.porteOuverte), "revenue en simulation, remise à zéro, rien de rebranché");
  assert.equal(await reelAutorise(), false);
});

test("plan de commande de la Boutique : sans signature, ancien horodatage, ligne inconnue ou accusé sans ordre → refusés ; un accusé plus ancien n'écrase jamais un plus récent", async () => {
  const id = await ligneDe("shop-documents-only");
  const chemin = "/api/shop-link/v1/commutation/accuse";
  const corps = { version: 1, accuses: [{ ordre: null, ligne: "shop-documents-only", etat: "connected", observeLe: new Date().toISOString() }] };
  const sansSignature = await fetch(`${base}${chemin}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corps) });
  assert.equal(sansSignature.status, 401);
  assert.equal((await dbFrontier().select().from(remoteReports)).length, 0, "un message non signé n'écrit rien");
  const signe = async (c: unknown) => {
    const r = await fetch(`${base}${chemin}`, { method: "POST", headers: emetteur.entetesSignes({ methode: "POST", chemin, corps: c, clePrivee }), body: JSON.stringify(c) });
    return { statut: r.status, json: (await r.json()) as { acceptes?: number; refuses?: { raison: string }[] } };
  };
  const inconnue = await signe({ version: 1, accuses: [{ ordre: null, ligne: "ligne-fantome", etat: "connected", observeLe: new Date().toISOString() }] });
  assert.equal(inconnue.json.acceptes, 0);
  assert.match(inconnue.json.refuses![0]!.raison, /ligne inconnue/);
  const vieux = await signe({ version: 1, accuses: [{ ordre: null, ligne: "shop-documents-only", etat: "connected", observeLe: new Date(Date.now() - 3_600_000).toISOString() }] });
  assert.match(vieux.json.refuses![0]!.raison, /horodatage/);
  const sansOrdre = await signe({ version: 1, accuses: [{ ordre: 999999, ligne: "shop-documents-only", etat: "connected", observeLe: new Date().toISOString() }] });
  assert.match(sansOrdre.json.refuses![0]!.raison, /ordre inconnu/);
  const recent = new Date();
  assert.equal((await signe({ version: 1, accuses: [{ ordre: null, ligne: "shop-documents-only", etat: "disconnected", observeLe: recent.toISOString() }] })).json.acceptes, 1);
  await signe({ version: 1, accuses: [{ ordre: null, ligne: "shop-documents-only", etat: "connected", observeLe: new Date(recent.getTime() - 60_000).toISOString() }] });
  const [r] = await dbFrontier().select().from(remoteReports).where(eq(remoteReports.lineId, id));
  assert.equal(r!.state, "disconnected", "le rapport le plus récent l'emporte");
  // Corps hors contrat refusé (schéma strict).
  const mauvais = await signe({ version: 1, accuses: [{ ordre: null, ligne: "shop-documents-only", etat: "connected", observeLe: recent.toISOString(), secret: "x" }] } as never);
  assert.equal(mauvais.statut, 400);
});

test("sans centre branché, le plan de commande ne délivre aucun ordre et refuse tout accusé", async () => {
  brancherCommutation(null);
  const chemin = "/api/shop-link/v1/commutation/ordres";
  const r = await fetch(`${base}${chemin}`, { headers: emetteur.entetesSignes({ methode: "GET", chemin, corps: undefined, clePrivee }) });
  const j = (await r.json()) as { ok: boolean; disponible: boolean; ordres: unknown[] };
  assert.equal(j.disponible, false);
  assert.deepEqual(j.ordres, []);
  const acc = "/api/shop-link/v1/commutation/accuse";
  const corps = { version: 1, accuses: [{ ordre: null, ligne: "shop-documents-only", etat: "connected", observeLe: new Date().toISOString() }] };
  const a = await fetch(`${base}${acc}`, { method: "POST", headers: emetteur.entetesSignes({ methode: "POST", chemin: acc, corps, clePrivee }), body: JSON.stringify(corps) });
  assert.equal(a.status, 503);
  brancherCommutationCentre();
});
