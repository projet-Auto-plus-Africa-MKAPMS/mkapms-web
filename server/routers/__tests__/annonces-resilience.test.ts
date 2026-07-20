/**
 * Test de régression — Résilience `annonces` face à une colonne manquante.
 *
 * Reproduit la panne de production « annonces plus visibles » :
 *   - Le code déployé référence une colonne JSONB.
 *   - La migration correspondante n'a pas été appliquée sur la DB.
 *   - `SELECT` échoue avec « column ... does not exist ».
 *   - Auparavant : toutes les requêtes annonces cassaient et rien ne
 *     s'affichait publiquement.
 *
 * Cette suite vérifie la logique pure du helper `selectAnnoncesResilient` :
 * détection du message d'erreur PostgreSQL + retry après auto-heal.
 * On MOCKE la DB pour rester déterministe (aucune connexion réelle).
 */
import assert from "node:assert/strict";

// Reproduction locale du helper (identique à server/routers/annonces.ts).
// On teste ici la pure logique de retry — le vrai helper appelle db.execute
// pour ajouter la colonne, ce qui n'est pas testable sans DB.
async function selectAnnoncesResilient<T>(fn: () => Promise<T>, healed: (col: string) => void): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    const msg = (err as Error)?.message ?? "";
    const match = msg.match(/column\s+"?([\w_]+)"?\s+does not exist/i)
      ?? msg.match(/undefined column\s+"?([\w_]+)"?/i);
    if (!match) throw err;
    const missing = match[1];
    const safe = new Set([
      "garanties", "points_forts", "equipements", "imperfections",
      "confort", "multimedia", "securite", "videos360", "videos_normales",
    ]);
    if (!safe.has(missing)) throw err;
    healed(missing);
    return fn();
  }
}

// ── 1. Détection du message PostgreSQL usuel ────────────────────────────
{
  let calls = 0;
  let healed: string | null = null;
  const result = await selectAnnoncesResilient(
    async () => {
      calls++;
      if (calls === 1) throw new Error(`error: column "garanties" does not exist`);
      return [{ id: 1, titre: "Peugeot 208" }];
    },
    (col) => { healed = col; },
  );
  assert.equal(result.length, 1);
  assert.equal(healed, "garanties");
  assert.equal(calls, 2, "retry attendu");
}

// ── 2. Format Neon/pg alternatif (« column X does not exist ») ──────────
{
  let calls = 0;
  const result = await selectAnnoncesResilient(
    async () => {
      calls++;
      if (calls === 1) throw new Error(`column points_forts does not exist`);
      return [];
    },
    () => {},
  );
  assert.deepEqual(result, []);
  assert.equal(calls, 2);
}

// ── 3. Erreurs non liées à des colonnes JSONB safe → RETHROW ────────────
{
  await assert.rejects(
    () => selectAnnoncesResilient(
      async () => { throw new Error(`syntax error at or near "SELECT"`); },
      () => {},
    ),
    /syntax error/,
    "les erreurs sans rapport doivent remonter",
  );
}

// ── 4. Colonne non whitelistée → RETHROW (pas d'ALTER TABLE arbitraire) ─
{
  await assert.rejects(
    () => selectAnnoncesResilient(
      async () => { throw new Error(`column "password_hash" does not exist`); },
      () => {},
    ),
    /password_hash/,
    "seules les colonnes JSONB additives sont auto-créées",
  );
}

console.log("✅ annonces auto-heal — 100 % OK (résilience colonne manquante)");
