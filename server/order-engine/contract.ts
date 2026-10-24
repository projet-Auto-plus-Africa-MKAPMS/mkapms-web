/**
 * Order Engine — contrat public (types stables, règle MOS #12).
 *
 * Les autres moteurs qui ont besoin de connaître une commande passent par ces
 * types et par les fonctions exportées de `service.ts` — jamais en lisant
 * directement les tables `order_*`.
 */

/**
 * Statut interne (section 8, demande PDG — suivi employé, jamais montré au
 * client tel quel). Reprend aussi le vocabulaire §36-37 du Plan Maître
 * Fournisseurs pour rester alignable avec le Supplier Order Engine.
 */
export const INTERNAL_ORDER_STATUSES = [
  "vehicule_selectionne",
  "disponibilite_confirmee",
  "documents_controles",
  "prix_marge_valides",
  "commande_fournisseur_creee",
  "vehicule_en_preparation",
  "transport_organise",
  "inspection_realisee",
  "pret_visite_livraison",
  "decision_finale",
  // Issues de la décision finale (section 10, demande PDG du 21/10) — chacune
  // son propre terminal, jamais un "remboursee" générique qui confondrait
  // une vente réussie avec un retour.
  "vendue",
  "retour_en_cours",
  "retournee",
  "remise_en_stock",
  // Branches terminales / d'exception (§36 du Plan Maître), possibles à tout
  // moment avant la décision finale.
  "annulee",
  "litige",
  "remboursee",
] as const;
export type InternalOrderStatus = (typeof INTERNAL_ORDER_STATUSES)[number];

export const TERMINAL_INTERNAL_STATUSES: InternalOrderStatus[] = [
  "vendue",
  "retournee",
  "remise_en_stock",
  "annulee",
  "remboursee",
];

/**
 * Transitions internes autorisées. "decision_finale" ne se résout JAMAIS par
 * une transition manuelle libre : `poserDecision()` fait elle-même avancer
 * vers l'issue correspondante (vendue / retour_en_cours / remise_en_stock),
 * dans le même appel que l'enregistrement de la décision — jamais deux
 * actions humaines séparées pour une seule décision.
 */
export const INTERNAL_STATUS_TRANSITIONS: Record<InternalOrderStatus, InternalOrderStatus[]> = {
  vehicule_selectionne: ["disponibilite_confirmee", "annulee"],
  disponibilite_confirmee: ["documents_controles", "annulee"],
  documents_controles: ["prix_marge_valides", "annulee"],
  prix_marge_valides: ["commande_fournisseur_creee", "annulee"],
  commande_fournisseur_creee: ["vehicule_en_preparation", "annulee", "litige"],
  vehicule_en_preparation: ["transport_organise", "litige"],
  transport_organise: ["inspection_realisee", "litige"],
  inspection_realisee: ["pret_visite_livraison", "litige"],
  pret_visite_livraison: ["decision_finale", "litige"],
  decision_finale: ["vendue", "retour_en_cours", "remise_en_stock"],
  vendue: [],
  // Un remboursement partiel/total "selon contrat" (section 10) reste une
  // action distincte (`rembourserCommande`), jamais une transition de statut
  // supplémentaire : "retournee" décrit déjà complètement le sort du véhicule.
  retour_en_cours: ["retournee"],
  retournee: [],
  remise_en_stock: [],
  annulee: [],
  litige: ["remboursee", "pret_visite_livraison"],
  remboursee: [],
};

/**
 * Statut client (section 9, demande PDG) — toujours dérivé du statut interne
 * par `deriveCustomerStatus()` (service.ts), jamais stocké séparément.
 */
export const CUSTOMER_ORDER_STATUSES = [
  "paiement_recu",
  "vehicule_reserve",
  "vehicule_en_preparation",
  "pret_inspection_livraison",
  "solde_valide",
  "vehicule_remis_livre",
  "documents_disponibles",
  // Exposés tels quels au client quand le statut interne l'exige — pas une
  // information cachée, mais jamais les étapes internes fournisseur/employé.
  "annulee",
  "litige_en_cours",
  "rembourse",
] as const;
export type CustomerOrderStatus = (typeof CUSTOMER_ORDER_STATUSES)[number];

