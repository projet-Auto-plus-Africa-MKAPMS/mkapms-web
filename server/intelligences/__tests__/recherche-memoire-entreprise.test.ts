/**
 * Recherche « mémoire d'entreprise » (recherche-globale.ts, source
 * memoire_entreprise) : une question en langage naturel doit retrouver le
 * souvenir qui en parle, classé par pertinence, sans jamais remonter un
 * souvenir archivé ou hors sujet.
 *
 * Régression corrigée : la première version cherchait la question ENTIÈRE
 * comme sous-chaîne de titre/contenu, ce qui ne trouvait en pratique jamais
 * rien pour une vraie phrase — le test le démontre en comparaison.
 *
 * Ce test écrit dans in_memoire et refuse donc de tourner hors base locale
 * explicite (PGHOST=localhost, schéma complet déjà migré, DATABASE_URL vide) :
 * jamais contre une base partagée ou de production.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

const hoteLocal = ["localhost", "127.0.0.1"].includes(process.env.PGHOST ?? "") && !process.env.DATABASE_URL;

test(
  "question en langage naturel → le bon souvenir, actif uniquement, classé ; l'ancienne méthode ne trouvait rien",
  { skip: !hoteLocal && "aucune base locale explicite (PGHOST=localhost requis) — jamais de test contre une base partagée" },
  async () => {
    const { pool } = await import("../../db.js");
    const { rechercherGlobale } = await import("../recherche-globale.js");
    const marque = "test-recherche-memoire-entreprise";
    try {
      await pool.query("DELETE FROM in_memoire WHERE source = $1", [marque]);
      const inserer = (categorie: string, cle: string, titre: string, contenu: string, cycle = "actif") =>
        pool.query(
          "INSERT INTO in_memoire (categorie, cycle, cle, titre, contenu, source) VALUES ($1,$2,$3,$4,$5,$6)",
          [categorie, cycle, cle, titre, contenu, marque],
        );
      await inserer(
        "conversations",
        "conversation-9001",
        "Signature des applications Android",
        "Le PDG a demandé de signer les applications Android avec le trousseau de production puis de les déposer sur Google Play Console.",
      );
      await inserer(
        "conversations",
        "conversation-9002",
        "Prix des plaquettes de frein",
        "Discussion sur le tarif des plaquettes de frein chez un fournisseur de pièces.",
      );
      await inserer(
        "conversations",
        "conversation-9003",
        "Ancienne version Android",
        "Ancien état de la signature des applications Android, remplacé depuis.",
        "historique",
      );

      const question = "Comment signer les applications Android pour Google Play ?";
      const controle = await pool.query(
        "SELECT count(*)::int n FROM in_memoire WHERE source=$1 AND (titre ILIKE $2 OR contenu ILIKE $2 OR cle ILIKE $2)",
        [marque, `%${question}%`],
      );
      assert.equal(controle.rows[0].n, 0, "l'ancienne méthode (question entière en sous-chaîne) ne trouvait rien");

      const trouves = await rechercherGlobale(question, 1, { sources: ["memoire_entreprise"], limit: 5 });
      const propres = trouves.filter((r) => r.titre.includes("Android") || r.titre.includes("frein"));
      assert.equal(propres[0]?.titre, "[conversations] Signature des applications Android");
      assert.ok(!propres.some((r) => r.titre.includes("Ancienne version")), "un souvenir archivé ne remonte jamais");
      assert.ok(!trouves.some((r) => r.titre.includes("frein")), "un souvenir hors sujet ne remonte pas");
      assert.ok(propres[0].score > 0 && propres[0].score < 1, "score = vrai classement de pertinence, comparable aux autres sources");

      assert.deepEqual(await rechercherGlobale("?!", 1, { sources: ["memoire_entreprise"], limit: 5 }), []);
    } finally {
      await pool.query("DELETE FROM in_memoire WHERE source = $1", [marque]);
      await pool.end();
    }
  },
);
