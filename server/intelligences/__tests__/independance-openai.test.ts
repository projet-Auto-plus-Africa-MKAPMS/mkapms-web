/**
 * LOT IA02D, point 19 — « Test principal » : simuler OpenAI indisponible et
 * produire un vrai rapport d'indépendance (quelles capacités continuent,
 * lesquelles basculent sur repli, lesquelles cassent, pourquoi).
 *
 * Exerce le vrai code de production (appeler() réel, chooseProvider() réel,
 * demander() réel), seul `fetch` est injecté — même philosophie que
 * server/intelligences/__tests__/fuite-fournisseurs.test.ts, qui couvre déjà
 * HTTP 401/429/500, timeout, absence de clé, fournisseur enregistré non
 * câblé, repli réussi/échoué. Ce fichier ne duplique pas ces scénarios : il
 * les rejoue sous l'angle spécifique demandé par la direction — « qu'est-ce
 * qui casse si je coupe OpenAI aujourd'hui ? » — et couvre deux scénarios
 * du point 6 non encore exercés ailleurs : modèle supprimé du compte, et
 * capacité désactivée par la direction.
 *
 * Scénarios du point 6 déjà couverts ailleurs, non rejoués ici : provider
 * offline / clé absente / HTTP 401 / HTTP 429 / HTTP 5xx / timeout / repli
 * réussi / repli échoué (fuite-fournisseurs.test.ts, scénarios 1-9). Restent
 * de vrais écarts, honnêtement non couverts par ce dépôt à ce jour : pays
 * interdit (aucun moteur ne relie encore la Fabrique Intelligence au Country
 * Policy pour refuser un fournisseur par pays) et provider désactivé par le
 * PDG au niveau fournisseur (server/ai-fabric/service.ts::setProviderSuspended
 * existe et est exercé côté server/intelligences/actions.ts, mais pas encore
 * dans un scénario d'indépendance dédié) — consignés dans le rapport de
 * clôture, pas masqués.
 *
 * Lancement : `npx tsx server/intelligences/__tests__/independance-openai.test.ts`
 */
import assert from "node:assert/strict";
import { appeler } from "../provider.js";
import { db } from "../../db.js";
import { inCapaciteEtat } from "../schema.js";
import { eq } from "drizzle-orm";
import { enregistrerTestIndependance } from "../../governance/dependencies.js";

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

const ENTREE_BASE = {
  capacite: "ia_texte" as const,
  tache: "test_independance_openai",
  moteur: "intelligences",
  systeme: "test",
  message: "Bonjour",
  confidentialite: "interne" as const,
};

const rapport: string[] = [];

