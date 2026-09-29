/**
 * Coffre de secrets (server/intelligences/coffre.ts).
 *
 * Partie 1 — sans base : chiffrement, altération, mauvais propriétaire,
 * mauvaise clé, validation de la clé maître, aperçus masqués.
 *
 * Partie 2 — sur une base Postgres LOCALE jetable uniquement : la migration
 * 0150 réellement appliquée, dépôt/lecture serveur/remplacement/suppression,
 * journal, cloisonnement entre propriétaires et refus sans clé maître. Cette
 * partie refuse de tourner si la connexion ne vise pas explicitement la
 * machine locale (PGHOST=localhost) ou si DATABASE_URL est renseignée : elle ne
 * doit jamais écrire dans une base partagée ou de production.
 *
 * Toutes les valeurs ci-dessous sont des fixtures manifestement fictives.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { apercuDe, chiffrer, cleMaitre, dechiffrer } from "../coffre.js";

const CLE_A = randomBytes(32);
const CLE_B = randomBytes(32);
const MOT_DE_PASSE = "fixture-mot-de-passe-fictif-1";

test("chiffrement : aller-retour, et aucune trace du clair dans ce qui est stocké", () => {
  const clair = JSON.stringify({ type: "identifiants", identifiant: "test@example.invalid", motDePasse: MOT_DE_PASSE });
  const enc = chiffrer(CLE_A, 7, clair);
  assert.equal(dechiffrer(CLE_A, 7, enc), clair);
  const stocke = JSON.stringify(enc);
  assert.ok(!stocke.includes(MOT_DE_PASSE));
  assert.ok(!stocke.includes("example.invalid"));
  assert.ok(!Buffer.from(enc.contenuChiffre, "base64").toString("utf8").includes(MOT_DE_PASSE));
});

test("chiffrement : deux dépôts identiques donnent deux chiffrés différents (sel et IV aléatoires)", () => {
  const a = chiffrer(CLE_A, 7, "meme valeur");
  const b = chiffrer(CLE_A, 7, "meme valeur");
  assert.notEqual(a.contenuChiffre, b.contenuChiffre);
  assert.notEqual(a.sel, b.sel);
  assert.notEqual(a.iv, b.iv);
});

test("chiffrement : mauvaise clé, autre propriétaire, contenu ou étiquette altérés → refus", () => {
  const enc = chiffrer(CLE_A, 7, "valeur secrète fictive");
  assert.throws(() => dechiffrer(CLE_B, 7, enc));
  assert.throws(() => dechiffrer(CLE_A, 8, enc));
  const octets = Buffer.from(enc.contenuChiffre, "base64");
  octets[0] ^= 0xff;
  assert.throws(() => dechiffrer(CLE_A, 7, { ...enc, contenuChiffre: octets.toString("base64") }));
  const etiquette = Buffer.from(enc.tag, "base64");
  etiquette[0] ^= 0xff;
  assert.throws(() => dechiffrer(CLE_A, 7, { ...enc, tag: etiquette.toString("base64") }));
});

test("clé maître : absente, trop courte ou non hexadécimale → refusée ; 64 caractères hexadécimaux → acceptée", () => {
  const ancienne = process.env.COFFRE_CLE_MAITRE;
  try {
    delete process.env.COFFRE_CLE_MAITRE;
    assert.equal(cleMaitre(), null);
    process.env.COFFRE_CLE_MAITRE = "abcd";
    assert.equal(cleMaitre(), null);
    process.env.COFFRE_CLE_MAITRE = "z".repeat(64);
    assert.equal(cleMaitre(), null);
    process.env.COFFRE_CLE_MAITRE = randomBytes(32).toString("hex");
    assert.equal(cleMaitre()?.length, 32);
  } finally {
    if (ancienne === undefined) delete process.env.COFFRE_CLE_MAITRE;
    else process.env.COFFRE_CLE_MAITRE = ancienne;
  }
});

test("aperçus : jamais de mot de passe, jamais la clé entière", () => {
  const ident = apercuDe({ type: "identifiants", identifiant: "jean.dupont@example.invalid", motDePasse: MOT_DE_PASSE, adresse: "https://boutique.example.invalid/admin" });
  assert.ok(!ident.includes(MOT_DE_PASSE));
  assert.ok(!ident.includes("jean.dupont"));
  assert.match(ident, /^j\*\*\*@example\.invalid/);
  const cle = "cle-api-fictive-0123456789abcdef";
  const apercuCle = apercuDe({ type: "cle_api", valeur: cle });
  assert.ok(!apercuCle.includes(cle));
  assert.ok(apercuCle.endsWith("cdef"));
  assert.equal(apercuDe({ type: "cle_api", valeur: "court-123" }), "••••");
});

const hoteLocal = ["localhost", "127.0.0.1"].includes(process.env.PGHOST ?? "") && !process.env.DATABASE_URL;

test("base locale : migration 0150, dépôt, usage serveur journalisé, cloisonnement, refus sans clé", { skip: !hoteLocal && "aucune base locale explicite (PGHOST=localhost requis) — jamais de test contre une base partagée" }, async () => {
  const { pool } = await import("../../db.js");
  const coffre = await import("../coffre.js");
  const ancienne = process.env.COFFRE_CLE_MAITRE;
  try {
    // Migration réelle, appliquée telle qu'elle sera déployée, sur une base vierge.
    await pool.query("DROP TABLE IF EXISTS in_coffre_acces, in_coffre_secrets CASCADE");
    for (const instruction of readFileSync("drizzle/0150_coffre_secrets.sql", "utf8").split("--> statement-breakpoint")) {
      if (instruction.trim()) await pool.query(instruction);
    }

    // Sans clé maître : refus net, rien d'écrit.
    delete process.env.COFFRE_CLE_MAITRE;
    const refus = await coffre.ajouterSecret({ ownerId: 901, nom: "Refusé", contenu: { type: "cle_api", valeur: "valeur-fictive-12345" } });
    assert.equal(refus.ok, false);
    assert.match(refus.detail, /COFFRE_CLE_MAITRE/);
    assert.equal((await pool.query("SELECT count(*)::int n FROM in_coffre_secrets")).rows[0].n, 0);
    assert.equal((await coffre.etatCoffre(901)).disponible, false);

    process.env.COFFRE_CLE_MAITRE = randomBytes(32).toString("hex");
    assert.equal((await coffre.etatCoffre(901)).disponible, true);

    // Dépôt : ni la valeur ni le mot de passe ne se retrouvent nulle part dans la ligne stockée.
    const depot = await coffre.ajouterSecret({
      ownerId: 901,
      nom: "Boutique — administrateur",
      service: "Boutique",
      contenu: { type: "identifiants", identifiant: "admin@example.invalid", motDePasse: MOT_DE_PASSE, adresse: "https://boutique.example.invalid" },
    });
    assert.equal(depot.ok, true, depot.detail);
    assert.ok(!depot.detail.includes(MOT_DE_PASSE));
    const ligne = (await pool.query("SELECT t::text AS brut FROM in_coffre_secrets t WHERE id=$1", [depot.id])).rows[0].brut as string;
    assert.ok(!ligne.includes(MOT_DE_PASSE));
    assert.ok(!ligne.includes("admin@example.invalid"));

    // Doublon refusé ; contenu invalide refusé sans écho de la valeur.
    const doublon = await coffre.ajouterSecret({ ownerId: 901, nom: "Boutique — administrateur", contenu: { type: "cle_api", valeur: "valeur-fictive-12345" } });
    assert.equal(doublon.ok, false);
    const invalide = await coffre.ajouterSecret({ ownerId: 901, nom: "Invalide", contenu: { type: "identifiants", identifiant: "", motDePasse: MOT_DE_PASSE, extra: 1 } });
    assert.equal(invalide.ok, false);
    assert.ok(!invalide.detail.includes(MOT_DE_PASSE));

    // La liste ne rend que des métadonnées masquées.
    const liste = await coffre.listerSecrets(901);
    assert.equal(liste.length, 1);
    assert.ok(!JSON.stringify(liste).includes(MOT_DE_PASSE));
    assert.equal(liste[0].dernierUsageAt, null);
    assert.deepEqual(await coffre.listerSecrets(902), []);

    // Ce que le MODÈLE peut voir : l'outil réel, passé par l'exécuteur, ne rend que des métadonnées masquées.
    const { executer } = await import("../outils/executeur.js");
    const { OUTILS } = await import("../outils/registre.js");
    const outil = OUTILS.find((o) => o.toolId === "securite.listerSecrets");
    assert.ok(outil && outil.enabled && outil.implementationStatus === "IMPLEMENTED" && outil.allowedRoles.join() === "super_admin");
    const vuParLeModele = await executer(outil, "{}", { role: "super_admin", moteur: "intelligences", actorId: 901 });
    assert.equal(vuParLeModele.statut, "execute", vuParLeModele.motif);
    const texteModele = JSON.stringify(vuParLeModele.resultat);
    assert.ok(texteModele.includes("Boutique — administrateur"));
    assert.ok(!texteModele.includes(MOT_DE_PASSE));
    assert.ok(!texteModele.includes("admin@example.invalid"));
    assert.equal((await executer(outil, "{}", { role: "super_admin", moteur: "intelligences" })).statut, "erreur");
    const autreCompte = await executer(outil, "{}", { role: "super_admin", moteur: "intelligences", actorId: 902 });
    assert.deepEqual((autreCompte.resultat as { secrets: unknown[] }).secrets, []);

    // Usage serveur : motif obligatoire, cloisonnement entre propriétaires, journal.
    const sansMotif = await coffre.lireSecretPourOutil({ ownerId: 901, nom: "Boutique — administrateur", outil: "test.outil", motif: "" });
    assert.equal(sansMotif.ok, false);
    const autreProprietaire = await coffre.lireSecretPourOutil({ ownerId: 902, nom: "Boutique — administrateur", outil: "test.outil", motif: "essai croisé" });
    assert.equal(autreProprietaire.ok, false);
    const lecture = await coffre.lireSecretPourOutil({ ownerId: 901, nom: "Boutique — administrateur", outil: "test.outil", motif: "vérification de configuration" });
    assert.equal(lecture.ok, true);
    if (lecture.ok && lecture.contenu.type === "identifiants") {
      assert.equal(lecture.contenu.motDePasse, MOT_DE_PASSE);
      assert.equal(lecture.contenu.identifiant, "admin@example.invalid");
    } else assert.fail("contenu attendu de type identifiants");
    assert.notEqual((await coffre.listerSecrets(901))[0].dernierUsageAt, null);

    const journal = await coffre.journalCoffre(901);
    assert.deepEqual(journal.map((j) => `${j.action}:${j.ok}`).sort(), ["creer:true", "utiliser:false", "utiliser:true"].sort());
    assert.ok(!JSON.stringify(journal).includes(MOT_DE_PASSE));
    // L'autre propriétaire ne voit que sa propre tentative refusée, jamais les entrées du premier.
    const journalAutre = await coffre.journalCoffre(902);
    assert.deepEqual(journalAutre.map((j) => `${j.action}:${j.ok}`), ["utiliser:false"]);

    // Mauvaise clé maître (changée depuis le dépôt) : illisible, refus journalisé, aucun détail technique.
    const cleDeDepot = process.env.COFFRE_CLE_MAITRE;
    process.env.COFFRE_CLE_MAITRE = randomBytes(32).toString("hex");
    const illisible = await coffre.lireSecretPourOutil({ ownerId: 901, nom: "Boutique — administrateur", outil: "test.outil", motif: "clé changée" });
    assert.equal(illisible.ok, false);
    process.env.COFFRE_CLE_MAITRE = cleDeDepot;

    // Fichier : aller-retour binaire fidèle.
    const octets = randomBytes(2048);
    const fichier = await coffre.ajouterSecret({ ownerId: 901, nom: "Trousseau fictif", contenu: { type: "fichier", nomFichier: "fictif.jks", contenuBase64: octets.toString("base64") } });
    assert.equal(fichier.ok, true, fichier.detail);
    const relu = await coffre.lireSecretPourOutil({ ownerId: 901, nom: "Trousseau fictif", outil: "test.outil", motif: "aller-retour" });
    assert.ok(relu.ok && relu.contenu.type === "fichier" && Buffer.from(relu.contenu.contenuBase64, "base64").equals(octets));

    // Remplacement : la valeur change, le type ne change pas.
    const remplace = await coffre.remplacerSecret({ ownerId: 901, id: depot.id!, contenu: { type: "identifiants", identifiant: "admin@example.invalid", motDePasse: "fixture-nouveau-mot-de-passe-2" } });
    assert.equal(remplace.ok, true, remplace.detail);
    const apresRemplacement = await coffre.lireSecretPourOutil({ ownerId: 901, nom: "Boutique — administrateur", outil: "test.outil", motif: "après remplacement" });
    assert.ok(apresRemplacement.ok && apresRemplacement.contenu.type === "identifiants" && apresRemplacement.contenu.motDePasse === "fixture-nouveau-mot-de-passe-2");
    const changeType = await coffre.remplacerSecret({ ownerId: 901, id: depot.id!, contenu: { type: "cle_api", valeur: "valeur-fictive-12345" } });
    assert.equal(changeType.ok, false);
    assert.equal((await coffre.remplacerSecret({ ownerId: 902, id: depot.id!, contenu: { type: "identifiants", identifiant: "x", motDePasse: "y" } })).ok, false);

    // Suppression : cloisonnée, définitive ; le journal survit.
    assert.equal((await coffre.supprimerSecret({ ownerId: 902, id: depot.id! })).ok, false);
    assert.equal((await coffre.supprimerSecret({ ownerId: 901, id: depot.id! })).ok, true);
    assert.equal((await coffre.listerSecrets(901)).length, 1);
    assert.ok((await coffre.journalCoffre(901, 200)).some((j) => j.action === "supprimer"));
  } finally {
    await pool.query("DROP TABLE IF EXISTS in_coffre_acces, in_coffre_secrets CASCADE");
    if (ancienne === undefined) delete process.env.COFFRE_CLE_MAITRE;
    else process.env.COFFRE_CLE_MAITRE = ancienne;
    await pool.end();
  }
});
