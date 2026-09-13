#!/usr/bin/env node
/**
 * LOT IA02E — contrôle permanent : un montant de paiement ne doit jamais
 * venir directement d'`input` (le client) sans recalcul serveur.
 *
 * Trouvé réel corrigé par ce chantier : server/routers/livraison.ts::payMission
 * passait `amount: input.amount` tel quel à createPaymentCheckout(). Ce
 * script échoue le build si ce motif réapparaît, ici ou ailleurs.
 *
 * Heuristique volontairement simple (comme scripts/check-providers.mjs) :
 * dans chaque appel `createPaymentCheckout({ ... })`, la valeur de `amount:`
 * ne doit jamais être une lecture directe de `input.<quelque chose>`.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const RACINE = "server";
const IGNORES = new Set(["__tests__", "node_modules"]);

function fichiersTs(dossier) {
  const resultats = [];
  for (const entree of readdirSync(dossier)) {
    if (IGNORES.has(entree)) continue;
    const chemin = join(dossier, entree);
    const stat = statSync(chemin);
    if (stat.isDirectory()) resultats.push(...fichiersTs(chemin));
    else if (extname(entree) === ".ts") resultats.push(chemin);
  }
  return resultats;
}

const VIOLATION = /amount:\s*input\.\w*/;
let violations = 0;
const detail = [];

for (const fichier of fichiersTs(RACINE)) {
  const contenu = readFileSync(fichier, "utf8");
  let idx = contenu.indexOf("createPaymentCheckout(");
  while (idx !== -1) {
    const fenetre = contenu.slice(idx, idx + 600);
    const m = fenetre.match(VIOLATION);
    if (m) {
      violations++;
      const ligne = contenu.slice(0, idx).split("\n").length;
      detail.push(`${fichier}:${ligne} — ${m[0]}`);
    }
    idx = contenu.indexOf("createPaymentCheckout(", idx + 1);
  }
}

console.log(`payment_amount_trusted_from_frontend=${violations}`);
if (detail.length > 0) {
  console.log("Détail :");
  for (const d of detail) console.log(`  - ${d}`);
}
if (violations > 0) {
  console.error("[check-payment-amounts] ÉCHEC : un montant de paiement vient directement du client sans recalcul serveur.");
  process.exit(1);
}
console.log("[check-payment-amounts] Aucun montant de paiement issu directement du client : recalcul serveur systématique.");
