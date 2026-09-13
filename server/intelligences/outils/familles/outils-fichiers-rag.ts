/**
 * MKA.P-MS Intelligence — implémentations réelles des familles
 * "fichiers"/"documents"/"recherche" ajoutées par le LOT IA02F
 * (server/intelligences/outils/familles/fichiers-rag.ts).
 */
import * as fichiers from "../../fichiers.js";
import * as connaissance from "../../connaissance.js";
import { retrieve, answer } from "../../rag.js";
import type { ImplementationOutil } from "../outils-test.js";

function exigerActeur(contexte?: { actorId?: number | null }): number {
  if (!contexte?.actorId) throw new Error("Aucun compte authentifié pour cet outil de fichier.");
  return contexte.actorId;
}

const VISIBILITE_PDG = ["interne", "pdg_uniquement"];

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "files.list": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    const resultats = await fichiers.mesFichiers(userId, typeof args.projetId === "number" ? args.projetId : undefined);
    return { fichiers: resultats };
  },

  "files.read": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    if (typeof args.id !== "number") throw new Error("id requis.");
    const r = await fichiers.lireFichier(args.id, userId);
    return { contenuTexte: r.contenuTexte, statutPipeline: r.resume.statutPipeline, morceaux: r.morceaux };
  },

  "files.search": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    const resultats = await fichiers.rechercherDansFichiers(String(args.q ?? ""), userId);
    return { resultats };
  },

  "files.delete": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    if (typeof args.id !== "number") throw new Error("id requis.");
    await fichiers.supprimerFichier(args.id, userId);
    return { ok: true };
  },

  "documents.parse": async (args) => {
    if (typeof args.fichierId !== "number") throw new Error("fichierId requis.");
    const r = await fichiers.traiter(args.fichierId);
    return { statutPipeline: r.statutPipeline, erreur: r.erreur };
  },

  "documents.index": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    if (typeof args.fichierId !== "number") throw new Error("fichierId requis.");
    const r = await fichiers.lireFichier(args.fichierId, userId);
    return { statutPipeline: r.resume.statutPipeline, morceaux: r.morceaux };
  },

  "knowledge.search": async (args) => {
    const resultats = await connaissance.rechercher(String(args.q ?? ""), VISIBILITE_PDG);
    return { resultats };
  },

  "rag.retrieve": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    const r = await retrieve({ query: String(args.q ?? ""), userId, visibiliteConnaissance: VISIBILITE_PDG });
    return { citations: r.citations, methode: r.methode };
  },

  "rag.answer": async (args, contexte) => {
    const userId = exigerActeur(contexte);
    const r = await answer({ query: String(args.q ?? ""), userId, visibiliteConnaissance: VISIBILITE_PDG });
    return { status: r.status, reponse: r.reponse, citations: r.citations };
  },
};
