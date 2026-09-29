/**
 * MKA.P-MS AI — implémentations réelles du coffre de secrets (famille
 * "securite", server/intelligences/outils/familles/coffre.ts). Seule la
 * liste des métadonnées est exposée : aucune valeur ne quitte le serveur.
 */
import type { ImplementationOutil } from "../outils-test.js";
import { listerSecrets } from "../../coffre.js";

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "securite.listerSecrets": async (_args, contexte) => {
    if (typeof contexte?.actorId !== "number") {
      throw new Error("Compte appelant inconnu : le coffre n'est lisible que pour le compte qui l'a rempli.");
    }
    const secrets = await listerSecrets(contexte.actorId);
    return {
      secrets: secrets.map((s) => ({
        nom: s.nom,
        service: s.service,
        type: s.type,
        apercu: s.apercu,
        dernierUsageAt: s.dernierUsageAt ? s.dernierUsageAt.toISOString() : null,
      })),
    };
  },
};
