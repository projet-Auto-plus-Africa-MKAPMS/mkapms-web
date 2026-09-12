/**
 * Tool Registry — famille « Chantier de développement » (server/intelligences/
 * chantier/). Les 24 outils demandés pour que MKA.P-MS Intelligence puisse
 * réellement construire un petit projet de bout en bout : comprendre,
 * planifier, créer des fichiers, écrire du code, installer des dépendances,
 * lancer des commandes, tester, corriger, prévisualiser.
 *
 * Réservé au PDG (`allowedRoles: ["super_admin"]`, comme le reste de
 * MKA.P-MS Intelligences côté direction — server/trpc.ts::pdgProcedure) : ce
 * lot construit la capacité pour l'usage direct du PDG depuis le Centre
 * Intelligence, pas encore pour un compte professionnel ou client.
 *
 * Règle non négociable de politique.ts : aucun outil ici n'est HIGH ni
 * CRITICAL — chacun est confiné au workspace du projet appelant (jamais un
 * accès disque hors de ce dossier), avec un binaire limité par allowlist pour
 * tout ce qui touche au shell, et un délai strict. C'est ce confinement réel,
 * pas une déclaration, qui justifie MEDIUM au plus.
 */
import type { Categorie, OutilSpec } from "../registre.js";

const PDG = ["super_admin"];

function outilImplemente(partiel: {
  toolId: string;
  name: string;
  description: string;
  category: Categorie;
  schemaInput: Record<string, unknown>;
  riskLevel: OutilSpec["riskLevel"];
  requiredPermissions: OutilSpec["requiredPermissions"];
  timeoutMs: number;
  idempotent: boolean;
  auditCategory: string;
}): OutilSpec {
  return {
    toolId: partiel.toolId,
    name: partiel.name,
    description: partiel.description,
    category: partiel.category,
    version: "1.0.0",
    schemaInput: partiel.schemaInput,
    schemaOutput: { type: "object", properties: {}, required: [] },
    available: true,
    enabled: true,
    implementationStatus: "IMPLEMENTED",
    allowedRoles: PDG,
    allowedCountries: null,
    blockedCountries: [],
    requiredPermissions: partiel.requiredPermissions,
    requiredSubscription: null,
    requiresHumanApproval: false,
    requiresStrongAuthentication: false,
    riskLevel: partiel.riskLevel,
    legalBasis: "Usage interne direction — aucune donnée personnelle de tiers traitée par cette famille.",
    provider: "mkapms",
    fallback: "Aucun nécessaire — moteur propriétaire (server/intelligences/chantier/).",
    internalReplacementStatus: "Déjà propriétaire.",
    idempotent: partiel.idempotent,
    timeoutMs: partiel.timeoutMs,
    auditCategory: partiel.auditCategory,
  };
}

const PROJET_ID = { projetId: { type: "number" } };
const CHEMIN = { chemin: { type: "string" } };

