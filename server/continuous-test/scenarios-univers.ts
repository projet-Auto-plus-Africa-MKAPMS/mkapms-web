/**
 * Contrôles de vie pour des moteurs jusqu'ici absents du contrôle continu
 * (0 preuve de test dans l'audit d'activation — point 91).
 *
 * Même règle que le reste du catalogue : un contrôle observe la plateforme
 * réellement en service, il ne simule jamais un succès.
 */
import { http, estIntrouvable, type Observation, type Scenario } from "./helpers.js";

export const UNIVERS_SCENARIOS: Scenario[] = [
  {
    id: "livraison.page_publique",
    domaine: "livraison",
    label: "La page Livraison répond avec du contenu réel",
    criticite: "normale",
    attendu: "GET /livraison renvoie 200 et n'est pas la page « introuvable ».",
    async run(): Promise<Observation> {
      const r = await http("/livraison");
      if (!r.ok) {
        return r.reseau
          ? { statut: "echec", observe: `Page injoignable : ${r.motif}` }
          : { statut: "ignore", observe: r.motif };
      }
      if (r.status !== 200) return { statut: "echec", observe: `HTTP ${r.status} reçu.` };
      if (estIntrouvable(r.corps))
        return { statut: "echec", observe: "HTTP 200 mais la page affiche « introuvable »." };
      return { statut: "reussi", observe: `HTTP 200, page servie (${r.corps.length} octets).` };
    },
  },
  {
    id: "livraison_vehicule.page_publique",
    domaine: "livraison_vehicule",
    label: "La page Livraison de véhicule répond avec du contenu réel",
    criticite: "normale",
    attendu: "GET /louer/livraison renvoie 200 et n'est pas la page « introuvable ».",
    async run(): Promise<Observation> {
      const r = await http("/louer/livraison");
      if (!r.ok) {
        return r.reseau
          ? { statut: "echec", observe: `Page injoignable : ${r.motif}` }
          : { statut: "ignore", observe: r.motif };
      }
      if (r.status !== 200) return { statut: "echec", observe: `HTTP ${r.status} reçu.` };
      if (estIntrouvable(r.corps))
        return { statut: "echec", observe: "HTTP 200 mais la page affiche « introuvable »." };
      return { statut: "reussi", observe: `HTTP 200, page servie (${r.corps.length} octets).` };
    },
  },
  {
    id: "achat.page_publique",
    domaine: "achat",
    label: "La page Acheter répond avec du contenu réel",
    criticite: "critique",
    attendu: "GET /acheter renvoie 200 et n'est pas la page « introuvable ».",
    async run(): Promise<Observation> {
      const r = await http("/acheter");
      if (!r.ok) {
        return r.reseau
          ? { statut: "echec", observe: `Page injoignable : ${r.motif}` }
          : { statut: "ignore", observe: r.motif };
      }
      if (r.status !== 200) return { statut: "echec", observe: `HTTP ${r.status} reçu.` };
      if (estIntrouvable(r.corps))
        return { statut: "echec", observe: "HTTP 200 mais la page affiche « introuvable »." };
      return { statut: "reussi", observe: `HTTP 200, page servie (${r.corps.length} octets).` };
    },
  },
  {
    id: "avis_reputation.page_confiance",
    domaine: "avis_reputation",
    label: "La page Confiance (avis consolidés) répond avec du contenu réel",
    criticite: "normale",
    attendu: "GET /confiance renvoie 200 et n'est pas la page « introuvable ».",
    async run(): Promise<Observation> {
      const r = await http("/confiance");
      if (!r.ok) {
        return r.reseau
          ? { statut: "echec", observe: `Page injoignable : ${r.motif}` }
          : { statut: "ignore", observe: r.motif };
      }
      if (r.status !== 200) return { statut: "echec", observe: `HTTP ${r.status} reçu.` };
      if (estIntrouvable(r.corps))
        return { statut: "echec", observe: "HTTP 200 mais la page affiche « introuvable »." };
      return { statut: "reussi", observe: `HTTP 200, page servie (${r.corps.length} octets).` };
    },
  },
  {
    id: "boutons.catalogue_coherent",
    domaine: "boutons",
    label: "Le catalogue du Moteur de boutons est chargé et sans code dupliqué",
    criticite: "critique",
    attendu: "ACTIONS_BOUTONS n'est pas vide et chaque code de bouton est unique.",
    async run(): Promise<Observation> {
      const { ACTIONS_BOUTONS } = await import("./../button-engine/catalogue.js");
      if (ACTIONS_BOUTONS.length === 0) {
        return { statut: "echec", observe: "Catalogue chargé mais vide : aucun bouton déclaré." };
      }
      const codes = ACTIONS_BOUTONS.map((a) => a.code);
      const doublons = codes.filter((c, i) => codes.indexOf(c) !== i);
      if (doublons.length > 0) {
        return {
          statut: "echec",
          observe: `${new Set(doublons).size} code(s) de bouton dupliqué(s) : ${[...new Set(doublons)].slice(0, 5).join(", ")}.`,
        };
      }
      return {
        statut: "reussi",
        observe: `${ACTIONS_BOUTONS.length} bouton(s) déclaré(s), tous les codes sont uniques.`,
      };
    },
  },
];
