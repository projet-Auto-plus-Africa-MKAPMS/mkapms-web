/**
 * Account Routing Engine (shared/account-routing.ts). Logique pure, aucune
 * base de données.
 *
 * Ajouté avec les univers "fournisseur"/"transporteur" (LOT 7 suite) :
 * avant ce correctif, un compte "supplier"/"carrier" retombait sur
 * l'univers "particulier" par défaut faute de cas déclaré — le portail
 * self-service (server/routers/supplier-portal.ts) devenait alors
 * inatteignable après connexion, même une fois l'accès accordé par le PDG.
 *
 * Lancement : `npx tsx shared/__tests__/account-routing.test.ts`
 */
import assert from "node:assert/strict";
import { resolveAccountRoute, resolveUniverse, isProfessionalUniverse } from "../account-routing.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

function main() {
  // ── Le point corrigé : supplier/carrier ont désormais leur propre univers ──
  verif("un compte \"supplier\" est routé vers l'univers \"fournisseur\", jamais \"particulier\"", resolveUniverse({ role: "supplier" }) === "fournisseur");
  verif("un compte \"carrier\" est routé vers l'univers \"transporteur\", jamais \"particulier\"", resolveUniverse({ role: "carrier" }) === "transporteur");

  const routeFournisseur = resolveAccountRoute({ role: "supplier" });
  verif("la destination du fournisseur est /espace-fournisseur", routeFournisseur.homePath === "/espace-fournisseur");
  verif("l'univers fournisseur n'est jamais présenté comme un repli (un vrai écran existe)", routeFournisseur.fallback === false);

  const routeTransporteur = resolveAccountRoute({ role: "carrier" });
  verif("la destination du transporteur est /espace-transporteur", routeTransporteur.homePath === "/espace-transporteur");

  verif("fournisseur et transporteur sont des univers professionnels", isProfessionalUniverse("fournisseur") && isProfessionalUniverse("transporteur"));

  // ── Non-régression : les univers déjà réels ne changent pas ──
  verif("super_admin reste routé vers pdg", resolveUniverse({ role: "super_admin" }) === "pdg");
  verif("un employé staffPosition=directeur reste routé vers direction", resolveUniverse({ role: "employee", staffPosition: "directeur" }) === "direction");
  verif("admin reste routé vers administration", resolveUniverse({ role: "admin" }) === "administration");
  verif("garage reste routé vers garage", resolveUniverse({ role: "garage" }) === "garage");
  verif("pro reste routé vers vendeur", resolveUniverse({ role: "pro" }) === "vendeur");
  verif("society reste routé vers location", resolveUniverse({ role: "society" }) === "location");
  verif("un particulier ordinaire (aucun rôle) reste routé vers particulier", resolveUniverse({}) === "particulier");
  verif("un proCategory déclaré prime toujours sur le rôle générique", resolveUniverse({ role: "pro", proCategory: "loueur" }) === "location");

  console.log(`\n${ok}/${total} vérifications réussies.`);
  if (ok !== total) process.exitCode = 1;
}

main();
