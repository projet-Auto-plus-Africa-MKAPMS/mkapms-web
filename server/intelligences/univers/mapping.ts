/**
 * MKA.P-MS Intelligences — Universe Registry, déclaration manuelle.
 *
 * Seul fichier à main de ce registre : pour chaque univers (regroupement
 * métier), sa définition (rôle, application, sensibilité) ; pour chaque
 * moteur du Engine Registry (server/engine-registry/catalog.ts, 89 moteurs),
 * l'univers auquel il appartient. Tout le reste (routes, procédures,
 * tables, dépendances) est CALCULÉ par registre.ts à partir de
 * server/data/moteurs.ts (généré) — jamais retapé ici.
 *
 * Une bonne partie des moteurs (37/89) sont de l'infrastructure transversale
 * pure (bus d'événements, audit, sauvegardes, SEO, surveillance…) : aucun
 * humain ne « travaille dans » ces moteurs au sens conversationnel. Ils sont
 * volontairement regroupés dans un seul univers `plateforme_infrastructure`,
 * marqué non conversationnel — les lister un par un comme 37 « univers »
 * séparés n'aiderait personne, et cacher leur existence serait pire :
 * chacun y reste nommé, réservé à la direction.
 *
 * Ce fichier est extensible : un nouveau moteur du catalogue doit recevoir
 * une ligne ici (registre.ts échoue explicitement sinon, plutôt que
 * d'ignorer silencieusement un moteur sans univers).
 */

export type Application = "grandpublic" | "pro" | "command" | "intelligence" | "investor";
export type Sensibilite = "publique" | "personnelle" | "confidentielle";

export interface UniversSpec {
  universeId: string;
  nom: string;
  description: string;
  /** Applications (mobile/variants.json) où cet univers est réellement accessible. */
  applications: Application[];
  /** Rôles de session (userRoleEnum) admis par défaut — le Policy Engine reste seul décideur réel à l'exécution. */
  rolesAutorises: string[];
  sensibilite: Sensibilite;
  /** Faux pour l'infrastructure technique : jamais présenté comme un univers pilotable par conversation. */
  conversationnel: boolean;
  /** Note honnête sur l'état des règles pays/abonnement quand ce n'est pas encore qualifié univers par univers. */
  noteReglesPays: string;
  noteReglesAbonnement: string;
}

