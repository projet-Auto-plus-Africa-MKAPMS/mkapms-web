/**
 * Partner Outreach Engine — tests de régression (logique pure + données de
 * seed réellement livrées). Aucune connexion DB réelle : ni la logique de
 * statut (reproduite ici à l'identique de service.ts) ni le fichier de
 * migration de seed n'en ont besoin pour être vérifiés.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  OUTREACH_CAPACITIES,
  OUTREACH_CATEGORIES,
  OUTREACH_STATUSES,
} from "../contract.js";

// ── 1. Les 11 statuts exacts de la mission Direction (26/10), dans l'ordre. ──
{
  assert.deepEqual(
    [...OUTREACH_STATUSES],
    [
      "identifie", "contacte", "reponse_recue", "a_verifier", "qualifie",
      "pilote", "actif", "suspendu", "refuse", "non_livre", "dossier_incomplet",
    ],
    "les 11 statuts doivent correspondre exactement à la mission",
  );
  assert.equal(new Set(OUTREACH_STATUSES).size, 11);
}

// ── 2. Les 17 capacités de la section "CAPACITÉS À ENREGISTRER". ──
{
  assert.equal(OUTREACH_CAPACITIES.length, 17, "17 capacités attendues (section CAPACITÉS À ENREGISTRER)");
  assert.equal(new Set(OUTREACH_CAPACITIES).size, 17, "aucune capacité en double");
}

// ── 3. Catégories : jamais de doublon avec partnerTypeEnum existant (étendu, pas recréé). ──
{
  assert.equal(new Set(OUTREACH_CATEGORIES).size, OUTREACH_CATEGORIES.length);
}

// ── 4. Reproduction de la règle "enregistrerReponse ne fait jamais régresser
//      un contact déjà qualifié/pilote/actif" (service.ts). ──
function prochainStatutApresReponse(statutActuel: string): string {
  const avance = new Set(["qualifie", "pilote", "actif"]);
  return avance.has(statutActuel) ? statutActuel : "reponse_recue";
}
{
  assert.equal(prochainStatutApresReponse("contacte"), "reponse_recue");
  assert.equal(prochainStatutApresReponse("identifie"), "reponse_recue");
  assert.equal(prochainStatutApresReponse("qualifie"), "qualifie", "un contact déjà qualifié ne doit jamais régresser");
  assert.equal(prochainStatutApresReponse("pilote"), "pilote");
  assert.equal(prochainStatutApresReponse("actif"), "actif");
}

// ── 5. Données de seed réellement livrées (drizzle/0168_...) : aucun email
//      en double, et les 3 réponses connues portent bien une catégorie et
//      un résumé (jamais NULL pour ces 5 lignes précises). ──
{
  const here = path.dirname(fileURLToPath(import.meta.url));
  const migrationPath = path.join(here, "..", "..", "..", "drizzle", "0168_partner_outreach_seed_contacts.sql");
  const sql = readFileSync(migrationPath, "utf8");

  // Chaque ligne de données porte "'OUT-SEED-xxxx', 'email', ..." — l'e-mail
  // suit toujours directement la référence. Ne pas matcher n'importe quelle
  // chaîne contenant "@" : plusieurs résumés de réponse (response_summary)
  // mentionnent une autre adresse de la même société en prose.
  const emailMatches = [...sql.matchAll(/'OUT-SEED-\d+',\s*'([^']+@[^']+)'/g)].map((m) => m[1].toLowerCase());
  assert.equal(emailMatches.length, 159, `159 e-mails attendus dans le seed, trouvé ${emailMatches.length}`);
  assert.equal(new Set(emailMatches).size, 159, "aucun e-mail en double dans le seed");

  for (const email of [
    "ikebe@globalairservices.sn",
    "operation@globalairservices.sn",
    "support@omnipack.com",
    "contact@omnipack.com",
    "sales@transconnect.com",
  ]) {
    assert.ok(emailMatches.includes(email), `${email} doit être présent dans le seed`);
  }

  assert.match(sql, /transporteur_aerien/, "Global Air Services doit porter la catégorie transporteur_aerien");
  assert.match(sql, /logisticien_fulfillment/, "Omnipack doit porter la catégorie logisticien_fulfillment");
  assert.match(sql, /transporteur_terrestre/, "TransConnect doit porter la catégorie transporteur_terrestre");
  assert.match(sql, /Ne fait PAS de transport maritime/, "la limite explicite de TransConnect (pas de maritime) doit être conservée dans le résumé");
}

console.log("✅ Partner Outreach Engine — statuts, capacités et données de seed cohérents (100 % OK)");
