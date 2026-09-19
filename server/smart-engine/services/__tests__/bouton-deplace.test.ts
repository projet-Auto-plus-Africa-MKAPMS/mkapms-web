/**
 * Un bouton mort qui change de ligne (édition ailleurs dans le même fichier)
 * ne doit jamais repasser « ok » : c'est le bug concret signalé par la
 * direction (captures d'écran) — static_L520 « Demander un devis flotte »
 * (LocationPro.tsx) marqué « ok » alors que le même bouton, toujours mort,
 * réapparaît sous static_L599. Test pur, sans base de données : couvre la
 * logique de décision isolée dans health-monitor.ts.
 *
 * Lancement : npx tsx server/smart-engine/services/__tests__/bouton-deplace.test.ts
 */
import assert from "node:assert/strict";
import { libellesParFichier, boutonDeplace } from "../health-monitor.js";

let ok = 0;
let total = 0;
function verif(nom: string, condition: boolean) {
  total++;
  if (condition) ok++;
  else console.error(`ÉCHEC : ${nom}`);
  assert.ok(condition, nom);
}

// Inventaire "actuel" : le bouton est maintenant à la ligne 599 (LocationPro.tsx a grossi).
const actuels = libellesParFichier([
  { fichier: "client/src/pages/LocationPro.tsx", libelle: "Demander un devis flotte" },
  { fichier: "client/src/pages/LocationPro.tsx", libelle: "Rechercher" },
]);

// Cas 1 (le bug réel observé) : ancienne ligne 520, même fichier, même libellé encore présent ailleurs → déplacé, pas corrigé.
verif(
  "1. static_L520 « Demander un devis flotte » toujours présent ailleurs → considéré déplacé",
  boutonDeplace(
    "client/src/pages/LocationPro.tsx",
    "Bouton « Demander un devis flotte » sans gestionnaire de clic, sans type submit, hors formulaire soumis (détection statique gen-boutons-sans-action.mjs).",
    actuels,
  ) === true,
);

// Cas 2 : bouton réellement corrigé (plus aucune trace de son libellé dans le fichier) → jamais "déplacé", donc repassera "ok" légitimement.
verif(
  "2. un bouton dont le libellé n'existe plus nulle part dans le fichier → pas déplacé (vraie correction)",
  boutonDeplace(
    "client/src/pages/LocationPro.tsx",
    "Bouton « Appliquer les filtres » sans gestionnaire de clic, sans type submit, hors formulaire soumis (détection statique gen-boutons-sans-action.mjs).",
    actuels,
  ) === false,
);

// Cas 3 : même libellé mais dans un AUTRE fichier → jamais confondu entre deux écrans différents.
verif(
  "3. même libellé mais fichier différent → jamais considéré déplacé (pas de faux rapprochement inter-fichiers)",
  boutonDeplace(
    "client/src/pages/LocationParticulier.tsx",
    "Bouton « Demander un devis flotte » sans gestionnaire de clic, sans type submit, hors formulaire soumis (détection statique gen-boutons-sans-action.mjs).",
    actuels,
  ) === false,
);

// Cas 4 : bouton sans texte (libellé vide) → jamais de faux rapprochement bâti sur une chaîne vide.
verif(
  "4. libellé vide (bouton sans texte) → jamais considéré déplacé, comportement de correction réelle préservé",
  boutonDeplace(
    "client/src/pages/LocationPro.tsx",
    "Bouton « (sans texte) » sans gestionnaire de clic, sans type submit, hors formulaire soumis (détection statique gen-boutons-sans-action.mjs).",
    actuels,
  ) === false,
);

console.log(`\n${ok}/${total} vérifications réussies.`);
if (ok !== total) process.exitCode = 1;
