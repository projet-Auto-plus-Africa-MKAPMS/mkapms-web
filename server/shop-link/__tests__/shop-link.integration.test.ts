/**
 * Moteur intermédiaire Boutique — câble, clés, passerelle sortante, passerelle entrante (HTTP réel sur un port local),
 * boîte d'échange des IA, routeur PDG, flux du centre de contrôle. Base PostgreSQL jetable (core_ai_test), migrations
 * 0150 (coffre), 0119 (connaissance) et 0156 (moteur) appliquées. Toutes les valeurs sont des fixtures fictives.
 */
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, randomBytes, sign, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

const JETON = `shopsvc_${"B".repeat(43)}`;
const ORIGINE = "https://boutique.exemple.com";
const PDG = 1;

type Modules = {
  pool: import("pg").Pool;
  service: typeof import("../service.js");
  sortant: typeof import("../sortant.js");
  boite: typeof import("../boite.js");
  index: typeof import("../index.js");
  contrats: typeof import("../contrats.js");
  coffre: typeof import("../../intelligences/coffre.js");
  boutique: typeof import("../../intelligences/boutique.js");
};
let m: Modules;
let serveur: Server;
let base = "";

function nouvelleCle() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  return { privateKey, clePublique: publicKey.export({ type: "spki", format: "der" }).toString("base64url") };
}
const cleA = nouvelleCle();
const cleB = nouvelleCle();

const pdg = () => m.index.shopLinkRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: PDG, role: "super_admin", email: "pdg@exemple.test" } });

async function appliquer(pool: import("pg").Pool, fichier: string, filtre?: (instruction: string) => boolean) {
  for (const instruction of readFileSync(fichier, "utf8").split("--> statement-breakpoint")) {
    if (instruction.trim() && (!filtre || filtre(instruction))) await pool.query(instruction);
  }
}

async function appeler(
  methode: "GET" | "POST",
  chemin: string,
  corps?: unknown,
  options: { cle?: { privateKey: KeyObject }; nonce?: string; temps?: number; signature?: string; entetes?: Record<string, string> } = {},
) {
  const cle = options.cle ?? cleA;
  const temps = String(options.temps ?? Date.now());
  const nonce = options.nonce ?? randomBytes(16).toString("hex");
  const signature =
    options.signature ?? sign(null, m.service.messageSigne(methode, chemin, temps, nonce, m.service.hashCorps(methode, corps)), cle.privateKey).toString("base64url");
  const reponse = await fetch(`${base}${chemin}`, {
    method: methode,
    headers: { "content-type": "application/json", "x-shop-link-time": temps, "x-shop-link-nonce": nonce, "x-shop-link-signature": signature, ...(options.entetes ?? {}) },
    body: methode === "GET" ? undefined : JSON.stringify(corps ?? {}),
  });
  return { statut: reponse.status, json: (await reponse.json()) as Record<string, unknown> };
}

before(async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname), "base de test locale uniquement");
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  process.env.COFFRE_CLE_MAITRE = randomBytes(32).toString("hex");
  const { pool } = await import("../../db.js");
  await pool.query("DROP TABLE IF EXISTS shop_link_cables, shop_link_cles, shop_link_rejeu, shop_link_journal, shop_link_etat_boutique, shop_link_documents, shop_link_ia_boite, in_coffre_acces, in_coffre_secrets, in_connaissance CASCADE");
  await appliquer(pool, "drizzle/0150_coffre_secrets.sql");
  await appliquer(pool, "drizzle/0119_intelligences_memoire_fichiers_rag.sql", (i) => i.includes("in_connaissance"));
  await appliquer(pool, "drizzle/0156_shop_link.sql");
  m = {
    pool,
    service: await import("../service.js"),
    sortant: await import("../sortant.js"),
    boite: await import("../boite.js"),
    index: await import("../index.js"),
    contrats: await import("../contrats.js"),
    coffre: await import("../../intelligences/coffre.js"),
    boutique: await import("../../intelligences/boutique.js"),
  };
  const { default: express } = await import("express");
  const app = express();
  app.use(express.json({ limit: "50mb" }));
  app.use("/api/shop-link", (await import("../entrant.js")).shopLinkApi);
  serveur = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => serveur.once("listening", resolve));
  base = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
});

after(async () => {
  serveur?.close();
  await m?.pool.end();
});

// ── Câble et prérequis ────────────────────────────────────────────────────────────────────────────────────────────────
test("câble : par défaut tout est coupé et le commutateur général est branché", async () => {
  const cables = await m.service.lireCables();
  assert.equal(cables.maitre.etat, "connecte");
  for (const id of m.contrats.CANAUX_IDS) {
    assert.equal(cables.canaux[id].etat, "coupe", id);
    assert.equal((await m.service.etatEffectif(id)).passe, false, id);
  }
});

