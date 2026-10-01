/**
 * MKA.P-MS AI — implémentations réelles des outils GitHub (lecture seule,
 * server/intelligences/outils/familles/github.ts). Le jeton est lu dans le
 * coffre par le code serveur, avec un motif journalisé, et ne quitte jamais
 * cette fonction.
 */
import type { ImplementationOutil } from "../outils-test.js";
import { jetonDepuisCoffre, listerExecutionsAndroid, verifierConnexion } from "../../github.js";

function compteAppelant(contexte: { actorId?: number | null } | undefined): number {
  if (typeof contexte?.actorId !== "number") {
    throw new Error("Compte appelant inconnu : le coffre n'est lisible que pour le compte qui l'a rempli.");
  }
  return contexte.actorId;
}

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "developpement.githubVerifierConnexion": async (_args, contexte) => {
    const jeton = await jetonDepuisCoffre(compteAppelant(contexte), "developpement.githubVerifierConnexion", "Vérifier la connexion GitHub demandée par le PDG");
    if (!jeton.ok) return { ok: false, detail: jeton.detail };
    return verifierConnexion(jeton.jeton);
  },
  "developpement.githubExecutionsAndroid": async (_args, contexte) => {
    const jeton = await jetonDepuisCoffre(compteAppelant(contexte), "developpement.githubExecutionsAndroid", "Consulter les exécutions du workflow Android demandées par le PDG");
    if (!jeton.ok) return { ok: false, detail: jeton.detail, executions: [], dernierSucces: null };
    return listerExecutionsAndroid(jeton.jeton);
  },
};
