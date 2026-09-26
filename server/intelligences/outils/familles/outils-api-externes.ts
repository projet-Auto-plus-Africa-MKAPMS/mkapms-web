/**
 * MKA.P-MS AI — implémentations réelles de la famille "api_externes".
 * Seuls les outils IMPLEMENTED du registre (server/intelligences/outils/
 * familles/api-externes.ts) ont une entrée ici — les REGISTERED_NOT_IMPLEMENTED
 * n'en ont volontairement aucune, exactement comme les autres familles.
 */
import type { ImplementationOutil } from "../outils-test.js";
import { modererTexte } from "../../provider.js";
import { merchantState } from "../../../product-engine/service.js";

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "api_externes.moderateContent": async (args) => {
    const texte = args.texte;
    if (typeof texte !== "string" || texte.trim().length === 0) {
      throw new Error("Argument « texte » requis et non vide.");
    }
    return modererTexte(texte);
  },

  "api_externes.getGoogleMerchantStatus": async () => merchantState(),
};
