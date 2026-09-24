/**
 * MKA.P-MS Button Engine — Catalogue des actions de boutons.
 *
 * Chaque bouton important de la plateforme déclare ici CE QU'IL FAIT, au lieu
 * de le câbler dans l'écran. Le moteur devient donc la source de vérité :
 *
 *  - `navigation` : le moteur donne la destination, résolue au passage par le
 *    Moteur de Redirection (le PDG peut donc changer la cible sans toucher au
 *    code) ;
 *  - `appel` / `email` : le moteur donne le canal de contact ;
 *  - `document` : l'écran produit un document réel (feuille imprimable) ;
 *  - `formulaire` : l'action est une soumission serveur tenue par l'écran, le
 *    moteur ne fait que l'observer ;
 *  - `non_branchee` : l'action est DÉCLARÉE mais rien côté serveur ne sait
 *    encore l'exécuter. Le moteur le dit explicitement (champ `manque`) au
 *    lieu de laisser un bouton muet ou d'afficher un faux succès.
 *
 * Un bouton sans action reste donc visible dans l'inventaire de direction :
 * `non_branchee` n'est pas un état acceptable, c'est une dette nommée.
 */

export type GenreAction =
  | "navigation"
  | "appel"
  | "email"
  | "document"
  | "formulaire"
  | "non_branchee";

export interface ActionBouton {
  /** Code stable du bouton (préfixe par univers : `garage_…`). */
  readonly code: string;
  /** Libellé affiché, pour reconnaître le bouton à l'écran. */
  readonly libelle: string;
  /** Écran où vit le bouton. */
  readonly ecran: string;
  readonly genre: GenreAction;
  /** Moteur métier responsable et procédure réelle, pour le diagnostic. */
  readonly moteur?: string;
  readonly dependances?: readonly string[];
  readonly procedure?: string;
  /**
   * Destination (`navigation`), gabarit de contact (`appel`, `email`) ou
   * identifiant de document (`document`). Vide pour `formulaire` et
   * `non_branchee`.
   */
  readonly cible?: string;
  /**
   * Clé du Moteur de Redirection à interroger avant d'utiliser `cible` :
   * la cible catalogée n'est qu'un repli.
   */
  readonly cleRedirection?: string;
  /** Ce qui manque réellement pour exécuter l'action (`non_branchee`). */
  readonly manque?: string;
}

