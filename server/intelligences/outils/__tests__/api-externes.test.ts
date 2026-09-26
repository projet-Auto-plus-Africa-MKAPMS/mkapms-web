/**
 * Demande du PDG : exposer les fonctions réelles des API déjà connectées
 * comme outils que le modèle peut directement demander en conversation, pas
 * seulement comme logique interne invisible. Ce test exerce la vraie
 * politique (politique.ts::evaluer, `verifierPermission` injecté pour rester
 * sans base de données, même principe que boucle.test.ts) et le vrai
 * exécuteur (executeur.ts::executer) sur les deux outils IMPLEMENTED de la
 * famille "api_externes" — jamais un appel réseau réel (OPENAI_API_KEY
 * absente pendant ce test, donc `modererTexte()` répond honnêtement sans
 * jamais tenter `fetch`).
 *
 * `moderateContent` est gouverné par le catalogue des fonctionnalités
 * (server/intelligences/fonctions.ts, code "moderation" — le même écran PDG
 * Centre Intelligence → onglet Fonctions) : « rien ne s'allume tout seul ».
 * Ce test vérifie donc les DEUX portes, dans l'ordre réel d'exécution :
 * fonction éteinte par défaut → refus honnête sans même regarder la clé ;
 * puis fonction activée par la direction → la clé absente devient le vrai
 * motif. Utilise la vraie base de test locale (comme independance-openai.test.ts).
 *
 * Lancement : `npx tsx server/intelligences/outils/__tests__/api-externes.test.ts`
 */
import assert from "node:assert/strict";
import { trouver, listerActifs } from "../registre.js";
import { executer } from "../executeur.js";
import { evaluer, type VerifierPermission } from "../politique.js";
import { regler as reglerFonction } from "../../fonctions.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const TOUJOURS_AUTORISE: VerifierPermission = async () => ({ autorise: true, motif: "", parRole: [], parMoteur: [] });

