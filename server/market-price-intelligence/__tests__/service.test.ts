/**
 * LOT IA02G — Comparaison de prix externe par pays : tests réels.
 *
 * Exerce le vrai code de production (comparerPrixExterne réel, appeler()
 * réel, chooseProvider() réel) — seul `fetch` est injecté, même philosophie
 * que server/intelligences/__tests__/independance-openai.test.ts. Couvre les
 * scénarios obligatoires : jamais un prix inventé sans clé de recherche,
 * jamais un prix inventé sans résultat, jamais un prix retenu s'il ne
 * provient pas d'une URL réellement obtenue par la recherche.
 *
 * Lancement : `npx tsx server/market-price-intelligence/__tests__/service.test.ts`
 */
import assert from "node:assert/strict";
import { comparerPrixExterne } from "../service.js";

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

const VEHICULE = { marque: "Renault", modele: "Clio", annee: 2018, countryCode: "FR" };

async function main() {
  // ── 1. Sans WEB_SEARCH_API_KEY : jamais une recherche tentée, jamais un prix inventé ──
  restaurerEnv();
  delete process.env.WEB_SEARCH_API_KEY;
  {
    let appelReseau = false;
    const r = await comparerPrixExterne(VEHICULE, "t1", async () => {
      appelReseau = true;
      throw new Error("Aucun appel réseau attendu sans clé configurée.");
    });
    verif("1. sans clé : status unavailable", r.status === "unavailable");
    verif("1. sans clé : amount null", r.amount === null);
    verif("1. sans clé : aucun appel réseau émis", appelReseau === false);
    verif("1. sans clé : motif nomme la variable manquante", r.missingData.some((m) => m.includes("WEB_SEARCH_API_KEY")));
  }

  // ── 2. Clé présente, recherche sans résultat : indisponible, jamais un prix moyen inventé ──
  restaurerEnv();
  process.env.WEB_SEARCH_API_KEY = "test-brave-key";
  delete process.env.OPENAI_API_KEY;
  delete process.env.MISTRAL_API_KEY;
  {
    const r = await comparerPrixExterne(VEHICULE, "t2", async (url) => {
      const u = String(url);
      if (u.includes("api.search.brave.com")) return reponseJson(200, { web: { results: [] } });
      throw new Error(`URL inattendue : ${u}`);
    });
    verif("2. aucun résultat de recherche : status unavailable", r.status === "unavailable");
    verif("2. aucun résultat de recherche : amount null", r.amount === null);
  }

  // ── 3. Recherche échoue (HTTP refusé) : unavailable, motif honnête ──────
  restaurerEnv();
  process.env.WEB_SEARCH_API_KEY = "test-brave-key";
  {
    const r = await comparerPrixExterne(VEHICULE, "t3", async (url) => {
      const u = String(url);
      if (u.includes("api.search.brave.com")) return reponseJson(401, { error: "clé invalide" });
      throw new Error(`URL inattendue : ${u}`);
    });
    verif("3. recherche refusée : status unavailable", r.status === "unavailable");
    verif("3. recherche refusée : motif mentionne le HTTP 401", r.missingData.some((m) => m.includes("401")));
  }

  // ── 4. Recherche + extraction IA réussies : prix réel, sources réelles ──
  restaurerEnv();
  process.env.WEB_SEARCH_API_KEY = "test-brave-key";
  process.env.OPENAI_API_KEY = "sk-test-market-price";
  delete process.env.MISTRAL_API_KEY;
  {
    const resultatsRecherche = [
      { title: "Clio 2018 à vendre", url: "https://exemple-annonces.test/clio-1", description: "Renault Clio 2018, prix : 9 500 EUR" },
      { title: "Clio 2018 occasion", url: "https://exemple-annonces.test/clio-2", description: "À vendre 9 800 EUR, bon état" },
    ];
    const r = await comparerPrixExterne(VEHICULE, "t4", async (url) => {
      const u = String(url);
      if (u.includes("api.search.brave.com")) {
        return reponseJson(200, { web: { results: resultatsRecherche } });
      }
      if (u.includes("openai.com")) {
        if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-4o-mini" }] });
        return reponseJson(200, {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  aucunPrixTrouve: false,
                  prix: [
                    { montant: 9500, devise: "EUR", url: "https://exemple-annonces.test/clio-1" },
                    { montant: 9800, devise: "EUR", url: "https://exemple-annonces.test/clio-2" },
                  ],
                }),
              },
            },
          ],
          usage: { prompt_tokens: 40, completion_tokens: 20 },
        });
      }
      throw new Error(`URL inattendue : ${u}`);
    });
    verif("4. extraction réussie : status ok", r.status === "ok");
    verif("4. extraction réussie : amount = moyenne réelle des deux prix (9650)", r.amount === 9650);
    verif("4. extraction réussie : minAmount/maxAmount corrects", r.minAmount === 9500 && r.maxAmount === 9800);
    verif("4. extraction réussie : devise correcte", r.currency === "EUR");
    verif("4. extraction réussie : deux sources externes réelles reportées", (r.externalSources?.length ?? 0) === 2);
    verif(
      "4. extraction réussie : les URLs des sources sont exactement celles de la recherche, jamais inventées",
      (r.externalSources ?? []).every((s) => resultatsRecherche.some((res) => res.url === s.url)),
    );
  }

  // ── 5. L'IA tente de citer une URL qui n'a jamais été recherchée : rejetée, jamais retenue ──
  restaurerEnv();
  process.env.WEB_SEARCH_API_KEY = "test-brave-key";
  process.env.OPENAI_API_KEY = "sk-test-market-price";
  {
    const resultatsRecherche = [
      { title: "Clio 2018", url: "https://exemple-annonces.test/clio-reelle", description: "Sans prix mentionné explicitement." },
    ];
    const r = await comparerPrixExterne(VEHICULE, "t5", async (url) => {
      const u = String(url);
      if (u.includes("api.search.brave.com")) return reponseJson(200, { web: { results: resultatsRecherche } });
      if (u.includes("openai.com")) {
        if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-4o-mini" }] });
        return reponseJson(200, {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  aucunPrixTrouve: false,
                  prix: [{ montant: 12000, devise: "EUR", url: "https://url-halluciné.test/inexistante" }],
                }),
              },
            },
          ],
          usage: { prompt_tokens: 30, completion_tokens: 10 },
        });
      }
      throw new Error(`URL inattendue : ${u}`);
    });
    verif("5. prix sur une URL non recherchée : rejeté, jamais retenu comme réel", r.status === "unavailable");
    verif("5. prix sur une URL non recherchée : amount null", r.amount === null);
  }

  // ── 6. Recherche réussie, IA indisponible : sources brutes fournies, jamais un prix inventé ──
  restaurerEnv();
  process.env.WEB_SEARCH_API_KEY = "test-brave-key";
  delete process.env.OPENAI_API_KEY;
  delete process.env.MISTRAL_API_KEY;
  {
    const resultatsRecherche = [{ title: "Clio 2018", url: "https://exemple-annonces.test/clio-3", description: "Annonce sans prix visible." }];
    const r = await comparerPrixExterne(VEHICULE, "t6", async (url) => {
      const u = String(url);
      if (u.includes("api.search.brave.com")) return reponseJson(200, { web: { results: resultatsRecherche } });
      throw new Error(`URL inattendue : ${u}`);
    });
    verif("6. IA indisponible : status ok (les sources restent utiles)", r.status === "ok");
    verif("6. IA indisponible : amount null (aucun prix extrait)", r.amount === null);
    verif("6. IA indisponible : source réelle tout de même reportée", (r.externalSources?.length ?? 0) === 1);
  }

  restaurerEnv();

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  restaurerEnv();
  process.exitCode = 1;
});
