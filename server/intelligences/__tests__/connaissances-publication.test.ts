/**
 * Connaissances de publication (Android, Apple, Google Play, GitHub, Railway) (connaissances-publication.ts).
 *
 * Partie 1 — sans base : chaque entrée a un titre unique, une source
 * documentée, aucun secret, et aucun chiffre de version figé qui dirait
 * autre chose que le code (versionCode dérivé de package.json).
 *
 * Partie 2 — base LOCALE uniquement (PGHOST=localhost, schéma déjà migré) :
 * la pose est idempotente, et une vraie question en langage naturel retrouve
 * la bonne entrée par la même recherche que celle de la conversation.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { CONNAISSANCES_PUBLICATION } from "../connaissances-publication.js";

test("entrées : titres uniques, sources documentées, aucun secret, pas de versionCode figé faux", () => {
  const titres = CONNAISSANCES_PUBLICATION.map((c) => c.titre);
  assert.equal(new Set(titres).size, titres.length);
  assert.ok(CONNAISSANCES_PUBLICATION.length >= 13);
  for (const c of CONNAISSANCES_PUBLICATION) {
    assert.ok(c.contenu.length > 200 && c.source.length > 5, c.titre);
    assert.ok(!/(?:\bsk-|-----BEGIN|password\s*[:=]|mot de passe\s*[:=])/i.test(c.contenu), `secret apparent dans « ${c.titre} »`);
    assert.ok(!c.contenu.includes("10705"), `versionCode figé périmé dans « ${c.titre} »`);
  }
});

const hoteLocal = ["localhost", "127.0.0.1"].includes(process.env.PGHOST ?? "") && !process.env.DATABASE_URL;

test(
  "base locale : pose idempotente, et une question en langage naturel retrouve la bonne entrée",
  { skip: !hoteLocal && "aucune base locale explicite (PGHOST=localhost requis) — jamais de test contre une base partagée" },
  async () => {
    const { pool } = await import("../../db.js");
    const { seedConnaissancesPublication } = await import("../connaissances-publication.js");
    const { rechercher } = await import("../connaissance.js");
    const nettoyer = () => pool.query("DELETE FROM in_connaissance WHERE auteur = 'MKA.P-MS AI — fondations' AND categorie = 'procedures'");
    try {
      await nettoyer();
      const premiere = await seedConnaissancesPublication();
      assert.equal(premiere.nouvelles, CONNAISSANCES_PUBLICATION.length);
      assert.equal((await seedConnaissancesPublication()).nouvelles, 0, "rejouée, la pose ne réécrit rien");

      const cas: [string, string][] = [
        ["Comment signer un paquet Android ?", "Signer un paquet Android"],
        ["Comment publier l'application sur Google Play Console ?", "Publier sur Google Play Console"],
        ["Où mettre le mot de passe du trousseau et les identifiants ?", "Identifiants et secrets"],
        ["Quels identifiants faut-il pour publier sur l'App Store d'Apple ?", "Apple"],
        ["Comment connecter GitHub avec un jeton ?", "GitHub"],
        ["Le moteur peut-il déployer sur Railway ?", "Railway"],
        ["Comment vérifier la connexion GitHub et voir les exécutions du workflow Android ?", "outils de lecture"],
      ];
      for (const [question, extraitTitre] of cas) {
        const trouves = await rechercher(question, ["interne"], 5);
        assert.ok(
          trouves.slice(0, 3).some((t) => t.titre.includes(extraitTitre)),
          `« ${question} » devrait faire remonter « ${extraitTitre} » (trouvé : ${trouves.map((t) => t.titre).join(" | ")})`,
        );
      }
    } finally {
      await nettoyer();
      await pool.end();
    }
  },
);
