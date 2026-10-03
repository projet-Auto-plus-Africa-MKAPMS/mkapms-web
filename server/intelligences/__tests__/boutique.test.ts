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
  synchroniserStockBoutique,
  choisirPhotoPrincipaleBoutique,
  traduireFiche,
  detailSynchroStock,
  definirColisBoutique,
  lireApercuBoutique,
  recontrolerMarquePhotoBoutique,
  importerGrilleLivraisonBoutique,
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

test("registre : douze outils, lecture seule ou risque faible, réservés au PDG, aucun outil de modification de prix/TVA/approbation/publication", () => {
  assert.equal(OUTILS_BOUTIQUE.length, 12);
  for (const o of OUTILS_BOUTIQUE) {
    assert.ok(OUTILS.some((x) => x.toolId === o.toolId), `${o.toolId} enregistré`);
    assert.ok(IMPLEMENTATIONS[o.toolId], `${o.toolId} implémenté`);
    assert.deepEqual(o.allowedRoles, ["super_admin"]);
    assert.equal(o.requiresHumanApproval, false);
    assert.ok(["READ_ONLY", "LOW"].includes(o.riskLevel), o.toolId);
    assert.equal(o.category, "boutique");
  }
  const noms = OUTILS_BOUTIQUE.map((o) => o.toolId).sort();
  assert.deepEqual(noms, ["boutique.capacites", "boutique.choisirPhotoPrincipale", "boutique.definirColis", "boutique.importerGrilleLivraison", "boutique.lancerPhotos", "boutique.lireApercu", "boutique.lireFicheComplete", "boutique.lireProduit", "boutique.listerProduits", "boutique.proposerFiche", "boutique.recontrolerMarquePhoto", "boutique.synchroniserStock"]);
  assert.equal(noms.some((n) => /prix|tva|approuver|publier|decision|offre/i.test(n)), false);
  const ecritures = OUTILS_BOUTIQUE.filter((o) => o.requiredPermissions.includes("WRITE")).map((o) => o.toolId).sort();
  assert.deepEqual(ecritures, ["boutique.choisirPhotoPrincipale", "boutique.definirColis", "boutique.importerGrilleLivraison", "boutique.lancerPhotos", "boutique.proposerFiche", "boutique.recontrolerMarquePhoto", "boutique.synchroniserStock"]);
});

test("livraison : colis avec preuve et grille du fournisseur, jamais supposés ; la requête part vers les bonnes routes", async () => {
  const ID = "11111111-1111-4111-8111-111111111111";
  const sans = await definirColisBoutique(ACCES, ID, { nombre: 2, preuve: "" }, faux([]).f);
  assert.equal(sans.ok, false);
  assert.equal((await definirColisBoutique(ACCES, ID, { nombre: 0, preuve: "Fiche fournisseur" }, faux([]).f)).ok, false);
  const a = faux([{ status: 200, json: { stored: 1, parcelCount: 2 } }]);
  assert.equal((await definirColisBoutique(ACCES, ID, { nombre: 2, preuve: "Fiche Cars4Kids" }, a.f)).ok, true);
  assert.equal(a.appels[0]!.init.method, "PUT");
  assert.match(a.appels[0]!.url, /\/products\/11111111-1111-4111-8111-111111111111\/parcels$/);
  assert.deepEqual(JSON.parse(String(a.appels[0]!.init.body)), { parcelCount: 2, evidenceRef: "Fiche Cars4Kids" });
  const base = { grille: "Belgique ; 18", taxe: "EXCLUDED", preuve: "Tarifs du 3 octobre", valideJusqua: "2026-12-01T00:00:00Z" };
  assert.equal((await importerGrilleLivraisonBoutique(ACCES, ID, { ...base, taxe: "?" }, faux([]).f)).ok, false, "taxe obligatoire");
  assert.equal((await importerGrilleLivraisonBoutique(ACCES, ID, { ...base, preuve: "" }, faux([]).f)).ok, false, "preuve obligatoire");
  const b = faux([{ status: 200, json: { preview: true, rows: [] } }]);
  assert.equal((await importerGrilleLivraisonBoutique(ACCES, ID, { ...base, apercu: true }, b.f)).ok, true);
  assert.match(b.appels[0]!.url, /shipping-grid\?preview=1$/);
  const c = faux([{ status: 403, json: { code: "SCOPE_REQUIRED", scope: "delivery.work", error: "Portée non accordée à ce jeton." } }]);
  const refus = await importerGrilleLivraisonBoutique(ACCES, ID, base, c.f);
  assert.equal(refus.ok, false);
  if (!refus.ok) assert.match(refus.detail, /delivery\.work/);
});

