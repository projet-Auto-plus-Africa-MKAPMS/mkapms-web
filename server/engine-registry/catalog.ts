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
  category: "core" | "transversal" | "univers" | "service" | "sous_section";
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
    name: "identity",
    label: "Identity OS",
    category: "transversal",
    dependencies: ["core"],
    description: "Identités, sessions, MFA TOTP, vérifications, agents IA, audit — 34 procédures.",
    state: "active",
  },
  {
    name: "country",
    label: "Country OS",
    category: "transversal",
    dependencies: ["core"],
    description: "Registre mondial des pays (langues, devises, TVA, univers actifs) — configuration pure.",
    state: "active",
  },
  {
    name: "language",
    label: "Language OS",
    category: "transversal",
    dependencies: ["core", "country"],
    description: "9 langues, traductions namespace/clé, préférences utilisateur, détection auto.",
    state: "active",
  },
  {
    name: "notification",
    label: "Notification OS",
    category: "transversal",
    dependencies: ["core", "identity", "language"],
    description: "Multi-canaux (email, SMS, push, in-app), templates multi-langues, préférences utilisateur, dispatch avec journal.",
    state: "active",
  },
  {
    name: "document",
    label: "Document OS",
    category: "transversal",
    dependencies: ["core", "language", "country"],
    description: "Registre unifié : factures, contrats, devis, bons de commande, attestations. Templates multi-langues par pays.",
    state: "active",
  },
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
    label: "Permission OS",
    category: "transversal",
    dependencies: ["core", "identity"],
    description: "2 niveaux : matrice de rôle + politiques contextuelles (pays × type × univers × abonnement × contrat × ancienneté × device × risk).",
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
    name: "account_routing",
    label: "Account Routing Engine",
    category: "transversal",
    dependencies: ["core", "identity", "permission"],
    description:
      "Retour automatique de chaque compte dans son univers : particulier, vendeur, garage, location, VTC/Taxi, pièces, livraison, administration, direction, PDG.",
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
    name: "visibility",
    label: "Global Visibility Engine",
    category: "transversal",
    dependencies: ["core", "seo", "smart"],
    description:
      "Moteur central de visibilité mondiale : coordonne SEO, visibilité IA/GEO, audience, canaux sociaux et publication organique (une info → tous les canaux).",
    state: "active",
  },
  {
    name: "pro_portal",
    label: "Pro Portal Engine",
    category: "transversal",
    dependencies: ["core", "payment", "country"],
    description:
      "Portail professionnel mondial (.pro) : métiers, catalogue de services à la carte, composition d'offre et parcours jusqu'à l'activation.",
    state: "active",
  },
  {
    name: "pro_account",
    label: "Pro Account Engine",
    category: "transversal",
    dependencies: ["core", "country", "payment", "notification"],
    description:
      "Dossier professionnel légal par pays et par métier : exigences variables, vérification humaine, paiement séparé et activation contrôlée.",
    state: "active",
  },
  {
    name: "payment_orchestrator",
    label: "Payment Orchestrator",
    category: "transversal",
    dependencies: ["core", "payment", "country"],
    description:
      "Sélection du prestataire de paiement selon pays, devise, service, disponibilité réelle du connecteur et préférence utilisateur. Ajouter un prestataire ne demande pas de reconstruire le checkout.",
    state: "active",
  },
  {
    name: "financial_intelligence",
    label: "Financial Intelligence Engine",
    category: "transversal",
    dependencies: ["core", "payment", "comptabilite", "notification"],
    description:
      "Surveillance financière autonome : paiement échoué, double paiement, remboursement, facture manquante, abonnement expiré, commande sans paiement, montant ou devise incohérents.",
    state: "active",
  },
  {
    name: "accounting_internal",
    label: "Internal Accounting Engine",
    category: "transversal",
    dependencies: ["core", "payment", "comptabilite"],
    description:
      "Comptabilité interne MKA.P-MS : rapprochement paiement ↔ écriture, commissions, remboursements, abonnements, écarts.",
    state: "active",
  },
  {
    name: "accounting_marketplace",
    label: "Accounting Marketplace Engine",
    category: "transversal",
    dependencies: ["core", "identity", "country"],
    description:
      "Annuaire de comptables indépendants (« je cherche un comptable ») : pays, ville, spécialité, langue, disponibilité, note. Aucun accès aux comptes internes.",
    state: "active",
  },
  {
    name: "payment",
    label: "Payment Engine",
    category: "transversal",
    dependencies: ["core", "permission"],
    description: "Moteur de paiement propriétaire (Stripe/virement) — en staging (Phase 2).",
    state: "staging",
  },
  {
    name: "search",
    label: "Search Engine",
    category: "transversal",
    dependencies: ["core", "permission"],
    description: "Recherche universelle unifiée (Search OS).",
    state: "active",
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
    description: "Mémoire centrale (base auto, pièces, pannes, marché).",
    state: "active",
  },
  {
    name: "monitoring",
    label: "Monitoring Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Surveillance santé/performances consolidée (Monitoring OS).",
    state: "active",
  },
  {
    name: "analytics",
    label: "Analytics Engine",
    category: "transversal",
    dependencies: ["core"],
    description: "Analyse d'usage et comportement (recherches, activité, parcours).",
    state: "active",
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
    name: "vo_engine",
    label: "VO Engine — estimation & reprise",
    category: "univers",
    dependencies: ["core", "country", "notification"],
    description:
      "Amont client du VO : estimation en fourchette sur le marché local, demande de reprise et dossier VO de confiance.",
    state: "active",
  },
  {
    name: "proximity_engine",
    label: "Proximity Engine",
    category: "transversal",
    dependencies: ["core", "country"],
    description:
      "Recherche locale « près de moi » par service et matrice de complétude des univers en mini-plateformes.",
    state: "active",
  },
  {
    name: "partner_engine",
    label: "Partner Engine",
    category: "transversal",
    dependencies: ["core", "country", "notification", "visibility"],
    description:
      "Réseau partenaires (pays, métier, zone, contrat, leads, performance) et acquisition des professionnels là où la demande dépasse l'offre.",
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
  // ── Univers principaux (marketplace) ──
  {
    name: "achat",
    label: "Univers Achat Engine",
    category: "univers",
    dependencies: ["core", "permission", "search"],
    description: "Univers Achat : parcours acheteur, filtres, favoris, mise en relation.",
    state: "active",
  },
  {
    name: "vente",
    label: "Univers Vente Engine",
    category: "univers",
    dependencies: ["core", "permission"],
    description: "Univers Vente : dépôt d'annonce, gestion, mise en avant, transactions.",
    state: "active",
  },
  {
    name: "location",
    label: "Univers Location Engine",
    category: "univers",
    dependencies: ["core", "permission"],
    description: "Univers Location : voitures, utilitaires, camions, LOA, réservations.",
    state: "active",
  },
  // ── Sous-sections univers Achat (Officiel / Pro / Particulier) ──
  {
    name: "achat_officiel",
    label: "Achat Officiel Engine",
    category: "sous_section",
    dependencies: ["core", "achat"],
    description: "Sous-section Achat Officiel MKA.P-MS (stock officiel).",
    state: "staging",
  },
  {
    name: "achat_pro",
    label: "Achat Professionnel Engine",
    category: "sous_section",
    dependencies: ["core", "achat"],
    description: "Sous-section Achat Professionnel (vendeurs pros).",
    state: "staging",
  },
  {
    name: "achat_particulier",
    label: "Achat Particulier Engine",
    category: "sous_section",
    dependencies: ["core", "achat"],
    description: "Sous-section Achat Particulier — isolable (location/vente à un opérateur).",
    state: "staging",
  },
  // ── Sous-sections univers Vente (Officiel / Pro / Particulier) ──
  {
    name: "vente_officiel",
    label: "Vente Officielle Engine",
    category: "sous_section",
    dependencies: ["core", "vente"],
    description: "Sous-section Vente Officielle MKA.P-MS.",
    state: "staging",
  },
  {
    name: "vente_pro",
    label: "Vente Professionnelle Engine",
    category: "sous_section",
    dependencies: ["core", "vente"],
    description: "Sous-section Vente Professionnelle (vendeurs pros).",
    state: "staging",
  },
  {
    name: "vente_particulier",
    label: "Vente Particulier Engine",
    category: "sous_section",
    dependencies: ["core", "vente"],
    description: "Sous-section Vente Particulier — isolable.",
    state: "staging",
  },
  // ── Sous-sections univers Location (Pro / Particulier) ──
  {
    name: "location_pro",
    label: "Location Professionnelle Engine",
    category: "sous_section",
    dependencies: ["core", "location"],
    description: "Sous-section Location Professionnelle.",
    state: "staging",
  },
  {
    name: "location_particulier",
    label: "Location Particulier Engine",
    category: "sous_section",
    dependencies: ["core", "location"],
    description: "Sous-section Location Particulier.",
    state: "staging",
  },
  // ── Services dédiés ──
  {
    name: "controle_technique",
    label: "Contrôle Technique Engine",
    category: "service",
    dependencies: ["core"],
    description: "Prise de RDV, centres agréés, résultats, rappels d'échéance.",
    state: "active",
  },
  {
    name: "assurance",
    label: "Assurance Engine",
    category: "service",
    dependencies: ["core"],
    description: "Devis assurance, contrats, sinistres, partenaires.",
    state: "active",
  },
  {
    name: "energie_recharge",
    label: "Energy Engine — Recharge",
    category: "service",
    dependencies: ["core", "country"],
    description:
      "Annuaire des bornes de recharge : recherche filtrée, déclarations validées par un humain.",
    state: "active",
  },
  {
    name: "avis_reputation",
    label: "Reviews & Reputation Engine",
    category: "service",
    dependencies: ["core", "country", "notification"],
    description:
      "Avis multi-univers par pays, expériences vérifiées après transaction réelle, réponses professionnelles et officielles, réputation consolidée.",
    state: "active",
  },
  {
    // Connecteur externe : il dépend d'une identification Google, donc il reste
    // en préproduction tant qu'aucun relevé n'a été obtenu de Google.
    name: "connecteur_google_business",
    label: "Connecteur Google Business Profile",
    category: "service",
    dependencies: ["core", "avis_reputation"],
    description:
      "Rattachement des établissements physiques éligibles et relevé séparé de leur réputation Google. Avis internes et avis Google restent distincts.",
    state: "staging",
  },
  {
    // Mémoire technique de l'entreprise : elle apprend d'abord des données
    // MKA.P-MS elles-mêmes. Les sources externes restent des connecteurs à
    // autoriser un par un (point 62).
    name: "connaissance_auto",
    label: "Automotive Knowledge Engine",
    category: "transversal",
    dependencies: ["core", "smart", "country"],
    description:
      "Mémoire automobile reliée, datée et sourcée : véhicules, motorisations, pièces, diagnostics, réglementation. Une connaissance n'est jamais publiée sans décision du PDG.",
    state: "active",
  },
  {
    // Limite réglementaire de l'automatisation : ce moteur ne fait pas avancer
    // une action, il l'arrête quand la règle du pays n'est pas confirmée.
    name: "politique_pays",
    label: "Country Policy Engine",
    category: "transversal",
    dependencies: ["core", "country", "smart"],
    description:
      "Contrôle réglementaire par pays avant exécution : règles confirmées, validité, autorité. Sans règle confirmée, l'action repart en validation humaine.",
    state: "active",
  },
  {
    // Ce moteur ne produit rien : il empêche l'autonomie de devenir dangereuse.
    name: "resilience",
    label: "Resilience & Safety Engine",
    category: "transversal",
    dependencies: ["core", "smart", "country"],
    description:
      "Fermeture au public sans destruction, actions critiques à confirmation renforcée, pipeline obligatoire avant production, auto-réparation vérifiée, mémoire des échecs.",
    state: "active",
  },
  {
    // Il ne décide rien : il traduit une demande humaine en action déjà tracée.
    name: "command_center",
    label: "Command & Development Center",
    category: "transversal",
    dependencies: ["core", "smart", "country", "resilience"],
    description:
      "Commandes écrites et vocales transformées en actions structurées et journalisées, dossiers de l'agent développeur passant obligatoirement par le pipeline avant production.",
    state: "active",
  },
  {
    name: "rd_lab",
    label: "Automotive R&D Lab",
    category: "transversal",
    dependencies: ["core", "smart", "connaissance_auto"],
    description:
      "Laboratoire R&D séparé des services vendus : projets industriels, chaîne besoin → tests, navigation et calculateurs, avec droits d'usage établis avant tout versement à la mémoire partagée.",
    state: "active",
  },
  {
    name: "ai_fabric",
    label: "AI Fabric",
    category: "transversal",
    dependencies: ["core", "smart", "monitoring"],
    description:
      "Couche entre MKA.P-MS et les fournisseurs externes : routage par capacité, confidentialité et coût, suivi des dépenses, sauvegarde de la mémoire intelligente et supervision de tous les moteurs.",
    state: "active",
  },
  {
    name: "event_bus",
    label: "Bus d'événements central",
    category: "core",
    dependencies: ["core", "smart"],
    description:
      "Achemine réellement les événements entre moteurs : abonnés résolus, traitement exécuté, remise enregistrée avec sa durée et son erreur. Un événement que personne n'écoute est affiché comme orphelin au lieu de rester en attente pour toujours.",
    state: "active",
  },
  {
    name: "smart_audit",
    label: "Audit & activation du Système Intelligent",
    category: "transversal",
    dependencies: ["core", "smart", "ai_fabric"],
    description:
      "Mesure ce que le Système Intelligent sait réellement faire (16 capacités, du simple fait d'observer jusqu'au retour arrière) sur preuve d'usage, et exécute le cycle complet sur les données réelles au lieu de le décrire.",
    state: "active",
  },
  {
    name: "product_engine",
    label: "Google Product Engine",
    category: "transversal",
    dependencies: ["core", "smart", "seo"],
    description:
      "Projette les pièces et produits réellement vendus vers les canaux Google (données structurées Product, flux Merchant Center lorsque éligible) et garde les véhicules hors du catalogue produit, où ils ne seraient que refusés.",
    state: "active",
  },
  {
    name: "indexation",
    label: "Moniteur d'indexation",
    category: "transversal",
    dependencies: ["core", "smart", "seo"],
    description:
      "Contrôle URL par URL ce que le serveur répond réellement (statut, robots, canonical, sitemap, contenu, données structurées) et refuse de confondre une soumission avec une indexation Google.",
    state: "active",
  },
  {
    name: "activation_audit",
    label: "Audit d'activation",
    category: "transversal",
    dependencies: ["core", "smart"],
    description:
      "Vérifie domaine par domaine ce qui est réellement connecté, activé, accessible, utilisé et prouvé par un test — le code existant ne suffit jamais à déclarer une fonction terminée.",
    state: "active",
  },
  {
    name: "finance",
    label: "Financement Engine",
    category: "service",
    dependencies: ["core"],
    description: "Financement / crédit / LOA, simulations, dossiers.",
    state: "active",
  },
  {
    name: "encheres",
    label: "Enchères Engine",
    category: "service",
    dependencies: ["core", "payment"],
    description: "Ventes aux enchères : lots, offres, adjudication.",
    state: "active",
  },
  {
    name: "auction_engine",
    label: "Auction Engine",
    category: "service",
    dependencies: ["core", "payment", "notification", "visibility", "country"],
    description:
      "Moteur d'enchères particuliers et professionnels : lots, offres validées côté serveur, prix de réserve, anti-sniping, adjudication, historique et notifications.",
    state: "active",
  },
];
