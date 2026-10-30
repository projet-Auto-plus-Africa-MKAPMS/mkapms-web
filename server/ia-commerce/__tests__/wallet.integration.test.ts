/**
 * Portefeuille de crédits AL-HOUDOUD·M — grand livre réel : crédit, débit, solde après
 * mouvement, jamais de passage en dessous de zéro sans trace. Base LOCALE jetable
 * (SHOP_KNOWLEDGE_TEST_DB, base « core_ai_test ») — jamais une base partagée. Ne dépend
 * que des deux tables nouvelles (ia_credit_wallets/ia_credit_ledger) : le reste de la
 * chaîne de paiement (payment_products, subscriptions) est couvert par ses propres tests.
 */
import test from "node:test";
import assert from "node:assert/strict";

test("portefeuille IA : crédit, débit, grand livre cohérent", async () => {
  const url = new URL(process.env.SHOP_KNOWLEDGE_TEST_DB || "");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  assert.equal(url.pathname, "/core_ai_test");
  process.env.DATABASE_URL = url.href;
  const { pool } = await import("../../db.js");
  try {
    await pool.query("DROP TABLE IF EXISTS ia_credit_ledger, ia_credit_wallets");
    await pool.query(`
      CREATE TABLE ia_credit_wallets (
        id bigserial PRIMARY KEY,
        user_id integer NOT NULL UNIQUE,
        balance_unites numeric(14, 2) NOT NULL DEFAULT '0',
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE TABLE ia_credit_ledger (
        id bigserial PRIMARY KEY,
        user_id integer NOT NULL,
        type varchar(24) NOT NULL,
        unites numeric(14, 2) NOT NULL,
        solde_apres numeric(14, 2) NOT NULL,
        payment_id integer,
        af_cost_entry_id integer,
        note text,
        metadata jsonb,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);

    const { creditWallet, debitWallet, walletBalance, walletLedger } = await import("../service.js");
    const userId = 999001;

    assert.equal(await walletBalance(userId), 0, "un portefeuille jamais utilisé commence à zéro");

    await creditWallet(userId, 33, { type: "achat", note: "Recharge 5 €" });
    assert.equal(await walletBalance(userId), 33);

    await creditWallet(userId, 200, { type: "abonnement", note: "Période Particulier Essentiel" });
    assert.equal(await walletBalance(userId), 233);

    await debitWallet(userId, 50, { note: "Consommation réelle mesurée" });
    assert.equal(await walletBalance(userId), 183);

    const ledger = await walletLedger(userId, 10);
    assert.equal(ledger.length, 3, "trois mouvements doivent apparaître au grand livre");
    // Le plus récent en premier (desc createdAt) : le débit de 50.
    assert.equal(Number(ledger[0].unites), -50);
    assert.equal(Number(ledger[0].soldeApres), 183);
    assert.equal(ledger[0].type, "consommation");

    // Jamais un crédit/débit non positif accepté silencieusement.
    await assert.rejects(() => creditWallet(userId, 0, { type: "achat" }));
    await assert.rejects(() => debitWallet(userId, -1, {}));

    // Un deuxième utilisateur ne doit jamais voir le solde du premier (pas de fuite croisée).
    assert.equal(await walletBalance(999002), 0);
  } finally {
    const { pool } = await import("../../db.js");
    await pool.query("DROP TABLE IF EXISTS ia_credit_ledger, ia_credit_wallets");
    await pool.end();
  }
});