test("aperçu et recontrôle de marque : bonnes routes, identifiants vérifiés, motif lisible", async () => {
  const ID = "11111111-1111-4111-8111-111111111111", MEDIA = "22222222-2222-4222-8222-222222222222";
  assert.equal((await lireApercuBoutique(ACCES, "pas-un-uuid", faux([]).f)).ok, false);
  const a = faux([{ status: 200, json: { product: { id: ID, title: "Voiture" }, sellingPrice: { amountMinor: 18990, currency: "EUR" }, stock: { status: "IN_STOCK", quantity: 7 } } }]);
  const r = await lireApercuBoutique(ACCES, ID, a.f);
  assert.equal(r.ok, true);
  assert.match(a.appels[0]!.url, /\/products\/11111111-1111-4111-8111-111111111111\/preview$/);
  assert.equal(a.appels[0]!.init.method, "GET");
  assert.equal((await recontrolerMarquePhotoBoutique(ACCES, ID, "x", faux([]).f)).ok, false);
  const b = faux([{ status: 200, json: { brandState: "NOT_CHECKED", brandReason: "NOT_CONFIGURED", eligibleAsMain: false, why: "le contrôle de marque n'a pas pu s'exécuter" } }]);
  assert.equal((await recontrolerMarquePhotoBoutique(ACCES, ID, MEDIA, b.f)).ok, true);
  assert.equal(b.appels[0]!.init.method, "POST");
  assert.match(b.appels[0]!.url, /\/media\/22222222-2222-4222-8222-222222222222\/recheck-brand$/);
});

test("implémentations : refusent sans compte appelant connu (le coffre n'est lisible que pour son propriétaire)", async () => {
  for (const o of OUTILS_BOUTIQUE) {
    await assert.rejects(() => IMPLEMENTATIONS[o.toolId]!({}, undefined), /Compte appelant inconnu/);
  }
});