export const ACTIONS_BOUTONS: readonly ActionBouton[] = [
  { code: "admin_garage_details", libelle: "Détails intervention", ecran: "/superadmin/admin-garage", genre: "formulaire", moteur: "garage", procedure: "garages.adminIntervention", dependances: ["atelier", "identity"] },
  { code: "admin_garage_terminer", libelle: "terminer intervention", ecran: "/superadmin/admin-garage", genre: "formulaire", moteur: "garage", procedure: "garages.adminAction", dependances: ["atelier", "identity", "notification"] },
  { code: "admin_garage_annuler", libelle: "annuler intervention", ecran: "/superadmin/admin-garage", genre: "formulaire", moteur: "garage", procedure: "garages.adminAction", dependances: ["atelier", "identity", "notification"] },
  { code: "admin_garage_archive", libelle: "archive intervention", ecran: "/superadmin/admin-garage", genre: "formulaire", moteur: "garage", procedure: "garages.adminAction", dependances: ["atelier", "identity", "notification"] },
  { code: "admin_garage_restore", libelle: "restore intervention", ecran: "/superadmin/admin-garage", genre: "formulaire", moteur: "garage", procedure: "garages.adminAction", dependances: ["atelier", "identity", "notification"] },
  { code: "admin_employes_enregistrer", libelle: "Enregistrer le profil RH", ecran: "/superadmin/admin-employes", genre: "formulaire", moteur: "workflow", procedure: "hr.saveStaffProfile", dependances: ["identity"] },
  { code: "admin_employes_ajouter_mission", libelle: "Ajouter une mission RH", ecran: "/superadmin/admin-employes", genre: "formulaire", moteur: "workflow", procedure: "hr.addStaffTask", dependances: ["identity"] },
  { code: "admin_employes_filtrer", libelle: "Filtrer les employés", ecran: "/superadmin/admin-employes", genre: "formulaire", moteur: "workflow", procedure: "hr.staffDirectory", dependances: ["identity"] },
  { code: "admin_employes_retirer_mission", libelle: "Retirer une mission du planning", ecran: "/superadmin/admin-employes", genre: "formulaire", moteur: "workflow", procedure: "hr.cancelStaffTask", dependances: ["identity"] },
  { code: "admin_pays_activite", libelle: "Utilisateurs et annonces du pays", ecran: "/superadmin/admin-carte-moniale", genre: "formulaire", moteur: "country", procedure: "countries.activity", dependances: ["identity", "achat", "payment"] },
  { code: "vehicule_recommandation_favori", libelle: "Ajouter / retirer des favoris", ecran: "/vehicule/:id", genre: "formulaire", moteur: "achat", dependances: ["identity"], procedure: "favoris.set", cible: "favoris.set" },
  { code: "vente_alerte_creer", libelle: "Créer l’alerte", ecran: "/vente/centre-alertes-recherche", genre: "formulaire", moteur: "search", dependances: ["notification", "vente"], procedure: "searches.create", cible: "searches.create" },
  { code: "vente_alerte_activer", libelle: "Activer / désactiver", ecran: "/vente/centre-alertes-recherche", genre: "formulaire", moteur: "search", dependances: ["notification", "vente"], procedure: "searches.setAlert", cible: "searches.setAlert" },
  { code: "admin_employe_ajouter", libelle: "Ajouter un employé", ecran: "/superadmin/gestion-employes-m-k-a-p-m-s", genre: "formulaire", moteur: "identity", dependances: ["permission", "workflow"], procedure: "admin.createStaff", cible: "formulaire_creation_compte" },
  { code: "admin_employe_enregistrer", libelle: "Créer le compte", ecran: "/superadmin/gestion-employes-m-k-a-p-m-s", genre: "formulaire", moteur: "identity", dependances: ["permission", "workflow"], procedure: "admin.createStaff", cible: "admin.createStaff" },
  { code: "admin_kyc_valider", libelle: "Valider", ecran: "/superadmin/validation-documents-complete", genre: "formulaire", moteur: "identity", dependances: ["permission", "document"], procedure: "admin.validateKyc", cible: "admin.validateKyc" },
  { code: "admin_kyc_refuser", libelle: "Refuser", ecran: "/superadmin/validation-documents-complete", genre: "formulaire", moteur: "identity", dependances: ["permission", "document"], procedure: "admin.validateKyc", cible: "admin.validateKyc" },
  {
    code: "location_devis_flotte",
    libelle: "Demander un devis flotte",
    ecran: "/louer/pro",
    genre: "navigation",
    moteur: "location",
    procedure: "rentalApplications.create → updateStep → submit",
    cible: "/louer/pro/candidature",
    cleRedirection: "bouton_location_devis_flotte",
  },
  // ── Garage — réception, restitution, contrôle ─────────────────────────
  {
    code: "garage_reception_fiche",
    libelle: "Éditer la fiche de réception",
    ecran: "/garage/reception-vehicule",
    genre: "document",
    cible: "fiche_reception",
  },
  {
    code: "garage_reception_devis",
    libelle: "Ouvrir une demande de devis",
    ecran: "/garage/reception-vehicule",
    genre: "navigation",
    cible: "/garage/demande-devis",
    cleRedirection: "bouton_garage_devis",
  },
  {
    code: "garage_restitution_bon",
    libelle: "Éditer le bon de restitution",
    ecran: "/garage/restitution-client",
    genre: "document",
    cible: "bon_restitution",
  },
  {
    code: "garage_restitution_facture",
    libelle: "Facturation du dossier",
    ecran: "/garage/restitution-client",
    genre: "navigation",
    cible: "/comptabilite/facturation",
    cleRedirection: "bouton_garage_facturation",
  },
  {
    code: "garage_validation_interne",
    libelle: "Valider (validation interne)",
    ecran: "/garage/validation-interne",
    genre: "formulaire",
  },
  {
    code: "garage_cq_validation",
    libelle: "Valider (contrôle qualité premium)",
    ecran: "/garage/controle-qualite-premium",
    genre: "formulaire",
  },

  // ── Garage — pièces et contrats ───────────────────────────────────────
  {
    code: "garage_reappro_auto",
    libelle: "Activer le réapprovisionnement automatique",
    ecran: "/garage/commandes-automatiques",
    genre: "formulaire",
  },
  {
    code: "garage_reappro_proposer_ruptures",
    libelle: "Proposer toutes les ruptures",
    ecran: "/garage/commandes-automatiques",
    genre: "formulaire",
  },
  {
    code: "garage_reappro_valider",
    libelle: "Valider la proposition",
    ecran: "/garage/commandes-automatiques",
    genre: "formulaire",
  },
  {
    code: "garage_reappro_refuser",
    libelle: "Refuser la proposition",
    ecran: "/garage/commandes-automatiques",
    genre: "formulaire",
  },
  {
    code: "garage_reappro_commander",
    libelle: "Passer la commande fournisseur",
    ecran: "/garage/commandes-automatiques",
    genre: "formulaire",
  },
  {
    code: "garage_reappro_receptionner",
    libelle: "Réceptionner la commande",
    ecran: "/garage/commandes-automatiques",
    genre: "formulaire",
  },
  {
    code: "garage_reappro_annuler",
    libelle: "Annuler la commande",
    ecran: "/garage/commandes-automatiques",
    genre: "formulaire",
  },
  {
    code: "garage_reappro_voir_stock",
    libelle: "Voir le stock",
    ecran: "/garage/commandes-automatiques",
    genre: "navigation",
    cible: "/garage/stock-pieces",
    cleRedirection: "bouton_garage_stock",
  },
  {
    code: "garage_contrat_flotte_souscrire",
    libelle: "Souscrire un contrat de flotte",
    ecran: "/garage/contrats-flottes",
    genre: "navigation",
    cible: "/garage/demande-devis",
    cleRedirection: "bouton_garage_devis",
  },

  // ── Garage — dépannage urgent ─────────────────────────────────────────
  {
    code: "garage_depannage_appel",
    libelle: "Appel d'urgence dépannage",
    ecran: "/garage/depannage-garage",
    genre: "non_branchee",
    manque:
      "Aucun numéro d'assistance n'existe côté serveur : les dépanneurs enregistrés (breakdown_providers) n'ont pas de champ téléphone. Afficher un numéro ici serait un numéro inventé.",
  },
  {
    code: "garage_depannage_demande",
    libelle: "Demander un dépanneur",
    ecran: "/garage/depannage-garage",
    genre: "formulaire",
  },
  {
    code: "garage_depannage_photo",
    libelle: "Joindre une photo à la demande de dépannage",
    ecran: "/garage/depannage-garage",
    genre: "non_branchee",
    manque:
      "La demande de dépannage n'a pas de champ média côté serveur (aucune colonne photo sur breakdown_requests) : une photo jointe ici n'arriverait nulle part.",
  },

  // ── Garage — historique du véhicule ───────────────────────────────────
  {
    code: "garage_historique_suivi",
    libelle: "Suivre l'intervention",
    ecran: "/garage/historique-garage",
    genre: "navigation",
    cible: "/compte",
    cleRedirection: "bouton_garage_suivi",
  },
  {
    code: "garage_historique_devis",
    libelle: "Demander un devis pour ce véhicule",
    ecran: "/garage/historique-garage",
    genre: "navigation",
    cible: "/garage/demande-devis",
    cleRedirection: "bouton_garage_devis",
  },
  {
    code: "garage_historique_facture",
    libelle: "Facture de l'intervention",
    ecran: "/garage/historique-garage",
    genre: "non_branchee",
    manque:
      "Aucune facture d'atelier n'est émise côté serveur : les interventions garage n'ont ni montant facturé ni document rattaché, seul leur suivi d'étape est enregistré.",
  },

  // ── Garage — planning atelier ─────────────────────────────────────────
  {
    code: "garage_planning_commencer",
    libelle: "Commencer l'intervention",
    ecran: "/garage/planning-atelier",
    genre: "formulaire",
  },
  {
    code: "garage_planning_pret",
    libelle: "Véhicule prêt",
    ecran: "/garage/planning-atelier",
    genre: "formulaire",
  },
  {
    code: "garage_planning_reporter",
    libelle: "Reporter le rendez-vous",
    ecran: "/garage/planning-atelier",
    genre: "formulaire",
  },

  // ── Garage — stock de pièces ──────────────────────────────────────────
  {
    code: "garage_stock_ajuster",
    libelle: "Enregistrer le stock",
    ecran: "/garage/stock-pieces",
    genre: "formulaire",
  },
  {
    code: "garage_stock_commander",
    libelle: "Commander la pièce",
    ecran: "/garage/stock-pieces",
    genre: "navigation",
    cible: "/garage/panier-pieces",
    cleRedirection: "bouton_garage_panier_pieces",
  },

  // ── Garage — validation du devis par le client ────────────────────────
  {
    code: "garage_devis_accepter",
    libelle: "Accepter le devis",
    ecran: "/garage/validation-client",
    genre: "formulaire",
  },
  {
    code: "garage_devis_refuser",
    libelle: "Refuser le devis",
    ecran: "/garage/validation-client",
    genre: "formulaire",
  },
  {
    code: "garage_devis_modifier",
    libelle: "Demander une modification du devis",
    ecran: "/garage/validation-client",
    genre: "navigation",
    cible: "/garage/demande-devis",
    cleRedirection: "bouton_garage_devis",
  },

  // ── Accueil — barre de recherche universelle ──────────────────────────
  {
    code: "accueil_intelligences_ouvrir",
    libelle: "Ouvrir MKA.P-MS AI (à côté du micro)",
    ecran: "/",
    genre: "formulaire",
  },

  // ── Livraison de véhicules et camions (Vehicle Delivery Engine) ────────
  // Entrées visibles vers le service : accueil, page livraison colis, location.
  {
    code: "accueil_livraison_vehicule",
    libelle: "Faire livrer un véhicule ou un camion (accueil)",
    ecran: "/",
    genre: "navigation",
    cible: "/livraison-vehicule",
    cleRedirection: "service_livraison_vehicule",
  },
  {
    code: "livraison_colis_vers_vehicule",
    libelle: "Faire livrer un véhicule ou un camion (depuis Livraison)",
    ecran: "/livraison",
    genre: "navigation",
    cible: "/livraison-vehicule",
    cleRedirection: "service_livraison_vehicule",
  },
  {
    code: "louer_livraison_vehicule",
    libelle: "Faire livrer un véhicule ou un camion (depuis Location)",
    ecran: "/louer",
    genre: "navigation",
    cible: "/livraison-vehicule",
    cleRedirection: "service_livraison_vehicule",
  },
  // Actions de l'écran du service lui-même.
  {
    code: "livraison_vehicule_onglet_devis",
    libelle: "Onglet Devis",
    ecran: "/livraison-vehicule",
    genre: "formulaire",
  },
  {
    code: "livraison_vehicule_onglet_suivi",
    libelle: "Onglet Suivi",
    ecran: "/livraison-vehicule",
    genre: "formulaire",
  },
  {
    code: "livraison_vehicule_choisir_mode",
    libelle: "Choisir un mode d'acheminement",
    ecran: "/livraison-vehicule",
    genre: "formulaire",
  },
  {
    code: "livraison_vehicule_accepter",
    libelle: "Accepter le devis et créer l'expédition",
    ecran: "/livraison-vehicule",
    genre: "formulaire",
  },
  {
    code: "livraison_vehicule_connexion",
    libelle: "Se connecter pour commander ou suivre",
    ecran: "/livraison-vehicule",
    genre: "navigation",
    cible: "/connexion",
    cleRedirection: "bouton_livraison_vehicule_connexion",
  },
  {
    code: "livraison_vehicule_retour",
    libelle: "Retour à l'accueil",
    ecran: "/livraison-vehicule",
    genre: "navigation",
    cible: "/",
    cleRedirection: "accueil",
  },
  // ── Tableaux de bord VO (moteur VO + Espaces VO) ──────────────────────
  // Les cartes chiffrées sont déclarées par les moteurs eux-mêmes
  // (CARTES_TABLEAU_VO, CARTES_TABLEAU_PRO) ; ici, les boutons d'écran.
  {
    code: "vo_interne_carte_compteur",
    libelle: "Carte du tableau de bord VO → liste filtrée",
    ecran: "/vo",
    genre: "formulaire",
  },
  {
    code: "vente_pro_factures",
    libelle: "Factures",
    ecran: "/vente",
    genre: "navigation",
    cible: "/utilisateurs/factures-utilisateur",
    cleRedirection: "bouton_vente_factures",
  },
  {
    code: "vente_pro_profil",
    libelle: "Mon profil professionnel",
    ecran: "/vente",
    genre: "navigation",
    cible: "/compte?tab=profil",
    cleRedirection: "bouton_vente_profil",
  },
  {
    code: "vente_pro_resume_vendeur",
    libelle: "Résumé vendeur",
    ecran: "/vente",
    genre: "navigation",
    cible: "/vente/resume-vendeur",
    cleRedirection: "vente_resume_vendeur",
  },
  {
    code: "vente_resume_factures",
    libelle: "Factures",
    ecran: "/vente/resume-vendeur",
    genre: "navigation",
    cible: "/utilisateurs/factures-utilisateur",
    cleRedirection: "bouton_vente_factures",
  },
  {
    code: "vente_resume_retour_tableau",
    libelle: "Retour au tableau de bord",
    ecran: "/vente/resume-vendeur",
    genre: "navigation",
    cible: "/vente",
    cleRedirection: "vente_tableau_de_bord_pro",
  },

  // ── Atelier Pro (/atelier-pro) — hub de l'atelier sur données serveur ──
  {
    code: "atelier_intervention_etape",
    libelle: "Changer l'étape de l'intervention",
    ecran: "/atelier-pro",
    genre: "formulaire",
  },
  {
    code: "atelier_stock_mouvement",
    libelle: "Entrée / sortie de stock",
    ecran: "/atelier-pro",
    genre: "formulaire",
  },
  {
    code: "atelier_ouvrir_planning",
    libelle: "Ouvrir le planning atelier",
    ecran: "/atelier-pro",
    genre: "navigation",
    cible: "/garage/planning-atelier",
    cleRedirection: "bouton_atelier_planning",
  },
  {
    code: "atelier_ouvrir_stock",
    libelle: "Gérer le stock de pièces",
    ecran: "/atelier-pro",
    genre: "navigation",
    cible: "/garage/stock-pieces",
    cleRedirection: "bouton_garage_stock",
  },
  {
    code: "atelier_ouvrir_reappro",
    libelle: "Réapprovisionnement",
    ecran: "/atelier-pro",
    genre: "navigation",
    cible: "/garage/commandes-automatiques",
    cleRedirection: "bouton_atelier_reappro",
  },
  {
    code: "atelier_ouvrir_catalogue",
    libelle: "Catalogue technique",
    ecran: "/atelier-pro",
    genre: "navigation",
    cible: "/catalogue-technique",
    cleRedirection: "bouton_atelier_catalogue",
  },
  {
    code: "atelier_ouvrir_pieces",
    libelle: "Rechercher une pièce",
    ecran: "/atelier-pro",
    genre: "navigation",
    cible: "/garage/recherche-pieces",
    cleRedirection: "bouton_atelier_pieces",
  },
  {
    code: "atelier_client_appeler",
    libelle: "Appeler le client",
    ecran: "/atelier-pro",
    genre: "appel",
  },
  {
    code: "atelier_client_ecrire",
    libelle: "Écrire au client",
    ecran: "/atelier-pro",
    genre: "email",
  },
  {
    code: "atelier_devis_garage",
    libelle: "Devis émis par l'atelier",
    ecran: "/atelier-pro",
    genre: "non_branchee",
    manque:
      "Les demandes de devis (devis_garage_requests) sont déposées par les clients sans garage destinataire : aucun devis n'est encore rattaché à un garage côté serveur, l'atelier ne peut donc ni lister ni émettre de devis.",
  },
  {
    code: "atelier_factures",
    libelle: "Factures de l'atelier",
    ecran: "/atelier-pro",
    genre: "non_branchee",
    manque:
      "Aucune facture d'atelier n'est émise côté serveur : les interventions garage n'ont ni montant facturé ni document rattaché, seul leur suivi d'étape est enregistré.",
  },
  {
    code: "atelier_ordres_reparation",
    libelle: "Ordres de réparation",
    ecran: "/atelier-pro",
    genre: "non_branchee",
    manque:
      "Aucune table d'ordre de réparation côté serveur : l'intervention est suivie par étape (rdv_garage) mais sans ordre signé, photos de réception ni lignes de travaux.",
  },
  {
    code: "atelier_employes",
    libelle: "Équipe de l'atelier",
    ecran: "/atelier-pro",
    genre: "non_branchee",
    manque:
      "Aucune table d'employés ou de mécaniciens rattachés à un garage côté serveur : impossible d'affecter une intervention ou de lire un planning par employé.",
  },
  {
    code: "catalogue_technique_rechercher",
    libelle: "Identifier le véhicule (plaque / VIN)",
    ecran: "/catalogue-technique",
    genre: "formulaire",
  },
  {
    code: "catalogue_technique_commander_piece",
    libelle: "Commander la pièce dans l'univers Pièces",
    ecran: "/catalogue-technique",
    genre: "navigation",
    cible: "/garage/recherche-pieces",
    cleRedirection: "bouton_atelier_pieces",
  },
  {
    code: "catalogue_technique_imprimer_couples",
    libelle: "Imprimer les couples de serrage",
    ecran: "/catalogue-technique",
    genre: "document",
  },
];

const PAR_CODE = new Map(ACTIONS_BOUTONS.map((a) => [a.code, a]));

export function actionParCode(code: string): ActionBouton | undefined {
  return PAR_CODE.get(code);
}
