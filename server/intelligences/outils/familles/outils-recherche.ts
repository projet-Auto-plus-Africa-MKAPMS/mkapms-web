/**
 * MKA.P-MS AI — implémentations réelles de la famille "recherche".
 * Seul recherche.webSearchNatifOpenAI est IMPLEMENTED (server/intelligences/
 * outils/familles/recherche.ts) — webSearch et internalSearch n'ont
 * volontairement aucune entrée ici, exactement comme les autres familles.
 */
import type { ImplementationOutil } from "../outils-test.js";
import { rechercherWebNatif } from "../../provider.js";
import { activee } from "../../fonctions.js";

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "recherche.webSearchNatifOpenAI": async (args) => {
    const requete = args.requete;
    if (typeof requete !== "string" || requete.trim().length < 2) {
      throw new Error("Argument « requete » requis (au moins 2 caractères).");
    }
    // Gouverné par la direction (fonctions.ts, code "recherche_web", Centre
    // Intelligence → onglet Fonctions) : rien ne s'allume tout seul, même un
    // outil que le modèle sait demander.
    const capacite = await activee("recherche_web");
    if (!capacite.ok) {
      return { disponible: false, reponse: "", sources: [], motif: capacite.motif };
    }
    return rechercherWebNatif(requete);
  },
};
