/**
 * Faux positifs du Système Intelligent : plusieurs moteurs « d'écran »
 * (achat_officiel, achat_pro, achat_particulier, vente, vente_pro,
 * vente_particulier, location_pro, location_particulier, controle_technique)
 * sont de simples filtres du catalogue partagé "annonces" (ou, pour
 * vente_pro, de kyc/pro pour l'inscription professionnelle ; pour
 * controle_technique, de devis pour les demandes de RDV) — ils n'ont jamais
 * de routeur tRPC en propre (gen-moteurs.mjs impose un routeur = un seul
 * moteur propriétaire), mais une vraie procédure les sert bel et bien.
 * L'audit d'activation les signalait pourtant « Existe mais non connectée »
 * car matchRouter() ne consultait que les routeurs déclarés en propre.
 * Corrigé en ajoutant ROUTEURS_PARTAGES (server/engine-registry/
 * perimetres.ts), consulté par matchRouter() en repli. Ce test lit les
 * procédures RÉELLEMENT montées (aucune base de données requise) et
 * vérifie que chacun de ces moteurs trouve désormais son routeur partagé.
 *
 * Un moteur totalement fictif (jamais déclaré dans ROUTEURS_PARTAGES, sans
 * routeur propre ni nom pouvant fuzzy-matcher un routeur réel) sert de
 * témoin négatif : la correction ne doit jamais rendre "connecté" un
 * moteur qui n'a réellement aucune procédure derrière lui.
 *
 * Lancement : `npx tsx server/activation-audit/__tests__/routeurs-partages.test.ts`
 */
import assert from "node:assert/strict";
import { matchRouter } from "../service.js";
import { collectRouterSurface } from "../inventory.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

async function main() {
  const routers = await collectRouterSurface();

  const partagesAnnonces = ["achat_officiel", "achat_pro", "achat_particulier", "vente", "vente_particulier", "location_pro", "location_particulier"];
  for (const moteur of partagesAnnonces) {
    const r = matchRouter(moteur, routers);
    verif(`${moteur} trouve bien le routeur partagé "annonces"`, r?.namespace === "annonces");
  }

  const rVentePro = matchRouter("vente_pro", routers);
  verif("vente_pro trouve bien un routeur partagé (kyc ou pro)", rVentePro?.namespace === "kyc" || rVentePro?.namespace === "pro");

  const rControleTechnique = matchRouter("controle_technique", routers);
  verif("controle_technique trouve bien le routeur partagé \"devis\" (ControleTechnique.tsx appelle réellement trpc.devis.mine)", rControleTechnique?.namespace === "devis");

  const rFictif = matchRouter("moteur_totalement_fictif_zzz_jamais_declare", routers);
  verif("un moteur totalement fictif, absent de toute déclaration, ne trouve jamais de routeur (témoin négatif)", rFictif === null);

  console.log(`\n${ok}/${total} assertions réussies.`);
  if (ok !== total) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
