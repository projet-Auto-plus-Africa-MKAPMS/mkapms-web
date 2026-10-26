/**
 * Régression — upload de documents qui se "validait" tout seul au clic
 * (retour Direction, 26/10) : dans `DocumentsAnnonce.tsx` et `Finance.tsx`,
 * cliquer sur une ligne « document » bascule un booléen local et affiche un
 * ✓ vert instantanément, sans jamais ouvrir de sélecteur de fichier ni
 * envoyer quoi que ce soit au serveur.
 *
 * Test d'inspection statique du code source réellement livré — aucun rendu
 * React nécessaire (pas de bibliothèque de test de composants dans ce
 * dépôt) : on vérifie que l'anti-motif a disparu et que le vrai mécanisme
 * (input file cliqué via ref + upload réel vers /api/upload) est présent.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));

function read(relativeFromPagesDir: string): string {
  return readFileSync(path.join(here, "..", relativeFromPagesDir), "utf8");
}

// ── DocumentsAnnonce.tsx (portail /depot-annonce) ───────────────────────
{
  const src = read("depot-annonce/DocumentsAnnonce.tsx");
  assert.ok(!/setDocs\(prev => prev\.map/.test(src), "l'ancien toggle local (sans upload réel) ne doit plus exister");
  assert.match(src, /type="file"/, "un vrai sélecteur de fichier doit exister");
  assert.match(src, /\/api\/upload/, "l'upload doit réellement appeler /api/upload");
  assert.match(src, /addToPhotoDraft\("documents"/, "les documents envoyés doivent rejoindre le brouillon repris par Vendre.tsx, sinon ils sont perdus");
}

// ── Finance.tsx (étape "Constitution du dossier") ────────────────────────
{
  const src = read("Finance.tsx");
  assert.ok(
    !/type="checkbox" checked=\{!!docs\[d\.key\]\}/.test(src),
    "l'ancienne case à cocher qui affichait un ✓ vert sans upload réel ne doit plus exister",
  );
  assert.match(src, /type="file"/, "un vrai sélecteur de fichier doit exister pour les documents du dossier");
  assert.match(src, /\/api\/upload/, "l'upload des documents du dossier doit réellement appeler /api/upload");
}

// ── pro/DossierPro.tsx (justificatifs du dossier professionnel, écran
//    principal d'inscription pro pour tous les métiers) ──────────────────
{
  const src = read("pro/DossierPro.tsx");
  assert.ok(
    !/type="checkbox"\s*\n?\s*checked=\{!!docs\[doc\]\}/.test(src),
    "l'ancienne case à cocher « cocher ne vaut pas validation » sans fichier réel ne doit plus exister seule",
  );
  assert.match(src, /type="file"/, "un vrai sélecteur de fichier doit exister pour les justificatifs du dossier pro");
  assert.match(src, /\/api\/upload/, "l'upload des justificatifs du dossier pro doit réellement appeler /api/upload");
  assert.match(src, /url:\s*docs\[label\]/, "l'URL réellement envoyée doit être transmise au serveur (le backend l'accepte déjà)");
}

// ── GestionConducteurs.tsx (Permis / Pièce d'identité / Ajouter le
//    conducteur / éditer) — 4 entrées de l'inventaire boutons-sans-action ──
{
  const src = read("GestionConducteurs.tsx");
  assert.match(src, /type="file"/, "les boutons Permis / Pièce d'identité doivent ouvrir un vrai sélecteur de fichier");
  assert.match(src, /\/api\/upload/, "l'upload des documents conducteur doit réellement appeler /api/upload");
  assert.match(src, /function ajouterConducteur/, "« Ajouter le conducteur » doit réellement ajouter l'entrée saisie à la liste");
  assert.match(src, /setEditingId/, "le bouton crayon doit réellement activer un état d'édition");
}

console.log("✅ Upload de documents (compte pro / dossier financement / dossier pro / conducteurs) — anti-motif corrigé, vrai sélecteur de fichier présent (100 % OK)");

// ── Écrans orphelins factices supprimés (jamais liés, doublons d'un
//    mécanisme réel déjà fonctionnel ailleurs) — remplacés par une
//    redirection vers le vrai écran, pas un 404 sec. ──────────────────────
{
  assert.ok(
    !existsSync(path.join(here, "..", "InscriptionParticulier.tsx")),
    "InscriptionParticulier.tsx (inscription factice sans appel API, jamais liée) doit être supprimé",
  );
  assert.ok(
    !existsSync(path.join(here, "..", "pieces", "PanierPiecesDetachees.tsx")),
    "PanierPiecesDetachees.tsx (panier factice local, jamais lié) doit être supprimé",
  );
  const app = readFileSync(path.join(here, "..", "..", "App.tsx"), "utf8");
  assert.doesNotMatch(app, /InscriptionParticulier/, "App.tsx ne doit plus référencer l'écran supprimé");
  assert.doesNotMatch(app, /PanierPiecesDetachees/, "App.tsx ne doit plus référencer l'écran supprimé");
  assert.match(
    app,
    /path="\/inscription" element=\{<Navigate to="\/connexion\?tab=register" replace \/>\}/,
    "/inscription doit rediriger vers la vraie inscription (Connexion.tsx, auth.register)",
  );
  assert.match(
    app,
    /path="\/pieces\/panier-pieces-detachees" element=\{<Navigate to="\/pieces\?panier=1" replace \/>\}/,
    "/pieces/panier-pieces-detachees doit rediriger vers le vrai panier intégré à /pieces",
  );
}

// ── Connexion.tsx doit respecter le lien profond ?tab=register déjà
//    utilisé par plusieurs écrans (« Créer un compte » pointait dans le
//    vide : le mode « login » s'affichait toujours par défaut). ──────────
{
  const src = read("Connexion.tsx");
  assert.match(
    src,
    /searchParams\.get\("tab"\) === "register" \? "register" : "login"/,
    "Connexion.tsx doit lire ?tab=register pour pré-sélectionner l'inscription",
  );
}

console.log("✅ Écrans orphelins factices supprimés (redirigés), lien profond ?tab=register respecté (100 % OK)");
