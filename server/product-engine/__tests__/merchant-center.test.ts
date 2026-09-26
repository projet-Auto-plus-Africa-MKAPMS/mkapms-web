/**
 * Connecteur Google Merchant Center (Content API v2.1) — server/product-engine/merchant-center.ts.
 *
 * Signalé par le PDG (capture d'écran, entouré) : l'écran « Produits Google &
 * Merchant » affiche « Merchant Center non connecté » et il a demandé de le
 * connecter. Audit préalable : `merchantState()` ne vérifiait qu'une variable
 * d'environnement — même avec des identifiants réels, AUCUN code n'appelait
 * jamais l'API Google pour soumettre une fiche ou lire son vrai statut.
 *
 * Ce test ne dispose d'aucun identifiant Google réel dans cet environnement
 * de travail (aucun compte Merchant Center MKA.P-MS n'existe encore) : la
 * construction de la ressource et l'interprétation d'une réponse sont testées
 * en pur (aucune donnée inventée, seulement le format documenté du Content
 * API v2.1) ; le flux réseau complet (`synchroniserFiche`) est testé avec un
 * `fetch` injecté qui rejoue des réponses HTTP réalistes — jamais un appel
 * réseau réel. L'authentification (`obtenirJetonAcces`, `google-auth-library`)
 * n'est pas testée ici : elle nécessiterait un vrai compte de service Google,
 * hors de portée de cet environnement.
 *
 * Lancement : `npx tsx server/product-engine/__tests__/merchant-center.test.ts`
 */
import assert from "node:assert/strict";
import {
  construireRessourceProduit,
  idProduitContentApi,
  interpreterStatut,
  synchroniserFiche,
  type FetchLike,
  type FicheMerchant,
  type MerchantCredentials,
} from "../merchant-center.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

const FICHE_TEST: FicheMerchant = {
  offerId: "parts_catalog-42",
  titre: "Plaquette de frein avant",
  description: "Plaquette de frein avant, compatible Clio IV.",
  url: "https://www.mkapms.co/pieces/42",
  imageUrl: "https://www.mkapms.co/img/42.jpg",
  prix: "29.90",
  devise: "EUR",
  disponibilite: "en_stock",
  etat: "neuf",
  marque: "Bosch",
  gtin: "1234567890123",
  mpn: "REF-42",
  pays: "FR",
  langue: "fr",
};

const CREDENTIALS_TEST: MerchantCredentials = {
  merchantId: "999999",
  serviceAccount: { client_email: "test@example.iam.gserviceaccount.com", private_key: "clef-de-test-non-reelle" },
};

/** Jamais un vrai appel à Google OAuth dans ce test : aucun compte de service réel n'existe ici. */
const JETON_FICTIF = async () => "jeton-de-test-non-reel";

