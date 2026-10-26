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
import { readFileSync } from "node:fs";
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

console.log("✅ Upload de documents (compte pro / dossier financement) — anti-motif corrigé, vrai sélecteur de fichier présent (100 % OK)");
