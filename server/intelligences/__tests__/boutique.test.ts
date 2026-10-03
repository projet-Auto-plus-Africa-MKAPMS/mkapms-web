/**
 * Connexion de l'IA principale à la boutique (boutique.ts, familles/boutique.ts, connaissances-boutique.ts).
 *
 * Sans base : adresse validée (https public seulement), appels aux chemins FIXES avec le jeton en en-tête et nulle part
 * ailleurs, aucune redirection suivie, erreurs de la boutique rendues en français clair, clés de prix/adresse retirées,
 * outils enregistrés avec les bons niveaux de risque et sans outil pour approuver, publier ou toucher un prix.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  capacitesBoutique,
  lancerPhotosBoutique,
  listerProduitsBoutique,
  lireFicheCompleteBoutique,
  lireProduitBoutique,
  nettoyer,
  nettoyerValeurSecret,
  origineBoutique,
  proposerFicheBoutique,
} from "../boutique.js";
import { OUTILS } from "../outils/registre.js";
import { IMPLEMENTATIONS } from "../outils/implementations.js";
import { OUTILS_BOUTIQUE } from "../outils/familles/boutique.js";
import { CONNAISSANCES_BOUTIQUE } from "../connaissances-boutique.js";

const JETON = `shopsvc_${"A".repeat(43)}`;
const ACCES = { origine: "https://boutique.exemple.com", jeton: JETON };
const ID = "6f1c2b0e-8c3a-4f4e-9d54-0a1b2c3d4e5f";

interface Appel {
  url: string;
  init: RequestInit;
}
function faux(reponses: { status?: number; json?: unknown; texte?: string }[]) {
  const appels: Appel[] = [];
  const f = (async (url: string | URL | Request, init?: RequestInit) => {
    appels.push({ url: String(url), init: init ?? {} });
    const r = reponses.shift() ?? { status: 200, json: {} };
    return new Response(r.texte ?? JSON.stringify(r.json ?? {}), { status: r.status ?? 200 });
  }) as typeof fetch;
  return { f, appels };
}

test("adresse : https public seulement, sans identifiants, port, chemin, IP ni nom interne", () => {
  assert.deepEqual(origineBoutique("https://boutique.exemple.com"), { ok: true, origine: "https://boutique.exemple.com" });
  assert.deepEqual(origineBoutique("  https://boutique.exemple.com/  "), { ok: true, origine: "https://boutique.exemple.com" });
  for (const mauvaise of [
    "http://boutique.exemple.com",
    "https://user:pass@boutique.exemple.com",
    "https://boutique.exemple.com:8443",
    "https://boutique.exemple.com/api",
    "https://boutique.exemple.com/?a=1",
    "https://127.0.0.1",
    "https://10.0.0.5",
    "https://[::1]",
    "https://localhost",
    "https://shop.internal",
    "https://shop.local",
    "https://boutique",
    "pas une adresse",
    "",
  ]) {
    assert.equal(origineBoutique(mauvaise).ok, false, mauvaise);
  }
});

test("appels : chemins fixes, jeton en en-tête seulement, redirections refusées, aucun jeton dans l'URL ni le corps", async () => {
  const { f, appels } = faux([{ json: { scopes: [] } }, { json: { rows: [] } }, { json: { id: ID } }, { json: { ok: 1 } }, { json: { saved: true, revision: 3 } }]);
  await capacitesBoutique(ACCES, f);
  await listerProduitsBoutique(ACCES, { etat: "REVIEW_REQUIRED", limite: 10, decalage: 20 }, f);
  await lireProduitBoutique(ACCES, ID, f);
  await lancerPhotosBoutique(ACCES, ID, f);
  const fiche = {
    revisionAttendue: 2,
    titre: "Voiture électrique",
    descriptionBoutique: "Description originale.",
    champs: { Seats: { statut: "FIELD_AVAILABLE", valeur: "1", source: "fiche fournisseur" } },
    colis: [{ longueurMm: 800, largeurMm: 400, hauteurMm: 300, poidsGrammes: 9000, source: "fiche fournisseur" }],
  };
  const r = await proposerFicheBoutique(ACCES, ID, fiche, f);
  assert.deepEqual(
    appels.map((a) => `${a.init.method} ${a.url}`),
    [
      "GET https://boutique.exemple.com/api/service/capabilities",
      "GET https://boutique.exemple.com/api/service/products?state=REVIEW_REQUIRED&limit=10&offset=20",
      `GET https://boutique.exemple.com/api/service/products/${ID}`,
      `POST https://boutique.exemple.com/api/service/products/${ID}/photos`,
      `PUT https://boutique.exemple.com/api/service/products/${ID}/draft`,
    ],
  );
  for (const a of appels) {
    assert.equal(a.init.redirect, "error");
    assert.equal(new Headers(a.init.headers).get("authorization"), `Bearer ${JETON}`);
    assert.equal(a.url.includes("shopsvc_"), false);
    assert.equal(String(a.init.body ?? "").includes("shopsvc_"), false);
  }
  assert.deepEqual(JSON.parse(String(appels[4]!.init.body)), {
    expectedRevision: 2,
    title: "Voiture électrique",
    shopDescription: "Description originale.",
    fields: { Seats: { status: "FIELD_AVAILABLE", value: "1", sourceRef: "fiche fournisseur" } },
    packages: [{ lengthMm: 800, widthMm: 400, heightMm: 300, weightGrams: 9000, sourceRef: "fiche fournisseur" }],
  });
  assert.equal(r.ok, true);
});

test("entrées invalides refusées avant tout appel réseau", async () => {
  const { f, appels } = faux([]);
  assert.equal((await lireProduitBoutique(ACCES, "../../vault", f)).ok, false);
  assert.equal((await lancerPhotosBoutique(ACCES, 42, f)).ok, false);
  assert.equal((await listerProduitsBoutique(ACCES, { etat: "PUBLISHED" }, f)).ok, false);
  assert.equal((await proposerFicheBoutique(ACCES, ID, { revisionAttendue: 0, titre: "x", descriptionBoutique: "y", champs: {}, colis: [] }, f)).ok, false);
  assert.equal(appels.length, 0);
});

test("erreurs de la boutique : messages clairs, jamais le jeton ni un détail technique", async () => {
  const cas: [number, unknown, RegExp][] = [
    [401, { error: "Jeton de service invalide" }, /refuse le jeton/],
    [403, { error: "x", code: "TOOLS_DISABLED" }, /désactivés/],
    [403, { error: "x", code: "SCOPE_REQUIRED", scope: "drafts.propose" }, /portée/],
    [409, { error: "x", code: "MEDIA_RIGHTS_REQUIRED" }, /droits d'image/],
    [409, { error: "Brouillon modifié ailleurs ou introuvable. Rechargez." }, /modifié ailleurs/],
    [404, { error: "Produit introuvable." }, /introuvable/],
    [429, { error: "Trop d'appels" }, /limite/],
    [400, { error: "Requête invalide." }, /refusé/],
    [500, { error: "boom" }, /erreur \(500\)/],
  ];
  for (const [status, json, motif] of cas) {
    const { f } = faux([{ status, json }]);
    const r = await lireProduitBoutique(ACCES, ID, f);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.match(r.detail, motif);
      assert.equal(r.detail.includes(JETON), false);
    }
  }
  const dns = (async () => {
    throw new TypeError("fetch failed ECONNREFUSED 10.0.0.1");
  }) as typeof fetch;
  const r = await capacitesBoutique(ACCES, dns);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(/ECONNREFUSED|10\.0\.0\.1/.test(r.detail), false);
  const html = await capacitesBoutique(ACCES, faux([{ status: 200, texte: "<html>pas du JSON</html>" }]).f);
  assert.equal(html.ok, false);
  const gros = await capacitesBoutique(ACCES, faux([{ status: 200, texte: `{"a":"${"x".repeat(600_000)}"}` }]).f);
  assert.equal(gros.ok, false);
});

test("défense en profondeur : prix, adresses et secrets retirés de ce qui revient", () => {
  const propre = nettoyer({
    id: ID,
    title: "Voiture",
    price: 12,
    prix_fournisseur: 9,
    amount_minor: 100,
    image_url: "https://x.example/a.jpg",
    token: "t",
    nested: [{ ok: 1, supplierUrl: "https://x" }],
  }) as Record<string, unknown>;
  assert.deepEqual(propre, { id: ID, title: "Voiture", nested: [{ ok: 1 }] });
});

test("registre : six outils, lecture seule ou risque faible, réservés au PDG, aucun outil de modification de prix/TVA/stock/approbation/publication", () => {
  assert.equal(OUTILS_BOUTIQUE.length, 6);
  for (const o of OUTILS_BOUTIQUE) {
    assert.ok(OUTILS.some((x) => x.toolId === o.toolId), `${o.toolId} enregistré`);
    assert.ok(IMPLEMENTATIONS[o.toolId], `${o.toolId} implémenté`);
    assert.deepEqual(o.allowedRoles, ["super_admin"]);
    assert.equal(o.requiresHumanApproval, false);
    assert.ok(["READ_ONLY", "LOW"].includes(o.riskLevel), o.toolId);
    assert.equal(o.category, "boutique");
  }
  const noms = OUTILS_BOUTIQUE.map((o) => o.toolId).sort();
  assert.deepEqual(noms, ["boutique.capacites", "boutique.lancerPhotos", "boutique.lireFicheComplete", "boutique.lireProduit", "boutique.listerProduits", "boutique.proposerFiche"]);
  assert.equal(noms.some((n) => /prix|tva|stock|livraison|approuver|publier|decision|offre/i.test(n)), false);
  const ecritures = OUTILS_BOUTIQUE.filter((o) => o.requiredPermissions.includes("WRITE")).map((o) => o.toolId).sort();
  assert.deepEqual(ecritures, ["boutique.lancerPhotos", "boutique.proposerFiche"]);
});

test("implémentations : refusent sans compte appelant connu (le coffre n'est lisible que pour son propriétaire)", async () => {
  for (const o of OUTILS_BOUTIQUE) {
    await assert.rejects(() => IMPLEMENTATIONS[o.toolId]!({}, undefined), /Compte appelant inconnu/);
  }
});

test("connaissances boutique : 23 entrées copiées + 3 de connexion, titres uniques et courts, aucun secret, sources datées", () => {
  assert.equal(CONNAISSANCES_BOUTIQUE.length, 26);
  const titres = CONNAISSANCES_BOUTIQUE.map((c) => `${c.categorie}|${c.titre}`);
  assert.equal(new Set(titres).size, titres.length);
  for (const c of CONNAISSANCES_BOUTIQUE) {
    assert.ok(c.titre.startsWith("Boutique SHOP — ") && c.titre.length <= 220, c.titre);
    assert.ok(c.contenu.length > 150 && c.source.length > 10, c.titre);
    assert.ok(!/(?:\bsk-[A-Za-z0-9]|shopsvc_[A-Za-z0-9_-]{20}|-----BEGIN|password\s*[:=]|mot de passe\s*[:=])/i.test(c.contenu), `secret apparent dans « ${c.titre} »`);
  }
  const copiees = CONNAISSANCES_BOUTIQUE.filter((c) => c.source.startsWith("mkapms-shop · migrations/"));
  assert.equal(copiees.length, 23);
  for (const c of copiees) assert.match(c.source, /copiée ici le 2 octobre 2026/);
});

test("jeton refusé : la boutique et son message sont nommés ; route de service absente et redirection sont distinguées d'un jeton invalide", async () => {
  // 401 avec la réponse de la boutique : l'hôte et son message figurent dans le diagnostic.
  const a = await capacitesBoutique(ACCES, faux([{ status: 401, json: { error: "Jeton expiré" } }]).f);
  assert.equal(a.ok, false);
  if (!a.ok) {
    assert.match(a.detail, /boutique\.exemple\.com/);
    assert.match(a.detail, /Réponse de la boutique : « Jeton expiré »/);
    assert.match(a.detail, /invalide, expiré ou révoqué/);
  }
  // 401 SANS format JSON : la route de service n'est pas reconnue, ce n'est pas (encore) le jeton.
  const b = await capacitesBoutique(ACCES, faux([{ status: 401, texte: "<html>Connexion requise</html>" }]).f);
  assert.equal(b.ok, false);
  if (!b.ok) assert.match(b.detail, /sans le format attendu.*\/api\/service.*le jeton n'est pas en cause/);
  // Redirection refusée : message propre, avec l'action à faire.
  const redirige = (async () => {
    throw Object.assign(new TypeError("fetch failed"), { cause: new Error("unexpected redirect") });
  }) as typeof fetch;
  const c = await capacitesBoutique(ACCES, redirige);
  assert.equal(c.ok, false);
  if (!c.ok) assert.match(c.detail, /redirige cette adresse.*adresse finale exacte/);
  // Réseau : pas de promesse sur la cause.
  const reseau = (async () => {
    throw new TypeError("fetch failed");
  }) as typeof fetch;
  const d = await capacitesBoutique(ACCES, reseau);
  if (!d.ok) assert.match(d.detail, /réseau ou nom de domaine introuvable/);
});

test("valeur collée dans le coffre : guillemets, Bearer, espaces et caractères invisibles sont retirés", () => {
  assert.equal(nettoyerValeurSecret(`  "${JETON}"  `), JETON);
  assert.equal(nettoyerValeurSecret(`Bearer ${JETON}`), JETON);
  assert.equal(nettoyerValeurSecret(`\u200b${JETON}\ufeff\n`), JETON);
  assert.equal(nettoyerValeurSecret("https://boutique.exemple.com"), "https://boutique.exemple.com");
});

test("nettoyerValeurSecret : retire aussi la ponctuation de fin collée avec la valeur", () => {
  assert.equal(nettoyerValeurSecret(`${JETON}.`), JETON);
  assert.equal(nettoyerValeurSecret(`  "${JETON}" ; `), JETON);
  assert.equal(nettoyerValeurSecret("https://boutique.exemple.com."), "https://boutique.exemple.com");
});

test("fiche complète : chemin fixe /full, jeton en en-tête, prix et ligne d'origine conservés, aucun secret, entrée invalide refusée", async () => {
  const { f, appels } = faux([
    {
      json: {
        id: ID,
        supplierPrice: { decimal: null, currency: null },
        founderPrice: { decimal: "120.50", currency: "EUR" },
        shopOffer: { amountMinor: 19900, currency: "EUR" },
        parcels: { count: 2 },
        supplierSheet: { "Regular price": "987.65", Colis: "2 colis" },
        sourceImages: ["https://images.exemple.org/a.jpg"],
        warnings: ["PRICE_UNCONFIRMED"],
        apiToken: "ne-doit-pas-passer",
        nested: { credential: "ne-doit-pas-passer", ok: 1 },
      },
    },
  ]);
  const r = await lireFicheCompleteBoutique(ACCES, ID, f);
  assert.deepEqual(appels.map((a) => `${a.init.method} ${a.url}`), [`GET https://boutique.exemple.com/api/service/products/${ID}/full`]);
  assert.equal(new Headers(appels[0]!.init.headers).get("authorization"), `Bearer ${JETON}`);
  assert.equal(appels[0]!.init.redirect, "error");
  assert.equal(r.ok, true);
  const texte = JSON.stringify(r);
  assert.ok(texte.includes("987.65") && texte.includes("19900") && texte.includes("PRICE_UNCONFIRMED") && texte.includes("2 colis"), "prix, offre, colis et avertissement conservés");
  assert.equal(/ne-doit-pas-passer|apiToken|credential/.test(texte), false, "aucun secret");
  const { f: f2, appels: a2 } = faux([]);
  assert.equal((await lireFicheCompleteBoutique(ACCES, "../../vault", f2)).ok, false);
  assert.equal(a2.length, 0);
  // Sans la portée catalogue.full, la boutique répond SCOPE_REQUIRED : message clair, aucun prix supposé.
  const { f: f3 } = faux([{ status: 403, json: { error: "Portée non accordée à ce jeton.", code: "SCOPE_REQUIRED", scope: "catalogue.full" } }]);
  const refus = await lireFicheCompleteBoutique(ACCES, ID, f3);
  assert.equal(refus.ok, false);
  if (!refus.ok) assert.match(refus.detail, /portée/);
});
