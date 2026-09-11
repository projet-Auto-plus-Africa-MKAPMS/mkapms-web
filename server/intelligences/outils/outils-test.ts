/**
 * MKA.P-MS Intelligence — implémentations réelles des outils de test
 * (server/intelligences/outils/registre.ts, préfixe "test.").
 *
 * Aucun effet de bord, aucune donnée réelle, aucune écriture. Un futur lot
 * ajoutera les outils métier dans des fichiers séparés du même genre
 * (ex. outils-vehicules.ts) sans toucher à executeur.ts.
 */
export type ImplementationOutil = (args: Record<string, unknown>) => Promise<unknown>;

export const IMPLEMENTATIONS: Record<string, ImplementationOutil> = {
  "test.lire_info_interne": async () => ({
    info: "MKA.P-MS Intelligence — outil de test, aucune donnée réelle.",
    horodatage: new Date().toISOString(),
  }),

  "test.calcul_simple": async (args) => {
    const a = args.a as number;
    const b = args.b as number;
    const operation = args.operation as string;
    switch (operation) {
      case "addition":
        return { resultat: a + b };
      case "soustraction":
        return { resultat: a - b };
      case "multiplication":
        return { resultat: a * b };
      case "division":
        if (b === 0) throw new Error("Division par zéro.");
        return { resultat: a / b };
      default:
        throw new Error(`Opération inconnue : ${operation}.`);
    }
  },

  "test.recherche_simulee": async (args) => {
    const requete = String(args.requete ?? "");
    return {
      resultats: [
        `Résultat simulé 1 pour « ${requete} »`,
        `Résultat simulé 2 pour « ${requete} »`,
      ],
    };
  },

  "test.recuperer_statut": async () => ({ statut: "ok" }),

  // "test.action_sensible_simulee" n'a volontairement aucune implémentation :
  // la politique (requiresHumanApproval) le bloque toujours avant l'exécution
  // dans ce lot, donc l'exécuteur ne devrait jamais l'atteindre. Si ça arrive
  // un jour, c'est que la politique a une faille — mieux vaut une erreur
  // explicite ("implémentation absente") qu'un faux succès silencieux.
};