test("câble : motif obligatoire, canal en attente externe refusé, prérequis nommés, branchement puis coupure tracés", async () => {
  const p = pdg();
  const sansMotif = await m.service.regler("etat", "connecte", { motif: "  ", acteur: PDG });
  assert.equal(sansMotif.code, "MOTIF_REQUIS");
  const externe = await p.regler({ cible: "paiement", etat: "connecte", motif: "essai paiement" });
  assert.equal(externe.ok, false);
  assert.equal(externe.code, "ATTENTE_EXTERNE");
  assert.match(externe.detail, /Stripe/);
  const sansCle = await p.regler({ cible: "etat", etat: "connecte", motif: "essai état" });
  assert.equal(sansCle.code, "PREREQUIS");
  assert.match(sansCle.detail, /clé publique/);
  const sansSecrets = await p.regler({ cible: "catalogue", etat: "connecte", motif: "essai catalogue" });
  assert.equal(sansSecrets.code, "PREREQUIS");
  assert.match(sansSecrets.detail, /Boutique — adresse/);
  assert.match(sansSecrets.detail, /Boutique — jeton de service/);
  assert.ok(!sansSecrets.detail.includes(JETON));

  // Le Coffre reçoit les deux secrets (nom saisi avec un tiret ordinaire : retrouvé quand même).
  assert.equal((await m.coffre.ajouterSecret({ ownerId: PDG, nom: "Boutique - adresse", contenu: { type: "cle_api", valeur: ORIGINE } })).ok, true);
  assert.equal((await m.coffre.ajouterSecret({ ownerId: PDG, nom: "Boutique — jeton de service", contenu: { type: "cle_api", valeur: JETON } })).ok, true);
  const ok = await p.regler({ cible: "catalogue", etat: "connecte", motif: "essai catalogue" });
  assert.equal(ok.ok, true, ok.detail);
  assert.equal((await m.service.etatEffectif("catalogue")).passe, true);

  const couper = await p.regler({ cible: "catalogue", etat: "coupe", motif: "fin de l'essai" });
  assert.equal(couper.ok, true);
  assert.deepEqual(await m.service.etatEffectif("catalogue"), { passe: false, raison: "CANAL_COUPE" });
  const journal = await m.service.lireJournal({ canal: "catalogue" });
  assert.deepEqual(journal.filter((l) => l.evenement === "cable").map((l) => l.detail).reverse(), ["catalogue → connecte : essai catalogue", "catalogue → coupe : fin de l'essai"]);
  assert.equal(journal[0].acteur, `pdg:${PDG}`);
});

test("câble : tout couper coupe le général ET chaque canal ; rebrancher le général ne rebranche aucun canal", async () => {
  const p = pdg();
  assert.equal((await m.service.enregistrerCle({ libelle: "Boutique — essai", clePublique: cleA.clePublique, acteur: PDG })).ok, true);
  for (const id of ["etat", "documents", "ia-memoire"] as const) assert.equal((await p.regler({ cible: id, etat: "connecte", motif: "essai complet" })).ok, true, id);
  assert.equal((await p.regler({ cible: "catalogue", etat: "connecte", motif: "essai complet" })).ok, true);
  const arret = await p.toutCouper({ motif: "incident simulé" });
  assert.equal(arret.ok, true);
  let cables = await m.service.lireCables();
  assert.equal(cables.maitre.etat, "coupe");
  for (const id of m.contrats.CANAUX_IDS) assert.equal(cables.canaux[id].etat, "coupe", id);
  assert.equal((await p.regler({ cible: "maitre", etat: "connecte", motif: "fin de l'incident" })).ok, true);
  cables = await m.service.lireCables();
  assert.equal(cables.maitre.etat, "connecte");
  for (const id of m.contrats.CANAUX_IDS) assert.equal((await m.service.etatEffectif(id)).passe, false, `${id} reste coupé`);
});

