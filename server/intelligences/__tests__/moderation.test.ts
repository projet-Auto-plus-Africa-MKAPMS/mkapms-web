/**
 * Demande du PDG : configurer les capacités OpenAI réellement utiles à
 * MKA.P-MS AI. Audit préalable de server/reputation-engine/fraud.ts : la
 * détection anti-faux-avis (point 49) analyse uniquement le COMPORTEMENT
 * (rafales, doublons, conflit d'intérêt) — jamais le CONTENU réel d'un
 * commentaire. Un avis déposé normalement mais contenant du harcèlement ou
 * du contenu à caractère sexuel passait entièrement inaperçu : lacune réelle,
 * jamais construite jusqu'ici.
 *
 * `modererTexte()` (server/intelligences/provider.ts) comble ce point via la
 * Moderation API OpenAI (endpoint /v1/moderations, gratuit chez OpenAI,
 * modèle réel "omni-moderation-latest" — vérifié présent sur le compte de
 * production le 2026-09-26, jamais un nom supposé). Ce test exerce la vraie
 * fonction de production ; seul `fetch` est injecté, jamais un appel réseau
 * réel — même philosophie que fuite-fournisseurs.test.ts.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/moderation.test.ts`
 */
import assert from "node:assert/strict";
import { modererTexte } from "../provider.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const ENV_SAUVEGARDE = { ...process.env };
function restaurerEnv() {
  for (const cle of Object.keys(process.env)) if (!(cle in ENV_SAUVEGARDE)) delete process.env[cle];
  Object.assign(process.env, ENV_SAUVEGARDE);
}

function reponseJson(status: number, corps: unknown): Response {
  return new Response(JSON.stringify(corps), { status, headers: { "Content-Type": "application/json" } });
}

async function main() {
  // ── 1. Clé absente : jamais un texte supposé sain ──────────────────────
  restaurerEnv();
  delete process.env.OPENAI_API_KEY;
  {
    const r = await modererTexte("n'importe quel texte", async () => {
      throw new Error("fetch ne doit jamais être appelé sans clé configurée");
    });
    verif("1. sans clé : disponible=false", r.disponible === false);
    verif("1. sans clé : signale=false (jamais une fausse alerte, jamais un faux sain)", r.signale === false);
    verif("1. sans clé : motif réel explique l'absence", r.motif.includes("OPENAI_API_KEY"));
  }

  // ── 2. Contenu réellement signalé par OpenAI ────────────────────────────
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-1234";
  {
    const appels: unknown[] = [];
    const r = await modererTexte("texte de test", async (url, options) => {
      appels.push(url);
      const corps = JSON.parse(String((options as RequestInit)?.body ?? "{}")) as Record<string, unknown>;
      assert.equal(corps.model, "omni-moderation-latest");
      assert.equal(corps.input, "texte de test");
      return reponseJson(200, { results: [{ flagged: true, categories: { harassment: true, sexual: false, violence: true } }] });
    });
    verif("2. contenu signalé : disponible=true", r.disponible === true);
    verif("2. contenu signalé : signale=true", r.signale === true);
    verif("2. contenu signalé : catégories réelles uniquement (jamais une liste supposée)", r.categories.sort().join(",") === "harassment,violence");
    verif("2. un seul appel HTTP réel", appels.length === 1);
    verif("2. appel réel au bon endpoint", String(appels[0]).includes("/v1/moderations"));
  }

  // ── 3. Contenu réellement sain ───────────────────────────────────────────
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-1234";
  {
    const r = await modererTexte("Merci beaucoup, très bon vendeur.", async () =>
      reponseJson(200, { results: [{ flagged: false, categories: {} }] }),
    );
    verif("3. contenu sain : disponible=true", r.disponible === true);
    verif("3. contenu sain : signale=false", r.signale === false);
    verif("3. contenu sain : aucune catégorie", r.categories.length === 0);
  }

  // ── 4. OpenAI refuse l'appel (HTTP 401/500) : jamais confondu avec un contenu sain ──
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-1234";
  {
    const r = await modererTexte("texte", async () => reponseJson(500, { error: { message: "panne interne" } }));
    verif("4. HTTP 500 : disponible=false", r.disponible === false);
    verif("4. HTTP 500 : signale=false (jamais une fausse approbation)", r.signale === false);
    verif("4. HTTP 500 : motif réel conservé", r.motif.includes("500") && r.motif.includes("panne interne"));
  }

  // ── 5. Panne réseau : jamais un crash, jamais une approbation silencieuse ──
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-1234";
  {
    const r = await modererTexte("texte", async () => {
      throw new Error("ECONNREFUSED (simulé)");
    });
    verif("5. panne réseau : disponible=false, jamais un crash", r.disponible === false);
    verif("5. panne réseau : motif réel conservé", r.motif.includes("ECONNREFUSED"));
  }

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(ok === total ? 0 : 1)).catch((err) => {
  console.error(err);
  process.exit(1);
});