test("connaissances boutique : 23 entrées copiées + 4 propres à la plateforme, titres uniques et courts, aucun secret, sources datées", () => {
  assert.equal(CONNAISSANCES_BOUTIQUE.length, 27);
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

test("fiche : clés françaises OU de la boutique, valeurs en texte, dimensions arrondies, casse des noms de champs corrigée", () => {
  const fr = traduireFiche({
    champs: { Seats: { statut: "FIELD_AVAILABLE", valeur: 1, source: "fiche fournisseur" }, maxchildweight: { status: "field_available", value: "30 kg", sourceRef: "fiche fournisseur" }, BatteryCapacity: { statut: "FIELD_UNVERIFIED" } },
    colis: [{ longueurMm: 800.4, largeurMm: "400", hauteurMm: 300, poidsGrammes: 9000.6, source: "liste fournisseur" }, { lengthMm: 700, widthMm: 300, heightMm: 200, weightGrams: 5000, sourceRef: "liste fournisseur" }],
  });
  assert.ok(fr.ok);
  if (fr.ok) {
    assert.deepEqual(fr.fields, {
      Seats: { status: "FIELD_AVAILABLE", value: "1", sourceRef: "fiche fournisseur" },
      MaxChildWeight: { status: "FIELD_AVAILABLE", value: "30 kg", sourceRef: "fiche fournisseur" },
      BatteryCapacity: { status: "FIELD_UNVERIFIED", value: "", sourceRef: "" },
    });
    assert.deepEqual(fr.packages, [
      { lengthMm: 800, widthMm: 400, heightMm: 300, weightGrams: 9001, sourceRef: "liste fournisseur" },
      { lengthMm: 700, widthMm: 300, heightMm: 200, weightGrams: 5000, sourceRef: "liste fournisseur" },
    ]);
  }
});

test("fiche : une erreur évidente est dite avant l'appel, avec le champ ou le colis en cause ; rien n'est deviné", async () => {
  const sansStatut = traduireFiche({ champs: { Seats: { valeur: "1", source: "x" } } });
  assert.equal(sansStatut.ok, false);
  if (!sansStatut.ok) assert.match(sansStatut.detail, /Seats.*statut/);
  const colisIncomplet = traduireFiche({ colis: [{ longueurMm: 800, largeurMm: 400, poidsGrammes: 9000, source: "x" }] });
  assert.equal(colisIncomplet.ok, false);
  if (!colisIncomplet.ok) assert.match(colisIncomplet.detail, /Colis n°1.*hauteurMm/);
  const colisSansSource = traduireFiche({ colis: [{ longueurMm: 1, largeurMm: 1, hauteurMm: 1, poidsGrammes: 1 }] });
  assert.equal(colisSansSource.ok, false);
  const { f, appels } = faux([]);
  const r = await proposerFicheBoutique(ACCES, ID, { revisionAttendue: 1, titre: "t", descriptionBoutique: "d", champs: { Seats: { valeur: "1" } } as never, colis: [] }, f);
  assert.equal(r.ok, false);
  assert.equal(appels.length, 0);
});

test("refus 400 de la boutique : les champs en cause sont nommés (chemin + règle), jamais une valeur ; portée manquante nommée", async () => {
  const { f } = faux([{ status: 400, json: { error: "Requête invalide.", issues: [{ path: "fields.Seats.value", message: "Expected string, received number" }, { path: "packages.0.heightMm", message: "Required" }] } }]);
  const r = await proposerFicheBoutique(ACCES, ID, { revisionAttendue: 1, titre: "t", descriptionBoutique: "d", champs: {}, colis: [] }, f);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.match(r.detail, /fields\.Seats\.value : Expected string/);
    assert.match(r.detail, /packages\.0\.heightMm : Required/);
  }
  const { f: f2 } = faux([{ status: 403, json: { error: "x", code: "SCOPE_REQUIRED", scope: "catalogue.full" } }]);
  const portee = await lireFicheCompleteBoutique(ACCES, ID, f2);
  assert.equal(portee.ok, false);
  if (!portee.ok) assert.match(portee.detail, /portée « catalogue\.full »/);
});

test("stock : chemin fixe /stock-sync, corps vide, jamais d'adresse ; lien absent ou limite d'une minute dits tels quels", async () => {
  const { f, appels } = faux([
    { json: { sync: { status: "SYNCED", rows: 10, matched: 9 }, stock: { sku: "c4k1166 zwart", status: "IN_STOCK", quantity: 7 } } },
    { status: 409, json: { sync: { status: "NO_SOURCE", reason: "NO_STOCK_LINK" }, stock: { sku: "x", status: "UNKNOWN", quantity: null } } },
    { status: 429, json: { error: "x", code: "STOCK_SYNC_TOO_SOON" } },
  ]);
  const ok = await synchroniserStockBoutique(ACCES, ID, f);
  assert.equal(ok.ok, true);
  assert.equal(JSON.stringify(ok).includes("IN_STOCK") && JSON.stringify(ok).includes("7"), true);
  const sansLien = await synchroniserStockBoutique(ACCES, ID, f);
  assert.equal(sansLien.ok, false);
  if (!sansLien.ok) assert.match(sansLien.detail, /aucun « Lien CSV stock »/);
  const trop = await synchroniserStockBoutique(ACCES, ID, f);
  assert.equal(trop.ok, false);
  if (!trop.ok) assert.match(trop.detail, /une synchronisation par minute/);
  assert.deepEqual(appels.map((a) => `${a.init.method} ${a.url}`), Array(3).fill(`POST https://boutique.exemple.com/api/service/products/${ID}/stock-sync`));
  for (const a of appels) assert.equal(String(a.init.body), "{}");
  assert.equal((await synchroniserStockBoutique(ACCES, "../x", f)).ok, false);
  assert.match(detailSynchroStock("FEED_ERROR", "FEED_UNAVAILABLE"), /n'a pas répondu/);
  assert.match(detailSynchroStock("NO_SOURCE", "NO_INTEGRATION"), /pas d'intégration/);
  assert.match(detailSynchroStock("FEED_ERROR", "FEED_HTTP_FAILED", 404), /HTTP 404/);
  assert.match(detailSynchroStock("FEED_ERROR", "FEED_URL_INVALID"), /https valide/);
  assert.match(detailSynchroStock("NO_SOURCE", "INTEGRATION_EXPIRED"), /expirée/);
  assert.match(detailSynchroStock("NO_SOURCE", "AMBIGUOUS_STOCK_LINK"), /plusieurs intégrations/);
});

test("photo principale : chemin fixe, corps vide, identifiants validés avant l'appel, photo avec marque refusée dite clairement", async () => {
  const MEDIA = "7a1c2b0e-8c3a-4f4e-9d54-0a1b2c3d4e5f";
  const { f, appels } = faux([{ json: { selected: true, published: false } }, { status: 409, json: { error: "x", code: "MAIN_PHOTO_NOT_ELIGIBLE" } }]);
  const ok = await choisirPhotoPrincipaleBoutique(ACCES, ID, MEDIA, f);
  assert.equal(ok.ok, true);
  const marque = await choisirPhotoPrincipaleBoutique(ACCES, ID, MEDIA, f);
  assert.equal(marque.ok, false);
  if (!marque.ok) assert.match(marque.detail, /sans marque/);
  assert.deepEqual(appels.map((a) => `${a.init.method} ${a.url}`), Array(2).fill(`POST https://boutique.exemple.com/api/service/products/${ID}/media/${MEDIA}/select`));
  for (const a of appels) assert.equal(String(a.init.body), "{}");
  const { f: f2, appels: a2 } = faux([]);
  assert.equal((await choisirPhotoPrincipaleBoutique(ACCES, ID, "../x", f2)).ok, false);
  assert.equal((await choisirPhotoPrincipaleBoutique(ACCES, 5, MEDIA, f2)).ok, false);
  assert.equal(a2.length, 0);
});
