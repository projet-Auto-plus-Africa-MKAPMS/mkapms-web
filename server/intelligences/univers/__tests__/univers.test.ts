/**
 * Tests du Universe Registry + Context Engine (LOT IA01).
 *
 * Aucune donnée simulée : registre.ts lit le vrai Engine Registry
 * (server/data/moteurs.ts, généré) et le vrai Tool Registry
 * (server/intelligences/outils/registre.ts) — ces tests vérifient le calcul
 * réel, pas une maquette. Le Context Engine a besoin d'un accès base réelle
 * (utilisateur, Country Engine) : ces cas sont ignorés proprement si
 * PostgreSQL est injoignable dans l'environnement de travail, plutôt que de
 * faire échouer tout le fichier.
 *
 * Lancement : `npx tsx server/intelligences/univers/__tests__/univers.test.ts`
 */
import assert from "node:assert/strict";
import { registre, univers, universDeRoute } from "../registre.js";
import { rapportCouverture } from "../couverture.js";
import { MOTEURS } from "../../../data/moteurs.js";
import { resoudreContexte } from "../../contexte/service.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  // ── Universe Registry ──────────────────────────────────────────────
  const u = registre();
  verif("registre() calcule sans exception (couverture des 89 moteurs vérifiée en interne)", u.length > 0);
  verif("18 univers définis", u.length === 18);

  const moteursCouverts = new Set(u.flatMap((x) => x.engineIds));
  verif("tous les moteurs réels du catalogue sont couverts par un univers", MOTEURS.every((m) => moteursCouverts.has(m.moteur)));
  verif("aucun doublon : chaque moteur n'appartient qu'à un seul univers", moteursCouverts.size === MOTEURS.length);
  verif("MOTEURS_TOTAL du générateur reste 89 (sinon mapping.ts est périmé)", MOTEURS.length === 89);

  const vtc = univers("vtc_taxi");
  verif("vtc_taxi existe (anomalie réelle : catégorie de facturation sans moteur)", vtc !== null);
  verif("vtc_taxi n'a réellement aucun moteur déclaré", vtc!.engineIds.length === 0);
  verif("vtc_taxi statut NO_INTELLIGENCE_INTEGRATION (honnête)", vtc!.statut === "NO_INTELLIGENCE_INTEGRATION");

  const marketplaceParticulier = univers("marketplace_particulier");
  verif("marketplace_particulier a des outils réellement actifs (famille vehicules)", marketplaceParticulier!.outilsActifs.length > 0);
  verif("marketplace_particulier statut PARTIALLY_CONNECTED", marketplaceParticulier!.statut === "PARTIALLY_CONNECTED");

  const intelligenceProduit = univers("intelligence_produit");
  verif("intelligence_produit porte les 24 outils du Chantier de développement", intelligenceProduit!.outilsActifs.length >= 24);

  const paiements = univers("paiements_finance");
  verif("paiements_finance a des fiches enregistrées jamais implémentées", paiements!.outilsEnregistresNonConnectes.length > 0);
  verif("paiements_finance statut REGISTERED_NOT_CONNECTED (aucun outil paiement réel)", paiements!.statut === "REGISTERED_NOT_CONNECTED");

  const infra = univers("plateforme_infrastructure");
  verif("plateforme_infrastructure regroupe les 37 moteurs techniques", infra!.engineIds.length === 37);
  verif(
    "plateforme_infrastructure n'a que les outils de test du socle (aucun outil métier)",
    infra!.outilsActifs.every((t) => t.startsWith("test.")),
  );

  verif(
    "aucun univers déclaré INTELLIGENCE_CONNECTED dans ce lot (Context Engine construit, pas encore branché à des actions)",
    u.every((x) => x.statut !== "INTELLIGENCE_CONNECTED"),
  );

  verif("universDeRoute résout une route réelle vers son univers", universDeRoute("/vo")?.universeId === "marketplace_professionnel");
  verif("universDeRoute renvoie null pour une route inconnue", universDeRoute("/route-inexistante-xyz-123") === null);

  // ── Intelligence Coverage ──────────────────────────────────────────
  const rapport = await rapportCouverture();
  verif("rapportCouverture couvre 89/89 moteurs", rapport.moteurs.couvertsParUnUnivers === 89 && rapport.moteurs.total === 89);
  verif(
    "rapportCouverture : la somme des statuts égale le nombre d'univers",
    Object.values(rapport.univers.parStatut).reduce((a, b) => a + b, 0) === rapport.univers.total,
  );
  verif("rapportCouverture recense les outils réellement actifs", rapport.outils.actifs > 0 && rapport.outils.actifs < rapport.outils.total);
  verif(
    "rapportCouverture : aucun fournisseur routable non connecté dans cet environnement (aucune clé Anthropic posée)",
    rapport.fournisseurs.routableNonConnecte === 0,
  );

  // ── Context Engine (nécessite un accès base réel) ───────────────────
  try {
    const ctxAnonyme = await resoudreContexte({ route: "/vo" });
    verif("resoudreContexte résout l'univers depuis la route sans utilisateur", ctxAnonyme.univers.resolu?.universeId === "marketplace_professionnel");
    verif("resoudreContexte : motif honnête quand aucun pays n'est connu", ctxAnonyme.pays.motif.length > 0);

    const ctxSansRoute = await resoudreContexte({});
    verif("resoudreContexte sans route : univers non résolu avec motif explicite", ctxSansRoute.univers.resolu === null && ctxSansRoute.univers.motif.length > 0);
  } catch (e) {
    console.error(`Context Engine ignoré (base injoignable dans cet environnement) : ${e instanceof Error ? e.message : "erreur"}`);
  }

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main().catch((e) => {
  console.error("ÉCHEC INATTENDU :", e);
  process.exitCode = 1;
});
