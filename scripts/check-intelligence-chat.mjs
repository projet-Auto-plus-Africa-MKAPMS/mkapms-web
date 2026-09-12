/**
 * LOT IA02B — gate de conformité du vrai espace de conversation /intelligence
 * (point 15 de la demande). Chaque compteur est réellement mesuré, jamais une
 * constante fixée à l'avance :
 *
 *  - intelligence_chat_input_real     : le module Conversation appelle la
 *    vraie mutation `intelligences.demander` depuis un champ de saisie
 *    contrôlé, jamais un bouton décoratif ;
 *  - intelligence_chat_backend_connected : `service.ts::demander()` appelle
 *    réellement la boucle d'outils ou le fournisseur, jamais une réponse
 *    fabriquée sur place ;
 *  - conversation_persistence         : chaque échange s'écrit réellement
 *    dans `in_sessions`/`in_messages` ;
 *  - conversation_context_restored    : rouvrir une conversation recharge
 *    réellement son fil depuis le serveur ;
 *  - public_provider_names_visible    : délégué à check-public-provider-leaks.mjs,
 *    jamais réimplémenté ici ;
 *  - fake_chat_controls               : aucun bouton à l'effet vide dans le
 *    module Conversation.
 *
 * `cross_user_conversation_access` (7e compteur du point 15) exige une vraie
 * connexion base : il est mesuré par scripts/gen-intelligence-coverage.ts
 * (seul script de ce lot déjà exécuté via tsx avec accès base), pas ici — ce
 * fichier reste un script Node statique pur, comme check-providers.mjs et
 * check-public-provider-leaks.mjs.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const CONVERSATION = join("client", "src", "pages", "intelligence", "modules", "Conversation.tsx");
const SERVICE = join("server", "intelligences", "service.ts");

function lireOuVide(chemin) {
  try {
    return readFileSync(chemin, "utf8");
  } catch {
    return "";
  }
}

function verite(condition) {
  return condition ? 1 : 0;
}

async function main() {
  const conversation = lireOuVide(CONVERSATION);
  const service = lireOuVide(SERVICE);

  const intelligence_chat_input_real = verite(
    /trpc\.intelligences\.demander\.useMutation/.test(conversation) && /<textarea[\s\S]*?onChange/.test(conversation),
  );

  const intelligence_chat_backend_connected = verite(
    /executerAvecOutils\(/.test(service) && /appeler\(/.test(service),
  );

  const conversation_persistence = verite(
    /db\s*\.insert\(inMessages\)/.test(service) && /db\s*\.insert\(inSessions\)/.test(service),
  );

  const conversation_context_restored = verite(
    /filServeur\.data/.test(conversation) && /useEffect/.test(conversation),
  );

  // Un "faux bouton" a un corps de gestionnaire réellement vide — pas
  // simplement une fonction fléchée sans argument (ce qui décrit la quasi
  // totalité des vrais gestionnaires de ce fichier).
  const fautesControlesVides = (conversation.match(/onClick=\{\s*\(\)\s*=>\s*\{\s*\}\s*\}/g) ?? []).length;
  const fake_chat_controls = fautesControlesVides > 0 ? 1 : 0;

  let public_provider_names_visible;
  try {
    execFileSync("node", ["scripts/check-public-provider-leaks.mjs"], { encoding: "utf8" });
    public_provider_names_visible = 0;
  } catch (e) {
    console.error(e.stdout ?? e.stderr ?? String(e));
    public_provider_names_visible = 1;
  }

  const gate = {
    intelligence_chat_input_real,
    intelligence_chat_backend_connected,
    conversation_persistence,
    conversation_context_restored,
    public_provider_names_visible,
    fake_chat_controls,
  };

  console.log("=== LOT IA02B — gate conversation réelle (statique) ===");
  for (const [cle, valeur] of Object.entries(gate)) console.log(`${cle}=${valeur}`);
  console.log("cross_user_conversation_access : mesuré par scripts/gen-intelligence-coverage.ts (accès base requis).");

  const cible = { intelligence_chat_input_real: 1, intelligence_chat_backend_connected: 1, conversation_persistence: 1, conversation_context_restored: 1, public_provider_names_visible: 0, fake_chat_controls: 0 };
  const echec = Object.entries(cible).some(([cle, attendu]) => gate[cle] !== attendu);
  if (echec) {
    console.error("\n[conversation] ÉCHEC : au moins un compteur ne correspond pas à la cible attendue.");
    process.exitCode = 1;
  } else {
    console.log("\n[conversation] Gate statique au vert.");
  }
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
