/**
 * Catalogue des redirections par défaut de MKA.P-MS.
 *
 * Objectif : connecter le Moteur de Redirection à TOUTE la plateforme (et non
 * plus à 2 boutons seulement). Chaque « point de redirection » important de la
 * plateforme (univers, sous-sections, services, boutons/CTA principaux) a une
 * clé stable ici. Le client résout ces clés via <SmartLink> ; le PDG peut
 * ensuite modifier la destination de n'importe quelle clé depuis le centre de
 * contrôle sans toucher au code.
 *
 * Ce catalogue sert de valeurs PAR DÉFAUT : le bootstrap n'insère que les clés
 * manquantes et ne réécrase JAMAIS une règle déjà configurée par le PDG.
 */
export interface DefaultRule {
  key: string;
  label: string;
  kind: "button" | "service" | "route";
  target: string;
  priority?: number;
}

export const DEFAULT_REDIRECT_RULES: DefaultRule[] = [
  // ── Univers principaux ────────────────────────────────────────────────
  { key: "univers_acheter", label: "Univers — Acheter", kind: "route", target: "/acheter", priority: 100 },
  { key: "univers_louer", label: "Univers — Louer", kind: "route", target: "/louer", priority: 100 },
  { key: "univers_vendre", label: "Univers — Vendre", kind: "route", target: "/vendre", priority: 100 },
  { key: "univers_pieces", label: "Univers — Pièces", kind: "route", target: "/pieces", priority: 100 },
  { key: "univers_garages", label: "Univers — Garages", kind: "route", target: "/garages", priority: 100 },
  { key: "univers_depannage", label: "Univers — Dépannage", kind: "route", target: "/depannage", priority: 100 },
  { key: "univers_catalogue_technique", label: "Univers — Catalogue technique", kind: "route", target: "/catalogue-technique", priority: 90 },
  { key: "univers_liste", label: "Tous les univers", kind: "route", target: "/univers", priority: 90 },

  // ── Sous-sections (isolables : achat/vente/location officiel/pro/particulier)
  { key: "acheter_particulier", label: "Acheter — Particulier", kind: "route", target: "/acheter/particulier", priority: 80 },
  { key: "acheter_pro", label: "Acheter — Professionnel", kind: "route", target: "/acheter/pro", priority: 80 },
  { key: "louer_particulier", label: "Louer — Particulier", kind: "route", target: "/louer/particulier", priority: 80 },
  { key: "louer_pro", label: "Louer — Professionnel", kind: "route", target: "/louer/pro", priority: 80 },

  // ── Services automobiles principaux ───────────────────────────────────
  { key: "service_controle_technique", label: "Service — Contrôle technique", kind: "service", target: "/service/controle-technique", priority: 70 },
  { key: "service_carte_grise", label: "Service — Carte grise", kind: "service", target: "/carte-grise", priority: 70 },
  { key: "service_devis_garage", label: "Service — Devis garage", kind: "service", target: "/devis", priority: 70 },
  { key: "service_demarches", label: "Service — Démarches administratives", kind: "service", target: "/demarches", priority: 70 },
  { key: "service_atelier_pro", label: "Service — Atelier pro", kind: "service", target: "/atelier-pro", priority: 60 },

  // ── Boutons / CTA principaux ──────────────────────────────────────────
  { key: "bouton_deposer_annonce", label: "Bouton — Déposer une annonce", kind: "button", target: "/vendre", priority: 120 },
  { key: "bouton_devenir_pro", label: "Bouton — Devenir professionnel", kind: "button", target: "/espace-pro", priority: 120 },
  { key: "bouton_devenir_partenaire", label: "Bouton — Devenir partenaire", kind: "button", target: "/espace-pro", priority: 120 },
  { key: "bouton_connexion", label: "Bouton — Connexion", kind: "button", target: "/connexion", priority: 110 },
  { key: "bouton_compte", label: "Bouton — Mon compte", kind: "button", target: "/compte", priority: 110 },
  { key: "bouton_messagerie", label: "Bouton — Messagerie", kind: "button", target: "/messagerie", priority: 110 },
  { key: "bouton_notifications", label: "Bouton — Notifications", kind: "button", target: "/notifications", priority: 100 },
  { key: "bouton_admin", label: "Bouton — Espace Admin", kind: "button", target: "/admin", priority: 100 },
  { key: "bouton_abonnements", label: "Bouton — Abonnements", kind: "button", target: "/abonnements", priority: 100 },
  { key: "bouton_publicite", label: "Bouton — Demander une publicité", kind: "button", target: "/demande-publicite", priority: 90 },
  { key: "bouton_comptabilite", label: "Bouton — Comptabilité", kind: "button", target: "/comptabilite", priority: 90 },
  { key: "bouton_aide", label: "Bouton — Centre d'aide", kind: "button", target: "/aide", priority: 90 },
  { key: "bouton_confiance", label: "Bouton — Centre de confiance", kind: "button", target: "/confiance", priority: 90 },
  { key: "bouton_mission", label: "Bouton — Notre mission", kind: "button", target: "/mission", priority: 80 },

  // ── Navigation d'en-tête (menu principal) ─────────────────────────────
  { key: "nav_acheter", label: "Menu — Acheter", kind: "route", target: "/acheter", priority: 100 },
  { key: "nav_louer", label: "Menu — Louer", kind: "route", target: "/louer", priority: 100 },
  { key: "nav_pieces", label: "Menu — Pièces", kind: "route", target: "/pieces", priority: 100 },
  { key: "nav_devis", label: "Menu — Devis Garage", kind: "route", target: "/devis", priority: 100 },
  { key: "nav_garages", label: "Menu — Garages", kind: "route", target: "/garages", priority: 100 },
  { key: "nav_univers", label: "Menu — Univers", kind: "route", target: "/univers", priority: 100 },
  { key: "nav_abonnements", label: "Menu — Abonnements", kind: "route", target: "/abonnements", priority: 100 },
];
