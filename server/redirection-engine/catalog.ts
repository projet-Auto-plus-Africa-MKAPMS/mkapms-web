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

/**
 * Alias de chemins connus : un chemin qui n'a pas (ou plus) de page dédiée est
 * redirigé automatiquement vers la bonne page. Sert de base d'auto-résolution
 * des 404 par le Moteur de Redirection. Le PDG peut en ajouter d'autres depuis
 * le centre de contrôle (clé "path:<chemin>").
 */
export interface PathAlias {
  from: string;
  to: string;
  label: string;
}

export const PATH_ALIASES: PathAlias[] = [
  { from: "/reparer", to: "/garages", label: "Chemin — Réparer → Réseau de garages" },
  { from: "/reparation", to: "/garages", label: "Chemin — Réparation → Réseau de garages" },
  { from: "/reparations", to: "/garages", label: "Chemin — Réparations → Réseau de garages" },
  { from: "/garage", to: "/garages", label: "Chemin — Garage → Réseau de garages" },
  { from: "/depanner", to: "/depannage", label: "Chemin — Dépanner → Dépannage" },
  { from: "/remorquage", to: "/depannage", label: "Chemin — Remorquage → Dépannage" },
  { from: "/piece", to: "/pieces", label: "Chemin — Pièce → Pièces détachées" },
  { from: "/acheter-voiture", to: "/acheter", label: "Chemin — Acheter voiture → Acheter" },
  { from: "/vente", to: "/vendre", label: "Chemin — Vente → Vendre" },
  { from: "/location", to: "/louer", label: "Chemin — Location → Louer" },
  { from: "/aide-support", to: "/aide", label: "Chemin — Aide support → Centre d'aide" },
  { from: "/support", to: "/aide", label: "Chemin — Support → Centre d'aide" },
  { from: "/contact", to: "/aide", label: "Chemin — Contact → Centre d'aide" },
];

/**
 * Clés d'OBSERVATION : parcours dont la destination est dynamique (fiche
 * véhicule, commande, ville, résultat de recherche…). Le moteur les suit pour
 * détecter un parcours mort, mais ne leur impose pas de destination fixe :
 * remplacer l'adresse d'une fiche par une règle unique casserait le lien de
 * tous les autres articles. Elles sont déclarées ici pour que l'audit ne les
 * confonde pas avec des clés oubliées.
 */
export interface ObservedKey {
  key: string;
  label: string;
  zone: string;
}

