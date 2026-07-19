/**
 * MKA.P-MS Engine Registry — Catalogue des moteurs connus.
 *
 * Liste de référence des moteurs de la plateforme, utilisée pour amorcer
 * (seed) le registre à vide. Elle reflète l'état réel du dépôt :
 *  - moteurs déjà en place (core, smart, permission, redirection, seo) ;
 *  - moteurs partiels ou à créer (payment, search, workflow, knowledge…).
 *
 * Le seed est idempotent : ajouter une entrée ici ne fait que créer la ligne
 * manquante ; il ne modifie jamais l'état d'un moteur déjà enregistré.
 */
export interface EngineSeed {
  name: string;
  label: string;
  category: "core" | "transversal" | "univers";
  dependencies: string[];
  description: string;
  /** État réel dans le dépôt au moment du seed. */
  state: "active" | "staging" | "disabled";
}

export const ENGINE_CATALOG: EngineSeed[] = [
  // ── Core ──
  {
    name: "core",
    label: "Core Engine",
    category: "core",
    dependencies: [],
    description: "Orchestrateur central : registre, événements, coordination.",
    state: "active",
  },
  // ── Transversaux ──
  {
    name: "smart",
    label: "Smart Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Observation, analyse, alertes, apprentissage (sous validation humaine).",
    state: "active",
  },
  {
    name: "permission",
    label: "Permission Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Contrôle des accès : pages, boutons, endpoints, rôles.",
    state: "active",
  },
  {
    name: "redirection",
    label: "Redirection Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Résolution centralisée des destinations (clés → cibles).",
    state: "active",
  },
  {
    name: "seo",
    label: "SEO Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "SEO automatique et indexation.",
    state: "active",
  },
  {
    name: "payment",
    label: "Payment Engine",
    category: "transversal",
    dependencies: ["core", "permission"],
    description: "Moteur de paiement (Stripe/virement) — à créer (Phase 2).",
    state: "disabled",
  },
  {
    name: "search",
    label: "Search Engine",
    category: "transversal",
    dependencies: ["core", "permission"],
    description: "Recherche universelle — à créer (Phase 2).",
    state: "disabled",
  },
  {
    name: "workflow",
    label: "Workflow Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Automatisation des processus métier — à créer (Phase 2).",
    state: "disabled",
  },
  {
    name: "knowledge",
    label: "Knowledge Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Mémoire centrale (base auto, pièces, pannes, marché) — partiel.",
    state: "disabled",
  },
  {
    name: "notification",
    label: "Notification Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Notifications multi-canaux — partiel (à formaliser).",
    state: "disabled",
  },
  {
    name: "monitoring",
    label: "Monitoring Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Surveillance santé/performances — partiel.",
    state: "disabled",
  },
  {
    name: "analytics",
    label: "Analytics Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Analyse d'usage et comportement — partiel.",
    state: "disabled",
  },
  // ── Univers ──
  {
    name: "vo",
    label: "VO Engine",
    category: "univers",
    dependencies: ["core", "permission"],
    description: "Cycle complet du véhicule d'occasion (16 étapes).",
    state: "active",
  },
  {
    name: "garage",
    label: "Garage Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Fiches garage, devis, réservations, interventions.",
    state: "active",
  },
  {
    name: "pieces",
    label: "Pièces Auto Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Boutiques, stocks, références, commandes.",
    state: "active",
  },
  {
    name: "depannage",
    label: "Dépannage Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Demandes d'intervention, affectation, suivi.",
    state: "active",
  },
  {
    name: "livraison",
    label: "Livraison Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Livraison véhicules/pièces, transport, suivi.",
    state: "active",
  },
  {
    name: "transport",
    label: "VTC & Taxi Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Véhicules, chauffeurs, planning, missions.",
    state: "active",
  },
  {
    name: "comptabilite",
    label: "Comptabilité Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Factures, paiements, TVA, rapports.",
    state: "active",
  },
  {
    name: "importafrica",
    label: "Import Afrique Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Véhicules, pays, transport, douane, suivi.",
    state: "active",
  },
  {
    name: "marketing",
    label: "Publicité Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Emplacements, campagnes, budgets, ciblage.",
    state: "active",
  },
  {
    name: "cartegrise",
    label: "Carte Grise Engine",
    category: "univers",
    dependencies: ["core"],
    description: "Démarches SIV, documents, statuts, suivi.",
    state: "active",
  },
];