export const OUTILS_CHANTIER: OutilSpec[] = [
  // ── Project Engine ────────────────────────────────────────────────
  outilImplemente({
    toolId: "project.create",
    name: "project.create",
    description: "Crée un nouveau projet Chantier (site vitrine ou autre) avec son workspace réel, isolé par propriétaire.",
    category: "projets",
    schemaInput: {
      type: "object",
      properties: { nom: { type: "string" }, description: { type: "string" }, typeProjet: { type: "string" } },
      required: ["nom"],
    },
    riskLevel: "LOW",
    requiredPermissions: ["WRITE"],
    timeoutMs: 8000,
    idempotent: false,
    auditCategory: "chantier_projet",
  }),
  outilImplemente({
    toolId: "project.open",
    name: "project.open",
    description: "Ouvre un projet existant appartenant à l'appelant et renvoie son état.",
    category: "projets",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "READ_ONLY",
    requiredPermissions: ["READ"],
    timeoutMs: 5000,
    idempotent: true,
    auditCategory: "chantier_projet",
  }),
  outilImplemente({
    toolId: "project.read",
    name: "project.read",
    description: "Lit l'état complet d'un projet : métadonnées, arborescence des fichiers, dernier plan, dernières exécutions.",
    category: "projets",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "READ_ONLY",
    requiredPermissions: ["READ"],
    timeoutMs: 8000,
    idempotent: true,
    auditCategory: "chantier_projet",
  }),

  // ── File System Tools ───────────────────────────────────────────────
  outilImplemente({
    toolId: "filesystem.list",
    name: "filesystem.list",
    description: "Liste le contenu d'un dossier du workspace du projet (jamais hors de ce dossier).",
    category: "projets",
    schemaInput: { type: "object", properties: { ...PROJET_ID, ...CHEMIN }, required: ["projetId"] },
    riskLevel: "READ_ONLY",
    requiredPermissions: ["READ"],
    timeoutMs: 5000,
    idempotent: true,
    auditCategory: "chantier_fichiers",
  }),
  outilImplemente({
    toolId: "filesystem.read",
    name: "filesystem.read",
    description: "Lit le contenu d'un fichier du workspace du projet.",
    category: "projets",
    schemaInput: { type: "object", properties: { ...PROJET_ID, ...CHEMIN }, required: ["projetId", "chemin"] },
    riskLevel: "READ_ONLY",
    requiredPermissions: ["READ"],
    timeoutMs: 5000,
    idempotent: true,
    auditCategory: "chantier_fichiers",
  }),
  outilImplemente({
    toolId: "filesystem.write",
    name: "filesystem.write",
    description: "Crée ou remplace entièrement un fichier du workspace du projet avec le contenu fourni.",
    category: "projets",
    schemaInput: {
      type: "object",
      properties: { ...PROJET_ID, ...CHEMIN, contenu: { type: "string" } },
      required: ["projetId", "chemin", "contenu"],
    },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 8000,
    idempotent: false,
    auditCategory: "chantier_fichiers",
  }),
  outilImplemente({
    toolId: "filesystem.edit",
    name: "filesystem.edit",
    description: "Remplace une portion précise (texte exact, unique) d'un fichier existant du projet — sans réécrire tout le fichier.",
    category: "projets",
    schemaInput: {
      type: "object",
      properties: { ...PROJET_ID, ...CHEMIN, ancienTexte: { type: "string" }, nouveauTexte: { type: "string" } },
      required: ["projetId", "chemin", "ancienTexte", "nouveauTexte"],
    },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 8000,
    idempotent: false,
    auditCategory: "chantier_fichiers",
  }),
  outilImplemente({
    toolId: "filesystem.move",
    name: "filesystem.move",
    description: "Déplace ou renomme un fichier ou un dossier à l'intérieur du workspace du projet.",
    category: "projets",
    schemaInput: {
      type: "object",
      properties: { ...PROJET_ID, source: { type: "string" }, destination: { type: "string" } },
      required: ["projetId", "source", "destination"],
    },
    riskLevel: "LOW",
    requiredPermissions: ["WRITE"],
    timeoutMs: 5000,
    idempotent: false,
    auditCategory: "chantier_fichiers",
  }),
  outilImplemente({
    toolId: "filesystem.delete",
    name: "filesystem.delete",
    description: "Supprime un fichier ou un dossier du workspace du projet (jamais la racine du projet elle-même).",
    category: "projets",
    schemaInput: { type: "object", properties: { ...PROJET_ID, ...CHEMIN }, required: ["projetId", "chemin"] },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 5000,
    idempotent: false,
    auditCategory: "chantier_fichiers",
  }),
  outilImplemente({
    toolId: "filesystem.search",
    name: "filesystem.search",
    description: "Recherche une chaîne de texte dans les fichiers texte du projet et renvoie fichier + ligne + extrait.",
    category: "projets",
    schemaInput: { type: "object", properties: { ...PROJET_ID, requete: { type: "string" } }, required: ["projetId", "requete"] },
    riskLevel: "READ_ONLY",
    requiredPermissions: ["READ"],
    timeoutMs: 8000,
    idempotent: true,
    auditCategory: "chantier_fichiers",
  }),

  // ── Génération / édition de code (couche générale, pas un moteur par langage) ─
  outilImplemente({
    toolId: "code.generate",
    name: "code.generate",
    description: "Écrit un nouveau fichier de code/contenu dans le projet — la génération elle-même est faite par le modèle appelant, cet outil l'enregistre.",
    category: "developpement",
    schemaInput: {
      type: "object",
      properties: { ...PROJET_ID, ...CHEMIN, contenu: { type: "string" }, description: { type: "string" } },
      required: ["projetId", "chemin", "contenu"],
    },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 8000,
    idempotent: false,
    auditCategory: "chantier_code",
  }),
  outilImplemente({
    toolId: "code.edit",
    name: "code.edit",
    description: "Modifie un fichier de code existant du projet en remplaçant tout son contenu par la nouvelle version fournie.",
    category: "developpement",
    schemaInput: {
      type: "object",
      properties: { ...PROJET_ID, ...CHEMIN, contenu: { type: "string" } },
      required: ["projetId", "chemin", "contenu"],
    },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 8000,
    idempotent: false,
    auditCategory: "chantier_code",
  }),
  outilImplemente({
    toolId: "code.refactor",
    name: "code.refactor",
    description: "Réécrit un fichier de code existant (renommage, découpage, nettoyage) — le fichier doit déjà exister.",
    category: "developpement",
    schemaInput: {
      type: "object",
      properties: { ...PROJET_ID, ...CHEMIN, contenu: { type: "string" }, motif: { type: "string" } },
      required: ["projetId", "chemin", "contenu"],
    },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 8000,
    idempotent: false,
    auditCategory: "chantier_code",
  }),

  // ── Shell sandboxé ───────────────────────────────────────────────────
  outilImplemente({
    toolId: "shell.execute",
    name: "shell.execute",
    description: "Lance une commande npm/npx/node confinée au workspace du projet, sans interprétation shell (arguments en tableau, aucune injection possible).",
    category: "developpement",
    schemaInput: {
      type: "object",
      properties: {
        ...PROJET_ID,
        binaire: { type: "string", enum: ["npm", "npx", "node"] },
        arguments: { type: "array", items: { type: "string" } },
      },
      required: ["projetId", "binaire", "arguments"],
    },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 120000,
    idempotent: false,
    auditCategory: "chantier_shell",
  }),

  // ── Cycle dépendances / build / test / lint / typecheck ─────────────
  outilImplemente({
    toolId: "dependencies.install",
    name: "dependencies.install",
    description: "Installe les dépendances déclarées dans le package.json du projet (npm ci si lockfile présent, sinon npm install).",
    category: "developpement",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 180000,
    idempotent: true,
    auditCategory: "chantier_build",
  }),
  outilImplemente({
    toolId: "build.run",
    name: "build.run",
    description: "Lance le script « build » déclaré dans le package.json du projet, ou dit honnêtement qu'aucun script de build n'existe.",
    category: "developpement",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "MEDIUM",
    requiredPermissions: ["TEST"],
    timeoutMs: 180000,
    idempotent: true,
    auditCategory: "chantier_build",
  }),
  outilImplemente({
    toolId: "test.run",
    name: "test.run",
    description: "Lance le script « test » déclaré dans le package.json du projet, ou dit honnêtement qu'aucun script de test n'existe.",
    category: "developpement",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "MEDIUM",
    requiredPermissions: ["TEST"],
    timeoutMs: 180000,
    idempotent: true,
    auditCategory: "chantier_build",
  }),
  outilImplemente({
    toolId: "lint.run",
    name: "lint.run",
    description: "Lance le script « lint » déclaré dans le package.json du projet, ou dit honnêtement qu'aucun script de lint n'existe.",
    category: "developpement",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "LOW",
    requiredPermissions: ["TEST"],
    timeoutMs: 120000,
    idempotent: true,
    auditCategory: "chantier_build",
  }),
  outilImplemente({
    toolId: "typecheck.run",
    name: "typecheck.run",
    description: "Vérifie les types TypeScript du projet (script déclaré, sinon npx tsc --noEmit si un tsconfig.json existe).",
    category: "developpement",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "LOW",
    requiredPermissions: ["TEST"],
    timeoutMs: 120000,
    idempotent: true,
    auditCategory: "chantier_build",
  }),

  // ── Preview Engine ───────────────────────────────────────────────────
  outilImplemente({
    toolId: "preview.start",
    name: "preview.start",
    description: "Démarre un aperçu temporaire local du projet (serveur statique ou script dev npm) — jamais public, jamais déployé.",
    category: "developpement",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 30000,
    idempotent: false,
    auditCategory: "chantier_preview",
  }),
  outilImplemente({
    toolId: "preview.stop",
    name: "preview.stop",
    description: "Arrête l'aperçu temporaire en cours du projet.",
    category: "developpement",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "LOW",
    requiredPermissions: ["WRITE"],
    timeoutMs: 10000,
    idempotent: true,
    auditCategory: "chantier_preview",
  }),
  outilImplemente({
    toolId: "preview.status",
    name: "preview.status",
    description: "Consulte l'état de l'aperçu du projet (en cours, arrêté, erreur) et vérifie que la page répond réellement.",
    category: "developpement",
    schemaInput: { type: "object", properties: PROJET_ID, required: ["projetId"] },
    riskLevel: "READ_ONLY",
    requiredPermissions: ["READ"],
    timeoutMs: 8000,
    idempotent: true,
    auditCategory: "chantier_preview",
  }),

  // ── Erreurs / correction ─────────────────────────────────────────────
  outilImplemente({
    toolId: "error.analyze",
    name: "error.analyze",
    description: "Analyse un journal d'erreur (build/test/shell) et renvoie un diagnostic condensé de la cause probable.",
    category: "developpement",
    schemaInput: {
      type: "object",
      properties: { ...PROJET_ID, executionId: { type: "number" }, texteErreur: { type: "string" } },
      required: ["projetId"],
    },
    riskLevel: "LOW",
    requiredPermissions: ["ANALYZE"],
    timeoutMs: 20000,
    idempotent: true,
    auditCategory: "chantier_correction",
  }),
  outilImplemente({
    toolId: "code.fix",
    name: "code.fix",
    description: "Applique une correction (contenu déjà corrigé par le modèle) à un fichier existant du projet.",
    category: "developpement",
    schemaInput: {
      type: "object",
      properties: { ...PROJET_ID, ...CHEMIN, contenuCorrige: { type: "string" }, diagnostic: { type: "string" } },
      required: ["projetId", "chemin", "contenuCorrige"],
    },
    riskLevel: "MEDIUM",
    requiredPermissions: ["WRITE"],
    timeoutMs: 8000,
    idempotent: false,
    auditCategory: "chantier_correction",
  }),
];

export const TOOL_IDS_CHANTIER = OUTILS_CHANTIER.map((o) => o.toolId);
