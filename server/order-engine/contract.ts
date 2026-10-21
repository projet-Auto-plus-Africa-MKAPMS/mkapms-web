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
  // Branches terminales / d'exception (§36 du Plan Maître).
  "annulee",
  "litige",
  "remboursee",
] as const;
export type InternalOrderStatus = (typeof INTERNAL_ORDER_STATUSES)[number];

export const TERMINAL_INTERNAL_STATUSES: InternalOrderStatus[] = [
  "annulee",
  "litige",
  "remboursee",
];

/** Transitions internes autorisées. "decision_finale" se résout ensuite via `order_decisions`, jamais un statut terminal en lui-même. */
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
  decision_finale: ["remboursee"],
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

/** Bus d'événements typés (voir server/event-bus/catalog.ts — domaine "commande"). */
export type OrderEngineEvent =
  | ({ type: "commande.creee"; vehicleItemId: number; customerId: number } & OrderEngineEventBase)
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