// ── Clés publiques ────────────────────────────────────────────────────────────────────────────────────────────────────
test("clés : doublon, clé invalide, plafond, révocation définitive", async () => {
  assert.equal((await m.service.enregistrerCle({ libelle: "Doublon", clePublique: cleA.clePublique, acteur: PDG })).detail, "Cette clé est déjà enregistrée.");
  assert.equal((await m.service.enregistrerCle({ libelle: "X", clePublique: cleB.clePublique, acteur: PDG })).ok, false, "nom trop court");
  assert.equal((await m.service.enregistrerCle({ libelle: "Mauvaise", clePublique: "A".repeat(60), acteur: PDG })).ok, false);
  const b = await m.service.enregistrerCle({ libelle: "Boutique — seconde", clePublique: cleB.clePublique, acteur: PDG });
  assert.equal(b.ok, true);
  assert.equal((await m.service.clesActives()).length, 2);
  const revoquee = await m.service.revoquerCle({ id: b.id!, acteur: PDG });
  assert.equal(revoquee.ok, true);
  assert.equal((await m.service.revoquerCle({ id: b.id!, acteur: PDG })).ok, false, "déjà révoquée");
  assert.equal((await m.service.clesActives()).length, 1);
  const retour = await m.service.enregistrerCle({ libelle: "Retour", clePublique: cleB.clePublique, acteur: PDG });
  assert.equal(retour.ok, false);
  assert.match(retour.detail, /révoquée/);
  // Plafond de cinq clés actives.
  for (let i = 0; i < 4; i++) assert.equal((await m.service.enregistrerCle({ libelle: `Clé ${i}`, clePublique: (() => nouvelleCle().clePublique)(), acteur: PDG })).ok, true);
  assert.equal((await m.service.enregistrerCle({ libelle: "De trop", clePublique: nouvelleCle().clePublique, acteur: PDG })).ok, false);
  await m.pool.query("DELETE FROM shop_link_cles WHERE libelle LIKE 'Clé %'");
});

// ── Passerelle sortante ───────────────────────────────────────────────────────────────────────────────────────────────
test("sortant : câble coupé → aucune lecture du Coffre, aucun appel réseau, réponse CABLE_COUPE journalisée", async () => {
  let lectures = 0;
  let appels = 0;
  const r = await m.sortant.viaCable(
    {
      ownerId: PDG,
      outil: "boutique.capacites",
      motif: "essai",
      obtenirAcces: async () => {
        lectures += 1;
        return { ok: true, origine: ORIGINE, jeton: JETON };
      },
      transport: (async () => {
        appels += 1;
        return new Response("{}");
      }) as unknown as typeof fetch,
    },
    (acces, f) => m.boutique.capacitesBoutique(acces, f),
  );
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.code, "CABLE_COUPE");
    assert.match(r.detail, /coupé/);
  }
  assert.equal(lectures, 0);
  assert.equal(appels, 0);
  const [dernier] = await m.service.lireJournal({ canal: "catalogue", limite: 1 });
  assert.equal(dernier.evenement, "refus_cable");
  assert.equal(dernier.resultat, "refuse");
});

test("sortant : câble branché → l'appel passe par le client existant, le jeton part dans l'en-tête, le journal ne garde ni jeton ni contenu", async () => {
  assert.equal((await pdg().regler({ cible: "catalogue", etat: "connecte", motif: "essai sortant" })).ok, true);
  const vus: { url: string; auth: string | null; redirect: string | undefined }[] = [];
  const transport = (async (url: URL, init?: RequestInit) => {
    vus.push({ url: String(url), auth: new Headers(init?.headers).get("authorization"), redirect: init?.redirect });
    return new Response(JSON.stringify({ rows: [{ id: "1", titre: "Poussette secrète-à-ne-pas-journaliser" }] }), { status: 200, headers: { "content-type": "application/json" } });
  }) as unknown as typeof fetch;
  const options = { ownerId: PDG, outil: "boutique.listerProduits", motif: "essai", transport };
  const r = await m.sortant.viaCable(options, (acces, f) => m.boutique.listerProduitsBoutique(acces, { limite: 5 }, f));
  assert.equal(r.ok, true);
  assert.equal(vus.length, 1);
  assert.equal(vus[0].url, `${ORIGINE}/api/service/products?limit=5&offset=0`);
  assert.equal(vus[0].auth, `Bearer ${JETON}`);
  assert.equal(vus[0].redirect, "error");
  const [dernier] = await m.service.lireJournal({ canal: "catalogue", limite: 1 });
  assert.equal(dernier.evenement, "appel_sortant");
  assert.equal(dernier.resultat, "ok");
  assert.equal(dernier.statutHttp, 200);
  assert.ok(dernier.dureeMs !== null && dernier.dureeMs >= 0);
  const toutLeJournal = JSON.stringify(await m.service.lireJournal({ limite: 500 }));
  assert.ok(!toutLeJournal.includes(JETON), "le jeton n'est jamais journalisé");
  assert.ok(!toutLeJournal.includes("Poussette"), "le contenu n'est jamais journalisé");
});

