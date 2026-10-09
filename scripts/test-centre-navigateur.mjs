/**
 * Essai de bout en bout LOCAL du Centre Cyber-Électrique : serveur construit (dist/server.js) + base jetable + vrai navigateur.
 * Aucune base Railway, aucun appel vers la Boutique. Le serveur est arrêté puis relancé pour éprouver le redémarrage ; le plan des
 * connexions est éprouvé sur ordinateur, tablette et téléphone (déplacement, zoom, pincement).
 *
 *   npm run build
 *   E2E_DB=postgresql://…/une_base_jetable_test node scripts/test-centre-navigateur.mjs docs/preuves/captures
 *
 * Variables : E2E_DB (base jetable LOCALE dont le nom finit par _test, migrations de la plateforme déjà appliquées — le schéma « frontier »
 * y est supprimé puis recréé par le serveur), E2E_CHROMIUM (exécutable Chromium), E2E_PLAYWRIGHT (chemin du module playwright), E2E_PORT.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

const RACINE = process.cwd();
const require = createRequire(`${RACINE}/package.json`);
const jwt = require("jsonwebtoken");
const pg = require("pg");
const { chromium } = await import(process.env.E2E_PLAYWRIGHT ?? "playwright");

const SORTIE = process.argv[2];
mkdirSync(SORTIE, { recursive: true });
const DB = process.env.E2E_DB ?? "";
const baseUrl = new URL(DB || "postgresql://x@invalide/x");
if (!["localhost", "127.0.0.1"].includes(baseUrl.hostname) || !/_test$/.test(baseUrl.pathname.slice(1))) throw new Error("E2E_DB doit désigner une base jetable LOCALE dont le nom finit par _test.");
const PORT = Number(process.env.E2E_PORT ?? 8099);
const BASE = `http://127.0.0.1:${PORT}`;
const SECRET = "e2e-local-secret";
const pool = new pg.Pool({ connectionString: DB });

await pool.query("DROP SCHEMA IF EXISTS frontier CASCADE");
await pool.query("DELETE FROM shop_link_cables");
await pool.query("DELETE FROM users WHERE email IN ('pdg-fo@exemple.test','admin-fo@exemple.test')");
const pdg = (await pool.query("INSERT INTO users(email,name,role,status) VALUES('pdg-fo@exemple.test','PDG essai','super_admin','active') RETURNING id")).rows[0].id;
const adm = (await pool.query("INSERT INTO users(email,name,role,status) VALUES('admin-fo@exemple.test','Admin essai','admin','active') RETURNING id")).rows[0].id;
const jeton = (uid, role, email) => jwt.sign({ uid, role, email }, SECRET, { expiresIn: "1d" });

let serveur;
let journalServeur = "";
async function demarrer() {
  const env = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: "production", PORT: String(PORT), DATABASE_URL: DB, JWT_SECRET: SECRET, PUBLIC_URL: BASE };
  serveur = spawn("node", ["dist/server.js"], { cwd: RACINE, env, stdio: ["ignore", "pipe", "pipe"] });
  serveur.stdout.on("data", (d) => (journalServeur += d));
  serveur.stderr.on("data", (d) => (journalServeur += d));
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("serveur non démarré\n" + journalServeur.slice(-2500));
}
async function arreter() {
  serveur.kill("SIGTERM");
  await new Promise((r) => serveur.once("exit", r));
}
const attendreBaseCentre = async () => {
  for (let i = 0; i < 60; i++) {
    try { const r = await pool.query("SELECT count(*)::int n FROM frontier.lines"); if (r.rows[0].n >= 56) return; } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("fondation du centre absente\n" + journalServeur.slice(-2000));
};

try {
  await demarrer();
  console.log("serveur démarré");
  await attendreBaseCentre();
  console.log("base du centre posée au démarrage (en arrière-plan)");
  assert.equal((await fetch(`${BASE}/api/trpc/frontierOs.accueil`)).status, 403, "zone fermée sans session");

  const browser = await chromium.launch({ headless: true, executablePath: process.env.E2E_CHROMIUM, args: ["--no-sandbox"] });
  const contexte = async (viewport, options = {}, uid = pdg, role = "super_admin", email = "pdg-fo@exemple.test") => {
    const ctx = await browser.newContext({ viewport, ...options });
    const t = jeton(uid, role, email);
    await ctx.addCookies([{ name: "token", value: t, url: BASE }]);
    await ctx.addInitScript((tk) => localStorage.setItem("mkapms_token", tk), t);
    return ctx;
  };

  // 1. Administrateur ordinaire : pas de portail.
  {
    const ctx = await contexte({ width: 1280, height: 900 }, {}, adm, "admin", "admin-fo@exemple.test");
    const page = await ctx.newPage();
    await page.goto(`${BASE}/admin`);
    await page.getByRole("button", { name: "Administrateur / Directeur" }).click();
    await page.getByRole("heading", { name: "Système Intelligent MKA.P-MS" }).waitFor();
    assert.equal(await page.getByText("Portail Frontier OS").count(), 0, "le portail est réservé au PDG");
    await ctx.close();
  }

  // 2. PDG, ordinateur.
  const ctx = await contexte({ width: 1440, height: 1000 });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  page.setDefaultTimeout(30000);
  await page.goto(`${BASE}/admin`);
  await page.getByRole("button", { name: "Administrateur / Directeur" }).click();
  await page.getByText("Portail Frontier OS").waitFor();
  await page.getByText("Portail Frontier OS").click();
  await page.waitForURL("**/admin/centre-cyber-electrique");

  // L'entrée ouvre l'accueil, avec les dix salles.
  await page.getByRole("heading", { name: "Centre Cyber-Électrique MKA.P-MS · Frontier OS" }).waitFor();
  await page.getByText("MODE SIMULATION").first().waitFor();
  assert.equal(await page.getByRole("navigation", { name: "Salles du centre" }).getByRole("button").count(), 10);
  assert.equal(await page.getByRole("navigation", { name: "Salles du centre" }).locator('[aria-current="page"]').innerText(), "Accueil");
  await page.locator('figure[data-jauge]').first().waitFor();
  assert.equal(await page.locator("figure[data-jauge]").count(), 6);
  assert.equal(await page.locator('figure[data-jauge="temperature"]').getAttribute("data-mesuree"), "false");
  await page.getByText("Noms demandés : aucune fusion").waitFor();
  assert.ok(await page.getByText("« MKH Shop » — NON TROUVÉ dans le code").count() >= 1);
  assert.ok(await page.getByText("pas encore en matériel").count() >= 1, "la base partage encore le serveur Postgres");
  await page.screenshot({ path: `${SORTIE}/01-accueil-bureau.png`, fullPage: true });

  // Santé des moteurs et banc d'essai : valeurs mesurées.
  await page.getByRole("button", { name: "Vérifier la santé des moteurs" }).click();
  await page.getByText(/Santé des moteurs internes : \d+\/\d+ répondent/).waitFor();
  await page.getByRole("button", { name: "Banc d'essai des capacités" }).click();
  await page.getByText(/Banc d'essai : \d+ sondes\/min/).waitFor();
  await page.waitForFunction(() => document.querySelector('figure[data-jauge="latence"]')?.getAttribute("data-mesuree") === "true");
  assert.equal(await page.locator('figure[data-jauge="memoire"]').getAttribute("data-mesuree"), "true");
  assert.equal(await page.locator('figure[data-jauge="temperature"]').getAttribute("data-mesuree"), "false");

  // Salle des connexions.
  await page.getByRole("navigation", { name: "Salles du centre" }).getByRole("button", { name: "Connexions", exact: true }).click();
  await page.locator('[data-groupe="boutique"] article').first().waitFor();
  assert.equal(await page.locator('[data-groupe="boutique"] article').count(), 6, "six lignes réelles");
  assert.equal(await page.locator('[data-toile="bureau"]').count(), 1, "ordinateur : plan ajusté à la largeur disponible");
  assert.equal(await page.locator('article[data-ligne="shop-documents-only"] [data-element]').count(), 7, "sept éléments par ligne");
  for (const rang of [1, 2, 3, 4, 5, 6, 7]) assert.ok(await page.locator(`article[data-ligne="shop-documents-only"] [data-element="${rang}"], article[data-ligne="shop-documents-only"] [data-cote]`).count() >= 1);
  assert.equal(await page.locator('article[data-ligne="shop-documents-only"] [data-cote]').count(), 3, "trois coupures par ligne");
  assert.equal(await page.locator('article[data-ligne="shop-documents-only"] button[role="switch"]').count(), 2, "deux petits interrupteurs");
  assert.equal(await page.locator('article[data-validite="invalid"]').count(), 3);
  assert.ok(await page.getByText("Élément 5 absent").count() >= 1, "l'entrée n'a pas d'intermédiaire côté plateforme");
  await page.getByRole("button", { name: /Déplier les 30 lignes « À venir »/ }).click();
  assert.equal(await page.locator('[data-testid="reserves-boutique"] [data-reserve]').count(), 30, "trente réserves vides");
  await page.getByRole("button", { name: /Replier les 30 lignes/ }).click();
  await page.screenshot({ path: `${SORTIE}/02-connexions-repos-bureau.png`, fullPage: true });

  // Un moteur est cliquable : inventaire, état, tests, historique.
  await page.locator('article[data-ligne="shop-documents-only"] [data-element="1"]').click();
  await page.getByTestId("fiche-moteur").waitFor();
  await page.getByText("Inventaire (relevé en lecture seule)").waitFor();
  await page.getByText("Versions relevées").waitFor();
  assert.ok(await page.getByTestId("fiche-moteur").getByText("Où est le code").count() === 1);
  await page.screenshot({ path: `${SORTIE}/03-fiche-moteur-bureau.png` });
  await page.getByRole("button", { name: "Fermer la fiche" }).click();

  // Activation d'une ligne : l'ordre n'est pas le résultat.
  const docs = page.locator('article[data-ligne="shop-documents-only"]');
  await docs.getByRole("button", { name: "Activer la ligne" }).click();
  await page.getByRole("alertdialog").waitFor();
  assert.equal(await docs.getAttribute("data-etat-ligne"), "unknown", "rien ne bouge avant la confirmation");
  await page.getByRole("button", { name: "Confirmer" }).click();
  await page.getByTestId("resultat-commande").waitFor();
  await page.waitForFunction(() => document.querySelector('article[data-ligne="shop-documents-only"]')?.getAttribute("data-etat-ligne") === "connected");
  assert.equal(await page.getByTestId("resultat-commande").getAttribute("data-statut"), "confirmed");
  await docs.getByText("les échanges PASSENT").waitFor();
  assert.equal(await docs.locator('[data-cote="center"]').getAttribute("data-etat"), "connecte");
  await page.screenshot({ path: `${SORTIE}/04-ligne-connectee-bureau.png`, fullPage: true });
  await page.locator('[data-groupe="boutique"]').screenshot({ path: `${SORTIE}/04b-plan-groupe-boutique-bureau.png` });

  // Échange d'essai : livré ; puis un petit interrupteur coupé → rien ne passe.
  await docs.getByRole("button", { name: "Échange d'essai" }).click();
  await page.getByText(/Échange d'essai LIVRÉ/).waitFor();
  await docs.locator('[data-cote="remote"] button[role="switch"]').click();
  await page.waitForFunction(() => document.querySelector('article[data-ligne="shop-documents-only"]')?.getAttribute("data-etat-ligne") === "partial");
  await docs.getByText(/rien ne passe \(côté distant\)/).waitFor();
  await docs.getByRole("button", { name: "Échange d'essai" }).click();
  await page.getByText(/Échange d'essai REFUSÉ par le transport : COUPURE_NON_DEMANDEE \(coupure remote\)/).waitFor();
  await docs.getByRole("button", { name: "Détails" }).click();
  await docs.getByTestId("detail-ligne").waitFor();
  assert.equal(await docs.locator('[data-detail-cote="remote"]').innerText().then((t) => /couper/.test(t) && /déconnecté/.test(t)), true, "demandé : couper ; observé : déconnecté");
  await docs.getByRole("button", { name: "Masquer" }).click();

  // Grand contact rouge du groupe : les contacts centraux seulement.
  await page.locator('[data-grand-contact="boutique"]').getByRole("button", { name: "Fermer les contacts" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirmer" }).click();
  await page.waitForFunction(() => document.querySelector('[data-grand-contact="boutique"]')?.getAttribute("data-contact") === "connected");
  assert.equal(await page.locator('article[data-ligne="service-access"] [data-cote="center"]').getAttribute("data-etat"), "connecte");
  assert.equal(await page.locator('article[data-ligne="service-access"] [data-cote="remote"]').getAttribute("data-etat"), "inconnu", "les petits interrupteurs ne sont pas touchés");
  assert.ok(await page.getByText("Lignes écartées (jamais contournées)").count() === 1);
  await page.screenshot({ path: `${SORTIE}/05-grand-contact-bureau.png`, fullPage: true });

  // Interrupteur général : tout activer ; un verrou n'est jamais contourné.
  await docs.getByRole("button", { name: "Verrouiller" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirmer" }).click();
  await docs.getByText("verrouillée", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Activer tout", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirmer" }).click();
  await page.getByTestId("resultat-commande").getByText(/Interrupteur général — CONFIRMÉ/).waitFor();
  await page.getByTestId("resultat-commande").getByText(/VERROUILLEE/).waitFor();
  await page.waitForFunction(() => document.querySelector('article[data-ligne="shop-intelligence-isolated"]')?.getAttribute("data-etat-ligne") === "connected");
  assert.equal(await docs.getAttribute("data-etat-ligne"), "disconnected", "verrouillée : jamais contournée");
  await page.screenshot({ path: `${SORTIE}/06-general-bureau.png`, fullPage: true });

  // Protocole des neuf étapes sur une ligne.
  await page.locator('article[data-ligne="service-access"]').getByRole("button", { name: "Protocole des 9 étapes" }).click();
  await page.getByText(/Protocole coupures-9-etapes : 11\/11 étapes réussies — RÉUSSI/).waitFor({ timeout: 60000 });
  await page.screenshot({ path: `${SORTIE}/07-protocole-bureau.png`, fullPage: true });
  await page.getByRole("button", { name: "Couper tout", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirmer" }).click();
  await page.getByTestId("resultat-commande").getByText(/Interrupteur général — CONFIRMÉ/).waitFor();
  await page.locator('[data-groupe="boutique"]').screenshot({ path: `${SORTIE}/07b-plan-groupe-boutique-bureau.png` });

  // Autres salles.
  const nav = page.getByRole("navigation", { name: "Salles du centre" });
  await nav.getByRole("button", { name: "Plateforme principale", exact: true }).click();
  await page.getByRole("heading", { name: "Salle de contrôle de la plateforme principale" }).waitFor();
  await page.screenshot({ path: `${SORTIE}/08-plateforme-principale-bureau.png`, fullPage: true });
  await nav.getByRole("button", { name: "Boutiques", exact: true }).click();
  await page.getByRole("heading", { name: "Salle de contrôle — Boutique MKA.P-MS SHOP" }).waitFor();
  await page.getByText(/Audit propre de la Boutique/).waitFor();
  await page.getByLabel("Filtrer par état").selectOption("incomplet");
  await page.waitForFunction(() => document.querySelectorAll("[data-moteur]").length > 0);
  await page.locator("[data-moteur]").first().click();
  await page.getByTestId("fiche-moteur").waitFor();
  await page.getByRole("button", { name: "Fermer la fiche" }).click();
  await page.screenshot({ path: `${SORTIE}/09-boutiques-bureau.png`, fullPage: true });
  await nav.getByRole("button", { name: "Cybersécurité", exact: true }).click();
  await page.getByText("Voies existantes entre la plateforme et la Boutique").waitFor();
  assert.equal(await page.locator('[data-gouvernee="false"]').count(), 2, "deux voies existantes NON gouvernées, dites telles quelles");
  await page.screenshot({ path: `${SORTIE}/10-cybersecurite-bureau.png`, fullPage: true });
  await nav.getByRole("button", { name: "Atelier", exact: true }).click();
  await page.getByRole("button", { name: "Lancer le diagnostic" }).click();
  await page.getByText(/anomalie\(s\) constatée\(s\)/).waitFor();
  await page.screenshot({ path: `${SORTIE}/11-atelier-bureau.png`, fullPage: true });
  await nav.getByRole("button", { name: "Mémoire", exact: true }).click();
  await page.getByText("Mémoire du centre (extensible, sans secret)").waitFor();
  await nav.getByRole("button", { name: "Incidents & audit", exact: true }).click();
  await page.getByText("Journal d'audit (en ajout seul)").waitFor();
  await page.getByText(/Sessions de test/).waitFor();
  await page.screenshot({ path: `${SORTIE}/12-incidents-audit-bureau.png`, fullPage: true });
  await nav.getByRole("button", { name: "Employés", exact: true }).click();
  await page.getByText(/seul le PDG/).first().waitFor();
  await nav.getByRole("button", { name: "Futures", exact: true }).click();
  await page.getByLabel("Code du nouveau groupe").fill("joaillerie-2");
  await page.getByLabel("Nom du nouveau groupe").fill("Joaillerie 2");
  await page.getByRole("button", { name: /Ajouter un groupe/ }).click();
  await page.getByText(/Groupe « Joaillerie 2 » ajouté avec 5 lignes/).waitFor();
  assert.deepEqual(erreurs, [], "erreurs de page (ordinateur)");
  await ctx.close();

  // 3. Redémarrage du serveur : ce qui était coupé reste coupé, ce qui était connecté le reste, les réserves restent désactivées.
  const avant = (await pool.query("SELECT l.intermediary_ref r, bool_and(g.open) o FROM frontier.lines l JOIN frontier.cuts c ON c.line_id = l.id JOIN frontier.gates g ON g.cut_id = c.id GROUP BY 1 ORDER BY 1")).rows;
  console.log("portes avant redémarrage :", JSON.stringify(avant));
  {
    const c2 = await contexte({ width: 1440, height: 1000 });
    const p2 = await c2.newPage();
    await p2.goto(`${BASE}/admin/centre-cyber-electrique`);
    await p2.getByRole("navigation", { name: "Salles du centre" }).getByRole("button", { name: "Connexions", exact: true }).click();
    await p2.locator('article[data-ligne="shop-documents-only"]').waitFor();
    await p2.locator('article[data-ligne="shop-documents-only"]').getByRole("button", { name: "Déverrouiller" }).click();
    await p2.getByRole("alertdialog").getByRole("button", { name: "Confirmer" }).click();
    await p2.locator('article[data-ligne="shop-documents-only"]').getByRole("button", { name: "Verrouiller", exact: true }).waitFor();
    await p2.locator('article[data-ligne="shop-documents-only"]').getByRole("button", { name: "Activer la ligne" }).click();
    await p2.getByRole("alertdialog").getByRole("button", { name: "Confirmer" }).click();
    await p2.waitForFunction(() => document.querySelector('article[data-ligne="shop-documents-only"]')?.getAttribute("data-etat-ligne") === "connected");
    await c2.close();
  }
  await arreter();
  journalServeur = "";
  await demarrer();
  await new Promise((r) => setTimeout(r, 4000));
  {
    const c3 = await contexte({ width: 1440, height: 1000 });
    const p3 = await c3.newPage();
    await p3.goto(`${BASE}/admin/centre-cyber-electrique`);
    await p3.getByRole("navigation", { name: "Salles du centre" }).getByRole("button", { name: "Connexions", exact: true }).click();
    await p3.locator('article[data-ligne="shop-documents-only"]').waitFor();
    assert.equal(await p3.locator('article[data-ligne="shop-documents-only"]').getAttribute("data-etat-ligne"), "connected", "connecté reste connecté après redémarrage");
    assert.equal(await p3.locator('article[data-ligne="service-access"]').getAttribute("data-etat-ligne"), "disconnected", "coupé reste coupé après redémarrage");
    assert.equal(await p3.locator('article[data-ligne="shop-intelligence-isolated"]').getAttribute("data-etat-ligne"), "disconnected");
    await p3.screenshot({ path: `${SORTIE}/13-apres-redemarrage-bureau.png`, fullPage: true });
    await c3.close();
  }
  assert.equal((await pool.query("SELECT count(*)::int n FROM frontier.lines WHERE kind = 'reserve' AND enabled")).rows[0].n, 0, "les réserves restent désactivées");
  assert.equal((await pool.query("SELECT count(*)::int n FROM frontier.lines WHERE kind = 'reserve'")).rows[0].n, 55, "50 réserves + 5 du groupe ajouté");

  // 4. Téléphone et tablette : le plan se déplace et se zoome ; les commandes restent accessibles ; pas de défilement horizontal de la page.
  for (const [nom, viewport] of [["telephone", { width: 390, height: 844 }], ["tablette", { width: 820, height: 1180 }]]) {
    const c = await contexte(viewport, { hasTouch: true, isMobile: true });
    const p = await c.newPage();
    const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    p.setDefaultTimeout(30000);
    await p.goto(`${BASE}/admin/centre-cyber-electrique`);
    await p.getByRole("heading", { name: "Centre Cyber-Électrique MKA.P-MS · Frontier OS" }).waitFor();
    await p.screenshot({ path: `${SORTIE}/20-${nom}-accueil.png` });
    await p.getByRole("navigation", { name: "Salles du centre" }).getByRole("button", { name: "Connexions", exact: true }).click();
    await p.locator('[data-groupe="boutique"] article').first().waitFor();
    assert.equal(await p.locator('[data-toile="tactile"]').count(), 1, `${nom} : mode tactile`);
    for (const nomBouton of ["Zoomer", "Dézoomer", "Ajuster le plan"]) assert.equal(await p.getByRole("button", { name: nomBouton, exact: true }).isVisible(), true, `${nom} : « ${nomBouton} » toujours accessible`);
    const zoom = async () => Number(await p.locator("[data-zoom]").getAttribute("data-zoom"));
    const z0 = await zoom();
    await p.getByRole("button", { name: "Zoomer", exact: true }).click();
    await p.getByRole("button", { name: "Zoomer", exact: true }).click();
    const z1 = await zoom();
    assert.ok(z1 > z0 * 1.4, `${nom} : zoom ${z0} → ${z1}`);
    await p.getByRole("button", { name: "Dézoomer", exact: true }).click();
    assert.ok((await zoom()) < z1);
    await p.getByRole("button", { name: "Ajuster le plan", exact: true }).click();
    assert.ok(Math.abs((await zoom()) - z0) < 0.05, "ajuster ramène l'échelle d'origine");

    // Déplacement (un doigt) et pincement (deux doigts), par événements de pointeur.
    const boite = await p.getByTestId("toile").boundingBox();
    const contenuAvant = await p.locator('[data-plan="connexions"]').evaluate((e) => e.parentElement.style.transform);
    await p.evaluate(({ x, y }) => {
      const cible = document.querySelector('[data-testid="toile"]');
      const ev = (type, id, cx, cy) => cible.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: cx, clientY: cy, bubbles: true, pointerType: "touch", isPrimary: id === 1 }));
      ev("pointerdown", 1, x, y); ev("pointermove", 1, x + 40, y + 30); ev("pointermove", 1, x + 90, y + 60); ev("pointerup", 1, x + 90, y + 60);
    }, { x: boite.x + 60, y: boite.y + 80 });
    const contenuApresPan = await p.locator('[data-plan="connexions"]').evaluate((e) => e.parentElement.style.transform);
    assert.notEqual(contenuApresPan, contenuAvant, `${nom} : le plan se déplace au doigt`);
    const zPince0 = await zoom();
    await p.evaluate(({ x, y }) => {
      const cible = document.querySelector('[data-testid="toile"]');
      const ev = (type, id, cx, cy) => cible.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: cx, clientY: cy, bubbles: true, pointerType: "touch" }));
      ev("pointerdown", 11, x - 40, y); ev("pointerdown", 12, x + 40, y);
      ev("pointermove", 11, x - 90, y); ev("pointermove", 12, x + 90, y);
      ev("pointerup", 11, x - 90, y); ev("pointerup", 12, x + 90, y);
    }, { x: boite.x + boite.width / 2, y: boite.y + boite.height / 2 });
    assert.ok((await zoom()) > zPince0 * 1.5, `${nom} : le pincement zoome`);
    await p.getByRole("button", { name: "Ajuster le plan", exact: true }).click();

    // Un appui sur un moteur ouvre toujours sa fiche (un appui n'est pas un glissement).
    await p.locator('article[data-ligne="shop-documents-only"] [data-element="3"]').tap();
    await p.getByTestId("fiche-moteur").waitFor();
    await p.screenshot({ path: `${SORTIE}/21-${nom}-fiche-moteur.png` });
    await p.getByRole("button", { name: "Fermer la fiche" }).click();
    await p.screenshot({ path: `${SORTIE}/22-${nom}-connexions.png` });
    const depasse = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert.equal(depasse, false, `${nom} : pas de défilement horizontal de la page`);
    assert.deepEqual(errs, [], `erreurs de page (${nom})`);
    await c.close();
  }
  await browser.close();

  const { rows: j } = await pool.query("SELECT action, result, count(*)::int n FROM frontier.audit_log GROUP BY 1,2 ORDER BY 1,2");
  console.log("journal :", JSON.stringify(j));
  console.log("lignes :", JSON.stringify((await pool.query("SELECT kind, enabled, count(*)::int n FROM frontier.lines GROUP BY 1,2 ORDER BY 1,2")).rows));
  console.log("commandes :", JSON.stringify((await pool.query("SELECT status, count(*)::int n FROM frontier.commands GROUP BY 1 ORDER BY 1")).rows));
  console.log("sessions :", JSON.stringify((await pool.query("SELECT protocol, status, count(*)::int n FROM frontier.test_sessions GROUP BY 1,2")).rows));
  console.log("E2E OK");
} catch (e) {
  console.error("E2E ÉCHEC :", e);
  console.error(journalServeur.slice(-2500));
  process.exitCode = 1;
} finally {
  try { await arreter(); } catch {}
  await pool.end();
}
