/**
 * Nom des conversations d'après leur sujet (conversation-titre.ts).
 * La partie base de données refuse de tourner hors base locale explicite
 * (PGHOST=localhost, schéma migré, DATABASE_URL vide) — jamais contre une base
 * partagée ou de production.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { nettoyerTitre, nommerSiPremierEchange, titreProvisoire } from "../conversation-titre.js";

const hoteLocal = ["localhost", "127.0.0.1"].includes(process.env.PGHOST ?? "") && !process.env.DATABASE_URL;

test("titre provisoire : propre, court, sans politesse ni ponctuation finale", () => {
  assert.equal(titreProvisoire("Bonjour, peux-tu me dire comment signer les applications Android ? Merci d'avance."), "Dire comment signer les applications Android");
  assert.equal(titreProvisoire("Prix des plaquettes de frein"), "Prix des plaquettes de frein");
  const long = titreProvisoire("Je voudrais comprendre en détail pourquoi le déploiement automatique des applications mobiles échoue chaque fois que je pousse du code");
  assert.ok(long.length <= 61 && long.endsWith("…"), `coupé proprement : ${long}`);
  assert.ok(!long.includes("  "));
  assert.equal(titreProvisoire("   "), "Nouvelle conversation");
});

test("nettoyage du titre renvoyé par le moteur", () => {
  assert.equal(nettoyerTitre('"Signature des applications Android."'), "Signature des applications Android");
  assert.equal(nettoyerTitre("Titre : Déploiement Railway\nautre ligne"), "Déploiement Railway");
  assert.equal(nettoyerTitre("# **Mémoire** de l'équipe"), "Mémoire de l'équipe");
  assert.equal(nettoyerTitre(""), null);
  assert.equal(nettoyerTitre("ab"), null);
  assert.equal(nettoyerTitre("x".repeat(90)), null);
});

test(
  "premier échange → titre de sujet ; titre renommé à la main ou moteur en panne → jamais touché",
  { skip: !hoteLocal && "aucune base locale explicite (PGHOST=localhost requis) — jamais de test contre une base partagée" },
  async () => {
    const { pool } = await import("../../db.js");
    const marque = "test-conversation-titre";
    const creer = async (titre: string, messages: number) => {
      const r = await pool.query(
        "INSERT INTO in_sessions (cote, titre, user_id, domaine, messages) VALUES ('direction',$1,1,$2,$3) RETURNING id",
        [titre, marque, messages],
      );
      return r.rows[0].id as number;
    };
    const titreDe = async (id: number) => (await pool.query("SELECT titre FROM in_sessions WHERE id=$1", [id])).rows[0].titre as string;
    const faux = (texte: string, ok = true) => (async () => ({ ok, texte })) as never;
    try {
      await pool.query("DELETE FROM in_sessions WHERE domaine=$1", [marque]);
      const question = "Comment signer les applications Android pour Google Play ?";

      const a = await creer(titreProvisoire(question), 2);
      assert.equal(await nommerSiPremierEchange(a, question, "Voici la procédure…", { appeler: faux('"Signature des applications Android"') }), "Signature des applications Android");
      assert.equal(await titreDe(a), "Signature des applications Android");
      // Rejoué : le titre n'est plus le provisoire, donc plus jamais modifié.
      assert.equal(await nommerSiPremierEchange(a, question, "Voici…", { appeler: faux("Autre titre") }), null);
      assert.equal(await titreDe(a), "Signature des applications Android");

      const b = await creer("Titre choisi par le PDG", 2);
      assert.equal(await nommerSiPremierEchange(b, question, "Voici…", { appeler: faux("Titre du moteur") }), null);
      assert.equal(await titreDe(b), "Titre choisi par le PDG");

      const c = await creer(titreProvisoire(question), 2);
      assert.equal(await nommerSiPremierEchange(c, question, "Voici…", { appeler: faux("", false) }), null);
      assert.equal(await titreDe(c), titreProvisoire(question), "moteur indisponible : le titre provisoire reste");

      const d = await creer(titreProvisoire(question), 6);
      assert.equal(await nommerSiPremierEchange(d, question, "Voici…", { appeler: faux("Titre tardif") }), null, "seulement après le premier échange");
    } finally {
      await pool.query("DELETE FROM in_sessions WHERE domaine=$1", [marque]);
      await pool.end();
    }
  },
);