test("sortant : une route hors contrat est refusée même demandée par le code appelant ; une erreur de la Boutique est journalisée avec son statut", async () => {
  const transport = (async () => new Response("{}", { status: 200 })) as unknown as typeof fetch;
  const horsContrat = await m.sortant.viaCable({ ownerId: PDG, outil: "essai", motif: "essai", transport, obtenirAcces: async () => ({ ok: true, origine: ORIGINE, jeton: JETON }) }, async (acces, f) => {
    await f(`${acces.origine}/api/service/publication/publish`, { method: "POST", body: "{}" });
    return { ok: true };
  });
  assert.equal(horsContrat.ok, false);
  if (!horsContrat.ok) {
    assert.equal(horsContrat.code, "CONTRAT_REFUSE");
    assert.match(horsContrat.detail, /Route hors contrat/);
  }
  const refus401 = (async () => new Response(JSON.stringify({ error: "invalid" }), { status: 401, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
  const r = await m.sortant.viaCable({ ownerId: PDG, outil: "essai", motif: "essai", transport: refus401, obtenirAcces: async () => ({ ok: true, origine: ORIGINE, jeton: JETON }) }, (acces, f) => m.boutique.capacitesBoutique(acces, f));
  assert.equal(r.ok, false);
  const [dernier] = await m.service.lireJournal({ canal: "catalogue", limite: 1 });
  assert.equal(dernier.resultat, "erreur");
  assert.equal(dernier.statutHttp, 401);
  // Coffre en défaut : l'appel n'a pas lieu, la raison est dite.
  const sansAcces = await m.sortant.viaCable({ ownerId: PDG, outil: "essai", motif: "essai", obtenirAcces: async () => ({ ok: false, detail: "Aucun secret." }) }, (acces, f) => m.boutique.capacitesBoutique(acces, f));
  assert.equal(sansAcces.ok, false);
  if (!sansAcces.ok) assert.equal(sansAcces.code, "ACCES_BOUTIQUE");
  // Et l'accès du Coffre réel (par défaut) fonctionne avec les secrets déposés plus haut.
  const reel = await m.sortant.viaCable({ ownerId: PDG, outil: "boutique.capacites", motif: "essai", transport: (async () => new Response(JSON.stringify({ scopes: [] }), { status: 200, headers: { "content-type": "application/json" } })) as unknown as typeof fetch }, (acces, f) => m.boutique.capacitesBoutique(acces, f));
  assert.equal(reel.ok, true);
});

// ── Passerelle entrante (HTTP) ────────────────────────────────────────────────────────────────────────────────────────
const etatValide = () => ({ version: 1, observeLe: "2026-10-08T10:00:00Z", moteurs: [{ id: "supplier.connector", etat: "ok", completude: 100 }, { id: "carrier", etat: "inconnu", completude: null }], alertes: 2, compteurs: { produits: 120, commandes: 3 } });

test("entrant : message non signé, mal signé ou signé par une clé inconnue → 401, même câble branché ; rien n'est stocké", async () => {
  assert.equal((await pdg().regler({ cible: "etat", etat: "connecte", motif: "essai entrant" })).ok, true);
  const sansSignature = await fetch(`${base}/api/shop-link/v1/etat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(etatValide()) });
  assert.equal(sansSignature.status, 401);
  assert.equal((await appeler("POST", "/api/shop-link/v1/etat", etatValide(), { signature: "A".repeat(86) })).statut, 401);
  assert.equal((await appeler("POST", "/api/shop-link/v1/etat", etatValide(), { cle: cleB })).statut, 401, "clé révoquée");
  assert.equal((await appeler("POST", "/api/shop-link/v1/etat", etatValide(), { temps: Date.now() - 10 * 60_000 })).statut, 401, "message trop vieux");
  const { rows } = await m.pool.query("SELECT count(*)::int AS n FROM shop_link_etat_boutique");
  assert.equal(rows[0].n, 0);
});

test("entrant : état — accepté, rejeu refusé, schéma strict, taille bornée, canal coupé → 503 sans rien stocker", async () => {
  const nonce = randomBytes(16).toString("hex");
  const premier = await appeler("POST", "/api/shop-link/v1/etat", etatValide(), { nonce });
  assert.equal(premier.statut, 200, JSON.stringify(premier.json));
  assert.equal(premier.json.status, "RECU");
  assert.equal((await appeler("POST", "/api/shop-link/v1/etat", etatValide(), { nonce })).statut, 409, "même nonce = rejeu");
  const supplement = await appeler("POST", "/api/shop-link/v1/etat", { ...etatValide(), memoireIA: "interdit" });
  assert.equal(supplement.statut, 400, "clé inconnue refusée (schéma strict)");
  assert.equal((await appeler("POST", "/api/shop-link/v1/etat", { ...etatValide(), moteurs: [{ id: "x", etat: "ok", completude: 150 }] })).statut, 400);
  assert.equal((await appeler("POST", "/api/shop-link/v1/etat", { ...etatValide(), padding: "x".repeat(40_000) })).statut, 413);
  const { rows } = await m.pool.query("SELECT count(*)::int AS n FROM shop_link_etat_boutique");
  assert.equal(rows[0].n, 1);

  assert.equal((await pdg().regler({ cible: "etat", etat: "coupe", motif: "coupure d'essai" })).ok, true);
  const coupe = await appeler("POST", "/api/shop-link/v1/etat", etatValide());
  assert.equal(coupe.statut, 503);
  assert.equal(coupe.json.status, "CABLE_COUPE");
  assert.equal(coupe.json.raison, "CANAL_COUPE");
  assert.equal((await m.pool.query("SELECT count(*)::int AS n FROM shop_link_etat_boutique")).rows[0].n, 1, "rien de plus n'a été stocké");
  assert.equal((await pdg().regler({ cible: "etat", etat: "connecte", motif: "reprise" })).ok, true);
});

test("entrant : plafond de messages par minute et par canal → 429", async () => {
  await m.pool.query("DELETE FROM shop_link_rejeu");
  const limite = m.contrats.CANAUX.etat.parMinute;
  const codes: number[] = [];
  for (let i = 0; i < limite + 2; i++) codes.push((await appeler("POST", "/api/shop-link/v1/etat", etatValide())).statut);
  assert.equal(codes.filter((c) => c === 200).length, limite);
  assert.deepEqual(codes.slice(limite), [429, 429]);
  await m.pool.query("DELETE FROM shop_link_rejeu");
});

test("entrant : le commutateur général coupe TOUT, y compris la lecture de l'état du câble ; rebranché, la lecture ne montre que des booléens", async () => {
  const p = pdg();
  assert.equal((await p.regler({ cible: "maitre", etat: "coupe", motif: "coupure générale d'essai" })).ok, true);
  const coupe = await appeler("GET", "/api/shop-link/v1/cable");
  assert.equal(coupe.statut, 503);
  assert.equal(coupe.json.raison, "MAITRE_COUPE");
  assert.equal((await appeler("POST", "/api/shop-link/v1/etat", etatValide())).json.raison, "MAITRE_COUPE");
  assert.equal((await p.regler({ cible: "maitre", etat: "connecte", motif: "reprise générale" })).ok, true);
  const lecture = await appeler("GET", "/api/shop-link/v1/cable");
  assert.equal(lecture.statut, 200);
  const canaux = lecture.json.canaux as Record<string, { branche: boolean }>;
  assert.equal(canaux.etat.branche, true);
  assert.equal(canaux.paiement.branche, false);
  assert.equal(canaux.google.branche, false);
  assert.equal(canaux.catalogue.branche, true);
  assert.ok(!JSON.stringify(lecture.json).includes(cleA.clePublique));
});

test("entrant : documents — référence unique mise à jour, aucun contenu de document, canal séparé", async () => {
  assert.equal((await appeler("POST", "/api/shop-link/v1/documents", { version: 1, documents: [{ reference: "FAC-1", statut: "EMIS", totalMinor: 12990, devise: "EUR", referenceCommande: "CMD-9", emisLe: "2026-10-08T09:00:00Z" }] })).statut, 503, "canal documents encore coupé");
  assert.equal((await pdg().regler({ cible: "documents", etat: "connecte", motif: "essai documents" })).ok, true);
  const un = await appeler("POST", "/api/shop-link/v1/documents", { version: 1, documents: [{ reference: "FAC-1", statut: "EMIS", totalMinor: 12990, devise: "EUR", referenceCommande: "CMD-9", emisLe: "2026-10-08T09:00:00Z" }] });
  assert.equal(un.statut, 200, JSON.stringify(un.json));
  const deux = await appeler("POST", "/api/shop-link/v1/documents", { version: 1, documents: [{ reference: "FAC-1", statut: "PAYE", totalMinor: 12990, devise: "EUR", referenceCommande: "CMD-9", emisLe: null }] });
  assert.equal(deux.statut, 200);
  const { rows } = await m.pool.query("SELECT reference, statut, total_minor::int AS total FROM shop_link_documents");
  assert.deepEqual(rows, [{ reference: "FAC-1", statut: "PAYE", total: 12990 }]);
  const contenu = await appeler("POST", "/api/shop-link/v1/documents", { version: 1, documents: [{ reference: "FAC-2", statut: "EMIS", totalMinor: 1, devise: "EUR", referenceCommande: null, emisLe: null, contenuPdf: "JVBERi0=" }] });
  assert.equal(contenu.statut, 400, "le contenu d'un document ne passe pas");
  assert.equal((await appeler("POST", "/api/shop-link/v1/documents", { version: 1, documents: [{ reference: "FAC 3 avec espaces", statut: "EMIS", totalMinor: 1, devise: "eur", referenceCommande: null, emisLe: null }] })).statut, 400);
});

// ── Boîte d'échange des IA ────────────────────────────────────────────────────────────────────────────────────────────
test("IA — entrant : dépôt en attente, doublon ignoré, secret ou donnée personnelle refusés en bloc ; l'approbation PROPOSE seulement une connaissance", async () => {
  assert.equal((await appeler("POST", "/api/shop-link/v1/ia/boite", { version: 1, elements: [{ type: "procedure", titre: "Rien", contenu: "Contenu valable mais le canal est coupé.", source: "boutique" }] })).statut, 503);
  assert.equal((await pdg().regler({ cible: "ia-memoire", etat: "connecte", motif: "essai mémoire" })).ok, true);
  const elements = [
    { type: "procedure", titre: "Contrôler la marque d'une photo", contenu: "Toujours vérifier l'absence de marque visible avant de choisir une photo principale.", source: "boutique:memoire#12" },
    { type: "erreur_solution", titre: "Stock inconnu", contenu: "Un stock sans lien CSV reste inconnu : ne jamais le supposer.", source: "boutique:memoire#14" },
  ];
  const depot = await appeler("POST", "/api/shop-link/v1/ia/boite", { version: 1, elements });
  assert.equal(depot.statut, 200, JSON.stringify(depot.json));
  assert.equal(depot.json.status, "EN_ATTENTE_VALIDATION");
  assert.equal(depot.json.deposes, 2);
  assert.equal((await appeler("POST", "/api/shop-link/v1/ia/boite", { version: 1, elements })).json.doublons, 2);

  const avecEmail = await appeler("POST", "/api/shop-link/v1/ia/boite", { version: 1, elements: [elements[0], { type: "connaissance", titre: "Contact client", contenu: "Écrire à marie.durand@exemple.fr pour la livraison.", source: "" }] });
  assert.equal(avecEmail.statut, 422);
  const avecCle = await appeler("POST", "/api/shop-link/v1/ia/boite", { version: 1, elements: [{ type: "connaissance", titre: "Clé oubliée", contenu: `La clé est sk-${"q".repeat(30)} et elle marche.`, source: "" }] });
  assert.equal(avecCle.statut, 422);
  assert.equal((await m.pool.query("SELECT count(*)::int AS n FROM shop_link_ia_boite")).rows[0].n, 2, "refus en bloc : rien déposé à moitié");

  const boite = await pdg().boite({ sens: "entrant" });
  assert.equal(boite.length, 2);
  assert.ok(boite.every((e) => e.etat === "en_attente"));
  assert.equal((await m.pool.query("SELECT count(*)::int AS n FROM in_connaissance")).rows[0].n, 0, "rien n'entre dans la connaissance sans décision");

  const approuve = await pdg().decider({ id: boite.find((e) => e.type === "procedure")!.id, approuver: true });
  assert.equal(approuve.ok, true, approuve.detail);
  const { rows } = await m.pool.query("SELECT categorie, statut, visibilite, auteur, source FROM in_connaissance");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].categorie, "procedures");
  assert.equal(rows[0].statut, "propose", "jamais confirmée automatiquement");
  assert.match(rows[0].source, /^boutique:echange#/);
  assert.equal((await pdg().decider({ id: boite.find((e) => e.type === "procedure")!.id, approuver: true })).detail, "Cet élément a déjà été traité.");

  const refus = await pdg().decider({ id: boite.find((e) => e.type === "erreur_solution")!.id, approuver: false });
  assert.equal(refus.ok, true);
  assert.equal((await m.pool.query("SELECT count(*)::int AS n FROM in_connaissance")).rows[0].n, 1);
  const apres = await pdg().boite({ sens: "entrant" });
  assert.deepEqual(apres.map((e) => e.etat).sort(), ["integre", "rejete"], "rien n'est effacé");
});

test("IA — sortant : création validée, approbation, récupération par la Boutique, accusé de réception, rien d'autre ne sort", async () => {
  const p = pdg();
  const trop = await p.creerSortant({ type: "procedure", titre: "Titre ok", contenu: "Écrire à jean@exemple.fr", source: "" });
  assert.equal(trop.ok, false);
  assert.match(trop.detail, /donnée personnelle/);
  const cree = await p.creerSortant({ type: "procedure", titre: "Choisir la photo principale", contenu: "Une photo fournisseur avec marque ne devient jamais la photo principale.", source: "plateforme" });
  assert.equal(cree.ok, true, cree.detail);
  assert.equal((await p.creerSortant({ type: "procedure", titre: "Choisir la photo principale", contenu: "Une photo fournisseur avec marque ne devient jamais la photo principale.", source: "plateforme" })).ok, false, "doublon");

  assert.deepEqual((await appeler("GET", "/api/shop-link/v1/ia/sortants")).json.elements, [], "rien n'est exposé avant l'approbation");
  assert.equal((await p.decider({ id: cree.id!, approuver: true })).ok, true);
  const liste = (await appeler("GET", "/api/shop-link/v1/ia/sortants")).json.elements as { id: number; titre: string }[];
  assert.deepEqual(liste.map((e) => e.titre), ["Choisir la photo principale"]);
  const accuse = await appeler("POST", "/api/shop-link/v1/ia/accuse", { version: 1, ids: [liste[0].id, 99999] });
  assert.equal(accuse.json.accuses, 1);
  assert.deepEqual((await appeler("GET", "/api/shop-link/v1/ia/sortants")).json.elements, []);
  assert.equal((await p.boite({ sens: "sortant" }))[0].etat, "transmis");

  // Un canal coupé n'expose rien, même ce qui est approuvé.
  const second = await p.creerSortant({ type: "connaissance", titre: "Second élément", contenu: "Contenu approuvé mais canal coupé ensuite.", source: "" });
  await p.decider({ id: second.id!, approuver: true });
  assert.equal((await p.regler({ cible: "ia-memoire", etat: "coupe", motif: "coupure d'essai" })).ok, true);
  assert.equal((await appeler("GET", "/api/shop-link/v1/ia/sortants")).statut, 503);
  assert.equal((await appeler("POST", "/api/shop-link/v1/ia/accuse", { version: 1, ids: [second.id] })).statut, 503);
  assert.equal((await p.boite({ sens: "sortant" })).find((e) => e.id === second.id)!.etat, "approuve", "non récupéré");
});

test("IA — copie d'une connaissance : seule une connaissance confirmée et non réservée au PDG peut partir", async () => {
  const ins = async (statut: string, visibilite: string, categorie = "procedures") =>
    (await m.pool.query("INSERT INTO in_connaissance(categorie,titre,contenu,statut,visibilite) VALUES($1,$2,$3,$4,$5) RETURNING id", [categorie, `Connaissance ${statut}/${visibilite}`, "Contenu de connaissance suffisamment long.", statut, visibilite])).rows[0].id as number;
  const p = pdg();
  assert.match((await p.creerSortantDepuisConnaissance({ connaissanceId: await ins("propose", "interne") })).detail, /confirmée/);
  assert.match((await p.creerSortantDepuisConnaissance({ connaissanceId: await ins("confirme", "pdg_uniquement") })).detail, /réservée au PDG/);
  assert.equal((await p.creerSortantDepuisConnaissance({ connaissanceId: 999999 })).detail, "Connaissance introuvable.");
  const ok = await p.creerSortantDepuisConnaissance({ connaissanceId: await ins("confirme", "interne", "support") });
  assert.equal(ok.ok, true, ok.detail);
  const ligne = (await p.boite({ sens: "sortant" })).find((e) => e.id === ok.id)!;
  assert.equal(ligne.type, "erreur_solution");
  assert.equal(ligne.etat, "en_attente");
});

// ── Routeur, flux, journal ────────────────────────────────────────────────────────────────────────────────────────────
test("routeur : réservé au PDG (super_admin) ; un administrateur ordinaire est refusé partout", async () => {
  const admin = m.index.shopLinkRouter.createCaller({ req: {} as never, res: {} as never, user: { uid: 2, role: "admin", email: "admin@exemple.test" } });
  const anonyme = m.index.shopLinkRouter.createCaller({ req: {} as never, res: {} as never, user: null });
  for (const appelant of [admin, anonyme]) {
    await assert.rejects(appelant.etat(), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(appelant.regler({ cible: "etat", etat: "connecte", motif: "tentative" }), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(appelant.toutCouper({ motif: "tentative" }), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(appelant.cles(), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(appelant.journal(), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(appelant.boite(), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(appelant.decider({ id: 1, approuver: true }), /Accès PDG requis|FORBIDDEN/);
    await assert.rejects(appelant.tester(), /Accès PDG requis|FORBIDDEN/);
  }
  assert.equal((await admin.meta()).name, "shop_link", "la fiche du moteur reste publique comme celle des autres moteurs");
});

test("routeur : l'état complet décrit chaque canal, ses limites et ce qui manque ; le test du catalogue passe par le câble", async () => {
  const etat = await pdg().etat();
  assert.equal(etat.canaux.length, 6);
  const parId = Object.fromEntries(etat.canaux.map((c) => [c.id, c]));
  assert.equal(parId.paiement.activation, "attente_externe");
  assert.equal(parId.paiement.passe, false);
  assert.equal(parId.paiement.raisonBlocage, "ATTENTE_EXTERNE");
  assert.equal(parId.etat.passe, true);
  assert.ok(parId.etat.ok24h >= 1 && parId.etat.refus24h >= 1);
  assert.equal(parId["ia-memoire"].passe, false);
  assert.ok(parId["ia-memoire"].planCoupure.length > 10 && parId["ia-memoire"].donneesInterdites.length > 0);
  assert.ok(etat.etatBoutique && (etat.etatBoutique.contenu as { alertes: number }).alertes === 2);

  // Test du catalogue : coupé → message de coupure ; branché → sans réseau réel il échoue proprement (jamais d'exception).
  assert.equal((await pdg().regler({ cible: "catalogue", etat: "coupe", motif: "avant l'essai" })).ok, true);
  const coupe = await pdg().tester();
  assert.equal(coupe.ok, false);
  assert.match(coupe.detail, /coupé/);
});

test("flux du centre de contrôle : santé, charge et erreurs lisibles ; un câble coupé n'est pas une panne", async () => {
  await pdg().toutCouper({ motif: "fin des essais" });
  const feed = await m.index.controlCenterFeed();
  assert.equal(feed.engine, "shop_link");
  assert.equal(feed.health, "ok");
  assert.equal(feed.status, "active");
  assert.ok(feed.load.events24h >= 5);
  assert.ok(feed.errors.last24h >= 0);
  const tableau = await pdg().dashboard();
  assert.equal(tableau.businessMetrics.canaux_branches, 0);
  assert.equal(tableau.businessMetrics.canaux_declares, 6);
  assert.ok(Array.isArray(tableau.recentEvents) && Array.isArray(tableau.recentErrors));
  const sante = await m.index.healthStatus();
  assert.equal(sante.status, "ok");
  assert.equal(sante.metrics.canauxBranches, 0);
});

test("entrant : un inconnu qui inonde la passerelle reçoit des 401 mais ne peut pas remplir le journal (30 lignes par minute au plus)", async () => {
  const avant = (await m.pool.query("SELECT count(*)::int AS n FROM shop_link_journal WHERE evenement = 'refus_signature'")).rows[0].n as number;
  const codes = new Set<number>();
  for (let i = 0; i < 45; i++) {
    const r = await fetch(`${base}/api/shop-link/v1/etat`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(etatValide()) });
    codes.add(r.status);
  }
  assert.deepEqual([...codes], [401]);
  const apres = (await m.pool.query("SELECT count(*)::int AS n FROM shop_link_journal WHERE evenement = 'refus_signature'")).rows[0].n as number;
  assert.ok(apres - avant <= 30 && apres - avant >= 1, `lignes ajoutées : ${apres - avant}`);
});

test("journal : jamais de contenu, de jeton, de clé ni de donnée personnelle ; les refus sont tous tracés", async () => {
  const lignes = await m.service.lireJournal({ limite: 500 });
  const texte = JSON.stringify(lignes);
  for (const interdit of [JETON, "marie.durand", `sk-${"q".repeat(30)}`, "jean@exemple.fr", "Poussette", cleA.clePublique, "Contrôler la marque", "JVBERi0="]) assert.ok(!texte.includes(interdit), `journal sans « ${interdit.slice(0, 20)} »`);
  const evenements = new Set(lignes.map((l) => l.evenement));
  for (const attendu of ["cable", "refus_cable", "appel_sortant", "appel_entrant", "refus_signature", "refus_rejeu", "refus_quota", "refus_schema", "refus_contrat", "refus_taille", "cle_enregistree", "cle_revoquee", "approuve", "rejete"]) {
    assert.ok(evenements.has(attendu), `événement journalisé : ${attendu}`);
  }
  assert.ok(lignes.every((l) => l.detail.length <= 300 && ["ok", "refuse", "erreur"].includes(l.resultat)));
});