export const UNIVERS_DEFINIS: UniversSpec[] = [
  {
    universeId: "identite_comptes",
    nom: "Identité & comptes",
    description: "Comptes, sessions, routage par profil, dossier professionnel légal, portail pro.",
    applications: ["grandpublic", "pro", "command"],
    rolesAutorises: ["user", "pro", "garage", "society", "employee", "admin", "super_admin"],
    sensibilite: "personnelle",
    conversationnel: true,
    noteReglesPays: "Portée par le Country Engine (server/country-os/) — aucune règle par univers qualifiée séparément dans ce lot.",
    noteReglesAbonnement: "Non qualifiées séparément dans ce lot — voir server/routers/pro-account, abonnements par métier.",
  },
  {
    universeId: "marketplace_particulier",
    nom: "Marketplace — particulier",
    description: "Achat, vente, location entre particuliers ; estimation VO côté client. La catégorie de facturation réelle « location » (server/schema.ts::universEnum) désigne la location professionnelle, pas cet univers particulier — pas de recoupement direct.",
    applications: ["grandpublic"],
    rolesAutorises: ["user"],
    sensibilite: "publique",
    conversationnel: true,
    noteReglesPays: "Country Engine générique — aucune règle spécifique qualifiée dans ce lot.",
    noteReglesAbonnement: "Aucun abonnement requis côté particulier à ce jour.",
  },
  {
    universeId: "marketplace_professionnel",
    nom: "Marketplace — professionnel",
    description: "Achat/vente/location côté vendeurs pros, stock officiel MKA.P-MS, espaces VO internes. Recoupe partiellement la catégorie de facturation réelle « vente_pro » (server/schema.ts::universEnum), sans y être identique (ce univers couvre aussi l'achat, la location et le VO).",
    applications: ["grandpublic", "pro"],
    rolesAutorises: ["pro", "garage", "society", "employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "Country Engine générique — aucune règle spécifique qualifiée dans ce lot.",
    noteReglesAbonnement: "Dossier professionnel (pro_account) conditionne l'activation — non qualifié univers par univers dans ce lot.",
  },
  {
    universeId: "vtc_taxi",
    nom: "VTC & Taxi",
    description:
      "Programme VTC/Taxi (client/src/pages/VtcTaxi.tsx, ProduitVtcTaxi.tsx, ProgrammeVTC.tsx) — ANOMALIE réelle trouvée par cet audit : « vtc_taxi » existe comme valeur de facturation reconnue (server/schema.ts::universEnum, tables subscriptions et finance_transactions) mais AUCUN moteur ne lui est déclaré au Engine Registry (server/engine-registry/catalog.ts) : ses écrans n'ont donc aucun périmètre serveur propre. Marqué BUSINESS_ENGINE_MISSING plutôt que rattaché de force à un autre univers.",
    applications: ["grandpublic", "pro"],
    rolesAutorises: ["user", "pro"],
    sensibilite: "personnelle",
    conversationnel: true,
    noteReglesPays: "Réglementation VTC/Taxi très variable par pays — sans objet tant qu'aucun moteur ne porte ce périmètre.",
    noteReglesAbonnement: "« vtc_taxi » existe déjà comme catégorie de facturation réelle (universEnum) — sans moteur applicatif pour l'appliquer.",
  },
  {
    universeId: "garage_atelier",
    nom: "Garage & atelier",
    description: "Fiches garage, devis, réservations, interventions, dépannage, contrôle technique. Correspond à la catégorie de facturation réelle « garage » (server/schema.ts::universEnum).",
    applications: ["pro"],
    rolesAutorises: ["pro", "garage", "employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "Contrôle technique variable par pays — non qualifié dans ce lot (moteur controle_technique déclaré « à construire »).",
    noteReglesAbonnement: "Non qualifiées séparément dans ce lot.",
  },
  {
    universeId: "pieces_stock",
    nom: "Pièces & stock",
    description: "Boutiques, stocks, références, commandes de pièces. Correspond à la catégorie de facturation réelle « pieces » (server/schema.ts::universEnum).",
    applications: ["pro"],
    rolesAutorises: ["pro", "garage", "employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "Country Engine générique — aucune règle spécifique qualifiée dans ce lot.",
    noteReglesAbonnement: "Non qualifiées séparément dans ce lot.",
  },
  {
    universeId: "transport_livraison",
    nom: "Transport & livraison",
    description: "Livraison véhicules/pièces, transport (chauffeurs, planning), import Afrique, diagnostic import/homologation. Recoupe la catégorie de facturation réelle « livraison » (server/schema.ts::universEnum) ; « transport » n'a pas d'équivalent dans cet enum.",
    applications: ["pro", "grandpublic"],
    rolesAutorises: ["pro", "employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "Douane et homologation par pays — barèmes gouvernés mais non recensés univers par univers dans ce lot.",
    noteReglesAbonnement: "Non qualifiées séparément dans ce lot.",
  },
  {
    universeId: "cartegrise_documents",
    nom: "Carte grise & documents",
    description: "Démarches SIV, registre documentaire unifié (factures, contrats, devis), cycle de vie des contrats.",
    applications: ["grandpublic"],
    rolesAutorises: ["user", "pro", "employee", "admin", "super_admin"],
    sensibilite: "personnelle",
    conversationnel: true,
    noteReglesPays: "Démarches administratives fortement dépendantes du pays — non qualifiées univers par univers dans ce lot.",
    noteReglesAbonnement: "Sans objet.",
  },
  {
    universeId: "paiements_finance",
    nom: "Paiements & finance",
    description: "Paiement propriétaire, orchestration multi-prestataires, surveillance financière, financement/LOA.",
    applications: ["grandpublic", "command"],
    rolesAutorises: ["pro", "employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "Réglementation des paiements par pays — portée par payment_orchestrator, non qualifiée finement dans ce lot.",
    noteReglesAbonnement: "Sans objet direct.",
  },
  {
    universeId: "comptabilite",
    nom: "Comptabilité",
    description: "Factures, paiements, TVA, rapports, rapprochement interne, annuaire de comptables indépendants.",
    applications: ["command"],
    rolesAutorises: ["employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "TVA et obligations comptables très variables par pays — non qualifiées univers par univers dans ce lot.",
    noteReglesAbonnement: "Sans objet direct.",
  },
  {
    universeId: "marketing_visibilite",
    nom: "Marketing & visibilité",
    description: "Campagnes, emplacements publicitaires, avis/réputation, rattachement Google Business.",
    applications: ["pro", "command"],
    rolesAutorises: ["pro", "employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "Country Engine générique — aucune règle spécifique qualifiée dans ce lot.",
    noteReglesAbonnement: "Budgets/campagnes par contrat — non qualifiées dans ce lot.",
  },
  {
    universeId: "assurance_energie",
    nom: "Assurance & énergie",
    description: "Devis assurance, contrats, sinistres, annuaire des bornes de recharge.",
    applications: ["grandpublic"],
    rolesAutorises: ["user", "pro", "employee", "admin", "super_admin"],
    sensibilite: "personnelle",
    conversationnel: true,
    noteReglesPays: "Assurance très réglementée par pays — non qualifiée univers par univers dans ce lot.",
    noteReglesAbonnement: "Sans objet direct.",
  },
  {
    universeId: "encheres",
    nom: "Enchères",
    description: "Ventes aux enchères particuliers et professionnels : lots, offres, adjudication.",
    applications: ["grandpublic"],
    rolesAutorises: ["user", "pro", "employee", "admin", "super_admin"],
    sensibilite: "publique",
    conversationnel: true,
    noteReglesPays: "Country Engine générique — aucune règle spécifique qualifiée dans ce lot.",
    noteReglesAbonnement: "Sans objet direct.",
  },
  {
    universeId: "support_messagerie",
    nom: "Support & messagerie",
    description: "Tickets, litiges, messagerie interne, priorités et suivi.",
    applications: ["grandpublic", "pro", "command"],
    rolesAutorises: ["user", "pro", "garage", "society", "employee", "admin", "super_admin"],
    sensibilite: "personnelle",
    conversationnel: true,
    noteReglesPays: "Sans objet direct.",
    noteReglesAbonnement: "Sans objet direct.",
  },
  {
    universeId: "partenaires_fournisseurs",
    nom: "Partenaires & fournisseurs",
    description: "Réseau partenaires (pays, métier, zone, contrat, leads), recherche de proximité.",
    applications: ["pro", "command"],
    rolesAutorises: ["pro", "employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "Contrats de partenariat variables par pays — non qualifiés dans ce lot.",
    noteReglesAbonnement: "Non qualifiées séparément dans ce lot.",
  },
  {
    universeId: "investisseur",
    nom: "Investisseur",
    description: "Droit économique temporaire univers + pays + durée (server/investment/) — jamais une propriété MKA.P-MS.",
    applications: ["investor"],
    rolesAutorises: ["super_admin"],
    sensibilite: "confidentielle",
    conversationnel: false,
    noteReglesPays: "Contrat investisseur borné à un pays et une durée par construction (server/investment/) — déjà qualifié à la source.",
    noteReglesAbonnement: "Sans objet (droit contractuel, pas un abonnement).",
  },
  {
    universeId: "intelligence_produit",
    nom: "MKA.P-MS Intelligence (produit)",
    description: "Le moteur Intelligence lui-même : conversation, assistant embarqué, Centre Intelligence direction, Chantier de développement.",
    applications: ["intelligence", "grandpublic", "command"],
    rolesAutorises: ["user", "pro", "garage", "society", "employee", "admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: true,
    noteReglesPays: "Confidentialité et fournisseur choisis par pays via ai-fabric — déjà qualifié à la source.",
    noteReglesAbonnement: "Plafonds journaliers par côté (server/intelligences/regles.ts) — pas un abonnement au sens commercial.",
  },
  {
    universeId: "plateforme_infrastructure",
    nom: "Infrastructure plateforme (non conversationnel)",
    description:
      "Moteurs transversaux techniques (bus d'événements, audit, sauvegardes, surveillance, SEO, recherche, permissions, pays/langue…) : aucun univers métier propre, réservés à la direction technique. Nommés un par un pour qu'aucun ne reste invisible, jamais regroupés pour les cacher.",
    applications: ["command"],
    rolesAutorises: ["admin", "super_admin"],
    sensibilite: "confidentielle",
    conversationnel: false,
    noteReglesPays: "Sans objet (infrastructure technique).",
    noteReglesAbonnement: "Sans objet (infrastructure technique).",
  },
];

/**
 * Un moteur → un univers, exactement comme PERIMETRES (server/engine-registry/
 * perimetres.ts) attribue un dossier/route à un seul moteur. Les 89 moteurs du
 * catalogue (server/engine-registry/catalog.ts) doivent tous apparaître ici —
 * registre.ts échoue explicitement si l'un d'eux manque.
 */
export const MOTEUR_VERS_UNIVERS: Record<string, string> = {
  // ── Identité & comptes ──
  identity: "identite_comptes",
  account_routing: "identite_comptes",
  pro_portal: "identite_comptes",
  pro_account: "identite_comptes",

  // ── Marketplace particulier ──
  achat: "marketplace_particulier",
  achat_particulier: "marketplace_particulier",
  vente: "marketplace_particulier",
  vente_particulier: "marketplace_particulier",
  location: "marketplace_particulier",
  location_particulier: "marketplace_particulier",
  vo_engine: "marketplace_particulier",
  estimation: "marketplace_particulier",

  // ── Marketplace professionnel ──
  achat_pro: "marketplace_professionnel",
  achat_officiel: "marketplace_professionnel",
  vente_pro: "marketplace_professionnel",
  vente_officiel: "marketplace_professionnel",
  location_pro: "marketplace_professionnel",
  vo: "marketplace_professionnel",
  vo_espaces: "marketplace_professionnel",

  // ── Garage & atelier ──
  garage: "garage_atelier",
  atelier: "garage_atelier",
  depannage: "garage_atelier",
  controle_technique: "garage_atelier",

  // ── Pièces & stock ──
  pieces: "pieces_stock",

  // ── Transport & livraison ──
  transport: "transport_livraison",
  livraison: "transport_livraison",
  livraison_vehicule: "transport_livraison",
  importafrica: "transport_livraison",
  risque_import: "transport_livraison",

  // ── Carte grise & documents ──
  cartegrise: "cartegrise_documents",
  document: "cartegrise_documents",
  contract: "cartegrise_documents",

  // ── Paiements & finance ──
  payment: "paiements_finance",
  payment_orchestrator: "paiements_finance",
  financial_intelligence: "paiements_finance",
  finance: "paiements_finance",

  // ── Comptabilité ──
  comptabilite: "comptabilite",
  accounting_internal: "comptabilite",
  accounting_marketplace: "comptabilite",

  // ── Marketing & visibilité ──
  marketing: "marketing_visibilite",
  connecteur_google_business: "marketing_visibilite",
  avis_reputation: "marketing_visibilite",

  // ── Assurance & énergie ──
  assurance: "assurance_energie",
  energie_recharge: "assurance_energie",

  // ── Enchères ──
  encheres: "encheres",
  auction_engine: "encheres",

  // ── Support & messagerie ──
  support: "support_messagerie",
  messaging: "support_messagerie",

  // ── Partenaires & fournisseurs ──
  partner_engine: "partenaires_fournisseurs",
  proximity_engine: "partenaires_fournisseurs",

  // ── Investisseur ──
  investment: "investisseur",

  // ── Intelligence (produit) ──
  intelligences: "intelligence_produit",

  // ── Infrastructure plateforme (non conversationnel) ──
  core: "plateforme_infrastructure",
  country: "plateforme_infrastructure",
  language: "plateforme_infrastructure",
  notification: "plateforme_infrastructure",
  media_authenticity: "plateforme_infrastructure",
  smart: "plateforme_infrastructure",
  permission: "plateforme_infrastructure",
  redirection: "plateforme_infrastructure",
  boutons: "plateforme_infrastructure",
  auto_branchement: "plateforme_infrastructure",
  seo: "plateforme_infrastructure",
  visibility: "plateforme_infrastructure",
  search: "plateforme_infrastructure",
  workflow: "plateforme_infrastructure",
  knowledge: "plateforme_infrastructure",
  monitoring: "plateforme_infrastructure",
  analytics: "plateforme_infrastructure",
  connaissance_auto: "plateforme_infrastructure",
  politique_pays: "plateforme_infrastructure",
  resilience: "plateforme_infrastructure",
  command_center: "plateforme_infrastructure",
  rd_lab: "plateforme_infrastructure",
  ai_fabric: "plateforme_infrastructure",
  event_bus: "plateforme_infrastructure",
  continuous_test: "plateforme_infrastructure",
  code_graph: "plateforme_infrastructure",
  completion_center: "plateforme_infrastructure",
  smart_audit: "plateforme_infrastructure",
  product_engine: "plateforme_infrastructure",
  indexation: "plateforme_infrastructure",
  activation_audit: "plateforme_infrastructure",
  journey: "plateforme_infrastructure",
  scheduler: "plateforme_infrastructure",
  media: "plateforme_infrastructure",
  audit: "plateforme_infrastructure",
  backup: "plateforme_infrastructure",
  ai_learning: "plateforme_infrastructure",
};