async function main() {
  // ── construireRessourceProduit : format réel du Content API v2.1 ──────
  {
    const ressource = construireRessourceProduit(FICHE_TEST);
    verif("ressource : offerId transmis tel quel", ressource.offerId === "parts_catalog-42");
    verif("ressource : contentLanguage = langue réelle de la fiche", ressource.contentLanguage === "fr");
    verif("ressource : targetCountry = pays réel de la fiche (jamais FR en dur)", ressource.targetCountry === "FR");
    verif("ressource : disponibilité traduite au vocabulaire Content API", ressource.availability === "in stock");
    verif("ressource : état traduit au vocabulaire Content API", ressource.condition === "new");
    verif("ressource : prix structuré {value, currency}", JSON.stringify(ressource.price) === JSON.stringify({ value: "29.90", currency: "EUR" }));
    verif("ressource : channel toujours online (aucune fiche locale confondue avec une fiche en ligne)", ressource.channel === "online");

    const sansImage = construireRessourceProduit({ ...FICHE_TEST, imageUrl: null });
    verif("ressource : pas d'imageLink inventé quand aucune image réelle", !("imageLink" in sansImage));

    const occasion = construireRessourceProduit({ ...FICHE_TEST, etat: "occasion" });
    verif("ressource : pièce d'occasion jamais déclarée neuve", occasion.condition === "used");
  }

  // ── idProduitContentApi : identifiant REST_ID officiel ─────────────────
  verif(
    "idProduitContentApi : format online:langue:pays:offerId",
    idProduitContentApi(FICHE_TEST) === "online:fr:FR:parts_catalog-42",
  );

  // ── interpreterStatut : jamais approuvé sans preuve explicite ──────────
  {
    const approuve = interpreterStatut({
      destinationStatuses: [{ destination: "Shopping", approvedCountries: ["FR"], disapprovedCountries: [] }],
      itemLevelIssues: [],
    });
    verif("statut : destination Shopping approuvée → approuve=true", approuve.approuve === true && approuve.etat === "approuve");

    const enAttente = interpreterStatut({ destinationStatuses: [], itemLevelIssues: [] });
    verif("statut : aucune destination approuvée → jamais approuvé par défaut", enAttente.approuve === false && enAttente.etat === "en_attente");

    const rejete = interpreterStatut({
      destinationStatuses: [],
      itemLevelIssues: [{ severity: "error", description: "Image manquante" }],
    });
    verif("statut : problème bloquant réel → rejeté, jamais confondu avec une simple attente", rejete.etat === "rejete" && rejete.motif.includes("Image manquante"));

    const illisible = interpreterStatut(null);
    verif("statut : réponse illisible → jamais approuvé par défaut, classé échec technique", illisible.approuve === false && illisible.etat === "echec_technique");
  }

  // ── synchroniserFiche : flux réseau complet avec fetch injecté ─────────
  {
    // 1. Soumission + statut approuvé réels (réponses HTTP simulées, jamais un appel réseau réel).
    const fetchApprouve: FetchLike = async (url) => {
      if (url.endsWith("/products")) return { ok: true, status: 200, json: async () => ({}) };
      return {
        ok: true,
        status: 200,
        json: async () => ({ destinationStatuses: [{ destination: "Shopping", approvedCountries: ["FR"] }], itemLevelIssues: [] }),
      };
    };
    const resultatApprouve = await synchroniserFiche(CREDENTIALS_TEST, FICHE_TEST, fetchApprouve, JETON_FICTIF);
    verif("synchroniserFiche : soumission + statut approuvé → approuve=true", resultatApprouve.approuve === true);

    // 2. Soumission refusée par Google (HTTP 400) → jamais approuvé.
    const fetchRefuse: FetchLike = async () => ({ ok: false, status: 400, json: async () => ({ error: "invalid gtin" }) });
    const resultatRefuse = await synchroniserFiche(CREDENTIALS_TEST, FICHE_TEST, fetchRefuse, JETON_FICTIF);
    verif("synchroniserFiche : soumission refusée → jamais approuvé", resultatRefuse.approuve === false && resultatRefuse.etat === "rejete");
    verif("synchroniserFiche : motif réel de Google conservé", resultatRefuse.motif.includes("400"));

    // 3. Panne réseau → jamais confondue avec une approbation, jamais un crash.
    const fetchPanne: FetchLike = async () => {
      throw new Error("ECONNREFUSED (simulé)");
    };
    const resultatPanne = await synchroniserFiche(CREDENTIALS_TEST, FICHE_TEST, fetchPanne, JETON_FICTIF);
    verif("synchroniserFiche : panne réseau → jamais approuvé, jamais de crash", resultatPanne.approuve === false && resultatPanne.etat === "echec_technique");
    verif("synchroniserFiche : motif réel de la panne conservé", resultatPanne.motif.includes("ECONNREFUSED"));

    // 4. Fiche tout juste soumise, pas encore indexée (404 normal) → en_attente, pas un échec.
    const fetch404 : FetchLike = async (url) => {
      if (url.endsWith("/products")) return { ok: true, status: 200, json: async () => ({}) };
      return { ok: false, status: 404, json: async () => ({}) };
    };
    const resultat404 = await synchroniserFiche(CREDENTIALS_TEST, FICHE_TEST, fetch404, JETON_FICTIF);
    verif("synchroniserFiche : 404 juste après soumission → en_attente, pas un échec technique", resultat404.etat === "en_attente");

    // 5. Authentification refusée (compte de service invalide/révoqué) → jamais approuvé, jamais de crash.
    const jetonRefuse = async () => {
      throw new Error("invalid_grant (simulé)");
    };
    const jamaisAppele: FetchLike = async () => {
      throw new Error("fetch ne doit jamais être appelé si l'authentification échoue");
    };
    const resultatAuth = await synchroniserFiche(CREDENTIALS_TEST, FICHE_TEST, jamaisAppele, jetonRefuse);
    verif("synchroniserFiche : authentification refusée → échec technique, jamais approuvé", resultatAuth.etat === "echec_technique" && resultatAuth.approuve === false);
    verif("synchroniserFiche : authentification refusée → aucune soumission tentée sans jeton valide", resultatAuth.motif.includes("invalid_grant"));
  }

  console.log(`\n${ok}/${total} assertions réussies.`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
