/**
 * Autonomie du centre : son propre fonctionnement (règles, bus, moteurs de commande et de vérification, transport, mesures, santé,
 * gouvernance, atelier, lacunes, protocole, fondation, journal, vues, démarrage, liaisons réelles) ne dépend d'AUCUNE IA ni API
 * externe. Garde statique, sans base : un nouveau fichier du cœur du centre qui introduirait une telle dépendance fait échouer ce test.
 *
 * Ce que ce test NE couvre PAS (hors du cœur du centre, volontairement) : `shop-link/*` (câble réel vers la Boutique, qui sert un
 * serveur HTTP — ce n'est pas une IA) et les fichiers `*.generated.ts` / `inventaire/*` (données relevées, pas du code d'exécution).
 */
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const RACINE = path.resolve(import.meta.dirname, "..");

// Motifs d'un appel à une IA ou une API de fournisseur externe : nom de fournisseur, en-têtes d'auth, appel réseau direct.
const MOTIFS_INTERDITS = [
  /\bopenai\b/i,
  /\banthropic\b/i,
  /\bclaude-?\d/i,
  /api\.openai\.com/i,
  /generativelanguage\.googleapis/i,
  /OPENAI_API_KEY/,
  /ANTHROPIC_API_KEY/,
  /\bfetch\s*\(/, // le cœur du centre ne fait aucun appel réseau sortant ; shop-link (câble) est explicitement hors périmètre
];

function fichiersDuCoeur(): string[] {
  return readdirSync(RACINE)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".generated.ts"))
    .filter((f) => !["inventaire"].includes(f.replace(/\.ts$/, "")));
}

test("aucun fichier du cœur du centre n'appelle une IA ou une API de fournisseur externe", () => {
  const fichiers = fichiersDuCoeur();
  assert.ok(fichiers.length >= 20, `trop peu de fichiers relevés (${fichiers.length}) : le périmètre du test est-il bon ?`);
  const fautifs: string[] = [];
  for (const f of fichiers) {
    const texte = readFileSync(path.join(RACINE, f), "utf8");
    for (const motif of MOTIFS_INTERDITS) {
      if (motif.test(texte)) {
        fautifs.push(`${f} : ${motif}`);
        break;
      }
    }
  }
  assert.deepEqual(fautifs, [], `dépendance à une IA/API externe relevée dans le cœur du centre : ${fautifs.join(" ; ")}`);
});

test("le cœur du centre n'importe aucun module de server/intelligences/ (les fournisseurs d'IA de la plateforme)", () => {
  const fautifs: string[] = [];
  for (const f of fichiersDuCoeur()) {
    const texte = readFileSync(path.join(RACINE, f), "utf8");
    if (/from\s+["']\.\.\/intelligences\//.test(texte)) fautifs.push(f);
  }
  assert.deepEqual(fautifs, []);
});

test("la famille des moteurs internes déclarés (fondation.ts) ne nomme aucune IA ni API externe dans sa fonction ou ses entrées/sorties", async () => {
  const { MOTEURS_INTERNES } = await import("../moteurs-internes.js");
  assert.ok(MOTEURS_INTERNES.length >= 16);
  for (const m of MOTEURS_INTERNES) {
    const texte = `${m.fonction} ${m.entrees} ${m.sorties}`;
    assert.doesNotMatch(texte, /openai|anthropic|chatgpt/i, m.code);
  }
});