export const OBSERVED_KEYS: ObservedKey[] = [
  { key: "geo_fiche_vehicule", label: "Géo — Fiche véhicule depuis une page locale", zone: "geo" },
  { key: "geo_ville_voisine", label: "Géo — Ville voisine", zone: "geo" },
  { key: "piece_commande", label: "Pièces — Suivi d'une commande", zone: "produits" },
  { key: "piece_connexion_requise", label: "Pièces — Connexion demandée avant commande", zone: "produits" },
  { key: "vo_marque", label: "VO — Recherche par marque du stock réel", zone: "vo" },
  { key: "vo_categorie", label: "VO — Recherche par catégorie du stock réel", zone: "vo" },
  { key: "compta_ecritures_filtrees", label: "Comptabilité — Écritures filtrées depuis le tableau de bord", zone: "comptabilite" },
];

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
  { key: "bouton_favoris", label: "Bouton — Favoris", kind: "button", target: "/favoris", priority: 110 },
  { key: "bouton_portefeuille", label: "Bouton — Portefeuille", kind: "button", target: "/wallet", priority: 110 },
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

  // ── Produits, pièces et catalogues ────────────────────────────────────
  { key: "produit_pieces_catalogue", label: "Produits — Catalogue pièces", kind: "route", target: "/pieces", priority: 90 },
  { key: "produit_pieces_recherche", label: "Produits — Recherche intelligente de pièces", kind: "service", target: "/pieces/recherche-intelligente-pieces", priority: 80 },
  { key: "produit_pieces_compatibilite", label: "Produits — Vérification de compatibilité", kind: "service", target: "/pieces/verification-compatibilite", priority: 80 },
  { key: "produit_pieces_panier", label: "Produits — Panier pièces", kind: "button", target: "/pieces/panier-pieces-detachees", priority: 80 },
  { key: "produit_officiel", label: "Produits — Boutique officielle", kind: "route", target: "/acheter/mkapms-officiel", priority: 80 },

  // ── Pages géographiques (pays / région / ville / quartier) ────────────
  // Les pages locales existent (SEO OS) mais n'étaient reliées à aucune clé :
  // le moteur ne pouvait donc ni les superviser ni corriger leurs parcours.
  { key: "geo_recherche_locale", label: "Géo — Recherche à proximité", kind: "route", target: "/pres-de-moi", priority: 70 },
  { key: "geo_vehicules_locaux", label: "Géo — Véhicules de la zone", kind: "route", target: "/acheter", priority: 70 },
  { key: "geo_pieces_locales", label: "Géo — Pièces de la zone", kind: "route", target: "/pieces", priority: 70 },
  { key: "geo_garages_locaux", label: "Géo — Garages de la zone", kind: "route", target: "/garages", priority: 70 },

  // ── Comptabilité ──────────────────────────────────────────────────────
  { key: "compta_accueil", label: "Comptabilité — Accueil", kind: "route", target: "/comptabilite", priority: 80 },
  { key: "compta_facturation", label: "Comptabilité — Facturation", kind: "route", target: "/comptabilite/facturation", priority: 70 },
  { key: "compta_tva", label: "Comptabilité — TVA", kind: "route", target: "/comptabilite/tva", priority: 70 },
  { key: "compta_paiements", label: "Comptabilité — Paiements", kind: "route", target: "/comptabilite/paiements", priority: 70 },
  { key: "compta_rapports", label: "Comptabilité — Rapports", kind: "route", target: "/comptabilite/rapports", priority: 70 },
  { key: "compta_comptables", label: "Comptabilité — Trouver un comptable", kind: "route", target: "/comptables", priority: 70 },

  // ── VO (véhicules d'occasion) ─────────────────────────────────────────
  { key: "vo_accueil", label: "VO — Espace VO", kind: "route", target: "/vo", priority: 80 },
  { key: "vo_estimation", label: "VO — Estimer un véhicule", kind: "service", target: "/acheter/estimation", priority: 80 },
  { key: "vo_reprise", label: "VO — Reprise", kind: "service", target: "/acheter/reprise", priority: 70 },

  // ── Acquisition : estimation, acheminement, paiement ──────────────────
  { key: "service_estimation_cout_total", label: "Service — Coût total d'acquisition", kind: "service", target: "/acheter/estimation", priority: 80 },
  { key: "service_livraison_vehicule", label: "Service — Acheminement d'un véhicule", kind: "service", target: "/vente/livraison", priority: 80 },
  { key: "service_livraison_pieces", label: "Service — Livraison de pièces", kind: "service", target: "/livraison", priority: 80 },

  // ── Boutons déclarés au Moteur de boutons ─────────────────────────────
  // Ces clés sont celles du catalogue du Moteur de boutons : le PDG peut
  // changer la destination d'un bouton d'écran sans toucher au code.
  { key: "bouton_garage_devis", label: "Bouton — Demande de devis garage", kind: "button", target: "/garage/demande-devis", priority: 90 },
  { key: "bouton_garage_panier_pieces", label: "Bouton — Panier de pièces garage", kind: "button", target: "/garage/panier-pieces", priority: 90 },
  { key: "bouton_garage_facturation", label: "Bouton — Facturation du dossier atelier", kind: "button", target: "/comptabilite/facturation", priority: 90 },
  { key: "bouton_garage_suivi", label: "Bouton — Suivi des interventions garage", kind: "button", target: "/compte", priority: 90 },

  // ── Alias de chemins (auto-résolution des 404) ────────────────────────
  // Un chemin obsolète/synonyme qui n'a pas de page propre est redirigé
  // automatiquement vers la bonne page (clé "path:<chemin>"). Le Moteur de
  // Redirection s'en sert pour RÉSOUDRE seul les pages introuvables (404).
  ...PATH_ALIASES.map<DefaultRule>((a) => ({
    key: `path:${a.from}`,
    label: a.label,
    kind: "route",
    target: a.to,
    priority: 200,
  })),
];