/**
 * Les deux statuts publics affichés sur la fiche produit AVANT toute
 * commande (sections 3 et 6, demande PDG). Dérivés de `vehicle_items.status`
 * / `vehicle_availability.status` (Vehicle Engine) + de l'existence d'une
 * commande active ici — jamais un troisième champ de statut à synchroniser.
 */
export const PUBLIC_LISTING_LABELS = ["disponible_sur_commande", "disponible_sur_visite"] as const;
export type PublicListingLabel = (typeof PUBLIC_LISTING_LABELS)[number];

/** Décision finale après visite/inspection (section 10, demande PDG). */
export const ORDER_DECISIONS = ["accepte", "retourne", "garde"] as const;
export type OrderDecision = (typeof ORDER_DECISIONS)[number];

/**
 * Documents générés pour une commande (section 11, demande PDG). Chaque
 * valeur doit avoir un `doc_types.code` correspondant dans le Document OS
 * existant (`server/document-os/templates.ts`) avant utilisation réelle —
 * ce contrat ne recrée pas de registre de documents.
 */
export const ORDER_DOCUMENT_TYPES = [
  "devis",
  "reservation",
  "bon_commande",
  "contrat",
  "recu_acompte",
  "facture_finale",
  "facture_solde",
  "pv_inspection",
  "pv_remise",
  "ordre_mission_transporteur",
  "dossier_retour",
  "document_cession",
  "garantie",
  "document_comptable",
  // Documents reçus du fournisseur, propres au véhicule commandé (demande
  // PDG, comparaison Autohero/Carvana/cinch) — visibles côté client, jamais
  // employé-only : ce sont des pièces de réassurance pour l'acheteur, pas
  // des documents internes.
  "controle_technique",
  "historique_entretien",
  "facture_travaux_autorises",
  "rapport_batterie",
  "certificat_conformite",
] as const;
export type OrderDocumentType = (typeof ORDER_DOCUMENT_TYPES)[number];

/** Documents internes réservés aux employés autorisés, à la comptabilité et à la direction — jamais visibles côté client (section 6). */
export const EMPLOYEE_ONLY_DOCUMENT_TYPES: OrderDocumentType[] = [
  "bon_commande",
  "ordre_mission_transporteur",
  "dossier_retour",
  "document_comptable",
];

export interface OrderEngineEventBase {
  orderItemId: number;
}

/**
 * Origine d'une annonce « véhicule sur commande » (`order_listings`) —
 * traçabilité uniquement, jamais une condition de fonctionnement (règle PDG
 * absolue : l'IA n'est jamais un passage obligé).
 */
export const LISTING_CREATION_MODES = ["ia_assistee", "manuelle"] as const;
export type ListingCreationMode = (typeof LISTING_CREATION_MODES)[number];

/** Bus d'événements typés (voir server/event-bus/catalog.ts — domaine "commande"). */
export type OrderEngineEvent =
  | { type: "commande.annonce_liee"; annonceId: number; supplierProfileId: number; vehicleItemId: number | null; creationMode: ListingCreationMode; employeeId: number }
  | ({ type: "commande.creee"; vehicleItemId: number | null; customerId: number } & OrderEngineEventBase)
  | ({ type: "commande.employe_attribue"; employeeId: number; actorId: number } & OrderEngineEventBase)
  | ({ type: "commande.statut_change"; from: InternalOrderStatus; to: InternalOrderStatus; actorId: number | null } & OrderEngineEventBase)
  | ({ type: "commande.acompte_recu"; amount: number; currency: string } & OrderEngineEventBase)
  | ({ type: "commande.solde_recu"; amount: number; currency: string } & OrderEngineEventBase)
  | ({ type: "commande.decision_prise"; decision: OrderDecision; actorId: number } & OrderEngineEventBase)
  | ({ type: "commande.document_genere"; documentType: OrderDocumentType; docDocumentId: number } & OrderEngineEventBase)
  | ({ type: "commande.annulee"; reason: string } & OrderEngineEventBase)
  | ({ type: "commande.litige_ouvert"; reason: string } & OrderEngineEventBase)
  | ({ type: "commande.remboursee"; amount: number; currency: string } & OrderEngineEventBase);

export const ORDER_ENGINE_META = {
  name: "order-engine" as const,
  label: "Order Engine" as const,
  contract: "server/order-engine/index.ts",
  planReference: "Plan Maître Fournisseurs §36-37 (section COMMANDES)",
};