async function main() {
  // ── 1. OpenAI et Mistral tous deux configurés, OpenAI en panne totale ──
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-openai-down";
  process.env.MISTRAL_API_KEY = "mistral-test-actif";
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_LLM_URL;
  {
    // L'ordre réel de sélection (server/ai-fabric/service.ts::chooseProvider)
    // dépend de l'état constaté en base (lastUsedAt), pas d'un ordre fixe —
    // même leçon que fuite-fournisseurs.test.ts, scénario 8 : le mock réagit
    // à l'URL réellement appelée, l'assertion porte sur le résultat, jamais
    // sur quel fournisseur a été essayé en premier.
    let appelsOpenai = 0;
    let appelsMistral = 0;
    const r = await appeler(ENTREE_BASE, async (url) => {
      const u = String(url);
      if (u.includes("openai.com")) {
        if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-4o-mini" }] });
        appelsOpenai++;
        return reponseJson(500, { error: { message: "Panne totale simulée — indisponibilité complète du fournisseur." } });
      }
      if (u.includes("mistral.ai")) {
        if (u.includes("/models")) return reponseJson(200, { data: [{ id: "mistral-large-latest" }] });
        appelsMistral++;
        return reponseJson(200, { choices: [{ message: { content: "Réponse Mistral (repli)." } }], usage: { prompt_tokens: 4, completion_tokens: 3 } });
      }
      throw new Error(`URL inattendue dans ce test : ${u}`);
    });
    verif("1. OpenAI coupé, Mistral configuré : la capacité raisonnement continue (repli ou sélection directe de Mistral)", r.ok === true);
    verif(
      "1. si OpenAI a été tenté, son échec simulé est bien tracé dans les tentatives (jamais masqué)",
      r.tentatives.every((t) => t.fournisseur !== "openai" || t.ok === false),
    );
    verif("1. au moins un des deux fournisseurs a réellement répondu", appelsOpenai + appelsMistral >= 1);
    rapport.push(
      r.ok
        ? "Capacité « raisonnement » (texte) : CONTINUE quand OpenAI est coupé et que Mistral est configuré (repli automatique, ou sélection directe de Mistral selon l'état réel du routage)."
        : "Capacité « raisonnement » (texte) : CASSE même avec Mistral configuré — anomalie à investiguer.",
    );
  }

  // ── 2. OpenAI seul configuré, coupé : aucun repli possible ──────────────
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-openai-down";
  delete process.env.MISTRAL_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_LLM_URL;
  {
    const r = await appeler(ENTREE_BASE, async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [{ id: "gpt-4o-mini" }] });
      return reponseJson(500, { error: { message: "Panne totale simulée." } });
    });
    verif("2. OpenAI seul, coupé : échec honnête (pas de réponse inventée)", r.ok === false);
    verif("2. OpenAI seul, coupé : motif interne présent (traçabilité)", r.motif.length > 0);
    verif("2. OpenAI seul, coupé : motifPublic générique, sans détail fournisseur", !/openai/i.test(r.motifPublic));
    rapport.push(
      "Capacité « raisonnement » (texte) sans Mistral configuré : DÉGRADE proprement en échec honnête (aucune réponse inventée) — aucun moteur interne ne prend le relais aujourd'hui (LOCAL_LLM_URL absent). Bloquant réel pour l'indépendance visée.",
    );
  }

  // ── 3. Modèle supprimé du compte (liste /models vide, complétion 404 modèle inconnu) ──
  restaurerEnv();
  process.env.OPENAI_API_KEY = "sk-test-openai-model-removed";
  delete process.env.MISTRAL_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.LOCAL_LLM_URL;
  {
    const r = await appeler(ENTREE_BASE, async (url) => {
      const u = String(url);
      if (u.includes("/models")) return reponseJson(200, { data: [] }); // aucun modèle accessible sur ce compte
      return reponseJson(404, { error: { message: "The model 'gpt-4o-mini' does not exist or you do not have access to it." } });
    });
    verif("3. modèle supprimé du compte : échec honnête", r.ok === false);
    verif("3. modèle supprimé du compte : motifPublic sans détail fournisseur", !/openai|gpt/i.test(r.motifPublic));
    rapport.push("Scénario « modèle supprimé du compte fournisseur » : géré comme tout échec HTTP — motif interne détaillé, motifPublic générique. Pas de crash.");
  }

  // ── 4. Capacité désactivée par la direction (indépendant de l'état du fournisseur) ──
  {
    await db
      .insert(inCapaciteEtat)
      .values({ capacite: "raisonnement", actif: false, motif: "Test d'indépendance IA02D — désactivation simulée." })
      .onConflictDoNothing();
    await db.update(inCapaciteEtat).set({ actif: false, motif: "Test d'indépendance IA02D — désactivation simulée." }).where(eq(inCapaciteEtat.capacite, "raisonnement"));

    const { router } = await import("../routeur.js");
    const r = await router({
      capacite: "raisonnement",
      moteur: "intelligences",
      message: "Bonjour",
      systeme: "test",
      role: "super_admin",
    });
    verif("4. capacité désactivée par la direction : refusée quel que soit l'état du fournisseur", r.ok === false);
    verif("4. capacité désactivée : motifPublic sûr (règle métier, pas un détail fournisseur)", r.motifPublic === r.motif);
    rapport.push("Scénario « capacité désactivée par la direction » : refus immédiat au niveau du routeur, avant tout appel réseau — comportement correct et déjà réel (server/intelligences/routeur.ts).");

    // Remise en état pour ne pas polluer les autres tests/l'environnement.
    await db.update(inCapaciteEtat).set({ actif: true, motif: "Réactivée après test d'indépendance IA02D." }).where(eq(inCapaciteEtat.capacite, "raisonnement"));
  }

  restaurerEnv();

  // Consigne réellement l'exécution de ce test dans le Provider Registry —
  // jamais une déclaration sans exécution (point 6/19).
  await enregistrerTestIndependance("openai", ok === total);
  await enregistrerTestIndependance("mistral", ok === total);

  console.log("\n=== Rapport d'indépendance — OpenAI coupé (LOT IA02D, point 19) ===");
  for (const l of rapport) console.log(`- ${l}`);
  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  restaurerEnv();
  process.exitCode = 1;
});
