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
    dependencies: ["ai_learning", "audit", "identity", "smart", "visibility"],
    description:
      "Orchestrateur central : registre, événements, coordination. Socle des autres moteurs : ce sont eux qui dépendent de lui, pas l'inverse.",
    state: "active",
  },
  // ── Transversaux ──
  {
    name: "identity",
    label: "Identity OS",
    category: "transversal",
    dependencies: ["core","country","language","account_routing","audit","media_authenticity","notification","smart","achat","depannage","garage","messaging","payment","pieces","pro_portal","search","support"],
    description: "Identités, sessions, MFA TOTP, vérifications, agents Intelligence, audit — 34 procédures.",
    state: "active",
  },
  {
    name: "country",
    label: "Country OS",
    category: "transversal",
    dependencies: ["core","identity"],
    description: "Registre mondial des pays (langues, devises, TVA, univers actifs) — configuration pure.",
    state: "active",
  },
  {
    name: "language",
    label: "Language OS",
    category: "transversal",
    dependencies: ["core","country","identity"],
    description: "9 langues, traductions namespace/clé, préférences utilisateur, détection auto.",
    state: "active",
  },
  {
    name: "notification",
    label: "Notification OS",
    category: "transversal",
    dependencies: ["core", "identity", "language", "contract"],
    description: "Multi-canaux (email, SMS, push, in-app), templates multi-langues, préférences utilisateur, dispatch avec journal.",
    state: "active",
  },
  {
    name: "document",
    label: "Document OS",
    category: "transversal",
    dependencies: ["core","language","country","identity"],
    description: "Registre unifié : factures, contrats, devis, bons de commande, attestations. Templates multi-langues par pays.",
    state: "active",
  },
  {
    name: "media_authenticity",
    label: "Media Authenticity Engine",
    category: "transversal",
    dependencies: ["core","smart","ai_fabric","event_bus"],
    description:
      "Provenance des photos, vidéos et justificatifs : empreinte, métadonnées, réutilisation, signature C2PA. Constate, n'authentifie pas un document administratif — la décision reste humaine.",
    state: "staging",
  },
  {
    name: "smart",
    label: "Smart Engine",
    category: "transversal",
    dependencies: ["core","identity","permission","notification","monitoring","avis_reputation","country","event_bus","politique_pays","redirection","resilience","seo","boutons"],
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
    dependencies: ["core", "identity", "permission", "smart"],
    description: "Résolution centralisée des destinations (clés → cibles).",
    state: "active",
  },
  {
    name: "boutons",
    label: "Moteur de boutons",
    category: "transversal",
    dependencies: ["core", "redirection", "event_bus", "smart"],
    description:
      "Chaque bouton déclare un code d'action ; le moteur donne l'action à exécuter, résoud la destination via le Moteur de Redirection, signale chaque clic et publie « bouton.sans_action » au Système Intelligent quand l'action mène au vide.",
    state: "active",
  },
  {
    name: "atelier",
    label: "Moteur d'Atelier",
    category: "service",
    dependencies: ["core","boutons","event_bus","smart","permission","achat","garage","notification"],
    description:
      "Capacités serveur de l'atelier : validation interne et contrôle qualité opposables, stock de pièces avec un mouvement par écriture, réapprovisionnement gouverné (seuil → proposition persistante → décision humaine → commande fournisseur sous plafond mensuel → réception en stock), report de rendez-vous tracé. Chaque écriture est publiée à l'Event Bus, supervisée par le Système Intelligent et mémorisée par MKA.P-MS AI.",
    state: "active",
  },
  {
    name: "auto_branchement",
    label: "Module d'auto-branchement",
    category: "transversal",
    dependencies: ["core", "boutons", "redirection", "event_bus", "smart", "intelligences"],
    description:
      "Relit l'inventaire généré des éléments cliquables de tous les écrans, revérifie chaque destination auprès du Moteur de Redirection, et remet chaque défaut à l'Event Bus, au Système Intelligent et à MKA.P-MS AI. Il constate et propose : il ne modifie jamais le code de production.",
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
    dependencies: ["core","smart","country","language","avis_reputation","event_bus","garage","indexation","redirection"],
    description: "SEO automatique et indexation.",
    state: "active",
  },
  {
    name: "visibility",
    label: "Global Visibility Engine",
    category: "transversal",
    dependencies: ["core","smart","identity"],
    description:
      "Moteur central de visibilité mondiale : coordonne SEO, visibilité Intelligence/GEO, audience, canaux sociaux et publication organique (une info → tous les canaux).",
    state: "active",
  },
  {
    // Dépendance mutuelle avec pro_account, acceptée et documentée (pas un
    // oubli) : pro_portal->pro_account n'est pas un import serveur direct —
    // la preuve réelle est client/src/pages/pro/DossierPro.tsx, un écran du
    // parcours pro qui appelle à la fois trpc.proPortal et trpc.proAccount.
    // Le sens inverse (pro_account->pro_portal) est lui un vrai import
    // serveur : server/pro-account/service.ts importe
    // server/pro-portal/contract.ts (requirementsFor) pour savoir quels
    // justificatifs réunir avant l'activation d'un dossier. La boucle ne
    // bloque pas le démarrage (un seul processus) ; le registre la signale
    // déjà comme « à surveiller », pas comme une erreur.
    name: "pro_portal",
    label: "Pro Portal Engine",
    category: "transversal",
    dependencies: ["core","payment","country","audit","pro_account"],
    description:
      "Portail professionnel mondial (.pro) : métiers, catalogue de services à la carte, composition d'offre et parcours jusqu'à l'activation.",
    state: "active",
  },
  {
    // Dépendance réelle et vérifiée vers pro_portal : server/pro-account/
    // service.ts importe server/pro-portal/contract.ts (requirementsFor).
    // Voir le commentaire sur pro_portal ci-dessus pour le sens inverse
    // (dépendance mutuelle acceptée, pas un oubli).
    name: "pro_account",
    label: "Pro Account Engine",
    category: "transversal",
    dependencies: ["core","country","notification","pro_portal"],
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
    dependencies: ["core","permission","achat","event_bus","livraison_vehicule","payment_orchestrator","smart","workflow","country"],
    description: "Moteur de paiement propriétaire (Stripe/virement) — en staging (Phase 2).",
    state: "staging",
  },
  {
    name: "payout_engine",
    label: "Payout Engine",
    category: "transversal",
    dependencies: ["core","permission","payment","payment_orchestrator","event_bus","supplier_engine","vehicle_engine","logistics_engine"],
    description:
      "LOT 5 du Plan Maître Fournisseurs (§32) : politiques de versement fournisseur/transporteur (immédiat/enlèvement/livraison/documents/étape, 50/50, 30/70, 100 %), déclenchées par l'Event Bus (vente véhicule, leg logistique) — en staging tant qu'aucun versement réel n'a été validé par la Direction.",
    state: "staging",
  },
  {
    name: "document_engine",
    label: "Document Engine",
    category: "transversal",
    dependencies: ["core","permission","document","event_bus","supplier_engine","vehicle_engine","payout_engine"],
    description:
      "LOT 6 du Plan Maître Fournisseurs (§33-35) : Supplier Document Engine (conventions/annexes/RGPD), Vehicle Document Engine (contrôle technique/COC/garantie/export/douane) et Document Custody Engine (original/copie, détenteur, remise tracée, blocage d'étape par document manquant). Consomme le Document OS existant comme registre unique — n'en recrée aucun.",
    state: "staging",
  },
  {
    name: "search",
    label: "Search Engine",
    category: "transversal",
    dependencies: ["core","permission","avis_reputation","identity"],
    description: "Recherche universelle unifiée (Search OS).",
    state: "active",
  },
  {
    name: "workflow",
    label: "Workflow Engine",
    category: "transversal",
    dependencies: ["core","identity","notification","permission","scheduler","audit"],
    description: "Automatisation des processus métier — à créer (Phase 2).",
    state: "disabled",
  },
  {
    name: "knowledge",
    label: "Knowledge Engine",
    category: "transversal",
    dependencies: ["core", "smart", "seo", "country"],
    description: "Mémoire centrale (base auto, pièces, pannes, marché).",
    state: "active",
  },
  {
    name: "monitoring",
    label: "Monitoring Engine",
    category: "transversal",
    dependencies: ["core","smart","notification","event_bus","identity","scheduler","visibility"],
    description: "Surveillance santé/performances consolidée (Monitoring OS).",
    state: "active",
  },
  {
    name: "analytics",
    label: "Analytics Engine",
    category: "transversal",
    dependencies: ["core", "seo", "smart", "redirection", "monitoring", "achat"],
    description: "Analyse d'usage et comportement (recherches, activité, parcours).",
    state: "active",
  },
  // ── Univers ──
  {
    name: "vo",
    label: "VO Engine",
    category: "univers",
    dependencies: ["core", "permission", "notification"],
    description: "Cycle complet du véhicule d'occasion (16 étapes).",
    state: "active",
  },
  {
    name: "vo_engine",
    label: "VO Engine — estimation & reprise",
    category: "univers",
    dependencies: ["core","country","achat","intelligences"],
    description:
      "Amont client du VO : estimation en fourchette sur le marché local, demande de reprise et dossier VO de confiance.",
    state: "active",
  },
  {
    name: "vo_espaces",
    label: "VO Espaces — cloisonnement officiel / pro / particulier",
    category: "univers",
    dependencies: ["core","payment","document","identity","pro_portal","country"],
    description:
      "Décide côté serveur quel espace VO est ouvert (officiel réservé à l'équipe, professionnel sur abonnement VO actif, particulier fermé) et limite chaque stock à son propriétaire.",
    state: "staging",
  },
  {
    name: "proximity_engine",
    label: "Proximity Engine",
    category: "transversal",
    dependencies: ["core","country","avis_reputation","notification","payment"],
    description:
      "Recherche locale « près de moi » par service et matrice de complétude des univers en mini-plateformes.",
    state: "active",
  },
  {
    name: "partner_engine",
    label: "Partner Engine",
    category: "transversal",
    dependencies: ["core","country","notification","visibility","pro_portal","smart"],
    description:
      "Réseau partenaires (pays, métier, zone, contrat, leads, performance) et acquisition des professionnels là où la demande dépasse l'offre.",
    state: "active",
  },
  {
    name: "supplier_engine",
    label: "Supplier Engine",
    category: "transversal",
    dependencies: ["core", "country", "partner_engine", "identity"],
    description:
      "LOT 1 du Plan Maître Fournisseurs : registre fournisseur (au-dessus d'un partenaire déjà existant), onboarding avec validation Direction obligatoire, Connector Engine et Universal Mapping Engine. LOT 7 (suite) : RBAC Fournisseur/Transporteur (supplier_carrier_accounts) — rôles isolés, jamais dans ADMIN_ROLES/DIRECTION_ROLES/PRO_ROLES, aucun compte réel ouvert sans octroi PDG explicite. Staging tant qu'aucun fournisseur réel n'a été activé de bout en bout.",
    state: "staging",
  },
  {
    name: "vehicle_engine",
    label: "Vehicle Engine",
    category: "transversal",
    dependencies: ["core", "country", "supplier_engine", "event_bus"],
    description:
      "LOT 2 du Plan Maître Fournisseurs (véhicules uniquement) : ingestion d'un véhicule fournisseur déjà actif (Supplier Engine), mapping/normalisation, détection de doublons, analyse VIN/qualité, tarification, territoires (Country OS + Country Policy Engine), disponibilité, publication vers la marketplace existante (`annonces`), synchronisation continue. Staging tant qu'aucun véhicule fournisseur réel n'a été publié de bout en bout.",
    state: "staging",
  },
  {
    name: "parts_engine",
    label: "Parts Engine",
    category: "transversal",
    dependencies: ["core", "country", "supplier_engine", "event_bus", "pieces"],
    description:
      "LOT 3 du Plan Maître Fournisseurs (pièces automobiles uniquement) : ingestion d'une pièce fournisseur déjà active (Supplier Engine), mapping/normalisation, identité canonique multi-fournisseurs, OEM/Cross-Reference Engine, Parts Compatibility Engine, tarification, stock (ledger + réservations temporaires), territoires (Country OS + Country Policy Engine), contrôle qualité, publication vers la marketplace pièces existante (`parts_catalog`/`parts_stock`/`parts_compatibility`), synchronisation continue. Staging tant qu'aucune pièce fournisseur réelle n'a été publiée de bout en bout.",
    state: "staging",
  },
  {
    name: "logistics_engine",
    label: "Logistics Engine",
    category: "transversal",
    dependencies: ["core", "country", "supplier_engine", "event_bus", "livraison_vehicule"],
    description:
      "LOT 4 du Plan Maître Fournisseurs (transport/livraison) : Delivery/Logistics API Gateway, Carrier Connector Engine (catalogue de transporteurs, honnêtement NOT_CONNECTED sans clé réelle), Delivery Quote Engine (délègue au Vehicle Delivery Engine pour les véhicules, sinon NOT_CONNECTED), Delivery Routing Engine, Multi-Leg Engine (MASTER SHIPMENT + LEG 1-4), Tracking Engine (statuts normalisés, webhooks), API MKA.P-MS pour transporteurs (`/api/logistics/*`, clé API dédiée). Staging tant qu'aucun transporteur réel n'est connecté.",
    state: "staging",
  },
  {
    name: "garage",
    label: "Garage Engine",
    category: "univers",
    dependencies: ["core","identity","notification","scheduler","achat","atelier","avis_reputation","boutons","depannage","support","visibility","country"],
    description: "Fiches garage, devis, réservations, interventions.",
    state: "active",
  },
  {
    name: "pieces",
    label: "Pièces Auto Engine",
    category: "univers",
    dependencies: ["core","identity","payment","notification","product_engine","avis_reputation","event_bus","payment_orchestrator"],
    description: "Boutiques, stocks, références, commandes.",
    state: "active",
  },
  {
    name: "depannage",
    label: "Dépannage Engine",
    category: "univers",
    dependencies: ["core","identity","notification","payment","avis_reputation"],
    description: "Demandes d'intervention, affectation, suivi.",
    state: "active",
  },
  {
    name: "livraison",
    label: "Livraison Engine",
    category: "univers",
    dependencies: ["core","identity","notification","payment","avis_reputation","boutons"],
    description: "Livraison véhicules/pièces, transport, suivi.",
    state: "active",
  },
  {
    name: "transport",
    label: "VTC & Taxi Engine",
    category: "univers",
    dependencies: ["core", "identity", "notification", "payment", "scheduler"],
    description: "Véhicules, chauffeurs, planning, missions.",
    state: "active",
  },
  {
    name: "comptabilite",
    label: "Comptabilité Engine",
    category: "univers",
    dependencies: ["core","identity","payment","redirection","investment"],
    description: "Factures, paiements, TVA, rapports. La vue PDG/comptabilité des contrats d'investissement (/comptabilite/investissement) lit directement l'Investment Engine, jamais une seconde source de vérité.",
    state: "active",
  },
  {
    name: "importafrica",
    label: "Import Afrique Engine",
    category: "univers",
    dependencies: ["core", "identity", "country", "payment", "document"],
    description: "Véhicules, pays, transport, douane, suivi.",
    state: "active",
  },
  {
    name: "marketing",
    label: "Publicité Engine",
    category: "univers",
    dependencies: ["core", "identity", "seo", "smart", "notification"],
    description: "Emplacements, campagnes, budgets, ciblage.",
    state: "active",
  },
  {
    name: "cartegrise",
    label: "Carte Grise Engine",
    category: "univers",
    dependencies: ["core", "identity", "document", "notification", "payment", "audit"],
    description: "Démarches SIV, documents, statuts, suivi.",
    state: "active",
  },
  // ── Univers principaux (marketplace) ──
  {
    name: "achat",
    label: "Univers Achat Engine",
    category: "univers",
    dependencies: ["core","permission","search","audit","avis_reputation","country","event_bus","livraison_vehicule","messaging","notification","payment","risque_import","smart","visibility","estimation","redirection","seo","identity","garage","analytics"],
    description: "Univers Achat : parcours acheteur, filtres, favoris, mise en relation.",
    state: "active",
  },
  {
    name: "vente",
    label: "Univers Vente Engine",
    category: "univers",
    dependencies: ["core","permission","achat","notification","payment","smart","vo_espaces","country","boutons","livraison_vehicule"],
    description: "Univers Vente : dépôt d'annonce, gestion, mise en avant, transactions.",
    state: "active",
  },
  {
    name: "location",
    label: "Univers Location Engine",
    category: "univers",
    dependencies: ["core","permission","achat","seo","country","redirection"],
    description: "Univers Location : voitures, utilitaires, camions, LOA, réservations.",
    state: "active",
  },
  // ── Sous-sections univers Achat (Officiel / Pro / Particulier) ──
  {
    name: "achat_officiel",
    label: "Achat Officiel Engine",
    category: "sous_section",
    dependencies: ["core","achat","avis_reputation","messaging","country","estimation","risque_import"],
    description: "Sous-section Achat Officiel MKA.P-MS (stock officiel).",
    state: "staging",
  },
  {
    name: "achat_pro",
    label: "Achat Professionnel Engine",
    category: "sous_section",
    dependencies: ["core","achat","avis_reputation","messaging","country","estimation","risque_import"],
    description: "Sous-section Achat Professionnel (vendeurs pros).",
    state: "staging",
  },
  {
    name: "achat_particulier",
    label: "Achat Particulier Engine",
    category: "sous_section",
    dependencies: ["core","achat","avis_reputation","messaging","country","estimation","risque_import"],
    description: "Sous-section Achat Particulier — isolable (location/vente à un opérateur).",
    state: "staging",
  },
  // ── Sous-sections univers Vente (Officiel / Pro / Particulier) ──
  {
    name: "vente_officiel",
    label: "Vente Officielle Engine",
    category: "sous_section",
    dependencies: ["core", "vente", "notification"],
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
    dependencies: ["core","vente","achat","smart"],
    description: "Sous-section Vente Particulier — isolable.",
    state: "staging",
  },
  // ── Sous-sections univers Location (Pro / Particulier) ──
  {
    name: "location_pro",
    label: "Location Professionnelle Engine",
    category: "sous_section",
    dependencies: ["core","location","achat","country"],
    description: "Sous-section Location Professionnelle.",
    state: "staging",
  },
  {
    name: "location_particulier",
    label: "Location Particulier Engine",
    category: "sous_section",
    dependencies: ["core","location","achat","country"],
    description: "Sous-section Location Particulier.",
    state: "staging",
  },
  // ── Services dédiés ──
  {
    name: "controle_technique",
    label: "Contrôle Technique Engine",
    category: "service",
    dependencies: ["core", "identity", "scheduler", "notification", "payment", "achat"],
    description:
      "Aucun registre officiel de contrôle technique accessible aujourd'hui : le statut CT n'est jamais affiché comme connu. Prise de RDV réelle (devisRouter) et historique des demandes réellement envoyées ; centres agréés, résultats officiels et rappels d'échéance restent à construire (Phase 2, dépend d'un accès externe).",
    state: "staging",
  },
  {
    name: "assurance",
    label: "Assurance Engine",
    category: "service",
    dependencies: ["core", "identity", "notification"],
    description: "Devis assurance, contrats, sinistres, partenaires.",
    state: "active",
  },
  {
    name: "energie_recharge",
    label: "Energy Engine — Recharge",
    category: "service",
    dependencies: ["core","country","notification"],
    description:
      "Annuaire des bornes de recharge : recherche filtrée, déclarations validées par un humain.",
    state: "active",
  },
  {
    name: "avis_reputation",
    label: "Reviews & Reputation Engine",
    category: "service",
    dependencies: ["core","notification","connecteur_google_business","depannage","livraison","pieces","smart","workflow","identity"],
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
    dependencies: ["core", "country"],
    description:
      "Contrôle réglementaire par pays avant exécution : règles confirmées, validité, autorité. Sans règle confirmée, l'action repart en validation humaine.",
    state: "active",
  },
  {
    // Ce moteur ne produit rien : il empêche l'autonomie de devenir dangereuse.
    name: "resilience",
    label: "Resilience & Safety Engine",
    category: "transversal",
    dependencies: ["core","smart","country","identity","redirection"],
    description:
      "Fermeture au public sans destruction, actions critiques à confirmation renforcée, pipeline obligatoire avant production, auto-réparation vérifiée, mémoire des échecs.",
    state: "active",
  },
  {
    // Il ne décide rien : il traduit une demande humaine en action déjà tracée.
    name: "command_center",
    label: "Command & Development Center",
    category: "transversal",
    dependencies: ["core","smart","country","resilience","code_graph","identity","smart_audit","intelligences"],
    description:
      "Commandes écrites et vocales transformées en actions structurées et journalisées, dossiers de l'agent développeur passant obligatoirement par le pipeline avant production.",
    state: "active",
  },
  {
    name: "rd_lab",
    label: "Automotive R&D Lab",
    category: "transversal",
    dependencies: ["core","smart","connaissance_auto","country","energie_recharge"],
    description:
      "Laboratoire R&D séparé des services vendus : projets industriels, chaîne besoin → tests, navigation et calculateurs, avec droits d'usage établis avant tout versement à la mémoire partagée.",
    state: "active",
  },
  {
    name: "ai_fabric",
    label: "Fabrique Intelligence",
    category: "transversal",
    dependencies: ["core","smart","monitoring","backup","connaissance_auto","resilience","intelligences"],
    description:
      "Couche entre MKA.P-MS et les fournisseurs externes : routage par capacité, confidentialité et coût, suivi des dépenses, sauvegarde de la mémoire intelligente et supervision de tous les moteurs.",
    state: "active",
  },
  {
    name: "event_bus",
    label: "Bus d'événements central",
    category: "core",
    dependencies: ["core","smart","audit","intelligences","product_engine","seo"],
    description:
      "Achemine réellement les événements entre moteurs : abonnés résolus, traitement exécuté, remise enregistrée avec sa durée et son erreur. Un événement que personne n'écoute est affiché comme orphelin au lieu de rester en attente pour toujours.",
    state: "active",
  },
  {
    name: "continuous_test",
    label: "Contrôle continu de la plateforme",
    category: "transversal",
    dependencies: ["core","smart","event_bus","activation_audit","auto_branchement","code_graph","completion_center","intelligences","payment","boutons","redirection","estimation","media_authenticity","connecteur_google_business"],
    description:
      "Exécute réellement des contrôles sur la plateforme en service et dépose la preuve datée qui autorise un domaine à passer au vert. Un contrôle non exécutable est marqué ignoré, jamais réussi, et un contrôle qui passait puis échoue est signalé comme régression.",
    state: "active",
  },
  {
    name: "code_graph",
    label: "Mémoire technique du code (Code Knowledge Graph)",
    category: "transversal",
    dependencies: ["core", "smart", "continuous_test"],
    description:
      "Relit le code réel et relie service → moteur → fichiers → API → tables → événements → permissions → tests → dépendances. Il observe les changements d'un relevé à l'autre et mémorise les corrections des autres agents par classe d'anomalie. Un relevé non généré est signalé, jamais remplacé par une supposition.",
    state: "active",
  },
  {
    name: "completion_center",
    label: "Completion Center (ce qui reste à faire)",
    category: "transversal",
    dependencies: ["core","smart","continuous_test","activation_audit","resilience"],
    description:
      "Applique la règle TERMINÉ (construit + connecté + activé + testé + observable + inscrit au registre + rapporté au Système Intelligent + non-régression vérifiée + preuve de résultat) domaine par domaine, et publie la liste exacte des tâches restantes. Un pourcentage est une part de maillons prouvés, jamais une estimation.",
    state: "active",
  },
  {
    name: "intelligences",
    label: "MKA.P-MS AI",
    category: "transversal",
    dependencies: ["core","smart","ai_fabric","command_center","code_graph","completion_center","connaissance_auto","continuous_test","document","event_bus","identity","monitoring","resilience","support"],
    description:
      "Seule couche qui appelle réellement un fournisseur de modèle. Deux côtés séparés côté serveur : direction (PDG seul — contexte interne, commandes, écriture de code proposée) et public (assistant automobile encadré, sans accès interne). Chaque échange conserve fournisseur, modèle, jetons, durée et motif d'échec ; un appel impossible affiche sa cause au lieu d'une réponse fabriquée.",
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
    dependencies: ["core","smart","event_bus"],
    description:
      "Projette les pièces et produits réellement vendus vers les canaux Google (données structurées Product, flux Merchant Center lorsque éligible) et garde les véhicules hors du catalogue produit, où ils ne seraient que refusés.",
    state: "active",
  },
  {
    name: "indexation",
    label: "Moniteur d'indexation",
    category: "transversal",
    dependencies: ["core","smart","audit"],
    description:
      "Contrôle URL par URL ce que le serveur répond réellement (statut, robots, canonical, sitemap, contenu, données structurées) et refuse de confondre une soumission avec une indexation Google.",
    state: "active",
  },
  {
    name: "activation_audit",
    label: "Audit d'activation",
    category: "transversal",
    dependencies: ["core","smart","redirection"],
    description:
      "Vérifie domaine par domaine ce qui est réellement connecté, activé, accessible, utilisé et prouvé par un test — le code existant ne suffit jamais à déclarer une fonction terminée.",
    state: "active",
  },
  {
    name: "finance",
    label: "Financement Engine",
    category: "service",
    dependencies: ["core", "identity", "payment", "document", "accounting_internal", "politique_pays"],
    description:
      "LOA : éligibilité pays réelle avant tout contrat (Country Policy Engine, domaine réglementé « credit ») — aucun taux ni mensualité inventés, une simulation n'est créée que si une règle pays confirmée autorise le crédit. Paiement fractionné : moteur distinct et déjà réel (routers/installments.ts, payment), jamais dupliqué ici. Centres agréés, résultats officiels et dossier complet restent Phase 2.",
    state: "staging",
  },
  {
    // Fusionné avec l'ancien "encheres" (LOT 7 : la vitrine /acheter/encheres
    // n'appelait aucune procédure et affichait un catalogue fabriqué — un
    // seul et même backend, jamais deux moteurs pour un seul domaine).
    name: "auction_engine",
    label: "Auction Engine",
    category: "service",
    dependencies: ["core", "payment", "notification", "visibility", "country"],
    description:
      "Moteur d'enchères particuliers et professionnels : lots (catalogue et enchères en direct), offres validées côté serveur, prix de réserve, anti-sniping, adjudication, historique et notifications.",
    state: "active",
  },
  // ── Moteurs OS reliés par le pont MOS (os-bridge.ts) ──────────────────
  // Ils étaient auto-enregistrés au démarrage sans figurer ici : le catalogue
  // ne connaissait donc ni leur périmètre ni leurs dépendances, et `audit` /
  // `scheduler` étaient des dépendances vers des moteurs inexistants.
  {
    name: "messaging",
    label: "Messagerie OS",
    category: "transversal",
    dependencies: ["core","identity","notification","audit"],
    description: "Messagerie interne : conversations, modération, sécurité et supervision.",
    state: "active",
  },
  {
    name: "support",
    label: "Support OS",
    category: "transversal",
    dependencies: ["core","identity","notification","audit","payment","smart"],
    description: "Tickets, priorités, file et suivi centralisés ; litiges.",
    state: "active",
  },
  {
    name: "contract",
    label: "Contrat OS",
    category: "transversal",
    dependencies: ["core","document","scheduler","identity"],
    description: "Cycle de vie des contrats : brouillon, signature, échéances, résiliation.",
    state: "active",
  },
  {
    name: "investment",
    label: "Investment Engine",
    category: "univers",
    dependencies: ["core","country","contract","audit","identity","intelligences","partner_engine","pro_portal"],
    description: "Droit économique temporaire univers+pays+durée : Contract Engine, Ownership Router, Revenue Engine, Ledger — distinct du tableau de bord croissance interne (investorRouter). La candidature publique « Devenir investisseur » réutilise le Partner Engine (candidater) et le catalogue pays du Pro Portal, jamais un second moteur de candidature.",
    state: "staging",
  },
  {
    name: "journey",
    label: "Customer Journey OS",
    category: "transversal",
    dependencies: ["core","smart","identity"],
    description: "Entonnoir de parcours client : étapes, abandons, conversions.",
    state: "active",
  },
  {
    name: "scheduler",
    label: "Scheduler OS",
    category: "transversal",
    dependencies: ["core","notification","identity"],
    description: "Tâches planifiées et automatisations avec journal d'exécution.",
    state: "active",
  },
  {
    name: "media",
    label: "Media OS",
    category: "transversal",
    dependencies: ["core","identity","smart"],
    description: "Optimisation, miniatures et dédoublonnage des médias.",
    state: "active",
  },
  {
    name: "audit",
    label: "Audit OS",
    category: "transversal",
    dependencies: ["core", "identity"],
    description: "Journal d'audit centralisé, requêtes et statistiques.",
    state: "active",
  },
  {
    name: "backup",
    label: "Backup & Recovery OS",
    category: "transversal",
    dependencies: ["core","identity"],
    description: "Sauvegardes et restauration contrôlée.",
    state: "active",
  },
  {
    name: "ai_learning",
    label: "Apprentissage Intelligence",
    category: "transversal",
    dependencies: ["core","smart","identity"],
    description: "Supervision de l'apprentissage des Intelligences.",
    state: "active",
  },
  {
    name: "risque_import",
    label: "Import Risk Engine",
    category: "transversal",
    dependencies: ["politique_pays","core","smart","country","energie_recharge","event_bus"],
    description: "Diagnostic d'importation et d'homologation avant achat ou livraison.",
    state: "active",
  },
  {
    name: "livraison_vehicule",
    label: "Vehicle Delivery Engine",
    category: "univers",
    dependencies: ["core","smart","politique_pays","country","event_bus","boutons"],
    description: "Acheminement des véhicules : barèmes gouvernés, étapes, qualité de prix.",
    state: "active",
  },
  {
    name: "estimation",
    label: "Estimation Hub",
    category: "transversal",
    dependencies: ["core","smart","livraison_vehicule","risque_import","event_bus","pieces","vo_engine"],
    description: "Coût total d'acquisition assemblé à partir des moteurs existants.",
    state: "active",
  },
];
