/**
 * Contrôles réels pour cinq moteurs jusqu'ici sans couverture : livraison,
 * livraison_vehicule, achat, avis_reputation, boutons.
 *
 * Chaque contrôle interroge la plateforme réellement en service (HTTP public)
 * ou le catalogue statique chargé en mémoire — jamais une simulation.
 */
import { http, estIntrouvable, type Observation, type Scenario } from "./helpers.js";

export const UNIVERS_SCENARIOS: Scenario[] = [
  {
    id: "livraison.page_publique",
    domaine: "livraison",
    label: "Univers Livraison : la page publique répond",
    criticite: "normale",
    attendu: "/livraison sert une vraie page, pas un écran « introuvable ».",
    async run(): Promise<Observation> {
      const r = await http("/livraison");
      if (!r.ok)
        return { statut: "ignore", observe: `Page injoignable : ${r.motif}` };
      if (estIntrouvable(r.corps))
        return { statut: "echec", observe: `/livraison renvoie une page introuvable (statut ${r.status}).` };
      return { statut: "reussi", observe: `/livraison répond (statut ${r.status}).` };
    },
  },
  {
    id: "livraison_vehicule.page_publique",
    domaine: "livraison_vehicule",
    label: "Vehicle Delivery Engine : la page publique répond",
    criticite: "normale",
    attendu: "/livraison-vehicule sert une vraie page, pas un écran « introuvable ».",
    async run(): Promise<Observation> {
      const r = await http("/livraison-vehicule");
      if (!r.ok)
        return { statut: "ignore", observe: `Page injoignable : ${r.motif}` };
      if (estIntrouvable(r.corps))
        return { statut: "echec", observe: `/livraison-vehicule renvoie une page introuvable (statut ${r.status}).` };
      return { statut: "reussi", observe: `/livraison-vehicule répond (statut ${r.status}).` };
    },
  },
  {
    id: "achat.page_publique",
    domaine: "achat",
    label: "Univers Achat : la page publique répond",
    criticite: "critique",
    attendu: "/acheter sert une vraie page, pas un écran « introuvable ».",
    async run(): Promise<Observation> {
      const r = await http("/acheter");
      if (!r.ok)
        return { statut: "ignore", observe: `Page injoignable : ${r.motif}` };
      if (estIntrouvable(r.corps))
        return { statut: "echec", observe: `/acheter renvoie une page introuvable (statut ${r.status}).` };
      return { statut: "reussi", observe: `/acheter répond (statut ${r.status}).` };
    },
  },
  {
    id: "avis_reputation.page_confiance",
    domaine: "avis_reputation",
    label: "Reviews & Reputation Engine : la page de confiance répond",
    criticite: "normale",
    attendu: "/confiance sert une vraie page, pas un écran « introuvable ».",
    async run(): Promise<Observation> {
      const r = await http("/confiance");
      if (!r.ok)
        return { statut: "ignore", observe: `Page injoignable : ${r.motif}` };
      if (estIntrouvable(r.corps))
        return { statut: "echec", observe: `/confiance renvoie une page introuvable (statut ${r.status}).` };
      return { statut: "reussi", observe: `/confiance répond (statut ${r.status}).` };
    },
  },
  {
    id: "boutons.catalogue_coherent",
    domaine: "boutons",
    label: "Button Engine : le catalogue est chargé et sans doublon",
    criticite: "critique",
    attendu: "ACTIONS_BOUTONS contient au moins un bouton et chaque code y est unique.",
    async run(): Promise<Observation> {
      try {
        const { ACTIONS_BOUTONS } = await import("../button-engine/catalogue.js");
        if (ACTIONS_BOUTONS.length === 0)
          return { statut: "echec", observe: "Le catalogue de boutons est vide." };
        const codes = ACTIONS_BOUTONS.map((b) => b.code);
        const doublons = codes.filter((c, i) => codes.indexOf(c) !== i);
        if (doublons.length > 0)
          return {
            statut: "echec",
            observe: `Code(s) en double dans le catalogue : ${[...new Set(doublons)].join(", ")}.`,
          };
        return {
          statut: "reussi",
          observe: `${ACTIONS_BOUTONS.length} bouton(s) déclaré(s), tous les codes sont uniques.`,
        };
      } catch (e) {
        return {
          statut: "echec",
          observe: `Le catalogue de boutons n'a pas pu être chargé : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
    },
  },
];
