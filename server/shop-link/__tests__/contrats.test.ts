/**
 * Moteur intermédiaire Boutique — contrats, filtre de contenu, signature, transport gardé (aucune base, aucun réseau).
 * Les clés et jetons sont des fixtures manifestement fictives.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import * as boutique from "../../intelligences/boutique.js";
import { CANAUX, CANAUX_IDS, ROUTES_CATALOGUE, estCanal, inspecter, routeAutorisee } from "../contrats.js";
import { FENETRE_HORLOGE_MS, decider, hashCorps, lireClePublique, messageSigne, verifierSignature, type LigneCable } from "../service.js";
import { fetchGarde } from "../sortant.js";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const MEDIA = "7c9e6679-7425-40de-944b-e07fc1f90ae7";
const JETON = `shopsvc_${"A".repeat(43)}`;
const ORIGINE = "https://boutique.exemple.com";

// ── Contrats ─────────────────────────────────────────────────────────────────────────────────────────────────────────
test("contrats : chaque canal est décrit, les canaux externes ne se branchent pas, les entrants ont une limite", () => {
  assert.deepEqual([...CANAUX_IDS].sort(), ["catalogue", "documents", "etat", "google", "ia-memoire", "paiement"]);
  for (const id of CANAUX_IDS) {
    const c = CANAUX[id];
    assert.equal(c.id, id);
    assert.ok(c.donneesAutorisees.length > 0 && c.donneesInterdites.length > 0 && c.planCoupure.length > 10, id);
    if (c.sens !== "sortant" && c.activation === "disponible") assert.ok(c.tailleMax > 0 && c.parMinute > 0, `${id} : limites`);
  }
  assert.equal(CANAUX.paiement.activation, "attente_externe");
  assert.equal(CANAUX.google.activation, "attente_externe");
  assert.ok(CANAUX.paiement.raisonAttente && CANAUX.google.raisonAttente);
  assert.equal(estCanal("catalogue"), true);
  assert.equal(estCanal("maitre"), false);
  assert.equal(estCanal("../etc"), false);
});

test("câble : décision pure — défaut coupé, général prioritaire, attente externe jamais branchée", () => {
  const coupe: LigneCable = { etat: "coupe", motif: "", modifieLe: null, modifiePar: null };
  const branche: LigneCable = { etat: "connecte", motif: "essai", modifieLe: new Date(), modifiePar: 1 };
  const tous = (l: LigneCable) => Object.fromEntries(CANAUX_IDS.map((id) => [id, l])) as Record<(typeof CANAUX_IDS)[number], LigneCable>;
  assert.deepEqual(decider({ maitre: branche, canaux: tous(coupe) }, "etat"), { passe: false, raison: "CANAL_COUPE" });
  assert.deepEqual(decider({ maitre: branche, canaux: tous(branche) }, "etat"), { passe: true });
  assert.deepEqual(decider({ maitre: coupe, canaux: tous(branche) }, "etat"), { passe: false, raison: "MAITRE_COUPE" });
  // Même si la base dit « branché », un canal en attente externe ne passe pas.
  assert.deepEqual(decider({ maitre: branche, canaux: tous(branche) }, "paiement"), { passe: false, raison: "ATTENTE_EXTERNE" });
  assert.deepEqual(decider({ maitre: branche, canaux: tous(branche) }, "google"), { passe: false, raison: "ATTENTE_EXTERNE" });
});

// ── Liste blanche des routes ──────────────────────────────────────────────────────────────────────────────────────────
test("routes : celles que le client existant appelle sont autorisées, celles de prix et de publication ne le sont jamais", () => {
  const permises: [string, string][] = [
    ["GET", "/capabilities"], ["GET", "/products"], ["GET", `/products/${ID}`], ["GET", `/products/${ID}/full`], ["GET", `/products/${ID}/preview`],
    ["POST", `/products/${ID}/photos`], ["PUT", `/products/${ID}/draft`], ["POST", `/products/${ID}/media/${MEDIA}/select`],
    ["POST", `/products/${ID}/stock-sync`], ["PUT", `/products/${ID}/parcels`], ["POST", `/products/${ID}/shipping-grid`],
  ];
  for (const [m, c] of permises) assert.equal(routeAutorisee(m, c), true, `${m} ${c}`);
  const refusees: [string, string][] = [
    ["POST", "/publication/publish"], ["GET", "/selling-prices"], ["POST", "/selling-prices/validate"], ["POST", "/selling-prices/promotions"],
    ["GET", "/products/pas-un-uuid"], ["DELETE", `/products/${ID}`], ["GET", `/products/${ID}/../../admin`], ["POST", "/capabilities"],
    ["GET", `/products/${ID}/full/extra`], ["PUT", `/products/${ID}/price`], ["POST", "/service-tokens"], ["GET", "/vault"],
  ];
  for (const [m, c] of refusees) assert.equal(routeAutorisee(m, c), false, `${m} ${c}`);
  assert.ok(ROUTES_CATALOGUE.length >= 8);
});

test("routes : CHAQUE fonction exportée du client existant passe par le transport gardé sans être refusée", async () => {
  const acces = { origine: ORIGINE, jeton: JETON };
  const vus: string[] = [];
  const transport = (async (url: URL | string, init?: RequestInit) => {
    vus.push(`${init?.method ?? "GET"} ${new URL(String(url)).pathname}`);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;
  const observation: { refus?: { code: string } } = {};
  const f = (): typeof fetch => fetchGarde(acces, observation as never, transport);
  const appels: [string, () => Promise<unknown>][] = [
    ["capacites", () => boutique.capacitesBoutique(acces, f())],
    ["liste", () => boutique.listerProduitsBoutique(acces, { etat: "REVIEW_REQUIRED", limite: 5 }, f())],
    ["lire", () => boutique.lireProduitBoutique(acces, ID, f())],
    ["fiche complete", () => boutique.lireFicheCompleteBoutique(acces, ID, f())],
    ["apercu", () => boutique.lireApercuBoutique(acces, ID, f())],
    ["photos", () => boutique.lancerPhotosBoutique(acces, ID, f())],
    ["proposer", () => boutique.proposerFicheBoutique(acces, ID, { revisionAttendue: 1, titre: "Titre", descriptionBoutique: "Description", champs: {}, colis: [] }, f())],
    ["photo principale", () => boutique.choisirPhotoPrincipaleBoutique(acces, ID, MEDIA, f())],
    ["recontrole", () => boutique.recontrolerMarquePhotoBoutique(acces, ID, MEDIA, f())],
    ["media photo", () => boutique.ajouterMediaParLienBoutique(acces, ID, { url: "https://exemple.com/a.jpg", type: "photo" }, f())],
    ["media video", () => boutique.ajouterMediaParLienBoutique(acces, ID, { url: "https://exemple.com/a.mp4", type: "video", reelle: true, droits: "autorisation du fournisseur" }, f())],
    ["retirer media", () => boutique.retirerMediaGalerieBoutique(acces, ID, MEDIA, false, f())],
    ["remettre media", () => boutique.retirerMediaGalerieBoutique(acces, ID, MEDIA, true, f())],
    ["colis", () => boutique.definirColisBoutique(acces, ID, { nombre: 2, preuve: "fiche fournisseur" }, f())],
    ["retirer photos", () => boutique.retirerPhotosProduitBoutique(acces, ID, f())],
    ["remplir fiche", () => boutique.remplirFicheDepuisFournisseurBoutique(acces, ID, f())],
    ["colis fournisseur", () => boutique.appliquerColisFournisseurBoutique(acces, ID, f())],
    ["grille", () => boutique.importerGrilleLivraisonBoutique(acces, ID, { grille: "France ; 9.90", taxe: "EXCLUDED", preuve: "message du fournisseur", valideJusqua: "2027-01-01T00:00:00Z", apercu: true }, f())],
    ["stock", () => boutique.synchroniserStockBoutique(acces, ID, f())],
  ];
  for (const [nom, appel] of appels) {
    const avant = vus.length;
    await appel();
    assert.equal(vus.length, avant + 1, `${nom} : la requête a bien atteint le transport (non refusée par le contrat)`);
  }
  assert.equal(observation.refus, undefined, "aucun refus du contrat pour le client existant");
});

// ── Transport gardé ───────────────────────────────────────────────────────────────────────────────────────────────────
test("transport gardé : origine inconnue, route hors contrat et corps secret sont refusés avant tout appel réseau", async () => {
  const acces = { origine: ORIGINE, jeton: JETON };
  let appels = 0;
  const transport = (async () => {
    appels += 1;
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch;
  const corps = (o: unknown) => JSON.stringify(o);
  const cas: [string, string, RequestInit | undefined, string][] = [
    ["autre domaine", "https://pirate.exemple.com/api/service/capabilities", undefined, "ORIGINE_INCONNUE"],
    ["publication", `${ORIGINE}/api/service/publication/publish`, { method: "POST", body: "{}" }, "ROUTE_HORS_CONTRAT"],
    ["prix de vente", `${ORIGINE}/api/service/selling-prices`, undefined, "ROUTE_HORS_CONTRAT"],
    ["hors /api/service", `${ORIGINE}/api/products`, undefined, "ROUTE_HORS_CONTRAT"],
    ["secret dans le corps", `${ORIGINE}/api/service/products/${ID}/draft`, { method: "PUT", body: corps({ title: "ok", password: "x" }) }, "DONNEE_INTERDITE"],
    ["clé de modèle dans une valeur", `${ORIGINE}/api/service/products/${ID}/draft`, { method: "PUT", body: corps({ title: `sk-${"a".repeat(30)}` }) }, "DONNEE_INTERDITE"],
    ["corps non JSON", `${ORIGINE}/api/service/products/${ID}/draft`, { method: "PUT", body: "pas du json" }, "DONNEE_INTERDITE"],
  ];
  for (const [nom, url, init, code] of cas) {
    const observation: { refus?: { code: string } } = {};
    await assert.rejects(fetchGarde(acces, observation as never, transport)(url, init), Error, nom);
    assert.equal(observation.refus?.code, code, nom);
  }
  assert.equal(appels, 0, "aucune requête n'est partie vers le réseau");
});

test("transport gardé : le code du refus est observable et les redirections sont interdites", async () => {
  const acces = { origine: ORIGINE, jeton: JETON };
  const obs: { refus?: { code: string } } = {};
  const garde = fetchGarde(acces, obs as never, (async () => new Response("{}")) as unknown as typeof fetch);
  await assert.rejects(garde(`${ORIGINE}/api/service/publication/publish`, { method: "POST", body: "{}" }));
  assert.equal(obs.refus?.code, "ROUTE_HORS_CONTRAT");
  let init: RequestInit | undefined;
  const garde2 = fetchGarde(acces, {}, (async (_u: unknown, i?: RequestInit) => {
    init = i;
    return new Response("{}");
  }) as unknown as typeof fetch);
  await garde2(`${ORIGINE}/api/service/capabilities`, { method: "GET", redirect: "follow" });
  assert.equal(init?.redirect, "error");
});

// ── Filtre de contenu ─────────────────────────────────────────────────────────────────────────────────────────────────
test("filtre : secrets refusés partout, données personnelles refusées seulement quand le canal l'exige, jamais la valeur dans le verdict", () => {
  assert.equal(inspecter({ titre: "Poussette", description: "Pliable, 5 kg" }).ok, true);
  const cle = inspecter({ a: { b: [{ password: "x" }] } });
  assert.deepEqual(cle, { ok: false, chemin: "$.a.b[0].password", raison: "CLE_SECRETE" });
  const valeur = inspecter({ note: `clé sk-${"z".repeat(24)}` });
  assert.equal(valeur.ok, false);
  assert.equal(valeur.raison, "VALEUR_SECRETE");
  assert.ok(!JSON.stringify(valeur).includes("zzzz"));
  for (const texte of ["écrivez à jean.dupont@exemple.fr", "FR7630006000011234567890189", "appelez le +33 6 12 34 56 78"]) {
    assert.equal(inspecter({ t: texte }).ok, true, `sans option : ${texte}`);
    assert.equal(inspecter({ t: texte }, { personnelles: true }).raison, "DONNEE_PERSONNELLE", texte);
  }
  let profond: unknown = "x";
  for (let i = 0; i < 15; i++) profond = { a: profond };
  assert.equal(inspecter(profond).raison, "TROP_PROFOND");
});

// ── Signature ─────────────────────────────────────────────────────────────────────────────────────────────────────────
function cleDeTest() {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const der = publicKey.export({ type: "spki", format: "der" });
  const lue = lireClePublique(der.toString("base64url"));
  assert.equal(lue.ok, true);
  return { privateKey, clePublique: der.toString("base64url"), empreinte: lue.ok ? lue.empreinte : "" };
}

function signer(cle: ReturnType<typeof cleDeTest>, methode: string, chemin: string, corps: unknown, options: { temps?: number; nonce?: string } = {}) {
  const temps = String(options.temps ?? Date.now());
  const nonce = options.nonce ?? "a".repeat(32);
  const signature = sign(null, messageSigne(methode, chemin, temps, nonce, hashCorps(methode, corps)), cle.privateKey).toString("base64url");
  return { temps, nonce, signature };
}

test("signature : valide, puis refusée si le corps, le chemin, la méthode, l'heure ou la clé changent", () => {
  const cle = cleDeTest();
  const autre = cleDeTest();
  const cles = [{ id: 7, clePublique: cle.clePublique, empreinte: cle.empreinte }];
  const corps = { version: 1, observeLe: "2026-10-08T10:00:00Z" };
  const chemin = "/api/shop-link/v1/etat";
  const e = signer(cle, "POST", chemin, corps);
  const base = { methode: "POST", chemin, corps, entetes: e, cles };
  assert.deepEqual(verifierSignature(base), { ok: true, cleId: 7, nonce: e.nonce });
  assert.equal(verifierSignature({ ...base, corps: { ...corps, version: 2 } }).ok, false, "corps modifié");
  assert.equal(verifierSignature({ ...base, chemin: "/api/shop-link/v1/documents" }).ok, false, "autre chemin");
  assert.equal(verifierSignature({ ...base, methode: "GET" }).ok, false, "autre méthode");
  assert.equal(verifierSignature({ ...base, maintenant: Number(e.temps) + FENETRE_HORLOGE_MS + 1 }).ok, false, "message trop vieux");
  assert.equal(verifierSignature({ ...base, maintenant: Number(e.temps) - FENETRE_HORLOGE_MS - 1 }).ok, false, "message du futur");
  assert.equal(verifierSignature({ ...base, cles: [{ id: 9, clePublique: autre.clePublique, empreinte: autre.empreinte }] }).ok, false, "autre clé");
  assert.equal(verifierSignature({ ...base, cles: [] }).ok, false, "aucune clé active");
  assert.equal(verifierSignature({ ...base, entetes: { ...e, signature: e.signature.slice(0, -2) + "AA" } }).ok, false, "signature altérée");
  assert.equal(verifierSignature({ ...base, entetes: { ...e, nonce: "b".repeat(32) } }).ok, false, "nonce changé");
});

test("signature : formats invalides refusés, sélection par empreinte, GET signé sur un corps vide", () => {
  const cle = cleDeTest();
  const autre = cleDeTest();
  const cles = [
    { id: 1, clePublique: autre.clePublique, empreinte: autre.empreinte },
    { id: 2, clePublique: cle.clePublique, empreinte: cle.empreinte },
  ];
  const chemin = "/api/shop-link/v1/cable";
  const e = signer(cle, "GET", chemin, undefined);
  const base = { methode: "GET", chemin, corps: { ignore: true }, entetes: e, cles };
  assert.deepEqual(verifierSignature(base), { ok: true, cleId: 2, nonce: e.nonce }, "le corps d'un GET n'entre pas dans la signature");
  assert.equal(verifierSignature({ ...base, entetes: { ...e, cle: cle.empreinte.slice(0, 16) } }).ok, true, "empreinte de la bonne clé");
  assert.equal(verifierSignature({ ...base, entetes: { ...e, cle: autre.empreinte.slice(0, 16) } }).ok, false, "empreinte d'une autre clé");
  for (const mauvais of [{ temps: "123" }, { temps: undefined }, { nonce: "xyz" }, { nonce: "A".repeat(32) }, { signature: "court" }, { signature: 42 }]) {
    assert.equal(verifierSignature({ ...base, entetes: { ...e, ...mauvais } }).ok, false, JSON.stringify(mauvais));
  }
});

test("clé publique : seule une clé Ed25519 lisible est acceptée", () => {
  assert.equal(lireClePublique("pas une clé").ok, false);
  assert.equal(lireClePublique("A".repeat(60)).ok, false);
  const rsa = generateKeyPairSync("rsa", { modulusLength: 2048 }).publicKey.export({ type: "spki", format: "der" }).toString("base64url");
  const verdict = lireClePublique(rsa.slice(0, 200));
  assert.equal(verdict.ok, false);
  const bonne = cleDeTest();
  const lue = lireClePublique(bonne.clePublique);
  assert.ok(lue.ok && /^[a-f0-9]{64}$/.test(lue.empreinte));
});