async function main() {
  delete process.env.OPENAI_API_KEY;

  // ── api_externes.moderateContent ────────────────────────────────────────
  const moderation = trouver("api_externes.moderateContent");
  verif("moderateContent : présent au registre", moderation !== null);
  verif("moderateContent : actif (IMPLEMENTED)", listerActifs().some((o) => o.toolId === "api_externes.moderateContent"));

  if (moderation) {
    const refusRole = await evaluer(moderation, { role: "user", moteur: "test" }, TOUJOURS_AUTORISE);
    verif("moderateContent : rôle 'user' refusé (réservé à l'interne)", refusRole.verdict === "refuse");

    const autorise = await evaluer(moderation, { role: "employee", moteur: "test" }, TOUJOURS_AUTORISE);
    verif("moderateContent : rôle 'employee' autorisé", autorise.verdict === "autorise");

    const sansArgument = await executer(moderation, "{}", { role: "employee", moteur: "test" });
    verif("moderateContent : argument 'texte' manquant → arguments_invalides", sansArgument.statut === "arguments_invalides");

    // Porte 1 — fonction "moderation" éteinte par défaut (activeParDefaut: false) : refus honnête, jamais un appel tenté.
    const avantActivation = await executer(moderation, JSON.stringify({ texte: "un commentaire quelconque" }), {
      role: "employee",
      moteur: "test",
    });
    verif("moderateContent : exécution réussie même éteinte (statut=execute, réponse honnête)", avantActivation.statut === "execute");
    const payloadEteint = avantActivation.resultat as { disponible: boolean; signale: boolean; motif: string };
    verif("moderateContent : fonction éteinte par défaut → disponible=false, jamais un texte supposé sain", payloadEteint.disponible === false && payloadEteint.signale === false);
    verif("moderateContent : un motif réel et non vide est renvoyé (jamais un silence)", payloadEteint.motif.length > 0);

    // Porte 2 — on ne peut pas activer une fonction dont le fournisseur n'est pas joignable
    // (propriété de sécurité réelle de fonctions.ts::regler, jamais contournée ici).
    const activationRefusee = await reglerFonction({ fonction: "moderation", active: true, motif: "Tentative sans fournisseur joignable." });
    verif("moderateContent : impossible d'activer sans fournisseur ia_vision joignable (sécurité réelle)", activationRefusee.ok === false);

    // Porte 3 — avec un fournisseur joignable (clé présente, aucun appel réseau tenté ici :
    // seule sa PRÉSENCE est vérifiée par providerStates(), jamais une requête), l'activation réussit réellement.
    process.env.OPENAI_API_KEY = "sk-test-1234";
    const activationReussie = await reglerFonction({ fonction: "moderation", active: true, motif: "Test réel : activation possible." });
    verif("moderateContent : activation réelle réussie une fois le fournisseur joignable", activationReussie.ok === true);

    // Porte 4 — la clé redevient absente : même avec la décision "active" déjà enregistrée,
    // le fournisseur redevient injoignable en temps réel → refus honnête, aucun appel réseau tenté.
    delete process.env.OPENAI_API_KEY;
    const apresActivationSansCle = await executer(moderation, JSON.stringify({ texte: "un commentaire quelconque" }), {
      role: "employee",
      moteur: "test",
    });
    verif("moderateContent : exécution réussie (statut=execute)", apresActivationSansCle.statut === "execute");
    const payloadSansCle = apresActivationSansCle.resultat as { disponible: boolean; signale: boolean; motif: string };
    verif(
      "moderateContent : décision 'active' enregistrée mais fournisseur injoignable → disponible=false, jamais un texte supposé sain",
      payloadSansCle.disponible === false && payloadSansCle.signale === false,
    );
    verif("moderateContent : un motif réel explique l'échec, jamais un silence", payloadSansCle.motif.length > 0);

    // Nettoyage : remettre la fonction dans son état par défaut pour ne pas polluer d'autres tests/l'environnement.
    process.env.OPENAI_API_KEY = "sk-test-1234";
    await reglerFonction({ fonction: "moderation", active: false, motif: "Fin de test : retour à l'état par défaut." });
    delete process.env.OPENAI_API_KEY;
  }

  // ── api_externes.getGoogleMerchantStatus ────────────────────────────────
  delete process.env.GOOGLE_MERCHANT_ACCOUNT_ID;
  delete process.env.GOOGLE_MERCHANT_CREDENTIALS;
  const merchant = trouver("api_externes.getGoogleMerchantStatus");
  verif("getGoogleMerchantStatus : présent au registre", merchant !== null);
  verif("getGoogleMerchantStatus : actif (IMPLEMENTED)", listerActifs().some((o) => o.toolId === "api_externes.getGoogleMerchantStatus"));

  if (merchant) {
    const refusRole = await evaluer(merchant, { role: "employee", moteur: "test" }, TOUJOURS_AUTORISE);
    verif("getGoogleMerchantStatus : rôle 'employee' refusé (réservé à la direction)", refusRole.verdict === "refuse");

    const autorise = await evaluer(merchant, { role: "admin", moteur: "test" }, TOUJOURS_AUTORISE);
    verif("getGoogleMerchantStatus : rôle 'admin' autorisé", autorise.verdict === "autorise");

    const resultat = await executer(merchant, "{}", { role: "admin", moteur: "test" });
    verif("getGoogleMerchantStatus : exécution réussie (statut=execute)", resultat.statut === "execute");
    const payload = resultat.resultat as { configure: boolean; detail: string };
    verif("getGoogleMerchantStatus : sans identifiants → configure=false, jamais un compte supposé connecté", payload.configure === false);
    verif("getGoogleMerchantStatus : motif réel explicite", payload.detail.length > 0);
  }

  // ── Placeholders honnêtes (Content API v2.1 non entièrement câblé) ──────
  const ARGUMENTS_VALIDES: Record<string, string> = {
    "api_externes.resyncGoogleMerchantListing": JSON.stringify({ source: "parts_shops", sourceId: 1 }),
    "api_externes.listGoogleMerchantProducts": "{}",
    "api_externes.deleteGoogleMerchantProduct": JSON.stringify({ source: "parts_shops", sourceId: 1 }),
  };
  for (const [toolId, argumentsJson] of Object.entries(ARGUMENTS_VALIDES)) {
    const outil = trouver(toolId);
    verif(`${toolId} : présent au registre malgré l'absence d'implémentation`, outil !== null);
    verif(`${toolId} : REGISTERED_NOT_IMPLEMENTED, jamais annoncé actif`, outil?.implementationStatus === "REGISTERED_NOT_IMPLEMENTED" && outil?.enabled === false);
    if (outil) {
      const resultat = await executer(outil, argumentsJson, { role: "admin", moteur: "test" });
      verif(`${toolId} : l'exécuteur le dit honnêtement non implémenté, jamais un résultat inventé`, resultat.statut === "non_implemente");
    }
  }

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(ok === total ? 0 : 1)).catch((err) => {
  console.error(err);
  process.exit(1);
});
