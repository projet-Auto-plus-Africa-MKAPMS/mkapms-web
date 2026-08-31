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
    code: "garage_commande_piece",
    libelle: "Commander la pièce",
    ecran: "/garage/commandes-automatiques",
    genre: "navigation",
    cible: "/garage/panier-pieces",
    cleRedirection: "bouton_garage_panier_pieces",
  },
  {
    code: "garage_reappro_auto",
    libelle: "Activer le réapprovisionnement automatique",
    ecran: "/garage/commandes-automatiques",
    genre: "non_branchee",
    manque:
      "Le stock garage existe désormais côté serveur et signale lui-même ses ruptures (événement atelier.stock_bas), mais aucun déclencheur planifié ne passe commande automatiquement : la commande reste une décision de l'atelier.",
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

  // ── Garage — contact équipe et clients ────────────────────────────────
  {
    code: "garage_appeler_client",
    libelle: "Appeler",
    ecran: "/garage",
    genre: "appel",
  },
  {
    code: "garage_email_equipe",
    libelle: "Email",
    ecran: "/garage",
    genre: "email",
  },
];

const PAR_CODE = new Map(ACTIONS_BOUTONS.map((a) => [a.code, a]));

export function actionParCode(code: string): ActionBouton | undefined {
  return PAR_CODE.get(code);
}
