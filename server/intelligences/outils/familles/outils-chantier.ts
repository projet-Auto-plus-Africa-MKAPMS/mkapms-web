/**
 * Tool Registry — implémentations réelles de la famille « Chantier de
 * développement » (server/intelligences/outils/familles/chantier.ts).
 *
 * Chaque implémentation reçoit `contexte.actorId` (l'appelant réel,
 * server/intelligences/outils/outils-test.ts::ContexteExecution) et vérifie
 * TOUJOURS que le projet demandé appartient à cet appelant avant de toucher
 * au disque — jamais au seul `projetId` fourni par le modèle dans les
 * arguments, qui n'est jamais une preuve d'appartenance.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "../../../db.js";
import { inChantierExecutions } from "../../schema.js";
import * as projets from "../../chantier/projets.js";
import * as fsChantier from "../../chantier/fs.js";
import * as shellChantier from "../../chantier/shell.js";
import * as previewChantier from "../../chantier/preview.js";
import { lirePackageJson, lockfilePresent, scriptPour, tsconfigPresent } from "../../chantier/scripts.js";
import { router } from "../../routeur.js";
import type { ImplementationOutil } from "../outils-test.js";
import type { Projet } from "../../chantier/projets.js";

class AccesRefuse extends Error {}

async function projetAutorise(args: Record<string, unknown>, actorId: number | null | undefined): Promise<Projet> {
  const projetId = Number(args.projetId);
  if (!Number.isFinite(projetId)) throw new AccesRefuse("projetId manquant ou invalide.");
  if (!actorId) throw new AccesRefuse("Aucun appelant authentifié : impossible de vérifier l'appartenance du projet.");
  const projet = await projets.ouvrir(projetId, actorId);
  if (!projet) throw new AccesRefuse(`Projet #${projetId} introuvable ou n'appartenant pas à cet appelant.`);
  return projet;
}

async function enregistrerExecution(input: {
  projetId: number;
  type: string;
  commande: string;
  statut: string;
  codeSortie: number | null;
  dureeMs: number;
  logPath: string | null;
  resume: string;
  actorId: number | null | undefined;
}): Promise<void> {
  await db.insert(inChantierExecutions).values({
    projetId: input.projetId,
    type: input.type,
    commande: input.commande.slice(0, 2000),
    statut: input.statut,
    codeSortie: input.codeSortie,
    dureeMs: input.dureeMs,
    logPath: input.logPath,
    resume: input.resume.slice(0, 4000),
    actorId: input.actorId ?? null,
  });
}

/** Lance un script de package.json (build/test/lint) via npm, ou dit honnêtement qu'il n'existe pas. */
async function lancerScriptDeclare(
  projet: Projet,
  type: "build" | "test" | "lint",
  actorId: number | null | undefined,
): Promise<Record<string, unknown>> {
  const pkg = await lirePackageJson(projet.workspacePath);
  const nomScript = scriptPour(pkg, type);
  if (!nomScript) {
    return { execute: false, motif: `Aucun script « ${type} » déclaré dans le package.json de ce projet.` };
  }
  const r = await shellChantier.executerCommande({
    workspacePath: projet.workspacePath,
    binaire: "npm",
    arguments_: ["run", nomScript],
    timeoutMs: 170000,
    projetId: projet.id,
    type,
  });
  await enregistrerExecution({
    projetId: projet.id,
    type,
    commande: `npm run ${nomScript}`,
    statut: r.statut,
    codeSortie: r.codeSortie,
    dureeMs: r.dureeMs,
    logPath: r.logPath,
    resume: r.statut === "execute" ? r.stdout.slice(-2000) : r.stderr.slice(-2000) || r.stdout.slice(-2000),
    actorId,
  });
  return {
    execute: true,
    statut: r.statut,
    codeSortie: r.codeSortie,
    reussi: r.statut === "execute",
    extraitSortie: (r.stdout + "\n" + r.stderr).slice(-4000),
    logPath: r.logPath,
  };
}

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  // ── Project Engine ──────────────────────────────────────────────────
  "project.create": async (args, contexte) => {
    if (!contexte?.actorId) throw new AccesRefuse("Création de projet refusée : aucun appelant authentifié.");
    const projet = await projets.creerProjet({
      ownerId: contexte.actorId,
      nom: String(args.nom ?? ""),
      description: args.description ? String(args.description) : "",
      typeProjet: args.typeProjet ? String(args.typeProjet) : "site_vitrine",
    });
    return { projet };
  },

  "project.open": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    return { projet };
  },

  "project.read": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const arbre = await fsChantier.arborescence(projet.workspacePath);
    const dernieresExecutions = await db
      .select()
      .from(inChantierExecutions)
      .where(eq(inChantierExecutions.projetId, projet.id))
      .orderBy(desc(inChantierExecutions.createdAt))
      .limit(20);
    return { projet, arborescence: arbre, dernieresExecutions };
  },

  // ── File System Tools ────────────────────────────────────────────────
  "filesystem.list": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    return { entrees: await fsChantier.lister(projet.workspacePath, args.chemin ? String(args.chemin) : ".") };
  },

  "filesystem.read": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    return await fsChantier.lireFichier(projet.workspacePath, String(args.chemin));
  },

  "filesystem.write": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const r = await fsChantier.ecrireFichier(projet.workspacePath, String(args.chemin), String(args.contenu ?? ""));
    await projets.toucher(projet.id);
    return r;
  },

  "filesystem.edit": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const r = await fsChantier.editerFichier(
      projet.workspacePath,
      String(args.chemin),
      String(args.ancienTexte ?? ""),
      String(args.nouveauTexte ?? ""),
    );
    await projets.toucher(projet.id);
    return r;
  },

  "filesystem.move": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    await fsChantier.deplacer(projet.workspacePath, String(args.source), String(args.destination));
    await projets.toucher(projet.id);
    return { ok: true };
  },

  "filesystem.delete": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    await fsChantier.supprimer(projet.workspacePath, String(args.chemin));
    await projets.toucher(projet.id);
    return { ok: true };
  },

  "filesystem.search": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    return { resultats: await fsChantier.rechercher(projet.workspacePath, String(args.requete)) };
  },

  // ── Génération / édition de code ────────────────────────────────────
  "code.generate": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const r = await fsChantier.ecrireFichier(projet.workspacePath, String(args.chemin), String(args.contenu ?? ""));
    await projets.toucher(projet.id);
    return { ...r, genere: true };
  },

  "code.edit": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const r = await fsChantier.ecrireFichier(projet.workspacePath, String(args.chemin), String(args.contenu ?? ""));
    await projets.toucher(projet.id);
    return r;
  },

  "code.refactor": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    await fsChantier.lireFichier(projet.workspacePath, String(args.chemin)); // le fichier doit déjà exister
    const r = await fsChantier.ecrireFichier(projet.workspacePath, String(args.chemin), String(args.contenu ?? ""));
    await projets.toucher(projet.id);
    return r;
  },

  // ── Shell sandboxé ───────────────────────────────────────────────────
  "shell.execute": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const binaire = String(args.binaire ?? "") as "npm" | "npx" | "node";
    const arguments_ = Array.isArray(args.arguments) ? args.arguments.map(String) : [];
    const r = await shellChantier.executerCommande({
      workspacePath: projet.workspacePath,
      binaire,
      arguments_,
      timeoutMs: 115000,
      projetId: projet.id,
      type: "shell",
    });
    await enregistrerExecution({
      projetId: projet.id,
      type: "shell",
      commande: `${binaire} ${arguments_.join(" ")}`,
      statut: r.statut,
      codeSortie: r.codeSortie,
      dureeMs: r.dureeMs,
      logPath: r.logPath,
      resume: (r.stdout + "\n" + r.stderr).slice(-2000),
      actorId: contexte?.actorId,
    });
    await projets.toucher(projet.id);
    return { statut: r.statut, codeSortie: r.codeSortie, extraitSortie: (r.stdout + "\n" + r.stderr).slice(-4000), logPath: r.logPath };
  },

  // ── Dépendances / build / test / lint / typecheck ───────────────────
  "dependencies.install": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const avecLockfile = await lockfilePresent(projet.workspacePath);
    const arguments_ = avecLockfile ? ["ci"] : ["install"];
    const r = await shellChantier.executerCommande({
      workspacePath: projet.workspacePath,
      binaire: "npm",
      arguments_,
      timeoutMs: 175000,
      projetId: projet.id,
      type: "install",
    });
    await enregistrerExecution({
      projetId: projet.id,
      type: "install",
      commande: `npm ${arguments_.join(" ")}`,
      statut: r.statut,
      codeSortie: r.codeSortie,
      dureeMs: r.dureeMs,
      logPath: r.logPath,
      resume: r.statut === "execute" ? "Installation réussie." : (r.stderr || r.stdout).slice(-2000),
      actorId: contexte?.actorId,
    });
    await projets.toucher(projet.id);
    return { statut: r.statut, codeSortie: r.codeSortie, extraitSortie: (r.stdout + "\n" + r.stderr).slice(-4000) };
  },

  "build.run": async (args, contexte) => lancerScriptDeclare(await projetAutorise(args, contexte?.actorId), "build", contexte?.actorId),
  "test.run": async (args, contexte) => lancerScriptDeclare(await projetAutorise(args, contexte?.actorId), "test", contexte?.actorId),
  "lint.run": async (args, contexte) => lancerScriptDeclare(await projetAutorise(args, contexte?.actorId), "lint", contexte?.actorId),

  "typecheck.run": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const pkg = await lirePackageJson(projet.workspacePath);
    const nomScript = scriptPour(pkg, "build"); // pas de type dédié : on regarde d'abord un script "typecheck" explicite ci-dessous
    const scripts = pkg?.scripts ?? {};
    const scriptTypecheck = typeof scripts.typecheck === "string" ? "typecheck" : null;

    if (scriptTypecheck) {
      const r = await shellChantier.executerCommande({
        workspacePath: projet.workspacePath,
        binaire: "npm",
        arguments_: ["run", "typecheck"],
        timeoutMs: 115000,
        projetId: projet.id,
        type: "typecheck",
      });
      await enregistrerExecution({
        projetId: projet.id, type: "typecheck", commande: "npm run typecheck", statut: r.statut,
        codeSortie: r.codeSortie, dureeMs: r.dureeMs, logPath: r.logPath,
        resume: (r.stdout + r.stderr).slice(-2000), actorId: contexte?.actorId,
      });
      return { execute: true, statut: r.statut, codeSortie: r.codeSortie, extraitSortie: (r.stdout + "\n" + r.stderr).slice(-4000) };
    }

    if (!(await tsconfigPresent(projet.workspacePath))) {
      void nomScript;
      return { execute: false, motif: "Aucun script « typecheck » et aucun tsconfig.json : rien à vérifier (projet non TypeScript)." };
    }
    const r = await shellChantier.executerCommande({
      workspacePath: projet.workspacePath,
      binaire: "npx",
      arguments_: ["tsc", "--noEmit"],
      timeoutMs: 115000,
      projetId: projet.id,
      type: "typecheck",
    });
    await enregistrerExecution({
      projetId: projet.id, type: "typecheck", commande: "npx tsc --noEmit", statut: r.statut,
      codeSortie: r.codeSortie, dureeMs: r.dureeMs, logPath: r.logPath,
      resume: (r.stdout + r.stderr).slice(-2000), actorId: contexte?.actorId,
    });
    return { execute: true, statut: r.statut, codeSortie: r.codeSortie, extraitSortie: (r.stdout + "\n" + r.stderr).slice(-4000) };
  },

  // ── Preview Engine ───────────────────────────────────────────────────
  "preview.start": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    return await previewChantier.demarrer(projet.id, projet.workspacePath);
  },

  "preview.stop": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    await previewChantier.arreter(projet.id);
    return { ok: true };
  },

  "preview.status": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const etat = await previewChantier.statut(projet.id);
    const reponse = etat.statut === "en_cours" ? await previewChantier.verifierReponse(projet.id) : null;
    return { ...etat, reponseVerifiee: reponse };
  },

  // ── Erreurs / correction ─────────────────────────────────────────────
  "error.analyze": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const texteErreur = String(args.texteErreur ?? "").slice(0, 8000);
    if (!texteErreur.trim()) {
      return { ok: false, motif: "Aucun texte d'erreur fourni à analyser." };
    }
    const r = await router({
      capacite: "raisonnement",
      moteur: "intelligences",
      role: contexte?.role ?? null,
      systeme:
        "Tu analyses un journal d'erreur de build/test/shell d'un petit projet web. " +
        "Donne un diagnostic court et concret : cause probable, fichier(s) en cause si identifiable, et la correction à faire. " +
        "Ne répète pas le journal, résume-le.",
      message: `Projet : ${projet.nom} (${projet.typeProjet}).\nJournal d'erreur :\n${texteErreur}`,
      confidentialite: "interne",
      maxTokens: 600,
    });
    return { ok: r.ok, diagnostic: r.ok ? r.texte : "", motif: r.motif };
  },

  "code.fix": async (args, contexte) => {
    const projet = await projetAutorise(args, contexte?.actorId);
    const r = await fsChantier.ecrireFichier(projet.workspacePath, String(args.chemin), String(args.contenuCorrige ?? ""));
    await projets.toucher(projet.id);
    return { ...r, corrige: true, diagnostic: args.diagnostic ? String(args.diagnostic) : "" };
  },
};
