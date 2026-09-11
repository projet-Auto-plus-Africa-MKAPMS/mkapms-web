/**
 * Contrôles de vie pour des moteurs jusqu'ici absents du contrôle continu
 * (0 preuve de test dans l'audit d'activation — point 91).
 *
 * Même règle que le reste du catalogue : un contrôle observe la plateforme
 * réellement en service, il ne simule jamais un succès.
 */
import { http, estIntrouvable, type Observation, type Scenario } from "./helpers.js";

/** Une route publique répond réellement (200, pas la page « introuvable »). */
function pagePublique(opts: {
  id: string;
  domaine: string;
  route: string;
  label: string;
  criticite: "critique" | "normale";
}): Scenario {
  return {
    id: opts.id,
    domaine: opts.domaine,
    label: opts.label,
    criticite: opts.criticite,
    attendu: `GET ${opts.route} renvoie 200 et n'est pas la page « introuvable ».`,
    async run(): Promise<Observation> {
      const r = await http(opts.route);
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
  };
}

export const UNIVERS_SCENARIOS: Scenario[] = [
  pagePublique({
    id: "livraison.page_publique",
    domaine: "livraison",
    route: "/livraison",
    label: "La page Livraison répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "livraison_vehicule.page_publique",
    domaine: "livraison_vehicule",
    route: "/louer/livraison",
    label: "La page Livraison de véhicule répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "achat.page_publique",
    domaine: "achat",
    route: "/acheter",
    label: "La page Acheter répond avec du contenu réel",
    criticite: "critique",
  }),
  pagePublique({
    id: "avis_reputation.page_confiance",
    domaine: "avis_reputation",
    route: "/confiance",
    label: "La page Confiance (avis consolidés) répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "identity.page_connexion",
    domaine: "identity",
    route: "/connexion",
    label: "La page de connexion répond avec du contenu réel",
    criticite: "critique",
  }),
  pagePublique({
    id: "garage.page_publique",
    domaine: "garage",
    route: "/garages",
    label: "La page Garages répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "pieces.page_publique",
    domaine: "pieces",
    route: "/pieces",
    label: "La page Pièces répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "visibility.page_admin",
    domaine: "visibility",
    route: "/superadmin/visibilite-croissance",
    label: "Le centre de visibilité (direction) répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "monitoring.page_admin",
    domaine: "monitoring",
    route: "/superadmin/admin-statistiques",
    label: "Le centre de statistiques (direction) répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "search.page_publique",
    domaine: "search",
    route: "/rechercher",
    label: "La page de recherche répond avec du contenu réel",
    criticite: "critique",
  }),
  pagePublique({
    id: "support.page_aide",
    domaine: "support",
    route: "/aide",
    label: "La page d'aide répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "messaging.page_messagerie",
    domaine: "messaging",
    route: "/messagerie",
    label: "La page de messagerie répond avec du contenu réel",
    criticite: "normale",
  }),
  pagePublique({
    id: "atelier.page_publique",
    domaine: "atelier",
    route: "/atelier-pro",
    label: "La page Atelier Pro répond avec du contenu réel",
    criticite: "normale",
  }),
  {
    id: "estimation.sante_calculee",
    domaine: "estimation",
    label: "L'état de santé du Estimation Hub est calculé, pas simulé",
    criticite: "critique",
    attendu: "controlCenterFeed() répond sans erreur et ne signale pas de compatibilité pièce/modèle cassée.",
    async run(): Promise<Observation> {
      try {
        const { controlCenterFeed } = await import("../estimation-hub/service.js");
        const r = await controlCenterFeed();
        if (r.health === "degraded")
          return { statut: "echec", observe: r.resume };
        return { statut: "reussi", observe: r.resume };
      } catch (e) {
        return {
          statut: "echec",
          observe: `Estimation Hub n'a pas répondu : ${e instanceof Error ? e.message : "erreur inconnue"}`,
        };
      }
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
